/**
 * Client-safe shipping helpers shared across the store. No Prisma,
 * no process.env, no React — safe to import from "use client" components.
 */

/** Free shipping applies to any cart whose subtotal reaches this threshold (in NOK). */
export const FREE_SHIPPING_THRESHOLD_NOK = 1500;

/** Domestic shipping charge for orders within Norway below the free shipping threshold (in NOK). */
export const NORWAY_SHIPPING_FEE_NOK = 76;

/** International shipping charge for orders outside Norway below the free shipping threshold (in NOK). */
export const INTERNATIONAL_SHIPPING_FEE_NOK = 200;

/** Standard shipping charge applied when subtotal is below the free shipping threshold (in NOK). */
export const STANDARD_SHIPPING_FEE_NOK = NORWAY_SHIPPING_FEE_NOK;

/**
 * Calculates shipping fee in NOK based on cart subtotal, item count, and destination country.
 * - Subtotal >= 1500 NOK: Free shipping (0 NOK)
 * - Subtotal < 1500 NOK (with items in cart):
 *   - Norway (NO): 76 NOK
 *   - Outside Norway: 200 NOK
 * - Empty cart (0 items or 0 subtotal): 0 NOK
 */
export function calculateShippingFee(subtotalNok: number, itemCount = 1, countryCode?: string | null): number {
	if (itemCount <= 0 || subtotalNok <= 0) return 0;
	if (subtotalNok >= FREE_SHIPPING_THRESHOLD_NOK) return 0;

	const normalizedCountry = countryCode?.trim().toUpperCase();
	const isNorway = !normalizedCountry || normalizedCountry === "NO";
	return isNorway ? NORWAY_SHIPPING_FEE_NOK : INTERNATIONAL_SHIPPING_FEE_NOK;
}

/** Any cart line that carries free-text weight/dimension strings ("10 kg", "40 cm"). */
export type MeasurableCartLine = {
	weight?: string | null;
	width?: string | null;
	height?: string | null;
	depth?: string | null;
	quantity: number;
};

export type PackageInput = {
	weightInGrams: number;
	length: number;
	width: number;
	height: number;
};

export type BringPackageInput = PackageInput;

/** Extracts the first numeric value from a free-text measurement string (e.g. "10 kg" -> 10). */
export function parseMeasurement(value: string | null | undefined): number | null {
	if (!value) return null;

	const match = value.match(/-?\d+(\.\d+)?/);
	if (!match) return null;

	const num = Number(match[0]);
	return Number.isFinite(num) ? num : null;
}

/**
 * Expands cart lines into individual packages — one package per physical
 * unit (a line with quantity 3 becomes 3 packages), each using that item's own
 * weight/dimensions, with a 30x20x15cm / 200g floor when nothing parses.
 */
export function buildPackagesFromLines(lines: MeasurableCartLine[]): PackageInput[] {
	const packages: PackageInput[] = [];

	for (const line of lines) {
		const weightKg = parseMeasurement(line.weight);
		const weightGrams = weightKg !== null ? weightKg * 1000 : 500;

		const length = parseMeasurement(line.depth) ?? 30;
		const width = parseMeasurement(line.width) ?? 20;
		const height = parseMeasurement(line.height) ?? 15;

		const quantity = Math.max(1, Math.round(line.quantity));
		for (let i = 0; i < quantity; i++) {
			packages.push({ weightInGrams: Math.max(weightGrams, 200), length, width, height });
		}
	}

	return packages;
}

/**
 * Sentinel ID retained for historical orders where customer collected order in store.
 */
export const STORE_PICKUP_ID = "STORE_PICKUP" as const;
export const STORE_PICKUP_DISPLAY_NAME = "Collect Myself — Bærum Store";
