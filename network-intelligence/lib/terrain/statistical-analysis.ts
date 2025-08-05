/**
 * Statistical Analysis for Terrain-Station Correlation
 * Implements correlation analysis, sensitivity testing, and risk assessment
 */

import {
  TerrainMetrics,
  TerrainMLFeatures,
  SiteTerrainAssessment
} from './types';
import { GroundStationAnalytics } from '../types/ground-station';

export interface CorrelationResult {
  metric: string;
  correlation_coefficient: number;
  p_value: number;
  confidence_interval: [number, number];
  sample_size: number;
  significance: 'high' | 'medium' | 'low' | 'none';
}

export interface SensitivityResult {
  parameter: string;
  base_value: number;
  sensitivity_coefficient: number;
  impact_range: [number, number];
  elasticity: number;
  critical_threshold?: number;
}

export interface RegionalPattern {
  region: string;
  dominant_terrain_type: string;
  performance_cluster: string;
  characteristic_features: TerrainMetrics;
  station_count: number;
  avg_performance_score: number;
  success_predictors: string[];
}

export interface RiskAssessmentResult {
  overall_risk_score: number;
  risk_categories: Array<{
    category: string;
    score: number;
    factors: string[];
    mitigation_strategies: string[];
  }>;
  confidence_level: number;
  monte_carlo_results: {
    mean_outcome: number;
    std_deviation: number;
    percentiles: {
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
    };
    value_at_risk_95: number;
  };
}

export class TerrainStatisticalAnalysis {
  /**
   * Analyze correlation between terrain features and station performance
   */
  analyzeTerrainPerformanceCorrelation(
    stations: Array<{
      analytics: GroundStationAnalytics;
      terrain: SiteTerrainAssessment;
      features: TerrainMLFeatures;
    }>
  ): CorrelationResult[] {
    const results: CorrelationResult[] = [];
    
    // Extract performance metrics
    const performance = stations.map(s => s.analytics.health_score);
    
    // Analyze each terrain feature
    const featureNames = [
      'elevation_mean',
      'terrain_complexity',
      'viewshed_quality',
      'accessibility_index',
      'slope_average',
      'weather_impact_score'
    ];
    
    for (const feature of featureNames) {
      const values = this.extractFeatureValues(stations, feature);
      const correlation = this.calculateCorrelation(values, performance);
      
      results.push({
        metric: feature,
        correlation_coefficient: correlation.r,
        p_value: correlation.p,
        confidence_interval: correlation.ci,
        sample_size: stations.length,
        significance: this.assessSignificance(correlation.p, correlation.r)
      });
    }
    
    // Sort by absolute correlation strength
    return results.sort((a, b) => 
      Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient)
    );
  }

  /**
   * Perform sensitivity analysis on terrain factors
   */
  performSensitivityAnalysis(
    baseCase: {
      features: TerrainMLFeatures;
      performance: number;
    },
    model: (features: TerrainMLFeatures) => number
  ): SensitivityResult[] {
    const results: SensitivityResult[] = [];
    const perturbation = 0.1; // 10% change
    
    const parameters = [
      { name: 'elevation_stats.mean', path: ['elevation_stats', 'mean'] },
      { name: 'terrain_complexity', path: ['terrain_complexity'] },
      { name: 'viewshed_quality', path: ['viewshed_quality'] },
      { name: 'accessibility_index', path: ['accessibility_index'] },
      { name: 'construction_cost_index', path: ['construction_cost_index'] },
      { name: 'weather_impact_score', path: ['weather_impact_score'] }
    ];
    
    for (const param of parameters) {
      const baseValue = this.getNestedValue(baseCase.features, param.path);
      
      // Test positive and negative perturbations
      const testValues = [
        baseValue * (1 - perturbation),
        baseValue,
        baseValue * (1 + perturbation)
      ];
      
      const outcomes: number[] = [];
      
      for (const testValue of testValues) {
        const testFeatures = this.deepClone(baseCase.features);
        this.setNestedValue(testFeatures, param.path, testValue);
        outcomes.push(model(testFeatures));
      }
      
      // Calculate sensitivity
      const sensitivity = (outcomes[2] - outcomes[0]) / (2 * perturbation * baseValue);
      const elasticity = sensitivity * (baseValue / baseCase.performance);
      
      // Find critical threshold if exists
      const criticalThreshold = this.findCriticalThreshold(
        baseCase.features,
        param.path,
        model,
        baseValue
      );
      
      results.push({
        parameter: param.name,
        base_value: baseValue,
        sensitivity_coefficient: sensitivity,
        impact_range: [Math.min(...outcomes), Math.max(...outcomes)],
        elasticity: elasticity,
        critical_threshold: criticalThreshold
      });
    }
    
    return results.sort((a, b) => 
      Math.abs(b.sensitivity_coefficient) - Math.abs(a.sensitivity_coefficient)
    );
  }

  /**
   * Identify regional terrain patterns
   */
  identifyRegionalPatterns(
    stations: Array<{
      analytics: GroundStationAnalytics;
      terrain: SiteTerrainAssessment;
      features: TerrainMLFeatures;
    }>
  ): RegionalPattern[] {
    const patterns: Map<string, RegionalPattern> = new Map();
    
    // Group by region
    const regionGroups = this.groupByRegion(stations);
    
    for (const [region, regionStations] of regionGroups) {
      // Calculate average terrain metrics
      const avgMetrics = this.calculateAverageMetrics(
        regionStations.map(s => s.terrain.terrain_metrics)
      );
      
      // Identify dominant terrain type
      const dominantType = this.classifyTerrainType(avgMetrics);
      
      // Performance clustering
      const performanceCluster = this.clusterPerformance(
        regionStations.map(s => s.analytics.health_score)
      );
      
      // Identify success predictors
      const predictors = this.identifySuccessPredictors(regionStations);
      
      patterns.set(region, {
        region,
        dominant_terrain_type: dominantType,
        performance_cluster: performanceCluster,
        characteristic_features: avgMetrics,
        station_count: regionStations.length,
        avg_performance_score: regionStations.reduce((sum, s) => 
          sum + s.analytics.health_score, 0
        ) / regionStations.length,
        success_predictors: predictors
      });
    }
    
    return Array.from(patterns.values());
  }

  /**
   * Comprehensive risk assessment with Monte Carlo simulation
   */
  assessTerrainRisk(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures,
    historicalData: any[] = []
  ): RiskAssessmentResult {
    const riskCategories = [
      {
        category: 'Environmental',
        factors: this.assessEnvironmentalRisk(site, features),
        weight: 0.3
      },
      {
        category: 'Construction',
        factors: this.assessConstructionRisk(site, features),
        weight: 0.25
      },
      {
        category: 'Operational',
        factors: this.assessOperationalRisk(site, features),
        weight: 0.25
      },
      {
        category: 'Financial',
        factors: this.assessFinancialRisk(site, features),
        weight: 0.2
      }
    ];
    
    // Calculate category scores
    const categoryScores = riskCategories.map(cat => {
      const score = cat.factors.reduce((sum, f) => sum + f.score, 0) / cat.factors.length;
      return {
        category: cat.category,
        score,
        factors: cat.factors.map(f => f.name),
        mitigation_strategies: this.generateMitigationStrategies(cat.category, cat.factors)
      };
    });
    
    // Overall risk score (weighted average)
    const overallScore = riskCategories.reduce((sum, cat, i) => 
      sum + categoryScores[i].score * cat.weight, 0
    );
    
    // Monte Carlo simulation
    const monteCarloResults = this.runMonteCarloSimulation(
      site,
      features,
      10000 // iterations
    );
    
    // Confidence level based on data quality and sample size
    const confidenceLevel = this.calculateConfidenceLevel(historicalData.length);
    
    return {
      overall_risk_score: overallScore,
      risk_categories: categoryScores,
      confidence_level: confidenceLevel,
      monte_carlo_results: monteCarloResults
    };
  }

  /**
   * Private helper methods
   */
  private extractFeatureValues(stations: any[], feature: string): number[] {
    return stations.map(s => {
      switch (feature) {
        case 'elevation_mean':
          return s.features.elevation_stats.mean;
        case 'terrain_complexity':
          return s.features.terrain_complexity;
        case 'viewshed_quality':
          return s.features.viewshed_quality;
        case 'accessibility_index':
          return s.features.accessibility_index;
        case 'slope_average':
          return s.terrain.terrain_metrics.slope_average;
        case 'weather_impact_score':
          return s.features.weather_impact_score;
        default:
          return 0;
      }
    });
  }

  private calculateCorrelation(x: number[], y: number[]): {
    r: number;
    p: number;
    ci: [number, number];
  } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    // Pearson correlation coefficient
    const r = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    // T-statistic for significance test
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;
    
    // Simplified p-value calculation (would use proper t-distribution)
    const p = 2 * (1 - this.normalCDF(Math.abs(t)));
    
    // Fisher's z-transformation for confidence interval
    const z = 0.5 * Math.log((1 + r) / (1 - r));
    const se = 1 / Math.sqrt(n - 3);
    const ci95 = 1.96; // 95% confidence
    
    const zLower = z - ci95 * se;
    const zUpper = z + ci95 * se;
    
    // Transform back to r
    const ciLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
    const ciUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
    
    return { r, p, ci: [ciLower, ciUpper] };
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return 0.5 * (1 + sign * y);
  }

  private assessSignificance(p: number, r: number): 'high' | 'medium' | 'low' | 'none' {
    if (p > 0.05) return 'none';
    const absR = Math.abs(r);
    if (absR > 0.7) return 'high';
    if (absR > 0.5) return 'medium';
    return 'low';
  }

  private getNestedValue(obj: any, path: string[]): number {
    return path.reduce((curr, key) => curr?.[key], obj) || 0;
  }

  private setNestedValue(obj: any, path: string[], value: number): void {
    const lastKey = path[path.length - 1];
    const target = path.slice(0, -1).reduce((curr, key) => curr[key], obj);
    target[lastKey] = value;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private findCriticalThreshold(
    features: TerrainMLFeatures,
    path: string[],
    model: (features: TerrainMLFeatures) => number,
    baseValue: number
  ): number | undefined {
    const basePerformance = model(features);
    const threshold = basePerformance * 0.8; // 20% degradation
    
    // Binary search for critical value
    let low = 0;
    let high = baseValue * 2;
    let iterations = 0;
    
    while (high - low > baseValue * 0.01 && iterations < 20) {
      const mid = (low + high) / 2;
      const testFeatures = this.deepClone(features);
      this.setNestedValue(testFeatures, path, mid);
      const performance = model(testFeatures);
      
      if (performance < threshold) {
        high = mid;
      } else {
        low = mid;
      }
      iterations++;
    }
    
    return iterations < 20 ? (low + high) / 2 : undefined;
  }

  private groupByRegion(stations: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    for (const station of stations) {
      const region = station.analytics.location.region;
      if (!groups.has(region)) {
        groups.set(region, []);
      }
      groups.get(region)!.push(station);
    }
    
    return groups;
  }

  private calculateAverageMetrics(metricsArray: TerrainMetrics[]): TerrainMetrics {
    const n = metricsArray.length;
    
    return {
      mean_elevation: metricsArray.reduce((sum, m) => sum + m.mean_elevation, 0) / n,
      elevation_variance: metricsArray.reduce((sum, m) => sum + m.elevation_variance, 0) / n,
      terrain_ruggedness_index: metricsArray.reduce((sum, m) => sum + m.terrain_ruggedness_index, 0) / n,
      slope_average: metricsArray.reduce((sum, m) => sum + m.slope_average, 0) / n,
      aspect_distribution: {
        north: metricsArray.reduce((sum, m) => sum + m.aspect_distribution.north, 0) / n,
        east: metricsArray.reduce((sum, m) => sum + m.aspect_distribution.east, 0) / n,
        south: metricsArray.reduce((sum, m) => sum + m.aspect_distribution.south, 0) / n,
        west: metricsArray.reduce((sum, m) => sum + m.aspect_distribution.west, 0) / n
      },
      elevation_percentiles: {
        p10: metricsArray.reduce((sum, m) => sum + m.elevation_percentiles.p10, 0) / n,
        p25: metricsArray.reduce((sum, m) => sum + m.elevation_percentiles.p25, 0) / n,
        p50: metricsArray.reduce((sum, m) => sum + m.elevation_percentiles.p50, 0) / n,
        p75: metricsArray.reduce((sum, m) => sum + m.elevation_percentiles.p75, 0) / n,
        p90: metricsArray.reduce((sum, m) => sum + m.elevation_percentiles.p90, 0) / n
      }
    };
  }

  private classifyTerrainType(metrics: TerrainMetrics): string {
    if (metrics.mean_elevation > 2000) return 'mountainous';
    if (metrics.terrain_ruggedness_index > 300) return 'rugged';
    if (metrics.slope_average > 15) return 'hilly';
    if (metrics.mean_elevation < 100) return 'coastal/lowland';
    return 'moderate';
  }

  private clusterPerformance(scores: number[]): string {
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    if (avg > 90) return 'excellent';
    if (avg > 80) return 'good';
    if (avg > 70) return 'average';
    return 'poor';
  }

  private identifySuccessPredictors(stations: any[]): string[] {
    // Simplified - would use proper feature importance
    const predictors: string[] = [];
    
    const highPerformers = stations.filter(s => s.analytics.health_score > 85);
    if (highPerformers.length === 0) return [];
    
    const avgViewshed = highPerformers.reduce((sum, s) => 
      sum + s.features.viewshed_quality, 0
    ) / highPerformers.length;
    
    if (avgViewshed > 0.7) predictors.push('high_viewshed_quality');
    
    const avgAccessibility = highPerformers.reduce((sum, s) => 
      sum + s.features.accessibility_index, 0
    ) / highPerformers.length;
    
    if (avgAccessibility > 0.7) predictors.push('good_accessibility');
    
    return predictors;
  }

  private assessEnvironmentalRisk(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures
  ): Array<{name: string, score: number}> {
    const factors = [];
    
    // Weather risk
    factors.push({
      name: 'weather_exposure',
      score: features.weather_impact_score * 100
    });
    
    // Flood risk
    if (site.environmental_factors.flood_risk === 'high') {
      factors.push({ name: 'flood_risk', score: 80 });
    } else if (site.environmental_factors.flood_risk === 'medium') {
      factors.push({ name: 'flood_risk', score: 50 });
    } else {
      factors.push({ name: 'flood_risk', score: 20 });
    }
    
    // Seismic risk
    factors.push({
      name: 'seismic_risk',
      score: site.environmental_factors.seismic_zone * 20
    });
    
    return factors;
  }

  private assessConstructionRisk(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures
  ): Array<{name: string, score: number}> {
    const factors = [];
    
    // Terrain complexity
    factors.push({
      name: 'terrain_complexity',
      score: features.terrain_complexity * 100
    });
    
    // Access difficulty
    factors.push({
      name: 'access_difficulty',
      score: (1 - features.accessibility_index) * 100
    });
    
    // Construction cost uncertainty
    factors.push({
      name: 'cost_uncertainty',
      score: features.construction_cost_index * 80
    });
    
    return factors;
  }

  private assessOperationalRisk(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures
  ): Array<{name: string, score: number}> {
    const factors = [];
    
    // Maintenance access
    factors.push({
      name: 'maintenance_access',
      score: (1 - features.accessibility_index) * 80
    });
    
    // Viewshed limitations
    factors.push({
      name: 'viewshed_limitations',
      score: (1 - features.viewshed_quality) * 100
    });
    
    // Infrastructure distance
    factors.push({
      name: 'infrastructure_distance',
      score: Math.min(features.distance_to_infrastructure / 100, 1) * 70
    });
    
    return factors;
  }

  private assessFinancialRisk(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures
  ): Array<{name: string, score: number}> {
    const factors = [];
    
    // High construction costs
    factors.push({
      name: 'construction_cost_overrun',
      score: features.construction_cost_index * 90
    });
    
    // Market uncertainty
    factors.push({
      name: 'market_uncertainty',
      score: 40 // Baseline uncertainty
    });
    
    // ROI risk
    const roiRisk = features.terrain_complexity * 50 + 
                   (1 - features.accessibility_index) * 30;
    factors.push({
      name: 'roi_achievement_risk',
      score: roiRisk
    });
    
    return factors;
  }

  private generateMitigationStrategies(
    category: string,
    factors: Array<{name: string, score: number}>
  ): string[] {
    const strategies: string[] = [];
    
    switch (category) {
      case 'Environmental':
        if (factors.some(f => f.name === 'weather_exposure' && f.score > 60)) {
          strategies.push('Install weather-resistant equipment and protective radomes');
        }
        if (factors.some(f => f.name === 'flood_risk' && f.score > 50)) {
          strategies.push('Elevate critical infrastructure and implement drainage systems');
        }
        break;
        
      case 'Construction':
        if (factors.some(f => f.name === 'terrain_complexity' && f.score > 70)) {
          strategies.push('Engage specialized mountain construction contractors');
        }
        if (factors.some(f => f.name === 'access_difficulty' && f.score > 60)) {
          strategies.push('Invest in access road improvements before construction');
        }
        break;
        
      case 'Operational':
        if (factors.some(f => f.name === 'maintenance_access' && f.score > 70)) {
          strategies.push('Implement remote monitoring and automated systems');
        }
        break;
        
      case 'Financial':
        if (factors.some(f => f.name === 'construction_cost_overrun' && f.score > 70)) {
          strategies.push('Add 30% contingency to construction budget');
        }
        break;
    }
    
    return strategies;
  }

  private runMonteCarloSimulation(
    site: SiteTerrainAssessment,
    features: TerrainMLFeatures,
    iterations: number
  ): any {
    const outcomes: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Simulate variations in key parameters
      const variedFeatures = this.addRandomVariation(features);
      
      // Simple outcome model (would be more sophisticated in practice)
      const outcome = 100 - (
        variedFeatures.terrain_complexity * 20 +
        variedFeatures.weather_impact_score * 15 +
        variedFeatures.construction_cost_index * 25 +
        (1 - variedFeatures.accessibility_index) * 15 +
        (1 - variedFeatures.viewshed_quality) * 25
      );
      
      outcomes.push(Math.max(0, Math.min(100, outcome)));
    }
    
    // Calculate statistics
    outcomes.sort((a, b) => a - b);
    const mean = outcomes.reduce((a, b) => a + b) / outcomes.length;
    const variance = outcomes.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / outcomes.length;
    const std = Math.sqrt(variance);
    
    return {
      mean_outcome: mean,
      std_deviation: std,
      percentiles: {
        p5: outcomes[Math.floor(outcomes.length * 0.05)],
        p25: outcomes[Math.floor(outcomes.length * 0.25)],
        p50: outcomes[Math.floor(outcomes.length * 0.50)],
        p75: outcomes[Math.floor(outcomes.length * 0.75)],
        p95: outcomes[Math.floor(outcomes.length * 0.95)]
      },
      value_at_risk_95: outcomes[Math.floor(outcomes.length * 0.05)]
    };
  }

  private addRandomVariation(features: TerrainMLFeatures): TerrainMLFeatures {
    const varied = this.deepClone(features);
    
    // Add normal random variation to key parameters
    varied.terrain_complexity *= 1 + (Math.random() - 0.5) * 0.2;
    varied.weather_impact_score *= 1 + (Math.random() - 0.5) * 0.3;
    varied.construction_cost_index *= 1 + (Math.random() - 0.5) * 0.4;
    varied.accessibility_index *= 1 + (Math.random() - 0.5) * 0.1;
    
    // Ensure values stay in valid range [0, 1]
    varied.terrain_complexity = Math.max(0, Math.min(1, varied.terrain_complexity));
    varied.weather_impact_score = Math.max(0, Math.min(1, varied.weather_impact_score));
    varied.construction_cost_index = Math.max(0, Math.min(1, varied.construction_cost_index));
    varied.accessibility_index = Math.max(0, Math.min(1, varied.accessibility_index));
    
    return varied;
  }

  private calculateConfidenceLevel(sampleSize: number): number {
    // Simplified confidence calculation based on sample size
    if (sampleSize < 10) return 0.5;
    if (sampleSize < 30) return 0.7;
    if (sampleSize < 100) return 0.85;
    return 0.95;
  }
}