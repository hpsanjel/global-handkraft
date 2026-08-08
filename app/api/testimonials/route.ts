import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const TESTIMONIAL_BUCKET = "testimonials";

// GET /api/testimonials - list active testimonials for the homepage (public)
export async function GET() {
	try {
		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ message: "Database not configured yet." }, { status: 503 });
		}

		const testimonials = await prisma.testimonial.findMany({
			where: { active: true },
			orderBy: { createdAt: "asc" },
		});

		const supabase = await createClient();

		return NextResponse.json(
			testimonials.map((testimonial) => ({
				id: testimonial.id,
				name: testimonial.name,
				quote: testimonial.quote,
				rating: testimonial.rating,
				image: testimonial.imagePath ? supabase.storage.from(TESTIMONIAL_BUCKET).getPublicUrl(testimonial.imagePath).data.publicUrl : null,
			})),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load testimonials.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
