"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { refreshTestimonialsCatalog } from "@/lib/testimonials-catalog";

type AdminTestimonial = {
	id: string;
	name: string;
	quote: string;
	rating: number;
	active: boolean;
	imagePath: string | null;
	imageUrl: string | null;
	createdAt: string;
};

type Feedback = {
	type: "success" | "error";
	message: string;
};

type EditableFields = {
	name: string;
	quote: string;
	rating: number;
	active: boolean;
};

function toEditable(testimonial: AdminTestimonial): EditableFields {
	return { name: testimonial.name, quote: testimonial.quote, rating: testimonial.rating, active: testimonial.active };
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
	return (
		<div className="flex items-center gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} star${star > 1 ? "s" : ""}`} className="p-0.5">
					<Star className={`h-5 w-5 ${star <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`} />
				</button>
			))}
		</div>
	);
}

const emptyDraft: EditableFields = { name: "", quote: "", rating: 5, active: true };

export default function AdminTestimonialsPage() {
	const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
	const [newTestimonial, setNewTestimonial] = useState<EditableFields>(emptyDraft);
	const [newImage, setNewImage] = useState<File | null>(null);
	const [newImageInputKey, setNewImageInputKey] = useState(0);
	const [editingFields, setEditingFields] = useState<Record<string, EditableFields>>({});
	const [editingImages, setEditingImages] = useState<Record<string, File | null>>({});
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setIsLoading(true);
			try {
				const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
				const payload = (await response.json()) as AdminTestimonial[] | { error?: string };

				if (!response.ok || !Array.isArray(payload)) {
					throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to load testimonials.");
				}

				if (!cancelled) {
					setTestimonials(payload);
					setEditingFields(Object.fromEntries(payload.map((testimonial) => [testimonial.id, toEditable(testimonial)])));
				}
			} catch (error) {
				if (!cancelled) {
					setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to load testimonials." });
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const applyList = (payload: AdminTestimonial[]) => {
		setTestimonials(payload);
		setEditingFields(Object.fromEntries(payload.map((testimonial) => [testimonial.id, toEditable(testimonial)])));
	};

	const createTestimonial = async () => {
		setFeedback(null);
		if (!newTestimonial.name.trim() || !newTestimonial.quote.trim()) {
			setFeedback({ type: "error", message: "Enter a customer name and quote first." });
			return;
		}

		try {
			setIsSaving(true);
			const formData = new FormData();
			formData.append("name", newTestimonial.name);
			formData.append("quote", newTestimonial.quote);
			formData.append("rating", String(newTestimonial.rating));
			formData.append("active", String(newTestimonial.active));
			if (newImage) formData.append("image", newImage);

			const response = await fetch("/api/admin/testimonials", { method: "POST", body: formData });
			const payload = (await response.json()) as AdminTestimonial[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to create testimonial.");
			}

			applyList(payload);
			setNewTestimonial(emptyDraft);
			setNewImage(null);
			setNewImageInputKey((current) => current + 1);
			setFeedback({ type: "success", message: "Testimonial created." });
			await refreshTestimonialsCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to create testimonial." });
		} finally {
			setIsSaving(false);
		}
	};

	const updateTestimonial = async (id: string) => {
		setFeedback(null);
		const fields = editingFields[id];
		if (!fields || !fields.name.trim() || !fields.quote.trim()) {
			setFeedback({ type: "error", message: "Name and quote cannot be empty." });
			return;
		}

		try {
			setIsSaving(true);
			const selectedImage = editingImages[id] ?? null;
			const formData = new FormData();
			formData.append("id", id);
			formData.append("name", fields.name);
			formData.append("quote", fields.quote);
			formData.append("rating", String(fields.rating));
			formData.append("active", String(fields.active));
			if (selectedImage) formData.append("image", selectedImage);

			const response = await fetch("/api/admin/testimonials", { method: "PUT", body: formData });
			const payload = (await response.json()) as AdminTestimonial[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to update testimonial.");
			}

			applyList(payload);
			setEditingImages((current) => {
				const next = { ...current };
				delete next[id];
				return next;
			});
			setFeedback({ type: "success", message: "Testimonial updated." });
			await refreshTestimonialsCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to update testimonial." });
		} finally {
			setIsSaving(false);
		}
	};

	const deleteTestimonial = async (testimonial: AdminTestimonial) => {
		setFeedback(null);
		if (!window.confirm(`Delete the testimonial from "${testimonial.name}"?`)) {
			return;
		}

		try {
			setIsSaving(true);
			const response = await fetch(`/api/admin/testimonials?id=${encodeURIComponent(testimonial.id)}`, { method: "DELETE" });
			const payload = (await response.json()) as AdminTestimonial[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to delete testimonial.");
			}

			applyList(payload);
			setFeedback({ type: "success", message: "Testimonial deleted." });
			await refreshTestimonialsCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to delete testimonial." });
		} finally {
			setIsSaving(false);
		}
	};

	const saveOrder = async (orderedIds: string[]) => {
		try {
			setIsSaving(true);
			const response = await fetch("/api/admin/testimonials", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			});
			const payload = (await response.json()) as AdminTestimonial[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to save testimonial order.");
			}

			applyList(payload);
			setFeedback({ type: "success", message: "Testimonial order updated." });
			await refreshTestimonialsCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to save testimonial order." });
		} finally {
			setIsSaving(false);
		}
	};

	const moveTestimonial = (sourceId: string, targetId: string) => {
		if (sourceId === targetId) return;

		const sourceIndex = testimonials.findIndex((testimonial) => testimonial.id === sourceId);
		const targetIndex = testimonials.findIndex((testimonial) => testimonial.id === targetId);
		if (sourceIndex < 0 || targetIndex < 0) return;

		const reordered = [...testimonials];
		const [moved] = reordered.splice(sourceIndex, 1);
		reordered.splice(targetIndex, 0, moved);

		setTestimonials(reordered);
		void saveOrder(reordered.map((testimonial) => testimonial.id));
	};

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Testimonials" description="Manage the customer testimonials shown on the homepage." />

			<div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Add testimonial</h2>
					<p className="mt-1 text-sm text-slate-500">{testimonials.length} testimonial(s) total</p>
					<div className="mt-5 space-y-3">
						<label className="space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Customer name</span>
							<input value={newTestimonial.name} onChange={(event) => setNewTestimonial((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Saroj Thapa, Oslo" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
						</label>
						<label className="space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Quote</span>
							<textarea value={newTestimonial.quote} onChange={(event) => setNewTestimonial((current) => ({ ...current, quote: event.target.value }))} rows={3} placeholder="What did the customer say?" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
						</label>
						<div>
							<span className="mb-2 block text-sm font-medium text-slate-700">Rating</span>
							<StarPicker value={newTestimonial.rating} onChange={(rating) => setNewTestimonial((current) => ({ ...current, rating }))} />
						</div>
						<label className="space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Photo (optional)</span>
							<input key={newImageInputKey} type="file" accept="image/*" onChange={(event) => setNewImage(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
						</label>
						<div className="flex items-center gap-2">
							<input type="checkbox" id="new-active" checked={newTestimonial.active} onChange={(event) => setNewTestimonial((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 accent-stone-600" />
							<label htmlFor="new-active" className="text-sm font-medium text-slate-700">
								Show on homepage
							</label>
						</div>
						<Button variant="primary" onClick={createTestimonial} disabled={isSaving} className="mt-2">
							{isSaving ? "Saving..." : "Add testimonial"}
						</Button>
					</div>
					{feedback ? <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Existing testimonials</h2>
					<p className="mt-1 text-sm text-slate-500">Drag to reorder. Toggle visibility, edit, or delete.</p>
					<div className="mt-5 space-y-3">
						{isLoading ? <p className="text-sm text-slate-500">Loading testimonials...</p> : null}
						{!isLoading && testimonials.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No testimonials yet. Add your first one.</p> : null}
						{testimonials.map((testimonial) => {
							const fields = editingFields[testimonial.id] ?? toEditable(testimonial);
							return (
								<div
									key={testimonial.id}
									className={`rounded-xl border bg-slate-50 p-4 ${draggingId === testimonial.id ? "border-stone-400" : "border-slate-200"}`}
									draggable={!isSaving && testimonials.length > 1}
									onDragStart={() => setDraggingId(testimonial.id)}
									onDragEnd={() => setDraggingId(null)}
									onDragOver={(event) => event.preventDefault()}
									onDrop={(event) => {
										event.preventDefault();
										if (draggingId && !isSaving) {
											moveTestimonial(draggingId, testimonial.id);
										}
										setDraggingId(null);
									}}
								>
									<div className="mb-3 flex items-center justify-between">
										<span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Drag to reorder</span>
										<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${testimonial.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{testimonial.active ? "Visible" : "Hidden"}</span>
									</div>

									{testimonial.imageUrl ? (
										<div className="mb-3">
											<Image src={testimonial.imageUrl} alt={`${testimonial.name} photo`} width={56} height={56} className="h-14 w-14 rounded-full border border-slate-200 object-cover" unoptimized />
										</div>
									) : null}

									<div className="space-y-3">
										<input
											value={fields.name}
											onChange={(event) => setEditingFields((current) => ({ ...current, [testimonial.id]: { ...fields, name: event.target.value } }))}
											className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100"
										/>
										<textarea
											value={fields.quote}
											onChange={(event) => setEditingFields((current) => ({ ...current, [testimonial.id]: { ...fields, quote: event.target.value } }))}
											rows={3}
											className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100"
										/>
										<StarPicker value={fields.rating} onChange={(rating) => setEditingFields((current) => ({ ...current, [testimonial.id]: { ...fields, rating } }))} />
										<label className="block space-y-2 text-sm text-slate-600">
											<span className="font-medium text-slate-700">Replace photo (optional)</span>
											<input
												type="file"
												accept="image/*"
												onChange={(event) =>
													setEditingImages((current) => ({
														...current,
														[testimonial.id]: event.target.files?.[0] ?? null,
													}))
												}
												className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
											/>
										</label>
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												id={`active-${testimonial.id}`}
												checked={fields.active}
												onChange={(event) => setEditingFields((current) => ({ ...current, [testimonial.id]: { ...fields, active: event.target.checked } }))}
												className="h-4 w-4 rounded border-slate-300 accent-stone-600"
											/>
											<label htmlFor={`active-${testimonial.id}`} className="text-sm font-medium text-slate-700">
												Show on homepage
											</label>
										</div>
									</div>

									<div className="mt-3 flex flex-wrap gap-2">
										<Button type="button" variant="secondary" onClick={() => updateTestimonial(testimonial.id)} disabled={isSaving}>
											Save
										</Button>
										<Button type="button" variant="destructive" onClick={() => deleteTestimonial(testimonial)} disabled={isSaving}>
											Delete
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
