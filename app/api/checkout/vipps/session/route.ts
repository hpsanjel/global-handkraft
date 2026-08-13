import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVippsPayment } from "@/lib/vipps";

export const runtime = "nodejs";

type PendingCheckoutItem = {
	name: string;
	quantity: number;
	unitPrice: number;
	image?: string | null;
};

/**
 * GET /api/checkout/vipps/session?reference=ORD-...
 *
 * Vipps equivalent of /api/checkout/session — used by the return page to
 * render an order summary. Vipps doesn't expand line items the way Stripe
 * does, so display data is reconstructed from our own PendingCheckout
 * snapshot rather than from the Vipps API response, which is only consulted
 * to confirm the payment actually succeeded.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const reference = searchParams.get("reference");

		if (!reference) {
			return NextResponse.json({ error: "Invalid reference." }, { status: 400 });
		}

		const payment = await getVippsPayment(reference);

		// TODO(verify): confirm against Open Items whether AUTHORIZED or a
		// later state is the right "payment succeeded" signal for this account.
		if (payment.state !== "AUTHORIZED") {
			return NextResponse.json({ error: "This payment was not completed.", state: payment.state }, { status: 409 });
		}

		const pending = await prisma.pendingCheckout.findUnique({ where: { reference } });
		if (!pending) {
			return NextResponse.json({ error: "Order details not found." }, { status: 404 });
		}

		const items = (pending.itemsJson as unknown as PendingCheckoutItem[]).map((item) => ({
			name: item.name,
			quantity: item.quantity,
			amount: item.unitPrice * item.quantity,
			image: item.image ?? null,
		}));

		return NextResponse.json({
			orderNumber: pending.reference,
			customerEmail: pending.customerEmail,
			customerName: pending.customerName || "",
			items,
			subtotal: pending.subtotal,
			shipping: pending.shipping,
			shippingMethod: pending.shippingMethod,
			couponCode: pending.couponCode,
			total: pending.total,
			currency: pending.currency,
			address: {
				line1: pending.shippingAddress,
				city: pending.shippingCity,
				postalCode: pending.shippingPostalCode,
				country: pending.shippingCountry,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch checkout session.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
