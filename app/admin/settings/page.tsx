import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const shippingOptions = [
	{ name: "Domestic standard", price: 12, description: "Tracked delivery in 3–5 working days" },
	{ name: "Express", price: 24, description: "Priority handling and 1–2 day dispatch" },
	{ name: "White-glove", price: 45, description: "Premium placement and packaging for heirloom pieces" },
];

const vatRates = [
	{ region: "EU standard", rate: 20, note: "Applies to most EU orders" },
	{ region: "UK", rate: 20, note: "Consistent with UK VAT rules" },
	{ region: "International", rate: 0, note: "No VAT collected for overseas orders" },
];

export default function AdminSettingsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Shipping and VAT</h1>
					</div>
					<Button asChild>
						<Link href="/admin">Back to dashboard</Link>
					</Button>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">Shipping zones</h2>
						<div className="mt-4 space-y-3">
							{shippingOptions.map((option) => (
								<div key={option.name} className="rounded-2xl border border-stone-200 p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-semibold text-stone-900">{option.name}</p>
											<p className="mt-1 text-sm text-stone-500">{option.description}</p>
										</div>
										<p className="text-sm font-semibold text-stone-700">€{option.price}</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">VAT handling</h2>
						<div className="mt-4 space-y-3">
							{vatRates.map((rate) => (
								<div key={rate.region} className="rounded-2xl border border-stone-200 p-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="font-semibold text-stone-900">{rate.region}</p>
											<p className="mt-1 text-sm text-stone-500">{rate.note}</p>
										</div>
										<p className="text-sm font-semibold text-stone-700">{rate.rate}%</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
