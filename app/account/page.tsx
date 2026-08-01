"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function AccountProfilePage() {
	const [supabase] = useState(() => createClient());
	const [user, setUser] = useState<User | null>(null);
	const [form, setForm] = useState({ fullName: "", phone: "" });
	const [isSaving, setIsSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

	if (!user) {
		return <p className="text-sm text-stone-500">Loading profile...</p>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-stone-900">My Profile</h2>
				<p className="mt-1 text-sm text-stone-500">Keep your personal information up to date.</p>
			</div>

			{feedback ? <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div> : null}

			<form onSubmit={saveProfile} className="space-y-4">
				<label className="block space-y-2 text-sm text-stone-600">
					<span className="font-medium text-stone-700">Email address</span>
					<Input value={user.email ?? ""} disabled className="bg-stone-100 text-stone-500" />
				</label>
				<label className="block space-y-2 text-sm text-stone-600">
					<span className="font-medium text-stone-700">Full name</span>
					<Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Your full name" />
				</label>
				<label className="block space-y-2 text-sm text-stone-600">
					<span className="font-medium text-stone-700">Phone number</span>
					<Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+47 000 00 000" />
				</label>

				<div className="flex justify-end">
					<Button type="submit" disabled={isSaving}>
						{isSaving ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</form>
		</div>
	);
}
