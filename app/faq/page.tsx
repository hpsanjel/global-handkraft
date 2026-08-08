import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FaqAccordion, type FaqCategory } from "@/components/faq-accordion";
import { siteConfig } from "@/app/metadata";

export const metadata = {
	title: "FAQ",
	description: "Answers to the most common questions about ordering, payment, shipping, custom mandap and temple builds, and returns at Global Handcrafts AS.",
	openGraph: {
		title: `Frequently Asked Questions | ${siteConfig.name}`,
		description: "Answers to the most common questions about ordering, payment, shipping, custom builds, and returns.",
		images: [
			{
				url: "/api/og?title=Frequently%20Asked%20Questions&description=Answers%20to%20the%20most%20common%20questions%20about%20ordering%2C%20payment%2C%20shipping%2C%20and%20returns",
				width: 1200,
				height: 630,
				alt: "Global Handcrafts FAQ",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: `Frequently Asked Questions | ${siteConfig.name}`,
		description: "Answers to the most common questions about ordering, payment, shipping, custom builds, and returns.",
		images: ["/api/og?title=Frequently%20Asked%20Questions&description=Answers%20to%20the%20most%20common%20questions%20about%20ordering%2C%20payment%2C%20shipping%2C%20and%20returns"],
	},
};

const faqCategories: FaqCategory[] = [
	{
		id: "orders-payment",
		label: "Orders & Payment",
		icon: "orders",
		items: [
			{
				id: "payment-methods",
				question: "What payment methods do you accept?",
				answer: "We accept all major credit and debit cards, including Visa, Mastercard, and American Express, processed securely through Stripe at checkout.",
			},
			{
				id: "payment-security",
				question: "Is my payment information secure?",
				answer: "Yes. Every payment is processed directly by Stripe, one of the world's most trusted payment providers. Your card details are encrypted and never stored on our servers.",
			},
			{
				id: "discount-codes",
				question: "Can I use a discount or coupon code?",
				answer: "Yes, you can enter a valid coupon code at checkout. Some coupons require a minimum order value or apply to specific products, and any restrictions will be shown when the code is applied.",
			},
			{
				id: "order-changes",
				question: "Can I change or cancel my order after placing it?",
				answer: "Contact us as soon as possible by email or WhatsApp with your order number. We can usually amend or cancel an order before it has been processed for shipping, but we cannot guarantee changes once it is already on its way.",
			},
		],
	},
	{
		id: "shipping-delivery",
		label: "Shipping & Delivery",
		icon: "shipping",
		items: [
			{
				id: "ship-countries",
				question: "Which countries do you ship to?",
				answer: "We ship across Norway and to customers throughout Europe, including Sweden, Denmark, Finland, and Germany.",
			},
			{
				id: "ship-cost",
				question: "How much does shipping cost?",
				answer: "Shipping is calculated at checkout based on your delivery address and the size and weight of your order, using live rates from Bring (Posten Norge) and PostNord. Orders above certain thresholds may qualify for free shipping.",
			},
			{
				id: "ship-time",
				question: "How long will delivery take?",
				answer: "Domestic orders within Norway typically arrive within 2–7 business days. International orders across Europe usually take 7–21 business days depending on the destination and customs processing.",
			},
			{
				id: "customs-duties",
				question: "Will I need to pay customs duties or import VAT?",
				answer: "Country-specific VAT is applied at checkout where applicable. Depending on your destination, additional customs duties or import charges may be assessed by local authorities on delivery, and these are the responsibility of the customer.",
			},
			{
				id: "order-tracking",
				question: "Can I track my order?",
				answer: "Yes. Once your order ships, you'll receive an email with tracking details, and you can also view live order status and documents from your account's order history.",
			},
		],
	},
	{
		id: "custom-orders",
		label: "Custom Orders & Mandap Builds",
		icon: "custom",
		items: [
			{
				id: "custom-request",
				question: "Can I order a custom temple or mandap?",
				answer: "Yes. Submit a custom order inquiry with your preferred dimensions, materials, budget range, and any reference images, and our team will review it and respond with guidance and a quote.",
			},
			{
				id: "custom-payment",
				question: "How does pricing and payment work for a custom build?",
				answer: "After reviewing your inquiry, we'll message you directly through your account with a personalized quote and a secure Stripe payment link. Nothing is charged until you review and accept the quote.",
			},
			{
				id: "custom-timeline",
				question: "How long does a custom build take to complete?",
				answer: "Because each piece is handcrafted to order, custom builds take longer than in-stock items. Your estimated timeline will be confirmed together with your quote.",
			},
		],
	},
	{
		id: "returns-refunds",
		label: "Returns & Refunds",
		icon: "returns",
		items: [
			{
				id: "returns-policy",
				question: "What is your returns policy?",
				answer: "Because our products are handcrafted, all sales are final and we do not accept returns or exchanges for change of mind or incorrect selection. Please review product dimensions, materials, and details carefully before ordering.",
			},
			{
				id: "damaged-item",
				question: "My order arrived damaged, defective, or incorrect — what do I do?",
				answer: "Contact our support team within 7 days of delivery with your order number and photos of the issue, and we'll work with you to make it right.",
			},
			{
				id: "custom-returns",
				question: "Can I return a custom-made temple or mandap?",
				answer: "Custom builds are made specifically to your order and are non-refundable once production begins, except in the case of a manufacturing defect. See our Returns Policy for full details.",
			},
		],
	},
	{
		id: "products-authenticity",
		label: "Products & Authenticity",
		icon: "products",
		items: [
			{
				id: "authenticity",
				question: "Are your products genuinely handcrafted?",
				answer: "Yes. Every temple, pooja item, and cultural product is sourced directly from skilled artisans across Nepal and South Asia, made using traditional techniques and materials.",
			},
			{
				id: "product-care",
				question: "How do I care for wooden temples and brass or copper pooja items?",
				answer: "Keep wooden pieces away from direct sunlight and excess moisture, and dust with a soft dry cloth. Brass and copper items can be polished periodically with a suitable metal polish to maintain their shine. Care notes specific to your item are included with each order.",
			},
			{
				id: "product-questions",
				question: "I have a question about a product's size, material, or stock — who do I ask?",
				answer: "Each product page lists dimensions, materials, and available variants. If you still have questions, reach out through our contact page and our team will help before you order.",
			},
		],
	},
	{
		id: "account-support",
		label: "Account & Support",
		icon: "account",
		items: [
			{
				id: "guest-checkout",
				question: "Do I need an account to place an order?",
				answer: "Creating an account lets you track orders, download invoices and receipts, and manage custom order requests in one place, so we recommend signing up before you check out.",
			},
			{
				id: "contact-support",
				question: "How do I contact customer support?",
				answer: "You can reach us by email, WhatsApp, or through our contact page, and our team will get back to you as soon as possible.",
			},
			{
				id: "leave-review",
				question: "How do I leave a review for a product I bought?",
				answer: "Visit the product page and submit your rating and review. Reviews are checked by our team and published shortly after approval.",
			},
			{
				id: "data-privacy",
				question: "How is my personal data handled?",
				answer: "We handle your data in line with our Privacy Policy, and you can request a data export or account deletion at any time from your account settings.",
			},
		],
	},
];

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqCategories.flatMap((category) =>
		category.items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	),
};

export default function FaqPage() {
	return (
		<div className="min-h-screen bg-stone-50 text-stone-800">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
			<SiteHeader />
			<main>
				<div className="border-b border-stone-200 bg-white">
					<div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Help Center</p>
						<h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">Frequently Asked Questions</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600">Everything you need to know about ordering, payment, shipping, custom mandap and temple builds, and returns.</p>
					</div>
				</div>

				<div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex flex-wrap justify-center gap-2 py-6">
						{faqCategories.map((category) => (
							<a key={category.id} href={`#${category.id}`} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:text-stone-950 sm:text-sm">
								{category.label}
							</a>
						))}
					</div>
				</div>

				<div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
					<FaqAccordion categories={faqCategories} />
				</div>

				<div className="border-t border-stone-200 bg-white">
					<div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
						<h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">Still have questions?</h2>
						<p className="mt-3 text-stone-600">Our team is happy to help with anything not covered here.</p>
						<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
							<Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
								Contact us
							</Link>
							<a href="https://wa.me/4791267612" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-100">
								Chat on WhatsApp
							</a>
						</div>
					</div>
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
