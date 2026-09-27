"use client";

import { useEffect, useState } from "react";
import { Globe, X } from "lucide-react";
import { CURRENCY_NOTIFIED_KEY, isCurrencyManuallySet } from "@/lib/currency-preference";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { getCountryName } from "@/lib/locale-currency";

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
	return cookie ? cookie.split("=")[1] : null;
}

export function CurrencyBanner() {
	const currency = useCurrencyPreference();
	const [visible, setVisible] = useState(false);
	const [countryName, setCountryName] = useState<string>("");

	useEffect(() => {
		// Do not show if user already dismissed it or manually selected a currency
		if (isCurrencyManuallySet()) {
			return;
		}

		try {
			if (window.localStorage.getItem(CURRENCY_NOTIFIED_KEY) === "true") {
				return;
			}
		} catch {
			return;
		}

		const checkAndShow = (countryCode: string | null) => {
			if (!countryCode) return;
			const upperCode = countryCode.toUpperCase();
			// Only show notification for visitors outside Norway where currency was auto-adjusted
			if (upperCode === "NO" || currency === "NOK") {
				return;
			}

			const name = getCountryName(upperCode) || upperCode;
			setCountryName(name);
			setVisible(true);
		};

		// Check current detected country
		const currentCountry = getCookieValue("detected_country") || (typeof window !== "undefined" ? window.localStorage.getItem("detected_country") : null);
		if (currentCountry) {
			checkAndShow(currentCountry);
		}

		// Listen to country detection events
		const handleCountryDetected = (event: Event) => {
			const custom = event as CustomEvent<{ country: string }>;
			if (custom.detail?.country) {
				checkAndShow(custom.detail.country);
			}
		};

		// If user changes currency manually in switcher, hide banner immediately
		const handleCurrencyChanged = () => {
			if (isCurrencyManuallySet()) {
				setVisible(false);
			}
		};

		window.addEventListener("country:detected", handleCountryDetected as EventListener);
		window.addEventListener("currency:changed", handleCurrencyChanged);

		return () => {
			window.removeEventListener("country:detected", handleCountryDetected as EventListener);
			window.removeEventListener("currency:changed", handleCurrencyChanged);
		};
	}, [currency]);

	const dismiss = () => {
		try {
			window.localStorage.setItem(CURRENCY_NOTIFIED_KEY, "true");
		} catch {}
		setVisible(false);
	};

	if (!visible || !countryName) {
		return null;
	}

	return (
		<aside role="region" aria-label="Currency notification" className="fixed top-18 right-3 z-40 max-w-sm rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 sm:right-6 sm:top-24 sm:max-w-md">
			<div className="flex items-start gap-3">
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B365D]/10 text-[#1B365D]">
					<Globe className="h-5 w-5" />
				</div>
				<div className="flex-1 min-w-0 pr-1">
					<p className="text-sm font-semibold text-stone-900">Visiting from {countryName}?</p>
					<p className="mt-0.5 text-xs text-stone-700 leading-relaxed">
						We&apos;ve automatically set your display currency to <strong className="font-semibold text-stone-900">{currency}</strong>. You can change this anytime from the menu.
					</p>
					<div className="mt-3 flex items-center gap-2">
						<button type="button" onClick={dismiss} className="rounded-full bg-[#1B365D] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#152d4c]">
							Got it
						</button>
						<button type="button" onClick={dismiss} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50">
							Keep {currency}
						</button>
					</div>
				</div>
				<button type="button" onClick={dismiss} className="rounded-full p-1 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition" aria-label="Dismiss currency suggestion">
					<X className="h-4 w-4" />
				</button>
			</div>
		</aside>
	);
}
