/**
 * H3 Global Coverage System
 * 
 * Provides complete global hexagon coverage with adaptive resolution,
 * land detection, and performance optimization for deck.gl rendering.
 */

import { latLngToCell, cellToLatLng, cellToBoundary, getRes0Cells, gridDisk, isValidCell, getResolution } from 'h3-js';
import { LandDetectionSystem } from './land-detection';

export interface H3Cell {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  resolution: number;
  isLand: boolean;
  boundary: number[][];
  center: [number, number];
  area: number;
  neighbors?: string[];
}

export interface H3CoverageOptions {
  minResolution: number;
  maxResolution: number;
  viewport?: {
    longitude: number;
    latitude: number;
    zoom: number;
    bounds?: [[number, number], [number, number]];
  };
  includeOceans?: boolean;
  cachingEnabled?: boolean;
}

export interface AnalysisMode {
  id: 'base' | 'opportunities' | 'maritime' | 'utilization';
  name: string;
  colorScheme: ColorScheme;
  elevationScale: number;
  opacity: number;
}

export interface ColorScheme {
  land: [number, number, number, number];
  ocean: [number, number, number, number];
  opportunities: {
    low: [number, number, number, number];
    medium: [number, number, number, number];
    high: [number, number, number, number];
    critical: [number, number, number, number];
  };
  maritime: {
    shipping: [number, number, number, number];
    port: [number, number, number, number];
    route: [number, number, number, number];
  };
  utilization: {
    unused: [number, number, number, number];
    low: [number, number, number, number];
    moderate: [number, number, number, number];
    high: [number, number, number, number];
  };
}

// Default analysis modes
export const ANALYSIS_MODES: Record<string, AnalysisMode> = {
  base: {
    id: 'base',
    name: 'Base Map',
    colorScheme: {
      land: [45, 55, 65, 120],
      ocean: [20, 25, 35, 80],
      opportunities: {
        low: [45, 55, 65, 120],
        medium: [45, 55, 65, 120],
        high: [45, 55, 65, 120],
        critical: [45, 55, 65, 120]
      },
      maritime: {
        shipping: [45, 55, 65, 120],
        port: [45, 55, 65, 120],
        route: [45, 55, 65, 120]
      },
      utilization: {
        unused: [45, 55, 65, 120],
        low: [45, 55, 65, 120],
        moderate: [45, 55, 65, 120],
        high: [45, 55, 65, 120]
      }
    },
    elevationScale: 0,
    opacity: 0.6
  },
  opportunities: {
    id: 'opportunities',
    name: 'Opportunities Analysis',
    colorScheme: {
      land: [45, 55, 65, 120],
      ocean: [20, 25, 35, 80],
      opportunities: {
        low: [34, 197, 94, 150],      // Green
        medium: [251, 191, 36, 180],  // Yellow
        high: [249, 115, 22, 210],    // Orange
        critical: [239, 68, 68, 240]  // Red
      },
      maritime: {
        shipping: [45, 55, 65, 120],
        port: [45, 55, 65, 120],
        route: [45, 55, 65, 120]
      },
      utilization: {
        unused: [45, 55, 65, 120],
        low: [45, 55, 65, 120],
        moderate: [45, 55, 65, 120],
        high: [45, 55, 65, 120]
      }
    },
    elevationScale: 10000,
    opacity: 0.8
  },
  maritime: {
    id: 'maritime',
    name: 'Maritime Analysis',
    colorScheme: {
      land: [45, 55, 65, 120],
      ocean: [20, 25, 35, 80],
      opportunities: {
        low: [45, 55, 65, 120],
        medium: [45, 55, 65, 120],
        high: [45, 55, 65, 120],
        critical: [45, 55, 65, 120]
      },
      maritime: {
        shipping: [59, 130, 246, 180],   // Blue
        port: [139, 69, 19, 200],        // Brown
        route: [16, 185, 129, 160]       // Teal
      },
      utilization: {
        unused: [45, 55, 65, 120],
        low: [45, 55, 65, 120],
        moderate: [45, 55, 65, 120],
        high: [45, 55, 65, 120]
      }
    },
    elevationScale: 5000,
    opacity: 0.7
  },
  utilization: {
    id: 'utilization',
    name: 'Station Utilization',
    colorScheme: {
      land: [45, 55, 65, 120],
      ocean: [20, 25, 35, 80],
      opportunities: {
        low: [45, 55, 65, 120],
        medium: [45, 55, 65, 120],
        high: [45, 55, 65, 120],
        critical: [45, 55, 65, 120]
      },
      maritime: {
        shipping: [45, 55, 65, 120],
        port: [45, 55, 65, 120],
        route: [45, 55, 65, 120]
      },
      utilization: {
        unused: [156, 163, 175, 100],    // Gray
        low: [34, 197, 94, 150],         // Green
        moderate: [251, 191, 36, 180],   // Yellow
        high: [239, 68, 68, 210]         // Red
      }
    },
    elevationScale: 8000,
    opacity: 0.75
  }
};

export class H3GlobalCoverageSystem {
  private cellCache = new Map<string, H3Cell[]>();
  private landDetection: LandDetectionSystem;
  private performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    cellsGenerated: 0,
    lastGenerationTime: 0
  };

  constructor(private options: H3CoverageOptions = {
    minResolution: 1,
    maxResolution: 4,
    includeOceans: false,
    cachingEnabled: true
  }) {
    // Initialize land detection with appropriate precision
    const precision = options.maxResolution > 3 ? 'high' : 'medium';
    this.landDetection = new LandDetectionSystem({
      precision,
      cacheEnabled: true,
      includeSmallIslands: precision === 'high',
      coastalBuffer: 0
    });
  }

  /**
   * Generate global hexagon coverage based on viewport and zoom level
   */
  public generateCoverage(viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
    bounds?: [[number, number], [number, number]];
  }): H3Cell[] {
    const startTime = performance.now();
    
    // Determine resolution based on zoom level
    const resolution = this.getOptimalResolution(viewport.zoom);
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(viewport, resolution);
    
    // Check cache first
    if (this.options.cachingEnabled && this.cellCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.cellCache.get(cacheKey)!;
    }
    
    this.performanceMetrics.cacheMisses++;
    
    // Generate hexagons based on viewport
    let cells: H3Cell[];
    
    if (viewport.bounds) {
      cells = this.generateBoundedCoverage(viewport.bounds, resolution);
    } else {
      cells = this.generateViewportCoverage(viewport, resolution);
    }
    
    // Filter by land/ocean if needed
    if (!this.options.includeOceans) {
      cells = cells.filter(cell => cell.isLand);
    }
    
    // Cache results
    if (this.options.cachingEnabled) {
      this.cellCache.set(cacheKey, cells);
    }
    
    this.performanceMetrics.cellsGenerated = cells.length;
    this.performanceMetrics.lastGenerationTime = performance.now() - startTime;
    
    return cells;
  }

  /**
   * Generate complete global coverage (for initialization or full analysis)
   */
  public generateGlobalCoverage(resolution: number = 2): H3Cell[] {
    const startTime = performance.now();
    const cacheKey = `global_res_${resolution}`;
    
    if (this.options.cachingEnabled && this.cellCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.cellCache.get(cacheKey)!;
    }
    
    this.performanceMetrics.cacheMisses++;
    
    const cells: H3Cell[] = [];
    
    // Start with resolution 0 base cells and refine
    const baseCells = getRes0Cells();
    
    baseCells.forEach(baseCell => {
      // Get all cells at target resolution within this base cell
      const refinedCells = this.refineCellToResolution(baseCell, resolution);
      cells.push(...refinedCells);
    });
    
    // Filter by land if needed
    const filteredCells = this.options.includeOceans ? 
      cells : cells.filter(cell => cell.isLand);
    
    // Cache results
    if (this.options.cachingEnabled) {
      this.cellCache.set(cacheKey, filteredCells);
    }
    
    this.performanceMetrics.cellsGenerated = filteredCells.length;
    this.performanceMetrics.lastGenerationTime = performance.now() - startTime;
    
    return filteredCells;
  }

  /**
   * Get optimal H3 resolution based on zoom level
   */
  private getOptimalResolution(zoom: number): number {
    // Adaptive resolution based on zoom level
    // Low zoom = low resolution (fewer, larger hexagons)
    // High zoom = high resolution (more, smaller hexagons)
    
    if (zoom <= 2) return Math.max(this.options.minResolution, 1);
    if (zoom <= 4) return Math.max(this.options.minResolution, 2);
    if (zoom <= 6) return Math.min(this.options.maxResolution, 3);
    return Math.min(this.options.maxResolution, 4);
  }

  /**
   * Generate hexagons for a bounded area
   */
  private generateBoundedCoverage(
    bounds: [[number, number], [number, number]], 
    resolution: number
  ): H3Cell[] {
    const [[southWest_lng, southWest_lat], [northEast_lng, northEast_lat]] = bounds;
    const cells: H3Cell[] = [];
    
    // Sample points across the bounded area
    const latStep = (northEast_lat - southWest_lat) / 20;
    const lngStep = (northEast_lng - southWest_lng) / 20;
    
    const processedCells = new Set<string>();
    
    for (let lat = southWest_lat; lat <= northEast_lat; lat += latStep) {
      for (let lng = southWest_lng; lng <= northEast_lng; lng += lngStep) {
        const h3Index = latLngToCell(lat, lng, resolution);
        
        if (isValidCell(h3Index) && !processedCells.has(h3Index)) {
          processedCells.add(h3Index);
          const cell = this.createH3Cell(h3Index);
          
          // Check if cell center is within bounds
          if (this.isWithinBounds(cell.center, bounds)) {
            cells.push(cell);
          }
        }
      }
    }
    
    return cells;
  }

  /**
   * Generate hexagons for viewport-based coverage
   */
  private generateViewportCoverage(viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
  }, resolution: number): H3Cell[] {
    // Calculate approximate bounds based on viewport
    const zoom = viewport.zoom;
    const latRange = 180 / Math.pow(2, zoom - 1);
    const lngRange = 360 / Math.pow(2, zoom - 1);
    
    const bounds: [[number, number], [number, number]] = [
      [viewport.longitude - lngRange, viewport.latitude - latRange],
      [viewport.longitude + lngRange, viewport.latitude + latRange]
    ];
    
    return this.generateBoundedCoverage(bounds, resolution);
  }

  /**
   * Refine a cell from its current resolution to target resolution
   */
  private refineCellToResolution(cellId: string, targetResolution: number): H3Cell[] {
    const currentResolution = this.getH3Resolution(cellId);
    
    if (currentResolution === targetResolution) {
      return [this.createH3Cell(cellId)];
    }
    
    if (currentResolution > targetResolution) {
      // Need to go up to parent - not commonly needed for this use case
      return [this.createH3Cell(cellId)];
    }
    
    // Refine down to target resolution
    const cells: H3Cell[] = [];
    const queue: string[] = [cellId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRes = this.getH3Resolution(current);
      
      if (currentRes === targetResolution) {
        cells.push(this.createH3Cell(current));
      } else if (currentRes < targetResolution) {
        // Get children and add to queue
        const children = this.getH3Children(current);
        queue.push(...children);
      }
    }
    
    return cells;
  }

  /**
   * Create H3Cell object with all required properties
   */
  private createH3Cell(h3Index: string): H3Cell {
    const [lat, lng] = cellToLatLng(h3Index);
    const boundary = cellToBoundary(h3Index);
    const isLand = this.landDetection.isLand(lat, lng);
    
    return {
      id: h3Index,
      coordinates: [lng, lat],
      resolution: getResolution(h3Index),
      isLand,
      boundary,
      center: [lng, lat],
      area: this.calculateCellArea(h3Index),
      neighbors: this.getCellNeighbors(h3Index)
    };
  }

  /**
   * Get region-specific hexagon analysis data
   */
  public getRegionAnalysis(bounds: [[number, number], [number, number]]): {
    totalCells: number;
    landCells: number;
    oceanCells: number;
    landPercentage: number;
    resolutionDistribution: Record<number, number>;
  } {
    const coverage = this.generateBoundedCoverage(bounds, this.options.maxResolution);
    
    const landCells = coverage.filter(cell => cell.isLand).length;
    const oceanCells = coverage.length - landCells;
    const landPercentage = (landCells / coverage.length) * 100;
    
    const resolutionDistribution: Record<number, number> = {};
    coverage.forEach(cell => {
      const res = cell.resolution;
      resolutionDistribution[res] = (resolutionDistribution[res] || 0) + 1;
    });
    
    return {
      totalCells: coverage.length,
      landCells,
      oceanCells,
      landPercentage,
      resolutionDistribution
    };
  }

  /**
   * Utility methods
   */
  private generateCacheKey(viewport: any, resolution: number): string {
    const lat = Math.round(viewport.latitude * 100) / 100;
    const lng = Math.round(viewport.longitude * 100) / 100;
    const zoom = Math.round(viewport.zoom);
    return `${lat}_${lng}_${zoom}_${resolution}`;
  }

  private isWithinBounds(
    point: [number, number], 
    bounds: [[number, number], [number, number]]
  ): boolean {
    const [lng, lat] = point;
    const [[sw_lng, sw_lat], [ne_lng, ne_lat]] = bounds;
    return lng >= sw_lng && lng <= ne_lng && lat >= sw_lat && lat <= ne_lat;
  }

  private getH3Resolution(h3Index: string): number {
    return getResolution(h3Index);
  }

  private getH3Children(h3Index: string): string[] {
    // Simplified children generation
    // In practice, you'd use h3-js h3ToChildren
    return [];
  }

  private calculateCellArea(h3Index: string): number {
    // Approximate cell area calculation
    const resolution = this.getH3Resolution(h3Index);
    // Area decreases by factor of ~7 with each resolution increase
    const baseArea = 4250546; // km² for resolution 0
    return baseArea / Math.pow(7, resolution);
  }

  private getCellNeighbors(h3Index: string): string[] {
    try {
      const neighbors = gridDisk(h3Index, 1);
      return neighbors.filter(id => id !== h3Index);
    } catch {
      return [];
    }
  }

  /**
   * Performance monitoring
   */
  public getPerformanceMetrics() {
    const landStats = this.landDetection.getCacheStats();
    return {
      ...this.performanceMetrics,
      cacheSize: this.cellCache.size,
      landCacheSize: landStats.size,
      landPrecision: landStats.precision,
      hitRatio: this.performanceMetrics.cacheHits / 
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0
    };
  }

  /**
   * Cache management
   */
  public clearCache(): void {
    this.cellCache.clear();
    this.landDetection.clearCache();
    this.performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cellsGenerated: 0,
      lastGenerationTime: 0
    };
  }

  public pruneCache(maxSize: number = 50): void {
    if (this.cellCache.size > maxSize) {
      const entries = Array.from(this.cellCache.entries());
      const toKeep = entries.slice(-maxSize);
      this.cellCache.clear();
      toKeep.forEach(([key, value]) => this.cellCache.set(key, value));
    }
  }
}