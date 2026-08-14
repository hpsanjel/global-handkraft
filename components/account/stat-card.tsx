import type { LucideIcon } from "lucide-react";

const TONE_CLASSES = {
	neutral: "bg-slate-100 text-slate-600",
	orange: "bg-stone-100 text-stone-700",
	green: "bg-emerald-50 text-emerald-600",
	red: "bg-red-50 text-red-600",
} as const;

export function AccountStatCard({ label, value, icon: Icon, tone = "neutral", hint }: { label: string; value: string; icon: LucideIcon; tone?: keyof typeof TONE_CLASSES; hint?: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-slate-500">{label}</p>
					<p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
					{hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
				</div>
				<span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
					<Icon className="h-5 w-5" />
				</span>
			</div>
		</div>
	);
}
