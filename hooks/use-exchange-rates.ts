"use client";

import { useEffect, useState } from "react";
import type { ExchangeRates } from "@/lib/exchange-rates";

// Module-level cache shared across every PriceEstimate instance on a page
// (e.g. a shop grid with dozens of prices), so they share a single fetch to
// /api/exchange-rates instead of one each.
let cachedRates: ExchangeRates | null = null;
let inFlightRequest: Promise<ExchangeRates> | null = null;
let fetchedAtMs = 0;
const CLIENT_CACHE_TTL_MS = 60 * 60 * 1000;

async function loadExchangeRates(): Promise<ExchangeRates> {
	if (cachedRates && Date.now() - fetchedAtMs < CLIENT_CACHE_TTL_MS) {
		return cachedRates;
	}

	if (!inFlightRequest) {
		inFlightRequest = fetch("/api/exchange-rates")
			.then((response) => response.json() as Promise<ExchangeRates>)
			.then((rates) => {
				cachedRates = rates;
				fetchedAtMs = Date.now();
				return rates;
			})
			.finally(() => {
				inFlightRequest = null;
			});
	}

	return inFlightRequest;
}

/** Returns live NOK-based exchange rates, or null until the first fetch resolves. */
export function useExchangeRates(): ExchangeRates | null {
	const [rates, setRates] = useState<ExchangeRates | null>(cachedRates);

	useEffect(() => {
		let cancelled = false;
		loadExchangeRates()
			.then((result) => {
				if (!cancelled) {
					setRates(result);
				}
			})
			.catch(() => {
				// Leave rates as null; callers should render nothing without rates.
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return rates;
}
