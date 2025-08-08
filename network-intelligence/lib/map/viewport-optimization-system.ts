/**
 * Viewport Optimization System
 * 
 * Advanced viewport culling, level-of-detail (LOD), and performance optimization
 * for rendering large-scale hexagon coverage with smooth interaction.
 */

import type { ViewState } from 'react-map-gl/maplibre';
import { H3Cell } from './h3-coverage-system';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface LODLevel {
  minZoom: number;
  maxZoom: number;
  resolution: number;
  maxCells: number;
  cullDistance: number;
  updateThreshold: number;
}

export interface PerformanceMetrics {
  totalCells: number;
  visibleCells: number;
  culledCells: number;
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  frameRate: number;
  lodLevel: number;
  cacheHitRate: number;
}

export interface OptimizationOptions {
  enableCulling: boolean;
  enableLOD: boolean;
  enableAdaptiveUpdate: boolean;
  targetFrameRate: number;
  maxCells: number;
  memoryLimit: number; // MB
  updateInterval: number; // ms
  preloadRadius: number; // viewport multiplier
}

export interface CullResult {
  visibleCells: H3Cell[];
  culledCells: H3Cell[];
  lodLevel: number;
  updateRequired: boolean;
}

// Level-of-detail configuration
const LOD_LEVELS: LODLevel[] = [
  { minZoom: 0, maxZoom: 1.5, resolution: 1, maxCells: 500, cullDistance: 180, updateThreshold: 2.0 },
  { minZoom: 1.5, maxZoom: 3, resolution: 2, maxCells: 2000, cullDistance: 90, updateThreshold: 1.5 },
  { minZoom: 3, maxZoom: 4.5, resolution: 3, maxCells: 8000, cullDistance: 45, updateThreshold: 1.0 },
  { minZoom: 4.5, maxZoom: 6, resolution: 3, maxCells: 15000, cullDistance: 22.5, updateThreshold: 0.75 },
  { minZoom: 6, maxZoom: 8, resolution: 4, maxCells: 30000, cullDistance: 11.25, updateThreshold: 0.5 },
  { minZoom: 8, maxZoom: 15, resolution: 4, maxCells: 50000, cullDistance: 5.625, updateThreshold: 0.25 }
];

export class ViewportOptimizationSystem {
  private lastViewState: ViewState | null = null;
  private lastUpdateTime: number = 0;
  private performanceHistory: number[] = [];
  private cellCache = new Map<string, H3Cell[]>();
  private visibilityCache = new Map<string, boolean>();
  private adaptiveSettings = {
    targetFrameTime: 16.67, // 60fps
    performanceMargin: 1.2,
    adaptiveThreshold: 0.8
  };

  constructor(private options: OptimizationOptions = {
    enableCulling: true,
    enableLOD: true,
    enableAdaptiveUpdate: true,
    targetFrameRate: 60,
    maxCells: 50000,
    memoryLimit: 512,
    updateInterval: 100,
    preloadRadius: 1.5
  }) {}

  /**
   * Optimize cell rendering based on viewport and performance constraints
   */
  public optimizeViewport(
    cells: H3Cell[], 
    viewState: ViewState,
    currentFrameTime?: number
  ): CullResult {
    const startTime = performance.now();
    
    // Determine if update is required
    const updateRequired = this.shouldUpdate(viewState);
    
    if (!updateRequired && this.lastViewState) {
      // Return cached result with minimal processing
      const cachedResult = this.getCachedResult(cells, viewState);
      if (cachedResult) return cachedResult;
    }
    
    // Calculate viewport bounds with preload buffer
    const bounds = this.calculateViewportBounds(viewState, this.options.preloadRadius);
    
    // Determine optimal LOD level
    const lodLevel = this.determineLODLevel(viewState, currentFrameTime);
    
    // Perform viewport culling
    const cullResult = this.performViewportCulling(cells, bounds, lodLevel);
    
    // Apply performance-based adaptive culling
    if (this.options.enableAdaptiveUpdate && currentFrameTime) {
      this.applyAdaptiveCulling(cullResult, currentFrameTime);
    }
    
    // Update caches and metrics
    this.updateCaches(viewState, cullResult);
    const processingTime = performance.now() - startTime;
    this.updatePerformanceHistory(processingTime);
    
    this.lastViewState = viewState;
    this.lastUpdateTime = Date.now();
    
    return {
      ...cullResult,
      updateRequired: true
    };
  }

  /**
   * Calculate expanded viewport bounds for preloading
   */
  private calculateViewportBounds(viewState: ViewState, radiusMultiplier: number = 1): ViewportBounds {
    const { longitude, latitude, zoom } = viewState;
    
    // Calculate viewport size based on zoom level
    const latRange = (180 / Math.pow(2, zoom)) * radiusMultiplier;
    const lngRange = (360 / Math.pow(2, zoom)) * radiusMultiplier;
    
    // Handle anti-meridian crossing
    let west = longitude - lngRange;
    let east = longitude + lngRange;
    
    if (west < -180) west += 360;
    if (east > 180) east -= 360;
    
    return {
      north: Math.min(85, latitude + latRange),
      south: Math.max(-85, latitude - latRange),
      east,
      west
    };
  }

  /**
   * Determine optimal LOD level based on zoom and performance
   */
  private determineLODLevel(viewState: ViewState, currentFrameTime?: number): LODLevel {
    if (!this.options.enableLOD) {
      return LOD_LEVELS[LOD_LEVELS.length - 1]; // Highest detail
    }
    
    const { zoom } = viewState;
    
    // Find base LOD level for zoom
    let lodLevel = LOD_LEVELS.find(level => 
      zoom >= level.minZoom && zoom < level.maxZoom
    ) || LOD_LEVELS[LOD_LEVELS.length - 1];
    
    // Adaptive LOD based on performance
    if (currentFrameTime && this.options.enableAdaptiveUpdate) {
      const targetFrameTime = 1000 / this.options.targetFrameRate;
      const performanceRatio = currentFrameTime / targetFrameTime;
      
      if (performanceRatio > this.adaptiveSettings.performanceMargin) {
        // Performance is poor, reduce detail
        const lodIndex = LOD_LEVELS.indexOf(lodLevel);
        if (lodIndex > 0) {
          lodLevel = LOD_LEVELS[lodIndex - 1];
        }
      } else if (performanceRatio < this.adaptiveSettings.adaptiveThreshold) {
        // Performance is good, can increase detail
        const lodIndex = LOD_LEVELS.indexOf(lodLevel);
        if (lodIndex < LOD_LEVELS.length - 1) {
          lodLevel = LOD_LEVELS[lodIndex + 1];
        }
      }
    }
    
    return lodLevel;
  }

  /**
   * Perform viewport-based culling
   */
  private performViewportCulling(cells: H3Cell[], bounds: ViewportBounds, lodLevel: LODLevel): CullResult {
    if (!this.options.enableCulling) {
      return {
        visibleCells: cells.slice(0, lodLevel.maxCells),
        culledCells: cells.slice(lodLevel.maxCells),
        lodLevel: LOD_LEVELS.indexOf(lodLevel),
        updateRequired: true
      };
    }
    
    const visibleCells: H3Cell[] = [];
    const culledCells: H3Cell[] = [];
    
    for (const cell of cells) {
      const [lng, lat] = cell.center;
      
      // Basic viewport bounds check
      if (!this.isPointInBounds(lat, lng, bounds)) {
        culledCells.push(cell);
        continue;
      }
      
      // Resolution-based culling
      if (cell.resolution < lodLevel.resolution - 1 || cell.resolution > lodLevel.resolution + 1) {
        culledCells.push(cell);
        continue;
      }
      
      // Distance-based culling for very far cells
      const centerDistance = this.calculateDistance(
        lat, lng, 
        (bounds.north + bounds.south) / 2, 
        (bounds.east + bounds.west) / 2
      );
      
      if (centerDistance > lodLevel.cullDistance) {
        culledCells.push(cell);
        continue;
      }
      
      // Cell size culling - prioritize larger cells at low zoom
      if (lodLevel.resolution < 3 && cell.area < 100000) {
        culledCells.push(cell);
        continue;
      }
      
      visibleCells.push(cell);
      
      // Early exit if we've reached the cell limit
      if (visibleCells.length >= lodLevel.maxCells) {
        culledCells.push(...cells.slice(cells.indexOf(cell) + 1));
        break;
      }
    }
    
    // Sort visible cells by importance (area, resolution, etc.)
    visibleCells.sort(this.cellImportanceComparator);
    
    return {
      visibleCells: visibleCells.slice(0, lodLevel.maxCells),
      culledCells: [...culledCells, ...visibleCells.slice(lodLevel.maxCells)],
      lodLevel: LOD_LEVELS.indexOf(lodLevel),
      updateRequired: true
    };
  }

  /**
   * Apply adaptive culling based on current performance
   */
  private applyAdaptiveCulling(cullResult: CullResult, currentFrameTime: number): void {
    const targetFrameTime = 1000 / this.options.targetFrameRate;
    const performanceRatio = currentFrameTime / targetFrameTime;
    
    if (performanceRatio > this.adaptiveSettings.performanceMargin) {
      // Reduce visible cells to improve performance
      const reductionFactor = Math.min(0.8, 1 / performanceRatio);
      const newCellCount = Math.floor(cullResult.visibleCells.length * reductionFactor);
      
      const removedCells = cullResult.visibleCells.slice(newCellCount);
      cullResult.visibleCells = cullResult.visibleCells.slice(0, newCellCount);
      cullResult.culledCells.push(...removedCells);
    }
  }

  /**
   * Determine if viewport update is required
   */
  private shouldUpdate(viewState: ViewState): boolean {
    if (!this.lastViewState) return true;
    
    const timeSinceUpdate = Date.now() - this.lastUpdateTime;
    if (timeSinceUpdate < this.options.updateInterval) return false;
    
    const last = this.lastViewState;
    const current = viewState;
    
    // Check for significant viewport changes
    const zoomDiff = Math.abs(current.zoom - last.zoom);
    const latDiff = Math.abs(current.latitude - last.latitude);
    const lngDiff = Math.abs(current.longitude - last.longitude);
    const pitchDiff = Math.abs((current.pitch || 0) - (last.pitch || 0));
    const bearingDiff = Math.abs((current.bearing || 0) - (last.bearing || 0));
    
    // Determine update thresholds based on zoom level
    const lodLevel = this.determineLODLevel(current);
    const threshold = lodLevel.updateThreshold;
    
    return (
      zoomDiff > threshold * 0.5 ||
      latDiff > threshold ||
      lngDiff > threshold ||
      pitchDiff > 5 ||
      bearingDiff > 5
    );
  }

  /**
   * Helper methods
   */
  private isPointInBounds(lat: number, lng: number, bounds: ViewportBounds): boolean {
    // Handle anti-meridian crossing
    if (bounds.west > bounds.east) {
      return (lng >= bounds.west || lng <= bounds.east) && 
             lat >= bounds.south && lat <= bounds.north;
    }
    
    return lng >= bounds.west && lng <= bounds.east && 
           lat >= bounds.south && lat <= bounds.north;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private cellImportanceComparator = (a: H3Cell, b: H3Cell): number => {
    // Prioritize land cells
    if (a.isLand !== b.isLand) return a.isLand ? -1 : 1;
    
    // Prioritize appropriate resolution for current zoom
    const resolutionDiff = Math.abs(a.resolution - 3) - Math.abs(b.resolution - 3);
    if (resolutionDiff !== 0) return resolutionDiff;
    
    // Prioritize larger areas at low resolution
    return b.area - a.area;
  };

  /**
   * Cache management
   */
  private updateCaches(viewState: ViewState, cullResult: CullResult): void {
    const cacheKey = this.generateCacheKey(viewState);
    this.cellCache.set(cacheKey, cullResult.visibleCells);
    
    // Update visibility cache
    cullResult.visibleCells.forEach(cell => {
      this.visibilityCache.set(cell.id, true);
    });
    cullResult.culledCells.forEach(cell => {
      this.visibilityCache.set(cell.id, false);
    });
    
    // Prune caches if they get too large
    this.pruneCaches();
  }

  private getCachedResult(cells: H3Cell[], viewState: ViewState): CullResult | null {
    const cacheKey = this.generateCacheKey(viewState);
    const cachedCells = this.cellCache.get(cacheKey);
    
    if (!cachedCells) return null;
    
    const visibleCells = cells.filter(cell => this.visibilityCache.get(cell.id) === true);
    const culledCells = cells.filter(cell => this.visibilityCache.get(cell.id) === false);
    
    return {
      visibleCells,
      culledCells,
      lodLevel: this.determineLODLevel(viewState).resolution,
      updateRequired: false
    };
  }

  private generateCacheKey(viewState: ViewState): string {
    const precision = 100; // 0.01 degree precision
    const lat = Math.round(viewState.latitude * precision) / precision;
    const lng = Math.round(viewState.longitude * precision) / precision;
    const zoom = Math.round(viewState.zoom * 10) / 10; // 0.1 zoom precision
    return `${lat}_${lng}_${zoom}`;
  }

  private pruneCaches(): void {
    const maxCacheSize = 100;
    
    if (this.cellCache.size > maxCacheSize) {
      const entries = Array.from(this.cellCache.entries());
      const toKeep = entries.slice(-maxCacheSize / 2);
      this.cellCache.clear();
      toKeep.forEach(([key, value]) => this.cellCache.set(key, value));
    }
    
    if (this.visibilityCache.size > maxCacheSize * 100) {
      this.visibilityCache.clear();
    }
  }

  /**
   * Performance monitoring
   */
  private updatePerformanceHistory(processingTime: number): void {
    this.performanceHistory.push(processingTime);
    if (this.performanceHistory.length > 60) { // Keep last 60 measurements
      this.performanceHistory.shift();
    }
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    const avgProcessingTime = this.performanceHistory.length > 0 ?
      this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length : 0;
    
    return {
      totalCells: 0, // Will be populated by caller
      visibleCells: 0, // Will be populated by caller
      culledCells: 0, // Will be populated by caller
      renderTime: avgProcessingTime,
      updateTime: this.lastUpdateTime,
      memoryUsage: this.estimateMemoryUsage(),
      frameRate: 1000 / Math.max(1, avgProcessingTime),
      lodLevel: this.lastViewState ? this.determineLODLevel(this.lastViewState).resolution : 2,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimate in MB
    const cellCacheSize = this.cellCache.size * 100; // ~100 bytes per cached cell array
    const visibilityCacheSize = this.visibilityCache.size * 10; // ~10 bytes per visibility entry
    return (cellCacheSize + visibilityCacheSize) / 1024 / 1024;
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    return Math.min(1, this.cellCache.size / 50) * 100; // Assume good hit rate with decent cache size
  }

  /**
   * Configuration updates
   */
  public updateOptions(options: Partial<OptimizationOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Update adaptive settings based on new target frame rate
    if (options.targetFrameRate) {
      this.adaptiveSettings.targetFrameTime = 1000 / options.targetFrameRate;
    }
  }

  public clearCaches(): void {
    this.cellCache.clear();
    this.visibilityCache.clear();
    this.performanceHistory = [];
  }

  /**
   * Debug utilities
   */
  public getDebugInfo(): {
    lodLevels: LODLevel[];
    currentLOD: number;
    cacheSize: number;
    performanceHistory: number[];
    lastUpdate: number;
  } {
    return {
      lodLevels: LOD_LEVELS,
      currentLOD: this.lastViewState ? LOD_LEVELS.indexOf(this.determineLODLevel(this.lastViewState)) : -1,
      cacheSize: this.cellCache.size,
      performanceHistory: [...this.performanceHistory],
      lastUpdate: this.lastUpdateTime
    };
  }
}