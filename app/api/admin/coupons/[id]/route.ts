import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/coupons/[id] - Get single coupon
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const coupon = await prisma.coupon.findUnique({
			where: { id },
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

		if (!coupon) {
			return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
		}

		return NextResponse.json(coupon);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to fetch coupon.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// PATCH /api/admin/coupons/[id] - Update coupon
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { code, discountPct, freeShipping, active, expiresAt, maxUses, maxUsesPerCustomer, minPurchaseAmount } = body;

		// Check if coupon exists
		const existing = await prisma.coupon.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
		}

		// If updating code, check it's not duplicate
		if (code && code.trim().toUpperCase() !== existing.code) {
			const duplicate = await prisma.coupon.findUnique({
				where: { code: code.trim().toUpperCase() },
			});

			if (duplicate) {
				return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
			}
		}

		const updateData: Record<string, unknown> = {};

		if (code !== undefined) updateData.code = code.trim().toUpperCase();
		if (discountPct !== undefined) updateData.discountPct = Number(discountPct);
		if (freeShipping !== undefined) updateData.freeShipping = Boolean(freeShipping);
		if (active !== undefined) updateData.active = Boolean(active);
		if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
		if (maxUses !== undefined) updateData.maxUses = maxUses ? Number(maxUses) : null;
		if (maxUsesPerCustomer !== undefined) updateData.maxUsesPerCustomer = maxUsesPerCustomer ? Number(maxUsesPerCustomer) : null;
		if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = minPurchaseAmount !== null && minPurchaseAmount !== "" ? Number(minPurchaseAmount) : null;

		const coupon = await prisma.coupon.update({
			where: { id },
			data: updateData,
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

		return NextResponse.json(coupon);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update coupon.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const existing = await prisma.coupon.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
		}

		await prisma.coupon.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to delete coupon.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
