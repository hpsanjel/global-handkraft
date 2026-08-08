import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/store";
import { PriceEstimate } from "@/components/price-estimate";

type HomeCategoryProductsSectionProps = {
	title: string;
	href: string;
	products: Product[];
};

export function HomeCategoryProductsSection({ title, href, products }: HomeCategoryProductsSectionProps) {
	return (
		<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
			<div className="flex items-end justify-between gap-4">
				<h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">{title}</h2>
				<Link href={href} className="text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
					Show all
				</Link>
			</div>
			{products.length === 0 ? (
				<div className="mt-8 rounded-[1.75rem] border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">No products in this category yet. Visit the shop page or check back soon.</div>
			) : (
				<div className="mt-8 no-scrollbar scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					{products.map((product) => (
						<div key={product.id} className="flex h-full w-[72vw] max-w-70 shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition md:w-70 md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
							<Link href={`/product/${product.slug}`} className="block">
								<div className="w-full aspect-5/6 bg-stone-100 bg-cover" style={{ backgroundImage: `url('${product.image}')` }} />
								<div className="px-3 pt-3 sm:px-5 sm:pt-4">
									<p className="text-sm font-semibold text-stone-900 sm:text-base line-clamp-1" title={product.name}>
										{product.name}
									</p>
								</div>
							</Link>
							<div className="mt-auto flex items-center justify-between gap-3 px-3 pb-3 pt-4 sm:px-5 sm:pb-5">
								<div>
									<p className="text-sm font-semibold text-[#1B365D] sm:text-base">NOK {product.variants[0].price}</p>
									<PriceEstimate amountNok={product.variants[0].price} className="text-xs text-stone-500" />
								</div>
								<Button asChild className="rounded-full bg-[#F7931E] px-4 py-2 text-xs text-white hover:bg-[#d87810] sm:text-sm">
									<Link href={`/product/${product.slug}`}>Buy</Link>
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
