import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		const categories = await prisma.category.findMany({
			orderBy: { createdAt: "asc" },
			include: {
				products: {
					where: { active: true },
					select: { id: true },
				},
			},
		});

		return NextResponse.json(
			categories.map((category) => ({
				id: category.id,
				name: category.name,
				slug: category.slug,
				productCount: category.products.length,
			})),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load categories.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
