export const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
	return (ORDER_STATUSES as readonly string[]).includes(value);
}

type OrderStatusMeta = {
	label: string;
	badgeClassName: string;
	customerDescription: string;
	emailSubject: string;
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
	PENDING: {
		label: "Pending",
		badgeClassName: "bg-amber-50 text-amber-700 border-amber-200",
		customerDescription: "We've received your order and it's awaiting payment confirmation.",
		emailSubject: "Your order {orderNumber} is pending",
	},
	PAID: {
		label: "Paid",
		badgeClassName: "bg-sky-50 text-sky-700 border-sky-200",
		customerDescription: "Payment received — your order is being prepared with care by our artisans.",
		emailSubject: "Payment confirmed for order {orderNumber}",
	},
	PROCESSING: {
		label: "Processing",
		badgeClassName: "bg-blue-50 text-blue-700 border-blue-200",
		customerDescription: "Your order is being carefully packed and prepared for shipment.",
		emailSubject: "Your order {orderNumber} is being processed",
	},
	SHIPPED: {
		label: "Shipped",
		badgeClassName: "bg-indigo-50 text-indigo-700 border-indigo-200",
		customerDescription: "Your order is on its way to you.",
		emailSubject: "Your order {orderNumber} has shipped",
	},
	DELIVERED: {
		label: "Delivered",
		badgeClassName: "bg-green-50 text-green-700 border-green-200",
		customerDescription: "Your order has been delivered. We hope you love it!",
		emailSubject: "Your order {orderNumber} has been delivered",
	},
	CANCELLED: {
		label: "Cancelled",
		badgeClassName: "bg-red-50 text-red-700 border-red-200",
		customerDescription: "Your order has been cancelled. Contact us if you have any questions.",
		emailSubject: "Your order {orderNumber} was cancelled",
	},
	REFUNDED: {
		label: "Refunded",
		badgeClassName: "bg-orange-50 text-orange-700 border-orange-200",
		customerDescription: "Your order has been refunded.",
		emailSubject: "Your order {orderNumber} was refunded",
	},
};
