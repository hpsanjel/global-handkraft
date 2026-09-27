import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";
import { getExchangeRates } from "@/lib/exchange-rates";
import { priceCheckoutItems, type CheckoutItem } from "@/lib/checkout-pricing";
import { getShippingQuotes, type SavedShippingAddress, type ShippingQuote } from "@/lib/checkout-shipping";
import { resolveCoupon } from "@/lib/checkout-coupon";
import { isCurrencyCode } from "@/lib/documents/utils/currency";
import type { CurrencyCode } from "@/lib/documents/types";

export const runtime = "nodejs";

/** Adapts a provider-agnostic ShippingQuote into a Stripe Checkout shipping option. */
function toStripeShippingOption(quote: ShippingQuote, currencyCode: CurrencyCode, rate: number): Stripe.Checkout.SessionCreateParams.ShippingOption {
	const isForeign = currencyCode !== "NOK";
	const convertedAmountCents = quote.amountCents > 0 ? (isForeign ? Math.max(1, Math.round(quote.amountCents * rate)) : quote.amountCents) : 0;
	const nokLabel = quote.amountCents > 0 ? ` (Equivalent to NOK ${(quote.amountCents / 100).toFixed(2)})` : "";
	const displayName = isForeign && quote.amountCents > 0 ? `${quote.displayName}${nokLabel}` : quote.displayName;

	return {
		shipping_rate_data: {
			type: "fixed_amount",
			fixed_amount: {
				amount: convertedAmountCents,
				currency: currencyCode.toLowerCase(),
			},
			display_name: displayName,
			delivery_estimate: quote.deliveryEstimateDays
				? {
						minimum: { unit: "business_day", value: quote.deliveryEstimateDays.min },
						maximum: { unit: "business_day", value: quote.deliveryEstimateDays.max },
					}
				: undefined,
			metadata: {
				bring_product_id: quote.id,
				bring_delivery_type: quote.deliveryType,
			},
		},
	};
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
		const body = (await request.json()) as {
			items?: CheckoutItem[];
			customerEmail?: string;
			shippingAddress?: SavedShippingAddress;
			selectedShippingId?: string | null;
			couponCode?: string;
			currency?: string;
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

		const countryCode = body.shippingAddress?.country;
		const pricedItems = await priceCheckoutItems(items, countryCode);

		const cookieHeader = request.headers.get("cookie") || "";
		const currencyCookie = cookieHeader
			.split("; ")
			.find((row) => row.startsWith("global-handcraft-currency="))
			?.split("=")[1];

		const rawCurrency = (body.currency || currencyCookie || "NOK").toUpperCase();
		const currencyCode: CurrencyCode = isCurrencyCode(rawCurrency) ? rawCurrency : "NOK";
		const isForeign = currencyCode !== "NOK";

		const { rates } = await getExchangeRates();
		const rate = isForeign ? rates[currencyCode] || 1 : 1;
		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

		const line_items = pricedItems.map((item) => {
			// Stripe Checkout only renders images from publicly reachable https
			// URLs (product images live in Supabase Storage), so skip local/dev URLs.
			const images = item.image?.startsWith("https://") ? [item.image] : undefined;

			const specs = [item.weight, [item.width, item.height, item.depth].filter(Boolean).join(" x ")].filter(Boolean).join(" · ");
			const nokPriceFormatted = `NOK ${(item.unitAmountCents / 100).toFixed(2)}`;
			const description = isForeign ? [specs, `(Equivalent to ${nokPriceFormatted})`].filter(Boolean).join(" — ") : specs || undefined;

			const unitAmountCents = isForeign ? Math.max(1, Math.round(item.unitAmountCents * rate)) : item.unitAmountCents;

			return {
				price_data: {
					currency: currencyCode.toLowerCase(),
					product_data: {
						name: item.name,
						description,
						images,
						metadata: {
							productId: item.productId,
							image: item.image,
							zoneMarkup: String(item.zoneMarkup),
						},
					},
					unit_amount: unitAmountCents,
				},
				quantity: item.quantity,
			};
		});

		const compactItems = pricedItems.map((item) => `${item.productId}:${item.variantId}:${item.quantity}:${item.addonIds.join("+")}:${item.zoneMarkup}`).join("|");

		const subtotal = pricedItems.reduce((sum, item) => sum + item.lineSubtotal, 0);

		// Handle coupon if provided - do this before building shipping options
		let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
		const resolvedCoupon = await resolveCoupon(body.couponCode, subtotal);
		const hasFreeShippingCoupon = resolvedCoupon?.freeShipping ?? false;

		// Only create a Stripe coupon if there's an actual percentage discount
		if (resolvedCoupon && resolvedCoupon.discountPct > 0) {
			const stripeCoupon = await stripe.coupons.create({
				name: resolvedCoupon.code,
				percent_off: resolvedCoupon.discountPct,
				duration: "once",
			});

			discounts = [
				{
					coupon: stripeCoupon.id,
				},
			];
		}

		// Build shipping options - uses Bring API if configured, falls back to static
		const shippingQuotes = await getShippingQuotes(body.shippingAddress, pricedItems, subtotal, body.selectedShippingId, hasFreeShippingCoupon);
		const shippingOptions = shippingQuotes.map((quote) => toStripeShippingOption(quote, currencyCode, rate));

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
			shipping_address_collection: {
				allowed_countries: SHIPPING_COUNTRY_CODES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
			},
			shipping_options: shippingOptions,
			...(discounts && { discounts }),

			allow_promotion_codes: !body.couponCode,
			success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/checkout/cancel`,
			custom_text: isForeign
				? {
						submit: {
							message: `Prices are converted from Norwegian Krone (NOK) based on live exchange rates. Items show their NOK catalog equivalent.`,
						},
					}
				: undefined,
			metadata: {
				items: compactItems,
				...(body.couponCode && { couponCode: body.couponCode.toUpperCase() }),
				exchangeRate: String(rate),
				baseCurrency: "NOK",
				displayCurrency: currencyCode,
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
