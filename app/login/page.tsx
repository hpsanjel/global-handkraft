"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { InlineAlert } from "@/components/ui/inline-alert";

/** Only ever redirect within our own site — a `next` value like "https://evil.com" or "//evil.com" must never be followed. */
function isSafeNextPath(path: string | null): path is string {
	return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

function LoginPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const supabase = createClient();
	const nextParam = searchParams.get("next");
	const nextPath = isSafeNextPath(nextParam) ? nextParam : "/account";

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState({ email: "", password: "" });

	// If the buyer followed an order-confirmation-email link while already
	// signed in, skip the login form entirely and go straight there.
	useEffect(() => {
		let active = true;
		supabase.auth.getUser().then(({ data }) => {
			if (active && data.user) {
				router.replace(nextPath);
			}
		});
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function signInWithEmail(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (!form.email.trim() || !form.password) {
			setError("Please enter your email and password.");
			return;
		}

		setLoading(true);
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: form.email,
			password: form.password,
		});
		setLoading(false);

		if (signInError) {
			setError(signInError.message);
			return;
		}

		router.push(nextPath);
		router.refresh();
	}

	async function signInWithGoogle() {
		setLoading(true);
		const { error: oauthError } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
			},
		});
		setLoading(false);

		if (oauthError) {
			setError(oauthError.message);
		}
	}

	return (
		<div className="flex min-h-screen flex-col bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="relative flex-1 overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#4CAF5020_0%,_transparent_42%),radial-gradient(circle_at_top_right,_#F7931E2E_0%,_transparent_44%),linear-gradient(180deg,_#FAFAF7_0%,_#ffffff_70%)]" />
				<div className="relative mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-[#1B365D]">Global Handcrafts AS</p>
					<h1 className="mt-2 text-center text-3xl font-semibold text-stone-900 sm:text-4xl">Welcome back</h1>
					<p className="mt-3 text-center text-sm text-stone-700">Sign in to track orders, manage your shipping address, and check out faster.</p>

					<div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
						{error ? (
							<InlineAlert tone="error" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
								{error}
							</InlineAlert>
						) : null}

						<button type="button" onClick={signInWithGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60">
							<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="h-5 w-5" />
							Continue with Google
						</button>

						<div className="relative my-6">
							<hr className="border-stone-200" />
							<span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">Or</span>
						</div>

						<form onSubmit={signInWithEmail} className="space-y-4">
							<label className="block space-y-2 text-sm text-stone-700">
								<span className="font-medium text-stone-700">Email</span>
								<Input type="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
							</label>
							<label className="block space-y-2 text-sm text-stone-700">
								<span className="font-medium text-stone-700">Password</span>
								<Input type="password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
							</label>

							<Button type="submit" disabled={loading} className="w-full">
								{loading ? "Signing in..." : "Sign In"}
							</Button>
						</form>
					</div>

					<p className="mt-6 text-center text-sm text-stone-700">
						Don&apos;t have an account?{" "}
						<Link href="/register" className="font-semibold text-stone-900 underline underline-offset-4">
							Create one
						</Link>
					</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginPageContent />
		</Suspense>
	);
}
