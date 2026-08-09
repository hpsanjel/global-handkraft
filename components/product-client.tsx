"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { Product } from "@/types/store";
import { Button } from "@/components/ui/button";
import { saveCartItems, getCartItems } from "@/lib/cart";
import { variantLabel } from "@/lib/product-transform";
import { PriceEstimate } from "@/components/price-estimate";
import { Ruler, Weight, PackageCheck, PackageX } from "lucide-react";
import { getZoneMarkupClient } from "@/lib/price-zones-client";
import { useDetectedCountry } from "@/hooks/use-detected-country";

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
	const [selectedGalleryImage, setSelectedGalleryImage] = useState(product.image);
	const [mandapLength, setMandapLength] = useState("");
	const [mandapWidth, setMandapWidth] = useState("");
	const [mandapHeight, setMandapHeight] = useState("");
	const [mandapMaterial, setMandapMaterial] = useState("");
	const [mandapExpectedCostRange, setMandapExpectedCostRange] = useState("");
	const [mandapDescription, setMandapDescription] = useState("");
	const [mandapWhatsapp, setMandapWhatsapp] = useState("");
	const [mandapEmail, setMandapEmail] = useState("");
	const [mandapSampleImages, setMandapSampleImages] = useState<string[]>([]);
	const [mandapSampleImageFiles, setMandapSampleImageFiles] = useState<File[]>([]);
	const [mandapFormError, setMandapFormError] = useState("");
	const [mandapFormSuccess, setMandapFormSuccess] = useState("");
	const [isSubmittingMandap, setIsSubmittingMandap] = useState(false);
	const [cartFeedback, setCartFeedback] = useState("");
	const [showCustomTempleForm, setShowCustomTempleForm] = useState(false);

	const { country: detectedCountry, isDetecting: isDetectingCountry } = useDetectedCountry();
	const [zoneMarkup, setZoneMarkup] = useState(0);

	useEffect(() => {
		if (!detectedCountry) return;
		setZoneMarkup(getZoneMarkupClient(detectedCountry));
	}, [detectedCountry]);

	const selectedVariant = useMemo(() => product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0], [product.variants, selectedVariantId]);

	const availableColors = useMemo(() => {
		const seen = new Set<string>();
		const colors: Array<{ color: string; image: string }> = [];
		product.gallery.forEach((image, index) => {
			const color = product.galleryColors?.[index]?.trim();
			if (color && !seen.has(color)) {
				seen.add(color);
				colors.push({ color, image });
			}
		});
		return colors;
	}, [product.gallery, product.galleryColors]);

	const selectedColor = useMemo(() => availableColors.find((entry) => entry.image === selectedGalleryImage)?.color ?? "", [availableColors, selectedGalleryImage]);

	const hasVariantColors = useMemo(() => product.variants.some((variant) => (variant.color ?? "").trim() !== ""), [product.variants]);

	const sizeOptions = useMemo(() => {
		const seen = new Set<string>();
		const sizes: string[] = [];
		product.variants.forEach((variant) => {
			if (!seen.has(variant.name)) {
				seen.add(variant.name);
				sizes.push(variant.name);
			}
		});
		return sizes;
	}, [product.variants]);

	const colorOptionsForSelectedSize = useMemo(() => {
		const seen = new Set<string>();
		const colors: string[] = [];
		product.variants
			.filter((variant) => variant.name === selectedVariant?.name)
			.forEach((variant) => {
				const color = (variant.color ?? "").trim();
				if (color && !seen.has(color)) {
					seen.add(color);
					colors.push(color);
				}
			});
		return colors;
	}, [product.variants, selectedVariant]);

	const syncGalleryToColor = (color?: string) => {
		const trimmed = color?.trim();
		if (!trimmed) return;
		const match = availableColors.find((entry) => entry.color.trim().toLowerCase() === trimmed.toLowerCase());
		if (match) {
			setSelectedGalleryImage(match.image);
			setActivePreviewImage(match.image);
		}
	};

	const selectSize = (name: string) => {
		const candidates = product.variants.filter((variant) => variant.name === name);
		const target = candidates.find((variant) => variant.color === selectedVariant?.color) ?? candidates[0];
		if (!target) return;
		setSelectedVariantId(target.id);
		syncGalleryToColor(target.color);
	};

	const selectColor = (color: string) => {
		const target = product.variants.find((variant) => variant.name === selectedVariant?.name && variant.color === color);
		if (!target) return;
		setSelectedVariantId(target.id);
		syncGalleryToColor(color);
	};

	const selectedAddons = useMemo(() => product.addons.filter((addon) => selectedAddonIds.includes(addon.id)), [product.addons, selectedAddonIds]);

	const basePrice = useMemo(() => {
		const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
		return (selectedVariant?.price ?? 0) + addonsTotal;
	}, [selectedAddons, selectedVariant]);

	const totalPrice = useMemo(() => basePrice + zoneMarkup, [basePrice, zoneMarkup]);

	const toggleAddon = (addonId: string) => {
		setSelectedAddonIds((current) => (current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId]));
	};

	const displaySpecifications = product.specifications ?? [];
	const hasMultipleVariants = product.variants.length > 1;
	const categoryName = product.category?.toLowerCase() ?? "";
	const categorySlug = product.categorySlug?.toLowerCase() ?? "";
	const isMandapCategory = categoryName.includes("mandap") || categorySlug.includes("mandap");
	const isTempleCategory = categoryName.includes("temple") || categorySlug.includes("temple");
	const customInquiryEnabled = isMandapCategory || displaySpecifications.some((spec) => spec.toLowerCase().includes("custom inquiry")) || displaySpecifications.some((spec) => spec.toLowerCase().includes("custom request")) || product.slug.includes("custom") || showCustomTempleForm;
	const inquiryCategory = isTempleCategory ? "Temple" : "Mandap";

	const isOutOfStock = selectedVariant?.stock !== undefined && selectedVariant.stock <= 0;

	const handleAddToCart = () => {
		if (isOutOfStock) {
			return;
		}

		const existingItems = getCartItems();
		const selectedVariantName = variantLabel(selectedVariant?.name, selectedVariant?.color) || "Default option";
		const itemName = hasMultipleVariants ? `${product.name} (${selectedVariantName})` : product.name;
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
		setCartFeedback("Added to Cart");
		window.dispatchEvent(new Event("cart:updated"));
		window.dispatchEvent(new Event("cart:drawer:open"));
	};

	const handleMandapSampleImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		setMandapFormError("");
		setMandapFormSuccess("");

		const fileList = event.target.files;
		if (!fileList || fileList.length === 0) {
			setMandapSampleImages([]);
			setMandapSampleImageFiles([]);
			return;
		}

		const files = Array.from(fileList).slice(0, 3);
		if (fileList.length > 3) {
			setMandapFormError("You can upload a maximum of 3 sample images.");
		}

		try {
			const imageDataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
			setMandapSampleImages(imageDataUrls);
			setMandapSampleImageFiles(files);
		} catch {
			setMandapFormError("One or more images could not be processed. Please try again.");
		}
	};

	const handleCustomInquirySubmit = async () => {
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
			setMandapFormError("Please fill all required details before submitting.");
			return;
		}

		if (!trimmedWhatsapp && !trimmedEmail) {
			setMandapFormError("Please provide WhatsApp number and/or email for follow-up.");
			return;
		}

		setIsSubmittingMandap(true);

		try {
			const formData = new FormData();
			formData.set("productId", product.id);
			formData.set("productName", product.name);
			formData.set("productSlug", product.slug);
			formData.set("category", inquiryCategory);
			formData.set("length", trimmedLength);
			formData.set("width", trimmedWidth);
			formData.set("height", trimmedHeight);
			formData.set("material", trimmedMaterial);
			formData.set("expectedCostRange", trimmedExpectedCostRange);
			formData.set("description", trimmedDescription);
			formData.set("whatsapp", trimmedWhatsapp);
			formData.set("email", trimmedEmail);
			mandapSampleImageFiles.forEach((file) => formData.append("sampleImages", file));

			const response = await fetch("/api/mandap-inquiries", {
				method: "POST",
				body: formData,
			});

			const result = (await response.json().catch(() => null)) as { error?: string } | null;

			if (!response.ok) {
				setMandapFormError(result?.error || "Unable to submit request. Please try again.");
				return;
			}

			setMandapFormSuccess("Your request for custom design has been received. You will get response within 24 hours.");
			setMandapLength("");
			setMandapWidth("");
			setMandapHeight("");
			setMandapMaterial("");
			setMandapExpectedCostRange("");
			setMandapDescription("");
			setMandapWhatsapp("");
			setMandapEmail("");
			setMandapSampleImages([]);
			setMandapSampleImageFiles([]);
		} catch {
			setMandapFormError("Unable to submit request. Please check your connection and try again.");
		} finally {
			setIsSubmittingMandap(false);
		}
	};

	if (customInquiryEnabled) {
		return (
			<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<div className="space-y-4">
					<div className="aspect-[4/5] rounded-[2rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
				</div>

				<div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
					{showCustomTempleForm && !isMandapCategory ? (
						<button type="button" onClick={() => setShowCustomTempleForm(false)} className="mb-4 text-sm font-medium text-stone-500 hover:text-stone-800">
							&larr; Back to product
						</button>
					) : null}
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Custom Request</p>
					<h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Request a custom {isTempleCategory ? "temple" : product.name}</h1>
					<p className="mt-4 mb-6 text-sm leading-7 text-stone-600">{isTempleCategory ? "Want a temple in a different size, material, or design than what's shown? Share your preferred dimensions, material, budget, and references so our team can guide you with personalized options and next steps." : "We do not keep this product as a fixed ready-made option. Share your preferred size, material, budget, and references so our team can guide you with personalized options and next steps."}</p>
					<div className="grid gap-4 sm:grid-cols-3">
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Length *</span>
							<input value={mandapLength} onChange={(event) => setMandapLength(event.target.value)} placeholder="e.g. 40 cm" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Width *</span>
							<input value={mandapWidth} onChange={(event) => setMandapWidth(event.target.value)} placeholder="e.g. 20cm" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Height *</span>
							<input value={mandapHeight} onChange={(event) => setMandapHeight(event.target.value)} placeholder="e.g. 60 cm" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
					</div>

					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Material *</span>
							<input value={mandapMaterial} onChange={(event) => setMandapMaterial(event.target.value)} placeholder="e.g. Teak + Fabric + Brass" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
						<label className="space-y-2 text-sm text-stone-600">
							<span className="font-medium text-stone-700">Expected Cost Range *</span>
							<input value={mandapExpectedCostRange} onChange={(event) => setMandapExpectedCostRange(event.target.value)} placeholder="e.g. NOK 20,000 - 35,000" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" />
						</label>
					</div>

					<label className="mt-4 block space-y-2 text-sm text-stone-600">
						<span className="font-medium text-stone-700">Project Description *</span>
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

					<Button className="mt-6 w-full" onClick={handleCustomInquirySubmit} disabled={isSubmittingMandap}>
						{isSubmittingMandap ? "Submitting..." : "Submit Request"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
			<div className="hidden lg:flex lg:min-w-0 lg:gap-4">
				<div className="flex shrink-0 flex-col gap-4">
					{product.gallery.map((image) => (
						<button key={image} type="button" onClick={() => setSelectedGalleryImage(image)} className={`aspect-square w-20 shrink-0 rounded-[1.25rem] border bg-stone-100 bg-cover bg-center transition ${selectedGalleryImage === image ? "border-stone-900 ring-2 ring-stone-900" : "border-stone-200 hover:border-stone-400"}`} style={{ backgroundImage: `url('${image}')` }} aria-label="View image" />
					))}
				</div>
				<div className="aspect-[4/5] min-w-0 flex-1 rounded-[2rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${selectedGalleryImage}')` }} />
			</div>
			<div className="min-w-0 pb-24 lg:pb-0">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">{product.category}</p>
				<h1 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-4xl">{product.name}</h1>
				<p className="mt-3 text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">{product.shortDescription}</p>
				<div className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:hidden">
					{(product.gallery.length > 0 ? product.gallery : [product.image]).map((image) => (
						<button
							key={image}
							type="button"
							onClick={() => {
								setActivePreviewImage(image);
								setIsMobileImageViewerOpen(true);
							}}
							className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 bg-stone-100 bg-cover bg-center shadow-sm transition active:scale-95"
							style={{ backgroundImage: `url('${image}')` }}
							aria-label="View image full screen"
						/>
					))}
				</div>
				<div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-medium text-stone-500">{hasMultipleVariants ? "Selected option" : "Ready to order"}</p>
						<div className="text-right">
							<p className="text-3xl font-semibold text-stone-900">
								NOK {totalPrice}
								{zoneMarkup > 0 && !isDetectingCountry ? <span className="ml-2 text-xs font-normal text-stone-500">(includes zone surcharge)</span> : null}
							</p>
							<PriceEstimate amountNok={totalPrice} className="text-sm text-stone-500" />
						</div>
					</div>
					<div className="mt-6 space-y-4">
						<div>
							<div className="flex gap-3">
								<p className="text-sm font-semibold text-stone-900">Size</p>
								{isTempleCategory ? (
									<button type="button" onClick={() => setShowCustomTempleForm(true)} className="cursor-pointer text-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900">
										(Click here to order custom temple)
									</button>
								) : null}
							</div>
							{hasVariantColors ? (
								sizeOptions.length > 1 ? (
									<div className="mt-3 flex flex-wrap gap-3">
										{sizeOptions.map((name) => {
											const isSelected = selectedVariant?.name === name;
											return (
												<button type="button" key={name} className={`rounded-full cursor-pointer border px-4 py-2 text-sm font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-400"}`} onClick={() => selectSize(name)}>
													{name}
												</button>
											);
										})}
									</div>
								) : (
									<p className="mt-3 text-sm font-medium text-stone-900">{selectedVariant?.name ?? "Standard"}</p>
								)
							) : hasMultipleVariants ? (
								<div className="mt-3 flex flex-wrap gap-3">
									{product.variants.map((variant) => {
										const isSelected = selectedVariant?.id === variant.id;
										return (
											<button
												type="button"
												key={variant.id}
												className={`rounded-full cursor-pointer border px-4 py-2 text-sm font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-400"}`}
												onClick={() => {
													setSelectedVariantId(variant.id);
												}}
											>
												{variant.name}
											</button>
										);
									})}
								</div>
							) : (
								<p className="mt-3 text-sm font-medium text-stone-900">{selectedVariant?.name ?? "Standard"}</p>
							)}

							{selectedVariant?.width || selectedVariant?.height || selectedVariant?.depth || selectedVariant?.weight ? (
								<div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">Dimensions & Weight</p>

									<div className="mt-3 grid gap-3 sm:grid-cols-2">
										{(selectedVariant?.width || selectedVariant?.height || selectedVariant?.depth) && (
											<div className="flex items-start gap-2.5">
												<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white border border-stone-200">
													<Ruler className="h-4 w-4 text-[#1B365D]" />
												</div>
												<div>
													<p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">W × H × D</p>
													<p className="mt-0.5 text-sm font-medium text-stone-900">{[selectedVariant?.width, selectedVariant?.height, selectedVariant?.depth].filter(Boolean).join(" × ")}</p>
												</div>
											</div>
										)}

										{selectedVariant?.weight && (
											<div className="flex items-start gap-2.5">
												<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white border border-stone-200">
													<Weight className="h-4 w-4 text-[#1B365D]" />
												</div>
												<div>
													<p className="text-[11px] uppercase tracking-[0.1em] text-stone-500">Weight</p>
													<p className="mt-0.5 text-sm font-medium text-stone-900">{selectedVariant.weight}</p>
												</div>
											</div>
										)}
									</div>

									{selectedVariant?.stock !== undefined && (
										<div className="mt-4 flex items-center gap-2 border-t border-stone-200 pt-3">
											{selectedVariant.stock > 0 ? (
												<>
													<PackageCheck className="h-4 w-4 text-emerald-600" />
													<span className="text-sm font-medium text-emerald-700">{selectedVariant.stock} in stock</span>
												</>
											) : (
												<>
													<PackageX className="h-4 w-4 text-red-500" />
													<span className="text-sm font-medium text-red-600">Out of stock</span>
												</>
											)}
										</div>
									)}
								</div>
							) : null}
						</div>
						{hasVariantColors ? (
							colorOptionsForSelectedSize.length > 0 ? (
								<div>
									<p className="text-sm font-semibold text-stone-900">Colour</p>
									<div className="mt-3 flex flex-wrap gap-3">
										{colorOptionsForSelectedSize.map((color) => {
											const isSelected = selectedVariant?.color === color;
											return (
												<button type="button" key={color} onClick={() => selectColor(color)} className={`rounded-full cursor-pointer border px-4 py-2 text-sm font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-400"}`}>
													{color}
												</button>
											);
										})}
									</div>
								</div>
							) : null
						) : availableColors.length > 0 ? (
							<div>
								<p className="text-sm font-semibold text-stone-900">Colour</p>
								<div className="mt-3 flex flex-wrap gap-3">
									{availableColors.map((entry) => {
										const isSelected = selectedColor === entry.color;
										return (
											<button
												type="button"
												key={entry.color}
												onClick={() => {
													setSelectedGalleryImage(entry.image);
													setActivePreviewImage(entry.image);
												}}
												className={`rounded-full cursor-pointer border px-4 py-2 text-sm font-medium transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-400"}`}
											>
												{entry.color}
											</button>
										);
									})}
								</div>
							</div>
						) : null}
						{product.addons.length > 0 ? (
							<div>
								<p className="text-sm font-semibold text-stone-900">Optional add-ons</p>
								<div className="mt-3 space-y-2">
									{product.addons.map((addon) => {
										const isSelected = selectedAddonIds.includes(addon.id);
										return (
											<button type="button" key={addon.id} className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left text-sm transition sm:flex-row sm:items-center sm:justify-between ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-700 hover:border-stone-400"}`} onClick={() => toggleAddon(addon.id)}>
												<div>
													<p className="font-medium">
														{addon.name} {isSelected ? "✓" : "+NOK " + addon.price}
														{!isSelected ? <PriceEstimate amountNok={addon.price} className="ml-1 text-xs text-stone-400" /> : null}
													</p>
													<p className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{addon.description}</p>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						) : null}
					</div>

					<Button className="mt-8 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" onClick={handleAddToCart} disabled={!selectedVariant || isOutOfStock}>
						{isOutOfStock ? "Out of Stock" : "Add to Cart"}
					</Button>
				</div>
				<p className="mt-5 text-sm leading-7 text-stone-600 sm:text-base p-4">{product.description}</p>
				{isTempleCategory ? (
					<p className="px-4 text-sm text-stone-600">
						Need a different size or design?{" "}
						<button type="button" onClick={() => setShowCustomTempleForm(true)} className="font-semibold text-stone-900 underline underline-offset-4 hover:text-stone-700">
							Click here to order custom temple
						</button>
					</p>
				) : null}
				<div className="mt-2">
					<div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold text-stone-900">Shipping</p>
						<p className="mt-2 text-sm text-stone-600">{selectedVariant?.shippingNote?.trim() ? selectedVariant.shippingNote : product.shippingInfo}</p>
					</div>
				</div>
			</div>

			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
					<div>
						<p className="text-xs text-stone-500">Total</p>
						<p className="text-lg font-semibold text-stone-900">NOK {totalPrice}</p>
						<PriceEstimate amountNok={totalPrice} className="text-xs text-stone-500" />
					</div>
					<div className="flex flex-col items-end gap-2">
						<Button className="rounded-full px-6 disabled:cursor-not-allowed disabled:opacity-50" onClick={handleAddToCart} disabled={!selectedVariant || isOutOfStock}>
							{isOutOfStock ? "Out of Stock" : "Add to Cart"}
						</Button>
						{isTempleCategory ? (
							<button type="button" onClick={() => setShowCustomTempleForm(true)} className="text-xs font-medium text-stone-600 underline underline-offset-4">
								Order custom temple
							</button>
						) : null}
						{cartFeedback ? (
							<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
								<p className="font-medium">Added to Cart</p>
								<Link href="/cart" className="mt-1 inline-flex items-center font-semibold text-emerald-800 hover:underline">
									View Basket
								</Link>
							</div>
						) : null}
					</div>
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
