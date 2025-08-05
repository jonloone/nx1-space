/**
 * Terrain Data Pipeline
 * ETL pipeline for terrain data ingestion, validation, and caching
 */

import {
  TerrainPoint,
  TerrainTile,
  TerrainDataSource,
  TerrainProcessingConfig,
  TerrainCacheEntry,
  TerrainMetrics,
  AspectDistribution
} from './types';

export class TerrainDataPipeline {
  private cache: Map<string, TerrainCacheEntry> = new Map();
  private cacheSize: number = 0;
  private config: TerrainProcessingConfig;
  private dataSources: TerrainDataSource[];
  private validationStats = {
    total_requests: 0,
    cache_hits: 0,
    validation_failures: 0,
    data_quality_scores: [] as number[]
  };

  constructor(config: TerrainProcessingConfig, dataSources: TerrainDataSource[]) {
    this.config = config;
    this.dataSources = dataSources;
    this.initializeCache();
  }

  /**
   * Main entry point for fetching elevation data
   */
  async getElevation(lat: number, lon: number): Promise<TerrainPoint> {
    this.validationStats.total_requests++;
    
    // Validate coordinates
    if (!this.validateCoordinates(lat, lon)) {
      throw new Error(`Invalid coordinates: ${lat}, ${lon}`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.validationStats.cache_hits++;
      return this.extractPointFromTile(cached.data, lat, lon);
    }

    // Fetch from data source
    const tile = await this.fetchTile(lat, lon);
    
    // Validate and cache
    if (this.validateTileData(tile)) {
      this.addToCache(cacheKey, tile);
      return this.extractPointFromTile(tile, lat, lon);
    }

    throw new Error('Failed to fetch valid elevation data');
  }

  /**
   * Batch elevation query with optimized fetching
   */
  async getElevationBatch(points: Array<{lat: number, lon: number}>): Promise<TerrainPoint[]> {
    // Group points by tile for efficient fetching
    const tileGroups = this.groupPointsByTile(points);
    const results: TerrainPoint[] = [];

    // Process each tile group in parallel
    const tilePromises = Array.from(tileGroups.entries()).map(async ([tileKey, tilePoints]) => {
      const [tileLat, tileLon] = this.parseCacheKey(tileKey);
      const tile = await this.getOrFetchTile(tileLat, tileLon);
      
      return tilePoints.map(point => 
        this.extractPointFromTile(tile, point.lat, point.lon)
      );
    });

    const tileResults = await Promise.all(tilePromises);
    return tileResults.flat();
  }

  /**
   * Calculate terrain metrics for a region
   */
  async calculateTerrainMetrics(
    bounds: {north: number, south: number, east: number, west: number},
    resolution: number = 30 // meters
  ): Promise<TerrainMetrics> {
    const points = this.generateGridPoints(bounds, resolution);
    const elevations = await this.getElevationBatch(points);

    return this.computeMetrics(elevations);
  }

  /**
   * Data validation pipeline
   */
  private validateCoordinates(lat: number, lon: number): boolean {
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    return true;
  }

  private validateTileData(tile: TerrainTile): boolean {
    // Check bounds
    if (!tile.bounds || !tile.data) {
      this.validationStats.validation_failures++;
      return false;
    }

    // Check data integrity
    const expectedRows = Math.ceil((tile.bounds.north - tile.bounds.south) * 3600 / tile.resolution);
    const expectedCols = Math.ceil((tile.bounds.east - tile.bounds.west) * 3600 / tile.resolution);

    if (tile.data.length !== expectedRows) {
      this.validationStats.validation_failures++;
      return false;
    }

    // Statistical validation
    const quality = this.assessDataQuality(tile);
    this.validationStats.data_quality_scores.push(quality);

    return quality >= this.config.quality_threshold;
  }

  private assessDataQuality(tile: TerrainTile): number {
    let quality = 1.0;
    
    // Check for data voids (SRTM void value is -32768)
    let voidCount = 0;
    let validCount = 0;
    
    for (const row of tile.data) {
      for (const value of row) {
        if (value === -32768 || value === null || isNaN(value)) {
          voidCount++;
        } else if (value >= -500 && value <= 9000) { // Reasonable elevation range
          validCount++;
        }
      }
    }

    const voidRatio = voidCount / (tile.data.length * tile.data[0].length);
    quality *= (1 - voidRatio);

    // Check for suspicious patterns (flat areas in mountainous regions)
    const variance = this.calculateVariance(tile.data);
    if (variance < 0.1) quality *= 0.8; // Suspiciously flat

    // Check resolution consistency
    if (tile.resolution > 90) quality *= 0.7; // Low resolution

    return quality;
  }

  /**
   * Caching strategy implementation
   */
  private initializeCache(): void {
    if (!this.config.cache_enabled) return;

    // Set up cache eviction timer
    setInterval(() => this.evictStaleEntries(), 3600000); // hourly
  }

  private getCacheKey(lat: number, lon: number): string {
    // Round to tile boundaries (1-degree tiles)
    const tileLat = Math.floor(lat);
    const tileLon = Math.floor(lon);
    return `${tileLat}_${tileLon}`;
  }

  private parseCacheKey(key: string): [number, number] {
    const [lat, lon] = key.split('_').map(Number);
    return [lat, lon];
  }

  private getFromCache(key: string): TerrainCacheEntry | null {
    if (!this.config.cache_enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > this.config.cache_ttl_hours * 3600000) {
      this.cache.delete(key);
      this.cacheSize -= entry.size_bytes;
      return null;
    }

    entry.access_count++;
    return entry;
  }

  private addToCache(key: string, tile: TerrainTile): void {
    if (!this.config.cache_enabled) return;

    const size = this.estimateTileSize(tile);
    
    // Check cache size limit
    while (this.cacheSize + size > this.config.max_cache_size_mb * 1024 * 1024) {
      this.evictLRUEntry();
    }

    const entry: TerrainCacheEntry = {
      key,
      data: tile,
      timestamp: Date.now(),
      access_count: 1,
      size_bytes: size
    };

    this.cache.set(key, entry);
    this.cacheSize += size;
  }

  private evictLRUEntry(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.access_count < lruAccessCount || 
          (entry.access_count === lruAccessCount && entry.timestamp < lruTimestamp)) {
        lruKey = key;
        lruAccessCount = entry.access_count;
        lruTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey)!;
      this.cache.delete(lruKey);
      this.cacheSize -= entry.size_bytes;
    }
  }

  private evictStaleEntries(): void {
    const now = Date.now();
    const ttlMs = this.config.cache_ttl_hours * 3600000;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttlMs) {
        this.cache.delete(key);
        this.cacheSize -= entry.size_bytes;
      }
    }
  }

  private estimateTileSize(tile: TerrainTile): number {
    // Rough estimate: 4 bytes per elevation value + metadata
    return tile.data.length * tile.data[0].length * 4 + 1024;
  }

  /**
   * Data fetching from sources
   */
  private async fetchTile(lat: number, lon: number): Promise<TerrainTile> {
    // Try data sources in order of preference
    for (const source of this.dataSources) {
      try {
        if (this.isInCoverage(lat, lon, source.coverage)) {
          return await this.fetchFromSource(source, lat, lon);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source.name}:`, error);
        continue;
      }
    }

    // Fallback to synthetic data if all sources fail
    return this.generateSyntheticTile(lat, lon);
  }

  private async fetchFromSource(
    source: TerrainDataSource, 
    lat: number, 
    lon: number
  ): Promise<TerrainTile> {
    // Implementation would vary by source
    // This is a placeholder for actual API calls
    
    const tileLat = Math.floor(lat);
    const tileLon = Math.floor(lon);
    
    // Simulate API call with synthetic data
    return this.generateSyntheticTile(tileLat, tileLon);
  }

  private isInCoverage(lat: number, lon: number, coverage: any): boolean {
    return lat >= coverage.min_lat && lat <= coverage.max_lat &&
           lon >= coverage.min_lon && lon <= coverage.max_lon;
  }

  /**
   * Data processing utilities
   */
  private extractPointFromTile(tile: TerrainTile, lat: number, lon: number): TerrainPoint {
    const relLat = lat - tile.bounds.south;
    const relLon = lon - tile.bounds.west;
    
    const row = Math.floor(relLat * 3600 / tile.resolution);
    const col = Math.floor(relLon * 3600 / tile.resolution);
    
    // Bounds checking
    const safeRow = Math.max(0, Math.min(tile.data.length - 1, row));
    const safeCol = Math.max(0, Math.min(tile.data[0].length - 1, col));
    
    let elevation = tile.data[safeRow][safeCol];
    
    // Handle voids with interpolation
    if (elevation === -32768 || elevation === null) {
      elevation = this.interpolateVoid(tile, safeRow, safeCol);
    }

    return {
      latitude: lat,
      longitude: lon,
      elevation,
      accuracy: tile.resolution * 0.5, // Half resolution as accuracy estimate
      source: tile.metadata.source as any
    };
  }

  private interpolateVoid(tile: TerrainTile, row: number, col: number): number {
    // Simple bilinear interpolation from neighboring valid values
    const neighbors: number[] = [];
    
    for (let r = Math.max(0, row - 1); r <= Math.min(tile.data.length - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(tile.data[0].length - 1, col + 1); c++) {
        if (r === row && c === col) continue;
        const value = tile.data[r][c];
        if (value !== -32768 && value !== null) {
          neighbors.push(value);
        }
      }
    }

    if (neighbors.length === 0) return 0; // No valid neighbors
    return neighbors.reduce((a, b) => a + b) / neighbors.length;
  }

  private groupPointsByTile(points: Array<{lat: number, lon: number}>): Map<string, typeof points> {
    const groups = new Map<string, typeof points>();
    
    for (const point of points) {
      const key = this.getCacheKey(point.lat, point.lon);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point);
    }
    
    return groups;
  }

  private async getOrFetchTile(lat: number, lon: number): Promise<TerrainTile> {
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached.data;
    }
    
    const tile = await this.fetchTile(lat, lon);
    this.addToCache(cacheKey, tile);
    return tile;
  }

  private generateGridPoints(
    bounds: {north: number, south: number, east: number, west: number},
    resolution: number
  ): Array<{lat: number, lon: number}> {
    const points: Array<{lat: number, lon: number}> = [];
    
    // Convert resolution in meters to degrees (approximate)
    const latStep = resolution / 111000; // 1 degree latitude ≈ 111km
    const lonStep = resolution / (111000 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180));
    
    for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
      for (let lon = bounds.west; lon <= bounds.east; lon += lonStep) {
        points.push({lat, lon});
      }
    }
    
    return points;
  }

  private computeMetrics(elevations: TerrainPoint[]): TerrainMetrics {
    const values = elevations.map(p => p.elevation);
    values.sort((a, b) => a - b);
    
    // Basic statistics
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Terrain ruggedness (standard deviation of elevation)
    const ruggedness = Math.sqrt(variance);
    
    // Slope calculation (simplified)
    const slopes: number[] = [];
    for (let i = 1; i < elevations.length; i++) {
      const dist = this.haversineDistance(
        elevations[i-1].latitude, elevations[i-1].longitude,
        elevations[i].latitude, elevations[i].longitude
      );
      if (dist > 0) {
        const slope = Math.atan((elevations[i].elevation - elevations[i-1].elevation) / (dist * 1000)) * 180 / Math.PI;
        slopes.push(Math.abs(slope));
      }
    }
    const avgSlope = slopes.length > 0 ? slopes.reduce((a, b) => a + b) / slopes.length : 0;
    
    // Aspect distribution (simplified - would need proper DEM analysis)
    const aspectDist: AspectDistribution = {
      north: 0.25,
      east: 0.25,
      south: 0.25,
      west: 0.25
    };
    
    return {
      mean_elevation: mean,
      elevation_variance: variance,
      terrain_ruggedness_index: ruggedness,
      slope_average: avgSlope,
      aspect_distribution: aspectDist,
      elevation_percentiles: {
        p10: values[Math.floor(values.length * 0.1)],
        p25: values[Math.floor(values.length * 0.25)],
        p50: values[Math.floor(values.length * 0.5)],
        p75: values[Math.floor(values.length * 0.75)],
        p90: values[Math.floor(values.length * 0.9)]
      }
    };
  }

  private calculateVariance(data: number[][]): number {
    const flat = data.flat().filter(v => v !== -32768 && v !== null);
    if (flat.length === 0) return 0;
    
    const mean = flat.reduce((a, b) => a + b) / flat.length;
    return flat.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flat.length;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Synthetic data generation for testing/fallback
   */
  private generateSyntheticTile(lat: number, lon: number): TerrainTile {
    const resolution = 30; // arc seconds
    const size = 120; // 1 degree = 120 points at 30 arc second resolution
    
    const data: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        // Generate realistic-looking terrain using Perlin noise simulation
        const baseElevation = 500 + Math.sin(lat * 0.1) * 200;
        const noise = Math.sin(i * 0.1) * Math.cos(j * 0.1) * 100;
        const randomness = (Math.random() - 0.5) * 50;
        row.push(baseElevation + noise + randomness);
      }
      data.push(row);
    }
    
    return {
      bounds: {
        north: lat + 1,
        south: lat,
        east: lon + 1,
        west: lon
      },
      resolution,
      data,
      metadata: {
        source: 'synthetic',
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };
  }

  /**
   * Get pipeline statistics for monitoring
   */
  getStatistics() {
    return {
      ...this.validationStats,
      cache_size_mb: this.cacheSize / (1024 * 1024),
      cache_entries: this.cache.size,
      hit_rate: this.validationStats.cache_hits / this.validationStats.total_requests,
      avg_quality_score: this.validationStats.data_quality_scores.length > 0
        ? this.validationStats.data_quality_scores.reduce((a, b) => a + b) / this.validationStats.data_quality_scores.length
        : 0
    };
  }
}