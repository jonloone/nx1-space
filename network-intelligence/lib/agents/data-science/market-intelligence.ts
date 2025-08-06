/**
 * Market_Intelligence - Market Analysis and Intelligence Expert
 * 
 * Uses population and GDP data for demand estimation
 * Identifies underserved regions
 * Calculates competitive positioning
 */

import { BaseAgent, AgentCapability, AgentAnalysis, MarketData } from '../types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface MarketIntelligenceReport {
  stationId: string;
  marketProfile: {
    region: string;
    marketSize: 'small' | 'medium' | 'large' | 'very-large';
    economicIndicators: {
      populationDensity: number;
      gdpPerCapita: number;
      digitalEconomyScore: number;
    };
    demandDrivers: { driver: string; strength: 'weak' | 'moderate' | 'strong'; impact: number }[];
  };
  competitiveAnalysis: {
    marketPosition: 'dominant' | 'competitive' | 'challenged' | 'emerging';
    competitorCount: number;
    marketShare: number;
    competitiveAdvantages: string[];
    marketGaps: string[];
  };
  demandAnalysis: {
    currentDemand: number;
    latentDemand: number;
    growthPotential: number;
    demandSegments: { segment: string; size: number; growth: number; priority: 'high' | 'medium' | 'low' }[];
  };
  underservedAnalysis: {
    serviceGaps: { service: string; gapSize: number; opportunity: string }[];
    geographicGaps: { region: string; population: number; accessibility: number }[];
    demographicGaps: { segment: string; size: number; unmetNeed: string }[];
  };
  strategicRecommendations: {
    marketEntry: string[];
    serviceExpansion: string[];
    pricing: string[];
    partnership: string[];
  };
}

export class MarketIntelligence extends BaseAgent {
  agentId = 'Market_Intelligence';
  
  capabilities: AgentCapability[] = [
    {
      name: 'Market Size Assessment',
      description: 'Evaluates market size using population and economic indicators',
      inputTypes: ['PopulationData', 'EconomicIndicators'],
      outputTypes: ['MarketSizeAnalysis']
    },
    {
      name: 'Demand Estimation',
      description: 'Calculates current and potential demand for satellite services',
      inputTypes: ['MarketData', 'ServiceUtilization'],
      outputTypes: ['DemandForecast']
    },
    {
      name: 'Competitive Intelligence',
      description: 'Analyzes competitive landscape and market positioning',
      inputTypes: ['CompetitorData', 'MarketShare'],
      outputTypes: ['CompetitiveAnalysis']
    },
    {
      name: 'Underserved Market Identification',
      description: 'Identifies market gaps and underserved segments',
      inputTypes: ['ServiceCoverage', 'DemographicData'],
      outputTypes: ['MarketGapAnalysis']
    }
  ];

  // Market data database (in production, this would be real demographic and economic data)
  private readonly marketDatabase = {
    'Spain': {
      population: 47400000,
      gdpPerCapita: 27057,
      internetPenetration: 92,
      businessDensity: 85,
      satellitePenetration: 15,
      competitorCount: 4
    },
    'Germany': {
      population: 83200000,
      gdpPerCapita: 46259,
      internetPenetration: 95,
      businessDensity: 92,
      satellitePenetration: 18,
      competitorCount: 6
    },
    'Singapore': {
      population: 5900000,
      gdpPerCapita: 59797,
      internetPenetration: 98,
      businessDensity: 95,
      satellitePenetration: 35,
      competitorCount: 8
    },
    'Australia': {
      population: 25700000,
      gdpPerCapita: 51812,
      internetPenetration: 88,
      businessDensity: 78,
      satellitePenetration: 25,
      competitorCount: 5
    },
    'Japan': {
      population: 125800000,
      gdpPerCapita: 39312,
      internetPenetration: 93,
      businessDensity: 88,
      satellitePenetration: 22,
      competitorCount: 7
    },
    'India': {
      population: 1380000000,
      gdpPerCapita: 2100,
      internetPenetration: 45,
      businessDensity: 35,
      satellitePenetration: 3,
      competitorCount: 12
    },
    'Brazil': {
      population: 215000000,
      gdpPerCapita: 8717,
      internetPenetration: 74,
      businessDensity: 58,
      satellitePenetration: 8,
      competitorCount: 9
    },
    'South Africa': {
      population: 60400000,
      gdpPerCapita: 6001,
      internetPenetration: 68,
      businessDensity: 45,
      satellitePenetration: 12,
      competitorCount: 6
    }
  };

  async analyze(station: GroundStationAnalytics): Promise<AgentAnalysis> {
    const report = await this.generateMarketIntelligence(station);
    const confidence = this.calculateAnalysisConfidence(station, report);
    const recommendations = this.generateMarketRecommendations(report);
    const warnings = this.identifyMarketWarnings(report);

    return this.createAnalysis(report, confidence, recommendations, warnings);
  }

  private async generateMarketIntelligence(station: GroundStationAnalytics): Promise<MarketIntelligenceReport> {
    const marketData = this.getMarketData(station.location.country);
    
    // Generate market profile
    const marketProfile = this.generateMarketProfile(station, marketData);
    
    // Perform competitive analysis
    const competitiveAnalysis = this.performCompetitiveAnalysis(station, marketData);
    
    // Analyze demand
    const demandAnalysis = this.analyzeDemand(station, marketData);
    
    // Identify underserved markets
    const underservedAnalysis = this.identifyUnderservedMarkets(station, marketData);
    
    // Generate strategic recommendations
    const strategicRecommendations = this.generateStrategicRecommendations(
      marketProfile,
      competitiveAnalysis,
      demandAnalysis,
      underservedAnalysis
    );

    return {
      stationId: station.station_id,
      marketProfile,
      competitiveAnalysis,
      demandAnalysis,
      underservedAnalysis,
      strategicRecommendations
    };
  }

  private getMarketData(country: string): any {
    return this.marketDatabase[country as keyof typeof this.marketDatabase] || {
      population: 50000000,
      gdpPerCapita: 25000,
      internetPenetration: 75,
      businessDensity: 60,
      satellitePenetration: 10,
      competitorCount: 5
    };
  }

  private generateMarketProfile(station: GroundStationAnalytics, marketData: any): {
    region: string;
    marketSize: 'small' | 'medium' | 'large' | 'very-large';
    economicIndicators: {
      populationDensity: number;
      gdpPerCapita: number;
      digitalEconomyScore: number;
    };
    demandDrivers: { driver: string; strength: 'weak' | 'moderate' | 'strong'; impact: number }[];
  } {
    // Determine market size based on multiple factors
    const marketSizeScore = (marketData.population / 100000000) * 0.4 + 
                           (marketData.gdpPerCapita / 50000) * 0.3 + 
                           (marketData.businessDensity / 100) * 0.3;
    
    let marketSize: 'small' | 'medium' | 'large' | 'very-large';
    if (marketSizeScore >= 1.2) marketSize = 'very-large';
    else if (marketSizeScore >= 0.8) marketSize = 'large';
    else if (marketSizeScore >= 0.4) marketSize = 'medium';
    else marketSize = 'small';

    // Calculate economic indicators
    const populationDensity = this.estimatePopulationDensity(station.location.country);
    const digitalEconomyScore = (marketData.internetPenetration + marketData.businessDensity) / 2;

    // Identify demand drivers
    const demandDrivers = this.identifyDemandDrivers(station, marketData);

    return {
      region: station.location.region,
      marketSize,
      economicIndicators: {
        populationDensity,
        gdpPerCapita: marketData.gdpPerCapita,
        digitalEconomyScore: Math.round(digitalEconomyScore)
      },
      demandDrivers
    };
  }

  private estimatePopulationDensity(country: string): number {
    // Simplified population density estimates
    const densityMap: { [key: string]: number } = {
      'Singapore': 8000,
      'Germany': 240,
      'Japan': 330,
      'India': 460,
      'Spain': 95,
      'Australia': 3,
      'Brazil': 25,
      'South Africa': 49
    };
    
    return densityMap[country] || 100;
  }

  private identifyDemandDrivers(station: GroundStationAnalytics, marketData: any): { driver: string; strength: 'weak' | 'moderate' | 'strong'; impact: number }[] {
    const drivers = [];

    // Internet penetration driver
    if (marketData.internetPenetration < 80) {
      drivers.push({
        driver: 'Internet Infrastructure Gap',
        strength: 'strong' as const,
        impact: 25
      });
    }

    // Business connectivity driver
    if (marketData.businessDensity > 70) {
      drivers.push({
        driver: 'Enterprise Connectivity Demand',
        strength: 'strong' as const,
        impact: 30
      });
    }

    // Economic development driver
    if (marketData.gdpPerCapita > 30000) {
      drivers.push({
        driver: 'High Economic Activity',
        strength: 'strong' as const,
        impact: 20
      });
    } else if (marketData.gdpPerCapita > 15000) {
      drivers.push({
        driver: 'Growing Economic Activity',
        strength: 'moderate' as const,
        impact: 15
      });
    }

    // Low satellite penetration = opportunity
    if (marketData.satellitePenetration < 15) {
      drivers.push({
        driver: 'Underserved Satellite Market',
        strength: 'strong' as const,
        impact: 35
      });
    }

    // Geographic factors
    if (station.location.country === 'Australia' || station.location.country === 'Brazil') {
      drivers.push({
        driver: 'Remote Area Connectivity Needs',
        strength: 'strong' as const,
        impact: 28
      });
    }

    return drivers;
  }

  private performCompetitiveAnalysis(station: GroundStationAnalytics, marketData: any): {
    marketPosition: 'dominant' | 'competitive' | 'challenged' | 'emerging';
    competitorCount: number;
    marketShare: number;
    competitiveAdvantages: string[];
    marketGaps: string[];
  } {
    const competitorCount = marketData.competitorCount;
    
    // Estimate market share based on station capabilities and market factors
    const stationCapabilityScore = this.calculateStationCapabilityScore(station);
    const baseMarketShare = Math.min(40, Math.max(5, (stationCapabilityScore / competitorCount) * 100));
    
    // Adjust market share based on operator reputation
    let marketShare = baseMarketShare;
    if (station.operator === 'SES' || station.operator === 'Intelsat') {
      marketShare *= 1.3; // Premium operators get market share boost
    }
    marketShare = Math.min(45, marketShare);

    // Determine market position
    let marketPosition: 'dominant' | 'competitive' | 'challenged' | 'emerging';
    if (marketShare >= 30) marketPosition = 'dominant';
    else if (marketShare >= 20) marketPosition = 'competitive';
    else if (marketShare >= 10) marketPosition = 'challenged';
    else marketPosition = 'emerging';

    // Identify competitive advantages
    const competitiveAdvantages = this.identifyCompetitiveAdvantages(station);
    
    // Identify market gaps
    const marketGaps = this.identifyMarketGaps(station, marketData);

    return {
      marketPosition,
      competitorCount,
      marketShare: Math.round(marketShare),
      competitiveAdvantages,
      marketGaps
    };
  }

  private calculateStationCapabilityScore(station: GroundStationAnalytics): number {
    let score = 0;
    
    // Capacity score
    score += Math.min(20, station.capacity_metrics.total_capacity_gbps / 10);
    
    // Technical capability score
    score += Math.min(15, station.technical_specs.g_t_ratio_db - 25);
    
    // Service diversity score
    score += station.technical_specs.services_supported.length * 3;
    
    // Frequency band score
    score += station.technical_specs.frequency_bands.length * 5;
    
    // Reliability score
    score += Math.min(15, station.capacity_metrics.redundancy_level / 5);
    
    return Math.min(100, score);
  }

  private identifyCompetitiveAdvantages(station: GroundStationAnalytics): string[] {
    const advantages = [];

    // High capacity advantage
    if (station.capacity_metrics.total_capacity_gbps > 150) {
      advantages.push('High-capacity infrastructure enables large enterprise deals');
    }

    // Multi-band capability
    if (station.technical_specs.frequency_bands.length >= 3) {
      advantages.push('Multi-band capability provides service flexibility');
    }

    // Premium operator advantage
    if (station.operator === 'SES' || station.operator === 'Intelsat') {
      advantages.push('Tier-1 operator reputation and global fleet access');
    }

    // Geographic advantage
    if (station.coverage_metrics.coverage_area_km2 > 8000000) {
      advantages.push('Extensive coverage area serves large market');
    }

    // High reliability
    if (station.capacity_metrics.redundancy_level > 90) {
      advantages.push('High redundancy ensures service reliability');
    }

    // Service diversity
    if (station.technical_specs.services_supported.length >= 5) {
      advantages.push('Diverse service portfolio reduces market risk');
    }

    return advantages;
  }

  private identifyMarketGaps(station: GroundStationAnalytics, marketData: any): string[] {
    const gaps = [];

    // HTS gap
    if (!station.technical_specs.services_supported.includes('HTS') && marketData.businessDensity > 70) {
      gaps.push('High Throughput Satellite services for enterprise market');
    }

    // Maritime gap
    if (!station.technical_specs.services_supported.includes('Maritime') && 
        ['Australia', 'Singapore', 'Japan'].includes(station.location.country)) {
      gaps.push('Maritime connectivity services in strategic shipping lanes');
    }

    // Government services gap
    if (!station.technical_specs.services_supported.includes('Government')) {
      gaps.push('Government and military communication services');
    }

    // Low penetration opportunity
    if (marketData.satellitePenetration < 10) {
      gaps.push('Consumer satellite services in underserved regions');
    }

    // IoT/M2M services
    if (marketData.internetPenetration > 80 && !station.technical_specs.services_supported.includes('IoT')) {
      gaps.push('IoT and machine-to-machine connectivity services');
    }

    return gaps;
  }

  private analyzeDemand(station: GroundStationAnalytics, marketData: any): {
    currentDemand: number;
    latentDemand: number;
    growthPotential: number;
    demandSegments: { segment: string; size: number; growth: number; priority: 'high' | 'medium' | 'low' }[];
  } {
    // Calculate current demand based on utilization and market factors
    const currentDemand = station.utilization_metrics.current_utilization * 
                         (marketData.businessDensity / 100) * 
                         (marketData.internetPenetration / 100);

    // Calculate latent demand
    const latentDemand = (100 - marketData.satellitePenetration) * 
                        (marketData.gdpPerCapita / 50000) * 
                        Math.min(1.5, marketData.businessDensity / 60);

    // Calculate growth potential
    const growthPotential = this.calculateGrowthPotential(station, marketData);

    // Identify demand segments
    const demandSegments = this.identifyDemandSegments(station, marketData);

    return {
      currentDemand: Math.round(currentDemand),
      latentDemand: Math.round(latentDemand),
      growthPotential: Math.round(growthPotential),
      demandSegments
    };
  }

  private calculateGrowthPotential(station: GroundStationAnalytics, marketData: any): number {
    let growthPotential = 0;

    // Base growth from economic development
    growthPotential += (marketData.gdpPerCapita / 1000) * 0.5;

    // Internet penetration growth potential
    growthPotential += (100 - marketData.internetPenetration) * 0.3;

    // Satellite penetration growth potential  
    growthPotential += (50 - marketData.satellitePenetration) * 0.8;

    // Service expansion potential
    const missingServices = 6 - station.technical_specs.services_supported.length;
    growthPotential += missingServices * 3;

    // Digital transformation driver
    if (marketData.businessDensity > 70) {
      growthPotential += 15;
    }

    return Math.min(100, growthPotential);
  }

  private identifyDemandSegments(station: GroundStationAnalytics, marketData: any): { segment: string; size: number; growth: number; priority: 'high' | 'medium' | 'low' }[] {
    const segments = [];

    // Enterprise segment
    const enterpriseSize = (marketData.businessDensity / 100) * marketData.population / 1000;
    segments.push({
      segment: 'Enterprise & Corporate',
      size: Math.round(enterpriseSize),
      growth: marketData.gdpPerCapita > 30000 ? 15 : 10,
      priority: 'high' as const
    });

    // Government segment
    const governmentSize = marketData.population / 10000; // Rough estimate
    segments.push({
      segment: 'Government & Defense',
      size: Math.round(governmentSize),
      growth: 8,
      priority: station.technical_specs.services_supported.includes('Government') ? 'high' as const : 'medium' as const
    });

    // Telecom/ISP segment
    const telecomSize = (marketData.internetPenetration / 100) * marketData.population / 5000;
    segments.push({
      segment: 'Telecommunications',
      size: Math.round(telecomSize),
      growth: 12,
      priority: 'high' as const
    });

    // Broadcast/Media segment
    const broadcastSize = marketData.population / 20000;
    segments.push({
      segment: 'Broadcast & Media',
      size: Math.round(broadcastSize),
      growth: 5,
      priority: 'medium' as const
    });

    // Maritime segment (for coastal/island nations)
    if (['Singapore', 'Australia', 'Japan'].includes(station.location.country)) {
      segments.push({
        segment: 'Maritime Communications',
        size: 50,
        growth: 18,
        priority: 'high' as const
      });
    }

    return segments;
  }

  private identifyUnderservedMarkets(station: GroundStationAnalytics, marketData: any): {
    serviceGaps: { service: string; gapSize: number; opportunity: string }[];
    geographicGaps: { region: string; population: number; accessibility: number }[];
    demographicGaps: { segment: string; size: number; unmetNeed: string }[];
  } {
    // Identify service gaps
    const serviceGaps = this.identifyServiceGaps(station, marketData);
    
    // Identify geographic gaps
    const geographicGaps = this.identifyGeographicGaps(station, marketData);
    
    // Identify demographic gaps
    const demographicGaps = this.identifyDemographicGaps(station, marketData);

    return {
      serviceGaps,
      geographicGaps,
      demographicGaps
    };
  }

  private identifyServiceGaps(station: GroundStationAnalytics, marketData: any): { service: string; gapSize: number; opportunity: string }[] {
    const gaps: { service: string; gapSize: number; opportunity: string }[] = [];

    const allServices = ['DTH', 'Enterprise', 'Government', 'HTS', 'Maritime', 'Broadcast', 'CDN', 'IoT', 'Emergency'];
    const providedServices = station.technical_specs.services_supported;

    allServices.forEach(service => {
      if (!providedServices.includes(service)) {
        let gapSize = 0;
        let opportunity = '';

        switch (service) {
          case 'HTS':
            gapSize = marketData.businessDensity * 0.5;
            opportunity = 'High-throughput services for enterprise market';
            break;
          case 'IoT':
            gapSize = (marketData.internetPenetration - 70) * 2;
            opportunity = 'IoT connectivity for digital transformation';
            break;
          case 'Maritime':
            gapSize = ['Singapore', 'Australia', 'Japan'].includes(station.location.country) ? 30 : 5;
            opportunity = 'Ship-to-shore communications and vessel tracking';
            break;
          case 'Emergency':
            gapSize = 20;
            opportunity = 'Disaster recovery and emergency communications';
            break;
          default:
            gapSize = 10;
            opportunity = `Expand ${service.toLowerCase()} service offerings`;
        }

        if (gapSize > 0) {
          gaps.push({ service, gapSize: Math.round(gapSize), opportunity });
        }
      }
    });

    return gaps;
  }

  private identifyGeographicGaps(station: GroundStationAnalytics, marketData: any): { region: string; population: number; accessibility: number }[] {
    const gaps = [];

    // Simulate geographic analysis based on country characteristics
    if (station.location.country === 'Australia') {
      gaps.push(
        { region: 'Remote Mining Areas', population: 200000, accessibility: 30 },
        { region: 'Outback Communities', population: 150000, accessibility: 20 }
      );
    } else if (station.location.country === 'Brazil') {
      gaps.push(
        { region: 'Amazon Basin', population: 2000000, accessibility: 25 },
        { region: 'Rural Interior', population: 5000000, accessibility: 40 }
      );
    } else if (station.location.country === 'India') {
      gaps.push(
        { region: 'Remote Villages', population: 300000000, accessibility: 15 },
        { region: 'Mountain Regions', population: 50000000, accessibility: 35 }
      );
    } else {
      // Generic rural/remote gaps
      gaps.push({
        region: 'Rural Areas',
        population: Math.round(marketData.population * 0.2),
        accessibility: 50
      });
    }

    return gaps;
  }

  private identifyDemographicGaps(station: GroundStationAnalytics, marketData: any): { segment: string; size: number; unmetNeed: string }[] {
    const gaps = [];

    // Small/Medium Enterprises
    if (marketData.businessDensity > 60) {
      gaps.push({
        segment: 'Small/Medium Enterprises',
        size: Math.round(marketData.population / 1000),
        unmetNeed: 'Affordable, scalable connectivity solutions'
      });
    }

    // Educational Institutions
    gaps.push({
      segment: 'Educational Institutions',
      size: Math.round(marketData.population / 5000),
      unmetNeed: 'High-speed internet for remote learning'
    });

    // Healthcare Facilities
    gaps.push({
      segment: 'Healthcare Facilities',
      size: Math.round(marketData.population / 10000),
      unmetNeed: 'Reliable connectivity for telemedicine'
    });

    // Low-income segments (for developing markets)
    if (marketData.gdpPerCapita < 15000) {
      gaps.push({
        segment: 'Low-Income Communities',
        size: Math.round(marketData.population * 0.4),
        unmetNeed: 'Basic internet access and digital inclusion'
      });
    }

    return gaps;
  }

  private generateStrategicRecommendations(
    marketProfile: any,
    competitiveAnalysis: any,
    demandAnalysis: any,
    underservedAnalysis: any
  ): {
    marketEntry: string[];
    serviceExpansion: string[];
    pricing: string[];
    partnership: string[];
  } {
    const recommendations = {
      marketEntry: [] as string[],
      serviceExpansion: [] as string[],
      pricing: [] as string[],
      partnership: [] as string[]
    };

    // Market entry recommendations
    if (competitiveAnalysis.marketPosition === 'emerging') {
      recommendations.marketEntry.push('Focus on niche markets to establish presence');
      recommendations.marketEntry.push('Partner with local providers for market access');
    } else if (competitiveAnalysis.marketPosition === 'dominant') {
      recommendations.marketEntry.push('Leverage market leadership for premium positioning');
    }

    // Service expansion recommendations
    underservedAnalysis.serviceGaps.forEach((gap: any) => {
      if (gap.gapSize > 20) {
        recommendations.serviceExpansion.push(`High priority: Develop ${gap.service} capabilities`);
      }
    });

    // Pricing recommendations
    if (marketProfile.economicIndicators.gdpPerCapita > 40000) {
      recommendations.pricing.push('Premium pricing strategy supported by high GDP per capita');
    } else if (marketProfile.economicIndicators.gdpPerCapita < 15000) {
      recommendations.pricing.push('Volume-based pricing to capture developing market opportunity');
    }

    if (competitiveAnalysis.competitorCount > 6) {
      recommendations.pricing.push('Competitive pricing required due to high competition');
    }

    // Partnership recommendations
    underservedAnalysis.geographicGaps.forEach((gap: any) => {
      if (gap.accessibility < 40) {
        recommendations.partnership.push(`Partner with local operators to serve ${gap.region}`);
      }
    });

    if (demandAnalysis.demandSegments.some((segment: any) => segment.segment === 'Government & Defense' && segment.priority === 'high')) {
      recommendations.partnership.push('Develop government partnerships for defense contracts');
    }

    return recommendations;
  }

  private calculateAnalysisConfidence(
    station: GroundStationAnalytics,
    report: MarketIntelligenceReport
  ): number {
    let confidence = 0.7; // Base confidence for market analysis

    // Increase confidence for known markets
    if (this.marketDatabase[station.location.country as keyof typeof this.marketDatabase]) {
      confidence += 0.2;
    }

    // Increase confidence based on data completeness
    if (report.demandAnalysis.demandSegments.length > 3) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generateMarketRecommendations(report: MarketIntelligenceReport): string[] {
    const recommendations: string[] = [];

    // Add strategic recommendations
    recommendations.push(...report.strategicRecommendations.marketEntry);
    recommendations.push(...report.strategicRecommendations.serviceExpansion.slice(0, 2)); // Top 2 service recommendations

    // Add market-specific recommendations
    if (report.competitiveAnalysis.marketPosition === 'challenged') {
      recommendations.push('Differentiate through superior service quality and reliability');
    }

    if (report.demandAnalysis.growthPotential > 50) {
      recommendations.push('High growth market - consider capacity expansion investment');
    }

    return recommendations;
  }

  private identifyMarketWarnings(report: MarketIntelligenceReport): string[] {
    const warnings: string[] = [];

    // Competitive warnings
    if (report.competitiveAnalysis.marketShare < 10) {
      warnings.push('Low market share indicates competitive pressure');
    }

    if (report.competitiveAnalysis.competitorCount > 8) {
      warnings.push('Highly competitive market may pressure margins');
    }

    // Market size warnings
    if (report.marketProfile.marketSize === 'small') {
      warnings.push('Small market size may limit growth potential');
    }

    // Economic warnings
    if (report.marketProfile.economicIndicators.gdpPerCapita < 10000) {
      warnings.push('Low GDP per capita may constrain pricing power');
    }

    return warnings;
  }
}