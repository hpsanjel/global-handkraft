"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { PriceZoneWithCountries } from "@/lib/price-zones-shared";
import { resolveZoneMarkup } from "@/lib/price-zones-shared";
import { useDetectedCountry } from "@/hooks/use-detected-country";

type PriceZonesContextType = {
	priceZones: PriceZoneWithCountries[];
	detectedCountry: string | null;
	zoneMarkup: number;
	getZoneMarkupForCountry: (countryCode?: string | null) => number;
};

const PriceZonesContext = createContext<PriceZonesContextType>({
	priceZones: [],
	detectedCountry: null,
	zoneMarkup: 0,
	getZoneMarkupForCountry: () => 0,
});

export function PriceZonesProvider({ children, priceZones = [], initialCountry = null }: { children: React.ReactNode; priceZones?: PriceZoneWithCountries[]; initialCountry?: string | null }) {
	const { country: detectedCountry } = useDetectedCountry(initialCountry);

	const zoneMarkup = useMemo(() => {
		return detectedCountry ? resolveZoneMarkup(priceZones, detectedCountry) : 0;
	}, [detectedCountry, priceZones]);

	const value = useMemo(
		() => ({
			priceZones,
			detectedCountry,
			zoneMarkup,
			getZoneMarkupForCountry: (countryCode?: string | null) => resolveZoneMarkup(priceZones, countryCode || detectedCountry),
		}),
		[priceZones, detectedCountry, zoneMarkup],
	);

	return <PriceZonesContext.Provider value={value}>{children}</PriceZonesContext.Provider>;
}

export function usePriceZones() {
	return useContext(PriceZonesContext);
}
