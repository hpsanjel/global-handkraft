"use client";

import { formatMoney } from "@/lib/documents/utils/currency";
import { useCurrencyPreference } from "@/hooks/use-currency-preference";
import { useExchangeRates } from "@/hooks/use-exchange-rates";

/** Shows a live estimated price in the visitor's preferred currency next to a NOK amount. */
export function PriceEstimate({ amountNok, className }: { amountNok: number; className?: string }) {
	const currency = useCurrencyPreference();
	const rates = useExchangeRates();

	if (currency === "NOK" || !rates) {
		return null;
	}

	const converted = amountNok * rates.rates[currency];

	return (
		<span className={className ?? "text-stone-500"} title={`Estimated price — you'll be charged ${amountNok} NOK.`}>
			≈ {formatMoney(converted, currency)}
		</span>
	);
}
