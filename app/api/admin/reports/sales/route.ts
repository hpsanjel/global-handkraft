import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getSalesReport } from "@/lib/reports/sales-report.service";

export const runtime = "nodejs";

function parseRange(url: URL): { from: Date; to: Date } | null {
	const fromParam = url.searchParams.get("from");
	const toParam = url.searchParams.get("to");

	const to = toParam ? new Date(toParam) : new Date();
	const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
		return null;
	}

	// The "to" boundary is exclusive in the underlying query (createdAt < to), so a
	// plain date like "2026-08-11" needs to reach the end of that day to include it.
	const toEndOfDay = new Date(to);
	if (!toParam || !toParam.includes("T")) {
		toEndOfDay.setHours(23, 59, 59, 999);
	}

	return { from, to: toEndOfDay };
}

/** GET /api/admin/reports/sales?from=&to= — JSON sales/shipping report for the admin Reports page. */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user || !hasAdminRole(user)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const range = parseRange(new URL(request.url));
		if (!range) {
			return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
		}

		const report = await getSalesReport(range);
		return NextResponse.json(report);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to generate report.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
