'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the final map component to avoid SSR issues
const EnhancedMapFinal = dynamic(
  () => import('@/components/enhanced-map-final').then(mod => mod.EnhancedMapFinal),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white">Loading Enhanced Map...</div>
      </div>
    )
  }
);

export default function EnhancedMapPage() {
  return (
    <div className="h-screen w-full">
      <EnhancedMapFinal />
    </div>
  );
}