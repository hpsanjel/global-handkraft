"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountPageHeader } from "@/components/account/account-page-header";
import { createClient } from "@/lib/supabase/client";

const PROVIDER_LABELS: Record<string, string> = {
	email: "Email & password",
	google: "Google",
};

function connectedProviders(user: User): string[] {
	const fromMetadata = (user.app_metadata?.providers as string[] | undefined) ?? (user.app_metadata?.provider ? [user.app_metadata.provider as string] : []);
	const fromIdentities = (user.identities ?? []).map((identity) => identity.provider);
	return Array.from(new Set([...fromMetadata, ...fromIdentities]));
}

export default function AccountProfilePage() {
	const [supabase] = useState(() => createClient());
	const [user, setUser] = useState<User | null>(null);
	const [form, setForm] = useState({ fullName: "", phone: "" });
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	const [isExporting, setIsExporting] = useState(false);
	const [exportError, setExportError] = useState("");
	const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
	const [deletionFeedback, setDeletionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (!data.user) {
				return;
			}
			setUser(data.user);
			setForm({
				fullName: (data.user.user_metadata?.full_name as string | undefined) ?? "",
				phone: (data.user.user_metadata?.phone as string | undefined) ?? "",
			});
		});
	}, [supabase]);

	const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFeedback(null);
		setIsSaving(true);

		const { error } = await supabase.auth.updateUser({
			data: {
				full_name: form.fullName.trim(),
				phone: form.phone.trim(),
			},
		});

		setIsSaving(false);

		if (error) {
			setFeedback({ type: "error", message: error.message });
			return;
		}

		setFeedback({ type: "success", message: "Your profile has been updated." });
	};

	const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setPasswordFeedback(null);

		if (passwordForm.newPassword.length < 8) {
			setPasswordFeedback({ type: "error", message: "Password must be at least 8 characters." });
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordFeedback({ type: "error", message: "Passwords do not match." });
			return;
		}

		setIsChangingPassword(true);
		const { error, data } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
		setIsChangingPassword(false);

		if (error) {
			setPasswordFeedback({ type: "error", message: error.message });
			return;
		}

		if (data.user) setUser(data.user);
		setPasswordForm({ newPassword: "", confirmPassword: "" });
		setPasswordFeedback({ type: "success", message: hasPassword ? "Your password has been changed." : "Password set — you can now sign in with either Google or your email and password." });
	};

	const downloadMyData = async () => {
		setExportError("");
		setIsExporting(true);
		try {
			const response = await fetch("/api/account/export");
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { error?: string };
				throw new Error(payload.error || "Unable to prepare your data export.");
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			setExportError(error instanceof Error ? error.message : "Unable to prepare your data export.");
		} finally {
			setIsExporting(false);
		}
	};

	const requestDeletion = async () => {
		setDeletionFeedback(null);
		if (!window.confirm("Request deletion of your account? Our team will confirm by email and complete this within 30 days.")) {
			return;
		}

		setIsRequestingDeletion(true);
		try {
			const response = await fetch("/api/account/delete-request", { method: "POST" });
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { error?: string };
				throw new Error(payload.error || "Unable to submit your deletion request.");
			}
			setDeletionFeedback({ type: "success", message: "Your deletion request has been received. We'll email you to confirm once it's processed (within 30 days)." });
		} catch (error) {
			setDeletionFeedback({ type: "error", message: error instanceof Error ? error.message : "Unable to submit your deletion request." });
		} finally {
			setIsRequestingDeletion(false);
		}
	};

	if (!user) {
		return <p className="text-sm text-slate-500">Loading profile...</p>;
	}

	const providers = connectedProviders(user);
	const hasPassword = providers.includes("email");
	const hasGoogle = providers.includes("google");

	return (
		<div className="space-y-10">
			<div className="space-y-6">
				<AccountPageHeader title="Profile" description="Keep your personal information up to date." />

				{feedback ? <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}

				<form onSubmit={saveProfile} className="space-y-4">
					<label className="block space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Email address</span>
						<Input value={user.email ?? ""} disabled className="rounded-lg border-slate-200 bg-slate-100 text-slate-500" />
					</label>
					<label className="block space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Full name</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Your full name" />
					</label>
					<label className="block space-y-2 text-sm text-slate-600">
						<span className="font-medium text-slate-700">Phone number</span>
						<Input className="rounded-lg border-slate-200 focus:ring-stone-100" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+47 000 00 000" />
					</label>

					<div className="flex justify-end">
						<Button type="submit" variant="primary" disabled={isSaving}>
							{isSaving ? "Saving..." : "Save changes"}
						</Button>
					</div>
				</form>
			</div>

			<div className="space-y-6 border-t border-slate-100 pt-8">
				<AccountPageHeader title="Security" description={hasPassword ? "Change your password to keep your account secure." : "You currently sign in with Google. Set a password to also sign in with your email."} />

				<div className="flex flex-wrap gap-2">
					{providers.map((provider) => (
						<span key={provider} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
							Connected: {PROVIDER_LABELS[provider] ?? provider}
						</span>
					))}
				</div>

				{hasGoogle && !hasPassword ? <p className="text-xs text-slate-500">Setting a password here only adds a second way to sign in — it does not change or affect your Google account.</p> : null}

				{passwordFeedback ? <div className={`rounded-2xl border px-4 py-3 text-sm ${passwordFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{passwordFeedback.message}</div> : null}

				<form onSubmit={changePassword} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<label className="block space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">New password</span>
							<Input className="rounded-lg border-slate-200 focus:ring-stone-100" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} placeholder="At least 8 characters" autoComplete="new-password" />
						</label>
						<label className="block space-y-2 text-sm text-slate-600">
							<span className="font-medium text-slate-700">Confirm new password</span>
							<Input className="rounded-lg border-slate-200 focus:ring-stone-100" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} placeholder="Re-enter password" autoComplete="new-password" />
						</label>
					</div>

					<div className="flex justify-end">
						<Button type="submit" variant="primary" disabled={isChangingPassword}>
							{isChangingPassword ? "Updating..." : hasPassword ? "Update password" : "Set password"}
						</Button>
					</div>
				</form>
			</div>

			<div className="space-y-6 border-t border-slate-100 pt-8">
				<AccountPageHeader title="Your data & privacy" description="Access or remove the personal data we hold about you." />

				<div className="rounded-2xl border border-slate-200 p-4">
					<div className="flex items-start gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
							<Download className="h-5 w-5" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-slate-900">Download your data</p>
							<p className="mt-0.5 text-sm text-slate-500">Get a copy of your profile, saved address, and order history as a JSON file.</p>
							{exportError ? <p className="mt-2 text-xs font-medium text-red-600">{exportError}</p> : null}
							<Button type="button" variant="secondary" className="mt-3" onClick={downloadMyData} disabled={isExporting}>
								{isExporting ? "Preparing..." : "Download my data"}
							</Button>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
					<div className="flex items-start gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
							<ShieldAlert className="h-5 w-5" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-slate-900">Delete your account</p>
							<p className="mt-0.5 text-sm text-slate-500">We&apos;ll delete your profile and login. Invoices and order records are kept as required by Norwegian bookkeeping law, then anonymized.</p>
							{deletionFeedback ? <p className={`mt-2 text-xs font-medium ${deletionFeedback.type === "success" ? "text-emerald-700" : "text-red-600"}`}>{deletionFeedback.message}</p> : null}
							<Button type="button" variant="destructive" className="mt-3" onClick={requestDeletion} disabled={isRequestingDeletion}>
								{isRequestingDeletion ? "Submitting..." : "Request account deletion"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
