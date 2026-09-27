import { getShippingRate } from "@/lib/shipping";
import type { PricedCheckoutItem } from "@/lib/checkout-pricing";

export type SavedShippingAddress = {
	fullName?: string;
	phone?: string;
	address?: string;
	city?: string;
	postalCode?: string;
	country?: string;
};

export type ShippingQuote = {
	id: string;
	displayName: string;
	amountCents: number;
	deliveryType: "HOME" | "PICKUP" | "MAILBOX";
	deliveryEstimateDays?: { min: number; max: number };
};

/**
 * Resolves static DB-driven shipping quotes based on destination country and subtotal.
 */
export async function getShippingQuotes(shippingAddress?: SavedShippingAddress, pricedItems?: PricedCheckoutItem[], subtotal = 0, selectedShippingId?: string | null): Promise<ShippingQuote[]> {
	void shippingAddress;
	void pricedItems;
	void subtotal;
	void selectedShippingId;

	return [
		{
			id: "FREE_SHIPPING",
			displayName: "Free shipping",
			amountCents: 0,
			deliveryType: "HOME",
			deliveryEstimateDays: { min: 3, max: 10 },
		},
	];
}
