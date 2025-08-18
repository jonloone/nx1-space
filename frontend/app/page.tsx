'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LayersPanel } from '@/components/Panels/LayersPanel';
import { AnalyticsPanel } from '@/components/Panels/AnalyticsPanel';
import { ContextPanel } from '@/components/Panels/ContextPanel';
import { SearchChatBar } from '@/components/SearchChat/SearchChatBar';
import { LoadingScreen } from '@/components/UI/LoadingScreen';
import { useMapStore } from '@/lib/store/mapStore';
// import { ConsoleCapture } from '@/components/Debug/ConsoleCapture';

// Dynamically import the fixed map component
const GeoCoreMap = dynamic(
  () => import('@/components/Map/GeoCoreMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Loading map component...
      </div>
    )
  }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { domain, selectedFeatures } = useMapStore();

  useEffect(() => {
    console.log('[HomePage] Initializing app...');
    // Shorter loading time since map is now working
    const timer = setTimeout(() => {
      console.log('[HomePage] Setting loading to false');
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Main Map */}
      <GeoCoreMap />
      
      {/* Layers Panel - Now at top since no header */}
      <div className="absolute top-4 right-4 z-30">
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
      
      {/* Search/Chat Bar - Fixed at bottom center */}
      <SearchChatBar />
      
      {/* Debug Console - Temporarily disabled due to cyclic object error */}
      {/* <ConsoleCapture /> */}
    </div>
  );
}