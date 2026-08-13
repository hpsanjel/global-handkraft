import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendCustomInquiryAdminNotification } from "@/lib/email";
import { broadcastCustomRequestCount } from "@/lib/realtime-broadcast";

const MANDAP_INQUIRY_BUCKET = "mandap-inquiries";
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_SAMPLE_IMAGES = 3;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const ALLOWED_INQUIRY_CATEGORIES = new Set(["Mandap", "Temple"]);

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

async function ensureBucketExists(supabase: ReturnType<typeof createAdminClient>) {
	const { error } = await supabase.storage.createBucket(MANDAP_INQUIRY_BUCKET, { public: true });
	if (error && !/already exists/i.test(error.message)) {
		throw new Error(error.message || "Unable to prepare storage bucket.");
	}
}

async function uploadSampleImage(supabase: ReturnType<typeof createAdminClient>, file: File, productSlug: string, attemptBucketCreate = true): Promise<string> {
	if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
		throw new Error("Only JPG, PNG, WEBP, AVIF, and GIF sample images are allowed.");
	}

	if (file.size > MAX_IMAGE_FILE_BYTES) {
		throw new Error("Each sample image must be 5MB or smaller.");
	}

	const extension = imageExtensionFromFile(file);
	if (!extension) {
		throw new Error("Sample image must include a valid file extension.");
	}

	const filePath = `${productSlug}/${Date.now()}-${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(MANDAP_INQUIRY_BUCKET).upload(filePath, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type,
	});

	if (error) {
		if (attemptBucketCreate && /not found|bucket/i.test(error.message)) {
			await ensureBucketExists(supabase);
			return uploadSampleImage(supabase, file, productSlug, false);
		}
		throw new Error(error.message || "Unable to upload sample image.");
	}

	const { data } = supabase.storage.from(MANDAP_INQUIRY_BUCKET).getPublicUrl(filePath);
	return data.publicUrl;
}

export async function POST(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const formData = await request.formData();
		const productId = String(formData.get("productId") ?? "").trim();
		const productName = String(formData.get("productName") ?? "").trim();
		const productSlug = String(formData.get("productSlug") ?? "").trim();
		const rawCategory = String(formData.get("category") ?? "").trim();
		const category = ALLOWED_INQUIRY_CATEGORIES.has(rawCategory) ? rawCategory : "Mandap";
		const length = String(formData.get("length") ?? "").trim();
		const width = String(formData.get("width") ?? "").trim();
		const height = String(formData.get("height") ?? "").trim();
		const material = String(formData.get("material") ?? "").trim();
		const expectedCostRange = String(formData.get("expectedCostRange") ?? "").trim();
		const description = String(formData.get("description") ?? "").trim();
		const whatsapp = String(formData.get("whatsapp") ?? "").trim();
		const email = String(formData.get("email") ?? "").trim();

		if (!productId || !productSlug || !length || !width || !height || !material || !expectedCostRange || !description) {
			return NextResponse.json({ error: "Please fill all required details before submitting." }, { status: 400 });
		}

		if (!whatsapp && !email) {
			return NextResponse.json({ error: "Please provide WhatsApp number and/or email for follow-up." }, { status: 400 });
		}

		const imageFiles = formData
			.getAll("sampleImages")
			.filter((entry): entry is File => entry instanceof File && entry.size > 0)
			.slice(0, MAX_SAMPLE_IMAGES);

		const supabase = createAdminClient();
		const sampleImageUrls = imageFiles.length > 0 ? await Promise.all(imageFiles.map((file) => uploadSampleImage(supabase, file, productSlug || "general"))) : [];

		const inquiry = await prisma.mandapInquiry.create({
			data: {
				productId,
				productName: productName || `Custom ${category}`,
				productSlug,
				category,
				length,
				width,
				height,
				material,
				expectedCostRange,
				description,
				whatsapp: whatsapp || null,
				email: email || null,
				sampleImages: sampleImageUrls,
			},
		});

		sendCustomInquiryAdminNotification({
			category: inquiry.category,
			productName: inquiry.productName,
			productSlug: inquiry.productSlug,
			length: inquiry.length,
			width: inquiry.width,
			height: inquiry.height,
			material: inquiry.material,
			expectedCostRange: inquiry.expectedCostRange,
			description: inquiry.description,
			whatsapp: inquiry.whatsapp,
			email: inquiry.email,
			sampleImages: inquiry.sampleImages,
		}).catch((error) => {
			console.error("Unable to send custom inquiry admin notification email:", error);
		});

		broadcastCustomRequestCount().catch((error) => {
			console.error("Unable to broadcast custom request count:", error);
		});

		return NextResponse.json({ success: true, id: inquiry.id });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to submit request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
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

		const inquiries = await prisma.mandapInquiry.findMany({
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(inquiries);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load mandap inquiries.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
