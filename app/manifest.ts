import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Global Handcrafts AS",
		short_name: "Global Handcrafts",
		description: "Authentic handcrafted temples, pooja items, and traditional products delivered across Europe.",
		start_url: "/",
		display: "standalone",
		background_color: "#f8f5f0",
		theme_color: "#1c1917",
		icons: [
			{
				src: "/icon.png",
				sizes: "any",
				type: "image/png",
			},
		],
	};
}
