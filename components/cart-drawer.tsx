"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X, ShoppingCart, Trash2, Truck, MapPin, Package, Loader2, Check } from "lucide-react";
import { getCartItems, updateCartItemQuantity, removeCartItem, clearCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { useProductsCatalog } from "@/lib/products-catalog";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { buildPackagesFromLines, STORE_PICKUP_ID, STORE_PICKUP_OPTION, type BringShippingOption } from "@/lib/shipping-client";
import type { CartItem } from "@/types/store";

type CartDrawerProps = {
	isOpen: boolean;
	onClose: () => void;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
	const products = useProductsCatalog();
	const [items, setItems] = useState<CartItem[]>([]);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");

	// Bring shipping state
	const [showShippingForm, setShowShippingForm] = useState(false);
	const [shippingPostalCode, setShippingPostalCode] = useState("");
	const [shippingCountry, setShippingCountry] = useState("NO");
	const [bringOptions, setBringOptions] = useState<BringShippingOption[]>([]);
	const [selectedShippingId, setSelectedShippingId] = useState<string | null>(STORE_PICKUP_ID);
	const [isLoadingBring, setIsLoadingBring] = useState(false);
	const [bringError, setBringError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setItems(getCartItems());
			setCheckoutError("");
			setShowShippingForm(false);
			setShippingPostalCode("");
			setBringOptions([]);
			setSelectedShippingId(STORE_PICKUP_ID);
			setBringError("");
		}
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

	// Lock body scroll when drawer is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
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

	const handleFetchBringOptions = async () => {
		if (!shippingPostalCode.trim()) {
			setBringError("Please enter a postal code.");
			return;
		}

		setIsLoadingBring(true);
		setBringError("");

		try {
			const lines = items.map((item) => {
				const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId);
				return { weight: variant?.weight, width: variant?.width, height: variant?.height, depth: variant?.depth, quantity: item.quantity };
			});
			const packages = buildPackagesFromLines(lines);

			const response = await fetch("/api/bring-shipping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					toPostalCode: shippingPostalCode.trim(),
					toCountry: shippingCountry,
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

	const selectedShippingOption = [...bringOptions, STORE_PICKUP_OPTION].find((option) => option.productId === selectedShippingId);
	const selectedShippingCost = selectedShippingOption ? selectedShippingOption.priceCents / 100 : 0;
	const estimatedTotal = subtotal + selectedShippingCost;

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

	const handleCheckout = async () => {
		setIsCheckingOut(true);
		setCheckoutError("");

		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items,
					customerEmail: user?.email,
					shippingAddress: {
						...(user?.user_metadata?.shipping_address || {}),
						postalCode: shippingPostalCode || undefined,
						country: shippingCountry || undefined,
					},
					selectedShippingId,
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

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

			{/* Drawer panel - slides from right on desktop, full-screen on mobile */}
			<div className="fixed inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-md">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-5 w-5 text-stone-700" />
						<h2 className="text-lg font-semibold text-stone-900">
							Your Cart{" "}
							<span className="text-sm font-normal text-stone-500">
								({totalItems} item{totalItems === 1 ? "" : "s"})
							</span>
						</h2>
					</div>
					<div className="flex items-center gap-2">
						{items.length > 0 ? (
							<button type="button" onClick={handleClearCart} className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-red-600">
								<Trash2 className="h-3.5 w-3.5" />
								Clear
							</button>
						) : null}
						<button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Close cart">
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Cart items */}
				<div className="flex-1 overflow-y-auto px-5 py-4">
					{items.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
								<ShoppingCart className="h-7 w-7 text-stone-400" />
							</div>
							<p className="mt-4 text-sm font-medium text-stone-900">Your cart is empty</p>
							<p className="mt-1 text-xs text-stone-500">Add a piece from the shop to start building your collection.</p>
							<Link href="/shop" onClick={onClose} className="mt-5 inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700">
								Browse products
							</Link>
						</div>
					) : (
						<div className="space-y-4">
							{items.map((item) => (
								<div key={`${item.productId}-${item.variantId}-${item.addonIds.join("-")}`} className="flex gap-3 rounded-2xl border border-stone-200 p-3">
									<div className="h-16 w-16 shrink-0 rounded-xl bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
									<div className="flex flex-1 flex-col">
										<div className="flex items-start justify-between gap-2">
											<div>
												<p className="text-sm font-semibold leading-5 text-stone-900">{item.name}</p>
												<p className="mt-0.5 text-xs text-stone-500">{item.variantName}</p>
											</div>
											<button type="button" onClick={() => handleRemoveItem(item)} className="text-stone-400 transition hover:text-red-600" aria-label={`Remove ${item.name}`}>
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
											<p className="text-sm font-semibold text-stone-900">NOK {item.price * item.quantity}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				{items.length > 0 ? (
					<div className="max-h-[70vh] overflow-y-auto border-t border-stone-200 px-5 py-4">
						<div className="flex items-center justify-between text-sm">
							<span className="text-stone-600">Subtotal</span>
							<span className="text-lg font-semibold text-stone-900">NOK {subtotal}</span>
						</div>

						{selectedShippingOption ? (
							<div className="mt-1 flex items-center justify-between text-sm">
								<span className="text-stone-600">Shipping</span>
								<span className="font-medium text-stone-900">{selectedShippingCost === 0 ? "Free" : `NOK ${selectedShippingCost}`}</span>
							</div>
						) : (
							<p className="mt-1 text-xs text-stone-500">Shipping and taxes calculated at checkout.</p>
						)}

						{selectedShippingOption ? (
							<div className="mt-1 flex items-center justify-between text-sm font-semibold text-stone-900">
								<span>Estimated total</span>
								<span>NOK {estimatedTotal}</span>
							</div>
						) : null}

						{/* Bring shipping calculator */}
						<div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Delivery method</p>

							<button
								type="button"
								onClick={() => setSelectedShippingId(STORE_PICKUP_ID)}
								className={`mt-2 w-full rounded-xl border p-3 text-left transition ${selectedShippingId === STORE_PICKUP_ID ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}
							>
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

							{!showShippingForm && bringOptions.length === 0 ? (
								<button type="button" onClick={() => setShowShippingForm(true)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100">
									<Truck className="h-3.5 w-3.5" />
									Calculate delivery costs
								</button>
							) : null}

							{bringOptions.length === 0 && showShippingForm ? (
								<div className="mt-2 rounded-xl border border-stone-200 bg-white p-3">
									<div className="grid grid-cols-2 gap-2">
										<select value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} className="w-full rounded-lg border border-stone-200 p-2 text-xs text-stone-900">
											{SHIPPING_COUNTRIES.map((c) => (
												<option key={c.code} value={c.code}>
													{c.name}
												</option>
											))}
										</select>
										<input type="text" placeholder="Postal code" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className="w-full rounded-lg border border-stone-200 p-2 text-xs text-stone-900" />
									</div>
									{bringError ? <p className="mt-2 text-xs text-red-600">{bringError}</p> : null}
									<button type="button" onClick={handleFetchBringOptions} disabled={isLoadingBring} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60">
										{isLoadingBring ? (
											<>
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
												Calculating...
											</>
										) : (
											"Get shipping rates"
										)}
									</button>
								</div>
							) : null}

							{bringOptions.length > 0 ? (
								<div className="mt-2 space-y-2">
									{bringOptions.map((option) => (
										<button key={option.productId} type="button" onClick={() => setSelectedShippingId(option.productId)} className={`w-full rounded-xl border p-3 text-left transition ${selectedShippingId === option.productId ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}>
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													{getDeliveryIcon(option.deliveryType)}
													<div>
														<p className="text-sm font-semibold text-stone-900">{option.displayName}</p>
														{option.expectedDelivery ? <p className="text-xs text-stone-500">{option.expectedDelivery}</p> : null}
													</div>
												</div>
												<p className="text-sm font-semibold text-stone-900">{option.priceCents === 0 ? "Free" : `NOK ${(option.priceCents / 100).toFixed(0)}`}</p>
											</div>
											{selectedShippingId === option.productId ? (
												<div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
													<Check className="h-3.5 w-3.5" />
													Selected
												</div>
											) : null}
										</button>
									))}
									<button
										type="button"
										onClick={() => {
											setBringOptions([]);
											setSelectedShippingId(STORE_PICKUP_ID);
										}}
										className="text-xs font-medium text-stone-500 underline underline-offset-2 hover:text-stone-700"
									>
										Change location
									</button>
								</div>
							) : null}
						</div>

						<button type="button" onClick={handleCheckout} disabled={isCheckingOut} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
							{isCheckingOut ? "Preparing checkout..." : "Proceed to Checkout"}
						</button>
						{checkoutError ? <p className="mt-2 text-center text-xs text-red-600">{checkoutError}</p> : null}
						<Link href="/cart" onClick={onClose} className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50">
							View Cart
						</Link>
					</div>
				) : null}
			</div>
		</div>
	);
}
