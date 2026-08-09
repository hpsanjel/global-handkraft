export type PriceZone = {
	id: string;
	name: string;
	code: string;
	markupNok: number;
	priority: number;
};

export type PriceZoneWithCountries = PriceZone & {
	countries: string[];
};

const FALLBACK_ZONE_CODE = "ZONE_0";

export function resolveZone(zones: PriceZoneWithCountries[], countryCode: string | null | undefined): PriceZone | null {
	if (!countryCode) return null;

	const normalized = countryCode.trim().toUpperCase();
	if (!normalized) return null;

	for (const zone of zones) {
		if (zone.code === FALLBACK_ZONE_CODE && zone.countries.length === 0) {
			continue;
		}
		if (zone.countries.includes(normalized)) {
			return zone;
		}
	}

	return zones.find((z) => z.code === FALLBACK_ZONE_CODE) ?? null;
}

export function resolveZoneMarkup(zones: PriceZoneWithCountries[], countryCode: string | null | undefined): number {
	return resolveZone(zones, countryCode)?.markupNok ?? 0;
}

export function resolveDisplayPrice(zones: PriceZoneWithCountries[], basePrice: number, countryCode: string | null | undefined): number {
	return basePrice + resolveZoneMarkup(zones, countryCode);
}
