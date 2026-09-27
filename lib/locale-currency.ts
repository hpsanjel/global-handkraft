import type { CurrencyCode } from "@/lib/documents/types";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";

// Countries whose primary currency isn't the EUR default below.
const COUNTRY_CURRENCY_OVERRIDES: Record<string, CurrencyCode> = {
	NO: "NOK",
	SE: "SEK",
	DK: "DKK",
	GB: "GBP",
	US: "USD",
};

/**
 * Maps a two-letter ISO country code (e.g. "NO", "DK", "DE") to its storefront currency.
 */
export function detectCurrencyFromCountry(countryCode: string | null | undefined): CurrencyCode {
	if (!countryCode) return "EUR";
	const upper = countryCode.toUpperCase();
	if (upper in COUNTRY_CURRENCY_OVERRIDES) {
		return COUNTRY_CURRENCY_OVERRIDES[upper];
	}
	return "EUR";
}

/**
 * Guesses a buyer's currency from a BCP 47 locale tag (e.g. `navigator.language`,
 * "nb-NO" or "de-DE"). Only used to seed an initial display preference — the
 * buyer can always override it via the currency switcher. Defaults to EUR,
 * since most of the store's European audience outside Norway uses it.
 */
export function detectCurrencyFromLocale(locale: string | null | undefined): CurrencyCode {
	const countrySubtag = locale?.split("-")[1]?.toUpperCase();

	if (countrySubtag && countrySubtag in COUNTRY_CURRENCY_OVERRIDES) {
		return COUNTRY_CURRENCY_OVERRIDES[countrySubtag];
	}

	return "EUR";
}

/**
 * Returns human-readable country name for a given ISO code (e.g. "DK" -> "Denmark").
 */
export function getCountryName(countryCode: string): string {
	const found = SHIPPING_COUNTRIES.find((c) => c.code.toUpperCase() === countryCode.toUpperCase());
	return found ? found.name : countryCode;
}
