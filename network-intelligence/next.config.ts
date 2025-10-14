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
    '@deck.gl/react'
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