export function pctChange(current: number, previous: number): number {
	if (previous <= 0) return current > 0 ? 100 : 0;
	return ((current - previous) / previous) * 100;
}

export function formatTrend(current: number, previous: number): { value: string; direction: "up" | "down" | "flat"; isPositive: boolean } {
	const change = pctChange(current, previous);
	const isPositive = change >= 0;
	const direction = Math.abs(change) < 0.5 ? "flat" : isPositive ? "up" : "down";
	return {
		value: `${isPositive ? "+" : ""}${change.toFixed(1)}%`,
		direction,
		isPositive: current >= previous,
	};
}

export function formatRelativeTime(iso: string): string {
	const date = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return `Yesterday ${date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
