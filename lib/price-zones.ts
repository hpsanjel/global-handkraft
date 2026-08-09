import { prisma } from "@/lib/prisma";
import { resolveZone, resolveZoneMarkup, resolveDisplayPrice, type PriceZone, type PriceZoneWithCountries } from "@/lib/price-zones-shared";

export type { PriceZone, PriceZoneWithCountries };

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
	const zones = await loadZones();
	return resolveZone(zones, countryCode);
}

export async function getDisplayPrice(basePrice: number, countryCode: string | null | undefined): Promise<number> {
	const zones = await loadZones();
	return resolveDisplayPrice(zones, basePrice, countryCode);
}

export async function getZoneMarkup(countryCode: string | null | undefined): Promise<number> {
	const zones = await loadZones();
	return resolveZoneMarkup(zones, countryCode);
}

export function invalidatePriceZoneCache(): void {
	cachedZones = null;
	cacheTimestamp = 0;
}
