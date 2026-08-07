import { Resend } from "resend";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER = "Global Handcrafts <contact@handcraftsglobal.com>";

function getAdminEmails(): string[] {
	const raw = process.env.ADMIN_EMAILS ?? "";
	return raw
		.split(/[\n,;\s]+/)
		.map((value) => value.trim())
		.filter(Boolean);
}

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

type OrderConfirmationAttachment = {
	filename: string;
	content: Buffer;
};

type OrderConfirmationParams = {
	to: string;
	customerName: string;
	orderNumber: string;
	items: OrderConfirmationItem[];
	subtotal: number;
	shipping: number;
	shippingMethod: string | null;
	total: number;
	currency: string;
	address: OrderConfirmationAddress;
	/** Optional receipt PDF (from the document generation module) attached to the confirmation email. */
	attachment?: OrderConfirmationAttachment;
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
		attachments: params.attachment ? [{ filename: params.attachment.filename, content: params.attachment.content }] : undefined,
	});
}

type OrderStatusUpdateParams = {
	to: string;
	customerName: string;
	orderNumber: string;
	status: OrderStatus;
	note?: string | null;
};

/**
 * Sends an order status update email via Resend after an admin changes an order's status.
 * Failures are the caller's responsibility to catch — a failed email should
 * never roll back or fail the status update itself.
 */
export async function sendOrderStatusUpdateEmail(params: OrderStatusUpdateParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping order status update email.");
		return;
	}

	if (!params.to) {
		console.warn(`No recipient email for order ${params.orderNumber}; skipping order status update email.`);
		return;
	}

	const meta = ORDER_STATUS_META[params.status];

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">${meta.label}: your order ${params.orderNumber}</h2>
			<p>Hi ${params.customerName || "there"},</p>
			<p>${meta.customerDescription}</p>
			${params.note ? `<p style="color:#57534e; font-style:italic;">"${params.note}"</p>` : ""}
			<p style="margin-top:28px;">Thank you for supporting authentic handcrafted treasures!</p>
			<p>Warm regards,<br/>Global Handcrafts Team</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject: meta.emailSubject.replace("{orderNumber}", params.orderNumber),
		html,
	});
}

type CustomInquiryNotificationParams = {
	category: string;
	productName: string;
	productSlug: string;
	length: string;
	width: string;
	height: string;
	material: string;
	expectedCostRange: string;
	description: string;
	whatsapp: string | null;
	email: string | null;
	sampleImages: string[];
};

/**
 * Notifies admins by email when a buyer submits a custom Mandap or Temple order inquiry.
 * Failures are the caller's responsibility to catch — a failed email should
 * never fail the inquiry submission itself.
 */
export async function sendCustomInquiryAdminNotification(params: CustomInquiryNotificationParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping custom inquiry admin notification email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping custom inquiry admin notification email.");
		return;
	}

	const sampleImagesHtml = params.sampleImages.length ? `<p style="margin-top:12px;"><strong>Sample images:</strong><br/>${params.sampleImages.map((url) => `<a href="${url}" style="color:#1B365D;">${url}</a>`).join("<br/>")}</p>` : "";

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New custom ${params.category.toLowerCase()} order request</h2>
			<p>A buyer has requested a custom <strong>${params.category}</strong> order for <strong>${params.productName}</strong>.</p>

			<table style="width:100%; margin-top:16px; border-collapse:collapse;">
				<tr><td style="padding:4px 0; color:#57534e;">Product</td><td style="padding:4px 0; text-align:right;">${params.productName} (${params.productSlug})</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Dimensions</td><td style="padding:4px 0; text-align:right;">${params.length} x ${params.width} x ${params.height}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Material</td><td style="padding:4px 0; text-align:right;">${params.material}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Expected budget</td><td style="padding:4px 0; text-align:right;">${params.expectedCostRange}</td></tr>
				${params.whatsapp ? `<tr><td style="padding:4px 0; color:#57534e;">WhatsApp</td><td style="padding:4px 0; text-align:right;">${params.whatsapp}</td></tr>` : ""}
				${params.email ? `<tr><td style="padding:4px 0; color:#57534e;">Email</td><td style="padding:4px 0; text-align:right;">${params.email}</td></tr>` : ""}
			</table>

			<p style="margin-top:16px;"><strong>Description:</strong><br/>${params.description}</p>
			${sampleImagesHtml}

			<p style="margin-top:28px;">View and manage this request in the <a href="https://handcraftsglobal.com/admin/orders" style="color:#1B365D;">admin dashboard</a>.</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		subject: `New custom ${params.category.toLowerCase()} order request — ${params.productName}`,
		html,
	});
}
