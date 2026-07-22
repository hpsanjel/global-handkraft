import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Shipping Policy | Global Handcrafts AS",
	description: "Our shipping policy for handcrafted furniture and temples.",
};

export default function ShippingPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold mb-6">Shipping Policy</h1>
				<p className="text-sm text-gray-500 mb-8">Last updated: July 22, 2026</p>

				<div className="space-y-6 text-gray-700 leading-7">
					<p>
						At <strong>Global Handkraft</strong>, we take pride in delivering authentic handcrafted products safely and efficiently to customers worldwide.
					</p>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Order Processing</h2>
						<p>
							Orders are typically processed within <strong>1–3 business days</strong>
							after payment confirmation. Custom or made-to-order items may require additional processing time.
						</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Shipping Time</h2>
						<ul className="list-disc ml-6 space-y-1">
							<li>
								Domestic orders: <strong>2–7 business days</strong>.
							</li>
							<li>
								International orders: <strong>7–21 business days</strong>, depending on the destination and customs processing.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Shipping Charges</h2>
						<p>Shipping costs are calculated at checkout based on the destination, package size, and selected shipping method. Any applicable customs duties or import taxes are the responsibility of the customer unless otherwise stated.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Order Tracking</h2>
						<p>Once your order has been shipped, you will receive a confirmation email with tracking information (where available) so you can monitor your shipment.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Delays</h2>
						<p>Delivery times are estimates and may be affected by weather, holidays, customs clearance, or other circumstances beyond our control. We appreciate your patience in such cases.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Lost or Damaged Packages</h2>
						<p>If your package arrives damaged or is lost during transit, please contact us as soon as possible. We will work with the shipping carrier to resolve the issue and provide an appropriate solution.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
						<p>If you have any questions about shipping, delivery, or your order, please contact us through our website or our official support email.</p>
					</section>

					<p className="text-sm text-gray-500 pt-6 border-t">By placing an order with Global Handkraft, you agree to this Shipping Policy.</p>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
