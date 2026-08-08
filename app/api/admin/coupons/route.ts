import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import type { User } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminUser(headers: Headers): User | null {
	// In a real implementation, you'd validate the session here
	// For now, we'll rely on admin auth middleware
	return null;
}

// GET /api/admin/coupons - List all coupons
export async function GET(request: Request) {
	try {
		const coupons = await prisma.coupon.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				code: true,
				discountPct: true,
				freeShipping: true,
				active: true,
				expiresAt: true,
				maxUses: true,
				maxUsesPerCustomer: true,
				minPurchaseAmount: true,
				currentUses: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return NextResponse.json(coupons);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch coupons.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { code, discountPct, freeShipping, active, expiresAt, maxUses, maxUsesPerCustomer, minPurchaseAmount } = body;

		if (!code || typeof code !== "string") {
			return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
		}

		if (typeof discountPct !== "number" || discountPct < 0 || discountPct > 100) {
			return NextResponse.json({ error: "Discount percentage must be between 0 and 100." }, { status: 400 });
		}

		if (minPurchaseAmount !== undefined && minPurchaseAmount !== null && (typeof minPurchaseAmount !== "number" || minPurchaseAmount < 0)) {
			return NextResponse.json({ error: "Minimum purchase amount must be a positive number." }, { status: 400 });
		}

		const normalizedCode = code.trim().toUpperCase();

		// Check if coupon already exists
		const existing = await prisma.coupon.findUnique({
			where: { code: normalizedCode },
		});

		if (existing) {
			return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
		}

		const coupon = await prisma.coupon.create({
			data: {
				code: normalizedCode,
				discountPct,
				freeShipping: Boolean(freeShipping),
				active: Boolean(active),
				expiresAt: expiresAt ? new Date(expiresAt) : null,
				maxUses: maxUses ? Number(maxUses) : null,
				maxUsesPerCustomer: maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null,
				minPurchaseAmount: minPurchaseAmount !== undefined && minPurchaseAmount !== null ? Number(minPurchaseAmount) : null,
			},
		});

		return NextResponse.json(coupon, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to create coupon.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
