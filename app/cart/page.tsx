"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { clearCart, getCartItems, removeCartItem, updateCartItemQuantity } from "@/lib/cart";
import { useProductsCatalog } from "@/lib/products-catalog";
import type { CartItem } from "@/types/store";

export default function CartPage() {
	const products = useProductsCatalog();
	const [items, setItems] = useState<CartItem[]>([]);
	const [isMounted, setIsMounted] = useState(false);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");

	useEffect(() => {
		const syncItems = () => setItems(getCartItems());
		syncItems();
		setIsMounted(true);
		window.addEventListener("storage", syncItems);
		window.addEventListener("cart:updated", syncItems);

		return () => {
			window.removeEventListener("storage", syncItems);
			window.removeEventListener("cart:updated", syncItems);
		};
	}, []);

	const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
	const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

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

	const handleCheckout = async () => {
		setIsCheckingOut(true);
		setCheckoutError("");

		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
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
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
									{items.map((item) => (
										<div key={`${item.productId}-${item.variantId}-${item.addonIds.join("-")}`} className="flex flex-col gap-4 rounded-[1.5rem] border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex items-center gap-4">
												<div className="h-16 w-16 rounded-[1rem] bg-stone-100 bg-cover bg-center sm:h-20 sm:w-20" style={{ backgroundImage: `url('${item.image}')` }} />
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
												<p className="font-semibold text-stone-900">EUR {item.price * item.quantity}</p>
												<button type="button" onClick={() => handleRemoveItem(item)} className="text-sm font-medium text-stone-500 transition hover:text-stone-900">
													Remove
												</button>
											</div>
										</div>
									))}
								</div>
								<div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Summary</p>
									<div className="mt-4 flex items-center justify-between text-sm text-stone-600">
										<span>Subtotal</span>
										<span>EUR {subtotal}</span>
									</div>
									<button type="button" onClick={handleCheckout} disabled={isCheckingOut || items.length === 0} className="mt-6 w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
										{isCheckingOut ? "Preparing checkout..." : "Checkout"}
									</button>
									<Link href="/shop" className="mt-3 inline-flex w-full items-center justify-center text-sm font-semibold text-[#1B365D] underline-offset-4 transition hover:text-[#152d4c] hover:underline">
										Continue shopping
									</Link>
									{checkoutError ? <p className="mt-3 text-sm text-red-600">{checkoutError}</p> : null}
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
												<div className="aspect-5/6 w-full bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
												<div className="p-3 sm:p-4">
													<p className="line-clamp-2 text-sm font-semibold text-stone-900">{product.name}</p>
													<p className="mt-2 text-sm font-semibold text-[#1B365D]">EUR {product.variants[0]?.price ?? 0}</p>
												</div>
											</Link>
										))}
									</div>
								</section>
							) : null}
						</div>
					)}
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
