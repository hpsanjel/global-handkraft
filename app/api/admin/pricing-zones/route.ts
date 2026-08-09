import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { invalidatePriceZoneCache } from "@/lib/price-zones";
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

export async function POST(request: Request) {
	try {
		const authError = await requireAdmin();
		if (authError) return authError;

		const formData = await request.formData();
		const action = formData.get("action");
		const name = String(formData.get("name") ?? "").trim();
		const code = String(formData.get("code") ?? "")
			.trim()
			.toUpperCase();
		const markupNok = Number(formData.get("markupNok"));
		const priority = Number(formData.get("priority") ?? 0);
		const countries = formData.getAll("countries").map((c) => String(c).trim().toUpperCase());

		if (action === "delete") {
			const zoneId = String(formData.get("zoneId") ?? "").trim();
			if (!zoneId) {
				return NextResponse.json({ error: "Missing zone ID." }, { status: 400 });
			}

			await prisma.priceZoneCountry.deleteMany({
				where: { zoneId },
			});
			await prisma.priceZone.delete({
				where: { id: zoneId },
			});

			invalidatePriceZoneCache();
			return NextResponse.redirect(new URL("/admin/settings/pricing-zones", request.url));
		}

		if (!name || !code || Number.isNaN(markupNok)) {
			return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
		}

		const existing = await prisma.priceZone.findUnique({
			where: { code },
		});

		if (existing) {
			return NextResponse.json({ error: "Zone code already exists." }, { status: 400 });
		}

		const zone = await prisma.priceZone.create({
			data: {
				name,
				code,
				markupNok,
				priority,
				countries: {
					create: countries.map((country) => ({
						country,
					})),
				},
			},
			include: {
				countries: true,
			},
		});

		invalidatePriceZoneCache();

		return NextResponse.redirect(new URL("/admin/settings/pricing-zones", request.url));
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to save pricing zone.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
