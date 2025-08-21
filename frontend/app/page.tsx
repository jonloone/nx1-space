'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, MessageSquare, Sparkles } from 'lucide-react';
import { EnhancedAnalyticsPanel } from '@/components/Panels/EnhancedAnalyticsPanel';
import { EnhancedChatPanel } from '@/components/Panels/EnhancedChatPanel';
import { LoadingScreen } from '@/components/UI/LoadingScreen';
import { useFoundryStore } from '@/lib/store/foundryStore';

// Dynamically import the FoundryWorkstation
const FoundryWorkstation = dynamic(
  () => import('@/components/Foundry/FoundryWorkstation').then(mod => ({ default: mod.FoundryWorkstation })),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [useFoundryMode, setUseFoundryMode] = useState(true); // Toggle for testing
  const { currentLens } = useFoundryStore();

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
      {/* Main Foundry Workstation */}
      <FoundryWorkstation />
      
      {/* Floating Action Buttons - Only show when not in welcome view */}
      {currentLens !== 'welcome' && (
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
      )}
      
      {/* Foundry Mode Indicator */}
      <div className="absolute bottom-4 left-4 z-[900]">
        <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20
                        backdrop-blur-md border border-white/20 rounded-full
                        text-white/80 text-xs flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span>NexusOne Foundry</span>
          {currentLens !== 'welcome' && (
            <>
              <span className="text-white/40">•</span>
              <span className="capitalize">{currentLens} Lens</span>
            </>
          )}
        </div>
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
    </div>
  );
}