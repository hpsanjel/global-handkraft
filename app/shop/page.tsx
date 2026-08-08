import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShopClient } from "@/components/shop-client";
import { Suspense } from "react";

import { siteConfig } from "@/app/metadata";

export const metadata = {
	title: "Shop",
	description: "Browse authentic handcrafted temples, pooja items, and cultural products. Filter by category and find the perfect piece for your home or ceremony.",
	openGraph: {
		title: `Shop | ${siteConfig.name}`,
		description: "Browse authentic handcrafted temples, pooja items, and cultural products.",
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: "Global Handcrafts Shop",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Shop | ${siteConfig.name}`,
		description: "Browse authentic handcrafted temples, pooja items, and cultural products.",
		images: [siteConfig.ogImage],
	},
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
