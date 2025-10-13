import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles optimization automatically, no need for standalone output
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only enable if needed.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Warning: Dangerously allow production builds to successfully complete even if
    // your project has type errors. Only enable if needed.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
