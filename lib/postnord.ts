import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

/**
 * PostNord API integration.
 *
 * All functions gracefully degrade when POSTNORD_API_KEY is not configured,
 * so the rest of the store keeps working during development.
 *
 * Registration: https://developer.postnord.com (free plan, limited daily calls)
 * Production host: https://api2.postnord.com
 * Sandbox host: https://atapi2.postnord.com
 */

const POSTNORD_HOST = process.env.POSTNORD_HOST ?? "https://api2.postnord.com";
const POSTNORD_API_KEY = process.env.POSTNORD_API_KEY;

export type TransitTimeResult = {
	/** Real delivery estimate in business days, or null if unavailable. */
	minimumDays: number | null;
	maximumDays: number | null;
	/** True when the estimate came from PostNord; false when using the static fallback. */
	isLive: boolean;
};

export type PostalCodeValidationResult = {
	valid: boolean;
	city?: string;
	message?: string;
};

export type ServicePoint = {
	id: string;
	name: string;
	address: string;
	postalCode: string;
	city: string;
	countryCode: string;
	distanceMeters?: number;
	openingHours?: Record<string, string>;
};

export type ServicePointResult = {
	servicePoints: ServicePoint[];
	isLive: boolean;
};

type PostNordServiceGroup = "SE" | "NO" | "DK" | "FI";

function serviceGroupForCountry(countryCode: string): PostNordServiceGroup | null {
	switch (countryCode) {
		case "SE":
			return "SE";
		case "NO":
			return "NO";
		case "DK":
			return "DK";
		case "FI":
			return "FI";
		default:
			return null;
	}
}

/**
 * Builds a public tracking URL for a PostNord shipment.
 * No API key required — this is hosted by PostNord and is free to link to.
 */
export function buildTrackingUrl(trackingNumber: string, countryCode = "NO"): string {
	const normalized = trackingNumber.trim();
	if (!normalized) {
		return "";
	}

	// PostNord public tracking pages live under the per-country domain.
	switch (countryCode.toUpperCase()) {
		case "SE":
			return `https://tracking.postnord.se/${encodeURIComponent(normalized)}`;
		case "DK":
			return `https://tracking.postnord.dk/${encodeURIComponent(normalized)}`;
		case "FI":
			return `https://www.posti.fi/lähetystenseuranta/${encodeURIComponent(normalized)}`;
		default:
			return `https://tracking.postnord.no/${encodeURIComponent(normalized)}`;
	}
}

/**
 * Queries PostNord's Transit Time API for a real delivery estimate.
 * Falls back to a static 3–10 business day estimate when the API is unavailable.
 */
export async function getTransitTime(params: { originPostalCode: string; destinationPostalCode: string; destinationCountryCode: string; serviceGroup?: PostNordServiceGroup; serviceCodes?: string[]; startTime?: string }): Promise<TransitTimeResult> {
	const fallback: TransitTimeResult = { minimumDays: 3, maximumDays: 10, isLive: false };

	if (!POSTNORD_API_KEY) {
		return fallback;
	}

	const group = params.serviceGroup ?? serviceGroupForCountry(params.destinationCountryCode);
	if (!group) {
		return fallback;
	}

	const startTime = params.startTime ?? new Date().toISOString().slice(0, 16);
	const serviceCodes = params.serviceCodes?.length ? params.serviceCodes.join(",") : undefined;

	const url = new URL(`${POSTNORD_HOST}/rest/transittime/v5/addresstoaddress`);
	url.searchParams.set("apikey", POSTNORD_API_KEY);
	url.searchParams.set("startTime", startTime);
	url.searchParams.set("serviceGroup", group);
	url.searchParams.set("destinationPostCode", params.destinationPostalCode);
	url.searchParams.set("destinationCountryCode", params.destinationCountryCode);
	url.searchParams.set("originPostCode", params.originPostalCode);
	url.searchParams.set("originCountryCode", "NO");
	if (serviceCodes) {
		url.searchParams.set("serviceCodes", serviceCodes);
	}

	try {
		const response = await fetch(url.toString(), {
			headers: { Accept: "application/json" },
			next: { revalidate: 3600 },
		});

		if (!response.ok) {
			return fallback;
		}

		const payload = (await response.json()) as {
			transitTimeResponse?: {
				transitTimes?: Array<{
					serviceCode?: string;
					dateVariants?: Array<{
						"no. of days"?: number;
						date?: string;
					}>;
				}>;
			};
		};

		const transitTimes = payload?.transitTimeResponse?.transitTimes;
		if (!transitTimes?.length) {
			return fallback;
		}

		const dayCounts = transitTimes
			.flatMap((service) => service.dateVariants ?? [])
			.map((variant) => variant["no. of days"] ?? 0)
			.filter((days) => days > 0);

		if (!dayCounts.length) {
			return fallback;
		}

		return {
			minimumDays: Math.min(...dayCounts),
			maximumDays: Math.max(...dayCounts),
			isLive: true,
		};
	} catch {
		return fallback;
	}
}
