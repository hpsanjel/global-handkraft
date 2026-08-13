import { randomUUID } from "node:crypto";

/**
 * Thin client for the Vipps MobilePay ePayment API (WEB_REDIRECT flow).
 * Unlike Stripe's SDK, Vipps requires fetching and caching our own OAuth
 * access token, so — unlike Stripe, which is instantiated inline per-route
 * — this needs a shared module.
 */

export type VippsPaymentState = "CREATED" | "AUTHORIZED" | "TERMINATED" | "EXPIRED" | "ABORTED";

export type VippsPaymentDetails = {
	reference: string;
	pspReference: string;
	state: VippsPaymentState;
	amount: { value: number; currency: string };
	aggregate: {
		authorizedAmount: { value: number; currency: string };
		cancelledAmount: { value: number; currency: string };
		capturedAmount: { value: number; currency: string };
		refundedAmount: { value: number; currency: string };
	};
};

function vippsBaseUrl(): string {
	return process.env.VIPPS_ENV === "prod" ? "https://api.vipps.no" : "https://apitest.vipps.no";
}

function assertVippsConfigured(): void {
	const missing = ["VIPPS_CLIENT_ID", "VIPPS_CLIENT_SECRET", "VIPPS_SUBSCRIPTION_KEY", "VIPPS_MERCHANT_SERIAL_NUMBER"].filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(`Vipps is not configured yet. Missing env var${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
	}
}

// Module-level cache — fine for a single Node.js server process, same
// lifetime assumption as lib/prisma.ts's singleton pattern.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
	assertVippsConfigured();

	// Refresh a bit before actual expiry to avoid racing a request against expiry.
	if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
		return cachedToken.token;
	}

	const response = await fetch(`${vippsBaseUrl()}/accesstoken/get`, {
		method: "POST",
		headers: {
			client_id: process.env.VIPPS_CLIENT_ID!,
			client_secret: process.env.VIPPS_CLIENT_SECRET!,
			"Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
			"Merchant-Serial-Number": process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
		},
	});

	if (!response.ok) {
		throw new Error(`Vipps access token request failed with status ${response.status}.`);
	}

	const data = (await response.json()) as { access_token: string; expires_in: string | number };
	const expiresInMs = Number(data.expires_in) * 1000;

	cachedToken = { token: data.access_token, expiresAt: Date.now() + expiresInMs };
	return cachedToken.token;
}

async function vippsHeaders(idempotencyKey?: string): Promise<Record<string, string>> {
	const token = await getAccessToken();
	return {
		Authorization: `Bearer ${token}`,
		"Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
		"Merchant-Serial-Number": process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
		"Content-Type": "application/json",
		...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
	};
}

export type CreateVippsPaymentParams = {
	/** Unique payment identifier per sales unit — used as the future Order.orderNumber. */
	reference: string;
	/** Amount in minor units (øre). */
	amountValueOre: number;
	/** Where Vipps redirects the buyer back to after they approve/cancel. */
	returnUrl: string;
	paymentDescription?: string;
	/** Small debugging aid visible in the Vipps merchant portal — NOT the source of truth for order data (see PendingCheckout). */
	metadata?: Record<string, string>;
};

export type CreateVippsPaymentResult = {
	redirectUrl: string;
	reference: string;
	pspReference?: string;
};

export async function createVippsPayment(params: CreateVippsPaymentParams): Promise<CreateVippsPaymentResult> {
	assertVippsConfigured();

	const response = await fetch(`${vippsBaseUrl()}/epayment/v1/payments`, {
		method: "POST",
		headers: await vippsHeaders(randomUUID()),
		body: JSON.stringify({
			amount: { value: params.amountValueOre, currency: "NOK" },
			// TODO(verify): confirm the exact field/scope for requesting payer
			// profile (name/email/phone) back via the webhook's `userDetails`
			// once real Vipps API reference access is available. Until then,
			// fulfillOrder() falls back to our own collected checkout-form data.
			paymentMethod: { type: "WALLET" },
			reference: params.reference,
			userFlow: "WEB_REDIRECT",
			returnUrl: params.returnUrl,
			paymentDescription: params.paymentDescription,
			metadata: params.metadata,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text().catch(() => "");
		throw new Error(`Vipps payment creation failed with status ${response.status}. ${errorBody}`.trim());
	}

	const data = (await response.json()) as { redirectUrl: string; reference: string; pspReference?: string };
	return data;
}

/**
 * Captures a previously AUTHORIZED ("reserved") payment — for WALLET-type
 * ePayment payments, money is only actually collected once this is called;
 * authorization alone just sets funds aside. Called immediately after
 * authorization (matching Stripe's instant-charge behavior) rather than
 * deferred to shipment.
 */
export async function capturePayment(reference: string, amountValueOre: number): Promise<void> {
	assertVippsConfigured();

	const response = await fetch(`${vippsBaseUrl()}/epayment/v1/payments/${encodeURIComponent(reference)}/capture`, {
		method: "POST",
		headers: await vippsHeaders(randomUUID()),
		body: JSON.stringify({
			modificationAmount: { value: amountValueOre, currency: "NOK" },
		}),
	});

	if (response.ok) {
		return;
	}

	// A capture retry (e.g. webhook redelivery) on an already-captured payment
	// is expected, not an error — Vipps returns a conflict response for it.
	if (response.status === 409) {
		return;
	}

	const errorBody = await response.text().catch(() => "");
	throw new Error(`Vipps payment capture failed with status ${response.status}. ${errorBody}`.trim());
}

export async function getVippsPayment(reference: string): Promise<VippsPaymentDetails> {
	assertVippsConfigured();

	const response = await fetch(`${vippsBaseUrl()}/epayment/v1/payments/${encodeURIComponent(reference)}`, {
		method: "GET",
		headers: await vippsHeaders(),
	});

	if (!response.ok) {
		throw new Error(`Vipps payment lookup failed with status ${response.status}.`);
	}

	return (await response.json()) as VippsPaymentDetails;
}
