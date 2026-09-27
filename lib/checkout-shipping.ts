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
export async function getShippingQuotes(shippingAddress: SavedShippingAddress | undefined, pricedItems?: PricedCheckoutItem[], subtotal = 0, selectedShippingId?: string | null): Promise<ShippingQuote[]> {
	void pricedItems;
	void selectedShippingId;

	let shippingRateAmountCents = 0;
	try {
		shippingRateAmountCents = (await getShippingRate(shippingAddress?.country, subtotal)).amountCents;
	} catch {
		shippingRateAmountCents = 0;
	}

	return [
		{
			id: "STATIC_FALLBACK",
			displayName: shippingRateAmountCents === 0 ? "Free shipping" : "Standard shipping",
			amountCents: shippingRateAmountCents,
			deliveryType: "HOME",
			deliveryEstimateDays: { min: 3, max: 10 },
		},
	];
}
