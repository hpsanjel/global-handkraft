"use client";

import { useState } from "react";

export type MandapInquiryThreadMessage = {
	id: string;
	sender: string;
	message: string;
	createdAt: string;
};

type Props = {
	messages: MandapInquiryThreadMessage[];
	postUrl: string;
	viewerRole: "ADMIN" | "CUSTOMER";
};

function formatTimestamp(value: string) {
	return new Date(value).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit",
	});
}

export function MandapInquiryThread({ messages: initialMessages, postUrl, viewerRole }: Props) {
	const [messages, setMessages] = useState(initialMessages);
	const [draft, setDraft] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const handleSend = async () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		setIsSending(true);
		setFeedback(null);

		try {
			const response = await fetch(postUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: trimmed }),
			});
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to send message.");
			}

			setMessages((current) => [...current, payload as MandapInquiryThreadMessage]);
			setDraft("");
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to send message." });
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="mt-4 border-t border-slate-200 pt-4">
			<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Conversation</p>

			{messages.length > 0 ? (
				<ol className="mt-3 space-y-3">
					{messages.map((msg) => {
						const isViewer = msg.sender === viewerRole;
						const label = isViewer ? "You" : msg.sender === "ADMIN" ? "Admin" : "Customer";
						return (
							<li key={msg.id} className="relative pl-5">
								<span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${msg.sender === "ADMIN" ? "bg-[#1B365D]" : "bg-[#4CAF50]"}`} />
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
								<p className="mt-0.5 text-sm text-slate-700">{msg.message}</p>
								<p className="mt-0.5 text-xs text-slate-400">{formatTimestamp(msg.createdAt)}</p>
							</li>
						);
					})}
				</ol>
			) : (
				<p className="mt-3 text-sm text-slate-500">No messages yet.</p>
			)}

			<div className="mt-4 space-y-2">
				<textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					disabled={isSending}
					placeholder={viewerRole === "ADMIN" ? "Reply to this request..." : "Write a message..."}
					rows={2}
					className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100 disabled:opacity-60"
				/>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => void handleSend()}
						disabled={isSending || !draft.trim()}
						className="rounded-lg bg-[#1B365D] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#152a4a] disabled:opacity-50"
					>
						{isSending ? "Sending..." : "Send"}
					</button>
					{feedback ? <p className={`text-xs ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>{feedback.message}</p> : null}
				</div>
			</div>
		</div>
	);
}
