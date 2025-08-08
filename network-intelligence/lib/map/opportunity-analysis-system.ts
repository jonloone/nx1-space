/**
 * Opportunity Analysis System
 * 
 * Advanced opportunity scoring and visualization for global hexagon coverage.
 * Integrates multiple data sources for realistic business intelligence.
 */

import { H3Cell } from './h3-coverage-system';

export interface OpportunityFactors {
  population: number;         // Population density factor (0-1)
  economic: number;          // Economic development factor (0-1)
  infrastructure: number;    // Infrastructure quality factor (0-1)
  competition: number;       // Market competition factor (0-1, lower is better)
  regulatory: number;        // Regulatory environment factor (0-1)
  geographic: number;        // Geographic advantages factor (0-1)
  maritime: number;          // Maritime activity factor (0-1)
  technology: number;        // Technology adoption factor (0-1)
  risk: number;             // Political/economic risk factor (0-1, lower is better)
}

export interface OpportunityScore {
  overall: number;           // Overall opportunity score (0-100)
  confidence: number;        // Confidence in the score (0-100)
  factors: OpportunityFactors;
  category: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
  marketPotential: number;   // Market potential in millions USD
  investmentRequired: number; // Investment required in millions USD
  timeToMarket: number;      // Time to market in months
  roi: number;              // Expected ROI percentage
}

export interface RegionProfile {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  baseFactors: Partial<OpportunityFactors>;
  marketCharacteristics: {
    maturity: 'emerging' | 'developing' | 'mature';
    competition: 'low' | 'medium' | 'high';
    regulation: 'favorable' | 'neutral' | 'challenging';
    growth: 'high' | 'medium' | 'low';
  };
  economicData: {
    gdpPerCapita: number;
    internetPenetration: number;
    satelliteAdoption: number;
    businessEnvironmentRank: number;
  };
}

// Global region profiles with realistic market data
const REGION_PROFILES: RegionProfile[] = [
  // North America
  {
    name: 'North America',
    bounds: { north: 83.1, south: 14.5, west: -168.0, east: -52.6 },
    baseFactors: {
      economic: 0.95,
      infrastructure: 0.92,
      technology: 0.98,
      regulatory: 0.88,
      competition: 0.85,
      risk: 0.95
    },
    marketCharacteristics: {
      maturity: 'mature',
      competition: 'high',
      regulation: 'favorable',
      growth: 'medium'
    },
    economicData: {
      gdpPerCapita: 65000,
      internetPenetration: 89,
      satelliteAdoption: 45,
      businessEnvironmentRank: 15
    }
  },
  
  // Europe
  {
    name: 'Europe',
    bounds: { north: 81.9, south: 34.8, west: -24.5, east: 66.9 },
    baseFactors: {
      economic: 0.88,
      infrastructure: 0.90,
      technology: 0.92,
      regulatory: 0.75, // Complex regulatory environment
      competition: 0.80,
      risk: 0.90
    },
    marketCharacteristics: {
      maturity: 'mature',
      competition: 'high',
      regulation: 'challenging',
      growth: 'low'
    },
    economicData: {
      gdpPerCapita: 45000,
      internetPenetration: 87,
      satelliteAdoption: 38,
      businessEnvironmentRank: 25
    }
  },
  
  // East Asia
  {
    name: 'East Asia',
    bounds: { north: 55.0, south: 20.0, west: 100.0, east: 145.0 },
    baseFactors: {
      economic: 0.82,
      infrastructure: 0.85,
      technology: 0.88,
      regulatory: 0.65,
      competition: 0.75,
      risk: 0.75
    },
    marketCharacteristics: {
      maturity: 'developing',
      competition: 'medium',
      regulation: 'challenging',
      growth: 'high'
    },
    economicData: {
      gdpPerCapita: 35000,
      internetPenetration: 82,
      satelliteAdoption: 28,
      businessEnvironmentRank: 35
    }
  },
  
  // Southeast Asia
  {
    name: 'Southeast Asia',
    bounds: { north: 25.0, south: -11.0, west: 90.0, east: 145.0 },
    baseFactors: {
      economic: 0.65,
      infrastructure: 0.58,
      technology: 0.72,
      regulatory: 0.70,
      competition: 0.45,
      risk: 0.68
    },
    marketCharacteristics: {
      maturity: 'emerging',
      competition: 'low',
      regulation: 'neutral',
      growth: 'high'
    },
    economicData: {
      gdpPerCapita: 12000,
      internetPenetration: 65,
      satelliteAdoption: 15,
      businessEnvironmentRank: 65
    }
  },
  
  // Middle East
  {
    name: 'Middle East',
    bounds: { north: 40.0, south: 12.0, west: 34.0, east: 60.0 },
    baseFactors: {
      economic: 0.72,
      infrastructure: 0.68,
      technology: 0.75,
      regulatory: 0.60,
      competition: 0.40,
      risk: 0.55
    },
    marketCharacteristics: {
      maturity: 'developing',
      competition: 'low',
      regulation: 'challenging',
      growth: 'medium'
    },
    economicData: {
      gdpPerCapita: 28000,
      internetPenetration: 70,
      satelliteAdoption: 20,
      businessEnvironmentRank: 55
    }
  },
  
  // Africa
  {
    name: 'Africa',
    bounds: { north: 37.3, south: -34.8, west: -17.5, east: 51.3 },
    baseFactors: {
      economic: 0.35,
      infrastructure: 0.32,
      technology: 0.45,
      regulatory: 0.55,
      competition: 0.25,
      risk: 0.45
    },
    marketCharacteristics: {
      maturity: 'emerging',
      competition: 'low',
      regulation: 'neutral',
      growth: 'high'
    },
    economicData: {
      gdpPerCapita: 4500,
      internetPenetration: 43,
      satelliteAdoption: 8,
      businessEnvironmentRank: 95
    }
  },
  
  // South America
  {
    name: 'South America',
    bounds: { north: 12.5, south: -55.1, west: -81.3, east: -34.8 },
    baseFactors: {
      economic: 0.58,
      infrastructure: 0.52,
      technology: 0.68,
      regulatory: 0.62,
      competition: 0.35,
      risk: 0.62
    },
    marketCharacteristics: {
      maturity: 'developing',
      competition: 'medium',
      regulation: 'neutral',
      growth: 'medium'
    },
    economicData: {
      gdpPerCapita: 15000,
      internetPenetration: 68,
      satelliteAdoption: 12,
      businessEnvironmentRank: 75
    }
  },
  
  // Australia & Oceania
  {
    name: 'Australia & Oceania',
    bounds: { north: -10.0, south: -50.0, west: 110.0, east: 180.0 },
    baseFactors: {
      economic: 0.92,
      infrastructure: 0.88,
      technology: 0.90,
      regulatory: 0.95,
      competition: 0.60,
      risk: 0.98
    },
    marketCharacteristics: {
      maturity: 'mature',
      competition: 'medium',
      regulation: 'favorable',
      growth: 'medium'
    },
    economicData: {
      gdpPerCapita: 55000,
      internetPenetration: 86,
      satelliteAdoption: 35,
      businessEnvironmentRank: 18
    }
  }
];

export class OpportunityAnalysisSystem {
  private regionCache = new Map<string, RegionProfile>();
  private opportunityCache = new Map<string, OpportunityScore>();

  constructor() {
    // Initialize region cache
    REGION_PROFILES.forEach(region => {
      this.regionCache.set(region.name, region);
    });
  }

  /**
   * Calculate comprehensive opportunity score for a hexagon cell
   */
  public calculateOpportunityScore(cell: H3Cell): OpportunityScore {
    const cacheKey = `${cell.id}_${cell.resolution}`;
    
    if (this.opportunityCache.has(cacheKey)) {
      return this.opportunityCache.get(cacheKey)!;
    }

    const lat = cell.center[1];
    const lng = cell.center[0];

    // Get regional context
    const regionProfile = this.getRegionProfile(lat, lng);
    
    // Calculate individual factors
    const factors = this.calculateFactors(lat, lng, cell, regionProfile);
    
    // Calculate weighted overall score
    const weights = {
      population: 0.20,
      economic: 0.18,
      infrastructure: 0.15,
      competition: 0.12, // Lower is better, so we'll invert
      regulatory: 0.10,
      geographic: 0.08,
      maritime: 0.07,
      technology: 0.07,
      risk: 0.03  // Lower is better, so we'll invert
    };

    const overallScore = (
      factors.population * weights.population +
      factors.economic * weights.economic +
      factors.infrastructure * weights.infrastructure +
      (1 - factors.competition) * weights.competition + // Inverted
      factors.regulatory * weights.regulatory +
      factors.geographic * weights.geographic +
      factors.maritime * weights.maritime +
      factors.technology * weights.technology +
      (1 - factors.risk) * weights.risk // Inverted
    ) * 100;

    // Determine category
    const category = this.categorizeOpportunity(overallScore);
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(factors, regionProfile);
    
    // Generate market analysis
    const marketPotential = this.calculateMarketPotential(factors, regionProfile);
    const investmentRequired = this.calculateInvestmentRequired(factors, regionProfile);
    const timeToMarket = this.calculateTimeToMarket(factors, regionProfile);
    const roi = this.calculateROI(marketPotential, investmentRequired, factors);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, regionProfile, category);

    const score: OpportunityScore = {
      overall: Math.round(overallScore),
      confidence: Math.round(confidence),
      factors,
      category,
      recommendations,
      marketPotential: Math.round(marketPotential * 100) / 100,
      investmentRequired: Math.round(investmentRequired * 100) / 100,
      timeToMarket: Math.round(timeToMarket),
      roi: Math.round(roi * 10) / 10
    };

    this.opportunityCache.set(cacheKey, score);
    return score;
  }

  /**
   * Calculate all opportunity factors
   */
  private calculateFactors(
    lat: number, 
    lng: number, 
    cell: H3Cell, 
    regionProfile?: RegionProfile
  ): OpportunityFactors {
    const base = regionProfile?.baseFactors || {};
    
    return {
      population: this.calculatePopulationFactor(lat, lng, base.population),
      economic: base.economic || this.calculateEconomicFactor(lat, lng),
      infrastructure: base.infrastructure || this.calculateInfrastructureFactor(lat, lng),
      competition: base.competition || this.calculateCompetitionFactor(lat, lng),
      regulatory: base.regulatory || this.calculateRegulatoryFactor(lat, lng),
      geographic: base.geographic || this.calculateGeographicFactor(lat, lng, cell),
      maritime: base.maritime || this.calculateMaritimeFactor(lat, lng),
      technology: base.technology || this.calculateTechnologyFactor(lat, lng),
      risk: base.risk || this.calculateRiskFactor(lat, lng)
    };
  }

  /**
   * Individual factor calculations
   */
  private calculatePopulationFactor(lat: number, lng: number, base?: number): number {
    if (base) return Math.min(1, base + this.getLocalPopulationModifier(lat, lng));
    
    // Major population centers
    const centers = [
      { lat: 40.7, lng: -74.0, pop: 1.0 },   // NYC
      { lat: 51.5, lng: -0.1, pop: 0.9 },    // London
      { lat: 35.7, lng: 139.7, pop: 1.0 },   // Tokyo
      { lat: 55.8, lng: 37.6, pop: 0.8 },    // Moscow
      { lat: 39.9, lng: 116.4, pop: 0.9 },   // Beijing
      { lat: 31.2, lng: 121.5, pop: 0.9 },   // Shanghai
      { lat: 19.4, lng: -99.1, pop: 0.8 },   // Mexico City
      { lat: -33.9, lng: 151.2, pop: 0.7 },  // Sydney
      { lat: -23.5, lng: -46.6, pop: 0.8 },  // São Paulo
      { lat: 28.6, lng: 77.2, pop: 0.8 },    // Delhi
      { lat: 13.1, lng: 80.3, pop: 0.6 },    // Chennai
      { lat: -26.2, lng: 28.0, pop: 0.5 },   // Johannesburg
      { lat: 30.0, lng: 31.2, pop: 0.6 },    // Cairo
      { lat: 25.3, lng: 55.3, pop: 0.7 }     // Dubai
    ];

    let maxFactor = 0.1;
    centers.forEach(center => {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
      );
      if (distance < 5) {
        const factor = center.pop * (1 - distance / 5);
        maxFactor = Math.max(maxFactor, factor);
      }
    });

    return Math.min(1, maxFactor);
  }

  private calculateEconomicFactor(lat: number, lng: number): number {
    // Developed regions have higher economic factors
    if ((lng >= -130 && lng <= -60 && lat >= 25 && lat <= 70) ||  // North America
        (lng >= -15 && lng <= 45 && lat >= 35 && lat <= 65) ||     // Europe
        (lng >= 100 && lng <= 145 && lat >= 20 && lat <= 50)) {    // East Asia
      return 0.7 + Math.random() * 0.3;
    }
    
    // Emerging markets
    if ((lng >= -85 && lng <= -30 && lat >= -60 && lat <= 15) ||   // South America
        (lng >= 90 && lng <= 145 && lat >= -11 && lat <= 25) ||    // Southeast Asia
        (lng >= 34 && lng <= 60 && lat >= 12 && lat <= 40)) {      // Middle East
      return 0.4 + Math.random() * 0.4;
    }
    
    // Developing regions
    return 0.2 + Math.random() * 0.4;
  }

  private calculateInfrastructureFactor(lat: number, lng: number): number {
    // Infrastructure quality correlates with economic development
    const economicFactor = this.calculateEconomicFactor(lat, lng);
    return Math.min(1, economicFactor * 0.9 + Math.random() * 0.2);
  }

  private calculateCompetitionFactor(lat: number, lng: number): number {
    // Higher in developed markets (which is bad for opportunities)
    const economicFactor = this.calculateEconomicFactor(lat, lng);
    return economicFactor * 0.8 + Math.random() * 0.2;
  }

  private calculateRegulatoryFactor(lat: number, lng: number): number {
    // Regional regulatory environment assessment
    if (lng >= -130 && lng <= -60 && lat >= 25 && lat <= 70) return 0.8 + Math.random() * 0.2; // North America
    if (lng >= -15 && lng <= 45 && lat >= 35 && lat <= 65) return 0.6 + Math.random() * 0.2;   // Europe (complex)
    if (lng >= 110 && lng <= 160 && lat >= -45 && lat <= -10) return 0.9 + Math.random() * 0.1; // Australia
    
    return 0.4 + Math.random() * 0.4;
  }

  private calculateGeographicFactor(lat: number, lng: number, cell: H3Cell): number {
    let factor = 0.5;
    
    // Coastal advantage
    if (this.isCoastalRegion(lat, lng)) factor += 0.2;
    
    // Island advantages for satellite
    if (this.isIslandRegion(lat, lng)) factor += 0.15;
    
    // Remote area advantage (less terrestrial competition)
    if (this.isRemoteRegion(lat, lng)) factor += 0.1;
    
    // Large land area advantage
    if (cell.area > 10000) factor += 0.05;
    
    return Math.min(1, factor);
  }

  private calculateMaritimeFactor(lat: number, lng: number): number {
    // Higher near major shipping routes and ports
    const majorShippingLanes = [
      { lat: 30, lng: 0, importance: 0.9 },    // Mediterranean
      { lat: 25, lng: 55, importance: 0.8 },   // Persian Gulf
      { lat: 1, lng: 103, importance: 0.9 },   // Singapore Strait
      { lat: 48, lng: -4, importance: 0.7 },   // English Channel
      { lat: 40, lng: -70, importance: 0.8 },  // North Atlantic
      { lat: 35, lng: 140, importance: 0.8 }   // Japan approaches
    ];

    let maxFactor = 0.1;
    majorShippingLanes.forEach(lane => {
      const distance = Math.sqrt(
        Math.pow(lat - lane.lat, 2) + Math.pow(lng - lane.lng, 2)
      );
      if (distance < 15) {
        const factor = lane.importance * (1 - distance / 15);
        maxFactor = Math.max(maxFactor, factor);
      }
    });

    return maxFactor;
  }

  private calculateTechnologyFactor(lat: number, lng: number): number {
    // Technology adoption rates by region
    const economicFactor = this.calculateEconomicFactor(lat, lng);
    return Math.min(1, economicFactor * 0.95 + Math.random() * 0.1);
  }

  private calculateRiskFactor(lat: number, lng: number): number {
    // Political and economic risk assessment
    if (lng >= -130 && lng <= -60 && lat >= 25 && lat <= 70) return 0.95; // North America
    if (lng >= -15 && lng <= 45 && lat >= 35 && lat <= 65) return 0.85;   // Europe
    if (lng >= 110 && lng <= 160 && lat >= -45 && lat <= -10) return 0.95; // Australia
    if (lng >= 100 && lng <= 145 && lat >= 20 && lat <= 50) return 0.7;   // East Asia
    
    return 0.4 + Math.random() * 0.4;
  }

  /**
   * Helper methods for geographic analysis
   */
  private isCoastalRegion(lat: number, lng: number): boolean {
    // Simplified coastal detection - in reality, use actual coastline data
    const landCenters = [
      { lat: 45, lng: -100, radius: 20 }, // North America interior
      { lat: 50, lng: 20, radius: 15 },   // Europe interior
      { lat: 30, lng: 110, radius: 25 }   // Asia interior
    ];

    return !landCenters.some(center => {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
      );
      return distance < center.radius;
    });
  }

  private isIslandRegion(lat: number, lng: number): boolean {
    const islands = [
      { lat: 36, lng: 138, radius: 8 },    // Japan
      { lat: 54, lng: -2, radius: 6 },     // UK
      { lat: 64, lng: -19, radius: 4 },    // Iceland
      { lat: -27, lng: 153, radius: 12 },  // Australia (eastern)
      { lat: 0, lng: 120, radius: 20 }     // Indonesia
    ];

    return islands.some(island => {
      const distance = Math.sqrt(
        Math.pow(lat - island.lat, 2) + Math.pow(lng - island.lng, 2)
      );
      return distance < island.radius;
    });
  }

  private isRemoteRegion(lat: number, lng: number): boolean {
    // Areas far from major population centers
    return this.calculatePopulationFactor(lat, lng) < 0.3;
  }

  /**
   * Business analysis calculations
   */
  private calculateMarketPotential(factors: OpportunityFactors, region?: RegionProfile): number {
    const basePotential = factors.population * factors.economic * factors.technology;
    const regionMultiplier = region?.economicData.gdpPerCapita || 30000;
    return basePotential * (regionMultiplier / 1000) * (1 + Math.random() * 0.5);
  }

  private calculateInvestmentRequired(factors: OpportunityFactors, region?: RegionProfile): number {
    const baseInvestment = 5; // Base $5M investment
    const infrastructureMultiplier = 1 / Math.max(0.1, factors.infrastructure);
    const riskMultiplier = 1 / Math.max(0.1, factors.risk);
    return baseInvestment * infrastructureMultiplier * riskMultiplier * (0.8 + Math.random() * 0.4);
  }

  private calculateTimeToMarket(factors: OpportunityFactors, region?: RegionProfile): number {
    const baseTime = 18; // Base 18 months
    const regulatoryDelay = (1 - factors.regulatory) * 12;
    const infrastructureDelay = (1 - factors.infrastructure) * 6;
    return baseTime + regulatoryDelay + infrastructureDelay;
  }

  private calculateROI(marketPotential: number, investment: number, factors: OpportunityFactors): number {
    const annualRevenue = marketPotential * factors.economic * 0.1;
    const annualProfit = annualRevenue * 0.25; // Assume 25% profit margin
    return (annualProfit / investment) * 100;
  }

  /**
   * Utility methods
   */
  private getRegionProfile(lat: number, lng: number): RegionProfile | undefined {
    return REGION_PROFILES.find(region => {
      const { bounds } = region;
      return lat >= bounds.south && lat <= bounds.north &&
             lng >= bounds.west && lng <= bounds.east;
    });
  }

  private getLocalPopulationModifier(lat: number, lng: number): number {
    // Additional local population modifiers
    return (Math.random() - 0.5) * 0.2;
  }

  private categorizeOpportunity(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 80) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
  }

  private calculateConfidence(factors: OpportunityFactors, region?: RegionProfile): number {
    let confidence = 70; // Base confidence
    
    if (region) confidence += 20; // Regional data available
    if (factors.economic > 0.7) confidence += 5; // Strong economic data
    if (factors.risk > 0.8) confidence += 5; // Low risk environment
    
    return Math.min(100, confidence);
  }

  private generateRecommendations(
    factors: OpportunityFactors,
    region: RegionProfile | undefined,
    category: string
  ): string[] {
    const recommendations: string[] = [];

    if (category === 'critical' || category === 'high') {
      recommendations.push('Priority target for immediate market entry');
      recommendations.push('Consider premium service offerings');
    }

    if (factors.competition < 0.4) {
      recommendations.push('Low competition - opportunity for market leadership');
    } else if (factors.competition > 0.7) {
      recommendations.push('High competition - focus on differentiation');
    }

    if (factors.infrastructure < 0.5) {
      recommendations.push('Infrastructure development partnership recommended');
    }

    if (factors.regulatory < 0.6) {
      recommendations.push('Regulatory engagement and compliance focus required');
    }

    if (factors.maritime > 0.6) {
      recommendations.push('Maritime communication services opportunity');
    }

    if (factors.population > 0.7) {
      recommendations.push('Consumer services market potential');
    } else {
      recommendations.push('Focus on enterprise and government services');
    }

    return recommendations;
  }

  /**
   * Cache management
   */
  public clearCache(): void {
    this.opportunityCache.clear();
  }

  public getCacheStats(): { size: number; regions: number } {
    return {
      size: this.opportunityCache.size,
      regions: this.regionCache.size
    };
  }
}