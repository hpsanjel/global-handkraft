import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Global Handcraft",
		short_name: "Global Handcraft",
		description: "Premium handcrafted wooden temples for European homes.",
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
