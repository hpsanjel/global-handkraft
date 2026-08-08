import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendMandapInquiryCustomerMessageEmail } from "@/lib/email";
import { uploadMandapMessageAttachment } from "@/lib/mandap-inquiry-message-attachment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to reply." }, { status: 401 });
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
		if (!inquiry || inquiry.email?.toLowerCase() !== user.email.toLowerCase()) {
			return NextResponse.json({ error: "Request not found." }, { status: 404 });
		}

		const attachments: string[] = [];
		if (attachmentFile instanceof File && attachmentFile.size > 0) {
			attachments.push(await uploadMandapMessageAttachment(attachmentFile, id));
		}

		const created = await prisma.mandapInquiryMessage.create({
			data: { inquiryId: id, sender: "CUSTOMER", message, attachments },
		});

		sendMandapInquiryCustomerMessageEmail({
			category: inquiry.category,
			productName: inquiry.productName,
			message,
			customerEmail: inquiry.email,
			attachments,
		}).catch((error) => {
			console.error("Unable to send mandap inquiry customer message email:", error);
		});

		return NextResponse.json({
			...created,
			createdAt: created.createdAt.toISOString(),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to send message.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
