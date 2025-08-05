/**
 * Machine Learning Feature Engineering for Terrain Analysis
 * Extracts and engineers features from terrain data for predictive modeling
 */

import {
  TerrainPoint,
  TerrainMetrics,
  ViewshedAnalysis,
  SiteTerrainAssessment,
  TerrainMLFeatures,
  TerrainPredictionResult,
  H3TerrainCell
} from './types';
import { GroundStationAnalytics } from '../types/ground-station';

export class TerrainFeatureEngineering {
  private historicalSites: Map<string, SiteTerrainAssessment> = new Map();
  private performanceData: Map<string, any> = new Map();
  
  /**
   * Extract comprehensive ML features from terrain data
   */
  extractFeatures(
    location: TerrainPoint,
    terrainMetrics: TerrainMetrics,
    viewshed: ViewshedAnalysis,
    nearbyInfrastructure: Array<{location: TerrainPoint, type: string}>,
    populationCenters: Array<{location: TerrainPoint, population: number}>
  ): TerrainMLFeatures {
    // Basic terrain statistics
    const elevationStats = this.calculateElevationStatistics(terrainMetrics);
    
    // Terrain complexity score (0-1)
    const terrainComplexity = this.calculateTerrainComplexity(terrainMetrics);
    
    // Viewshed quality score (0-1)
    const viewshedQuality = this.calculateViewshedQuality(viewshed);
    
    // Accessibility index (0-1)
    const accessibilityIndex = this.calculateAccessibilityIndex(
      location,
      terrainMetrics,
      nearbyInfrastructure
    );
    
    // Construction cost index (normalized)
    const constructionCostIndex = this.estimateConstructionCostIndex(
      terrainMetrics,
      accessibilityIndex
    );
    
    // Distance features
    const distanceToInfrastructure = this.calculateMinDistance(
      location,
      nearbyInfrastructure.map(i => i.location)
    );
    
    const distanceToPopulation = this.calculateWeightedPopulationDistance(
      location,
      populationCenters
    );
    
    // Regional similarity
    const regionalSimilarity = this.calculateRegionalTerrainSimilarity(
      location,
      terrainMetrics
    );
    
    // Seasonal accessibility (monthly scores)
    const seasonalAccessibility = this.estimateSeasonalAccessibility(
      location,
      terrainMetrics
    );
    
    // Weather impact
    const weatherImpact = this.calculateWeatherImpactScore(location, terrainMetrics);
    
    // Graph-based features
    const graphFeatures = this.calculateGraphFeatures(location);
    
    return {
      elevation_stats: elevationStats,
      terrain_complexity: terrainComplexity,
      viewshed_quality: viewshedQuality,
      accessibility_index: accessibilityIndex,
      construction_cost_index: constructionCostIndex,
      distance_to_infrastructure: distanceToInfrastructure,
      distance_to_population_center: distanceToPopulation,
      regional_terrain_similarity: regionalSimilarity,
      seasonal_accessibility: seasonalAccessibility,
      weather_impact_score: weatherImpact,
      connectivity_score: graphFeatures.connectivity,
      centrality_measure: graphFeatures.centrality,
      redundancy_potential: graphFeatures.redundancy
    };
  }

  /**
   * Statistical features from elevation data
   */
  private calculateElevationStatistics(metrics: TerrainMetrics) {
    const mean = metrics.mean_elevation;
    const variance = metrics.elevation_variance;
    const std = Math.sqrt(variance);
    
    // Calculate skewness (simplified)
    const skewness = this.estimateSkewness(metrics);
    
    // Calculate kurtosis (simplified)
    const kurtosis = this.estimateKurtosis(metrics);
    
    return {
      mean,
      std,
      skewness,
      kurtosis
    };
  }

  private estimateSkewness(metrics: TerrainMetrics): number {
    // Simplified skewness estimation using percentiles
    const median = metrics.elevation_percentiles.p50;
    const mean = metrics.mean_elevation;
    const std = Math.sqrt(metrics.elevation_variance);
    
    if (std === 0) return 0;
    
    // Pearson's second skewness coefficient
    return 3 * (mean - median) / std;
  }

  private estimateKurtosis(metrics: TerrainMetrics): number {
    // Simplified kurtosis using percentile-based method
    const q1 = metrics.elevation_percentiles.p25;
    const q3 = metrics.elevation_percentiles.p75;
    const p10 = metrics.elevation_percentiles.p10;
    const p90 = metrics.elevation_percentiles.p90;
    
    const iqr = q3 - q1;
    const tailWeight = (p90 - p10) / iqr;
    
    // Normal distribution has tailWeight ≈ 2.56
    return tailWeight / 2.56;
  }

  /**
   * Terrain complexity scoring
   */
  private calculateTerrainComplexity(metrics: TerrainMetrics): number {
    // Combine multiple factors
    const ruggednessScore = Math.min(metrics.terrain_ruggedness_index / 500, 1);
    const slopeScore = Math.min(metrics.slope_average / 45, 1); // 45 degrees as max
    const varianceScore = Math.min(Math.sqrt(metrics.elevation_variance) / 1000, 1);
    
    // Aspect uniformity (lower is more complex)
    const aspectUniformity = this.calculateAspectUniformity(metrics.aspect_distribution);
    const aspectComplexity = 1 - aspectUniformity;
    
    // Weighted combination
    return (
      ruggednessScore * 0.3 +
      slopeScore * 0.3 +
      varianceScore * 0.2 +
      aspectComplexity * 0.2
    );
  }

  private calculateAspectUniformity(aspectDist: any): number {
    const values = Object.values(aspectDist) as number[];
    const sum = values.reduce((a, b) => a + b, 0);
    const normalized = values.map(v => v / sum);
    
    // Calculate entropy
    const entropy = normalized.reduce((e, p) => {
      if (p > 0) return e - p * Math.log2(p);
      return e;
    }, 0);
    
    // Normalize to 0-1 (max entropy for 4 categories is 2)
    return 1 - (entropy / 2);
  }

  /**
   * Viewshed quality assessment
   */
  private calculateViewshedQuality(viewshed: ViewshedAnalysis): number {
    // Coverage score
    const coverageScore = Math.min(viewshed.visible_area_km2 / 10000, 1); // 10,000 km² as excellent
    
    // Horizon quality (average elevation angle)
    const avgHorizonAngle = viewshed.horizon_profile.reduce(
      (sum, p) => sum + p.elevation_angle, 0
    ) / viewshed.horizon_profile.length;
    const horizonScore = Math.max(0, 1 - avgHorizonAngle / 10); // Lower angles are better
    
    // Obstruction impact
    const obstructionScore = viewshed.obstructions.length === 0 ? 1 :
      Math.max(0, 1 - viewshed.obstructions.filter(o => o.impact_severity === 'high').length * 0.2);
    
    // Range score
    const rangeScore = Math.min(viewshed.max_range_km / 500, 1); // 500km as excellent
    
    return (
      coverageScore * 0.4 +
      horizonScore * 0.3 +
      obstructionScore * 0.2 +
      rangeScore * 0.1
    );
  }

  /**
   * Accessibility calculation
   */
  private calculateAccessibilityIndex(
    location: TerrainPoint,
    metrics: TerrainMetrics,
    infrastructure: Array<{location: TerrainPoint, type: string}>
  ): number {
    // Slope penalty
    const slopePenalty = Math.max(0, 1 - metrics.slope_average / 30);
    
    // Elevation penalty (extreme elevations are less accessible)
    const elevationPenalty = location.elevation < 4000 ? 1 : 
      Math.max(0, 1 - (location.elevation - 4000) / 2000);
    
    // Infrastructure proximity bonus
    const infraDist = this.calculateMinDistance(
      location,
      infrastructure.map(i => i.location)
    );
    const infraBonus = Math.max(0, 1 - infraDist / 100); // 100km normalization
    
    // Terrain ruggedness penalty
    const ruggednesssPenalty = Math.max(0, 1 - metrics.terrain_ruggedness_index / 300);
    
    return (
      slopePenalty * 0.3 +
      elevationPenalty * 0.2 +
      infraBonus * 0.3 +
      ruggednesssPenalty * 0.2
    );
  }

  /**
   * Construction cost estimation
   */
  private estimateConstructionCostIndex(
    metrics: TerrainMetrics,
    accessibilityIndex: number
  ): number {
    // Base cost factors
    const slopeCost = Math.pow(metrics.slope_average / 45, 2); // Exponential increase
    const elevationCost = metrics.mean_elevation > 3000 ? 
      (metrics.mean_elevation - 3000) / 3000 : 0;
    const ruggednessCost = metrics.terrain_ruggedness_index / 500;
    
    // Accessibility impact (inverse relationship)
    const accessibilityCost = 1 - accessibilityIndex;
    
    // Combined normalized cost
    return Math.min(1, 
      slopeCost * 0.4 +
      elevationCost * 0.2 +
      ruggednessCost * 0.2 +
      accessibilityCost * 0.2
    );
  }

  /**
   * Distance calculations
   */
  private calculateMinDistance(
    location: TerrainPoint,
    targets: TerrainPoint[]
  ): number {
    if (targets.length === 0) return 1000; // Max distance if no targets
    
    return Math.min(...targets.map(target => 
      this.haversineDistance(
        location.latitude, location.longitude,
        target.latitude, target.longitude
      )
    ));
  }

  private calculateWeightedPopulationDistance(
    location: TerrainPoint,
    populationCenters: Array<{location: TerrainPoint, population: number}>
  ): number {
    if (populationCenters.length === 0) return 1000;
    
    // Weight by population size
    let totalWeight = 0;
    let weightedDistance = 0;
    
    for (const center of populationCenters) {
      const distance = this.haversineDistance(
        location.latitude, location.longitude,
        center.location.latitude, center.location.longitude
      );
      const weight = Math.log10(center.population + 1);
      
      weightedDistance += distance * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedDistance / totalWeight : 1000;
  }

  /**
   * Regional terrain similarity
   */
  private calculateRegionalTerrainSimilarity(
    location: TerrainPoint,
    metrics: TerrainMetrics
  ): number {
    // Compare with historical successful sites
    const similarities: number[] = [];
    
    for (const [id, assessment] of this.historicalSites) {
      const distance = this.haversineDistance(
        location.latitude, location.longitude,
        assessment.location.latitude, assessment.location.longitude
      );
      
      // Only consider sites within 500km
      if (distance < 500) {
        const similarity = this.compareTerrainMetrics(
          metrics,
          assessment.terrain_metrics
        );
        similarities.push(similarity * (1 - distance / 500)); // Distance decay
      }
    }
    
    return similarities.length > 0 ? 
      Math.max(...similarities) : 0.5; // Default medium similarity
  }

  private compareTerrainMetrics(metrics1: TerrainMetrics, metrics2: TerrainMetrics): number {
    // Normalized difference for each metric
    const elevDiff = Math.abs(metrics1.mean_elevation - metrics2.mean_elevation) / 5000;
    const slopeDiff = Math.abs(metrics1.slope_average - metrics2.slope_average) / 45;
    const ruggDiff = Math.abs(metrics1.terrain_ruggedness_index - metrics2.terrain_ruggedness_index) / 500;
    
    // Convert to similarity (1 - normalized difference)
    return 1 - (elevDiff * 0.3 + slopeDiff * 0.4 + ruggDiff * 0.3);
  }

  /**
   * Seasonal accessibility estimation
   */
  private estimateSeasonalAccessibility(
    location: TerrainPoint,
    metrics: TerrainMetrics
  ): number[] {
    const baseAccessibility = 1 - metrics.slope_average / 45;
    const monthlyScores: number[] = [];
    
    for (let month = 0; month < 12; month++) {
      let score = baseAccessibility;
      
      // Winter months penalty for high elevation/latitude
      if ([11, 0, 1, 2].includes(month)) {
        const winterPenalty = Math.min(1, 
          (Math.abs(location.latitude) / 90) * 0.3 +
          (Math.max(0, location.elevation - 2000) / 3000) * 0.4
        );
        score *= (1 - winterPenalty);
      }
      
      // Monsoon penalty for certain regions
      if ([5, 6, 7, 8].includes(month) && 
          location.latitude > 5 && location.latitude < 35 &&
          location.longitude > 60 && location.longitude < 100) {
        score *= 0.7;
      }
      
      monthlyScores.push(Math.max(0.1, score));
    }
    
    return monthlyScores;
  }

  /**
   * Weather impact scoring
   */
  private calculateWeatherImpactScore(
    location: TerrainPoint,
    metrics: TerrainMetrics
  ): number {
    let impactScore = 0;
    
    // Elevation impact (extreme weather at high elevations)
    if (location.elevation > 3000) {
      impactScore += (location.elevation - 3000) / 3000 * 0.3;
    }
    
    // Latitude impact (extreme weather at high latitudes)
    const latImpact = Math.abs(location.latitude) / 90;
    impactScore += latImpact * 0.2;
    
    // Coastal proximity (simplified - would need actual coastline data)
    const coastalLikelihood = location.elevation < 100 ? 0.2 : 0;
    impactScore += coastalLikelihood;
    
    // Terrain exposure
    const exposureImpact = metrics.slope_average > 20 ? 0.1 : 0;
    impactScore += exposureImpact;
    
    return Math.min(1, impactScore);
  }

  /**
   * Graph-based network features
   */
  private calculateGraphFeatures(location: TerrainPoint): {
    connectivity: number,
    centrality: number,
    redundancy: number
  } {
    // Simplified graph features - in practice would use actual network topology
    
    // Connectivity: how well connected to other potential sites
    const connectivity = 0.7; // Placeholder
    
    // Centrality: importance in the network
    const centrality = 0.5; // Placeholder
    
    // Redundancy: backup coverage potential
    const redundancy = 0.6; // Placeholder
    
    return { connectivity, centrality, redundancy };
  }

  /**
   * Ensemble prediction method
   */
  async predictSiteQuality(
    features: TerrainMLFeatures,
    existingStations: GroundStationAnalytics[]
  ): Promise<TerrainPredictionResult> {
    // Combine multiple models
    const rfScore = this.randomForestPredict(features);
    const gbmScore = this.gradientBoostingPredict(features);
    const nnScore = this.neuralNetworkPredict(features);
    
    // Weighted ensemble
    const ensembleScore = (
      rfScore * 0.4 +
      gbmScore * 0.4 +
      nnScore * 0.2
    );
    
    // Calculate confidence interval
    const scores = [rfScore, gbmScore, nnScore];
    const scoreStd = this.calculateStandardDeviation(scores);
    const confidenceInterval: [number, number] = [
      Math.max(0, ensembleScore - 1.96 * scoreStd),
      Math.min(100, ensembleScore + 1.96 * scoreStd)
    ];
    
    // Feature importance
    const contributingFactors = this.calculateFeatureImportance(features);
    
    // Recommendations
    const recommendations = this.generateRecommendations(features, ensembleScore);
    
    // Find similar successful sites
    const similarSites = this.findSimilarSuccessfulSites(features, existingStations);
    
    return {
      site_quality_score: ensembleScore,
      confidence_interval: confidenceInterval,
      contributing_factors: contributingFactors,
      recommendations,
      similar_successful_sites: similarSites
    };
  }

  /**
   * Model implementations (simplified placeholders)
   */
  private randomForestPredict(features: TerrainMLFeatures): number {
    // Simplified random forest logic
    let score = 50; // Base score
    
    // Positive factors
    score += features.viewshed_quality * 20;
    score += features.accessibility_index * 15;
    score += (1 - features.construction_cost_index) * 10;
    score += (1 - features.terrain_complexity) * 5;
    
    // Negative factors
    score -= features.weather_impact_score * 10;
    score -= Math.min(features.distance_to_infrastructure / 100, 1) * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private gradientBoostingPredict(features: TerrainMLFeatures): number {
    // Simplified GBM logic with different weightings
    let score = 55;
    
    score += features.viewshed_quality * 25;
    score += features.connectivity_score * 10;
    score += features.redundancy_potential * 10;
    score -= features.construction_cost_index * 15;
    score -= features.weather_impact_score * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private neuralNetworkPredict(features: TerrainMLFeatures): number {
    // Simplified neural network logic
    // In practice, would use actual trained model
    
    // Normalize features
    const inputs = [
      features.viewshed_quality,
      features.accessibility_index,
      features.terrain_complexity,
      features.construction_cost_index,
      features.weather_impact_score,
      features.connectivity_score,
      features.centrality_measure,
      features.redundancy_potential
    ];
    
    // Simple weighted sum with non-linearity
    const hiddenLayer = inputs.map((input, i) => 
      Math.tanh(input * (0.5 + i * 0.1))
    );
    
    const output = hiddenLayer.reduce((sum, val) => sum + val) / hiddenLayer.length;
    
    return Math.max(0, Math.min(100, output * 100));
  }

  /**
   * Feature importance calculation
   */
  private calculateFeatureImportance(features: TerrainMLFeatures): Array<{
    factor: string,
    importance: number,
    value: number
  }> {
    // Simplified feature importance based on variance and impact
    const factors = [
      { factor: 'Viewshed Quality', importance: 0.25, value: features.viewshed_quality },
      { factor: 'Accessibility', importance: 0.20, value: features.accessibility_index },
      { factor: 'Construction Cost', importance: 0.15, value: features.construction_cost_index },
      { factor: 'Weather Impact', importance: 0.15, value: features.weather_impact_score },
      { factor: 'Network Connectivity', importance: 0.10, value: features.connectivity_score },
      { factor: 'Terrain Complexity', importance: 0.10, value: features.terrain_complexity },
      { factor: 'Infrastructure Distance', importance: 0.05, value: Math.min(features.distance_to_infrastructure / 100, 1) }
    ];
    
    return factors.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    features: TerrainMLFeatures,
    score: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (features.viewshed_quality < 0.5) {
      recommendations.push('Consider elevated antenna towers to improve viewshed coverage');
    }
    
    if (features.accessibility_index < 0.6) {
      recommendations.push('Plan for improved access roads and infrastructure development');
    }
    
    if (features.construction_cost_index > 0.7) {
      recommendations.push('Budget for higher construction costs due to challenging terrain');
    }
    
    if (features.weather_impact_score > 0.6) {
      recommendations.push('Implement weather-resistant equipment and redundancy measures');
    }
    
    if (features.distance_to_infrastructure > 50) {
      recommendations.push('Factor in costs for power and network connectivity infrastructure');
    }
    
    if (score > 80) {
      recommendations.push('Excellent site candidate - proceed with detailed feasibility study');
    } else if (score > 60) {
      recommendations.push('Good site potential with some challenges - conduct risk assessment');
    } else {
      recommendations.push('Site has significant challenges - consider alternative locations');
    }
    
    return recommendations;
  }

  /**
   * Find similar successful sites
   */
  private findSimilarSuccessfulSites(
    features: TerrainMLFeatures,
    existingStations: GroundStationAnalytics[]
  ): Array<{
    location: TerrainPoint,
    similarity_score: number,
    performance_metrics: any
  }> {
    // Filter successful stations
    const successfulStations = existingStations.filter(s => 
      s.health_score > 85 && s.roi_metrics.annual_roi_percentage > 20
    );
    
    // Calculate similarity for each
    const similarities = successfulStations.map(station => {
      // Simplified similarity calculation
      const similarity = 0.7; // Placeholder - would calculate actual feature similarity
      
      return {
        location: {
          latitude: station.location.latitude,
          longitude: station.location.longitude,
          elevation: 0 // Would need actual elevation
        },
        similarity_score: similarity,
        performance_metrics: {
          roi: station.roi_metrics.annual_roi_percentage,
          utilization: station.utilization_metrics.current_utilization,
          health_score: station.health_score
        }
      };
    });
    
    // Return top 3 most similar
    return similarities
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 3);
  }

  /**
   * Utility functions
   */
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

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Update historical data for learning
   */
  updateHistoricalData(siteId: string, assessment: SiteTerrainAssessment): void {
    this.historicalSites.set(siteId, assessment);
  }

  updatePerformanceData(siteId: string, performance: any): void {
    this.performanceData.set(siteId, performance);
  }
}