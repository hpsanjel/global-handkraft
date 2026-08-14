"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, ChevronDown, Leaf, Lock, ShieldCheck, Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const trustPoints = [
	{ icon: ShieldCheck, label: "Authentic Craftsmanship" },
	{ icon: Leaf, label: "Ethical Sourcing" },
	{ icon: Lock, label: "Secure Payments" },
	{ icon: Truck, label: "Europe-Wide Shipping" },
];

const headlineWords = [
	{ text: "Authentic", gold: false },
	{ text: "Handcrafted", gold: false },
	{ text: "Treasures,", gold: true },
	{ text: "Delivered", gold: false },
	{ text: "Across", gold: false },
	{ text: "Europe", gold: false },
];

interface HeroSectionProps {
	secondaryCtaHref?: string;
	secondaryCtaLabel?: string;
	rating?: number;
}

export function HeroSection({ secondaryCtaHref = "/shop", secondaryCtaLabel = "Explore Collections", rating = 4.9 }: HeroSectionProps) {
	const shouldReduceMotion = useReducedMotion();
	const sectionRef = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
	const backdropY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 70]);
	const imageY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -50]);

	const fadeUp: Variants = {
		hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
		show: (i: number = 0) => ({
			opacity: 1,
			y: 0,
			transition: { duration: 0.6, delay: shouldReduceMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] },
		}),
	};

	const wordVariants: Variants = {
		hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
		show: (i: number = 0) => ({
			opacity: 1,
			y: 0,
			transition: { duration: 0.55, delay: shouldReduceMotion ? 0 : 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
		}),
	};

	return (
		<section ref={sectionRef} className="relative overflow-hidden border-b border-gold/20 bg-[#fff8eb]">
			{/* Decorative animated backdrop — drifts on scroll for a subtle parallax layer */}
			<motion.div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ y: backdropY }}>
				<div className="absolute inset-0 bg-[linear-gradient(180deg,#1b365d0d_0%,transparent_55%)]" />
				<div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-navy/10 blur-3xl motion-safe:animate-[hero-drift_14s_ease-in-out_infinite]" />
				<div className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-gold/20 blur-3xl motion-safe:animate-[hero-drift_18s_ease-in-out_infinite_1.5s]" />
				<div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl motion-safe:animate-[hero-drift_16s_ease-in-out_infinite_0.8s]" />
				<div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#1b365d1a_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_10%,transparent_70%)]" style={{}} />
				<motion.svg className="absolute -right-16 -top-16 h-64 w-64 text-gold/25 sm:h-80 sm:w-80" viewBox="0 0 200 200" fill="none" animate={shouldReduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }}>
					<circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1" strokeDasharray="2 8" />
					<circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
				</motion.svg>
			</motion.div>

			<div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-28">
				<div className="max-w-2xl">
					<motion.div custom={0} initial="hidden" animate="show" variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur-sm">
						<motion.span className="flex h-2 w-2 rounded-full bg-gold" animate={shouldReduceMotion ? undefined : { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
						<span className="text-xs font-semibold uppercase tracking-[0.25em] text-navy">Global Handcrafts AS</span>
					</motion.div>

					<h1 className="font-heading text-4xl font-semibold leading-[1.1] text-stone-900 sm:text-5xl lg:text-6xl">
						{headlineWords.map((word, i) => (
							<motion.span key={word.text} custom={i} initial="hidden" animate="show" variants={wordVariants} className={`mr-3 inline-block ${word.gold ? "bg-gradient-to-r from-gold via-[#b8860b] to-gold bg-clip-text text-transparent" : ""}`}>
								{word.text}
							</motion.span>
						))}
					</h1>

					<motion.p custom={1} initial="hidden" animate="show" variants={fadeUp} className="mt-6 max-w-xl text-lg leading-8 text-stone-700">
						Premium handcrafted temples, pooja items, traditional clothing, and cultural products sourced directly from skilled artisans across Nepal and South Asia.
					</motion.p>

					<motion.div custom={2} initial="hidden" animate="show" variants={fadeUp} className="mt-9 flex flex-wrap gap-4">
						<Button asChild className="group bg-navy px-6 py-3.5 text-white shadow-lg shadow-navy/20 transition hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-xl hover:shadow-navy/25">
							<Link href="/shop">
								Shop Now
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
						</Button>
						<Button asChild variant="outline" className="border-gold/50 bg-white/70 px-6 py-3.5 text-navy backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10">
							<Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
						</Button>
					</motion.div>

					<motion.div custom={3} initial="hidden" animate="show" variants={fadeUp} className="mt-11 flex flex-wrap gap-x-7 gap-y-4">
						{trustPoints.map((point) => (
							<div key={point.label} className="flex items-center gap-2.5">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-navy ring-1 ring-gold/30">
									<point.icon className="h-4 w-4" />
								</span>
								<span className="text-sm font-medium text-stone-700">{point.label}</span>
							</div>
						))}
					</motion.div>
				</div>

				{/* Outer layer only carries scroll parallax, so it doesn't fight the entrance animation's own `y` below */}
				<motion.div style={{ y: imageY }} className="relative mx-auto w-full max-w-md lg:max-w-none">
					<motion.div initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94, y: shouldReduceMotion ? 0 : 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative">
						<div className="absolute -inset-4 rotate-2 rounded-[2.25rem] border border-gold/40 sm:-inset-5" aria-hidden="true" />
						<div className="relative aspect-[5/4] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-navy/20 ring-1 ring-gold/30 motion-safe:animate-[hero-float_7s_ease-in-out_infinite]">
							<Image src="/images/temple-main.webp" alt="Handcrafted wooden temple by Global Handcrafts AS" fill priority sizes="(min-width: 1024px) 42vw, 90vw" className="object-cover" />
							<div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent" />
						</div>

						<motion.div initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }} className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-lg shadow-navy/10 backdrop-blur-md sm:-left-8">
							<div className="flex items-center gap-0.5 text-gold">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? "fill-gold text-gold" : "fill-transparent text-gold/40"}`} />
								))}
							</div>
							<div className="border-l border-stone-200 pl-3">
								<p className="text-sm font-semibold text-stone-900">{rating.toFixed(1)} Average Rating</p>
								<p className="text-xs text-stone-700">From verified customers</p>
							</div>
						</motion.div>

						<motion.div initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.05, ease: [0.22, 1, 0.36, 1] }} className="absolute -top-5 right-2 rounded-full border border-gold/40 bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-navy/25 sm:right-6">
							Sourced from Nepal &amp; South Asia
						</motion.div>
					</motion.div>
				</motion.div>
			</div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="relative hidden justify-center pb-8 lg:flex">
				<motion.div animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center gap-1 text-navy/50">
					<span className="text-xs font-medium uppercase tracking-[0.2em]">Scroll to explore</span>
					<ChevronDown className="h-4 w-4" />
				</motion.div>
			</motion.div>
		</section>
	);
}
