'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { NavigationBar } from '@/components/Navigation/NavigationBar';
import { LayersPanel } from '@/components/Panels/LayersPanel';
import { AnalyticsPanel } from '@/components/Panels/AnalyticsPanel';
import { ContextPanel } from '@/components/Panels/ContextPanel';
import { SearchBar } from '@/components/Controls/SearchBar';
import { ViewModeToggle } from '@/components/Controls/ViewModeToggle';
import { LoadingScreen } from '@/components/UI/LoadingScreen';
import { useMapStore } from '@/lib/store/mapStore';

// Dynamically import map component to avoid SSR issues
const GeoCoreMap = dynamic(
  () => import('@/components/Map/GeoCoreMap'),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { domain, selectedFeatures } = useMapStore();

  useEffect(() => {
    // Initialize app
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Main Map */}
      <GeoCoreMap />
      
      {/* Top Navigation */}
      <NavigationBar />
      
      {/* Search Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
        <SearchBar />
      </div>
      
      {/* View Mode Toggle */}
      <div className="absolute top-20 right-4 z-40">
        <ViewModeToggle />
      </div>
      
      {/* Layers Panel */}
      <div className="absolute top-32 right-4 z-30">
        <LayersPanel />
      </div>
      
      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <AnalyticsPanel />
        </div>
      )}
      
      {/* Analytics Toggle */}
      <button
        onClick={() => setShowAnalytics(!showAnalytics)}
        className="absolute bottom-4 left-4 z-40 px-4 py-2 glass rounded-lg
                   hover:bg-white/10 transition-all flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Analytics
      </button>
      
      {/* Context Panel - Shows when feature is selected */}
      <ContextPanel />
      
      {/* Performance Monitor (Dev Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-50 p-2 glass rounded text-xs font-mono">
          <div>Domain: {domain}</div>
          <div>Features: {selectedFeatures.length}</div>
        </div>
      )}
    </div>
  );
}