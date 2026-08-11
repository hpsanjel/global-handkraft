import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getSalesReport, type SalesReportLineItem } from "@/lib/reports/sales-report.service";

export const runtime = "nodejs";

function csvField(value: string | number): string {
	const text = String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(lineItems: SalesReportLineItem[]): string {
	const header = ["Date", "Type", "Reference", "Detail", "Country", "Amount", "Currency"];
	const rows = lineItems.map((item) => [item.date.slice(0, 10), item.type, item.reference, item.detail, item.country, item.amount.toFixed(2), item.currency]);
	return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}

function parseRange(url: URL): { from: Date; to: Date } | null {
	const fromParam = url.searchParams.get("from");
	const toParam = url.searchParams.get("to");

	const to = toParam ? new Date(toParam) : new Date();
	const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
		return null;
	}

	const toEndOfDay = new Date(to);
	if (!toParam || !toParam.includes("T")) {
		toEndOfDay.setHours(23, 59, 59, 999);
	}

	return { from, to: toEndOfDay };
}

/** GET /api/admin/reports/sales/export?from=&to= — CSV download of the same line items the Reports page summarizes, for handing to an accountant or importing into a spreadsheet. */
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
		const csv = toCsv(report.lineItems);
		const fromLabel = report.from.slice(0, 10);
		const toLabel = report.to.slice(0, 10);

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="sales-report-${fromLabel}-to-${toLabel}.csv"`,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to export report.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
