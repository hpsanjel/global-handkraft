import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getRecentOrders } from "@/lib/admin";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

export default async function AdminOrdersPage() {
	const orders = await getRecentOrders(20);

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Review orders</h1>
					</div>
					<Link href="/admin" className="text-sm font-semibold text-stone-700 transition hover:text-stone-900">
						Back to dashboard
					</Link>
				</div>

				<div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
					<div className="flex flex-col gap-2 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-stone-900">Recent payments</h2>
							<p className="mt-1 text-sm text-stone-500">Live data from Stripe checkout sessions.</p>
						</div>
						<p className="text-sm font-medium text-stone-600">{orders.length} orders</p>
					</div>

					<div className="mt-6 space-y-4">
						{orders.length > 0 ? (
							orders.map((order) => (
								<div key={order.id} className="rounded-2xl border border-stone-200 p-4">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div>
											<p className="font-semibold text-stone-900">{order.id}</p>
											<p className="mt-1 text-stone-600">{order.customer}</p>
											<p className="text-sm text-stone-500">{order.email}</p>
										</div>
										<div className="text-left sm:text-right">
											<p className="font-semibold text-stone-900">{currencyFormatter.format(order.amount)}</p>
											<p className="mt-1 text-stone-500">{order.status}</p>
										</div>
									</div>
									<p className="mt-3 text-sm text-stone-600">
										{order.item} · {order.variant}
									</p>
									<p className="text-sm text-stone-500">{order.address}</p>
									<p className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-400">{order.date}</p>
								</div>
							))
						) : (
							<div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">No paid Stripe orders have been captured yet.</div>
						)}
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
