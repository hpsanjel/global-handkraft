"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart-badge";

const navItems = [
	{ href: "/shop?category=Handcrafted%20Wooden%20Temples", label: "Temples" },
	{ href: "/shop?category=Traditional%20Clothes", label: "Clothes" },
	{ href: "/shop?category=Pooja%20Items", label: "Pooja Items" },
	{ href: "/shop?category=Pooja%20Mandap", label: "Mandaps" },
];

export function SiteHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/90 backdrop-blur">
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
				<Link href="/" className="max-w-[52vw] text-sm font-semibold tracking-[0.12em] text-stone-900 uppercase sm:max-w-none sm:text-lg sm:tracking-[0.2em]">
					Global Handcrafts AS
				</Link>
				<nav className="hidden items-center gap-6 text-sm font-medium text-stone-700 md:flex">
					{navItems.map((item) => (
						<Link key={item.href} href={item.href} className="transition hover:text-stone-950">
							{item.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-3">
					<CartBadge />
					<Button asChild className="hidden rounded-full bg-stone-900 px-4 py-2 text-sm sm:inline-flex">
						<Link href="/shop">Shop Now</Link>
					</Button>
					<button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 md:hidden" aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen}>
						{mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
					</button>
				</div>
			</div>

			{mobileMenuOpen ? (
				<div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden">
					<nav className="flex flex-col gap-2">
						{navItems.map((item) => (
							<Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900" onClick={() => setMobileMenuOpen(false)}>
								{item.label}
							</Link>
						))}
						<Link href="/shop" className="mt-2 inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>
							Shop Now
						</Link>
					</nav>
				</div>
			) : null}
		</header>
	);
}
