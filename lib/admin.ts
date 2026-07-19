import Stripe from "stripe";
import { products } from "@/lib/data/products";

export interface AdminOrder {
	id: string;
	customer: string;
	email: string;
	address: string;
	item: string;
	variant: string;
	status: string;
	amount: number;
	date: string;
}

export async function getRecentOrders(limit = 10): Promise<AdminOrder[]> {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		return [];
	}

	const stripe = new Stripe(secretKey, {
		apiVersion: "2026-06-24.dahlia",
	});

	const sessions = await stripe.checkout.sessions.list({
		limit,
		expand: ["data.payment_intent"],
	});

	return sessions.data
		.filter((session) => session.payment_status === "paid")
		.map((session) => {
			const customerName = session.customer_details?.name || "Guest customer";
			const customerEmail = session.customer_details?.email || session.customer_email || "No email provided";
			const address = [session.customer_details?.address?.line1, session.customer_details?.address?.line2, session.customer_details?.address?.city, session.customer_details?.address?.state, session.customer_details?.address?.postal_code, session.customer_details?.address?.country].filter(Boolean).join(", ");

			const metadata = session.metadata?.items || "";
			const [productId, variantId] = metadata.split("|")[0]?.split(":") || [];
			const product = products.find((item) => item.id === productId);
			const variant = product?.variants.find((item) => item.id === variantId);

			return {
				id: session.id.slice(-8).toUpperCase(),
				customer: customerName,
				email: customerEmail,
				address: address || "Address not provided",
				item: product?.name || "Handcrafted product",
				variant: variant?.name || "Selected option",
				status: session.payment_status === "paid" ? "Paid" : "Pending",
				amount: (session.amount_total ?? 0) / 100,
				date: new Date(session.created * 1000).toLocaleString("en-GB", {
					day: "numeric",
					month: "short",
					hour: "numeric",
					minute: "2-digit",
				}),
			};
		});
}
