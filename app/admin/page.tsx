import Link from "next/link";
import { Package, ShoppingCart, Tags, Ticket, Star, Quote, Settings, ArrowRight, ChevronRight } from "lucide-react";
import { AdminLiveStats } from "@/components/admin-live-stats";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getRecentOrders } from "@/lib/admin";

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency || "NOK",
		maximumFractionDigits: 0,
	}).format(amount);
}

const QUICK_ACTIONS = [
	{ href: "/admin/products", label: "Manage products", description: "Add, edit, and stock the catalog", icon: Package },
	{ href: "/admin/categories", label: "Manage categories", description: "Organize how products are grouped", icon: Tags },
	{ href: "/admin/orders", label: "Review orders", description: "Track payments and fulfilment", icon: ShoppingCart },
	{ href: "/admin/coupons", label: "Coupon codes", description: "Create and manage discounts", icon: Ticket },
	{ href: "/admin/reviews", label: "Moderate reviews", description: "Approve or reject customer reviews", icon: Star },
	{ href: "/admin/testimonials", label: "Testimonials", description: "Manage homepage customer testimonials", icon: Quote },
	{ href: "/admin/settings", label: "Shipping & VAT", description: "Configure delivery zones", icon: Settings },
];

export default async function AdminPage() {
	const recentOrders = await getRecentOrders(10);

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Dashboard"
				description="An overview of your store's inventory and recent activity."
				actions={
					<>
						<Button asChild variant="primary">
							<Link href="/admin/products">Manage products</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/admin/categories">Manage categories</Link>
						</Button>
					</>
				}
			/>

			<AdminLiveStats />

			<div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
				<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
					<div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
						<div>
							<h2 className="text-base font-semibold text-slate-900">Recent orders</h2>
							<p className="mt-0.5 text-sm text-slate-500">Latest Stripe checkout activity</p>
						</div>
						<Link href="/admin/orders" className="flex shrink-0 items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-700">
							View all
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					{recentOrders.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										<th className="px-6 py-3 font-semibold">Customer</th>
										<th className="px-6 py-3 font-semibold">Item</th>
										<th className="px-6 py-3 font-semibold">Status</th>
										<th className="px-6 py-3 text-right font-semibold">Amount</th>
										<th className="w-10 px-3 py-3" aria-hidden="true" />
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{recentOrders.map((order) => (
										<Link key={order.id} href={`/admin/orders#order-${order.orderId}`} className="table-row cursor-pointer transition hover:bg-slate-50" title={`Open order ${order.id} in Orders`}>
											<td className="whitespace-nowrap px-6 py-3.5">
												<p className="font-medium text-slate-900">{order.customer}</p>
												<p className="text-xs text-slate-500">{order.id}</p>
											</td>
											<td className="px-6 py-3.5 text-slate-600">
												{order.item}
												{order.variant ? <span className="text-slate-400"> · {order.variant}</span> : null}
											</td>
											<td className="whitespace-nowrap px-6 py-3.5">
												<OrderStatusBadge status={order.status} />
											</td>
											<td className="whitespace-nowrap px-6 py-3.5 text-right font-medium text-slate-900">{formatCurrency(order.amount, order.currency)}</td>
											<td className="whitespace-nowrap px-3 py-3.5 text-right">
												<ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
											</td>
										</Link>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="px-6 py-10 text-center text-sm text-slate-500">No orders have been captured yet.</div>
					)}
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<h2 className="px-2 pt-2 text-base font-semibold text-slate-900">Quick actions</h2>
					<div className="mt-3 space-y-1">
						{QUICK_ACTIONS.map((action) => {
							const Icon = action.icon;
							return (
								<Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50">
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
										<Icon className="h-4.5 w-4.5" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-sm font-medium text-slate-900">{action.label}</span>
										<span className="block truncate text-xs text-slate-500">{action.description}</span>
									</span>
									<ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
