"use client";

import { useState } from "react";
import { MandapInquiryStatusBadge } from "@/components/mandap-inquiry-status-badge";
import { RichTextarea } from "@/components/rich-textarea";
import { InlineAlert } from "@/components/ui/inline-alert";

type Inquiry = {
	id: string;
	productName: string;
	paymentStatus: string;
	adminNote: string | null;
	quotedPrice: number | null;
	stripePaymentLink: string | null;
};

type Props = {
	inquiry: Inquiry;
	onUpdate?: () => void;
};

export function MandapInquiryPaymentControl({ inquiry, onUpdate }: Props) {
	const [paymentStatus, setPaymentStatus] = useState(inquiry.paymentStatus);
	const [adminNote, setAdminNote] = useState(inquiry.adminNote || "");
	const [quotedPrice, setQuotedPrice] = useState(inquiry.quotedPrice?.toString() || "");
	const [stripePaymentLink, setStripePaymentLink] = useState(inquiry.stripePaymentLink || "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGeneratingLink, setIsGeneratingLink] = useState(false);
	const [successNotice, setSuccessNotice] = useState("");
	const [error, setError] = useState("");

	const handleGeneratePaymentLink = async () => {
		const parsedPrice = parseFloat(quotedPrice);
		if (!parsedPrice || parsedPrice <= 0) {
			setError("Please enter a valid quoted price (NOK) before generating a Stripe payment link.");
			return;
		}

		setIsGeneratingLink(true);
		setError("");
		setSuccessNotice("");

		try {
			const response = await fetch(`/api/admin/mandap-inquiries/${inquiry.id}/payment-link`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quotedPrice: parsedPrice }),
			});

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error ?? "Failed to generate Stripe payment link.");
			}

			setStripePaymentLink(payload.stripePaymentLink);
			setSuccessNotice("Stripe payment link generated successfully!");
			onUpdate?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to generate payment link.");
		} finally {
			setIsGeneratingLink(false);
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError("");
		setSuccessNotice("");

		try {
			const response = await fetch(`/api/admin/mandap-inquiries/${inquiry.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					paymentStatus,
					adminNote: adminNote || undefined,
					quotedPrice: quotedPrice ? parseFloat(quotedPrice) : undefined,
					stripePaymentLink: stripePaymentLink || undefined,
				}),
			});

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to update inquiry.");
			}

			setSuccessNotice("Changes saved successfully!");
			onUpdate?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to update inquiry.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-slate-900">Custom Order Request Management</h4>
				<MandapInquiryStatusBadge status={paymentStatus} />
			</div>

			<div className="mt-4 space-y-3">
				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Request Status</label>
					<select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100">
						<option value="PENDING">Pending</option>
						<option value="ACCEPTED">Request Accepted</option>
						<option value="PAID">Paid</option>
						<option value="DECLINED">Request Declined</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Quoted Price (NOK)</label>
					<input type="number" step="0.01" value={quotedPrice} onChange={(e) => setQuotedPrice(e.target.value)} placeholder="Enter price" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
				</div>

				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Admin Note</label>
					<div className="mt-1">
						<RichTextarea value={adminNote} onChange={setAdminNote} minRows={3} placeholder="Add a note for the customer..." showToolbar disabled={isSubmitting} />
					</div>
				</div>

				{paymentStatus === "ACCEPTED" && (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Stripe Payment Link</label>
							<button
								type="button"
								onClick={handleGeneratePaymentLink}
								disabled={isGeneratingLink || isSubmitting || !quotedPrice}
								className="text-xs font-medium text-[#1B365D] hover:underline disabled:opacity-50"
							>
								{isGeneratingLink ? "Generating..." : "⚡ Auto-generate Link via Stripe"}
							</button>
						</div>
						<div className="flex gap-2">
							<input
								type="url"
								value={stripePaymentLink}
								onChange={(e) => setStripePaymentLink(e.target.value)}
								placeholder="https://buy.stripe.com/... or https://checkout.stripe.com/..."
								className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
							/>
							{stripePaymentLink ? (
								<a
									href={stripePaymentLink}
									target="_blank"
									rel="noreferrer"
									className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
								>
									Test Link
								</a>
							) : null}
						</div>
						<p className="text-xs text-slate-500">
							When set, the buyer receives an email notification containing this link and a &quot;Pay Now&quot; button to confirm their order.
						</p>
					</div>
				)}

				{successNotice && <InlineAlert tone="success">{successNotice}</InlineAlert>}
				{error && <InlineAlert tone="error">{error}</InlineAlert>}

				<button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#152a4a] disabled:opacity-50">
					{isSubmitting ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</div>
	);
}
