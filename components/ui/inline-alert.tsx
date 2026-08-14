import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineAlertTone = "error" | "success" | "info";

const toneStyles: Record<InlineAlertTone, string> = {
	error: "text-red-700",
	success: "text-emerald-700",
	info: "text-stone-700",
};

const toneIcons: Record<InlineAlertTone, React.ElementType> = {
	error: AlertCircle,
	success: CheckCircle2,
	info: Info,
};

export function InlineAlert({ tone, children, className, icon = true }: { tone: InlineAlertTone; children: React.ReactNode; className?: string; icon?: boolean }) {
	const role = tone === "error" ? "alert" : "status";
	const ariaLive = tone === "error" ? "assertive" : "polite";
	const Icon = toneIcons[tone];

	return (
		<p role={role} aria-live={ariaLive} className={cn("flex items-start gap-1.5 text-xs font-medium", toneStyles[tone], className)}>
			{icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
			<span>{children}</span>
		</p>
	);
}
