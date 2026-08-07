"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { type CategorySummary } from "@/lib/category-utils";
import { refreshProductsCatalog } from "@/lib/products-catalog";
import type { Product, ProductAddon, ProductVariant } from "@/types/store";

// Shared Tailwind fragments — avoids repeating the same class string across the form.
const FIELD_INPUT = "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0";
const SUBFIELD_INPUT = "w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 outline-none ring-0";
const FIELD_LABEL = "space-y-2 text-sm text-stone-600";

// All categories currently share the same defaults — no per-category config needed.
const DEFAULT_MATERIAL = "Mixed Artisan Materials";
const DEFAULT_SIZE_LABEL = "Standard";
const DEFAULT_DIMENSIONS = "Add product dimensions";
const DEFAULT_WEIGHT = "Add product weight";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

function generateId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function applyCategoryDefaults(product: Product, category: string): Product {
	return {
		...product,
		category,
		material: product.material || DEFAULT_MATERIAL,
		materials: product.materials?.length ? product.materials : [DEFAULT_MATERIAL],
		sizeLabel: product.sizeLabel ?? DEFAULT_SIZE_LABEL,
		dimensions: product.dimensions ?? DEFAULT_DIMENSIONS,
		weight: product.weight ?? DEFAULT_WEIGHT,
	};
}

function buildCategoryDraft(product: Product, category: string): Product {
	return {
		...product,
		category,
		material: DEFAULT_MATERIAL,
		materials: [DEFAULT_MATERIAL],
		sizeLabel: DEFAULT_SIZE_LABEL,
		dimensions: DEFAULT_DIMENSIONS,
		weight: DEFAULT_WEIGHT,
	};
}

function createEmptyProduct(category: string): Product {
	return buildCategoryDraft(
		{
			id: generateId("product"),
			slug: "new-product",
			name: "New product",
			shortDescription: "Add a short description",
			description: "Add a detailed product description",
			category,
			material: "",
			image: "",
			gallery: [],
			galleryColors: [],
			rating: 0,
			reviewCount: 0,
			featured: false,
			variants: [],
			addons: [],
			shippingInfo: "Ships within 3-5 business days",
			returnPolicy: "Free returns within 14 days",
		},
		category,
	);
}

function createEmptyVariant(): ProductVariant {
	return { id: generateId("variant"), name: "New size", price: 0, width: "", height: "", depth: "", weight: "", stock: 0 };
}

function createEmptyAddon(): ProductAddon {
	return { id: generateId("addon"), name: "New add-on", price: 0, description: "" };
}

export default function AdminProductsPage() {
	const [productsState, setProductsState] = useState<Product[]>([]);
	const [categories, setCategories] = useState<CategorySummary[]>([]);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [draftProduct, setDraftProduct] = useState<Product | null>(null);
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
	const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingImages, setIsUploadingImages] = useState(false);
	const [imageUploadError, setImageUploadError] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const loadProducts = async () => {
			setIsLoadingCatalog(true);
			try {
				const [productsResponse, categoriesResponse] = await Promise.all([fetch("/api/admin/products", { cache: "no-store" }), fetch("/api/admin/categories", { cache: "no-store" })]);
				const productsPayload = (await productsResponse.json()) as Product[] | { error?: string };
				const categoriesPayload = (await categoriesResponse.json()) as CategorySummary[] | { error?: string };

				if (!productsResponse.ok || !Array.isArray(productsPayload)) {
					throw new Error(!Array.isArray(productsPayload) && productsPayload.error ? productsPayload.error : "Unable to load products.");
				}
				if (!categoriesResponse.ok || !Array.isArray(categoriesPayload)) {
					throw new Error(!Array.isArray(categoriesPayload) && categoriesPayload.error ? categoriesPayload.error : "Unable to load categories.");
				}

				setCategories(categoriesPayload);
				setProductsState(productsPayload);
				setSelectedProductId(productsPayload[0]?.id ?? "");
				setDraftProduct(productsPayload[0] ?? null);
			} catch (error) {
				setSaveFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to load products." });
			} finally {
				setIsLoadingCatalog(false);
			}
		};

		void loadProducts();
	}, []);

	const selectProduct = (productId: string) => {
		setSelectedProductId(productId);
		setImageUploadError(null);
		const nextProduct = productsState.find((product) => product.id === productId);
		if (nextProduct) setDraftProduct(nextProduct);
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
		setDraftProduct((current) => (current ? { ...current, variants: current.variants.map((variant) => (variant.id === variantId ? { ...variant, [key]: value } : variant)) } : current));
	};

	const updateAddon = (addonId: string, key: keyof ProductAddon, value: string | number) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, addons: current.addons.map((addon) => (addon.id === addonId ? { ...addon, [key]: value } : addon)) } : current));
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
		setDraftProduct((current) => (current ? { ...current, variants: current.variants.filter((v) => v.id !== variantId) } : current));
	};

	const removeAddon = (addonId: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, addons: current.addons.filter((a) => a.id !== addonId) } : current));
	};

	// --- Image uploads -------------------------------------------------------

	const uploadProductImages = async (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0 || !draftProduct) return;

		const files = Array.from(fileList);
		setImageUploadError(null);

		const existingCount = draftProduct.gallery.length;
		if (existingCount + files.length > MAX_IMAGES) {
			setImageUploadError(`You can upload up to ${MAX_IMAGES} images per product (${existingCount} already added).`);
			return;
		}

		const invalidFile = files.find((file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE_BYTES);
		if (invalidFile) {
			setImageUploadError(`"${invalidFile.name}" must be an image under ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
			return;
		}

		setIsUploadingImages(true);
		try {
			const productFolder = draftProduct.slug || draftProduct.id;
			const formData = new FormData();
			formData.set("folder", productFolder);
			files.forEach((file) => formData.append("images", file));

			const response = await fetch("/api/admin/product-images", {
				method: "POST",
				body: formData,
			});
			const payload = (await response.json()) as { images?: Array<{ url: string }>; error?: string };

			if (!response.ok || !payload.images) {
				throw new Error(payload.error || "Image upload failed. Please try again.");
			}

			const uploadedUrls = payload.images.map((image) => image.url);
			setDraftProduct((current) => {
				if (!current) return current;
				const nextGallery = [...current.gallery, ...uploadedUrls];
				const nextGalleryColors = [...(current.galleryColors ?? current.gallery.map(() => "")), ...uploadedUrls.map(() => "")];
				return { ...current, gallery: nextGallery, galleryColors: nextGalleryColors, image: current.image || nextGallery[0] };
			});
		} catch (error) {
			setImageUploadError(error instanceof Error ? error.message : "Image upload failed. Please try again.");
		} finally {
			setIsUploadingImages(false);
		}
	};

	const removeGalleryImage = async (url: string) => {
		setDraftProduct((current) => {
			if (!current) return current;
			const removedIndex = current.gallery.indexOf(url);
			const nextGallery = current.gallery.filter((image) => image !== url);
			const nextGalleryColors = (current.galleryColors ?? current.gallery.map(() => "")).filter((_, index) => index !== removedIndex);
			return { ...current, gallery: nextGallery, galleryColors: nextGalleryColors, image: current.image === url ? (nextGallery[0] ?? "") : current.image };
		});

		// Best-effort cleanup in storage; harmless if it fails (e.g. externally hosted URL).
		try {
			await fetch(`/api/admin/product-images?url=${encodeURIComponent(url)}`, { method: "DELETE" });
		} catch {
			// Non-fatal — the URL is already removed from the product's gallery.
		}
	};

	const setCoverImage = (url: string) => updateDraftField("image", url);

	const updateGalleryImageColor = (url: string, color: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => {
			if (!current) return current;
			const baseColors = current.galleryColors ?? current.gallery.map(() => "");
			const index = current.gallery.indexOf(url);
			if (index === -1) return current;
			const nextGalleryColors = [...baseColors];
			nextGalleryColors[index] = color;
			return { ...current, galleryColors: nextGalleryColors };
		});
	};

	// --- Persistence -----------------------------------------------------------

	const saveProduct = async () => {
		if (!draftProduct) {
			setSaveFeedback({ type: "error", message: "There is no product selected to save." });
			return;
		}

		if (draftProduct.gallery.length === 0) {
			setSaveFeedback({ type: "error", message: "Add at least one product image before saving." });
			return;
		}

		const categoryNormalizedProduct = applyCategoryDefaults(draftProduct, draftProduct.category);

		const normalizedProduct: Product = {
			...categoryNormalizedProduct,
			slug: draftProduct.slug || slugify(draftProduct.name),
			gallery: draftProduct.gallery,
			galleryColors: draftProduct.gallery.map((_, index) => draftProduct.galleryColors?.[index]?.trim() ?? ""),
			image: draftProduct.image || draftProduct.gallery[0],
			materials: (categoryNormalizedProduct.materials ?? [DEFAULT_MATERIAL]).map((entry) => entry.trim()).filter(Boolean),
			sizeLabel: categoryNormalizedProduct.sizeLabel?.trim() || undefined,
			dimensions: categoryNormalizedProduct.dimensions?.trim() || undefined,
			weight: categoryNormalizedProduct.weight?.trim() || undefined,
			variants: draftProduct.variants.filter((variant) => variant.name.trim()),
			addons: draftProduct.addons.filter((addon) => addon.name.trim()),
		};

		try {
			setIsSaving(true);
			const shouldCreate = normalizedProduct.id.startsWith("product-");
			const response = await fetch("/api/admin/products", {
				method: shouldCreate ? "POST" : "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(shouldCreate ? { ...normalizedProduct, id: undefined } : normalizedProduct),
			});
			const payload = (await response.json()) as Product[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Product could not be saved. Please try again.");
			}

			setProductsState(payload);
			const saved = payload.find((product) => product.slug === normalizedProduct.slug) ?? payload[0] ?? null;
			setSelectedProductId(saved?.id ?? "");
			setDraftProduct(saved);
			setSaveFeedback({ type: "success", message: `${normalizedProduct.name} has been saved.` });
			await refreshProductsCatalog();
		} catch (error) {
			setSaveFeedback({ type: "error", message: error instanceof Error ? error.message : "Product could not be saved. Please try again." });
		} finally {
			setIsSaving(false);
		}
	};

	const addNewProduct = () => {
		setSaveFeedback(null);
		setImageUploadError(null);
		const defaultCategory = categories[0]?.name;
		if (!defaultCategory) {
			setSaveFeedback({ type: "error", message: "Add at least one category first before creating products." });
			return;
		}

		const nextProduct = createEmptyProduct(defaultCategory);
		setProductsState((current) => [nextProduct, ...current]);
		setSelectedProductId(nextProduct.id);
		setDraftProduct(nextProduct);
	};

	const deleteProduct = async (productId: string) => {
		setSaveFeedback(null);
		const targetProduct = productsState.find((product) => product.id === productId);
		if (!targetProduct) return;

		if (!window.confirm(`Delete "${targetProduct.name}" from the catalog?`)) return;

		try {
			setIsSaving(true);
			const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, { method: "DELETE" });
			const payload = (await response.json()) as Product[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Product could not be deleted.");
			}

			setProductsState(payload);
			const fallback = payload[0] ?? null;
			setSelectedProductId(fallback?.id ?? "");
			setDraftProduct(fallback);
			setSaveFeedback({ type: "success", message: `${targetProduct.name} has been deleted.` });
			await refreshProductsCatalog();
		} catch (error) {
			setSaveFeedback({ type: "error", message: error instanceof Error ? error.message : "Product could not be deleted." });
		} finally {
			setIsSaving(false);
		}
	};

	const currentProduct = draftProduct ?? productsState.find((product) => product.id === selectedProductId) ?? null;
	const isClothCategory = (currentProduct?.category ?? "").toLowerCase().includes("cloth");

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Manage products</h1>
						<p className="mt-2 max-w-2xl text-sm text-stone-600">Create, update, and remove products, variants, and add-ons from a single admin workspace. Categories are managed separately.</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button onClick={addNewProduct} disabled={isLoadingCatalog || isSaving || categories.length === 0}>
							Add product
						</Button>
						<Button asChild variant="outline">
							<Link href="/admin/categories">Manage categories</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/admin">Back to dashboard</Link>
						</Button>
					</div>
				</div>

				<div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<div>
							<h2 className="text-xl font-semibold text-stone-900">Products</h2>
							<p className="mt-1 text-sm text-stone-500">{productsState.length} products in the catalog</p>
							<p className="mt-1 text-xs text-stone-500">Categories available: {categories.length}</p>
						</div>
						<div className="mt-6 space-y-3">
							{isLoadingCatalog && <p className="text-sm text-stone-500">Loading products...</p>}
							{productsState.map((product) => {
								const isSelected = selectedProductId === product.id;
								return (
									<button key={product.id} type="button" onClick={() => selectProduct(product.id)} className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}>
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="font-semibold">{product.name}</p>
												<p className={`mt-1 text-sm ${isSelected ? "text-stone-200" : "text-stone-600"}`}>{product.category}</p>
											</div>
											<div className={`text-sm ${isSelected ? "text-stone-200" : "text-stone-500"}`}>
												{product.variants.length} sizes • {product.addons.length} add-ons
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						{!currentProduct ? (
							<div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">Create a product to begin editing variants and add-ons.</div>
						) : (
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

								{saveFeedback && <div className={`rounded-2xl border px-4 py-3 text-sm ${saveFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{saveFeedback.message}</div>}

								<div className="grid gap-4 md:grid-cols-2">
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Product name</span>
										<input value={currentProduct.name} onChange={(e) => updateDraftField("name", e.target.value)} className={FIELD_INPUT} />
									</label>
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Slug</span>
										<input value={currentProduct.slug} onChange={(e) => updateDraftField("slug", e.target.value)} className={FIELD_INPUT} />
									</label>
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Category</span>
										<select value={currentProduct.category} onChange={(e) => updateProductCategory(e.target.value)} className={FIELD_INPUT}>
											{!categories.some((c) => c.name === currentProduct.category) && <option value={currentProduct.category}>{currentProduct.category}</option>}
											{categories.map((category) => (
												<option key={category.id} value={category.name}>
													{category.name}
												</option>
											))}
										</select>
									</label>
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Size label</span>
										<input value={currentProduct.sizeLabel ?? ""} onChange={(e) => updateDraftField("sizeLabel", e.target.value)} placeholder={DEFAULT_SIZE_LABEL} className={FIELD_INPUT} />
									</label>
									<label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 md:col-span-2">
										<input type="checkbox" checked={currentProduct.featured} onChange={(e) => updateDraftField("featured", e.target.checked)} className="h-4 w-4 rounded border-stone-300" />
										<span>Featured on storefront</span>
									</label>
								</div>

								{/* Image uploads */}
								<div className={FIELD_LABEL}>
									<div className="flex items-center justify-between">
										<span className="font-medium text-stone-700">Product images</span>
										<span className="text-xs text-stone-500">
											{currentProduct.gallery.length}/{MAX_IMAGES} · max 3MB each
										</span>
									</div>

									{isClothCategory && <p className="text-xs text-stone-500">Tag each photo with the colour it shows — customers can pick a colour to jump straight to that photo.</p>}

									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
										{currentProduct.gallery.map((url, index) => (
											<div key={url} className="space-y-1.5">
												<div className="group relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img src={url} alt="" className="h-full w-full object-cover" />
													{currentProduct.image === url && <span className="absolute left-2 top-2 rounded-full bg-stone-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
													<div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
														{currentProduct.image !== url && (
															<button type="button" onClick={() => setCoverImage(url)} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-stone-800">
																Set cover
															</button>
														)}
														<button type="button" onClick={() => void removeGalleryImage(url)} className="ml-auto rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-red-600">
															Remove
														</button>
													</div>
												</div>
												{isClothCategory && <input value={currentProduct.galleryColors?.[index] ?? ""} onChange={(e) => updateGalleryImageColor(url, e.target.value)} placeholder="Colour" className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-900 outline-none" />}
											</div>
										))}

										{currentProduct.gallery.length < MAX_IMAGES && (
											<button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImages} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-300 text-xs font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700 disabled:opacity-50">
												<span className="text-xl leading-none">+</span>
												<span>{isUploadingImages ? "Uploading..." : "Add image"}</span>
											</button>
										)}
									</div>

									<input
										ref={imageInputRef}
										type="file"
										accept="image/*"
										multiple
										className="hidden"
										onChange={(e) => {
											void uploadProductImages(e.target.files);
											e.target.value = "";
										}}
									/>

									{imageUploadError && <p className="text-xs font-medium text-red-600">{imageUploadError}</p>}
								</div>

								<label className={`block ${FIELD_LABEL}`}>
									<span className="font-medium text-stone-700">Short description</span>
									<input value={currentProduct.shortDescription} onChange={(e) => updateDraftField("shortDescription", e.target.value)} className={FIELD_INPUT} />
								</label>
								<label className={`block ${FIELD_LABEL}`}>
									<span className="font-medium text-stone-700">Description</span>
									<textarea value={currentProduct.description} onChange={(e) => updateDraftField("description", e.target.value)} rows={4} className={FIELD_INPUT} />
								</label>

								<div className="grid gap-4 md:grid-cols-2">
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Dimensions</span>
										<input value={currentProduct.dimensions ?? ""} onChange={(e) => updateDraftField("dimensions", e.target.value)} placeholder={DEFAULT_DIMENSIONS} className={FIELD_INPUT} />
									</label>
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Weight</span>
										<input value={currentProduct.weight ?? ""} onChange={(e) => updateDraftField("weight", e.target.value)} placeholder={DEFAULT_WEIGHT} className={FIELD_INPUT} />
									</label>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Shipping info</span>
										<input value={currentProduct.shippingInfo} onChange={(e) => updateDraftField("shippingInfo", e.target.value)} className={FIELD_INPUT} />
									</label>
									<label className={FIELD_LABEL}>
										<span className="font-medium text-stone-700">Return policy</span>
										<input value={currentProduct.returnPolicy} onChange={(e) => updateDraftField("returnPolicy", e.target.value)} className={FIELD_INPUT} />
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
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Name</span>
														<input value={variant.name} onChange={(e) => updateVariant(variant.id, "name", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Price</span>
														<input type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Stock</span>
														<input type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Width</span>
														<input value={variant.width} onChange={(e) => updateVariant(variant.id, "width", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Height</span>
														<input value={variant.height} onChange={(e) => updateVariant(variant.id, "height", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Depth</span>
														<input value={variant.depth} onChange={(e) => updateVariant(variant.id, "depth", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Weight</span>
														<input value={variant.weight} onChange={(e) => updateVariant(variant.id, "weight", e.target.value)} className={SUBFIELD_INPUT} />
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
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Name</span>
														<input value={addon.name} onChange={(e) => updateAddon(addon.id, "name", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-stone-700">Price</span>
														<input type="number" value={addon.price} onChange={(e) => updateAddon(addon.id, "price", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={`md:col-span-2 ${FIELD_LABEL}`}>
														<span className="font-medium text-stone-700">Description</span>
														<textarea value={addon.description} onChange={(e) => updateAddon(addon.id, "description", e.target.value)} rows={2} className={SUBFIELD_INPUT} />
													</label>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="flex justify-end">
									<Button onClick={saveProduct} disabled={isLoadingCatalog || isSaving || isUploadingImages}>
										{isSaving ? "Saving..." : "Save product"}
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
