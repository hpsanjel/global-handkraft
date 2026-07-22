import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "About | Global Handcrafts AS",
	description: "Learn about the story, artisans, and values behind Global Handcrafts AS.",
};

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">About</p>
				<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">Craftsmanship rooted in devotion and design.</h1>
				<p className="mt-6 text-lg leading-8 text-stone-600">Global Handcrafts AS curates sculptural wooden temples and sacred home pieces that balance ritual presence, premium materials, and contemporary interiors.</p>
				<div className="mt-10 grid gap-6 md:grid-cols-2">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">Our process</h2>
						<p className="mt-3 text-sm leading-7 text-stone-600">Every piece is handcrafted in Europe with attention to grain, finish, and proportion, with respectful detail at every single join.</p>
					</div>
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm">
						<h2 className="text-xl font-semibold text-stone-900">Why customers trust us</h2>
						<p className="mt-3 text-sm leading-7 text-stone-600">Secure checkout, premium packaging, and a design-led approach make every order feel effortless from browsing to delivery.</p>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
