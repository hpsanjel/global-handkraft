import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types/store";
import { prisma } from "@/lib/prisma";
import { getShippingRate } from "@/lib/shipping";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

export const runtime = "nodejs";

type SavedShippingAddress = {
	fullName?: string;
	phone?: string;
	address?: string;
	city?: string;
	postalCode?: string;
	country?: string;
};

type CheckoutItem = Pick<CartItem, "productId" | "variantId" | "addonIds" | "quantity">;

type PricedCheckoutItem = {
	productId: string;
	variantId: string;
	quantity: number;
	addonIds: string[];
	name: string;
	unitAmountCents: number;
	lineSubtotal: number;
};

function normalizeCheckoutItems(items: CheckoutItem[]) {
	return items.map((item) => ({
		productId: String(item.productId ?? "").trim(),
		variantId: String(item.variantId ?? "").trim(),
		addonIds: Array.isArray(item.addonIds) ? item.addonIds.map((id) => String(id).trim()).filter(Boolean).sort() : [],
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

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { items?: CheckoutItem[]; customerEmail?: string; shippingAddress?: SavedShippingAddress };
		const items = body.items;

		if (!items?.length) {
			return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
		}

		const secretKey = process.env.STRIPE_SECRET_KEY;
		if (!secretKey) {
			return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
		}

		const stripe = new Stripe(secretKey, {
			apiVersion: "2026-06-24.dahlia",
		});

		const pricedItems = await priceCheckoutItems(items);
		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
		const line_items = pricedItems.map((item) => ({
			price_data: {
				currency: "eur",
				product_data: {
					name: item.name,
				},
				unit_amount: item.unitAmountCents,
			},
			quantity: item.quantity,
		}));

		const compactItems = pricedItems.map((item) => `${item.productId}:${item.variantId}:${item.quantity}:${item.addonIds.join("+")}`).join("|");

		const subtotal = pricedItems.reduce((sum, item) => sum + item.lineSubtotal, 0);

		let shippingRateAmountCents = 0;
		try {
			shippingRateAmountCents = (await getShippingRate(body.shippingAddress?.country, subtotal)).amountCents;
		} catch {
			shippingRateAmountCents = 0;
		}

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
			shipping_options: [
				{
					shipping_rate_data: {
						type: "fixed_amount",
						fixed_amount: {
							amount: shippingRateAmountCents,
							currency: "eur",
						},
						display_name: shippingRateAmountCents === 0 ? "Free shipping" : "Standard shipping",
						delivery_estimate: {
							minimum: { unit: "business_day", value: 3 },
							maximum: { unit: "business_day", value: 10 },
						},
					},
				},
			],

			allow_promotion_codes: true,
			success_url: `${origin}/checkout/success`,
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
