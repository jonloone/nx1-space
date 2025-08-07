import { 
  GroundStationAnalytics, 
  GroundStationGrowthOpportunity,
  NetworkHealthMetrics,
  RegionalPerformance,
  MarketExpansionOpportunity,
  GroundStationBusinessMetrics,
  GroundStationROIMetrics
} from './types/ground-station';

// Import new service-specific pricing and operational models
import { servicePricingModel, ServiceType, ServiceContract } from './revenue/service-pricing-model';
import { antennaConstraints } from './operational/antenna-constraints';
import { interferenceCalculator } from './interference/interference-calculator';

/**
 * Analyzes ground station utilization to identify expansion opportunities
 */
export function identifyExpansionOpportunities(stations: GroundStationAnalytics[]): GroundStationGrowthOpportunity[] {
  const opportunities: GroundStationGrowthOpportunity[] = [];

  stations.forEach(station => {
    const utilization = station.utilization_metrics.current_utilization;
    const capacity = station.capacity_metrics.total_capacity_gbps;
    const roi = station.roi_metrics.annual_roi_percentage;

    // High utilization indicates need for capacity expansion
    if (utilization > 85) {
      opportunities.push({
        opportunity_type: 'capacity_expansion',
        priority_score: Math.min(100, utilization + (capacity < 50 ? 15 : 0)),
        investment_required: capacity * 50000, // $50k per Gbps
        projected_revenue_increase: station.business_metrics.monthly_revenue * 0.3,
        projected_roi: roi * 1.2,
        implementation_timeline_months: 6,
        risk_factors: ['Market saturation', 'Regulatory approval'],
        market_demand_score: Math.min(100, utilization + 10),
        competitive_advantage: ['First mover advantage', 'Existing infrastructure'],
        success_probability: 85
      });
    }

    // Low utilization in strategic locations indicates marketing opportunity
    if (utilization < 60 && station.location.region === 'Northern' && roi > 10) {
      opportunities.push({
        opportunity_type: 'market_penetration',
        priority_score: 75 - utilization,
        investment_required: 200000, // Marketing investment
        projected_revenue_increase: station.business_metrics.monthly_revenue * 0.5,
        projected_roi: roi * 1.5,
        implementation_timeline_months: 12,
        risk_factors: ['Market acceptance', 'Competition'],
        market_demand_score: 70,
        competitive_advantage: ['Underutilized capacity', 'Competitive pricing'],
        success_probability: 70
      });
    }

    // New services opportunity based on technical capabilities
    if (station.technical_specs.frequency_bands.length > 2 && utilization < 75) {
      opportunities.push({
        opportunity_type: 'new_services',
        priority_score: 80,
        investment_required: 150000,
        projected_revenue_increase: station.business_metrics.monthly_revenue * 0.25,
        projected_roi: roi * 1.3,
        implementation_timeline_months: 9,
        risk_factors: ['Technology adoption', 'Service integration'],
        market_demand_score: 75,
        competitive_advantage: ['Multi-band capability', 'Service diversity'],
        success_probability: 75
      });
    }
  });

  return opportunities.sort((a, b) => b.priority_score - a.priority_score);
}

/**
 * Analyzes market gaps for geographic expansion
 */
export function identifyGeographicExpansionOpportunities(
  existingStations: GroundStationAnalytics[],
  marketData: any[]
): MarketExpansionOpportunity[] {
  const opportunities: MarketExpansionOpportunity[] = [];

  // Define high-value markets with limited coverage
  const potentialMarkets = [
    { country: 'India', city: 'Mumbai', lat: 19.076, lng: 72.8777, market_size: 1200000000 },
    { country: 'Brazil', city: 'São Paulo', lat: -23.5505, lng: -46.6333, market_size: 800000000 },
    { country: 'Nigeria', city: 'Lagos', lat: 6.5244, lng: 3.3792, market_size: 600000000 },
    { country: 'Indonesia', city: 'Jakarta', lat: -6.2088, lng: 106.8456, market_size: 700000000 },
    { country: 'Mexico', city: 'Mexico City', lat: 19.4326, lng: -99.1332, market_size: 500000000 },
    { country: 'Turkey', city: 'Istanbul', lat: 41.0082, lng: 28.9784, market_size: 450000000 },
    { country: 'South Africa', city: 'Cape Town', lat: -33.9249, lng: 18.4241, market_size: 350000000 },
    { country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, market_size: 400000000 }
  ];

  potentialMarkets.forEach(market => {
    // Check if area is underserved
    const nearbyStations = existingStations.filter(station => {
      const distance = calculateDistance(
        market.lat, market.lng,
        station.location.latitude, station.location.longitude
      );
      return distance < 2000; // Within 2000km
    });

    if (nearbyStations.length < 2) {
      const competitionLevel = nearbyStations.length === 0 ? 'low' : 'medium';
      const strategicImportance = market.market_size / 10000000; // Scale to 0-100

      opportunities.push({
        location: {
          latitude: market.lat,
          longitude: market.lng,
          country: market.country,
          city: market.city
        },
        market_size: market.market_size,
        competition_level: competitionLevel,
        regulatory_complexity: getRegulateComplexity(market.country),
        infrastructure_readiness: getInfrastructureReadiness(market.country),
        demand_forecast: market.market_size * 0.05, // 5% market penetration
        investment_required: 15000000, // $15M base investment
        roi_projection: calculateExpansionROI(market.market_size, competitionLevel),
        strategic_importance: Math.min(100, strategicImportance),
        risk_score: calculateRiskScore(market.country, competitionLevel)
      });
    }
  });

  return opportunities.sort((a, b) => b.strategic_importance - a.strategic_importance);
}

/**
 * Calculates comprehensive network health metrics
 */
export function calculateNetworkHealth(stations: GroundStationAnalytics[]): NetworkHealthMetrics {
  const activeStations = stations.filter(s => s.health_score > 70);
  const offlineStations = stations.filter(s => s.health_score < 30);
  const maintenanceRequired = stations.filter(s => s.health_score >= 30 && s.health_score <= 70);

  const totalCapacity = stations.reduce((sum, s) => sum + s.capacity_metrics.total_capacity_gbps, 0);
  const totalRevenue = stations.reduce((sum, s) => sum + s.business_metrics.monthly_revenue, 0);
  const avgUtilization = stations.reduce((sum, s) => sum + s.utilization_metrics.current_utilization, 0) / stations.length;
  const avgSLA = stations.reduce((sum, s) => sum + s.business_metrics.sla_compliance_rate, 0) / stations.length;

  // Identify critical coverage gaps
  const criticalGaps = identifyCoverageGaps(stations);

  return {
    overall_network_utilization: avgUtilization,
    total_capacity_gbps: totalCapacity,
    active_stations: activeStations.length,
    offline_stations: offlineStations.length,
    maintenance_required: maintenanceRequired.length,
    average_sla_compliance: avgSLA,
    total_monthly_revenue: totalRevenue,
    network_efficiency_score: calculateNetworkEfficiency(stations),
    redundancy_coverage: calculateRedundancyCoverage(stations),
    critical_gaps: criticalGaps
  };
}

/**
 * Analyzes regional performance metrics
 */
export function analyzeRegionalPerformance(stations: GroundStationAnalytics[]): RegionalPerformance[] {
  const regions = [...new Set(stations.map(s => s.location.region))];

  return regions.map(region => {
    const regionStations = stations.filter(s => s.location.region === region);
    const totalRevenue = regionStations.reduce((sum, s) => sum + s.business_metrics.monthly_revenue, 0);
    const avgUtilization = regionStations.reduce((sum, s) => sum + s.utilization_metrics.current_utilization, 0) / regionStations.length;
    const avgROI = regionStations.reduce((sum, s) => sum + s.roi_metrics.annual_roi_percentage, 0) / regionStations.length;

    return {
      region,
      total_stations: regionStations.length,
      average_utilization: avgUtilization,
      total_revenue: totalRevenue,
      average_roi: avgROI,
      growth_rate: calculateRegionGrowthRate(regionStations),
      market_penetration: calculateMarketPenetration(region, regionStations.length),
      competitive_position: determineCompetitivePosition(avgROI, avgUtilization),
      key_opportunities: identifyRegionalOpportunities(region, regionStations),
      risk_factors: identifyRegionalRisks(region, regionStations)
    };
  });
}

/**
 * Calculates business metrics for a ground station using service-specific pricing
 */
export function calculateBusinessMetrics(
  station: GroundStationAnalytics,
  historicalData?: any[]
): GroundStationBusinessMetrics {
  // Generate realistic service mix based on station characteristics
  const serviceMix = generateServiceMix(station);
  
  // Calculate revenue using service-specific pricing
  const serviceRevenue = calculateServiceSpecificRevenue(station, serviceMix);
  
  // Apply operational constraints impact
  const constraintsImpact = calculateOperationalConstraintsImpact(station);
  const adjustedRevenue = serviceRevenue.optimized * constraintsImpact.utilizationEfficiency;
  
  // Legacy calculation for comparison
  const legacyRevenue = station.capacity_metrics.total_capacity_gbps * 10000 * (station.utilization_metrics.current_utilization / 100);

  const operationalCost = station.capacity_metrics.total_capacity_gbps * 3000; // $3k per Gbps operational
  const maintenanceCost = station.technical_specs.primary_antenna_size_m * 1000; // $1k per meter maintenance

  return {
    monthly_revenue: adjustedRevenue,
    legacy_monthly_revenue: legacyRevenue, // For comparison
    revenue_optimization_potential: serviceRevenue.optimized - legacyRevenue,
    revenue_per_gbps: adjustedRevenue / station.capacity_metrics.total_capacity_gbps,
    revenue_per_antenna: adjustedRevenue / (1 + station.technical_specs.secondary_antennas),
    operational_cost_monthly: operationalCost,
    maintenance_cost_monthly: maintenanceCost,
    profit_margin: ((adjustedRevenue - operationalCost - maintenanceCost) / adjustedRevenue) * 100,
    customer_count: Math.floor(station.capacity_metrics.total_capacity_gbps * 5), // 5 customers per Gbps
    average_contract_value: adjustedRevenue / Math.max(1, Math.floor(station.capacity_metrics.total_capacity_gbps * 5)),
    contract_duration_avg_months: 24,
    churn_rate: station.utilization_metrics.current_utilization > 80 ? 5 : 12,
    revenue_growth_rate: station.utilization_metrics.utilization_trend === 'increasing' ? 15 : 
                        station.utilization_metrics.utilization_trend === 'decreasing' ? -5 : 8,
    cost_per_gb_transferred: (operationalCost + maintenanceCost) / (station.capacity_metrics.used_capacity_gbps * 30 * 24), // Per hour
    sla_compliance_rate: Math.max(95, 100 - (station.coverage_metrics.weather_impact_days_per_year / 3.65)),
    
    // New operational insights
    operational_efficiency: constraintsImpact.utilizationEfficiency,
    capacity_loss_due_to_constraints: constraintsImpact.capacityLoss,
    service_mix: serviceMix
  } as GroundStationBusinessMetrics;
}

/**
 * Calculates ROI metrics for a ground station
 */
export function calculateROIMetrics(
  station: GroundStationAnalytics,
  businessMetrics: GroundStationBusinessMetrics
): GroundStationROIMetrics {
  const initialInvestment = station.technical_specs.primary_antenna_size_m * 500000; // $500k per meter
  const annualProfit = (businessMetrics.monthly_revenue - businessMetrics.operational_cost_monthly - businessMetrics.maintenance_cost_monthly) * 12;
  const annualROI = (annualProfit / initialInvestment) * 100;

  return {
    initial_investment: initialInvestment,
    annual_roi_percentage: annualROI,
    payback_period_months: initialInvestment / (annualProfit / 12),
    net_present_value: calculateNPV(annualProfit, initialInvestment, 0.08, 10),
    internal_rate_of_return: calculateIRR([initialInvestment * -1, ...Array(10).fill(annualProfit)]),
    break_even_point_months: initialInvestment / (businessMetrics.monthly_revenue - businessMetrics.operational_cost_monthly - businessMetrics.maintenance_cost_monthly),
    expansion_investment_required: station.capacity_metrics.upgrade_potential_gbps * 50000,
    expansion_roi_projection: annualROI * 1.2 // Projected 20% improvement with expansion
  };
}

// Helper functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getRegulateComplexity(country: string): 'low' | 'medium' | 'high' {
  const highComplexity = ['China', 'Russia', 'Iran', 'North Korea'];
  const mediumComplexity = ['India', 'Brazil', 'Turkey', 'Indonesia'];
  
  if (highComplexity.includes(country)) return 'high';
  if (mediumComplexity.includes(country)) return 'medium';
  return 'low';
}

function getInfrastructureReadiness(country: string): number {
  const readinessMap: Record<string, number> = {
    'India': 75,
    'Brazil': 80,
    'Nigeria': 60,
    'Indonesia': 70,
    'Mexico': 85,
    'Turkey': 90,
    'South Africa': 85,
    'Vietnam': 75
  };
  return readinessMap[country] || 70;
}

function calculateExpansionROI(marketSize: number, competition: string): number {
  const baseROI = 15;
  const marketMultiplier = Math.min(2, marketSize / 500000000);
  const competitionPenalty = competition === 'low' ? 0 : competition === 'medium' ? 3 : 7;
  return baseROI * marketMultiplier - competitionPenalty;
}

function calculateRiskScore(country: string, competition: string): number {
  const countryRisk: Record<string, number> = {
    'India': 35,
    'Brazil': 30,
    'Nigeria': 50,
    'Indonesia': 40,
    'Mexico': 25,
    'Turkey': 45,
    'South Africa': 35,
    'Vietnam': 30
  };

  const competitionRisk = competition === 'low' ? 10 : competition === 'medium' ? 20 : 30;
  return (countryRisk[country] || 40) + competitionRisk;
}

function identifyCoverageGaps(stations: GroundStationAnalytics[]): Array<{location: [number, number], gap_size_km: number, priority: 'high' | 'medium' | 'low'}> {
  // Simplified gap identification - in practice would use more sophisticated spatial analysis
  const majorMarkets = [
    { location: [19.076, 72.8777], name: 'Mumbai' },
    { location: [-23.5505, -46.6333], name: 'São Paulo' },
    { location: [6.5244, 3.3792], name: 'Lagos' }
  ];

  return majorMarkets.map(market => {
    const nearestStation = stations.reduce((nearest, station) => {
      const distance = calculateDistance(
        market.location[0], market.location[1],
        station.location.latitude, station.location.longitude
      );
      return distance < nearest.distance ? { station, distance } : nearest;
    }, { station: stations[0], distance: Infinity });

    return {
      location: market.location as [number, number],
      gap_size_km: nearestStation.distance,
      priority: nearestStation.distance > 3000 ? 'high' : nearestStation.distance > 1500 ? 'medium' : 'low'
    };
  });
}

function calculateNetworkEfficiency(stations: GroundStationAnalytics[]): number {
  const totalCapacity = stations.reduce((sum, s) => sum + s.capacity_metrics.total_capacity_gbps, 0);
  const usedCapacity = stations.reduce((sum, s) => sum + s.capacity_metrics.used_capacity_gbps, 0);
  const avgHealth = stations.reduce((sum, s) => sum + s.health_score, 0) / stations.length;
  
  return (usedCapacity / totalCapacity) * 0.7 + (avgHealth / 100) * 0.3;
}

function calculateRedundancyCoverage(stations: GroundStationAnalytics[]): number {
  // Simplified calculation - percentage of areas with multiple station coverage
  return Math.min(100, (stations.length / 20) * 100); // Assume need 20 stations for full redundancy
}

function calculateRegionGrowthRate(stations: GroundStationAnalytics[]): number {
  return stations.reduce((sum, s) => sum + s.business_metrics.revenue_growth_rate, 0) / stations.length;
}

function calculateMarketPenetration(region: string, stationCount: number): number {
  const regionPotential: Record<string, number> = {
    'Northern': 50,
    'Equatorial': 30,
    'Southern': 20
  };
  return Math.min(100, (stationCount / (regionPotential[region] || 30)) * 100);
}

function determineCompetitivePosition(avgROI: number, avgUtilization: number): 'leader' | 'challenger' | 'follower' | 'niche' {
  if (avgROI > 20 && avgUtilization > 80) return 'leader';
  if (avgROI > 15 && avgUtilization > 70) return 'challenger';
  if (avgROI > 10) return 'follower';
  return 'niche';
}

function identifyRegionalOpportunities(region: string, stations: GroundStationAnalytics[]): string[] {
  const opportunities = [];
  const avgUtilization = stations.reduce((sum, s) => sum + s.utilization_metrics.current_utilization, 0) / stations.length;
  
  if (avgUtilization > 85) opportunities.push('Capacity expansion');
  if (avgUtilization < 65) opportunities.push('Market development');
  if (stations.length < 5) opportunities.push('Geographic expansion');
  
  return opportunities;
}

function identifyRegionalRisks(region: string, stations: GroundStationAnalytics[]): string[] {
  const risks = [];
  const avgHealth = stations.reduce((sum, s) => sum + s.health_score, 0) / stations.length;
  
  if (avgHealth < 80) risks.push('Infrastructure aging');
  if (region === 'Equatorial') risks.push('Weather disruption');
  if (stations.some(s => s.business_metrics.churn_rate > 15)) risks.push('Customer retention');
  
  return risks;
}

function calculateNPV(annualCashFlow: number, initialInvestment: number, discountRate: number, years: number): number {
  let npv = -initialInvestment;
  for (let i = 1; i <= years; i++) {
    npv += annualCashFlow / Math.pow(1 + discountRate, i);
  }
  return npv;
}

function calculateIRR(cashFlows: number[]): number {
  // Simplified IRR calculation using Newton-Raphson method
  let rate = 0.1; // Start with 10%
  let tolerance = 0.00001;
  let maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      derivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    if (Math.abs(npv) < tolerance) break;
    rate = rate - npv / derivative;
  }
  
  return rate * 100; // Return as percentage
}

/**
 * Generate realistic service mix based on station characteristics
 */
function generateServiceMix(station: GroundStationAnalytics): Record<ServiceType, number> {
  const location = station.location.country;
  const capacity = station.capacity_metrics.total_capacity_gbps;
  
  // Base service distribution
  let serviceMix: Record<ServiceType, number> = {
    broadcast: 0,
    data: 0,
    government: 0,
    mobility: 0,
    iot: 0,
    backhaul: 0
  };
  
  // Large teleport stations (>200 Gbps) - diversified mix
  if (capacity > 200) {
    serviceMix = {
      broadcast: 0.25,
      data: 0.30,
      government: 0.15,
      mobility: 0.20,
      iot: 0.05,
      backhaul: 0.05
    };
  }
  // Medium stations (50-200 Gbps) - focused on core services
  else if (capacity > 50) {
    serviceMix = {
      broadcast: 0.35,
      data: 0.35,
      government: 0.10,
      mobility: 0.15,
      iot: 0.03,
      backhaul: 0.02
    };
  }
  // Small stations (<50 Gbps) - specialized services
  else {
    serviceMix = {
      broadcast: 0.40,
      data: 0.25,
      government: 0.20,
      mobility: 0.10,
      iot: 0.03,
      backhaul: 0.02
    };
  }
  
  // Regional adjustments
  if (location.includes('Europe') || location.includes('USA')) {
    serviceMix.government += 0.05;
    serviceMix.mobility += 0.05;
    serviceMix.broadcast -= 0.10;
  }
  
  if (location.includes('Africa') || location.includes('Asia')) {
    serviceMix.broadcast += 0.10;
    serviceMix.backhaul += 0.05;
    serviceMix.data -= 0.15;
  }
  
  return serviceMix;
}

/**
 * Calculate revenue using service-specific pricing model
 */
function calculateServiceSpecificRevenue(
  station: GroundStationAnalytics,
  serviceMix: Record<ServiceType, number>
): { 
  base: number;
  optimized: number;
  breakdown: Record<ServiceType, number>;
} {
  const totalCapacity = station.capacity_metrics.total_capacity_gbps;
  const utilization = station.utilization_metrics.current_utilization / 100;
  
  let baseRevenue = 0;
  let optimizedRevenue = 0;
  const breakdown: Record<ServiceType, number> = {} as Record<ServiceType, number>;
  
  // Market factors (simplified)
  const marketFactors = {
    regionDemandIndex: 75,
    competitionLevel: 'medium' as const,
    marketMaturity: 'mature' as const,
    seasonalFactor: 1.0,
    economicIndicator: 2.5
  };
  
  for (const [service, percentage] of Object.entries(serviceMix)) {
    const serviceCapacity = totalCapacity * percentage * utilization;
    
    if (serviceCapacity > 0) {
      // Base revenue (legacy pricing)
      const baseServiceRevenue = serviceCapacity * 10000;
      baseRevenue += baseServiceRevenue;
      
      // Optimized revenue (service-specific pricing)
      const optimizedPricing = servicePricingModel.calculateDynamicPrice(
        service as ServiceType,
        serviceCapacity,
        marketFactors,
        24
      );
      
      const optimizedServiceRevenue = optimizedPricing.monthlyRate;
      optimizedRevenue += optimizedServiceRevenue;
      breakdown[service as ServiceType] = optimizedServiceRevenue;
    }
  }
  
  return {
    base: baseRevenue,
    optimized: optimizedRevenue,
    breakdown
  };
}

/**
 * Calculate operational constraints impact on capacity and revenue
 */
function calculateOperationalConstraintsImpact(station: GroundStationAnalytics): {
  utilizationEfficiency: number;
  capacityLoss: number;
  slewTimeImpact: number;
} {
  const antennaSpec = antennaConstraints.generateAntennaSpec(
    station.station_id,
    station.technical_specs.primary_antenna_size_m
  );
  
  // Simulate typical satellite passes for the day
  const mockPasses = generateMockSatellitePasses(station);
  
  // Calculate capacity impact
  const capacityImpact = antennaConstraints.calculateCapacityImpact(
    antennaSpec,
    mockPasses,
    24 * 3600 // 24 hours in seconds
  );
  
  return {
    utilizationEfficiency: capacityImpact.utilizationEfficiency,
    capacityLoss: capacityImpact.capacityLoss,
    slewTimeImpact: capacityImpact.slewTimeOverhead
  };
}

/**
 * Generate mock satellite passes based on station characteristics
 */
function generateMockSatellitePasses(station: GroundStationAnalytics) {
  const passes = [];
  const utilization = station.utilization_metrics.current_utilization;
  const passCount = Math.floor((utilization / 100) * 12); // 12 passes max per day
  
  for (let i = 0; i < passCount; i++) {
    const startHour = Math.floor(Math.random() * 24);
    const duration = 30 + Math.floor(Math.random() * 90); // 30-120 minutes
    
    passes.push({
      satelliteId: `SAT-${i + 1}`,
      startTime: new Date(2024, 0, 1, startHour, 0),
      endTime: new Date(2024, 0, 1, startHour, duration),
      maxElevation: 30 + Math.random() * 60,
      startAzimuth: Math.random() * 360,
      endAzimuth: Math.random() * 360,
      priority: Math.floor(Math.random() * 10) + 1,
      service: ['broadcast', 'data', 'government', 'mobility'][Math.floor(Math.random() * 4)] as any
    });
  }
  
  return passes;
}

/**
 * Calculate interference impact on station operations and revenue
 */
export function calculateInterferenceImpact(
  station: GroundStationAnalytics
): {
  cToIRatio: number;
  capacityReduction: number;
  revenueImpact: number;
  serviceQualityImpact: 'none' | 'minimal' | 'moderate' | 'severe';
  dominantSource: string;
  mitigationRecommendations: string[];
} {
  // Simulate realistic interference sources based on station location
  const interferenceSources = generateInterferenceSources(station);
  
  // Create link budget for the station's primary frequency
  const linkBudget = {
    frequency: 14000, // MHz - default frequency since frequency_bands is just string array
    uplinkPower: 50, // dBW (typical)
    antennaGain: Math.log10(station.technical_specs.primary_antenna_size_m) * 20 + 20, // Rough estimate
    pathLoss: 210, // dB (typical GEO)
    atmosphericLoss: 0.5, // dB
    rainFade: station.coverage_metrics.weather_impact_days_per_year / 365 * 2, // Rough estimate
    receivedPower: -120, // dBW (calculated)
    polarization: 'RHCP' as const
  };
  
  // Perform comprehensive interference assessment
  const assessment = interferenceCalculator.performComprehensiveAssessment(
    linkBudget,
    interferenceSources,
    290 // System noise temperature
  );
  
  // Calculate revenue impact
  const currentRevenue = station.business_metrics.monthly_revenue;
  const revenueImpact = currentRevenue * (assessment.capacityReduction / 100);
  
  return {
    cToIRatio: assessment.cToI,
    capacityReduction: assessment.capacityReduction,
    revenueImpact,
    serviceQualityImpact: assessment.serviceQualityImpact,
    dominantSource: assessment.dominantInterferenceSource,
    mitigationRecommendations: assessment.recommendations
  };
}

/**
 * Generate realistic interference sources based on station location and characteristics
 */
function generateInterferenceSources(station: GroundStationAnalytics) {
  const sources = [];
  const location = station.location;
  const frequency = 14000; // Default frequency since frequency_bands is string array
  
  // Adjacent Satellite Interference (ASI)
  sources.push({
    type: 'ASI' as const,
    sourceName: 'Adjacent GEO Satellite',
    frequency: frequency,
    power: -125, // dBW
    polarization: 'RHCP' as const
  });
  
  // 5G C-band interference (if frequency overlaps)
  if (frequency >= 3700 && frequency <= 4200) {
    const countries5G = ['USA', 'UK', 'Germany', 'South Korea', 'Japan'];
    const impactLevel = countries5G.includes(location.country) ? -110 : -120;
    
    sources.push({
      type: 'terrestrial_5G' as const,
      sourceName: '5G C-band Base Station',
      frequency: frequency - 200, // Offset frequency
      power: impactLevel, // dBW
      location: {
        latitude: location.latitude + 0.1,
        longitude: location.longitude + 0.1,
        elevation: 10
      },
      polarization: 'V' as const,
      bandwidth: 100
    });
  }
  
  // Cross-polarization interference
  if (station.technical_specs.frequency_bands.length > 1) {
    sources.push({
      type: 'cross_pol' as const,
      sourceName: 'Co-frequency Cross-pol Signal',
      frequency: frequency,
      power: -130, // dBW
      polarization: 'LHCP' as const
    });
  }
  
  // Radar interference (depending on frequency band)
  if (frequency >= 5600 && frequency <= 5650) { // Weather radar
    sources.push({
      type: 'radar' as const,
      sourceName: 'Weather Radar',
      frequency: 5625,
      power: -115, // dBW
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: 5
      }
    });
  }
  
  return sources;
}

/**
 * Enhanced business metrics calculation with interference considerations
 */
export function calculateEnhancedBusinessMetrics(
  station: GroundStationAnalytics
): GroundStationBusinessMetrics & {
  interferenceImpact: ReturnType<typeof calculateInterferenceImpact>;
  operationalConstraints: ReturnType<typeof calculateOperationalConstraintsImpact>;
  optimizationPotential: {
    revenueIncrease: number;
    marginImprovement: number;
    implementationCost: number;
  };
} {
  const baseMetrics = calculateBusinessMetrics(station);
  const interferenceImpact = calculateInterferenceImpact(station);
  const operationalConstraints = calculateOperationalConstraintsImpact(station);
  
  // Calculate optimization potential
  const revenueIncrease = (baseMetrics as any).revenue_optimization_potential + 
                         interferenceImpact.revenueImpact; // Revenue we could recover
  const marginImprovement = revenueIncrease / baseMetrics.monthly_revenue * 100;
  const implementationCost = station.capacity_metrics.total_capacity_gbps * 25000; // $25k per Gbps
  
  return {
    ...baseMetrics,
    interferenceImpact,
    operationalConstraints,
    optimizationPotential: {
      revenueIncrease,
      marginImprovement,
      implementationCost
    }
  };
}