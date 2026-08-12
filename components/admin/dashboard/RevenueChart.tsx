"use client";

import { useMemo } from "react";
import type { DashboardDailyRevenue } from "@/lib/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "NOK",
	maximumFractionDigits: 0,
});

export function RevenueChart({ dailyRevenue }: { dailyRevenue: DashboardDailyRevenue[] }) {
	const maxRevenue = useMemo(() => Math.max(...dailyRevenue.map((d) => d.revenue), 1), [dailyRevenue]);

	if (dailyRevenue.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Revenue trend</h3>
				<p className="mt-4 text-sm text-slate-500">No revenue data yet.</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-slate-900">Revenue trend</h3>
				<p className="mt-0.5 text-sm text-slate-500">Last 7 days</p>
			</div>

			<div className="flex items-end justify-between gap-2">
				{dailyRevenue.map((day) => {
					const heightPercent = (day.revenue / maxRevenue) * 100;
					const isToday = day.label.includes("Today") || day.label === new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

					return (
						<div key={day.date} className="flex flex-1 flex-col items-center gap-2">
							<div className="relative w-full">
								<div
									className={`w-full rounded-t-lg transition-all ${
										isToday ? "bg-stone-700" : "bg-stone-400 hover:bg-stone-500"
									}`}
									style={{ height: `${Math.max(heightPercent, 4)}%`, minHeight: "8px" }}
									title={currencyFormatter.format(day.revenue)}
								/>
							</div>
							<span className={`text-xs ${isToday ? "font-semibold text-slate-900" : "text-slate-500"}`}>
								{day.label.split(" ")[0]}
							</span>
						</div>
					);
				})}
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
				<div className="min-w-0">
					<p className="text-xs text-slate-500">7-day total</p>
					<p className="wrap-break-word text-lg font-semibold text-slate-900">
						{currencyFormatter.format(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0))}
					</p>
				</div>
				<div className="min-w-0 text-right">
					<p className="text-xs text-slate-500">Daily avg</p>
					<p className="wrap-break-word text-lg font-semibold text-slate-900">
						{currencyFormatter.format(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenue.length)}
					</p>
				</div>
			</div>
		</div>
	);
}
