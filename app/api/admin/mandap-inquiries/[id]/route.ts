import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
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

		// If accepting and no payment link provided, attempt auto-generation if Stripe is configured
		if (
			body.paymentStatus === "ACCEPTED" &&
			!body.stripePaymentLink &&
			!inquiry.stripePaymentLink &&
			(body.quotedPrice || inquiry.quotedPrice) &&
			process.env.STRIPE_SECRET_KEY
		) {
			try {
				const priceToUse = body.quotedPrice ?? inquiry.quotedPrice ?? 0;
				if (priceToUse > 0) {
					const { createMandapPaymentLink } = await import("@/lib/stripe");
					const autoLink = await createMandapPaymentLink({
						inquiryId: inquiry.id,
						productName: inquiry.productName,
						category: inquiry.category,
						quotedPriceNok: priceToUse,
					});
					if (autoLink) {
						updateData.stripePaymentLink = autoLink;
					}
				}
			} catch (linkError) {
				console.warn("Could not auto-generate Stripe payment link on accept:", linkError);
			}
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
			sendMandapInquiryStatusUpdateEmail({
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
			}).catch((error) => {
				console.error("Unable to send status update email:", error);
			});

			broadcastCustomRequestCount().catch((error) => {
				console.error("Unable to broadcast custom request count:", error);
			});
		}

		// If marked as PAID by admin, also notify admins
		if (body.paymentStatus === "PAID" && inquiry.paymentStatus !== "PAID") {
			import("@/lib/email").then(({ sendCustomOrderPaymentAdminNotification }) => {
				sendCustomOrderPaymentAdminNotification({
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
				}).catch((error) => {
					console.error("Unable to send payment admin notification on manual PAID:", error);
				});
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
