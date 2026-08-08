import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TESTIMONIAL_BUCKET = "testimonials";
const MAX_IMAGE_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

type TestimonialPayload = {
	id?: string;
	name?: string;
	quote?: string;
	rating?: number;
	active?: boolean;
	orderedIds?: string[];
};

type TestimonialFormInput = {
	id?: string;
	name: string;
	quote: string;
	rating: number;
	active: boolean;
	imageFile: File | null;
};

async function requireAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
	}

	if (!hasAdminRole(user)) {
		return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}

	return { error: null };
}

function imageExtensionFromFile(file: File) {
	const lowerName = file.name.toLowerCase();
	if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "jpg";
	if (lowerName.endsWith(".png")) return "png";
	if (lowerName.endsWith(".webp")) return "webp";
	if (lowerName.endsWith(".avif")) return "avif";
	if (lowerName.endsWith(".gif")) return "gif";
	return null;
}

async function uploadTestimonialImage(supabase: SupabaseClient, imageFile: File) {
	if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
		throw new Error("Only JPG, PNG, WEBP, AVIF, and GIF images are allowed.");
	}

	if (imageFile.size > MAX_IMAGE_FILE_BYTES) {
		throw new Error("Testimonial photo must be 3MB or smaller.");
	}

	const extension = imageExtensionFromFile(imageFile);
	if (!extension) {
		throw new Error("Testimonial photo must include a valid file extension.");
	}

	const filePath = `${Date.now()}-${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(TESTIMONIAL_BUCKET).upload(filePath, imageFile, {
		cacheControl: "3600",
		upsert: false,
		contentType: imageFile.type,
	});

	if (error) {
		throw new Error(error.message || "Unable to upload testimonial photo.");
	}

	return filePath;
}

async function deleteTestimonialImageIfExists(supabase: SupabaseClient, imagePath: string | null) {
	if (!imagePath) {
		return;
	}

	const { error } = await supabase.storage.from(TESTIMONIAL_BUCKET).remove([imagePath]);
	if (error && !/not found|resource was not found/i.test(error.message)) {
		throw new Error(error.message || "Unable to delete testimonial photo.");
	}
}

function normalizeRating(value: unknown) {
	const rating = Number(value);
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		return 5;
	}
	return rating;
}

async function parseTestimonialInput(request: Request): Promise<TestimonialFormInput> {
	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("multipart/form-data")) {
		const formData = await request.formData();
		const id = formData.get("id");
		const name = formData.get("name");
		const quote = formData.get("quote");
		const rating = formData.get("rating");
		const active = formData.get("active");
		const image = formData.get("image");

		return {
			id: typeof id === "string" ? id : undefined,
			name: typeof name === "string" ? name : "",
			quote: typeof quote === "string" ? quote : "",
			rating: normalizeRating(rating),
			active: active !== "false",
			imageFile: image instanceof File && image.size > 0 ? image : null,
		};
	}

	const body = (await request.json()) as TestimonialPayload;
	return {
		id: body.id,
		name: body.name ?? "",
		quote: body.quote ?? "",
		rating: normalizeRating(body.rating),
		active: body.active ?? true,
		imageFile: null,
	};
}

function testimonialImageUrl(supabase: SupabaseClient, imagePath: string | null) {
	if (!imagePath) {
		return null;
	}
	return supabase.storage.from(TESTIMONIAL_BUCKET).getPublicUrl(imagePath).data.publicUrl;
}

async function listTestimonials(supabase: SupabaseClient) {
	const testimonials = await prisma.testimonial.findMany({
		orderBy: { createdAt: "asc" },
	});

	return testimonials.map((testimonial) => ({
		id: testimonial.id,
		name: testimonial.name,
		quote: testimonial.quote,
		rating: testimonial.rating,
		active: testimonial.active,
		imagePath: testimonial.imagePath,
		imageUrl: testimonialImageUrl(supabase, testimonial.imagePath),
		createdAt: testimonial.createdAt,
	}));
}

export async function GET() {
	try {
		const { error: adminError } = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		return NextResponse.json(await listTestimonials(createAdminClient()));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load testimonials.";
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
		const input = await parseTestimonialInput(request);
		const name = input.name.trim();
		const quote = input.quote.trim();

		if (!name) {
			return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
		}
		if (!quote) {
			return NextResponse.json({ error: "Testimonial quote is required." }, { status: 400 });
		}

		let uploadedImagePath: string | null = null;

		try {
			if (input.imageFile) {
				uploadedImagePath = await uploadTestimonialImage(supabase, input.imageFile);
			}

			await prisma.testimonial.create({
				data: { name, quote, rating: input.rating, active: input.active, imagePath: uploadedImagePath },
			});
		} catch (error) {
			if (uploadedImagePath) {
				await deleteTestimonialImageIfExists(supabase, uploadedImagePath);
			}
			throw error;
		}

		return NextResponse.json(await listTestimonials(supabase), { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create testimonial.";
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
		let input: TestimonialFormInput;

		if (!contentType.includes("multipart/form-data")) {
			const body = (await request.json()) as TestimonialPayload;

			if (Array.isArray(body.orderedIds)) {
				const orderedIds = body.orderedIds.filter((value): value is string => typeof value === "string");

				if (orderedIds.length === 0) {
					return NextResponse.json({ error: "Testimonial order is empty." }, { status: 400 });
				}

				const testimonials = await prisma.testimonial.findMany({
					select: { id: true },
					orderBy: { createdAt: "asc" },
				});

				if (orderedIds.length !== testimonials.length) {
					return NextResponse.json({ error: "Testimonial order must include all testimonials." }, { status: 400 });
				}

				const testimonialIds = new Set(testimonials.map((testimonial) => testimonial.id));
				const uniqueOrderedIds = new Set(orderedIds);
				const isValid = uniqueOrderedIds.size === testimonials.length && orderedIds.every((id) => testimonialIds.has(id));

				if (!isValid) {
					return NextResponse.json({ error: "Testimonial order is invalid." }, { status: 400 });
				}

				const baseTime = Date.now();
				await prisma.$transaction(orderedIds.map((id, index) => prisma.testimonial.update({ where: { id }, data: { createdAt: new Date(baseTime + index) } })));

				return NextResponse.json(await listTestimonials(supabase));
			}

			input = {
				id: body.id,
				name: body.name ?? "",
				quote: body.quote ?? "",
				rating: normalizeRating(body.rating),
				active: body.active ?? true,
				imageFile: null,
			};
		} else {
			input = await parseTestimonialInput(request);
		}

		if (!input.id) {
			return NextResponse.json({ error: "Testimonial id is required." }, { status: 400 });
		}

		const name = input.name.trim();
		const quote = input.quote.trim();

		if (!name) {
			return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
		}
		if (!quote) {
			return NextResponse.json({ error: "Testimonial quote is required." }, { status: 400 });
		}

		const existing = await prisma.testimonial.findUnique({
			where: { id: input.id },
			select: { id: true, imagePath: true },
		});

		if (!existing) {
			return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
		}

		let uploadedImagePath: string | null = null;
		let nextImagePath = existing.imagePath;

		try {
			if (input.imageFile) {
				uploadedImagePath = await uploadTestimonialImage(supabase, input.imageFile);
				nextImagePath = uploadedImagePath;
			}

			await prisma.testimonial.update({
				where: { id: input.id },
				data: { name, quote, rating: input.rating, active: input.active, imagePath: nextImagePath },
			});

			if (uploadedImagePath && existing.imagePath && existing.imagePath !== uploadedImagePath) {
				await deleteTestimonialImageIfExists(supabase, existing.imagePath);
			}
		} catch (error) {
			if (uploadedImagePath) {
				await deleteTestimonialImageIfExists(supabase, uploadedImagePath);
			}
			throw error;
		}

		return NextResponse.json(await listTestimonials(supabase));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update testimonial.";
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
			return NextResponse.json({ error: "Testimonial id is required." }, { status: 400 });
		}

		const testimonial = await prisma.testimonial.findUnique({ where: { id } });
		if (!testimonial) {
			return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
		}

		await deleteTestimonialImageIfExists(supabase, testimonial.imagePath);
		await prisma.testimonial.delete({ where: { id } });

		return NextResponse.json(await listTestimonials(supabase));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete testimonial.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
