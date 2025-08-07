/**
 * Enhanced H3 Hexagon Opportunity Scorer with Maritime Integration
 * 
 * Integrates land-based and maritime opportunities into unified H3 scoring
 * Provides comprehensive scoring based on:
 * - Traditional terrestrial factors (population, economy, infrastructure)
 * - Maritime factors (vessel density, shipping lanes, port proximity)
 * - Combined opportunities for hybrid coverage
 * - Competition analysis across both domains
 */

import * as h3 from 'h3-js'
import { maritimeDataService, type MaritimeMetrics } from '@/lib/services/maritimeDataService'
import type { H3HexagonOpportunity } from '@/lib/services/h3GridService'

export interface EnhancedH3Score {
  h3Index: string
  hexagon: string // For H3HexagonLayer compatibility
  coordinates: [number, number] // [lng, lat]
  
  // Base Scores
  landScore: number // Traditional terrestrial opportunity
  maritimeScore: number // Maritime opportunity
  hybridScore: number // Combined land-maritime opportunity
  
  // Detailed Scoring Components
  components: {
    // Land Components
    populationDensity: number
    economicActivity: number
    infrastructureQuality: number
    terrestrialCompetition: number
    landCoverage: number
    
    // Maritime Components
    vesselDensity: number
    shippingLaneProximity: number
    portAccessibility: number
    maritimeEconomicValue: number
    maritimeRisk: number
    
    // Hybrid Components
    coastalAdvantage: number // Bonus for serving both land and sea
    multiModalAccess: number // Access to multiple transport modes
    crossDomainSynergy: number // Synergies between land and maritime
  }
  
  // Opportunity Classification
  opportunityType: 'TERRESTRIAL' | 'MARITIME' | 'HYBRID' | 'EMERGING'
  primaryMarket: string // e.g., "Urban Broadband", "Shipping Lanes", "Coastal Cities"
  
  // Competition Analysis
  competitors: {
    terrestrial: string[]
    maritime: string[]
    overall: string[]
  }
  
  // Value Metrics
  projectedRevenue: {
    terrestrial: number
    maritime: number
    total: number
  }
  
  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  riskFactors: string[]
  
  // Final Scores
  overallScore: number // 0-100 combined opportunity score
  investmentPriority: 'critical' | 'high' | 'medium' | 'low'
}

export class EnhancedH3Scorer {
  private maritimeService = maritimeDataService
  
  /**
   * Score a single H3 hexagon with enhanced maritime integration
   */
  public scoreHexagon(h3Index: string, existingData?: Partial<H3HexagonOpportunity>): EnhancedH3Score {
    const [lat, lng] = h3.cellToLatLng(h3Index)
    
    // Get maritime metrics
    const maritimeMetrics = this.maritimeService.calculateMaritimeMetrics(h3Index)
    
    // Calculate land components (using existing data if available)
    const landComponents = this.calculateLandComponents(h3Index, existingData)
    
    // Calculate maritime components
    const maritimeComponents = this.calculateMaritimeComponents(maritimeMetrics)
    
    // Calculate hybrid components
    const hybridComponents = this.calculateHybridComponents(landComponents, maritimeComponents, lat, lng)
    
    // Calculate scores
    const landScore = this.calculateLandScore(landComponents)
    const maritimeScore = this.calculateMaritimeScore(maritimeComponents)
    const hybridScore = this.calculateHybridScore(landScore, maritimeScore, hybridComponents)
    
    // Determine opportunity type
    const opportunityType = this.determineOpportunityType(landScore, maritimeScore, hybridComponents)
    const primaryMarket = this.determinePrimaryMarket(opportunityType, landComponents, maritimeComponents)
    
    // Identify competitors
    const competitors = this.identifyCompetitors(h3Index, opportunityType)
    
    // Calculate revenue projections
    const projectedRevenue = this.calculateProjectedRevenue(
      landComponents,
      maritimeComponents,
      hybridComponents,
      opportunityType
    )
    
    // Assess risk
    const { riskLevel, riskFactors } = this.assessRisk(
      landComponents,
      maritimeComponents,
      competitors,
      lat,
      lng
    )
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      landScore,
      maritimeScore,
      hybridScore,
      opportunityType,
      riskLevel
    )
    
    // Determine investment priority
    const investmentPriority = this.determineInvestmentPriority(overallScore, opportunityType, projectedRevenue.total)
    
    return {
      h3Index,
      hexagon: h3Index,
      coordinates: [lng, lat],
      
      landScore,
      maritimeScore,
      hybridScore,
      
      components: {
        ...landComponents,
        ...maritimeComponents,
        ...hybridComponents
      },
      
      opportunityType,
      primaryMarket,
      competitors,
      projectedRevenue,
      riskLevel,
      riskFactors,
      overallScore,
      investmentPriority
    }
  }
  
  /**
   * Calculate land-based components
   */
  private calculateLandComponents(h3Index: string, existingData?: Partial<H3HexagonOpportunity>): {
    populationDensity: number
    economicActivity: number
    infrastructureQuality: number
    terrestrialCompetition: number
    landCoverage: number
  } {
    // Use existing data if available
    if (existingData) {
      return {
        populationDensity: existingData.populationDensity || 0,
        economicActivity: existingData.gdpPerCapita || 0,
        infrastructureQuality: existingData.infrastructureScore || 50,
        terrestrialCompetition: 100 - (existingData.competitionScore || 50),
        landCoverage: existingData.landCoverage || 0
      }
    }
    
    // Otherwise calculate simplified scores
    const [lat, lng] = h3.cellToLatLng(h3Index)
    
    // Simplified scoring based on location
    const isNearMajorCity = this.isNearMajorCity(lat, lng)
    const isDeveloped = this.isDevelopedRegion(lat, lng)
    
    return {
      populationDensity: isNearMajorCity ? 75 : 25,
      economicActivity: isDeveloped ? 70 : 30,
      infrastructureQuality: isDeveloped ? 65 : 35,
      terrestrialCompetition: isNearMajorCity ? 30 : 70, // More competition in cities
      landCoverage: this.estimateLandCoverage(lat, lng)
    }
  }
  
  /**
   * Calculate maritime components from metrics
   */
  private calculateMaritimeComponents(metrics: MaritimeMetrics): {
    vesselDensity: number
    shippingLaneProximity: number
    portAccessibility: number
    maritimeEconomicValue: number
    maritimeRisk: number
  } {
    return {
      vesselDensity: Math.min(100, metrics.vesselDensity / 4), // Normalize to 0-100
      shippingLaneProximity: metrics.proximityToLanes,
      portAccessibility: metrics.portAccessibility,
      maritimeEconomicValue: metrics.economicActivity,
      maritimeRisk: metrics.maritimeRisk
    }
  }
  
  /**
   * Calculate hybrid components
   */
  private calculateHybridComponents(
    landComponents: any,
    maritimeComponents: any,
    lat: number,
    lng: number
  ): {
    coastalAdvantage: number
    multiModalAccess: number
    crossDomainSynergy: number
  } {
    // Check if location is coastal
    const isCoastal = this.isCoastalLocation(lat, lng)
    
    // Coastal advantage - bonus for serving both land and sea
    const coastalAdvantage = isCoastal ? 
      Math.min(100, (landComponents.populationDensity + maritimeComponents.vesselDensity) / 2 * 1.2) : 0
    
    // Multi-modal access - combination of different transport modes
    const multiModalAccess = isCoastal ?
      Math.min(100, (landComponents.infrastructureQuality + maritimeComponents.portAccessibility) / 2) : 
      landComponents.infrastructureQuality * 0.5
    
    // Cross-domain synergy - how well land and maritime complement each other
    const landStrength = (landComponents.populationDensity + landComponents.economicActivity) / 2
    const maritimeStrength = (maritimeComponents.vesselDensity + maritimeComponents.maritimeEconomicValue) / 2
    const crossDomainSynergy = isCoastal ?
      Math.min(100, Math.sqrt(landStrength * maritimeStrength) * 1.5) : 0
    
    return {
      coastalAdvantage,
      multiModalAccess,
      crossDomainSynergy
    }
  }
  
  /**
   * Calculate land opportunity score
   */
  private calculateLandScore(components: any): number {
    return (
      components.populationDensity * 0.25 +
      components.economicActivity * 0.25 +
      components.infrastructureQuality * 0.20 +
      components.terrestrialCompetition * 0.15 +
      components.landCoverage * 0.15
    )
  }
  
  /**
   * Calculate maritime opportunity score
   */
  private calculateMaritimeScore(components: any): number {
    return (
      components.vesselDensity * 0.30 +
      components.shippingLaneProximity * 0.25 +
      components.portAccessibility * 0.20 +
      components.maritimeEconomicValue * 0.20 +
      (100 - components.maritimeRisk) * 0.05
    )
  }
  
  /**
   * Calculate hybrid opportunity score
   */
  private calculateHybridScore(landScore: number, maritimeScore: number, hybridComponents: any): number {
    const baseScore = (landScore + maritimeScore) / 2
    const synergyBonus = (
      hybridComponents.coastalAdvantage * 0.3 +
      hybridComponents.multiModalAccess * 0.3 +
      hybridComponents.crossDomainSynergy * 0.4
    ) * 0.2 // Synergy adds up to 20% bonus
    
    return Math.min(100, baseScore + synergyBonus)
  }
  
  /**
   * Determine the primary opportunity type
   */
  private determineOpportunityType(
    landScore: number,
    maritimeScore: number,
    hybridComponents: any
  ): 'TERRESTRIAL' | 'MARITIME' | 'HYBRID' | 'EMERGING' {
    const hybridStrength = (hybridComponents.coastalAdvantage + hybridComponents.crossDomainSynergy) / 2
    
    if (hybridStrength > 60 && landScore > 40 && maritimeScore > 40) {
      return 'HYBRID'
    } else if (maritimeScore > landScore * 1.5 && maritimeScore > 50) {
      return 'MARITIME'
    } else if (landScore > maritimeScore * 1.5 && landScore > 50) {
      return 'TERRESTRIAL'
    } else if (landScore < 40 && maritimeScore < 40) {
      return 'EMERGING'
    } else {
      // Default based on highest score
      return landScore > maritimeScore ? 'TERRESTRIAL' : 'MARITIME'
    }
  }
  
  /**
   * Determine the primary market based on opportunity type
   */
  private determinePrimaryMarket(
    opportunityType: string,
    landComponents: any,
    maritimeComponents: any
  ): string {
    switch (opportunityType) {
      case 'TERRESTRIAL':
        if (landComponents.populationDensity > 70) return 'Urban Broadband'
        if (landComponents.economicActivity > 60) return 'Enterprise Connectivity'
        return 'Rural Connectivity'
        
      case 'MARITIME':
        if (maritimeComponents.vesselDensity > 70) return 'High-Traffic Shipping Lanes'
        if (maritimeComponents.portAccessibility > 60) return 'Port Operations'
        return 'Offshore Operations'
        
      case 'HYBRID':
        if (maritimeComponents.portAccessibility > 70) return 'Port Cities & Maritime Hubs'
        return 'Coastal Metropolitan Areas'
        
      case 'EMERGING':
        return 'Frontier Markets'
        
      default:
        return 'General Coverage'
    }
  }
  
  /**
   * Identify competitors based on location and opportunity type
   */
  private identifyCompetitors(h3Index: string, opportunityType: string): {
    terrestrial: string[]
    maritime: string[]
    overall: string[]
  } {
    const [lat, lng] = h3.cellToLatLng(h3Index)
    
    // Get maritime competitors
    const maritimeCompetitors = this.maritimeService.identifyMaritimeCompetitors(h3Index)
    
    // Terrestrial competitors based on region
    const terrestrialCompetitors = this.identifyTerrestrialCompetitors(lat, lng)
    
    // Combine for overall based on opportunity type
    let overall: string[] = []
    switch (opportunityType) {
      case 'TERRESTRIAL':
        overall = terrestrialCompetitors
        break
      case 'MARITIME':
        overall = maritimeCompetitors
        break
      case 'HYBRID':
        overall = [...new Set([...terrestrialCompetitors.slice(0, 2), ...maritimeCompetitors.slice(0, 2)])]
        break
      case 'EMERGING':
        overall = [...terrestrialCompetitors.slice(0, 1), ...maritimeCompetitors.slice(0, 1)]
        break
    }
    
    return {
      terrestrial: terrestrialCompetitors,
      maritime: maritimeCompetitors,
      overall
    }
  }
  
  /**
   * Calculate projected revenue
   */
  private calculateProjectedRevenue(
    landComponents: any,
    maritimeComponents: any,
    hybridComponents: any,
    opportunityType: string
  ): {
    terrestrial: number
    maritime: number
    total: number
  } {
    // Base revenue calculations
    const terrestrialBase = 
      landComponents.populationDensity * 1000 +
      landComponents.economicActivity * 2000 +
      landComponents.infrastructureQuality * 500
    
    const maritimeBase = 
      maritimeComponents.vesselDensity * 1500 +
      maritimeComponents.maritimeEconomicValue * 2500 +
      maritimeComponents.portAccessibility * 1000
    
    // Apply opportunity type multipliers
    let terrestrialRevenue = terrestrialBase
    let maritimeRevenue = maritimeBase
    
    switch (opportunityType) {
      case 'HYBRID':
        // Synergy bonus for hybrid
        const synergyMultiplier = 1 + (hybridComponents.crossDomainSynergy / 100) * 0.3
        terrestrialRevenue *= synergyMultiplier
        maritimeRevenue *= synergyMultiplier
        break
      case 'TERRESTRIAL':
        maritimeRevenue *= 0.3 // Reduced maritime opportunity
        break
      case 'MARITIME':
        terrestrialRevenue *= 0.3 // Reduced terrestrial opportunity
        break
      case 'EMERGING':
        terrestrialRevenue *= 0.5
        maritimeRevenue *= 0.5
        break
    }
    
    return {
      terrestrial: Math.round(terrestrialRevenue),
      maritime: Math.round(maritimeRevenue),
      total: Math.round(terrestrialRevenue + maritimeRevenue)
    }
  }
  
  /**
   * Assess risk factors
   */
  private assessRisk(
    landComponents: any,
    maritimeComponents: any,
    competitors: any,
    lat: number,
    lng: number
  ): {
    riskLevel: 'low' | 'medium' | 'high' | 'very_high'
    riskFactors: string[]
  } {
    const riskFactors: string[] = []
    let riskScore = 0
    
    // Competition risk
    if (competitors.overall.length > 4) {
      riskFactors.push('High competition from multiple operators')
      riskScore += 25
    }
    
    // Maritime risk
    if (maritimeComponents.maritimeRisk > 60) {
      riskFactors.push('High maritime operational risk')
      riskScore += 20
    }
    
    // Infrastructure risk
    if (landComponents.infrastructureQuality < 30) {
      riskFactors.push('Poor infrastructure quality')
      riskScore += 15
    }
    
    // Geopolitical risk (simplified)
    if (this.isHighRiskRegion(lat, lng)) {
      riskFactors.push('Geopolitical instability')
      riskScore += 30
    }
    
    // Market saturation
    if (landComponents.terrestrialCompetition < 20) {
      riskFactors.push('Market saturation')
      riskScore += 10
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'very_high'
    if (riskScore < 25) riskLevel = 'low'
    else if (riskScore < 50) riskLevel = 'medium'
    else if (riskScore < 75) riskLevel = 'high'
    else riskLevel = 'very_high'
    
    return { riskLevel, riskFactors }
  }
  
  /**
   * Calculate overall opportunity score
   */
  private calculateOverallScore(
    landScore: number,
    maritimeScore: number,
    hybridScore: number,
    opportunityType: string,
    riskLevel: string
  ): number {
    // Select base score based on opportunity type
    let baseScore: number
    switch (opportunityType) {
      case 'HYBRID':
        baseScore = hybridScore
        break
      case 'TERRESTRIAL':
        baseScore = landScore
        break
      case 'MARITIME':
        baseScore = maritimeScore
        break
      case 'EMERGING':
        baseScore = Math.max(landScore, maritimeScore) * 0.7
        break
      default:
        baseScore = (landScore + maritimeScore) / 2
    }
    
    // Apply risk adjustment
    const riskMultiplier = {
      'low': 1.0,
      'medium': 0.9,
      'high': 0.75,
      'very_high': 0.6
    }[riskLevel] || 0.8
    
    return Math.round(baseScore * riskMultiplier)
  }
  
  /**
   * Determine investment priority
   */
  private determineInvestmentPriority(
    overallScore: number,
    opportunityType: string,
    totalRevenue: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Boost priority for hybrid opportunities
    const typeBoost = opportunityType === 'HYBRID' ? 10 : 0
    const adjustedScore = overallScore + typeBoost
    
    // Revenue threshold adjustment
    const revenueBoost = totalRevenue > 1000000 ? 5 : 0
    
    const finalScore = adjustedScore + revenueBoost
    
    if (finalScore >= 80) return 'critical'
    if (finalScore >= 65) return 'high'
    if (finalScore >= 45) return 'medium'
    return 'low'
  }
  
  // Helper methods
  
  private isNearMajorCity(lat: number, lng: number): boolean {
    const majorCities = [
      { lat: 40.7128, lng: -74.0060 }, // New York
      { lat: 51.5074, lng: -0.1278 }, // London
      { lat: 35.6762, lng: 139.6503 }, // Tokyo
      { lat: 1.3521, lng: 103.8198 }, // Singapore
      // Add more cities as needed
    ]
    
    return majorCities.some(city => {
      const distance = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      )
      return distance < 2 // Within ~2 degrees
    })
  }
  
  private isDevelopedRegion(lat: number, lng: number): boolean {
    // Simplified check for developed regions
    // North America
    if (lat > 25 && lat < 70 && lng > -130 && lng < -60) return true
    // Europe
    if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return true
    // East Asia
    if (lat > 20 && lat < 45 && lng > 100 && lng < 150) return true
    // Australia
    if (lat > -40 && lat < -10 && lng > 110 && lng < 155) return true
    
    return false
  }
  
  private estimateLandCoverage(lat: number, lng: number): number {
    // Very simplified land coverage estimation
    // Ocean areas
    if (Math.abs(lng) > 160 && Math.abs(lat) < 30) return 0 // Pacific
    if (lng > -60 && lng < -10 && lat > -40 && lat < 30) return 0 // Atlantic
    if (lng > 30 && lng < 100 && lat > -40 && lat < 30) return 10 // Indian Ocean
    
    // Default to mostly land
    return 85
  }
  
  private isCoastalLocation(lat: number, lng: number): boolean {
    // Simplified coastal detection
    const coastalZones = [
      { latMin: 30, latMax: 50, lngMin: -130, lngMax: -115 }, // US West Coast
      { latMin: 25, latMax: 50, lngMin: -85, lngMax: -70 }, // US East Coast
      { latMin: 45, latMax: 60, lngMin: -10, lngMax: 10 }, // North Europe
      { latMin: 35, latMax: 45, lngMin: -10, lngMax: 20 }, // Mediterranean
      { latMin: 20, latMax: 40, lngMin: 110, lngMax: 130 }, // East China
      { latMin: -40, latMax: -20, lngMin: 110, lngMax: 155 }, // Australia
    ]
    
    return coastalZones.some(zone => 
      lat >= zone.latMin && lat <= zone.latMax &&
      lng >= zone.lngMin && lng <= zone.lngMax
    )
  }
  
  private identifyTerrestrialCompetitors(lat: number, lng: number): string[] {
    const competitors: string[] = []
    
    // Global operators
    competitors.push('Viasat', 'Hughes Network Systems')
    
    // Regional operators
    if (lat > 25 && lat < 70 && lng > -130 && lng < -60) {
      // North America
      competitors.push('Starlink', 'OneWeb')
    } else if (lat > 35 && lat < 70 && lng > -10 && lng < 40) {
      // Europe
      competitors.push('Eutelsat', 'Avanti Communications')
    } else if (lat > -10 && lat < 40 && lng > 100 && lng < 150) {
      // Asia Pacific
      competitors.push('APT Satellite', 'AsiaSat')
    }
    
    return competitors
  }
  
  private isHighRiskRegion(lat: number, lng: number): boolean {
    // Simplified high-risk region detection
    const riskRegions = [
      { latMin: 10, latMax: 20, lngMin: 40, lngMax: 60 }, // Horn of Africa
      { latMin: 30, latMax: 40, lngMin: 60, lngMax: 80 }, // Afghanistan/Pakistan
      { latMin: 15, latMax: 35, lngMin: 35, lngMax: 55 }, // Middle East conflicts
    ]
    
    return riskRegions.some(region =>
      lat >= region.latMin && lat <= region.latMax &&
      lng >= region.lngMin && lng <= region.lngMax
    )
  }
}

// Export singleton instance
export const enhancedH3Scorer = new EnhancedH3Scorer()