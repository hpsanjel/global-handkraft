export type PaymentProvider = "stripe";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED";

export interface Payment {
	provider: PaymentProvider;
	paymentIntentId: string | null;
	method?: string;
	status: PaymentStatus;
	paidAt: Date | null;
	amount: number;
}

export interface Tax {
	label: string;
	rate: number;
	amount: number;
}

export type DiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface Discount {
	code?: string;
	description: string;
	type: DiscountType;
	amount: number;
}
