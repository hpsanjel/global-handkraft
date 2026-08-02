import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductClient } from "@/components/product-client";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/product-transform";

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
		title: `${product.name} | Global Handcrafts AS`,
		description: product.shortDescription,
		openGraph: {
			title: product.name,
			description: product.shortDescription,
			images: product.image ? [product.image] : undefined,
		},
	};
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { slug } = await params;
	const product = await getProductBySlug(slug);

	if (!product) {
		notFound();
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
