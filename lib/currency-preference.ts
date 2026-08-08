import { isCurrencyCode } from "@/lib/documents/utils/currency";
import type { CurrencyCode } from "@/lib/documents/types";

export const CURRENCY_STORAGE_KEY = "global-handcraft-currency";

export function getPreferredCurrency(): CurrencyCode | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const rawValue = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
		return rawValue && isCurrencyCode(rawValue) ? rawValue : null;
	} catch {
		return null;
	}
}

export function setPreferredCurrency(code: CurrencyCode) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
	window.dispatchEvent(new Event("currency:changed"));
}
