import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartBadge } from "@/components/cart-badge";

const navItems = [
	{ href: "/shop", label: "Shop" },
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/80 backdrop-blur">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
				<Link href="/" className="text-lg font-semibold tracking-[0.2em] text-stone-900 uppercase">
					Global Handcraft
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
					<Button asChild className="rounded-full bg-stone-900 px-4 py-2 text-sm">
						<Link href="/shop">Shop Now</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
