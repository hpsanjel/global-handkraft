import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hasAdminRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PRODUCT_BUCKET = "products";
const MAX_IMAGE_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

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

function imageExtensionFromFile(file: File) {
	const lowerName = file.name.toLowerCase();
	if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "jpg";
	if (lowerName.endsWith(".png")) return "png";
	if (lowerName.endsWith(".webp")) return "webp";
	if (lowerName.endsWith(".avif")) return "avif";
	if (lowerName.endsWith(".gif")) return "gif";
	return null;
}

function normalizeFolder(value: FormDataEntryValue | null) {
	const folder = String(value ?? "products")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

	return folder || "products";
}

async function uploadProductImage(supabase: SupabaseClient, file: File, folder: string) {
	if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
		throw new Error("Only JPG, PNG, WEBP, AVIF, and GIF product images are allowed.");
	}

	if (file.size > MAX_IMAGE_FILE_BYTES) {
		throw new Error("Each product image must be 3MB or smaller.");
	}

	const extension = imageExtensionFromFile(file);
	if (!extension) {
		throw new Error("Product image must include a valid file extension.");
	}

	const filePath = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(filePath, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type,
	});

	if (error) {
		throw new Error(error.message || "Unable to upload product image.");
	}

	const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(filePath);
	return { url: data.publicUrl, path: filePath };
}

function extractProductStoragePath(url: string) {
	const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
	const index = url.indexOf(marker);
	return index === -1 ? null : url.slice(index + marker.length);
}

export async function POST(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) return adminError;

		const formData = await request.formData();
		const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);

		if (files.length === 0) {
			return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });
		}

		if (files.length > 5) {
			return NextResponse.json({ error: "Upload a maximum of 5 images at a time." }, { status: 400 });
		}

		const supabase = createAdminClient();
		const folder = normalizeFolder(formData.get("folder"));
		const images = await Promise.all(files.map((file) => uploadProductImage(supabase, file, folder)));

		return NextResponse.json({ images });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to upload product images.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) return adminError;

		const { searchParams } = new URL(request.url);
		const path = searchParams.get("path") || extractProductStoragePath(searchParams.get("url") || "");

		if (!path) {
			return NextResponse.json({ error: "Product image path is required." }, { status: 400 });
		}

		const { error } = await createAdminClient().storage.from(PRODUCT_BUCKET).remove([path]);
		if (error && !/not found|resource was not found/i.test(error.message)) {
			throw new Error(error.message || "Unable to delete product image.");
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete product image.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
