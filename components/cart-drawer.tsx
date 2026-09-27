"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X, ShoppingCart, Trash2, Check } from "lucide-react";
import { getCartItems, updateCartItemQuantity, removeCartItem, clearCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { useProductsCatalog } from "@/lib/products-catalog";
import type { CartItem } from "@/types/store";
import { useFormattedPrice } from "@/components/product-price";
import { resolveZoneMarkup, type PriceZoneWithCountries } from "@/lib/price-zones-shared";
import { usePriceZones } from "@/components/price-zones-provider";
import { VisaMark, MastercardMark } from "@/components/payment-marks";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";

type CartDrawerProps = {
	isOpen: boolean;
	onClose: () => void;
	priceZones: PriceZoneWithCountries[];
};

export function CartDrawer({ isOpen, onClose, priceZones }: CartDrawerProps) {
	const products = useProductsCatalog();
	const { formatPrice, currency, isConverted } = useFormattedPrice();
	const { detectedCountry } = usePriceZones();
	const [items, setItems] = useState<CartItem[]>([]);
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
		if (!isOpen) {
			return;
		}

		const timer = window.setTimeout(() => {
			setItems(getCartItems());
			setCheckoutError("");
		}, 0);

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
			window.clearTimeout(timer);
		};
	}, [isOpen]);

	useEffect(() => {
		const syncItems = () => setItems(getCartItems());
		window.addEventListener("cart:updated", syncItems);
		window.addEventListener("storage", syncItems);
		return () => {
			window.removeEventListener("cart:updated", syncItems);
			window.removeEventListener("storage", syncItems);
		};
	}, []);

	const subtotal = useMemo(() => {
		return items.reduce((sum, item) => {
			const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
			const basePrice = variant?.price ?? item.price;
			const addonSum = item.addonIds.reduce((addonSum, addonId) => {
				const product = products.find((p) => p.id === item.productId);
				const addon = product?.addons.find((a) => a.id === addonId);
				return addonSum + (addon?.price ?? 0);
			}, 0);
			const markup = resolveZoneMarkup(priceZones, shippingCountry);
			return sum + (basePrice + addonSum + markup) * item.quantity;
		}, 0);
	}, [items, products, shippingCountry, priceZones]);
	const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

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
		<Dialog open={isOpen} onClose={onClose} variant="sheet-right">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
				<div className="flex items-center gap-2">
					<ShoppingCart className="h-5 w-5 text-stone-700" />
					<DialogTitle className="text-lg font-semibold text-stone-900">
						Your Cart{" "}
						<span className="text-sm font-normal text-stone-700">
							({totalItems} item{totalItems === 1 ? "" : "s"})
						</span>
					</DialogTitle>
				</div>
				<div className="flex items-center gap-2">
					{items.length > 0 ? (
						<button type="button" onClick={handleClearCart} className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 transition hover:text-red-600">
							<Trash2 className="h-3.5 w-3.5" />
							Clear
						</button>
					) : null}
					<button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Close cart">
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Empty state */}
			{items.length === 0 ? (
				<div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
						<ShoppingCart className="h-7 w-7 text-stone-700" />
					</div>
					<p className="mt-4 text-sm font-medium text-stone-900">Your cart is empty</p>
					<p className="mt-1 text-xs text-stone-700">Add a piece from the shop to start building your collection.</p>
					<Link href="/shop" onClick={onClose} className="mt-5 inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700">
						Browse products
					</Link>
				</div>
			) : (
				<>
					{/* Cart items: scroll region */}
					<div className="flex-1 overflow-y-auto px-5 py-4">
						<div className="space-y-4">
							{items.map((item) => (
								<div key={`${item.productId}-${item.variantId}-${item.addonIds.join("-")}`} className="flex gap-3 rounded-2xl border border-stone-200 p-3">
									<ProductImage src={item.image} alt={item.name} sizes="64px" className="h-16 w-16 shrink-0 rounded-xl bg-stone-100" />
									<div className="flex flex-1 flex-col">
										<div className="flex items-start justify-between gap-2">
											<div>
												<p className="text-sm font-semibold leading-5 text-stone-900">{item.name}</p>
												<p className="mt-0.5 text-xs text-stone-700">{item.variantName}</p>
											</div>
											<button type="button" onClick={() => handleRemoveItem(item)} className="text-stone-700 transition hover:text-red-600" aria-label={`Remove ${item.name}`}>
												<X className="h-4 w-4" />
											</button>
										</div>
										<div className="mt-auto flex items-center justify-between pt-2">
											<div className="flex items-center rounded-full border border-stone-200 bg-white p-0.5">
												<button type="button" onClick={() => handleQuantityChange(item, -1)} className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-stone-100" aria-label="Decrease quantity">
													-
												</button>
												<span className="min-w-7 text-center text-sm font-semibold text-stone-900">{item.quantity}</span>
												<button type="button" onClick={() => handleQuantityChange(item, 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-stone-100" aria-label="Increase quantity">
													+
												</button>
											</div>
											<div className="text-right">
												{(() => {
													const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
													const basePrice = variant?.price ?? item.price;
													const addonSum = item.addonIds.reduce((sum, addonId) => {
														const product = products.find((p) => p.id === item.productId);
														const addon = product?.addons.find((a) => a.id === addonId);
														return sum + (addon?.price ?? 0);
													}, 0);
													const markup = resolveZoneMarkup(priceZones, shippingCountry);
													const lineTotalNok = (basePrice + addonSum + markup) * item.quantity;
													return <p className="text-sm font-semibold text-stone-900">{formatPrice(lineTotalNok, { includeMarkup: false })}</p>;
												})()}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Order total + payment + checkout: always visible, never scrolled out of view */}
					<div className="shrink-0 border-t border-stone-200 px-5 py-4">
						<div className="flex items-center justify-between text-sm">
							<span className="text-stone-700">Subtotal</span>
							<span className="font-medium text-stone-900">{formatPrice(subtotal, { includeMarkup: false })}</span>
						</div>

						<div className="mt-1 flex items-center justify-between text-sm">
							<span className="text-stone-700">Shipping</span>
							<span className="font-semibold text-emerald-600">Free</span>
						</div>

						<div className="mt-2 border-t border-dashed border-stone-200 pt-2">
							<div className="flex items-center justify-between text-base font-semibold text-stone-900">
								<span>Total</span>
								<span>{formatPrice(subtotal, { includeMarkup: false })}</span>
							</div>
							{isConverted ? <p className="mt-1 text-right text-xs text-stone-700">Equivalent to approx. NOK {subtotal.toFixed(2)}</p> : null}
						</div>

						{/* Payment method — large, image-led cards so Stripe vs. Vipps is unmistakable */}
						<div className="mt-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Pay with</p>
							<div className="mt-2 grid grid-cols-2 gap-3">
								<button type="button" onClick={() => setPaymentMethod("STRIPE")} aria-pressed={paymentMethod === "STRIPE"} className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 py-4 transition ${paymentMethod === "STRIPE" ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}>
									{paymentMethod === "STRIPE" ? (
										<span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
											<Check className="h-2.5 w-2.5" />
										</span>
									) : null}
									<div className="flex items-center gap-1.5">
										<VisaMark className="h-6 w-9" />
										<MastercardMark className="h-6 w-9" />
									</div>
									<span className="text-xs font-semibold text-stone-900">Card</span>
								</button>
								<button type="button" onClick={() => setPaymentMethod("VIPPS")} aria-pressed={paymentMethod === "VIPPS"} className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 py-4 transition ${paymentMethod === "VIPPS" ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}>
									{paymentMethod === "VIPPS" ? (
										<span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
											<Check className="h-2.5 w-2.5" />
										</span>
									) : null}
									<Image src="/images/vipps-logo.webp" alt="Vipps" width={80} height={26} className="h-6.5 w-20 rounded object-contain" />
									<span className="text-xs font-semibold text-stone-900">Vipps</span>
								</button>
							</div>
						</div>

						<button type="button" onClick={handleCheckout} disabled={isCheckingOut} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
							{isCheckingOut ? "Preparing checkout..." : paymentMethod === "VIPPS" ? "Checkout with Vipps" : "Checkout with Stripe"}
						</button>
						{checkoutError ? (
							<InlineAlert tone="error" className="mt-2 justify-center text-center">
								{checkoutError}
							</InlineAlert>
						) : null}
						<Link href="/cart" onClick={onClose} className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50">
							View Cart
						</Link>
					</div>
				</>
			)}
		</Dialog>
	);
}
