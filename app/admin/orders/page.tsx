import { AdminPageHeader } from "@/components/admin/page-header";
import { getRecentOrders } from "@/lib/admin";
import { OrderStatusControl } from "./OrderStatusControl";
import { OrderDocumentsMenu } from "./OrderDocumentsMenu";

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency || "NOK",
		maximumFractionDigits: 0,
	}).format(amount);
}

export default async function AdminOrdersPage() {
	const orders = await getRecentOrders(20);

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Orders" description="Track payments and fulfilment status." />

			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-slate-900">Recent payments</h2>
						<p className="mt-1 text-sm text-slate-500">Live data from Stripe checkout sessions.</p>
					</div>
					<p className="text-sm font-medium text-slate-500">{orders.length} orders</p>
				</div>

				<div className="mt-6 space-y-4">
					{orders.length > 0 ? (
						orders.map((order) => (
							<div key={order.id} id={`order-${order.orderId}`} className="scroll-mt-24 rounded-xl border border-slate-200 p-4 transition-colors target:border-stone-400 target:bg-stone-50 target:ring-2 target:ring-stone-200">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<p className="font-semibold text-slate-900">{order.id}</p>
										<p className="mt-1 text-slate-600">{order.customer}</p>
										<p className="text-sm text-slate-500">{order.email}</p>
									</div>
									<div className="text-left sm:text-right">
										<p className="font-semibold text-slate-900">{formatCurrency(order.amount, order.currency)}</p>
										<div className="mt-1 flex flex-col items-start gap-2 sm:items-end">
											<OrderStatusControl orderId={order.orderId} currentStatus={order.status} />
											<OrderDocumentsMenu orderId={order.orderId} isPickup={order.isPickup} />
										</div>
									</div>
								</div>
								<p className="mt-3 text-sm text-slate-600">
									{order.item} · {order.variant}
								</p>
								<p className="text-sm text-slate-500">{order.address}</p>
								<p className="mt-1 text-sm font-medium text-slate-600">Ship via: {order.shippingMethod}</p>
								<p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{order.date}</p>
							</div>
						))
					) : (
						<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No paid Stripe orders have been captured yet.</div>
					)}
				</div>
			</div>
		</div>
	);
}
