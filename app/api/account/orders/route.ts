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
			return NextResponse.json({ error: "You must be signed in to view orders." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json([]);
		}

		const orders = await prisma.order.findMany({
			where: {
				address: {
					email: {
						equals: user.email,
						mode: "insensitive",
					},
				},
			},
			include: {
				items: {
					include: {
						product: { select: { name: true } },
						variant: { select: { name: true } },
					},
				},
				statusEvents: {
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(orders);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load orders.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
