import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { isOrderStatus } from "@/lib/order-status";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

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

export async function GET() {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		const orders = await prisma.order.findMany({
			include: {
				address: true,
				items: {
					include: {
						product: true,
						variant: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(orders);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load orders.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

type UpdateOrderStatusPayload = {
	orderId?: string;
	status?: string;
	note?: string;
};

export async function PATCH(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) {
			return adminError;
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = (await request.json()) as UpdateOrderStatusPayload;
		const { orderId, status, note } = body;

		if (!orderId) {
			return NextResponse.json({ error: "Order id is required." }, { status: 400 });
		}

		if (!status || !isOrderStatus(status)) {
			return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
		}

		const existingOrder = await prisma.order.findUnique({
			where: { id: orderId },
			include: { address: true },
		});

		if (!existingOrder) {
			return NextResponse.json({ error: "Order not found." }, { status: 404 });
		}

		if (existingOrder.status === status) {
			return NextResponse.json({ order: existingOrder, message: "Status unchanged." });
		}

		const [updatedOrder] = await prisma.$transaction([
			prisma.order.update({ where: { id: orderId }, data: { status } }),
			prisma.orderStatusEvent.create({ data: { orderId, status, note: note?.trim() || null } }),
		]);

		try {
			await sendOrderStatusUpdateEmail({
				to: existingOrder.address.email,
				customerName: existingOrder.address.fullName,
				orderNumber: existingOrder.orderNumber,
				status,
				note: note?.trim() || null,
			});
		} catch (emailError) {
			console.error("Failed to send order status update email:", emailError);
		}

		return NextResponse.json({ order: updatedOrder });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to update order status.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
