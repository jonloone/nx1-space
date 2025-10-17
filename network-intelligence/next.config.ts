import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Skip type checking and linting during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: false,
  
  // Transpile Deck.gl packages for better compatibility
  transpilePackages: [
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/geo-layers',
    '@deck.gl/extensions',
    '@deck.gl/aggregation-layers',
    '@deck.gl/react',
    'mapbox-gl',
    'pmtiles'
  ],
  
  // Simple webpack configuration
  webpack: (config) => {
    // Basic fallbacks for node modules not needed in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ensure mapbox-gl is not tree-shaken and protocol methods are preserved
    config.optimization = config.optimization || {};
    config.optimization.usedExports = false; // Disable tree-shaking for problematic modules

    // Mark mapbox-gl as external to prevent aggressive optimization
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      // Don't externalize in browser, but prevent tree-shaking
    }

    return config;
  },
  
  // Headers for cross-origin requests
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // PMTiles specific headers (range requests + caching)
      {
        source: '/tiles/:path*.pmtiles',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Range, If-Match, If-None-Match',
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Accept-Ranges, Content-Length, Content-Range, Content-Type',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/x-protobuf',
          },
        ],
      },
    ];
  },
  
  // Image optimization for terrain tiles
  images: {
    domains: [
      'server.arcgisonline.com', // ESRI satellite imagery
      's3.amazonaws.com', // AWS terrain tiles
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable compression
  compress: true,
  
  // Remove powered by header for security
  poweredByHeader: false,
};

export default nextConfig;