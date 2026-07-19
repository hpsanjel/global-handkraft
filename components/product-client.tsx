"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/store";
import { Button } from "@/components/ui/button";
import { saveCartItems, getCartItems } from "@/lib/cart";

export function ProductClient({ product }: { product: Product }) {
	const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
	const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

	const selectedVariant = useMemo(() => product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0], [product.variants, selectedVariantId]);

	const selectedAddons = useMemo(() => product.addons.filter((addon) => selectedAddonIds.includes(addon.id)), [product.addons, selectedAddonIds]);

	const totalPrice = useMemo(() => {
		const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
		return (selectedVariant?.price ?? 0) + addonsTotal;
	}, [selectedAddons, selectedVariant]);

	const toggleAddon = (addonId: string) => {
		setSelectedAddonIds((current) => (current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]));
	};

	const handleAddToCart = () => {
		const existingItems = getCartItems();
		const selectedVariantName = selectedVariant?.name ?? "Selected size";
		const itemName = `${product.name} (${selectedVariantName})`;
		const matchingItemIndex = existingItems.findIndex((item) => item.productId === product.id && item.variantId === (selectedVariant?.id ?? "") && JSON.stringify(item.addonIds) === JSON.stringify(selectedAddonIds));
		const nextItems = [...existingItems];

		if (matchingItemIndex >= 0) {
			nextItems[matchingItemIndex] = {
				...nextItems[matchingItemIndex],
				quantity: nextItems[matchingItemIndex].quantity + 1,
				price: totalPrice,
			};
		} else {
			nextItems.push({
				productId: product.id,
				name: itemName,
				variantId: selectedVariant?.id ?? "",
				variantName: selectedVariantName,
				price: totalPrice,
				quantity: 1,
				image: product.image,
				addonIds: selectedAddonIds,
			});
		}

		saveCartItems(nextItems);
		window.dispatchEvent(new Event("cart:updated"));
	};

	return (
		<div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
			<div className="space-y-4">
				<div className="aspect-[4/5] rounded-[2rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
				<div className="grid gap-4 sm:grid-cols-3">
					{product.gallery.map((image) => (
						<div key={image} className="aspect-square rounded-[1.25rem] border border-stone-200 bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
					))}
				</div>
			</div>
			<div>
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">{product.category}</p>
				<h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">{product.name}</h1>
				<p className="mt-4 text-lg leading-8 text-stone-600">{product.description}</p>
				<div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-medium text-stone-500">Selected option</p>
						<p className="text-3xl font-semibold text-stone-900">€{totalPrice}</p>
					</div>
					<div className="mt-6 space-y-4">
						<div>
							<p className="text-sm font-semibold text-stone-900">Select size</p>
							<div className="mt-3 flex flex-wrap gap-3">
								{product.variants.map((variant) => {
									const isSelected = selectedVariant?.id === variant.id;
									return (
										<button
											type="button"
											key={variant.id}
											className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-400"}`}
											onClick={() => {
												setSelectedVariantId(variant.id);
											}}
										>
											{variant.name}
										</button>
									);
								})}
							</div>
							<div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
								<p className="font-medium text-stone-900">{selectedVariant?.name ?? "Select a size"}</p>
								<p className="mt-1">
									{selectedVariant?.width} × {selectedVariant?.height} · {selectedVariant?.depth}
								</p>
								<p className="mt-1">
									{selectedVariant?.weight} · {selectedVariant?.stock} in stock
								</p>
							</div>
						</div>
						<div>
							<p className="text-sm font-semibold text-stone-900">Optional add-ons</p>
							<div className="mt-3 space-y-2">
								{product.addons.map((addon) => {
									const isSelected = selectedAddonIds.includes(addon.id);
									return (
										<button type="button" key={addon.id} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm text-left transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-700 hover:border-stone-400"}`} onClick={() => toggleAddon(addon.id)}>
											<span>
												{addon.name} {isSelected ? "✓" : "+€" + addon.price}
											</span>
											<span className={`text-sm ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{addon.description}</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>
					<Button className="mt-8 w-full" onClick={handleAddToCart} disabled={!selectedVariant}>
						Add to cart
					</Button>
				</div>
				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Material</p>
						<p className="mt-2 text-sm text-stone-600">{product.material}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Shipping</p>
						<p className="mt-2 text-sm text-stone-600">{product.shippingInfo}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
