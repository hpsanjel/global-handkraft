import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShopClient } from "@/components/shop-client";
import { SkipLink } from "@/components/skip-link";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/product-transform";
import { createClient } from "@/lib/supabase/server";

import { siteConfig } from "@/app/metadata";

const CATEGORY_BUCKET = "categories";

async function getShopData() {
	if (!process.env.DATABASE_URL) {
		return { products: [], categories: [] };
	}

	const [productRecords, categoryRecords] = await Promise.all([
		prisma.product.findMany({
			where: { active: true },
			include: { category: true, variants: true, addons: true },
			orderBy: { createdAt: "desc" },
		}),
		prisma.category.findMany({
			orderBy: { createdAt: "asc" },
			include: { products: { where: { active: true }, select: { id: true } } },
		}),
	]);

	const supabase = await createClient();

	return {
		products: productRecords.map(toStoreProduct),
		categories: categoryRecords.map((category) => ({
			id: category.id,
			name: category.name,
			slug: category.slug,
			productCount: category.products.length,
			imagePath: category.imagePath,
			imageUrl: category.imagePath ? supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(category.imagePath).data.publicUrl : null,
		})),
	};
}

export const metadata = {
	title: "Shop",
	description: "Browse authentic handcrafted temples, pooja items, and cultural products. Filter by category and find the perfect piece for your home or ceremony.",
	openGraph: {
		title: `Shop | ${siteConfig.name}`,
		description: "Browse authentic handcrafted temples, pooja items, and cultural products.",
		images: [
			{
				url: "/api/og?title=Shop%20|%20Global%20Handcrafts&description=Handcrafted%20temples%2C%20pooja%20items%2C%20and%20cultural%20products",
				width: 1200,
				height: 630,
				alt: "Global Handcrafts Shop - Handcrafted Temples and Cultural Products",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Shop | ${siteConfig.name}`,
		description: "Browse authentic handcrafted temples, pooja items, and cultural products.",
		images: ["/api/og?title=Shop%20|%20Global%20Handcrafts&description=Handcrafted%20temples%2C%20pooja%20items%2C%20and%20cultural%20products"],
	},
};

export default async function ShopPage() {
	const { products, categories } = await getShopData();

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<ShopClient initialProducts={products} initialCategories={categories} />
			</main>
			<SiteFooter />
		</div>
	);
}
