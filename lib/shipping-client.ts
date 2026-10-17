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

/** Any item in cart that may have custom product shipping rates or free shipping rules. */
export type ShippingRateItemInput = {
	productId?: string;
	shippingNorway?: number | null;
	shippingInternational?: number | null;
	freeShippingExcluded?: boolean;
	quantity?: number;
};

export type ShippingConfig = {
	norwayRate: number;
	internationalRate: number;
	freeShippingThreshold: number;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
	norwayRate: NORWAY_SHIPPING_FEE_NOK,
	internationalRate: INTERNATIONAL_SHIPPING_FEE_NOK,
	freeShippingThreshold: FREE_SHIPPING_THRESHOLD_NOK,
};

export type ShippingRatesConfigInput = Partial<ShippingConfig>;

/**
 * Calculates shipping fee in NOK based on cart subtotal, item count, destination country,
 * optional items with custom rates, and optional admin shipping configuration.
 * - Subtotal >= freeShippingThreshold: Free shipping (0 NOK), unless items are marked freeShippingExcluded.
 * - Subtotal < freeShippingThreshold:
 *   - Norway (NO): default norwayRate (76 NOK) or max custom rate among cart items
 *   - Outside Norway: default internationalRate (200 NOK) or max custom rate among cart items
 * - Empty cart (0 items or 0 subtotal): 0 NOK
 */
export function calculateShippingFee(
	subtotalNok: number,
	itemCount = 1,
	countryCode?: string | null,
	items?: ShippingRateItemInput[],
	config?: ShippingRatesConfigInput
): number {
	if (itemCount <= 0 || subtotalNok <= 0) return 0;

	const defaultNorway = config?.norwayRate ?? NORWAY_SHIPPING_FEE_NOK;
	const defaultIntl = config?.internationalRate ?? INTERNATIONAL_SHIPPING_FEE_NOK;
	const threshold = config?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD_NOK;

	const normalizedCountry = countryCode?.trim().toUpperCase();
	const isNorway = !normalizedCountry || normalizedCountry === "NO";
	const defaultRate = isNorway ? defaultNorway : defaultIntl;

	const resolvedItems =
		items && items.length > 0
			? items.map((item) => {
					const customRate = isNorway ? item.shippingNorway : item.shippingInternational;
					const rate = typeof customRate === "number" && !isNaN(customRate) && customRate >= 0 ? customRate : defaultRate;
					return {
						rate,
						freeShippingExcluded: Boolean(item.freeShippingExcluded),
					};
			  })
			: [{ rate: defaultRate, freeShippingExcluded: false }];

	const qualifiesForFreeShipping = threshold > 0 && subtotalNok >= threshold;

	if (qualifiesForFreeShipping) {
		const excludedItems = resolvedItems.filter((i) => i.freeShippingExcluded);
		if (excludedItems.length > 0) {
			return Math.max(...excludedItems.map((i) => i.rate));
		}
		return 0;
	}

	return Math.max(...resolvedItems.map((i) => i.rate));
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
