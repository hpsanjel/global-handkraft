import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Terms & Conditions | Global Handcrafts AS",
	description: "Terms and conditions for Global Handcrafts AS purchases.",
};

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>
				<p className="text-sm text-gray-500 mb-8">Last updated: July 22, 2026</p>

				<div className="space-y-6 text-gray-700 leading-7">
					<p>
						Welcome to <strong>Global Handkraft</strong>. By accessing our website or placing an order, you agree to these Terms & Conditions. Please read them carefully before making a purchase.
					</p>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Orders</h2>
						<p>All orders are subject to acceptance and product availability. We reserve the right to cancel or refuse any order at our discretion.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Pricing & Payment</h2>
						<p>All prices are displayed in the applicable currency and may change without prior notice. Payment must be completed before an order is processed and shipped.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Shipping</h2>
						<p>
							Shipping times are estimates and may vary depending on the destination, customs clearance, and other factors beyond our control. Please refer to our <a href="/shipping">Shipping Policy</a> for more details.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Returns & Refunds</h2>
						<p>
							Returns and refunds are handled according to our <a href="/returns">Return & Refund Policy</a>. Please review the policy before requesting a return.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Product Information</h2>
						<p>Many of our products are handmade, so slight variations in color, size, texture, or design are natural and make each item unique.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Intellectual Property</h2>
						<p>All website content, including text, images, logos, and designs, is the property of Global Handkraft and may not be copied, reproduced, or distributed without written permission.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Limitation of Liability</h2>
						<p>Global Handkraft is not responsible for indirect or consequential damages arising from the use of our website or products, to the extent permitted by applicable law.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Changes to Terms</h2>
						<p>We reserve the right to update these Terms & Conditions at any time. Continued use of our website after changes are posted constitutes acceptance of the updated terms.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
						<p>If you have any questions about these Terms & Conditions, please contact us through our website or our official support email.</p>
					</section>

					<p className="text-sm text-gray-500 pt-6 border-t">
						By purchasing from <strong>Global Handkraft</strong>, you agree to these Terms & Conditions, as well as our Privacy Policy, Shipping Policy, and Return & Refund Policy.
					</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
