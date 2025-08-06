/**
 * Analytics_Engineer - Data Science Analytics Expert
 * 
 * Processes existing ingested data sources
 * Correlates weather patterns with station availability
 * Analyzes terrain impact on coverage
 */

import { BaseAgent, AgentCapability, AgentAnalysis, WeatherPattern, TerrainData } from '../types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface DataAnalysisResults {
  stationId: string;
  dataQualityScore: number;
  weatherCorrelation: {
    rainFadeImpact: number;
    seasonalPatterns: { season: string; availabilityImpact: number }[];
    criticalWeatherThresholds: { condition: string; threshold: number; impact: string }[];
  };
  terrainAnalysis: {
    elevationProfile: { direction: string; elevation: number; impact: number }[];
    lineOfSightScore: number;
    obstructionRisk: 'low' | 'medium' | 'high';
    mitigationRecommendations: string[];
  };
  performanceCorrelations: {
    utilizationVsWeather: number;
    capacityVsTerrain: number;
    reliabilityFactors: { factor: string; correlation: number; significance: string }[];
  };
  predictiveInsights: {
    seasonalDemandForecast: { month: string; demandMultiplier: number }[];
    weatherRiskForecast: { month: string; riskLevel: 'low' | 'medium' | 'high' }[];
    maintenanceRecommendations: { period: string; focus: string; priority: string }[];
  };
}

export class AnalyticsEngineer extends BaseAgent {
  agentId = 'Analytics_Engineer';
  
  capabilities: AgentCapability[] = [
    {
      name: 'Data Quality Assessment',
      description: 'Evaluates completeness and accuracy of ingested data sources',
      inputTypes: ['GroundStationAnalytics', 'WeatherData', 'TerrainData'],
      outputTypes: ['DataQualityReport']
    },
    {
      name: 'Weather-Performance Correlation',
      description: 'Analyzes correlation between weather patterns and station performance',
      inputTypes: ['WeatherPatterns', 'PerformanceMetrics'],
      outputTypes: ['WeatherCorrelationAnalysis']
    },
    {
      name: 'Terrain Impact Analysis',
      description: 'Evaluates terrain effects on signal coverage and quality',
      inputTypes: ['TerrainData', 'CoverageMetrics'],
      outputTypes: ['TerrainImpactAssessment']
    },
    {
      name: 'Predictive Analytics',
      description: 'Generates forecasts and predictive insights from historical data',
      inputTypes: ['HistoricalData', 'ExternalFactors'],
      outputTypes: ['PredictiveInsights']
    }
  ];

  async analyze(station: GroundStationAnalytics): Promise<AgentAnalysis> {
    const analysis = await this.performDataAnalysis(station);
    const confidence = this.calculateAnalysisConfidence(station, analysis);
    const recommendations = this.generateAnalyticsRecommendations(analysis);
    const warnings = this.identifyDataWarnings(analysis);

    return this.createAnalysis(analysis, confidence, recommendations, warnings);
  }

  private async performDataAnalysis(station: GroundStationAnalytics): Promise<DataAnalysisResults> {
    // Assess data quality
    const dataQualityScore = this.assessDataQuality(station);
    
    // Analyze weather correlations
    const weatherCorrelation = this.analyzeWeatherCorrelations(station);
    
    // Perform terrain analysis
    const terrainAnalysis = this.performTerrainAnalysis(station);
    
    // Calculate performance correlations
    const performanceCorrelations = this.calculatePerformanceCorrelations(station);
    
    // Generate predictive insights
    const predictiveInsights = this.generatePredictiveInsights(station);

    return {
      stationId: station.station_id,
      dataQualityScore,
      weatherCorrelation,
      terrainAnalysis,
      performanceCorrelations,
      predictiveInsights
    };
  }

  private assessDataQuality(station: GroundStationAnalytics): number {
    let qualityScore = 0;
    let totalChecks = 0;

    // Check completeness of utilization metrics
    totalChecks++;
    if (station.utilization_metrics.monthly_utilization_history.length >= 5) {
      qualityScore += 20;
    }

    // Check business metrics completeness
    totalChecks++;
    if (station.business_metrics.monthly_revenue > 0 && 
        station.business_metrics.profit_margin > 0) {
      qualityScore += 20;
    }

    // Check technical specifications
    totalChecks++;
    if (station.technical_specs.g_t_ratio_db > 0 && 
        station.technical_specs.eirp_dbw > 0) {
      qualityScore += 20;
    }

    // Check capacity metrics
    totalChecks++;
    if (station.capacity_metrics.bandwidth_by_service.length > 0) {
      qualityScore += 20;
    }

    // Check coverage metrics
    totalChecks++;
    if (station.coverage_metrics.satellite_visibility_count > 0) {
      qualityScore += 20;
    }

    return Math.round(qualityScore);
  }

  private analyzeWeatherCorrelations(station: GroundStationAnalytics): {
    rainFadeImpact: number;
    seasonalPatterns: { season: string; availabilityImpact: number }[];
    criticalWeatherThresholds: { condition: string; threshold: number; impact: string }[];
  } {
    const latitude = Math.abs(station.location.latitude);
    const weatherImpactDays = station.coverage_metrics.weather_impact_days_per_year;
    
    // Calculate rain fade impact based on location and frequency bands
    const rainFadeImpact = this.calculateRainFadeImpact(
      latitude,
      station.technical_specs.frequency_bands,
      weatherImpactDays
    );

    // Generate seasonal patterns
    const seasonalPatterns = this.generateSeasonalPatterns(latitude, station.location.region);

    // Define critical weather thresholds
    const criticalWeatherThresholds = this.defineCriticalWeatherThresholds(
      station.technical_specs.frequency_bands
    );

    return {
      rainFadeImpact,
      seasonalPatterns,
      criticalWeatherThresholds
    };
  }

  private calculateRainFadeImpact(
    latitude: number,
    frequencyBands: string[],
    weatherImpactDays: number
  ): number {
    let baseImpact = weatherImpactDays / 365 * 100; // Convert to percentage

    // Tropical regions (closer to equator) have higher rain fade
    if (latitude < 30) {
      baseImpact *= 1.5;
    } else if (latitude < 45) {
      baseImpact *= 1.2;
    }

    // Higher frequency bands are more susceptible to rain fade
    if (frequencyBands.includes('Ka-band')) {
      baseImpact *= 1.8;
    } else if (frequencyBands.includes('Ku-band')) {
      baseImpact *= 1.3;
    }

    return Math.round(Math.min(baseImpact, 25)); // Cap at 25%
  }

  private generateSeasonalPatterns(latitude: number, region: string): { season: string; availabilityImpact: number }[] {
    // Different patterns based on hemisphere and region
    const isNorthern = latitude > 0;
    const patterns = [];

    if (region === 'Equatorial') {
      patterns.push(
        { season: 'Dry Season (Dec-Mar)', availabilityImpact: 2 },
        { season: 'Wet Season (Apr-Jul)', availabilityImpact: 15 },
        { season: 'Transition (Aug-Nov)', availabilityImpact: 8 }
      );
    } else if (isNorthern) {
      patterns.push(
        { season: 'Winter (Dec-Feb)', availabilityImpact: 5 },
        { season: 'Spring (Mar-May)', availabilityImpact: 8 },
        { season: 'Summer (Jun-Aug)', availabilityImpact: 12 },
        { season: 'Autumn (Sep-Nov)', availabilityImpact: 6 }
      );
    } else {
      patterns.push(
        { season: 'Summer (Dec-Feb)', availabilityImpact: 10 },
        { season: 'Autumn (Mar-May)', availabilityImpact: 6 },
        { season: 'Winter (Jun-Aug)', availabilityImpact: 4 },
        { season: 'Spring (Sep-Nov)', availabilityImpact: 8 }
      );
    }

    return patterns;
  }

  private defineCriticalWeatherThresholds(frequencyBands: string[]): { condition: string; threshold: number; impact: string }[] {
    const thresholds = [];

    // Rain rate thresholds (varies by frequency)
    if (frequencyBands.includes('Ka-band')) {
      thresholds.push({ condition: 'Rain Rate', threshold: 10, impact: 'Severe signal degradation' });
    }
    if (frequencyBands.includes('Ku-band')) {
      thresholds.push({ condition: 'Rain Rate', threshold: 25, impact: 'Significant signal loss' });
    }
    if (frequencyBands.includes('C-band')) {
      thresholds.push({ condition: 'Rain Rate', threshold: 50, impact: 'Moderate signal impact' });
    }

    // Common atmospheric conditions
    thresholds.push(
      { condition: 'Atmospheric Water Vapor', threshold: 40, impact: 'Increased attenuation' },
      { condition: 'Cloud Liquid Water', threshold: 2, impact: 'Signal scattering effects' },
      { condition: 'Atmospheric Scintillation', threshold: 0.5, impact: 'Signal amplitude variations' }
    );

    return thresholds;
  }

  private performTerrainAnalysis(station: GroundStationAnalytics): {
    elevationProfile: { direction: string; elevation: number; impact: number }[];
    lineOfSightScore: number;
    obstructionRisk: 'low' | 'medium' | 'high';
    mitigationRecommendations: string[];
  } {
    // Simulate terrain analysis based on location and obstructions
    const obstructions = station.coverage_metrics.line_of_sight_obstructions;
    
    // Generate elevation profile (simulated)
    const elevationProfile = this.generateElevationProfile(station.location);
    
    // Calculate line of sight score
    const lineOfSightScore = this.calculateLineOfSightScore(obstructions, elevationProfile);
    
    // Assess obstruction risk
    const obstructionRisk = this.assessObstructionRisk(obstructions, lineOfSightScore);
    
    // Generate mitigation recommendations
    const mitigationRecommendations = this.generateMitigationRecommendations(
      obstructions,
      obstructionRisk,
      station.technical_specs
    );

    return {
      elevationProfile,
      lineOfSightScore,
      obstructionRisk,
      mitigationRecommendations
    };
  }

  private generateElevationProfile(location: { latitude: number; longitude: number }): { direction: string; elevation: number; impact: number }[] {
    // Simplified terrain simulation based on geographic patterns
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    
    return directions.map(direction => {
      // Simulate elevation based on location (more complex in production)
      let elevation = Math.random() * 500; // Base random elevation
      
      // Geographic adjustments
      if (Math.abs(location.latitude) > 45) {
        elevation *= 2; // Higher latitudes tend to have more varied terrain
      }
      
      // Calculate impact based on elevation
      const impact = elevation > 200 ? Math.min(elevation / 50, 20) : 0;
      
      return {
        direction,
        elevation: Math.round(elevation),
        impact: Math.round(impact)
      };
    });
  }

  private calculateLineOfSightScore(
    obstructions: string[],
    elevationProfile: { direction: string; elevation: number; impact: number }[]
  ): number {
    let score = 100; // Start with perfect score
    
    // Penalize for obstructions
    obstructions.forEach(obstruction => {
      if (obstruction.includes('Mountain')) score -= 15;
      else if (obstruction.includes('building') || obstruction.includes('urban')) score -= 10;
      else if (obstruction.includes('forest') || obstruction.includes('tree')) score -= 5;
      else score -= 8; // Generic obstruction
    });
    
    // Penalize for high terrain impact
    const avgTerrainImpact = elevationProfile.reduce((sum, profile) => sum + profile.impact, 0) / elevationProfile.length;
    score -= avgTerrainImpact;
    
    return Math.max(0, Math.round(score));
  }

  private assessObstructionRisk(
    obstructions: string[],
    lineOfSightScore: number
  ): 'low' | 'medium' | 'high' {
    if (lineOfSightScore >= 80 && obstructions.length <= 1) return 'low';
    if (lineOfSightScore >= 60 && obstructions.length <= 2) return 'medium';
    return 'high';
  }

  private generateMitigationRecommendations(
    obstructions: string[],
    obstructionRisk: 'low' | 'medium' | 'high',
    technicalSpecs: any
  ): string[] {
    const recommendations: string[] = [];

    if (obstructionRisk === 'high') {
      recommendations.push('Consider antenna relocation to higher elevation site');
      recommendations.push('Implement diversity antennas for redundant paths');
    }

    if (obstructions.some(obs => obs.includes('Mountain'))) {
      recommendations.push('Install mountain-top repeater for improved coverage');
    }

    if (obstructions.some(obs => obs.includes('urban') || obs.includes('building'))) {
      recommendations.push('Negotiate rooftop access for clearer sight lines');
      recommendations.push('Consider higher antenna towers to clear urban obstacles');
    }

    if (technicalSpecs.primary_antenna_size_m < 12 && obstructionRisk !== 'low') {
      recommendations.push('Upgrade to larger antenna for better signal-to-noise ratio');
    }

    if (recommendations.length === 0) {
      recommendations.push('Current terrain profile is acceptable for operations');
    }

    return recommendations;
  }

  private calculatePerformanceCorrelations(station: GroundStationAnalytics): {
    utilizationVsWeather: number;
    capacityVsTerrain: number;
    reliabilityFactors: { factor: string; correlation: number; significance: string }[];
  } {
    // Simulate correlation analysis based on station data
    const weatherImpact = station.coverage_metrics.weather_impact_days_per_year;
    const utilization = station.utilization_metrics.current_utilization;
    const capacity = station.capacity_metrics.total_capacity_gbps;
    const redundancy = station.capacity_metrics.redundancy_level;

    // Weather vs Utilization correlation (negative correlation expected)
    const utilizationVsWeather = -0.3 - (weatherImpact / 365) * 0.5;

    // Capacity vs Terrain correlation (simulated)
    const terrainScore = 100 - station.coverage_metrics.line_of_sight_obstructions.length * 10;
    const capacityVsTerrain = 0.2 + (terrainScore / 100) * 0.4;

    // Reliability factors
    const reliabilityFactors = [
      {
        factor: 'Redundancy Level',
        correlation: redundancy / 100,
        significance: redundancy > 90 ? 'High' : redundancy > 70 ? 'Medium' : 'Low'
      },
      {
        factor: 'Weather Resilience',
        correlation: Math.max(0, 1 - (weatherImpact / 100)),
        significance: weatherImpact < 20 ? 'High' : weatherImpact < 40 ? 'Medium' : 'Low'
      },
      {
        factor: 'Technical Capability',
        correlation: (station.technical_specs.g_t_ratio_db / 50) + (station.technical_specs.eirp_dbw / 60),
        significance: station.technical_specs.g_t_ratio_db > 40 ? 'High' : 'Medium'
      }
    ];

    return {
      utilizationVsWeather: Math.round(utilizationVsWeather * 100) / 100,
      capacityVsTerrain: Math.round(capacityVsTerrain * 100) / 100,
      reliabilityFactors
    };
  }

  private generatePredictiveInsights(station: GroundStationAnalytics): {
    seasonalDemandForecast: { month: string; demandMultiplier: number }[];
    weatherRiskForecast: { month: string; riskLevel: 'low' | 'medium' | 'high' }[];
    maintenanceRecommendations: { period: string; focus: string; priority: string }[];
  } {
    const latitude = station.location.latitude;
    const isNorthern = latitude > 0;
    const isEquatorial = Math.abs(latitude) < 25;

    // Generate seasonal demand forecast
    const seasonalDemandForecast = this.generateSeasonalDemandForecast(station.location.region, isNorthern);

    // Generate weather risk forecast
    const weatherRiskForecast = this.generateWeatherRiskForecast(isEquatorial, isNorthern);

    // Generate maintenance recommendations
    const maintenanceRecommendations = this.generateMaintenanceRecommendations(station);

    return {
      seasonalDemandForecast,
      weatherRiskForecast,
      maintenanceRecommendations
    };
  }

  private generateSeasonalDemandForecast(region: string, isNorthern: boolean): { month: string; demandMultiplier: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      let multiplier = 1.0; // Base demand
      
      if (region === 'Northern') {
        // Higher demand in winter months for Northern regions
        if (isNorthern && [11, 0, 1].includes(index)) multiplier = 1.3; // Dec, Jan, Feb
        if (isNorthern && [5, 6, 7].includes(index)) multiplier = 0.9; // Jun, Jul, Aug
      } else if (region === 'Equatorial') {
        // More consistent demand with slight variations
        multiplier = 0.95 + Math.sin((index / 12) * 2 * Math.PI) * 0.1;
      }
      
      return {
        month,
        demandMultiplier: Math.round(multiplier * 100) / 100
      };
    });
  }

  private generateWeatherRiskForecast(isEquatorial: boolean, isNorthern: boolean): { month: string; riskLevel: 'low' | 'medium' | 'high' }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      if (isEquatorial) {
        // Equatorial regions have wet/dry seasons
        if ([3, 4, 5, 6].includes(index)) riskLevel = 'high'; // Apr-Jul wet season
        else if ([7, 8, 9].includes(index)) riskLevel = 'medium'; // Aug-Oct transition
      } else if (isNorthern) {
        // Northern regions have summer rain/storms
        if ([5, 6, 7, 8].includes(index)) riskLevel = 'medium'; // Jun-Sep
      } else {
        // Southern regions (reversed seasons)
        if ([11, 0, 1, 2].includes(index)) riskLevel = 'medium'; // Dec-Mar
      }
      
      return { month, riskLevel };
    });
  }

  private generateMaintenanceRecommendations(station: GroundStationAnalytics): { period: string; focus: string; priority: string }[] {
    const recommendations = [];
    const weatherImpact = station.coverage_metrics.weather_impact_days_per_year;
    const utilization = station.utilization_metrics.current_utilization;

    // Quarterly antenna maintenance
    recommendations.push({
      period: 'Quarterly',
      focus: 'Antenna alignment and feed system inspection',
      priority: utilization > 80 ? 'High' : 'Medium'
    });

    // Weather-dependent maintenance
    if (weatherImpact > 30) {
      recommendations.push({
        period: 'Pre-wet season',
        focus: 'Weather sealing and drainage system check',
        priority: 'High'
      });
    }

    // High utilization maintenance
    if (utilization > 85) {
      recommendations.push({
        period: 'Monthly',
        focus: 'Cooling system and power amplifier monitoring',
        priority: 'High'
      });
    }

    // Annual comprehensive maintenance
    recommendations.push({
      period: 'Annual',
      focus: 'Complete system calibration and upgrade assessment',
      priority: 'Medium'
    });

    return recommendations;
  }

  private calculateAnalysisConfidence(
    station: GroundStationAnalytics,
    analysis: DataAnalysisResults
  ): number {
    let confidence = 0.6; // Base confidence for data analysis

    // Increase confidence based on data quality
    confidence += (analysis.dataQualityScore / 100) * 0.3;

    // Increase confidence based on historical data availability
    if (station.utilization_metrics.monthly_utilization_history.length >= 5) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generateAnalyticsRecommendations(analysis: DataAnalysisResults): string[] {
    const recommendations: string[] = [];

    // Data quality recommendations
    if (analysis.dataQualityScore < 80) {
      recommendations.push('Improve data collection processes to enhance analysis accuracy');
    }

    // Weather-related recommendations
    if (analysis.weatherCorrelation.rainFadeImpact > 15) {
      recommendations.push('Implement adaptive coding and modulation to mitigate rain fade');
    }

    // Terrain recommendations
    recommendations.push(...analysis.terrainAnalysis.mitigationRecommendations);

    // Predictive maintenance recommendations
    const highPriorityMaintenance = analysis.predictiveInsights.maintenanceRecommendations
      .filter(rec => rec.priority === 'High');
    
    if (highPriorityMaintenance.length > 0) {
      recommendations.push(`Priority maintenance required: ${highPriorityMaintenance[0].focus}`);
    }

    return recommendations;
  }

  private identifyDataWarnings(analysis: DataAnalysisResults): string[] {
    const warnings: string[] = [];

    // Data quality warnings
    if (analysis.dataQualityScore < 60) {
      warnings.push('Low data quality may impact analysis reliability');
    }

    // Weather risk warnings
    if (analysis.weatherCorrelation.rainFadeImpact > 20) {
      warnings.push('High weather risk may affect service availability');
    }

    // Terrain warnings
    if (analysis.terrainAnalysis.obstructionRisk === 'high') {
      warnings.push('Significant terrain obstructions may impact coverage');
    }

    // Correlation warnings
    if (analysis.performanceCorrelations.utilizationVsWeather < -0.5) {
      warnings.push('Strong negative correlation between weather and utilization detected');
    }

    return warnings;
  }
}