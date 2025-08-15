/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Allow external images
  images: {
    domains: ['api.maptiler.com', 'tile.openstreetmap.org'],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY || 't7mqwGtsMHQJRwcP33Bi',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://0.0.0.0:3001',
  },
  
  // Webpack configuration for deck.gl
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/app',
    };
    
    return config;
  },
  
  // API rewrites for development
  async rewrites() {
    return [
      {
        source: '/api/geocore/:path*',
        destination: 'http://0.0.0.0:3001/api/:path*',
      },
      {
        source: '/api/trino/:path*',
        destination: 'http://0.0.0.0:8080/v1/:path*',
      },
    ];
  },
  
  // Allow connections from any IP
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
};

module.exports = nextConfig;