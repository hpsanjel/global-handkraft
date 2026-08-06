"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { resetCart } from "@/lib/cart";
import { Loader2 } from "lucide-react";

type OrderSummary = {
	orderNumber: string;
	customerEmail: string;
	items: { name: string; quantity: number; amount: number }[];
	subtotal: number;
	vat: number;
	shipping: number;
	shippingMethod: string | null;
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
		<main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
			<div className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Payment complete</p>
				<h1 className="mt-3 text-3xl font-semibold text-stone-900">Thank you for your order</h1>
				{order ? (
					<p className="mt-2 text-sm font-medium text-stone-500">Order {order.orderNumber}</p>
				) : (
					<p className="mt-4 text-lg leading-8 text-stone-600">Your payment was successful. A confirmation email will be sent shortly with your order details.</p>
				)}

				{isLoading ? (
					<div className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading your order summary...
					</div>
				) : null}

				{error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

				{order ? (
					<div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6 text-left">
						<div className="space-y-3">
							{order.items.map((item, index) => (
								<div key={index} className="flex items-center justify-between text-sm">
									<span className="text-stone-700">
										{item.name} <span className="text-stone-400">× {item.quantity}</span>
									</span>
									<span className="font-medium text-stone-900">{formatMoney(item.amount, order.currency)}</span>
								</div>
							))}
						</div>

						<div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
							<div className="flex items-center justify-between text-stone-600">
								<span>Subtotal</span>
								<span>{formatMoney(order.subtotal, order.currency)}</span>
							</div>
							<div className="flex items-center justify-between text-stone-600">
								<span>VAT</span>
								<span>{formatMoney(order.vat, order.currency)}</span>
							</div>
							<div className="flex items-center justify-between text-stone-600">
								<span>Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</span>
								<span>{order.shipping === 0 ? "Free" : formatMoney(order.shipping, order.currency)}</span>
							</div>
							<div className="flex items-center justify-between border-t border-stone-200 pt-2 text-base font-semibold text-stone-900">
								<span>Total</span>
								<span>{formatMoney(order.total, order.currency)}</span>
							</div>
						</div>

						<div className="mt-4 border-t border-stone-200 pt-4 text-sm text-stone-600">
							<p className="font-semibold text-stone-900">Delivery to</p>
							<p>{order.address.line1}</p>
							<p>
								{order.address.postalCode} {order.address.city}
							</p>
							<p>{order.address.country}</p>
						</div>

						<p className="mt-4 text-xs text-stone-500">A confirmation email with these details has been sent to {order.customerEmail}.</p>
					</div>
				) : null}

				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Link href="/shop" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
						Continue shopping
					</Link>
				</div>
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
