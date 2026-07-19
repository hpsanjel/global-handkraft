import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Terms & Conditions | Global Handcraft",
	description: "Terms and conditions for Global Handcraft purchases.",
};

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-semibold text-stone-900">Terms & Conditions</h1>
				<p className="mt-6 text-lg leading-8 text-stone-600">By purchasing from Global Handcraft, you agree to our ordering, shipping, and returns policies.</p>
			</main>
			<SiteFooter />
		</div>
	);
}
