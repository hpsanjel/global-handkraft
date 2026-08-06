import { ORDER_STATUS_META, isOrderStatus } from "@/lib/order-status";

export function OrderStatusBadge({ status }: { status: string }) {
	const meta = isOrderStatus(status) ? ORDER_STATUS_META[status] : null;
	const label = meta?.label ?? status;
	const className = meta?.badgeClassName ?? "bg-stone-100 text-stone-600 border-stone-200";

	return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
