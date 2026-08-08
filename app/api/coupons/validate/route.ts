import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

interface CouponValidationRequest {
	code: string;
	subtotal: number;
	email?: string;
}

interface CouponValidationResponse {
	valid: boolean;
	discountPct?: number;
	freeShipping?: boolean;
	finalSubtotal?: number;
	error?: string;
}

// GET /api/coupons/validate - Validate a coupon code
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as CouponValidationRequest;
		const { code, subtotal, email } = body;

		if (!code || typeof code !== "string") {
			const response: CouponValidationResponse = { valid: false, error: "Coupon code is required." };
			return NextResponse.json(response);
		}

		const normalizedCode = code.trim().toUpperCase();

		// Find the coupon
		const coupon = await prisma.coupon.findUnique({
			where: { code: normalizedCode },
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
			},
		});

		if (!coupon) {
			const response: CouponValidationResponse = { valid: false, error: "Invalid coupon code." };
			return NextResponse.json(response);
		}

		// Check if coupon is active
		if (!coupon.active) {
			const response: CouponValidationResponse = { valid: false, error: "This coupon is no longer active." };
			return NextResponse.json(response);
		}

		// Check expiration
		if (coupon.expiresAt && coupon.expiresAt < new Date()) {
			const response: CouponValidationResponse = { valid: false, error: "This coupon has expired." };
			return NextResponse.json(response);
		}

		// Check total uses limit
		if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
			const response: CouponValidationResponse = { valid: false, error: "This coupon has reached its maximum number of uses." };
			return NextResponse.json(response);
		}

		// Check minimum purchase amount
		if (coupon.minPurchaseAmount && (typeof subtotal !== "number" || subtotal < coupon.minPurchaseAmount)) {
			const response: CouponValidationResponse = { valid: false, error: `This coupon requires a minimum purchase of NOK ${coupon.minPurchaseAmount}.` };
			return NextResponse.json(response);
		}

		// Check per-customer usage limit
		if (coupon.maxUsesPerCustomer && email) {
			const customerUsageCount = await prisma.order.count({
				where: {
					address: {
						email: email,
					},
					// You might want to add a couponCode field to orders to track this properly
					// For now, we'll skip this check or implement it differently
				},
			});

			// Note: This is a simplified version. In a real implementation, you'd need to
			// track coupon usage per customer more precisely, possibly with a CouponUsage model
			// For now, we'll just return a note that this feature requires order tracking
		}

		// Calculate discount
		const discountAmount = subtotal * (coupon.discountPct / 100);
		const finalSubtotal = subtotal - discountAmount;

		const response: CouponValidationResponse = {
			valid: true,
			discountPct: coupon.discountPct,
			freeShipping: coupon.freeShipping,
			finalSubtotal: Math.max(0, finalSubtotal),
		};

		return NextResponse.json(response);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to validate coupon.";
		const response: CouponValidationResponse = { valid: false, error: message };
		return NextResponse.json(response, { status: 500 });
	}
}
