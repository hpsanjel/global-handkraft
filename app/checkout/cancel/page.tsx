import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function CheckoutCancelPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
				<div className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Payment cancelled</p>
					<h1 className="mt-3 text-3xl font-semibold text-stone-900">Checkout was not completed</h1>
					<p className="mt-4 text-lg leading-8 text-stone-600">Your order was not placed. You can try again anytime, and your cart will still be available for you to resume.</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link href="/cart" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
							Return to cart
						</Link>
						<Link href="/shop" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-900">
							Continue shopping
						</Link>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
