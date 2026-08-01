"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/client";

const accountNavItems = [
	{ href: "/account", label: "My Profile" },
	{ href: "/account/orders", label: "My Orders" },
	{ href: "/account/addresses", label: "Shipping Address" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
	const [supabase] = useState(() => createClient());
	const router = useRouter();
	const pathname = usePathname();
	const [user, setUser] = useState<User | null>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		let active = true;

		supabase.auth.getUser().then(({ data }) => {
			if (!active) {
				return;
			}
			if (!data.user) {
				router.replace("/login");
				return;
			}
			setUser(data.user);
			setChecking(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (!session?.user) {
				router.replace("/login");
				return;
			}
			setUser(session.user);
			setChecking(false);
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, [router, supabase]);

	if (checking || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-stone-50">
				<p className="text-sm text-stone-500">Loading your account...</p>
			</div>
		);
	}

	const displayName = (user.user_metadata?.full_name as string | undefined) || "";

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">My Account</p>
					<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Welcome back{displayName ? `, ${displayName}` : ""}</h1>
					<p className="mt-2 max-w-2xl text-sm text-stone-600">{user.email}</p>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
					<nav className="h-fit rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm">
						<ul className="space-y-1">
							{accountNavItems.map((item) => (
								<li key={item.href}>
									<Link href={item.href} className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${pathname === item.href ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
