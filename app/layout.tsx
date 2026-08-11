import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartDrawerProvider } from "@/components/cart-drawer-provider";
import { CookieNotice } from "@/components/cookie-notice";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CurrencyInit } from "@/components/currency-init";
import { CountryDetection } from "@/components/country-detection";
import { getPriceZones } from "@/lib/price-zones";
import { siteConfig } from "@/app/metadata";

export const metadata: Metadata = {
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.name}`,
	},
	description: siteConfig.description,
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url),
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: "/images/favicon_v2.ico",
		apple: "/images/apple-touch-icon.png",
		other: [
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				url: "/images/android-chrome-192x192.png",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "512x512",
				url: "/images/android-chrome-512x512.png",
			},
		],
	},
	openGraph: {
		type: "website",
		locale: "en_NO",
		url: siteConfig.url,
		title: siteConfig.title,
		description: siteConfig.description,
		siteName: siteConfig.name,
		images: [
			{
				url: siteConfig.ogImage,
				width: 1200,
				height: 630,
				alt: siteConfig.title,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
		images: [siteConfig.ogImage],
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const priceZones = await getPriceZones();

	return (
		<html lang="en" className="h-full antialiased" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;800&display=swap" rel="stylesheet" />
			</head>
			<body className="min-h-full flex flex-col">
				{children}
				<CartDrawerProvider priceZones={priceZones} />
				<CookieNotice />
				<WhatsAppButton />
				<CurrencyInit />
				<CountryDetection />
			</body>
		</html>
	);
}
