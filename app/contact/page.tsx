import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = {
	title: "Contact | Global Handcrafts AS",
	description: "Reach out for bespoke orders, consultations, or support.",
};

export default function ContactPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Contact</p>
					<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">Let’s talk about your next sacred interior.</h1>
					<p className="mt-6 text-lg leading-8 text-stone-600">For bespoke requests, shipment questions, or wholesale inquiries, our team is happy to help.</p>
					<div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Business details</p>
						<ul className="mt-4 space-y-3 text-sm text-stone-600">
							<li>Email: hello@globalhandcraft.com</li>
							<li>WhatsApp: +47 91267612</li>
							<li>Address: Oslo, Norway</li>
						</ul>
					</div>
				</div>
				<div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
					<form className="space-y-4">
						<Input placeholder="Full name" aria-label="Full name" />
						<Input placeholder="Email" type="email" aria-label="Email" />
						<Input placeholder="Phone" aria-label="Phone" />
						<textarea className="min-h-36 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200" placeholder="How can we help?" aria-label="Message" />
						<Button type="submit" className="w-full">
							Send message
						</Button>
					</form>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
