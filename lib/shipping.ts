import { prisma } from "@/lib/prisma";
import { DEFAULT_SHIPPING_ZONE_CODE, SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

/** Store policy: 76 NOK for Norway, 200 NOK international, free on orders over 1500 NOK. */
const FALLBACK_FREE_SHIPPING_FROM = 1500;

function getFallbackShippingCost(countryCode?: string | null): number {
	const normalized = countryCode?.trim().toUpperCase();
	return !normalized || normalized === "NO" ? 76 : 200;
}

export type ShippingRate = {
	/** Shipping cost in the smallest currency unit (cents), after applying any free-shipping threshold. */
	amountCents: number;
	/** Whether the fallback/default rate was used instead of a country-specific one. */
	isDefault: boolean;
};

function normalizeCountryCode(countryCode?: string | null): string | null {
	const normalized = countryCode?.trim().toUpperCase();
	if (!normalized || !SHIPPING_COUNTRY_CODES.includes(normalized)) {
		return null;
	}
	return normalized;
}

/**
 * Resolves the shipping cost for a given country and cart subtotal.
 * Looks up a country-specific rate first, falling back to the admin-configured
 * default rate, and finally to a hardcoded fallback if nothing is configured.
 */
export async function getShippingRate(countryCode: string | null | undefined, subtotal: number): Promise<ShippingRate> {
	const fallbackCost = getFallbackShippingCost(countryCode);

	if (!process.env.DATABASE_URL) {
		const qualifies = subtotal >= FALLBACK_FREE_SHIPPING_FROM;
		return { amountCents: qualifies ? 0 : Math.round(fallbackCost * 100), isDefault: true };
	}

	const normalizedCountry = normalizeCountryCode(countryCode);

	const [countryZone, defaultZone] = await Promise.all([normalizedCountry ? prisma.shippingZone.findUnique({ where: { country: normalizedCountry } }) : Promise.resolve(null), prisma.shippingZone.findUnique({ where: { country: DEFAULT_SHIPPING_ZONE_CODE } })]);

	const resolvedZone = countryZone ?? defaultZone;
	const cost = resolvedZone?.shippingCost ?? fallbackCost;
	const freeShippingFrom = resolvedZone?.freeShippingFrom ?? FALLBACK_FREE_SHIPPING_FROM;
	const qualifiesForFreeShipping = freeShippingFrom > 0 && subtotal >= freeShippingFrom;

	return {
		amountCents: qualifiesForFreeShipping ? 0 : Math.round(cost * 100),
		isDefault: !countryZone,
	};
}
