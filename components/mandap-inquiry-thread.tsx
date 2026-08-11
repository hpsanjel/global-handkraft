"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { RichTextarea } from "@/components/rich-textarea";
import { FormattedText } from "@/components/formatted-text";

export type MandapInquiryThreadMessage = {
	id: string;
	sender: string;
	message: string;
	attachments?: string[];
	createdAt: string;
};

type Props = {
	messages: MandapInquiryThreadMessage[];
	postUrl: string;
	viewerRole: "ADMIN" | "CUSTOMER";
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

function formatTimestamp(value: string) {
	return new Date(value).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit",
		timeZone: "Europe/Oslo",
	});
}

export function MandapInquiryThread({ messages: initialMessages, postUrl, viewerRole }: Props) {
	const [messages, setMessages] = useState(initialMessages);
	const [draft, setDraft] = useState("");
	const [attachment, setAttachment] = useState<File | null>(null);
	const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		if (!file) {
			setAttachment(null);
			setAttachmentPreview(null);
			return;
		}

		if (!file.type.startsWith("image/")) {
			setFeedback({ type: "error", message: "Only image files can be attached." });
			event.target.value = "";
			return;
		}

		if (file.size > MAX_ATTACHMENT_BYTES) {
			setFeedback({ type: "error", message: "Attached image must be 3MB or smaller." });
			event.target.value = "";
			return;
		}

		setFeedback(null);
		setAttachment(file);
		setAttachmentPreview(URL.createObjectURL(file));
	};

	const clearAttachment = () => {
		setAttachment(null);
		setAttachmentPreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSend = async () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		setIsSending(true);
		setFeedback(null);

		try {
			const formData = new FormData();
			formData.append("message", trimmed);
			if (attachment) {
				formData.append("attachment", attachment);
			}

			const response = await fetch(postUrl, {
				method: "POST",
				body: formData,
			});
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to send message.");
			}

			setMessages((current) => [...current, payload as MandapInquiryThreadMessage]);
			setDraft("");
			clearAttachment();
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
								<FormattedText text={msg.message} className="mt-0.5 text-sm text-slate-700" />
								{msg.attachments && msg.attachments.length > 0 ? (
									<div className="mt-2 flex flex-wrap gap-2">
										{msg.attachments.map((url) => (
											<a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
												<Image src={url} alt="Message attachment" width={80} height={80} className="h-full w-full object-cover" unoptimized />
											</a>
										))}
									</div>
								) : null}
								<p className="mt-0.5 text-xs text-slate-400">{formatTimestamp(msg.createdAt)}</p>
							</li>
						);
					})}
				</ol>
			) : (
				<p className="mt-3 text-sm text-slate-500">No messages yet.</p>
			)}

			<div className="mt-4 space-y-2">
				<RichTextarea
					value={draft}
					onChange={setDraft}
					disabled={isSending}
					placeholder={viewerRole === "ADMIN" ? "Reply to this request..." : "Write a message..."}
					minRows={2}
					showToolbar={viewerRole === "ADMIN"}
				/>

				{attachmentPreview ? (
					<div className="flex items-center gap-2">
						<div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
							<Image src={attachmentPreview} alt="Attachment preview" width={64} height={64} className="h-full w-full object-cover" unoptimized />
						</div>
						<button type="button" onClick={clearAttachment} disabled={isSending} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
							Remove
						</button>
					</div>
				) : null}

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => void handleSend()}
						disabled={isSending || !draft.trim()}
						className="rounded-lg bg-[#1B365D] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#152a4a] disabled:opacity-50"
					>
						{isSending ? "Sending..." : "Send"}
					</button>
					<label className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
						{attachment ? "Change image" : "Attach image (max 3MB)"}
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleAttachmentChange} disabled={isSending} className="hidden" />
					</label>
					{feedback ? <p className={`text-xs ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>{feedback.message}</p> : null}
				</div>
			</div>
		</div>
	);
}
