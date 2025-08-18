'use client';

import { useEffect, useState } from 'react';
import { swManager } from '@/lib/utils/serviceWorker';

export default function ServiceWorkerProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [swStatus, setSwStatus] = useState<'idle' | 'registering' | 'ready' | 'error'>('idle');
  const [cacheStatus, setCacheStatus] = useState<{ size: number; count: number } | null>(null);
  
  useEffect(() => {
    const registerSW = async () => {
      setSwStatus('registering');
      
      try {
        const registration = await swManager.register();
        
        if (registration) {
          setSwStatus('ready');
          
          // Wait for service worker to be ready before prefetching
          const isReady = await swManager.isReady();
          
          if (isReady) {
            // Start prefetching PMTiles in the background
            console.log('Starting PMTiles prefetch...');
            swManager.prefetchPMTiles().catch(err => {
              console.warn('PMTiles prefetch failed:', err);
            });
            
            // Get initial cache stats
            const stats = await swManager.getCacheStats();
            setCacheStatus(stats);
          }
        } else {
          setSwStatus('error');
        }
      } catch (error) {
        console.error('Service worker registration error:', error);
        setSwStatus('error');
      }
    };
    
    // Only register in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      registerSW();
    } else {
      console.log('Service worker disabled in development');
    }
    
    // Cleanup on unmount
    return () => {
      // Service worker persists, no cleanup needed
    };
  }, []);
  
  // Update cache stats periodically
  useEffect(() => {
    if (swStatus !== 'ready') return;
    
    const interval = setInterval(async () => {
      const stats = await swManager.getCacheStats();
      setCacheStatus(stats);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [swStatus]);
  
  return (
    <>
      {children}
      
      {/* Service Worker Status Indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              swStatus === 'ready' ? 'bg-green-500' :
              swStatus === 'registering' ? 'bg-yellow-500' :
              swStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            }`} />
            <span>SW: {swStatus}</span>
            {cacheStatus && (
              <span>| Cache: {cacheStatus.count} files</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}