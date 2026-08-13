import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVippsWebhookSignature } from "@/lib/vipps-webhook";
import { capturePayment } from "@/lib/vipps";
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

// Webhook *payloads* use Vipps' short enum form for `name` (CREATED,
// AUTHORIZED, CAPTURED, CANCELLED, REFUNDED, ABORTED, EXPIRED, TERMINATED) —
// distinct from the long "epayments.payment.captured.v1" form used only when
// *registering* the webhook subscription (see the registration call in
// lib/vipps.ts's sibling docs / the one-time registration script/curl).
// TODO(verify): once live traffic confirms this account's capture settings,
// double check "CAPTURED" (money definitively moved) is the right signal to
// fulfill on rather than "AUTHORIZED" — mirrors the certainty Stripe's
// checkout.session.completed gives us today.
const FULFILLMENT_EVENT = "CAPTURED";

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

		// WALLET payments only set money aside on AUTHORIZED — actually
		// collecting it requires an explicit capture call, which we make here
		// immediately (matching Stripe's instant-charge-at-checkout behavior)
		// rather than deferring it to a shipment step. Fulfillment itself still
		// only happens on the CAPTURED event below, once capture is confirmed.
		if (event.name === "AUTHORIZED" && event.success) {
			const pendingForCapture = await prisma.pendingCheckout.findUnique({ where: { reference: event.reference } });
			if (pendingForCapture) {
				try {
					await capturePayment(event.reference, Math.round(pendingForCapture.total * 100));
				} catch (captureError) {
					// Don't fail the webhook response over this — Vipps will retry
					// AUTHORIZED delivery, which would just retry the capture; a
					// capture that keeps failing needs manual investigation, not an
					// infinite webhook retry loop.
					console.error("Failed to capture Vipps payment:", captureError);
				}
			}
			return NextResponse.json({ received: true });
		}

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
