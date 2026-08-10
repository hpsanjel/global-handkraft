import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PAYABLE_STATUSES = new Set(["ACCEPTED", "DEPOSIT_PAID"]);

const STATUS_MESSAGES: Record<string, string> = {
	PENDING: "Please accept the quote before paying.",
	DECLINED: "This request was declined.",
	PAID: "This order is already fully paid.",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to pay." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const secretKey = process.env.STRIPE_SECRET_KEY;
		if (!secretKey) {
			return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 500 });
		}

		const { id } = await params;
		const inquiry = await prisma.mandapInquiry.findUnique({ where: { id } });
		if (!inquiry || inquiry.email?.toLowerCase() !== user.email.toLowerCase()) {
			return NextResponse.json({ error: "Request not found or access denied." }, { status: 404 });
		}

		if (!PAYABLE_STATUSES.has(inquiry.paymentStatus)) {
			return NextResponse.json({ error: STATUS_MESSAGES[inquiry.paymentStatus] ?? "Payment is not currently available for this request." }, { status: 400 });
		}

		if (!inquiry.quotedPrice) {
			return NextResponse.json({ error: "No quoted price has been set yet." }, { status: 400 });
		}

		const quotedCents = Math.round(inquiry.quotedPrice * 100);
		const paidCents = Math.round(inquiry.amountPaid * 100);

		if (paidCents >= quotedCents) {
			return NextResponse.json({ error: "This order is already fully paid." }, { status: 400 });
		}

		const depositCents = inquiry.depositAmount != null ? Math.round(inquiry.depositAmount * 100) : null;
		const depositOutstanding = depositCents != null && paidCents < depositCents;
		const kind = depositOutstanding ? "DEPOSIT" : "BALANCE";
		const amountCents = depositOutstanding ? depositCents! - paidCents : quotedCents - paidCents;
		const amount = amountCents / 100;

		const stripe = new Stripe(secretKey, {
			apiVersion: "2026-07-29.dahlia",
		});

		// Reuse an in-flight Checkout Session for this kind instead of minting a
		// duplicate one (e.g. the customer clicking "Pay Now" twice).
		const pending = await prisma.mandapInquiryTransaction.findFirst({
			where: { inquiryId: inquiry.id, kind, status: "PENDING" },
			orderBy: { createdAt: "desc" },
		});

		if (pending) {
			const existingSession = await stripe.checkout.sessions.retrieve(pending.stripeSessionId);
			if (existingSession.status === "open" && existingSession.url) {
				return NextResponse.json({ url: existingSession.url });
			}
			if (existingSession.status === "complete") {
				return NextResponse.json({ error: "Your payment is already being processed. Refresh in a moment." }, { status: 409 });
			}
			await prisma.mandapInquiryTransaction.update({ where: { id: pending.id }, data: { status: "EXPIRED" } });
		}

		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
		const label = kind === "DEPOSIT" ? "Deposit" : "Balance payment";

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: [
				{
					price_data: {
						currency: "nok",
						product_data: { name: `${label} — ${inquiry.productName}` },
						unit_amount: amountCents,
					},
					quantity: 1,
				},
			],
			customer_email: inquiry.email || undefined,
			success_url: `${origin}/account/custom-requests?payment=success`,
			cancel_url: `${origin}/account/custom-requests?payment=cancelled`,
			metadata: { inquiryId: inquiry.id, kind },
		});

		await prisma.mandapInquiryTransaction.create({
			data: {
				inquiryId: inquiry.id,
				kind,
				amount,
				status: "PENDING",
				stripeSessionId: session.id,
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to start payment.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
