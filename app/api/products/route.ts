import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toStoreProduct } from "@/lib/product-transform";

export async function GET() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		const products = await prisma.product.findMany({
			where: { active: true },
			include: {
				category: true,
				variants: true,
				addons: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(products.map(toStoreProduct));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load storefront products.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
