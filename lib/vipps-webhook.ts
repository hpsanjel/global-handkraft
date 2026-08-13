import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies an incoming Vipps MobilePay webhook request using the HMAC
 * scheme documented for the Webhooks API. Unlike Stripe (which provides
 * `stripe.webhooks.constructEvent` in its SDK), Vipps has no official Node
 * helper for this, so it's implemented by hand here.
 *
 * Steps: (1) the request body's SHA256/base64 hash must match the
 * `x-ms-content-sha256` header; (2) HMAC-SHA256 over
 * "<method>\n<pathAndQuery>\n<x-ms-date>;<host>;<x-ms-content-sha256>" using
 * the webhook's registration-time secret must match the `Signature=` value
 * embedded in the `Authorization` header.
 */
export function verifyVippsWebhookSignature(params: {
	method: string;
	pathAndQuery: string;
	headers: { host: string; "x-ms-date": string; "x-ms-content-sha256": string; authorization: string };
	rawBody: string;
	secret: string;
}): boolean {
	if (!params.headers.host || !params.headers["x-ms-date"] || !params.headers["x-ms-content-sha256"] || !params.headers.authorization || !params.secret) {
		return false;
	}

	const computedBodyHash = createHash("sha256").update(params.rawBody).digest("base64");
	if (!timingSafeEqualStrings(computedBodyHash, params.headers["x-ms-content-sha256"])) {
		return false;
	}

	const stringToSign = [params.method, params.pathAndQuery, `${params.headers["x-ms-date"]};${params.headers.host};${params.headers["x-ms-content-sha256"]}`].join("\n");

	const computedSignature = createHmac("sha256", params.secret).update(stringToSign).digest("base64");

	const match = /Signature=([^&]+)$/.exec(params.headers.authorization);
	const providedSignature = match?.[1];
	if (!providedSignature) {
		return false;
	}

	return timingSafeEqualStrings(computedSignature, providedSignature);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
	const bufferA = Buffer.from(a);
	const bufferB = Buffer.from(b);
	if (bufferA.length !== bufferB.length) {
		return false;
	}
	return timingSafeEqual(bufferA, bufferB);
}
