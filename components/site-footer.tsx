import Link from "next/link";

const footerLinks = [
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
	{ href: "/shipping", label: "Shipping" },
	{ href: "/returns", label: "Returns" },
];

export function SiteFooter() {
	return (
		<footer className="border-t border-stone-200 bg-stone-50">
			<div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
				<div className="max-w-md">
					<p className="text-lg font-semibold tracking-[0.2em] text-stone-900 uppercase">Global Handcraft</p>
					<p className="mt-3 text-sm leading-7 text-stone-600">Premium handcrafted wooden temples and heirloom home pieces for modern spiritual interiors across Europe.</p>
				</div>
				<div className="grid gap-6 sm:grid-cols-2">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Navigate</p>
						<ul className="mt-3 space-y-2 text-sm text-stone-600">
							{footerLinks.map((item) => (
								<li key={item.href}>
									<Link href={item.href} className="transition hover:text-stone-950">
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Contact</p>
						<ul className="mt-3 space-y-2 text-sm text-stone-600">
							<li>hello@globalhandcraft.com</li>
							<li>+47 91267612</li>
							<li>Oslo, Norway</li>
						</ul>
					</div>
				</div>
			</div>
		</footer>
	);
}
