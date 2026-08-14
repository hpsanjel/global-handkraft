"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

export type PublicReview = {
	id: string;
	name: string;
	rating: number;
	title: string | null;
	comment: string;
	createdAt: string;
};

function StarDisplay({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
	return (
		<div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
			{[1, 2, 3, 4, 5].map((value) => (
				<Star key={value} className={`${size} ${value <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-transparent text-stone-300"}`} />
			))}
		</div>
	);
}

function StarPicker({ value, onChange, labelledBy }: { value: number; onChange: (value: number) => void; labelledBy?: string }) {
	const [hovered, setHovered] = useState(0);

	return (
		<div role="radiogroup" aria-labelledby={labelledBy} className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button key={star} type="button" role="radio" aria-checked={star === value} onClick={() => onChange(star)} onMouseEnter={() => setHovered(star)} aria-label={`${star} star${star > 1 ? "s" : ""}`} className="p-0.5">
					<Star className={`h-6 w-6 transition ${star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-stone-300"}`} />
				</button>
			))}
		</div>
	);
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ProductReviews({ productSlug, initialRating, initialReviewCount, initialReviews }: { productSlug: string; initialRating: number; initialReviewCount: number; initialReviews: PublicReview[] }) {
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [title, setTitle] = useState("");
	const [comment, setComment] = useState("");
	const [selectedRating, setSelectedRating] = useState(0);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		setError("");
		setSuccessMessage("");

		if (!name.trim()) {
			setError("Please enter your name.");
			return;
		}
		if (selectedRating < 1) {
			setError("Please select a star rating.");
			return;
		}
		if (!comment.trim()) {
			setError("Please write a review comment.");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/products/${productSlug}/reviews`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), email: email.trim(), rating: selectedRating, title: title.trim(), comment: comment.trim() }),
			});
			const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

			if (!response.ok) {
				setError(result?.error || "Unable to submit your review. Please try again.");
				return;
			}

			setSuccessMessage(result?.message || "Thank you! Your review has been submitted and will appear once approved.");
			setName("");
			setEmail("");
			setTitle("");
			setComment("");
			setSelectedRating(0);
			setShowForm(false);
		} catch {
			setError("Unable to submit your review. Please check your connection and try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mt-10 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-stone-900">Customer Reviews</h2>
					<div className="mt-2 flex items-center gap-2.5">
						<StarDisplay rating={initialRating} size="h-5 w-5" />
						<span className="text-sm font-medium text-stone-700">{initialRating > 0 ? initialRating.toFixed(1) : "No ratings yet"}</span>
						<span className="text-sm text-stone-700">
							({initialReviewCount} review{initialReviewCount === 1 ? "" : "s"})
						</span>
					</div>
				</div>
				<Button variant="outline" onClick={() => setShowForm((open) => !open)}>
					{showForm ? "Cancel" : "Write a review"}
				</Button>
			</div>

			{showForm ? (
				<div className="mt-6 space-y-4 border-t border-stone-200 pt-6">
					<div>
						<p id="review-rating-label" className="mb-2 text-sm font-medium text-stone-700">
							Your rating *
						</p>
						<StarPicker value={selectedRating} onChange={setSelectedRating} labelledBy="review-rating-label" />
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-2 text-sm text-stone-700">
							<span className="font-medium text-stone-700">Name *</span>
							<input required aria-required="true" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" placeholder="Your name" />
						</label>
						<label className="space-y-2 text-sm text-stone-700">
							<span className="font-medium text-stone-700">Email (not published)</span>
							<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" placeholder="you@example.com" />
						</label>
					</div>
					<label className="block space-y-2 text-sm text-stone-700">
						<span className="font-medium text-stone-700">Review title</span>
						<input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" placeholder="Sum up your experience" />
					</label>
					<label className="block space-y-2 text-sm text-stone-700">
						<span className="font-medium text-stone-700">Your review *</span>
						<textarea required aria-required="true" value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900" placeholder="What did you like about this product?" />
					</label>
					{error ? (
						<InlineAlert tone="error" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
							{error}
						</InlineAlert>
					) : null}
					<p className="text-xs text-stone-700">Reviews are moderated and will appear publicly after admin approval.</p>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Submitting..." : "Submit review"}
					</Button>
				</div>
			) : null}

			{successMessage ? (
				<InlineAlert tone="success" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
					{successMessage}
				</InlineAlert>
			) : null}

			<div className="mt-6 divide-y divide-stone-200 border-t border-stone-200">
				{initialReviews.length === 0 ? (
					<p className="py-6 text-sm text-stone-700">No reviews yet. Be the first to review this product.</p>
				) : (
					initialReviews.map((review) => (
						<div key={review.id} className="py-5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2.5">
									<StarDisplay rating={review.rating} />
									<span className="text-sm font-semibold text-stone-900">{review.name}</span>
								</div>
								<span className="text-xs text-stone-700">{formatDate(review.createdAt)}</span>
							</div>
							{review.title ? <p className="mt-2 text-sm font-medium text-stone-900">{review.title}</p> : null}
							<p className="mt-1 text-sm leading-6 text-stone-700">{review.comment}</p>
						</div>
					))
				)}
			</div>
		</div>
	);
}
