"use client";

import Link from "next/link";
import { Wallet, ShoppingCart, TrendingUp, Package, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { AdminStatCard } from "@/components/admin/stat-card";
import type { DashboardKPIs } from "@/lib/admin-dashboard";
import { formatTrend } from "@/lib/admin-dashboard-utils";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "NOK",
	maximumFractionDigits: 0,
});

function TrendBadge({ trend }: { trend: ReturnType<typeof formatTrend> }) {
	if (trend.direction === "flat") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
				<Minus className="h-3 w-3" />
				{trend.value}
			</span>
		);
	}
	if (trend.isPositive) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
				<ArrowUpRight className="h-3 w-3" />
				{trend.value}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
			<ArrowDownRight className="h-3 w-3" />
			{trend.value}
		</span>
	);
}

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
	const revenueTrend = formatTrend(kpis.revenue30d, kpis.revenuePrev30d);
	const ordersTrend = formatTrend(kpis.orders30d, kpis.ordersPrev30d);
	const aovTrend = formatTrend(kpis.aov30d, kpis.aovPrev30d);

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<AdminStatCard
				label="Revenue (30d)"
				value={currencyFormatter.format(kpis.revenue30d)}
				icon={Wallet}
				tone="orange"
				href="/admin/reports"
				hint={
					<span className="mt-2 flex items-center gap-2">
						<TrendBadge trend={revenueTrend} />
						<span className="text-xs text-slate-400">vs prev 30d</span>
					</span>
				}
			/>
			<AdminStatCard
				label="Orders (30d)"
				value={kpis.orders30d.toString()}
				icon={ShoppingCart}
				tone="blue"
				href="/admin/orders"
				hint={
					<span className="mt-2 flex items-center gap-2">
						<TrendBadge trend={ordersTrend} />
						<span className="text-xs text-slate-400">vs prev 30d</span>
					</span>
				}
			/>
			<AdminStatCard
				label="Avg. order value"
				value={currencyFormatter.format(kpis.aov30d)}
				icon={TrendingUp}
				tone="green"
				href="/admin/reports"
				hint={
					<span className="mt-2 flex items-center gap-2">
						<TrendBadge trend={aovTrend} />
						<span className="text-xs text-slate-400">vs prev 30d</span>
					</span>
				}
			/>
			<AdminStatCard
				label="Active products"
				value={kpis.totalProducts.toString()}
				icon={Package}
				tone="neutral"
				href="/admin/products"
				hint={`${currencyFormatter.format(kpis.inventoryValue)} inventory value`}
			/>
		</div>
	);
}
