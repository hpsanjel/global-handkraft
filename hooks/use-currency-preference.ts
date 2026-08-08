"use client";

import { useEffect, useState } from "react";
import { getPreferredCurrency } from "@/lib/currency-preference";
import type { CurrencyCode } from "@/lib/documents/types";

/** Tracks the visitor's preferred display currency, re-syncing on change. */
export function useCurrencyPreference(): CurrencyCode {
	const [currency, setCurrency] = useState<CurrencyCode>("NOK");

	useEffect(() => {
		const sync = () => setCurrency(getPreferredCurrency() ?? "NOK");
		sync();

		window.addEventListener("storage", sync);
		window.addEventListener("currency:changed", sync);
		return () => {
			window.removeEventListener("storage", sync);
			window.removeEventListener("currency:changed", sync);
		};
	}, []);

	return currency;
}
