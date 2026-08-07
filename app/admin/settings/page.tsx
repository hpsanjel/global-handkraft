import Link from "next/link";
import { AdminShippingSettings } from "@/components/admin-shipping-settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Admin</p>
						<h1 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Shipping Settings</h1>
					</div>
					<Button asChild>
						<Link href="/admin">Back to dashboard</Link>
					</Button>
				</div>

				<div className="mt-8">
					<AdminShippingSettings />
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
