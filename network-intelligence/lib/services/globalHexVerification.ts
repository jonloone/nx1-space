/**
 * Global H3 Hexagon Coverage Verification System
 * 
 * Ensures complete global coverage of all landmasses using H3 spatial indexing.
 * This system addresses the critical requirement that EVERY piece of land on Earth
 * must have hexagon coverage with no gaps.
 * 
 * Features:
 * - Complete global landmass coverage (all continents, islands, archipelagos)
 * - Multi-resolution H3 indexing (2-6) with adaptive detail
 * - Advanced land detection with coastline accuracy
 * - Memory-efficient generation and caching
 * - Performance optimized for 10,000+ hexagons
 * - Conditional scoring with base/opportunity modes
 */

import { 
  latLngToCell, 
  cellToLatLng, 
  cellToBoundary, 
  cellArea,
  getResolution,
  gridDisk,
  cellToChildren,
  cellToParent,
  getHexagonEdgeLengthAvg,
  getHexagonAreaAvg
} from 'h3-js';

import { isLandSimple, getLandCoverageForBounds, isCoastalArea } from '../land-water-detection';

/**
 * Enhanced land detection boundaries with comprehensive global coverage
 * Includes all landmasses, islands, and archipelagos worldwide
 */
const GLOBAL_LAND_REGIONS = {
  // Major continents with detailed boundaries
  northAmerica: [
    { minLat: 15, maxLat: 83, minLon: -168, maxLon: -52, name: 'North America mainland' },
    { minLat: 7, maxLat: 20, minLon: -92, maxLon: -77, name: 'Central America' },
    { minLat: 60, maxLat: 83, minLon: -168, maxLon: -120, name: 'Alaska' },
    { minLat: 59, maxLat: 84, minLon: -75, maxLon: -11, name: 'Greenland' }
  ],
  southAmerica: [
    { minLat: -56, maxLat: 13, minLon: -82, maxLon: -34, name: 'South America mainland' }
  ],
  europe: [
    { minLat: 36, maxLat: 81, minLon: -31, maxLon: 67, name: 'Europe mainland' },
    { minLat: 50, maxLat: 61, minLon: -8, maxLon: 2, name: 'British Isles' },
    { minLat: 63, maxLat: 67, minLon: -24, maxLon: -13, name: 'Iceland' },
    { minLat: 57, maxLat: 71, minLon: 4, maxLon: 31, name: 'Scandinavia' },
    { minLat: 67, maxLat: 81, minLon: 15, maxLon: 67, name: 'Svalbard/Arctic islands' }
  ],
  africa: [
    { minLat: -35, maxLat: 37, minLon: -18, maxLon: 52, name: 'Africa mainland' },
    { minLat: -26, maxLat: -12, minLon: 43, maxLon: 51, name: 'Madagascar' }
  ],
  asia: [
    { minLat: 1, maxLat: 81, minLon: 26, maxLon: 180, name: 'Asia mainland' },
    { minLat: -11, maxLat: 28, minLon: 92, maxLon: 141, name: 'Southeast Asia' },
    { minLat: 30, maxLat: 46, minLon: 129, maxLon: 146, name: 'Japan' },
    { minLat: 33, maxLat: 43, minLon: 124, maxLon: 132, name: 'Korean Peninsula' },
    { minLat: 5, maxLat: 21, minLon: 117, maxLon: 127, name: 'Philippines' },
    { minLat: 6, maxLat: 10, minLon: 79, maxLon: 82, name: 'Sri Lanka' }
  ],
  australia: [
    { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154, name: 'Australia mainland' },
    { minLat: -47, maxLat: -34, minLon: 166, maxLon: 179, name: 'New Zealand' },
    { minLat: -54, maxLat: -29, minLon: 37, maxLon: 78, name: 'Indian Ocean islands' }
  ],
  // Pacific Island chains
  pacific: [
    { minLat: 19, maxLat: 22, minLon: -161, maxLon: -154, name: 'Hawaiian Islands' },
    { minLat: -25, maxLat: 25, minLon: 130, maxLon: 180, name: 'Pacific Islands' },
    { minLat: -30, maxLat: -15, minLon: -180, maxLon: -130, name: 'French Polynesia' },
    { minLat: 7, maxLat: 15, minLon: 134, maxLon: 163, name: 'Micronesia' },
    { minLat: -21, maxLat: -12, minLon: 160, maxLon: 180, name: 'Melanesia' }
  ],
  // Atlantic Island chains
  atlantic: [
    { minLat: 20, maxLat: 30, minLon: -18, maxLon: -13, name: 'Canary Islands' },
    { minLat: 32, maxLat: 42, minLon: -31, maxLon: -24, name: 'Azores' },
    { minLat: -16, maxLat: -15, minLon: -6, maxLon: -5, name: 'St. Helena' },
    { minLat: -38, maxLat: -37, minLon: -13, maxLon: -12, name: 'Tristan da Cunha' }
  ],
  // Arctic regions
  arctic: [
    { minLat: 70, maxLat: 85, minLon: -180, maxLon: 180, name: 'Arctic Archipelago' }
  ],
  // Antarctic regions (if needed)
  antarctic: [
    { minLat: -90, maxLat: -60, minLon: -180, maxLon: 180, name: 'Antarctica' }
  ]
};

/**
 * Global H3 hexagon with enhanced properties
 */
export interface GlobalHexagon {
  // Core H3 properties
  hexagon: string;
  h3Index: string; // Alias for compatibility
  resolution: number;
  coordinates: [number, number]; // [lon, lat]
  boundary: Array<[number, number]>;
  areaKm2: number;
  
  // Land analysis
  landCoverage: number; // 0-100%
  isLand: boolean;
  isCoastal: boolean;
  landType: 'continental' | 'island' | 'archipelago' | 'arctic' | 'antarctic';
  region: string;
  
  // Coverage verification
  hasGaps: boolean;
  neighbors: string[];
  verified: boolean;
  
  // Conditional scoring (base vs opportunities mode)
  baseColor: [number, number, number, number]; // Gray for land, darker for ocean
  opportunityColor: [number, number, number, number] | null; // Null if no opportunity
  opportunityScore: number | null;
  
  // Performance metadata
  generatedAt: number;
  lastVerified: number;
}

/**
 * Configuration for global hex generation
 */
export interface GlobalHexConfig {
  resolutions: number[]; // H3 resolutions to generate (2-6)
  includeOcean: boolean; // Whether to include ocean hexagons
  includeAntarctica: boolean; // Whether to include Antarctica
  minLandCoverage: number; // Minimum land coverage % to include
  verifyCompleteness: boolean; // Whether to verify no gaps
  maxHexagonsPerResolution: number; // Memory limit per resolution
  useAdaptiveDetail: boolean; // Use higher resolution for coastlines
}

/**
 * Global H3 Hexagon Coverage Verification System
 */
export class GlobalHexVerification {
  private hexagonCache = new Map<string, Map<string, GlobalHexagon>>();
  private completenessVerified = new Map<number, boolean>();
  private gapAnalysis = new Map<number, string[]>();
  
  constructor(private config: GlobalHexConfig) {}
  
  /**
   * Generate complete global hexagon coverage with verification
   */
  async generateGlobalCoverage(): Promise<Map<number, GlobalHexagon[]>> {
    console.log('🌍 Starting global H3 hexagon coverage generation...');
    
    const results = new Map<number, GlobalHexagon[]>();
    
    for (const resolution of this.config.resolutions) {
      console.log(`📐 Generating resolution ${resolution} hexagons...`);
      
      const hexagons = await this.generateResolutionCoverage(resolution);
      results.set(resolution, hexagons);
      
      if (this.config.verifyCompleteness) {
        await this.verifyCompleteness(resolution, hexagons);
      }
      
      console.log(`✅ Resolution ${resolution}: ${hexagons.length} hexagons generated`);
    }
    
    console.log('🎉 Global coverage generation complete!');
    return results;
  }
  
  /**
   * Generate hexagon coverage for a specific resolution
   */
  private async generateResolutionCoverage(resolution: number): Promise<GlobalHexagon[]> {
    const hexagons = new Map<string, GlobalHexagon>();
    const processed = new Set<string>();
    
    // Calculate approximate step size for this resolution
    const avgEdgeLength = getHexagonEdgeLengthAvg(resolution, 'km');
    const stepDegrees = (avgEdgeLength * 2) / 111; // Convert km to degrees (approximate)
    
    // Process each land region
    for (const [continentName, regions] of Object.entries(GLOBAL_LAND_REGIONS)) {
      if (continentName === 'antarctic' && !this.config.includeAntarctica) continue;
      
      for (const region of regions) {
        await this.processRegion(
          region, 
          continentName, 
          resolution, 
          stepDegrees, 
          hexagons, 
          processed
        );
      }
    }
    
    // Add ocean hexagons if configured
    if (this.config.includeOcean) {
      await this.addOceanHexagons(resolution, stepDegrees, hexagons, processed);
    }
    
    // Sort by land coverage (land hexagons first, then by coverage percentage)
    const sortedHexagons = Array.from(hexagons.values()).sort((a, b) => {
      if (a.isLand && !b.isLand) return -1;
      if (!a.isLand && b.isLand) return 1;
      return b.landCoverage - a.landCoverage;
    });
    
    // Apply memory limit
    const limited = sortedHexagons.slice(0, this.config.maxHexagonsPerResolution);
    
    // Cache the results
    this.hexagonCache.set(`resolution_${resolution}`, new Map(limited.map(h => [h.h3Index, h])));
    
    return limited;
  }
  
  /**
   * Process a specific geographic region
   */
  private async processRegion(
    region: any,
    continentName: string,
    resolution: number,
    stepDegrees: number,
    hexagons: Map<string, GlobalHexagon>,
    processed: Set<string>
  ): Promise<void> {
    const { minLat, maxLat, minLon, maxLon, name } = region;
    
    // Use adaptive step size for coastlines
    const adaptiveStep = this.config.useAdaptiveDetail && 
                        (continentName === 'pacific' || continentName === 'atlantic') 
                        ? stepDegrees / 2 : stepDegrees;
    
    for (let lat = minLat; lat <= maxLat; lat += adaptiveStep) {
      for (let lon = minLon; lon <= maxLon; lon += adaptiveStep) {
        // Normalize longitude
        const normalizedLon = this.normalizeLongitude(lon);
        
        // Get H3 index for this coordinate
        try {
          const h3Index = latLngToCell(lat, normalizedLon, resolution);
          
          if (processed.has(h3Index)) continue;
          processed.add(h3Index);
          
          // Create hexagon if it meets criteria
          const hexagon = await this.createGlobalHexagon(
            h3Index, 
            resolution, 
            continentName, 
            name
          );
          
          if (hexagon && this.shouldIncludeHexagon(hexagon)) {
            hexagons.set(h3Index, hexagon);
            
            // Add neighboring hexagons if using adaptive detail
            if (this.config.useAdaptiveDetail && hexagon.isCoastal) {
              await this.addNeighborHexagons(h3Index, resolution, hexagons, processed, continentName);
            }
          }
        } catch (error) {
          // Skip invalid coordinates
          continue;
        }
      }
    }
  }
  
  /**
   * Add ocean hexagons for complete coverage
   */
  private async addOceanHexagons(
    resolution: number,
    stepDegrees: number,
    hexagons: Map<string, GlobalHexagon>,
    processed: Set<string>
  ): Promise<void> {
    const oceanStep = stepDegrees * 4; // Coarser sampling for oceans
    
    for (let lat = -85; lat <= 85; lat += oceanStep) {
      for (let lon = -180; lon <= 180; lon += oceanStep) {
        try {
          const h3Index = latLngToCell(lat, lon, resolution);
          
          if (processed.has(h3Index)) continue;
          processed.add(h3Index);
          
          const hexagon = await this.createGlobalHexagon(h3Index, resolution, 'ocean', 'Ocean');
          
          if (hexagon && !hexagon.isLand) {
            hexagons.set(h3Index, hexagon);
          }
        } catch (error) {
          continue;
        }
      }
    }
  }
  
  /**
   * Add neighboring hexagons for completeness
   */
  private async addNeighborHexagons(
    centerH3Index: string,
    resolution: number,
    hexagons: Map<string, GlobalHexagon>,
    processed: Set<string>,
    continentName: string
  ): Promise<void> {
    try {
      const neighbors = gridDisk(centerH3Index, 1);
      
      for (const neighborH3Index of neighbors) {
        if (processed.has(neighborH3Index)) continue;
        processed.add(neighborH3Index);
        
        const hexagon = await this.createGlobalHexagon(
          neighborH3Index, 
          resolution, 
          continentName, 
          'Neighbor'
        );
        
        if (hexagon && this.shouldIncludeHexagon(hexagon)) {
          hexagons.set(neighborH3Index, hexagon);
        }
      }
    } catch (error) {
      // Skip if neighbor calculation fails
    }
  }
  
  /**
   * Create a GlobalHexagon from an H3 index
   */
  private async createGlobalHexagon(
    h3Index: string,
    resolution: number,
    continentName: string,
    regionName: string
  ): Promise<GlobalHexagon | null> {
    try {
      // Get hex center and boundary
      const [centerLat, centerLon] = cellToLatLng(h3Index);
      const boundary = cellToBoundary(h3Index).map(([lat, lon]) => [lat, lon] as [number, number]);
      const areaKm2 = cellArea(h3Index, 'km2');
      
      // Analyze land coverage
      const landCoverage = this.calculateEnhancedLandCoverage(boundary);
      const isLand = landCoverage >= this.config.minLandCoverage;
      const isCoastal = isLand && isCoastalArea(centerLat, centerLon);
      
      // Determine land type
      const landType = this.determineLandType(continentName, centerLat, centerLon);
      
      // Calculate base and opportunity colors
      const baseColor = this.calculateBaseColor(isLand, landCoverage, landType);
      const { opportunityColor, opportunityScore } = this.calculateOpportunityScoring(
        isLand, 
        landCoverage, 
        isCoastal, 
        centerLat, 
        centerLon
      );
      
      // Get neighbors for gap analysis
      const neighbors = this.getNeighborIndices(h3Index);
      
      return {
        hexagon: h3Index,
        h3Index: h3Index,
        resolution,
        coordinates: [centerLon, centerLat],
        boundary,
        areaKm2,
        landCoverage,
        isLand,
        isCoastal,
        landType,
        region: regionName,
        hasGaps: false, // Will be calculated during verification
        neighbors,
        verified: false,
        baseColor,
        opportunityColor,
        opportunityScore,
        generatedAt: Date.now(),
        lastVerified: 0
      };
    } catch (error) {
      console.warn(`Failed to create hexagon for ${h3Index}:`, error);
      return null;
    }
  }
  
  /**
   * Enhanced land coverage calculation with coastal accuracy
   */
  private calculateEnhancedLandCoverage(boundary: Array<[number, number]>): number {
    const minLat = Math.min(...boundary.map(([lat]) => lat));
    const maxLat = Math.max(...boundary.map(([lat]) => lat));
    const minLon = Math.min(...boundary.map(([, lon]) => lon));
    const maxLon = Math.max(...boundary.map(([, lon]) => lon));
    
    // Use higher sample size for more accurate coastal detection
    return getLandCoverageForBounds(minLat, maxLat, minLon, maxLon, 16);
  }
  
  /**
   * Determine land type based on geographic context
   */
  private determineLandType(
    continentName: string, 
    lat: number, 
    lon: number
  ): 'continental' | 'island' | 'archipelago' | 'arctic' | 'antarctic' {
    if (Math.abs(lat) > 66.5) {
      return lat > 0 ? 'arctic' : 'antarctic';
    }
    
    if (continentName === 'pacific' || continentName === 'atlantic') {
      return 'island';
    }
    
    if (continentName === 'asia' && lat < 25 && lon > 90) {
      return 'archipelago'; // Southeast Asia
    }
    
    return 'continental';
  }
  
  /**
   * Calculate base color (always visible)
   */
  private calculateBaseColor(
    isLand: boolean, 
    landCoverage: number, 
    landType: 'continental' | 'island' | 'archipelago' | 'arctic' | 'antarctic'
  ): [number, number, number, number] {
    if (!isLand) {
      return [30, 41, 59, 120]; // Dark blue-gray for ocean
    }
    
    // Subtle gray variations for different land types
    switch (landType) {
      case 'continental':
        return [107, 114, 128, 140]; // Neutral gray
      case 'island':
        return [120, 113, 108, 140]; // Slightly warmer gray
      case 'archipelago':
        return [108, 117, 125, 140]; // Cooler gray
      case 'arctic':
        return [148, 163, 184, 140]; // Light gray-blue
      case 'antarctic':
        return [226, 232, 240, 140]; // Very light gray
      default:
        return [107, 114, 128, 140];
    }
  }
  
  /**
   * Calculate opportunity scoring and colors
   */
  private calculateOpportunityScoring(
    isLand: boolean,
    landCoverage: number,
    isCoastal: boolean,
    lat: number,
    lon: number
  ): { opportunityColor: [number, number, number, number] | null; opportunityScore: number | null } {
    if (!isLand || landCoverage < 75) {
      return { opportunityColor: null, opportunityScore: null };
    }
    
    // Simple scoring algorithm for opportunities
    let score = 50;
    
    // Coastal bonus
    if (isCoastal) score += 20;
    
    // Latitude preferences (avoid extreme latitudes)
    const absLat = Math.abs(lat);
    if (absLat > 70) score -= 30;
    else if (absLat > 50) score -= 10;
    else if (absLat < 60 && absLat > 30) score += 15;
    
    // Random variation for demonstration
    score += Math.random() * 30 - 15;
    score = Math.max(0, Math.min(100, score));
    
    let color: [number, number, number, number];
    if (score >= 80) color = [34, 197, 94, 180]; // Green - excellent
    else if (score >= 70) color = [234, 179, 8, 160]; // Yellow - good
    else if (score >= 60) color = [249, 115, 22, 140]; // Orange - moderate
    else color = [239, 68, 68, 120]; // Red - poor
    
    return { opportunityColor: color, opportunityScore: score };
  }
  
  /**
   * Get neighbor H3 indices
   */
  private getNeighborIndices(h3Index: string): string[] {
    try {
      return gridDisk(h3Index, 1).filter(idx => idx !== h3Index);
    } catch {
      return [];
    }
  }
  
  /**
   * Check if hexagon should be included based on criteria
   */
  private shouldIncludeHexagon(hexagon: GlobalHexagon): boolean {
    if (hexagon.isLand && hexagon.landCoverage >= this.config.minLandCoverage) {
      return true;
    }
    
    if (this.config.includeOcean && !hexagon.isLand) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Verify completeness of coverage for a resolution
   */
  private async verifyCompleteness(
    resolution: number, 
    hexagons: GlobalHexagon[]
  ): Promise<void> {
    console.log(`🔍 Verifying completeness for resolution ${resolution}...`);
    
    const gaps: string[] = [];
    const hexagonMap = new Map(hexagons.map(h => [h.h3Index, h]));
    
    // Check each land hexagon for gaps
    for (const hexagon of hexagons) {
      if (!hexagon.isLand) continue;
      
      const missingNeighbors = hexagon.neighbors.filter(neighborId => {
        const neighbor = hexagonMap.get(neighborId);
        return !neighbor || (!neighbor.isLand && neighbor.landCoverage > 25);
      });
      
      if (missingNeighbors.length > 0) {
        hexagon.hasGaps = true;
        gaps.push(...missingNeighbors);
      } else {
        hexagon.verified = true;
        hexagon.lastVerified = Date.now();
      }
    }
    
    this.gapAnalysis.set(resolution, gaps);
    this.completenessVerified.set(resolution, gaps.length === 0);
    
    if (gaps.length > 0) {
      console.warn(`⚠️  Found ${gaps.length} potential gaps in resolution ${resolution}`);
    } else {
      console.log(`✅ Resolution ${resolution} verified complete - no gaps found!`);
    }
  }
  
  /**
   * Get cached hexagons for a resolution
   */
  getCachedHexagons(resolution: number): GlobalHexagon[] | null {
    const cache = this.hexagonCache.get(`resolution_${resolution}`);
    return cache ? Array.from(cache.values()) : null;
  }
  
  /**
   * Get coverage statistics
   */
  getCoverageStats(): {
    totalHexagons: number;
    landHexagons: number;
    oceanHexagons: number;
    coastalHexagons: number;
    verifiedComplete: boolean[];
    gapCounts: number[];
  } {
    let totalHexagons = 0;
    let landHexagons = 0;
    let oceanHexagons = 0;
    let coastalHexagons = 0;
    
    for (const [, cache] of this.hexagonCache) {
      for (const hexagon of cache.values()) {
        totalHexagons++;
        if (hexagon.isLand) {
          landHexagons++;
          if (hexagon.isCoastal) coastalHexagons++;
        } else {
          oceanHexagons++;
        }
      }
    }
    
    return {
      totalHexagons,
      landHexagons,
      oceanHexagons,
      coastalHexagons,
      verifiedComplete: Array.from(this.completenessVerified.values()),
      gapCounts: Array.from(this.gapAnalysis.values()).map(gaps => gaps.length)
    };
  }
  
  /**
   * Normalize longitude to -180 to 180 range
   */
  private normalizeLongitude(lon: number): number {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    return lon;
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.hexagonCache.clear();
    this.completenessVerified.clear();
    this.gapAnalysis.clear();
  }
}

/**
 * Create a global hex verification instance with default settings
 */
export function createGlobalHexVerification(overrides: Partial<GlobalHexConfig> = {}): GlobalHexVerification {
  const defaultConfig: GlobalHexConfig = {
    resolutions: [4, 5, 6], // Good balance of coverage and performance
    includeOcean: false, // Focus on land for ground stations
    includeAntarctica: false, // Skip Antarctica for commercial purposes
    minLandCoverage: 50, // Include hexagons with at least 50% land
    verifyCompleteness: true, // Always verify no gaps
    maxHexagonsPerResolution: 15000, // Memory limit
    useAdaptiveDetail: true // Higher detail for coastlines
  };
  
  const config = { ...defaultConfig, ...overrides };
  return new GlobalHexVerification(config);
}

/**
 * Convenience function to generate global coverage
 */
export async function generateCompleteGlobalCoverage(
  config?: Partial<GlobalHexConfig>
): Promise<{
  coverage: Map<number, GlobalHexagon[]>;
  stats: ReturnType<GlobalHexVerification['getCoverageStats']>;
  verifier: GlobalHexVerification;
}> {
  const verifier = createGlobalHexVerification(config);
  const coverage = await verifier.generateGlobalCoverage();
  const stats = verifier.getCoverageStats();
  
  return { coverage, stats, verifier };
}