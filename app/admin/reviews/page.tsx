"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

type AdminReview = {
	id: string;
	name: string;
	email: string | null;
	rating: number;
	title: string | null;
	comment: string;
	approved: boolean;
	createdAt: string;
	product: { id: string; name: string; slug: string };
};

type StatusFilter = "pending" | "approved" | "all";

function StarRow({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((value) => (
				<Star key={value} className={`h-3.5 w-3.5 ${value <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`} />
			))}
		</div>
	);
}

export default function AdminReviewsPage() {
	const [status, setStatus] = useState<StatusFilter>("pending");
	const [reviews, setReviews] = useState<AdminReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState<string | null>(null);

	const fetchReviews = async (nextStatus: StatusFilter) => {
		setLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/admin/reviews?status=${nextStatus}`);
			if (!response.ok) throw new Error("Failed to fetch reviews.");
			const data = await response.json();
			setReviews(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load reviews.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError("");
			try {
				const response = await fetch(`/api/admin/reviews?status=${status}`);
				if (!response.ok) throw new Error("Failed to fetch reviews.");
				const data = await response.json();
				if (!cancelled) setReviews(data);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load reviews.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, [status]);

	const handleApprove = async (id: string, approved: boolean) => {
		setBusyId(id);
		setError("");
		try {
			const response = await fetch(`/api/admin/reviews/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ approved }),
			});
			if (!response.ok) throw new Error("Failed to update review.");
			await fetchReviews(status);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update review.");
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this review permanently?")) return;
		setBusyId(id);
		setError("");
		try {
			const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete review.");
			await fetchReviews(status);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete review.");
		} finally {
			setBusyId(null);
		}
	};

	const tabs: { value: StatusFilter; label: string }[] = [
		{ value: "pending", label: "Pending" },
		{ value: "approved", label: "Approved" },
		{ value: "all", label: "All" },
	];

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Reviews" description="Moderate customer reviews before they appear on product pages." />

			<div className="flex gap-2 border-b border-slate-200">
				{tabs.map((tab) => (
					<button key={tab.value} type="button" onClick={() => setStatus(tab.value)} className={`px-4 py-2.5 text-sm font-medium transition ${status === tab.value ? "border-b-2 border-stone-600 text-stone-900" : "text-slate-500 hover:text-slate-800"}`}>
						{tab.label}
					</button>
				))}
			</div>

			{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

			{loading ? (
				<p className="text-slate-500">Loading reviews...</p>
			) : reviews.length === 0 ? (
				<div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
					<p className="text-sm font-medium text-slate-600">No {status === "all" ? "" : status} reviews</p>
				</div>
			) : (
				<div className="grid gap-4">
					{reviews.map((review) => (
						<div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-3">
										<StarRow rating={review.rating} />
										<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${review.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{review.approved ? "Approved" : "Pending"}</span>
										<Link href={`/product/${review.product.slug}`} target="_blank" className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900">
											{review.product.name}
										</Link>
									</div>
									{review.title ? <p className="mt-2 text-sm font-semibold text-slate-900">{review.title}</p> : null}
									<p className="mt-1 text-sm leading-6 text-slate-600">{review.comment}</p>
									<p className="mt-2 text-xs text-slate-500">
										{review.name}
										{review.email ? ` • ${review.email}` : ""} • {new Date(review.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div className="flex shrink-0 gap-2">
									{review.approved ? (
										<Button variant="secondary" size="icon" title="Unapprove" disabled={busyId === review.id} onClick={() => handleApprove(review.id, false)}>
											<X className="h-4 w-4 text-amber-600" />
										</Button>
									) : (
										<Button variant="secondary" size="icon" title="Approve" disabled={busyId === review.id} onClick={() => handleApprove(review.id, true)}>
											<Check className="h-4 w-4 text-emerald-600" />
										</Button>
									)}
									<Button variant="secondary" size="icon" title="Delete" disabled={busyId === review.id} onClick={() => handleDelete(review.id)}>
										<Trash2 className="h-4 w-4 text-red-600" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
