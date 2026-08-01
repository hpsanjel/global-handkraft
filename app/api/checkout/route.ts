import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types/store";
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
		const body = (await request.json()) as { items?: CartItem[]; customerEmail?: string; shippingAddress?: SavedShippingAddress };
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

		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
		const line_items = items.map((item) => ({
			price_data: {
				currency: "eur",
				product_data: {
					name: item.name,
				},
				unit_amount: Math.round(item.price * 100),
			},
			quantity: item.quantity,
		}));

		const compactItems = items.map((item) => `${item.productId}:${item.variantId}:${item.quantity}:${item.addonIds.join("+")}`).join("|");

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
