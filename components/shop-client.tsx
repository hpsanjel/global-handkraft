"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categories } from "@/lib/data/products";
import { useProductsCatalog } from "@/lib/products-catalog";

export function ShopClient() {
	const products = useProductsCatalog();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");

	const filteredProducts = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return products.filter((product) => {
			const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
			const searchableText = [product.name, product.shortDescription, product.description, product.category, product.material].join(" ").toLowerCase();
			const matchesSearch = normalizedQuery === "" || searchableText.includes(normalizedQuery);

			return matchesCategory && matchesSearch;
		});
	}, [searchQuery, selectedCategory]);

	return (
		<>
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Collection</p>
					<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Handcrafted pieces for sacred spaces</h1>
				</div>
				<div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
					{filteredProducts.length} of {products.length} pieces shown
				</div>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
				<aside className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Filters</p>
					<div className="mt-4 space-y-5">
						<div>
							<label htmlFor="shop-search" className="text-sm font-medium text-stone-700">
								Search
							</label>
							<input id="shop-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, material, or style" className="mt-2 w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 outline-none transition focus:border-stone-400" />
						</div>

						<div>
							<p className="text-sm font-medium text-stone-700">Category</p>
							<div className="mt-2 flex flex-wrap gap-2">
								<button type="button" className={`rounded-full px-3 py-2 text-sm transition ${selectedCategory === "All" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`} onClick={() => setSelectedCategory("All")}>
									All
								</button>
								{categories.map((category) => (
									<button type="button" key={category} className={`rounded-full px-3 py-2 text-sm transition ${selectedCategory === category ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`} onClick={() => setSelectedCategory(category)}>
										{category}
									</button>
								))}
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-stone-700">Price</p>
							<p className="mt-2 text-sm text-stone-600">€89 – €399</p>
						</div>
					</div>
				</aside>

				<div className="space-y-4">
					{filteredProducts.length === 0 ? (
						<div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
							<p className="text-lg font-semibold text-stone-900">No pieces match your search yet.</p>
							<p className="mt-2 text-sm text-stone-600">Try a broader keyword or reset the category filter.</p>
							<button
								type="button"
								className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
								onClick={() => {
									setSearchQuery("");
									setSelectedCategory("All");
								}}
							>
								Reset filters
							</button>
						</div>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{filteredProducts.map((product) => (
								<Link key={product.id} href={`/product/${product.slug}`} className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1">
									<div className="aspect-[4/5] rounded-[1.25rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
									<div className="mt-5">
										<div className="flex items-center justify-between gap-3">
											<h2 className="text-lg font-semibold text-stone-900">{product.name}</h2>
											<p className="text-sm font-semibold text-stone-900">From €{product.variants[0].price}</p>
										</div>
										<p className="mt-2 text-sm leading-7 text-stone-600">{product.shortDescription}</p>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
