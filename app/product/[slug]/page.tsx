"use client";

import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductClient } from "@/components/product-client";
import { useProductsCatalog } from "@/lib/products-catalog";

export default function ProductPage() {
	const params = useParams<{ slug: string }>();
	const products = useProductsCatalog();
	const product = products.find((item) => item.slug === params.slug);

	if (!product) {
		return (
			<div className="min-h-screen bg-stone-50 text-stone-800">
				<SiteHeader />
				<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
						<p className="text-lg font-semibold text-stone-900">This product is not available yet.</p>
						<p className="mt-2 text-sm text-stone-600">Save the product in the admin panel and it will appear here.</p>
					</div>
				</main>
				<SiteFooter />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<ProductClient product={product} />
			</main>
			<SiteFooter />
		</div>
	);
}
