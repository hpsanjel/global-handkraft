import { Resend } from "resend";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/order-status";

const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER = "Global Handcrafts <contact@handcraftsglobal.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.handcraftsglobal.com";

function getAdminEmails(): string[] {
	const raw = process.env.ADMIN_EMAILS ?? "";
	return raw
		.replace(/["']/g, "")
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

	// Routed through /login?next=... so it works whether the buyer is already
	// signed in, signed out, or has never created an account password (the
	// login page itself offers Google sign-in too) — /account/orders matches
	// orders to the signed-in user's email, not a stored user id.
	const orderPagePath = `/account/orders?order=${params.orderNumber}`;
	const orderLinkUrl = `${SITE_URL}/login?next=${encodeURIComponent(orderPagePath)}`;

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

			<p style="margin-top:28px;"><a href="${orderLinkUrl}" style="background:#1B365D; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">View Your Order</a></p>
			<p style="margin-top:16px;">We'll email you again once your order ships. Thank you for supporting authentic handcrafted treasures!</p>
			<p>Warm regards,<br/>Global Handcrafts Team</p>
		</div>
	`;

	const result = await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject: `Order confirmed — ${params.orderNumber}`,
		html,
		attachments: params.attachment ? [{ filename: params.attachment.filename, content: params.attachment.content }] : undefined,
	});

	if (result.error) {
		console.error(`Failed to send order confirmation email for order ${params.orderNumber}:`, result.error);
	}
}

export type NewOrderAdminNotificationParams = {
	orderNumber: string;
	paymentMethod: string;
	customerName: string;
	customerEmail: string;
	customerPhone?: string;
	items: OrderConfirmationItem[];
	subtotal: number;
	shipping: number;
	shippingMethod: string | null;
	total: number;
	currency: string;
	address: OrderConfirmationAddress;
	isPickupOrder?: boolean;
	pickupAddress?: OrderConfirmationAddress;
};

/**
 * Notifies admins by email when a new order has been paid and created.
 * Failures are the caller's responsibility to catch — a failed email should
 * never roll back or fail the order itself.
 */
export async function sendNewOrderAdminNotification(params: NewOrderAdminNotificationParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping new order admin notification email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping new order admin notification email.");
		return;
	}

	const orderAdminUrl = `${SITE_URL}/admin/orders#order-${params.orderNumber}`;

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
			<h2 style="color:#1B365D; margin-bottom:4px;">New Order Received: ${params.orderNumber}</h2>
			<p>A new order has been paid and is ready for fulfillment.</p>

			<table style="width:100%; margin-top:16px; border-collapse:collapse;">
				<tr><td style="padding:4px 0; color:#57534e;">Customer</td><td style="padding:4px 0; text-align:right; font-weight:bold;">${params.customerName || "Guest"}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Email</td><td style="padding:4px 0; text-align:right;"><a href="mailto:${params.customerEmail}" style="color:#1B365D;">${params.customerEmail}</a></td></tr>
				${params.customerPhone ? `<tr><td style="padding:4px 0; color:#57534e;">Phone</td><td style="padding:4px 0; text-align:right;"><a href="tel:${params.customerPhone}" style="color:#1B365D;">${params.customerPhone}</a></td></tr>` : ""}
				<tr><td style="padding:4px 0; color:#57534e;">Payment Method</td><td style="padding:4px 0; text-align:right;">${params.paymentMethod}</td></tr>
			</table>

			<table style="width:100%; border-collapse:collapse; margin-top:20px;">
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

			<h3 style="margin-top:24px; margin-bottom:6px; color:#1B365D;">${params.isPickupOrder ? "Pickup details" : "Shipping details"}</h3>
			<p style="color:#44403c; margin-top:0;">
				${params.isPickupOrder ? "In-store pickup" : params.shippingMethod || "Standard shipping"}<br/>
				${params.address.address}<br/>${params.address.postalCode} ${params.address.city}<br/>${params.address.country}
			</p>

			<p style="margin-top:28px;">
				<a href="${orderAdminUrl}" style="background:#1B365D; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">View in Admin Dashboard</a>
			</p>
		</div>
	`;

	const result = await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		subject: `New order ${params.orderNumber} — ${formatMoney(params.total, params.currency)} (${params.customerName || "Customer"})`,
		html,
	});

	if (result.error) {
		console.error(`Failed to send new order admin notification for order ${params.orderNumber}:`, result.error);
	}
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

			<p style="margin-top:28px;"><a href="${SITE_URL}/admin/custom-requests" style="background:#1B365D; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">View in Admin Dashboard</a></p>
		</div>
	`;

	const result = await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		replyTo: params.email || undefined,
		subject: `New custom ${params.category.toLowerCase()} order request — ${params.productName}`,
		html,
	});

	if (result.error) {
		console.error("Failed to send custom inquiry admin notification email:", result.error);
	}
}

type ContactFormNotificationParams = {
	name: string;
	email: string;
	phone: string;
	message: string;
};

/**
 * Notifies admins by email when a visitor submits the public contact form.
 * Failures are the caller's responsibility to catch — a failed email should
 * never fail the form submission itself.
 */
export async function sendContactFormNotification(params: ContactFormNotificationParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping contact form admin notification email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping contact form admin notification email.");
		return;
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New contact form message</h2>

			<table style="width:100%; margin-top:16px; border-collapse:collapse;">
				<tr><td style="padding:4px 0; color:#57534e;">Name</td><td style="padding:4px 0; text-align:right;">${params.name}</td></tr>
				<tr><td style="padding:4px 0; color:#57534e;">Email</td><td style="padding:4px 0; text-align:right;">${params.email}</td></tr>
				${params.phone ? `<tr><td style="padding:4px 0; color:#57534e;">Phone</td><td style="padding:4px 0; text-align:right;">${params.phone}</td></tr>` : ""}
			</table>

			<p style="margin-top:16px;"><strong>Message:</strong><br/>${params.message}</p>
		</div>
	`;

	await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		replyTo: params.email,
		subject: `New contact form message from ${params.name}`,
		html,
	});
}

type MandapInquiryReplyParams = {
	to: string;
	category: string;
	productName: string;
	message: string;
	attachments?: string[];
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

	const attachmentsHtml = params.attachments?.length ? `<p style="margin-top:12px;"><strong>Attachment:</strong><br/>${params.attachments.map((url) => `<a href="${url}" style="color:#1B365D;">${url}</a>`).join("<br/>")}</p>` : "";

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New reply on your custom ${params.category.toLowerCase()} request</h2>
			<p>Hi there,</p>
			<p>We've replied to your custom order request for <strong>${params.productName}</strong>:</p>
			<p style="color:#57534e; font-style:italic;">"${params.message}"</p>
			${attachmentsHtml}
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
	attachments?: string[];
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

	const attachmentsHtml = params.attachments?.length ? `<p style="margin-top:12px;"><strong>Attachment:</strong><br/>${params.attachments.map((url) => `<a href="${url}" style="color:#1B365D;">${url}</a>`).join("<br/>")}</p>` : "";

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1c1917;">
			<h2 style="color:#1B365D; margin-bottom:4px;">New customer reply — ${params.category} request</h2>
			<p>${params.customerEmail || "A customer"} replied on the custom <strong>${params.category}</strong> request for <strong>${params.productName}</strong>:</p>
			<p style="color:#57534e; font-style:italic;">"${params.message}"</p>
			${attachmentsHtml}
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

export type MandapInquiryStatusUpdateParams = {
	to: string;
	category: string;
	productName: string;
	paymentStatus: string;
	adminNote?: string;
	quotedPrice?: number;
	stripePaymentLink?: string;
	length?: string;
	width?: string;
	height?: string;
	material?: string;
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

	const isAccepted = params.paymentStatus === "ACCEPTED";
	const isPaid = params.paymentStatus === "PAID";
	const isDeclined = params.paymentStatus === "DECLINED";

	let subject = `Custom ${params.category.toLowerCase()} request updated — ${params.productName}`;
	if (isAccepted) {
		subject = `Custom ${params.category.toLowerCase()} request accepted — ${params.productName}${params.quotedPrice ? ` (Quoted: NOK ${params.quotedPrice.toFixed(2)})` : ""}`;
	} else if (isPaid) {
		subject = `Payment confirmed: Custom ${params.category.toLowerCase()} order — ${params.productName}`;
	} else if (isDeclined) {
		subject = `Update on your custom ${params.category.toLowerCase()} request — ${params.productName}`;
	}

	const customRequestsUrl = `${SITE_URL}/account/custom-requests`;

	let bodyHtml = "";

	if (isAccepted) {
		bodyHtml = `
			<div style="border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
				<span style="font-size: 12px; font-weight: bold; letter-spacing: 0.1em; color: #16a34a; text-transform: uppercase;">Request Accepted</span>
				<h1 style="color: #1B365D; margin: 8px 0 0 0; font-size: 22px;">Your custom ${params.category.toLowerCase()} request has been accepted!</h1>
			</div>

			<p style="font-size: 15px; line-height: 1.5;">Hi there,</p>
			<p style="font-size: 15px; line-height: 1.5;">Great news! Our artisan team has reviewed your custom order request for <strong>${params.productName}</strong> and accepted it.</p>

			<div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin: 20px 0;">
				<h3 style="margin: 0 0 12px 0; color: #1B365D; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Order Specifications & Quote</h3>
				<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
					${params.length && params.width && params.height ? `<tr><td style="padding: 6px 0; color: #57534e;">Dimensions:</td><td style="padding: 6px 0; text-align: right; font-weight: 500;">${params.length} x ${params.width} x ${params.height}</td></tr>` : ""}
					${params.material ? `<tr><td style="padding: 6px 0; color: #57534e;">Material:</td><td style="padding: 6px 0; text-align: right; font-weight: 500;">${params.material}</td></tr>` : ""}
					${params.quotedPrice ? `<tr style="border-top: 1px solid #e7e5e4;"><td style="padding: 10px 0 4px 0; color: #1B365D; font-weight: bold; font-size: 16px;">Quoted Price:</td><td style="padding: 10px 0 4px 0; text-align: right; color: #16a34a; font-weight: bold; font-size: 18px;">NOK ${params.quotedPrice.toFixed(2)}</td></tr>` : ""}
				</table>
			</div>

			${params.adminNote ? `
			<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
				<p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #166534; letter-spacing: 0.05em;">Note from Artisan Team</p>
				<p style="margin: 6px 0 0 0; font-size: 14px; color: #14532d; line-height: 1.5; font-style: italic;">"${params.adminNote}"</p>
			</div>` : ""}

			${params.stripePaymentLink ? `
			<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
				<h3 style="margin: 0 0 8px 0; color: #1B365D; font-size: 17px;">Confirm Your Order</h3>
				<p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; line-height: 1.5;">If you are happy with the quoted price and specifications, click below to confirm your order and complete secure payment via Stripe:</p>
				<a href="${params.stripePaymentLink}" style="background-color: #16a34a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Pay Now to Confirm Order${params.quotedPrice ? ` (NOK ${params.quotedPrice.toFixed(2)})` : ""}</a>
				<p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">Or copy this secure link: <br/><a href="${params.stripePaymentLink}" style="color: #1B365D; word-break: break-all;">${params.stripePaymentLink}</a></p>
			</div>` : `
			<p style="margin-top: 16px; font-size: 14px; color: #57534e;">Our team is preparing payment details. You will receive an update soon with the payment link.</p>`}

			<p style="margin-top: 24px; font-size: 14px; line-height: 1.5; color: #57534e;">
				Have questions or want to request adjustments to the design or price before confirming? You can reply directly to this email or chat with our team on your <a href="${customRequestsUrl}" style="color: #1B365D; font-weight: 500; text-decoration: underline;">Custom Requests Dashboard</a>.
			</p>
		`;
	} else if (isPaid) {
		bodyHtml = `
			<div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
				<span style="font-size: 12px; font-weight: bold; letter-spacing: 0.1em; color: #0284c7; text-transform: uppercase;">Payment Confirmed</span>
				<h1 style="color: #1B365D; margin: 8px 0 0 0; font-size: 22px;">Payment received for your custom ${params.category.toLowerCase()} order!</h1>
			</div>

			<p style="font-size: 15px; line-height: 1.5;">Hi there,</p>
			<p style="font-size: 15px; line-height: 1.5;">Thank you! We have successfully received payment for your custom order <strong>${params.productName}</strong>.</p>

			${params.quotedPrice ? `
			<div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
				<p style="margin: 0; font-size: 13px; color: #0369a1; text-transform: uppercase; font-weight: bold;">Amount Paid</p>
				<p style="margin: 4px 0 0 0; font-size: 22px; font-weight: bold; color: #0284c7;">NOK ${params.quotedPrice.toFixed(2)}</p>
			</div>` : ""}

			<p style="font-size: 14px; line-height: 1.5; color: #44403c;">Our master artisans are now commencing production of your custom piece. We will keep you updated on progress, crafting stages, and shipment dispatch.</p>

			${params.adminNote ? `<p style="margin-top: 12px; color: #57534e; font-style: italic;">"${params.adminNote}"</p>` : ""}

			<p style="margin-top: 24px;"><a href="${customRequestsUrl}" style="background-color: #1B365D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Order in Dashboard</a></p>
		`;
	} else if (isDeclined) {
		bodyHtml = `
			<div style="border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 20px;">
				<span style="font-size: 12px; font-weight: bold; letter-spacing: 0.1em; color: #dc2626; text-transform: uppercase;">Request Update</span>
				<h1 style="color: #1B365D; margin: 8px 0 0 0; font-size: 22px;">Update on your custom ${params.category.toLowerCase()} request</h1>
			</div>

			<p style="font-size: 15px; line-height: 1.5;">Hi there,</p>
			<p style="font-size: 15px; line-height: 1.5;">Thank you for your interest in a custom ${params.category.toLowerCase()} (<strong>${params.productName}</strong>).</p>
			<p style="font-size: 14px; line-height: 1.5; color: #57534e;">Unfortunately, we are unable to fulfill this custom request as specified at this time.</p>

			${params.adminNote ? `
			<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
				<p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #991b1b; letter-spacing: 0.05em;">Reason / Note</p>
				<p style="margin: 6px 0 0 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">"${params.adminNote}"</p>
			</div>` : ""}

			<p style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #57534e;">If you would like to discuss alternative materials, dimensions, or standard models from our collection, please feel free to reply to this email or contact us.</p>
		`;
	} else {
		bodyHtml = `
			<h2 style="color: #1B365D; margin-bottom: 4px;">Custom ${params.category.toLowerCase()} request update</h2>
			<p>Hi there,</p>
			<p>Your custom order request for <strong>${params.productName}</strong> has been updated.</p>
			${params.quotedPrice ? `<p style="margin-top: 12px;"><strong>Quoted price:</strong> NOK ${params.quotedPrice.toFixed(2)}</p>` : ""}
			${params.adminNote ? `<p style="margin-top: 12px; color: #57534e; font-style: italic;">"${params.adminNote}"</p>` : ""}
			${params.stripePaymentLink ? `<p style="margin-top: 16px;"><a href="${params.stripePaymentLink}" style="background-color: #1B365D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Now</a></p>` : ""}
			<p style="margin-top: 24px;">You can view and reply to this request from your <a href="${customRequestsUrl}" style="color: #1B365D;">account dashboard</a>.</p>
		`;
	}

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; background-color: #ffffff; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px;">
			${bodyHtml}
			<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 13px; color: #78716c;">
				<p style="margin: 0;">Warm regards,<br/><strong>Global Handcrafts Team</strong><br/><a href="${SITE_URL}" style="color: #1B365D; text-decoration: none;">handcraftsglobal.com</a></p>
			</div>
		</div>
	`;

	const result = await resend.emails.send({
		from: SENDER,
		to: params.to,
		subject,
		html,
	});

	if (result.error) {
		console.error(`Failed to send status update email to ${params.to}:`, result.error);
	}
}

export type CustomOrderPaymentAdminNotificationParams = {
	inquiryId: string;
	category: string;
	productName: string;
	productSlug: string;
	customerEmail: string;
	customerWhatsapp?: string | null;
	amountPaid: number;
	currency: string;
	dimensions: string;
	material: string;
	description: string;
	stripeSessionId?: string;
};

/**
 * Notifies admins by email when a customer has successfully completed payment for a custom Mandap or Temple order.
 * Failures are the caller's responsibility to catch — a failed email should never fail the payment webhook.
 */
export async function sendCustomOrderPaymentAdminNotification(params: CustomOrderPaymentAdminNotificationParams) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("RESEND_API_KEY not configured; skipping custom order payment admin notification email.");
		return;
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length === 0) {
		console.warn("ADMIN_EMAILS not configured; skipping custom order payment admin notification email.");
		return;
	}

	const adminUrl = `${SITE_URL}/admin/custom-requests`;

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#1c1917; background-color:#ffffff; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px;">
			<div style="border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
				<span style="font-size: 12px; font-weight: bold; letter-spacing: 0.1em; color: #16a34a; text-transform: uppercase;">Payment Received</span>
				<h1 style="color: #1B365D; margin: 8px 0 0 0; font-size: 22px;">Custom ${params.category} Order Paid</h1>
			</div>

			<p style="font-size: 15px; line-height: 1.5;">A customer has completed payment for their custom <strong>${params.category.toLowerCase()}</strong> order (<strong>${params.productName}</strong>).</p>

			<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
				<p style="margin: 0 0 4px 0; font-size: 13px; color: #166534; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Amount Paid</p>
				<p style="margin: 0; font-size: 24px; font-weight: bold; color: #15803d;">${formatMoney(params.amountPaid, params.currency)}</p>
			</div>

			<table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
				<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Product</td><td style="padding: 8px 0; text-align: right; font-weight: 500; border-bottom: 1px solid #f5f5f4;">${params.productName}</td></tr>
				<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Category</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f5f5f4;">${params.category}</td></tr>
				<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Dimensions</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f5f5f4;">${params.dimensions}</td></tr>
				<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Material</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f5f5f4;">${params.material}</td></tr>
				<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Customer Email</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f5f5f4;"><a href="mailto:${params.customerEmail}" style="color: #1B365D;">${params.customerEmail}</a></td></tr>
				${params.customerWhatsapp ? `<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Customer WhatsApp</td><td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f5f5f4;"><a href="https://wa.me/${params.customerWhatsapp.replace(/[^0-9]/g, "")}" style="color: #1B365D;">${params.customerWhatsapp}</a></td></tr>` : ""}
				${params.stripeSessionId ? `<tr><td style="padding: 8px 0; color: #57534e; border-bottom: 1px solid #f5f5f4;">Stripe ID</td><td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; border-bottom: 1px solid #f5f5f4;">${params.stripeSessionId}</td></tr>` : ""}
			</table>

			<div style="margin-top: 16px;">
				<p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #57534e;">Project Description:</p>
				<p style="margin: 0; font-size: 14px; line-height: 1.5; color: #44403c; background: #fafaf9; padding: 12px; border-radius: 6px;">${params.description}</p>
			</div>

			<p style="margin-top: 24px;">
				<a href="${adminUrl}" style="background-color: #1B365D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Custom Order in Admin Dashboard</a>
			</p>
			<p style="margin-top: 16px; font-size: 13px; color: #78716c;">This request status is now marked as <strong>PAID</strong>. You can proceed with artisan crafting and production schedule.</p>
		</div>
	`;

	const result = await resend.emails.send({
		from: SENDER,
		to: adminEmails,
		subject: `Payment received: Custom ${params.category.toLowerCase()} order — ${params.productName} (${formatMoney(params.amountPaid, params.currency)})`,
		html,
	});

	if (result.error) {
		console.error("Failed to send custom order payment admin notification email:", result.error);
	}
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
