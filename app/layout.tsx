import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Global Handcrafts AS",
	description: "Premium handcrafted temples, pooja items, and cultural products for customers across Norway and Europe.",
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
	robots: {
		index: true,
		follow: true,
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full antialiased" suppressHydrationWarning>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
