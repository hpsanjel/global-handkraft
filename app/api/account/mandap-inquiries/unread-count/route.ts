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
			return NextResponse.json({ count: 0 });
		}

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ count: 0 });
		}

		// Count messages from admin that customer hasn't seen
		// We'll track this by checking if there are any messages after the customer's last message
		const inquiries = await prisma.mandapInquiry.findMany({
			where: {
				email: {
					equals: user.email,
					mode: "insensitive",
				},
			},
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});

		let unreadCount = 0;

		for (const inquiry of inquiries) {
			// Find the last message sent by the customer
			const customerMessages = inquiry.messages.filter((msg) => msg.sender === "CUSTOMER");
			const lastCustomerMessage = customerMessages.length > 0 ? customerMessages[customerMessages.length - 1] : null;

			// Count admin messages after the last customer message
			if (lastCustomerMessage) {
				const unreadMessages = inquiry.messages.filter((msg) => msg.sender === "ADMIN" && new Date(msg.createdAt) > new Date(lastCustomerMessage.createdAt));
				unreadCount += unreadMessages.length;
			} else {
				// If no customer messages, all admin messages are unread
				const adminMessages = inquiry.messages.filter((msg) => msg.sender === "ADMIN");
				unreadCount += adminMessages.length;
			}
		}

		return NextResponse.json({ count: unreadCount });
	} catch (error) {
		return NextResponse.json({ count: 0 });
	}
}
