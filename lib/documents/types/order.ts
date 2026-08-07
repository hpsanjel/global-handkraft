import type { CurrencyCode } from "./business";

export interface OrderItem {
	sku: string;
	productName: string;
	variantName: string;
	description: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	addonNames: string[];
	/** HS (Harmonized System) tariff code, required for customs declarations. */
	hsCode?: string;
	/** ISO 3166-1 alpha-2. Falls back to Business.defaultCountryOfOrigin when absent. */
	countryOfOrigin?: string;
	weightInGrams?: number;
	dimensions?: {
		width: string;
		height: string;
		depth: string;
	};
}

export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface Order {
	id: string;
	orderNumber: string;
	status: OrderStatus;
	currency: CurrencyCode;
	items: OrderItem[];
	subtotal: number;
	shippingCost: number;
	vatTotal: number;
	discountTotal: number;
	grandTotal: number;
	placedAt: Date;
}
