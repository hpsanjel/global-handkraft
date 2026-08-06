import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types/store";
import { prisma } from "@/lib/prisma";
import { getShippingRate } from "@/lib/shipping";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";
import { getBringOptionsForCheckout } from "@/lib/bring-shipping-integration";
import { STORE_PICKUP_ID, STORE_PICKUP_DISPLAY_NAME } from "@/lib/shipping-client";

export const runtime = "nodejs";

const DEFAULT_CURRENCY = "nok";
// Fixed EUR/NOK exchange rate used as a display reference on the Stripe
// checkout page. Stripe charges the exact amount in NOK; the EUR amount is
// shown as an informational equivalent.
const EUR_PER_NOK = 0.095;

function formatEurEquivalent(nokAmount: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 2,
	}).format(nokAmount * EUR_PER_NOK);
}

type SavedShippingAddress = {
	fullName?: string;
	phone?: string;
	address?: string;
	city?: string;
	postalCode?: string;
	country?: string;
};

type CheckoutItem = Pick<CartItem, "productId" | "variantId" | "addonIds" | "quantity">;

export type PricedCheckoutItem = {
	productId: string;
	variantId: string;
	quantity: number;
	addonIds: string[];
	name: string;
	unitAmountCents: number;
	lineSubtotal: number;
	/** Weight in kg as stored on the Variant (e.g. "10 kg") */
	weight: string;
	/** Width in cm as stored on the Variant (e.g. "40 cm") */
	width: string;
	/** Height in cm as stored on the Variant (e.g. "62 cm") */
	height: string;
	/** Depth in cm as stored on the Variant (e.g. "30 cm") */
	depth: string;
};

function normalizeCheckoutItems(items: CheckoutItem[]) {
	return items.map((item) => ({
		productId: String(item.productId ?? "").trim(),
		variantId: String(item.variantId ?? "").trim(),
		addonIds: Array.isArray(item.addonIds)
			? item.addonIds
					.map((id) => String(id).trim())
					.filter(Boolean)
					.sort()
			: [],
		quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
	}));
}

async function priceCheckoutItems(items: CheckoutItem[]): Promise<PricedCheckoutItem[]> {
	const normalizedItems = normalizeCheckoutItems(items);

	if (normalizedItems.some((item) => !item.productId || !item.variantId)) {
		throw new Error("One or more cart items are invalid.");
	}

	return Promise.all(
		normalizedItems.map(async (item) => {
			const variant = await prisma.variant.findFirst({
				where: {
					id: item.variantId,
					productId: item.productId,
					product: { active: true },
				},
				include: {
					product: true,
				},
			});

			if (!variant) {
				throw new Error("One or more cart items are no longer available.");
			}

			if (variant.stock < item.quantity) {
				throw new Error(`${variant.product.name} has only ${variant.stock} item${variant.stock === 1 ? "" : "s"} in stock.`);
			}

			const addons = item.addonIds.length
				? await prisma.addon.findMany({
						where: {
							id: { in: item.addonIds },
							productId: item.productId,
						},
					})
				: [];

			if (addons.length !== item.addonIds.length) {
				throw new Error("One or more selected add-ons are no longer available.");
			}

			const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
			const unitAmount = variant.price + addonTotal;
			const name = `${variant.product.name}${variant.name ? ` (${variant.name})` : ""}`;

			return {
				productId: item.productId,
				variantId: item.variantId,
				quantity: item.quantity,
				addonIds: item.addonIds,
				name,
				unitAmountCents: Math.round(unitAmount * 100),
				lineSubtotal: unitAmount * item.quantity,
				weight: variant.weight,
				width: variant.width,
				height: variant.height,
				depth: variant.depth,
			};
		}),
	);
}

async function findOrCreateCustomer(stripe: Stripe, email: string, shippingAddress?: SavedShippingAddress) {
	const existingCustomers = await stripe.customers.list({ email, limit: 1 });

	const address: Stripe.AddressParam | undefined = shippingAddress
		? {
				line1: shippingAddress.address,
				city: shippingAddress.city,
				postal_code: shippingAddress.postalCode,
				country: SHIPPING_COUNTRY_CODES.includes(shippingAddress.country || "") ? shippingAddress.country : undefined,
			}
		: undefined;

	const customerParams: Stripe.CustomerCreateParams = {
		email,
		name: shippingAddress?.fullName || undefined,
		phone: shippingAddress?.phone || undefined,
		address,
		shipping: address
			? {
					name: shippingAddress?.fullName || email,
					phone: shippingAddress?.phone || undefined,
					address,
				}
			: undefined,
	};

	if (existingCustomers.data[0]) {
		return stripe.customers.update(existingCustomers.data[0].id, customerParams);
	}

	return stripe.customers.create(customerParams);
}

/**
 * Builds Stripe shipping options from Bring shipping products.
 * When Bring API is available, creates multiple shipping options
 * based on real Bring rates. Falls back to static rates otherwise.
 */
async function buildShippingOptions(shippingAddress: SavedShippingAddress | undefined, pricedItems: PricedCheckoutItem[], subtotal: number, selectedShippingId?: string | null): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
	// Store pickup: skip Bring entirely, single free option.
	if (selectedShippingId === STORE_PICKUP_ID) {
		return [
			{
				shipping_rate_data: {
					type: "fixed_amount",
					fixed_amount: {
						amount: 0,
						currency: DEFAULT_CURRENCY,
					},
					display_name: STORE_PICKUP_DISPLAY_NAME,
					metadata: {
						bring_product_id: STORE_PICKUP_ID,
						bring_delivery_type: "PICKUP",
					},
				},
			},
		];
	}

	const bringConfigured = process.env.BRING_API_UID && process.env.BRING_API_KEY;

	// Try to use Bring API if credentials are available and we have postal code + country
	if (bringConfigured && shippingAddress?.postalCode && shippingAddress?.country) {
		try {
			const bringProducts = await getBringOptionsForCheckout(shippingAddress.postalCode, shippingAddress.country, pricedItems);

			if (bringProducts.length > 0) {
				// Re-fetched live from Bring (never trust client-supplied price). If the
				// customer had already picked a method in the cart drawer/page and it's
				// still on offer, move it to the front so Stripe's hosted Checkout page
				// (which defaults to the first shipping_options entry) shows it pre-selected.
				const matchIndex = selectedShippingId ? bringProducts.findIndex((product) => product.productId === selectedShippingId) : -1;
				const orderedProducts = matchIndex > 0 ? [bringProducts[matchIndex], ...bringProducts.slice(0, matchIndex), ...bringProducts.slice(matchIndex + 1)] : bringProducts;

				// Convert Bring products to Stripe shipping options
				return orderedProducts.map((product) => ({
					shipping_rate_data: {
						type: "fixed_amount" as const,
						fixed_amount: {
							amount: product.priceCents,
							currency: DEFAULT_CURRENCY,
						},
						display_name: product.displayName,
						delivery_estimate: product.maxDays
							? {
									minimum: { unit: "business_day" as const, value: 1 },
									maximum: { unit: "business_day" as const, value: product.maxDays },
								}
							: undefined,
						metadata: {
							bring_product_id: product.productId,
							bring_delivery_type: product.deliveryType,
						},
					},
				}));
			}
		} catch {
			// Fall through to static rate if Bring API fails
			console.warn("Bring API failed, falling back to static shipping rate.");
		}
	}

	// Fallback: static shipping rate from DB
	let shippingRateAmountCents = 0;
	try {
		shippingRateAmountCents = (await getShippingRate(shippingAddress?.country, subtotal)).amountCents;
	} catch {
		shippingRateAmountCents = 0;
	}

	return [
		{
			shipping_rate_data: {
				type: "fixed_amount",
				fixed_amount: {
					amount: shippingRateAmountCents,
					currency: DEFAULT_CURRENCY,
				},
				display_name: shippingRateAmountCents === 0 ? "Free shipping" : `Standard shipping (${formatEurEquivalent(shippingRateAmountCents / 100)} EUR)`,
				delivery_estimate: {
					minimum: { unit: "business_day", value: 3 },
					maximum: { unit: "business_day", value: 10 },
				},
				metadata: {
					bring_product_id: "STATIC_FALLBACK",
					bring_delivery_type: "HOME",
				},
			},
		},
	];
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			items?: CheckoutItem[];
			customerEmail?: string;
			shippingAddress?: SavedShippingAddress;
			selectedShippingId?: string | null;
		};
		const items = body.items;

		if (!items?.length) {
			return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
		}

		const secretKey = process.env.STRIPE_SECRET_KEY;
		if (!secretKey) {
			return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
		}

		const stripe = new Stripe(secretKey, {
			apiVersion: "2026-07-29.dahlia",
		});

		const pricedItems = await priceCheckoutItems(items);
		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
		const line_items = pricedItems.map((item) => ({
			price_data: {
				currency: DEFAULT_CURRENCY,
				product_data: {
					name: item.name,
					description: `Equivalent: ${formatEurEquivalent(item.unitAmountCents / 100)} EUR`,
				},
				unit_amount: item.unitAmountCents,
			},
			quantity: item.quantity,
		}));

		const compactItems = pricedItems.map((item) => `${item.productId}:${item.variantId}:${item.quantity}:${item.addonIds.join("+")}`).join("|");

		const subtotal = pricedItems.reduce((sum, item) => sum + item.lineSubtotal, 0);

		// Build shipping options - uses Bring API if configured, falls back to static
		const shippingOptions = await buildShippingOptions(body.shippingAddress, pricedItems, subtotal, body.selectedShippingId);

		let customer: Stripe.Customer | undefined;
		if (body.customerEmail) {
			try {
				customer = await findOrCreateCustomer(stripe, body.customerEmail, body.shippingAddress);
			} catch {
				customer = undefined;
			}
		}

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items,
			automatic_tax: {
				enabled: true,
			},
			shipping_address_collection: {
				allowed_countries: SHIPPING_COUNTRY_CODES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
			},
			shipping_options: shippingOptions,

			allow_promotion_codes: true,
			success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/checkout/cancel`,
			metadata: {
				items: compactItems,
			},
			invoice_creation: {
				enabled: true,
			},
			payment_intent_data: body.customerEmail
				? {
						receipt_email: body.customerEmail,
					}
				: undefined,
			...(customer
				? {
						customer: customer.id,
						customer_update: { address: "auto", name: "auto", shipping: "auto" },
					}
				: body.customerEmail
					? { customer_email: body.customerEmail }
					: {}),
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to start checkout.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
