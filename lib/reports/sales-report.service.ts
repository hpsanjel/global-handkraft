import { prisma } from "@/lib/prisma";

export type ReportGranularity = "day" | "week" | "month";

export interface SalesReportSummary {
	catalogRevenue: number;
	catalogOrderCount: number;
	catalogShipping: number;
	refundedAmount: number;
	refundedCount: number;
	cancelledCount: number;
	customDepositsReceived: number;
	customDepositsCount: number;
	customBalanceReceived: number;
	customBalanceCount: number;
	customTotalReceived: number;
	grandTotalReceived: number;
}

export interface SalesReportCountryBreakdown {
	country: string;
	orderCount: number;
	revenue: number;
}

export interface SalesReportTrendBucket {
	bucketStart: string;
	label: string;
	catalogRevenue: number;
	customRevenue: number;
}

export interface SalesReportLineItem {
	date: string;
	type: "Catalog Order" | "Custom Deposit" | "Custom Balance";
	reference: string;
	detail: string;
	country: string;
	amount: number;
	currency: string;
}

export interface SalesReport {
	from: string;
	to: string;
	granularity: ReportGranularity;
	summary: SalesReportSummary;
	byCountry: SalesReportCountryBreakdown[];
	trend: SalesReportTrendBucket[];
	lineItems: SalesReportLineItem[];
}

/** ≤31 days → daily buckets, ≤180 days → weekly, else monthly — the "daily…yearly" spread falls out of whatever range is picked rather than being seven separate reports. */
function resolveGranularity(from: Date, to: Date): ReportGranularity {
	const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
	if (days <= 31) return "day";
	if (days <= 180) return "week";
	return "month";
}

function startOfWeek(date: Date): Date {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const day = d.getUTCDay();
	const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
	d.setUTCDate(d.getUTCDate() + diff);
	return d;
}

function bucketFor(date: Date, granularity: ReportGranularity): { key: string; start: Date; label: string } {
	if (granularity === "day") {
		const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		return { key: start.toISOString(), start, label: start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) };
	}
	if (granularity === "week") {
		const start = startOfWeek(date);
		return { key: start.toISOString(), start, label: `Wk of ${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` };
	}
	const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
	return { key: start.toISOString(), start, label: start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) };
}

/**
 * Aggregates the two independent revenue sources in this app into one report:
 * `Order` rows (only ever created once Stripe payment succeeds, so every row
 * in range is real received money) and `MandapInquiryTransaction` rows (the
 * append-only ledger of custom-order deposit/balance charges — the *transaction*
 * table, not MandapInquiry.amountPaid, since only paidAt gives period-correct
 * "received within this window" figures rather than a running total).
 *
 * VAT is deliberately not computed anywhere here — no tax is calculated at
 * checkout in this app today (no Stripe automatic_tax, unused VATRate model),
 * so a VAT figure here would be fabricated. The report surfaces revenue,
 * shipping, and advance-payment figures only.
 */
export async function getSalesReport({ from, to }: { from: Date; to: Date }): Promise<SalesReport> {
	const granularity = resolveGranularity(from, to);

	const [orders, transactions] = await Promise.all([
		prisma.order.findMany({
			where: { createdAt: { gte: from, lt: to } },
			select: { orderNumber: true, createdAt: true, subtotal: true, shipping: true, total: true, status: true, shippingCountry: true, currency: true },
			orderBy: { createdAt: "asc" },
		}),
		prisma.mandapInquiryTransaction.findMany({
			where: { status: "PAID", paidAt: { gte: from, lt: to } },
			include: { inquiry: { select: { productName: true, referenceNumber: true, address: { select: { country: true } } } } },
			orderBy: { paidAt: "asc" },
		}),
	]);

	const summary: SalesReportSummary = {
		catalogRevenue: 0,
		catalogOrderCount: 0,
		catalogShipping: 0,
		refundedAmount: 0,
		refundedCount: 0,
		cancelledCount: 0,
		customDepositsReceived: 0,
		customDepositsCount: 0,
		customBalanceReceived: 0,
		customBalanceCount: 0,
		customTotalReceived: 0,
		grandTotalReceived: 0,
	};

	const countryMap = new Map<string, SalesReportCountryBreakdown>();
	const trendMap = new Map<string, SalesReportTrendBucket>();
	const lineItems: SalesReportLineItem[] = [];

	function addToCountry(country: string, revenue: number) {
		const existing = countryMap.get(country) ?? { country, orderCount: 0, revenue: 0 };
		existing.orderCount += 1;
		existing.revenue += revenue;
		countryMap.set(country, existing);
	}

	function addToTrend(date: Date, field: "catalogRevenue" | "customRevenue", amount: number) {
		const { key, start, label } = bucketFor(date, granularity);
		const bucket = trendMap.get(key) ?? { bucketStart: start.toISOString(), label, catalogRevenue: 0, customRevenue: 0 };
		bucket[field] += amount;
		trendMap.set(key, bucket);
	}

	for (const order of orders) {
		if (order.status === "REFUNDED") {
			summary.refundedAmount += order.total;
			summary.refundedCount += 1;
		} else if (order.status === "CANCELLED") {
			summary.cancelledCount += 1;
		} else {
			summary.catalogRevenue += order.total;
			summary.catalogOrderCount += 1;
			summary.catalogShipping += order.shipping;
			addToCountry(order.shippingCountry || "Unknown", order.total);
			addToTrend(order.createdAt, "catalogRevenue", order.total);
		}

		lineItems.push({
			date: order.createdAt.toISOString(),
			type: "Catalog Order",
			reference: order.orderNumber,
			detail: order.status,
			country: order.shippingCountry || "—",
			amount: order.total,
			currency: order.currency,
		});
	}

	for (const txn of transactions) {
		if (txn.kind === "DEPOSIT") {
			summary.customDepositsReceived += txn.amount;
			summary.customDepositsCount += 1;
		} else {
			summary.customBalanceReceived += txn.amount;
			summary.customBalanceCount += 1;
		}
		summary.customTotalReceived += txn.amount;

		const country = txn.inquiry.address?.country || "Unknown";
		addToCountry(country, txn.amount);
		if (txn.paidAt) addToTrend(txn.paidAt, "customRevenue", txn.amount);

		lineItems.push({
			date: (txn.paidAt ?? txn.createdAt).toISOString(),
			type: txn.kind === "DEPOSIT" ? "Custom Deposit" : "Custom Balance",
			reference: txn.inquiry.referenceNumber ?? txn.inquiryId,
			detail: txn.inquiry.productName,
			country,
			amount: txn.amount,
			currency: "NOK",
		});
	}

	summary.grandTotalReceived = summary.catalogRevenue + summary.customTotalReceived;

	const byCountry = Array.from(countryMap.values()).sort((a, b) => b.revenue - a.revenue);
	const trend = Array.from(trendMap.values()).sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
	lineItems.sort((a, b) => a.date.localeCompare(b.date));

	return { from: from.toISOString(), to: to.toISOString(), granularity, summary, byCountry, trend, lineItems };
}
