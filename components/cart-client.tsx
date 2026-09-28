"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearCart, getCartItems, removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { useProductsCatalog } from "@/lib/products-catalog";
import { createClient } from "@/lib/supabase/client";
import { usePriceZones } from "@/components/price-zones-provider";
import { resolveZoneMarkup, type PriceZoneWithCountries } from "@/lib/price-zones-shared";
import type { CartItem } from "@/types/store";
import { useFormattedPrice, ProductPrice } from "@/components/product-price";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ProductImage } from "@/components/ui/product-image";
import { SHIPPING_COUNTRIES, isVippsSupportedCountry } from "@/lib/shipping-countries";
import { isCurrencyManuallySet, setPreferredCurrency } from "@/lib/currency-preference";
import { detectCurrencyFromCountry } from "@/lib/locale-currency";

export function CartClient({ priceZones }: { priceZones: PriceZoneWithCountries[] }) {
	const products = useProductsCatalog();
	const { formatPrice, currency, isConverted } = useFormattedPrice();
	const { detectedCountry } = usePriceZones();
	const [items, setItems] = useState<CartItem[]>([]);
	const [isMounted, setIsMounted] = useState(false);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "VIPPS">("STRIPE");
	const [shippingCountry, setShippingCountry] = useState(() => detectedCountry || "NO");

	useEffect(() => {
		if (detectedCountry) {
			setShippingCountry(detectedCountry);
		}
	}, [detectedCountry]);

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
		let active = true;
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			if (!active) return;
			const saved = data.user?.user_metadata?.shipping_address as { country?: string } | undefined;
			if (saved?.country) {
				setShippingCountry(saved.country);
			}
		});
		return () => {
			active = false;
		};
	}, []);

	const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => {
			const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
			const basePrice = variant?.price ?? item.price;
			const addonSum = item.addonIds.reduce((s, addonId) => {
				const product = products.find((p) => p.id === item.productId);
				const addon = product?.addons.find((a) => a.id === addonId);
				return s + (addon?.price ?? 0);
			}, 0);
			const markup = resolveZoneMarkup(priceZones, shippingCountry);
			return sum + (basePrice + addonSum + markup) * item.quantity;
		}, 0);
	}, [items, products, priceZones, shippingCountry]);

	const recommendedProducts = useMemo(() => {
		if (items.length === 0 || products.length === 0) return [];
		const cartProductIds = new Set(items.map((item) => item.productId));
		const cartCategories = new Set(products.filter((p) => cartProductIds.has(p.id)).map((p) => p.category));
		const cartAvgPrice = items.reduce((sum, item) => sum + item.price, 0) / items.length;

		return products
			.filter((product) => !cartProductIds.has(product.id))
			.map((product) => {
				const price = product.variants[0]?.price ?? 0;
				const sameCategoryScore = cartCategories.has(product.category) ? 3 : 0;
				const featuredScore = product.featured ? 2 : 0;
				const ratingScore = (product.rating ?? 0) / 2;
				const priceDiffRatio = cartAvgPrice > 0 ? Math.abs(price - cartAvgPrice) / cartAvgPrice : 1;
				const priceAffinityScore = Math.max(0, 2 - priceDiffRatio);

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
					currency,
					customerEmail: user?.email,
					shippingAddress: {
						...savedAddress,
						country: shippingCountry || savedAddress.country || undefined,
					},
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

	return (
		<div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Cart</p>
					<h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">Your curated selections</h1>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<p className="text-sm text-stone-700">{isMounted ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Loading..."}</p>
					{items.length > 0 ? (
						<button type="button" onClick={handleClearCart} className="text-sm font-medium text-stone-700 transition hover:text-stone-900">
							Clear all
						</button>
					) : null}
				</div>
			</div>

			{items.length === 0 ? (
				<div className="mt-8 rounded-[1.5rem] border border-dashed border-stone-300 p-6 text-center sm:p-10">
					<p className="text-lg font-semibold text-stone-900">Your cart is empty.</p>
					<p className="mt-2 text-sm text-stone-700">Add a piece from the shop to start building your collection.</p>
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
								const markup = resolveZoneMarkup(priceZones, shippingCountry);
								const itemTotal = (basePrice + addonSum + markup) * item.quantity;

								return (
									<div key={`${item.productId}-${item.variantId}-${item.addonIds.join("-")}`} className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-4">
											<ProductImage src={item.image} alt={item.name} sizes="80px" className="h-16 w-16 rounded-[1rem] bg-stone-100 sm:h-20 sm:w-20" />
											<div>
												<p className="font-semibold text-stone-900">{item.name}</p>
												<p className="mt-1 text-sm text-stone-700">{item.variantName}</p>
											</div>
										</div>
										<div className="flex flex-row items-center justify-between gap-3 text-sm text-stone-700 sm:flex-col sm:items-end">
											<div className="flex items-center rounded-full border border-stone-200 bg-white p-1">
												<button type="button" onClick={() => handleQuantityChange(item, -1)} aria-label={`Decrease quantity of ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-stone-100">
													-
												</button>
												<span className="min-w-8 text-center font-semibold text-stone-900">{item.quantity}</span>
												<button type="button" onClick={() => handleQuantityChange(item, 1)} aria-label={`Increase quantity of ${item.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-stone-100">
													+
												</button>
											</div>
											<div className="text-right">
												<p className="font-semibold text-stone-900">{formatPrice(itemTotal, { includeMarkup: false })}</p>
											</div>
											<button type="button" onClick={() => handleRemoveItem(item)} className="text-sm font-medium text-stone-700 transition hover:text-stone-900">
												Remove
											</button>
										</div>
									</div>
								);
							})}
						</div>
						<div className="space-y-6">
							<div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-700">Summary</p>
								<div className="mt-4 space-y-3">
									<div className="flex items-center justify-between text-sm text-stone-700">
										<span>Subtotal</span>
										<span className="text-right font-medium text-stone-900">{formatPrice(subtotal, { includeMarkup: false })}</span>
									</div>
									<div className="flex items-center justify-between text-sm text-stone-700">
										<span>Shipping</span>
										<span className="font-semibold text-emerald-600">Free</span>
									</div>
									<div className="border-t border-stone-200 pt-3">
										<div className="flex items-center justify-between text-sm font-semibold text-stone-900">
											<span>Estimated total</span>
											<span className="text-right">{formatPrice(subtotal, { includeMarkup: false })}</span>
										</div>
										{isConverted ? <p className="mt-1 text-right text-xs text-stone-700">Equivalent to approx. NOK {subtotal.toFixed(2)}</p> : null}
									</div>

									<div className="border-t border-stone-200 py-3.5">
										<label htmlFor="shipping-destination" className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
											Shipping destination
										</label>
										<select
											id="shipping-destination"
											value={shippingCountry}
											onChange={(e) => {
												const newCountry = e.target.value;
												setShippingCountry(newCountry);
												if (!isVippsSupportedCountry(newCountry) && paymentMethod === "VIPPS") {
													setPaymentMethod("STRIPE");
												}
												if (!isCurrencyManuallySet()) {
													setPreferredCurrency(detectCurrencyFromCountry(newCountry), { manual: false });
												}
											}}
											className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
										>
											{SHIPPING_COUNTRIES.map((c) => (
												<option key={c.code} value={c.code}>
													{c.name}
												</option>
											))}
										</select>
									</div>
								</div>

								{isVippsSupportedCountry(shippingCountry) ? (
									<div className="mt-6 grid grid-cols-2 gap-2">
										<button type="button" onClick={() => setPaymentMethod("STRIPE")} aria-pressed={paymentMethod === "STRIPE"} className={`rounded-[1rem] border p-2.5 text-center text-xs font-semibold transition ${paymentMethod === "STRIPE" ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
											Card (Stripe)
										</button>
										<button type="button" onClick={() => setPaymentMethod("VIPPS")} aria-pressed={paymentMethod === "VIPPS"} className={`rounded-[1rem] border p-2.5 text-center text-xs font-semibold transition ${paymentMethod === "VIPPS" ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-300 bg-white"}`}>
											Vipps
										</button>
									</div>
								) : null}

								<button type="button" onClick={handleCheckout} disabled={isCheckingOut || items.length === 0} className="mt-4 w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
									{isCheckingOut ? (paymentMethod === "VIPPS" ? "Redirecting to Vipps..." : "Redirecting to Stripe...") : paymentMethod === "VIPPS" ? "Checkout with Vipps" : "Checkout with Stripe"}
								</button>
								<Link href="/shop" className="mt-3 inline-flex w-full items-center justify-center text-sm font-semibold text-[#1B365D] underline-offset-4 transition hover:text-[#152d4c] hover:underline">
									Continue shopping
								</Link>
								{checkoutError ? (
									<InlineAlert tone="error" className="mt-3 text-sm">
										{checkoutError}
									</InlineAlert>
								) : null}
								<p className="mt-4 text-center text-xs leading-5 text-stone-700">
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
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Recommended for you</p>
									<h2 className="mt-1 text-lg font-semibold text-stone-900 sm:text-xl">You may also like</h2>
								</div>
								<Link href="/shop" className="text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
									Show all
								</Link>
							</div>
							<div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
								{recommendedProducts.map((product) => (
									<Link key={product.id} href={`/product/${product.slug}`} className="group overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm transition md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-md">
										<ProductImage src={product.image} alt={product.name} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-5/6 w-full bg-stone-100" />
										<div className="p-3 sm:p-4">
											<p className="line-clamp-2 text-sm font-semibold text-stone-900">{product.name}</p>
											<ProductPrice amountNok={product.variants[0]?.price ?? 0} className="mt-2 block text-sm font-semibold text-[#1B365D]" />
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
