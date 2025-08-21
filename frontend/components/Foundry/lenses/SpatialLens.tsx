'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CompactToolBar } from '@/components/Tools/CompactToolBar';
import { ContextPanel } from '@/components/Panels/ContextPanel';
import { useFoundryStore } from '@/lib/store/foundryStore';

// Import the existing GeoCoreMap component - preserving all existing functionality
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
        Loading spatial view...
      </div>
    )
  }
);

interface SpatialLensProps {
  className?: string;
}

const SpatialLens: React.FC<SpatialLensProps> = ({ className = '' }) => {
  const { shared, updateLensState } = useFoundryStore();

  React.useEffect(() => {
    // Update lens state when entering spatial view
    updateLensState('spatial', {
      enteredAt: new Date(),
      activeFilters: shared.activeFilters,
    });
  }, []);

  React.useEffect(() => {
    // If there's an active template, apply its configuration
    if (shared.activeTemplate) {
      console.log('Applying template configuration:', shared.activeTemplate);
      // Template configuration will be applied through the map store
    }
  }, [shared.activeTemplate]);

  React.useEffect(() => {
    // If there's a user query, process it for spatial context
    if (shared.userQuery) {
      console.log('Processing user query for spatial view:', shared.userQuery);
      // Query processing will be handled by AI integration
    }
  }, [shared.userQuery]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Main Map - Preserving existing GeoCoreMap */}
      <GeoCoreMap />
      
      {/* Left Sidebar with Layers and Search - Preserving existing toolbar */}
      <CompactToolBar />
      
      {/* Context Panel - Shows when feature is selected */}
      <ContextPanel />
      
      {/* Spatial Lens Specific Overlay */}
      {shared.userQuery && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[800]">
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md 
                          border border-white/20 rounded-full
                          text-white/80 text-sm">
            Showing results for: "{shared.userQuery}"
          </div>
        </div>
      )}
      
      {/* Template Indicator */}
      {shared.activeTemplate && (
        <div className="absolute top-20 right-6 z-[800]">
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md 
                          border border-white/20 rounded-lg">
            <div className="text-white/60 text-xs">Active Template</div>
            <div className="text-white font-medium">{shared.activeTemplate.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialLens;