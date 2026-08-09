import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/index";
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
		id?: string;
		name: string;
		color?: string;
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

class VariantInUseError extends Error {
	constructor(public readonly variantNames: string[]) {
		super(`Cannot remove variant(s) with existing order history: ${variantNames.join(", ")}. Keep them or contact support to archive past orders first.`);
		this.name = "VariantInUseError";
	}
}

function describePrismaError(error: unknown, fallback: string): { message: string; status: number } {
	if (error instanceof VariantInUseError) {
		return { message: error.message, status: 409 };
	}

	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		switch (error.code) {
			case "P2002": {
				const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : String(error.meta?.target ?? "field");
				return { message: `A record with the same ${target} already exists.`, status: 409 };
			}
			case "P2003":
				return { message: "This change is blocked by related records (e.g. existing orders). Remove or update those references first.", status: 409 };
			case "P2025":
				return { message: "The record you tried to update no longer exists.", status: 404 };
			default:
				return { message: fallback, status: 500 };
		}
	}

	return { message: error instanceof Error ? error.message : fallback, status: 500 };
}

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

async function syncVariants(tx: Prisma.TransactionClient, productId: string, productSlug: string, incomingVariants: ProductRequestPayload["variants"]) {
	const existingVariants = await tx.variant.findMany({ where: { productId } });
	const existingIds = new Set(existingVariants.map((variant) => variant.id));

	const keptIds = new Set(incomingVariants.filter((variant) => variant.id && existingIds.has(variant.id)).map((variant) => variant.id as string));
	const idsToRemove = existingVariants.filter((variant) => !keptIds.has(variant.id)).map((variant) => variant.id);

	if (idsToRemove.length > 0) {
		const blockedVariants = await tx.variant.findMany({
			where: { id: { in: idsToRemove }, orderItems: { some: {} } },
			select: { name: true },
		});
		if (blockedVariants.length > 0) {
			throw new VariantInUseError(blockedVariants.map((variant) => variant.name));
		}
		await tx.variant.deleteMany({ where: { id: { in: idsToRemove } } });
	}

	for (const [index, variant] of incomingVariants.entries()) {
		const data = {
			name: variant.name.trim(),
			color: (variant.color ?? "").trim(),
			price: Number(variant.price ?? 0),
			width: variant.width ?? "",
			height: variant.height ?? "",
			depth: variant.depth ?? "",
			weight: variant.weight ?? "",
			stock: Number(variant.stock ?? 0),
		};

		if (variant.id && keptIds.has(variant.id)) {
			await tx.variant.update({ where: { id: variant.id }, data });
		} else {
			await tx.variant.create({
				data: {
					...data,
					productId,
					sku: generateVariantSku(productSlug, variant.name, index),
				},
			});
		}
	}
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
						color: (variant.color ?? "").trim(),
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
		const { message, status } = describePrismaError(error, "Unable to create product.");
		return NextResponse.json({ error: message }, { status });
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

		const productSlug = body.slug.trim();

		await prisma.$transaction(async (tx) => {
			await tx.product.update({
				where: { id: body.id },
				data: {
					name: body.name.trim(),
					slug: productSlug,
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

			await syncVariants(tx, body.id!, productSlug, body.variants);
		});

		return NextResponse.json(await listProducts());
	} catch (error) {
		const { message, status } = describePrismaError(error, "Unable to update product.");
		return NextResponse.json({ error: message }, { status });
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
		const { message, status } = describePrismaError(error, "Unable to delete product.");
		return NextResponse.json({ error: message }, { status });
	}
}
