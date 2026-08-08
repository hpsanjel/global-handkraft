import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductClient } from "@/components/product-client";
import { ProductReviews } from "@/components/product-reviews";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/product-transform";
import { siteConfig } from "@/app/metadata";

type ProductPageProps = {
	params: Promise<{ slug: string }>;
};

async function getProductBySlug(slug: string) {
	if (!process.env.DATABASE_URL) {
		return null;
	}

	const product = await prisma.product.findFirst({
		where: {
			slug,
			active: true,
		},
		include: {
			category: true,
			variants: true,
			addons: true,
		},
	});

	return product ? toStoreProduct(product) : null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
	const { slug } = await params;
	const product = await getProductBySlug(slug);

	if (!product) {
		return {
			title: "Product Not Found | Global Handcrafts AS",
		};
	}

	return {
		title: `${product.name} | ${siteConfig.name}`,
		description: product.shortDescription,
		keywords: `${product.category}, ${product.name}, handcrafted, temple, pooja items, Norway`,
		openGraph: {
			type: "website",
			locale: "en_NO",
			url: `${siteConfig.url}/product/${product.slug}`,
			title: product.name,
			description: product.shortDescription,
			siteName: siteConfig.name,
			images: product.image
				? [
						{
							url: product.image,
							width: 1200,
							height: 630,
							alt: product.name,
						},
					]
				: undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: product.name,
			description: product.shortDescription,
			images: product.image ? [product.image] : undefined,
		},
	};
}

async function getApprovedReviews(productId: string) {
	const reviews = await prisma.review.findMany({
		where: { productId, approved: true },
		orderBy: { createdAt: "desc" },
		select: { id: true, name: true, rating: true, title: true, comment: true, createdAt: true },
	});

	return reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() }));
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { slug } = await params;
	const product = await getProductBySlug(slug);

	if (!product) {
		notFound();
	}

	const reviews = await getApprovedReviews(product.id);

	const productSchema = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		description: product.shortDescription,
		image: product.image,
		offers: {
			"@type": "Offer",
			price: product.variants[0]?.price ?? 0,
			priceCurrency: "NOK",
			availability: product.variants[0]?.stock && product.variants[0].stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
			url: `${siteConfig.url}/product/${product.slug}`,
		},
		brand: {
			"@type": "Brand",
			name: siteConfig.name,
		},
		category: product.category,
		...(product.reviewCount > 0
			? {
					aggregateRating: {
						"@type": "AggregateRating",
						ratingValue: product.rating,
						reviewCount: product.reviewCount,
					},
				}
			: {}),
	};

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			{/* JSON-LD structured data for the product */}
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<ProductClient product={product} />
				<ProductReviews productSlug={product.slug} initialRating={product.rating} initialReviewCount={product.reviewCount} initialReviews={reviews} />
			</main>
			<SiteFooter />
		</div>
	);
}
