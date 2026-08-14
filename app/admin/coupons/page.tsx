"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";

type Coupon = {
	id: string;
	code: string;
	discountPct: number;
	freeShipping: boolean;
	active: boolean;
	expiresAt: string | null;
	maxUses: number | null;
	maxUsesPerCustomer: number | null;
	minPurchaseAmount: number | null;
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
	minPurchaseAmount: string;
};

const emptyForm: CouponFormData = {
	code: "",
	discountPct: 10,
	freeShipping: false,
	active: true,
	expiresAt: "",
	maxUses: "",
	maxUsesPerCustomer: "",
	minPurchaseAmount: "1500",
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
				minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : null,
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
			minPurchaseAmount: coupon.minPurchaseAmount?.toString() || "",
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
		<div className="space-y-6">
			<AdminPageHeader
				title="Coupon codes"
				description="Create and manage discount codes for your storefront."
				actions={
					<Button variant="primary" onClick={openCreateModal}>
						<Plus className="mr-2 h-4 w-4" />
						Create coupon
					</Button>
				}
			/>

			{error && <InlineAlert tone="error" className="rounded-lg border border-red-200 bg-red-50 p-3">{error}</InlineAlert>}

			<div>
				{loading ? (
					<p className="text-slate-500">Loading coupons...</p>
				) : coupons.length === 0 ? (
					<div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
						<p className="text-sm font-medium text-slate-600">No coupons yet</p>
						<p className="mt-1 text-xs text-slate-500">Create your first coupon to start offering discounts.</p>
						<Button variant="primary" onClick={openCreateModal} className="mt-4">
							<Plus className="mr-2 h-4 w-4" />
							Create coupon
						</Button>
					</div>
				) : (
					<div className="grid gap-4">
						{coupons.map((coupon) => (
							<div key={coupon.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-3">
											<h3 className="text-lg font-semibold text-slate-900 font-mono">{coupon.code}</h3>
											<span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{coupon.active ? "Active" : "Inactive"}</span>
											{coupon.expiresAt && new Date(coupon.expiresAt) < new Date() && <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Expired</span>}
										</div>
										<div className="mt-2 grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
											<div>
												<p className="text-slate-500">Discount</p>
												<p className="font-medium text-slate-900">{coupon.discountPct}%</p>
											</div>
											<div>
												<p className="text-slate-500">Free Shipping</p>
												<p className="font-medium text-slate-900">{coupon.freeShipping ? "Yes" : "No"}</p>
											</div>
											<div>
												<p className="text-slate-500">Min. Purchase</p>
												<p className="font-medium text-slate-900">{coupon.minPurchaseAmount ? `NOK ${coupon.minPurchaseAmount}` : "None"}</p>
											</div>
											<div>
												<p className="text-slate-500">Usage</p>
												<p className="font-medium text-slate-900">
													{coupon.currentUses} / {coupon.maxUses || "∞"}
												</p>
											</div>
											<div>
												<p className="text-slate-500">Expires</p>
												<p className="font-medium text-slate-900">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}</p>
											</div>
										</div>
										<div className="mt-2 text-xs text-slate-500">
											Created: {new Date(coupon.createdAt).toLocaleDateString()} • Last updated: {new Date(coupon.updatedAt).toLocaleDateString()}
										</div>
									</div>
									<div className="flex gap-2">
										<Button variant="secondary" size="icon" onClick={() => openEditModal(coupon)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button variant="secondary" size="icon" onClick={() => handleDelete(coupon.id)}>
											<Trash2 className="h-4 w-4 text-red-600" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Modal */}
			<Dialog open={showModal} onClose={closeModal} className="w-full max-w-lg p-6">
				<div className="flex items-center justify-between">
					<DialogTitle className="text-xl font-semibold text-slate-900">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
					<DialogClose label="Close" className="text-slate-600 transition hover:text-slate-900">
						<X className="h-5 w-5" />
					</DialogClose>
				</div>

				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
							<div>
								<label htmlFor="code" className="block text-sm font-medium text-slate-700">
									Code
								</label>
								<input type="text" id="code" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" placeholder="SAVE20" />
							</div>

							<div>
								<label htmlFor="discountPct" className="block text-sm font-medium text-slate-700">
									Discount Percentage
								</label>
								<input type="number" id="discountPct" required min="0" max="100" value={formData.discountPct} onChange={(e) => setFormData({ ...formData, discountPct: Number(e.target.value) })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
							</div>

							<div>
								<label htmlFor="minPurchaseAmount" className="block text-sm font-medium text-slate-700">
									Minimum Purchase (NOK, optional)
								</label>
								<input
									type="number"
									id="minPurchaseAmount"
									min="0"
									step="1"
									value={formData.minPurchaseAmount}
									onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
									className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100"
									placeholder="e.g. 1500"
								/>
								<p className="mt-1 text-xs text-slate-500">Cart subtotal must be at least this amount for the coupon to be redeemable. Leave empty for no minimum.</p>
							</div>

							<div className="flex items-center gap-2">
								<input type="checkbox" id="freeShipping" checked={formData.freeShipping} onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-stone-600" />
								<label htmlFor="freeShipping" className="text-sm font-medium text-slate-700">
									Free Shipping
								</label>
							</div>

							<div className="flex items-center gap-2">
								<input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-stone-600" />
								<label htmlFor="active" className="text-sm font-medium text-slate-700">
									Active
								</label>
							</div>

							<div>
								<label htmlFor="expiresAt" className="block text-sm font-medium text-slate-700">
									Expiry Date (Optional)
								</label>
								<input type="date" id="expiresAt" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
							</div>

							<div>
								<label htmlFor="maxUses" className="block text-sm font-medium text-slate-700">
									Max Total Uses (Optional, leave empty for unlimited)
								</label>
								<input type="number" id="maxUses" min="1" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
							</div>

							<div>
								<label htmlFor="maxUsesPerCustomer" className="block text-sm font-medium text-slate-700">
									Max Uses Per Customer (Optional, leave empty for unlimited)
								</label>
								<input type="number" id="maxUsesPerCustomer" min="1" value={formData.maxUsesPerCustomer} onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-100" />
							</div>

							{error && <InlineAlert tone="error" className="rounded-lg border border-red-200 bg-red-50 p-3">{error}</InlineAlert>}

							<div className="flex gap-3">
								<Button type="submit" variant="primary" disabled={submitting} className="flex-1">
									{submitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
								</Button>
								<Button type="button" variant="secondary" onClick={closeModal}>
									Cancel
								</Button>
							</div>
						</form>
			</Dialog>
		</div>
	);
}
