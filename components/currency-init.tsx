"use client";

import { useEffect } from "react";
import { getPreferredCurrency, isCurrencyManuallySet, setPreferredCurrency } from "@/lib/currency-preference";
import { detectCurrencyFromCountry, detectCurrencyFromLocale } from "@/lib/locale-currency";

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
	return cookie ? cookie.split("=")[1] : null;
}

/**
 * Seeds the visitor's currency preference from detected country or browser locale
 * on first visit. Never overwrites a preference the visitor set manually via
 * the currency switcher.
 */
export function CurrencyInit() {
	useEffect(() => {
		if (isCurrencyManuallySet()) {
			return;
		}

		const detectedCountry = getCookieValue("detected_country") || (typeof window !== "undefined" ? window.localStorage.getItem("detected_country") : null);

		if (detectedCountry) {
			setPreferredCurrency(detectCurrencyFromCountry(detectedCountry), { manual: false });
		} else if (!getPreferredCurrency()) {
			setPreferredCurrency(detectCurrencyFromLocale(navigator.language), { manual: false });
		}

		const handleCountryDetected = (event: Event) => {
			if (isCurrencyManuallySet()) return;
			const custom = event as CustomEvent<{ country: string }>;
			if (custom.detail?.country) {
				setPreferredCurrency(detectCurrencyFromCountry(custom.detail.country), { manual: false });
			}
		};

		window.addEventListener("country:detected", handleCountryDetected as EventListener);
		return () => {
			window.removeEventListener("country:detected", handleCountryDetected as EventListener);
		};
	}, []);

	return null;
}
