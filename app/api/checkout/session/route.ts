import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * GET /api/checkout/session?session_id=cs_...
 *
 * Returns a summary of a completed Stripe Checkout Session for the success
 * page. The session_id itself acts as the access token — it's a long,
 * unguessable value only known to whoever completed that checkout, the same
 * pattern Stripe's own docs recommend for order-confirmation pages.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get("session_id");

		if (!sessionId || !sessionId.startsWith("cs_")) {
			return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
		}

		const secretKey = process.env.STRIPE_SECRET_KEY;
		if (!secretKey) {
			return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
		}

		const stripe = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });

		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["line_items", "shipping_cost.shipping_rate"],
		});

		if (session.payment_status !== "paid") {
			return NextResponse.json({ error: "This checkout session has not been paid." }, { status: 409 });
		}

		const shippingRate = session.shipping_cost?.shipping_rate;
		const shippingMethod = typeof shippingRate === "object" && shippingRate ? shippingRate.display_name : null;

		const items = (session.line_items?.data || []).map((lineItem) => ({
			name: lineItem.description || "Item",
			quantity: lineItem.quantity || 1,
			amount: (lineItem.amount_total ?? 0) / 100,
			image: lineItem.metadata?.image || null,
		}));

		return NextResponse.json({
			orderNumber: `ORD-${session.id.slice(-8).toUpperCase()}`,
			customerEmail: session.customer_details?.email || session.customer_email || "",
			customerName: session.customer_details?.name || "",
			items,
			subtotal: (session.amount_subtotal ?? 0) / 100,
			shipping: (session.total_details?.amount_shipping ?? 0) / 100,
			shippingMethod,
			couponCode: session.metadata?.couponCode || null,
			total: (session.amount_total ?? 0) / 100,
			currency: (session.currency || "nok").toUpperCase(),
			address: {
				line1: session.customer_details?.address?.line1 || "",
				city: session.customer_details?.address?.city || "",
				postalCode: session.customer_details?.address?.postal_code || "",
				country: session.customer_details?.address?.country || "",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch checkout session.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
