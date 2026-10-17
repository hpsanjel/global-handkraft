import { calculateShippingFee } from "@/lib/shipping-client";
import { getShippingConfig } from "@/lib/shipping-config";
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
 * Resolves shipping quotes based on destination country, cart subtotal,
 * per-product custom shipping rates, and store-wide default shipping configuration.
 */
export async function getShippingQuotes(
	shippingAddress?: SavedShippingAddress,
	pricedItems?: PricedCheckoutItem[],
	subtotal = 0,
	selectedShippingId?: string | null
): Promise<ShippingQuote[]> {
	void selectedShippingId;

	const config = await getShippingConfig();
	const itemCount = pricedItems?.reduce((sum, item) => sum + item.quantity, 0) ?? (subtotal > 0 ? 1 : 0);
	const shippingFeeNok = calculateShippingFee(subtotal, itemCount, shippingAddress?.country, pricedItems, config);

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

	const isNorway = !shippingAddress?.country || shippingAddress.country.trim().toUpperCase() === "NO";

	return [
		{
			id: isNorway ? "STANDARD_SHIPPING_NO" : "STANDARD_SHIPPING_INTL",
			displayName: isNorway ? "Standard shipping" : "International shipping",
			amountCents: Math.round(shippingFeeNok * 100),
			deliveryType: "HOME",
			deliveryEstimateDays: isNorway ? { min: 2, max: 5 } : { min: 4, max: 10 },
		},
	];
}
