"use client";

import { useEffect, useState } from "react";
import { COUNTRY_TO_ZONE } from "@/lib/shipping-countries";

const DETECTED_COUNTRY_COOKIE = "detected_country";

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
	return cookie ? cookie.split("=")[1] : null;
}

export function useDetectedCountry() {
	const [country, setCountry] = useState<string | null>(null);
	const [isDetecting, setIsDetecting] = useState(true);

	useEffect(() => {
		const detectedCountry = getCookieValue(DETECTED_COUNTRY_COOKIE) || localStorage.getItem("detected_country");
		if (detectedCountry && COUNTRY_TO_ZONE[detectedCountry]) {
			setCountry(detectedCountry);
			setIsDetecting(false);
			return;
		}

		const handleDetected = (event: Event) => {
			const custom = event as CustomEvent<{ country: string }>;
			const detected = custom.detail?.country;
			if (detected && COUNTRY_TO_ZONE[detected]) {
				setCountry(detected);
				setIsDetecting(false);
			}
		};

		window.addEventListener("country:detected", handleDetected as EventListener);
		return () => window.removeEventListener("country:detected", handleDetected as EventListener);
	}, []);

	return { country, isDetecting };
}
