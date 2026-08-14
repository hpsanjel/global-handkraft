"use client";

import { useEffect, useState } from "react";
import { Download, Package, RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
import { SalesTrendChart } from "@/components/admin/SalesTrendChart";
import type { SalesReport } from "@/lib/reports/sales-report.service";
import { InlineAlert } from "@/components/ui/inline-alert";

function rollingDays(days: number) {
	const to = new Date();
	const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
	return { from, to };
}

function rollingMonths(months: number) {
	const to = new Date();
	const from = new Date(to);
	from.setMonth(from.getMonth() - months);
	return { from, to };
}

function startOfToday() {
	const to = new Date();
	const from = new Date();
	from.setHours(0, 0, 0, 0);
	return { from, to };
}

const PRESETS: { label: string; getRange: () => { from: Date; to: Date } }[] = [
	{ label: "Today", getRange: startOfToday },
	{ label: "Last 7 days", getRange: () => rollingDays(7) },
	{ label: "Last 15 days", getRange: () => rollingDays(15) },
	{ label: "Last 30 days", getRange: () => rollingDays(30) },
	{ label: "Last 3 months", getRange: () => rollingMonths(3) },
	{ label: "Last 6 months", getRange: () => rollingMonths(6) },
	{ label: "Last 12 months", getRange: () => rollingMonths(12) },
];

function toDateInputValue(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function formatMoney(amount: number): string {
	return new Intl.NumberFormat("en-GB", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(amount);
}

/**
 * Fetches and renders the report body for one fixed range. Mounted fresh (via
 * a `key` on the range in the parent) every time the range changes, so
 * `loading` starts `true` from its initial state on every range switch rather
 * than needing a synchronous setState(true) inside the effect body — avoids
 * the cascading-render anti-pattern the fetch-on-mount alternative would hit.
 */
function ReportResults({ from, to }: { from: Date; to: Date }) {
	const [report, setReport] = useState<SalesReport | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

		fetch(`/api/admin/reports/sales?${params.toString()}`, { cache: "no-store" })
			.then(async (response) => {
				const payload = await response.json();
				if (!response.ok) throw new Error(payload.error ?? "Unable to load report.");
				if (active) setReport(payload);
			})
			.catch((err) => {
				if (active) setError(err instanceof Error ? err.message : "Unable to load report.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- from/to are fixed for this component's lifetime (a fresh instance mounts per range via the parent's `key`)
	}, []);

	const summary = report?.summary;

	if (error) {
		return (
			<InlineAlert tone="error" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
				{error}
			</InlineAlert>
		);
	}

	return (
		<div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AdminStatCard label="Catalog revenue" value={summary ? formatMoney(summary.catalogRevenue) : "—"} icon={Package} hint={summary ? `${summary.catalogOrderCount} orders` : undefined} />
			</div>

			{summary && (summary.refundedCount > 0 || summary.cancelledCount > 0) ? (
				<AdminStatCard label="Refunded / cancelled" value={formatMoney(summary.refundedAmount)} icon={RotateCcw} tone="red" hint={`${summary.refundedCount} refunded, ${summary.cancelledCount} cancelled`} />
			) : null}

			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-base font-semibold text-slate-900">Revenue over time</h2>
				<p className="mt-1 text-sm text-slate-500">Bucketed by {report?.granularity ?? "day"} for the selected range.</p>
				<div className="mt-4">
					<SalesTrendChart trend={report?.trend ?? []} currency="NOK" />
				</div>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-base font-semibold text-slate-900">By shipping country</h2>
				<p className="mt-1 text-sm text-slate-500">Revenue and order count — useful for export/logistics planning.</p>
				<div className="mt-4 overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
								<th scope="col" className="pb-2 font-medium">Country</th>
								<th scope="col" className="pb-2 font-medium">Orders</th>
								<th scope="col" className="pb-2 text-right font-medium">Revenue</th>
							</tr>
						</thead>
						<tbody>
							{report && report.byCountry.length > 0 ? (
								report.byCountry.map((row) => (
									<tr key={row.country} className="border-b border-slate-100 last:border-0">
										<td className="py-2 text-slate-700">{row.country}</td>
										<td className="py-2 text-slate-600">{row.orderCount}</td>
										<td className="py-2 text-right font-medium text-slate-900">{formatMoney(row.revenue)}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={3} className="py-6 text-center text-slate-600">
										No revenue in this period.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export default function AdminReportsPage() {
	const [range, setRange] = useState(() => rollingDays(30));
	const [activePreset, setActivePreset] = useState("Last 30 days");

	const exportUrl = `/api/admin/reports/sales/export?from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}`;

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Reports"
				description="Sales and shipping revenue for the selected period. VAT is not included — no tax is currently calculated at checkout."
				actions={
					<a href={exportUrl} className="inline-flex items-center gap-2 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#152a4a]">
						<Download className="h-4 w-4" />
						Export CSV
					</a>
				}
			/>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="flex flex-wrap items-center gap-2">
					{PRESETS.map((preset) => (
						<button
							key={preset.label}
							type="button"
							onClick={() => {
								setActivePreset(preset.label);
								setRange(preset.getRange());
							}}
							className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activePreset === preset.label ? "bg-[#1B365D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
						>
							{preset.label}
						</button>
					))}
				</div>
				<div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
					<span>Custom range:</span>
					<label htmlFor="reports-range-from" className="sr-only">
						Start date
					</label>
					<input
						id="reports-range-from"
						type="date"
						value={toDateInputValue(range.from)}
						onChange={(event) => {
							if (!event.target.value) return;
							setActivePreset("Custom");
							setRange((prev) => ({ ...prev, from: new Date(event.target.value) }));
						}}
						className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
					/>
					<span>to</span>
					<label htmlFor="reports-range-to" className="sr-only">
						End date
					</label>
					<input
						id="reports-range-to"
						type="date"
						value={toDateInputValue(range.to)}
						onChange={(event) => {
							if (!event.target.value) return;
							const to = new Date(event.target.value);
							to.setHours(23, 59, 59, 999);
							setActivePreset("Custom");
							setRange((prev) => ({ ...prev, to }));
						}}
						className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
					/>
				</div>
			</div>

			<ReportResults key={`${range.from.getTime()}-${range.to.getTime()}`} from={range.from} to={range.to} />
		</div>
	);
}
