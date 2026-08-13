import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { generateDocument } from "@/lib/documents";
import { BUSINESS } from "@/lib/documents/business-config";
import type { Order } from "@/app/generated/prisma";

export type PaymentMethodValue = "STRIPE" | "VIPPS";

export type FulfillOrderItemInput = {
	productId: string;
	variantId: string;
	quantity: number;
	unitPrice: number;
	/** Defaults to 0 when omitted — matches the Stripe webhook's current behavior, which doesn't track this per-item. */
	zoneMarkup?: number;
	addonNames: string[];
	/** For the confirmation email line item; not persisted on OrderItem. */
	name: string;
	/** For the confirmation email line item; not persisted on OrderItem. */
	variantName: string;
};

export type FulfillOrderCustomer = {
	fullName: string;
	email: string;
	phone: string;
	country: string;
	address: string;
	postalCode: string;
	city: string;
};

export type FulfillOrderInput = {
	orderNumber: string;
	paymentMethod: PaymentMethodValue;
	paymentId: string | null;
	customer: FulfillOrderCustomer;
	amounts: { subtotal: number; shipping: number; total: number; currency: string };
	items: FulfillOrderItemInput[];
	shippingMethod: string | null;
	shippingProductId: string | null;
};

/**
 * Creates the Address + Order + OrderItem[] + OrderStatusEvent rows for a
 * paid checkout, decrements stock, and best-effort sends the receipt/email —
 * the single place order fulfillment happens, shared by the Stripe and
 * Vipps webhooks so payment-provider-specific code never touches the DB
 * directly. Idempotent on `orderNumber`.
 */
export async function fulfillOrder(input: FulfillOrderInput): Promise<{ order: Order; created: boolean }> {
	const existing = await prisma.order.findUnique({ where: { orderNumber: input.orderNumber } });
	if (existing) {
		return { order: existing, created: false };
	}

	const order = await prisma.$transaction(async (tx) => {
		const address = await tx.address.create({
			data: {
				fullName: input.customer.fullName || "Guest",
				email: input.customer.email,
				phone: input.customer.phone,
				country: input.customer.country,
				address: input.customer.address,
				postalCode: input.customer.postalCode,
				city: input.customer.city,
			},
		});

		const newOrder = await tx.order.create({
			data: {
				orderNumber: input.orderNumber,
				status: "PAID",
				paymentMethod: input.paymentMethod,
				paymentId: input.paymentId,
				subtotal: input.amounts.subtotal,
				shipping: input.amounts.shipping,
				total: input.amounts.total,
				currency: input.amounts.currency,
				shippingCountry: input.customer.country,
				shippingMethod: input.shippingMethod,
				shippingProductId: input.shippingProductId,
				addressId: address.id,
				items: {
					create: input.items.map(({ name, variantName, ...orderItem }) => orderItem),
				},
			},
		});

		await tx.orderStatusEvent.create({
			data: { orderId: newOrder.id, status: "PAID" },
		});

		await Promise.all(
			input.items.map((item) =>
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

	const isPickupOrder = typeof input.shippingMethod === "string" && /pickup|pick-up|store|collection/i.test(input.shippingMethod);

	try {
		await sendOrderConfirmationEmail({
			to: input.customer.email,
			customerName: input.customer.fullName,
			orderNumber: input.orderNumber,
			items: input.items,
			subtotal: order.subtotal,
			shipping: order.shipping,
			shippingMethod: input.shippingMethod,
			total: order.total,
			currency: order.currency,
			address: {
				address: input.customer.address,
				city: input.customer.city,
				postalCode: input.customer.postalCode,
				country: input.customer.country,
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

	return { order, created: true };
}
