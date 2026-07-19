import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getRecentOrders } from "@/lib/admin";
import { products } from "@/lib/data/products";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

const lowStockThreshold = 5;
const inventoryValue = products.reduce((total, product) => total + product.variants.reduce((variantTotal, variant) => variantTotal + variant.price * variant.stock, 0), 0);
const lowStockCount = products.reduce((count, product) => count + product.variants.filter((variant) => variant.stock < lowStockThreshold).length, 0);
const totalVariants = products.reduce((count, product) => count + product.variants.length, 0);

const stats = [
	{ label: "Inventory value", value: currencyFormatter.format(inventoryValue) },
	{ label: "Products", value: products.length.toString() },
	{ label: "Variants", value: totalVariants.toString() },
	{ label: "Low stock", value: lowStockCount.toString() },
];

export default async function AdminPage() {
	const recentOrders = await getRecentOrders(10);

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin dashboard</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Manage your store with confidence</h1>
					</div>
					<Button asChild>
						<Link href="/admin/products">Manage products</Link>
					</Button>
				</div>
				<div className="mt-8 grid gap-4 md:grid-cols-4">
					{stats.map((stat) => (
						<div key={stat.label} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
							<p className="text-sm text-stone-500">{stat.label}</p>
							<p className="mt-3 text-3xl font-semibold text-stone-900">{stat.value}</p>
						</div>
					))}
				</div>
				<div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">Recent orders</h2>
						<div className="mt-4 space-y-3 text-sm text-stone-600">
							{recentOrders.map((order) => (
								<div key={order.id} className="flex flex-col gap-3 border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div>
											<p className="font-semibold text-stone-900">{order.id}</p>
											<p className="mt-1 text-stone-600">{order.customer}</p>
											<p className="text-sm text-stone-500">{order.email}</p>
										</div>
										<div className="text-left sm:text-right">
											<p className="font-medium text-stone-900">{currencyFormatter.format(order.amount)}</p>
											<p className="mt-1 text-stone-500">{order.status}</p>
										</div>
									</div>
									<p className="text-sm text-stone-600">
										{order.item} · {order.variant}
									</p>
									<p className="text-sm text-stone-500">{order.address}</p>
									<p className="text-xs uppercase tracking-[0.2em] text-stone-400">{order.date}</p>
								</div>
							))}
						</div>
					</div>
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">Quick actions</h2>
						<div className="mt-4 space-y-3">
							<Link href="/admin/products" className="block rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
								Manage products
							</Link>
							<Link href="/admin/orders" className="block rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
								Review orders
							</Link>
							<Link href="/admin/settings" className="block rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
								Shipping and VAT
							</Link>
						</div>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
