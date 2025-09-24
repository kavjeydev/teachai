import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "@nextui-org/react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "lucide-react",
      "react-markdown",
      "framer-motion"
    ],
    webpackBuildWorker: true,
  },

  // External packages for server components
  serverExternalPackages: ["@neo4j-nvl/base", "@neo4j-nvl/interaction-handlers"],

  // Simplified webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Critical: Reduce module resolution time
    config.resolve.symlinks = false;

    // Exclude heavy packages from server compilation
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@neo4j-nvl/base',
        '@neo4j-nvl/interaction-handlers',
        'cytoscape',
        'cytoscape-cose-bilkent',
        'cytoscape-dagre',
        'vanta',
        'three',
      ];
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for common libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // UI libraries chunk
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /node_modules\/(@nextui-org|@radix-ui)/,
              priority: 30,
            },
            // Editor libraries chunk
            editor: {
              name: 'editor',
              chunks: 'all',
              test: /node_modules\/(@tiptap|react-markdown)/,
              priority: 30,
            },
            // Graph visualization chunk
            graph: {
              name: 'graph',
              chunks: 'all',
              test: /node_modules\/(cytoscape|@neo4j-nvl)/,
              priority: 40,
            },
            // Common chunk for shared modules
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
          },
        },
      };
    }

    // Development-specific optimizations
    if (dev) {
      // Reduce resolution time
      config.resolve.alias = {
        ...config.resolve.alias,
        // Skip unnecessary resolution
        'react-dom$': 'react-dom',
        'react$': 'react',
      };

      // Exclude heavy modules from hot reloading
      config.watchOptions = {
        ignored: [
          '**/node_modules/@neo4j-nvl/**',
          '**/node_modules/cytoscape/**',
          '**/node_modules/three/**',
          '**/node_modules/vanta/**',
        ],
      };
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable compression
  compress: true,

  // Production source maps for debugging
  productionBrowserSourceMaps: false,
};

export default nextConfig;
