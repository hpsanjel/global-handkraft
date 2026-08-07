"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountPageHeader } from "@/components/account/account-page-header";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";

type ShippingAddress = {
	fullName: string;
	phone: string;
	email: string;
	country: string;
	address: string;
	postalCode: string;
	city: string;
	companyName: string;
	vatNumber: string;
	notes: string;
};

const emptyAddress: ShippingAddress = {
	fullName: "",
	phone: "",
	email: "",
	country: "",
	address: "",
	postalCode: "",
	city: "",
	companyName: "",
	vatNumber: "",
	notes: "",
};

export default function AccountAddressesPage() {
	const [supabase] = useState(() => createClient());
	const [form, setForm] = useState<ShippingAddress>(emptyAddress);
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (!data.user) {
				return;
			}
			const savedAddress = data.user.user_metadata?.shipping_address as Partial<ShippingAddress> | undefined;
			setForm({
				...emptyAddress,
				email: data.user.email ?? "",
				fullName: (data.user.user_metadata?.full_name as string | undefined) ?? "",
				...savedAddress,
			});
		});
	}, [supabase]);

	const updateField = (key: keyof ShippingAddress, value: string) => {
		setFeedback(null);
		setForm((current) => ({ ...current, [key]: value }));
	};

	const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!form.fullName.trim() || !form.address.trim() || !form.city.trim() || !form.postalCode.trim() || !form.country.trim()) {
			setFeedback({ type: "error", message: "Please fill in full name, address, city, postal code, and country." });
			return;
		}

		setIsSaving(true);
		const { error } = await supabase.auth.updateUser({
			data: { shipping_address: form },
		});
		setIsSaving(false);

		if (error) {
			setFeedback({ type: "error", message: error.message });
			return;
		}

		setFeedback({ type: "success", message: "Your shipping address has been saved." });
	};

	return (
		<div className="space-y-6">
			<AccountPageHeader title="Shipping Address" description="This address will be used to pre-fill delivery details when you place an order." />

			{feedback ? <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}

			<form onSubmit={saveAddress} className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Full name</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Phone</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Email</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Country</span>
						<select value={form.country} onChange={(event) => updateField("country", event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100">
							<option value="">Select a country</option>
							{SHIPPING_COUNTRIES.map((country) => (
								<option key={country.code} value={country.code}>
									{country.name}
								</option>
							))}
						</select>
					</label>
				</div>
				<label className="block space-y-2 text-sm text-slate-600">
					<span className="font-medium text-slate-700">Address</span>
					<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Street address" />
				</label>
				<div className="grid gap-4 md:grid-cols-2">
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">City</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Postal code</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Company name (optional)</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} />
					</label>
					<label className="space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">VAT number (optional)</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.vatNumber} onChange={(event) => updateField("vatNumber", event.target.value)} />
					</label>
				</div>
				<label className="block space-y-2 text-sm text-slate-600">
					<span className="font-medium text-slate-700">Delivery notes (optional)</span>
					<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Gate code, preferred delivery time, etc." />
				</label>

				<div className="flex justify-end">
					<Button type="submit" variant="primary" disabled={isSaving}>
						{isSaving ? "Saving..." : "Save address"}
					</Button>
				</div>
			</form>
		</div>
	);
}
