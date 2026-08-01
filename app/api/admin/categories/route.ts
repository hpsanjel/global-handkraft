import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hasAdminRole } from "@/lib/admin-auth";
import { createCategorySlug } from "@/lib/category-utils";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_BUCKET = "categories";
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

type CategoryPayload = {
	id?: string;
	name?: string;
	orderedIds?: string[];
};

type CategoryFormInput = {
	id?: string;
	name: string;
	imageFile: File | null;
};

async function requireAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null };
	}

	if (!hasAdminRole(user)) {
		return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null };
	}

	return { error: null, supabase };
}

function normalizeCategoryName(value: string) {
	return value.trim().replace(/\s+/g, " ");
}

function categoryImageUrlForPath(supabase: SupabaseClient, imagePath: string | null) {
	if (!imagePath) {
		return null;
	}

	const { data } = supabase.storage.from(CATEGORY_BUCKET).getPublicUrl(imagePath);
	return data.publicUrl;
}

function imageExtensionFromFile(file: File) {
	const lowerName = file.name.toLowerCase();
	if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
		return "jpg";
	}
	if (lowerName.endsWith(".png")) {
		return "png";
	}
	if (lowerName.endsWith(".webp")) {
		return "webp";
	}
	if (lowerName.endsWith(".avif")) {
		return "avif";
	}
	if (lowerName.endsWith(".gif")) {
		return "gif";
	}

	return null;
}

async function uploadCategoryImage(supabase: SupabaseClient, imageFile: File, slug: string) {
	if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
		throw new Error("Only JPG, PNG, WEBP, AVIF, and GIF category images are allowed.");
	}

	if (imageFile.size > MAX_IMAGE_FILE_BYTES) {
		throw new Error("Category image must be 5MB or smaller.");
	}

	const extension = imageExtensionFromFile(imageFile);
	if (!extension) {
		throw new Error("Category image must include a valid file extension.");
	}

	const filePath = `${slug}/${Date.now()}-${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(CATEGORY_BUCKET).upload(filePath, imageFile, {
		cacheControl: "3600",
		upsert: false,
		contentType: imageFile.type,
	});

	if (error) {
		throw new Error(error.message || "Unable to upload category image.");
	}

	return filePath;
}

async function deleteCategoryImageIfExists(supabase: SupabaseClient, imagePath: string | null) {
	if (!imagePath) {
		return;
	}

	const { error } = await supabase.storage.from(CATEGORY_BUCKET).remove([imagePath]);
	if (error && !/not found|resource was not found/i.test(error.message)) {
		throw new Error(error.message || "Unable to delete category image.");
	}
}

async function parseCategoryInput(request: Request): Promise<CategoryFormInput> {
	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("multipart/form-data")) {
		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const image = formData.get("image");

		return {
			id: typeof id === "string" ? id : undefined,
			name: typeof name === "string" ? name : "",
			imageFile: image instanceof File && image.size > 0 ? image : null,
		};
	}

	const body = (await request.json()) as CategoryPayload;
	return {
		id: body.id,
		name: body.name ?? "",
		imageFile: null,
	};
}

async function listCategories(supabase: SupabaseClient) {
	const categories = await prisma.category.findMany({
		orderBy: { createdAt: "asc" },
		include: {
			_count: {
				select: {
					products: true,
				},
			},
		},
	});

	return categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		productCount: category._count.products,
		imagePath: category.imagePath,
		imageUrl: categoryImageUrlForPath(supabase, category.imagePath),
	}));
}

export async function GET() {
	try {
		const { error: adminError, supabase } = await requireAdmin();
		if (adminError || !supabase) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		return NextResponse.json(await listCategories(createAdminClient()));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load categories.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { error: adminError } = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const supabase = createAdminClient();
		const categoryInput = await parseCategoryInput(request);
		const rawName = categoryInput.name;
		const name = normalizeCategoryName(rawName);

		if (!name) {
			return NextResponse.json({ error: "Category name is required." }, { status: 400 });
		}

		const slug = createCategorySlug(name);
		if (!slug) {
			return NextResponse.json({ error: "Category name is invalid." }, { status: 400 });
		}

		const existing = await prisma.category.findFirst({
			where: {
				OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
			},
		});

		if (existing) {
			return NextResponse.json({ error: "Category already exists." }, { status: 409 });
		}

		let uploadedImagePath: string | null = null;

		try {
			if (categoryInput.imageFile) {
				uploadedImagePath = await uploadCategoryImage(supabase, categoryInput.imageFile, slug);
			}

			await prisma.category.create({
				data: {
					name,
					slug,
					imagePath: uploadedImagePath,
				},
			});
		} catch (error) {
			if (uploadedImagePath) {
				await deleteCategoryImageIfExists(supabase, uploadedImagePath);
			}
			throw error;
		}

		return NextResponse.json(await listCategories(supabase));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create category.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		const { error: adminError } = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const supabase = createAdminClient();
		const contentType = request.headers.get("content-type") ?? "";
		let categoryInput: CategoryFormInput;
		if (!contentType.includes("multipart/form-data")) {
			const body = (await request.json()) as CategoryPayload;
			if (Array.isArray(body.orderedIds)) {
				const orderedIds = body.orderedIds.filter((value): value is string => typeof value === "string");

				if (orderedIds.length === 0) {
					return NextResponse.json({ error: "Category order is empty." }, { status: 400 });
				}

				const categories = await prisma.category.findMany({
					select: { id: true },
					orderBy: { createdAt: "asc" },
				});

				if (orderedIds.length !== categories.length) {
					return NextResponse.json({ error: "Category order must include all categories." }, { status: 400 });
				}

				const categoryIds = new Set(categories.map((category) => category.id));
				const uniqueOrderedIds = new Set(orderedIds);
				const isValid = uniqueOrderedIds.size === categories.length && orderedIds.every((id) => categoryIds.has(id));

				if (!isValid) {
					return NextResponse.json({ error: "Category order is invalid." }, { status: 400 });
				}

				const baseTime = Date.now();
				await prisma.$transaction(
					orderedIds.map((id, index) =>
						prisma.category.update({
							where: { id },
							data: {
								createdAt: new Date(baseTime + index),
							},
						}),
					),
				);

				return NextResponse.json(await listCategories(supabase));
			}

			categoryInput = {
				id: body.id,
				name: body.name ?? "",
				imageFile: null,
			};
		} else {
			categoryInput = await parseCategoryInput(request);
		}

		if (!categoryInput.id) {
			return NextResponse.json({ error: "Category id is required." }, { status: 400 });
		}

		const name = normalizeCategoryName(categoryInput.name ?? "");
		if (!name) {
			return NextResponse.json({ error: "Category name is required." }, { status: 400 });
		}

		const slug = createCategorySlug(name);
		if (!slug) {
			return NextResponse.json({ error: "Category name is invalid." }, { status: 400 });
		}

		const existingCategory = await prisma.category.findUnique({
			where: { id: categoryInput.id },
			select: { id: true, imagePath: true },
		});

		if (!existingCategory) {
			return NextResponse.json({ error: "Category not found." }, { status: 404 });
		}

		const duplicate = await prisma.category.findFirst({
			where: {
				id: { not: categoryInput.id },
				OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
			},
		});

		if (duplicate) {
			return NextResponse.json({ error: "Another category already uses this name." }, { status: 409 });
		}

		let uploadedImagePath: string | null = null;
		let nextImagePath = existingCategory.imagePath;

		try {
			if (categoryInput.imageFile) {
				uploadedImagePath = await uploadCategoryImage(supabase, categoryInput.imageFile, slug);
				nextImagePath = uploadedImagePath;
			}

			await prisma.category.update({
				where: { id: categoryInput.id },
				data: { name, slug, imagePath: nextImagePath },
			});

			if (uploadedImagePath && existingCategory.imagePath && existingCategory.imagePath !== uploadedImagePath) {
				await deleteCategoryImageIfExists(supabase, existingCategory.imagePath);
			}
		} catch (error) {
			if (uploadedImagePath) {
				await deleteCategoryImageIfExists(supabase, uploadedImagePath);
			}
			throw error;
		}

		return NextResponse.json(await listCategories(supabase));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update category.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const { error: adminError } = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const supabase = createAdminClient();
		const id = new URL(request.url).searchParams.get("id");
		if (!id) {
			return NextResponse.json({ error: "Category id is required." }, { status: 400 });
		}

		const category = await prisma.category.findUnique({
			where: { id },
			include: {
				_count: {
					select: { products: true },
				},
			},
		});

		if (!category) {
			return NextResponse.json({ error: "Category not found." }, { status: 404 });
		}

		if (category._count.products > 0) {
			return NextResponse.json({ error: "Cannot delete a category that still has products." }, { status: 409 });
		}

		await deleteCategoryImageIfExists(supabase, category.imagePath);

		await prisma.category.delete({ where: { id } });

		return NextResponse.json(await listCategories(supabase));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete category.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
