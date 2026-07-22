"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { categories, testimonials } from "@/lib/data/products";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useProductsCatalog } from "@/lib/products-catalog";
import Image from "next/image";
import { HomeCategoryProductsSection } from "@/components/home-category-products-section";
import { Star } from "lucide-react";

export default function HomePage() {
	const products = useProductsCatalog();
	const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
	const highlightedCategories = categories.slice(0, 6);
	const categoryProductMap: Record<string, string> = {
		Temples: "Handcrafted Wooden Temples",
		Clothes: "Traditional Clothes",
		Pooja: "Pooja Items",
		Mandap: "Pooja Mandap",
	};
	const dynamicCategorySections = highlightedCategories
		.map((category) => {
			const productCategory = categoryProductMap[category] ?? category;
			return {
				title: category,
				href: `/shop?category=${encodeURIComponent(category)}`,
				products: products.filter((product) => product.category === productCategory).slice(0, 4),
			};
		})
		.filter((section) => section.products.length > 0);
	const categoryHighlights = Object.entries(categoryProductMap)
		.map(([label, category]) => {
			const matchedProducts = products.filter((product) => product.category === category);
			return {
				label,
				category,
				count: matchedProducts.length,
				previewImage: matchedProducts[0]?.image ?? "/images/temple-1.webp",
			};
		})
		.filter((item) => item.count > 0)
		.slice(0, 4);
	const trustHighlights = ["Verified craftsmanship", "Secure checkout", "Tracked Europe-wide delivery", "Responsive support"];
	const reviewFacts = [
		{ label: "Avg. satisfaction", value: "4.9/5" },
		{ label: "Repeat customers", value: "95%" },
		{ label: "On-time deliveries", value: "99%" },
	];
	const stats = [
		{ label: "Happy Customers", value: "300+" },
		{ label: "Handmade Products", value: "400+" },
		{ label: "Skilled Artisans", value: "20+" },
		{ label: "Countries Served", value: "10+" },
	];

	return (
		<div className="flex min-h-screen flex-col bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="flex-1">
				<section className="hidden sm:relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#4CAF5020_0%,_transparent_42%),radial-gradient(circle_at_top_right,_#F7931E2E_0%,_transparent_44%),linear-gradient(180deg,_#FAFAF7_0%,_#ffffff_70%)]" />
					<div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
						<div className="max-w-2xl">
							<p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#1B365D]">Global Handcrafts AS</p>
							<h1 className="text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">Authentic Handcrafted Treasures Delivered Across Europe</h1>
							<p className="mt-6 text-lg leading-8 text-stone-600">Premium handcrafted temples, pooja items, traditional clothing, and cultural products sourced directly from skilled artisans across Nepal and South Asia.</p>
							<div className="mt-8 flex flex-wrap gap-4">
								<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
									<Link href="/shop">Explore Products</Link>
								</Button>
							</div>
							<div className="mt-10 flex flex-wrap gap-6 text-sm text-stone-700">
								<span>• Authentic Craftsmanship</span>
								<span>• Ethical Sourcing</span>
								<span>• Secure Payments</span>
								<span>• Europe-Wide Shipping</span>
							</div>
						</div>
						<Image src="/images/temple-main.webp" alt="Handcrafted Temple" width={600} height={400} className="mt-4 rounded-[1.25rem] shadow-md w-full h-[400px]" />
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Featured Categories</p>
							<h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Collections curated for culture, prayer, and gifting</h2>
						</div>
						<Link href="/categories" className="hidden sm:block text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
							View all categories
						</Link>
					</div>
					<div className="mt-8 flex gap-2 overflow-x-auto overflow-y-hidden pb-2 md:grid md:grid-cols-6 md:gap-32 md:overflow-visible md:pb-0">
						{highlightedCategories.map((category, index) => (
							<Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="relative group grid aspect-square w-[36vw] max-w-[200px] min-w-[132px] shrink-0 grid-rows-[1fr_auto] rounded-2xl border border-stone-200 bg-white p-1 shadow-sm transition hover:shadow-md md:aspect-auto md:min-w-0 md:shrink md:overflow-hidden md:rounded-[1.5rem] md:border-stone-200 md:p-0 md:shadow-sm md:transition-all md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
								<Image src={`/images/cat-${index + 1}.avif`} alt={category} width={200} height={200} className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.03] md:h-48 md:rounded-none md:group-hover:scale-105" />
								<p className="absolute bottom-2 left-1/2 w-[60%] -translate-x-1/2 rounded-full bg-white px-2 py-1 text-center text-xs font-semibold text-stone-900 shadow-sm transition duration-300 group-hover:bg-stone-100 group-hover:text-[#1B365D] md:static md:mt-0 md:w-full md:translate-x-0 md:rounded-none md:bg-transparent md:px-5 md:pb-5 md:pt-4 md:text-left md:text-lg md:font-semibold md:shadow-none md:transition-none">{category}</p>
							</Link>
						))}
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Featured Products</p>
							<h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Best sellers and premium new arrivals</h2>
						</div>
						<Link href="/shop" className="hidden sm:block text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
							Shop all
						</Link>
					</div>
					<div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
						{featuredProducts.map((product) => (
							<div key={product.id} className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
								<Link href={`/product/${product.slug}`} className="block">
									<div className="w-full aspect-5/6 bg-stone-100 bg-cover" style={{ backgroundImage: `url('${product.image}')` }} />
									<div className="px-3 pt-3 sm:px-5 sm:pt-4">
										<p className="text-sm font-semibold text-stone-900 sm:text-base">{product.name}</p>
										{/* <p className="mt-2 overflow-hidden text-xs text-stone-600 sm:text-sm [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{product.shortDescription}</p> */}
									</div>
								</Link>
								<div className="mt-auto flex items-center justify-between gap-3 px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
									<p className="text-sm font-semibold text-[#1B365D] sm:text-base">€{product.variants[0].price}</p>
									<Button asChild className="rounded-full bg-[#F7931E] px-4 py-2 text-xs text-white hover:bg-[#d87810] sm:text-sm">
										<Link href={`/product/${product.slug}`}>Buy</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				</section>

				{dynamicCategorySections.map((section) => (
					<HomeCategoryProductsSection key={section.title} title={section.title} href={section.href} products={section.products} />
				))}

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="rounded-[2rem] border border-stone-200 bg-gradient-to-r from-[#b18016] to-[#028207] px-6 py-10 text-white shadow-sm sm:px-10">
						<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
							<div className="max-w-2xl">
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Artisan Story</p>
								<h2 className="mt-3 text-3xl font-semibold sm:text-4xl">From artisan workshops to homes across Europe.</h2>
								<p className="mt-4 text-sm leading-7 text-white/90">We partner with skilled makers to preserve traditional craft methods, source responsibly, and deliver heirloom-quality products with modern service standards.</p>
							</div>
							<Button asChild className="bg-white text-[#1B365D] hover:bg-stone-100">
								<Link href="/about">Our Journey</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-2 lg:gap-6 grid-cols-2 lg:grid-cols-4">
						{stats.map((item) => (
							<div key={item.label} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
								<p className="text-3xl font-semibold text-[#1B365D]">{item.value}</p>
								<p className="mt-2 text-sm text-stone-600">{item.label}</p>
							</div>
						))}
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Why Visitors Choose Us</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Everything you need to buy with confidence</h2>
							<p className="mt-3 text-sm leading-7 text-stone-600">From product selection to delivery, this section helps you quickly understand fit, quality, and support before checkout.</p>
							<div className="mt-6 grid gap-3 sm:grid-cols-2">
								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Handmade Quality</p>
									<p className="mt-2 text-sm text-stone-700">Artisan-crafted products with durable materials and detailed finishing.</p>
								</div>
								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Clear Delivery</p>
									<p className="mt-2 text-sm text-stone-700">Tracked shipping across Europe with safe packaging and live updates.</p>
								</div>
								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Custom Support</p>
									<p className="mt-2 text-sm text-stone-700">Need a mandap or temple size suggestion? Our team helps before purchase.</p>
								</div>
								<div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
									<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Easy Next Step</p>
									<p className="mt-2 text-sm text-stone-700">Browse by category or contact us directly for fast recommendations.</p>
								</div>
							</div>
							<div className="mt-6 flex flex-wrap gap-3">
								<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
									<Link href="/shop">Start Shopping</Link>
								</Button>
								<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
									<Link href="/contact">Talk to an Expert</Link>
								</Button>
							</div>
						</div>
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Shop by Intent</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Find the right collection faster</h2>
							<div className="mt-5 space-y-3">
								{categoryHighlights.map((item) => (
									<Link key={item.label} href={`/shop?category=${encodeURIComponent(item.label)}`} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition hover:border-stone-300 hover:bg-white">
										<div className="h-14 w-14 shrink-0 rounded-xl bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${item.previewImage}')` }} />
										<div className="min-w-0">
											<p className="text-sm font-semibold text-stone-900 group-hover:text-[#1B365D]">{item.label}</p>
											<p className="mt-1 text-xs text-stone-600">{item.count} products available</p>
										</div>
										<span className="ml-auto text-xs font-semibold text-[#1B365D]">Open</span>
									</Link>
								))}
							</div>
							<p className="mt-5 text-xs leading-6 text-stone-500">Tip: Use the Shop page filters for material, size, stock, and price to narrow results in seconds.</p>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Customer Voice</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Proof that your order is in safe hands</h2>
							<p className="mt-3 text-sm leading-7 text-stone-600">Real experiences from families, temples, and event organizers who ordered handcrafted pieces through Global Handcrafts.</p>
							<div className="mt-5 flex flex-wrap gap-2">
								{trustHighlights.map((item) => (
									<span key={item} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
										{item}
									</span>
								))}
							</div>
							<div className="mt-6 grid gap-3 sm:grid-cols-3">
								{reviewFacts.map((fact) => (
									<div key={fact.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-center">
										<p className="text-lg font-semibold text-[#1B365D]">{fact.value}</p>
										<p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-stone-500">{fact.label}</p>
									</div>
								))}
							</div>
							<div className="mt-6 flex flex-wrap gap-3">
								<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
									<Link href="/shop">Browse Best Sellers</Link>
								</Button>
								<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
									<Link href="/contact">Ask Before You Buy</Link>
								</Button>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{testimonials.map((item, index) => (
								<div key={item.name} className="group rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:p-6">
									<div className="flex items-center justify-between gap-3">
										<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
											<Star className="bg-yellow-100 h-4 w-4 inline-block mr-1" />
											<Star className="bg-yellow-100 h-4 w-4 inline-block mr-1" />
											<Star className="bg-yellow-100 h-4 w-4 inline-block mr-1" />
											<Star className="bg-yellow-100 h-4 w-4 inline-block mr-1" />
											<Star className="bg-yellow-100 h-4 w-4 inline-block mr-1" />
										</p>
										<span className="rounded-full bg-[#1B365D]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1B365D]">Review {index + 1}</span>
									</div>
									<p className="mt-4 text-sm leading-7 text-stone-700">“{item.quote}”</p>
									<div className="flex gap-2 items-center mt-5 border-t border-stone-200 pt-4">
										<img src={item.image} alt={item.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
										<p className="font-semibold text-stone-900">{item.name}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 pb-8 sm:pb-12 md:pb-16 sm:px-6 lg:px-8">
					<div className="rounded-[1.75rem] border border-stone-200 bg-white p-7 shadow-sm">
						<div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Newsletter</p>
								<h2 className="mt-2 text-3xl font-semibold text-stone-900">Get festival drops and artisan stories first</h2>
								<p className="mt-2 text-sm text-stone-600">Receive product launches, temple care guides, and exclusive seasonal offers.</p>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row">
								<input type="email" placeholder="Enter your email" className="w-full rounded-full border border-stone-300 bg-stone-50 px-5 py-3 text-sm text-stone-900 outline-none sm:w-80" />
								<Button className="rounded-full bg-[#F7931E] px-6 text-white hover:bg-[#d87810]">Subscribe</Button>
							</div>
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
