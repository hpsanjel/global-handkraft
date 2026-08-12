"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardTopProduct } from "@/lib/admin-dashboard";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "NOK",
	maximumFractionDigits: 0,
});

export function TopProducts({ products }: { products: DashboardTopProduct[] }) {
	if (products.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Top products</h3>
				<p className="mt-4 text-sm text-slate-500">No sales data yet.</p>
			</div>
		);
	}

	const maxRevenue = Math.max(...products.map((p) => p.revenue));

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<div className="min-w-0">
					<h3 className="text-base font-semibold text-slate-900">Top products</h3>
					<p className="mt-0.5 text-sm text-slate-500">Best sellers last 30 days</p>
				</div>
				<Link href="/admin/reports" className="flex shrink-0 items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-700">
					View all
					<ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			<div className="space-y-4">
				{products.map((product, index) => {
					const widthPercent = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;

					return (
						<Link
							key={product.productId}
							href={`/admin/products?product=${encodeURIComponent(product.productId)}`}
							className="group block"
						>
							<div className="flex items-start gap-3">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
									{index + 1}
								</span>
								{product.productImage && (
									<img
										src={product.productImage}
										alt=""
										className="h-10 w-10 shrink-0 rounded-lg object-cover"
									/>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-slate-900 group-hover:text-stone-700">
										{product.productName}
									</p>
									<p className="mt-0.5 text-xs text-slate-500">
										{product.unitsSold} sold · {product.orderCount} orders
									</p>
									<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
										<div
											className="h-full rounded-full bg-stone-600 transition-all"
											style={{ width: `${widthPercent}%` }}
										/>
									</div>
								</div>
								<div className="max-w-[35%] shrink-0 text-right">
									<p className="wrap-break-word text-sm font-semibold text-slate-900">{currencyFormatter.format(product.revenue)}</p>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
