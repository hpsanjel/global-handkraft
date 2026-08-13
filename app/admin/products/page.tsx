"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { type CategorySummary } from "@/lib/category-utils";
import { refreshProductsCatalog } from "@/lib/products-catalog";
import { DEFAULT_SHIPPING_INFO, DEFAULT_RETURN_POLICY, variantLabel } from "@/lib/product-transform";
import type { Product, ProductAddon, ProductVariant } from "@/types/store";

// Shared Tailwind fragments — avoids repeating the same class string across the form.
const FIELD_INPUT = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100";
const SUBFIELD_INPUT = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100";
const FIELD_LABEL = "space-y-2 text-sm text-slate-600";

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
			active: true,
			variants: [],
			addons: [],
			shippingInfo: DEFAULT_SHIPPING_INFO,
			returnPolicy: DEFAULT_RETURN_POLICY,
		},
		category,
	);
}

function createEmptyVariant(): ProductVariant {
	return { id: generateId("variant"), name: "New size", color: "", price: 0, width: "", height: "", depth: "", weight: "", stock: 0 };
}

function createEmptyAddon(): ProductAddon {
	return { id: generateId("addon"), name: "New add-on", price: 0, description: "" };
}

type EditorTab = "details" | "images" | "variants" | "addons";

const EDITOR_TABS: { id: EditorTab; label: string }[] = [
	{ id: "details", label: "Details" },
	{ id: "images", label: "Images" },
	{ id: "variants", label: "Variants" },
	{ id: "addons", label: "Add-ons" },
];

export default function AdminProductsPage() {
	const [productsState, setProductsState] = useState<Product[]>([]);
	const [categories, setCategories] = useState<CategorySummary[]>([]);
	const [selectedProductId, setSelectedProductId] = useState<string>("");
	const [draftProduct, setDraftProduct] = useState<Product | null>(null);
	const [productSearch, setProductSearch] = useState("");
	const [activeTab, setActiveTab] = useState<EditorTab>("details");
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
	const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploadingImages, setIsUploadingImages] = useState(false);
	const [imageUploadError, setImageUploadError] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	// Tracks whether the admin has hand-edited the slug for the current product — once true, name edits stop overwriting it.
	const slugEditedRef = useRef(false);

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

				const requestedProductId = new URLSearchParams(window.location.search).get("product");
				const initialProduct = (requestedProductId && productsPayload.find((product) => product.id === requestedProductId)) || productsPayload[0] || null;

				setCategories(categoriesPayload);
				setProductsState(productsPayload);
				setSelectedProductId(initialProduct?.id ?? "");
				setDraftProduct(initialProduct);
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
		setActiveTab("details");
		slugEditedRef.current = false;
		const nextProduct = productsState.find((product) => product.id === productId);
		if (nextProduct) setDraftProduct(nextProduct);
	};

	const updateDraftField = <K extends keyof Product>(key: K, value: Product[K]) => {
		setSaveFeedback(null);
		setDraftProduct((current) => (current ? { ...current, [key]: value } : current));
	};

	const updateProductName = (name: string) => {
		setSaveFeedback(null);
		setDraftProduct((current) => {
			if (!current) return current;
			// Only auto-derive the slug while creating a brand-new product — never overwrite
			// an existing, already-published product's slug just because its name was edited.
			const isNewProduct = current.id.startsWith("product-");
			return { ...current, name, ...(isNewProduct && !slugEditedRef.current ? { slug: slugify(name) } : null) };
		});
	};

	const updateProductSlug = (slug: string) => {
		slugEditedRef.current = true;
		updateDraftField("slug", slug);
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
		slugEditedRef.current = false;
		setProductsState((current) => [nextProduct, ...current]);
		setSelectedProductId(nextProduct.id);
		setDraftProduct(nextProduct);
		setActiveTab("details");
	};

	// Sets active:false on a product via the same PUT the editor uses — hides it from the
	// storefront while leaving variants, addons, and order history completely untouched.
	const archiveProduct = async (targetProduct: Product) => {
		try {
			setIsSaving(true);
			const response = await fetch("/api/admin/products", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...targetProduct, active: false }),
			});
			const payload = (await response.json()) as Product[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Product could not be archived.");
			}

			setProductsState(payload);
			const updated = payload.find((product) => product.id === targetProduct.id) ?? null;
			if (selectedProductId === targetProduct.id) setDraftProduct(updated);
			setSaveFeedback({ type: "success", message: `${targetProduct.name} has been archived and hidden from the storefront. Its order history is untouched.` });
			await refreshProductsCatalog();
		} catch (error) {
			setSaveFeedback({ type: "error", message: error instanceof Error ? error.message : "Product could not be archived." });
		} finally {
			setIsSaving(false);
		}
	};

	const deleteProduct = async (productId: string) => {
		setSaveFeedback(null);
		const targetProduct = productsState.find((product) => product.id === productId);
		if (!targetProduct) return;

		if (!window.confirm(`Delete "${targetProduct.name}" from the catalog? This permanently removes it and cannot be undone.`)) return;

		try {
			setIsSaving(true);
			const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, { method: "DELETE" });
			const payload = (await response.json()) as Product[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				const message = !Array.isArray(payload) && payload.error ? payload.error : "Product could not be deleted.";

				// Deletion is blocked because orders reference this product — offer archiving
				// (active:false) as the safe alternative instead of just failing.
				if (response.status === 409 && message.toLowerCase().includes("order history")) {
					setIsSaving(false);
					const shouldArchive = window.confirm(`${message}\n\nArchive it instead? This immediately hides "${targetProduct.name}" from the storefront while keeping all past orders and reports intact. You can reactivate it later from the Details tab.`);
					if (shouldArchive) await archiveProduct(targetProduct);
					return;
				}

				throw new Error(message);
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
	const visibleProducts = productSearch.trim() ? productsState.filter((product) => product.name.toLowerCase().includes(productSearch.trim().toLowerCase())) : productsState;

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Products"
				description="Create, update, and remove products, variants, and add-ons from a single admin workspace. Categories are managed separately."
				actions={
					<>
						<Button variant="primary" onClick={addNewProduct} disabled={isLoadingCatalog || isSaving || categories.length === 0}>
							Add product
						</Button>
						<Button asChild variant="secondary">
							<Link href="/admin/categories">Manage categories</Link>
						</Button>
					</>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[0.6fr_1.4fr]">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<div>
						<h2 className="text-base font-semibold text-slate-900">Products</h2>
						<p className="mt-1 text-sm text-slate-500">{productsState.length} products in the catalog</p>
						<p className="mt-1 text-xs text-slate-400">Categories available: {categories.length}</p>
					</div>

					<input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products by name..." className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />

					<div className="mt-4 max-h-[70vh] space-y-2.5 overflow-y-auto pr-0.5">
						{isLoadingCatalog && <p className="text-sm text-slate-500">Loading products...</p>}
						{!isLoadingCatalog && visibleProducts.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No products match &quot;{productSearch}&quot;.</p>}
						{visibleProducts.map((product) => {
							const isSelected = selectedProductId === product.id;
							return (
								<button key={product.id} type="button" onClick={() => selectProduct(product.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${isSelected ? "border-[#1B365D] bg-[#1B365D] text-white" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
									{product.image ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />
									) : (
										<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-[10px] ${isSelected ? "border-white/30 text-slate-300" : "border-dashed border-slate-200 text-slate-400"}`}>No image</div>
									)}
									<div className="min-w-0 flex-1">
										<p className="flex items-center gap-1.5 truncate font-semibold">
											<span className="truncate">{product.name}</span>
											{!product.active && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>Archived</span>}
										</p>
										<p className={`mt-0.5 truncate text-sm ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{product.category}</p>
									</div>
									<div className={`shrink-0 text-right text-xs ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
										<p>{product.variants.length} sizes</p>
										<p>{product.addons.length} add-ons</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					{!currentProduct ? (
						<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">Create a product to begin editing variants and add-ons.</div>
					) : (
						<div className="space-y-6">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h2 className="text-base font-semibold text-slate-900">{currentProduct.name}</h2>
									<p className="mt-1 text-sm text-slate-500">Update the visible product details and inventory settings.</p>
								</div>
								<Button variant="destructive" onClick={() => deleteProduct(currentProduct.id)}>
									Delete
								</Button>
							</div>

							{saveFeedback && <div className={`rounded-xl border px-4 py-3 text-sm ${saveFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{saveFeedback.message}</div>}

							<div className="flex flex-wrap gap-1.5 border-b border-slate-200">
								{EDITOR_TABS.map((tab) => {
									const count = tab.id === "images" ? currentProduct.gallery.length : tab.id === "variants" ? currentProduct.variants.length : tab.id === "addons" ? currentProduct.addons.length : null;
									const isActive = activeTab === tab.id;
									return (
										<button
											key={tab.id}
											type="button"
											onClick={() => setActiveTab(tab.id)}
											className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition ${isActive ? "border-stone-600 text-stone-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}
										>
											{tab.label}
											{count !== null ? <span className={`ml-1.5 text-xs font-normal ${isActive ? "text-stone-500" : "text-slate-400"}`}>({count})</span> : null}
										</button>
									);
								})}
							</div>

							{activeTab === "details" ? (
								<div className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<label className={FIELD_LABEL}>
											<span className="font-medium text-slate-700">Product name</span>
											<input value={currentProduct.name} onChange={(e) => updateProductName(e.target.value)} className={FIELD_INPUT} />
										</label>
										<label className={FIELD_LABEL}>
											<span className="font-medium text-slate-700">Slug</span>
											<input value={currentProduct.slug} onChange={(e) => updateProductSlug(e.target.value)} className={FIELD_INPUT} />
										</label>
										<label className={FIELD_LABEL}>
											<span className="font-medium text-slate-700">Category</span>
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
											<span className="font-medium text-slate-700">Size label</span>
											<input value={currentProduct.sizeLabel ?? ""} onChange={(e) => updateDraftField("sizeLabel", e.target.value)} placeholder={DEFAULT_SIZE_LABEL} className={FIELD_INPUT} />
										</label>
										<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:col-span-2">
											<input type="checkbox" checked={currentProduct.featured} onChange={(e) => updateDraftField("featured", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
											<span>Featured on storefront</span>
										</label>
										<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:col-span-2">
											<input type="checkbox" checked={currentProduct.active} onChange={(e) => updateDraftField("active", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
											<span>Active (visible on storefront). Turn off to archive — hides the product without deleting it or affecting past orders.</span>
										</label>
									</div>

									<label className={`block ${FIELD_LABEL}`}>
										<span className="font-medium text-slate-700">Short description</span>
										<input value={currentProduct.shortDescription} onChange={(e) => updateDraftField("shortDescription", e.target.value)} className={FIELD_INPUT} />
									</label>
									<label className={`block ${FIELD_LABEL}`}>
										<span className="font-medium text-slate-700">Description</span>
										<textarea value={currentProduct.description} onChange={(e) => updateDraftField("description", e.target.value)} rows={4} className={FIELD_INPUT} />
									</label>

									<div className="grid gap-4 md:grid-cols-2">
										<label className={FIELD_LABEL}>
											<span className="font-medium text-slate-700">Dimensions</span>
											<input value={currentProduct.dimensions ?? ""} onChange={(e) => updateDraftField("dimensions", e.target.value)} placeholder={DEFAULT_DIMENSIONS} className={FIELD_INPUT} />
										</label>
										<label className={FIELD_LABEL}>
											<span className="font-medium text-slate-700">Weight</span>
											<input value={currentProduct.weight ?? ""} onChange={(e) => updateDraftField("weight", e.target.value)} placeholder={DEFAULT_WEIGHT} className={FIELD_INPUT} />
										</label>
									</div>
								</div>
							) : null}

							{activeTab === "images" ? (
								<div className={FIELD_LABEL}>
									<div className="flex items-center justify-between">
										<span className="font-medium text-slate-700">Product images</span>
										<span className="text-xs text-slate-500">
											{currentProduct.gallery.length}/{MAX_IMAGES} · max 3MB each
										</span>
									</div>

									{isClothCategory && <p className="text-xs text-slate-500">Tag each photo with the colour it shows — customers can pick a colour to jump straight to that photo.</p>}

									<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
										{currentProduct.gallery.map((url, index) => (
											<div key={url} className="space-y-1.5">
												<div className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img src={url} alt="" className="h-full w-full object-cover" />
													{currentProduct.image === url && <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">Cover</span>}
													<div className="absolute inset-0 flex items-end justify-between gap-1 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
														{currentProduct.image !== url && (
															<button type="button" onClick={() => setCoverImage(url)} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700">
																Set cover
															</button>
														)}
														<button type="button" onClick={() => void removeGalleryImage(url)} className="ml-auto rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-red-600">
															Remove
														</button>
													</div>
												</div>
												{isClothCategory && <input value={currentProduct.galleryColors?.[index] ?? ""} onChange={(e) => updateGalleryImageColor(url, e.target.value)} placeholder="Colour" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 outline-none" />}
											</div>
										))}

										{currentProduct.gallery.length < MAX_IMAGES && (
											<button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImages} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-50">
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
							) : null}

							{activeTab === "variants" ? (
								<div>
									<div className="flex items-center justify-between gap-3">
										<p className="text-sm text-slate-500">Each row is a purchasable size/option with its own price and stock.</p>
										<Button type="button" variant="secondary" onClick={addVariant}>
											Add size
										</Button>
									</div>
									{isClothCategory && <p className="mt-2 text-xs text-slate-500">For clothing, add one row per size + colour combination (e.g. &quot;Small&quot; / &quot;Red&quot;, &quot;Small&quot; / &quot;Blue&quot;) so each combination tracks its own stock.</p>}
									{isClothCategory && (
										<datalist id="variant-color-options">
											{Array.from(new Set((currentProduct.galleryColors ?? []).map((color) => color.trim()).filter(Boolean))).map((color) => (
												<option key={color} value={color} />
											))}
										</datalist>
									)}
									<div className="mt-4 space-y-3">
										{currentProduct.variants.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No variants yet. Add a size to make this product purchasable.</p>}
										{currentProduct.variants.map((variant) => (
											<div key={variant.id} className="rounded-2xl border border-slate-200 bg-white p-4">
												<div className="flex items-center justify-between gap-3">
													<p className="font-semibold text-slate-900">{variantLabel(variant.name, variant.color) || "Untitled variant"}</p>
													<button type="button" onClick={() => removeVariant(variant.id)} className="text-sm font-semibold text-slate-500">
														Remove
													</button>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-2">
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Name</span>
														<input value={variant.name} onChange={(e) => updateVariant(variant.id, "name", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													{isClothCategory && (
														<label className={FIELD_LABEL}>
															<span className="font-medium text-slate-700">Colour</span>
															<input list="variant-color-options" value={variant.color ?? ""} onChange={(e) => updateVariant(variant.id, "color", e.target.value)} placeholder="e.g. Red" className={SUBFIELD_INPUT} />
														</label>
													)}
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Price</span>
														<input type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, "price", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Stock</span>
														<input type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, "stock", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Width</span>
														<input value={variant.width} onChange={(e) => updateVariant(variant.id, "width", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Height</span>
														<input value={variant.height} onChange={(e) => updateVariant(variant.id, "height", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Depth</span>
														<input value={variant.depth} onChange={(e) => updateVariant(variant.id, "depth", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Weight</span>
														<input value={variant.weight} onChange={(e) => updateVariant(variant.id, "weight", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
												</div>
											</div>
										))}
									</div>
								</div>
							) : null}

							{activeTab === "addons" ? (
								<div>
									<div className="flex items-center justify-between gap-3">
										<p className="text-sm text-slate-500">Optional extras customers can add to this product at checkout.</p>
										<Button type="button" variant="secondary" onClick={addAddon}>
											Add add-on
										</Button>
									</div>
									<div className="mt-4 space-y-3">
										{currentProduct.addons.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No add-ons yet.</p>}
										{currentProduct.addons.map((addon) => (
											<div key={addon.id} className="rounded-2xl border border-slate-200 bg-white p-4">
												<div className="flex items-center justify-between gap-3">
													<p className="font-semibold text-slate-900">{addon.name || "Untitled add-on"}</p>
													<button type="button" onClick={() => removeAddon(addon.id)} className="text-sm font-semibold text-slate-500">
														Remove
													</button>
												</div>
												<div className="mt-3 grid gap-3 md:grid-cols-2">
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Name</span>
														<input value={addon.name} onChange={(e) => updateAddon(addon.id, "name", e.target.value)} className={SUBFIELD_INPUT} />
													</label>
													<label className={FIELD_LABEL}>
														<span className="font-medium text-slate-700">Price</span>
														<input type="number" value={addon.price} onChange={(e) => updateAddon(addon.id, "price", Number(e.target.value))} className={SUBFIELD_INPUT} />
													</label>
													<label className={`md:col-span-2 ${FIELD_LABEL}`}>
														<span className="font-medium text-slate-700">Description</span>
														<textarea value={addon.description} onChange={(e) => updateAddon(addon.id, "description", e.target.value)} rows={2} className={SUBFIELD_INPUT} />
													</label>
												</div>
											</div>
										))}
									</div>
								</div>
							) : null}

							<div className="flex justify-end border-t border-slate-100 pt-6">
								<Button variant="primary" onClick={saveProduct} disabled={isLoadingCatalog || isSaving || isUploadingImages}>
									{isSaving ? "Saving..." : "Save product"}
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
