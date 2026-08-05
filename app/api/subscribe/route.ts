import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
	try {
		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
		}
		const existing = await prisma.newsletterSubscriber.findUnique({
			where: { email },
		});

		if (existing) {
			return NextResponse.json({
				success: true,
				message: "Already subscribed.",
			});
		}

		await prisma.newsletterSubscriber.create({
			data: { email },
		});

		await resend.emails.send({
			from: "Handicraft Global <contact@handcraftsglobal.com>",
			to: email,
			subject: "Thank you for subscribing!",
			html: `
        <h2>Thank you for subscribing 🎉</h2>

        <p>We appreciate your interest in Handicraft Global.</p>

        <p>You will receive updates about our new handcrafted products,
        offers, and exclusive discounts.</p>

        <br/>

        <p>Best Regards,<br/>
        Handicraft Global Team</p>
      `,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error(err);

		return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
	}
}
