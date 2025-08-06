/**
 * Advanced Heatmap Analysis System
 * Provides multiple analysis modes for business intelligence visualization
 */

import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { OpportunityFilters } from '@/components/opportunity-controls';

export enum AnalysisMode {
  UTILIZATION = 'utilization',
  PROFIT = 'profit',
  GROWTH_OPPORTUNITY = 'growth_opportunity'
}

export interface HeatmapDataPoint {
  position: [number, number]; // [longitude, latitude]
  weight: number; // 0-100
  metadata: {
    stationId: string;
    name: string;
    utilization: number;
    profitMargin: number;
    revenue: number;
    opportunityScore: number;
    capacityGbps: number;
  };
}

export interface HeatmapConfiguration {
  radiusPixels: number;
  intensity: number;
  threshold: number;
  colorRange: [number, number, number, number][];
  colorDomain?: [number, number];
  aggregation: 'SUM' | 'MEAN';
}

export interface TerrainConfiguration {
  elevationSource: string;
  textureSource: string;
  elevationDecoder: {
    rScaler: number;
    gScaler: number;
    bScaler: number;
    offset: number;
  };
  meshMaxError: number;
}

export class HeatmapAnalysisEngine {
  private stations: GroundStationAnalytics[];
  private filters: OpportunityFilters;
  private analysisMode: AnalysisMode;

  constructor(
    stations: GroundStationAnalytics[], 
    filters: OpportunityFilters,
    mode: AnalysisMode = AnalysisMode.UTILIZATION
  ) {
    this.stations = stations;
    this.filters = filters;
    this.analysisMode = mode;
  }

  /**
   * Generate heatmap data based on current analysis mode and filters
   */
  generateHeatmapData(): HeatmapDataPoint[] {
    const filteredStations = this.filterStations();
    
    return filteredStations.map(station => {
      const weight = this.calculateWeight(station);
      
      return {
        position: [station.location.longitude, station.location.latitude],
        weight,
        metadata: {
          stationId: station.station_id,
          name: station.name,
          utilization: station.utilization_metrics.current_utilization,
          profitMargin: station.business_metrics.profit_margin,
          revenue: station.business_metrics.monthly_revenue,
          opportunityScore: this.calculateOpportunityScore(station),
          capacityGbps: station.capacity_metrics.total_capacity_gbps
        }
      };
    });
  }

  /**
   * Filter stations based on current filter settings
   */
  private filterStations(): GroundStationAnalytics[] {
    return this.stations.filter(station => {
      const utilization = station.utilization_metrics.current_utilization;
      const profitMargin = station.business_metrics.profit_margin;
      const revenue = station.business_metrics.monthly_revenue;

      return (
        utilization >= this.filters.utilizationRange[0] &&
        utilization <= this.filters.utilizationRange[1] &&
        profitMargin >= this.filters.profitMarginRange[0] &&
        profitMargin <= this.filters.profitMarginRange[1] &&
        revenue >= this.filters.revenueRange[0] &&
        revenue <= this.filters.revenueRange[1]
      );
    });
  }

  /**
   * Calculate weight based on analysis mode
   */
  private calculateWeight(station: GroundStationAnalytics): number {
    switch (this.analysisMode) {
      case AnalysisMode.UTILIZATION:
        return this.calculateUtilizationWeight(station);
      
      case AnalysisMode.PROFIT:
        return this.calculateProfitWeight(station);
      
      case AnalysisMode.GROWTH_OPPORTUNITY:
        return this.calculateOpportunityWeight(station);
      
      default:
        return 50;
    }
  }

  /**
   * Calculate utilization-based weight
   * High weight = high utilization (busy areas)
   */
  private calculateUtilizationWeight(station: GroundStationAnalytics): number {
    const utilization = station.utilization_metrics.current_utilization;
    const peakUtilization = station.utilization_metrics.peak_utilization;
    
    // Consider both current and peak utilization
    const baseWeight = utilization * 0.7 + peakUtilization * 0.3;
    
    // Apply opportunity weight adjustment
    const opportunityAdjustment = this.filters.opportunityWeight / 100;
    
    if (this.filters.showFutureOpportunities) {
      // For opportunities, invert the weight (low utilization = high opportunity)
      return (100 - baseWeight) * opportunityAdjustment + baseWeight * (1 - opportunityAdjustment);
    }
    
    return baseWeight;
  }

  /**
   * Calculate profit-based weight
   * High weight = high profit margin areas
   */
  private calculateProfitWeight(station: GroundStationAnalytics): number {
    const profitMargin = station.business_metrics.profit_margin;
    const revenue = station.business_metrics.monthly_revenue;
    const roi = station.roi_metrics.annual_roi_percentage;
    
    // Normalize revenue to 0-100 scale (assuming max revenue of 1M)
    const normalizedRevenue = Math.min(100, (revenue / 1000000) * 100);
    
    // Combined profit score
    let weight = (profitMargin * 0.5 + normalizedRevenue * 0.3 + roi * 0.2);
    
    // Apply capacity efficiency bonus
    const efficiency = station.capacity_metrics.capacity_efficiency;
    if (efficiency > 80) {
      weight *= 1.2; // 20% bonus for highly efficient stations
    }
    
    return Math.min(100, weight);
  }

  /**
   * Calculate growth opportunity weight
   * High weight = high growth potential
   */
  private calculateOpportunityWeight(station: GroundStationAnalytics): number {
    const opportunityScore = this.calculateOpportunityScore(station);
    const opportunityAdjustment = this.filters.opportunityWeight / 100;
    
    // Blend current performance with opportunity score
    const currentPerformance = (station.utilization_metrics.current_utilization + 
                               station.business_metrics.profit_margin) / 2;
    
    return opportunityScore * opportunityAdjustment + 
           currentPerformance * (1 - opportunityAdjustment);
  }

  /**
   * Calculate comprehensive opportunity score
   */
  private calculateOpportunityScore(station: GroundStationAnalytics): number {
    const opportunities = station.growth_opportunities;
    
    if (!opportunities || opportunities.length === 0) {
      return this.calculateImplicitOpportunityScore(station);
    }
    
    // Average priority scores of all opportunities
    const avgPriority = opportunities.reduce((sum, opp) => sum + opp.priority_score, 0) / opportunities.length;
    
    // Consider market demand and success probability
    const avgDemand = opportunities.reduce((sum, opp) => sum + (opp.market_demand_score || 50), 0) / opportunities.length;
    const avgSuccess = opportunities.reduce((sum, opp) => sum + opp.success_probability, 0) / opportunities.length;
    
    return (avgPriority * 0.5 + avgDemand * 0.3 + avgSuccess * 0.2);
  }

  /**
   * Calculate implicit opportunity score when explicit opportunities are not defined
   */
  private calculateImplicitOpportunityScore(station: GroundStationAnalytics): number {
    let score = 50; // Base score
    
    // Low utilization + high profit margin = expansion opportunity
    if (station.utilization_metrics.current_utilization < 40 && 
        station.business_metrics.profit_margin > 30) {
      score += 30;
    }
    
    // High demand variability = optimization opportunity
    const utilizationVariance = Math.abs(
      station.utilization_metrics.peak_utilization - 
      station.utilization_metrics.current_utilization
    );
    if (utilizationVariance > 40) {
      score += 10;
    }
    
    // Available capacity = growth opportunity
    const availableCapacity = station.capacity_metrics.available_capacity_gbps;
    const totalCapacity = station.capacity_metrics.total_capacity_gbps;
    const capacityRatio = availableCapacity / totalCapacity;
    
    if (capacityRatio > 0.5) {
      score += 15;
    }
    
    // Geographic strategic importance (simplified)
    const strategicRegions = ['USA', 'Europe', 'Asia-Pacific', 'Middle East'];
    if (strategicRegions.includes(station.location.region)) {
      score += 5;
    }
    
    return Math.min(100, score);
  }

  /**
   * Get heatmap configuration based on zoom level and analysis mode
   */
  getHeatmapConfig(zoomLevel: number): HeatmapConfiguration {
    const baseConfig: HeatmapConfiguration = {
      radiusPixels: 30,
      intensity: 1,
      threshold: 0.05,
      colorRange: this.getColorRange(),
      aggregation: 'SUM'
    };

    // Adjust radius based on zoom level
    if (zoomLevel < 6) {
      baseConfig.radiusPixels = 100;
      baseConfig.intensity = 2;
    } else if (zoomLevel < 10) {
      baseConfig.radiusPixels = 60;
      baseConfig.intensity = 1.5;
    } else if (zoomLevel < 14) {
      baseConfig.radiusPixels = 40;
      baseConfig.intensity = 1.2;
    }

    // Adjust based on analysis mode
    switch (this.analysisMode) {
      case AnalysisMode.UTILIZATION:
        baseConfig.colorDomain = [0, 100];
        break;
      
      case AnalysisMode.PROFIT:
        baseConfig.colorDomain = [0, 50]; // Profit margin scale
        baseConfig.aggregation = 'MEAN';
        break;
      
      case AnalysisMode.GROWTH_OPPORTUNITY:
        baseConfig.colorDomain = [0, 100];
        baseConfig.intensity *= 1.2; // Make opportunities more visible
        break;
    }

    return baseConfig;
  }

  /**
   * Get color range based on analysis mode
   */
  private getColorRange(): [number, number, number, number][] {
    switch (this.analysisMode) {
      case AnalysisMode.UTILIZATION:
        // Blue (low) -> Green (optimal) -> Yellow (high) -> Red (critical)
        return [
          [59, 130, 246, 100],   // Blue - underutilized
          [34, 197, 94, 120],    // Green - optimal
          [234, 179, 8, 140],    // Yellow - high utilization
          [239, 68, 68, 160],    // Red - over capacity
        ];
      
      case AnalysisMode.PROFIT:
        // Red (loss) -> Yellow (low) -> Green (good) -> Blue (excellent)
        return [
          [239, 68, 68, 100],    // Red - negative/low margin
          [234, 179, 8, 120],    // Yellow - moderate margin
          [34, 197, 94, 140],    // Green - good margin
          [59, 130, 246, 160],   // Blue - excellent margin
          [147, 51, 234, 180],   // Purple - exceptional
        ];
      
      case AnalysisMode.GROWTH_OPPORTUNITY:
        // Cool (low) -> Warm (high opportunity)
        return [
          [94, 234, 212, 100],   // Teal - low opportunity
          [59, 130, 246, 120],   // Blue - some opportunity
          [234, 179, 8, 140],    // Yellow - good opportunity
          [251, 146, 60, 160],   // Orange - high opportunity
          [239, 68, 68, 180],    // Red - critical opportunity
        ];
      
      default:
        return [
          [255, 255, 178, 100],
          [254, 217, 118, 120],
          [254, 178, 76, 140],
          [253, 141, 60, 160],
          [240, 59, 32, 180],
        ];
    }
  }

  /**
   * Update analysis mode
   */
  setAnalysisMode(mode: AnalysisMode): void {
    this.analysisMode = mode;
  }

  /**
   * Update filters
   */
  setFilters(filters: OpportunityFilters): void {
    this.filters = filters;
  }

  /**
   * Get terrain configuration for detailed views
   */
  static getTerrainConfig(): TerrainConfiguration {
    return {
      elevationSource: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      textureSource: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 4.0 // meters
    };
  }

  /**
   * Calculate statistics for current filtered data
   */
  getStatistics(): {
    totalStations: number;
    avgUtilization: number;
    avgProfitMargin: number;
    totalRevenue: number;
    highOpportunityCount: number;
  } {
    const filtered = this.filterStations();
    
    if (filtered.length === 0) {
      return {
        totalStations: 0,
        avgUtilization: 0,
        avgProfitMargin: 0,
        totalRevenue: 0,
        highOpportunityCount: 0
      };
    }

    const totalRevenue = filtered.reduce((sum, s) => sum + s.business_metrics.monthly_revenue, 0);
    const avgUtilization = filtered.reduce((sum, s) => sum + s.utilization_metrics.current_utilization, 0) / filtered.length;
    const avgProfitMargin = filtered.reduce((sum, s) => sum + s.business_metrics.profit_margin, 0) / filtered.length;
    
    const highOpportunityCount = filtered.filter(s => 
      this.calculateOpportunityScore(s) > 70
    ).length;

    return {
      totalStations: filtered.length,
      avgUtilization,
      avgProfitMargin,
      totalRevenue,
      highOpportunityCount
    };
  }
}

/**
 * Business Intelligence color schemes
 */
export const BusinessIntelligenceColors = {
  // Performance indicators
  excellent: [59, 130, 246],    // Blue
  good: [34, 197, 94],          // Green
  warning: [234, 179, 8],       // Yellow
  critical: [239, 68, 68],      // Red
  
  // Opportunity indicators
  highOpportunity: [251, 146, 60],  // Orange
  mediumOpportunity: [234, 179, 8], // Yellow
  lowOpportunity: [94, 234, 212],   // Teal
  
  // Profit indicators
  highProfit: [147, 51, 234],   // Purple
  goodProfit: [59, 130, 246],   // Blue
  moderateProfit: [34, 197, 94], // Green
  lowProfit: [234, 179, 8],     // Yellow
  negativeProfit: [239, 68, 68], // Red
};

/**
 * Helper function to interpolate colors
 */
export function interpolateColor(value: number, min: number, max: number, colors: number[][]): number[] {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const index = normalized * (colors.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  
  if (lowerIndex === upperIndex) {
    return colors[lowerIndex];
  }
  
  const fraction = index - lowerIndex;
  const lowerColor = colors[lowerIndex];
  const upperColor = colors[upperIndex];
  
  return [
    Math.round(lowerColor[0] + (upperColor[0] - lowerColor[0]) * fraction),
    Math.round(lowerColor[1] + (upperColor[1] - lowerColor[1]) * fraction),
    Math.round(lowerColor[2] + (upperColor[2] - lowerColor[2]) * fraction),
    Math.round((lowerColor[3] || 255) + ((upperColor[3] || 255) - (lowerColor[3] || 255)) * fraction)
  ];
}