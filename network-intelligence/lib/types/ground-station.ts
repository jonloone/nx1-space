export interface GroundStationUtilizationMetrics {
  current_utilization: number; // 0-100%
  peak_utilization: number; // 0-100%
  average_utilization: number; // 0-100%
  utilization_trend: 'increasing' | 'decreasing' | 'stable';
  peak_hours: string[]; // e.g., ['08:00', '12:00', '18:00']
  low_utilization_hours: string[];
  monthly_utilization_history: Array<{
    month: string;
    utilization: number;
  }>;
}

export interface GroundStationCapacityMetrics {
  total_capacity_gbps: number;
  available_capacity_gbps: number;
  used_capacity_gbps: number;
  capacity_efficiency: number; // 0-100%
  bandwidth_by_service: Array<{
    service: string;
    allocated_gbps: number;
    utilization_percentage: number;
  }>;
  redundancy_level: number; // 0-100%
  upgrade_potential_gbps: number;
}

export interface GroundStationCoverageMetrics {
  coverage_area_km2: number;
  satellite_visibility_count: number;
  elevation_angles: {
    min: number;
    max: number;
    optimal_range: [number, number];
  };
  interference_zones: Array<{
    source: string;
    affected_area_km2: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  weather_impact_days_per_year: number;
  line_of_sight_obstructions: string[];
}

export interface GroundStationBusinessMetrics {
  monthly_revenue: number;
  revenue_per_gbps: number;
  revenue_per_antenna: number;
  operational_cost_monthly: number;
  maintenance_cost_monthly: number;
  profit_margin: number; // percentage
  customer_count: number;
  average_contract_value: number;
  contract_duration_avg_months: number;
  churn_rate: number; // percentage
  revenue_growth_rate: number; // percentage
  cost_per_gb_transferred: number;
  sla_compliance_rate: number; // percentage
}

export interface GroundStationROIMetrics {
  initial_investment: number;
  annual_roi_percentage: number;
  payback_period_months: number;
  net_present_value: number;
  internal_rate_of_return: number;
  break_even_point_months: number;
  expansion_investment_required: number;
  expansion_roi_projection: number;
}

export interface GroundStationGrowthOpportunity {
  opportunity_type: 'capacity_expansion' | 'new_services' | 'market_penetration' | 'geographic_expansion';
  priority_score: number; // 0-100
  investment_required: number;
  projected_revenue_increase: number;
  projected_roi: number;
  implementation_timeline_months: number;
  risk_factors: string[];
  market_demand_score: number; // 0-100
  competitive_advantage: string[];
  success_probability: number; // 0-100%
}

export interface GroundStationAnalytics {
  station_id: string;
  name: string;
  operator: string;
  location: {
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    timezone: string;
  };
  technical_specs: {
    primary_antenna_size_m: number;
    secondary_antennas: number;
    frequency_bands: string[];
    g_t_ratio_db: number;
    eirp_dbw: number;
    services_supported: string[];
  };
  utilization_metrics: GroundStationUtilizationMetrics;
  capacity_metrics: GroundStationCapacityMetrics;
  coverage_metrics: GroundStationCoverageMetrics;
  business_metrics: GroundStationBusinessMetrics;
  roi_metrics: GroundStationROIMetrics;
  growth_opportunities: GroundStationGrowthOpportunity[];
  health_score: number; // 0-100
  investment_recommendation: 'excellent' | 'good' | 'moderate' | 'poor';
  last_updated: string;
}

export interface RegionalPerformance {
  region: string;
  total_stations: number;
  average_utilization: number;
  total_revenue: number;
  average_roi: number;
  growth_rate: number;
  market_penetration: number;
  competitive_position: 'leader' | 'challenger' | 'follower' | 'niche';
  key_opportunities: string[];
  risk_factors: string[];
}

export interface NetworkHealthMetrics {
  overall_network_utilization: number;
  total_capacity_gbps: number;
  active_stations: number;
  offline_stations: number;
  maintenance_required: number;
  average_sla_compliance: number;
  total_monthly_revenue: number;
  network_efficiency_score: number;
  redundancy_coverage: number;
  critical_gaps: Array<{
    location: [number, number];
    gap_size_km: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface MarketExpansionOpportunity {
  location: {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
  };
  market_size: number;
  competition_level: 'low' | 'medium' | 'high';
  regulatory_complexity: 'low' | 'medium' | 'high';
  infrastructure_readiness: number; // 0-100
  demand_forecast: number;
  investment_required: number;
  roi_projection: number;
  strategic_importance: number; // 0-100
  risk_score: number; // 0-100
}

export interface TLEData {
  satellite_name: string;
  line1: string;
  line2: string;
  epoch: string;
  inclination: number;
  raan: number; // Right Ascension of Ascending Node
  eccentricity: number;
  argument_of_perigee: number;
  mean_anomaly: number;
  mean_motion: number;
  revolution_number: number;
  last_updated: string;
}

export interface SatelliteTrackingData {
  satellite_id: string;
  tle: TLEData;
  current_position: {
    latitude: number;
    longitude: number;
    altitude_km: number;
  };
  ground_track: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  visibility_windows: Array<{
    station_id: string;
    aos: string; // Acquisition of Signal
    los: string; // Loss of Signal
    max_elevation: number;
    duration_minutes: number;
  }>;
}