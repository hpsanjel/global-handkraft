"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardCountry } from "@/lib/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "NOK",
	maximumFractionDigits: 0,
});

export function CountriesTable({ countries }: { countries: DashboardCountry[] }) {
	if (countries.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Top countries</h3>
				<p className="mt-4 text-sm text-slate-500">No orders yet.</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
				<div className="min-w-0">
					<h3 className="text-base font-semibold text-slate-900">Top countries</h3>
					<p className="mt-0.5 text-sm text-slate-500">Revenue breakdown</p>
				</div>
				<Link href="/admin/reports" className="flex shrink-0 items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-700">
					Reports
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
							<th className="px-6 py-3 font-semibold">Country</th>
							<th className="px-6 py-3 text-right font-semibold">Orders</th>
							<th className="px-6 py-3 text-right font-semibold">Revenue</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{countries.map((country) => (
							<tr key={country.country} className="transition hover:bg-slate-50">
								<td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900">{country.country}</td>
								<td className="whitespace-nowrap px-6 py-3 text-right text-slate-600">{country.orderCount}</td>
								<td className="whitespace-nowrap px-6 py-3 text-right font-semibold text-slate-900">
									{currencyFormatter.format(country.revenue)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
