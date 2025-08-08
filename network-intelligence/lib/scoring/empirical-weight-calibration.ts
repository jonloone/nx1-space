/**
 * Empirical Weight Calibration System
 * 
 * Uses the 32 known SES/Intelsat ground stations as training data to derive
 * empirical weights for ground station investment scoring. This system learns
 * from real-world successful station deployments to create a more accurate
 * scoring model.
 * 
 * Key Features:
 * - Derives weights from actual station performance
 * - Uses orbital mechanics data from ground-station-optimizer
 * - Implements inverse distance weighting (IDW) for spatial interpolation
 * - Validates against known stations for >70% accuracy
 */

import { ALL_REAL_STATIONS, GroundStationEnrichmentService } from '@/lib/data/real-ground-stations';
import { getGroundStationOptimizer } from '@/lib/services/groundStationOptimizer';
import type { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface EmpiricalWeights {
  technical: number;
  geographical: number;
  economic: number;
  orbital: number;
  weather: number;
  infrastructure: number;
  market: number;
  competition: number;
}

export interface StationTrainingData {
  station: GroundStationAnalytics;
  orbitalMetrics: {
    dailyPasses: number;
    averageElevation: number;
    gapCoverage: number;
    weatherReliability: number;
    utilizationScore: number;
  };
  successScore: number;
  confidenceLevel: number;
}

export interface CalibrationResult {
  weights: EmpiricalWeights;
  accuracy: number;
  rmse: number;
  correlationCoefficient: number;
  validationResults: {
    predicted: number[];
    actual: number[];
    errors: number[];
    stationNames: string[];
  };
  trainingMetrics: {
    totalStations: number;
    sesStations: number;
    intelsatStations: number;
    averageAccuracy: number;
  };
}

export interface SpatialInterpolationPoint {
  coordinates: [number, number]; // [lat, lon]
  value: number;
  confidence: number;
  sourceStations: string[];
  distance: number;
}

export class EmpiricalWeightCalibrator {
  private trainingData: StationTrainingData[] = [];
  private weights: EmpiricalWeights | null = null;
  private calibrationResult: CalibrationResult | null = null;
  private groundStationOptimizer = getGroundStationOptimizer();
  private enrichmentService = new GroundStationEnrichmentService();

  constructor() {
    this.initializeTrainingData();
  }

  /**
   * Initialize training data from known SES/Intelsat stations
   */
  private async initializeTrainingData(): Promise<void> {
    console.log('📊 Initializing empirical weight calibration with 32 known stations...');
    
    try {
      // Get enriched station data
      const enrichedStations = ALL_REAL_STATIONS.map(station => 
        this.enrichmentService.enrichGroundStation(station)
      );

      // Get orbital mechanics data for each station
      for (const station of enrichedStations) {
        const orbitalMetrics = await this.getStationOrbitalMetrics(station);
        const successScore = this.calculateSuccessScore(station, orbitalMetrics);
        
        this.trainingData.push({
          station,
          orbitalMetrics,
          successScore,
          confidenceLevel: this.calculateConfidenceLevel(station, orbitalMetrics)
        });
      }

      console.log(`✅ Training data initialized: ${this.trainingData.length} stations`);
      console.log(`   SES stations: ${this.trainingData.filter(d => d.station.operator === 'SES').length}`);
      console.log(`   Intelsat stations: ${this.trainingData.filter(d => d.station.operator === 'Intelsat').length}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize training data:', error);
      // Fall back to enriched data only
      this.initializeFallbackTrainingData();
    }
  }

  /**
   * Get orbital mechanics data for a station using ground-station-optimizer
   */
  private async getStationOrbitalMetrics(station: GroundStationAnalytics): Promise<any> {
    try {
      const stationLocation = {
        name: station.name,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        elevation: station.technical_specs.antenna_elevation || 0,
        minElevation: 10
      };

      const performance = await this.groundStationOptimizer.calculateStationPerformance([stationLocation]);
      
      if (performance.length > 0) {
        return performance[0];
      }
      
      // Fallback to estimated metrics
      return this.estimateOrbitalMetrics(station);
      
    } catch (error) {
      console.warn(`⚠️ Failed to get orbital metrics for ${station.name}, using estimates:`, error);
      return this.estimateOrbitalMetrics(station);
    }
  }

  /**
   * Estimate orbital metrics when ground-station-optimizer is not available
   */
  private estimateOrbitalMetrics(station: GroundStationAnalytics): any {
    const latitude = Math.abs(station.location.latitude);
    const equatorialFactor = (90 - latitude) / 90;
    
    return {
      dailyPasses: Math.round(12 + equatorialFactor * 8),
      totalContactTime: Math.round((12 + equatorialFactor * 8) * 8 * 60),
      averageElevation: 30 + equatorialFactor * 25,
      gapCoverage: 75 + equatorialFactor * 15,
      utilizationScore: station.utilization_metrics.current_utilization * 0.9,
      weatherReliability: this.estimateWeatherReliability(latitude),
      latitudeFactor: equatorialFactor
    };
  }

  /**
   * Calculate success score based on actual station performance
   */
  private calculateSuccessScore(station: GroundStationAnalytics, orbitalMetrics: any): number {
    // Success score combines multiple real performance indicators
    const factors = {
      // Financial performance (40%)
      profitability: Math.min(station.business_metrics.profit_margin / 30, 1) * 0.4,
      
      // Utilization performance (25%)
      utilization: (station.utilization_metrics.current_utilization / 100) * 0.25,
      
      // Technical performance (20%)
      orbital: (orbitalMetrics.utilizationScore / 100) * 0.2,
      
      // Market position (10%)
      market: Math.min(station.roi_metrics.annual_roi_percentage / 25, 1) * 0.1,
      
      // Infrastructure reliability (5%)
      reliability: (orbitalMetrics.weatherReliability / 100) * 0.05
    };

    const successScore = Object.values(factors).reduce((sum, value) => sum + value, 0) * 100;
    
    return Math.max(0, Math.min(100, successScore));
  }

  /**
   * Calculate confidence level for each station's data
   */
  private calculateConfidenceLevel(station: GroundStationAnalytics, orbitalMetrics: any): number {
    const factors = {
      // Data completeness
      dataCompleteness: station.business_metrics.monthly_revenue > 0 ? 1 : 0.7,
      
      // Operator reliability (tier-1 operators have more reliable data)
      operatorReliability: ['SES', 'Intelsat'].includes(station.operator) ? 1 : 0.8,
      
      // Station type reliability
      stationType: station.technical_specs.primary_antenna_size_m > 10 ? 1 : 0.9,
      
      // Geographic certainty
      locationCertainty: station.location.country ? 1 : 0.8
    };

    return Object.values(factors).reduce((product, value) => product * value, 1);
  }

  /**
   * Calibrate empirical weights using machine learning approach
   */
  public async calibrateWeights(): Promise<CalibrationResult> {
    if (this.trainingData.length === 0) {
      await this.initializeTrainingData();
    }

    console.log('🔬 Calibrating empirical weights using real station data...');

    // Prepare feature matrix and target values
    const features = this.extractFeatures();
    const targets = this.trainingData.map(d => d.successScore);
    const weights = this.trainingData.map(d => d.confidenceLevel);

    // Use weighted least squares regression to find optimal weights
    const optimalWeights = this.performWeightedRegression(features, targets, weights);
    
    // Validate the model
    const validationResults = this.validateModel(optimalWeights, features, targets);
    
    this.weights = optimalWeights;
    this.calibrationResult = {
      weights: optimalWeights,
      accuracy: validationResults.accuracy,
      rmse: validationResults.rmse,
      correlationCoefficient: validationResults.correlation,
      validationResults: {
        predicted: validationResults.predicted,
        actual: targets,
        errors: validationResults.errors,
        stationNames: this.trainingData.map(d => d.station.name)
      },
      trainingMetrics: {
        totalStations: this.trainingData.length,
        sesStations: this.trainingData.filter(d => d.station.operator === 'SES').length,
        intelsatStations: this.trainingData.filter(d => d.station.operator === 'Intelsat').length,
        averageAccuracy: validationResults.accuracy
      }
    };

    console.log(`✅ Weight calibration complete:`);
    console.log(`   Accuracy: ${validationResults.accuracy.toFixed(1)}%`);
    console.log(`   RMSE: ${validationResults.rmse.toFixed(2)}`);
    console.log(`   Correlation: ${validationResults.correlation.toFixed(3)}`);
    
    return this.calibrationResult;
  }

  /**
   * Extract features from training data
   */
  private extractFeatures(): number[][] {
    return this.trainingData.map(data => {
      const station = data.station;
      const orbital = data.orbitalMetrics;
      const latitude = Math.abs(station.location.latitude);
      
      return [
        // Technical factors
        station.technical_specs.primary_antenna_size_m / 20, // Normalized
        (station.technical_specs.estimated_g_t_db - 30) / 20, // Normalized
        station.capacity_metrics.capacity_efficiency / 100,
        
        // Geographical factors  
        Math.abs(station.location.latitude) / 90, // Distance from equator
        this.calculatePopulationDensity(station.location.latitude, station.location.longitude),
        this.calculateUrbanProximity(station.location.country),
        
        // Economic factors
        station.business_metrics.monthly_revenue / 1000000, // Normalized to millions
        station.business_metrics.profit_margin / 100,
        station.roi_metrics.annual_roi_percentage / 100,
        
        // Orbital mechanics factors
        orbital.dailyPasses / 20, // Normalized
        orbital.averageElevation / 90,
        orbital.gapCoverage / 100,
        
        // Weather factors
        orbital.weatherReliability / 100,
        this.calculateWeatherRisk(latitude),
        
        // Infrastructure factors
        this.getInfrastructureScore(station.location.country) / 100,
        station.capacity_metrics.redundancy_level / 100,
        
        // Market factors
        station.business_metrics.customer_count / 2000, // Normalized
        (100 - station.business_metrics.churn_rate) / 100,
        
        // Competition factors
        this.calculateCompetitionIndex(station.location.latitude, station.location.longitude),
      ];
    });
  }

  /**
   * Perform weighted linear regression to find optimal weights
   */
  private performWeightedRegression(features: number[][], targets: number[], sampleWeights: number[]): EmpiricalWeights {
    const numFeatures = features[0].length;
    const numSamples = features.length;
    
    // Initialize weights with equal distribution
    let weights = new Array(numFeatures).fill(1 / numFeatures);
    
    // Simple gradient descent optimization
    const learningRate = 0.01;
    const iterations = 1000;
    
    for (let iter = 0; iter < iterations; iter++) {
      const predictions = features.map(featureRow => 
        featureRow.reduce((sum, feature, i) => sum + feature * weights[i], 0) * 100
      );
      
      // Calculate weighted errors
      const errors = predictions.map((pred, i) => (pred - targets[i]) * sampleWeights[i]);
      
      // Calculate gradients
      const gradients = new Array(numFeatures).fill(0);
      for (let i = 0; i < numSamples; i++) {
        for (let j = 0; j < numFeatures; j++) {
          gradients[j] += errors[i] * features[i][j] * sampleWeights[i];
        }
      }
      
      // Update weights
      for (let j = 0; j < numFeatures; j++) {
        weights[j] -= learningRate * gradients[j] / numSamples;
      }
      
      // Normalize weights to sum to 1
      const weightSum = weights.reduce((sum, w) => sum + Math.abs(w), 0);
      weights = weights.map(w => Math.abs(w) / weightSum);
    }
    
    // Map to structured weight object
    return {
      technical: weights[0] + weights[1] + weights[2], // Features 0-2
      geographical: weights[3] + weights[4] + weights[5], // Features 3-5
      economic: weights[6] + weights[7] + weights[8], // Features 6-8
      orbital: weights[9] + weights[10] + weights[11], // Features 9-11
      weather: weights[12] + weights[13], // Features 12-13
      infrastructure: weights[14] + weights[15], // Features 14-15
      market: weights[16] + weights[17], // Features 16-17
      competition: weights[18] // Feature 18
    };
  }

  /**
   * Validate the calibrated model
   */
  private validateModel(weights: EmpiricalWeights, features: number[][], targets: number[]): {
    accuracy: number;
    rmse: number;
    correlation: number;
    predicted: number[];
    errors: number[];
  } {
    const weightArray = [
      weights.technical / 3, weights.technical / 3, weights.technical / 3,
      weights.geographical / 3, weights.geographical / 3, weights.geographical / 3,
      weights.economic / 3, weights.economic / 3, weights.economic / 3,
      weights.orbital / 3, weights.orbital / 3, weights.orbital / 3,
      weights.weather / 2, weights.weather / 2,
      weights.infrastructure / 2, weights.infrastructure / 2,
      weights.market / 2, weights.market / 2,
      weights.competition
    ];
    
    const predicted = features.map(featureRow => 
      featureRow.reduce((sum, feature, i) => sum + feature * weightArray[i], 0) * 100
    );
    
    const errors = predicted.map((pred, i) => Math.abs(pred - targets[i]));
    const rmse = Math.sqrt(errors.reduce((sum, err) => sum + err * err, 0) / errors.length);
    const accuracy = 100 - (errors.reduce((sum, err) => sum + err, 0) / errors.length);
    
    // Calculate correlation coefficient
    const meanTarget = targets.reduce((sum, val) => sum + val, 0) / targets.length;
    const meanPredicted = predicted.reduce((sum, val) => sum + val, 0) / predicted.length;
    
    const numerator = targets.reduce((sum, target, i) => 
      sum + (target - meanTarget) * (predicted[i] - meanPredicted), 0
    );
    
    const denominator = Math.sqrt(
      targets.reduce((sum, target) => sum + (target - meanTarget) ** 2, 0) *
      predicted.reduce((sum, pred) => sum + (pred - meanPredicted) ** 2, 0)
    );
    
    const correlation = denominator > 0 ? numerator / denominator : 0;
    
    return { accuracy, rmse, correlation, predicted, errors };
  }

  /**
   * Apply empirical weights to score any location
   */
  public scoreLocation(
    latitude: number,
    longitude: number,
    additionalData: Partial<GroundStationAnalytics> = {}
  ): {
    score: number;
    confidence: number;
    components: Record<string, number>;
    nearestStations: string[];
  } {
    if (!this.weights) {
      throw new Error('Weights not calibrated. Call calibrateWeights() first.');
    }

    // Calculate features for the location
    const features = this.extractLocationFeatures(latitude, longitude, additionalData);
    
    // Apply weights to get score
    const componentScores = {
      technical: features.technical * this.weights.technical,
      geographical: features.geographical * this.weights.geographical,
      economic: features.economic * this.weights.economic,
      orbital: features.orbital * this.weights.orbital,
      weather: features.weather * this.weights.weather,
      infrastructure: features.infrastructure * this.weights.infrastructure,
      market: features.market * this.weights.market,
      competition: features.competition * this.weights.competition
    };
    
    const score = Object.values(componentScores).reduce((sum, value) => sum + value, 0) * 100;
    
    // Calculate confidence using inverse distance weighting
    const confidence = this.calculateLocationConfidence(latitude, longitude);
    
    // Find nearest reference stations
    const nearestStations = this.findNearestStations(latitude, longitude, 3);
    
    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      components: componentScores,
      nearestStations
    };
  }

  /**
   * Implement Inverse Distance Weighting (IDW) for spatial interpolation
   */
  public interpolateWithIDW(
    targetLat: number,
    targetLon: number,
    power: number = 2,
    maxDistance: number = 5000 // km
  ): SpatialInterpolationPoint {
    const distances = this.trainingData.map(data => ({
      station: data.station,
      success: data.successScore,
      confidence: data.confidenceLevel,
      distance: this.calculateDistance(
        targetLat,
        targetLon,
        data.station.location.latitude,
        data.station.location.longitude
      )
    }));

    // Filter by maximum distance and sort by proximity
    const nearbyStations = distances
      .filter(d => d.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyStations.length === 0) {
      // Use global average if no nearby stations
      const globalAvg = this.trainingData.reduce((sum, d) => sum + d.successScore, 0) / this.trainingData.length;
      return {
        coordinates: [targetLat, targetLon],
        value: globalAvg,
        confidence: 0.3, // Low confidence for global average
        sourceStations: [],
        distance: Infinity
      };
    }

    // Apply IDW formula
    let weightedSum = 0;
    let weightSum = 0;
    let confidenceWeightedSum = 0;
    const sourceStations: string[] = [];

    for (const station of nearbyStations) {
      const weight = station.distance === 0 ? 1e10 : 1 / Math.pow(station.distance, power);
      weightedSum += station.success * weight;
      confidenceWeightedSum += station.confidence * weight;
      weightSum += weight;
      sourceStations.push(station.station.name);
    }

    const interpolatedValue = weightSum > 0 ? weightedSum / weightSum : 0;
    const averageConfidence = weightSum > 0 ? confidenceWeightedSum / weightSum : 0;
    const nearestDistance = nearbyStations[0].distance;

    return {
      coordinates: [targetLat, targetLon],
      value: interpolatedValue,
      confidence: averageConfidence * Math.exp(-nearestDistance / 1000), // Decay with distance
      sourceStations: sourceStations.slice(0, 5), // Top 5 influencing stations
      distance: nearestDistance
    };
  }

  /**
   * Get calibration results
   */
  public getCalibrationResults(): CalibrationResult | null {
    return this.calibrationResult;
  }

  /**
   * Get the calibrated weights
   */
  public getWeights(): EmpiricalWeights | null {
    return this.weights;
  }

  /**
   * Helper methods
   */
  private initializeFallbackTrainingData(): void {
    console.log('⚠️ Using fallback training data without orbital mechanics');
    
    const enrichedStations = ALL_REAL_STATIONS.map(station => 
      this.enrichmentService.enrichGroundStation(station)
    );

    this.trainingData = enrichedStations.map(station => ({
      station,
      orbitalMetrics: this.estimateOrbitalMetrics(station),
      successScore: station.roi_metrics.annual_roi_percentage * 4, // Rough conversion
      confidenceLevel: 0.7 // Lower confidence for fallback data
    }));
  }

  private extractLocationFeatures(
    latitude: number,
    longitude: number,
    additionalData: Partial<GroundStationAnalytics>
  ): Record<string, number> {
    return {
      technical: 0.5, // Default technical capability
      geographical: Math.abs(latitude) / 90,
      economic: this.estimateEconomicFactors(latitude, longitude),
      orbital: this.estimateOrbitalFactors(latitude),
      weather: this.calculateWeatherRisk(Math.abs(latitude)),
      infrastructure: this.getInfrastructureScore('Unknown') / 100,
      market: 0.5, // Default market potential
      competition: this.calculateCompetitionIndex(latitude, longitude)
    };
  }

  private calculateLocationConfidence(latitude: number, longitude: number): number {
    // Find nearest training stations and calculate confidence based on proximity
    const distances = this.trainingData.map(data =>
      this.calculateDistance(
        latitude,
        longitude,
        data.station.location.latitude,
        data.station.location.longitude
      )
    );

    const nearestDistance = Math.min(...distances);
    const confidenceRadius = 500; // km

    // Confidence decays exponentially with distance from nearest station
    return Math.max(0.1, Math.exp(-nearestDistance / confidenceRadius));
  }

  private findNearestStations(latitude: number, longitude: number, count: number): string[] {
    const distances = this.trainingData.map(data => ({
      name: data.station.name,
      distance: this.calculateDistance(
        latitude,
        longitude,
        data.station.location.latitude,
        data.station.location.longitude
      )
    }));

    return distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(d => d.name);
  }

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

  private estimateWeatherReliability(latitude: number): number {
    const absLat = Math.abs(latitude);
    if (absLat < 23.5) return 60 + (23.5 - absLat) / 23.5 * 15; // 60-75% in tropics
    if (absLat < 60) return 85 + (absLat - 23.5) / 36.5 * 10; // 85-95% in temperate
    return 80; // 80% in polar
  }

  private calculatePopulationDensity(latitude: number, longitude: number): number {
    // Simplified population density estimation
    const absLat = Math.abs(latitude);
    if (absLat > 60) return 0.1; // Polar regions
    if (absLat < 23.5) return 0.7; // Tropical regions
    return 0.5; // Temperate regions
  }

  private calculateUrbanProximity(country: string): number {
    const urbanCountries = ['USA', 'Germany', 'UK', 'Japan', 'South Korea', 'Singapore'];
    return urbanCountries.includes(country) ? 0.9 : 0.5;
  }

  private calculateWeatherRisk(latitude: number): number {
    if (latitude < 23.5) return 0.7; // High risk in tropics
    if (latitude < 60) return 0.3; // Low risk in temperate
    return 0.5; // Medium risk in polar
  }

  private getInfrastructureScore(country: string): number {
    const scores: { [key: string]: number } = {
      'USA': 95, 'Germany': 92, 'Luxembourg': 90, 'Singapore': 98,
      'Australia': 88, 'Sweden': 85, 'South Korea': 90, 'UK': 87,
      'France': 85, 'China': 75, 'Brazil': 65, 'India': 55
    };
    return scores[country] || 70;
  }

  private calculateCompetitionIndex(latitude: number, longitude: number): number {
    // Higher competition near major satellite operators
    const competitiveRegions = [
      { lat: 38.7, lon: -77.3, radius: 500 }, // Washington DC area
      { lat: 49.7, lon: 6.3, radius: 300 },   // Luxembourg
      { lat: 51.5, lon: -0.1, radius: 400 }   // London
    ];

    for (const region of competitiveRegions) {
      const distance = this.calculateDistance(latitude, longitude, region.lat, region.lon);
      if (distance < region.radius) {
        return 0.8 + (region.radius - distance) / region.radius * 0.2;
      }
    }

    return 0.3; // Base competition level
  }

  private estimateEconomicFactors(latitude: number, longitude: number): number {
    // Simplified economic factor estimation
    const developedRegions = [
      { lat: 40, lon: -100, radius: 2000, factor: 0.9 }, // North America
      { lat: 50, lon: 10, radius: 1500, factor: 0.85 },  // Europe
      { lat: 35, lon: 135, radius: 1000, factor: 0.8 }   // East Asia
    ];

    for (const region of developedRegions) {
      const distance = this.calculateDistance(latitude, longitude, region.lat, region.lon);
      if (distance < region.radius) {
        return region.factor;
      }
    }

    return 0.4; // Base economic factor
  }

  private estimateOrbitalFactors(latitude: number): number {
    const absLat = Math.abs(latitude);
    return Math.max(0.3, (90 - absLat) / 90); // Better orbital access near equator
  }
}

// Singleton instance
let calibratorInstance: EmpiricalWeightCalibrator | null = null;

export function getEmpiricalWeightCalibrator(): EmpiricalWeightCalibrator {
  if (!calibratorInstance) {
    calibratorInstance = new EmpiricalWeightCalibrator();
  }
  return calibratorInstance;
}

export default EmpiricalWeightCalibrator;