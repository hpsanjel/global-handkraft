import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Privacy Policy | Global Handcraft",
	description: "Privacy policy for Global Handcraft.",
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-semibold text-stone-900">Privacy Policy</h1>
				<p className="mt-6 text-lg leading-8 text-stone-600">We handle your personal data carefully and only use it to fulfill your orders and improve service.</p>
			</main>
			<SiteFooter />
		</div>
	);
}
