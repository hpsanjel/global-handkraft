import type { Currency, CurrencyCode } from "../types";

export const CURRENCIES: Record<CurrencyCode, Currency> = {
	NOK: { code: "NOK", symbol: "kr", decimalDigits: 2 },
	EUR: { code: "EUR", symbol: "€", decimalDigits: 2 },
	USD: { code: "USD", symbol: "$", decimalDigits: 2 },
	SEK: { code: "SEK", symbol: "kr", decimalDigits: 2 },
	DKK: { code: "DKK", symbol: "kr", decimalDigits: 2 },
	GBP: { code: "GBP", symbol: "£", decimalDigits: 2 },
};

export function isCurrencyCode(value: string): value is CurrencyCode {
	return value in CURRENCIES;
}

export function formatMoney(amount: number, currencyCode: CurrencyCode): string {
	const currency = CURRENCIES[currencyCode];
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency.code,
		minimumFractionDigits: currency.decimalDigits,
		maximumFractionDigits: currency.decimalDigits,
	}).format(amount);
}
