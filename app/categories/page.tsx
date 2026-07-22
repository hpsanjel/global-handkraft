import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { categories, products } from "@/lib/data/products";

export const metadata = {
	title: "Categories | Global Handcrafts AS",
	description: "Explore handcrafted temples, pooja items, traditional clothing, mandap, and premium cultural collections.",
};

const categorySummaries: Record<string, string> = {
	"Handcrafted Wooden Temples": "Small to premium handcrafted temples in teak, rosewood, and custom builds.",
	"Traditional Clothes": "Curated ethnic wear for men and women, including festive and ceremonial styles.",
	"Pooja Items": "Brass, copper, and ritual accessories designed for daily worship and special occasions.",
	"Pooja Mandap": "Indoor and outdoor mandap solutions for ceremonies, temples, and events.",
	"Gift Collection": "Premium cultural gifting bundles for housewarming and festive celebrations.",
	"New Arrivals": "Fresh seasonal launches and newly curated artisan products.",
};

const gradients = ["from-[#4CAF50] via-[#7BC67E] to-[#D4AF37]", "from-[#1B365D] via-[#2E4C73] to-[#4CAF50]", "from-[#F7931E] via-[#F4B257] to-[#D4AF37]", "from-[#1B365D] via-[#4CAF50] to-[#F7931E]"];

export default function CategoriesPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="max-w-3xl">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Collections</p>
					<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">Browse by category</h1>
					<p className="mt-5 text-lg leading-8 text-stone-600">Discover curated collections inspired by temple traditions, artisan skill, and premium cultural gifting across Europe.</p>
				</div>

				<div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{categories.map((category, index) => {
						const itemCount = products.filter((product) => product.category === category).length;
						const gradientClass = gradients[index % gradients.length];

						return (
							<Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="group rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
								<div className={`inline-flex rounded-full bg-gradient-to-r ${gradientClass} px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white`}>{itemCount} products</div>
								<h2 className="mt-4 text-2xl font-semibold text-stone-900">{category}</h2>
								<p className="mt-3 text-sm leading-7 text-stone-600">{categorySummaries[category] ?? "Curated handcrafted products for cultural homes and events."}</p>
								<p className="mt-5 text-sm font-semibold text-stone-900 transition group-hover:text-stone-700">Explore collection</p>
							</Link>
						);
					})}
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
