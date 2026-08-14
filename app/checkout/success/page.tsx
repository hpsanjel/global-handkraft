"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";
import { SiteFooter } from "@/components/site-footer";
import { resetCart } from "@/lib/cart";
import { Loader2 } from "lucide-react";
import { CheckoutSuccessSummary, type OrderSummary } from "@/components/checkout-success-summary";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

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
		<main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			<CheckoutSuccessSummary order={order} isLoading={isLoading} error={error} />
		</main>
	);
}

export default function CheckoutSuccessPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<Suspense
				fallback={
					<main id="main-content" role="status" className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-16">
						<Loader2 className="h-6 w-6 animate-spin text-stone-700" aria-hidden="true" />
						<VisuallyHidden>Loading your order confirmation</VisuallyHidden>
					</main>
				}
			>
				<CheckoutSuccessContent />
			</Suspense>
			<SiteFooter />
		</div>
	);
}
