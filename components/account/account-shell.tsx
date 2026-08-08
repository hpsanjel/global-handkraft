"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, Package, MapPin, User as UserIcon, Menu, X, LogOut, Store, ChevronDown } from "lucide-react";
import { CartBadge } from "@/components/cart-badge";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
	{ href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
	{ href: "/account/orders", label: "My Orders", icon: Package },
	{ href: "/account/addresses", label: "Addresses", icon: MapPin },
	{ href: "/account/profile", label: "Profile & Security", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
	return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(user: User) {
	const name = (user.user_metadata?.full_name as string | undefined) || user.email || "";
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
	return (
		<nav className="flex-1 space-y-1 px-3 py-4">
			{NAV_ITEMS.map((item) => {
				const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
				const Icon = item.icon;
				return (
					<Link key={item.href} href={item.href} onClick={onNavigate} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
						<span className={`-ml-3 h-5 w-0.5 shrink-0 rounded-r-full transition ${active ? "bg-stone-500" : "bg-transparent"}`} aria-hidden="true" />
						<Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-stone-400" : "text-slate-400 group-hover:text-slate-200"}`} />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

export default function AccountShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const [supabase] = useState(() => createClient());
	const [user, setUser] = useState<User | null>(null);
	const [checking, setChecking] = useState(true);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;

		supabase.auth.getUser().then(({ data }) => {
			if (!active) return;
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

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setUserMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const currentSection = NAV_ITEMS.find((item) => isActive(pathname, item.href, "exact" in item ? item.exact : false));

	const handleSignOut = async () => {
		setUserMenuOpen(false);
		await fetch("/api/auth/signout", { method: "POST" });
		router.push("/");
		router.refresh();
	};

	if (checking || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50">
				<p className="text-sm text-slate-500">Loading your account...</p>
			</div>
		);
	}

	const displayName = (user.user_metadata?.full_name as string | undefined) || "";

	return (
		<div className="flex min-h-screen bg-slate-50 text-slate-900">
			{/* Desktop sidebar */}
			<aside className="hidden w-64 shrink-0 flex-col bg-[#1B365D] lg:flex">
				<div className="flex items-center gap-2.5 px-5 py-5">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
						<img src="/images/globalhandicraft-logo.png" alt="" className="h-8 w-8 scale-125 object-contain" />
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold leading-tight text-white">Global Handcrafts</p>
						<p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">My Account</p>
					</div>
				</div>
				<SidebarNav pathname={pathname} />
				<div className="border-t border-white/10 p-3">
					<Link href="/shop" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
						<Store className="h-4.5 w-4.5 text-slate-400" />
						Continue shopping
					</Link>
				</div>
			</aside>

			{/* Mobile sidebar */}
			{mobileNavOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
					<aside className="relative flex h-full w-64 flex-col bg-[#1B365D] shadow-xl">
						<div className="flex items-center justify-between gap-2.5 px-5 py-5">
							<div className="flex min-w-0 items-center gap-2.5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
									<img src="/images/globalhandicraft-logo.png" alt="" className="h-8 w-8 scale-125 object-contain" />
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold leading-tight text-white">Global Handcrafts</p>
									<p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">My Account</p>
								</div>
							</div>
							<button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Close navigation">
								<X className="h-5 w-5" />
							</button>
						</div>
						<SidebarNav pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
						<div className="border-t border-white/10 p-3">
							<Link href="/shop" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white" onClick={() => setMobileNavOpen(false)}>
								<Store className="h-4.5 w-4.5 text-slate-400" />
								Continue shopping
							</Link>
						</div>
					</aside>
				</div>
			) : null}

			{/* Main column */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
					<button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden" aria-label="Open navigation">
						<Menu className="h-5 w-5" />
					</button>
					<p className="truncate text-sm font-medium text-slate-500">
						My Account <span className="mx-1.5 text-slate-300">/</span> <span className="text-slate-900">{currentSection?.label ?? ""}</span>
					</p>
					<div className="ml-auto flex items-center gap-2">
						<CartBadge />
						<div className="relative" ref={userMenuRef}>
							<button type="button" onClick={() => setUserMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100" aria-haspopup="true" aria-expanded={userMenuOpen}>
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#1B365D] to-[#4CAF50] text-xs font-semibold text-white">{getInitials(user)}</span>
								<span className="hidden max-w-[10rem] truncate sm:inline">{displayName || user.email}</span>
								<ChevronDown className="h-4 w-4 text-slate-400" />
							</button>
							{userMenuOpen ? (
								<div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
									<div className="border-b border-slate-100 px-4 py-3">
										<p className="truncate text-xs text-slate-500">Signed in as</p>
										<p className="truncate text-sm font-semibold text-slate-900">{user.email}</p>
									</div>
									<button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50">
										<LogOut className="h-4 w-4" />
										Sign out
									</button>
								</div>
							) : null}
						</div>
					</div>
				</header>
				<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<div className="mx-auto max-w-7xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
