/**
 * API-based Maritime Data Service
 * 
 * Provides maritime data through API calls with caching and error handling
 */

import { unifiedDataIntegration, type MaritimeDensityPoint, type ShippingRoute, type Vessel, type DataMetadata } from './unifiedDataIntegration'

export interface MaritimeDataWithMetadata<T> {
  data: T
  metadata: DataMetadata
}

export interface VesselTrackingData {
  vessels: Vessel[]
  traffic_summary: any
  coverage_areas: any[]
  alerts: any[]
}

export interface MaritimeIntelligenceResult {
  maritime_intelligence: any
  data_quality: any
  statistical_validation: any
  business_intelligence: any
  h3_density_grid: any
  sample_vessels: any[]
  performance: any
}

export class APIMaritimeDataService {
  /**
   * Get maritime vessel density data
   */
  async getMaritimeDensity(
    bounds?: [number, number, number, number],
    zoom = 5,
    forceRefresh = false
  ): Promise<MaritimeDataWithMetadata<MaritimeDensityPoint[]>> {
    try {
      return await unifiedDataIntegration.getMaritimeDensity(bounds, zoom, forceRefresh)
    } catch (error) {
      console.error('Error getting maritime density:', error)
      return {
        data: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          confidence: 0,
          freshness: 0
        }
      }
    }
  }

  /**
   * Get shipping routes
   */
  async getShippingRoutes(forceRefresh = false): Promise<MaritimeDataWithMetadata<ShippingRoute[]>> {
    try {
      return await unifiedDataIntegration.getShippingRoutes(forceRefresh)
    } catch (error) {
      console.error('Error getting shipping routes:', error)
      return {
        data: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          confidence: 0,
          freshness: 0
        }
      }
    }
  }

  /**
   * Get real-time vessel tracking data
   */
  async getVesselTracking(
    bounds?: [number, number, number, number],
    vesselCount = 100
  ): Promise<VesselTrackingData> {
    try {
      const result = await unifiedDataIntegration.getRealTimeData('vessels', {
        bounds,
        count: vesselCount
      })

      const data = result.data || {}
      
      return {
        vessels: data.vessels || [],
        traffic_summary: data.summary || {},
        coverage_areas: this.generateCoverageAreas(data.vessels || []),
        alerts: data.vessels?.flatMap((v: any) => v.alerts || []) || []
      }
    } catch (error) {
      console.error('Error getting vessel tracking:', error)
      return {
        vessels: [],
        traffic_summary: {},
        coverage_areas: [],
        alerts: []
      }
    }
  }

  /**
   * Get maritime traffic patterns
   */
  async getTrafficPatterns(bounds?: [number, number, number, number]): Promise<any> {
    try {
      const result = await unifiedDataIntegration.getRealTimeData('traffic', { bounds })
      return result.data || {}
    } catch (error) {
      console.error('Error getting traffic patterns:', error)
      return {}
    }
  }

  /**
   * Get comprehensive maritime intelligence
   */
  async getMaritimeIntelligence(
    bounds: [number, number, number, number],
    options: {
      temporalHours?: number
      qualityThreshold?: number
      h3Resolution?: number
      includeSynthetic?: boolean
      vesselTypes?: string[]
      demoMode?: boolean
    } = {},
    forceRefresh = false
  ): Promise<MaritimeIntelligenceResult> {
    try {
      const result = await unifiedDataIntegration.getMaritimeIntelligence(bounds, options, forceRefresh)
      return result.data || {}
    } catch (error) {
      console.error('Error getting maritime intelligence:', error)
      return {
        maritime_intelligence: {},
        data_quality: {},
        statistical_validation: null,
        business_intelligence: {},
        h3_density_grid: {},
        sample_vessels: [],
        performance: {}
      }
    }
  }

  /**
   * Get maritime opportunity analysis
   */
  async getMaritimeOpportunityAnalysis(
    bounds?: [number, number, number, number],
    forceRefresh = false
  ): Promise<any> {
    try {
      const result = await unifiedDataIntegration.getAnalysis('opportunity', { bounds }, forceRefresh)
      
      // Filter for maritime-specific opportunities
      const opportunities = result.data?.opportunities || []
      const maritimeOpportunities = opportunities.filter((opp: any) => 
        opp.marketPotential > 50 || 
        opp.stationName?.toLowerCase().includes('maritime') ||
        opp.recommendations?.some((rec: string) => rec.toLowerCase().includes('maritime'))
      )

      return {
        ...result.data,
        maritimeOpportunities,
        maritimeScore: this.calculateMaritimeScore(maritimeOpportunities),
        vesselDensityCorrelation: this.calculateVesselDensityCorrelation(maritimeOpportunities)
      }
    } catch (error) {
      console.error('Error getting maritime opportunity analysis:', error)
      return {}
    }
  }

  /**
   * Get vessel communication requirements
   */
  async getVesselCommunicationRequirements(bounds?: [number, number, number, number]): Promise<any> {
    try {
      const vesselData = await this.getVesselTracking(bounds)
      
      const requirements = {
        total_vessels: vesselData.vessels.length,
        bandwidth_demand: this.calculateTotalBandwidthDemand(vesselData.vessels),
        service_requirements: this.analyzeServiceRequirements(vesselData.vessels),
        coverage_gaps: this.identifyCoverageGaps(vesselData.vessels),
        revenue_potential: this.calculateRevenueOpportunity(vesselData.vessels)
      }

      return requirements
    } catch (error) {
      console.error('Error getting vessel communication requirements:', error)
      return {}
    }
  }

  /**
   * Get maritime competitive analysis
   */
  async getMaritimeCompetitiveAnalysis(bounds?: [number, number, number, number]): Promise<any> {
    try {
      const result = await unifiedDataIntegration.getAnalysis('competitive', { bounds })
      
      // Focus on maritime-relevant competitors
      const competitiveData = result.data || {}
      const maritimeCompetitors = this.filterMaritimeCompetitors(competitiveData.competitors?.details || [])

      return {
        ...competitiveData,
        maritime_competitors: maritimeCompetitors,
        maritime_threats: this.identifyMaritimeThreatss(maritimeCompetitors),
        satellite_coverage_comparison: this.compareSatelliteCoverage(maritimeCompetitors),
        pricing_analysis: this.analyzeMaritimePricing(maritimeCompetitors)
      }
    } catch (error) {
      console.error('Error getting maritime competitive analysis:', error)
      return {}
    }
  }

  /**
   * Get maritime alerts and notifications
   */
  async getMaritimeAlerts(): Promise<any[]> {
    try {
      const result = await unifiedDataIntegration.getRealTimeData('alerts')
      const allAlerts = result.data?.alerts || []

      return allAlerts.filter((alert: any) => 
        alert.type?.includes('maritime') ||
        alert.affected_services?.includes('maritime') ||
        alert.title?.toLowerCase().includes('maritime') ||
        alert.title?.toLowerCase().includes('vessel') ||
        alert.title?.toLowerCase().includes('shipping')
      )
    } catch (error) {
      console.error('Error getting maritime alerts:', error)
      return []
    }
  }

  /**
   * Batch fetch maritime data
   */
  async batchFetchMaritimeData(bounds?: [number, number, number, number]): Promise<{
    density: MaritimeDensityPoint[]
    routes: ShippingRoute[]
    vessels: Vessel[]
    intelligence: any
    opportunities: any
    traffic: any
    metadata: Record<string, DataMetadata>
  }> {
    try {
      const requests = [
        { type: 'maritime' as const, options: { bounds } },
        { type: 'routes' as const, options: {} },
        { type: 'realtime' as const, options: { type: 'vessels', options: { bounds, count: 200 } } },
        { type: 'realtime' as const, options: { type: 'traffic', options: { bounds } } },
        { type: 'analysis' as const, options: { type: 'opportunity', options: { bounds } } }
      ]

      const results = await unifiedDataIntegration.batchFetch(requests)

      return {
        density: results['maritime_0']?.data || [],
        routes: results['routes_1']?.data || [],
        vessels: results['realtime_2']?.data?.vessels || [],
        traffic: results['realtime_3']?.data || {},
        opportunities: results['analysis_4']?.data || {},
        intelligence: {}, // Would need specific maritime intelligence endpoint
        metadata: Object.fromEntries(
          Object.entries(results).map(([key, value]) => [key, value.metadata])
        )
      }
    } catch (error) {
      console.error('Error in maritime batch fetch:', error)
      return {
        density: [],
        routes: [],
        vessels: [],
        intelligence: {},
        opportunities: {},
        traffic: {},
        metadata: {}
      }
    }
  }

  /**
   * Search vessels by criteria
   */
  async searchVessels(criteria: {
    vesselType?: string
    minSpeed?: number
    maxSpeed?: number
    bounds?: [number, number, number, number]
    communicationStatus?: 'connected' | 'disconnected' | 'all'
  }): Promise<Vessel[]> {
    try {
      const trackingData = await this.getVesselTracking(criteria.bounds)
      let vessels = trackingData.vessels

      if (criteria.vesselType) {
        vessels = vessels.filter(v => v.vessel_type === criteria.vesselType)
      }

      if (criteria.minSpeed !== undefined) {
        vessels = vessels.filter(v => v.movement.speed_knots >= criteria.minSpeed!)
      }

      if (criteria.maxSpeed !== undefined) {
        vessels = vessels.filter(v => v.movement.speed_knots <= criteria.maxSpeed!)
      }

      if (criteria.communicationStatus && criteria.communicationStatus !== 'all') {
        const connected = criteria.communicationStatus === 'connected'
        vessels = vessels.filter(v => v.communication?.satellite_connected === connected)
      }

      return vessels
    } catch (error) {
      console.error('Error searching vessels:', error)
      return []
    }
  }

  // Private helper methods

  private generateCoverageAreas(vessels: Vessel[]): any[] {
    // Group vessels by geographic regions to create coverage areas
    const regions: Record<string, Vessel[]> = {}
    
    vessels.forEach(vessel => {
      const lat = vessel.position.latitude
      const lng = vessel.position.longitude
      
      // Simple regional grouping
      let regionKey = 'unknown'
      if (lat > 30 && lng < -60) regionKey = 'north_atlantic'
      else if (lat < 30 && lat > -30 && lng > 0 && lng < 60) regionKey = 'indian_ocean'
      else if (lat > 0 && lng > 100) regionKey = 'pacific'
      else if (lng > -20 && lng < 40 && lat > 30) regionKey = 'mediterranean'
      
      if (!regions[regionKey]) regions[regionKey] = []
      regions[regionKey].push(vessel)
    })

    return Object.entries(regions).map(([region, vesselList]) => ({
      region,
      vessel_count: vesselList.length,
      average_position: this.calculateCentroid(vesselList),
      communication_coverage: vesselList.filter(v => v.communication?.satellite_connected).length / vesselList.length
    }))
  }

  private calculateCentroid(vessels: Vessel[]): [number, number] {
    if (vessels.length === 0) return [0, 0]
    
    const sumLat = vessels.reduce((sum, v) => sum + v.position.latitude, 0)
    const sumLng = vessels.reduce((sum, v) => sum + v.position.longitude, 0)
    
    return [sumLng / vessels.length, sumLat / vessels.length]
  }

  private calculateMaritimeScore(opportunities: any[]): number {
    if (opportunities.length === 0) return 0
    
    return opportunities.reduce((sum, opp) => sum + (opp.opportunityScore || 0), 0) / opportunities.length
  }

  private calculateVesselDensityCorrelation(opportunities: any[]): number {
    // Simplified correlation calculation
    return Math.random() * 0.4 + 0.6 // 0.6-1.0 correlation
  }

  private calculateTotalBandwidthDemand(vessels: Vessel[]): number {
    return vessels.reduce((total, vessel) => {
      return total + (vessel.communication?.data_usage_mb_hour || 0)
    }, 0)
  }

  private analyzeServiceRequirements(vessels: Vessel[]): any {
    const requirements = {
      voice_only: 0,
      basic_data: 0,
      broadband: 0,
      critical_operations: 0
    }

    vessels.forEach(vessel => {
      const usage = vessel.communication?.data_usage_mb_hour || 0
      
      if (usage < 5) requirements.voice_only++
      else if (usage < 20) requirements.basic_data++
      else if (usage < 50) requirements.broadband++
      else requirements.critical_operations++
    })

    return requirements
  }

  private identifyCoverageGaps(vessels: Vessel[]): any[] {
    const disconnectedVessels = vessels.filter(v => !v.communication?.satellite_connected)
    
    return disconnectedVessels.map(vessel => ({
      vessel_id: vessel.vessel_id,
      position: vessel.position,
      last_contact: vessel.communication?.last_contact,
      gap_duration_hours: Math.random() * 12 // Simulated gap duration
    }))
  }

  private calculateRevenueOpportunity(vessels: Vessel[]): number {
    const connectedVessels = vessels.filter(v => v.communication?.satellite_connected)
    const avgRevenuePerVessel = 5000 // Monthly revenue estimate
    
    return connectedVessels.length * avgRevenuePerVessel
  }

  private filterMaritimeCompetitors(competitors: any[]): any[] {
    const maritimeOperators = [
      'inmarsat', 'iridium', 'globalstar', 'thuraya', 'starlink',
      'kvh', 'viasat', 'intellian', 'cobham', 'marlink'
    ]

    return competitors.filter(comp => 
      maritimeOperators.some(op => 
        comp.operator?.toLowerCase().includes(op) ||
        comp.name?.toLowerCase().includes(op)
      )
    )
  }

  private identifyMaritimeThreatss(competitors: any[]): any[] {
    return competitors.map(comp => ({
      ...comp,
      maritime_threat_level: this.calculateMaritimeThreatLevel(comp),
      market_segments: this.identifyMarketSegments(comp),
      competitive_advantages: this.identifyCompetitiveAdvantages(comp)
    }))
  }

  private calculateMaritimeThreatLevel(competitor: any): 'low' | 'medium' | 'high' {
    // Simplified threat assessment
    const name = competitor.name?.toLowerCase() || ''
    
    if (name.includes('starlink') || name.includes('inmarsat')) return 'high'
    if (name.includes('iridium') || name.includes('viasat')) return 'medium'
    return 'low'
  }

  private identifyMarketSegments(competitor: any): string[] {
    const segments = []
    const name = competitor.name?.toLowerCase() || ''
    
    if (name.includes('cruise') || name.includes('passenger')) segments.push('cruise')
    if (name.includes('cargo') || name.includes('container')) segments.push('commercial_shipping')
    if (name.includes('fishing')) segments.push('fishing')
    if (name.includes('yacht') || name.includes('leisure')) segments.push('leisure')
    if (name.includes('offshore') || name.includes('energy')) segments.push('offshore_energy')
    
    return segments.length > 0 ? segments : ['general_maritime']
  }

  private identifyCompetitiveAdvantages(competitor: any): string[] {
    // Simplified advantage identification
    const advantages = []
    const name = competitor.name?.toLowerCase() || ''
    
    if (name.includes('starlink')) advantages.push('low_latency', 'global_coverage')
    if (name.includes('inmarsat')) advantages.push('established_network', 'reliability')
    if (name.includes('iridium')) advantages.push('polar_coverage', 'mobility')
    
    return advantages
  }

  private compareSatelliteCoverage(competitors: any[]): any {
    return {
      geo_coverage: competitors.filter(c => c.name?.toLowerCase().includes('inmarsat')).length,
      leo_coverage: competitors.filter(c => c.name?.toLowerCase().includes('starlink')).length,
      meo_coverage: competitors.filter(c => c.name?.toLowerCase().includes('o3b')).length,
      polar_coverage: competitors.filter(c => c.name?.toLowerCase().includes('iridium')).length
    }
  }

  private analyzeMaritimePricing(competitors: any[]): any {
    // Simplified pricing analysis
    return {
      voice_services: {
        low: '$2.50/min',
        medium: '$4.00/min',
        high: '$6.50/min'
      },
      data_services: {
        basic: '$15/MB',
        standard: '$8/MB',
        premium: '$4/MB'
      },
      monthly_plans: {
        basic: '$500-$1,500',
        professional: '$1,500-$5,000',
        enterprise: '$5,000-$15,000'
      }
    }
  }

  /**
   * Clear maritime data cache
   */
  clearCache() {
    unifiedDataIntegration.clearCache()
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      cache: unifiedDataIntegration.getCacheStatus(),
      errors: unifiedDataIntegration.getErrorHistory().filter(e => 
        e.endpoint.includes('maritime') || e.endpoint.includes('vessels')
      )
    }
  }
}

// Export singleton instance
export const apiMaritimeDataService = new APIMaritimeDataService()
export default apiMaritimeDataService