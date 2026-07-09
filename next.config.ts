import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    // Enable automatic image optimization
    unoptimized: false,
    // Define allowed image sizes for responsive images
    sizes: {
      values: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
      },
      breakpoints: [320, 640, 1024, 1280, 1536],
    },
  },
  // Enable compression for static assets
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Enable ESLint during build
  eslint: {
    dirs: ['app', 'lib', 'utils'],
  },
};

export default nextConfig;
