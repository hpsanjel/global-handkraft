import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { items?: CartItem[] };
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

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items,
			success_url: `${origin}/checkout/success`,
			cancel_url: `${origin}/checkout/cancel`,
			metadata: {
				items: compactItems,
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to start checkout.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
