"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
	const router = useRouter();
	const supabase = createClient();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	const [form, setForm] = useState({
		email: "",
		password: "",
		confirmPassword: "",
	});

	async function registerWithEmail(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setNotice("");

		if (!form.email.trim()) {
			setError("Email is required.");
			return;
		}

		if (form.password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);

		const { error: signUpError } = await supabase.auth.signUp({
			email: form.email,
			password: form.password,
			options: {
				emailRedirectTo: `${location.origin}/auth/callback`,
			},
		});

		setLoading(false);

		if (signUpError) {
			setError(signUpError.message);
			return;
		}

		setNotice("Registration successful. Please check your email to verify your account.");
		router.push("/login");
	}

	async function registerWithGoogle() {
		setError("");
		setLoading(true);

		const { error: oauthError } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${location.origin}/auth/callback`,
			},
		});

		setLoading(false);

		if (oauthError) {
			setError(oauthError.message);
		}
	}

	return (
		<div className="flex min-h-screen flex-col bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="relative flex-1 overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#4CAF5020_0%,_transparent_42%),radial-gradient(circle_at_top_right,_#F7931E2E_0%,_transparent_44%),linear-gradient(180deg,_#FAFAF7_0%,_#ffffff_70%)]" />
				<div className="relative mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-[#1B365D]">Global Handcrafts AS</p>
					<h1 className="mt-2 text-center text-3xl font-semibold text-stone-900 sm:text-4xl">Create your account</h1>
					<p className="mt-3 text-center text-sm text-stone-600">Register to track orders, save your shipping address, and check out faster.</p>

					<div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
						{error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
						{notice ? <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

						<button type="button" onClick={registerWithGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60">
							<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="h-5 w-5" />
							Continue with Google
						</button>

						<div className="relative my-6">
							<hr className="border-stone-200" />
							<span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Or</span>
						</div>

						<form onSubmit={registerWithEmail} className="space-y-4">
							<label className="block space-y-2 text-sm text-stone-600">
								<span className="font-medium text-stone-700">Email</span>
								<Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
							</label>
							<label className="block space-y-2 text-sm text-stone-600">
								<span className="font-medium text-stone-700">Password</span>
								<Input type="password" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
							</label>
							<label className="block space-y-2 text-sm text-stone-600">
								<span className="font-medium text-stone-700">Confirm password</span>
								<Input type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
							</label>

							<Button disabled={loading} type="submit" className="w-full">
								{loading ? "Creating account..." : "Create account"}
							</Button>
						</form>

						<p className="mt-4 text-center text-xs text-stone-500">
							By creating an account, you agree to our{" "}
							<Link href="/terms" className="font-medium text-stone-700 underline underline-offset-2">
								Terms
							</Link>{" "}
							and{" "}
							<Link href="/privacy" className="font-medium text-stone-700 underline underline-offset-2">
								Privacy Policy
							</Link>
							.
						</p>
					</div>

					<p className="mt-6 text-center text-sm text-stone-600">
						Already have an account?{" "}
						<Link href="/login" className="font-semibold text-stone-900 underline underline-offset-4">
							Sign in
						</Link>
					</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
