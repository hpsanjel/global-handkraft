import Link from "next/link";
import Image from "next/image";
import { Hammer, Globe2, Handshake, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig } from "@/app/metadata";

export const metadata = {
	title: "About Us",
	description: "Global Handcrafts AS brings authentic handcrafted temples, pooja items, and traditional products from Nepal and South Asia to homes across Norway and Europe.",
	openGraph: {
		title: `About Us | ${siteConfig.name}`,
		description: "Authentic handcrafted temples, pooja items, and traditional cultural products from Nepal and South Asia, delivered across Norway and Europe.",
		images: [
			{
				url: "/api/og?title=About%20Us&description=Authentic%20handcrafted%20treasures%20from%20Nepal%20and%20South%20Asia%2C%20delivered%20across%20Norway%20and%20Europe",
				width: 1200,
				height: 630,
				alt: "About Global Handcrafts",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `About Us | ${siteConfig.name}`,
		description: "Authentic handcrafted temples, pooja items, and traditional cultural products from Nepal and South Asia, delivered across Norway and Europe.",
		images: ["/api/og?title=About%20Us&description=Authentic%20handcrafted%20treasures%20from%20Nepal%20and%20South%20Asia%2C%20delivered%20across%20Norway%20and%20Europe"],
	},
};

const values = [
	{
		icon: Hammer,
		title: "Authentic craftsmanship",
		description: "Every temple, pooja item, and garment is shaped by hand by skilled artisans, using techniques passed down through generations.",
	},
	{
		icon: Globe2,
		title: "Cultural continuity",
		description: "We help families carry the traditions, rituals, and symbols of home with them, wherever in the world they've settled.",
	},
	{
		icon: Handshake,
		title: "Fair trade & ethical sourcing",
		description: "We work directly with artisans and workshops across Nepal and South Asia, building relationships built on fairness and respect.",
	},
	{
		icon: ShieldCheck,
		title: "Premium quality & trust",
		description: "From materials to packaging, every order is checked for the quality and care our customers expect.",
	},
	{
		icon: Truck,
		title: "Global delivery reliability",
		description: "Live shipping rates, tracked deliveries, and dedicated support make ordering across Norway and Europe simple and dependable.",
	},
];

const offerings = [
	{
		image: "/images/temple-main.webp",
		title: "Handcrafted temples",
		description: "From compact wall-mounted shrines to premium teak and rosewood temples, and fully custom mandap builds.",
	},
	{
		image: "/images/pooja-mandap.avif",
		title: "Pooja essentials",
		description: "Brass diyas, bells, kalash and aarti lamps, copper vessels, and hand-carved wood and stone décor.",
	},
	{
		image: "/images/clothes.avif",
		title: "Traditional clothing",
		description: "Daura suruwal, kurtas, sarees, lehengas, and handmade accessories for everyday wear and special occasions.",
	},
];

export default function AboutPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main>
				<section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">About Us</p>
						<h1 className="mt-3 text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">Bringing authentic craftsmanship from Nepal and South Asia to your home.</h1>
						<p className="mt-6 text-lg leading-8 text-stone-600">Global Handcrafts AS is a Norway-based company sourcing handcrafted temples, pooja items, and traditional cultural products directly from skilled artisans, and delivering them to families across Norway and Europe.</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
								Explore the shop
							</Link>
							<Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100">
								Get in touch
							</Link>
						</div>
					</div>
					<Image src="/images/temple-main.webp" alt="Handcrafted wooden temple" width={600} height={450} className="w-full rounded-[1.75rem] object-cover shadow-md" />
				</section>

				<section className="border-y border-stone-200 bg-white">
					<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Our story</p>
						<h2 className="mt-3 text-3xl font-semibold text-stone-900">Handcrafted, not mass-produced.</h2>
						<div className="mt-6 space-y-5 text-lg leading-8 text-stone-600">
							<p>We started Global Handcrafts because we saw how hard it can be to find genuinely handcrafted temples, pooja items, and traditional pieces once you&apos;ve settled far from home. Mass-produced imitations are easy to find; authentic, artisan-made pieces are not.</p>
							<p>So we built direct relationships with artisans and workshops across Nepal and South Asia, and a storefront that makes it simple to bring their work into homes and places of worship across Norway and Europe, whether that&apos;s a small brass diya for a family altar or a fully custom mandap for a wedding.</p>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="text-center">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">What we stand for</p>
						<h2 className="mt-3 text-3xl font-semibold text-stone-900">Our values</h2>
					</div>
					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{values.map((value) => (
							<div key={value.title} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
								<div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white">
									<value.icon className="h-5 w-5" />
								</div>
								<h3 className="mt-4 text-lg font-semibold text-stone-900">{value.title}</h3>
								<p className="mt-2 text-sm leading-7 text-stone-600">{value.description}</p>
							</div>
						))}
					</div>
				</section>

				<section className="border-t border-stone-200 bg-white">
					<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
						<div className="text-center">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">What we offer</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Across our collections</h2>
						</div>
						<div className="mt-10 grid gap-6 sm:grid-cols-3">
							{offerings.map((item) => (
								<div key={item.title} className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-50 shadow-sm">
									<Image src={item.image} alt={item.title} width={400} height={280} className="h-48 w-full object-cover" />
									<div className="p-5">
										<h3 className="text-base font-semibold text-stone-900">{item.title}</h3>
										<p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
									</div>
								</div>
							))}
						</div>
						<div className="mt-10 text-center">
							<Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
								Shop all products
							</Link>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
					<h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Questions before you order?</h2>
					<p className="mt-3 text-stone-600">Check our FAQ, or reach out to our team directly.</p>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
						<Link href="/faq" className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
							Visit our FAQ
						</Link>
						<Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100">
							Contact us
						</Link>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
