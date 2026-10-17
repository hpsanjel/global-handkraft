import { calculateShippingFee } from "@/lib/shipping-client";
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
 * Resolves shipping quotes based on cart subtotal:
 * - Free shipping for orders >= 1500 NOK
 * - 76 NOK standard shipping for orders < 1500 NOK
 */
export async function getShippingQuotes(
	shippingAddress?: SavedShippingAddress,
	pricedItems?: PricedCheckoutItem[],
	subtotal = 0,
	selectedShippingId?: string | null
): Promise<ShippingQuote[]> {
	void shippingAddress;
	void selectedShippingId;

	const itemCount = pricedItems?.reduce((sum, item) => sum + item.quantity, 0) ?? (subtotal > 0 ? 1 : 0);
	const shippingFeeNok = calculateShippingFee(subtotal, itemCount);

	if (shippingFeeNok === 0) {
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

	return [
		{
			id: "STANDARD_SHIPPING",
			displayName: "Standard shipping",
			amountCents: Math.round(shippingFeeNok * 100),
			deliveryType: "HOME",
			deliveryEstimateDays: { min: 3, max: 10 },
		},
	];
}
