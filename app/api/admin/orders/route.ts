import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

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
