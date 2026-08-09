import { prisma } from "@/lib/prisma";

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

let cachedZones: PriceZoneWithCountries[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function loadZones(): Promise<PriceZoneWithCountries[]> {
	const now = Date.now();
	if (cachedZones && now - cacheTimestamp < CACHE_TTL_MS) {
		return cachedZones;
	}

	const zones = await prisma.priceZone.findMany({
		include: {
			countries: true,
		},
		orderBy: {
			priority: "asc",
		},
	});

	const result: PriceZoneWithCountries[] = zones.map((zone) => ({
		id: zone.id,
		name: zone.name,
		code: zone.code,
		markupNok: zone.markupNok,
		priority: zone.priority,
		countries: zone.countries.map((c) => c.country),
	}));

	cachedZones = result;
	cacheTimestamp = now;
	return result;
}

export async function getPriceZones(): Promise<PriceZoneWithCountries[]> {
	return loadZones();
}

export async function getZoneForCountry(countryCode: string | null | undefined): Promise<PriceZone | null> {
	if (!countryCode) return null;

	const normalized = countryCode.trim().toUpperCase();
	if (!normalized) return null;

	const zones = await loadZones();

	for (const zone of zones) {
		if (zone.code === FALLBACK_ZONE_CODE && zone.countries.length === 0) {
			continue;
		}
		if (zone.countries.includes(normalized)) {
			return zone;
		}
	}

	const fallback = zones.find((z) => z.code === FALLBACK_ZONE_CODE);
	return fallback ?? null;
}

export async function getDisplayPrice(basePrice: number, countryCode: string | null | undefined): Promise<number> {
	const zone = await getZoneForCountry(countryCode);
	if (!zone) return basePrice;
	return basePrice + zone.markupNok;
}

export async function getZoneMarkup(countryCode: string | null | undefined): Promise<number> {
	const zone = await getZoneForCountry(countryCode);
	return zone?.markupNok ?? 0;
}

export function invalidatePriceZoneCache(): void {
	cachedZones = null;
	cacheTimestamp = 0;
}
