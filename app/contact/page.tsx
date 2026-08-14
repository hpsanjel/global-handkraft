import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/app/metadata";

export const metadata = {
	title: "Contact",
	description: "Contact Global Handcrafts AS for bespoke orders, consultations, wholesale inquiries, and support. Reach us by email, WhatsApp, or visit our location in Rykkinn.",
	openGraph: {
		title: `Contact | ${siteConfig.name}`,
		description: "Contact Global Handcrafts AS for bespoke orders, consultations, wholesale inquiries, and support.",
		images: [
			{
				url: "/api/og?title=Contact%20|%20Global%20Handcrafts&description=Contact%20us%20for%20bespoke%20orders%2C%20consultations%2C%20wholesale%20inquiries%2C%20and%20support",
				width: 1200,
				height: 630,
				alt: "Contact Global Handcrafts",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Contact | ${siteConfig.name}`,
		description: "Contact Global Handcrafts AS for bespoke orders, consultations, wholesale inquiries, and support.",
		images: ["/api/og?title=Contact%20|%20Global%20Handcrafts&description=Contact%20us%20for%20bespoke%20orders%2C%20consultations%2C%20wholesale%20inquiries%2C%20and%20support"],
	},
};

export default function ContactPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-700">Contact</p>
					<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">Let’s talk about your next sacred interior.</h1>
					<p className="mt-6 text-lg leading-8 text-stone-700">For bespoke requests, shipment questions, or wholesale inquiries, our team is happy to help.</p>
					<div className="mt-8 rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-900">Business details</p>
						<ul className="mt-4 space-y-3 text-sm text-stone-700">
							<li>Email: contact@handcraftsglobal.com</li>
							<li>WhatsApp: +47 91267612</li>
							<li>Address: Belsetveien 80, Rykkinn</li>
						</ul>
					</div>
				</div>
				<div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
					<ContactForm />
				</div>
			</main>
			<div className="w-full">
				<iframe title="Business Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1837.8487983146663!2d10.485134876947551!3d59.928055374909796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x464113addc8dfba9%3A0x191c9e26cee6da4b!2sBelsetveien%2080%2C%201348%20Rykkinn!5e1!3m2!1sen!2sno!4v1786168456215!5m2!1sen!2sno" width="100%" height="450" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block" />
			</div>
			<SiteFooter />
		</div>
	);
}
