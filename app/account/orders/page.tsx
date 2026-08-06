"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ORDER_STATUS_META, isOrderStatus } from "@/lib/order-status";

type AccountOrderItem = {
	id: string;
	quantity: number;
	unitPrice: number;
	addonNames: string[];
	product: { name: string } | null;
	variant: { name: string } | null;
};

type AccountOrderStatusEvent = {
	id: string;
	status: string;
	note: string | null;
	createdAt: string;
};

type AccountOrder = {
	id: string;
	orderNumber: string;
	status: string;
	total: number;
	currency: string;
	createdAt: string;
	items: AccountOrderItem[];
	statusEvents: AccountOrderStatusEvent[];
};

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency || "NOK",
	}).format(amount);
}

export default function AccountOrdersPage() {
	const [orders, setOrders] = useState<AccountOrder[] | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		const loadOrders = async () => {
			try {
				const response = await fetch("/api/account/orders", { cache: "no-store" });
				const payload = (await response.json()) as AccountOrder[] | { error?: string };

				if (!active) {
					return;
				}

				if (!response.ok || !Array.isArray(payload)) {
					throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to load orders.");
				}

				setOrders(payload);
			} catch (err) {
				if (active) {
					setError(err instanceof Error ? err.message : "Unable to load orders.");
				}
			}
		};

		void loadOrders();

		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-stone-900">My Orders</h2>
				<p className="mt-1 text-sm text-stone-500">Track your order history in chronological order.</p>
			</div>

			{error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

			{!orders && !error ? <p className="text-sm text-stone-500">Loading your orders...</p> : null}

			{orders && orders.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
					<p className="text-sm text-stone-600">You haven&apos;t placed any orders yet.</p>
					<Button asChild>
						<Link href="/shop">Shop Now</Link>
					</Button>
				</div>
			) : null}

			{orders && orders.length > 0 ? (
				<div className="space-y-4">
					{orders.map((order) => (
						<div key={order.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="font-semibold text-stone-900">{order.orderNumber}</p>
									<p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
										{new Date(order.createdAt).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</p>
								</div>
								<div className="text-right">
									<p className="font-semibold text-stone-900">{formatCurrency(order.total, order.currency)}</p>
									<div className="mt-1">
										<OrderStatusBadge status={order.status} />
									</div>
								</div>
							</div>
							<div className="mt-4 space-y-3 border-t border-stone-200 pt-4">
								{order.items.map((item) => (
									<div key={item.id} className="text-sm text-stone-700">
										<div className="flex items-center justify-between gap-3">
											<span>
												{item.product?.name ?? "Product"} · {item.variant?.name ?? "Variant"} × {item.quantity}
											</span>
											<span>{formatCurrency(item.unitPrice * item.quantity, order.currency)}</span>
										</div>
										{item.addonNames.length > 0 ? <p className="mt-0.5 pl-0 text-xs text-stone-500">Add-ons: {item.addonNames.join(", ")}</p> : null}
									</div>
								))}
							</div>
							{order.statusEvents.length > 0 ? (
								<div className="mt-4 border-t border-stone-200 pt-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Order timeline</p>
									<ol className="mt-3 space-y-3">
										{order.statusEvents.map((event, index) => (
											<li key={event.id} className="relative pl-5">
												<span
													className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${index === order.statusEvents.length - 1 ? "bg-[#1B365D]" : "bg-stone-300"}`}
												/>
												<p className="text-sm font-medium text-stone-800">{isOrderStatus(event.status) ? ORDER_STATUS_META[event.status].label : event.status}</p>
												<p className="text-xs text-stone-500">
													{new Date(event.createdAt).toLocaleString("en-GB", {
														day: "numeric",
														month: "short",
														hour: "numeric",
														minute: "2-digit",
													})}
												</p>
											</li>
										))}
									</ol>
								</div>
							) : null}
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
