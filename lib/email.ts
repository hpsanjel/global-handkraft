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
	isPickupOrder?: boolean;
	pickupAddress?: OrderConfirmationAddress;
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

			<h3 style="margin-top:28px; margin-bottom:6px; color:#1B365D;">${params.isPickupOrder ? "Pickup details" : "Delivery details"}</h3>
			<p style="color:#44403c; margin-top:0;">
				${params.isPickupOrder ? "In-store pickup" : params.shippingMethod || "Standard shipping"}<br/>
				${params.isPickupOrder && params.pickupAddress ? `${params.pickupAddress.address}<br/>${params.pickupAddress.postalCode} ${params.pickupAddress.city}<br/>${params.pickupAddress.country}` : `${params.address.address}<br/>${params.address.postalCode} ${params.address.city}<br/>${params.address.country}`}
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

type MandapInquiryReplyParams = {
	to: string;
	category: string;
	productName: string;
	message: string;
};

/**
 * Notifies the customer by email when admin replies to their custom Mandap/Temple order request.
 * Failures are the caller's responsibility to catch — a failed email should
 * never fail the reply submission itself.
 */
export async function sendMandapInquiryReplyEmail(params: MandapInquiryReplyParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping mandap inquiry reply email.");
		return;
	}

	if (!params.to) {
		console.warn("No recipient email for mandap inquiry reply; skipping email.");
		return;
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New reply on your custom ${params.category.toLowerCase()} request</h2>
			<p>Hi there,</p>
			<p>We've replied to your custom order request for <strong>${params.productName}</strong>:</p>
			<p style="color:#57534e; font-style:italic;">"${params.message}"</p>
			<p style="margin-top:28px;">You can reply from your <a href="https://handcraftsglobal.com/account/custom-requests" style="color:#1B365D;">account dashboard</a>.</p>
			<p>Warm regards,<br/>Global Handcrafts Team</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject: `New reply on your custom ${params.category.toLowerCase()} request`,
		html,
	});
}

type MandapInquiryCustomerMessageParams = {
	category: string;
	productName: string;
	message: string;
	customerEmail: string | null;
};

/**
 * Notifies admins by email when a customer sends a follow-up message on their custom
 * Mandap/Temple order request. Failures are the caller's responsibility to catch.
 */
export async function sendMandapInquiryCustomerMessageEmail(params: MandapInquiryCustomerMessageParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping mandap inquiry customer message email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping mandap inquiry customer message email.");
		return;
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New customer reply — ${params.category} request</h2>
			<p>${params.customerEmail || "A customer"} replied on the custom <strong>${params.category}</strong> request for <strong>${params.productName}</strong>:</p>
			<p style="color:#57534e; font-style:italic;">"${params.message}"</p>
			<p style="margin-top:28px;">View and reply in the <a href="https://handcraftsglobal.com/admin/orders" style="color:#1B365D;">admin dashboard</a>.</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		subject: `New customer reply — ${params.category} request for ${params.productName}`,
		html,
	});
}

type MandapInquiryStatusUpdateParams = {
	to: string;
	category: string;
	productName: string;
	paymentStatus: string;
	adminNote?: string;
	quotedPrice?: number;
	stripePaymentLink?: string;
};

/**
 * Notifies the customer by email when admin updates the payment status of a custom Mandap/Temple order request.
 * Failures are the caller's responsibility to catch — a failed email should never fail the status update itself.
 */
export async function sendMandapInquiryStatusUpdateEmail(params: MandapInquiryStatusUpdateParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping mandap inquiry status update email.");
		return;
	}

	if (!params.to) {
		console.warn("No recipient email for mandap inquiry status update; skipping email.");
		return;
	}

	const statusLabel = params.paymentStatus === "ACCEPTED" ? "Accepted" : params.paymentStatus === "DECLINED" ? "Declined" : "Updated";
	const statusColor = params.paymentStatus === "ACCEPTED" ? "#16a34a" : params.paymentStatus === "DECLINED" ? "#dc2626" : "#1B365D";
	const paymentLinkHtml = params.stripePaymentLink ? `<p style="margin-top:16px;"><a href="${params.stripePaymentLink}" style="background:#1B365D; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">Pay Now</a></p>` : "";
	const priceHtml = params.quotedPrice ? `<p style="margin-top:12px;"><strong>Quoted price:</strong> NOK ${params.quotedPrice.toFixed(2)}</p>` : "";

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:${statusColor}; margin-bottom:4px;">Custom ${params.category.toLowerCase()} request ${statusLabel}</h2>
			<p>Hi there,</p>
			<p>Your custom order request for <strong>${params.productName}</strong> has been <strong>${statusLabel.toLowerCase()}</strong>.</p>
			${priceHtml}
			${params.adminNote ? `<p style="margin-top:12px; color:#57534e; font-style:italic;">"${params.adminNote}"</p>` : ""}
			${paymentLinkHtml}
			<p style="margin-top:28px;">You can view and reply to this request from your <a href="https://handcraftsglobal.com/account/custom-requests" style="color:#1B365D;">account dashboard</a>.</p>
			<p>Warm regards,<br/>Global Handcrafts Team</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject: `Custom ${params.category.toLowerCase()} request ${statusLabel} — ${params.productName}`,
		html,
	});
}

type AccountDeletionRequestParams = {
	userId: string;
	email: string;
	fullName?: string | null;
};

/**
 * Notifies admins when a buyer requests deletion of their account, so the request can be
 * manually processed within the GDPR 30-day window (order/invoice records must be retained
 * per Norwegian bookkeeping law, so this can't be a fully automated hard-delete).
 * Failures are the caller's responsibility to catch.
 */
export async function sendAccountDeletionRequestEmail(params: AccountDeletionRequestParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping account deletion request email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping account deletion request email.");
		return;
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">Account deletion request</h2>
			<p>A buyer has requested deletion of their account.</p>
			<table style="width:100%; margin-top:16px; border-collapse:collapse;">
				<tr><td style="padding:4px 0; color:#57534e;">Name</td><td style="padding:4px 0; text-align:right;">${params.fullName || "Not provided"}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Email</td><td style="padding:4px 0; text-align:right;">${params.email}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">User ID</td><td style="padding:4px 0; text-align:right;">${params.userId}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Requested at</td><td style="padding:4px 0; text-align:right;">${new Date().toISOString()}</td></tr>
			</table>
			<p style="margin-top:16px;">Please delete their login and profile data, then anonymize (not delete) any linked order/invoice records to preserve accounting history, within 30 days.</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		subject: `Account deletion request — ${params.email}`,
		html,
	});
}
