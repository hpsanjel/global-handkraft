"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function parseAdminEmails(): Set<string> {
	const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";

	return new Set(
		raw
			.split(/[\n,;\s]+/)
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean),
	);
}

function isAdminUser(user: User): boolean {
	if (user.user_metadata?.role === "admin") {
		return true;
	}

	if (!user.email) {
		return false;
	}

	return parseAdminEmails().has(user.email.trim().toLowerCase());
}

function getInitials(user: User) {
	const name = (user.user_metadata?.full_name as string | undefined) || user.email || "";
	const parts = name.trim().split(/\s+/).filter(Boolean);

	if (parts.length === 0) {
		return "?";
	}

	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}

	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AccountMenu() {
	const [supabase] = useState(() => createClient());
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;

		supabase.auth.getUser().then(({ data }) => {
			if (!active) {
				return;
			}
			setUser(data.user ?? null);
			setIsReady(true);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setIsReady(true);
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, [supabase]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSignOut = async () => {
		setMenuOpen(false);
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	if (!isReady) {
		return <div className="h-10 w-10 animate-pulse rounded-full bg-stone-100" aria-hidden="true" />;
	}

	if (!user) {
		return (
			<Button asChild variant="outline" className="rounded-full border-input px-2 py-2 text-xs sm:px-4">
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
	const displayName = (user.user_metadata?.full_name as string | undefined) || "Welcome back";
	const isAdmin = isAdminUser(user);

	return (
		<div className="relative" ref={menuRef}>
			<button type="button" onClick={() => setMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-linear-to-br from-[#1B365D] to-[#4CAF50] text-sm font-semibold text-white transition hover:ring-2 hover:ring-stone-300 hover:ring-offset-2" aria-haspopup="true" aria-expanded={menuOpen} aria-label="Open account menu">
				{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : getInitials(user)}
			</button>

			{menuOpen ? (
				<div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
					<div className="border-b border-stone-100 px-4 py-3">
						<div className="flex items-center gap-2">
							<p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
							{isAdmin ? <span className="rounded-full bg-[#1B365D] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Admin</span> : null}
						</div>
						<p className="truncate text-xs text-stone-500">{user.email}</p>
					</div>
					<nav className="py-2 text-sm">
						{isAdmin ? (
							<Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-stone-700 transition hover:bg-stone-50 hover:text-stone-900">
								<LayoutDashboard className="h-4 w-4" />
								Admin Dashboard
							</Link>
						) : null}
						<Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-stone-700 transition hover:bg-stone-50 hover:text-stone-900">
							<UserIcon className="h-4 w-4" />
							My Account
						</Link>
						<Link href="/account/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-stone-700 transition hover:bg-stone-50 hover:text-stone-900">
							<Package className="h-4 w-4" />
							My Orders
						</Link>
						<Link href="/account/addresses" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-stone-700 transition hover:bg-stone-50 hover:text-stone-900">
							<MapPin className="h-4 w-4" />
							My Shipping Address
						</Link>
					</nav>
					<button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 border-t border-stone-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50">
						<LogOut className="h-4 w-4" />
						Sign out
					</button>
				</div>
			) : null}
		</div>
	);
}
