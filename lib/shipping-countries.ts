export const SHIPPING_COUNTRIES: { code: string; name: string }[] = [
	{ code: "NO", name: "Norway" },
	{ code: "SE", name: "Sweden" },
	{ code: "DK", name: "Denmark" },
	{ code: "FI", name: "Finland" },
	{ code: "DE", name: "Germany" },
	{ code: "NL", name: "Netherlands" },
	{ code: "BE", name: "Belgium" },
	{ code: "FR", name: "France" },
	{ code: "ES", name: "Spain" },
	{ code: "IT", name: "Italy" },
	{ code: "AT", name: "Austria" },
	{ code: "CH", name: "Switzerland" },
	{ code: "GB", name: "United Kingdom" },
];

export const SHIPPING_COUNTRY_CODES = SHIPPING_COUNTRIES.map((country) => country.code);

/** Sentinel "country" code used to store the fallback rate applied to any country without its own zone. */
export const DEFAULT_SHIPPING_ZONE_CODE = "DEFAULT";
