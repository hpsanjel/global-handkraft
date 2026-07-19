"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { testimonials } from "@/lib/data/products";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useProductsCatalog } from "@/lib/products-catalog";

export default function HomePage() {
	const products = useProductsCatalog();
	return (
		<div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#f8f5f0_0%,_#ffffff_60%)] text-stone-800">
			<SiteHeader />
			<main className="flex-1">
				<section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
					<div className="max-w-2xl">
						<p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Handmade in Europe</p>
						<h1 className="text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl lg:text-6xl">Handcrafted Wooden Hindu Temples for Your Home</h1>
						<p className="mt-6 text-lg leading-8 text-stone-600">Discover sculptural temples and ritual furniture designed with heirloom quality, warm wood tones, and a calm premium presence.</p>
						<div className="mt-8 flex flex-wrap gap-4">
							<Button asChild>
								<Link href="/shop">Shop Now</Link>
							</Button>
							<Button asChild className="bg-white text-stone-900 ring-1 ring-stone-300 hover:bg-stone-100">
								<Link href="/about">Our Craft</Link>
							</Button>
						</div>
						<div className="mt-10 flex flex-wrap gap-6 text-sm text-stone-600">
							<span>• Handmade</span>
							<span>• Premium Wood</span>
							<span>• Secure Payments</span>
							<span>• Worldwide Shipping</span>
						</div>
					</div>
					<div className="rounded-[2rem] border border-stone-200 bg-white p-3 shadow-[0_20px_80px_rgba(41,37,36,0.08)]">
						<div className="rounded-[1.5rem] bg-stone-100 p-6">
							<div className="aspect-[4/5] rounded-[1.25rem] bg-[url('/images/temple-main.webp')] bg-cover bg-center" />
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
					<div className="grid gap-6 md:grid-cols-3">
						{products.slice(0, 3).map((product) => (
							<article key={product.id} className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
								<div className="aspect-[4/5] rounded-[1.25rem] bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${product.image}')` }} />
								<div className="mt-5 flex items-start justify-between gap-3">
									<div>
										<h3 className="text-lg font-semibold text-stone-900">{product.name}</h3>
										<p className="mt-2 text-sm text-stone-600">{product.shortDescription}</p>
									</div>
									<p className="text-sm font-semibold text-stone-900">From €{product.variants[0].price}</p>
								</div>
							</article>
						))}
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="rounded-[2rem] border border-stone-200 bg-stone-900 px-6 py-10 text-white shadow-sm sm:px-10">
						<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
							<div className="max-w-2xl">
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-400">Why collectors choose us</p>
								<h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Premium quality, designed to last for generations.</h2>
							</div>
							<Button asChild className="bg-white text-stone-900 hover:bg-stone-100">
								<Link href="/shop">Explore Collection</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Customer reviews</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Trusted by families and interior designers alike.</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{testimonials.map((item) => (
								<div key={item.name} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
									<p className="text-sm leading-7 text-stone-600">“{item.quote}”</p>
									<p className="mt-4 font-semibold text-stone-900">{item.name}</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
