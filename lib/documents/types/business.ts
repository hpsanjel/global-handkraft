export type CurrencyCode = "NOK" | "EUR" | "USD" | "SEK" | "DKK" | "GBP";

export interface Currency {
	code: CurrencyCode;
	symbol: string;
	decimalDigits: number;
}

export interface BusinessAddress {
	line1: string;
	line2?: string;
	city: string;
	postalCode: string;
	country: string;
	/** ISO 3166-1 alpha-2, required for customs and carrier integrations. */
	countryCode: string;
}

export interface BankDetails {
	accountNumber?: string;
	iban?: string;
	bic?: string;
}

export interface Seller {
	legalName: string;
	tradingName: string;
	organisationNumber: string;
	vatNumber?: string;
	address: BusinessAddress;
	email: string;
	supportEmail: string;
	supportPhone: string;
	website: string;
	logoUrl?: string;
}

export interface Business {
	seller: Seller;
	bankDetails?: BankDetails;
	/** Default declared country of origin for customs documents; individual order items may override it. */
	defaultCountryOfOrigin: string;
	defaultCurrency: Currency;
	/** Default Incoterms rule (e.g. "DAP") shown on commercial/customs invoices when set. */
	defaultIncoterm?: string;
}
