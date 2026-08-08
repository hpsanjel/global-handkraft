import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;
const MAX_COMMENT_LENGTH = 2000;

// GET /api/products/[slug]/reviews - list approved reviews for a product (public)
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;

		const product = await prisma.product.findUnique({
			where: { slug },
			select: { id: true, rating: true, reviewCount: true },
		});

		if (!product) {
			return NextResponse.json({ error: "Product not found." }, { status: 404 });
		}

		const reviews = await prisma.review.findMany({
			where: { productId: product.id, approved: true },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				name: true,
				rating: true,
				title: true,
				comment: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			rating: product.rating,
			reviewCount: product.reviewCount,
			reviews,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load reviews.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// POST /api/products/[slug]/reviews - submit a review (public, held for admin approval)
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const body = await request.json().catch(() => null);

		if (!body || typeof body !== "object") {
			return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
		}

		const name = typeof body.name === "string" ? body.name.trim() : "";
		const email = typeof body.email === "string" ? body.email.trim() : "";
		const title = typeof body.title === "string" ? body.title.trim() : "";
		const comment = typeof body.comment === "string" ? body.comment.trim() : "";
		const rating = Number(body.rating);

		if (!name || name.length > MAX_NAME_LENGTH) {
			return NextResponse.json({ error: "Please provide your name." }, { status: 400 });
		}

		if (email && !EMAIL_REGEX.test(email)) {
			return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
		}

		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			return NextResponse.json({ error: "Rating must be a whole number between 1 and 5." }, { status: 400 });
		}

		if (!comment || comment.length > MAX_COMMENT_LENGTH) {
			return NextResponse.json({ error: "Please write a review comment." }, { status: 400 });
		}

		if (title.length > MAX_TITLE_LENGTH) {
			return NextResponse.json({ error: "Review title is too long." }, { status: 400 });
		}

		const product = await prisma.product.findUnique({
			where: { slug },
			select: { id: true },
		});

		if (!product) {
			return NextResponse.json({ error: "Product not found." }, { status: 404 });
		}

		await prisma.review.create({
			data: {
				productId: product.id,
				name,
				email: email || null,
				rating,
				title: title || null,
				comment,
				approved: false,
			},
		});

		return NextResponse.json({ success: true, message: "Thank you! Your review has been submitted and will appear once approved." }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to submit review.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
