import { 
  GroundStationAnalytics, 
  GroundStationGrowthOpportunity,
  NetworkHealthMetrics,
  RegionalPerformance,
  MarketExpansionOpportunity,
  GroundStationBusinessMetrics,
  GroundStationROIMetrics
} from './types/ground-station';

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
 * Calculates business metrics for a ground station
 */
export function calculateBusinessMetrics(
  station: GroundStationAnalytics,
  historicalData?: any[]
): GroundStationBusinessMetrics {
  const baseRevenue = station.capacity_metrics.total_capacity_gbps * 10000; // $10k per Gbps base
  const utilizationMultiplier = station.utilization_metrics.current_utilization / 100;
  const monthlyRevenue = baseRevenue * utilizationMultiplier;

  const operationalCost = station.capacity_metrics.total_capacity_gbps * 3000; // $3k per Gbps operational
  const maintenanceCost = station.technical_specs.primary_antenna_size_m * 1000; // $1k per meter maintenance

  return {
    monthly_revenue: monthlyRevenue,
    revenue_per_gbps: monthlyRevenue / station.capacity_metrics.total_capacity_gbps,
    revenue_per_antenna: monthlyRevenue / (1 + station.technical_specs.secondary_antennas),
    operational_cost_monthly: operationalCost,
    maintenance_cost_monthly: maintenanceCost,
    profit_margin: ((monthlyRevenue - operationalCost - maintenanceCost) / monthlyRevenue) * 100,
    customer_count: Math.floor(station.capacity_metrics.total_capacity_gbps * 5), // 5 customers per Gbps
    average_contract_value: monthlyRevenue / Math.max(1, Math.floor(station.capacity_metrics.total_capacity_gbps * 5)),
    contract_duration_avg_months: 24,
    churn_rate: station.utilization_metrics.current_utilization > 80 ? 5 : 12,
    revenue_growth_rate: station.utilization_metrics.utilization_trend === 'increasing' ? 15 : 
                        station.utilization_metrics.utilization_trend === 'decreasing' ? -5 : 8,
    cost_per_gb_transferred: (operationalCost + maintenanceCost) / (station.capacity_metrics.used_capacity_gbps * 30 * 24), // Per hour
    sla_compliance_rate: Math.max(95, 100 - (station.coverage_metrics.weather_impact_days_per_year / 3.65))
  };
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