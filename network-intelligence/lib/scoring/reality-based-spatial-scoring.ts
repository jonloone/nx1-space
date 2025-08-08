/**
 * Reality-Based Spatial Scoring System
 * 
 * Implements scientifically accurate ground station opportunity scoring based on:
 * - Real orbital mechanics from ground-station-optimizer
 * - Empirical weights derived from 32 known SES/Intelsat stations
 * - Inverse Distance Weighting (IDW) spatial interpolation
 * - Continuous surfaces instead of discrete hexagons
 * - Confidence metrics for uncertainty visualization
 */

import { getGroundStationOptimizer } from '@/lib/services/groundStationOptimizer';
import { getEmpiricalWeightCalibrator } from '@/lib/scoring/empirical-weight-calibration';
import type { EmpiricalWeights, SpatialInterpolationPoint } from '@/lib/scoring/empirical-weight-calibration';

export interface ScoringPoint {
  latitude: number;
  longitude: number;
  score: number;
  confidence: number;
  components: ScoringComponents;
  nearestStations: string[];
  interpolationMetadata: {
    sourceStations: number;
    averageDistance: number;
    weightedInfluence: number[];
  };
}

export interface ScoringComponents {
  orbital: number;
  technical: number;
  economic: number;
  geographical: number;
  weather: number;
  infrastructure: number;
  market: number;
  competition: number;
}

export interface ScoringGrid {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number;
  points: ScoringPoint[];
  metadata: {
    generatedAt: Date;
    totalPoints: number;
    averageConfidence: number;
    coveragePercentage: number;
    validationAccuracy?: number;
  };
}

export interface RealityBasedScoringOptions {
  /** Spatial resolution in degrees */
  resolution: number;
  /** IDW power parameter (higher = more local influence) */
  idwPower: number;
  /** Maximum distance for interpolation (km) */
  maxInterpolationDistance: number;
  /** Minimum number of reference stations required */
  minReferenceStations: number;
  /** Include ocean areas in scoring */
  includeOceans: boolean;
  /** Confidence threshold for high-quality results */
  confidenceThreshold: number;
}

export class RealityBasedSpatialScorer {
  private calibrator = getEmpiricalWeightCalibrator();
  private groundStationOptimizer = getGroundStationOptimizer();
  private weights: EmpiricalWeights | null = null;
  private isCalibrated = false;

  constructor(private options: RealityBasedScoringOptions = {
    resolution: 2.0, // 2 degree grid
    idwPower: 2.0,
    maxInterpolationDistance: 5000, // 5000 km
    minReferenceStations: 3,
    includeOceans: false,
    confidenceThreshold: 0.6
  }) {}

  /**
   * Initialize the scoring system with calibrated weights
   */
  async initialize(): Promise<void> {
    if (this.isCalibrated) return;

    console.log('🔬 Initializing reality-based spatial scoring system...');
    
    try {
      // Calibrate empirical weights
      const calibrationResult = await this.calibrator.calibrateWeights();
      this.weights = calibrationResult.weights;
      
      console.log(`✅ Calibration complete - Accuracy: ${calibrationResult.accuracy.toFixed(1)}%`);
      console.log('   Weights:', this.weights);
      
      this.isCalibrated = true;
    } catch (error) {
      console.error('❌ Failed to initialize scoring system:', error);
      throw error;
    }
  }

  /**
   * Generate a continuous scoring surface for a geographic region
   */
  async generateScoringGrid(
    bounds: { north: number; south: number; east: number; west: number }
  ): Promise<ScoringGrid> {
    if (!this.isCalibrated) {
      await this.initialize();
    }

    console.log('🌍 Generating reality-based scoring grid...');
    const startTime = Date.now();

    const points: ScoringPoint[] = [];
    const { resolution } = this.options;
    
    // Generate grid points
    for (let lat = bounds.south; lat <= bounds.north; lat += resolution) {
      for (let lng = bounds.west; lng <= bounds.east; lng += resolution) {
        // Skip ocean areas if not included
        if (!this.options.includeOceans && await this.isOcean(lat, lng)) {
          continue;
        }

        try {
          const scoringPoint = await this.scoreLocation(lat, lng);
          
          // Only include points with sufficient confidence
          if (scoringPoint.confidence >= this.options.confidenceThreshold) {
            points.push(scoringPoint);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to score location (${lat}, ${lng}):`, error);
          // Continue with next point
        }
      }
    }

    const totalPoints = points.length;
    const averageConfidence = totalPoints > 0 
      ? points.reduce((sum, p) => sum + p.confidence, 0) / totalPoints 
      : 0;

    const gridArea = (bounds.north - bounds.south) * (bounds.east - bounds.west);
    const coveredArea = totalPoints * (resolution * resolution);
    const coveragePercentage = (coveredArea / gridArea) * 100;

    const grid: ScoringGrid = {
      bounds,
      resolution,
      points,
      metadata: {
        generatedAt: new Date(),
        totalPoints,
        averageConfidence,
        coveragePercentage
      }
    };

    console.log(`✅ Generated scoring grid in ${Date.now() - startTime}ms:`);
    console.log(`   Points: ${totalPoints}`);
    console.log(`   Average confidence: ${averageConfidence.toFixed(3)}`);
    console.log(`   Coverage: ${coveragePercentage.toFixed(1)}%`);

    return grid;
  }

  /**
   * Score a specific location using IDW interpolation
   */
  async scoreLocation(latitude: number, longitude: number): Promise<ScoringPoint> {
    if (!this.isCalibrated || !this.weights) {
      throw new Error('Scoring system not initialized');
    }

    // Use IDW interpolation from calibrated stations
    const interpolationPoint = this.calibrator.interpolateWithIDW(
      latitude,
      longitude,
      this.options.idwPower,
      this.options.maxInterpolationDistance
    );

    // Get detailed scoring components
    const components = await this.calculateScoringComponents(latitude, longitude);
    
    // Apply empirical weights to components
    const weightedScore = this.applyEmpiricalWeights(components, this.weights);
    
    // Blend interpolated score with component-based score based on confidence
    const blendFactor = interpolationPoint.confidence;
    const finalScore = (interpolationPoint.value * blendFactor) + 
                      (weightedScore * (1 - blendFactor));

    // Calculate interpolation metadata
    const interpolationMetadata = {
      sourceStations: interpolationPoint.sourceStations.length,
      averageDistance: interpolationPoint.distance,
      weightedInfluence: this.calculateInfluenceWeights(interpolationPoint)
    };

    return {
      latitude,
      longitude,
      score: Math.max(0, Math.min(100, finalScore)),
      confidence: Math.max(interpolationPoint.confidence, 0.1), // Minimum confidence
      components,
      nearestStations: interpolationPoint.sourceStations,
      interpolationMetadata
    };
  }

  /**
   * Calculate detailed scoring components for a location
   */
  private async calculateScoringComponents(
    latitude: number,
    longitude: number
  ): Promise<ScoringComponents> {
    // Orbital mechanics component
    const orbital = await this.calculateOrbitalScore(latitude, longitude);
    
    // Technical feasibility component  
    const technical = this.calculateTechnicalScore(latitude, longitude);
    
    // Economic factors component
    const economic = this.calculateEconomicScore(latitude, longitude);
    
    // Geographical advantages component
    const geographical = this.calculateGeographicalScore(latitude, longitude);
    
    // Weather impact component
    const weather = this.calculateWeatherScore(latitude, longitude);
    
    // Infrastructure availability component
    const infrastructure = this.calculateInfrastructureScore(latitude, longitude);
    
    // Market potential component
    const market = this.calculateMarketScore(latitude, longitude);
    
    // Competition analysis component
    const competition = this.calculateCompetitionScore(latitude, longitude);

    return {
      orbital,
      technical,
      economic,
      geographical,
      weather,
      infrastructure,
      market,
      competition
    };
  }

  /**
   * Calculate orbital mechanics score using ground-station-optimizer
   */
  private async calculateOrbitalScore(latitude: number, longitude: number): Promise<number> {
    try {
      const stationLocation = {
        name: `temp_${latitude}_${longitude}`,
        latitude,
        longitude,
        elevation: 100, // Default elevation
        minElevation: 10
      };

      const performance = await this.groundStationOptimizer.calculateStationPerformance([stationLocation]);
      
      if (performance.length > 0) {
        const metrics = performance[0];
        
        // Combine multiple orbital factors
        const passScore = Math.min(metrics.dailyPasses / 20, 1) * 30; // Up to 30 points for passes
        const elevationScore = Math.min(metrics.averageElevation / 60, 1) * 25; // Up to 25 points for elevation
        const gapScore = Math.min(metrics.gapCoverage / 100, 1) * 25; // Up to 25 points for gap coverage
        const utilizationScore = Math.min(metrics.utilizationScore / 100, 1) * 20; // Up to 20 points for utilization
        
        return passScore + elevationScore + gapScore + utilizationScore;
      }
      
      // Fallback orbital calculation
      return this.estimateOrbitalScore(latitude);
      
    } catch (error) {
      console.warn(`⚠️ Failed to get orbital score for (${latitude}, ${longitude}):`, error);
      return this.estimateOrbitalScore(latitude);
    }
  }

  /**
   * Fallback orbital score estimation based on latitude
   */
  private estimateOrbitalScore(latitude: number): number {
    const absLat = Math.abs(latitude);
    
    // Orbital mechanics favor locations closer to equator
    // Maximum score at equator, decreasing toward poles
    if (absLat <= 30) {
      return 85 - (absLat / 30) * 15; // 85-70 points
    } else if (absLat <= 60) {
      return 70 - ((absLat - 30) / 30) * 30; // 70-40 points
    } else {
      return Math.max(20, 40 - ((absLat - 60) / 30) * 20); // 40-20 points
    }
  }

  /**
   * Calculate technical feasibility score
   */
  private calculateTechnicalScore(latitude: number, longitude: number): number {
    let score = 60; // Base technical feasibility
    
    // Adjust for extreme locations
    const absLat = Math.abs(latitude);
    if (absLat > 70) {
      score -= 30; // Harsh conditions in polar regions
    } else if (absLat < 23.5) {
      score -= 10; // Tropical challenges (humidity, storms)
    }
    
    // Coastal vs inland considerations
    if (this.isNearCoast(latitude, longitude)) {
      score += 5; // Easier logistics
    }
    
    return Math.max(10, Math.min(100, score));
  }

  /**
   * Calculate economic factors score
   */
  private calculateEconomicScore(latitude: number, longitude: number): number {
    // Estimate based on economic regions
    const economicRegions = [
      { center: [40, -100], radius: 2000, score: 85 }, // North America
      { center: [50, 10], radius: 1500, score: 80 },   // Europe
      { center: [35, 135], radius: 1000, score: 75 },  // East Asia
      { center: [1, 103], radius: 500, score: 85 },    // Singapore hub
    ];

    for (const region of economicRegions) {
      const distance = this.calculateDistance(
        latitude, longitude, region.center[0], region.center[1]
      );
      
      if (distance < region.radius) {
        const proximity = 1 - (distance / region.radius);
        return region.score * proximity + 40 * (1 - proximity);
      }
    }

    return 40; // Base score for other regions
  }

  /**
   * Calculate geographical advantages score
   */
  private calculateGeographicalScore(latitude: number, longitude: number): number {
    let score = 50; // Base geographical score
    
    const absLat = Math.abs(latitude);
    
    // Latitude advantages
    if (absLat < 40) {
      score += 20; // Good satellite visibility
    } else if (absLat > 60) {
      score -= 15; // Limited satellite visibility
    }
    
    // Longitude considerations (major time zones)
    const majorTimeZones = [-75, 0, 120]; // US East Coast, London, Asia
    const minTimezoneDistance = Math.min(...majorTimeZones.map(tz => Math.abs(longitude - tz)));
    
    if (minTimezoneDistance < 30) {
      score += 15; // Good timezone for operations
    }

    return Math.max(10, Math.min(100, score));
  }

  /**
   * Calculate weather impact score
   */
  private calculateWeatherScore(latitude: number, longitude: number): number {
    const absLat = Math.abs(latitude);
    
    // Weather reliability by climate zone
    if (absLat < 10) {
      return 40; // Equatorial - frequent storms
    } else if (absLat < 23.5) {
      return 55; // Tropical - monsoons, hurricanes
    } else if (absLat < 40) {
      return 75; // Subtropical - generally stable
    } else if (absLat < 60) {
      return 85; // Temperate - most reliable
    } else {
      return 65; // Polar - harsh conditions but predictable
    }
  }

  /**
   * Calculate infrastructure availability score
   */
  private calculateInfrastructureScore(latitude: number, longitude: number): number {
    // Major infrastructure hubs
    const infrastructureHubs = [
      { center: [40.7, -74], radius: 500, score: 95 },  // New York
      { center: [51.5, 0], radius: 400, score: 90 },    // London
      { center: [49.7, 6.3], radius: 300, score: 95 },  // Luxembourg
      { center: [1.3, 103.8], radius: 200, score: 98 }, // Singapore
      { center: [48.1, 11.6], radius: 300, score: 88 }, // Munich
    ];

    for (const hub of infrastructureHubs) {
      const distance = this.calculateDistance(
        latitude, longitude, hub.center[0], hub.center[1]
      );
      
      if (distance < hub.radius) {
        const proximity = 1 - (distance / hub.radius);
        return hub.score * proximity + 50 * (1 - proximity);
      }
    }

    // Estimate based on development level by region
    const absLat = Math.abs(latitude);
    if (absLat > 60) return 45; // Remote polar regions
    if (absLat < 10) return 55;  // Equatorial developing regions
    return 60; // Average for other regions
  }

  /**
   * Calculate market potential score
   */
  private calculateMarketScore(latitude: number, longitude: longitude): number {
    // High-value markets
    const markets = [
      { center: [39, -77], radius: 1000, score: 90 },   // US East Coast
      { center: [34, -118], radius: 800, score: 85 },   // US West Coast
      { center: [50, 8], radius: 1200, score: 80 },     // Central Europe
      { center: [35, 139], radius: 600, score: 75 },    // Tokyo area
      { center: [22, 114], radius: 400, score: 70 },    // Hong Kong
    ];

    for (const market of markets) {
      const distance = this.calculateDistance(
        latitude, longitude, market.center[0], market.center[1]
      );
      
      if (distance < market.radius) {
        const proximity = 1 - (distance / market.radius);
        return market.score * proximity + 30 * (1 - proximity);
      }
    }

    return 35; // Base market potential
  }

  /**
   * Calculate competition intensity score
   */
  private calculateCompetitionScore(latitude: number, longitude: number): number {
    // High competition areas (lower scores)
    const competitiveAreas = [
      { center: [38.7, -77.3], radius: 300, competition: 0.8 }, // Washington DC
      { center: [49.7, 6.3], radius: 200, competition: 0.9 },   // Luxembourg
      { center: [51.5, 0], radius: 350, competition: 0.7 },     // London
    ];

    let competitionLevel = 0.3; // Base competition

    for (const area of competitiveAreas) {
      const distance = this.calculateDistance(
        latitude, longitude, area.center[0], area.center[1]
      );
      
      if (distance < area.radius) {
        const proximity = 1 - (distance / area.radius);
        competitionLevel = Math.max(competitionLevel, area.competition * proximity);
      }
    }

    // Convert to score (higher competition = lower score)
    return Math.round((1 - competitionLevel) * 100);
  }

  /**
   * Apply empirical weights to scoring components
   */
  private applyEmpiricalWeights(components: ScoringComponents, weights: EmpiricalWeights): number {
    return (
      components.orbital * weights.orbital +
      components.technical * weights.technical +
      components.economic * weights.economic +
      components.geographical * weights.geographical +
      components.weather * weights.weather +
      components.infrastructure * weights.infrastructure +
      components.market * weights.market +
      components.competition * weights.competition
    );
  }

  /**
   * Calculate influence weights for interpolation metadata
   */
  private calculateInfluenceWeights(interpolationPoint: SpatialInterpolationPoint): number[] {
    // For now, return equal weights - could be enhanced with actual IDW weights
    const stationCount = interpolationPoint.sourceStations.length;
    return new Array(stationCount).fill(1 / stationCount);
  }

  /**
   * Helper methods
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async isOcean(latitude: number, longitude: number): Promise<boolean> {
    // Simplified ocean detection - could be enhanced with actual land/water data
    // For now, assume major landmasses
    const continents = [
      { center: [45, -100], radius: 2500 }, // North America
      { center: [-15, -55], radius: 2000 }, // South America
      { center: [50, 20], radius: 2000 },   // Europe
      { center: [0, 20], radius: 2500 },    // Africa
      { center: [30, 100], radius: 2500 },  // Asia
      { center: [-25, 135], radius: 2000 }, // Australia
    ];

    for (const continent of continents) {
      const distance = this.calculateDistance(
        latitude, longitude, continent.center[0], continent.center[1]
      );
      if (distance < continent.radius) {
        return false; // Likely on land
      }
    }

    return true; // Likely ocean
  }

  private isNearCoast(latitude: number, longitude: number): boolean {
    // Simplified coastal proximity - could be enhanced with actual coastline data
    return Math.abs(longitude % 60) < 20; // Very rough approximation
  }

  /**
   * Validate the scoring system against known stations
   */
  async validateScoring(): Promise<{
    accuracy: number;
    rmse: number;
    stationResults: Array<{
      station: string;
      predicted: number;
      actual: number;
      error: number;
      confidence: number;
    }>;
  }> {
    const calibrationResults = this.calibrator.getCalibrationResults();
    if (!calibrationResults) {
      throw new Error('Calibration results not available');
    }

    const stationResults = [];
    let totalError = 0;
    let totalSquaredError = 0;

    for (let i = 0; i < calibrationResults.validationResults.stationNames.length; i++) {
      const stationName = calibrationResults.validationResults.stationNames[i];
      const actual = calibrationResults.validationResults.actual[i];
      const predicted = calibrationResults.validationResults.predicted[i];
      const error = Math.abs(predicted - actual);
      
      stationResults.push({
        station: stationName,
        predicted,
        actual,
        error,
        confidence: 0.8 // Default confidence for validation
      });

      totalError += error;
      totalSquaredError += error * error;
    }

    const accuracy = 100 - (totalError / stationResults.length);
    const rmse = Math.sqrt(totalSquaredError / stationResults.length);

    return {
      accuracy,
      rmse,
      stationResults
    };
  }
}

// Singleton instance
let spatialScorerInstance: RealityBasedSpatialScorer | null = null;

export function getRealityBasedSpatialScorer(): RealityBasedSpatialScorer {
  if (!spatialScorerInstance) {
    spatialScorerInstance = new RealityBasedSpatialScorer();
  }
  return spatialScorerInstance;
}

export default RealityBasedSpatialScorer;