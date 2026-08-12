import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/order-status";
import { getRecentOrders } from "@/lib/admin";

export interface DashboardKPIs {
	revenue30d: number;
	revenuePrev30d: number;
	orders30d: number;
	ordersPrev30d: number;
	aov30d: number;
	aovPrev30d: number;
	pendingPayments: number;
	totalProducts: number;
	inventoryValue: number;
}

export interface DashboardOrderPipeline {
	status: string;
	count: number;
	label: string;
}

export interface DashboardTopProduct {
	productId: string;
	productName: string;
	productSlug: string;
	productImage: string | null;
	revenue: number;
	unitsSold: number;
	orderCount: number;
}

export interface DashboardCountry {
	country: string;
	revenue: number;
	orderCount: number;
}

export interface DashboardActionItem {
	type: string;
	count: number;
	label: string;
	href: string;
	tone: "red" | "orange" | "blue" | "amber";
}

export interface DashboardActivity {
	id: string;
	type: "order" | "review" | "inquiry";
	title: string;
	description: string;
	timestamp: string;
	href?: string;
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return startOfDay(d);
}

export interface DashboardDailyRevenue {
	date: string;
	label: string;
	revenue: number;
}

export interface DashboardData {
	kpis: DashboardKPIs;
	topProducts: DashboardTopProduct[];
	countries: DashboardCountry[];
	actionItems: DashboardActionItem[];
	recentActivity: DashboardActivity[];
	dailyRevenue: DashboardDailyRevenue[];
	recentOrders: AdminDashboardOrder[];
	orderPipeline: { status: string; count: number; label: string }[];
}

export interface AdminDashboardOrder {
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

export async function getDashboardData(): Promise<DashboardData> {
	if (!process.env.DATABASE_URL) {
		return {
			kpis: { revenue30d: 0, revenuePrev30d: 0, orders30d: 0, ordersPrev30d: 0, aov30d: 0, aovPrev30d: 0, pendingPayments: 0, totalProducts: 0, inventoryValue: 0 },
			topProducts: [],
			countries: [],
			actionItems: [],
			recentActivity: [],
			dailyRevenue: [],
			recentOrders: [],
			orderPipeline: [],
		};
	}

	const now = new Date();
	const todayEnd = new Date(now);
	todayEnd.setHours(23, 59, 59, 999);
	const last30dFrom = daysAgo(30);
	const last30dTo = todayEnd;
	const prev30dFrom = daysAgo(60);
	const prev30dTo = daysAgo(30);

	const [
		last30dOrders,
		prev30dOrders,
		pendingPaymentOrders,
		allProducts,
		pendingInquiries,
		pendingReviews,
		recentContacts,
		allOrderItems,
	] = await Promise.all([
		prisma.order.findMany({
			where: { createdAt: { gte: last30dFrom, lte: last30dTo } },
			select: { total: true, status: true, createdAt: true, shippingCountry: true },
		}),
		prisma.order.findMany({
			where: { createdAt: { gte: prev30dFrom, lt: prev30dTo } },
			select: { total: true, status: true },
		}),
		prisma.order.count({ where: { status: "PENDING" } }),
		prisma.product.findMany({
			include: { variants: true },
			where: { active: true },
		}),
		prisma.mandapInquiry.count({ where: { paymentStatus: "PENDING" } }),
		prisma.review.count({ where: { approved: false } }),
		prisma.contactMessage.count({ where: { createdAt: { gte: daysAgo(7) } } }),
		prisma.orderItem.findMany({
			where: { order: { createdAt: { gte: last30dFrom, lte: last30dTo } } },
			include: { product: { select: { name: true, slug: true, image: true } } },
		}),
	]);

	const totalProducts = allProducts.length;
	const inventoryValue = allProducts.reduce(
		(total, product) => total + product.variants.reduce((variantTotal, variant) => variantTotal + variant.price * variant.stock, 0),
		0
	);

	const revenue30d = last30dOrders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((sum, o) => sum + o.total, 0);
	const revenuePrev30d = prev30dOrders
		.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status))
		.reduce((sum, o) => sum + o.total, 0);
	const orders30d = last30dOrders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).length;
	const ordersPrev30d = prev30dOrders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).length;
	const aov30d = orders30d > 0 ? revenue30d / orders30d : 0;
	const aovPrev30d = ordersPrev30d > 0 ? revenuePrev30d / ordersPrev30d : 0;

	const orderPipeline = ORDER_STATUSES.map((status) => ({
		status,
		count: last30dOrders.filter((o) => o.status === status).length,
		label: status.charAt(0) + status.slice(1).toLowerCase(),
	}));

	const productRevenueMap = new Map<string, { revenue: number; units: number; orders: number; name: string; slug: string; image: string | null }>();
	for (const item of allOrderItems) {
		const existing = productRevenueMap.get(item.productId) || { revenue: 0, units: 0, orders: 0, name: item.product.name, slug: item.product.slug, image: item.product.image };
		existing.revenue += item.unitPrice * item.quantity;
		existing.units += item.quantity;
		existing.orders += 1;
		productRevenueMap.set(item.productId, existing);
	}
	const topProducts: DashboardTopProduct[] = Array.from(productRevenueMap.entries())
		.map(([productId, data]) => ({
			productId,
			productName: data.name,
			productSlug: data.slug,
			productImage: data.image,
			revenue: data.revenue,
			unitsSold: data.units,
			orderCount: data.orders,
		}))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 5);

	const countryMap = new Map<string, { revenue: number; orderCount: number }>();
	for (const order of last30dOrders) {
		if (["CANCELLED", "REFUNDED"].includes(order.status)) continue;
		const country = order.shippingCountry || "Unknown";
		const existing = countryMap.get(country) || { revenue: 0, orderCount: 0 };
		existing.revenue += order.total;
		existing.orderCount += 1;
		countryMap.set(country, existing);
	}
	const countries: DashboardCountry[] = Array.from(countryMap.entries())
		.map(([country, data]) => ({ country, ...data }))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 5);

	const actionItems: DashboardActionItem[] = [];
	const pendingPayments = pendingPaymentOrders;
	if (pendingPayments > 0) {
		actionItems.push({
			type: "pending_payment",
			count: pendingPayments,
			label: "Awaiting payment",
			href: "/admin/orders",
			tone: "orange",
		});
	}
	if (pendingInquiries > 0) {
		actionItems.push({
			type: "pending_inquiry",
			count: pendingInquiries,
			label: "Pending inquiries",
			href: "/admin/custom-requests",
			tone: "blue",
		});
	}
	if (pendingReviews > 0) {
		actionItems.push({
			type: "pending_review",
			count: pendingReviews,
			label: "Reviews to moderate",
			href: "/admin/reviews",
			tone: "amber",
		});
	}
	const lowStockCount = allProducts.reduce((count, product) => count + product.variants.filter((v) => v.stock < 5).length, 0);
	if (lowStockCount > 0) {
		actionItems.push({
			type: "low_stock",
			count: lowStockCount,
			label: "Low stock variants",
			href: "/admin/products",
			tone: "red",
		});
	}
	if (recentContacts > 0) {
		actionItems.push({
			type: "new_contact",
			count: recentContacts,
			label: "New messages (7d)",
			href: "/admin",
			tone: "blue",
		});
	}

	const activities: DashboardActivity[] = [];

	const recentOrders = await getRecentOrders(8);
	for (const order of recentOrders) {
		activities.push({
			id: `order-${order.orderId}`,
			type: "order",
			title: `Order ${order.id}`,
			description: `${order.customer} — ${order.item}${order.variant && order.variant !== "Selected option" ? ` (${order.variant})` : ""}`,
			timestamp: new Date(order.date).toISOString(),
			href: `/admin/orders#order-${order.orderId}`,
		});
	}

	activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	const dailyRevenue: DashboardDailyRevenue[] = [];
	for (let i = 6; i >= 0; i--) {
		const dayStart = daysAgo(i);
		const dayEnd = new Date(dayStart);
		dayEnd.setHours(23, 59, 59, 999);
		const dayRevenue = last30dOrders
			.filter((o) => {
				const d = new Date(o.createdAt);
				return d >= dayStart && d <= dayEnd && !["CANCELLED", "REFUNDED"].includes(o.status);
			})
			.reduce((sum, o) => sum + o.total, 0);
		dailyRevenue.push({
			date: dayStart.toISOString(),
			label: dayStart.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
			revenue: dayRevenue,
		});
	}

	const recentOrdersTyped: AdminDashboardOrder[] = recentOrders.map((order) => ({
		...order,
		orderId: order.orderId,
	}));

	return {
		kpis: { revenue30d, revenuePrev30d, orders30d, ordersPrev30d, aov30d, aovPrev30d, pendingPayments, totalProducts, inventoryValue },
		topProducts,
		countries,
		actionItems,
		recentActivity: activities.slice(0, 8),
		dailyRevenue,
		recentOrders: recentOrdersTyped,
		orderPipeline,
	};
}
