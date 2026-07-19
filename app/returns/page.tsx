import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Return Policy | Global Handcraft",
	description: "Our return policy for online purchases.",
};

export default function ReturnsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-semibold text-stone-900">Return Policy</h1>
				<p className="mt-6 text-lg leading-8 text-stone-600">Unused items can be returned within 14 days. Custom pieces may have an extended review period.</p>
			</main>
			<SiteFooter />
		</div>
	);
}
