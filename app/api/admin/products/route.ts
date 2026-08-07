import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/product-transform";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

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
	galleryColors?: string[];
	featured?: boolean;
	rating?: number;
	reviewCount?: number;
	dimensions?: string;
	weight?: string;
	variants: Array<{
		name: string;
		price: number;
		width: string;
		height: string;
		depth: string;
		weight: string;
		stock: number;
	}>;
	addons: Array<{
		name: string;
		price: number;
		description: string;
	}>;
};

async function requireAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!hasAdminRole(user)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return null;
}

function normalizeGalleryColors(gallery: string[], galleryColors?: string[]) {
	return gallery.map((_, index) => galleryColors?.[index]?.trim() || "");
}

function generateVariantSku(productSlug: string, variantName: string, index: number) {
	const variantSlug = variantName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	return `${productSlug}-${variantSlug || "variant"}-${index + 1}`.toUpperCase();
}

async function getCategoryByName(categoryName: string) {
	const normalizedCategoryName = categoryName.trim();
	const existingCategory = await prisma.category.findFirst({
		where: {
			name: {
				equals: normalizedCategoryName,
				mode: "insensitive",
			},
		},
	});

	return existingCategory;
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
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

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
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = (await request.json()) as ProductRequestPayload;
		const validationError = validatePayload(body);
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}
		const category = await getCategoryByName(body.category);
		if (!category) {
			return NextResponse.json({ error: "Selected category does not exist. Create the category first." }, { status: 400 });
		}

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
				galleryColors: normalizeGalleryColors(body.gallery ?? [body.image], body.galleryColors),
				featured: Boolean(body.featured),
				active: true,
				rating: Number(body.rating ?? 0),
				reviewCount: Number(body.reviewCount ?? 0),
				dimensions: body.dimensions?.trim() || null,
				weight: body.weight?.trim() || null,
				seoTitle: body.name.trim(),
				seoDescription: body.shortDescription?.trim() || body.name.trim(),
				variants: {
					create: body.variants.map((variant, index) => ({
						name: variant.name.trim(),
						price: Number(variant.price ?? 0),
						width: variant.width ?? "",
						height: variant.height ?? "",
						depth: variant.depth ?? "",
						weight: variant.weight ?? "",
						stock: Number(variant.stock ?? 0),
						sku: generateVariantSku(body.slug.trim(), variant.name, index),
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
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

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

		const category = await getCategoryByName(body.category);
		if (!category) {
			return NextResponse.json({ error: "Selected category does not exist. Create the category first." }, { status: 400 });
		}

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
				galleryColors: normalizeGalleryColors(body.gallery ?? [body.image], body.galleryColors),
				featured: Boolean(body.featured),
				rating: Number(body.rating ?? 0),
				reviewCount: Number(body.reviewCount ?? 0),
				dimensions: body.dimensions?.trim() || null,
				weight: body.weight?.trim() || null,
				seoTitle: body.name.trim(),
				seoDescription: body.shortDescription?.trim() || body.name.trim(),
				variants: {
					deleteMany: {},
					create: body.variants.map((variant, index) => ({
						name: variant.name.trim(),
						price: Number(variant.price ?? 0),
						width: variant.width ?? "",
						height: variant.height ?? "",
						depth: variant.depth ?? "",
						weight: variant.weight ?? "",
						stock: Number(variant.stock ?? 0),
						sku: generateVariantSku(body.slug.trim(), variant.name, index),
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
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const id = new URL(request.url).searchParams.get("id");
		if (!id) {
			return NextResponse.json({ error: "Product id is required." }, { status: 400 });
		}

		const orderItemCount = await prisma.orderItem.count({
			where: { productId: id },
		});

		if (orderItemCount > 0) {
			return NextResponse.json({ error: "This product has existing order history and cannot be deleted." }, { status: 409 });
		}

		await prisma.$transaction([prisma.variant.deleteMany({ where: { productId: id } }), prisma.addon.deleteMany({ where: { productId: id } }), prisma.product.delete({ where: { id } })]);

		return NextResponse.json(await listProducts());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete product.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
