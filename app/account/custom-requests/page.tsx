"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountPageHeader } from "@/components/account/account-page-header";
import { MandapInquiryThread, type MandapInquiryThreadMessage } from "@/components/mandap-inquiry-thread";

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

	return (
		<div className="space-y-6">
			<AccountPageHeader title="Custom Requests" description="Track and reply to your custom Mandap & Temple order requests." />

			{error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

			{!inquiries && !error ? <p className="text-sm text-slate-500">Loading your requests...</p> : null}

			{inquiries && inquiries.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
					<p className="text-sm text-slate-600">You haven&apos;t submitted any custom Mandap or Temple requests yet.</p>
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
								<p className="text-xs uppercase tracking-[0.2em] text-slate-400">
									{new Date(inquiry.createdAt).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})}
								</p>
							</div>

							<p className="mt-3 text-sm leading-6 text-slate-600">{inquiry.description}</p>

							<MandapInquiryThread messages={inquiry.messages} postUrl={`/api/account/mandap-inquiries/${inquiry.id}/messages`} viewerRole="CUSTOMER" />
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
