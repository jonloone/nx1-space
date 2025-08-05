/**
 * Terrain Data Types and Interfaces
 * Defines structures for elevation data, viewshed analysis, and terrain-based metrics
 */

export interface TerrainPoint {
  latitude: number;
  longitude: number;
  elevation: number; // meters above sea level
  accuracy?: number; // meters
  source?: 'SRTM' | 'ASTER' | 'ALOS' | 'synthetic';
}

export interface TerrainTile {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  resolution: number; // arc seconds
  data: number[][]; // elevation grid
  metadata: {
    source: string;
    timestamp: string;
    version: string;
  };
}

export interface ViewshedAnalysis {
  observer: TerrainPoint;
  visible_area_km2: number;
  horizon_profile: HorizonPoint[];
  max_range_km: number;
  coverage_percentage: number;
  obstructions: TerrainObstruction[];
}

export interface HorizonPoint {
  azimuth: number; // degrees from north
  elevation_angle: number; // degrees above horizontal
  distance_km: number;
  obstruction_height: number; // meters
}

export interface TerrainObstruction {
  location: TerrainPoint;
  type: 'mountain' | 'ridge' | 'building' | 'vegetation';
  impact_severity: 'low' | 'medium' | 'high';
  affected_azimuths: [number, number]; // range of blocked azimuths
  signal_loss_db: number;
}

export interface TerrainMetrics {
  mean_elevation: number;
  elevation_variance: number;
  terrain_ruggedness_index: number;
  slope_average: number;
  aspect_distribution: AspectDistribution;
  elevation_percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export interface AspectDistribution {
  north: number; // 0-45, 315-360 degrees
  east: number; // 45-135 degrees
  south: number; // 135-225 degrees
  west: number; // 225-315 degrees
}

export interface TerrainCacheEntry {
  key: string;
  data: TerrainTile;
  timestamp: number;
  access_count: number;
  size_bytes: number;
}

export interface ElevationProfile {
  start_point: TerrainPoint;
  end_point: TerrainPoint;
  distance_km: number;
  points: TerrainPoint[];
  min_elevation: number;
  max_elevation: number;
  total_ascent: number;
  total_descent: number;
  line_of_sight: boolean;
  fresnel_zone_clearance: FresnelClearance[];
}

export interface FresnelClearance {
  distance_km: number;
  required_clearance_m: number;
  actual_clearance_m: number;
  clearance_ratio: number; // actual/required
  obstructed: boolean;
}

export interface SiteTerrainAssessment {
  location: TerrainPoint;
  terrain_metrics: TerrainMetrics;
  viewshed: ViewshedAnalysis;
  accessibility_score: number; // 0-100
  construction_difficulty: 'easy' | 'moderate' | 'difficult' | 'extreme';
  environmental_factors: EnvironmentalFactors;
  risk_assessment: TerrainRiskAssessment;
}

export interface EnvironmentalFactors {
  flood_risk: 'low' | 'medium' | 'high';
  landslide_risk: 'low' | 'medium' | 'high';
  seismic_zone: number; // 1-5
  wind_exposure: 'sheltered' | 'moderate' | 'exposed' | 'severe';
  solar_exposure_hours: number; // average daily
  precipitation_days: number; // annual
}

export interface TerrainRiskAssessment {
  overall_risk: 'low' | 'medium' | 'high';
  risk_factors: RiskFactor[];
  mitigation_cost_estimate: number;
  insurance_impact: number; // percentage increase
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  impact_description: string;
  mitigation_strategy: string;
}

export interface TerrainOptimizationParams {
  min_elevation_angle: number; // degrees
  max_acceptable_obstruction: number; // percentage
  preferred_aspects: ('north' | 'east' | 'south' | 'west')[];
  max_slope: number; // degrees
  min_visibility_km2: number;
  weight_factors: {
    elevation: number;
    visibility: number;
    accessibility: number;
    construction_cost: number;
    environmental_risk: number;
  };
}

export interface H3TerrainCell {
  h3_index: string;
  resolution: number;
  center: TerrainPoint;
  terrain_summary: TerrainMetrics;
  site_suitability_score: number;
  neighboring_cells: string[];
  coverage_potential: number;
}

export interface TerrainDataSource {
  name: string;
  type: 'SRTM' | 'ASTER' | 'ALOS' | 'OpenTopography' | 'MapBox';
  resolution: number; // meters
  coverage: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  api_endpoint?: string;
  authentication?: {
    type: 'api_key' | 'oauth' | 'none';
    credentials?: any;
  };
  rate_limits?: {
    requests_per_second: number;
    daily_quota: number;
  };
}

export interface TerrainProcessingConfig {
  cache_enabled: boolean;
  cache_ttl_hours: number;
  max_cache_size_mb: number;
  interpolation_method: 'bilinear' | 'bicubic' | 'nearest';
  coordinate_system: 'WGS84' | 'UTM';
  processing_resolution: number; // meters
  parallel_workers: number;
  quality_threshold: number; // 0-1
}

export interface TerrainMLFeatures {
  // Raw terrain features
  elevation_stats: {
    mean: number;
    std: number;
    skewness: number;
    kurtosis: number;
  };
  
  // Derived features
  terrain_complexity: number;
  viewshed_quality: number;
  accessibility_index: number;
  construction_cost_index: number;
  
  // Spatial features
  distance_to_infrastructure: number;
  distance_to_population_center: number;
  regional_terrain_similarity: number;
  
  // Temporal features
  seasonal_accessibility: number[];
  weather_impact_score: number;
  
  // Graph features
  connectivity_score: number;
  centrality_measure: number;
  redundancy_potential: number;
}

export interface TerrainPredictionResult {
  site_quality_score: number; // 0-100
  confidence_interval: [number, number];
  contributing_factors: Array<{
    factor: string;
    importance: number;
    value: number;
  }>;
  recommendations: string[];
  similar_successful_sites: Array<{
    location: TerrainPoint;
    similarity_score: number;
    performance_metrics: any;
  }>;
}