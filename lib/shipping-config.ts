import { prisma } from "@/lib/prisma";
import { DEFAULT_SHIPPING_ZONE_CODE } from "@/lib/shipping-countries";
import {
	type ShippingConfig,
	DEFAULT_SHIPPING_CONFIG,
} from "@/lib/shipping-client";

export type { ShippingConfig };
export { DEFAULT_SHIPPING_CONFIG };

/**
 * Loads default shipping rates for Norway and International from the database,
 * falling back to hardcoded defaults (76 NOK, 200 NOK, 1500 NOK free threshold).
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
	if (!process.env.DATABASE_URL) {
		return { ...DEFAULT_SHIPPING_CONFIG };
	}

	try {
		const [norwayZone, defaultZone] = await Promise.all([
			prisma.shippingZone.findUnique({ where: { country: "NO" } }),
			prisma.shippingZone.findUnique({ where: { country: DEFAULT_SHIPPING_ZONE_CODE } }),
		]);

		const norwayRate = typeof norwayZone?.shippingCost === "number" ? norwayZone.shippingCost : DEFAULT_SHIPPING_CONFIG.norwayRate;
		const internationalRate = typeof defaultZone?.shippingCost === "number" ? defaultZone.shippingCost : DEFAULT_SHIPPING_CONFIG.internationalRate;
		const freeShippingThreshold =
			typeof norwayZone?.freeShippingFrom === "number"
				? norwayZone.freeShippingFrom
				: typeof defaultZone?.freeShippingFrom === "number"
					? defaultZone.freeShippingFrom
					: DEFAULT_SHIPPING_CONFIG.freeShippingThreshold;

		return {
			norwayRate,
			internationalRate,
			freeShippingThreshold,
		};
	} catch (error) {
		console.error("Error reading shipping config:", error);
		return { ...DEFAULT_SHIPPING_CONFIG };
	}
}

/**
 * Saves default shipping rates for Norway and International.
 * Upserts "NO" and "DEFAULT" rows in the ShippingZone table.
 */
export async function saveShippingConfig(config: Partial<ShippingConfig>): Promise<ShippingConfig> {
	if (!process.env.DATABASE_URL) {
		throw new Error("Database not configured.");
	}

	const current = await getShippingConfig();
	const norwayRate = typeof config.norwayRate === "number" && config.norwayRate >= 0 ? config.norwayRate : current.norwayRate;
	const internationalRate =
		typeof config.internationalRate === "number" && config.internationalRate >= 0 ? config.internationalRate : current.internationalRate;
	const freeShippingThreshold =
		typeof config.freeShippingThreshold === "number" && config.freeShippingThreshold >= 0
			? config.freeShippingThreshold
			: current.freeShippingThreshold;

	await Promise.all([
		prisma.shippingZone.upsert({
			where: { country: "NO" },
			update: { shippingCost: norwayRate, freeShippingFrom: freeShippingThreshold },
			create: { country: "NO", shippingCost: norwayRate, freeShippingFrom: freeShippingThreshold },
		}),
		prisma.shippingZone.upsert({
			where: { country: DEFAULT_SHIPPING_ZONE_CODE },
			update: { shippingCost: internationalRate, freeShippingFrom: freeShippingThreshold },
			create: { country: DEFAULT_SHIPPING_ZONE_CODE, shippingCost: internationalRate, freeShippingFrom: freeShippingThreshold },
		}),
	]);

	return {
		norwayRate,
		internationalRate,
		freeShippingThreshold,
	};
}
