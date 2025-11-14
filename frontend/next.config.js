/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components
  serverExternalPackages: [
    "@neo4j-nvl/base",
    "@neo4j-nvl/interaction-handlers",
  ],

  // Enable compression
  compress: true,

  // Production source maps for debugging
  productionBrowserSourceMaps: false,

  // Rewrites needed for PostHog proxying
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// Conditionally apply bundle analyzer only if installed and ANALYZE env var is set
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
  } catch (error) {
    console.warn('@next/bundle-analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}
