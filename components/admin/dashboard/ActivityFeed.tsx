"use client";

import Link from "next/link";
import { ShoppingCart, Star, Inbox, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/admin-dashboard-utils";
import type { DashboardActivity } from "@/lib/admin-dashboard";

const ICON_MAP = {
	order: ShoppingCart,
	review: Star,
	inquiry: Inbox,
	contact: MessageSquare,
};

const ICON_COLORS = {
	order: "bg-sky-50 text-sky-700",
	review: "bg-amber-50 text-amber-700",
	inquiry: "bg-indigo-50 text-indigo-700",
	contact: "bg-emerald-50 text-emerald-700",
};

export function ActivityFeed({ activities }: { activities: DashboardActivity[] }) {
	if (activities.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
				<p className="mt-4 text-sm text-slate-500">No recent activity.</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
			<p className="mt-0.5 text-sm text-slate-500">Latest orders and updates</p>

			<div className="mt-4 space-y-3">
				{activities.map((activity) => {
					const Icon = ICON_MAP[activity.type] || ShoppingCart;
					const iconColor = ICON_COLORS[activity.type] || ICON_COLORS.order;

					return (
						<Link
							key={activity.id}
							href={activity.href || "#"}
							className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-slate-50"
						>
							<span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
								<Icon className="h-4 w-4" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-slate-900">{activity.title}</p>
								<p className="mt-0.5 truncate text-xs text-slate-600">{activity.description}</p>
							</div>
							<span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{formatRelativeTime(activity.timestamp)}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
