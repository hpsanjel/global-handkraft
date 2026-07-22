import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
	title: "Privacy Policy | Global Handcrafts AS",
	description: "Privacy policy for Global Handcrafts AS.",
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<SiteHeader />
			<main className="max-w-4xl mx-auto px-6 py-12">
				<h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
				<p className="text-sm text-gray-500 mb-8">Last updated: July 22, 2026</p>

				<div className="space-y-6 text-gray-700 leading-7">
					<p>
						At <strong>Global Handkraft</strong>, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
					</p>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
						<p>When you use our website, we may collect information such as your name, email address, phone number, shipping address, and payment details when you place an order or contact us.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">How We Use Your Information</h2>
						<ul className="list-disc ml-6 space-y-1">
							<li>Process and deliver your orders.</li>
							<li>Respond to your questions and support requests.</li>
							<li>Improve our website and customer experience.</li>
							<li>Send order updates and important notifications.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Data Protection</h2>
						<p>We take reasonable security measures to protect your personal information. We never sell or rent your personal data to third parties.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Third-Party Services</h2>
						<p>We may use trusted third-party services for payment processing, shipping, analytics, and website hosting. These providers only receive the information necessary to perform their services.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Cookies</h2>
						<p>Our website may use cookies to enhance your browsing experience, remember your preferences, and improve site performance. You can disable cookies in your browser settings if you prefer.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Your Rights</h2>
						<p>You may request access to, correction of, or deletion of your personal information by contacting us.</p>
					</section>

					<section>
						<h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
						<p>If you have any questions about this Privacy Policy, please contact us through our website or via our official support email.</p>
					</section>

					<p className="text-sm text-gray-500 pt-6 border-t">By using Global Handkraft, you agree to the terms of this Privacy Policy.</p>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
