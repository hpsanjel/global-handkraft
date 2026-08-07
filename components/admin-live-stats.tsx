"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, Package, Layers, AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { useProductsCatalog } from "@/lib/products-catalog";
import { AdminStatCard } from "@/components/admin/stat-card";

const currencyFormatter = new Intl.NumberFormat("nb-NO", {
	style: "currency",
	currency: "NOK",
	maximumFractionDigits: 0,
});

const lowStockThreshold = 5;

export function AdminLiveStats() {
	const products = useProductsCatalog();
	const [lowStockOpen, setLowStockOpen] = useState(false);

	const { inventoryValue, productCount, totalVariants, lowStockItems } = useMemo(() => {
		const inventoryValueTotal = products.reduce((total, product) => total + product.variants.reduce((variantTotal, variant) => variantTotal + variant.price * variant.stock, 0), 0);
		const variantsCount = products.reduce((count, product) => count + product.variants.length, 0);
		const lowStock = products
			.flatMap((product) =>
				product.variants
					.filter((variant) => variant.stock < lowStockThreshold)
					.map((variant) => ({
						productId: product.id,
						productName: product.name,
						variantName: variant.name,
						stock: variant.stock,
					})),
			)
			.sort((a, b) => a.stock - b.stock);

		return {
			inventoryValue: inventoryValueTotal,
			productCount: products.length,
			totalVariants: variantsCount,
			lowStockItems: lowStock,
		};
	}, [products]);

	const hasLowStock = lowStockItems.length > 0;

	return (
		<div className="space-y-3">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminStatCard label="Inventory value" value={currencyFormatter.format(inventoryValue)} icon={Wallet} tone="orange" />
				<AdminStatCard label="Products" value={productCount.toString()} icon={Package} tone="neutral" />
				<AdminStatCard label="Variants" value={totalVariants.toString()} icon={Layers} tone="neutral" />

				<button
					type="button"
					onClick={() => hasLowStock && setLowStockOpen((open) => !open)}
					aria-expanded={lowStockOpen}
					className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${hasLowStock ? "border-slate-200 hover:border-red-200 hover:shadow-md" : "border-slate-200 cursor-default"}`}
				>
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-slate-500">Low stock</p>
							<p className="mt-2 text-2xl font-semibold text-slate-900">{lowStockItems.length}</p>
							<p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
								{hasLowStock ? (
									<>
										Below {lowStockThreshold} units · tap to view
										<ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${lowStockOpen ? "rotate-180" : ""}`} />
									</>
								) : (
									"All variants healthy"
								)}
							</p>
						</div>
						<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasLowStock ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
							{hasLowStock ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
						</span>
					</div>
				</button>
			</div>

			{lowStockOpen && hasLowStock ? (
				<div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
					<div className="flex items-center justify-between gap-3 px-1 pb-3">
						<p className="text-sm font-semibold text-slate-900">Variants running low</p>
						<p className="text-xs text-slate-500">Sorted by lowest stock first</p>
					</div>
					<div className="space-y-1.5">
						{lowStockItems.slice(0, 8).map((item) => (
							<Link
								key={`${item.productId}-${item.variantName}`}
								href={`/admin/products?product=${encodeURIComponent(item.productId)}`}
								className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm transition hover:bg-slate-50"
							>
								<span className="min-w-0 truncate text-slate-700">
									<span className="font-medium text-slate-900">{item.productName}</span>
									<span className="text-slate-400"> · {item.variantName}</span>
								</span>
								<span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${item.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.stock === 0 ? "Out of stock" : `${item.stock} left`}</span>
							</Link>
						))}
					</div>
					{lowStockItems.length > 8 ? <p className="mt-2 px-1 text-xs text-slate-500">+{lowStockItems.length - 8} more low-stock variants — open a product to restock.</p> : null}
				</div>
			) : null}
		</div>
	);
}
