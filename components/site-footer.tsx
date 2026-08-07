import Link from "next/link";

const footerLinks = [
	{ href: "/categories", label: "Categories" },
	{ href: "/contact", label: "Contact" },
	{ href: "/privacy", label: "Privacy Policy" },
	{ href: "/terms", label: "Terms and Conditions" },
	{ href: "/shipping", label: "Shipping Policy" },
	{ href: "/returns", label: "Returns Policy" },
];

export function SiteFooter() {
	return (
		<footer className="border-t border-stone-200 bg-stone-50">
			<div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
				<div className="max-w-md">
					<p className="text-lg font-semibold text-stone-900 uppercase">Global Handcrafts AS</p>
					<p className="text-md font-semibold text-stone-700 uppercase">Org. No. 936984282</p>
					<p className="mt-3 text-sm leading-7 text-stone-700">Authentic handcrafted temples, pooja items, and traditional cultural products delivered across Norway and Europe.</p>
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
							<li>contact@handcraftsglobal.com</li>
							<li>+47 91267612</li>
							<li>Oslo, Norway</li>
						</ul>
					</div>
				</div>
			</div>
		</footer>
	);
}
