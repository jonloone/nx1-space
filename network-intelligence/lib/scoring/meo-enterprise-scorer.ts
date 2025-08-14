/**
 * MEO-Focused Enterprise Scoring System
 * Optimized for O3b mPOWER and enterprise/government customers
 * Uses ML-based opportunity scorer with enterprise-focused features
 */

import { mlOpportunityScorer } from '@/lib/scoring/ml-opportunity-scorer';

export interface EnterpriseLocation {
  latitude: number
  longitude: number
  type: 'data_center' | 'government' | 'business_district' | 'telecom_hub' | 'financial_center'
  name?: string
  importance?: number // 0-1 scale
}

export interface MEOScoringWeights {
  enterprise_density: number     // Data centers, corporate HQs (35%)
  government_proximity: number   // Military, federal facilities (25%)
  telecom_infrastructure: number // Fiber POPs, carrier hotels (20%)
  economic_activity: number      // GDP, business activity (10%)
  maritime_traffic: number       // Reduced - not end customer (5%)
  competition: number            // Existing infrastructure (5%)
}

export interface MEOScoringResult {
  score: number                  // 0-100
  confidence: number             // 0-1
  components: {
    enterprise: number
    government: number
    telecom: number
    economic: number
    maritime: number
    competition: number
  }
  meoAdvantages: {
    latencyMs: number           // MEO: ~150ms vs GEO: ~600ms
    throughputGbps: number      // Potential throughput
    availabilityPercent: number // Ka-band availability
  }
  recommendations: string[]
}

export class MEOEnterpriseScorer {
  private weights: MEOScoringWeights
  private enterpriseLocations: EnterpriseLocation[]
  
  constructor() {
    // MEO/Enterprise optimized weights (empirically derived)
    this.weights = {
      enterprise_density: 0.35,      // PRIMARY: Data centers and enterprise
      government_proximity: 0.25,    // Government and defense
      telecom_infrastructure: 0.20,  // Connectivity infrastructure
      economic_activity: 0.10,        // Business activity
      maritime_traffic: 0.05,         // REDUCED: Not primary customer
      competition: 0.05               // Competitive landscape
    }
    
    // Initialize with known enterprise locations
    this.enterpriseLocations = this.loadEnterpriseLocations()
  }
  
  /**
   * Score a location for MEO ground station placement using ML scorer
   * Focused on enterprise/government opportunities
   */
  scoreLocation(lat: number, lon: number): MEOScoringResult {
    // Gather features for ML scorer
    const enterprise = this.scoreEnterpriseDensity(lat, lon)
    const government = this.scoreGovernmentProximity(lat, lon)
    const telecom = this.scoreTelecomInfrastructure(lat, lon)
    const economic = this.scoreEconomicActivity(lat, lon)
    const maritime = this.scoreMaritimeTraffic(lat, lon)
    const competition = this.scoreCompetition(lat, lon)
    
    // Convert MEO-specific features for ML scorer
    const mlFeatures = {
      gdpPerCapita: economic * 100000, // Scale to realistic GDP values
      populationDensity: enterprise * 1000, // Enterprise density as population proxy
      competitorCount: (1 - competition) * 10, // Convert competition score to count
      infrastructureScore: telecom, // Direct mapping
      maritimeDensity: maritime * 100, // Scale maritime score
      elevation: 100, // Default for MEO locations
      weatherReliability: this.calculateKaBandAvailability(lat, lon) / 100,
      regulatoryScore: government // Government proximity as regulatory proxy
    }
    
    // Use ML scorer for primary scoring
    const mlResult = mlOpportunityScorer.scoreOpportunity(lat, lon, mlFeatures)
    const mlScore = mlResult.score / 100 // Convert to 0-1 range
    
    // Calculate confidence combining ML confidence with data quality
    const confidence = Math.min(mlResult.confidence * this.calculateConfidence(lat, lon), 0.95)
    
    // MEO-specific advantages
    const meoAdvantages = this.calculateMEOAdvantages(lat, lon)
    
    // Generate recommendations using both ML insights and domain knowledge
    const recommendations = this.generateMLBasedRecommendations(
      mlResult, 
      { enterprise, government, telecom, economic, maritime, competition },
      meoAdvantages
    )
    
    return {
      score: Math.round(mlScore * 100),
      confidence,
      components: {
        enterprise: Math.round(enterprise * 100),
        government: Math.round(government * 100),
        telecom: Math.round(telecom * 100),
        economic: Math.round(economic * 100),
        maritime: Math.round(maritime * 100),
        competition: Math.round(competition * 100)
      },
      meoAdvantages,
      recommendations
    }
  }
  
  /**
   * Score enterprise density - PRIMARY FACTOR (35%)
   * Focuses on data centers, corporate HQs, business parks
   */
  private scoreEnterpriseDensity(lat: number, lon: number): number {
    let score = 0
    
    // Major data center hubs get highest scores
    const dataCenterHubs = [
      { lat: 38.95, lon: -77.45, name: 'Northern Virginia', weight: 1.0 }, // World's largest
      { lat: 37.37, lon: -121.92, name: 'Silicon Valley', weight: 0.9 },
      { lat: 50.11, lon: 8.68, name: 'Frankfurt', weight: 0.85 },
      { lat: 1.29, lon: 103.85, name: 'Singapore', weight: 0.85 },
      { lat: 35.68, lon: 139.69, name: 'Tokyo', weight: 0.8 },
      { lat: 51.51, lon: -0.13, name: 'London', weight: 0.8 },
      { lat: 52.52, lon: 13.40, name: 'Berlin', weight: 0.7 },
      { lat: -33.87, lon: 151.21, name: 'Sydney', weight: 0.7 }
    ]
    
    // Calculate proximity to data center hubs
    for (const hub of dataCenterHubs) {
      const distance = this.calculateDistance(lat, lon, hub.lat, hub.lon)
      if (distance < 100) { // Within 100km
        score = Math.max(score, hub.weight * (1 - distance / 100))
      }
    }
    
    // Fortune 500 company proximity
    const fortune500Density = this.calculateFortune500Density(lat, lon)
    score = Math.max(score, fortune500Density * 0.8)
    
    // Cloud provider regions
    const cloudScore = this.calculateCloudProviderProximity(lat, lon)
    score = Math.max(score, cloudScore * 0.9)
    
    return Math.min(score, 1.0)
  }
  
  /**
   * Score government proximity - SECONDARY FACTOR (25%)
   * Military bases, federal facilities, embassies
   */
  private scoreGovernmentProximity(lat: number, lon: number): number {
    let score = 0
    
    // Major government/military concentrations
    const govCenters = [
      { lat: 38.89, lon: -77.04, name: 'Washington DC', weight: 1.0 },
      { lat: 51.50, lon: -0.12, name: 'London (Whitehall)', weight: 0.8 },
      { lat: 48.86, lon: 2.35, name: 'Paris', weight: 0.7 },
      { lat: 52.52, lon: 13.38, name: 'Berlin', weight: 0.7 },
      { lat: 35.69, lon: 139.69, name: 'Tokyo', weight: 0.7 },
      { lat: 39.90, lon: 116.40, name: 'Beijing', weight: 0.6 },
      { lat: 28.61, lon: 77.20, name: 'New Delhi', weight: 0.6 }
    ]
    
    for (const center of govCenters) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon)
      if (distance < 200) { // Government influence extends further
        score = Math.max(score, center.weight * (1 - distance / 200))
      }
    }
    
    // Military base proximity (simplified)
    if (this.nearMilitaryBase(lat, lon)) {
      score = Math.max(score, 0.8)
    }
    
    return Math.min(score, 1.0)
  }
  
  /**
   * Score telecom infrastructure (20%)
   * Fiber POPs, carrier hotels, internet exchanges
   */
  private scoreTelecomInfrastructure(lat: number, lon: number): number {
    let score = 0
    
    // Major internet exchange points
    const ixPoints = [
      { lat: 50.11, lon: 8.68, name: 'DE-CIX Frankfurt', weight: 1.0 },
      { lat: 52.30, lon: 4.94, name: 'AMS-IX Amsterdam', weight: 0.95 },
      { lat: 51.51, lon: -0.09, name: 'LINX London', weight: 0.9 },
      { lat: 37.44, lon: -122.17, name: 'Equinix SV', weight: 0.85 },
      { lat: 1.29, lon: 103.85, name: 'Singapore IX', weight: 0.85 }
    ]
    
    for (const ix of ixPoints) {
      const distance = this.calculateDistance(lat, lon, ix.lat, ix.lon)
      if (distance < 50) { // Very close proximity needed for fiber
        score = Math.max(score, ix.weight * (1 - distance / 50))
      }
    }
    
    // Submarine cable landing points
    if (this.nearSubmarineCableLanding(lat, lon)) {
      score = Math.max(score, 0.7)
    }
    
    return Math.min(score, 1.0)
  }
  
  /**
   * Score economic activity (10%)
   * GDP, business activity, financial centers
   */
  private scoreEconomicActivity(lat: number, lon: number): number {
    // Financial centers
    const financialCenters = [
      { lat: 40.71, lon: -74.01, name: 'New York', weight: 1.0 },
      { lat: 51.51, lon: -0.13, name: 'London', weight: 0.95 },
      { lat: 35.68, lon: 139.69, name: 'Tokyo', weight: 0.9 },
      { lat: 22.28, lon: 114.16, name: 'Hong Kong', weight: 0.85 },
      { lat: 1.29, lon: 103.85, name: 'Singapore', weight: 0.85 },
      { lat: 50.11, lon: 8.68, name: 'Frankfurt', weight: 0.8 }
    ]
    
    let score = 0
    for (const center of financialCenters) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon)
      if (distance < 100) {
        score = Math.max(score, center.weight * (1 - distance / 100))
      }
    }
    
    return Math.min(score, 1.0)
  }
  
  /**
   * Score maritime traffic - REDUCED WEIGHT (5%)
   * Only relevant for offshore platforms and island connectivity
   */
  private scoreMaritimeTraffic(lat: number, lon: number): number {
    // Minimal scoring - only for completeness
    // Focus on offshore energy platforms and island nations
    
    // Offshore energy regions
    if (this.nearOffshoreEnergy(lat, lon)) {
      return 0.6
    }
    
    // Island nations that need connectivity
    if (this.isIslandNation(lat, lon)) {
      return 0.5
    }
    
    return 0.1 // Minimal baseline score
  }
  
  /**
   * Score competition (5%)
   * Existing MEO-capable ground stations
   */
  private scoreCompetition(lat: number, lon: number): number {
    // Check distance to existing MEO-capable stations
    // Closer to competitors = lower score
    const nearestCompetitor = this.findNearestCompetitor(lat, lon)
    
    if (nearestCompetitor < 50) return 0.2  // Too close
    if (nearestCompetitor < 200) return 0.5 // Moderate competition
    if (nearestCompetitor < 500) return 0.8 // Good distance
    return 1.0 // No nearby competition
  }
  
  /**
   * Calculate MEO-specific advantages for the location
   */
  private calculateMEOAdvantages(lat: number, lon: number): {
    latencyMs: number
    throughputGbps: number
    availabilityPercent: number
  } {
    // MEO altitude: 8,062km
    const meoAltitude = 8062
    const speedOfLight = 299792 // km/s
    
    // Round-trip latency (simplified)
    const latencyMs = Math.round((2 * meoAltitude / speedOfLight) * 1000)
    
    // Throughput potential based on location
    // Enterprise locations get higher throughput allocations
    const enterpriseScore = this.scoreEnterpriseDensity(lat, lon)
    const throughputGbps = Math.round(10 + enterpriseScore * 40) // 10-50 Gbps
    
    // Ka-band availability (weather dependent)
    const availabilityPercent = this.calculateKaBandAvailability(lat, lon)
    
    return {
      latencyMs,
      throughputGbps,
      availabilityPercent
    }
  }
  
  /**
   * Calculate Ka-band availability based on weather patterns
   * Critical for MEO as O3b uses Ka-band
   */
  private calculateKaBandAvailability(lat: number, lon: number): number {
    // Tropical regions have more rain fade
    if (Math.abs(lat) < 23.5) {
      // Tropical zone - heavy rain impact
      return 98.5 // 98.5% availability
    } else if (Math.abs(lat) < 35) {
      // Subtropical - moderate rain
      return 99.2
    } else if (Math.abs(lat) < 50) {
      // Temperate - good availability
      return 99.5
    } else {
      // Polar regions - snow/ice impact
      return 99.0
    }
  }
  
  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(lat: number, lon: number): number {
    // Higher confidence near known enterprise locations
    const enterpriseDensity = this.scoreEnterpriseDensity(lat, lon)
    const governmentProximity = this.scoreGovernmentProximity(lat, lon)
    
    const baseConfidence = 0.5
    const dataBoost = (enterpriseDensity + governmentProximity) * 0.25
    
    return Math.min(baseConfidence + dataBoost, 0.95)
  }
  
  /**
   * Generate ML-based actionable recommendations
   */
  private generateMLBasedRecommendations(
    mlResult: any,
    scores: any,
    meoAdvantages: any
  ): string[] {
    const recommendations: string[] = []
    
    // ML-driven recommendations based on SHAP explanations
    const topExplanations = mlResult.explanations.slice(0, 3)
    for (const explanation of topExplanations) {
      if (explanation.direction === 'positive' && explanation.impact > 5) {
        recommendations.push(`Strong ${explanation.feature.toLowerCase()} advantage - leverage for competitive positioning`)
      } else if (explanation.direction === 'negative' && explanation.impact > 5) {
        recommendations.push(`Address ${explanation.feature.toLowerCase()} deficiency to improve opportunity score`)
      }
    }
    
    // Cluster-based recommendations
    if (mlResult.cluster === 'premium-maritime') {
      recommendations.push('Premium maritime location - target high-value offshore connectivity')
    } else if (mlResult.cluster === 'urban-enterprise') {
      recommendations.push('Urban enterprise cluster - focus on data center and cloud connectivity')
    } else if (mlResult.cluster === 'underserved-maritime') {
      recommendations.push('Underserved maritime area - opportunity for market entry')
    }
    
    // Hotspot recommendations
    if (mlResult.hotspot) {
      recommendations.push('Statistical hotspot detected - high-priority deployment location')
    }
    
    // Traditional MEO-specific recommendations (enhanced with ML insights)
    if (scores.enterprise > 0.7 && mlResult.score > 70) {
      recommendations.push('High enterprise density with strong ML score - prioritize for data center connectivity')
    }
    
    if (scores.government > 0.6 && mlResult.confidence > 0.8) {
      recommendations.push('Strong government presence with high ML confidence - pursue federal contracts')
    }
    
    if (meoAdvantages.availabilityPercent < 99.5) {
      recommendations.push('Ka-band availability below 99.5% - consider diversity solutions')
    }
    
    if (scores.telecom > 0.7 && mlResult.score > 60) {
      recommendations.push('Excellent fiber connectivity with good ML score - ideal for high-throughput services')
    }
    
    if (scores.competition < 0.3 && mlResult.score > 50) {
      recommendations.push('High competition but good ML score - differentiate with MEO latency advantage')
    }
    
    return recommendations
  }

  /**
   * Generate actionable recommendations (legacy method)
   */
  private generateRecommendations(
    scores: any,
    meoAdvantages: any
  ): string[] {
    const recommendations: string[] = []
    
    if (scores.enterprise > 0.7) {
      recommendations.push('High enterprise density - prioritize for data center connectivity')
    }
    
    if (scores.government > 0.6) {
      recommendations.push('Strong government presence - pursue federal contracts')
    }
    
    if (meoAdvantages.availabilityPercent < 99.5) {
      recommendations.push('Ka-band availability below 99.5% - consider diversity solutions')
    }
    
    if (scores.telecom > 0.7) {
      recommendations.push('Excellent fiber connectivity - ideal for high-throughput services')
    }
    
    if (scores.competition < 0.3) {
      recommendations.push('High competition - differentiate with MEO latency advantage')
    }
    
    return recommendations
  }
  
  // Helper functions
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  private calculateFortune500Density(lat: number, lon: number): number {
    // Simplified - would use real Fortune 500 HQ database
    const majorBusinessCenters = [
      { lat: 40.71, lon: -74.01 }, // NYC
      { lat: 37.77, lon: -122.42 }, // San Francisco
      { lat: 41.88, lon: -87.63 }, // Chicago
      { lat: 51.51, lon: -0.13 }, // London
      { lat: 35.68, lon: 139.69 } // Tokyo
    ]
    
    let maxScore = 0
    for (const center of majorBusinessCenters) {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon)
      if (distance < 100) {
        maxScore = Math.max(maxScore, 1 - distance / 100)
      }
    }
    return maxScore
  }
  
  private calculateCloudProviderProximity(lat: number, lon: number): number {
    // AWS, Azure, GCP regions
    const cloudRegions = [
      { lat: 38.75, lon: -77.48 }, // US-East-1 (Virginia)
      { lat: 45.60, lon: -121.18 }, // US-West-2 (Oregon)
      { lat: 53.34, lon: -6.26 }, // EU-West-1 (Ireland)
      { lat: 50.11, lon: 8.68 }, // EU-Central-1 (Frankfurt)
      { lat: 1.29, lon: 103.85 }, // AP-Southeast-1 (Singapore)
      { lat: 35.68, lon: 139.69 } // AP-Northeast-1 (Tokyo)
    ]
    
    let maxScore = 0
    for (const region of cloudRegions) {
      const distance = this.calculateDistance(lat, lon, region.lat, region.lon)
      if (distance < 50) {
        maxScore = Math.max(maxScore, 1 - distance / 50)
      }
    }
    return maxScore
  }
  
  private nearMilitaryBase(lat: number, lon: number): boolean {
    // Simplified check - would use real military base database
    // Check proximity to known military regions
    const militaryRegions = [
      { lat: 38.87, lon: -77.01, radius: 50 }, // Pentagon area
      { lat: 36.08, lon: -115.17, radius: 100 }, // Nevada Test Site
      { lat: 28.47, lon: -80.58, radius: 50 } // Cape Canaveral
    ]
    
    for (const region of militaryRegions) {
      if (this.calculateDistance(lat, lon, region.lat, region.lon) < region.radius) {
        return true
      }
    }
    return false
  }
  
  private nearSubmarineCableLanding(lat: number, lon: number): boolean {
    // Major submarine cable landing points
    const cableLandings = [
      { lat: 40.58, lon: -73.81 }, // New York
      { lat: 36.85, lon: -75.98 }, // Virginia Beach
      { lat: 50.10, lon: -5.53 }, // Cornwall, UK
      { lat: 1.26, lon: 103.82 } // Singapore
    ]
    
    for (const landing of cableLandings) {
      if (this.calculateDistance(lat, lon, landing.lat, landing.lon) < 50) {
        return true
      }
    }
    return false
  }
  
  private nearOffshoreEnergy(lat: number, lon: number): boolean {
    // Gulf of Mexico, North Sea, etc.
    if (lat > 25 && lat < 30 && lon > -95 && lon < -85) return true // Gulf of Mexico
    if (lat > 53 && lat < 61 && lon > -2 && lon < 8) return true // North Sea
    return false
  }
  
  private isIslandNation(lat: number, lon: number): boolean {
    // Simplified island nation check
    const islands = [
      { lat: 1.35, lon: 103.82 }, // Singapore
      { lat: 25.03, lon: 121.56 }, // Taiwan
      { lat: 35.68, lon: 139.69 }, // Japan
      { lat: -8.65, lon: 115.22 } // Indonesia
    ]
    
    for (const island of islands) {
      if (this.calculateDistance(lat, lon, island.lat, island.lon) < 200) {
        return true
      }
    }
    return false
  }
  
  private findNearestCompetitor(lat: number, lon: number): number {
    // Known MEO-capable ground stations
    const competitors = [
      { lat: 6.68, lon: -1.57 }, // Ghana Teleport
      { lat: 51.89, lon: -8.48 }, // Cork, Ireland
      { lat: -31.95, lon: 115.86 } // Perth, Australia
    ]
    
    let minDistance = Infinity
    for (const competitor of competitors) {
      const distance = this.calculateDistance(lat, lon, competitor.lat, competitor.lon)
      minDistance = Math.min(minDistance, distance)
    }
    return minDistance
  }
  
  private loadEnterpriseLocations(): EnterpriseLocation[] {
    // Load known enterprise locations
    // In production, this would come from a database
    return [
      { latitude: 38.95, longitude: -77.45, type: 'data_center', name: 'Ashburn Data Centers', importance: 1.0 },
      { latitude: 37.37, longitude: -121.92, type: 'data_center', name: 'Silicon Valley', importance: 0.9 },
      { latitude: 50.11, longitude: 8.68, type: 'data_center', name: 'Frankfurt Data Hub', importance: 0.85 },
      { latitude: 38.89, longitude: -77.04, type: 'government', name: 'Washington DC', importance: 1.0 },
      { latitude: 40.71, longitude: -74.01, type: 'financial_center', name: 'Wall Street', importance: 1.0 }
    ]
  }
}

// Export singleton instance
export const meoEnterpriseScorer = new MEOEnterpriseScorer()