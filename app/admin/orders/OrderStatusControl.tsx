"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/order-status";

type Props = {
	orderId: string;
	currentStatus: string;
};

export function OrderStatusControl({ orderId, currentStatus }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState(currentStatus);
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const handleChange = async (nextStatus: string) => {
		const previousStatus = status;
		setStatus(nextStatus);
		setIsSaving(true);
		setFeedback(null);

		try {
			const response = await fetch("/api/admin/orders", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderId, status: nextStatus }),
			});
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to update status.");
			}

			setFeedback({ type: "success", message: "Status updated — customer notified." });
			router.refresh();
		} catch (error) {
			setStatus(previousStatus);
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to update status." });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col items-start gap-1 sm:items-end">
			<select
				value={status}
				disabled={isSaving}
				onChange={(event) => void handleChange(event.target.value)}
				className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-700 disabled:opacity-60"
			>
				{ORDER_STATUSES.map((value) => (
					<option key={value} value={value}>
						{ORDER_STATUS_META[value].label}
					</option>
				))}
			</select>
			{feedback ? <p className={`text-xs ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>{feedback.message}</p> : null}
		</div>
	);
}
