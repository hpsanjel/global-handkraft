import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Image optimization settings
	images: {
		// Enable automatic image optimization
		unoptimized: false,
	},
	// Enable compression for static assets
	compress: true,
};

export default nextConfig;
