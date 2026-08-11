import { prisma } from "@/lib/prisma";
import { STORE_PICKUP_ID } from "@/lib/shipping-client";
import { variantLabel } from "@/lib/product-transform";

export interface AdminMandapInquiryMessage {
	id: string;
	sender: string;
	message: string;
	createdAt: string;
}

export interface AdminMandapInquiry {
	id: string;
	productId: string;
	productName: string;
	productSlug: string;
	category: string;
	length: string;
	width: string;
	height: string;
	material: string;
	expectedCostRange: string;
	description: string;
	whatsapp: string | null;
	email: string | null;
	sampleImages: string[];
	status: string;
	paymentStatus: string;
	adminNote: string | null;
	quotedPrice: number | null;
	stripePaymentLink: string | null;
	createdAt: string;
	updatedAt: string;
	paymentAcceptedAt: string | null;
	paymentDeclinedAt: string | null;
	messages: AdminMandapInquiryMessage[];
}

export async function getMandapInquiries(limit = 20): Promise<AdminMandapInquiry[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	const inquiries = await prisma.mandapInquiry.findMany({
		include: {
			messages: { orderBy: { createdAt: "asc" } },
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return inquiries.map((inquiry) => ({
		...inquiry,
		createdAt: inquiry.createdAt.toISOString(),
		updatedAt: inquiry.updatedAt.toISOString(),
		paymentAcceptedAt: inquiry.paymentAcceptedAt?.toISOString() ?? null,
		paymentDeclinedAt: inquiry.paymentDeclinedAt?.toISOString() ?? null,
		messages: inquiry.messages.map((message) => ({
			...message,
			createdAt: message.createdAt.toISOString(),
		})),
	}));
}

export interface AdminOrder {
	id: string;
	orderId: string;
	customer: string;
	email: string;
	address: string;
	item: string;
	itemImage: string | null;
	variant: string;
	status: string;
	amount: number;
	currency: string;
	shippingMethod: string;
	isPickup: boolean;
	date: string;
}

export async function getRecentOrders(limit = 10): Promise<AdminOrder[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	const orders = await prisma.order.findMany({
		include: {
			address: true,
			items: {
				include: {
					product: true,
					variant: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return orders.map((order) => {
		const firstItem = order.items[0];
		const address = [order.address.address, order.address.city, order.address.postalCode, order.address.country].filter(Boolean).join(", ");

		return {
			id: order.orderNumber,
			orderId: order.id,
			customer: order.address.fullName || "Guest customer",
			email: order.address.email || "No email provided",
			address: address || "Address not provided",
			item: firstItem?.product.name || "Handcrafted product",
			itemImage: firstItem?.product.image || null,
			variant: variantLabel(firstItem?.variant.name, firstItem?.variant.color) || "Selected option",
			status: order.status,
			amount: order.total,
			currency: order.currency || "NOK",
			shippingMethod: order.shippingMethod || "Not recorded",
			isPickup: order.shippingProductId === STORE_PICKUP_ID,
			date: order.createdAt.toLocaleString("en-GB", {
				day: "numeric",
				month: "short",
				hour: "numeric",
				minute: "2-digit",
			}),
		};
	});
}
