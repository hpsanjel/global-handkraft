import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendMandapInquiryStatusUpdateEmail } from "@/lib/email";

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { id } = await params;
		const body = (await request.json()) as {
			paymentStatus?: string;
			adminNote?: string;
			quotedPrice?: number;
			stripePaymentLink?: string;
		};

		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry) {
			return NextResponse.json({ error: "Request not found." }, { status: 404 });
		}

		const updateData: {
			paymentStatus?: string;
			adminNote?: string;
			quotedPrice?: number;
			stripePaymentLink?: string;
			updatedAt?: Date;
			paymentAcceptedAt?: Date;
			paymentDeclinedAt?: Date;
		} = {
			updatedAt: new Date(),
		};

		if (body.paymentStatus) {
			updateData.paymentStatus = body.paymentStatus;

			if (body.paymentStatus === "ACCEPTED") {
				updateData.paymentAcceptedAt = new Date();
			} else if (body.paymentStatus === "DECLINED") {
				updateData.paymentDeclinedAt = new Date();
			}
		}

		if (body.adminNote !== undefined) {
			updateData.adminNote = body.adminNote;
		}

		if (body.quotedPrice !== undefined) {
			updateData.quotedPrice = body.quotedPrice;
		}

		if (body.stripePaymentLink !== undefined) {
			updateData.stripePaymentLink = body.stripePaymentLink;
		}

		const updated = await prisma.mandapInquiry.update({
			where: { id },
			data: updateData,
		});

		// Send email notification to customer if status changed
		if (body.paymentStatus && inquiry.email) {
			sendMandapInquiryStatusUpdateEmail({
				to: inquiry.email,
				category: inquiry.category,
				productName: inquiry.productName,
				paymentStatus: body.paymentStatus,
				adminNote: body.adminNote || "",
				quotedPrice: body.quotedPrice,
				stripePaymentLink: body.stripePaymentLink,
			}).catch((error) => {
				console.error("Unable to send status update email:", error);
			});
		}

		return NextResponse.json({
			...updated,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
			paymentAcceptedAt: updated.paymentAcceptedAt?.toISOString() ?? null,
			paymentDeclinedAt: updated.paymentDeclinedAt?.toISOString() ?? null,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { id } = await params;
		const inquiry = await prisma.mandapInquiry.findUnique({
			where: { id },
			include: {
				messages: { orderBy: { createdAt: "asc" } },
			},
		});

		if (!inquiry) {
			return NextResponse.json({ error: "Request not found." }, { status: 404 });
		}

		return NextResponse.json({
			...inquiry,
			createdAt: inquiry.createdAt.toISOString(),
			updatedAt: inquiry.updatedAt.toISOString(),
			paymentAcceptedAt: inquiry.paymentAcceptedAt?.toISOString() ?? null,
			paymentDeclinedAt: inquiry.paymentDeclinedAt?.toISOString() ?? null,
			messages: inquiry.messages.map((message) => ({
				...message,
				createdAt: message.createdAt.toISOString(),
			})),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
