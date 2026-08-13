import { prisma } from "@/lib/prisma";

export type ResolvedCoupon = {
	id: string;
	code: string;
	discountPct: number;
	freeShipping: boolean;
};

/**
 * Looks up a coupon by code, checks it's active/unexpired/under its usage
 * cap/meets the minimum purchase amount, and increments its usage counter.
 * Returns null (and leaves usage untouched) if the coupon doesn't qualify —
 * checkout should continue without a discount rather than fail outright.
 * Shared by the Stripe route (which turns this into a Stripe coupon object)
 * and the Vipps route (which subtracts the discount directly, since Vipps
 * has no native coupon concept).
 */
export async function resolveCoupon(code: string | undefined, subtotal: number): Promise<ResolvedCoupon | null> {
	if (!code) {
		return null;
	}

	try {
		const normalizedCode = code.trim().toUpperCase();
		const coupon = await prisma.coupon.findUnique({
			where: { code: normalizedCode },
			select: { id: true, code: true, discountPct: true, freeShipping: true, active: true, expiresAt: true, maxUses: true, currentUses: true, minPurchaseAmount: true },
		});

		if (!coupon || !coupon.active) return null;
		if (coupon.expiresAt && coupon.expiresAt < new Date()) return null;
		if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return null;
		if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) return null;

		await prisma.coupon.update({
			where: { id: coupon.id },
			data: { currentUses: { increment: 1 } },
		});

		return { id: coupon.id, code: coupon.code, discountPct: coupon.discountPct, freeShipping: coupon.freeShipping };
	} catch (couponError) {
		console.warn("Failed to apply coupon:", couponError);
		// Continue without coupon rather than failing the entire checkout
		return null;
	}
}
