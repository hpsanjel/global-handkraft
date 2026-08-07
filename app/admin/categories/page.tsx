"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { refreshCategoriesCatalog } from "@/lib/categories-catalog";
import type { CategorySummary } from "@/lib/category-utils";

type Feedback = {
	type: "success" | "error";
	message: string;
};

export default function AdminCategoriesPage() {
	const [categories, setCategories] = useState<CategorySummary[]>([]);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
	const [newImageInputKey, setNewImageInputKey] = useState(0);
	const [editingNames, setEditingNames] = useState<Record<string, string>>({});
	const [editingImages, setEditingImages] = useState<Record<string, File | null>>({});
	const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const totalProducts = useMemo(() => categories.reduce((sum, category) => sum + category.productCount, 0), [categories]);

	const loadCategories = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/admin/categories", { cache: "no-store" });
			const payload = (await response.json()) as CategorySummary[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to load categories.");
			}

			setCategories(payload);
			setEditingNames(Object.fromEntries(payload.map((category) => [category.id, category.name])));
			setEditingImages({});
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to load categories." });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadCategories();
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	const saveCategoryOrder = async (orderedIds: string[]) => {
		try {
			setIsSaving(true);
			const response = await fetch("/api/admin/categories", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderedIds }),
			});
			const payload = (await response.json()) as CategorySummary[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to save category order.");
			}

			setCategories(payload);
			setEditingNames(Object.fromEntries(payload.map((category) => [category.id, category.name])));
			setFeedback({ type: "success", message: "Category order updated." });
			await refreshCategoriesCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to save category order." });
			await loadCategories();
		} finally {
			setIsSaving(false);
		}
	};

	const createCategory = async () => {
		setFeedback(null);
		if (!newCategoryName.trim()) {
			setFeedback({ type: "error", message: "Enter a category name first." });
			return;
		}

		try {
			setIsSaving(true);
			const response = newCategoryImage
				? await fetch("/api/admin/categories", {
						method: "POST",
						body: (() => {
							const formData = new FormData();
							formData.append("name", newCategoryName);
							formData.append("image", newCategoryImage);
							return formData;
						})(),
					})
				: await fetch("/api/admin/categories", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ name: newCategoryName }),
					});
			const payload = (await response.json()) as CategorySummary[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to create category.");
			}

			setCategories(payload);
			setEditingNames(Object.fromEntries(payload.map((category) => [category.id, category.name])));
			setNewCategoryName("");
			setNewCategoryImage(null);
			setNewImageInputKey((current) => current + 1);
			setEditingImages({});
			setFeedback({ type: "success", message: "Category created." });
			await refreshCategoriesCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to create category." });
		} finally {
			setIsSaving(false);
		}
	};

	const updateCategory = async (categoryId: string) => {
		setFeedback(null);
		const nextName = editingNames[categoryId] ?? "";

		if (!nextName.trim()) {
			setFeedback({ type: "error", message: "Category name cannot be empty." });
			return;
		}

		try {
			setIsSaving(true);
			const selectedImage = editingImages[categoryId] ?? null;
			const response = selectedImage
				? await fetch("/api/admin/categories", {
						method: "PUT",
						body: (() => {
							const formData = new FormData();
							formData.append("id", categoryId);
							formData.append("name", nextName);
							formData.append("image", selectedImage);
							return formData;
						})(),
					})
				: await fetch("/api/admin/categories", {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ id: categoryId, name: nextName }),
					});
			const payload = (await response.json()) as CategorySummary[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to update category.");
			}

			setCategories(payload);
			setEditingNames(Object.fromEntries(payload.map((category) => [category.id, category.name])));
			setEditingImages((current) => {
				const next = { ...current };
				delete next[categoryId];
				return next;
			});
			setFeedback({ type: "success", message: "Category updated." });
			await refreshCategoriesCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to update category." });
		} finally {
			setIsSaving(false);
		}
	};

	const deleteCategory = async (category: CategorySummary) => {
		setFeedback(null);
		if (!window.confirm(`Delete "${category.name}"?`)) {
			return;
		}

		try {
			setIsSaving(true);
			const response = await fetch(`/api/admin/categories?id=${encodeURIComponent(category.id)}`, {
				method: "DELETE",
			});
			const payload = (await response.json()) as CategorySummary[] | { error?: string };

			if (!response.ok || !Array.isArray(payload)) {
				throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "Unable to delete category.");
			}

			setCategories(payload);
			setEditingNames(Object.fromEntries(payload.map((nextCategory) => [nextCategory.id, nextCategory.name])));
			setEditingImages({});
			setFeedback({ type: "success", message: "Category deleted." });
			await refreshCategoriesCatalog();
		} catch (error) {
			setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to delete category." });
		} finally {
			setIsSaving(false);
		}
	};

	const moveCategory = (sourceId: string, targetId: string) => {
		if (sourceId === targetId) {
			return;
		}

		const sourceIndex = categories.findIndex((category) => category.id === sourceId);
		const targetIndex = categories.findIndex((category) => category.id === targetId);

		if (sourceIndex < 0 || targetIndex < 0) {
			return;
		}

		const reordered = [...categories];
		const [movedCategory] = reordered.splice(sourceIndex, 1);
		reordered.splice(targetIndex, 0, movedCategory);

		setCategories(reordered);
		void saveCategoryOrder(reordered.map((category) => category.id));
	};

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Categories"
				description="Create categories first. Products can only be assigned to categories that already exist."
				actions={
					<Button asChild variant="primary">
						<Link href="/admin/products">Manage products</Link>
					</Button>
				}
			/>

			<div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Create category</h2>
					<p className="mt-1 text-sm text-slate-500">
						Categories: {categories.length} · Products assigned: {totalProducts}
					</p>
					<div className="mt-5 space-y-3">
						<label className="space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Category name</span>
							<input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="e.g. Handcrafted Wooden Temples" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100" />
						</label>
						<label className="space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Category image (optional)</span>
							<input key={newImageInputKey} type="file" accept="image/*" onChange={(event) => setNewCategoryImage(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
						</label>
						<Button variant="primary" onClick={createCategory} disabled={isSaving} className="mt-2">
							{isSaving ? "Saving..." : "Add category"}
						</Button>
					</div>
					{feedback ? <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-base font-semibold text-slate-900">Existing categories</h2>
					<p className="mt-1 text-sm text-slate-500">Drag to reorder. Rename categories or delete unused ones.</p>
					<div className="mt-5 space-y-3">
						{isLoading ? <p className="text-sm text-slate-500">Loading categories...</p> : null}
						{!isLoading && categories.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No categories yet. Add your first category.</p> : null}
						{categories.map((category) => (
							<div
								key={category.id}
								className={`rounded-xl border bg-slate-50 p-4 ${draggingCategoryId === category.id ? "border-stone-400" : "border-slate-200"}`}
								draggable={!isSaving && categories.length > 1}
								onDragStart={() => setDraggingCategoryId(category.id)}
								onDragEnd={() => setDraggingCategoryId(null)}
								onDragOver={(event) => {
									event.preventDefault();
								}}
								onDrop={(event) => {
									event.preventDefault();
									if (draggingCategoryId && !isSaving) {
										moveCategory(draggingCategoryId, category.id);
									}
									setDraggingCategoryId(null);
								}}
							>
								<div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Drag to reorder</div>
								{category.imageUrl ? (
									<div className="mb-3">
										<Image src={category.imageUrl} alt={`${category.name} preview`} width={80} height={80} className="h-20 w-20 rounded-xl border border-slate-200 object-cover" unoptimized />
									</div>
								) : null}
								<div className="flex flex-col gap-3 md:flex-row md:items-center">
									<input
										value={editingNames[category.id] ?? category.name}
										onChange={(event) =>
											setEditingNames((current) => ({
												...current,
												[category.id]: event.target.value,
											}))
										}
										className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-stone-500 focus:ring-2 focus:ring-stone-100"
									/>
									<div className="text-xs font-medium text-slate-500">{category.productCount} products</div>
								</div>
								<label className="mt-3 block space-y-2 text-sm text-slate-600">
									<span className="font-medium text-slate-700">Replace image (optional)</span>
									<input
										type="file"
										accept="image/*"
										onChange={(event) =>
											setEditingImages((current) => ({
												...current,
												[category.id]: event.target.files?.[0] ?? null,
											}))
										}
										className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
									/>
								</label>
								<div className="mt-3 flex flex-wrap gap-2">
									<Button type="button" variant="secondary" onClick={() => updateCategory(category.id)} disabled={isSaving}>
										Save
									</Button>
									<Button type="button" variant="destructive" onClick={() => deleteCategory(category)} disabled={isSaving || category.productCount > 0}>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
