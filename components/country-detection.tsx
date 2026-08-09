"use client";

import { useEffect } from "react";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

const DETECTED_COUNTRY_COOKIE = "detected_country";
const DETECTED_COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string, maxAge: number) {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function CountryDetection() {
	useEffect(() => {
		if (typeof window === "undefined") return;

		const existing = document.cookie.split("; ").find((row) => row.startsWith(`${DETECTED_COUNTRY_COOKIE}=`));
		if (existing) return;

		const localCountry = localStorage.getItem("detected_country");
		if (localCountry && SHIPPING_COUNTRY_CODES.includes(localCountry)) {
			setCookie(DETECTED_COUNTRY_COOKIE, localCountry, DETECTED_COUNTRY_COOKIE_MAX_AGE);
			return;
		}

		(async () => {
			try {
				const response = await fetch("https://ipapi.co/json/", {
					signal: AbortSignal.timeout(5000),
				});
				if (!response.ok) throw new Error("Geo API failed");
				const data = (await response.json()) as { country_code?: string };
				const country = data.country_code?.toUpperCase();
				if (country && SHIPPING_COUNTRY_CODES.includes(country)) {
					localStorage.setItem("detected_country", country);
					setCookie(DETECTED_COUNTRY_COOKIE, country, DETECTED_COUNTRY_COOKIE_MAX_AGE);
					window.dispatchEvent(new CustomEvent("country:detected", { detail: { country } }));
				}
			} catch {
				// Silently fail; user can manually select country in cart
			}
		})();
	}, []);

	return null;
}
