"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { testimonials } from "@/lib/data/products";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useProductsCatalog } from "@/lib/products-catalog";
import Image from "next/image";
import { HomeCategoryProductsSection } from "@/components/home-category-products-section";
import { CouponPopup } from "@/components/coupon-popup";
import { useCategoriesCatalog } from "@/lib/categories-catalog";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

type Testimonial = {
	name: string;
	quote: string;
	image: string;
};

function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
	return (
		<div className="group flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-0.5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
					))}
					<span className="ml-1.5 text-xs font-medium text-stone-600">5.0</span>
				</div>
				<span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 flex items-center gap-1">
					<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
					</svg>
					Verified Purchase
				</span>
			</div>
			<p className="mt-4 flex-1 text-sm leading-7 text-stone-700">“{item.quote}”</p>
			<div className="mt-5 flex items-center gap-3 border-t border-stone-200 pt-4">
				<img src={item.image} alt={item.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-stone-100" />
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-stone-900 text-sm">{item.name}</p>
					<p className="text-xs text-stone-500 flex items-center gap-1">
						<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Verified Customer
					</p>
				</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	const products = useProductsCatalog();
	const categories = useCategoriesCatalog();
	const categoriesWithProducts = categories.filter((category) => category.productCount > 0);
	const featuredProducts = (products.filter((product) => product.featured).length > 0 ? products.filter((product) => product.featured) : products).slice(0, 4);
	const highlightedCategories = categoriesWithProducts;
	const dynamicCategorySections = highlightedCategories.map((category) => {
		return {
			title: category.name,
			href: `/shop?category=${encodeURIComponent(category.slug)}`,
			products: products.filter((product) => product.categorySlug === category.slug).slice(0, 4),
		};
	});
	const categoryHighlights = categoriesWithProducts.map((category) => {
		const matchedProducts = products.filter((product) => product.categorySlug === category.slug);
		return {
			label: category.name,
			slug: category.slug,
			count: category.productCount,
			previewImage: category.imageUrl ?? matchedProducts[0]?.image ?? "/images/temple-1.webp",
		};
	});
	const trustHighlights = ["Verified craftsmanship", "Secure checkout", "Responsive support"];
	const reviewFacts = [
		{ label: "Avg. satisfaction", value: "4.9/5" },
		{ label: "Repeat customers", value: "95%" },
		{ label: "On-time deliveries", value: "99%" },
	];
	const [email, setEmail] = useState("");
	const [subscribing, setSubscribing] = useState(false);
	const [buying, setBuying] = useState(false);

	const perPage = 2;
	const pageCount = Math.ceil(testimonials.length / perPage);
	const showSlider = testimonials.length > perPage;
	const [page, setPage] = useState(0);

	const goPrev = () => setPage((p) => Math.max(p - 1, 0));
	const goNext = () => setPage((p) => Math.min(p + 1, pageCount - 1));

	const handleSubscribers = async () => {
		if (!email.trim()) {
			alert("Please enter your email.");
			return;
		}

		setSubscribing(true);
		const res = await fetch("/api/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await res.json();

		if (res.ok) {
			alert("Thank you for subscribing!");
			setEmail("");
		} else {
			alert(data.error);
		}
		setSubscribing(false);
	};

	return (
		<div className="flex min-h-screen flex-col bg-saffron text-stone-800">
			<CouponPopup />
			<SiteHeader />
			<main className="flex-1">
				<section className="hidden sm:block sm:relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#4CAF5020_0%,transparent_42%),radial-gradient(circle_at_top_right,#F7931E2E_0%,transparent_44%),linear-gradient(180deg,#fff8eb_0%,transparent_100%)]" />
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

				{highlightedCategories.length > 0 ? (
					<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
						<div className="flex items-end justify-between gap-4">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Featured Categories</p>
								<h2 className="mt-2 text-3xl font-semibold text-stone-900 sm:text-4xl">Collections curated for culture, prayer, and gifting</h2>
							</div>
						</div>
						<div className="mt-8 no-scrollbar scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
							{categoryHighlights.map((category) => (
								<Link key={category.slug} href={`/shop?category=${encodeURIComponent(category.slug)}`} className="group flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm transition sm:w-48 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
									<div className="aspect-square w-full bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${category.previewImage}')` }} />
									<div className="px-3 py-3 md:align-middle md:text-center">
										<p className="text-sm font-semibold text-stone-900 group-hover:text-[#1B365D]">{category.label}</p>
										<p className="mt-1 text-xs text-stone-600">{category.count} products</p>
									</div>
								</Link>
							))}
						</div>
					</section>
				) : null}

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
					<div className="mt-8 no-scrollbar scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
						{featuredProducts.map((product) => {
							const displayPrice = product.variants[0]?.price ?? 0;
							const originalPrice = displayPrice * 1.2;
							const discount = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
							return (
								<div key={product.id} className="flex h-full w-[72vw] max-w-70 shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition md:w-70 md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
									<div className="group relative block">
										<Link href={`/product/${product.slug}`} className="block">
											<div className="relative w-full aspect-5/6 bg-stone-100 bg-cover" style={{ backgroundImage: `url('${product.image}')` }}>
												{product.featured && <span className="absolute left-3 top-3 rounded-full bg-[#F7931E] px-3 py-1 text-[11px] font-bold text-white shadow-sm">⭐ Best Seller</span>}
												{discount > 0 && <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">-{discount}%</span>}
												<div className="absolute inset-x-0 bottom-0 hidden items-center justify-center bg-gradient-to-t from-black/50 to-transparent p-4 group-hover:flex">
													<span className="text-xs text-white font-medium">View Details</span>
												</div>
											</div>
											<div className="px-3 pt-3 sm:px-5 sm:pt-4">
												<p className="text-sm font-semibold text-stone-900 sm:text-base line-clamp-1" title={product.name}>
													{product.name}
												</p>
												<div className="mt-1.5 flex items-center gap-1">
													<div className="flex items-center">
														{Array.from({ length: 5 }).map((_, i) => (
															<Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-stone-200 text-stone-200"}`} />
														))}
													</div>
													<span className="text-xs text-stone-500">({product.reviewCount})</span>
												</div>
											</div>
										</Link>
									</div>
									<div className="mt-auto flex items-center justify-between gap-3 px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
										<div className="flex flex-col">
											<p className="text-sm font-semibold text-[#1B365D] sm:text-base">NOK {displayPrice}</p>
											{discount > 0 && <p className="text-xs text-stone-400 line-through">NOK {originalPrice.toFixed(2)}</p>}
										</div>
										<Button asChild className={`${buying ? "opacity-50 cursor-not-allowed" : ""} rounded-full bg-[#F7931E] px-4 py-2 text-xs text-white hover:bg-[#d87810] sm:text-sm`} disabled={buying}>
											<Link href={`/product/${product.slug}`}>Buy</Link>
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{dynamicCategorySections.map((section) => (
					<HomeCategoryProductsSection key={section.title} title={section.title} href={section.href} products={section.products} />
				))}

				{/* <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-2 lg:gap-6 grid-cols-2 lg:grid-cols-4">
						{stats.map((item) => (
							<div key={item.label} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-center shadow-sm">
								<p className="text-3xl font-semibold text-[#1B365D]">{item.value}</p>
								<p className="mt-2 text-sm text-stone-600">{item.label}</p>
							</div>
						))}
					</div>
				</section> */}

				<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
					<div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
							<div className="flex flex-col items-start justify-between gap-8">
								<div className="max-w-xl">
									<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Shop With Confidence</p>
									<h2 className="mt-3 text-3xl font-semibold text-stone-900">Handmade quality, delivered across Europe</h2>
									<p className="mt-3 text-sm leading-7 text-stone-600">Not sure what size or piece fits your space? Our team is happy to guide you before you buy.</p>
								</div>

								<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
									<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
										<Link href="/shop">Start Shopping</Link>
									</Button>
									<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
										<Link href="/contact">Talk to an Expert</Link>
									</Button>
								</div>
							</div>
						</div>
						<div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Shop by Intent</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Find the right collection faster</h2>
							<div className="mt-5 space-y-3">
								{categoryHighlights.map((item) => (
									<Link key={item.slug} href={`/shop?category=${encodeURIComponent(item.slug)}`} className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition hover:border-stone-300 hover:bg-white">
										<div className="h-14 w-14 shrink-0 rounded-xl bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url('${item.previewImage}')` }} />
										<div className="min-w-0">
											<p className="text-sm font-semibold text-stone-900 group-hover:text-[#1B365D]">{item.label}</p>
											<p className="mt-1 text-xs text-stone-600">{item.count > 0 ? `${item.count} products available` : "No products yet"}</p>
										</div>
										<span className="ml-auto text-xs font-semibold text-[#1B365D]">Open</span>
									</Link>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
					<div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
						{/* Left: intro card */}
						<div className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Customer Voice</p>
							<h2 className="mt-3 text-3xl font-semibold text-stone-900">Proof that your order is in safe hands</h2>

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

							{/* pushes CTAs to the bottom so the card's own content fills its height */}
							<div className="mt-6 flex flex-1 flex-wrap items-end gap-3">
								<Button asChild className="bg-[#1B365D] text-white hover:bg-[#152d4c]">
									<Link href="/shop">Shop Now</Link>
								</Button>
								<Button asChild variant="outline" className="border-stone-300 text-stone-800 hover:bg-stone-100">
									<Link href="/contact">Ask Before You Buy</Link>
								</Button>
							</div>
						</div>

						{/* Right: testimonials, vertically centered to fill the same height */}
						<div className="flex h-full min-w-0 flex-col justify-center">
							{showSlider && (
								<div className="mb-4 hidden items-center justify-end gap-2 md:flex">
									<button onClick={goPrev} disabled={page === 0} aria-label="Previous testimonials" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">
										<ChevronLeft className="h-4 w-4" />
									</button>
									<button onClick={goNext} disabled={page === pageCount - 1} aria-label="Next testimonials" className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40">
										<ChevronRight className="h-4 w-4" />
									</button>
								</div>
							)}

							{/* Desktop: paged, equal-height cards */}
							<div className="hidden overflow-hidden md:block">
								<div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${page * 100}%)` }}>
									{Array.from({ length: pageCount }).map((_, p) => (
										<div key={p} className="grid w-full flex-shrink-0 auto-rows-fr grid-cols-2 gap-4">
											{testimonials.slice(p * perPage, p * perPage + perPage).map((item, i) => (
												<TestimonialCard key={item.name} item={item} index={p * perPage + i} />
											))}
										</div>
									))}
								</div>
							</div>

							{showSlider && (
								<div className="mt-4 hidden justify-center gap-1.5 md:flex">
									{Array.from({ length: pageCount }).map((_, p) => (
										<button key={p} onClick={() => setPage(p)} aria-label={`Go to page ${p + 1}`} className={`h-1.5 rounded-full transition-all ${p === page ? "w-6 bg-[#1B365D]" : "w-1.5 bg-stone-300"}`} />
									))}
								</div>
							)}

							{/* Mobile: native swipe, one card at a time */}
							<div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								{testimonials.map((item, i) => (
									<div key={item.name} className="w-[85%] flex-shrink-0 snap-center">
										<TestimonialCard item={item} index={i} />
									</div>
								))}
							</div>
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
								<input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-full border border-stone-300 bg-stone-50 px-5 py-3 text-sm text-stone-900 outline-none sm:w-80" />

								<Button onClick={handleSubscribers} className={`${subscribing ? "opacity-50 cursor-not-allowed" : ""} rounded-full cursor-pointer bg-[#F7931E] px-6 text-white hover:bg-[#d87810]`} disabled={subscribing}>
									{subscribing ? "Subscribing..." : "Subscribe"}
								</Button>
							</div>
						</div>
					</div>
				</section>
			</main>
			<SiteFooter />
		</div>
	);
}
