import { getShippingRate } from "@/lib/shipping";
import { getBringOptionsForCheckout } from "@/lib/bring-shipping-integration";
import { STORE_PICKUP_ID, STORE_PICKUP_DISPLAY_NAME } from "@/lib/shipping-client";
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
	/** A Bring product id, or STORE_PICKUP_ID / "FREE_SHIPPING_COUPON" / "STATIC_FALLBACK". */
	id: string;
	displayName: string;
	amountCents: number;
	deliveryType: "HOME" | "PICKUP" | "MAILBOX";
	deliveryEstimateDays?: { min: number; max: number };
};

/**
 * Provider-agnostic shipping quote resolution shared by both the Stripe and
 * Vipps checkout routes: store-pickup and free-shipping-coupon short
 * circuits, live Bring rates when configured and an address is known, and a
 * static DB-driven fallback otherwise.
 */
export async function getShippingQuotes(shippingAddress: SavedShippingAddress | undefined, pricedItems: PricedCheckoutItem[], subtotal: number, selectedShippingId?: string | null, hasFreeShippingCoupon?: boolean): Promise<ShippingQuote[]> {
	// Store pickup: skip Bring entirely, single free option.
	// However, if a free shipping coupon is applied, don't show store pickup option.
	if (selectedShippingId === STORE_PICKUP_ID && !hasFreeShippingCoupon) {
		return [
			{
				id: STORE_PICKUP_ID,
				displayName: STORE_PICKUP_DISPLAY_NAME,
				amountCents: 0,
				deliveryType: "PICKUP",
			},
		];
	}

	// If free shipping coupon is applied, skip store pickup and return a generic free shipping option
	// This keeps "Free" in the summary without showing "Collect Myself — Bærum Store"
	if (hasFreeShippingCoupon) {
		return [
			{
				id: "FREE_SHIPPING_COUPON",
				displayName: "Free shipping",
				amountCents: 0,
				deliveryType: "HOME",
			},
		];
	}

	const bringConfigured = process.env.BRING_API_UID && process.env.BRING_API_KEY;

	// Try to use Bring API if credentials are available and we have postal code + country
	if (bringConfigured && shippingAddress?.postalCode && shippingAddress?.country) {
		try {
			const bringProducts = await getBringOptionsForCheckout(shippingAddress.postalCode, shippingAddress.country, pricedItems);

			if (bringProducts.length > 0) {
				// Re-fetched live from Bring (never trust client-supplied price). If the
				// customer had already picked a method in the cart drawer/page and it's
				// still on offer, move it to the front so it's the natural default.
				const matchIndex = selectedShippingId ? bringProducts.findIndex((product) => product.productId === selectedShippingId) : -1;
				const orderedProducts = matchIndex > 0 ? [bringProducts[matchIndex], ...bringProducts.slice(0, matchIndex), ...bringProducts.slice(matchIndex + 1)] : bringProducts;

				return orderedProducts.map((product) => ({
					id: product.productId,
					displayName: product.displayName,
					amountCents: product.priceCents,
					deliveryType: product.deliveryType,
					deliveryEstimateDays: product.maxDays ? { min: 1, max: product.maxDays } : undefined,
				}));
			}
		} catch {
			// Fall through to static rate if Bring API fails
			console.warn("Bring API failed, falling back to static shipping rate.");
		}
	}

	// Fallback: static shipping rate from DB
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
