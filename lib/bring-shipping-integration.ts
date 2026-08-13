import { getBringShippingOptions, type BringProduct, type BringPackage } from "@/lib/bring";
import { buildPackagesFromLines } from "@/lib/shipping-client";
import type { PricedCheckoutItem } from "@/lib/checkout-pricing";

export type { BringProduct };

/**
 * Builds Bring packages from priced checkout items using the actual
 * weight and dimensions stored on each product variant in the database.
 *
 * The DB stores weight as a string like "10 kg" and dimensions as
 * strings like "40 cm" / "62 cm" / "30 cm". Each physical unit becomes
 * its own package so Bring quotes the real combination of parcels.
 */
export function buildPackagesFromItems(items: PricedCheckoutItem[]): BringPackage[] {
	return buildPackagesFromLines(items);
}

/**
 * Fetches Bring shipping options for a checkout session.
 * Returns sorted list of available shipping products with prices.
 */
export async function getBringOptionsForCheckout(toPostalCode: string, toCountry: string, items: PricedCheckoutItem[]): Promise<BringProduct[]> {
	const packages = buildPackagesFromItems(items);

	try {
		const result = await getBringShippingOptions(toPostalCode, toCountry, packages);
		return result.products;
	} catch (error) {
		console.error("Bring API error:", error);
		return [];
	}
}

/**
 * Formats a Bring product's delivery estimate into a Stripe-friendly display name.
 */
export function formatBringProductDisplay(product: BringProduct): string {
	const priceStr = product.priceCents > 0 ? `NOK ${(product.priceCents / 100).toFixed(0)}` : "Free";

	const deliveryStr = product.expectedDelivery ? ` (${product.expectedDelivery})` : product.maxDays ? ` (${product.maxDays} business days)` : "";

	return `${product.displayName} — ${priceStr}${deliveryStr}`;
}
