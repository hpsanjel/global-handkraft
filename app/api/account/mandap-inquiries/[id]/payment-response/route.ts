import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendMandapInquiryStatusUpdateEmail } from "@/lib/email";
import { broadcastCustomRequestCount } from "@/lib/realtime-broadcast";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to respond." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { id } = await params;
		const body = (await request.json()) as {
			paymentStatus: "ACCEPTED" | "DECLINED";
			customerResponseNote?: string;
		};

		if (!body.paymentStatus || (body.paymentStatus !== "ACCEPTED" && body.paymentStatus !== "DECLINED")) {
			return NextResponse.json({ error: "Invalid payment status. Must be ACCEPTED or DECLINED." }, { status: 400 });
		}

		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry || inquiry.email?.toLowerCase() !== user.email.toLowerCase()) {
			return NextResponse.json({ error: "Request not found or access denied." }, { status: 404 });
		}

		if (inquiry.paymentStatus !== "PENDING") {
			return NextResponse.json({ error: "This request has already been processed." }, { status: 400 });
		}

		const updateData: {
			paymentStatus: string;
			customerResponseNote?: string;
			paymentAcceptedAt?: Date;
			paymentDeclinedAt?: Date;
			updatedAt: Date;
		} = {
			paymentStatus: body.paymentStatus,
			customerResponseNote: body.customerResponseNote,
			updatedAt: new Date(),
		};

		if (body.paymentStatus === "ACCEPTED") {
			updateData.paymentAcceptedAt = new Date();
		} else if (body.paymentStatus === "DECLINED") {
			updateData.paymentDeclinedAt = new Date();
		}

		const updated = await prisma.mandapInquiry.update({
			where: { id },
			data: updateData,
		});

		// Send notification to admin
		if (inquiry.email) {
			// Note: In a real scenario, you might want to notify the admin about the customer's response
			// For now, we'll just update the status
		}

		broadcastCustomRequestCount().catch((error) => {
			console.error("Unable to broadcast custom request count:", error);
		});

		return NextResponse.json({
			...updated,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
			paymentAcceptedAt: updated.paymentAcceptedAt?.toISOString() ?? null,
			paymentDeclinedAt: updated.paymentDeclinedAt?.toISOString() ?? null,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to process your response.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
