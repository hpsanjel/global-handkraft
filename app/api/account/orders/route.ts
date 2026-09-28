import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to view orders." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json([]);
		}

		const orders = await prisma.order.findMany({
			where: {
				address: {
					email: {
						equals: user.email,
						mode: "insensitive",
					},
				},
			},
			include: {
				items: {
					include: {
						product: { select: { name: true } },
						variant: { select: { name: true } },
					},
				},
				statusEvents: {
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const mappedOrders = orders.map((order) => {
			const baseItemsSubtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
			const hasUnmergedMarkup = order.subtotal > baseItemsSubtotal + 0.01;

			const mappedItems = order.items.map((item) => {
				let effectiveUnitPrice = item.unitPrice;
				if (hasUnmergedMarkup) {
					if (item.zoneMarkup > 0) {
						effectiveUnitPrice = item.unitPrice + item.zoneMarkup;
					} else if (baseItemsSubtotal > 0) {
						const markupShare = (order.subtotal - baseItemsSubtotal) * ((item.unitPrice * item.quantity) / baseItemsSubtotal);
						effectiveUnitPrice = Number(((item.unitPrice * item.quantity + markupShare) / item.quantity).toFixed(2));
					}
				}
				return {
					...item,
					unitPrice: effectiveUnitPrice,
				};
			});

			return {
				...order,
				items: mappedItems,
			};
		});

		return NextResponse.json(mappedOrders);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load orders.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
