/**
 * API Integration Patterns for Terrain Data
 * Provides unified interface for various elevation data sources
 */

import { TerrainPoint, TerrainDataSource, TerrainTile } from './types';

export interface TerrainAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    source: string;
    timestamp: string;
    processing_time_ms: number;
    credits_used?: number;
  };
}

export class TerrainAPIIntegration {
  private apiKeys: Map<string, string> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  
  constructor() {
    this.initializeAPIs();
  }

  /**
   * Initialize API configurations
   */
  private initializeAPIs(): void {
    // Initialize rate limiters for each API
    this.rateLimiters.set('mapbox', new RateLimiter(600, 60000)); // 600/min
    this.rateLimiters.set('opentopodata', new RateLimiter(100, 60000)); // 100/min
    this.rateLimiters.set('usgs', new RateLimiter(30, 60000)); // 30/min
  }

  /**
   * Set API key for a service
   */
  setAPIKey(service: string, key: string): void {
    this.apiKeys.set(service, key);
  }

  /**
   * Fetch elevation from Mapbox Terrain API
   */
  async fetchMapboxElevation(
    points: Array<{lat: number, lon: number}>
  ): Promise<TerrainAPIResponse> {
    const startTime = Date.now();
    
    // Check rate limit
    if (!this.rateLimiters.get('mapbox')?.tryAcquire()) {
      return {
        success: false,
        error: 'Rate limit exceeded for Mapbox API'
      };
    }

    const apiKey = this.apiKeys.get('mapbox');
    if (!apiKey) {
      return {
        success: false,
        error: 'Mapbox API key not configured'
      };
    }

    try {
      // Mapbox supports batch queries up to 300 points
      const batches = this.chunkArray(points, 300);
      const results: TerrainPoint[] = [];

      for (const batch of batches) {
        const coordinates = batch
          .map(p => `${p.lon},${p.lat}`)
          .join(';');

        const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coordinates}.json?layers=contour&access_token=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Mapbox API error');
        }

        // Process results
        for (let i = 0; i < batch.length; i++) {
          const feature = data.features?.[i];
          const elevation = feature?.properties?.ele || 0;
          
          results.push({
            latitude: batch[i].lat,
            longitude: batch[i].lon,
            elevation,
            accuracy: 10, // Mapbox typical accuracy
            source: 'SRTM'
          });
        }
      }

      return {
        success: true,
        data: results,
        metadata: {
          source: 'mapbox',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
          credits_used: points.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'mapbox',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Fetch elevation from OpenTopoData
   */
  async fetchOpenTopoData(
    points: Array<{lat: number, lon: number}>,
    dataset: 'aster30m' | 'srtm30m' | 'eudem25m' = 'srtm30m'
  ): Promise<TerrainAPIResponse> {
    const startTime = Date.now();
    
    // Check rate limit
    if (!this.rateLimiters.get('opentopodata')?.tryAcquire()) {
      return {
        success: false,
        error: 'Rate limit exceeded for OpenTopoData API'
      };
    }

    try {
      // OpenTopoData supports batch queries up to 100 points
      const batches = this.chunkArray(points, 100);
      const results: TerrainPoint[] = [];

      for (const batch of batches) {
        const locations = batch
          .map(p => `${p.lat},${p.lon}`)
          .join('|');

        const url = `https://api.opentopodata.org/v1/${dataset}?locations=${locations}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.status !== 'OK') {
          throw new Error(data.error || 'OpenTopoData API error');
        }

        // Process results
        for (const result of data.results) {
          results.push({
            latitude: result.location.lat,
            longitude: result.location.lng,
            elevation: result.elevation || 0,
            accuracy: dataset === 'srtm30m' ? 30 : 25,
            source: dataset === 'srtm30m' ? 'SRTM' : 'ASTER'
          });
        }
      }

      return {
        success: true,
        data: results,
        metadata: {
          source: 'opentopodata',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'opentopodata',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Fetch terrain tile from AWS Terrain Tiles
   */
  async fetchAWSTerrainTile(
    z: number,
    x: number,
    y: number
  ): Promise<TerrainAPIResponse> {
    const startTime = Date.now();

    try {
      const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get image data
      const blob = await response.blob();
      const imageData = await this.decodeTerrainImage(blob);

      // Convert to elevation grid
      const tile = this.terrainImageToTile(imageData, z, x, y);

      return {
        success: true,
        data: tile,
        metadata: {
          source: 'aws-terrain-tiles',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'aws-terrain-tiles',
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Unified interface for fetching elevation data
   */
  async fetchElevation(
    points: Array<{lat: number, lon: number}>,
    preferredSource?: string
  ): Promise<TerrainPoint[]> {
    // Try preferred source first
    if (preferredSource) {
      const result = await this.fetchFromSource(points, preferredSource);
      if (result.success && result.data) {
        return result.data;
      }
    }

    // Fallback chain
    const sources = ['opentopodata', 'mapbox', 'aws'];
    
    for (const source of sources) {
      if (source === preferredSource) continue; // Already tried
      
      const result = await this.fetchFromSource(points, source);
      if (result.success && result.data) {
        return result.data;
      }
    }

    // If all fail, return synthetic data
    return points.map(p => ({
      latitude: p.lat,
      longitude: p.lon,
      elevation: this.generateSyntheticElevation(p.lat, p.lon),
      accuracy: 100,
      source: 'synthetic' as any
    }));
  }

  /**
   * Helper to fetch from specific source
   */
  private async fetchFromSource(
    points: Array<{lat: number, lon: number}>,
    source: string
  ): Promise<TerrainAPIResponse> {
    switch (source) {
      case 'mapbox':
        return this.fetchMapboxElevation(points);
      case 'opentopodata':
        return this.fetchOpenTopoData(points);
      default:
        return {
          success: false,
          error: `Unknown source: ${source}`
        };
    }
  }

  /**
   * Decode terrain-encoded PNG image
   */
  private async decodeTerrainImage(blob: Blob): Promise<ImageData> {
    // In a real implementation, would use Canvas API or image processing library
    // This is a placeholder
    return new ImageData(256, 256);
  }

  /**
   * Convert terrain image to elevation tile
   */
  private terrainImageToTile(
    imageData: ImageData,
    z: number,
    x: number,
    y: number
  ): TerrainTile {
    const { north, south, east, west } = this.tileBounds(z, x, y);
    const data: number[][] = [];

    // Decode Terrarium format: elevation = (red * 256 + green + blue / 256) - 32768
    for (let row = 0; row < 256; row++) {
      const rowData: number[] = [];
      for (let col = 0; col < 256; col++) {
        const idx = (row * 256 + col) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        
        const elevation = (r * 256 + g + b / 256) - 32768;
        rowData.push(elevation);
      }
      data.push(rowData);
    }

    return {
      bounds: { north, south, east, west },
      resolution: 30, // Approximate for terrain tiles
      data,
      metadata: {
        source: 'AWS Terrain Tiles',
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  /**
   * Calculate tile bounds from tile coordinates
   */
  private tileBounds(z: number, x: number, y: number): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const n = Math.pow(2, z);
    const west = (x / n) * 360 - 180;
    const east = ((x + 1) / n) * 360 - 180;
    
    const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    
    return { north, south, east, west };
  }

  /**
   * Generate synthetic elevation for testing
   */
  private generateSyntheticElevation(lat: number, lon: number): number {
    // Simple synthetic elevation based on coordinates
    const base = 500;
    const variation = Math.sin(lat * 0.1) * 200 + Math.cos(lon * 0.1) * 150;
    const noise = (Math.random() - 0.5) * 50;
    return base + variation + noise;
  }

  /**
   * Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [source, limiter] of this.rateLimiters) {
      stats[source] = {
        requests_made: limiter.getRequestCount(),
        remaining_capacity: limiter.getRemainingCapacity(),
        reset_time: limiter.getResetTime()
      };
    }
    
    return stats;
  }
}

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
  private requests: number[] = [];
  private capacity: number;
  private windowMs: number;

  constructor(capacity: number, windowMs: number) {
    this.capacity = capacity;
    this.windowMs = windowMs;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(t => t > now - this.windowMs);
    
    if (this.requests.length < this.capacity) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(t => t > now - this.windowMs);
    return this.requests.length;
  }

  getRemainingCapacity(): number {
    return Math.max(0, this.capacity - this.getRequestCount());
  }

  getResetTime(): Date {
    if (this.requests.length === 0) return new Date();
    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.windowMs);
  }
}