import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
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

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const [total, pending] = await Promise.all([prisma.mandapInquiry.count(), prisma.mandapInquiry.count({ where: { paymentStatus: "PENDING" } })]);

		return NextResponse.json({ total, pending });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load custom request count.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
