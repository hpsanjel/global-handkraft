"use client";

import { useState } from "react";

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
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError("");

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

			onUpdate?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to update inquiry.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-yellow-700">Pending Response</span>;
			case "ACCEPTED":
				return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-green-700">Request Accepted</span>;
			case "DECLINED":
				return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-red-700">Request Declined</span>;
			case "PAID":
				return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-700">Paid</span>;
			default:
				return null;
		}
	};

	return (
		<div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-slate-900">Custom Order Request Management</h4>
				{getStatusBadge(paymentStatus)}
			</div>

			<div className="mt-4 space-y-3">
				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Request Status</label>
					<select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100">
						<option value="PENDING">Pending</option>
						<option value="ACCEPTED">Request Accepted</option>
						<option value="DECLINED">Request Declined</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Quoted Price (NOK)</label>
					<input type="number" step="0.01" value={quotedPrice} onChange={(e) => setQuotedPrice(e.target.value)} placeholder="Enter price" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				</div>

				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Admin Note</label>
					<textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} placeholder="Add a note for the customer..." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				</div>

				{paymentStatus === "ACCEPTED" && (
					<div>
						<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Stripe Payment Link</label>
						<input type="url" value={stripePaymentLink} onChange={(e) => setStripePaymentLink(e.target.value)} placeholder="https://checkout.stripe.com/..." className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
					</div>
				)}

				{error && <p className="text-sm text-red-600">{error}</p>}

				<button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#152a4a] disabled:opacity-50">
					{isSubmitting ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</div>
	);
}
