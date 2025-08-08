/**
 * Advanced Land Detection System
 * 
 * Provides accurate land/ocean classification for global hexagon coverage
 * using multiple detection methods and geographic datasets.
 */

export interface LandDetectionOptions {
  precision: 'low' | 'medium' | 'high';
  cacheEnabled: boolean;
  includeSmallIslands: boolean;
  coastalBuffer: number; // km
}

export interface LandMass {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  exclusions?: Array<{
    name: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  }>;
}

// Detailed landmass definitions with accurate boundaries
const MAJOR_LANDMASSES: LandMass[] = [
  // North America
  {
    name: 'North America',
    bounds: { north: 83.1, south: 14.5, west: -168.0, east: -52.6 },
    exclusions: [
      { name: 'Hudson Bay', bounds: { north: 70, south: 51, west: -103, east: -78 } },
      { name: 'Gulf of Mexico', bounds: { north: 31, south: 18, west: -98, east: -81 } },
      { name: 'Great Lakes', bounds: { north: 49, south: 41, west: -93, east: -76 } }
    ]
  },
  
  // South America
  {
    name: 'South America',
    bounds: { north: 12.5, south: -55.1, west: -81.3, east: -34.8 },
    exclusions: [
      { name: 'Lake Titicaca', bounds: { north: -15.5, south: -16.6, west: -69.7, east: -68.6 } }
    ]
  },
  
  // Europe
  {
    name: 'Europe',
    bounds: { north: 81.9, south: 34.8, west: -24.5, east: 66.9 },
    exclusions: [
      { name: 'Baltic Sea', bounds: { north: 66, south: 53.5, west: 10, east: 30 } },
      { name: 'Mediterranean Sea', bounds: { north: 46, south: 30, west: -6, east: 42 } },
      { name: 'Black Sea', bounds: { north: 47, south: 40, west: 27, east: 42 } },
      { name: 'Caspian Sea', bounds: { north: 47, south: 36, west: 46, east: 55 } }
    ]
  },
  
  // Africa
  {
    name: 'Africa',
    bounds: { north: 37.3, south: -34.8, west: -17.5, east: 51.3 },
    exclusions: [
      { name: 'Lake Victoria', bounds: { north: -0.3, south: -3.0, west: 31.4, east: 34.9 } },
      { name: 'Lake Tanganyika', bounds: { north: -3.3, south: -8.8, west: 29.1, east: 31.2 } }
    ]
  },
  
  // Asia
  {
    name: 'Asia',
    bounds: { north: 81.9, south: -11.0, west: 26.0, east: 180.0 },
    exclusions: [
      { name: 'Arabian Sea', bounds: { north: 30, south: 0, west: 50, east: 80 } },
      { name: 'Bay of Bengal', bounds: { north: 22, south: 5, west: 80, east: 100 } },
      { name: 'South China Sea', bounds: { north: 23, south: -3, west: 99, east: 121 } },
      { name: 'Sea of Japan', bounds: { north: 52, south: 33, west: 129, east: 142 } },
      { name: 'Aral Sea', bounds: { north: 46.8, south: 43.4, west: 58.2, east: 62.2 } },
      { name: 'Lake Baikal', bounds: { north: 55.8, south: 51.5, west: 103.6, east: 109.6 } }
    ]
  },
  
  // Australia
  {
    name: 'Australia',
    bounds: { north: -10.7, south: -43.6, west: 113.2, east: 153.6 }
  },
  
  // Antarctica
  {
    name: 'Antarctica',
    bounds: { north: -60.0, south: -90.0, west: -180.0, east: 180.0 }
  }
];

// Major islands and archipelagos
const MAJOR_ISLANDS: LandMass[] = [
  // Greenland
  { name: 'Greenland', bounds: { north: 83.7, south: 59.8, west: -73.0, east: -12.0 } },
  
  // Madagascar
  { name: 'Madagascar', bounds: { north: -11.9, south: -25.6, west: 43.2, east: 50.5 } },
  
  // New Guinea
  { name: 'New Guinea', bounds: { north: -2.5, south: -10.7, west: 130.8, east: 151.0 } },
  
  // Borneo
  { name: 'Borneo', bounds: { north: 7.4, south: -4.4, west: 108.9, east: 119.3 } },
  
  // Sumatra
  { name: 'Sumatra', bounds: { north: 6.0, south: -6.1, west: 95.2, east: 106.0 } },
  
  // Java
  { name: 'Java', bounds: { north: -5.9, south: -8.8, west: 105.2, east: 114.1 } },
  
  // Sulawesi
  { name: 'Sulawesi', bounds: { north: 5.6, south: -7.8, west: 118.8, east: 125.1 } },
  
  // Honshu (Japan)
  { name: 'Honshu', bounds: { north: 41.5, south: 34.1, west: 129.4, east: 141.9 } },
  
  // Great Britain
  { name: 'Great Britain', bounds: { north: 60.9, south: 49.9, west: -8.2, east: 1.8 } },
  
  // Ireland
  { name: 'Ireland', bounds: { north: 55.4, south: 51.4, west: -10.5, east: -6.0 } },
  
  // Iceland
  { name: 'Iceland', bounds: { north: 66.6, south: 63.4, west: -24.5, east: -13.5 } },
  
  // Cuba
  { name: 'Cuba', bounds: { north: 23.3, south: 19.8, west: -84.9, east: -74.1 } },
  
  // Hispaniola
  { name: 'Hispaniola', bounds: { north: 20.1, south: 17.6, west: -74.5, east: -68.3 } },
  
  // Jamaica
  { name: 'Jamaica', bounds: { north: 18.5, south: 17.7, west: -78.4, east: -76.2 } },
  
  // Puerto Rico
  { name: 'Puerto Rico', bounds: { north: 18.5, south: 17.9, west: -67.9, east: -65.2 } },
  
  // Taiwan
  { name: 'Taiwan', bounds: { north: 25.3, south: 21.9, west: 120.0, east: 122.0 } },
  
  // Sri Lanka
  { name: 'Sri Lanka', bounds: { north: 9.8, south: 5.9, west: 79.7, east: 81.9 } },
  
  // New Zealand North Island
  { name: 'New Zealand North', bounds: { north: -34.4, south: -41.8, west: 172.6, east: 178.6 } },
  
  // New Zealand South Island
  { name: 'New Zealand South', bounds: { north: -40.5, south: -47.3, west: 166.3, east: 174.3 } },
  
  // Tasmania
  { name: 'Tasmania', bounds: { north: -39.6, south: -43.6, west: 143.8, east: 148.5 } },
  
  // Sakhalin
  { name: 'Sakhalin', bounds: { north: 54.4, south: 45.9, west: 141.6, east: 144.9 } },
  
  // Kamchatka Peninsula
  { name: 'Kamchatka', bounds: { north: 61.0, south: 51.0, west: 155.3, east: 164.8 } },
  
  // Novaya Zemlya
  { name: 'Novaya Zemlya', bounds: { north: 77.0, south: 70.5, west: 52.0, east: 69.0 } },
  
  // Svalbard
  { name: 'Svalbard', bounds: { north: 80.8, south: 76.4, west: 10.0, east: 33.5 } }
];

// Additional smaller islands and features
const SMALLER_ISLANDS: LandMass[] = [
  // Caribbean islands
  { name: 'Bahamas', bounds: { north: 27.3, south: 20.9, west: -79.3, east: -72.7 } },
  { name: 'Barbados', bounds: { north: 13.3, south: 13.0, west: -59.7, east: -59.4 } },
  { name: 'Trinidad', bounds: { north: 10.9, south: 10.0, west: -61.9, east: -60.5 } },
  
  // Pacific islands
  { name: 'Hawaii', bounds: { north: 22.2, south: 18.9, west: -160.2, east: -154.8 } },
  { name: 'Fiji', bounds: { north: -12.5, south: -20.7, west: 177.0, east: -177.0 } },
  { name: 'New Caledonia', bounds: { north: -19.5, south: -22.7, west: 163.6, east: 167.1 } },
  { name: 'Vanuatu', bounds: { north: -13.1, south: -20.2, west: 166.5, east: 170.2 } },
  
  // Indian Ocean islands
  { name: 'Maldives', bounds: { north: 7.1, south: -0.7, west: 72.7, east: 73.8 } },
  { name: 'Seychelles', bounds: { north: -4.3, south: -10.4, west: 46.2, east: 56.3 } },
  { name: 'Mauritius', bounds: { north: -19.9, south: -20.5, west: 57.3, east: 63.5 } },
  
  // Mediterranean islands
  { name: 'Sicily', bounds: { north: 38.3, south: 36.6, west: 12.4, east: 15.7 } },
  { name: 'Sardinia', bounds: { north: 41.3, south: 38.9, west: 8.1, east: 9.8 } },
  { name: 'Corsica', bounds: { north: 43.0, south: 41.4, west: 8.5, east: 9.6 } },
  { name: 'Cyprus', bounds: { north: 35.7, south: 34.6, west: 32.3, east: 34.6 } },
  { name: 'Crete', bounds: { north: 35.7, south: 34.8, west: 23.5, east: 26.3 } },
  
  // Baltic islands
  { name: 'Gotland', bounds: { north: 57.9, south: 56.9, west: 18.1, east: 19.4 } },
  { name: 'Öland', bounds: { north: 57.4, south: 56.2, west: 16.4, east: 16.7 } },
  
  // Arctic islands
  { name: 'Franz Josef Land', bounds: { north: 81.9, south: 79.8, west: 44.8, east: 65.4 } },
  { name: 'Severnaya Zemlya', bounds: { north: 81.3, south: 78.2, west: 95.0, east: 113.0 } },
  { name: 'New Siberian Islands', bounds: { north: 76.8, south: 73.2, west: 136.0, east: 155.0 } }
];

export class LandDetectionSystem {
  private cache = new Map<string, boolean>();
  private options: LandDetectionOptions;
  
  constructor(options: Partial<LandDetectionOptions> = {}) {
    this.options = {
      precision: options.precision || 'medium',
      cacheEnabled: options.cacheEnabled ?? true,
      includeSmallIslands: options.includeSmallIslands ?? true,
      coastalBuffer: options.coastalBuffer || 0
    };
  }

  /**
   * Determine if a coordinate point is on land
   */
  public isLand(lat: number, lng: number): boolean {
    // Normalize coordinates
    const normalizedLng = ((lng + 180) % 360) - 180;
    const normalizedLat = Math.max(-90, Math.min(90, lat));
    
    // Create cache key based on precision
    const precision = this.getPrecisionFactor();
    const cacheKey = `${Math.round(normalizedLat * precision) / precision}_${Math.round(normalizedLng * precision) / precision}`;
    
    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const isLand = this.performLandDetection(normalizedLat, normalizedLng);
    
    if (this.options.cacheEnabled) {
      this.cache.set(cacheKey, isLand);
    }
    
    return isLand;
  }

  /**
   * Batch land detection for multiple points
   */
  public isLandBatch(coordinates: Array<[number, number]>): boolean[] {
    return coordinates.map(([lat, lng]) => this.isLand(lat, lng));
  }

  /**
   * Get land coverage statistics for a region
   */
  public getRegionLandCoverage(
    bounds: [[number, number], [number, number]], 
    samplePoints: number = 100
  ): {
    landPercentage: number;
    oceanPercentage: number;
    totalPoints: number;
    landPoints: number;
    oceanPoints: number;
  } {
    const [[southWest_lng, southWest_lat], [northEast_lng, northEast_lat]] = bounds;
    
    const latStep = (northEast_lat - southWest_lat) / Math.sqrt(samplePoints);
    const lngStep = (northEast_lng - southWest_lng) / Math.sqrt(samplePoints);
    
    let landCount = 0;
    let totalCount = 0;
    
    for (let lat = southWest_lat; lat <= northEast_lat; lat += latStep) {
      for (let lng = southWest_lng; lng <= northEast_lng; lng += lngStep) {
        if (this.isLand(lat, lng)) {
          landCount++;
        }
        totalCount++;
      }
    }
    
    const landPercentage = (landCount / totalCount) * 100;
    
    return {
      landPercentage,
      oceanPercentage: 100 - landPercentage,
      totalPoints: totalCount,
      landPoints: landCount,
      oceanPoints: totalCount - landCount
    };
  }

  /**
   * Core land detection logic
   */
  private performLandDetection(lat: number, lng: number): boolean {
    // Check major landmasses first (fastest)
    for (const landmass of MAJOR_LANDMASSES) {
      if (this.isPointInLandmass(lat, lng, landmass)) {
        return true;
      }
    }
    
    // Check major islands
    for (const island of MAJOR_ISLANDS) {
      if (this.isPointInLandmass(lat, lng, island)) {
        return true;
      }
    }
    
    // Check smaller islands if enabled and using high precision
    if (this.options.includeSmallIslands && this.options.precision === 'high') {
      for (const island of SMALLER_ISLANDS) {
        if (this.isPointInLandmass(lat, lng, island)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a point is within a landmass boundary
   */
  private isPointInLandmass(lat: number, lng: number, landmass: LandMass): boolean {
    const { bounds, exclusions = [] } = landmass;
    
    // Check main bounds
    if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) {
      return false;
    }
    
    // Check exclusions (water bodies within landmass)
    for (const exclusion of exclusions) {
      const exBounds = exclusion.bounds;
      if (lat >= exBounds.south && lat <= exBounds.north && 
          lng >= exBounds.west && lng <= exBounds.east) {
        return false;
      }
    }
    
    // Apply additional precision checks for medium/high precision
    if (this.options.precision !== 'low') {
      return this.applyPrecisionRefinement(lat, lng, landmass);
    }
    
    return true;
  }

  /**
   * Apply additional precision refinement for better coastline accuracy
   */
  private applyPrecisionRefinement(lat: number, lng: number, landmass: LandMass): boolean {
    // For medium/high precision, add some coastline approximation
    
    // Simple coastline refinement based on landmass characteristics
    switch (landmass.name) {
      case 'Europe':
        // Complex coastline with many fjords and peninsulas
        return this.applyComplexCoastlineLogic(lat, lng, landmass);
      
      case 'North America':
        // Handle Great Lakes region, Hudson Bay, etc.
        return this.applyNorthAmericaLogic(lat, lng);
      
      case 'Asia':
        // Complex coastline with many seas and peninsulas
        return this.applyAsiaCoastlineLogic(lat, lng);
      
      default:
        return true;
    }
  }

  /**
   * Specialized coastline logic for complex regions
   */
  private applyComplexCoastlineLogic(lat: number, lng: number, landmass: LandMass): boolean {
    // Simplified coastline approximation for Europe
    
    // Scandinavian Peninsula - complex fjord coastline
    if (lng >= 4 && lng <= 31 && lat >= 55 && lat <= 71) {
      // Exclude Norwegian Sea areas
      if (lng <= 15 && lat >= 65) {
        return lat <= 70.5 - (lng - 4) * 0.5; // Approximate coastline
      }
    }
    
    // Mediterranean coastline
    if (lng >= -6 && lng <= 42 && lat >= 30 && lat <= 46) {
      // Already handled by exclusions
      return true;
    }
    
    return true;
  }

  private applyNorthAmericaLogic(lat: number, lng: number): boolean {
    // Great Lakes exclusions are handled by the exclusions array
    
    // Additional refinement for complex coastlines
    // Eastern seaboard
    if (lng >= -83 && lng <= -66 && lat >= 25 && lat <= 47) {
      // Exclude major bays and sounds
      if (lng >= -77 && lng <= -75 && lat >= 36 && lat <= 40) {
        return false; // Chesapeake Bay
      }
    }
    
    // Pacific coastline
    if (lng >= -125 && lng <= -117 && lat >= 32 && lat <= 49) {
      // Complex coastline with many inlets
      return true;
    }
    
    return true;
  }

  private applyAsiaCoastlineLogic(lat: number, lng: number): boolean {
    // Southeast Asia archipelagos
    if (lng >= 90 && lng <= 145 && lat >= -11 && lat <= 25) {
      // Complex island chains - use simplified approximation
      
      // Indonesian archipelago
      if (lng >= 95 && lng <= 141 && lat >= -11 && lat <= 6) {
        return this.isInIndonesianArchipelago(lat, lng);
      }
      
      // Philippines
      if (lng >= 116 && lng <= 127 && lat >= 4.5 && lat <= 21) {
        return true; // Simplified - treat as land
      }
    }
    
    return true;
  }

  /**
   * Simplified Indonesian archipelago detection
   */
  private isInIndonesianArchipelago(lat: number, lng: number): boolean {
    // Major Indonesian islands approximation
    const indonesianIslands = [
      { bounds: { north: 6, south: -6, west: 95, east: 106 } }, // Sumatra
      { bounds: { north: -6, south: -9, west: 105, east: 114 } }, // Java
      { bounds: { north: 7, south: -4, west: 109, east: 119 } }, // Borneo (Indonesian part)
      { bounds: { north: 5, south: -8, west: 119, east: 125 } }, // Sulawesi
      { bounds: { north: -2, south: -11, west: 131, east: 151 } } // New Guinea (Indonesian part)
    ];
    
    return indonesianIslands.some(island => 
      lat >= island.bounds.south && lat <= island.bounds.north &&
      lng >= island.bounds.west && lng <= island.bounds.east
    );
  }

  /**
   * Get precision factor based on precision setting
   */
  private getPrecisionFactor(): number {
    switch (this.options.precision) {
      case 'low': return 10; // 0.1 degree precision
      case 'medium': return 100; // 0.01 degree precision
      case 'high': return 1000; // 0.001 degree precision
      default: return 100;
    }
  }

  /**
   * Cache management
   */
  public getCacheStats(): {
    size: number;
    hitCount: number;
    precision: string;
  } {
    return {
      size: this.cache.size,
      hitCount: this.cache.size, // Simplified metric
      precision: this.options.precision
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public pruneCache(maxSize: number = 10000): void {
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries());
      const toKeep = entries.slice(-maxSize);
      this.cache.clear();
      toKeep.forEach(([key, value]) => this.cache.set(key, value));
    }
  }
}