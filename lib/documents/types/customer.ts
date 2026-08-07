export interface Address {
	fullName: string;
	companyName?: string;
	phone: string;
	email: string;
	line1: string;
	line2?: string;
	city: string;
	postalCode: string;
	country: string;
	/** ISO 3166-1 alpha-2, required for customs and carrier integrations. */
	countryCode: string;
	vatNumber?: string;
	notes?: string;
}

export interface Customer {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	billingAddress: Address;
	shippingAddress: Address;
}
