import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVippsWebhookSignature } from "@/lib/vipps-webhook";
import { fulfillOrder, type FulfillOrderItemInput } from "@/lib/order-fulfillment";

export const runtime = "nodejs";

type VippsWebhookEvent = {
	name: string;
	reference: string;
	pspReference: string;
	amount: { value: number; currency: string };
	success: boolean;
	userDetails?: { name?: string; email?: string; phoneNumber?: string };
};

// TODO(verify): once real Vipps merchant-portal access exists, confirm
// whether this account's capture settings mean "authorized" or "captured"
// is the right signal to fulfill on (see plan's Open Items). Defaulting to
// captured.v1, i.e. money has definitively moved — mirrors the certainty
// Stripe's checkout.session.completed gives us today.
const FULFILLMENT_EVENT = "epayments.payment.captured.v1";

export async function POST(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const webhookSecret = process.env.VIPPS_WEBHOOK_SECRET;
		if (!webhookSecret) {
			return NextResponse.json({ error: "Vipps webhook is not configured." }, { status: 400 });
		}

		const rawBody = await request.text();
		const url = new URL(request.url);

		const isValid = verifyVippsWebhookSignature({
			method: "POST",
			pathAndQuery: `${url.pathname}${url.search}`,
			headers: {
				host: request.headers.get("host") ?? "",
				"x-ms-date": request.headers.get("x-ms-date") ?? "",
				"x-ms-content-sha256": request.headers.get("x-ms-content-sha256") ?? "",
				authorization: request.headers.get("authorization") ?? "",
			},
			rawBody,
			secret: webhookSecret,
		});

		if (!isValid) {
			return NextResponse.json({ error: "Invalid Vipps webhook signature." }, { status: 400 });
		}

		const event = JSON.parse(rawBody) as VippsWebhookEvent;

		if (event.name !== FULFILLMENT_EVENT || !event.success) {
			return NextResponse.json({ received: true });
		}

		const pending = await prisma.pendingCheckout.findUnique({ where: { reference: event.reference } });
		if (!pending) {
			return NextResponse.json({ error: "Unknown reference." }, { status: 404 });
		}

		const items = pending.itemsJson as unknown as FulfillOrderItemInput[];

		const { order, created } = await fulfillOrder({
			orderNumber: pending.reference,
			paymentMethod: "VIPPS",
			paymentId: event.pspReference,
			customer: {
				// TODO(verify): confirm the payment-creation parameter that
				// populates event.userDetails (name/email/phoneNumber) — until
				// then, fall back to what the buyer entered in our own checkout
				// form so fulfillment never breaks on a missing profile scope.
				fullName: event.userDetails?.name || pending.customerName || "Guest",
				email: event.userDetails?.email || pending.customerEmail,
				phone: event.userDetails?.phoneNumber || pending.customerPhone || "",
				country: pending.shippingCountry,
				address: pending.shippingAddress,
				postalCode: pending.shippingPostalCode,
				city: pending.shippingCity,
			},
			amounts: {
				subtotal: pending.subtotal,
				shipping: pending.shipping,
				total: pending.total,
				currency: pending.currency,
			},
			items,
			shippingMethod: pending.shippingMethod,
			shippingProductId: pending.shippingProductId,
		});

		if (created) {
			await prisma.pendingCheckout.update({ where: { id: pending.id }, data: { consumedAt: new Date() } });
		}

		return NextResponse.json({ received: true, orderId: order.id });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Webhook handling failed.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
