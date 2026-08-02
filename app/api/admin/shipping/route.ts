import { NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SHIPPING_ZONE_CODE, SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";
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

type ShippingZonePayload = {
	country?: string;
	shippingCost?: number;
	freeShippingFrom?: number;
};

function listZones() {
	return prisma.shippingZone.findMany({ orderBy: { country: "asc" } });
}

export async function GET() {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		return NextResponse.json(await listZones());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load shipping zones.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = (await request.json()) as ShippingZonePayload;
		const country = body.country?.trim().toUpperCase();
		const shippingCost = Number(body.shippingCost);
		const freeShippingFrom = Number(body.freeShippingFrom ?? 0);

		if (!country || (country !== DEFAULT_SHIPPING_ZONE_CODE && !SHIPPING_COUNTRY_CODES.includes(country))) {
			return NextResponse.json({ error: "Select a valid country." }, { status: 400 });
		}

		if (!Number.isFinite(shippingCost) || shippingCost < 0) {
			return NextResponse.json({ error: "Shipping cost must be a positive number." }, { status: 400 });
		}

		if (!Number.isFinite(freeShippingFrom) || freeShippingFrom < 0) {
			return NextResponse.json({ error: "Free shipping threshold must be a positive number." }, { status: 400 });
		}

		await prisma.shippingZone.upsert({
			where: { country },
			update: { shippingCost, freeShippingFrom },
			create: { country, shippingCost, freeShippingFrom },
		});

		return NextResponse.json(await listZones());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to save shipping zone.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const { searchParams } = new URL(request.url);
		const country = searchParams.get("country")?.trim().toUpperCase();

		if (!country) {
			return NextResponse.json({ error: "Country is required." }, { status: 400 });
		}

		await prisma.shippingZone.deleteMany({ where: { country } });

		return NextResponse.json(await listZones());
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete shipping zone.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
