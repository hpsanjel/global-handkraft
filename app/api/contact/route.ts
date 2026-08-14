import { NextResponse } from "next/server";
import { sendContactFormNotification } from "@/lib/email";

export async function POST(req: Request) {
	try {
		const { name, email, phone, message } = await req.json();

		if (!name || typeof name !== "string" || !name.trim()) {
			return NextResponse.json({ error: "Name is required." }, { status: 400 });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || typeof email !== "string" || !emailRegex.test(email)) {
			return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
		}

		if (!message || typeof message !== "string" || !message.trim()) {
			return NextResponse.json({ error: "Message is required." }, { status: 400 });
		}

		await sendContactFormNotification({
			name: name.trim(),
			email: email.trim(),
			phone: typeof phone === "string" ? phone.trim() : "",
			message: message.trim(),
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error(err);

		return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
	}
}
