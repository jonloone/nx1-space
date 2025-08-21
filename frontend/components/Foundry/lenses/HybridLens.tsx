'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useFoundryStore } from '@/lib/store/foundryStore';
import { LayoutGrid, Maximize2, Minimize2, Lock, Unlock } from 'lucide-react';

// Lazy load lens components
const SpatialLens = dynamic(() => import('./SpatialLens'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/50" />,
});

const NetworkLens = dynamic(() => import('./NetworkLens'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/50" />,
});

const TemporalLens = dynamic(() => import('./TemporalLens'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/50" />,
});

interface HybridLensProps {
  className?: string;
}

type LayoutType = 'horizontal' | 'vertical' | 'grid' | 'pip';
type ViewType = 'spatial' | 'network' | 'temporal';

const HybridLens: React.FC<HybridLensProps> = ({ className = '' }) => {
  const { shared, updateLensState } = useFoundryStore();
  const [layout, setLayout] = useState<LayoutType>('horizontal');
  const [isSynchronized, setIsSynchronized] = useState(true);
  const [primaryView, setPrimaryView] = useState<ViewType>('spatial');
  const [secondaryView, setSecondaryView] = useState<ViewType>('network');

  React.useEffect(() => {
    updateLensState('hybrid', {
      enteredAt: new Date(),
      layout,
      synchronized: isSynchronized,
      views: [primaryView, secondaryView],
    });
  }, [layout, isSynchronized, primaryView, secondaryView]);

  const renderView = (view: ViewType) => {
    switch (view) {
      case 'spatial':
        return <SpatialLens />;
      case 'network':
        return <NetworkLens />;
      case 'temporal':
        return <TemporalLens />;
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'grid grid-cols-2 gap-1';
      case 'vertical':
        return 'grid grid-rows-2 gap-1';
      case 'grid':
        return 'grid grid-cols-2 grid-rows-2 gap-1';
      case 'pip':
        return 'relative';
      default:
        return 'grid grid-cols-2 gap-1';
    }
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Layout Controls */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[900]">
        <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-xl 
                        border border-white/20 rounded-full shadow-2xl">
          {/* Layout Options */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLayout('horizontal')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'horizontal' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Horizontal Split"
            >
              <svg className="w-4 h-4 text-white/80" viewBox="0 0 16 16">
                <rect x="1" y="3" width="6" height="10" fill="currentColor" opacity="0.5" />
                <rect x="9" y="3" width="6" height="10" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => setLayout('vertical')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'vertical' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Vertical Split"
            >
              <svg className="w-4 h-4 text-white/80" viewBox="0 0 16 16">
                <rect x="3" y="1" width="10" height="6" fill="currentColor" opacity="0.5" />
                <rect x="3" y="9" width="10" height="6" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition-colors ${
                layout === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4 text-white/80" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/20" />

          {/* Synchronization Toggle */}
          <button
            onClick={() => setIsSynchronized(!isSynchronized)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isSynchronized ? (
              <>
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">Synced</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-white/40" />
                <span className="text-white/40 text-sm">Independent</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Containers */}
      {layout === 'pip' ? (
        // Picture-in-Picture Layout
        <div className="relative w-full h-full">
          {/* Main View */}
          <div className="absolute inset-0">
            {renderView(primaryView)}
          </div>
          
          {/* PiP View */}
          <div className="absolute bottom-6 right-6 w-96 h-64 border-2 border-white/20 
                          rounded-lg overflow-hidden shadow-2xl">
            <div className="relative w-full h-full">
              {renderView(secondaryView)}
              
              {/* PiP Controls */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button className="p-1 bg-black/60 rounded hover:bg-black/80">
                  <Maximize2 className="w-3 h-3 text-white/60" />
                </button>
                <button className="p-1 bg-black/60 rounded hover:bg-black/80">
                  <Minimize2 className="w-3 h-3 text-white/60" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Grid Layouts
        <div className={`w-full h-full ${getLayoutClasses()}`}>
          {layout === 'grid' ? (
            // 2x2 Grid - render 4 views
            <>
              <div className="border border-white/10">{renderView('spatial')}</div>
              <div className="border border-white/10">{renderView('network')}</div>
              <div className="border border-white/10">{renderView('temporal')}</div>
              <div className="border border-white/10">{renderView('spatial')}</div>
            </>
          ) : (
            // 2-view layouts
            <>
              <div className="border border-white/10">{renderView(primaryView)}</div>
              <div className="border border-white/10">{renderView(secondaryView)}</div>
            </>
          )}
        </div>
      )}

      {/* Synchronization Indicator */}
      {isSynchronized && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 
                          rounded-full text-green-400 text-xs">
            Views synchronized
          </div>
        </div>
      )}
    </div>
  );
};

export default HybridLens;