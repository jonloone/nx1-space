/**
 * Service Worker Registration and Management
 */

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  
  private constructor() {}
  
  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }
  
  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.registration = registration;
      console.log('Service worker registered successfully');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('Service worker updated and activated');
              // Optionally reload the page or notify the user
            }
          });
        }
      });
      
      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleMessage);
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  
  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        console.log('Service worker unregistered');
      }
      return success;
    }
    return false;
  }
  
  /**
   * Prefetch PMTiles for offline support
   */
  async prefetchPMTiles(): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service worker not active');
      return;
    }
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'PREFETCH_COMPLETE') {
          console.log(`PMTiles prefetch complete. Cached: ${event.data.cached} files`);
          resolve();
        }
      };
      
      this.registration.active.postMessage(
        { type: 'PREFETCH_PMTILES' },
        [messageChannel.port2]
      );
      
      // Timeout after 5 minutes
      setTimeout(() => {
        reject(new Error('PMTiles prefetch timeout'));
      }, 300000);
    });
  }
  
  /**
   * Check if service worker is ready
   */
  async isReady(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      return !!registration.active;
    } catch {
      return false;
    }
  }
  
  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ size: number; count: number } | null> {
    if (!('caches' in window)) {
      return null;
    }
    
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalCount = 0;
      
      for (const name of cacheNames) {
        if (name.includes('pmtiles')) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          totalCount += keys.length;
          
          // Estimate size (actual size calculation would require iterating responses)
          // This is a rough estimate assuming ~20MB per PMTiles file
          totalSize += keys.length * 20 * 1024 * 1024;
        }
      }
      
      return { size: totalSize, count: totalCount };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
  
  /**
   * Clear PMTiles cache
   */
  async clearCache(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }
    
    try {
      const cacheNames = await caches.keys();
      
      for (const name of cacheNames) {
        if (name.includes('pmtiles')) {
          await caches.delete(name);
          console.log(`Cleared cache: ${name}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
  
  /**
   * Handle messages from service worker
   */
  private handleMessage(event: MessageEvent): void {
    console.log('Message from service worker:', event.data);
    
    // Handle specific message types
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', event.data.url);
        break;
      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        break;
      default:
        break;
    }
  }
}

// Export singleton instance
export const swManager = ServiceWorkerManager.getInstance();