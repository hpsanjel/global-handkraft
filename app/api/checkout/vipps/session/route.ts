import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVippsPayment, capturePayment } from "@/lib/vipps";
import { fulfillOrder, type FulfillOrderItemInput } from "@/lib/order-fulfillment";

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
 *
 * Also acts as an immediate, synchronous capture and fulfillment fallback
 * if background webhooks were delayed or blocked by firewall/proxy.
 */
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const reference = searchParams.get("reference");

		if (!reference) {
			return NextResponse.json({ error: "Invalid reference." }, { status: 400 });
		}

		const payment = await getVippsPayment(reference);

		const isAuthorizedOrCaptured =
			payment.state === "AUTHORIZED" ||
			payment.state === "TERMINATED" ||
			(payment.aggregate?.capturedAmount?.value ?? 0) > 0;

		if (!isAuthorizedOrCaptured) {
			return NextResponse.json({ error: "This payment was not completed.", state: payment.state }, { status: 409 });
		}

		const pending = await prisma.pendingCheckout.findUnique({ where: { reference } });
		if (!pending) {
			return NextResponse.json({ error: "Order details not found." }, { status: 404 });
		}

		// Fallback 1: If payment is authorized but not yet captured, capture it immediately
		const capturedOre = payment.aggregate?.capturedAmount?.value ?? 0;
		const totalOre = Math.round(pending.total * 100);
		if (capturedOre < totalOre && payment.state === "AUTHORIZED") {
			try {
				await capturePayment(reference, totalOre);
			} catch (captureErr) {
				console.error("Vipps session auto-capture error:", captureErr);
			}
		}

		// Fallback 2: If order is not yet created in the DB (e.g. webhook was delayed or rejected), fulfill now
		const existingOrder = await prisma.order.findUnique({ where: { orderNumber: reference } });
		if (!existingOrder) {
			try {
				const items = pending.itemsJson as unknown as FulfillOrderItemInput[];
				const rawUserDetails = payment.userDetails as any;
				const vippsName = rawUserDetails?.name || [rawUserDetails?.firstName, rawUserDetails?.lastName].filter(Boolean).join(" ");
				const vippsPhone = rawUserDetails?.phoneNumber || rawUserDetails?.mobileNumber;
				const vippsEmail = rawUserDetails?.email;
				const vippsAddress = rawUserDetails?.address;

				const { created } = await fulfillOrder({
					orderNumber: pending.reference,
					paymentMethod: "VIPPS",
					paymentId: payment.pspReference ?? null,
					customer: {
						fullName: vippsName || pending.customerName || "Guest",
						email: vippsEmail || pending.customerEmail,
						phone: vippsPhone || pending.customerPhone || "",
						country: vippsAddress?.country || pending.shippingCountry || "NO",
						address: vippsAddress?.streetAddress || pending.shippingAddress,
						postalCode: vippsAddress?.postalCode || pending.shippingPostalCode,
						city: vippsAddress?.city || pending.shippingCity,
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
			} catch (fulfillErr) {
				console.error("Vipps session auto-fulfillment fallback error:", fulfillErr);
			}
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
