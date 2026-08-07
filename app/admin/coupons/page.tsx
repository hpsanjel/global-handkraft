"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type Coupon = {
	id: string;
	code: string;
	discountPct: number;
	freeShipping: boolean;
	active: boolean;
	expiresAt: string | null;
	maxUses: number | null;
	maxUsesPerCustomer: number | null;
	currentUses: number;
	createdAt: string;
	updatedAt: string;
};

type CouponFormData = {
	code: string;
	discountPct: number;
	freeShipping: boolean;
	active: boolean;
	expiresAt: string;
	maxUses: string;
	maxUsesPerCustomer: string;
};

const emptyForm: CouponFormData = {
	code: "",
	discountPct: 10,
	freeShipping: false,
	active: true,
	expiresAt: "",
	maxUses: "",
	maxUsesPerCustomer: "",
};

export default function AdminCouponsPage() {
	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
	const [formData, setFormData] = useState<CouponFormData>(emptyForm);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchCoupons();
	}, []);

	const fetchCoupons = async () => {
		try {
			const response = await fetch("/api/admin/coupons");
			if (!response.ok) throw new Error("Failed to fetch coupons");
			const data = await response.json();
			setCoupons(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load coupons");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError("");

		try {
			const payload = {
				code: formData.code,
				discountPct: formData.discountPct,
				freeShipping: formData.freeShipping,
				active: formData.active,
				expiresAt: formData.expiresAt || null,
				maxUses: formData.maxUses ? Number(formData.maxUses) : null,
				maxUsesPerCustomer: formData.maxUsesPerCustomer ? Number(formData.maxUsesPerCustomer) : null,
			};

			const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons";
			const method = editingCoupon ? "PATCH" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to save coupon");
			}

			await fetchCoupons();
			closeModal();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save coupon");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this coupon?")) return;

		try {
			const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Failed to delete coupon");
			await fetchCoupons();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete coupon");
		}
	};

	const openCreateModal = () => {
		setEditingCoupon(null);
		setFormData(emptyForm);
		setShowModal(true);
		setError("");
	};

	const openEditModal = (coupon: Coupon) => {
		setEditingCoupon(coupon);
		setFormData({
			code: coupon.code,
			discountPct: coupon.discountPct,
			freeShipping: coupon.freeShipping,
			active: coupon.active,
			expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
			maxUses: coupon.maxUses?.toString() || "",
			maxUsesPerCustomer: coupon.maxUsesPerCustomer?.toString() || "",
		});
		setShowModal(true);
		setError("");
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingCoupon(null);
		setFormData(emptyForm);
		setError("");
	};

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Coupon Codes</h1>
					</div>
					<Button onClick={openCreateModal}>
						<Plus className="mr-2 h-4 w-4" />
						Create Coupon
					</Button>
				</div>

				{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

				<div className="mt-8">
					{loading ? (
						<p className="text-stone-500">Loading coupons...</p>
					) : coupons.length === 0 ? (
						<div className="rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
							<p className="text-sm font-medium text-stone-600">No coupons yet</p>
							<p className="mt-1 text-xs text-stone-500">Create your first coupon to start offering discounts.</p>
							<Button onClick={openCreateModal} className="mt-4">
								<Plus className="mr-2 h-4 w-4" />
								Create Coupon
							</Button>
						</div>
					) : (
						<div className="grid gap-4">
							{coupons.map((coupon) => (
								<div key={coupon.id} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<h3 className="text-lg font-semibold text-stone-900 font-mono">{coupon.code}</h3>
												<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>{coupon.active ? "Active" : "Inactive"}</span>
												{coupon.expiresAt && new Date(coupon.expiresAt) < new Date() && <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Expired</span>}
											</div>
											<div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
												<div>
													<p className="text-stone-500">Discount</p>
													<p className="font-medium text-stone-900">{coupon.discountPct}%</p>
												</div>
												<div>
													<p className="text-stone-500">Free Shipping</p>
													<p className="font-medium text-stone-900">{coupon.freeShipping ? "Yes" : "No"}</p>
												</div>
												<div>
													<p className="text-stone-500">Usage</p>
													<p className="font-medium text-stone-900">
														{coupon.currentUses} / {coupon.maxUses || "∞"}
													</p>
												</div>
												<div>
													<p className="text-stone-500">Expires</p>
													<p className="font-medium text-stone-900">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}</p>
												</div>
											</div>
											<div className="mt-2 text-xs text-stone-500">
												Created: {new Date(coupon.createdAt).toLocaleDateString()} • Last updated: {new Date(coupon.updatedAt).toLocaleDateString()}
											</div>
										</div>
										<div className="flex gap-2">
											<Button variant="outline" onClick={() => openEditModal(coupon)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button variant="outline" onClick={() => handleDelete(coupon.id)}>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-stone-900">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
							<button type="button" onClick={closeModal} className="text-stone-400 transition hover:text-stone-600">
								<X className="h-5 w-5" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="mt-4 space-y-4">
							<div>
								<label htmlFor="code" className="block text-sm font-medium text-stone-700">
									Code
								</label>
								<input type="text" id="code" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm uppercase" placeholder="SAVE20" />
							</div>

							<div>
								<label htmlFor="discountPct" className="block text-sm font-medium text-stone-700">
									Discount Percentage
								</label>
								<input type="number" id="discountPct" required min="0" max="100" value={formData.discountPct} onChange={(e) => setFormData({ ...formData, discountPct: Number(e.target.value) })} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
							</div>

							<div className="flex items-center gap-2">
								<input type="checkbox" id="freeShipping" checked={formData.freeShipping} onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })} className="h-4 w-4 rounded border-stone-300" />
								<label htmlFor="freeShipping" className="text-sm font-medium text-stone-700">
									Free Shipping
								</label>
							</div>

							<div className="flex items-center gap-2">
								<input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-4 w-4 rounded border-stone-300" />
								<label htmlFor="active" className="text-sm font-medium text-stone-700">
									Active
								</label>
							</div>

							<div>
								<label htmlFor="expiresAt" className="block text-sm font-medium text-stone-700">
									Expiry Date (Optional)
								</label>
								<input type="date" id="expiresAt" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
							</div>

							<div>
								<label htmlFor="maxUses" className="block text-sm font-medium text-stone-700">
									Max Total Uses (Optional, leave empty for unlimited)
								</label>
								<input type="number" id="maxUses" min="1" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
							</div>

							<div>
								<label htmlFor="maxUsesPerCustomer" className="block text-sm font-medium text-stone-700">
									Max Uses Per Customer (Optional, leave empty for unlimited)
								</label>
								<input type="number" id="maxUsesPerCustomer" min="1" value={formData.maxUsesPerCustomer} onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })} className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
							</div>

							{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

							<div className="flex gap-3">
								<Button type="submit" disabled={submitting} className="flex-1">
									{submitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
								</Button>
								<Button type="button" variant="outline" onClick={closeModal}>
									Cancel
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			<SiteFooter />
		</div>
	);
}
