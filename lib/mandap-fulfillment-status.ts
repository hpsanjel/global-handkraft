// Production/shipping timeline for a custom MandapInquiry, independent of
// paymentStatus (a made-to-order piece can be in production before, during,
// or after the deposit/balance is settled — see admin/custom-orders). Mirrors
// the shape of lib/order-status.ts for a regular Order.
export const MANDAP_FULFILLMENT_STATUSES = ["AWAITING_PRODUCTION", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] as const;

export type MandapFulfillmentStatus = (typeof MANDAP_FULFILLMENT_STATUSES)[number];

export function isMandapFulfillmentStatus(value: string): value is MandapFulfillmentStatus {
	return (MANDAP_FULFILLMENT_STATUSES as readonly string[]).includes(value);
}

type MandapFulfillmentStatusMeta = {
	label: string;
	badgeClassName: string;
};

export const MANDAP_FULFILLMENT_STATUS_META: Record<MandapFulfillmentStatus, MandapFulfillmentStatusMeta> = {
	AWAITING_PRODUCTION: { label: "Awaiting production", badgeClassName: "bg-slate-100 text-slate-700 border-slate-200" },
	IN_PRODUCTION: { label: "In production", badgeClassName: "bg-amber-50 text-amber-700 border-amber-200" },
	READY_TO_SHIP: { label: "Ready to ship", badgeClassName: "bg-blue-50 text-blue-700 border-blue-200" },
	SHIPPED: { label: "Shipped", badgeClassName: "bg-indigo-50 text-indigo-700 border-indigo-200" },
	DELIVERED: { label: "Delivered", badgeClassName: "bg-green-50 text-green-700 border-green-200" },
};

/** Shipping/customs paperwork only makes sense once the piece is actually ready to leave the workshop. */
export function isReadyForShippingDocuments(status: string): boolean {
	return status === "READY_TO_SHIP" || status === "SHIPPED" || status === "DELIVERED";
}
