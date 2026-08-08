"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart-badge";
import { AccountMenu } from "@/components/account-menu";
import { useCategoriesCatalog } from "@/lib/categories-catalog";
import { siteConfig } from "@/app/metadata";

export function SiteHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const categories = useCategoriesCatalog();
	const navItems = useMemo(
		() =>
			categories
				.filter((category) => category.productCount > 0)
				.map((category) => ({
					href: `/shop?category=${encodeURIComponent(category.slug)}`,
					label: category.name,
				})),
		[categories],
	);

	const organizationSchema = useMemo(
		() => ({
			"@context": "https://schema.org",
			"@type": "Organization",
			name: siteConfig.name,
			url: siteConfig.url,
			logo: `${siteConfig.url}/images/globalhandicraft-logo.png`,
			contactPoint: {
				"@type": "ContactPoint",
				email: "contact@handcraftsglobal.com",
				telephone: "+47-91267612",
				contactType: "customer service",
			},
			address: {
				"@type": "PostalAddress",
				streetAddress: "Belsetveien 80",
				addressLocality: "Rykkinn",
				postalCode: "1348",
				addressCountry: "NO",
			},
			sameAs: ["https://wa.me/4791267612"],
		}),
		[],
	);

	return (
		<header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/90 backdrop-blur">
			{/* JSON-LD structured data for the organization */}
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
			<div className="mx-auto flex max-w-7xl items-center gap-3 px-4">
				<div className="flex items-center gap-1">
					<div className="flex h-16 w-16 items-center justify-center overflow-hidden sm:h-24 sm:w-24">
						<img src="/images/globalhandicraft-logo.png" alt="Global Handcrafts Logo" width={100} height={100} className="h-full w-full scale-125 object-contain" />
					</div>
					<Link href="/" className="max-w-[52vw] text-sm font-semibold leading-4 sm:leading-5 text-stone-900 uppercase sm:max-w-none sm:text-lg">
						Global <br />
						Handcrafts
					</Link>
				</div>
				<div className="hidden flex-1 md:block">
					<nav className="flex items-center justify-center gap-8 text-sm font-medium text-stone-700">
						{navItems.map((item) => (
							<Link key={item.href} href={item.href} className="shrink-0 transition hover:text-stone-950">
								{item.label}
							</Link>
						))}
					</nav>
				</div>
				<div className="ml-auto flex items-center gap-3">
					<CartBadge />
					<Button asChild className="hidden rounded-full bg-stone-900 px-4 py-2 text-sm sm:inline-flex">
						<Link href="/shop">Shop Now</Link>
					</Button>
					<AccountMenu />
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
