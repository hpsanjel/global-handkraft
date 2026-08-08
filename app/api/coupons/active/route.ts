import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/coupons/active - Public list of currently redeemable coupons (for promo popup, banners, etc.)
export async function GET() {
	try {
		const now = new Date();

		const coupons = await prisma.coupon.findMany({
			where: {
				active: true,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
			orderBy: { discountPct: "desc" },
			select: {
				code: true,
				discountPct: true,
				freeShipping: true,
				expiresAt: true,
				maxUses: true,
				currentUses: true,
				minPurchaseAmount: true,
			},
		});

		const redeemable = coupons
			.filter((coupon) => coupon.maxUses === null || coupon.currentUses < coupon.maxUses)
			.map(({ code, discountPct, freeShipping, expiresAt, minPurchaseAmount }) => ({ code, discountPct, freeShipping, expiresAt, minPurchaseAmount }))
			.slice(0, 5);

		return NextResponse.json({ coupons: redeemable });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch active coupons.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
