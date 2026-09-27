import { isCurrencyCode } from "@/lib/documents/utils/currency";
import type { CurrencyCode } from "@/lib/documents/types";

export const CURRENCY_STORAGE_KEY = "global-handcraft-currency";
export const CURRENCY_MANUAL_KEY = "global-handcraft-currency-manual";
export const CURRENCY_NOTIFIED_KEY = "global-handcraft-currency-notified";

export function isCurrencyManuallySet(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		return window.localStorage.getItem(CURRENCY_MANUAL_KEY) === "true";
	} catch {
		return false;
	}
}

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

export function setPreferredCurrency(code: CurrencyCode, options?: { manual?: boolean }) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
		document.cookie = `${CURRENCY_STORAGE_KEY}=${code};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`;

		if (options?.manual) {
			window.localStorage.setItem(CURRENCY_MANUAL_KEY, "true");
		}
	} catch {
		// Ignore storage errors
	}

	window.dispatchEvent(new Event("currency:changed"));
}
