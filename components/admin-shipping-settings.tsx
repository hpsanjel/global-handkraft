"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SHIPPING_ZONE_CODE, SHIPPING_COUNTRIES } from "@/lib/shipping-countries";

type ShippingZone = {
	id: string;
	country: string;
	shippingCost: number;
	freeShippingFrom: number;
};

type Feedback = {
	type: "success" | "error";
	message: string;
};

const countryNameByCode = new Map(SHIPPING_COUNTRIES.map((country) => [country.code, country.name]));

function countryLabel(code: string) {
	if (code === DEFAULT_SHIPPING_ZONE_CODE) {
		return "Default (all other countries)";
	}
	return countryNameByCode.get(code) ?? code;
}

export function AdminShippingSettings() {
	const [zones, setZones] = useState<ShippingZone[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<Feedback | null>(null);

	const [newCountry, setNewCountry] = useState("");
	const [newCost, setNewCost] = useState("");
	const [newFreeFrom, setNewFreeFrom] = useState("");

	const [editingValues, setEditingValues] = useState<Record<string, { shippingCost: string; freeShippingFrom: string }>>({});

	const configuredCountries = useMemo(() => new Set(zones.map((zone) => zone.country)), [zones]);
	const availableCountryOptions = useMemo(() => SHIPPING_COUNTRIES.filter((country) => !configuredCountries.has(country.code)), [configuredCountries]);
	const hasDefaultZone = configuredCountries.has(DEFAULT_SHIPPING_ZONE_CODE);

	const loadZones = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/admin/shipping", { cache: "no-store" });
			const payload = (await response.json()) as ShippingZone[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to load shipping zones.");
			}

			setZones(payload);
			setEditingValues(Object.fromEntries(payload.map((zone) => [zone.id, { shippingCost: String(zone.shippingCost), freeShippingFrom: String(zone.freeShippingFrom) }])));
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to load shipping zones." });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadZones();
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	const saveZone = async (country: string, shippingCost: string, freeShippingFrom: string) => {
		setFeedback(null);

		const cost = Number(shippingCost);
		const freeFrom = Number(freeShippingFrom || 0);

		if (!country) {
			setFeedback({ type: "error", message: "Select a country." });
			return;
		}

		if (!Number.isFinite(cost) || cost < 0) {
			setFeedback({ type: "error", message: "Enter a valid shipping cost." });
			return;
		}

		if (!Number.isFinite(freeFrom) || freeFrom < 0) {
			setFeedback({ type: "error", message: "Enter a valid free shipping threshold." });
			return;
		}

		try {
			setIsSaving(true);
			const response = await fetch("/api/admin/shipping", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ country, shippingCost: cost, freeShippingFrom: freeFrom }),
			});
			const payload = (await response.json()) as ShippingZone[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to save shipping rate.");
			}

			setZones(payload);
			setEditingValues(Object.fromEntries(payload.map((zone) => [zone.id, { shippingCost: String(zone.shippingCost), freeShippingFrom: String(zone.freeShippingFrom) }])));
			setNewCountry("");
			setNewCost("");
			setNewFreeFrom("");
			setFeedback({ type: "success", message: "Shipping rate saved." });
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to save shipping rate." });
		} finally {
			setIsSaving(false);
		}
	};

	const deleteZone = async (country: string) => {
		setFeedback(null);
		if (!window.confirm(`Remove the shipping rate for ${countryLabel(country)}?`)) {
			return;
		}

		try {
			setIsSaving(true);
			const response = await fetch(`/api/admin/shipping?country=${encodeURIComponent(country)}`, { method: "DELETE" });
			const payload = (await response.json()) as ShippingZone[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to remove shipping rate.");
			}

			setZones(payload);
			setEditingValues(Object.fromEntries(payload.map((zone) => [zone.id, { shippingCost: String(zone.shippingCost), freeShippingFrom: String(zone.freeShippingFrom) }])));
			setFeedback({ type: "success", message: "Shipping rate removed." });
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to remove shipping rate." });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
			<h2 className="text-xl font-semibold text-stone-900">Shipping zones</h2>
			<p className="mt-1 text-sm text-stone-500">Set a shipping rate per country. Orders from countries without a specific rate use the default rate.</p>

			{feedback ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}

			{isLoading ? (
				<p className="mt-4 text-sm text-stone-500">Loading shipping zones...</p>
			) : (
				<div className="mt-4 space-y-3">
					{zones.map((zone) => (
						<div key={zone.id} className="rounded-2xl border border-stone-200 p-4">
							<div className="flex items-center justify-between gap-3">
								<p className="font-semibold text-stone-900">{countryLabel(zone.country)}</p>
								<button type="button" onClick={() => deleteZone(zone.country)} disabled={isSaving} className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50">
									Remove
								</button>
							</div>
							<div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
								<label className="space-y-1 text-xs text-stone-500">
									<span>Shipping cost (EUR)</span>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={editingValues[zone.id]?.shippingCost ?? ""}
										onChange={(event) =>
											setEditingValues((current) => ({
												...current,
												[zone.id]: { shippingCost: event.target.value, freeShippingFrom: current[zone.id]?.freeShippingFrom ?? String(zone.freeShippingFrom) },
											}))
										}
									/>
								</label>
								<label className="space-y-1 text-xs text-stone-500">
									<span>Free shipping from (EUR, 0 to disable)</span>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={editingValues[zone.id]?.freeShippingFrom ?? ""}
										onChange={(event) =>
											setEditingValues((current) => ({
												...current,
												[zone.id]: { shippingCost: current[zone.id]?.shippingCost ?? String(zone.shippingCost), freeShippingFrom: event.target.value },
											}))
										}
									/>
								</label>
								<div className="flex items-end">
									<Button type="button" disabled={isSaving} onClick={() => saveZone(zone.country, editingValues[zone.id]?.shippingCost ?? String(zone.shippingCost), editingValues[zone.id]?.freeShippingFrom ?? String(zone.freeShippingFrom))} className="w-full sm:w-auto">
										Save
									</Button>
								</div>
							</div>
						</div>
					))}

					<div className="rounded-2xl border border-dashed border-stone-300 p-4">
						<p className="text-sm font-semibold text-stone-900">Add a rate</p>
						<div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
							<label className="space-y-1 text-xs text-stone-500">
								<span>Country</span>
								<select value={newCountry} onChange={(event) => setNewCountry(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200">
									<option value="">Select a country</option>
									{!hasDefaultZone ? <option value={DEFAULT_SHIPPING_ZONE_CODE}>Default (all other countries)</option> : null}
									{availableCountryOptions.map((country) => (
										<option key={country.code} value={country.code}>
											{country.name}
										</option>
									))}
								</select>
							</label>
							<label className="space-y-1 text-xs text-stone-500">
								<span>Shipping cost (EUR)</span>
								<Input type="number" min="0" step="0.01" value={newCost} onChange={(event) => setNewCost(event.target.value)} />
							</label>
							<label className="space-y-1 text-xs text-stone-500">
								<span>Free shipping from (EUR)</span>
								<Input type="number" min="0" step="0.01" value={newFreeFrom} onChange={(event) => setNewFreeFrom(event.target.value)} />
							</label>
							<div className="flex items-end">
								<Button type="button" disabled={isSaving || !newCountry} onClick={() => saveZone(newCountry, newCost, newFreeFrom)} className="w-full sm:w-auto">
									Add
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
