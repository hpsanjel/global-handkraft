"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Gift, X, Copy, Check, Truck } from "lucide-react";
import { PriceEstimate } from "@/components/price-estimate";

type ActiveCoupon = {
	code: string;
	discountPct: number;
	freeShipping: boolean;
	expiresAt: string | null;
	minPurchaseAmount: number | null;
};

function formatExpiry(expiresAt: string | null) {
	if (!expiresAt) return null;
	const date = new Date(expiresAt);
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CouponPopup() {
	const pathname = usePathname();
	const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const isAdminRoute = pathname?.startsWith("/admin");

	useEffect(() => {
		if (isAdminRoute) return;
		if (typeof window === "undefined") return;

		let cancelled = false;

		fetch("/api/coupons/active")
			.then((res) => (res.ok ? res.json() : { coupons: [] }))
			.then((data: { coupons?: ActiveCoupon[] }) => {
				if (cancelled) return;
				if (data.coupons && data.coupons.length > 0) {
					setCoupons(data.coupons);
					setIsOpen(true);
					window.setTimeout(() => setIsVisible(true), 50);
				}
			})
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [isAdminRoute]);

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

	const handleClose = () => {
		setIsVisible(false);
		window.setTimeout(() => setIsOpen(false), 200);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") handleClose();
		};
		if (isOpen) window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen]);

	const handleCopy = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(code);
			window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2000);
		} catch {
			// Clipboard API unavailable — silently ignore, code is still visible to select/copy manually.
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="coupon-popup-title">
			<div className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={handleClose} aria-hidden="true" />

			<div className={`relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-white shadow-2xl transition-all duration-200 ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`}>
				<button type="button" onClick={handleClose} className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-md ring-1 ring-black/5 transition hover:bg-stone-100 hover:text-stone-900" aria-label="Close offers popup">
					<X className="h-4 w-4" />
				</button>

				<div className="bg-stone-900 px-6 pb-8 pt-11 text-center sm:px-8 sm:pt-12">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
						<Gift className="h-6 w-6 text-white" />
					</div>
					<h2 id="coupon-popup-title" className="mt-3 text-xl font-semibold text-white">
						{coupons.length > 1 ? "Special Offers For You" : "A Gift For You"}
					</h2>
					<p className="mt-1 text-sm text-stone-300">Handpicked savings on our handcrafted collection — apply a code at checkout.</p>
				</div>

				<div className="max-h-[55vh] space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
					{coupons.map((coupon) => {
						const expiry = formatExpiry(coupon.expiresAt);
						const isCopied = copiedCode === coupon.code;
						const hasDiscount = coupon.discountPct > 0;
						return (
							<div key={coupon.code} className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										{hasDiscount ? (
											<p className="text-lg font-bold leading-tight text-stone-900">
												{coupon.discountPct}% <span className="font-semibold">off</span>
											</p>
										) : coupon.freeShipping ? (
											<p className="flex items-center gap-1.5 text-lg font-bold leading-tight text-emerald-700">
												<Truck className="h-5 w-5" />
												Free Shipping
											</p>
										) : null}
										<div className="mt-1 flex flex-wrap items-center gap-2">
											{hasDiscount && coupon.freeShipping ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
													<Truck className="h-3 w-3" />
													Free shipping
												</span>
											) : null}
											{expiry ? <span className="text-[11px] font-medium text-stone-800">Ends {expiry}</span> : <span className="text-[11px] font-medium text-stone-500">No expiry</span>}
										</div>
									</div>
									<button type="button" onClick={() => handleCopy(coupon.code)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-sm font-semibold tracking-wide transition ${isCopied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-stone-300 bg-white text-stone-900 hover:border-stone-900"}`}>
										{isCopied ? (
											<>
												<Check className="h-3.5 w-3.5" />
												Copied
											</>
										) : (
											<>
												{coupon.code}
												<Copy className="h-3.5 w-3.5" />
											</>
										)}
									</button>
								</div>
								{coupon.minPurchaseAmount ? (
									<p className="mt-2 text-[11px] font-medium text-stone-600">
										Min. purchase NOK {coupon.minPurchaseAmount} <PriceEstimate amountNok={coupon.minPurchaseAmount} className="text-[11px] text-stone-500" />
									</p>
								) : null}
							</div>
						);
					})}
				</div>

				<div className="border-t border-stone-100 px-5 py-4 sm:px-6">
					<button type="button" onClick={handleClose} className="inline-flex w-full items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
						Continue Shopping
					</button>
				</div>
			</div>
		</div>
	);
}
