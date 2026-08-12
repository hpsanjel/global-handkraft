"use client";

import Link from "next/link";
import { Clock, Inbox, Star, AlertTriangle, MessageSquare, ArrowRight } from "lucide-react";
import type { DashboardActionItem } from "@/lib/admin-dashboard";

const ICON_MAP = {
	Clock,
	Inbox,
	Star,
	AlertTriangle,
	MessageSquare,
};

const TONE_STYLES = {
	red: "bg-red-50 text-red-700 border-red-200",
	orange: "bg-orange-50 text-orange-700 border-orange-200",
	blue: "bg-sky-50 text-sky-700 border-sky-200",
	amber: "bg-amber-50 text-amber-700 border-amber-200",
};

export function ActionCenter({ actions }: { actions: DashboardActionItem[] }) {
	if (actions.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-base font-semibold text-slate-900">Action center</h3>
				<div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
					<p className="text-sm text-slate-500">All caught up!</p>
					<p className="mt-1 text-xs text-slate-400">No pending actions</p>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h3 className="text-base font-semibold text-slate-900">Action center</h3>
			<p className="mt-0.5 text-sm text-slate-500">{actions.length} items need your attention</p>

			<div className="mt-4 space-y-2">
				{actions.map((action) => {
					const Icon = ICON_MAP[action.tone as keyof typeof ICON_MAP] || AlertTriangle;
					const toneStyle = TONE_STYLES[action.tone];

					return (
						<Link
							key={action.type}
							href={action.href}
							className={`flex items-center gap-3 rounded-xl border p-4 transition hover:shadow-md ${toneStyle}`}
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60">
								<Icon className="h-5 w-5" />
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-sm font-medium">{action.label}</span>
								<span className="text-xs opacity-80">{action.count} {action.count === 1 ? 'item' : 'items'}</span>
							</span>
							<ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
						</Link>
					);
				})}
			</div>
		</div>
	);
}
