import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Returns Policy | Global Handcrafts AS",
	description: "Our returns policy for online purchases.",
};

export default function ReturnsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold mb-6">Returns Policy</h1>
				<p className="text-sm text-gray-500 mb-8">Last updated: August 7, 2026</p>

				<div className="space-y-6 text-gray-700 leading-7">
					<p>
						At <strong>Global Handcrafts</strong>, every product is carefully handcrafted with attention to quality. Because of the handmade nature of our products, all sales are final.
					</p>

					<section>
						<h2 className="text-2xl font-semibold mb-2">No Returns or Exchanges</h2>
						<p>We do not accept returns or exchanges for change of mind, incorrect selection, or similar reasons. Please review product details, dimensions, and materials carefully before placing your order.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Damaged, Defective, or Incorrect Items</h2>
						<p>If your order arrives damaged, defective, or different from what you ordered, contact our support team within 7 days of delivery with your order number and photos of the issue, and we will make it right.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
						<p>
							If you have any questions regarding this policy, please contact us through our website&apos;s <a href="/contact">contact form</a> or our official support <a href="mailto:hello@handcraftsglobal.com">email</a>.
						</p>
					</section>

					<p className="text-sm text-gray-500 pt-6 border-t">We reserve the right to update this policy at any time. Changes will be posted on this page with the updated revision date.</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
