import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Since we're serving real data from GeoJSON, we need to serve it as static
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  transpilePackages: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox', '@deck.gl/aggregation-layers'],
};

export default nextConfig;