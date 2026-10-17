import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createMandapPaymentLink } from "@/lib/stripe";

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
		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry) {
			return NextResponse.json({ error: "Custom request not found." }, { status: 404 });
		}

		const body = (await request.json().catch(() => ({}))) as {
			quotedPrice?: number;
		};

		const priceNok = body.quotedPrice ?? inquiry.quotedPrice;
		if (!priceNok || priceNok <= 0) {
			return NextResponse.json({ error: "A valid quoted price greater than 0 is required to generate a Stripe payment link." }, { status: 400 });
		}

		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json({ error: "Stripe secret key is not configured in environment variables." }, { status: 503 });
		}

		const paymentLinkUrl = await createMandapPaymentLink({
			inquiryId: inquiry.id,
			productName: inquiry.productName,
			category: inquiry.category,
			quotedPriceNok: priceNok,
		});

		if (!paymentLinkUrl) {
			return NextResponse.json({ error: "Unable to generate Stripe payment link. Please verify Stripe configuration." }, { status: 500 });
		}

		await prisma.mandapInquiry.update({
			where: { id },
			data: {
				stripePaymentLink: paymentLinkUrl,
				quotedPrice: priceNok,
				updatedAt: new Date(),
			},
		});

		return NextResponse.json({
			stripePaymentLink: paymentLinkUrl,
			quotedPrice: priceNok,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to generate payment link.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

