"use client";

import { useMemo } from "react";
import { useProductsCatalog } from "@/lib/products-catalog";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

const lowStockThreshold = 5;

export function AdminLiveStats() {
	const products = useProductsCatalog();

	const { inventoryValue, productCount, totalVariants, lowStockCount } = useMemo(() => {
		const inventoryValueTotal = products.reduce((total, product) => total + product.variants.reduce((variantTotal, variant) => variantTotal + variant.price * variant.stock, 0), 0);
		const lowStockVariantCount = products.reduce((count, product) => count + product.variants.filter((variant) => variant.stock < lowStockThreshold).length, 0);
		const variantsCount = products.reduce((count, product) => count + product.variants.length, 0);

		return {
			inventoryValue: inventoryValueTotal,
			productCount: products.length,
			totalVariants: variantsCount,
			lowStockCount: lowStockVariantCount,
		};
	}, [products]);

	const stats = [
		{ label: "Inventory value", value: currencyFormatter.format(inventoryValue) },
		{ label: "Products", value: productCount.toString() },
		{ label: "Variants", value: totalVariants.toString() },
		{ label: "Low stock", value: lowStockCount.toString() },
	];

	return (
		<div className="mt-8 grid gap-4 md:grid-cols-4">
			{stats.map((stat) => (
				<div key={stat.label} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-stone-500">{stat.label}</p>
					<p className="mt-3 text-3xl font-semibold text-stone-900">{stat.value}</p>
				</div>
			))}
		</div>
	);
}
