import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Return Policy | Global Handcrafts AS",
	description: "Our return policy for online purchases.",
};

export default function ReturnsPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold mb-6">Return & Refund Policy</h1>
				<p className="text-sm text-gray-500 mb-8">Last updated: July 22, 2026</p>

				<div className="space-y-6 text-gray-700 leading-7">
					<p>
						At <strong>Global Handkraft</strong>, every product is carefully handcrafted with attention to quality. Your satisfaction is important to us, and we aim to make the return process simple and fair.
					</p>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Return Eligibility</h2>
						<p>
							You may request a return within <strong>7 days</strong> of receiving your order if the item is damaged, defective, or incorrect. Returned items must be unused, in their original condition, and include all original packaging.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Non-Returnable Items</h2>
						<ul className="list-disc ml-6 space-y-1">
							<li>Custom-made or personalized products.</li>
							<li>Items damaged due to misuse or improper handling.</li>
							<li>Products returned without prior approval.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Refunds</h2>
						<p>
							Once your returned item is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed to the original payment method within
							<strong> 5–10 business days</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Exchanges</h2>
						<p>If you receive a damaged or incorrect item, we will gladly replace it at no additional cost, subject to product availability.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Return Shipping</h2>
						<p>Customers are responsible for return shipping costs unless the item received is damaged, defective, or incorrect. In such cases, Global Handkraft will cover the return shipping expenses.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">How to Request a Return</h2>
						<p>To request a return or exchange, please contact our customer support team with your order number, a description of the issue, and photos of the product if applicable.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
						<p>
							If you have any questions regarding our Return & Refund Policy, please contact us through our website's <a href="/contact">contact form</a> or our official support <a href="mailto:hello@globalhandcraft.com">email</a>.
						</p>
					</section>

					<p className="text-sm text-gray-500 pt-6 border-t">We reserve the right to update this policy at any time. Changes will be posted on this page with the updated revision date.</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
