import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateDocument, generateMandapInquiryDocument } from "@/lib/documents";
import { BUSINESS } from "@/lib/documents/business-config";
import { variantLabel } from "@/lib/product-transform";

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

			// Handle custom mandap/temple inquiry deposit/balance payment
			const mandapTransaction = await prisma.mandapInquiryTransaction.findUnique({
				where: { stripeSessionId: session.id },
			});

			if (mandapTransaction) {
				// Idempotent: Stripe may redeliver the same event.
				if (mandapTransaction.status === "PAID") {
					return NextResponse.json({ received: true, transactionId: mandapTransaction.id });
				}

				const inquiry = await prisma.mandapInquiry.findUnique({ where: { id: mandapTransaction.inquiryId } });
				if (!inquiry) {
					return NextResponse.json({ received: true });
				}

				const newAmountPaid = inquiry.amountPaid + mandapTransaction.amount;
				const quotedCents = Math.round((inquiry.quotedPrice ?? 0) * 100);
				const newPaidCents = Math.round(newAmountPaid * 100);
				const newPaymentStatus = newPaidCents >= quotedCents ? "PAID" : "DEPOSIT_PAID";

				await prisma.$transaction([
					prisma.mandapInquiryTransaction.update({
						where: { id: mandapTransaction.id },
						data: {
							status: "PAID",
							paidAt: new Date(),
							stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
						},
					}),
					prisma.mandapInquiry.update({
						where: { id: inquiry.id },
						data: {
							amountPaid: newAmountPaid,
							paymentStatus: newPaymentStatus,
							...(newPaymentStatus === "PAID" ? { status: "PAID" } : {}),
						},
					}),
				]);

				// Generate the payment-stage document (deposit receipt vs. final commercial
				// invoice) and attach it to the status email — mirrors how the regular
				// order webhook below attaches a RECEIPT to the confirmation email. A
				// failed PDF should never block the status update or its email.
				let mandapAttachment: { filename: string; content: Buffer } | undefined;
				try {
					const docType = newPaymentStatus === "PAID" ? "COMMERCIAL_INVOICE" : mandapTransaction.kind === "DEPOSIT" ? "DEPOSIT_RECEIPT" : undefined;
					if (docType) {
						const output = await generateMandapInquiryDocument({ inquiryId: inquiry.id, type: docType, format: "buffer" });
						mandapAttachment = { filename: output.fileName, content: output.data };
					}
				} catch (documentError) {
					console.error("Failed to generate mandap inquiry payment document:", documentError);
				}

				// Send confirmation email to customer
				try {
					const { sendMandapInquiryStatusUpdateEmail } = await import("@/lib/email");
					await sendMandapInquiryStatusUpdateEmail({
						to: inquiry.email || session.customer_email || "",
						category: inquiry.category,
						productName: inquiry.productName,
						paymentStatus: newPaymentStatus,
						quotedPrice: inquiry.quotedPrice ?? undefined,
						amountPaid: newAmountPaid,
						remainingBalance: newPaymentStatus === "DEPOSIT_PAID" ? (inquiry.quotedPrice ?? 0) - newAmountPaid : undefined,
						attachment: mandapAttachment,
					});
				} catch (emailError) {
					console.error("Failed to send mandap payment confirmation email:", emailError);
				}

				return NextResponse.json({ received: true, inquiryId: inquiry.id, transactionId: mandapTransaction.id });
			}

			// Handle regular order payment
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
						name: variant.product.name,
						variantName: variantLabel(variant.name, variant.color),
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

				const newOrder = await tx.order.create({
					data: {
						orderNumber,
						status: "PAID",
						subtotal: (session.amount_subtotal ?? 0) / 100,
						shipping: ((session.total_details?.amount_shipping ?? 0) || 0) / 100,
						total: (session.amount_total ?? 0) / 100,
						currency: (session.currency || "nok").toUpperCase(),
						paymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
						shippingCountry: session.customer_details?.address?.country || "",
						shippingMethod,
						shippingProductId,
						addressId: address.id,
						items: {
							create: pricedItems.map(({ name, variantName, ...orderItem }) => orderItem),
						},
					},
				});

				await tx.orderStatusEvent.create({
					data: { orderId: newOrder.id, status: "PAID" },
				});

				await Promise.all(
					pricedItems.map((item) =>
						tx.variant.update({
							where: { id: item.variantId },
							data: { stock: { decrement: item.quantity } },
						}),
					),
				);

				return newOrder;
			});

			let receiptAttachment: { filename: string; content: Buffer } | undefined;
			try {
				const receipt = await generateDocument({ orderId: order.id, type: "RECEIPT", format: "buffer" });
				receiptAttachment = { filename: receipt.fileName, content: receipt.data };
			} catch (receiptError) {
				// A failed PDF should never block order confirmation — the customer
				// still gets the HTML email either way, just without the attachment.
				console.error("Failed to generate receipt PDF for order confirmation email:", receiptError);
			}

			const isPickupOrder = typeof shippingMethod === "string" && /pickup|pick-up|store|collection/i.test(shippingMethod);

			try {
				await sendOrderConfirmationEmail({
					to: session.customer_details?.email || session.customer_email || "",
					customerName: session.customer_details?.name || "",
					orderNumber,
					items: pricedItems,
					subtotal: order.subtotal,
					shipping: order.shipping,
					shippingMethod,
					total: order.total,
					currency: order.currency,
					address: {
						address: [session.customer_details?.address?.line1, session.customer_details?.address?.line2].filter(Boolean).join(", "),
						city: session.customer_details?.address?.city || "",
						postalCode: session.customer_details?.address?.postal_code || "",
						country: session.customer_details?.address?.country || "",
					},
					isPickupOrder,
					pickupAddress: isPickupOrder
						? {
								address: `${BUSINESS.seller.address.line1}, ${BUSINESS.seller.address.city}`,
								city: BUSINESS.seller.address.city,
								postalCode: BUSINESS.seller.address.postalCode,
								country: BUSINESS.seller.address.country,
							}
						: undefined,
					attachment: receiptAttachment,
				});
			} catch (emailError) {
				console.error("Failed to send order confirmation email:", emailError);
			}

			return NextResponse.json({ received: true, orderId: order.id });
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Webhook handling failed.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
