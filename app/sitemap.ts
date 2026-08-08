import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/app/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = siteConfig.url;
	const [products, categories] = await Promise.all([
		prisma.product.findMany({
			where: { active: true },
			select: { slug: true, createdAt: true },
		}),
		prisma.category.findMany({
			select: { slug: true, createdAt: true },
		}),
	]);

	const productUrls = products.map((product) => ({
		url: `${baseUrl}/product/${product.slug}`,
		lastModified: product.createdAt,
		changeFrequency: "weekly" as const,
		priority: 0.8,
	}));

	const categoryUrls = categories.map((category) => ({
		url: `${baseUrl}/shop?category=${category.slug}`,
		lastModified: category.createdAt,
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));

	return [
		{ url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
		{ url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
		{ url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
		{ url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
		{ url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
		{ url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
		{ url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
		...productUrls,
		...categoryUrls,
		{ url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
		{ url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
	];
}
