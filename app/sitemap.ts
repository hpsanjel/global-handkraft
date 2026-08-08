import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://handcraftsglobal.com";
	const products = await prisma.product.findMany({
		where: { active: true },
		select: { slug: true, createdAt: true },
	});

	const productUrls = products.map((product) => ({
		url: `${baseUrl}/product/${product.slug}`,
		lastModified: product.createdAt,
		changeFrequency: "weekly" as const,
		priority: 0.8,
	}));

	return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }, { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 }, { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 }, { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 }, ...productUrls, { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 }, { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 }];
}
