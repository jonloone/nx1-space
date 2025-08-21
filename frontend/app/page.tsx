'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, MessageSquare } from 'lucide-react';
import { CompactToolBar } from '@/components/Tools/CompactToolBar';
import { ContextPanel } from '@/components/Panels/ContextPanel';
import { EnhancedAnalyticsPanel } from '@/components/Panels/EnhancedAnalyticsPanel';
import { EnhancedChatPanel } from '@/components/Panels/EnhancedChatPanel';
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
  const [showChat, setShowChat] = useState(false);
  const { selectedFeatures } = useMapStore();

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
      
      {/* Left Sidebar with Layers and Search */}
      <CompactToolBar />
      
      
      {/* Floating Action Buttons - Bottom Center with Glassmorphism */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[900] flex gap-3">
        {/* Analytics Dashboard Button */}
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="px-6 py-3 bg-black/60 backdrop-blur-md
                     border border-white/20 rounded-full
                     text-white font-semibold
                     shadow-xl hover:shadow-2xl 
                     hover:bg-white/10 hover:border-white/30
                     transition-all duration-200
                     flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          Analytics Dashboard
        </button>
        
        {/* Chat Button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="px-6 py-3 bg-black/60 backdrop-blur-md
                     border border-white/20 rounded-full
                     text-white font-semibold
                     shadow-xl hover:shadow-2xl
                     hover:bg-white/10 hover:border-white/30
                     transition-all duration-200
                     flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          AI Assistant
        </button>
      </div>
      
      {/* Analytics Panel */}
      <EnhancedAnalyticsPanel 
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
      
      {/* Chat Panel with CopilotKit */}
      <EnhancedChatPanel
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
      
      {/* Context Panel - Shows when feature is selected */}
      <ContextPanel />
      
      {/* Debug Console - Temporarily disabled due to cyclic object error */}
      {/* <ConsoleCapture /> */}
    </div>
  );
}