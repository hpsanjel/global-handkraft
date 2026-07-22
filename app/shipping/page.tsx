import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Shipping Policy | Global Handcrafts AS",
	description: "Our shipping policy for handcrafted furniture and temples.",
};

export default function ShippingPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-semibold text-stone-900">Shipping Policy</h1>
				<p className="mt-6 text-lg leading-8 text-stone-600">Most orders are dispatched within 3-5 business days, with white-glove packaging and tracking included.</p>
			</main>
			<SiteFooter />
		</div>
	);
}
