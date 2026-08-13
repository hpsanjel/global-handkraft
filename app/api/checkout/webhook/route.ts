import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/lib/product-transform";
import { fulfillOrder, type FulfillOrderItemInput } from "@/lib/order-fulfillment";

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
			apiVersion: "2026-07-29.dahlia",
		});

		const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

		if (event.type === "checkout.session.completed") {
			const session = event.data.object;
			const sessionWithShipping = await stripe.checkout.sessions.retrieve(session.id, {
				expand: ["shipping_cost.shipping_rate"],
			});
			const shippingRate = sessionWithShipping.shipping_cost?.shipping_rate;
			const shippingMethod = typeof shippingRate === "object" && shippingRate ? shippingRate.display_name : null;
			const shippingProductId = typeof shippingRate === "object" && shippingRate ? (shippingRate.metadata?.bring_product_id ?? null) : null;

			// Handle custom mandap/temple inquiry payment
			if (session.metadata?.inquiryId) {
				const inquiryId = session.metadata.inquiryId;
				const inquiry = await prisma.mandapInquiry.findUnique({ where: { id: inquiryId } });
				if (inquiry) {
					await prisma.mandapInquiry.update({
						where: { id: inquiryId },
						data: { paymentStatus: "PAID", status: "PAID" },
					});

					// Send confirmation email to customer
					try {
						const { sendMandapInquiryStatusUpdateEmail } = await import("@/lib/email");
						await sendMandapInquiryStatusUpdateEmail({
							to: inquiry.email || session.customer_email || "",
							category: inquiry.category,
							productName: inquiry.productName,
							paymentStatus: "PAID",
							adminNote: "Payment received. Our team will start working on your custom order.",
						});
					} catch (emailError) {
						console.error("Failed to send mandap payment confirmation email:", emailError);
					}

					return NextResponse.json({ received: true, inquiryId });
				}
			}

			// Handle regular order payment
			const orderNumber = `ORD-${session.id.slice(-8).toUpperCase()}`;

			const itemsMetadata = session.metadata?.items || "";
			const parsedItems = itemsMetadata
				.split("|")
				.filter(Boolean)
				.map((entry) => {
					const [productId, variantId, quantity, addonIds] = entry.split(":");
					return { productId, variantId, quantity: Number(quantity || 0), addonIds: addonIds ? addonIds.split("+").filter(Boolean) : [] };
				});

			const items: FulfillOrderItemInput[] = await Promise.all(
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
						name: variant.product.name,
						variantName: variantLabel(variant.name, variant.color),
					};
				}),
			);

			const { order } = await fulfillOrder({
				orderNumber,
				paymentMethod: "STRIPE",
				paymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
				customer: {
					fullName: session.customer_details?.name || "Guest",
					email: session.customer_details?.email || session.customer_email || "",
					phone: session.customer_details?.phone || "",
					country: session.customer_details?.address?.country || "",
					address: [session.customer_details?.address?.line1, session.customer_details?.address?.line2].filter(Boolean).join(", "),
					postalCode: session.customer_details?.address?.postal_code || "",
					city: session.customer_details?.address?.city || "",
				},
				amounts: {
					subtotal: (session.amount_subtotal ?? 0) / 100,
					shipping: ((session.total_details?.amount_shipping ?? 0) || 0) / 100,
					total: (session.amount_total ?? 0) / 100,
					currency: (session.currency || "nok").toUpperCase(),
				},
				items,
				shippingMethod,
				shippingProductId,
			});

			return NextResponse.json({ received: true, orderId: order.id });
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Webhook handling failed.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
