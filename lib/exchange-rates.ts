import type { CurrencyCode } from "@/lib/documents/types";

/**
 * Live NOK-based exchange rates, sourced from Frankfurter (ECB reference
 * rates, no API key required). Used to show buyers an estimated price in
 * their own currency; the actual charge always stays in NOK.
 */

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest?base=NOK&symbols=EUR,USD,SEK,DKK,GBP";

export type ExchangeRates = {
	base: "NOK";
	rates: Record<CurrencyCode, number>;
	fetchedAt: string;
};

const DEFAULT_RATES: ExchangeRates = {
	base: "NOK",
	rates: { NOK: 1, EUR: 0.085, USD: 0.09, SEK: 0.95, DKK: 0.63, GBP: 0.073 },
	fetchedAt: new Date(0).toISOString(),
};

// Last successful fetch, used as a fallback when the rate provider is down
// so a provider outage never blocks price rendering or checkout.
let lastKnownRates: ExchangeRates = DEFAULT_RATES;

export async function getExchangeRates(): Promise<ExchangeRates> {
	try {
		const response = await fetch(FRANKFURTER_URL, {
			headers: { Accept: "application/json" },
			next: { revalidate: 3600 },
		});

		if (!response.ok) {
			throw new Error(`Frankfurter request failed with status ${response.status}`);
		}

		const data = (await response.json()) as { base: string; date: string; rates: Record<string, number> };

		lastKnownRates = {
			base: "NOK",
			rates: { NOK: 1, ...data.rates } as Record<CurrencyCode, number>,
			fetchedAt: new Date().toISOString(),
		};
		return lastKnownRates;
	} catch {
		return lastKnownRates;
	}
}
