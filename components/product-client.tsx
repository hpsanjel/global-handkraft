"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/store";
import { Button } from "@/components/ui/button";
import { saveCartItems, getCartItems } from "@/lib/cart";

const mandapInquiryStorageKey = "global-handcraft-mandap-inquiries";

type MandapInquiry = {
	id: string;
	createdAt: string;
	productId: string;
	productSlug: string;
	length: string;
	width: string;
	height: string;
	material: string;
	expectedCostRange: string;
	description: string;
	whatsapp: string;
	email: string;
	sampleImages: string[];
};

function readMandapInquiries(): MandapInquiry[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const stored = window.localStorage.getItem(mandapInquiryStorageKey);
		if (!stored) {
			return [];
		}

		const parsed = JSON.parse(stored) as MandapInquiry[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveMandapInquiries(inquiries: MandapInquiry[]) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(mandapInquiryStorageKey, JSON.stringify(inquiries));
}

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(new Error("Unable to read image file."));
		};
		reader.onerror = () => reject(new Error("Unable to read image file."));
		reader.readAsDataURL(file);
	});
}

export function ProductClient({ product }: { product: Product }) {
	const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
	const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
	const [isMobileImageViewerOpen, setIsMobileImageViewerOpen] = useState(false);
	const [activePreviewImage, setActivePreviewImage] = useState(product.image);
	const [mandapLength, setMandapLength] = useState("");
	const [mandapWidth, setMandapWidth] = useState("");
	const [mandapHeight, setMandapHeight] = useState("");
	const [mandapMaterial, setMandapMaterial] = useState("");
	const [mandapExpectedCostRange, setMandapExpectedCostRange] = useState("");
	const [mandapDescription, setMandapDescription] = useState("");
	const [mandapWhatsapp, setMandapWhatsapp] = useState("");
	const [mandapEmail, setMandapEmail] = useState("");
	const [mandapSampleImages, setMandapSampleImages] = useState<string[]>([]);
	const [mandapFormError, setMandapFormError] = useState("");
	const [mandapFormSuccess, setMandapFormSuccess] = useState("");
	const [isSubmittingMandap, setIsSubmittingMandap] = useState(false);

	const selectedVariant = useMemo(() => product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0], [product.variants, selectedVariantId]);

	const selectedAddons = useMemo(() => product.addons.filter((addon) => selectedAddonIds.includes(addon.id)), [product.addons, selectedAddonIds]);

	const totalPrice = useMemo(() => {
		const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
		return (selectedVariant?.price ?? 0) + addonsTotal;
	}, [selectedAddons, selectedVariant]);

	const toggleAddon = (addonId: string) => {
		setSelectedAddonIds((current) => (current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]));
	};

	const displaySpecifications = product.specifications ?? [];
	const displayMaterials = product.materials ?? [product.material];
	const isMandapCustomProduct = product.category === "Pooja Mandap" || product.slug === "pooja-mandap";
	const isPoojaItemsProduct = product.category === "Pooja Items";
	const isTraditionalClothesProduct = product.category === "Traditional Clothes";

	useEffect(() => {
		setActivePreviewImage(product.image);
	}, [product.image]);

	const handleAddToCart = () => {
		const existingItems = getCartItems();
		const selectedVariantName = selectedVariant?.name ?? "Default option";
		const itemName = isPoojaItemsProduct ? product.name : `${product.name} (${selectedVariantName})`;
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

	const handleMandapSampleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setMandapFormError("");
		setMandapFormSuccess("");

		const fileList = event.target.files;
		if (!fileList || fileList.length === 0) {
			setMandapSampleImages([]);
			return;
		}

		const files = Array.from(fileList).slice(0, 3);
		if (fileList.length > 3) {
			setMandapFormError("You can upload a maximum of 3 sample images.");
		}

		try {
			const imageDataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
			setMandapSampleImages(imageDataUrls);
		} catch {
			setMandapFormError("One or more images could not be processed. Please try again.");
		}
	};

	const handleMandapInquirySubmit = () => {
		setMandapFormError("");
		setMandapFormSuccess("");

		const trimmedLength = mandapLength.trim();
		const trimmedWidth = mandapWidth.trim();
		const trimmedHeight = mandapHeight.trim();
		const trimmedMaterial = mandapMaterial.trim();
		const trimmedExpectedCostRange = mandapExpectedCostRange.trim();
		const trimmedDescription = mandapDescription.trim();
		const trimmedWhatsapp = mandapWhatsapp.trim();
		const trimmedEmail = mandapEmail.trim();

		if (!trimmedLength || !trimmedWidth || !trimmedHeight || !trimmedMaterial || !trimmedExpectedCostRange || !trimmedDescription) {
			setMandapFormError("Please fill all required mandap details before submitting.");
			return;
		}

		if (!trimmedWhatsapp && !trimmedEmail) {
			setMandapFormError("Please provide WhatsApp number and/or email for follow-up.");
			return;
		}

		setIsSubmittingMandap(true);

		const inquiry: MandapInquiry = {
			id: `mandap-inquiry-${Date.now()}-${Math.round(Math.random() * 1000)}`,
			createdAt: new Date().toISOString(),
			productId: product.id,
			productSlug: product.slug,
			length: trimmedLength,
			width: trimmedWidth,
			height: trimmedHeight,
			material: trimmedMaterial,
			expectedCostRange: trimmedExpectedCostRange,
			description: trimmedDescription,
			whatsapp: trimmedWhatsapp,
			email: trimmedEmail,
			sampleImages: mandapSampleImages,
		};

		const existingInquiries = readMandapInquiries();
		saveMandapInquiries([inquiry, ...existingInquiries]);

		setIsSubmittingMandap(false);
		setMandapFormSuccess("Mandap request submitted. Our team will contact you soon.");

		setMandapLength("");
		setMandapWidth("");
		setMandapHeight("");
		setMandapMaterial("");
		setMandapExpectedCostRange("");
		setMandapDescription("");
		setMandapWhatsapp("");
		setMandapEmail("");
		setMandapSampleImages([]);
	};

	if (isMandapCustomProduct) {
		return (
			<div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
				<div className="space-y-4">
					<div className="aspect-[4/5] rounded-[2rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
				</div>

				<div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Custom Mandap Request</p>
					<h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Order Customized Pooja Mandap</h1>
					<p className="mt-4 mb-6 text-sm leading-7 text-stone-600">We do not keep readymade mandaps. Share your preferred size, material, budget, and references so our team can guide you with personalized options and next steps.</p>
					<div className="grid gap-4 sm:grid-cols-3">
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Length *</span>
							<input value={mandapLength} onChange={(event) => setMandapLength(event.target.value)} placeholder="e.g. 10 ft" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Width *</span>
							<input value={mandapWidth} onChange={(event) => setMandapWidth(event.target.value)} placeholder="e.g. 8 ft" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Height *</span>
							<input value={mandapHeight} onChange={(event) => setMandapHeight(event.target.value)} placeholder="e.g. 9 ft" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
					</div>

					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Material *</span>
							<input value={mandapMaterial} onChange={(event) => setMandapMaterial(event.target.value)} placeholder="e.g. Teak + Fabric + Brass" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Expected Cost Range *</span>
							<input value={mandapExpectedCostRange} onChange={(event) => setMandapExpectedCostRange(event.target.value)} placeholder="e.g. EUR 2,000 - 3,500" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
					</div>

					<label className="mt-4 block space-y-2 text-sm text-stone-600">
						<span className="font-medium text-stone-700">Mandap Description *</span>
						<textarea value={mandapDescription} onChange={(event) => setMandapDescription(event.target.value)} rows={5} placeholder="Describe stage style, pillars, colors, canopy, backdrop, rituals, location setup, and any custom requirements." className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
					</label>

					<label className="mt-4 block space-y-2 text-sm text-stone-600">
						<span className="font-medium text-stone-700">Sample Images (Max 3)</span>
						<input type="file" accept="image/*" multiple onChange={handleMandapSampleImagesChange} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700" />
					</label>

					{mandapSampleImages.length > 0 ? (
						<div className="mt-3 grid gap-3 sm:grid-cols-3">
							{mandapSampleImages.map((image, index) => (
								<div key={`mandap-sample-${index}`} className="aspect-square rounded-2xl border border-stone-200 bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
							))}
						</div>
					) : null}

					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">WhatsApp Number</span>
							<input value={mandapWhatsapp} onChange={(event) => setMandapWhatsapp(event.target.value)} placeholder="e.g. +47 00000000" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Email Address</span>
							<input type="email" value={mandapEmail} onChange={(event) => setMandapEmail(event.target.value)} placeholder="e.g. name@email.com" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
					</div>

					<p className="mt-2 text-xs text-stone-500">Provide WhatsApp and/or email so our admin team can contact you with design options and next steps.</p>

					{mandapFormError ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{mandapFormError}</p> : null}
					{mandapFormSuccess ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mandapFormSuccess}</p> : null}

					<Button className="mt-6 w-full" onClick={handleMandapInquirySubmit} disabled={isSubmittingMandap}>
						{isSubmittingMandap ? "Submitting..." : "Submit Mandap Request"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
			<div className="hidden space-y-4 lg:block">
				<div className="aspect-[4/5] rounded-[2rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
				<div className="grid gap-4 sm:grid-cols-3">
					{product.gallery.map((image) => (
						<div key={image} className="aspect-square rounded-[1.25rem] border border-stone-200 bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
					))}
				</div>
			</div>
			<div className="pb-24 lg:pb-0">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">{product.category}</p>
				<h1 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-4xl">{product.name}</h1>
				<p className="mt-3 text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">{product.shortDescription}</p>
				<button
					type="button"
					onClick={() => {
						setActivePreviewImage(product.image);
						setIsMobileImageViewerOpen(true);
					}}
					className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm transition hover:bg-stone-50 lg:hidden"
				>
					<div className="h-16 w-16 rounded-xl bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
					<span className="text-sm font-medium text-stone-700">Tap to view full image</span>
				</button>
				<div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
					{product.woodType ? <span className="rounded-full border border-stone-300 bg-white px-3 py-1">Wood: {product.woodType}</span> : null}
					{product.color ? <span className="rounded-full border border-stone-300 bg-white px-3 py-1">Color: {product.color}</span> : null}
					{!isPoojaItemsProduct && product.sizeLabel ? <span className="rounded-full border border-stone-300 bg-white px-3 py-1">Size: {product.sizeLabel}</span> : null}
				</div>
				<div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-medium text-stone-500">{isPoojaItemsProduct ? "Ready to order" : "Selected option"}</p>
						<p className="text-3xl font-semibold text-stone-900">€{totalPrice}</p>
					</div>
					{isPoojaItemsProduct ? (
						""
					) : (
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
									{!isTraditionalClothesProduct ? (
										<p className="mt-1">
											{selectedVariant?.weight} · {selectedVariant?.stock} in stock
										</p>
									) : null}
								</div>
							</div>
							<div>
								<p className="text-sm font-semibold text-stone-900">Optional add-ons</p>
								<div className="mt-3 space-y-2">
									{product.addons.map((addon) => {
										const isSelected = selectedAddonIds.includes(addon.id);
										return (
											<button type="button" key={addon.id} className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition sm:flex-row sm:items-center sm:justify-between ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-700 hover:border-stone-400"}`} onClick={() => toggleAddon(addon.id)}>
												<div>
													<p className="font-medium">
														{addon.name} {isSelected ? "✓" : "+€" + addon.price}
													</p>
													<p className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{addon.description}</p>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						</div>
					)}
					<Button className="mt-8 w-full" onClick={handleAddToCart} disabled={!selectedVariant}>
						Add to Cart
					</Button>
				</div>
				<p className="mt-5 text-sm leading-7 text-stone-600 sm:text-base">{product.description}</p>
				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Material</p>
						<p className="mt-2 text-sm text-stone-600">{displayMaterials.join(", ")}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Shipping</p>
						<p className="mt-2 text-sm text-stone-600">{selectedVariant?.shippingNote?.trim() ? selectedVariant.shippingNote : product.shippingInfo}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Dimensions</p>
						<p className="mt-2 text-sm text-stone-600">{product.dimensions ?? `${selectedVariant?.width ?? "N/A"} x ${selectedVariant?.height ?? "N/A"} x ${selectedVariant?.depth ?? "N/A"}`}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Weight</p>
						<p className="mt-2 text-sm text-stone-600">{product.weight ?? selectedVariant?.weight ?? "N/A"}</p>
					</div>
				</div>

				<div className="mt-8 space-y-4">
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Handcrafted Story</p>
						<p className="mt-2 text-sm leading-7 text-stone-600">{product.handcraftedStory ?? product.description}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Handmade Process</p>
						<p className="mt-2 text-sm leading-7 text-stone-600">{product.handmadeProcess ?? "Each piece is hand-finished by skilled artisans and quality checked before shipping."}</p>
					</div>
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Care Instructions</p>
						<p className="mt-2 text-sm leading-7 text-stone-600">{product.careInstructions ?? "Keep dry, dust with a soft cloth, and avoid direct harsh sunlight exposure."}</p>
					</div>

					{displaySpecifications.length > 0 ? (
						<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
							<p className="text-sm font-semibold text-stone-900">Specifications</p>
							<ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-stone-600">
								{displaySpecifications.map((spec) => (
									<li key={spec}>{spec}</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			</div>

			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
					<div>
						<p className="text-xs text-stone-500">Total</p>
						<p className="text-lg font-semibold text-stone-900">€{totalPrice}</p>
					</div>
					<Button className="rounded-full px-6" onClick={handleAddToCart} disabled={!selectedVariant}>
						Add to Cart
					</Button>
				</div>
			</div>

			{isMobileImageViewerOpen ? (
				<div className="fixed inset-0 z-50 flex flex-col bg-black/90 lg:hidden" onClick={() => setIsMobileImageViewerOpen(false)}>
					<div className="flex items-center justify-end p-4">
						<button type="button" className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-sm font-semibold text-white" onClick={() => setIsMobileImageViewerOpen(false)}>
							Close
						</button>
					</div>
					<div className="flex-1 px-4 pb-6" onClick={(event) => event.stopPropagation()}>
						<div className="h-full w-full rounded-2xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url('${activePreviewImage}')` }} />
					</div>
				</div>
			) : null}
		</div>
	);
}
