import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = await request.text();
		const sig = request.headers.get("stripe-signature");
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

		if (!sig || !webhookSecret) {
			return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
		}

		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
			apiVersion: "2026-06-24.dahlia",
		});

		const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object;
			const orderNumber = `ORD-${session.id.slice(-8).toUpperCase()}`;
			const existingOrder = await prisma.order.findUnique({
				where: { orderNumber },
				select: { id: true },
			});

			if (existingOrder) {
				return NextResponse.json({ received: true, orderId: existingOrder.id });
			}

			const itemsMetadata = session.metadata?.items || "";
			const parsedItems = itemsMetadata
				.split("|")
				.filter(Boolean)
				.map((entry) => {
					const [productId, variantId, quantity, addonIds] = entry.split(":");
					return { productId, variantId, quantity: Number(quantity || 0), addonIds: addonIds ? addonIds.split("+").filter(Boolean) : [] };
				});

			const pricedItems = await Promise.all(
				parsedItems.map(async (item) => {
					const variant = await prisma.variant.findUnique({
						where: { id: item.variantId },
						include: {
							product: true,
						},
					});
					if (!variant || variant.productId !== item.productId) {
						throw new Error("Paid checkout references an unavailable product variant.");
					}

					const addons = item.addonIds.length ? await prisma.addon.findMany({ where: { id: { in: item.addonIds }, productId: item.productId } }) : [];
					if (addons.length !== item.addonIds.length) {
						throw new Error("Paid checkout references an unavailable add-on.");
					}

					const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);

					return {
						productId: item.productId,
						variantId: item.variantId,
						quantity: Math.max(1, Number(item.quantity) || 1),
						unitPrice: variant.price + addonTotal,
						addonNames: addons.map((addon) => addon.name),
					};
				}),
			);

			const order = await prisma.$transaction(async (tx) => {
				const address = await tx.address.create({
					data: {
						fullName: session.customer_details?.name || "Guest",
						email: session.customer_details?.email || session.customer_email || "",
						phone: session.customer_details?.phone || "",
						country: session.customer_details?.address?.country || "",
						address: [session.customer_details?.address?.line1, session.customer_details?.address?.line2].filter(Boolean).join(", "),
						postalCode: session.customer_details?.address?.postal_code || "",
						city: session.customer_details?.address?.city || "",
					},
				});

				return tx.order.create({
					data: {
						orderNumber,
						status: "PAID",
						subtotal: (session.amount_subtotal ?? 0) / 100,
						vat: ((session.total_details?.amount_tax ?? 0) || 0) / 100,
						shipping: ((session.total_details?.amount_shipping ?? 0) || 0) / 100,
						total: (session.amount_total ?? 0) / 100,
						currency: (session.currency || "eur").toUpperCase(),
						paymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
						shippingCountry: session.customer_details?.address?.country || "",
						addressId: address.id,
						items: {
							create: pricedItems,
						},
					},
				});
			});

			return NextResponse.json({ received: true, orderId: order.id });
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Webhook handling failed.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
