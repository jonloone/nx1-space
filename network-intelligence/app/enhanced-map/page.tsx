'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Professional Intelligence Platform with three-layer architecture
const ProfessionalIntelligencePlatform = dynamic(
  () => import('@/components/ProfessionalIntelligencePlatform'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading Intelligence Platform...</div>
      </div>
    )
  }
);

export default function EnhancedMapPage() {
  return (
    <div className="h-screen w-full">
      <ProfessionalIntelligencePlatform />
    </div>
  );
}