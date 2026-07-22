import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/store";

type HomeCategoryProductsSectionProps = {
	title: string;
	href: string;
	products: Product[];
};

export function HomeCategoryProductsSection({ title, href, products }: HomeCategoryProductsSectionProps) {
	if (products.length === 0) {
		return null;
	}

	return (
		<section className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
			<div className="flex items-end justify-between gap-4">
				<h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">{title}</h2>
				<Link href={href} className="text-sm font-semibold text-[#1B365D] hover:text-[#152d4c]">
					Show all
				</Link>
			</div>
			<div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 xl:grid-cols-4">
				{products.map((product) => (
					<div key={product.id} className="flex h-full w-[72vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition md:w-auto md:max-w-none md:shrink md:duration-300 md:hover:-translate-y-1 md:hover:border-stone-300 md:hover:shadow-lg">
						<Link href={`/product/${product.slug}`} className="block">
							<div className="w-full aspect-5/6 bg-stone-100 bg-cover" style={{ backgroundImage: `url('${product.image}')` }} />
							<div className="px-3 pt-3 sm:px-5 sm:pt-4">
								<p className="text-sm font-semibold text-stone-900 sm:text-base">{product.name}</p>
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
	);
}
