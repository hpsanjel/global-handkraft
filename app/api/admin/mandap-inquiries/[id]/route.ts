import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMandapInquiryStatusUpdateEmail } from "@/lib/email";
import { broadcastCustomRequestCount } from "@/lib/realtime-broadcast";

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

		const statusChanged = body.paymentStatus !== undefined && body.paymentStatus !== inquiry.paymentStatus;
		const isAcceptance = body.paymentStatus === "ACCEPTED";
		const linkOrPriceUpdatedOnAccepted =
			updated.paymentStatus === "ACCEPTED" &&
			((body.stripePaymentLink !== undefined && body.stripePaymentLink !== inquiry.stripePaymentLink) ||
				(body.quotedPrice !== undefined && body.quotedPrice !== inquiry.quotedPrice));

		// Send email notification to customer if status changed, order was accepted, or payment link/price updated
		if ((statusChanged || isAcceptance || linkOrPriceUpdatedOnAccepted) && updated.email) {
			try {
				await sendMandapInquiryStatusUpdateEmail({
					to: updated.email,
					category: updated.category,
					productName: updated.productName,
					paymentStatus: updated.paymentStatus,
					adminNote: updated.adminNote || "",
					quotedPrice: updated.quotedPrice ?? undefined,
					stripePaymentLink: updated.stripePaymentLink ?? undefined,
					length: updated.length,
					width: updated.width,
					height: updated.height,
					material: updated.material,
				});
			} catch (error) {
				console.error("Unable to send status update email:", error);
			}

			try {
				await broadcastCustomRequestCount();
			} catch (error) {
				console.error("Unable to broadcast custom request count:", error);
			}
		}

		// If marked as PAID by admin, also notify admins
		if (body.paymentStatus === "PAID" && inquiry.paymentStatus !== "PAID") {
			try {
				const { sendCustomOrderPaymentAdminNotification } = await import("@/lib/email");
				await sendCustomOrderPaymentAdminNotification({
					inquiryId: updated.id,
					category: updated.category,
					productName: updated.productName,
					productSlug: updated.productSlug,
					customerEmail: updated.email || "Not provided",
					customerWhatsapp: updated.whatsapp,
					amountPaid: updated.quotedPrice ?? 0,
					currency: "NOK",
					dimensions: `${updated.length} x ${updated.width} x ${updated.height}`,
					material: updated.material,
					description: updated.description,
					stripeSessionId: "Admin Manual Update",
				});
			} catch (error) {
				console.error("Unable to send payment admin notification on manual PAID:", error);
			}
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

const MANDAP_INQUIRY_BUCKET = "mandap-inquiries";

function extractStoragePath(url: string, bucket: string): string | null {
	if (!url || typeof url !== "string") return null;
	const marker = `/${bucket}/`;
	const index = url.indexOf(marker);
	if (index !== -1) {
		const rawPath = url.slice(index + marker.length);
		const cleanPath = rawPath.split("?")[0];
		return decodeURIComponent(cleanPath);
	}
	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		return url.split("?")[0];
	}
	return null;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
				messages: true,
			},
		});

		if (!inquiry) {
			return NextResponse.json({ error: "Custom request not found." }, { status: 404 });
		}

		// 1. Gather ONLY storage files belonging strictly to this inquiry ID
		const filesToDelete = new Set<string>();

		// Sample images uploaded specifically for this inquiry
		for (const url of inquiry.sampleImages) {
			const path = extractStoragePath(url, MANDAP_INQUIRY_BUCKET);
			if (path) {
				filesToDelete.add(path);
			}
		}

		// Attachments in messages for this inquiry
		for (const msg of inquiry.messages) {
			for (const url of msg.attachments) {
				const path = extractStoragePath(url, MANDAP_INQUIRY_BUCKET);
				if (path) {
					filesToDelete.add(path);
				}
			}
		}

		// Clean up files in this inquiry's isolated messages folder: messages/${id}
		try {
			const supabase = createAdminClient();
			const { data: messageFiles } = await supabase.storage
				.from(MANDAP_INQUIRY_BUCKET)
				.list(`messages/${id}`);

			if (messageFiles && messageFiles.length > 0) {
				for (const file of messageFiles) {
					if (file.name) {
						filesToDelete.add(`messages/${id}/${file.name}`);
					}
				}
			}

			const filePathsArray = Array.from(filesToDelete);
			if (filePathsArray.length > 0) {
				const { error: storageError } = await supabase.storage
					.from(MANDAP_INQUIRY_BUCKET)
					.remove(filePathsArray);

				if (storageError) {
					console.error(`Failed to remove storage files for inquiry ${id}:`, storageError);
				}
			}
		} catch (storageErr) {
			console.error(`Storage cleanup exception for inquiry ${id}:`, storageErr);
		}

		// 2. Transactionally delete the messages and the inquiry
		await prisma.$transaction([
			prisma.mandapInquiryMessage.deleteMany({ where: { inquiryId: id } }),
			prisma.mandapInquiry.delete({ where: { id } }),
		]);

		// 3. Broadcast updated count so admin sidebar badge updates in real time
		try {
			await broadcastCustomRequestCount();
		} catch (broadcastErr) {
			console.error("Unable to broadcast custom request count after delete:", broadcastErr);
		}

		return NextResponse.json({ success: true, id });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete custom request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
