import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartClient } from "@/components/cart-client";
import { SkipLink } from "@/components/skip-link";
import { getPriceZones } from "@/lib/price-zones";
import { siteConfig } from "@/app/metadata";

// Cart contents and zone pricing are per-visitor and change between admin edits;
// without this the page would statically freeze priceZones at build time.
export const dynamic = "force-dynamic";

export const metadata = {
	title: "Shopping Cart",
	description: "Review your cart, apply coupons, calculate shipping, and checkout securely with Stripe.",
	openGraph: {
		title: `Shopping Cart | ${siteConfig.name}`,
		description: "Review your cart, apply coupons, calculate shipping, and checkout securely with Stripe.",
		images: [
			{
				url: "/api/og?title=Shopping%20Cart%20|%20Global%20Handcrafts&description=Review%20your%20cart%2C%20apply%20coupons%2C%20calculate%20shipping%2C%20and%20checkout%20securely",
				width: 1200,
				height: 630,
				alt: "Shopping Cart",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Shopping Cart | ${siteConfig.name}`,
		description: "Review your cart, apply coupons, calculate shipping, and checkout securely with Stripe.",
		images: ["/api/og?title=Shopping%20Cart%20|%20Global%20Handcrafts&description=Review%20your%20cart%2C%20apply%20coupons%2C%20calculate%20shipping%2C%20and%20checkout%20securely"],
	},
};

export default async function CartPage() {
	const priceZones = await getPriceZones();

	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SkipLink />
			<SiteHeader />
			<main id="main-content" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<CartClient priceZones={priceZones} />
			</main>
			<SiteFooter />
		</div>
	);
}
