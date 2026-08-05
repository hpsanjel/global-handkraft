import { getBringShippingOptions, type BringProduct, type BringPackage } from "@/lib/bring";
import type { PricedCheckoutItem } from "@/app/api/checkout/route";

export type { BringProduct };

/**
 * Parses a measurement string from the database (e.g. "40 cm", "10 kg", "Standard", "N/A", "Custom")
 * into a numeric value. Returns null if the string doesn't contain a valid number.
 */
function parseMeasurement(value: string | undefined | null): number | null {
	if (!value) return null;

	// Match the first numeric value (integer or decimal) in the string
	const match = value.match(/-?\d+(\.\d+)?/);
	if (!match) return null;

	const num = Number(match[0]);
	return Number.isFinite(num) ? num : null;
}

/**
 * Builds Bring packages from priced checkout items using the actual
 * weight and dimensions stored on each product variant in the database.
 *
 * The DB stores weight as a string like "10 kg" and dimensions as
 * strings like "40 cm" / "62 cm" / "30 cm". We parse these into
 * numeric values for the Bring API.
 */
export function buildPackagesFromItems(items: PricedCheckoutItem[]): BringPackage[] {
	// If we have real weight/dimension data from the DB, use it.
	// We consolidate all items into a single package for shipping.
	let totalWeightGrams = 0;
	let maxLength = 0;
	let maxWidth = 0;
	let maxHeight = 0;

	for (const item of items) {
		// Parse weight from "10 kg" -> 10000 grams
		const itemWeightKg = parseMeasurement(item.weight);
		const itemWeightGrams = itemWeightKg !== null ? itemWeightKg * 1000 * item.quantity : item.quantity * 500; // fallback ~500g per item
		totalWeightGrams += itemWeightGrams;

		// Parse dimensions from "40 cm" -> 40
		const itemLength = parseMeasurement(item.depth);
		const itemWidth = parseMeasurement(item.width);
		const itemHeight = parseMeasurement(item.height);

		// For a consolidated package, take the max dimension in each direction
		if (itemLength !== null) maxLength = Math.max(maxLength, itemLength);
		if (itemWidth !== null) maxWidth = Math.max(maxWidth, itemWidth);
		if (itemHeight !== null) maxHeight = Math.max(maxHeight, itemHeight);
	}

	// Fallback dimensions if no real dimensions were found
	if (maxLength === 0 && maxWidth === 0 && maxHeight === 0) {
		maxLength = 30;
		maxWidth = 20;
		maxHeight = 15;
	}

	return [
		{
			weightInGrams: Math.max(totalWeightGrams, 200), // minimum 200g
			length: maxLength,
			width: maxWidth,
			height: maxHeight,
		},
	];
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
