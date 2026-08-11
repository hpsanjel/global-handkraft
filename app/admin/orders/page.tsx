import { Package, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
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
	const orders = await getRecentOrders(50);

	const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
	const awaitingPayment = orders.filter((order) => order.status === "PENDING").length;
	const delivered = orders.filter((order) => order.status === "DELIVERED").length;

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Orders" description="Track payments and fulfilment status." />

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminStatCard label="Total orders" value={orders.length.toString()} icon={Package} tone="neutral" />
				<AdminStatCard label="Revenue" value={formatCurrency(totalRevenue, "NOK")} icon={Wallet} tone="blue" hint={`From ${orders.length} recent orders`} />
				<AdminStatCard label="Awaiting payment" value={awaitingPayment.toString()} icon={Clock} tone="orange" />
				<AdminStatCard label="Delivered" value={delivered.toString()} icon={CheckCircle2} tone="green" />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-base font-semibold text-slate-900">Recent payments</h2>
						<p className="mt-0.5 text-sm text-slate-500">Live data from Stripe checkout sessions.</p>
					</div>
					<p className="shrink-0 text-sm font-medium text-slate-500">{orders.length} orders</p>
				</div>

				{orders.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
									<th className="px-6 py-3 font-semibold">Order</th>
									<th className="px-6 py-3 font-semibold">Item</th>
									<th className="px-6 py-3 text-right font-semibold">Amount</th>
									<th className="px-6 py-3 font-semibold">Status</th>
									<th className="px-6 py-3 font-semibold">Delivery</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{orders.map((order) => (
									<tr key={order.id} id={`order-${order.orderId}`} className="scroll-mt-24 align-top transition-colors target:bg-stone-50">
										<td className="px-6 py-4">
											<p className="font-semibold text-slate-900">{order.id}</p>
											<p className="mt-1 text-slate-600">{order.customer}</p>
											{order.email !== order.customer ? <p className="text-xs text-slate-500">{order.email}</p> : null}
											<p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400">{order.date}</p>
										</td>
										<td className="px-6 py-4 text-slate-600">
											<div className="flex items-center gap-3">
												{order.itemImage ? (
													<span className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('${order.itemImage}')` }} />
												) : (
													<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
														<Package className="h-4.5 w-4.5" />
													</span>
												)}
												<div className="min-w-0">
													<p className="truncate text-slate-900">{order.item}</p>
													<p className="truncate text-xs text-slate-500">{order.variant}</p>
												</div>
											</div>
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(order.amount, order.currency)}</td>
										<td className="px-6 py-4">
											<OrderStatusControl orderId={order.orderId} currentStatus={order.status} />
										</td>
										<td className="px-6 py-4">
											<p className="max-w-56 truncate text-slate-600" title={order.address}>
												{order.address}
											</p>
											<p className="mt-0.5 text-xs text-slate-400">Ship via: {order.shippingMethod}</p>
											<div className="mt-2">
												<OrderDocumentsMenu orderId={order.orderId} isPickup={order.isPickup} />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-12 text-center text-sm text-slate-500">No paid Stripe orders have been captured yet.</div>
				)}
			</div>
		</div>
	);
}
