import type { CurrencyCode } from "@/lib/documents/types";

// Countries whose primary currency isn't the EUR default below.
const COUNTRY_CURRENCY_OVERRIDES: Record<string, CurrencyCode> = {
	NO: "NOK",
	SE: "SEK",
	DK: "DKK",
	GB: "GBP",
	US: "USD",
};

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
