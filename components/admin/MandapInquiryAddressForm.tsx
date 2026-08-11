"use client";

import { useState } from "react";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { MANDAP_FULFILLMENT_STATUSES, MANDAP_FULFILLMENT_STATUS_META, type MandapFulfillmentStatus } from "@/lib/mandap-fulfillment-status";

type Address = {
	fullName: string;
	phone: string;
	email: string;
	country: string;
	address: string;
	postalCode: string;
	city: string;
	companyName: string | null;
	vatNumber: string | null;
} | null;

type Props = {
	inquiryId: string;
	address: Address;
	weightKg: number | null;
	hsCode: string | null;
	incoterm: string | null;
	fulfillmentStatus: string;
	fallbackEmail: string | null;
	onUpdate?: () => void;
};

export function MandapInquiryAddressForm({ inquiryId, address, weightKg, hsCode, incoterm, fulfillmentStatus, fallbackEmail, onUpdate }: Props) {
	const [form, setForm] = useState(() => ({
		fullName: address?.fullName ?? "",
		phone: address?.phone ?? "",
		email: address?.email ?? fallbackEmail ?? "",
		country: address?.country ?? "",
		address: address?.address ?? "",
		postalCode: address?.postalCode ?? "",
		city: address?.city ?? "",
		companyName: address?.companyName ?? "",
		vatNumber: address?.vatNumber ?? "",
	}));
	const [weight, setWeight] = useState(weightKg?.toString() ?? "");
	const [hs, setHs] = useState(hsCode ?? "");
	const [incotermValue, setIncotermValue] = useState(incoterm ?? "");
	const [fulfillment, setFulfillment] = useState(fulfillmentStatus);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [saved, setSaved] = useState(false);

	const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setForm((prev) => ({ ...prev, [field]: event.target.value }));
		setSaved(false);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setError("");
		setSaved(false);

		try {
			const addressComplete = form.fullName && form.phone && form.address && form.city && form.postalCode && form.country;
			const response = await fetch(`/api/admin/mandap-inquiries/${inquiryId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...(addressComplete ? { address: form } : {}),
					weightKg: weight ? parseFloat(weight) : null,
					hsCode: hs || null,
					incoterm: incotermValue || null,
					fulfillmentStatus: fulfillment,
				}),
			});

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error ?? "Unable to save shipping details.");
			}

			setSaved(true);
			onUpdate?.();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to save shipping details.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
			<h4 className="text-sm font-semibold text-slate-900">Shipping address &amp; export details</h4>
			<p className="mt-1 text-xs text-slate-500">Required before generating customs, packing list, or shipping summary documents. The buyer can also submit this themselves once they accept the quote.</p>

			<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<input value={form.fullName} onChange={update("fullName")} placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<input value={form.phone} onChange={update("phone")} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<input value={form.email} onChange={update("email")} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<input value={form.companyName} onChange={update("companyName")} placeholder="Company name (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<input value={form.address} onChange={update("address")} placeholder="Street address" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100 sm:col-span-2" />
				<input value={form.city} onChange={update("city")} placeholder="City" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<input value={form.postalCode} onChange={update("postalCode")} placeholder="Postal code" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				<select value={form.country} onChange={update("country")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100">
					<option value="">Country…</option>
					{SHIPPING_COUNTRIES.map((country) => (
						<option key={country.code} value={country.code}>
							{country.name}
						</option>
					))}
				</select>
				<input value={form.vatNumber} onChange={update("vatNumber")} placeholder="VAT number (optional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
			</div>

			<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Weight (kg)</label>
					<input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 85" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				</div>
				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">HS code</label>
					<input value={hs} onChange={(e) => setHs(e.target.value)} placeholder="e.g. 4420" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				</div>
				<div>
					<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Incoterm</label>
					<input value={incotermValue} onChange={(e) => setIncotermValue(e.target.value)} placeholder="e.g. DAP" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
				</div>
			</div>

			<div className="mt-3">
				<label className="block text-xs font-medium uppercase tracking-wide text-slate-500">Fulfilment status</label>
				<select value={fulfillment} onChange={(e) => setFulfillment(e.target.value as MandapFulfillmentStatus)} className="mt-1 block w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-100">
					{MANDAP_FULFILLMENT_STATUSES.map((status) => (
						<option key={status} value={status}>
							{MANDAP_FULFILLMENT_STATUS_META[status].label}
						</option>
					))}
				</select>
				<p className="mt-1 text-xs text-slate-400">Independent of payment — tracks production/shipping progress. Packing list, customs invoice, and shipping summary matter most once this reaches &ldquo;Ready to ship&rdquo;.</p>
			</div>

			{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
			{saved ? <p className="mt-3 text-sm text-green-600">Saved.</p> : null}

			<button type="button" onClick={handleSubmit} disabled={isSubmitting} className="mt-3 rounded-lg bg-[#1B365D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#152a4a] disabled:opacity-50">
				{isSubmitting ? "Saving..." : "Save shipping & export details"}
			</button>
		</div>
	);
}
