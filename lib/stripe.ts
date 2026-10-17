import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		return null;
	}

	if (!stripeClient) {
		stripeClient = new Stripe(secretKey, {
			apiVersion: "2026-07-29.dahlia",
		});
	}

	return stripeClient;
}

export type CreateMandapPaymentLinkParams = {
	inquiryId: string;
	productName: string;
	category: string;
	quotedPriceNok: number;
};

export async function createMandapPaymentLink(params: CreateMandapPaymentLinkParams): Promise<string | null> {
	const stripe = getStripeClient();
	if (!stripe) {
		return null;
	}

	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.handcraftsglobal.com";

	const price = await stripe.prices.create({
		currency: "nok",
		unit_amount: Math.round(params.quotedPriceNok * 100),
		product_data: {
			name: `Custom ${params.category}: ${params.productName}`,
			metadata: {
				inquiryId: params.inquiryId,
			},
		},
	});

	const paymentLink = await stripe.paymentLinks.create({
		line_items: [
			{
				price: price.id,
				quantity: 1,
			},
		],
		metadata: {
			inquiryId: params.inquiryId,
		},
		payment_intent_data: {
			metadata: {
				inquiryId: params.inquiryId,
			},
		},
		after_completion: {
			type: "redirect",
			redirect: {
				url: `${siteUrl}/checkout/success?inquiry_id=${params.inquiryId}&custom_order=true`,
			},
		},
	});

	return paymentLink.url;
}
