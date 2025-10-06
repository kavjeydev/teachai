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
};

module.exports = nextConfig;
