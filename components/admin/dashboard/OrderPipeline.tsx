"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import type { DashboardOrderPipeline } from "@/lib/admin-dashboard";

const STATUS_COLORS: Record<string, string> = {
	PENDING: "bg-amber-500",
	PAID: "bg-sky-500",
	PROCESSING: "bg-blue-500",
	SHIPPED: "bg-indigo-500",
	DELIVERED: "bg-emerald-500",
	CANCELLED: "bg-red-500",
	REFUNDED: "bg-orange-500",
};

export function OrderPipeline({ pipeline }: { pipeline: DashboardOrderPipeline[] }) {
	const total = pipeline.reduce((sum, p) => sum + p.count, 0);

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div className="min-w-0">
					<h3 className="text-base font-semibold text-slate-900">Order pipeline</h3>
					<p className="mt-0.5 text-sm text-slate-500">{total} orders in last 30 days</p>
				</div>
				<Link href="/admin/orders" className="flex shrink-0 items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-700">
					View all
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			<div className="space-y-3">
				{pipeline.map((item) => {
					const percentage = total > 0 ? (item.count / total) * 100 : 0;
					const color = STATUS_COLORS[item.status] || "bg-slate-400";

					return (
						<div key={item.status} className="flex items-center gap-2 sm:gap-3">
							<div className="flex w-20 shrink-0 items-center gap-1.5 sm:w-32 sm:gap-2">
								<span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
								<span className="truncate text-sm text-slate-700">{item.label}</span>
							</div>
							<div className="min-w-0 flex-1">
								<div className="h-2 overflow-hidden rounded-full bg-slate-100">
									<div
										className={`h-full rounded-full ${color} transition-all`}
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</div>
							<div className="flex shrink-0 items-baseline gap-1 whitespace-nowrap text-right">
								<span className="text-sm font-semibold text-slate-900">{item.count}</span>
								<span className="text-xs text-slate-500">({percentage.toFixed(0)}%)</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
