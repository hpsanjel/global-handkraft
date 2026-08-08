import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

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

// GET /api/admin/reviews?status=pending|approved|all - list reviews for moderation
export async function GET(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status") ?? "pending";

		const where = status === "approved" ? { approved: true } : status === "all" ? {} : { approved: false };

		const reviews = await prisma.review.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: {
				product: {
					select: { id: true, name: true, slug: true },
				},
			},
		});

		return NextResponse.json(reviews);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch reviews.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
