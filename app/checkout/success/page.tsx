"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resetCart } from "@/lib/cart";
import { CheckCircle2, Loader2, Mail, MapPin, Package, Tag } from "lucide-react";

type OrderSummary = {
	orderNumber: string;
	customerEmail: string;
	items: { name: string; quantity: number; amount: number; image: string | null }[];
	subtotal: number;
	shipping: number;
	shippingMethod: string | null;
	couponCode: string | null;
	total: number;
	currency: string;
	address: { line1: string; city: string; postalCode: string; country: string };
};

function formatMoney(amount: number, currency: string) {
	return `${currency} ${amount.toFixed(2)}`;
}

function CheckoutSuccessContent() {
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const [order, setOrder] = useState<OrderSummary | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(sessionId));
	const [error, setError] = useState("");

	useEffect(() => {
		resetCart();
	}, []);

	useEffect(() => {
		if (!sessionId) {
			return;
		}

		let isDisposed = false;
		(async () => {
			try {
				const response = await fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`);
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error || "Unable to load order details.");
				}
				if (!isDisposed) {
					setOrder(data);
				}
			} catch (err) {
				if (!isDisposed) {
					setError(err instanceof Error ? err.message : "Unable to load order details.");
				}
			} finally {
				if (!isDisposed) {
					setIsLoading(false);
				}
			}
		})();

		return () => {
			isDisposed = true;
		};
	}, [sessionId]);

	return (
		<main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			{/* Hero */}
			<div className="flex flex-col items-center text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4CAF50]/10 ring-8 ring-[#4CAF50]/5">
					<CheckCircle2 className="h-9 w-9 text-[#4CAF50]" strokeWidth={1.75} />
				</div>
				<p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">Payment complete</p>
				<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Thank you for your order</h1>
				{order ? (
					<p className="mt-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm font-medium text-stone-600 shadow-sm">
						Order <span className="font-mono font-semibold text-[#1B365D]">{order.orderNumber}</span>
					</p>
				) : (
					<p className="mt-3 max-w-md text-base leading-7 text-stone-600">Your payment was successful. A confirmation email will be sent shortly with your order details.</p>
				)}
			</div>

			{isLoading ? (
				<div className="mt-10 flex items-center justify-center gap-2 text-sm text-stone-500">
					<Loader2 className="h-4 w-4 animate-spin" />
					Loading your order summary...
				</div>
			) : null}

			{error ? <p className="mt-6 text-center text-sm text-red-600">{error}</p> : null}

			{order ? (
				<div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
					{/* Left column: items + delivery */}
					<div className="space-y-6">
						<div className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
							<div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
								<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
									<Package className="h-4 w-4" />
									Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)})
								</h2>
							</div>
							<div className="divide-y divide-stone-100">
								{order.items.map((item, index) => (
									<div key={index} className="flex items-center gap-4 px-6 py-4">
										{item.image ? (
											<div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url('${item.image}')` }} />
										) : (
											<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50">
												<Package className="h-6 w-6 text-stone-300" />
											</div>
										)}
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-stone-900 sm:text-base">{item.name}</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
												<span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">Qty {item.quantity}</span>
												<span>Rate: {formatMoney(item.amount / item.quantity, order.currency)}</span>
											</div>
										</div>
										<div className="shrink-0 text-right">
											<p className="text-sm font-semibold text-stone-900 sm:text-base">{formatMoney(item.amount, order.currency)}</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
							<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
								<MapPin className="h-4 w-4" />
								Delivery to
							</h2>
							<div className="mt-3 text-sm leading-6 text-stone-700">
								<p className="font-medium text-stone-900">{order.address.line1}</p>
								<p>
									{order.address.postalCode} {order.address.city}
								</p>
								<p>{order.address.country}</p>
							</div>
							{order.shippingMethod ? (
								<p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1B365D]/5 px-3 py-1 text-xs font-medium text-[#1B365D]">
									<Package className="h-3.5 w-3.5" />
									{order.shippingMethod}
								</p>
							) : null}
						</div>
					</div>

					{/* Right column: summary */}
					<div className="lg:sticky lg:top-8 space-y-6">
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
							<h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Order summary</h2>
							<div className="mt-4 space-y-3 text-sm">
								<div className="flex items-center justify-between text-stone-600">
									<span>Subtotal</span>
									<span className="font-medium text-stone-900">{formatMoney(order.subtotal, order.currency)}</span>
								</div>
								{order.couponCode ? (
									<div className="flex items-center justify-between text-stone-600">
										<span className="inline-flex items-center gap-1.5">
											<Tag className="h-3.5 w-3.5" />
											Coupon
											<span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">{order.couponCode}</span>
										</span>
										<span className="font-medium text-emerald-700">Applied</span>
									</div>
								) : null}
								<div className="flex items-center justify-between text-stone-600">
									<span>Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</span>
									<span className="font-medium text-stone-900">{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</span>
								</div>
								<div className="flex items-center justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
									<span>Total</span>
									<span>{formatMoney(order.total, order.currency)}</span>
								</div>
							</div>
						</div>

						<div className="flex items-start gap-3 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
							<Mail className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
							<p className="text-xs leading-5 text-stone-600">
								A confirmation email with these details has been sent to <span className="font-medium text-stone-900">{order.customerEmail}</span>.
							</p>
						</div>
					</div>
				</div>
			) : null}

			<div className="mt-10 flex flex-wrap justify-center gap-3">
				<Link href="/shop" className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700">
					Continue shopping
				</Link>
			</div>
		</main>
	);
}

export default function CheckoutSuccessPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<Suspense
				fallback={
					<main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-16">
						<Loader2 className="h-6 w-6 animate-spin text-stone-400" />
					</main>
				}
			>
				<CheckoutSuccessContent />
			</Suspense>
			<SiteFooter />
		</div>
	);
}
