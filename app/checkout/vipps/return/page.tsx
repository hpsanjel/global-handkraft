"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { resetCart } from "@/lib/cart";
import { Loader2 } from "lucide-react";
import { CheckoutSuccessSummary, type OrderSummary } from "@/components/checkout-success-summary";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

/**
 * Vipps' WEB_REDIRECT flow sends the buyer back to a single returnUrl
 * regardless of outcome (unlike Stripe's separate success_url/cancel_url),
 * so this page determines outcome itself by asking /api/checkout/vipps/session
 * whether the payment actually completed, and falls back to the existing
 * /checkout/cancel page when it didn't.
 */
function CheckoutVippsReturnContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const reference = searchParams.get("reference");
	const [order, setOrder] = useState<OrderSummary | null>(null);
	const [isLoading, setIsLoading] = useState(Boolean(reference));

	useEffect(() => {
		if (!reference) {
			router.replace("/checkout/cancel");
			return;
		}

		let isDisposed = false;
		(async () => {
			try {
				const response = await fetch(`/api/checkout/vipps/session?reference=${encodeURIComponent(reference)}`);
				const data = await response.json();

				if (!response.ok) {
					if (!isDisposed) {
						router.replace("/checkout/cancel");
					}
					return;
				}

				if (!isDisposed) {
					resetCart();
					setOrder(data);
				}
			} catch {
				if (!isDisposed) {
					router.replace("/checkout/cancel");
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reference]);

	return (
		<main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			<CheckoutSuccessSummary order={order} isLoading={isLoading} error="" />
		</main>
	);
}

export default function CheckoutVippsReturnPage() {
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
				<CheckoutVippsReturnContent />
			</Suspense>
			<SiteFooter />
		</div>
	);
}
