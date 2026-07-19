import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		const orders = await prisma.order.findMany({
			include: {
				address: true,
				items: {
					include: {
						product: true,
						variant: true,
					},
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
