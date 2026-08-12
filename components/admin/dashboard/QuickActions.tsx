"use client";

import Link from "next/link";
import { Package, ShoppingCart, Tags, Ticket, Star, Quote, Settings, ArrowRight } from "lucide-react";

const QUICK_ACTIONS = [
	{ href: "/admin/products", label: "Add product", description: "Create new listing", icon: Package },
	{ href: "/admin/orders", label: "Process orders", description: "Fulfill pending", icon: ShoppingCart },
	{ href: "/admin/categories", label: "Organize catalog", description: "Manage categories", icon: Tags },
	{ href: "/admin/coupons", label: "Create coupon", description: "Run promotion", icon: Ticket },
	{ href: "/admin/reviews", label: "Moderate reviews", description: "Approve pending", icon: Star },
	{ href: "/admin/testimonials", label: "Testimonials", description: "Homepage quotes", icon: Quote },
	{ href: "/admin/settings", label: "Settings", description: "Shipping & VAT", icon: Settings },
] as const;

export function QuickActions() {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h3 className="text-base font-semibold text-slate-900">Quick actions</h3>
			<p className="mt-0.5 text-sm text-slate-500">Frequent tasks</p>

			<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
				{QUICK_ACTIONS.map((action) => {
					const Icon = action.icon;
					return (
						<Link
							key={action.href}
							href={action.href}
							className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:border-stone-300 hover:shadow-md"
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
								<Icon className="h-5 w-5" />
							</span>
							<span className="text-xs font-medium text-slate-900">{action.label}</span>
							<span className="text-xs text-slate-500">{action.description}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
