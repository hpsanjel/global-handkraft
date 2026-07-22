import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCategorySlug, resolveCategoryForDb, toStoreProduct } from "@/lib/product-transform";

type ProductRequestPayload = {
	id?: string;
	name: string;
	slug: string;
	shortDescription: string;
	description: string;
	material: string;
	category: string;
	image: string;
	gallery?: string[];
	featured?: boolean;
	rating?: number;
	reviewCount?: number;
	variants: Array<{
		name: string;
		price: number;
		width: string;
		height: string;
		depth: string;
		weight: string;
		stock: number;
		sku: string;
	}>;
	addons: Array<{
		name: string;
		price: number;
		description: string;
	}>;
};

async function getOrCreateCategory(categoryName: string) {
	const resolvedCategoryName = resolveCategoryForDb(categoryName);
	const existingCategory = await prisma.category.findFirst({
		where: {
			name: {
				equals: resolvedCategoryName,
				mode: "insensitive",
			},
		},
	});

	if (existingCategory) {
		return existingCategory;
	}

	return prisma.category.create({
		data: {
			name: resolvedCategoryName,
			slug: createCategorySlug(resolvedCategoryName),
		},
	});
}

function validatePayload(body: ProductRequestPayload) {
	if (!body.name?.trim()) {
		return "Product name is required.";
	}
	if (!body.slug?.trim()) {
		return "Product slug is required.";
	}
	if (!body.category?.trim()) {
		return "Category is required.";
	}
	if (!Array.isArray(body.variants) || body.variants.length === 0) {
		return "At least one variant is required.";
	}

	return null;
}

async function listProducts() {
	const products = await prisma.product.findMany({
		include: {
			category: true,
			variants: true,
			addons: true,
		},
		orderBy: { createdAt: "desc" },
	});

	return products.map(toStoreProduct);
}

export async function GET() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		return NextResponse.json(await listProducts());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load products.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = (await request.json()) as ProductRequestPayload;
		const validationError = validatePayload(body);
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}
		const category = await getOrCreateCategory(body.category);

		await prisma.product.create({
			data: {
				name: body.name.trim(),
				slug: body.slug.trim(),
				shortDescription: body.shortDescription?.trim() || body.name.trim(),
				description: body.description?.trim() || body.shortDescription?.trim() || body.name.trim(),
				material: body.material?.trim() || "Mixed Artisan Materials",
				categoryId: category.id,
				image: body.image,
				gallery: body.gallery ?? [body.image],
				featured: Boolean(body.featured),
				active: true,
				rating: Number(body.rating ?? 0),
				reviewCount: Number(body.reviewCount ?? 0),
				seoTitle: body.name.trim(),
				seoDescription: body.shortDescription?.trim() || body.name.trim(),
				variants: {
					create: body.variants.map((variant) => ({
						name: variant.name.trim(),
						price: Number(variant.price ?? 0),
						width: variant.width ?? "",
						height: variant.height ?? "",
						depth: variant.depth ?? "",
						weight: variant.weight ?? "",
						stock: Number(variant.stock ?? 0),
						sku: variant.sku?.trim() || `${body.slug}-${Math.random().toString(36).slice(2, 8)}`,
					})),
				},
				addons: {
					create: body.addons.map((addon) => ({
						name: addon.name.trim(),
						price: Number(addon.price ?? 0),
						description: addon.description ?? "",
					})),
				},
			},
		});

		return NextResponse.json(await listProducts());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create product.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = (await request.json()) as ProductRequestPayload;
		if (!body.id) {
			return NextResponse.json({ error: "Product id is required for update." }, { status: 400 });
		}

		const validationError = validatePayload(body);
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		const category = await getOrCreateCategory(body.category);

		await prisma.product.update({
			where: { id: body.id },
			data: {
				name: body.name.trim(),
				slug: body.slug.trim(),
				shortDescription: body.shortDescription?.trim() || body.name.trim(),
				description: body.description?.trim() || body.shortDescription?.trim() || body.name.trim(),
				material: body.material?.trim() || "Mixed Artisan Materials",
				categoryId: category.id,
				image: body.image,
				gallery: body.gallery ?? [body.image],
				featured: Boolean(body.featured),
				rating: Number(body.rating ?? 0),
				reviewCount: Number(body.reviewCount ?? 0),
				seoTitle: body.name.trim(),
				seoDescription: body.shortDescription?.trim() || body.name.trim(),
				variants: {
					deleteMany: {},
					create: body.variants.map((variant) => ({
						name: variant.name.trim(),
						price: Number(variant.price ?? 0),
						width: variant.width ?? "",
						height: variant.height ?? "",
						depth: variant.depth ?? "",
						weight: variant.weight ?? "",
						stock: Number(variant.stock ?? 0),
						sku: variant.sku?.trim() || `${body.slug}-${Math.random().toString(36).slice(2, 8)}`,
					})),
				},
				addons: {
					deleteMany: {},
					create: body.addons.map((addon) => ({
						name: addon.name.trim(),
						price: Number(addon.price ?? 0),
						description: addon.description ?? "",
					})),
				},
			},
		});

		return NextResponse.json(await listProducts());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update product.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const id = new URL(request.url).searchParams.get("id");
		if (!id) {
			return NextResponse.json({ error: "Product id is required." }, { status: 400 });
		}

		await prisma.product.delete({
			where: { id },
		});

		return NextResponse.json(await listProducts());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete product.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
