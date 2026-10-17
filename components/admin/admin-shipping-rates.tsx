"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Search, Truck, Sliders, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import type { ShippingConfig } from "@/lib/shipping-client";

export type ProductShippingItem = {
	id: string;
	name: string;
	slug: string;
	image: string;
	category: string;
	active: boolean;
	minPrice: number;
	maxPrice: number;
	shippingNorway: number | null;
	shippingInternational: number | null;
	freeShippingExcluded: boolean;
	isCustom: boolean;
};

type FilterTab = "all" | "custom" | "default";

export function AdminShippingRates() {
	const [config, setConfig] = useState<ShippingConfig>({
		norwayRate: 76,
		internationalRate: 200,
		freeShippingThreshold: 1500,
	});
	const [products, setProducts] = useState<ProductShippingItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Form state for defaults
	const [norwayRateInput, setNorwayRateInput] = useState("76");
	const [intlRateInput, setIntlRateInput] = useState("200");
	const [thresholdInput, setThresholdInput] = useState("1500");
	const [isSavingDefaults, setIsSavingDefaults] = useState(false);
	const [defaultsFeedback, setDefaultsFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	// Product filtering & search
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("ALL");
	const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>("all");

	// Product customization modal
	const [editingProduct, setEditingProduct] = useState<ProductShippingItem | null>(null);
	const [customEnabled, setCustomEnabled] = useState(false);
	const [customNorwayInput, setCustomNorwayInput] = useState("");
	const [customIntlInput, setCustomIntlInput] = useState("");
	const [customExcludedFromFree, setCustomExcludedFromFree] = useState(false);
	const [isSavingProduct, setIsSavingProduct] = useState(false);
	const [productFeedback, setProductFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/admin/shipping-rates", { cache: "no-store" });
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to load shipping rates.");
			}

			if (data.config) {
				setConfig(data.config);
				setNorwayRateInput(String(data.config.norwayRate));
				setIntlRateInput(String(data.config.internationalRate));
				setThresholdInput(String(data.config.freeShippingThreshold));
			}

			if (Array.isArray(data.products)) {
				setProducts(data.products);
			}
		} catch (error) {
			setDefaultsFeedback({
				type: "error",
				message: error instanceof Error ? error.message : "Unable to load data.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	// Save Store-wide default rates
	const handleSaveDefaults = async (e: React.FormEvent) => {
		e.preventDefault();
		setDefaultsFeedback(null);

		const norway = Number(norwayRateInput);
		const intl = Number(intlRateInput);
		const threshold = Number(thresholdInput);

		if (!Number.isFinite(norway) || norway < 0) {
			setDefaultsFeedback({ type: "error", message: "Norway shipping fee must be a valid non-negative number." });
			return;
		}
		if (!Number.isFinite(intl) || intl < 0) {
			setDefaultsFeedback({ type: "error", message: "International shipping fee must be a valid non-negative number." });
			return;
		}
		if (!Number.isFinite(threshold) || threshold < 0) {
			setDefaultsFeedback({ type: "error", message: "Free shipping threshold must be a valid non-negative number." });
			return;
		}

		try {
			setIsSavingDefaults(true);
			const res = await fetch("/api/admin/shipping-rates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update-defaults",
					config: {
						norwayRate: norway,
						internationalRate: intl,
						freeShippingThreshold: threshold,
					},
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to update default shipping rates.");
			}

			if (data.config) {
				setConfig(data.config);
			}
			if (Array.isArray(data.products)) {
				setProducts(data.products);
			}
			setDefaultsFeedback({ type: "success", message: "Default shipping rates saved successfully." });
		} catch (error) {
			setDefaultsFeedback({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to save default rates.",
			});
		} finally {
			setIsSavingDefaults(false);
		}
	};

	// Open edit modal for product
	const handleOpenProductEdit = (product: ProductShippingItem) => {
		setEditingProduct(product);
		setProductFeedback(null);
		const hasCustom = product.shippingNorway !== null || product.shippingInternational !== null || product.freeShippingExcluded;
		setCustomEnabled(hasCustom);
		setCustomNorwayInput(product.shippingNorway !== null ? String(product.shippingNorway) : "");
		setCustomIntlInput(product.shippingInternational !== null ? String(product.shippingInternational) : "");
		setCustomExcludedFromFree(product.freeShippingExcluded);
	};

	// Save custom rates for single product
	const handleSaveProductCustomization = async () => {
		if (!editingProduct) return;
		setProductFeedback(null);

		let norwayValue: number | null = null;
		let intlValue: number | null = null;
		let freeExcluded = false;

		if (customEnabled) {
			if (customNorwayInput.trim() !== "") {
				const num = Number(customNorwayInput.trim());
				if (!Number.isFinite(num) || num < 0) {
					setProductFeedback({ type: "error", message: "Custom Norway rate must be a valid non-negative number." });
					return;
				}
				norwayValue = num;
			}

			if (customIntlInput.trim() !== "") {
				const num = Number(customIntlInput.trim());
				if (!Number.isFinite(num) || num < 0) {
					setProductFeedback({ type: "error", message: "Custom International rate must be a valid non-negative number." });
					return;
				}
				intlValue = num;
			}

			freeExcluded = customExcludedFromFree;
		}

		try {
			setIsSavingProduct(true);
			const res = await fetch("/api/admin/shipping-rates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update-product",
					productId: editingProduct.id,
					shippingNorway: norwayValue,
					shippingInternational: intlValue,
					freeShippingExcluded: freeExcluded,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to save product shipping rate.");
			}

			if (Array.isArray(data.products)) {
				setProducts(data.products);
			}
			setEditingProduct(null);
		} catch (error) {
			setProductFeedback({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to update product.",
			});
		} finally {
			setIsSavingProduct(false);
		}
	};

	// Reset product to default rates
	const handleResetProduct = async () => {
		if (!editingProduct) return;
		if (!window.confirm(`Reset shipping for "${editingProduct.name}" to store defaults?`)) return;

		try {
			setIsSavingProduct(true);
			const res = await fetch("/api/admin/shipping-rates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reset-product",
					productId: editingProduct.id,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to reset product shipping.");
			}

			if (Array.isArray(data.products)) {
				setProducts(data.products);
			}
			setEditingProduct(null);
		} catch (error) {
			setProductFeedback({
				type: "error",
				message: error instanceof Error ? error.message : "Failed to reset product.",
			});
		} finally {
			setIsSavingProduct(false);
		}
	};

	// Unique categories
	const categories = useMemo(() => {
		const cats = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
		return cats.sort();
	}, [products]);

	// Filtered products list
	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const matchName = p.name.toLowerCase().includes(query);
				const matchCat = p.category.toLowerCase().includes(query);
				if (!matchName && !matchCat) return false;
			}

			if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
				return false;
			}

			if (activeFilterTab === "custom" && !p.isCustom) {
				return false;
			}
			if (activeFilterTab === "default" && p.isCustom) {
				return false;
			}

			return true;
		});
	}, [products, searchQuery, selectedCategory, activeFilterTab]);

	const customCount = useMemo(() => products.filter((p) => p.isCustom).length, [products]);
	const defaultCount = useMemo(() => products.filter((p) => !p.isCustom).length, [products]);

	return (
		<div className="space-y-8">
			<AdminPageHeader
				title="Shipping Rates"
				description="Set default shipping fees for Norway and International orders, configure the free shipping threshold, and customize shipping rates for specific products."
			/>

			{/* Section 1: Default Store-Wide Shipping Rates */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
								<Truck className="h-4 w-4" />
							</div>
							<h2 className="text-lg font-semibold text-slate-900">Default Shipping Rates</h2>
						</div>
						<p className="mt-1 text-sm text-slate-500">
							These base shipping rates apply to all store items unless a product has a custom rate override below.
						</p>
					</div>
					<div className="flex flex-wrap gap-2 text-xs font-medium">
						<span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-100">
							Norway: {config.norwayRate} NOK
						</span>
						<span className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-700 border border-sky-100">
							International: {config.internationalRate} NOK
						</span>
						<span className="rounded-lg bg-stone-100 px-2.5 py-1 text-stone-800 border border-stone-200">
							Free Shipping: {config.freeShippingThreshold > 0 ? `Over ${config.freeShippingThreshold.toLocaleString()} NOK` : "Disabled"}
						</span>
					</div>
				</div>

				{defaultsFeedback && (
					<div className="mt-4">
						<InlineAlert
							tone={defaultsFeedback.type}
							className={`rounded-xl border px-4 py-3 ${
								defaultsFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
							}`}
						>
							{defaultsFeedback.message}
						</InlineAlert>
					</div>
				)}

				<form onSubmit={handleSaveDefaults} className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
							Norway Shipping (NOK)
						</label>
						<p className="mt-0.5 text-xs text-slate-500">Standard domestic delivery fee within Norway.</p>
						<Input
							type="number"
							min="0"
							step="1"
							required
							className="mt-2 w-full rounded-xl border-slate-200 py-2.5 text-slate-900 focus:ring-stone-100"
							value={norwayRateInput}
							onChange={(e) => setNorwayRateInput(e.target.value)}
						/>
					</div>

					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
							International Shipping (NOK)
						</label>
						<p className="mt-0.5 text-xs text-slate-500">Standard delivery fee for orders outside Norway.</p>
						<Input
							type="number"
							min="0"
							step="1"
							required
							className="mt-2 w-full rounded-xl border-slate-200 py-2.5 text-slate-900 focus:ring-stone-100"
							value={intlRateInput}
							onChange={(e) => setIntlRateInput(e.target.value)}
						/>
					</div>

					<div className="sm:col-span-2 lg:col-span-1">
						<label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
							Free Shipping Threshold (NOK)
						</label>
						<p className="mt-0.5 text-xs text-slate-500">Free delivery when order total reaches this (0 to disable).</p>
						<Input
							type="number"
							min="0"
							step="1"
							required
							className="mt-2 w-full rounded-xl border-slate-200 py-2.5 text-slate-900 focus:ring-stone-100"
							value={thresholdInput}
							onChange={(e) => setThresholdInput(e.target.value)}
						/>
					</div>

					<div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
						<Button type="submit" variant="primary" disabled={isSavingDefaults || isLoading}>
							{isSavingDefaults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isSavingDefaults ? "Saving defaults..." : "Save default shipping rates"}
						</Button>
					</div>
				</form>
			</div>

			{/* Section 2: Products List & Customization */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-800">
								<Sliders className="h-4 w-4" />
							</div>
							<h2 className="text-lg font-semibold text-slate-900">Product Customizations</h2>
						</div>
						<p className="mt-1 text-sm text-slate-500">
							Customize shipping fees for individual products (e.g., bulky temples or fragile handicrafts).
						</p>
					</div>

					{/* Quick stats / summary pill */}
					<div className="text-xs text-slate-500">
						<span className="font-semibold text-slate-900">{products.length}</span> total products ·{" "}
						<span className="font-semibold text-emerald-700">{customCount}</span> custom ·{" "}
						<span className="font-semibold text-slate-700">{defaultCount}</span> default
					</div>
				</div>

				{/* Filter & Search Bar */}
				<div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => setActiveFilterTab("all")}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
								activeFilterTab === "all" ? "bg-[#1B365D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							All Products ({products.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveFilterTab("custom")}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
								activeFilterTab === "custom" ? "bg-[#1B365D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							Custom Rates ({customCount})
						</button>
						<button
							type="button"
							onClick={() => setActiveFilterTab("default")}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
								activeFilterTab === "default" ? "bg-[#1B365D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							Default Rates ({defaultCount})
						</button>
					</div>

					<div className="flex flex-col sm:flex-row items-center gap-3">
						{categories.length > 0 && (
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								aria-label="Filter by category"
								className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-stone-700 focus:ring-1 focus:ring-stone-100"
							>
								<option value="ALL">All Categories</option>
								{categories.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						)}

						<div className="relative w-full sm:w-64">
							<Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-600" />
							<input
								type="text"
								placeholder="Search products..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-stone-700 focus:ring-1 focus:ring-stone-100"
							/>
						</div>
					</div>
				</div>

				{/* Products Table */}
				<div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
					{isLoading ? (
						<div className="flex items-center justify-center p-12 text-sm text-slate-500">
							<Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-600" /> Loading products...
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="p-8 text-center text-sm text-slate-500">
							No products found matching your current filter.
						</div>
					) : (
						<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
							<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
								<tr>
									<th scope="col" className="px-4 py-3.5">
										Product
									</th>
									<th scope="col" className="px-4 py-3.5">
										Status
									</th>
									<th scope="col" className="px-4 py-3.5">
										Norway Shipping
									</th>
									<th scope="col" className="px-4 py-3.5">
										International Shipping
									</th>
									<th scope="col" className="px-4 py-3.5">
										Free Shipping
									</th>
									<th scope="col" className="px-4 py-3.5 text-right">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{filteredProducts.map((product) => {
									const effectiveNorway = product.shippingNorway ?? config.norwayRate;
									const effectiveIntl = product.shippingInternational ?? config.internationalRate;

									return (
										<tr key={product.id} className="hover:bg-slate-50/70 transition">
											<td className="px-4 py-3.5">
												<div className="flex items-center gap-3">
													{product.image ? (
														<Image
															src={product.image}
															alt=""
															width={40}
															height={40}
															className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
														/>
													) : (
														<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-600">
															No pic
														</div>
													)}
													<div className="min-w-0">
														<p className="truncate font-semibold text-slate-900 max-w-xs">{product.name}</p>
														<p className="text-xs text-slate-500">{product.category}</p>
													</div>
												</div>
											</td>

											<td className="px-4 py-3.5 whitespace-nowrap">
												{product.isCustom ? (
													<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
														<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
														Custom
													</span>
												) : (
													<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
														Default
													</span>
												)}
											</td>

											<td className="px-4 py-3.5 whitespace-nowrap">
												<div className="flex items-baseline gap-1.5">
													<span className="font-medium text-slate-900">{effectiveNorway} NOK</span>
													{product.shippingNorway !== null ? (
														<span className="text-[11px] font-semibold text-emerald-600">(Custom)</span>
													) : (
														<span className="text-[11px] text-slate-600">(Default)</span>
													)}
												</div>
											</td>

											<td className="px-4 py-3.5 whitespace-nowrap">
												<div className="flex items-baseline gap-1.5">
													<span className="font-medium text-slate-900">{effectiveIntl} NOK</span>
													{product.shippingInternational !== null ? (
														<span className="text-[11px] font-semibold text-emerald-600">(Custom)</span>
													) : (
														<span className="text-[11px] text-slate-600">(Default)</span>
													)}
												</div>
											</td>

											<td className="px-4 py-3.5 whitespace-nowrap">
												{product.freeShippingExcluded ? (
													<span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
														Excluded
													</span>
												) : (
													<span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
														Eligible
													</span>
												)}
											</td>

											<td className="px-4 py-3.5 text-right whitespace-nowrap">
												<Button
													type="button"
													variant="secondary"
													className="text-xs py-1 px-3"
													onClick={() => handleOpenProductEdit(product)}
												>
													{product.isCustom ? "Edit Rates" : "Customize"}
												</Button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Product Customization Modal */}
			<Dialog open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)}>
				{editingProduct && (
					<div className="p-6 space-y-5">
						<div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
							<div className="min-w-0">
								<DialogTitle className="text-lg font-semibold text-slate-900 truncate">
									Customize Shipping: {editingProduct.name}
								</DialogTitle>
								<p className="mt-1 text-xs text-slate-500">
									Category: {editingProduct.category} · Price: {editingProduct.minPrice} NOK
								</p>
							</div>
							<DialogClose className="rounded-lg p-1 text-slate-600 hover:bg-slate-100" />
						</div>

						{productFeedback && (
							<InlineAlert
								tone={productFeedback.type}
								className={`rounded-xl border px-3 py-2 text-xs ${
									productFeedback.type === "success"
										? "border-emerald-200 bg-emerald-50 text-emerald-800"
										: "border-red-200 bg-red-50 text-red-800"
								}`}
							>
								{productFeedback.message}
							</InlineAlert>
						)}

						{/* Toggle custom shipping */}
						<label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer">
							<input
								type="checkbox"
								checked={customEnabled}
								onChange={(e) => setCustomEnabled(e.target.checked)}
								className="h-4 w-4 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
							/>
							<div>
								<p className="text-sm font-semibold text-slate-900">Enable custom shipping rates for this product</p>
								<p className="text-xs text-slate-500">
									Overrides the default store shipping fees ({config.norwayRate} NOK Norway, {config.internationalRate} NOK International).
								</p>
							</div>
						</label>

						{customEnabled ? (
							<div className="space-y-4 rounded-xl border border-slate-200 p-4 bg-white">
								<div>
									<label className="block text-xs font-semibold text-slate-700">
										Custom Norway Shipping (NOK)
									</label>
									<p className="text-xs text-slate-500 mt-0.5">
										Leave blank to inherit the store default ({config.norwayRate} NOK).
									</p>
									<Input
										type="number"
										min="0"
										step="1"
										placeholder={`Default: ${config.norwayRate}`}
										value={customNorwayInput}
										onChange={(e) => setCustomNorwayInput(e.target.value)}
										className="mt-1.5"
									/>
								</div>

								<div>
									<label className="block text-xs font-semibold text-slate-700">
										Custom International Shipping (NOK)
									</label>
									<p className="text-xs text-slate-500 mt-0.5">
										Leave blank to inherit the store default ({config.internationalRate} NOK).
									</p>
									<Input
										type="number"
										min="0"
										step="1"
										placeholder={`Default: ${config.internationalRate}`}
										value={customIntlInput}
										onChange={(e) => setCustomIntlInput(e.target.value)}
										className="mt-1.5"
									/>
								</div>

								<div className="pt-2 border-t border-slate-100">
									<label className="flex items-start gap-2.5 cursor-pointer">
										<input
											type="checkbox"
											checked={customExcludedFromFree}
											onChange={(e) => setCustomExcludedFromFree(e.target.checked)}
											className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
										/>
										<div>
											<p className="text-xs font-semibold text-slate-900">
												Exclude from free shipping threshold
											</p>
											<p className="text-xs text-slate-500">
												If checked, shipping fee for this item is always charged even if the order total exceeds {config.freeShippingThreshold} NOK.
											</p>
										</div>
									</label>
								</div>
							</div>
						) : (
							<div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
								This product currently uses store defaults:
								<ul className="mt-1.5 list-disc list-inside space-y-0.5">
									<li>Norway: {config.norwayRate} NOK</li>
									<li>International: {config.internationalRate} NOK</li>
									<li>Free shipping applies on orders over {config.freeShippingThreshold} NOK</li>
								</ul>
							</div>
						)}

						<div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
							{editingProduct.isCustom ? (
								<Button
									type="button"
									variant="destructive"
									disabled={isSavingProduct}
									onClick={handleResetProduct}
									className="text-xs"
								>
									<RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to Default
								</Button>
							) : (
								<div />
							)}

							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="secondary"
									onClick={() => setEditingProduct(null)}
									disabled={isSavingProduct}
									className="text-xs"
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="primary"
									onClick={handleSaveProductCustomization}
									disabled={isSavingProduct}
									className="text-xs"
								>
									{isSavingProduct && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
									Save Changes
								</Button>
							</div>
						</div>
					</div>
				)}
			</Dialog>
		</div>
	);
}
