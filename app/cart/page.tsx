import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartClient } from "@/components/cart-client";
import { siteConfig } from "@/app/metadata";

export const metadata = {
	title: "Shopping Cart",
	description: "Review your cart, apply coupons, calculate shipping, and checkout securely with Stripe.",
	openGraph: {
		title: `Shopping Cart | ${siteConfig.name}`,
		description: "Review your cart, apply coupons, calculate shipping, and checkout securely with Stripe.",
		images: [
			{
				url: siteConfig.ogImage,
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
		images: [siteConfig.ogImage],
	},
};

export default function CartPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<CartClient />
			</main>
			<SiteFooter />
		</div>
	);
}
