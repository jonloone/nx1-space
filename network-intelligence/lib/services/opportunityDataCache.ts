/**
 * Performance-optimized caching system for opportunity data
 * Implements viewport-based loading and progressive enhancement
 */

import { h3 } from 'h3-js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  bounds?: string;
  resolution?: number;
}

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class OpportunityDataCache {
  private hexagonCache = new Map<string, CacheEntry<any[]>>();
  private stationCache = new Map<string, CacheEntry<any>>();
  private scoreCache = new Map<string, CacheEntry<any>>();
  
  private readonly TTL = 3600000; // 1 hour cache TTL
  private readonly MAX_CACHE_SIZE = 1000; // Maximum cache entries
  
  // Resolution thresholds based on zoom level
  private readonly RESOLUTION_THRESHOLDS = {
    3: { minZoom: 0, maxZoom: 4 },   // Country level
    4: { minZoom: 4, maxZoom: 6 },   // Regional level
    5: { minZoom: 6, maxZoom: 8 },   // Metro level
    6: { minZoom: 8, maxZoom: 10 },  // City level
    7: { minZoom: 10, maxZoom: 20 }  // Detailed level
  };
  
  /**
   * Get appropriate H3 resolution for current zoom level
   */
  getResolutionForZoom(zoom: number): number {
    if (zoom < 4) return 3;
    if (zoom < 6) return 4;
    if (zoom < 8) return 5;
    if (zoom < 10) return 6;
    return 7;
  }
  
  /**
   * Get hexagons for current viewport with caching
   */
  async getHexagonsForViewport(
    bounds: ViewportBounds,
    zoom: number,
    options: {
      landOnly?: boolean;
      maxHexagons?: number;
      includeScores?: boolean;
    } = {}
  ): Promise<any[]> {
    const resolution = this.getResolutionForZoom(zoom);
    const cacheKey = this.generateCacheKey(bounds, resolution, options);
    
    // Check cache first
    const cached = this.hexagonCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    // Generate hexagons for viewport
    const hexagons = await this.generateViewportHexagons(bounds, resolution, options);
    
    // Cache the results
    this.setCacheEntry(this.hexagonCache, cacheKey, hexagons, { bounds: cacheKey, resolution });
    
    return hexagons;
  }
  
  /**
   * Generate hexagons covering the viewport
   */
  private async generateViewportHexagons(
    bounds: ViewportBounds,
    resolution: number,
    options: any
  ): Promise<any[]> {
    const hexagons: any[] = [];
    
    // Get corner points
    const corners = [
      [bounds.south, bounds.west],
      [bounds.south, bounds.east],
      [bounds.north, bounds.east],
      [bounds.north, bounds.west]
    ];
    
    // Convert corners to H3 indices
    const cornerH3s = corners.map(([lat, lon]) => 
      h3.latLngToCell(lat, lon, resolution)
    );
    
    // Get all hexagons in the polygon
    const hexSet = new Set<string>();
    
    // Add corner hexagons and their neighbors
    cornerH3s.forEach(hex => {
      hexSet.add(hex);
      // Get k-ring neighbors based on viewport size
      const kRingSize = this.calculateKRingSize(bounds, resolution);
      h3.gridDisk(hex, kRingSize).forEach(h => hexSet.add(h));
    });
    
    // Filter and process hexagons
    const processedHexagons = Array.from(hexSet)
      .map(h3Index => {
        const [lat, lon] = h3.cellToLatLng(h3Index);
        
        // Check if within bounds
        if (lat < bounds.south || lat > bounds.north) return null;
        if (bounds.west < bounds.east) {
          if (lon < bounds.west || lon > bounds.east) return null;
        } else {
          // Handle date line crossing
          if (lon < bounds.west && lon > bounds.east) return null;
        }
        
        return {
          h3Index,
          coordinates: [lon, lat],
          resolution
        };
      })
      .filter(h => h !== null);
    
    // Apply max hexagon limit if specified
    if (options.maxHexagons && processedHexagons.length > options.maxHexagons) {
      // Prioritize hexagons closer to viewport center
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLon = (bounds.east + bounds.west) / 2;
      
      processedHexagons.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow(a!.coordinates[0] - centerLon, 2) + 
          Math.pow(a!.coordinates[1] - centerLat, 2)
        );
        const distB = Math.sqrt(
          Math.pow(b!.coordinates[0] - centerLon, 2) + 
          Math.pow(b!.coordinates[1] - centerLat, 2)
        );
        return distA - distB;
      });
      
      return processedHexagons.slice(0, options.maxHexagons);
    }
    
    return processedHexagons;
  }
  
  /**
   * Calculate k-ring size based on viewport dimensions
   */
  private calculateKRingSize(bounds: ViewportBounds, resolution: number): number {
    const latSpan = bounds.north - bounds.south;
    const lonSpan = Math.abs(bounds.east - bounds.west);
    const avgSpan = (latSpan + lonSpan) / 2;
    
    // Adjust k-ring based on resolution and viewport size
    const resolutionFactors = {
      3: 0.5,
      4: 0.8,
      5: 1.0,
      6: 1.5,
      7: 2.0
    };
    
    const factor = resolutionFactors[resolution as keyof typeof resolutionFactors] || 1.0;
    return Math.max(1, Math.min(10, Math.floor(avgSpan * factor)));
  }
  
  /**
   * Get pre-computed scores with caching
   */
  async getScoresForHexagons(
    hexagons: string[],
    scoreTypes: string[] = ['market', 'competition', 'weather', 'coverage', 'terrain']
  ): Promise<Map<string, any>> {
    const scores = new Map<string, any>();
    const uncachedHexagons: string[] = [];
    
    // Check cache for each hexagon
    hexagons.forEach(h3Index => {
      const cacheKey = `score-${h3Index}`;
      const cached = this.scoreCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        scores.set(h3Index, cached.data);
      } else {
        uncachedHexagons.push(h3Index);
      }
    });
    
    // Batch fetch uncached scores
    if (uncachedHexagons.length > 0) {
      const newScores = await this.fetchScoresFromAPI(uncachedHexagons, scoreTypes);
      
      newScores.forEach((score, h3Index) => {
        scores.set(h3Index, score);
        // Cache individual scores
        this.setCacheEntry(this.scoreCache, `score-${h3Index}`, score);
      });
    }
    
    return scores;
  }
  
  /**
   * Simulate API call to fetch scores
   */
  private async fetchScoresFromAPI(
    hexagons: string[],
    scoreTypes: string[]
  ): Promise<Map<string, any>> {
    // In production, this would be an actual API call
    const scores = new Map<string, any>();
    
    hexagons.forEach(h3Index => {
      const [lat, lon] = h3.cellToLatLng(h3Index);
      
      const score: any = {
        h3Index,
        coordinates: [lon, lat]
      };
      
      // Generate mock scores (replace with actual calculation)
      scoreTypes.forEach(type => {
        score[type] = Math.random() * 100;
      });
      
      score.overall = scoreTypes.reduce((sum, type) => sum + score[type], 0) / scoreTypes.length;
      scores.set(h3Index, score);
    });
    
    return scores;
  }
  
  /**
   * Pre-fetch adjacent areas for smooth panning
   */
  async prefetchAdjacentAreas(
    currentBounds: ViewportBounds,
    zoom: number,
    options: any = {}
  ): Promise<void> {
    const bufferFactor = 0.5; // Pre-fetch 50% beyond viewport
    const latBuffer = (currentBounds.north - currentBounds.south) * bufferFactor;
    const lonBuffer = Math.abs(currentBounds.east - currentBounds.west) * bufferFactor;
    
    // Define adjacent areas
    const adjacentBounds = [
      // North
      {
        south: currentBounds.north,
        north: currentBounds.north + latBuffer,
        east: currentBounds.east,
        west: currentBounds.west
      },
      // South
      {
        south: currentBounds.south - latBuffer,
        north: currentBounds.south,
        east: currentBounds.east,
        west: currentBounds.west
      },
      // East
      {
        south: currentBounds.south,
        north: currentBounds.north,
        east: currentBounds.east + lonBuffer,
        west: currentBounds.east
      },
      // West
      {
        south: currentBounds.south,
        north: currentBounds.north,
        east: currentBounds.west,
        west: currentBounds.west - lonBuffer
      }
    ];
    
    // Pre-fetch in background
    adjacentBounds.forEach(bounds => {
      // Don't await - let it run in background
      this.getHexagonsForViewport(bounds, zoom, options).catch(() => {
        // Silently fail pre-fetching
      });
    });
  }
  
  /**
   * Generate cache key for viewport
   */
  private generateCacheKey(
    bounds: ViewportBounds,
    resolution: number,
    options: any
  ): string {
    const boundsKey = `${bounds.north.toFixed(2)},${bounds.south.toFixed(2)},${bounds.east.toFixed(2)},${bounds.west.toFixed(2)}`;
    const optionsKey = JSON.stringify(options);
    return `${boundsKey}-${resolution}-${optionsKey}`;
  }
  
  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < this.TTL;
  }
  
  /**
   * Set cache entry with size management
   */
  private setCacheEntry<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
    metadata?: any
  ): void {
    // Implement LRU eviction if cache is too large
    if (cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entriesToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2); // Remove 20%
      const sortedKeys = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, entriesToRemove)
        .map(([k]) => k);
      
      sortedKeys.forEach(k => cache.delete(k));
    }
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ...metadata
    });
  }
  
  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.hexagonCache.clear();
    this.stationCache.clear();
    this.scoreCache.clear();
  }
  
  /**
   * Clear expired cache entries
   */
  cleanupExpiredEntries(): void {
    const now = Date.now();
    
    [this.hexagonCache, this.stationCache, this.scoreCache].forEach(cache => {
      const keysToDelete: string[] = [];
      
      cache.forEach((entry, key) => {
        if (now - entry.timestamp > this.TTL) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => cache.delete(key));
    });
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hexagonCacheSize: number;
    stationCacheSize: number;
    scoreCacheSize: number;
    totalSize: number;
    oldestEntry: number;
  } {
    let oldestTimestamp = Date.now();
    
    [this.hexagonCache, this.stationCache, this.scoreCache].forEach(cache => {
      cache.forEach(entry => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
        }
      });
    });
    
    return {
      hexagonCacheSize: this.hexagonCache.size,
      stationCacheSize: this.stationCache.size,
      scoreCacheSize: this.scoreCache.size,
      totalSize: this.hexagonCache.size + this.stationCache.size + this.scoreCache.size,
      oldestEntry: Date.now() - oldestTimestamp
    };
  }
}

// Singleton instance
export const opportunityCache = new OpportunityDataCache();