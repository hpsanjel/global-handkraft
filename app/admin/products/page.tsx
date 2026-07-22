"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { categories, products as initialProducts } from "@/lib/data/products";
import { productsCatalogStorageKey, saveProductsCatalog } from "@/lib/products-catalog";
import type { Product, ProductAddon, ProductVariant } from "@/types/store";

type CategoryFormConfig = {
	showWoodType: boolean;
	showMaterials: boolean;
	showSizeLabel: boolean;
	showColor: boolean;
	showDimensions: boolean;
	showWeight: boolean;
	showHandcraftedStory: boolean;
	showHandmadeProcess: boolean;
	showCareInstructions: boolean;
	showSpecifications: boolean;
	materialsLabel: string;
	sizeLabel: string;
	colorLabel: string;
	dimensionsLabel: string;
	weightLabel: string;
	handcraftedStoryLabel: string;
	handmadeProcessLabel: string;
	careInstructionsLabel: string;
	specificationsLabel: string;
	defaultMaterial: string;
	defaultWoodType?: string;
	defaultSizeLabel: string;
	defaultColor: string;
	defaultDimensions: string;
	defaultWeight: string;
	defaultHandcraftedStory: string;
	defaultHandmadeProcess: string;
	defaultCareInstructions: string;
	defaultSpecifications: string[];
};

const defaultCategoryConfig: CategoryFormConfig = {
	showWoodType: false,
	showMaterials: true,
	showSizeLabel: true,
	showColor: true,
	showDimensions: false,
	showWeight: false,
	showHandcraftedStory: false,
	showHandmadeProcess: false,
	showCareInstructions: false,
	showSpecifications: false,
	materialsLabel: "Materials",
	sizeLabel: "Size label",
	colorLabel: "Color",
	dimensionsLabel: "Dimensions",
	weightLabel: "Weight",
	handcraftedStoryLabel: "Handcrafted story",
	handmadeProcessLabel: "Handmade process",
	careInstructionsLabel: "Care instructions",
	specificationsLabel: "Specifications",
	defaultMaterial: "Mixed Artisan Materials",
	defaultSizeLabel: "Standard",
	defaultColor: "Natural",
	defaultDimensions: "Add product dimensions",
	defaultWeight: "Add product weight",
	defaultHandcraftedStory: "Describe the story behind this collection.",
	defaultHandmadeProcess: "Describe the artisan process.",
	defaultCareInstructions: "Use a soft cloth and avoid prolonged moisture exposure.",
	defaultSpecifications: ["Add a product specification"],
};

function getCategoryFormConfig(category: string): CategoryFormConfig {
	switch (category) {
		case "Traditional Clothes":
			return {
				...defaultCategoryConfig,
				showWoodType: false,
				materialsLabel: "Fabric and weave",
				sizeLabel: "Fit / size",
				colorLabel: "Color / pattern",
				dimensionsLabel: "Garment measurements",
				weightLabel: "Fabric weight",
				defaultMaterial: "Cotton Silk",
				defaultSizeLabel: "M / L / XL",
				defaultColor: "Festive tone",
				defaultDimensions: "Bust, length, sleeve, and waist measurements",
				defaultWeight: "Lightweight",
				defaultHandcraftedStory: "Traditional attire crafted for ceremonies, gifting, and festive wear.",
				defaultHandmadeProcess: "Cutting, tailoring, embroidery, and finishing are completed by skilled garment artisans.",
				defaultCareInstructions: "Hand wash or dry clean based on fabric type.",
				defaultSpecifications: ["One set per order", "Multiple sizes available"],
			};
		case "Pooja Items":
			return {
				...defaultCategoryConfig,
				showWoodType: false,
				materialsLabel: "Metal, wood, or ritual materials",
				sizeLabel: "Pack / set size",
				colorLabel: "Finish",
				dimensionsLabel: "Item dimensions",
				weightLabel: "Pack weight",
				defaultMaterial: "Brass / Copper / Natural",
				defaultSizeLabel: "Set size",
				defaultColor: "Brass / Copper",
				defaultDimensions: "Set dimensions or single-item dimensions",
				defaultWeight: "Standard pack weight",
				defaultHandcraftedStory: "Essential ritual items crafted for daily worship and festival use.",
				defaultHandmadeProcess: "Casting, polishing, carving, and ritual finishing by artisans.",
				defaultCareInstructions: "Dry thoroughly after use and store in a dry place.",
				defaultSpecifications: ["Suitable for daily pooja", "Gift ready packaging available"],
			};
		case "Pooja Mandap":
			return {
				...defaultCategoryConfig,
				showWoodType: true,
				materialsLabel: "Framework materials",
				sizeLabel: "Mandap size",
				colorLabel: "Finish / drape color",
				dimensionsLabel: "Footprint and height",
				weightLabel: "Frame weight",
				defaultMaterial: "Wood & Metal Framework",
				defaultWoodType: "Teak",
				defaultSizeLabel: "Indoor / Outdoor",
				defaultColor: "Natural wood and gold accent",
				defaultDimensions: "Footprint, height, and ceiling clearance",
				defaultWeight: "Frame weight",
				defaultHandcraftedStory: "Modular mandap solutions designed for ceremonies, temples, and events.",
				defaultHandmadeProcess: "Framework assembly, carving, finishing, and decorative fitting are completed by artisan teams.",
				defaultCareInstructions: "Store dry, wipe after events, and inspect fittings before use.",
				defaultSpecifications: ["Modular assembly", "Indoor and outdoor options"],
			};
		case "Gift Collection":
		case "New Arrivals":
		case "Festival Specials":
			return {
				...defaultCategoryConfig,
				showWoodType: false,
				materialsLabel: "Materials",
				sizeLabel: "Pack / collection size",
				colorLabel: "Theme color",
				dimensionsLabel: "Dimensions",
				weightLabel: "Weight",
				defaultMaterial: "Mixed Artisan Materials",
				defaultSizeLabel: "Standard",
				defaultColor: "Seasonal / festive",
				defaultDimensions: "Add product dimensions",
				defaultWeight: "Add product weight",
				defaultHandcraftedStory: "Curated collection selected for gifting, seasonal launches, and festive occasions.",
				defaultHandmadeProcess: "Sourcing, packaging, and finishing are tailored to the collection theme.",
				defaultCareInstructions: "Follow product-specific care instructions and keep packaging intact for gifting.",
				defaultSpecifications: ["Seasonal collection", "Gift ready"],
			};
		case "Handcrafted Wooden Temples":
		default:
			return {
				...defaultCategoryConfig,
				showWoodType: true,
				materialsLabel: "Wood and finish materials",
				sizeLabel: "Temple size",
				colorLabel: "Finish color",
				dimensionsLabel: "Temple dimensions",
				weightLabel: "Temple weight",
				defaultMaterial: "Sheesham Wood",
				defaultWoodType: "Teak",
				defaultSizeLabel: "Standard",
				defaultColor: "Natural Wood",
				defaultDimensions: "Width, height, and depth",
				defaultWeight: "Add product weight",
				defaultHandcraftedStory: "Handcrafted temple collection made for home worship and sacred interiors.",
				defaultHandmadeProcess: "Wood selection, carving, sanding, assembly, and protective finishing completed by artisans.",
				defaultCareInstructions: "Keep dry, dust with a soft cloth, and avoid prolonged sunlight or moisture.",
				defaultSpecifications: ["Hand carved details", "Built for devotional use"],
			};
	}
}

function applyCategoryDefaults(product: Product, category: string): Product {
	const config = getCategoryFormConfig(category);

	return {
		...product,
		category,
		material: product.material || config.defaultMaterial,
		materials: config.showMaterials ? (product.materials?.length ? product.materials : [config.defaultMaterial]) : undefined,
		woodType: config.showWoodType ? (product.woodType ?? config.defaultWoodType) : undefined,
		sizeLabel: config.showSizeLabel ? (product.sizeLabel ?? config.defaultSizeLabel) : undefined,
		color: config.showColor ? (product.color ?? config.defaultColor) : undefined,
		dimensions: config.showDimensions ? (product.dimensions ?? config.defaultDimensions) : undefined,
		weight: config.showWeight ? (product.weight ?? config.defaultWeight) : undefined,
		handcraftedStory: config.showHandcraftedStory ? (product.handcraftedStory ?? config.defaultHandcraftedStory) : undefined,
		handmadeProcess: config.showHandmadeProcess ? (product.handmadeProcess ?? config.defaultHandmadeProcess) : undefined,
		careInstructions: config.showCareInstructions ? (product.careInstructions ?? config.defaultCareInstructions) : undefined,
		specifications: config.showSpecifications ? (product.specifications?.length ? product.specifications : config.defaultSpecifications) : undefined,
	};
}

function buildCategoryDraft(product: Product, category: string): Product {
	const config = getCategoryFormConfig(category);

	return {
		...product,
		category,
		material: config.defaultMaterial,
		materials: config.showMaterials ? [config.defaultMaterial] : undefined,
		woodType: config.showWoodType ? config.defaultWoodType : undefined,
		sizeLabel: config.defaultSizeLabel,
		color: config.defaultColor,
		dimensions: config.showDimensions ? config.defaultDimensions : undefined,
		weight: config.showWeight ? config.defaultWeight : undefined,
		handcraftedStory: config.showHandcraftedStory ? config.defaultHandcraftedStory : undefined,
		handmadeProcess: config.showHandmadeProcess ? config.defaultHandmadeProcess : undefined,
		careInstructions: config.showCareInstructions ? config.defaultCareInstructions : undefined,
		specifications: config.showSpecifications ? config.defaultSpecifications : undefined,
	};
}

function createEmptyProductForCategory(category: string): Product {
	const id = `product-${Date.now()}-${Math.round(Math.random() * 1000)}`;
	const baseProduct: Product = {
		id,
		slug: "new-product",
		name: "New product",
		shortDescription: "Add a short description",
		description: "Add a detailed product description",
		category,
		material: "",
		image: "/images/temple-1.webp",
		gallery: ["/images/temple-1.webp"],
		rating: 0,
		reviewCount: 0,
		featured: false,
		variants: [],
		addons: [],
		shippingInfo: "Ships within 3-5 business days",
		returnPolicy: "Free returns within 14 days",
	};

	return buildCategoryDraft(baseProduct, category);
}

function createEmptyProduct(): Product {
	return createEmptyProductForCategory(categories[0] ?? "Handcrafted Wooden Temples");
}

function createEmptyVariant(): ProductVariant {
	return {
		id: `variant-${Date.now()}-${Math.round(Math.random() * 1000)}`,
		name: "New size",
		price: 0,
		width: "",
		height: "",
		depth: "",
		weight: "",
		stock: 0,
		sku: "",
		shippingNote: "",
	};
}

function createEmptyAddon(): ProductAddon {
	return {
		id: `addon-${Date.now()}-${Math.round(Math.random() * 1000)}`,
		name: "New add-on",
		price: 0,
		description: "",
	};
}

export default function AdminProductsPage() {
	const [productsState, setProductsState] = useState<Product[]>(initialProducts);
	const [selectedProductId, setSelectedProductId] = useState<string>(initialProducts[0]?.id ?? "");
	const [draftProduct, setDraftProduct] = useState<Product | null>(initialProducts[0] ?? null);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(productsCatalogStorageKey);
			if (stored) {
				const parsed = JSON.parse(stored) as Product[];
				if (Array.isArray(parsed) && parsed.length > 0) {
					setProductsState(parsed);
					setSelectedProductId(parsed[0].id);
					setDraftProduct(parsed[0]);
					setHasLoaded(true);
					return;
				}
			}
		} catch {
			// Fallback to the seeded catalog when storage is not readable.
		}

		setHasLoaded(true);
	}, []);

	useEffect(() => {
		if (!hasLoaded) {
			return;
		}

		try {
			saveProductsCatalog(productsState);
		} catch {
			setSaveFeedback({ type: "error", message: "Products could not be saved to local storage. Please try again." });
		}
	}, [hasLoaded, productsState]);

	useEffect(() => {
		if (!productsState.length) {
			setSelectedProductId("");
			setDraftProduct(null);
			return;
		}

		if (!selectedProductId || !productsState.some((product) => product.id === selectedProductId)) {
			const fallback = productsState[0];
			setSelectedProductId(fallback.id);
			setDraftProduct(fallback);
			return;
		}

		const currentProduct = productsState.find((product) => product.id === selectedProductId);
		if (currentProduct) {
			setDraftProduct(currentProduct);
		}
	}, [productsState, selectedProductId]);

	const selectProduct = (productId: string) => {
		setSelectedProductId(productId);
		const nextProduct = productsState.find((product) => product.id === productId);
		if (nextProduct) {
			setDraftProduct(nextProduct);
		}
	};

	const updateDraftField = <K extends keyof Product>(key: K, value: Product[K]) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, [key]: value } : current));
	};

	const updateProductCategory = (category: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? buildCategoryDraft(current, category) : current));
	};

	const updateVariant = (variantId: string, key: keyof ProductVariant, value: string | number) => {
		setSaveFeedback(null);
		setDraftProduct((current) => {
			if (!current) {
				return current;
			}

			return {
				...current,
				variants: current.variants.map((variant) => (variant.id === variantId ? { ...variant, [key]: value } : variant)),
			};
		});
	};

	const updateAddon = (addonId: string, key: keyof ProductAddon, value: string | number) => {
		setSaveFeedback(null);
		setDraftProduct((current) => {
			if (!current) {
				return current;
			}

			return {
				...current,
				addons: current.addons.map((addon) => (addon.id === addonId ? { ...addon, [key]: value } : addon)),
			};
		});
	};

	const addVariant = () => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, variants: [...current.variants, createEmptyVariant()] } : current));
	};

	const addAddon = () => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, addons: [...current.addons, createEmptyAddon()] } : current));
	};

	const removeVariant = (variantId: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, variants: current.variants.filter((variant) => variant.id !== variantId) } : current));
	};

	const removeAddon = (addonId: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, addons: current.addons.filter((addon) => addon.id !== addonId) } : current));
	};

	const saveProduct = () => {
		if (!draftProduct) {
			setSaveFeedback({ type: "error", message: "There is no product selected to save." });
			return;
		}

		const categoryConfig = getCategoryFormConfig(draftProduct.category);
		const categoryNormalizedProduct = applyCategoryDefaults(draftProduct, draftProduct.category);

		const normalizedProduct: Product = {
			...categoryNormalizedProduct,
			slug:
				draftProduct.slug ||
				draftProduct.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, ""),
			gallery: draftProduct.gallery.length > 0 ? draftProduct.gallery : [draftProduct.image],
			materials: categoryConfig.showMaterials ? (categoryNormalizedProduct.materials ?? [categoryNormalizedProduct.material]).map((entry) => entry.trim()).filter(Boolean) : undefined,
			woodType: categoryConfig.showWoodType ? categoryNormalizedProduct.woodType?.trim() || undefined : undefined,
			sizeLabel: categoryConfig.showSizeLabel ? categoryNormalizedProduct.sizeLabel?.trim() || undefined : undefined,
			color: categoryConfig.showColor ? categoryNormalizedProduct.color?.trim() || undefined : undefined,
			dimensions: categoryConfig.showDimensions ? categoryNormalizedProduct.dimensions?.trim() || undefined : undefined,
			weight: categoryConfig.showWeight ? categoryNormalizedProduct.weight?.trim() || undefined : undefined,
			handcraftedStory: categoryConfig.showHandcraftedStory ? categoryNormalizedProduct.handcraftedStory?.trim() || undefined : undefined,
			handmadeProcess: categoryConfig.showHandmadeProcess ? categoryNormalizedProduct.handmadeProcess?.trim() || undefined : undefined,
			careInstructions: categoryConfig.showCareInstructions ? categoryNormalizedProduct.careInstructions?.trim() || undefined : undefined,
			specifications: categoryConfig.showSpecifications ? (categoryNormalizedProduct.specifications ?? []).map((entry) => entry.trim()).filter(Boolean) : undefined,
			variants: draftProduct.variants.filter((variant) => variant.name.trim()),
			addons: draftProduct.addons.filter((addon) => addon.name.trim()),
		};

		const existingIndex = productsState.findIndex((product) => product.id === normalizedProduct.id);
		const nextProducts = existingIndex >= 0 ? productsState.map((product, index) => (index === existingIndex ? normalizedProduct : product)) : [normalizedProduct, ...productsState];

		try {
			saveProductsCatalog(nextProducts);
			setSaveFeedback({ type: "success", message: `${normalizedProduct.name} has been saved.` });
		} catch {
			setSaveFeedback({ type: "error", message: "Product could not be saved. Please try again." });
			return;
		}

		setProductsState(nextProducts);
		setSelectedProductId(normalizedProduct.id);
		setDraftProduct(normalizedProduct);
	};

	const addNewProduct = () => {
		setSaveFeedback(null);
		const nextProduct = createEmptyProduct();
		setProductsState((current) => [nextProduct, ...current]);
		setSelectedProductId(nextProduct.id);
		setDraftProduct(nextProduct);
	};

	const deleteProduct = (productId: string) => {
		setSaveFeedback(null);
		const targetProduct = productsState.find((product) => product.id === productId);
		if (!targetProduct) {
			return;
		}

		const confirmed = window.confirm(`Delete "${targetProduct.name}" from the catalog?`);
		if (!confirmed) {
			return;
		}

		const nextProducts = productsState.filter((product) => product.id !== productId);
		setProductsState(nextProducts);

		if (nextProducts.length > 0) {
			const fallback = nextProducts[0];
			setSelectedProductId(fallback.id);
			setDraftProduct(fallback);
		} else {
			setSelectedProductId("");
			setDraftProduct(null);
		}
	};

	const currentProduct = draftProduct ?? (selectedProductId ? (productsState.find((product) => product.id === selectedProductId) ?? null) : null);
	const activeCategoryConfig = getCategoryFormConfig(currentProduct?.category ?? categories[0] ?? "Handcrafted Wooden Temples");

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Manage products</h1>
						<p className="mt-2 max-w-2xl text-sm text-stone-600">Create, update, and remove products, variants, and add-ons from a single admin workspace.</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button onClick={addNewProduct}>Add product</Button>
						<Button asChild variant="outline">
							<Link href="/admin">Back to dashboard</Link>
						</Button>
					</div>
				</div>

				<div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-stone-900">Products</h2>
								<p className="mt-1 text-sm text-stone-500">{productsState.length} products in the catalog</p>
							</div>
						</div>
						<div className="mt-6 space-y-3">
							{productsState.map((product) => (
								<button key={product.id} type="button" className={`w-full rounded-2xl border p-4 text-left transition ${selectedProductId === product.id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`} onClick={() => selectProduct(product.id)}>
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-semibold">{product.name}</p>
											<p className={`mt-1 text-sm ${selectedProductId === product.id ? "text-stone-200" : "text-stone-600"}`}>{product.category}</p>
										</div>
										<div className={`text-sm ${selectedProductId === product.id ? "text-stone-200" : "text-stone-500"}`}>
											{product.variants.length} sizes • {product.addons.length} add-ons
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						{currentProduct ? (
							<div className="space-y-8">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<h2 className="text-xl font-semibold text-stone-900">{currentProduct.name}</h2>
										<p className="mt-1 text-sm text-stone-500">Update the visible product details and inventory settings.</p>
									</div>
									<Button variant="destructive" onClick={() => deleteProduct(currentProduct.id)}>
										Delete
									</Button>
								</div>

								{saveFeedback ? <div className={`rounded-2xl border px-4 py-3 text-sm ${saveFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{saveFeedback.message}</div> : null}

								<div className="grid gap-4 md:grid-cols-2">
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Product name</span>
										<input value={currentProduct.name} onChange={(event) => updateDraftField("name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Slug</span>
										<input value={currentProduct.slug} onChange={(event) => updateDraftField("slug", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Category</span>
										<select value={currentProduct.category} onChange={(event) => updateProductCategory(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0">
											{categories.map((category) => (
												<option key={category} value={category}>
													{category}
												</option>
											))}
										</select>
									</label>
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Material</span>
										<input value={currentProduct.material} onChange={(event) => updateDraftField("material", event.target.value)} placeholder={activeCategoryConfig.defaultMaterial} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									{activeCategoryConfig.showWoodType ? (
										<label className="space-y-2 text-sm text-stone-600">
											<span className="font-medium text-stone-700">Wood type</span>
											<input value={currentProduct.woodType ?? ""} onChange={(event) => updateDraftField("woodType", event.target.value)} placeholder={activeCategoryConfig.defaultWoodType ?? ""} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
										</label>
									) : null}
									{activeCategoryConfig.showColor ? (
										<label className="space-y-2 text-sm text-stone-600">
											<span className="font-medium text-stone-700">{activeCategoryConfig.colorLabel}</span>
											<input value={currentProduct.color ?? ""} onChange={(event) => updateDraftField("color", event.target.value)} placeholder={activeCategoryConfig.defaultColor} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
										</label>
									) : null}
									{activeCategoryConfig.showSizeLabel ? (
										<label className="space-y-2 text-sm text-stone-600">
											<span className="font-medium text-stone-700">{activeCategoryConfig.sizeLabel}</span>
											<input value={currentProduct.sizeLabel ?? ""} onChange={(event) => updateDraftField("sizeLabel", event.target.value)} placeholder={activeCategoryConfig.defaultSizeLabel} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
										</label>
									) : null}
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Image</span>
										<input value={currentProduct.image} onChange={(event) => updateDraftField("image", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									<label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
										<input type="checkbox" checked={currentProduct.featured} onChange={(event) => updateDraftField("featured", event.target.checked)} className="h-4 w-4 rounded border-stone-300" />
										<span>Featured on storefront</span>
									</label>
								</div>

								<label className="block space-y-2 text-sm text-stone-600">
									<span className="font-medium text-stone-700">Short description</span>
									<input value={currentProduct.shortDescription} onChange={(event) => updateDraftField("shortDescription", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
								</label>
								<label className="block space-y-2 text-sm text-stone-600">
									<span className="font-medium text-stone-700">Description</span>
									<textarea value={currentProduct.description} onChange={(event) => updateDraftField("description", event.target.value)} rows={4} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
								</label>
								{activeCategoryConfig.showMaterials ? (
									<label className="block space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">{activeCategoryConfig.materialsLabel} (comma-separated)</span>
										<input
											value={(currentProduct.materials ?? [currentProduct.material]).join(", ")}
											onChange={(event) =>
												updateDraftField(
													"materials",
													event.target.value
														.split(",")
														.map((entry) => entry.trim())
														.filter(Boolean),
												)
											}
											className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0"
										/>
									</label>
								) : null}
								{activeCategoryConfig.showHandcraftedStory ? (
									<label className="block space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">{activeCategoryConfig.handcraftedStoryLabel}</span>
										<textarea value={currentProduct.handcraftedStory ?? ""} onChange={(event) => updateDraftField("handcraftedStory", event.target.value)} rows={3} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
								) : null}
								{activeCategoryConfig.showHandmadeProcess ? (
									<label className="block space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">{activeCategoryConfig.handmadeProcessLabel}</span>
										<textarea value={currentProduct.handmadeProcess ?? ""} onChange={(event) => updateDraftField("handmadeProcess", event.target.value)} rows={3} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
								) : null}
								<div className="grid gap-4 md:grid-cols-2">
									{activeCategoryConfig.showDimensions ? (
										<label className="space-y-2 text-sm text-stone-600">
											<span className="font-medium text-stone-700">{activeCategoryConfig.dimensionsLabel}</span>
											<input value={currentProduct.dimensions ?? ""} onChange={(event) => updateDraftField("dimensions", event.target.value)} placeholder={activeCategoryConfig.defaultDimensions} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
										</label>
									) : null}
									{activeCategoryConfig.showWeight ? (
										<label className="space-y-2 text-sm text-stone-600">
											<span className="font-medium text-stone-700">{activeCategoryConfig.weightLabel}</span>
											<input value={currentProduct.weight ?? ""} onChange={(event) => updateDraftField("weight", event.target.value)} placeholder={activeCategoryConfig.defaultWeight} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
										</label>
									) : null}
								</div>
								{activeCategoryConfig.showCareInstructions ? (
									<label className="block space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">{activeCategoryConfig.careInstructionsLabel}</span>
										<textarea value={currentProduct.careInstructions ?? ""} onChange={(event) => updateDraftField("careInstructions", event.target.value)} rows={3} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
								) : null}
								{activeCategoryConfig.showSpecifications ? (
									<label className="block space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">{activeCategoryConfig.specificationsLabel} (one per line)</span>
										<textarea
											value={(currentProduct.specifications ?? []).join("\n")}
											onChange={(event) =>
												updateDraftField(
													"specifications",
													event.target.value
														.split("\n")
														.map((entry) => entry.trim())
														.filter(Boolean),
												)
											}
											rows={4}
											className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0"
										/>
									</label>
								) : null}
								<div className="grid gap-4 md:grid-cols-2">
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Shipping info</span>
										<input value={currentProduct.shippingInfo} onChange={(event) => updateDraftField("shippingInfo", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Return policy</span>
										<input value={currentProduct.returnPolicy} onChange={(event) => updateDraftField("returnPolicy", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
								</div>

								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<div className="flex items-center justify-between gap-3">
										<h3 className="text-lg font-semibold text-stone-900">Variants</h3>
										<Button type="button" onClick={addVariant}>
											Add size
										</Button>
									</div>
									<div className="mt-4 space-y-3">
										{currentProduct.variants.map((variant) => (
											<div key={variant.id} className="rounded-2xl border border-stone-200 bg-white p-4">
												<div className="flex items-center justify-between gap-3">
													<p className="font-semibold text-stone-900">{variant.name || "Untitled variant"}</p>
													<button type="button" onClick={() => removeVariant(variant.id)} className="text-sm font-semibold text-stone-500">
														Remove
													</button>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-2">
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Name</span>
														<input value={variant.name} onChange={(event) => updateVariant(variant.id, "name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Price</span>
														<input type="number" value={variant.price} onChange={(event) => updateVariant(variant.id, "price", Number(event.target.value))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Stock</span>
														<input type="number" value={variant.stock} onChange={(event) => updateVariant(variant.id, "stock", Number(event.target.value))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">SKU</span>
														<input value={variant.sku} onChange={(event) => updateVariant(variant.id, "sku", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Width</span>
														<input value={variant.width} onChange={(event) => updateVariant(variant.id, "width", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Height</span>
														<input value={variant.height} onChange={(event) => updateVariant(variant.id, "height", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Depth</span>
														<input value={variant.depth} onChange={(event) => updateVariant(variant.id, "depth", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Weight</span>
														<input value={variant.weight} onChange={(event) => updateVariant(variant.id, "weight", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600 md:col-span-2">
														<span className="font-medium text-stone-700">Variant shipping note</span>
														<input value={variant.shippingNote ?? ""} onChange={(event) => updateVariant(variant.id, "shippingNote", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<div className="flex items-center justify-between gap-3">
										<h3 className="text-lg font-semibold text-stone-900">Add-ons</h3>
										<Button type="button" onClick={addAddon}>
											Add add-on
										</Button>
									</div>
									<div className="mt-4 space-y-3">
										{currentProduct.addons.map((addon) => (
											<div key={addon.id} className="rounded-2xl border border-stone-200 bg-white p-4">
												<div className="flex items-center justify-between gap-3">
													<p className="font-semibold text-stone-900">{addon.name || "Untitled add-on"}</p>
													<button type="button" onClick={() => removeAddon(addon.id)} className="text-sm font-semibold text-stone-500">
														Remove
													</button>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-2">
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Name</span>
														<input value={addon.name} onChange={(event) => updateAddon(addon.id, "name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600">
														<span className="font-medium text-stone-700">Price</span>
														<input type="number" value={addon.price} onChange={(event) => updateAddon(addon.id, "price", Number(event.target.value))} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
													<label className="space-y-2 text-sm text-stone-600 md:col-span-2">
														<span className="font-medium text-stone-700">Description</span>
														<textarea value={addon.description} onChange={(event) => updateAddon(addon.id, "description", event.target.value)} rows={2} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0" />
													</label>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex justify-end">
									<Button onClick={saveProduct}>Save product</Button>
								</div>
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">Create a product to begin editing variants and add-ons.</div>
						)}
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
