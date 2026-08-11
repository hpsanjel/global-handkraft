export type PaymentProvider = "stripe";

export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED";

export interface Payment {
	provider: PaymentProvider;
	paymentIntentId: string | null;
	method?: string;
	status: PaymentStatus;
	paidAt: Date | null;
	amount: number;
	/** Set when status is PARTIALLY_PAID (e.g. a MandapInquiry deposit) — how much has actually been received so far, vs. `amount` (the full order total). */
	amountPaid?: number;
	/** Set when status is PARTIALLY_PAID or PENDING with a deposit policy — the outstanding amount still owed. */
	balanceDue?: number;
	/** The deposit amount required before production/fulfilment starts, if the seller requires one (e.g. a custom order's quoted deposit policy). Distinct from amountPaid — this is the target, not what's been received. */
	depositRequired?: number;
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
