import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/app/metadata";
import { ProductImage } from "@/components/ui/product-image";

const CATEGORY_BUCKET = "categories";

export const metadata = {
	title: "Categories",
	description: "Browse handcrafted temples, pooja essentials, traditional clothing, and more by category, sourced from artisans in Nepal and South Asia.",
	openGraph: {
		title: `Categories | ${siteConfig.name}`,
		description: "Browse handcrafted temples, pooja essentials, traditional clothing, and more by category.",
		images: [
			{
				url: "/api/og?title=Categories&description=Browse%20handcrafted%20collections%20by%20category",
				width: 1200,
				height: 630,
				alt: "Global Handcrafts Categories",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Categories | ${siteConfig.name}`,
		description: "Browse handcrafted temples, pooja essentials, traditional clothing, and more by category.",
		images: ["/api/og?title=Categories&description=Browse%20handcrafted%20collections%20by%20category"],
	},
};

async function getCategories() {
	if (!process.env.DATABASE_URL) {
		return [];
	}

	const categories = await prisma.category.findMany({
		orderBy: { createdAt: "asc" },
		include: {
			products: {
				where: { active: true },
				select: { id: true },
			},
		},
	});

	const supabase = await createClient();

	return categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		productCount: category.products.length,
		imageUrl: category.imagePath ? supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(category.imagePath).data.publicUrl : null,
	}));
}

export default async function CategoriesPage() {
	const categories = await getCategories();

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Collections</p>
					<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Shop by category</h1>
					<p className="mt-3 max-w-2xl text-stone-700">Explore handcrafted temples, pooja essentials, traditional clothing, and more, organized by category.</p>
				</div>

				{categories.length === 0 ? (
					<div className="mt-10 rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
						<p className="text-lg font-semibold text-stone-900">Categories are being updated.</p>
						<p className="mt-2 text-sm text-stone-700">
							In the meantime, browse the full{" "}
							<Link href="/shop" className="font-semibold text-stone-900 underline">
								shop
							</Link>
							.
						</p>
					</div>
				) : (
					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{categories.map((category) => (
							<Link key={category.id} href={`/shop?category=${category.slug}`} className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
								{category.imageUrl ? <ProductImage src={category.imageUrl} alt={category.name} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-4/3 bg-stone-100" /> : <div className="aspect-4/3 bg-stone-100" />}
								<div className="p-5">
									<h2 className="text-lg font-semibold text-stone-900">{category.name}</h2>
									<p className="mt-1 text-sm text-stone-700">
										{category.productCount} {category.productCount === 1 ? "product" : "products"}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</main>
			<SiteFooter />
		</div>
	);
}
