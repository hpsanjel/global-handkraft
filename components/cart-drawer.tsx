"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X, ShoppingCart, Trash2, Truck, MapPin, Package, Loader2, Check } from "lucide-react";
import { getCartItems, updateCartItemQuantity, removeCartItem, clearCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { useProductsCatalog } from "@/lib/products-catalog";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { buildPackagesFromLines, STORE_PICKUP_ID, STORE_PICKUP_OPTION, type BringShippingOption } from "@/lib/shipping-client";
import type { CartItem } from "@/types/store";
import { PriceEstimate } from "@/components/price-estimate";
import { resolveZoneMarkup, type PriceZoneWithCountries } from "@/lib/price-zones-shared";
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
	const [items, setItems] = useState<CartItem[]>([]);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "VIPPS">("STRIPE");

	// Coupon state
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPct: number; freeShipping: boolean; finalSubtotal: number } | null>(null);
	const [couponError, setCouponError] = useState("");
	const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
	const [showCouponForm, setShowCouponForm] = useState(false);

	// Bring shipping state
	const [showShippingForm, setShowShippingForm] = useState(false);
	const [shippingPostalCode, setShippingPostalCode] = useState("");
	const [shippingCountry, setShippingCountry] = useState("NO");
	const [bringOptions, setBringOptions] = useState<BringShippingOption[]>([]);
	const [selectedShippingId, setSelectedShippingId] = useState<string | null>(STORE_PICKUP_ID);
	const [isLoadingBring, setIsLoadingBring] = useState(false);
	const [bringError, setBringError] = useState("");
	const [savedAddressUsed, setSavedAddressUsed] = useState<{ postalCode: string; city?: string } | null>(null);

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
		if (!isOpen) {
			return;
		}

		const cartItems = getCartItems();
		setItems(cartItems);
		setCheckoutError("");
		setShowShippingForm(false);
		setBringOptions([]);
		setSelectedShippingId(STORE_PICKUP_ID);
		setBringError("");
		setSavedAddressUsed(null);
		setShowCouponForm(false);

		let active = true;
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			if (!active) return;
			const saved = data.user?.user_metadata?.shipping_address as { postalCode?: string; country?: string; city?: string } | undefined;

			if (saved?.postalCode && saved?.country) {
				setShippingPostalCode(saved.postalCode);
				setShippingCountry(saved.country);
				if (cartItems.length > 0) {
					setSavedAddressUsed({ postalCode: saved.postalCode, city: saved.city });
					void fetchBringOptions(saved.postalCode, saved.country, cartItems);
				}
			} else {
				setShippingPostalCode("");
			}
		});

		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

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
					subtotal,
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
		setShowCouponForm(false);
	};

	const handleFetchBringOptions = () => {
		if (!shippingPostalCode.trim()) {
			setBringError("Please enter a postal code.");
			return;
		}
		setSavedAddressUsed(null);
		void fetchBringOptions(shippingPostalCode, shippingCountry, items);
	};

	const selectedShippingOption = [...bringOptions, STORE_PICKUP_OPTION].find((option) => option.productId === selectedShippingId);
	const selectedShippingCost = selectedShippingOption ? selectedShippingOption.priceCents / 100 : 0;
	const displaySubtotal = appliedCoupon ? appliedCoupon.finalSubtotal : subtotal;
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
						// Form fields reflect what's on screen (prefilled from the saved address
						// when available); only fall back to the saved value if the form is empty,
						// so an unfinished manual edit never silently overwrites a good saved address.
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
						{/* Cart items + secondary options: one scroll region, so the checkout bar below can never be pushed off-screen */}
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
													<p className="text-sm font-semibold text-stone-900">NOK {item.price * item.quantity}</p>
													<PriceEstimate amountNok={item.price * item.quantity} className="text-xs text-stone-700" />
												</div>
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Coupon */}
							<div className="mt-4">
								{appliedCoupon ? (
								<div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
									<div>
										<p className="font-mono text-sm font-semibold text-emerald-900">{appliedCoupon.code}</p>
										<p className="text-xs text-emerald-700">
											{appliedCoupon.discountPct}% discount {appliedCoupon.freeShipping && "• Free shipping"}
										</p>
									</div>
									<button type="button" onClick={handleRemoveCoupon} className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
										Remove
									</button>
								</div>
							) : showCouponForm ? (
								<div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
									<label htmlFor="cart-drawer-coupon-code" className="sr-only">
										Coupon code
									</label>
									<div className="flex gap-2">
										<input id="cart-drawer-coupon-code" type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" autoFocus className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm uppercase" onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()} />
										<button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon} className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60">
											{isValidatingCoupon ? "Applying..." : "Apply"}
										</button>
									</div>
									{couponError ? (
										<InlineAlert tone="error" className="mt-2">
											{couponError}
										</InlineAlert>
									) : null}
								</div>
							) : (
								<button type="button" onClick={() => setShowCouponForm(true)} className="text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">
									Have a coupon code?
								</button>
							)}
							</div>

							{/* Bring shipping calculator */}
							{!appliedCoupon?.freeShipping && (
								<div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Delivery method</p>

									<button type="button" onClick={() => setSelectedShippingId(STORE_PICKUP_ID)} className={`mt-2 w-full rounded-xl border p-3 text-left transition ${selectedShippingId === STORE_PICKUP_ID ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4" />
												<div>
													<p className="text-sm font-semibold text-stone-900">{STORE_PICKUP_OPTION.displayName}</p>
													<p className="text-xs text-stone-700">{STORE_PICKUP_OPTION.expectedDelivery}</p>
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

									{isLoadingBring && bringOptions.length === 0 ? (
										<p className="mt-2 flex items-center gap-1.5 text-xs text-stone-700">
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											Checking rates for your saved address...
										</p>
									) : null}

									{!showShippingForm && !isLoadingBring && bringOptions.length === 0 ? (
										<button type="button" onClick={() => setShowShippingForm(true)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100">
											<Truck className="h-3.5 w-3.5" />
											Calculate delivery costs
										</button>
									) : null}

									{bringOptions.length === 0 && showShippingForm ? (
										<div className="mt-2 rounded-xl border border-stone-200 bg-white p-3">
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label htmlFor="cart-drawer-shipping-country" className="sr-only">
														Country
													</label>
													<select id="cart-drawer-shipping-country" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} className="w-full rounded-lg border border-stone-200 p-2 text-xs text-stone-900">
														{SHIPPING_COUNTRIES.map((c) => (
															<option key={c.code} value={c.code}>
																{c.name}
															</option>
														))}
													</select>
												</div>
												<div>
													<label htmlFor="cart-drawer-shipping-postal-code" className="sr-only">
														Postal code
													</label>
													<input id="cart-drawer-shipping-postal-code" type="text" placeholder="Postal code" value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className="w-full rounded-lg border border-stone-200 p-2 text-xs text-stone-900" />
												</div>
											</div>
											{bringError ? (
												<InlineAlert tone="error" className="mt-2">
													{bringError}
												</InlineAlert>
											) : null}
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
								</div>
							)}

							{!appliedCoupon?.freeShipping && bringOptions.length > 0 ? (
								<div className="mt-2 space-y-2">
									{savedAddressUsed ? (
										<p className="text-xs text-stone-700">
											Using your saved address ({savedAddressUsed.city ? `${savedAddressUsed.city}, ` : ""}
											{savedAddressUsed.postalCode}) ·{" "}
											<button type="button" onClick={useDifferentAddress} className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">
												use a different address
											</button>
										</p>
									) : null}
									{bringOptions.map((option) => (
										<button key={option.productId} type="button" onClick={() => setSelectedShippingId(option.productId)} className={`w-full rounded-xl border p-3 text-left transition ${selectedShippingId === option.productId ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}>
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-center gap-2">
													{getDeliveryIcon(option.deliveryType)}
													<div>
														<p className="text-sm font-semibold text-stone-900">{option.displayName}</p>
														{option.expectedDelivery ? <p className="text-xs text-stone-700">{option.expectedDelivery}</p> : null}
													</div>
												</div>
												<div className="text-right">
													<p className="text-sm font-semibold text-stone-900">{option.priceCents === 0 ? "Free" : `NOK ${(option.priceCents / 100).toFixed(0)}`}</p>
													{option.priceCents > 0 && <PriceEstimate amountNok={option.priceCents / 100} className="text-xs text-stone-700" />}
												</div>
											</div>
											{selectedShippingId === option.productId ? (
												<div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
													<Check className="h-3.5 w-3.5" />
													Selected
												</div>
											) : null}
										</button>
									))}
									<button type="button" onClick={useDifferentAddress} className="text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">
										Change location
									</button>
								</div>
							) : null}
							<div className="h-4" />
						</div>

						{/* Order total + payment + checkout: always visible, never scrolled out of view */}
						<div className="shrink-0 border-t border-stone-200 px-5 py-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-stone-700">Subtotal</span>
								<span className="font-medium text-stone-900">NOK {subtotal.toFixed(2)}</span>
							</div>

							{selectedShippingOption ? (
								<div className="mt-1 flex items-center justify-between text-sm">
									<span className="text-stone-700">Shipping</span>
									<span className="font-medium text-stone-900">{selectedShippingCost === 0 ? "Free" : `NOK ${selectedShippingCost.toFixed(2)}`}</span>
								</div>
							) : (
								<p className="mt-1 text-xs text-stone-700">Shipping calculated at checkout.</p>
							)}

							{selectedShippingOption ? (
								<div className="mt-2 flex items-center justify-between border-t border-dashed border-stone-200 pt-2 text-base font-semibold text-stone-900">
									<span>Total</span>
									<span className="text-right">
										NOK {estimatedTotal.toFixed(2)}
										<PriceEstimate amountNok={estimatedTotal} className="block text-xs font-normal text-stone-700" />
									</span>
								</div>
							) : null}

							{/* Payment method — large, image-led cards so Stripe vs. Vipps is unmistakable */}
							<div className="mt-4">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Pay with</p>
								<div className="mt-2 grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => setPaymentMethod("STRIPE")}
										aria-pressed={paymentMethod === "STRIPE"}
										className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 py-4 transition ${paymentMethod === "STRIPE" ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}
									>
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
									<button
										type="button"
										onClick={() => setPaymentMethod("VIPPS")}
										aria-pressed={paymentMethod === "VIPPS"}
										className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 py-4 transition ${paymentMethod === "VIPPS" ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-300"}`}
									>
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
								{isCheckingOut ? "Preparing checkout..." : appliedCoupon?.freeShipping ? "Proceed to Checkout" : paymentMethod === "VIPPS" ? "Checkout with Vipps" : "Checkout with Stripe"}
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
