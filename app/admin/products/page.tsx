"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { products as initialProducts } from "@/lib/data/products";
import { productsCatalogStorageKey, saveProductsCatalog } from "@/lib/products-catalog";
import type { Product, ProductAddon, ProductVariant } from "@/types/store";

function createEmptyProduct(): Product {
	const id = `product-${Date.now()}-${Math.round(Math.random() * 1000)}`;

	return {
		id,
		slug: "new-product",
		name: "New product",
		shortDescription: "Add a short description",
		description: "Add a detailed product description",
		category: "Temples",
		material: "Wood",
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

		saveProductsCatalog(productsState);
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
		setDraftProduct((current) => (current ? { ...current, [key]: value } : current));
	};

	const updateVariant = (variantId: string, key: keyof ProductVariant, value: string | number) => {
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
		setDraftProduct((current) => (current ? { ...current, variants: [...current.variants, createEmptyVariant()] } : current));
	};

	const addAddon = () => {
		setDraftProduct((current) => (current ? { ...current, addons: [...current.addons, createEmptyAddon()] } : current));
	};

	const removeVariant = (variantId: string) => {
		setDraftProduct((current) => (current ? { ...current, variants: current.variants.filter((variant) => variant.id !== variantId) } : current));
	};

	const removeAddon = (addonId: string) => {
		setDraftProduct((current) => (current ? { ...current, addons: current.addons.filter((addon) => addon.id !== addonId) } : current));
	};

	const saveProduct = () => {
		if (!draftProduct) {
			return;
		}

		const normalizedProduct: Product = {
			...draftProduct,
			slug:
				draftProduct.slug ||
				draftProduct.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/(^-|-$)/g, ""),
			gallery: draftProduct.gallery.length > 0 ? draftProduct.gallery : [draftProduct.image],
			variants: draftProduct.variants.filter((variant) => variant.name.trim()),
			addons: draftProduct.addons.filter((addon) => addon.name.trim()),
		};

		setProductsState((current) => {
			const existingIndex = current.findIndex((product) => product.id === normalizedProduct.id);
			if (existingIndex >= 0) {
				const next = [...current];
				next[existingIndex] = normalizedProduct;
				return next;
			}

			return [normalizedProduct, ...current];
		});
		setSelectedProductId(normalizedProduct.id);
		setDraftProduct(normalizedProduct);
	};

	const addNewProduct = () => {
		const nextProduct = createEmptyProduct();
		setProductsState((current) => [nextProduct, ...current]);
		setSelectedProductId(nextProduct.id);
		setDraftProduct(nextProduct);
	};

	const deleteProduct = (productId: string) => {
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
					<div className="flex gap-3">
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
										<input value={currentProduct.category} onChange={(event) => updateDraftField("category", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
									<label className="space-y-2 text-sm text-stone-600">
										<span className="font-medium text-stone-700">Material</span>
										<input value={currentProduct.material} onChange={(event) => updateDraftField("material", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none ring-0" />
									</label>
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
