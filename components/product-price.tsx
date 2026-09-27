"use client";

import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { formatMoney } from "@/lib/documents/utils/currency";
import type { CurrencyCode } from "@/lib/documents/types";

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
 * React hook to get current currency, exchange rates, and a price formatting function.
 */
export function useFormattedPrice() {
	const currency = useCurrencyPreference();
	const rates = useExchangeRates();

	const formatPrice = (amountNok: number) => {
		return formatStorePrice(amountNok, currency, rates?.rates);
	};

	return {
		currency,
		rates: rates?.rates,
		formatPrice,
		isConverted: currency !== "NOK" && !!rates?.rates?.[currency],
	};
}

/**
 * Reusable component to render price directly in the user's selected currency.
 */
export function ProductPrice({ amountNok, prefix = "", suffix = "", className }: { amountNok: number; prefix?: string; suffix?: string; className?: string }) {
	const { formatPrice, currency, isConverted } = useFormattedPrice();
	const formatted = formatPrice(amountNok);

	return (
		<span className={className} title={isConverted ? `Approx. ${currency} based on NOK ${amountNok.toFixed(2)}` : undefined} suppressHydrationWarning>
			{prefix}
			{formatted}
			{suffix}
		</span>
	);
}
