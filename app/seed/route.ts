import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products as seedProducts } from "@/lib/data/products";

function categorySlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export async function GET() {
	if (!process.env.DATABASE_URL) {
		return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
	}

	try {
		const uniqueCategories = Array.from(new Set(seedProducts.map((product) => product.category)));

		for (const name of uniqueCategories) {
			await prisma.category.upsert({
				where: { slug: categorySlug(name) },
				update: { name },
				create: {
					name,
					slug: categorySlug(name),
				},
			});
		}

		const categories = await prisma.category.findMany();
		const categoryByName = new Map(categories.map((category) => [category.name, category]));

		for (const seedProduct of seedProducts) {
			const category = categoryByName.get(seedProduct.category);
			if (!category) {
				continue;
			}

			const product = await prisma.product.upsert({
				where: { slug: seedProduct.slug },
				update: {
					name: seedProduct.name,
					shortDescription: seedProduct.shortDescription,
					description: seedProduct.description,
					material: seedProduct.material,
					categoryId: category.id,
					image: seedProduct.image,
					gallery: seedProduct.gallery,
					featured: seedProduct.featured,
					active: true,
					rating: seedProduct.rating,
					reviewCount: seedProduct.reviewCount,
					seoTitle: seedProduct.name,
					seoDescription: seedProduct.shortDescription,
				},
				create: {
					id: seedProduct.id,
					name: seedProduct.name,
					slug: seedProduct.slug,
					shortDescription: seedProduct.shortDescription,
					description: seedProduct.description,
					material: seedProduct.material,
					categoryId: category.id,
					image: seedProduct.image,
					gallery: seedProduct.gallery,
					featured: seedProduct.featured,
					active: true,
					rating: seedProduct.rating,
					reviewCount: seedProduct.reviewCount,
					seoTitle: seedProduct.name,
					seoDescription: seedProduct.shortDescription,
				},
			});

			await prisma.variant.deleteMany({ where: { productId: product.id } });
			await prisma.addon.deleteMany({ where: { productId: product.id } });

			if (seedProduct.variants.length > 0) {
				await prisma.variant.createMany({
					data: seedProduct.variants.map((variant) => ({
						id: variant.id,
						productId: product.id,
						name: variant.name,
						price: variant.price,
						width: variant.width,
						height: variant.height,
						depth: variant.depth,
						weight: variant.weight,
						stock: variant.stock,
						sku: variant.sku,
					})),
				});
			}

			if (seedProduct.addons.length > 0) {
				await prisma.addon.createMany({
					data: seedProduct.addons.map((addon) => ({
						id: addon.id,
						productId: product.id,
						name: addon.name,
						price: addon.price,
						description: addon.description,
					})),
				});
			}
		}

		const [categoryCount, productCount, variantCount, addonCount] = await Promise.all([prisma.category.count(), prisma.product.count(), prisma.variant.count(), prisma.addon.count()]);

		return NextResponse.json({
			message: "Database seeded successfully.",
			counts: {
				categories: categoryCount,
				products: productCount,
				variants: variantCount,
				addons: addonCount,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to seed database.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
