/**
 * Real SES and Intelsat Ground Station Network Data
 * Based on actual teleport and gateway locations
 */

import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface RealGroundStation {
  name: string;
  location: [number, number]; // [latitude, longitude]
  country: string;
  type: 'Primary Teleport' | 'Teleport' | 'Regional' | 'O3b Gateway';
  operator: 'SES' | 'Intelsat';
}

export const SES_GROUND_STATIONS: RealGroundStation[] = [
  // Primary Teleports
  { name: 'Betzdorf', location: [49.6847, 6.3501], country: 'Luxembourg', type: 'Primary Teleport', operator: 'SES' },
  { name: 'Manassas VA', location: [38.7509, -77.4753], country: 'USA', type: 'Primary Teleport', operator: 'SES' },
  { name: 'Woodbine MD', location: [39.3365, -77.0647], country: 'USA', type: 'Primary Teleport', operator: 'SES' },
  
  // Teleports
  { name: 'Vernon Valley NJ', location: [41.2459, -74.4860], country: 'USA', type: 'Teleport', operator: 'SES' },
  { name: 'Hawley PA', location: [41.4764, -75.1807], country: 'USA', type: 'Teleport', operator: 'SES' },
  { name: 'Castle Rock CO', location: [39.3722, -104.8561], country: 'USA', type: 'Teleport', operator: 'SES' },
  { name: 'Brewster WA', location: [48.0976, -119.7806], country: 'USA', type: 'Teleport', operator: 'SES' },
  
  // Regional Facilities
  { name: 'Stockholm', location: [59.3293, 18.0686], country: 'Sweden', type: 'Regional', operator: 'SES' },
  { name: 'Bucharest', location: [44.4268, 26.1025], country: 'Romania', type: 'Regional', operator: 'SES' },
  { name: 'Munich', location: [48.1351, 11.5820], country: 'Germany', type: 'Regional', operator: 'SES' },
  { name: 'Gibraltar', location: [36.1408, -5.3536], country: 'Gibraltar', type: 'Regional', operator: 'SES' },
  { name: 'Napa CA', location: [38.2975, -122.2869], country: 'USA', type: 'Regional', operator: 'SES' },
  
  // O3b/MEO Ground Stations
  { name: 'Perth', location: [-31.9505, 115.8605], country: 'Australia', type: 'O3b Gateway', operator: 'SES' },
  { name: 'Hawaii', location: [21.3099, -157.8581], country: 'USA', type: 'O3b Gateway', operator: 'SES' },
  { name: 'Brazil Teleport', location: [-23.5505, -46.6333], country: 'Brazil', type: 'O3b Gateway', operator: 'SES' },
];

export const INTELSAT_GROUND_STATIONS: RealGroundStation[] = [
  // Primary US Facilities
  { name: 'Riverside CA', location: [33.9533, -117.3962], country: 'USA', type: 'Primary Teleport', operator: 'Intelsat' },
  { name: 'Mountainside MD', location: [39.6837, -77.3644], country: 'USA', type: 'Primary Teleport', operator: 'Intelsat' },
  { name: 'Atlanta GA', location: [33.7490, -84.3880], country: 'USA', type: 'Primary Teleport', operator: 'Intelsat' },
  { name: 'Fuchsstadt', location: [50.1069, 10.0339], country: 'Germany', type: 'Primary Teleport', operator: 'Intelsat' },
  { name: 'Kumsan', location: [36.1036, 127.4897], country: 'South Korea', type: 'Primary Teleport', operator: 'Intelsat' },
  
  // Regional Teleports
  { name: 'Hagerstown MD', location: [39.6418, -77.7200], country: 'USA', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Ellenwood GA', location: [33.6315, -84.2649], country: 'USA', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Napa CA', location: [38.5025, -122.3369], country: 'USA', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Castle Rock CO', location: [39.3844, -104.8689], country: 'USA', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Paumalu Hawaii', location: [21.6753, -158.0331], country: 'USA', type: 'Teleport', operator: 'Intelsat' },
  
  // International Facilities
  { name: 'Perth', location: [-31.8026, 115.8838], country: 'Australia', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Johannesburg', location: [-26.2041, 28.0473], country: 'South Africa', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Buenos Aires', location: [-34.6037, -58.3816], country: 'Argentina', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Mexico City', location: [19.4326, -99.1332], country: 'Mexico', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Singapore', location: [1.3521, 103.8198], country: 'Singapore', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Beijing', location: [39.9042, 116.4074], country: 'China', type: 'Teleport', operator: 'Intelsat' },
  { name: 'Mumbai', location: [19.0760, 72.8777], country: 'India', type: 'Teleport', operator: 'Intelsat' },
];

export const ALL_REAL_STATIONS = [...SES_GROUND_STATIONS, ...INTELSAT_GROUND_STATIONS];

/**
 * Ground Station Data Enrichment Service
 * Converts real station locations into full analytics data
 */
export class GroundStationEnrichmentService {
  private weatherPatterns: { [key: string]: { rainFade: number; availability: number } } = {
    'USA': { rainFade: 8, availability: 0.92 },
    'Luxembourg': { rainFade: 12, availability: 0.88 },
    'Germany': { rainFade: 10, availability: 0.90 },
    'Sweden': { rainFade: 15, availability: 0.85 },
    'Romania': { rainFade: 8, availability: 0.92 },
    'Gibraltar': { rainFade: 5, availability: 0.95 },
    'Australia': { rainFade: 20, availability: 0.80 },
    'Brazil': { rainFade: 45, availability: 0.55 },
    'South Korea': { rainFade: 25, availability: 0.75 },
    'South Africa': { rainFade: 35, availability: 0.65 },
    'Argentina': { rainFade: 18, availability: 0.82 },
    'Mexico': { rainFade: 30, availability: 0.70 },
    'Singapore': { rainFade: 50, availability: 0.50 },
    'China': { rainFade: 28, availability: 0.72 },
    'India': { rainFade: 40, availability: 0.60 }
  };

  private marketData: { [key: string]: { gdpPerCapita: number; businessDensity: number; satellitePenetration: number } } = {
    'USA': { gdpPerCapita: 65000, businessDensity: 92, satellitePenetration: 25 },
    'Luxembourg': { gdpPerCapita: 115000, businessDensity: 95, satellitePenetration: 30 },
    'Germany': { gdpPerCapita: 46000, businessDensity: 88, satellitePenetration: 18 },
    'Sweden': { gdpPerCapita: 51000, businessDensity: 85, satellitePenetration: 22 },
    'Romania': { gdpPerCapita: 12000, businessDensity: 65, satellitePenetration: 8 },
    'Gibraltar': { gdpPerCapita: 45000, businessDensity: 90, satellitePenetration: 35 },
    'Australia': { gdpPerCapita: 52000, businessDensity: 78, satellitePenetration: 28 },
    'Brazil': { gdpPerCapita: 9000, businessDensity: 55, satellitePenetration: 6 },
    'South Korea': { gdpPerCapita: 32000, businessDensity: 82, satellitePenetration: 20 },
    'South Africa': { gdpPerCapita: 6000, businessDensity: 45, satellitePenetration: 12 },
    'Argentina': { gdpPerCapita: 10000, businessDensity: 50, satellitePenetration: 8 },
    'Mexico': { gdpPerCapita: 10000, businessDensity: 58, satellitePenetration: 10 },
    'Singapore': { gdpPerCapita: 60000, businessDensity: 95, satellitePenetration: 40 },
    'China': { gdpPerCapita: 11000, businessDensity: 70, satellitePenetration: 15 },
    'India': { gdpPerCapita: 2100, businessDensity: 35, satellitePenetration: 3 }
  };

  /**
   * Enrich real ground station with synthetic operational data
   */
  enrichGroundStation(realStation: RealGroundStation): GroundStationAnalytics {
    const stationId = this.generateStationId(realStation);
    const utilization = this.estimateUtilization(realStation);
    const technicalSpecs = this.generateTechnicalSpecs(realStation);
    const capacityMetrics = this.generateCapacityMetrics(realStation, utilization);
    const coverageMetrics = this.generateCoverageMetrics(realStation);
    const businessMetrics = this.generateBusinessMetrics(realStation, utilization, capacityMetrics);
    const roiMetrics = this.generateROIMetrics(realStation, businessMetrics);

    return {
      station_id: stationId,
      name: realStation.name,
      operator: realStation.operator,
      location: {
        latitude: realStation.location[0],
        longitude: realStation.location[1],
        country: realStation.country,
        region: this.getRegion(realStation.location[0]),
        timezone: this.getTimezone(realStation.country)
      },
      technical_specs: technicalSpecs,
      utilization_metrics: {
        current_utilization: utilization.current,
        peak_utilization: utilization.peak,
        average_utilization: utilization.average,
        utilization_trend: utilization.trend,
        peak_hours: this.getPeakHours(realStation.country),
        low_utilization_hours: this.getLowHours(),
        monthly_utilization_history: this.generateUtilizationHistory(utilization.current)
      },
      capacity_metrics: capacityMetrics,
      coverage_metrics: coverageMetrics,
      business_metrics: businessMetrics,
      roi_metrics: roiMetrics,
      growth_opportunities: [],
      health_score: this.calculateHealthScore(utilization, businessMetrics, coverageMetrics),
      investment_recommendation: this.getInvestmentRecommendation(businessMetrics.profit_margin, roiMetrics.annual_roi_percentage),
      last_updated: new Date().toISOString()
    };
  }

  private generateStationId(station: RealGroundStation): string {
    const prefix = station.operator === 'SES' ? 'SES' : 'INTEL';
    const hash = station.name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `${prefix}-${hash}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private estimateUtilization(station: RealGroundStation): {
    current: number;
    peak: number;
    average: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  } {
    // Base utilization by facility type
    const baseUtilization = {
      'Primary Teleport': 82,
      'Teleport': 68,
      'Regional': 55,
      'O3b Gateway': 73
    };

    let util = baseUtilization[station.type];

    // Adjust for location factors
    if (station.country === 'USA') util *= 1.08; // Higher demand in US
    if (station.country === 'Luxembourg') util *= 1.12; // Financial hub
    if (station.country === 'Singapore') util *= 1.10; // Asian hub
    if (station.location[0] < -23.5 || station.location[0] > 23.5) {
      // Tropical regions
      if (station.country === 'Brazil' || station.country === 'India') {
        util *= 0.85; // Weather impact in developing tropical markets
      }
    }

    // Weather impact
    const weather = this.weatherPatterns[station.country] || { availability: 0.90 };
    util *= weather.availability;

    // Add realistic variation
    util += (Math.random() - 0.5) * 8; // ±4% variation

    const current = Math.max(25, Math.min(95, Math.round(util)));
    const peak = Math.min(98, current + Math.floor(Math.random() * 15) + 5);
    const average = Math.max(current - 8, Math.round(current * 0.88));

    // Determine trend based on market conditions
    const market = this.marketData[station.country];
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (market && market.gdpPerCapita > 40000 && market.satellitePenetration < 25) {
      trend = 'increasing';
    } else if (market && market.gdpPerCapita < 8000) {
      trend = Math.random() > 0.7 ? 'increasing' : 'stable';
    }

    return { current, peak, average, trend };
  }

  private generateTechnicalSpecs(station: RealGroundStation): any {
    const specs = {
      'Primary Teleport': {
        primary_antenna_size_m: 15 + Math.floor(Math.random() * 5), // 15-19m
        secondary_antennas: 4 + Math.floor(Math.random() * 3), // 4-6
        frequency_bands: ['C-band', 'Ku-band', 'Ka-band'],
        g_t_ratio_db: 41.5 + Math.random() * 3, // 41.5-44.5
        eirp_dbw: 55.0 + Math.random() * 4, // 55-59
        services_supported: ['DTH', 'Enterprise', 'Government', 'HTS', 'Maritime', 'Broadcast']
      },
      'Teleport': {
        primary_antenna_size_m: 11 + Math.floor(Math.random() * 4), // 11-14m
        secondary_antennas: 2 + Math.floor(Math.random() * 3), // 2-4
        frequency_bands: ['C-band', 'Ku-band', 'Ka-band'],
        g_t_ratio_db: 38.5 + Math.random() * 3, // 38.5-41.5
        eirp_dbw: 52.0 + Math.random() * 3, // 52-55
        services_supported: ['DTH', 'Enterprise', 'Government', 'HTS']
      },
      'Regional': {
        primary_antenna_size_m: 7 + Math.floor(Math.random() * 4), // 7-10m
        secondary_antennas: 1 + Math.floor(Math.random() * 2), // 1-2
        frequency_bands: ['C-band', 'Ku-band'],
        g_t_ratio_db: 35.0 + Math.random() * 3, // 35-38
        eirp_dbw: 48.0 + Math.random() * 3, // 48-51
        services_supported: ['DTH', 'Enterprise', 'Broadcast']
      },
      'O3b Gateway': {
        primary_antenna_size_m: 13 + Math.floor(Math.random() * 3), // 13-15m
        secondary_antennas: 3 + Math.floor(Math.random() * 2), // 3-4
        frequency_bands: ['Ka-band', 'Ku-band'],
        g_t_ratio_db: 40.0 + Math.random() * 2, // 40-42
        eirp_dbw: 54.0 + Math.random() * 3, // 54-57
        services_supported: ['HTS', 'Enterprise', 'Maritime', 'Government']
      }
    };

    return specs[station.type];
  }

  private generateCapacityMetrics(station: RealGroundStation, utilization: any): any {
    const capacityByType = {
      'Primary Teleport': 180 + Math.floor(Math.random() * 70), // 180-250 Gbps
      'Teleport': 120 + Math.floor(Math.random() * 60), // 120-180 Gbps
      'Regional': 60 + Math.floor(Math.random() * 40), // 60-100 Gbps
      'O3b Gateway': 200 + Math.floor(Math.random() * 100) // 200-300 Gbps (HTS)
    };

    const totalCapacity = capacityByType[station.type];
    const usedCapacity = Math.round(totalCapacity * utilization.current / 100);
    const availableCapacity = totalCapacity - usedCapacity;
    const efficiency = Math.round(85 + Math.random() * 10); // 85-95%

    // Generate service breakdown
    const services = this.generateServiceBreakdown(station, usedCapacity);

    return {
      total_capacity_gbps: totalCapacity,
      available_capacity_gbps: availableCapacity,
      used_capacity_gbps: usedCapacity,
      capacity_efficiency: efficiency,
      bandwidth_by_service: services,
      redundancy_level: Math.round(88 + Math.random() * 10), // 88-98%
      upgrade_potential_gbps: Math.round(totalCapacity * 0.4)
    };
  }

  private generateServiceBreakdown(station: RealGroundStation, totalUsed: number): any[] {
    const services = [];
    let remaining = totalUsed;

    if (station.type === 'Primary Teleport') {
      // Complex service mix for primary teleports
      services.push({
        service: 'Enterprise',
        allocated_gbps: Math.round(totalUsed * 0.35),
        utilization_percentage: 88 + Math.floor(Math.random() * 8)
      });
      services.push({
        service: 'DTH',
        allocated_gbps: Math.round(totalUsed * 0.25),
        utilization_percentage: 92 + Math.floor(Math.random() * 6)
      });
      services.push({
        service: 'Government',
        allocated_gbps: Math.round(totalUsed * 0.20),
        utilization_percentage: 78 + Math.floor(Math.random() * 12)
      });
      services.push({
        service: 'HTS',
        allocated_gbps: Math.round(totalUsed * 0.20),
        utilization_percentage: 85 + Math.floor(Math.random() * 10)
      });
    } else if (station.type === 'O3b Gateway') {
      // MEO-focused services
      services.push({
        service: 'HTS',
        allocated_gbps: Math.round(totalUsed * 0.50),
        utilization_percentage: 90 + Math.floor(Math.random() * 8)
      });
      services.push({
        service: 'Enterprise',
        allocated_gbps: Math.round(totalUsed * 0.30),
        utilization_percentage: 85 + Math.floor(Math.random() * 10)
      });
      services.push({
        service: 'Maritime',
        allocated_gbps: Math.round(totalUsed * 0.20),
        utilization_percentage: 82 + Math.floor(Math.random() * 12)
      });
    } else {
      // Standard teleport/regional mix
      services.push({
        service: 'Enterprise',
        allocated_gbps: Math.round(totalUsed * 0.40),
        utilization_percentage: 80 + Math.floor(Math.random() * 15)
      });
      services.push({
        service: 'DTH',
        allocated_gbps: Math.round(totalUsed * 0.35),
        utilization_percentage: 85 + Math.floor(Math.random() * 10)
      });
      services.push({
        service: 'Government',
        allocated_gbps: Math.round(totalUsed * 0.25),
        utilization_percentage: 75 + Math.floor(Math.random() * 15)
      });
    }

    return services;
  }

  private generateCoverageMetrics(station: RealGroundStation): any {
    const coverageByRegion: { [key: string]: { area: number; satellites: number; weather: number } } = {
      'USA': { area: 9000000, satellites: 14, weather: 15 },
      'Luxembourg': { area: 8500000, satellites: 15, weather: 12 },
      'Germany': { area: 8500000, satellites: 15, weather: 10 },
      'Australia': { area: 12000000, satellites: 12, weather: 20 },
      'Brazil': { area: 11000000, satellites: 10, weather: 45 },
      'Singapore': { area: 8000000, satellites: 13, weather: 50 }
    };

    const coverage = coverageByRegion[station.country] || { area: 7000000, satellites: 11, weather: 25 };

    // Generate interference zones based on location
    const interferenceZones = this.generateInterferenceZones(station);

    return {
      coverage_area_km2: coverage.area + Math.floor(Math.random() * 1000000),
      satellite_visibility_count: coverage.satellites + Math.floor(Math.random() * 4) - 2,
      elevation_angles: { min: 5, max: 90, optimal_range: [15, 75] },
      interference_zones: interferenceZones,
      weather_impact_days_per_year: coverage.weather + Math.floor(Math.random() * 10),
      line_of_sight_obstructions: this.generateObstructions(station)
    };
  }

  private generateInterferenceZones(station: RealGroundStation): any[] {
    const zones = [];
    
    // Urban interference
    const urbanCountries = ['USA', 'Germany', 'South Korea', 'Singapore', 'China'];
    if (urbanCountries.includes(station.country)) {
      zones.push({
        source: 'Urban development',
        affected_area_km2: 100 + Math.floor(Math.random() * 200),
        severity: 'medium'
      });
    }

    // Tropical interference
    const tropicalCountries = ['Brazil', 'Singapore', 'India', 'Mexico'];
    if (tropicalCountries.includes(station.country)) {
      zones.push({
        source: 'Atmospheric conditions',
        affected_area_km2: 200 + Math.floor(Math.random() * 300),
        severity: 'high'
      });
    }

    return zones;
  }

  private generateObstructions(station: RealGroundStation): string[] {
    const obstructions = [];
    
    // Geographic obstructions
    if (station.name.includes('Mountain') || station.country === 'Gibraltar') {
      obstructions.push('Mountain ranges to the south');
    }
    
    if (['Munich', 'Beijing', 'Mexico City'].includes(station.name)) {
      obstructions.push('Urban development');
    }
    
    if (station.location[0] > 55) { // Northern locations
      obstructions.push('Seasonal atmospheric effects');
    }

    return obstructions;
  }

  private generateBusinessMetrics(station: RealGroundStation, utilization: any, capacity: any): any {
    const market = this.marketData[station.country] || { gdpPerCapita: 25000, businessDensity: 60 };
    
    // Revenue calculation based on capacity and location
    const revenuePerGbps = this.calculateRevenuePerGbps(station, market);
    const monthlyRevenue = Math.round(capacity.used_capacity_gbps * revenuePerGbps);
    
    // Cost calculation
    const costs = this.calculateOperationalCosts(station, capacity.total_capacity_gbps);
    
    const profitMargin = ((monthlyRevenue - costs.total) / monthlyRevenue) * 100;
    
    return {
      monthly_revenue: monthlyRevenue,
      revenue_per_gbps: revenuePerGbps,
      revenue_per_antenna: Math.round(monthlyRevenue / (1 + capacity.bandwidth_by_service.length)),
      operational_cost_monthly: costs.operational,
      maintenance_cost_monthly: costs.maintenance,
      profit_margin: Math.round(profitMargin * 10) / 10,
      customer_count: this.estimateCustomerCount(station, market),
      average_contract_value: this.calculateAverageContractValue(market),
      contract_duration_avg_months: market.gdpPerCapita > 40000 ? 36 : 24,
      churn_rate: this.calculateChurnRate(market),
      revenue_growth_rate: this.calculateGrowthRate(station, market),
      cost_per_gb_transferred: Math.round((costs.total / capacity.used_capacity_gbps) * 1000) / 1000,
      sla_compliance_rate: 97.5 + Math.random() * 2
    };
  }

  private calculateRevenuePerGbps(station: RealGroundStation, market: any): number {
    let baseRate = 8000; // Base rate per Gbps

    // Adjust for facility type
    const typeMultiplier = {
      'Primary Teleport': 1.3,
      'Teleport': 1.1,
      'Regional': 0.9,
      'O3b Gateway': 1.4 // HTS premium
    };
    baseRate *= typeMultiplier[station.type];

    // Adjust for market conditions
    baseRate *= (market.gdpPerCapita / 30000) * 0.7 + 0.3;

    // Operator premium
    if (station.operator === 'SES' || station.operator === 'Intelsat') {
      baseRate *= 1.1; // Tier-1 operator premium
    }

    return Math.round(baseRate);
  }

  private calculateOperationalCosts(station: RealGroundStation, capacity: number): { operational: number; maintenance: number; total: number } {
    const baseCosts = {
      'Primary Teleport': { fixed: 280000, variable: 1200 },
      'Teleport': { fixed: 180000, variable: 900 },
      'Regional': { fixed: 90000, variable: 600 },
      'O3b Gateway': { fixed: 320000, variable: 1400 }
    };

    const costs = baseCosts[station.type];
    const operational = costs.fixed + (capacity * costs.variable);
    
    // Location cost adjustments
    const costMultipliers: { [key: string]: number } = {
      'USA': 1.2,
      'Luxembourg': 1.3,
      'Germany': 1.15,
      'Sweden': 1.1,
      'Australia': 1.05,
      'Singapore': 1.1,
      'South Korea': 1.0,
      'Brazil': 0.7,
      'Argentina': 0.6,
      'India': 0.5,
      'China': 0.8,
      'South Africa': 0.65,
      'Mexico': 0.75
    };

    const multiplier = costMultipliers[station.country] || 0.8;
    const adjustedOperational = Math.round(operational * multiplier);
    const maintenance = Math.round(adjustedOperational * 0.12); // 12% of operational

    return {
      operational: adjustedOperational,
      maintenance: maintenance,
      total: adjustedOperational + maintenance
    };
  }

  private estimateCustomerCount(station: RealGroundStation, market: any): number {
    const baseCustomers = {
      'Primary Teleport': 1200,
      'Teleport': 800,
      'Regional': 400,
      'O3b Gateway': 600
    };

    let customers = baseCustomers[station.type];
    
    // Adjust for market density
    customers *= (market.businessDensity / 70);
    
    // Add variation
    customers += (Math.random() - 0.5) * customers * 0.3;
    
    return Math.round(Math.max(50, customers));
  }

  private calculateAverageContractValue(market: any): number {
    const baseValue = 1800;
    return Math.round(baseValue * (market.gdpPerCapita / 30000) * 0.6 + baseValue * 0.4);
  }

  private calculateChurnRate(market: any): number {
    // Lower churn in more stable markets
    const baseChurn = 8;
    const stabilityFactor = Math.min(1.5, market.gdpPerCapita / 30000);
    return Math.round(Math.max(2, baseChurn / stabilityFactor));
  }

  private calculateGrowthRate(station: RealGroundStation, market: any): number {
    let growthRate = 10; // Base 10% growth
    
    // Market growth factors
    if (market.satellitePenetration < 15) growthRate += 8; // Underserved market
    if (market.gdpPerCapita > 40000) growthRate += 5; // High GDP market
    
    // Technology growth factors
    if (station.type === 'O3b Gateway') growthRate += 12; // MEO/HTS growth
    if (station.type === 'Primary Teleport') growthRate += 3; // Established growth
    
    // Geographic factors
    if (['India', 'Brazil', 'China'].includes(station.country)) growthRate += 8; // Emerging markets
    
    return Math.min(25, Math.round(growthRate));
  }

  private generateROIMetrics(station: RealGroundStation, business: any): any {
    const initialInvestment = this.estimateInitialInvestment(station);
    const annualProfit = business.monthly_revenue * 12 - (business.operational_cost_monthly + business.maintenance_cost_monthly) * 12;
    const annualROI = (annualProfit / initialInvestment) * 100;
    
    return {
      initial_investment: initialInvestment,
      annual_roi_percentage: Math.round(annualROI * 10) / 10,
      payback_period_months: Math.round((initialInvestment / (annualProfit / 12))),
      net_present_value: Math.round(initialInvestment + annualProfit * 3), // Simplified NPV
      internal_rate_of_return: Math.round((annualROI + 5) * 10) / 10, // Simplified IRR
      break_even_point_months: Math.round((initialInvestment / (annualProfit / 12)) * 0.9),
      expansion_investment_required: Math.round(initialInvestment * 0.4),
      expansion_roi_projection: Math.round((annualROI + 3) * 10) / 10
    };
  }

  private estimateInitialInvestment(station: RealGroundStation): number {
    const baseInvestments = {
      'Primary Teleport': 12000000,
      'Teleport': 8000000,
      'Regional': 4500000,
      'O3b Gateway': 15000000
    };

    let investment = baseInvestments[station.type];
    
    // Location cost adjustments
    const costMultipliers: { [key: string]: number } = {
      'USA': 1.3,
      'Luxembourg': 1.4,
      'Germany': 1.2,
      'Australia': 1.15,
      'Singapore': 1.2,
      'Brazil': 0.8,
      'India': 0.6,
      'China': 0.9
    };

    investment *= (costMultipliers[station.country] || 1.0);
    
    return Math.round(investment);
  }

  private calculateHealthScore(utilization: any, business: any, coverage: any): number {
    let score = 50; // Base score
    
    // Utilization component (30%)
    if (utilization.current > 40 && utilization.current < 85) score += 25;
    else if (utilization.current >= 25) score += 15;
    
    // Profitability component (40%)
    if (business.profit_margin > 25) score += 35;
    else if (business.profit_margin > 10) score += 25;
    else if (business.profit_margin > 0) score += 15;
    
    // Technical component (30%)
    if (coverage.weather_impact_days_per_year < 20) score += 15;
    else if (coverage.weather_impact_days_per_year < 40) score += 10;
    
    if (coverage.satellite_visibility_count > 12) score += 15;
    else if (coverage.satellite_visibility_count > 8) score += 10;
    
    return Math.min(100, Math.max(20, score));
  }

  private getInvestmentRecommendation(profitMargin: number, roi: number): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (profitMargin > 25 && roi > 20) return 'excellent';
    if (profitMargin > 15 && roi > 15) return 'good';
    if (profitMargin > 5 && roi > 10) return 'moderate';
    return 'poor';
  }

  // Helper methods
  private getRegion(latitude: number): string {
    if (latitude > 23.5) return 'Northern';
    if (latitude < -23.5) return 'Southern';
    return 'Equatorial';
  }

  private getTimezone(country: string): string {
    const timezones: { [key: string]: string } = {
      'USA': 'EST/PST',
      'Luxembourg': 'CET',
      'Germany': 'CET',
      'Sweden': 'CET',
      'Romania': 'EET',
      'Gibraltar': 'CET',
      'Australia': 'AEDT',
      'Brazil': 'BRT',
      'South Korea': 'KST',
      'South Africa': 'SAST',
      'Argentina': 'ART',
      'Mexico': 'CST',
      'Singapore': 'SGT',
      'China': 'CST',
      'India': 'IST'
    };
    return timezones[country] || 'UTC';
  }

  private getPeakHours(country: string): string[] {
    // Business hours by region
    const businessHours: { [key: string]: string[] } = {
      'USA': ['09:00', '14:00', '20:00'],
      'Luxembourg': ['08:00', '13:00', '18:00'],
      'Germany': ['08:00', '13:00', '18:00'],
      'Australia': ['10:00', '15:00', '21:00'],
      'Singapore': ['09:00', '14:00', '19:00'],
      'China': ['09:00', '14:00', '20:00'],
      'India': ['10:00', '15:00', '21:00'],
      'Brazil': ['09:00', '14:00', '20:00']
    };
    return businessHours[country] || ['09:00', '14:00', '19:00'];
  }

  private getLowHours(): string[] {
    return ['02:00', '04:00', '06:00'];
  }

  private generateUtilizationHistory(currentUtil: number): any[] {
    const history = [];
    let util = currentUtil - 8 + Math.random() * 4; // Start 6-10 points lower
    
    for (let i = 0; i < 6; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - i));
      const monthStr = month.toISOString().substring(0, 7);
      
      history.push({
        month: monthStr,
        utilization: Math.round(Math.max(15, Math.min(95, util)))
      });
      
      // Gradual increase toward current
      util += (currentUtil - util) * 0.3 + (Math.random() - 0.5) * 3;
    }
    
    return history;
  }

  /**
   * Get all enriched real ground stations
   */
  getAllEnrichedStations(): GroundStationAnalytics[] {
    return ALL_REAL_STATIONS.map(station => this.enrichGroundStation(station));
  }

  /**
   * Get enriched stations by operator
   */
  getStationsByOperator(operator: 'SES' | 'Intelsat'): GroundStationAnalytics[] {
    const stations = operator === 'SES' ? SES_GROUND_STATIONS : INTELSAT_GROUND_STATIONS;
    return stations.map(station => this.enrichGroundStation(station));
  }

  /**
   * Get enriched stations by type
   */
  getStationsByType(stationType: string): GroundStationAnalytics[] {
    const stations = ALL_REAL_STATIONS.filter(station => station.type === stationType);
    return stations.map(station => this.enrichGroundStation(station));
  }
}