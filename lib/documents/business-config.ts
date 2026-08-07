import type { Business } from "./types";

export const BUSINESS: Business = {
	seller: {
		legalName: "Global Handcrafts AS",
		tradingName: "Global Handcrafts",
		organisationNumber: "936 984 282",
		vatNumber: "NO936984282MVA",
		address: {
			line1: "Belsetveien 80",
			city: "Rykkinn",
			postalCode: "1348",
			country: "Norway",
			countryCode: "NO",
		},
		email: "contact@handcraftsglobal.com",
		supportEmail: "hello@handcraftsglobal.com",
		supportPhone: "+47 912 67 612",
		website: "handcraftsglobal.com",
	},
	defaultCountryOfOrigin: "IN",
	defaultCurrency: { code: "NOK", symbol: "kr", decimalDigits: 2 },
};
