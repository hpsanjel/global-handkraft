import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Global Handcrafts AS - Buy premium handcrafted products",
		short_name: "Global Handcrafts",
		description: "Authentic handcrafted temples, pooja items, and traditional products delivered across Europe.",
		start_url: "/",
		display: "standalone",
		background_color: "#f8f5f0",
		theme_color: "#1c1917",
		icons: [
			{
				src: "/images/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/images/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
