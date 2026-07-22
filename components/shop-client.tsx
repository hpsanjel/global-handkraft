"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories } from "@/lib/data/products";
import { useProductsCatalog } from "@/lib/products-catalog";

const PAGE_SIZE = 8;

const normalizeCategory = (value: string) => value.trim().toLowerCase();

type ShopFilterConfig = {
	showMaterial: boolean;
	showWoodType: boolean;
	showSize: boolean;
	showColor: boolean;
};

const categoryAliases: Record<string, string> = {
	Temples: "Handcrafted Wooden Temples",
	Clothes: "Traditional Clothes",
	Pooja: "Pooja Items",
	Mandap: "Pooja Mandap",
	Gifts: "Gift Collection",
	"New Arrivals": "New Arrivals",
};

const getDisplayCategoryLabel = (value: string) => {
	const matched = Object.entries(categoryAliases).find(([, actualCategory]) => normalizeCategory(actualCategory) === normalizeCategory(value));
	return matched?.[0] ?? value;
};

const resolveSelectedCategory = (value: string) => categoryAliases[value] ?? value;

const defaultShopFilterConfig: ShopFilterConfig = {
	showMaterial: true,
	showWoodType: true,
	showSize: true,
	showColor: true,
};

function getShopFilterConfig(category: string): ShopFilterConfig {
	switch (category) {
		case "Traditional Clothes":
			return {
				...defaultShopFilterConfig,
				showWoodType: false,
			};
		default:
			return defaultShopFilterConfig;
	}
}

export function ShopClient() {
	const clothesSubcategories = ["Men", "Women", "Kids", "Family Sets", "Festivals"] as const;

	const products = useProductsCatalog();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedClothesSubcategory, setSelectedClothesSubcategory] = useState("All");
	const [selectedMaterial, setSelectedMaterial] = useState("All");
	const [selectedWoodType, setSelectedWoodType] = useState("All");
	const [selectedSize, setSelectedSize] = useState("All");
	const [selectedColor, setSelectedColor] = useState("All");
	const [availability, setAvailability] = useState("All");
	const [sortBy, setSortBy] = useState("newest");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [minPrice, setMinPrice] = useState(0);
	const [maxPrice, setMaxPrice] = useState(0);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const categoryParam = searchParams.get("category");

	const availablePrices = useMemo(() => products.flatMap((product) => product.variants.map((variant) => variant.price)), [products]);

	const availablePriceRange = useMemo(() => {
		if (availablePrices.length === 0) {
			return { min: 0, max: 0 };
		}

		return {
			min: Math.min(...availablePrices),
			max: Math.max(...availablePrices),
		};
	}, [availablePrices]);

	const getProductPrice = (product: (typeof products)[number]) => product.variants[0]?.price ?? 0;

	const materialOptions = useMemo(() => {
		const set = new Set<string>();
		products.forEach((product) => {
			(product.materials ?? [product.material]).forEach((material) => set.add(material));
		});
		return Array.from(set).sort();
	}, [products]);

	const woodTypeOptions = useMemo(() => {
		const set = new Set<string>();
		products.forEach((product) => {
			if (product.woodType && product.woodType !== "Not Applicable") {
				set.add(product.woodType);
			}
		});
		return Array.from(set).sort();
	}, [products]);

	const sizeOptions = useMemo(() => {
		const set = new Set<string>();
		products.forEach((product) => {
			if (product.sizeLabel) {
				set.add(product.sizeLabel);
			}
			product.variants.forEach((variant) => set.add(variant.name));
		});
		return Array.from(set).sort();
	}, [products]);

	const colorOptions = useMemo(() => {
		const set = new Set<string>();
		products.forEach((product) => {
			if (product.color) {
				set.add(product.color);
			}
		});
		return Array.from(set).sort();
	}, [products]);

	const resolvedSelectedCategory = resolveSelectedCategory(selectedCategory);
	const activeFilterConfig = getShopFilterConfig(resolvedSelectedCategory);

	useEffect(() => {
		setMinPrice(availablePriceRange.min);
		setMaxPrice(availablePriceRange.max);
	}, [availablePriceRange.max, availablePriceRange.min]);

	useEffect(() => {
		if (!categoryParam) {
			setSelectedCategory((current) => (current === "All" ? current : "All"));
			return;
		}

		const matchedCategory = categories.find((category) => {
			const normalizedParam = normalizeCategory(categoryParam);
			return normalizeCategory(category) === normalizedParam || normalizeCategory(resolveSelectedCategory(category)) === normalizedParam;
		});
		setSelectedCategory((current) => {
			if (!matchedCategory) {
				return current === "All" ? current : "All";
			}

			return current === matchedCategory ? current : matchedCategory;
		});
	}, [categoryParam]);

	const handleCategoryChange = (nextCategory: string) => {
		setSelectedCategory(nextCategory);

		const nextParams = new URLSearchParams(searchParams.toString());
		if (nextCategory === "All") {
			nextParams.delete("category");
		} else {
			nextParams.set("category", nextCategory);
		}

		const query = nextParams.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
	};

	useEffect(() => {
		if (!activeFilterConfig.showWoodType) {
			setSelectedWoodType("All");
		}
	}, [activeFilterConfig.showWoodType]);

	useEffect(() => {
		if (resolvedSelectedCategory !== "Traditional Clothes" && selectedClothesSubcategory !== "All") {
			setSelectedClothesSubcategory("All");
		}
	}, [resolvedSelectedCategory, selectedClothesSubcategory]);

	const filteredProducts = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		const hasSearchQuery = normalizedQuery.length > 0;
		const normalizedMinPrice = Number.isFinite(minPrice) ? minPrice : availablePriceRange.min;
		const normalizedMaxPrice = Number.isFinite(maxPrice) ? maxPrice : availablePriceRange.max;

		const classifyClothesSubcategory = (product: (typeof products)[number]) => {
			const text = [product.name, product.shortDescription, product.description].join(" ").toLowerCase();

			if (text.includes("kids") || text.includes("children") || text.includes("child")) {
				return "Kids";
			}
			if (text.includes("family") || text.includes("set")) {
				return "Family Sets";
			}
			if (text.includes("festival") || text.includes("festive") || text.includes("ceremony")) {
				return "Festivals";
			}
			if (text.includes("women") || text.includes("saree") || text.includes("blouse")) {
				return "Women";
			}
			if (text.includes("men") || text.includes("menswear") || text.includes("daura") || text.includes("suruwal")) {
				return "Men";
			}

			return "Festivals";
		};

		const filtered = products.filter((product) => {
			const matchesCategory = selectedCategory === "All" || normalizeCategory(product.category) === normalizeCategory(resolvedSelectedCategory);
			const matchesClothesSubcategory = resolvedSelectedCategory !== "Traditional Clothes" || selectedClothesSubcategory === "All" || classifyClothesSubcategory(product) === selectedClothesSubcategory;
			const productMaterials = product.materials ?? [product.material];
			const productMinimumPrice = product.variants.length > 0 ? Math.min(...product.variants.map((variant) => variant.price)) : 0;
			const stockCount = product.variants.reduce((sum, variant) => sum + variant.stock, 0);

			const matchesMaterial = selectedMaterial === "All" || productMaterials.includes(selectedMaterial);
			const matchesWoodType = !activeFilterConfig.showWoodType || selectedWoodType === "All" || product.woodType === selectedWoodType;
			const matchesSize = !activeFilterConfig.showSize || selectedSize === "All" || product.sizeLabel === selectedSize || product.variants.some((variant) => variant.name === selectedSize);
			const matchesColor = !activeFilterConfig.showColor || selectedColor === "All" || product.color === selectedColor;
			const matchesAvailability = availability === "All" || (availability === "In stock" && stockCount > 0) || (availability === "Low stock" && stockCount > 0 && stockCount <= 5) || (availability === "Out of stock" && stockCount === 0);
			const matchesPrice = product.variants.length === 0 || (productMinimumPrice >= normalizedMinPrice && productMinimumPrice <= normalizedMaxPrice);

			const searchableText = [product.name, product.shortDescription, product.description, product.category, product.material, ...(product.materials ?? []), product.woodType ?? "", product.color ?? ""].join(" ").toLowerCase();
			const matchesSearch = hasSearchQuery ? searchableText.includes(normalizedQuery) : true;

			return matchesCategory && matchesClothesSubcategory && matchesMaterial && matchesWoodType && matchesSize && matchesColor && matchesAvailability && matchesPrice && matchesSearch;
		});

		const sorted = [...filtered];
		switch (sortBy) {
			case "lowest":
				sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b));
				break;
			case "highest":
				sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a));
				break;
			case "best-rated":
				sorted.sort((a, b) => b.rating - a.rating);
				break;
			case "popularity":
				sorted.sort((a, b) => b.reviewCount - a.reviewCount);
				break;
			case "newest":
			default:
				sorted.sort((a, b) => b.id.localeCompare(a.id));
				break;
		}

		return sorted;
	}, [activeFilterConfig.showColor, activeFilterConfig.showSize, activeFilterConfig.showWoodType, availability, availablePriceRange.max, availablePriceRange.min, maxPrice, minPrice, products, resolvedSelectedCategory, searchQuery, selectedCategory, selectedClothesSubcategory, selectedColor, selectedMaterial, selectedSize, selectedWoodType, sortBy]);

	const resetFilters = () => {
		setSearchQuery("");
		handleCategoryChange("All");
		setSelectedClothesSubcategory("All");
		setSelectedMaterial("All");
		setSelectedWoodType("All");
		setSelectedSize("All");
		setSelectedColor("All");
		setAvailability("All");
		setSortBy("newest");
		setMinPrice(availablePriceRange.min);
		setMaxPrice(availablePriceRange.max);
		setVisibleCount(PAGE_SIZE);
	};

	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
	}, [searchQuery, selectedCategory, selectedClothesSubcategory, selectedMaterial, selectedWoodType, selectedSize, selectedColor, availability, sortBy, minPrice, maxPrice]);

	const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
	const hasMoreProducts = visibleCount < filteredProducts.length;
	const matchingResultsCount = filteredProducts.length;

	const loadMoreProducts = () => {
		if (isLoadingMore || !hasMoreProducts) {
			return;
		}

		setIsLoadingMore(true);
		if (loadMoreTimeoutRef.current) {
			clearTimeout(loadMoreTimeoutRef.current);
		}

		loadMoreTimeoutRef.current = setTimeout(() => {
			setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredProducts.length));
			setIsLoadingMore(false);
		}, 220);
	};

	const renderFilters = (options: { showCloseButton: boolean }) => (
		<div className="space-y-5">
			<div>
				<label htmlFor="shop-search" className="text-sm font-medium text-stone-700">
					Search
				</label>
				<input id="shop-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, material, or style" className="mt-2 w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 outline-none transition focus:border-stone-400" />
			</div>
			<div>
				<label className="text-sm font-medium text-stone-700" htmlFor="shop-category">
					Category
				</label>
				<select id="shop-category" value={selectedCategory} onChange={(event) => handleCategoryChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
					<option>All</option>
					{categories.map((category) => (
						<option key={category} value={category}>
							{category}
						</option>
					))}
				</select>
			</div>
			{selectedCategory === "Traditional Clothes" ? (
				<div>
					<label className="text-sm font-medium text-stone-700" htmlFor="shop-clothes-subcategory">
						Clothes subcategory
					</label>
					<select id="shop-clothes-subcategory" value={selectedClothesSubcategory} onChange={(event) => setSelectedClothesSubcategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
						<option>All</option>
						{clothesSubcategories.map((subcategory) => (
							<option key={subcategory} value={subcategory}>
								{subcategory}
							</option>
						))}
					</select>
				</div>
			) : null}
			<div>
				<label className="text-sm font-medium text-stone-700" htmlFor="shop-sort">
					Sort by
				</label>
				<select id="shop-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
					<option value="highest">Highest Price</option>
					<option value="lowest">Lowest Price</option>
				</select>
			</div>

			<div>
				<label className="text-sm font-medium text-stone-700" htmlFor="shop-min-price">
					Min price
				</label>
				<input id="shop-min-price" type="number" value={minPrice} min={availablePriceRange.min} max={availablePriceRange.max} onChange={(event) => setMinPrice(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900" />
			</div>

			<div>
				<label className="text-sm font-medium text-stone-700" htmlFor="shop-max-price">
					Max price
				</label>
				<input id="shop-max-price" type="number" value={maxPrice} min={availablePriceRange.min} max={availablePriceRange.max} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900" />
			</div>

			<button type="button" className="w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800" onClick={resetFilters}>
				Reset all filters
			</button>

			{options.showCloseButton ? (
				<button type="button" className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100" onClick={() => setIsMobileFiltersOpen(false)}>
					Close filters
				</button>
			) : null}
		</div>
	);

	useEffect(() => {
		return () => {
			if (loadMoreTimeoutRef.current) {
				clearTimeout(loadMoreTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!hasMoreProducts || !loadMoreRef.current) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMoreProducts();
				}
			},
			{ rootMargin: "180px" },
		);

		observer.observe(loadMoreRef.current);

		return () => {
			observer.disconnect();
		};
	}, [hasMoreProducts, isLoadingMore, filteredProducts.length]);

	return (
		<>
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Collection</p>
					<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Handcrafted collections for sacred spaces</h1>
				</div>
				<div className="flex flex-wrap items-center gap-2 md:justify-end">
					<button type="button" className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-100 md:hidden" onClick={() => setIsMobileFiltersOpen(true)}>
						<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
							<path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
						</svg>
						Filter
					</button>
					<div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
						{visibleProducts.length} of {filteredProducts.length} shown
					</div>
					<div className="rounded-full border border-stone-200 bg-white p-1">
						<button type="button" onClick={() => setViewMode("grid")} className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === "grid" ? "bg-stone-900 text-white" : "text-stone-600"}`}>
							Grid
						</button>
						<button type="button" onClick={() => setViewMode("list")} className={`rounded-full px-3 py-1 text-xs font-semibold ${viewMode === "list" ? "bg-stone-900 text-white" : "text-stone-600"}`}>
							List
						</button>
					</div>
				</div>
			</div>

			<div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
				<aside className="hidden rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm lg:block">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Filters</p>
					<div className="mt-4">{renderFilters({ showCloseButton: false })}</div>
				</aside>

				{isMobileFiltersOpen ? (
					<div className="fixed inset-0 z-50 bg-stone-950/40 lg:hidden" onClick={() => setIsMobileFiltersOpen(false)}>
						<div className="absolute bottom-0 left-0 right-0 flex h-[80vh] w-full flex-col rounded-t-[1.75rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
							<div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Filters</p>
									<p className="mt-1 text-xs text-stone-500">Live updates while you filter</p>
									<p className="mt-2 text-xs font-semibold text-[#1B365D]">{matchingResultsCount} results match your current search and filters</p>
								</div>
								<button type="button" className="rounded-full border border-stone-200 bg-white p-2 text-stone-700 shadow-sm transition hover:bg-stone-100" onClick={() => setIsMobileFiltersOpen(false)} aria-label="Close filters">
									<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
										<path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
									</svg>
								</button>
							</div>
							<div className="flex-1 overflow-y-auto px-5 py-5">{renderFilters({ showCloseButton: true })}</div>
							<div className="border-t border-stone-200 px-5 py-4">
								<button type="button" className="w-full rounded-full bg-[#1B365D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152d4c]" onClick={() => setIsMobileFiltersOpen(false)}>
									Show {matchingResultsCount} results
								</button>
							</div>
						</div>
					</div>
				) : null}

				<div className="space-y-4">
					{filteredProducts.length === 0 ? (
						<div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
							<p className="text-lg font-semibold text-stone-900">No pieces match your search yet.</p>
							<p className="mt-2 text-sm text-stone-600">Try a broader keyword or reset the category filter.</p>
							<button type="button" className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700" onClick={resetFilters}>
								Reset filters
							</button>
						</div>
					) : (
						<div className={viewMode === "grid" ? "grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-3" : "space-y-4"}>
							{visibleProducts.map((product) => (
								<Link key={product.id} href={`/product/${product.slug}`} className={`relative rounded-[1.75rem] bg-white  md:transition md:hover:-translate-y-1 ${viewMode === "list" ? "flex gap-5" : ""}`}>
									<div className={`${viewMode === "list" ? "h-28 w-28 shrink-0" : "mx-auto aspect-4/5"} rounded-t-[1.25rem] bg-cover bg-center`} style={{ backgroundImage: `url('${product.image}')` }} />
									<div className="min-w-0 flex-1 p-4 sm:px-6 sm:py-4">
										<h2 className="text-lg font-semibold text-stone-900">{product.name}</h2>
										{/* <p
											className="mt-2 text-sm md:leading-7 text-stone-600"
											style={{
												display: "-webkit-box",
												WebkitLineClamp: 2,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
											}}
										>
											{product.shortDescription}
										</p> */}
										<div className="mt-3 flex items-center justify-between gap-3">
											<p className="text-sm font-semibold text-stone-900">{product.variants[0] ? `From €${product.variants[0].price}` : "View details"}</p>
											<span className="inline-flex items-center rounded-full bg-[#F7931E] px-3 py-1 text-xs font-semibold text-white">Buy</span>
										</div>

										<div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
											<span className="absolute top-4 right-6 rounded-full border border-stone-200 bg-stone-50 px-2 py-1">{getDisplayCategoryLabel(product.category)}</span>
										</div>
									</div>
								</Link>
							))}

							{isLoadingMore
								? Array.from({ length: viewMode === "grid" ? 2 : 1 }).map((_, index) => (
										<div key={`loading-card-${index}`} className={`rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm ${viewMode === "list" ? "flex gap-5" : ""}`}>
											<div className={`${viewMode === "list" ? "h-28 w-28 shrink-0" : "mx-auto w-11/12 aspect-4/5"} animate-pulse rounded-[1.25rem] bg-stone-200`} />
											<div className="mt-5 min-w-0 flex-1 space-y-3">
												<div className="h-5 w-2/3 animate-pulse rounded-full bg-stone-200" />
												<div className="h-4 w-full animate-pulse rounded-full bg-stone-100" />
												<div className="h-4 w-4/5 animate-pulse rounded-full bg-stone-100" />
											</div>
										</div>
									))
								: null}
						</div>
					)}

					{hasMoreProducts ? (
						<div className="flex flex-col items-center gap-3 py-4">
							<div ref={loadMoreRef} className="h-2 w-full" aria-hidden="true" />
							<button type="button" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60" onClick={loadMoreProducts} disabled={isLoadingMore}>
								{isLoadingMore ? "Loading..." : "Load more"}
							</button>
						</div>
					) : null}
				</div>
			</div>
		</>
	);
}
