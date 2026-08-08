import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendMandapInquiryReplyEmail } from "@/lib/email";
import { uploadMandapMessageAttachment } from "@/lib/mandap-inquiry-message-attachment";

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { id } = await params;
		const formData = await request.formData();
		const message = String(formData.get("message") ?? "").trim();
		const attachmentFile = formData.get("attachment");

		if (!message) {
			return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
		}

		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry) {
			return NextResponse.json({ error: "Request not found." }, { status: 404 });
		}

		const attachments: string[] = [];
		if (attachmentFile instanceof File && attachmentFile.size > 0) {
			attachments.push(await uploadMandapMessageAttachment(attachmentFile, id));
		}

		const created = await prisma.mandapInquiryMessage.create({
			data: { inquiryId: id, sender: "ADMIN", message, attachments },
		});

		if (inquiry.email) {
			sendMandapInquiryReplyEmail({
				to: inquiry.email,
				category: inquiry.category,
				productName: inquiry.productName,
				message,
				attachments,
			}).catch((error) => {
				console.error("Unable to send mandap inquiry reply email:", error);
			});
		}

		return NextResponse.json({
			...created,
			createdAt: created.createdAt.toISOString(),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to send reply.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
