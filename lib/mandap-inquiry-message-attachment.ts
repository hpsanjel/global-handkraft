import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MANDAP_INQUIRY_BUCKET = "mandap-inquiries";
export const MAX_MESSAGE_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

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

/**
 * Validates and uploads a single message attachment image to the shared
 * mandap-inquiries storage bucket, under a messages/ subfolder scoped to the inquiry.
 */
export async function uploadMandapMessageAttachment(file: File, inquiryId: string, attemptBucketCreate = true): Promise<string> {
	if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
		throw new Error("Only JPG, PNG, WEBP, AVIF, and GIF images are allowed.");
	}

	if (file.size > MAX_MESSAGE_ATTACHMENT_BYTES) {
		throw new Error("Attached image must be 3MB or smaller.");
	}

	const extension = imageExtensionFromFile(file);
	if (!extension) {
		throw new Error("Attached image must include a valid file extension.");
	}

	const supabase = createAdminClient();
	const filePath = `messages/${inquiryId}/${Date.now()}-${randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(MANDAP_INQUIRY_BUCKET).upload(filePath, file, {
		cacheControl: "3600",
		upsert: false,
		contentType: file.type,
	});

	if (error) {
		if (attemptBucketCreate && /not found|bucket/i.test(error.message)) {
			await ensureBucketExists(supabase);
			return uploadMandapMessageAttachment(file, inquiryId, false);
		}
		throw new Error(error.message || "Unable to upload attachment.");
	}

	const { data } = supabase.storage.from(MANDAP_INQUIRY_BUCKET).getPublicUrl(filePath);
	return data.publicUrl;
}
