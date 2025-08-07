/**
 * Integration Examples for Land/Water Detection in Ground Station Analysis
 * 
 * This file demonstrates how to integrate land/water detection into your
 * existing ground station opportunity analysis code.
 */

import { 
  isLandSimple,
  isLandPolygon,
  isLandGrid,
  HybridLandDetector,
  generateOpportunityGridWithLandDetection,
  findNearestLand,
  getLandCoverageStats
} from './land-water-detection';

// ============================================================================
// EXAMPLE 1: Drop-in Replacement for generateOpportunityGrid
// ============================================================================

/**
 * This is a direct replacement for your existing generateOpportunityGrid function
 * that adds land/water filtering.
 */
export function generateOpportunityGridEnhanced(existingStations: any[]) {
  const gridData = [];
  const gridSize = 1; // 1 degree grid
  
  for (let lat = -60; lat <= 70; lat += gridSize) {
    for (let lon = -180; lon <= 180; lon += gridSize) {
      // Skip extreme latitudes
      if ((lat < -60) || (lat > 70)) continue;
      
      // *** NEW: Check if location is on land ***
      // Using simple method for speed (you can change this)
      if (!isLandSimple(lat, lon)) {
        continue; // Skip water locations
      }
      
      // Calculate opportunity score based on various factors
      const nearestStation = existingStations.reduce((min, station) => {
        const dist = Math.sqrt(
          Math.pow(station.coordinates[0] - lat, 2) + 
          Math.pow(station.coordinates[1] - lon, 2)
        );
        return dist < min.dist ? { dist, station } : min;
      }, { dist: Infinity, station: null as any });
      
      // Score based on distance from existing stations
      const distanceScore = Math.min(nearestStation.dist / 10, 1) * 50;
      
      // Random factors for demo (would be real data)
      const gdpScore = Math.random() * 30;
      const populationScore = Math.random() * 20;
      
      const totalScore = distanceScore + gdpScore + populationScore;
      
      if (totalScore > 30) { // Only show promising locations
        gridData.push({
          position: [lon, lat],
          weight: totalScore,
          distanceToNearest: nearestStation.dist,
          isLand: true, // We know it's land because we filtered
          factors: {
            distance: distanceScore,
            gdp: gdpScore,
            population: populationScore
          }
        });
      }
    }
  }
  
  return gridData;
}

// ============================================================================
// EXAMPLE 2: Using Different Detection Methods Based on Zoom Level
// ============================================================================

/**
 * Adaptive land detection that uses different methods based on the 
 * map zoom level for optimal performance.
 */
export function generateAdaptiveOpportunityGrid(
  existingStations: any[],
  mapZoomLevel: number
) {
  const gridData = [];
  
  // Choose grid size based on zoom
  const gridSize = mapZoomLevel < 5 ? 2 : mapZoomLevel < 8 ? 1 : 0.5;
  
  // Choose detection method based on zoom (performance vs accuracy tradeoff)
  const detectLand = (lat: number, lon: number): boolean => {
    if (mapZoomLevel < 4) {
      // Zoomed out: use fastest method
      return isLandSimple(lat, lon);
    } else if (mapZoomLevel < 7) {
      // Medium zoom: use grid lookup
      return isLandGrid(lat, lon);
    } else {
      // Zoomed in: use most accurate method
      return isLandPolygon(lat, lon);
    }
  };
  
  for (let lat = -60; lat <= 70; lat += gridSize) {
    for (let lon = -180; lon <= 180; lon += gridSize) {
      if ((lat < -60) || (lat > 70)) continue;
      
      // Check land based on zoom level
      if (!detectLand(lat, lon)) continue;
      
      // ... rest of your scoring logic ...
      const nearestStation = existingStations.reduce((min, station) => {
        const dist = Math.sqrt(
          Math.pow(station.coordinates[0] - lat, 2) + 
          Math.pow(station.coordinates[1] - lon, 2)
        );
        return dist < min.dist ? { dist, station } : min;
      }, { dist: Infinity, station: null as any });
      
      const distanceScore = Math.min(nearestStation.dist / 10, 1) * 50;
      const gdpScore = Math.random() * 30;
      const populationScore = Math.random() * 20;
      const totalScore = distanceScore + gdpScore + populationScore;
      
      if (totalScore > 30) {
        gridData.push({
          position: [lon, lat],
          weight: totalScore,
          distanceToNearest: nearestStation.dist,
          factors: {
            distance: distanceScore,
            gdp: gdpScore,
            population: populationScore
          }
        });
      }
    }
  }
  
  return gridData;
}

// ============================================================================
// EXAMPLE 3: Coastal Preference Analysis
// ============================================================================

/**
 * Generate grid with preference for coastal areas (near water but on land).
 * Useful for ground stations that benefit from ocean proximity.
 */
export function generateCoastalOpportunityGrid(existingStations: any[]) {
  const gridData = [];
  const gridSize = 1;
  
  for (let lat = -60; lat <= 70; lat += gridSize) {
    for (let lon = -180; lon <= 180; lon += gridSize) {
      if ((lat < -60) || (lat > 70)) continue;
      
      // Must be on land
      if (!isLandPolygon(lat, lon)) continue;
      
      // Check proximity to water (coastal bonus)
      let coastalBonus = 0;
      const checkRadius = 2; // degrees
      let waterNearby = false;
      
      for (let dlat = -checkRadius; dlat <= checkRadius; dlat += 1) {
        for (let dlon = -checkRadius; dlon <= checkRadius; dlon += 1) {
          if (!isLandPolygon(lat + dlat, lon + dlon)) {
            waterNearby = true;
            break;
          }
        }
        if (waterNearby) break;
      }
      
      if (waterNearby) {
        coastalBonus = 15; // Bonus points for coastal locations
      }
      
      // Calculate base scores
      const nearestStation = existingStations.reduce((min, station) => {
        const dist = Math.sqrt(
          Math.pow(station.coordinates[0] - lat, 2) + 
          Math.pow(station.coordinates[1] - lon, 2)
        );
        return dist < min.dist ? { dist, station } : min;
      }, { dist: Infinity, station: null as any });
      
      const distanceScore = Math.min(nearestStation.dist / 10, 1) * 50;
      const gdpScore = Math.random() * 30;
      const populationScore = Math.random() * 20;
      
      // Add coastal bonus to total score
      const totalScore = distanceScore + gdpScore + populationScore + coastalBonus;
      
      if (totalScore > 30) {
        gridData.push({
          position: [lon, lat],
          weight: totalScore,
          distanceToNearest: nearestStation.dist,
          isCoastal: waterNearby,
          factors: {
            distance: distanceScore,
            gdp: gdpScore,
            population: populationScore,
            coastal: coastalBonus
          }
        });
      }
    }
  }
  
  return gridData;
}

// ============================================================================
// EXAMPLE 4: Island Detection and Special Handling
// ============================================================================

/**
 * Generate grid with special handling for islands.
 * Islands might have different scoring criteria due to isolation.
 */
export function generateIslandAwareGrid(existingStations: any[]) {
  const gridData = [];
  const gridSize = 1;
  const detector = new HybridLandDetector();
  
  for (let lat = -60; lat <= 70; lat += gridSize) {
    for (let lon = -180; lon <= 180; lon += gridSize) {
      if ((lat < -60) || (lat > 70)) continue;
      
      // Must be on land
      if (!detector.isLand(lat, lon)) continue;
      
      // Check if this is an island (simplified: small land area)
      let landCells = 0;
      const checkRadius = 3;
      
      for (let dlat = -checkRadius; dlat <= checkRadius; dlat += 1) {
        for (let dlon = -checkRadius; dlon <= checkRadius; dlon += 1) {
          if (detector.isLand(lat + dlat, lon + dlon)) {
            landCells++;
          }
        }
      }
      
      const totalCells = (checkRadius * 2 + 1) * (checkRadius * 2 + 1);
      const landPercentage = (landCells / totalCells) * 100;
      const isIsland = landPercentage < 30; // Less than 30% land = likely an island
      
      // Calculate scores with island adjustment
      const nearestStation = existingStations.reduce((min, station) => {
        const dist = Math.sqrt(
          Math.pow(station.coordinates[0] - lat, 2) + 
          Math.pow(station.coordinates[1] - lon, 2)
        );
        return dist < min.dist ? { dist, station } : min;
      }, { dist: Infinity, station: null as any });
      
      let distanceScore = Math.min(nearestStation.dist / 10, 1) * 50;
      
      // Islands get bonus points if far from existing stations
      if (isIsland && nearestStation.dist > 20) {
        distanceScore *= 1.5; // 50% bonus for isolated islands
      }
      
      const gdpScore = Math.random() * 30;
      const populationScore = Math.random() * 20;
      
      // Islands might have strategic value
      const strategicBonus = isIsland ? 10 : 0;
      
      const totalScore = distanceScore + gdpScore + populationScore + strategicBonus;
      
      if (totalScore > 30) {
        gridData.push({
          position: [lon, lat],
          weight: totalScore,
          distanceToNearest: nearestStation.dist,
          isIsland,
          landPercentage,
          factors: {
            distance: distanceScore,
            gdp: gdpScore,
            population: populationScore,
            strategic: strategicBonus
          }
        });
      }
    }
  }
  
  return gridData;
}

// ============================================================================
// EXAMPLE 5: Performance-Optimized with Caching
// ============================================================================

/**
 * Optimized grid generation with caching for repeated calculations.
 */
export class OptimizedGridGenerator {
  private detector: HybridLandDetector;
  private stationDistanceCache: Map<string, number>;
  
  constructor() {
    this.detector = new HybridLandDetector({ 
      enableHighAccuracy: false,
      cacheSize: 10000 
    });
    this.stationDistanceCache = new Map();
  }
  
  generateGrid(existingStations: any[], options: {
    gridSize?: number;
    minScore?: number;
    maxLat?: number;
    minLat?: number;
  } = {}) {
    const {
      gridSize = 1,
      minScore = 30,
      maxLat = 70,
      minLat = -60
    } = options;
    
    const gridData = [];
    
    // Pre-calculate station positions for faster distance calculations
    const stationCoords = existingStations.map(s => ({
      lat: s.coordinates[0],
      lon: s.coordinates[1]
    }));
    
    for (let lat = minLat; lat <= maxLat; lat += gridSize) {
      for (let lon = -180; lon <= 180; lon += gridSize) {
        // Quick bounds check
        if (lat < minLat || lat > maxLat) continue;
        
        // Land check with caching
        if (!this.detector.isLand(lat, lon)) continue;
        
        // Get nearest station distance (with caching)
        const cacheKey = `${lat},${lon}`;
        let nearestDist = this.stationDistanceCache.get(cacheKey);
        
        if (nearestDist === undefined) {
          nearestDist = Math.min(...stationCoords.map(s => 
            Math.sqrt(Math.pow(s.lat - lat, 2) + Math.pow(s.lon - lon, 2))
          ));
          this.stationDistanceCache.set(cacheKey, nearestDist);
        }
        
        // Calculate scores
        const distanceScore = Math.min(nearestDist / 10, 1) * 50;
        const gdpScore = Math.random() * 30;
        const populationScore = Math.random() * 20;
        const totalScore = distanceScore + gdpScore + populationScore;
        
        if (totalScore > minScore) {
          gridData.push({
            position: [lon, lat],
            weight: totalScore,
            distanceToNearest: nearestDist,
            factors: {
              distance: distanceScore,
              gdp: gdpScore,
              population: populationScore
            }
          });
        }
      }
    }
    
    return gridData;
  }
  
  clearCache() {
    this.detector.clearCache();
    this.stationDistanceCache.clear();
  }
}

// ============================================================================
// EXAMPLE 6: React Hook for Land Detection
// ============================================================================

/**
 * React hook for using land detection in components.
 * Place this in a separate file like hooks/useLandDetection.ts
 */
export function useLandDetection(method: 'simple' | 'polygon' | 'grid' | 'hybrid' = 'hybrid') {
  const detector = new HybridLandDetector();
  
  const checkLand = (lat: number, lon: number): boolean => {
    switch (method) {
      case 'simple':
        return isLandSimple(lat, lon);
      case 'polygon':
        return isLandPolygon(lat, lon);
      case 'grid':
        return isLandGrid(lat, lon);
      case 'hybrid':
      default:
        return detector.isLand(lat, lon);
    }
  };
  
  const findNearestLandPoint = (lat: number, lon: number) => {
    return findNearestLand(lat, lon);
  };
  
  const getRegionStats = (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    return getLandCoverageStats(
      bounds.south,
      bounds.north,
      bounds.west,
      bounds.east
    );
  };
  
  return {
    checkLand,
    findNearestLandPoint,
    getRegionStats
  };
}

// ============================================================================
// EXAMPLE 7: Validation and Testing Utilities
// ============================================================================

/**
 * Test the accuracy of different detection methods.
 */
export function testDetectionAccuracy() {
  // Known land points
  const landPoints = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333 }
  ];
  
  // Known water points
  const waterPoints = [
    { name: 'Pacific Ocean', lat: 0, lon: -160 },
    { name: 'Atlantic Ocean', lat: 0, lon: -30 },
    { name: 'Indian Ocean', lat: -20, lon: 80 },
    { name: 'Arctic Ocean', lat: 85, lon: 0 }
  ];
  
  const methods = ['simple', 'polygon', 'grid'] as const;
  const results: any = {};
  
  for (const method of methods) {
    let correctLand = 0;
    let correctWater = 0;
    
    for (const point of landPoints) {
      let isLand = false;
      switch (method) {
        case 'simple':
          isLand = isLandSimple(point.lat, point.lon);
          break;
        case 'polygon':
          isLand = isLandPolygon(point.lat, point.lon);
          break;
        case 'grid':
          isLand = isLandGrid(point.lat, point.lon);
          break;
      }
      if (isLand) correctLand++;
    }
    
    for (const point of waterPoints) {
      let isLand = false;
      switch (method) {
        case 'simple':
          isLand = isLandSimple(point.lat, point.lon);
          break;
        case 'polygon':
          isLand = isLandPolygon(point.lat, point.lon);
          break;
        case 'grid':
          isLand = isLandGrid(point.lat, point.lon);
          break;
      }
      if (!isLand) correctWater++;
    }
    
    results[method] = {
      landAccuracy: (correctLand / landPoints.length) * 100,
      waterAccuracy: (correctWater / waterPoints.length) * 100,
      overall: ((correctLand + correctWater) / (landPoints.length + waterPoints.length)) * 100
    };
  }
  
  return results;
}

// ============================================================================
// Export all examples
// ============================================================================

export default {
  generateOpportunityGridEnhanced,
  generateAdaptiveOpportunityGrid,
  generateCoastalOpportunityGrid,
  generateIslandAwareGrid,
  OptimizedGridGenerator,
  useLandDetection,
  testDetectionAccuracy
};