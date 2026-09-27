"use client";

import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { formatMoney } from "@/lib/documents/utils/currency";
import type { CurrencyCode } from "@/lib/documents/types";

import { usePriceZones } from "@/components/price-zones-provider";

/**
 * Formats a given NOK amount into the target currency based on exchange rates.
 * Examples:
 *   - NOK 1500 -> "NOK 1,500" (or "NOK 1,500.50" if cents)
 *   - DKK -> "DKK 1,031.85"
 *   - EUR -> "€127.50"
 *   - USD -> "$136.50"
 *   - SEK -> "SEK 1,425.00"
 *   - GBP -> "£109.50"
 */
export function formatStorePrice(amountNok: number, currency: CurrencyCode, rates: Record<CurrencyCode, number> | null | undefined): string {
	if (currency === "NOK" || !rates || !rates[currency]) {
		const isWhole = amountNok % 1 === 0;
		return `NOK ${amountNok.toLocaleString("en-GB", {
			minimumFractionDigits: isWhole ? 0 : 2,
			maximumFractionDigits: 2,
		})}`;
	}

	const rate = rates[currency];
	const converted = amountNok * rate;

	if (currency === "DKK") {
		return `DKK ${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	if (currency === "SEK") {
		return `SEK ${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	if (currency === "EUR") {
		return `€${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	if (currency === "USD") {
		return `$${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	if (currency === "GBP") {
		return `£${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	return formatMoney(converted, currency);
}

/**
 * React hook to get current currency, exchange rates, zone markup, and a price formatting function.
 */
export function useFormattedPrice() {
	const currency = useCurrencyPreference();
	const rates = useExchangeRates();
	const { zoneMarkup } = usePriceZones();

	const formatPrice = (amountNok: number, options?: { includeMarkup?: boolean }) => {
		const finalNok = (options?.includeMarkup ?? true) ? amountNok + zoneMarkup : amountNok;
		return formatStorePrice(finalNok, currency, rates?.rates);
	};

	return {
		currency,
		rates: rates?.rates,
		zoneMarkup,
		formatPrice,
		isConverted: currency !== "NOK" && !!rates?.rates?.[currency],
	};
}

/**
 * Reusable component to render price directly in the user's selected currency,
 * including regional zone markup for detected international countries.
 */
export function ProductPrice({ amountNok, prefix = "", suffix = "", className, showApproxNok = false, includeMarkup = true, approxClassName = "block text-xs text-stone-700 font-normal mt-0.5" }: { amountNok: number; prefix?: string; suffix?: string; className?: string; showApproxNok?: boolean; includeMarkup?: boolean; approxClassName?: string }) {
	const { formatPrice, currency, isConverted, zoneMarkup } = useFormattedPrice();
	const formatted = formatPrice(amountNok, { includeMarkup });
	const effectiveNok = includeMarkup ? amountNok + zoneMarkup : amountNok;

	return (
		<span className={className} title={isConverted ? `Approx. ${currency} based on NOK ${effectiveNok.toFixed(2)}` : undefined} suppressHydrationWarning>
			{prefix}
			{formatted}
			{suffix}
			{showApproxNok && isConverted ? <span className={approxClassName}>≈ NOK {effectiveNok.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span> : null}
		</span>
	);
}
