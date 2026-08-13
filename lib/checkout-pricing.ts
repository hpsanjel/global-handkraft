import type { CartItem } from "@/types/store";
import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/lib/product-transform";
import { getZoneMarkup } from "@/lib/price-zones";

export type CheckoutItem = Pick<CartItem, "productId" | "variantId" | "addonIds" | "quantity">;

export type PricedCheckoutItem = {
	productId: string;
	variantId: string;
	quantity: number;
	addonIds: string[];
	name: string;
	/** Product name alone, without the variant suffix baked into `name`. */
	productName: string;
	/** Variant label alone (e.g. "Large - Rosewood"), without the product name. */
	variantName: string;
	unitAmountCents: number;
	lineSubtotal: number;
	image: string;
	/** Weight in kg as stored on the Variant (e.g. "10 kg") */
	weight: string;
	/** Width in cm as stored on the Variant (e.g. "40 cm") */
	width: string;
	/** Height in cm as stored on the Variant (e.g. "62 cm") */
	height: string;
	/** Depth in cm as stored on the Variant (e.g. "30 cm") */
	depth: string;
	/** Zone markup applied per unit */
	zoneMarkup: number;
};

export function normalizeCheckoutItems(items: CheckoutItem[]) {
	return items.map((item) => ({
		productId: String(item.productId ?? "").trim(),
		variantId: String(item.variantId ?? "").trim(),
		addonIds: Array.isArray(item.addonIds)
			? item.addonIds
					.map((id) => String(id).trim())
					.filter(Boolean)
					.sort()
			: [],
		quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
	}));
}

export async function priceCheckoutItems(items: CheckoutItem[], countryCode?: string): Promise<PricedCheckoutItem[]> {
	const normalizedItems = normalizeCheckoutItems(items);

	if (normalizedItems.some((item) => !item.productId || !item.variantId)) {
		throw new Error("One or more cart items are invalid.");
	}

	return Promise.all(
		normalizedItems.map(async (item) => {
			const variant = await prisma.variant.findFirst({
				where: {
					id: item.variantId,
					productId: item.productId,
					product: { active: true },
				},
				include: {
					product: true,
				},
			});

			if (!variant) {
				throw new Error("One or more cart items are no longer available.");
			}

			if (variant.stock < item.quantity) {
				throw new Error(`${variant.product.name} has only ${variant.stock} item${variant.stock === 1 ? "" : "s"} in stock.`);
			}

			const addons = item.addonIds.length
				? await prisma.addon.findMany({
						where: {
							id: { in: item.addonIds },
							productId: item.productId,
						},
					})
				: [];

			if (addons.length !== item.addonIds.length) {
				throw new Error("One or more selected add-ons are no longer available.");
			}

			const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
			const baseUnitAmount = variant.price + addonTotal;
			const markup = countryCode ? await getZoneMarkup(countryCode) : 0;
			const unitAmount = baseUnitAmount + markup;
			const variantDisplay = variantLabel(variant.name, variant.color);
			const name = `${variant.product.name}${variantDisplay ? ` (${variantDisplay})` : ""}`;

			return {
				productId: item.productId,
				variantId: item.variantId,
				quantity: item.quantity,
				addonIds: item.addonIds,
				name,
				productName: variant.product.name,
				variantName: variantDisplay,
				unitAmountCents: Math.round(unitAmount * 100),
				lineSubtotal: unitAmount * item.quantity,
				image: variant.product.image,
				weight: variant.weight,
				width: variant.width,
				height: variant.height,
				depth: variant.depth,
				zoneMarkup: markup,
			};
		}),
	);
}
