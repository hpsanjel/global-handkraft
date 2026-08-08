"use client";

import { useEffect } from "react";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/currency-preference";
import { detectCurrencyFromLocale } from "@/lib/locale-currency";

/**
 * Seeds the visitor's currency preference from their browser language on
 * first visit only — never overwrites a preference the visitor (or a
 * previous visit) already set via the currency switcher. Runs client-side so
 * pages stay statically rendered instead of depending on request headers.
 */
export function CurrencyInit() {
	useEffect(() => {
		if (!getPreferredCurrency()) {
			setPreferredCurrency(detectCurrencyFromLocale(navigator.language));
		}
	}, []);

	return null;
}
