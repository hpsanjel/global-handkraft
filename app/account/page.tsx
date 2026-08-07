"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ShoppingBag, Wallet, Truck, MapPin, UserRound, MessageCircle, ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AccountPageHeader } from "@/components/account/account-page-header";
import { AccountStatCard } from "@/components/account/stat-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type AccountOrder = {
	id: string;
	orderNumber: string;
	status: string;
	total: number;
	currency: string;
	createdAt: string;
	items: { id: string; quantity: number; product: { name: string } | null; variant: { name: string } | null }[];
};

const ACTIVE_STATUSES = new Set(["PENDING", "PAID", "PROCESSING", "SHIPPED"]);

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency || "NOK",
		maximumFractionDigits: 0,
	}).format(amount);
}

export default function AccountOverviewPage() {
	const [supabase] = useState(() => createClient());
	const [user, setUser] = useState<User | null>(null);
	const [orders, setOrders] = useState<AccountOrder[] | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) setUser(data.user);
		});
	}, [supabase]);

	useEffect(() => {
		let active = true;
		fetch("/api/account/orders", { cache: "no-store" })
			.then((response) => response.json())
			.then((payload: AccountOrder[] | { error?: string }) => {
				if (active && Array.isArray(payload)) setOrders(payload);
			})
			.catch(() => {
				if (active) setOrders([]);
			});
		return () => {
			active = false;
		};
	}, []);

	const hasAddress = Boolean(user?.user_metadata?.shipping_address);

	const stats = useMemo(() => {
		if (!orders) return null;
		const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
		const activeOrders = orders.filter((order) => ACTIVE_STATUSES.has(order.status)).length;
		return {
			totalOrders: orders.length,
			totalSpent,
			currency: orders[0]?.currency || "NOK",
			activeOrders,
		};
	}, [orders]);

	const recentOrders = orders?.slice(0, 3) ?? [];

	return (
		<div className="space-y-8">
			<AccountPageHeader title="Overview" description="Here's a snapshot of your account and recent activity." />

			{orders && orders.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-3">
					<AccountStatCard label="Total orders" value={stats?.totalOrders.toString() ?? "0"} icon={ShoppingBag} tone="neutral" />
					<AccountStatCard label="Total spent" value={stats ? formatCurrency(stats.totalSpent, stats.currency) : "-"} icon={Wallet} tone="orange" />
					<AccountStatCard label="Active orders" value={stats?.activeOrders.toString() ?? "0"} hint={stats && stats.activeOrders > 0 ? "In progress or on the way" : "Nothing in transit"} icon={Truck} tone={stats && stats.activeOrders > 0 ? "orange" : "green"} />
				</div>
			) : null}

			<div>
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-base font-semibold text-slate-900">Recent orders</h3>
					{orders && orders.length > 0 ? (
						<Link href="/account/orders" className="flex items-center gap-1 text-sm font-medium text-stone-600 transition hover:text-stone-700">
							View all
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					) : null}
				</div>

				<div className="mt-4">
					{orders === null ? (
						<p className="text-sm text-slate-500">Loading your orders...</p>
					) : orders.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
							<p className="text-sm text-slate-600">You haven&apos;t placed any orders yet.</p>
							<Button asChild variant="primary">
								<Link href="/shop">Start shopping</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							{recentOrders.map((order) => (
								<Link key={order.id} href={`/account/orders?order=${order.orderNumber}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
									<div className="min-w-0">
										<p className="font-semibold text-slate-900">{order.orderNumber}</p>
										<p className="mt-0.5 truncate text-sm text-slate-500">
											{order.items
												.slice(0, 2)
												.map((item) => item.product?.name ?? "Product")
												.join(", ")}
											{order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
										</p>
									</div>
									<div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
										<OrderStatusBadge status={order.status} />
										<p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total, order.currency)}</p>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>

			<div>
				<h3 className="text-base font-semibold text-slate-900">Quick actions</h3>
				<div className="mt-4 grid gap-3 sm:grid-cols-2">
					<Link href="/account/addresses" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
							<MapPin className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-slate-900">{hasAddress ? "Manage your address" : "Add a shipping address"}</span>
							<span className="block truncate text-xs text-slate-500">{hasAddress ? "Update where orders are delivered" : "Speed up checkout next time"}</span>
						</span>
					</Link>
					<Link href="/account/profile" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
							<UserRound className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-slate-900">Edit profile</span>
							<span className="block truncate text-xs text-slate-500">Name, phone, and password</span>
						</span>
					</Link>
					<Link href="/shop" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
							<ShoppingBag className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-slate-900">Continue shopping</span>
							<span className="block truncate text-xs text-slate-500">Browse the full collection</span>
						</span>
					</Link>
					<Link href="/contact" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
							<MessageCircle className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-slate-900">Need help?</span>
							<span className="block truncate text-xs text-slate-500">Contact our support team</span>
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
