import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShopClient } from "@/components/shop-client";
import { Suspense } from "react";

export const metadata = {
	title: "Shop | Global Handcrafts AS",
	description: "Browse handcrafted wooden temples and ritual furniture.",
};

export default function ShopPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<Suspense fallback={<div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading shop...</div>}>
					<ShopClient />
				</Suspense>
			</main>
			<SiteFooter />
		</div>
	);
}
