import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to view custom requests." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json([]);
		}

		const inquiries = await prisma.mandapInquiry.findMany({
			where: {
				email: {
					equals: user.email,
					mode: "insensitive",
				},
			},
			include: {
				address: true,
				messages: { orderBy: { createdAt: "asc" } },
				transactions: { orderBy: { createdAt: "desc" } },
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(
			inquiries.map((inquiry) => ({
				...inquiry,
				createdAt: inquiry.createdAt.toISOString(),
				updatedAt: inquiry.updatedAt.toISOString(),
				paymentAcceptedAt: inquiry.paymentAcceptedAt?.toISOString() ?? null,
				paymentDeclinedAt: inquiry.paymentDeclinedAt?.toISOString() ?? null,
				messages: inquiry.messages.map((message) => ({
					...message,
					createdAt: message.createdAt.toISOString(),
				})),
				transactions: inquiry.transactions.map((transaction) => ({
					...transaction,
					createdAt: transaction.createdAt.toISOString(),
					paidAt: transaction.paidAt?.toISOString() ?? null,
				})),
			})),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load custom requests.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
