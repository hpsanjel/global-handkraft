"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Landmark, MessageSquare, X } from "lucide-react";
import type { AdminMandapInquiry } from "@/lib/admin";
import { MandapInquiryStatusBadge } from "@/components/mandap-inquiry-status-badge";
import { MandapInquiryPaymentControl } from "@/components/admin/MandapInquiryPaymentControl";
import { MandapInquiryThread } from "@/components/mandap-inquiry-thread";
import { FormattedText } from "@/components/formatted-text";

function formatDate(value: string) {
	return new Date(value).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: "Europe/Oslo",
	});
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "NOK",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function CustomRequestsView({ inquiries }: { inquiries: AdminMandapInquiry[] }) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = inquiries.find((inquiry) => inquiry.id === selectedId) ?? null;

	useEffect(() => {
		if (!selected) return;

		document.body.style.overflow = "hidden";
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelectedId(null);
		};
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [selected]);

	if (inquiries.length === 0) {
		return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">No custom mandap or temple requests have been submitted yet.</div>;
	}

	return (
		<>
			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
					<div>
						<h2 className="text-base font-semibold text-slate-900">All requests</h2>
						<p className="mt-0.5 text-sm text-slate-500">Click a request to view details, respond, and manage payment.</p>
					</div>
					<p className="shrink-0 text-sm font-medium text-slate-500">{inquiries.length} requests</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-6 py-3 font-semibold">Request</th>
								<th className="px-6 py-3 font-semibold">Contact</th>
								<th className="px-6 py-3 font-semibold">Budget</th>
								<th className="px-6 py-3 font-semibold">Status</th>
								<th className="px-6 py-3 font-semibold">Messages</th>
								<th className="px-6 py-3 font-semibold">Submitted</th>
								<th className="w-10 px-3 py-3" aria-hidden="true" />
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{inquiries.map((inquiry) => (
								<tr
									key={inquiry.id}
									onClick={() => setSelectedId(inquiry.id)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setSelectedId(inquiry.id);
										}
									}}
									tabIndex={0}
									role="button"
									aria-label={`View request: ${inquiry.productName}`}
									className="cursor-pointer transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
								>
									<td className="px-6 py-3.5">
										<div className="flex items-center gap-3">
											{inquiry.sampleImages[0] ? (
												<span className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('${inquiry.sampleImages[0]}')` }} />
											) : (
												<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
													<Landmark className="h-4.5 w-4.5" />
												</span>
											)}
											<div className="min-w-0">
												<p className="truncate font-medium text-slate-900">{inquiry.productName}</p>
												<p className="truncate text-xs text-slate-500">
													{inquiry.category} · {inquiry.material}
												</p>
											</div>
										</div>
									</td>
									<td className="max-w-48 truncate px-6 py-3.5 text-slate-600">{inquiry.whatsapp || inquiry.email || "—"}</td>
									<td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{inquiry.expectedCostRange}</td>
									<td className="whitespace-nowrap px-6 py-3.5">
										<MandapInquiryStatusBadge status={inquiry.paymentStatus} />
									</td>
									<td className="whitespace-nowrap px-6 py-3.5 text-slate-600">
										<span className="inline-flex items-center gap-1.5">
											<MessageSquare className="h-3.5 w-3.5 text-slate-400" />
											{inquiry.messages.length}
										</span>
									</td>
									<td className="whitespace-nowrap px-6 py-3.5 text-xs uppercase tracking-[0.15em] text-slate-400">{formatDate(inquiry.createdAt)}</td>
									<td className="whitespace-nowrap px-3 py-3.5 text-right">
										<ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{selected ? (
				<div className="fixed inset-0 z-50">
					<button type="button" aria-label="Close request details" className="absolute inset-0 bg-black/40" onClick={() => setSelectedId(null)} />
					<aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
						<div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="truncate text-lg font-semibold text-slate-900">{selected.productName}</h2>
									<span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">{selected.category}</span>
								</div>
								<p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Submitted {formatDate(selected.createdAt)}</p>
							</div>
							<button type="button" onClick={() => setSelectedId(null)} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto px-6 py-6">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<MandapInquiryStatusBadge status={selected.paymentStatus} />
								{selected.quotedPrice ? <p className="text-sm font-semibold text-slate-900">Quoted: {formatCurrency(selected.quotedPrice)}</p> : null}
							</div>

							<dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
								<div>
									<dt className="text-xs uppercase tracking-wide text-slate-400">Dimensions</dt>
									<dd className="mt-0.5 text-slate-700">
										{selected.length} x {selected.width} x {selected.height}
									</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-wide text-slate-400">Material</dt>
									<dd className="mt-0.5 text-slate-700">{selected.material}</dd>
								</div>
								<div>
									<dt className="text-xs uppercase tracking-wide text-slate-400">Budget</dt>
									<dd className="mt-0.5 text-slate-700">{selected.expectedCostRange}</dd>
								</div>
								{selected.whatsapp ? (
									<div>
										<dt className="text-xs uppercase tracking-wide text-slate-400">WhatsApp</dt>
										<dd className="mt-0.5 text-slate-700">{selected.whatsapp}</dd>
									</div>
								) : null}
								{selected.email ? (
									<div>
										<dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
										<dd className="mt-0.5 truncate text-slate-700">
											<a href={`mailto:${selected.email}`} className="hover:underline">
												{selected.email}
											</a>
										</dd>
									</div>
								) : null}
							</dl>

							<FormattedText text={selected.description} className="mt-4 text-sm leading-6 text-slate-600" />

							{selected.sampleImages.length > 0 ? (
								<div className="mt-4 grid grid-cols-4 gap-3">
									{selected.sampleImages.map((imageUrl) => (
										<a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer" className="aspect-square rounded-xl border border-slate-200 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('${imageUrl}')` }} />
									))}
								</div>
							) : null}

							<MandapInquiryPaymentControl
								inquiry={{
									id: selected.id,
									productName: selected.productName,
									paymentStatus: selected.paymentStatus,
									adminNote: selected.adminNote,
									quotedPrice: selected.quotedPrice,
									stripePaymentLink: selected.stripePaymentLink,
								}}
								onUpdate={() => router.refresh()}
							/>

							<MandapInquiryThread inquiryId={selected.id} messages={selected.messages} postUrl={`/api/admin/mandap-inquiries/${selected.id}/messages`} viewerRole="ADMIN" />
						</div>
					</aside>
				</div>
			) : null}
		</>
	);
}
