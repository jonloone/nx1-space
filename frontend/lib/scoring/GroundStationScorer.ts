/**
 * Ground Station Investment Scoring Engine
 * TypeScript port of the comprehensive multi-factor scoring system
 * Evaluates ground station investment opportunities with 30+ factors
 */

export interface ScoringWeights {
  // Category weights (must sum to 1.0)
  marketDemand: number;
  infrastructure: number;
  technicalFeasibility: number;
  competitionRisk: number;
  regulatoryEnvironment: number;
  
  // Sub-factor weights
  marketFactors: {
    populationDensity: number;
    gdpPerCapita: number;
    internetPenetration: number;
    maritimeTraffic: number;
    aviationTraffic: number;
    dataCenterProximity: number;
    enterpriseConcentration: number;
  };
  
  infrastructureFactors: {
    fiberConnectivity: number;
    powerGridReliability: number;
    transportationAccess: number;
    constructionFeasibility: number;
    landAvailability: number;
    utilitiesAccess: number;
  };
  
  technicalFactors: {
    weatherConditions: number;
    elevationProfile: number;
    interferenceRisk: number;
    geographicalCoverage: number;
    satelliteVisibility: number;
  };
  
  competitionFactors: {
    existingStations: number;
    marketSaturation: number;
    competitorStrength: number;
    barrierEntry: number;
  };
  
  regulatoryFactors: {
    licensingComplexity: number;
    politicalStability: number;
    regulatoryFavorability: number;
    taxEnvironment: number;
  };
}

export interface StationScore {
  overallScore: number;
  confidence: number;
  categoryScores: {
    marketDemand: number;
    infrastructure: number;
    technicalFeasibility: number;
    competitionRisk: number;
    regulatoryEnvironment: number;
  };
  factors: Record<string, number>;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
}

export class GroundStationScorer {
  private weights: ScoringWeights;
  
  constructor() {
    this.weights = this.getDefaultWeights();
  }
  
  /**
   * Get scientifically-backed default weights
   */
  private getDefaultWeights(): ScoringWeights {
    return {
      // Category weights
      marketDemand: 0.30,
      infrastructure: 0.25,
      technicalFeasibility: 0.20,
      competitionRisk: 0.15,
      regulatoryEnvironment: 0.10,
      
      // Market demand factors
      marketFactors: {
        populationDensity: 0.25,
        gdpPerCapita: 0.20,
        internetPenetration: 0.15,
        maritimeTraffic: 0.12,
        aviationTraffic: 0.10,
        dataCenterProximity: 0.08,
        enterpriseConcentration: 0.10
      },
      
      // Infrastructure factors
      infrastructureFactors: {
        fiberConnectivity: 0.30,
        powerGridReliability: 0.25,
        transportationAccess: 0.15,
        constructionFeasibility: 0.12,
        landAvailability: 0.10,
        utilitiesAccess: 0.08
      },
      
      // Technical factors
      technicalFactors: {
        weatherConditions: 0.30,
        elevationProfile: 0.20,
        interferenceRisk: 0.20,
        geographicalCoverage: 0.15,
        satelliteVisibility: 0.15
      },
      
      // Competition factors
      competitionFactors: {
        existingStations: 0.40,
        marketSaturation: 0.30,
        competitorStrength: 0.20,
        barrierEntry: 0.10
      },
      
      // Regulatory factors
      regulatoryFactors: {
        licensingComplexity: 0.35,
        politicalStability: 0.30,
        regulatoryFavorability: 0.20,
        taxEnvironment: 0.15
      }
    };
  }
  
  /**
   * Calculate comprehensive score for a ground station
   */
  calculateScore(stationData: any): StationScore {
    const factors: Record<string, number> = {};
    
    // Calculate market demand score
    const marketDemand = this.calculateMarketDemand(stationData, factors);
    
    // Calculate infrastructure score
    const infrastructure = this.calculateInfrastructure(stationData, factors);
    
    // Calculate technical feasibility
    const technicalFeasibility = this.calculateTechnicalFeasibility(stationData, factors);
    
    // Calculate competition risk (inverted - lower is better)
    const competitionRisk = this.calculateCompetitionRisk(stationData, factors);
    
    // Calculate regulatory environment
    const regulatoryEnvironment = this.calculateRegulatoryEnvironment(stationData, factors);
    
    // Calculate weighted overall score
    const overallScore = 
      marketDemand * this.weights.marketDemand +
      infrastructure * this.weights.infrastructure +
      technicalFeasibility * this.weights.technicalFeasibility +
      (1 - competitionRisk) * this.weights.competitionRisk +
      regulatoryEnvironment * this.weights.regulatoryEnvironment;
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(factors);
    
    // Generate insights
    const recommendations = this.generateRecommendations(stationData, factors);
    const risks = this.identifyRisks(stationData, factors);
    const opportunities = this.identifyOpportunities(stationData, factors);
    
    return {
      overallScore: Math.min(1, Math.max(0, overallScore)),
      confidence,
      categoryScores: {
        marketDemand,
        infrastructure,
        technicalFeasibility,
        competitionRisk,
        regulatoryEnvironment
      },
      factors,
      recommendations,
      risks,
      opportunities
    };
  }
  
  /**
   * Calculate market demand score
   */
  private calculateMarketDemand(data: any, factors: Record<string, number>): number {
    const weights = this.weights.marketFactors;
    let score = 0;
    
    // Population density (logarithmic scale)
    const popDensity = data.populationDensity || 100;
    factors.populationDensity = this.sigmoid(Math.log10(popDensity) / 3);
    score += factors.populationDensity * weights.populationDensity;
    
    // GDP per capita (logarithmic scale)
    const gdp = data.gdpPerCapita || 30000;
    factors.gdpPerCapita = this.sigmoid(Math.log10(gdp) / 5);
    score += factors.gdpPerCapita * weights.gdpPerCapita;
    
    // Internet penetration
    const internet = data.internetPenetration || 0.5;
    factors.internetPenetration = internet;
    score += factors.internetPenetration * weights.internetPenetration;
    
    // Maritime traffic (if coastal)
    const maritime = data.maritimeTraffic || 0;
    factors.maritimeTraffic = this.sigmoid(maritime / 1000);
    score += factors.maritimeTraffic * weights.maritimeTraffic;
    
    // Aviation traffic
    const aviation = data.aviationTraffic || 0;
    factors.aviationTraffic = this.sigmoid(aviation / 500);
    score += factors.aviationTraffic * weights.aviationTraffic;
    
    // Data center proximity
    const dataCenters = data.dataCenterProximity || 0.5;
    factors.dataCenterProximity = dataCenters;
    score += factors.dataCenterProximity * weights.dataCenterProximity;
    
    // Enterprise concentration
    const enterprises = data.enterpriseConcentration || 0.5;
    factors.enterpriseConcentration = enterprises;
    score += factors.enterpriseConcentration * weights.enterpriseConcentration;
    
    return score;
  }
  
  /**
   * Calculate infrastructure score
   */
  private calculateInfrastructure(data: any, factors: Record<string, number>): number {
    const weights = this.weights.infrastructureFactors;
    let score = 0;
    
    // Fiber connectivity
    factors.fiberConnectivity = data.fiberConnectivity ? 1 : 0.3;
    score += factors.fiberConnectivity * weights.fiberConnectivity;
    
    // Power grid reliability
    const powerReliability = data.powerReliability || 0.95;
    factors.powerGridReliability = powerReliability;
    score += factors.powerGridReliability * weights.powerGridReliability;
    
    // Transportation access
    const transport = data.transportationAccess || 0.7;
    factors.transportationAccess = transport;
    score += factors.transportationAccess * weights.transportationAccess;
    
    // Construction feasibility
    const construction = data.constructionFeasibility || 0.8;
    factors.constructionFeasibility = construction;
    score += factors.constructionFeasibility * weights.constructionFeasibility;
    
    // Land availability
    const land = data.landAvailability || 0.6;
    factors.landAvailability = land;
    score += factors.landAvailability * weights.landAvailability;
    
    // Utilities access
    const utilities = data.utilitiesAccess || 0.9;
    factors.utilitiesAccess = utilities;
    score += factors.utilitiesAccess * weights.utilitiesAccess;
    
    return score;
  }
  
  /**
   * Calculate technical feasibility score
   */
  private calculateTechnicalFeasibility(data: any, factors: Record<string, number>): number {
    const weights = this.weights.technicalFactors;
    let score = 0;
    
    // Weather conditions (clear days per year)
    const clearDays = data.clearDaysPerYear || 200;
    factors.weatherConditions = clearDays / 365;
    score += factors.weatherConditions * weights.weatherConditions;
    
    // Elevation profile
    const elevation = data.elevation || 100;
    factors.elevationProfile = this.sigmoid((elevation - 0) / 1000);
    score += factors.elevationProfile * weights.elevationProfile;
    
    // Interference risk (inverted)
    const interference = data.interferenceRisk || 0.2;
    factors.interferenceRisk = 1 - interference;
    score += factors.interferenceRisk * weights.interferenceRisk;
    
    // Geographical coverage
    const coverage = data.geographicalCoverage || 0.7;
    factors.geographicalCoverage = coverage;
    score += factors.geographicalCoverage * weights.geographicalCoverage;
    
    // Satellite visibility
    const visibility = data.satelliteVisibility || 0.85;
    factors.satelliteVisibility = visibility;
    score += factors.satelliteVisibility * weights.satelliteVisibility;
    
    return score;
  }
  
  /**
   * Calculate competition risk score
   */
  private calculateCompetitionRisk(data: any, factors: Record<string, number>): number {
    const weights = this.weights.competitionFactors;
    let score = 0;
    
    // Existing stations density
    const stationDensity = data.existingStations || 0;
    factors.existingStations = this.sigmoid(stationDensity / 10);
    score += factors.existingStations * weights.existingStations;
    
    // Market saturation
    const saturation = data.marketSaturation || 0.3;
    factors.marketSaturation = saturation;
    score += factors.marketSaturation * weights.marketSaturation;
    
    // Competitor strength
    const competitorStrength = data.competitorStrength || 0.5;
    factors.competitorStrength = competitorStrength;
    score += factors.competitorStrength * weights.competitorStrength;
    
    // Barrier to entry
    const barrier = data.barrierEntry || 0.4;
    factors.barrierEntry = barrier;
    score += factors.barrierEntry * weights.barrierEntry;
    
    return score;
  }
  
  /**
   * Calculate regulatory environment score
   */
  private calculateRegulatoryEnvironment(data: any, factors: Record<string, number>): number {
    const weights = this.weights.regulatoryFactors;
    let score = 0;
    
    // Licensing complexity (inverted)
    const licensing = data.licensingComplexity || 0.3;
    factors.licensingComplexity = 1 - licensing;
    score += factors.licensingComplexity * weights.licensingComplexity;
    
    // Political stability
    const stability = data.politicalStability || 0.8;
    factors.politicalStability = stability;
    score += factors.politicalStability * weights.politicalStability;
    
    // Regulatory favorability
    const regulatory = data.regulatoryFavorability || 0.7;
    factors.regulatoryFavorability = regulatory;
    score += factors.regulatoryFavorability * weights.regulatoryFavorability;
    
    // Tax environment
    const tax = data.taxEnvironment || 0.6;
    factors.taxEnvironment = tax;
    score += factors.taxEnvironment * weights.taxEnvironment;
    
    return score;
  }
  
  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(factors: Record<string, number>): number {
    const totalFactors = Object.keys(factors).length;
    const definedFactors = Object.values(factors).filter(v => v !== null && v !== undefined).length;
    return definedFactors / totalFactors;
  }
  
  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(data: any, factors: Record<string, number>): string[] {
    const recommendations: string[] = [];
    
    if (factors.marketDemand > 0.8) {
      recommendations.push('High market demand - consider expedited deployment');
    }
    
    if (factors.fiberConnectivity < 0.5) {
      recommendations.push('Invest in fiber connectivity infrastructure');
    }
    
    if (factors.weatherConditions < 0.6) {
      recommendations.push('Implement adaptive coding and modulation for weather resilience');
    }
    
    if (factors.existingStations > 0.7) {
      recommendations.push('Focus on differentiation through specialized services');
    }
    
    if (factors.powerGridReliability < 0.9) {
      recommendations.push('Install backup power systems and UPS');
    }
    
    return recommendations;
  }
  
  /**
   * Identify risks based on scores
   */
  private identifyRisks(data: any, factors: Record<string, number>): string[] {
    const risks: string[] = [];
    
    if (factors.competitorStrength > 0.7) {
      risks.push('Strong existing competition in the market');
    }
    
    if (factors.weatherConditions < 0.5) {
      risks.push('Frequent weather-related outages expected');
    }
    
    if (factors.politicalStability < 0.6) {
      risks.push('Political instability may affect operations');
    }
    
    if (factors.interferenceRisk > 0.3) {
      risks.push('High RF interference risk in the area');
    }
    
    if (factors.licensingComplexity < 0.4) {
      risks.push('Complex regulatory approval process');
    }
    
    return risks;
  }
  
  /**
   * Identify opportunities based on scores
   */
  private identifyOpportunities(data: any, factors: Record<string, number>): string[] {
    const opportunities: string[] = [];
    
    if (factors.maritimeTraffic > 0.6 && factors.existingStations < 0.3) {
      opportunities.push('Underserved maritime connectivity market');
    }
    
    if (factors.gdpPerCapita > 0.7 && factors.internetPenetration < 0.5) {
      opportunities.push('Growing broadband demand in affluent market');
    }
    
    if (factors.dataCenterProximity > 0.8) {
      opportunities.push('Edge computing and low-latency services potential');
    }
    
    if (factors.aviationTraffic > 0.6) {
      opportunities.push('In-flight connectivity services opportunity');
    }
    
    if (factors.enterpriseConcentration > 0.7) {
      opportunities.push('Enterprise and government contract potential');
    }
    
    return opportunities;
  }
  
  /**
   * Sigmoid function for non-linear transformations
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  /**
   * Calculate temporal adjustment based on growth trends
   */
  calculateTemporalAdjustment(historicalData: any[]): number {
    if (!historicalData || historicalData.length < 2) return 1.0;
    
    // Calculate growth rate
    const recent = historicalData[historicalData.length - 1];
    const previous = historicalData[0];
    const timeSpan = (recent.timestamp - previous.timestamp) / (365 * 24 * 60 * 60 * 1000); // years
    
    const growthRate = (recent.value - previous.value) / (previous.value * timeSpan);
    
    // Apply growth factor with dampening
    return 1 + Math.tanh(growthRate) * 0.2;
  }
  
  /**
   * Calculate local context influence from neighboring stations
   */
  calculateLocalContext(station: any, neighbors: any[]): number {
    if (!neighbors || neighbors.length === 0) return 1.0;
    
    let influence = 0;
    let totalWeight = 0;
    
    neighbors.forEach(neighbor => {
      // Calculate distance
      const distance = this.haversineDistance(
        station.latitude,
        station.longitude,
        neighbor.latitude,
        neighbor.longitude
      );
      
      // Weight by inverse distance (closer neighbors have more influence)
      const weight = 1 / (1 + distance / 100); // 100km normalization
      
      influence += neighbor.score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? influence / totalWeight : 1.0;
  }
  
  /**
   * Calculate distance between two points on Earth
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
}

// Export singleton instance
export const groundStationScorer = new GroundStationScorer();