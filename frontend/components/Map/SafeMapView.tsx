'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the MapView with no SSR
const MapView = dynamic(
  () => import('./MapView').then(mod => ({ default: mod.MapView })),
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
        <div>Loading map component...</div>
      </div>
    )
  }
);

export const SafeMapView: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Ensure we're fully on the client side
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      console.log('[SafeMapView] Client side ready');
      
      // Give a small delay to ensure all dependencies are loaded
      const timer = setTimeout(() => {
        console.log('[SafeMapView] Setting ready state');
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  if (!isReady) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Preparing map...</div>
      </div>
    );
  }
  
  return <MapView />;
};