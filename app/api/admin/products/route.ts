import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

		return NextResponse.json(products);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load products.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = await request.json();
		const category = await prisma.category.findFirst({ where: { name: body.category } });
		if (!category) {
			return NextResponse.json({ error: "Category not found." }, { status: 400 });
		}

		const product = await prisma.product.create({
			data: {
				name: body.name,
				slug: body.slug,
				shortDescription: body.shortDescription,
				description: body.description,
				material: body.material,
				categoryId: category.id,
				image: body.image,
				gallery: body.gallery ?? [body.image],
				featured: Boolean(body.featured),
				active: true,
				rating: Number(body.rating ?? 0),
				reviewCount: Number(body.reviewCount ?? 0),
				seoTitle: body.name,
				seoDescription: body.shortDescription,
				variants: {
					create: (body.variants ?? []).map((variant: any) => ({
						name: variant.name,
						price: Number(variant.price ?? 0),
						width: variant.width ?? "",
						height: variant.height ?? "",
						depth: variant.depth ?? "",
						weight: variant.weight ?? "",
						stock: Number(variant.stock ?? 0),
						sku: variant.sku ?? `${body.slug}-${Math.random().toString(36).slice(2, 8)}`,
					})),
				},
				addons: {
					create: (body.addons ?? []).map((addon: any) => ({
						name: addon.name,
						price: Number(addon.price ?? 0),
						description: addon.description ?? "",
					})),
				},
			},
			include: {
				category: true,
				variants: true,
				addons: true,
			},
		});

		return NextResponse.json(product);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create product.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
