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
			return NextResponse.json({ error: "You must be signed in to export your data." }, { status: 401 });
		}

		const orders = process.env.DATABASE_URL
			? await prisma.order.findMany({
					where: {
						address: {
							email: {
								equals: user.email,
								mode: "insensitive",
							},
						},
					},
					include: {
						address: true,
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
				})
			: [];

		const exportPayload = {
			exportedAt: new Date().toISOString(),
			account: {
				id: user.id,
				email: user.email,
				fullName: user.user_metadata?.full_name ?? null,
				phone: user.user_metadata?.phone ?? null,
				createdAt: user.created_at,
				signInMethods: Array.from(new Set((user.identities ?? []).map((identity) => identity.provider))),
			},
			savedShippingAddress: user.user_metadata?.shipping_address ?? null,
			orders,
		};

		return new NextResponse(JSON.stringify(exportPayload, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Content-Disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to prepare your data export.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
