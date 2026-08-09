import { ZONE_COUNTRIES, COUNTRY_TO_ZONE } from "@/lib/shipping-countries";

export const ZONE_MARKUPS: Record<string, number> = {
	ZONE_0: 0,
	ZONE_1: 280,
	ZONE_2: 320,
	ZONE_3: 370,
	ZONE_4: 409,
};

export function getZoneForCountryClient(countryCode: string | null | undefined): string | null {
	if (!countryCode) return null;
	const normalized = countryCode.trim().toUpperCase();
	if (!normalized) return null;
	return COUNTRY_TO_ZONE[normalized] ?? null;
}

export function getDisplayPriceClient(basePrice: number, countryCode: string | null | undefined): number {
	const zone = getZoneForCountryClient(countryCode);
	if (!zone) return basePrice;
	return basePrice + (ZONE_MARKUPS[zone] ?? 0);
}

export function getZoneMarkupClient(countryCode: string | null | undefined): number {
	const zone = getZoneForCountryClient(countryCode);
	return zone ? (ZONE_MARKUPS[zone] ?? 0) : 0;
}
