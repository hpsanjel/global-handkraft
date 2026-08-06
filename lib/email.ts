import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER = "Global Handcrafts <contact@handcraftsglobal.com>";

type OrderConfirmationItem = {
	name: string;
	variantName: string;
	quantity: number;
	unitPrice: number;
	addonNames: string[];
};

type OrderConfirmationAddress = {
	address: string;
	city: string;
	postalCode: string;
	country: string;
};

type OrderConfirmationParams = {
	to: string;
	customerName: string;
	orderNumber: string;
	items: OrderConfirmationItem[];
	subtotal: number;
	vat: number;
	shipping: number;
	shippingMethod: string | null;
	total: number;
	currency: string;
	address: OrderConfirmationAddress;
};

function formatMoney(amount: number, currency: string) {
	return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Sends an order confirmation email via Resend after a Stripe checkout completes.
 * Failures are the caller's responsibility to catch — a failed email should
 * never roll back or fail the order itself.
 */
export async function sendOrderConfirmationEmail(params: OrderConfirmationParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping order confirmation email.");
		return;
	}

	if (!params.to) {
		console.warn(`No recipient email for order ${params.orderNumber}; skipping order confirmation email.`);
		return;
	}

	const itemsHtml = params.items
		.map(
			(item) => `
			<tr>
				<td style="padding:8px 0; border-bottom:1px solid #f0efec;">
					${item.name}${item.variantName ? ` (${item.variantName})` : ""}
					${item.addonNames.length ? `<br/><span style="color:#78716c;font-size:12px;">+ ${item.addonNames.join(", ")}</span>` : ""}
				</td>
				<td style="padding:8px 0; border-bottom:1px solid #f0efec; text-align:center;">${item.quantity}</td>
				<td style="padding:8px 0; border-bottom:1px solid #f0efec; text-align:right;">${formatMoney(item.unitPrice * item.quantity, params.currency)}</td>
			</tr>`,
		)
		.join("");

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">Thank you for your order!</h2>
			<p>Hi ${params.customerName || "there"},</p>
			<p>We've received your order <strong>${params.orderNumber}</strong> and it's being prepared with care by our artisans.</p>

			<table style="width:100%; border-collapse:collapse; margin-top:16px;">
				<thead>
					<tr style="border-bottom:2px solid #1B365D; text-align:left;">
						<th style="padding-bottom:8px;">Item</th>
						<th style="padding-bottom:8px; text-align:center;">Qty</th>
						<th style="padding-bottom:8px; text-align:right;">Price</th>
					</tr>
				</thead>
				<tbody>${itemsHtml}</tbody>
			</table>

			<table style="width:100%; margin-top:16px;">
				<tr><td style="padding:2px 0; color:#57534e;">Subtotal</td><td style="padding:2px 0; text-align:right;">${formatMoney(params.subtotal, params.currency)}</td></tr>
				<tr><td style="padding:2px 0; color:#57534e;">VAT</td><td style="padding:2px 0; text-align:right;">${formatMoney(params.vat, params.currency)}</td></tr>
				<tr><td style="padding:2px 0; color:#57534e;">Shipping (${params.shippingMethod || "Standard"})</td><td style="padding:2px 0; text-align:right;">${formatMoney(params.shipping, params.currency)}</td></tr>
				<tr style="font-weight:bold; border-top:1px solid #e7e5e4;"><td style="padding-top:8px;">Total</td><td style="text-align:right; padding-top:8px;">${formatMoney(params.total, params.currency)}</td></tr>
			</table>

			<h3 style="margin-top:28px; margin-bottom:6px; color:#1B365D;">Delivery details</h3>
			<p style="color:#44403c; margin-top:0;">
				${params.shippingMethod || "Standard shipping"}<br/>
				${params.address.address}<br/>
				${params.address.postalCode} ${params.address.city}<br/>
				${params.address.country}
			</p>

			<p style="margin-top:28px;">We'll email you again once your order ships. Thank you for supporting authentic handcrafted treasures!</p>
			<p>Warm regards,<br/>Global Handcrafts Team</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject: `Order confirmed — ${params.orderNumber}`,
		html,
	});
}
