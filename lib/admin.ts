import { prisma } from "@/lib/prisma";

export interface AdminMandapInquiry {
	id: string;
	productId: string;
	productName: string;
	productSlug: string;
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
	createdAt: string;
}

export async function getMandapInquiries(limit = 20): Promise<AdminMandapInquiry[]> {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	const inquiries = await prisma.mandapInquiry.findMany({
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return inquiries.map((inquiry) => ({
		...inquiry,
		createdAt: inquiry.createdAt.toISOString(),
	}));
}

export interface AdminOrder {
	id: string;
	orderId: string;
	customer: string;
	email: string;
	address: string;
	item: string;
	variant: string;
	status: string;
	amount: number;
	currency: string;
	shippingMethod: string;
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
			variant: firstItem?.variant.name || "Selected option",
			status: order.status,
			amount: order.total,
			currency: order.currency || "NOK",
			shippingMethod: order.shippingMethod || "Not recorded",
			date: order.createdAt.toLocaleString("en-GB", {
				day: "numeric",
				month: "short",
				hour: "numeric",
				minute: "2-digit",
			}),
		};
	});
}
