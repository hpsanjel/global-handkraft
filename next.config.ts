import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Image optimization settings
	images: {
		// Enable automatic image optimization
		unoptimized: false,
		// Product/category/review photos are served from Supabase Storage's public
		// object URLs, which next/image otherwise refuses to optimize as an
		// unconfigured remote host.
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
	// Enable compression for static assets
	compress: true,
	// The document generation module reads font files from disk at runtime
	// (@react-pdf/renderer embeds them into generated PDFs). Vercel's build-time
	// file tracer can't see that dynamic fs.readFileSync call, so the font
	// assets must be declared explicitly or they're missing in production.
	outputFileTracingIncludes: {
		"app/api/**/*": ["lib/documents/assets/fonts/**"],
	},
};

export default nextConfig;
