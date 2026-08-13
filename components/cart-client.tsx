"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearCart, getCartItems, removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { useProductsCatalog } from "@/lib/products-catalog";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { buildPackagesFromLines, STORE_PICKUP_ID, STORE_PICKUP_OPTION, type BringShippingOption } from "@/lib/shipping-client";
import { useDetectedCountry } from "@/hooks/use-detected-country";
import { resolveZoneMarkup, type PriceZoneWithCountries } from "@/lib/price-zones-shared";
import { Package, MapPin, Truck, Loader2, Check } from "lucide-react";
import type { CartItem } from "@/types/store";
import { PriceEstimate } from "@/components/price-estimate";

export function CartClient({ priceZones }: { priceZones: PriceZoneWithCountries[] }) {
	const products = useProductsCatalog();
	const [items, setItems] = useState<CartItem[]>([]);
	const [isMounted, setIsMounted] = useState(false);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "VIPPS">("STRIPE");

	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number; freeShipping: boolean; finalSubtotal: number } | null>(null);
	const [couponError, setCouponError] = useState("");
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

	const [showShippingForm, setShowShippingForm] = useState(false);
	const [shippingPostalCode, setShippingPostalCode] = useState("");
	const [shippingCountry, setShippingCountry] = useState("NO");
	const [bringOptions, setBringOptions] = useState<BringShippingOption[]>([]);
	const [selectedShippingId, setSelectedShippingId] = useState<string | null>(STORE_PICKUP_ID);
	const [isLoadingBring, setIsLoadingBring] = useState(false);
	const [bringError, setBringError] = useState("");
	const [savedAddressUsed, setSavedAddressUsed] = useState<{ postalCode: string; city?: string } | null>(null);

	const { country: detectedCountry, isDetecting: isDetectingCountry } = useDetectedCountry();

	useEffect(() => {
		const syncItems = () => setItems(getCartItems());
		const initialSyncId = window.setTimeout(() => {
			syncItems();
			setIsMounted(true);
		}, 0);
		window.addEventListener("storage", syncItems);
		window.addEventListener("cart:updated", syncItems);
		window.addEventListener("pageshow", syncItems);

		return () => {
			window.clearTimeout(initialSyncId);
			window.removeEventListener("storage", syncItems);
			window.removeEventListener("cart:updated", syncItems);
			window.removeEventListener("pageshow", syncItems);
		};
	}, []);

	useEffect(() => {
		if (detectedCountry && isDetectingCountry === false) {
			setShippingCountry(detectedCountry);
		}
	}, [detectedCountry, isDetectingCountry]);

	const fetchBringOptions = async (postalCode: string, country: string, cartItems: CartItem[]) => {
		setIsLoadingBring(true);
		setBringError("");

		try {
			const lines = cartItems.map((item) => {
				const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
				return { weight: variant?.weight, width: variant?.width, height: variant?.height, depth: variant?.depth, quantity: item.quantity };
			});
			const packages = buildPackagesFromLines(lines);

			const response = await fetch("/api/bring-shipping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toPostalCode: postalCode.trim(),
					toCountry: country,
					packages,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Unable to fetch shipping options.");
			}

			setBringOptions(data.products || []);

			if (data.products?.length > 0) {
				const cheapest = data.products.reduce((min: BringShippingOption, p: BringShippingOption) => (p.priceCents < min.priceCents ? p : min));
				setSelectedShippingId(cheapest.productId);
			}
		} catch (error) {
			setBringError(error instanceof Error ? error.message : "Unable to fetch shipping options.");
			setBringOptions([]);
		} finally {
			setIsLoadingBring(false);
		}
	};

	useEffect(() => {
		let active = true;
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			if (!active) return;
			const saved = data.user?.user_metadata?.shipping_address as { postalCode?: string; country?: string; city?: string } | undefined;
			if (!saved?.postalCode || !saved?.country) return;

			setShippingPostalCode(saved.postalCode);
			setShippingCountry(saved.country);

			const cartItems = getCartItems();
			if (cartItems.length > 0) {
				setSavedAddressUsed({ postalCode: saved.postalCode, city: saved.city });
				void fetchBringOptions(saved.postalCode, saved.country, cartItems);
			}
		});
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isDetectingCountry === false && detectedCountry) {
			const cartItems = getCartItems();
			if (cartItems.length > 0 && bringOptions.length === 0 && !showShippingForm) {
				void fetchBringOptions(shippingPostalCode, detectedCountry, cartItems);
			}
		}
	}, [isDetectingCountry, detectedCountry, shippingPostalCode, bringOptions.length, showShippingForm]);

	const useDifferentAddress = () => {
		setSavedAddressUsed(null);
		setBringOptions([]);
		setSelectedShippingId(STORE_PICKUP_ID);
		setShowShippingForm(true);
	};

	useEffect(() => {
		if (appliedCoupon?.freeShipping && selectedShippingId !== STORE_PICKUP_ID) {
			setSelectedShippingId(STORE_PICKUP_ID);
			setShowShippingForm(false);
			setBringOptions([]);
		}
	}, [appliedCoupon, selectedShippingId]);

	const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => {
			const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
			const basePrice = variant?.price ?? item.price;
			return sum + basePrice * item.quantity;
		}, 0);
	}, [items, products]);

	const subtotalWithMarkup = useMemo(() => {
		return items.reduce((sum, item) => {
			const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
			const basePrice = variant?.price ?? item.price;
			const addonSum = item.addonIds.reduce((addonSum, addonId) => {
				const product = products.find((p) => p.id === item.productId);
				const addon = product?.addons.find((a) => a.id === addonId);
				return addonSum + (addon?.price ?? 0);
			}, 0);
			const itemBasePrice = basePrice + addonSum;
			const markup = resolveZoneMarkup(priceZones, shippingCountry);
			return sum + (itemBasePrice + markup) * item.quantity;
		}, 0);
	}, [items, products, shippingCountry, priceZones]);

	const handleFetchBringOptions = () => {
		if (!shippingPostalCode.trim()) {
			setBringError("Please enter a postal code.");
			return;
		}
		setSavedAddressUsed(null);
		void fetchBringOptions(shippingPostalCode, shippingCountry, items);
	};

	const recommendedProducts = useMemo(() => {
		const cartProductIds = new Set(items.map((item) => item.productId));
		const cartProducts = products.filter((product) => cartProductIds.has(product.id));

		const categoryCount = cartProducts.reduce<Record<string, number>>((acc, product) => {
			acc[product.category] = (acc[product.category] ?? 0) + 1;
			return acc;
		}, {});

		const avgCartPrice = items.length > 0 ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;
		const candidates = products.filter((product) => !cartProductIds.has(product.id));

		return candidates
			.map((product) => {
				const sameCategoryScore = (categoryCount[product.category] ?? 0) * 120;
				const featuredScore = product.featured ? 30 : 0;
				const ratingScore = product.rating * 10;
				const productPrice = product.variants[0]?.price ?? 0;
				const priceDistance = avgCartPrice > 0 ? Math.abs(productPrice - avgCartPrice) : 0;
				const priceAffinityScore = avgCartPrice > 0 ? Math.max(0, 40 - priceDistance / 8) : 15;

				return {
					product,
					score: sameCategoryScore + featuredScore + ratingScore + priceAffinityScore,
				};
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 4)
			.map((entry) => entry.product);
	}, [items, products]);

	const handleQuantityChange = (item: CartItem, delta: number) => {
		updateCartItemQuantity(item.productId, item.variantId, item.addonIds, delta);
		setItems(getCartItems());
	};

	const handleRemoveItem = (item: CartItem) => {
		removeCartItem(item.productId, item.variantId, item.addonIds);
		setItems(getCartItems());
	};

	const handleClearCart = () => {
		clearCart();
		setItems(getCartItems());
	};

	const handleApplyCoupon = async () => {
		if (!couponCode.trim()) {
			setCouponError("Please enter a coupon code.");
			return;
		}

		setIsValidatingCoupon(true);
		setCouponError("");

		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const response = await fetch("/api/coupons/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: couponCode,
					subtotal: subtotalWithMarkup,
					email: user?.email,
				}),
			});

			const data = await response.json();

			if (!response.ok || !data.valid) {
				throw new Error(data.error || "Invalid coupon code.");
			}

			setAppliedCoupon({
				code: couponCode.toUpperCase(),
				discountPct: data.discountPct,
				freeShipping: data.freeShipping,
				finalSubtotal: data.finalSubtotal,
			});
		} catch (error) {
			setCouponError(error instanceof Error ? error.message : "Unable to apply coupon.");
			setAppliedCoupon(null);
		} finally {
			setIsValidatingCoupon(false);
		}
	};

	const handleRemoveCoupon = () => {
		setCouponCode("");
		setAppliedCoupon(null);
		setCouponError("");
	};

	const getSelectedShippingCost = (): number => {
		if (!selectedShippingId) return 0;
		const option = [...bringOptions, STORE_PICKUP_OPTION].find((o: BringShippingOption) => o.productId === selectedShippingId);
		return option ? option.priceCents / 100 : 0;
	};

	const handleCheckout = async () => {
		setIsCheckingOut(true);
		setCheckoutError("");

		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const savedAddress = (user?.user_metadata?.shipping_address as { postalCode?: string; country?: string } | undefined) || {};

			const response = await fetch(paymentMethod === "VIPPS" ? "/api/checkout/vipps" : "/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items,
					customerEmail: user?.email,
					shippingAddress: {
						...savedAddress,
						postalCode: shippingPostalCode || savedAddress.postalCode || undefined,
						country: shippingCountry || savedAddress.country || undefined,
					},
					selectedShippingId: appliedCoupon?.freeShipping ? "FREE_SHIPPING_COUPON" : selectedShippingId,
					couponCode: appliedCoupon?.code,
				}),
			});

			const text = await response.text();
			let data: { url?: string; error?: string } = {};
			if (text) {
				try {
					data = JSON.parse(text) as { url?: string; error?: string };
				} catch {
					data = { error: text };
				}
			}

			if (!response.ok || !data.url) {
				throw new Error(data.error || "Unable to start checkout.");
			}

			window.location.assign(data.url);
		} catch (error) {
			setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
		} finally {
			setIsCheckingOut(false);
		}
	};

	const selectedShippingCost = getSelectedShippingCost();
	const displaySubtotal = appliedCoupon ? appliedCoupon.finalSubtotal : subtotalWithMarkup;
	const shippingCostAfterCoupon = appliedCoupon?.freeShipping ? 0 : selectedShippingCost;
	const estimatedTotal = displaySubtotal + shippingCostAfterCoupon;

	const getDeliveryIcon = (type: string) => {
		switch (type) {
			case "PICKUP":
				return <MapPin className="h-4 w-4" />;
			case "MAILBOX":
				return <Package className="h-4 w-4" />;
			default:
				return <Truck className="h-4 w-4" />;
		}
	};

	const getDeliveryTypeLabel = (type: string) => {
		switch (type) {
			case "PICKUP":
				return "Pickup point";
			case "MAILBOX":
				return "Mailbox delivery";
			default:
				return "Home delivery";
		}
	};

	return (
		<div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Cart</p>
					<h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">Your curated selections</h1>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-sm text-stone-600">{isMounted ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Loading..."}</p>
					{items.length > 0 ? (
						<button type="button" onClick={handleClearCart} className="text-sm font-medium text-stone-600 transition hover:text-stone-900">
							Clear all
						</button>
					) : null}
				</div>
			</div>

			{items.length === 0 ? (
				<div className="mt-8 rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-center sm:p-10">
					<p className="text-lg font-semibold text-stone-900">Your cart is empty.</p>
					<p className="mt-2 text-sm text-stone-600">Add a piece from the shop to start building your collection.</p>
					<Link href="/shop" className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
						Browse products
					</Link>
				</div>
			) : (
				<div className="mt-8 space-y-8">
					<div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
						<div className="space-y-4">
							{items.map((item) => {
								const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
								const basePrice = variant?.price ?? item.price;
								const addonSum = item.addonIds.reduce((sum, addonId) => {
									const product = products.find((p) => p.id === item.productId);
									const addon = product?.addons.find((a) => a.id === addonId);
									return sum + (addon?.price ?? 0);
								}, 0);
								const itemTotalBase = (basePrice + addonSum) * item.quantity;

								return (
									<div key={`${item.productId}-${item.variantId}-${item.addonIds.join("-")}`} className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-4">
											<div
												className="h-16 w-16 rounded-[1rem] bg-stone-100 bg-cover bg-center sm:h-20 sm:w-20"
												style={{
													backgroundImage: `url('${item.image}')`,
												}}
											/>
											<div>
												<p className="font-semibold text-stone-900">{item.name}</p>
												<p className="mt-1 text-sm text-stone-600">{item.variantName}</p>
											</div>
										</div>
										<div className="flex flex-row items-center justify-between gap-3 text-sm text-stone-600 sm:flex-col sm:items-end">
											<div className="flex items-center rounded-full border border-stone-200 bg-white p-1">
												<button type="button" onClick={() => handleQuantityChange(item, -1)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-stone-100">
													-
												</button>
												<span className="min-w-8 text-center font-semibold text-stone-900">{item.quantity}</span>
												<button type="button" onClick={() => handleQuantityChange(item, 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-stone-100">
													+
												</button>
											</div>
											<div className="text-right">
												<p className="font-semibold text-stone-900">NOK {itemTotalBase}</p>
												<PriceEstimate amountNok={itemTotalBase} className="text-xs text-stone-500" />
											</div>
											<button type="button" onClick={() => handleRemoveItem(item)} className="text-sm font-medium text-stone-500 transition hover:text-stone-900">
												Remove
											</button>
										</div>
									</div>
								);
							})}
						</div>
						<div className="space-y-6">
							<div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Summary</p>
								<div className="mt-4 space-y-3">
									<div className="flex items-center justify-between text-sm text-stone-600">
										<span>Subtotal</span>
										<span className="text-right">
											NOK {displaySubtotal}
											<PriceEstimate amountNok={displaySubtotal} className="block text-xs text-stone-500" />
										</span>
									</div>
									{selectedShippingId && !appliedCoupon?.freeShipping ? (
										<div className="flex items-center justify-between text-sm">
											<span className="text-stone-600">Shipping</span>
											<span className="text-right font-medium text-stone-900">
												{selectedShippingCost === 0 ? (
													"Free"
												) : (
													<>
														NOK {selectedShippingCost}
														<PriceEstimate amountNok={selectedShippingCost} className="block text-xs font-normal text-stone-500" />
													</>
												)}
											</span>
										</div>
									) : (
										<div className="flex items-center justify-between text-sm text-stone-500">
											<span>Shipping</span>
											<span>Calculated at checkout</span>
										</div>
									)}
									<div className="border-t border-stone-200 pt-3">
										<div className="flex items-center justify-between text-sm font-semibold text-stone-900">
											<span>Estimated total</span>
											<span className="text-right">
												NOK {estimatedTotal}
												<PriceEstimate amountNok={estimatedTotal} className="block text-xs font-normal text-stone-500" />
											</span>
										</div>
									</div>
								</div>

								{appliedCoupon ? (
									<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
										<div className="flex items-center justify-between">
											<div>
												<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Coupon Applied</p>
												<p className="mt-1 font-mono text-sm font-semibold text-emerald-900">{appliedCoupon.code}</p>
												<p className="text-xs text-emerald-700">
													{appliedCoupon.discountPct}% discount {appliedCoupon.freeShipping && "• Free shipping"}
												</p>
											</div>
											<button type="button" onClick={handleRemoveCoupon} className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
												Remove
											</button>
										</div>
									</div>
								) : (
									<div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
										<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Have a coupon?</p>
										<div className="mt-2 flex gap-2">
											<input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm uppercase" onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} />
											<button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon} className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60">
												{isValidatingCoupon ? "Applying..." : "Apply"}
											</button>
										</div>
										{couponError ? <p className="mt-2 text-xs text-red-600">{couponError}</p> : null}
									</div>
								)}

								{!appliedCoupon?.freeShipping && (
									<button type="button" onClick={() => setSelectedShippingId(STORE_PICKUP_ID)} className={`mt-4 w-full rounded-[1rem] border p-3 text-left transition ${selectedShippingId === STORE_PICKUP_ID ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4" />
												<div>
													<p className="text-sm font-semibold text-stone-900">{STORE_PICKUP_OPTION.displayName}</p>
													<p className="text-xs text-stone-500">{STORE_PICKUP_OPTION.expectedDelivery}</p>
												</div>
											</div>
											<p className="text-sm font-semibold text-stone-900">Free</p>
										</div>
										{selectedShippingId === STORE_PICKUP_ID ? (
											<div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
												<Check className="h-3.5 w-3.5" />
												Selected
											</div>
										) : null}
									</button>
								)}

								{isLoadingBring && bringOptions.length === 0 ? (
									<p className="mt-4 flex items-center gap-1.5 text-xs text-stone-500">
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
										Checking rates for your saved address...
									</p>
								) : null}

								{!showShippingForm && !isLoadingBring && bringOptions.length === 0 ? (
									<button type="button" onClick={() => setShowShippingForm(true)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
										<Truck className="h-4 w-4" />
										Calculate shipping costs
									</button>
								) : null}

								{!appliedCoupon?.freeShipping && bringOptions.length === 0 && showShippingForm ? (
									<div className="mt-4 rounded-[1rem] border border-stone-200 bg-white p-4">
										<label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Delivery location</label>
										<div className="mt-2 grid grid-cols-2 gap-2">
											<div>
												<select value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} className="w-full rounded-[0.75rem] border border-stone-200 p-2.5 text-sm text-stone-900">
													{SHIPPING_COUNTRIES.map((c) => (
														<option key={c.code} value={c.code}>
															{c.name}
														</option>
													))}
												</select>
											</div>
											<div>
												<input type="text" placeholder="Postal code" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className="w-full rounded-[0.75rem] border border-stone-200 p-2.5 text-sm text-stone-900" />
											</div>
										</div>
										{bringError && <p className="mt-2 text-xs text-red-600">{bringError}</p>}
										<button type="button" onClick={handleFetchBringOptions} disabled={isLoadingBring} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60">
											{isLoadingBring ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Calculating...
												</>
											) : (
												"Get shipping rates"
											)}
										</button>
									</div>
								) : null}

								{!appliedCoupon?.freeShipping && bringOptions.length > 0 ? (
									<div className="mt-4 space-y-2">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Select shipping method</p>
											{savedAddressUsed ? (
												<p className="text-xs text-stone-500">
													Using saved address ({savedAddressUsed.city ? `${savedAddressUsed.city}, ` : ""}
													{savedAddressUsed.postalCode})
												</p>
											) : null}
										</div>
										{bringOptions.map((option) => (
											<button key={option.productId} type="button" onClick={() => setSelectedShippingId(option.productId)} className={`w-full rounded-[1rem] border p-3 text-left transition ${selectedShippingId === option.productId ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
												<div className="flex items-start justify-between gap-3">
													<div className="flex items-center gap-2">
														{getDeliveryIcon(option.deliveryType)}
														<div>
															<p className="text-sm font-semibold text-stone-900">{option.displayName}</p>
															<p className="text-xs text-stone-500">{getDeliveryTypeLabel(option.deliveryType)}</p>
														</div>
													</div>
													<div className="text-right">
														<p className="text-sm font-semibold text-stone-900">{option.priceCents === 0 ? "Free" : `NOK ${(option.priceCents / 100).toFixed(0)}`}</p>
														{option.priceCents > 0 && <PriceEstimate amountNok={option.priceCents / 100} className="text-xs text-stone-500" />}
														{option.expectedDelivery && <p className="text-xs text-stone-500">{option.expectedDelivery}</p>}
													</div>
												</div>
												{selectedShippingId === option.productId && (
													<div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
														<Check className="h-3.5 w-3.5" />
														Selected
													</div>
												)}
											</button>
										))}

										<button type="button" onClick={useDifferentAddress} className="mt-1 text-xs font-medium text-stone-500 underline underline-offset-2 hover:text-stone-700">
											Change location
										</button>
									</div>
								) : null}

								<div className="mt-6 grid grid-cols-2 gap-2">
									<button type="button" onClick={() => setPaymentMethod("STRIPE")} className={`rounded-[1rem] border p-2.5 text-center text-xs font-semibold transition ${paymentMethod === "STRIPE" ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
										Card (Stripe)
									</button>
									<button type="button" onClick={() => setPaymentMethod("VIPPS")} className={`rounded-[1rem] border p-2.5 text-center text-xs font-semibold transition ${paymentMethod === "VIPPS" ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
										Vipps
									</button>
								</div>

								<button type="button" onClick={handleCheckout} disabled={isCheckingOut || items.length === 0} className="mt-2 w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
									{isCheckingOut ? (paymentMethod === "VIPPS" ? "Redirecting to Vipps..." : "Redirecting to Stripe...") : appliedCoupon?.freeShipping ? "Proceed to Checkout" : paymentMethod === "VIPPS" ? "Checkout with Vipps" : "Checkout with Stripe"}
								</button>
								<Link href="/shop" className="mt-3 inline-flex w-full items-center justify-center text-sm font-semibold text-[#1B365D] underline-offset-4 transition hover:text-[#152d4c] hover:underline">
									Continue shopping
								</Link>
								{checkoutError ? <p className="mt-3 text-sm text-red-600">{checkoutError}</p> : null}
								<p className="mt-4 text-center text-xs leading-5 text-stone-500">
									By proceeding, I accept the{" "}
									<Link href="/terms" className="font-medium text-[#1B365D] underline underline-offset-2 transition hover:text-[#152d4c]">
										terms & conditions
									</Link>
									.
								</p>
							</div>
						</div>
					</div>

					{recommendedProducts.length > 0 ? (
						<section className="rounded-[1.5rem] border border-stone-200 bg-stone-50/50 p-4 sm:p-6">
							<div className="flex items-end justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Recommended for you</p>
									<h2 className="mt-1 text-lg font-semibold text-stone-900 sm:text-xl">You may also like</h2>
								</div>
								<Link href="/shop" className="text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
									Show all
								</Link>
							</div>
							<div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
								{recommendedProducts.map((product) => (
									<Link key={product.id} href={`/product/${product.slug}`} className="group overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm transition md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-md">
										<div
											className="aspect-5/6 w-full bg-stone-100 bg-cover bg-center"
											style={{
												backgroundImage: `url('${product.image}')`,
											}}
										/>
										<div className="p-3 sm:p-4">
											<p className="line-clamp-2 text-sm font-semibold text-stone-900">{product.name}</p>
											<p className="mt-2 text-sm font-semibold text-[#1B365D]">NOK {product.variants[0]?.price ?? 0}</p>
											<PriceEstimate amountNok={product.variants[0]?.price ?? 0} className="text-xs text-stone-500" />
										</div>
									</Link>
								))}
							</div>
						</section>
					) : null}
				</div>
			)}
		</div>
	);
}
