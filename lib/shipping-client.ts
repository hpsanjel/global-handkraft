/**
 * Client-safe shipping helpers shared between the cart drawer, the full
 * /cart page, and the server-side checkout/Bring integration. No Prisma,
 * no process.env, no React — safe to import from "use client" components.
 */

/** Any cart line that carries free-text weight/dimension strings ("10 kg", "40 cm"). */
export type MeasurableCartLine = {
	weight?: string | null;
	width?: string | null;
	height?: string | null;
	depth?: string | null;
	quantity: number;
};

export type BringPackageInput = {
	weightInGrams: number;
	length: number;
	width: number;
	height: number;
};

/** Extracts the first numeric value from a free-text measurement string (e.g. "10 kg" -> 10). */
export function parseMeasurement(value: string | null | undefined): number | null {
	if (!value) return null;

	const match = value.match(/-?\d+(\.\d+)?/);
	if (!match) return null;

	const num = Number(match[0]);
	return Number.isFinite(num) ? num : null;
}

/**
 * Expands cart lines into individual Bring packages — one package per physical
 * unit (a line with quantity 3 becomes 3 packages), each using that item's own
 * weight/dimensions, with a 30x20x15cm / 200g floor when nothing parses.
 *
 * This lets Bring quote the real combination of parcels instead of one
 * approximated box for the whole cart, which meaningfully undercharges when
 * items have different sizes (verified against live Bring responses).
 */
export function buildPackagesFromLines(lines: MeasurableCartLine[]): BringPackageInput[] {
	const packages: BringPackageInput[] = [];

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

/** Mirrors the shape returned by POST /api/bring-shipping. */
export type BringShippingOption = {
	productId: string;
	displayName: string;
	priceCents: number;
	expectedDelivery: string | null;
	maxDays: number | null;
	deliveryType: "HOME" | "PICKUP" | "MAILBOX";
	guiInformation: string | null;
};

/**
 * Sentinel ID used everywhere (drawer, cart page, checkout route, webhook) to
 * mean "customer will collect the order in person at the Oslo store" —
 * never a real Bring product id.
 */
export const STORE_PICKUP_ID = "STORE_PICKUP" as const;
export const STORE_PICKUP_DISPLAY_NAME = "Collect Myself — Oslo Store";

export const STORE_PICKUP_OPTION: BringShippingOption = {
	productId: STORE_PICKUP_ID,
	displayName: STORE_PICKUP_DISPLAY_NAME,
	priceCents: 0,
	expectedDelivery: "Ready for pickup today",
	maxDays: null,
	deliveryType: "PICKUP",
	guiInformation: "Pick up your order in person at our Oslo store — we'll email you when it's ready.",
};
