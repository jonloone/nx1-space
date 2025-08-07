'use client';

/**
 * H3 Ground Station Opportunity Analysis Demo Page
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the demo component to avoid SSR issues
const H3OpportunityDemo = dynamic(() => import('@/components/h3-opportunity-demo'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-40"></div>
        </div>
      </div>
    </div>
  )
});

export default function H3DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading H3 Demo...</div>}>
        <H3OpportunityDemo />
      </Suspense>
    </div>
  );
}