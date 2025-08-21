'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFoundryStore, LensType } from '@/lib/store/foundryStore';
import { LensSelector } from './LensSelector';
import { WelcomeView } from './views/WelcomeView';
import { LoadingScreen } from '@/components/UI/LoadingScreen';

// Lazy load lens components for better performance
const SpatialLens = dynamic(() => import('./lenses/SpatialLens'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

const NetworkLens = dynamic(() => import('./lenses/NetworkLens'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

const TemporalLens = dynamic(() => import('./lenses/TemporalLens'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

const HybridLens = dynamic(() => import('./lenses/HybridLens'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export const FoundryWorkstation: React.FC = () => {
  const { 
    currentLens, 
    isTransitioning, 
    setTransitioning,
    preferences 
  } = useFoundryStore();
  
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize on mount
    setIsInitialized(true);
    
    // Handle transition animation
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, 300); // Match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, setTransitioning]);

  const renderLens = () => {
    const transitionClass = isTransitioning && preferences.animationsEnabled
      ? 'opacity-0 scale-95'
      : 'opacity-100 scale-100';
    
    const className = `w-full h-full transition-all duration-300 ${transitionClass}`;

    switch (currentLens) {
      case 'welcome':
        return <WelcomeView className={className} />;
      case 'spatial':
        return <SpatialLens className={className} />;
      case 'network':
        return <NetworkLens className={className} />;
      case 'temporal':
        return <TemporalLens className={className} />;
      case 'hybrid':
        return <HybridLens className={className} />;
      default:
        return <WelcomeView className={className} />;
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Main Canvas */}
      <div className="absolute inset-0 z-0">
        {renderLens()}
      </div>
      
      {/* Lens Selector Navigation */}
      {currentLens !== 'welcome' && (
        <LensSelector />
      )}
      
      {/* Status Indicators */}
      <div className="absolute bottom-4 right-4 z-50">
        {isTransitioning && (
          <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full 
                          border border-white/20 text-white/60 text-xs">
            Switching lens...
          </div>
        )}
      </div>
    </div>
  );
};