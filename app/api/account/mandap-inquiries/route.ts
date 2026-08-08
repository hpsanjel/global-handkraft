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
			return NextResponse.json({ error: "You must be signed in to view custom requests." }, { status: 401 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json([]);
		}

		const inquiries = await prisma.mandapInquiry.findMany({
			where: {
				email: {
					equals: user.email,
					mode: "insensitive",
				},
			},
			include: {
				messages: { orderBy: { createdAt: "asc" } },
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(inquiries);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load custom requests.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
