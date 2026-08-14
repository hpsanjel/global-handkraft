"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountPageHeader } from "@/components/account/account-page-header";
import { MandapInquiryThread, type MandapInquiryThreadMessage } from "@/components/mandap-inquiry-thread";
import { FormattedText } from "@/components/formatted-text";
import { InlineAlert } from "@/components/ui/inline-alert";

type AccountMandapInquiry = {
	id: string;
	productName: string;
	category: string;
	length: string;
	width: string;
	height: string;
	material: string;
	expectedCostRange: string;
	description: string;
	status: string;
	paymentStatus: string;
	adminNote: string | null;
	quotedPrice: number | null;
	stripePaymentLink: string | null;
	createdAt: string;
	messages: MandapInquiryThreadMessage[];
};

export default function AccountCustomRequestsPage() {
	const [inquiries, setInquiries] = useState<AccountMandapInquiry[] | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		const loadInquiries = async () => {
			try {
				const response = await fetch("/api/account/mandap-inquiries", { cache: "no-store" });
				const payload = (await response.json()) as AccountMandapInquiry[] | { error?: string };

				if (!active) {
					return;
				}

				if (!response.ok || !Array.isArray(payload)) {
					throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to load custom requests.");
				}

				setInquiries(payload);
			} catch (err) {
				if (active) {
					setError(err instanceof Error ? err.message : "Unable to load custom requests.");
				}
			}
		};

		void loadInquiries();

		return () => {
			active = false;
		};
	}, []);

	const getPaymentStatusBadge = (paymentStatus: string) => {
		switch (paymentStatus) {
			case "PENDING":
				return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-yellow-700">Pending Response</span>;
			case "ACCEPTED":
				return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-green-700">Payment Accepted</span>;
			case "DECLINED":
				return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-red-700">Payment Declined</span>;
			case "PAID":
				return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-700">Paid</span>;
			default:
				return null;
		}
	};

	const handleAcceptPayment = async (inquiryId: string) => {
		try {
			const response = await fetch(`/api/account/mandap-inquiries/${inquiryId}/payment-response`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentStatus: "ACCEPTED" }),
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to accept payment.");
			}
			// Reload inquiries
			window.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to accept payment.");
		}
	};

	const handleDeclinePayment = async (inquiryId: string) => {
		const note = prompt("Please provide a reason for declining (optional):");
		try {
			const response = await fetch(`/api/account/mandap-inquiries/${inquiryId}/payment-response`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentStatus: "DECLINED", customerResponseNote: note || "" }),
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to decline payment.");
			}
			// Reload inquiries
			window.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to decline payment.");
		}
	};

	return (
		<div className="space-y-6">
			<AccountPageHeader title="Custom Requests" description="Track and reply to your custom Mandap & Temple order requests." />

			{error ? (
				<InlineAlert tone="error" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
					{error}
				</InlineAlert>
			) : null}

			{!inquiries && !error ? <p className="text-sm text-slate-500">Loading your requests...</p> : null}

			{inquiries && inquiries.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
					<p className="text-sm text-slate-600">You haven't submitted any custom Mandap or Temple requests yet.</p>
					<Button asChild variant="primary">
						<Link href="/shop">Shop Now</Link>
					</Button>
				</div>
			) : null}

			{inquiries && inquiries.length > 0 ? (
				<div className="space-y-4">
					{inquiries.map((inquiry) => (
						<div key={inquiry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<div className="flex items-center gap-2">
										<p className="font-semibold text-slate-900">{inquiry.productName}</p>
										<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">{inquiry.category}</span>
									</div>
									<p className="mt-1 text-sm text-slate-600">
										{inquiry.length} x {inquiry.width} x {inquiry.height} · {inquiry.material}
									</p>
									<p className="text-sm text-slate-500">Budget: {inquiry.expectedCostRange}</p>
								</div>
								<div className="text-right">
									{getPaymentStatusBadge(inquiry.paymentStatus)}
									<p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-600">
										{new Date(inquiry.createdAt).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</p>
								</div>
							</div>

							<FormattedText text={inquiry.description} className="mt-3 text-sm leading-6 text-slate-600" />

							{inquiry.quotedPrice && <p className="mt-2 text-sm font-medium text-slate-700">Quoted Price: NOK {inquiry.quotedPrice.toFixed(2)}</p>}

							{inquiry.adminNote && (
								<div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Note</p>
									<FormattedText text={inquiry.adminNote} className="mt-1 text-sm text-slate-700" />
								</div>
							)}

							{inquiry.paymentStatus === "ACCEPTED" && inquiry.stripePaymentLink && (
								<div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
									<p className="text-sm font-medium text-green-800">Your custom design request has been accepted!</p>
									<p className="mt-1 text-sm text-green-700">Please complete the payment to confirm your order.</p>
									<a href={inquiry.stripePaymentLink} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700">
										Pay Now
									</a>
								</div>
							)}

							{inquiry.paymentStatus === "DECLINED" && (
								<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
									<p className="text-sm font-medium text-red-800">This request has been declined.</p>
									{inquiry.adminNote && <FormattedText text={inquiry.adminNote} className="mt-1 text-sm text-red-700" />}
								</div>
							)}

							<MandapInquiryThread inquiryId={inquiry.id} messages={inquiry.messages} postUrl={`/api/account/mandap-inquiries/${inquiry.id}/messages`} viewerRole="CUSTOMER" />
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
