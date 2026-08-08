import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { recomputeProductRating } from "@/lib/reviews";

export const runtime = "nodejs";

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

// PATCH /api/admin/reviews/[id] - approve or unapprove a review
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		const { id } = await params;
		const body = await request.json().catch(() => null);

		if (!body || typeof body.approved !== "boolean") {
			return NextResponse.json({ error: "'approved' boolean is required." }, { status: 400 });
		}

		const existing = await prisma.review.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Review not found." }, { status: 404 });
		}

		const review = await prisma.review.update({
			where: { id },
			data: { approved: body.approved },
			include: {
				product: { select: { id: true, name: true, slug: true } },
			},
		});

		await recomputeProductRating(review.productId);

		return NextResponse.json(review);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update review.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// DELETE /api/admin/reviews/[id] - remove a review
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		const { id } = await params;
		const existing = await prisma.review.findUnique({ where: { id } });

		if (!existing) {
			return NextResponse.json({ error: "Review not found." }, { status: 404 });
		}

		await prisma.review.delete({ where: { id } });

		if (existing.approved) {
			await recomputeProductRating(existing.productId);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete review.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
