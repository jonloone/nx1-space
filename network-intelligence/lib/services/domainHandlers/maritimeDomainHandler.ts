/**
 * Maritime Domain Handler
 * Processes queries for maritime operations and ocean intelligence
 *
 * Capabilities:
 * - Vessel density analysis
 * - Shipping lane intelligence
 * - Port infrastructure assessment
 * - Maritime traffic patterns
 * - AIS data integration
 * - Anomaly detection (AIS gaps, loitering, rendezvous, speed anomalies)
 */

import { type ICLayerId } from '@/lib/config/icLayers'
import type { AnomalyType, AnomalySeverity } from '@/lib/types/ais-anomaly'

export interface MaritimeDomainQuery {
  type:
    | 'vessel-density'
    | 'shipping-lanes'
    | 'port-analysis'
    | 'maritime-traffic'
    | 'suspicious-vessels'
    | 'dark-vessels'
    | 'loitering-vessels'
    | 'vessel-rendezvous'
    | 'anomaly-search'
  location?: string
  radius?: number
  timeRange?: { start: Date; end: Date }
  anomalyTypes?: AnomalyType[]
  minSeverity?: AnomalySeverity
  vesselName?: string
  mmsi?: string
}

export interface MaritimeDomainResult {
  success: boolean
  domain: 'maritime'
  queryType: MaritimeDomainQuery['type']
  data?: any
  message: string
  intTypes: string[]
  layersApplied: ICLayerId[]
}

/**
 * Maritime Domain Handler
 * Routes maritime queries to appropriate analysis services
 */
export class MaritimeDomainHandler {
  /**
   * Parse natural language query for maritime domain
   */
  static parseQuery(query: string): MaritimeDomainQuery | null {
    const lowerQuery = query.toLowerCase()

    // === ANOMALY DETECTION PATTERNS ===

    // Dark vessels / AIS gaps pattern
    if (
      (lowerQuery.includes('dark') && lowerQuery.includes('vessel')) ||
      (lowerQuery.includes('ais') && lowerQuery.includes('gap')) ||
      lowerQuery.includes('went dark') ||
      lowerQuery.includes('transponder off')
    ) {
      return this.parseDarkVesselsQuery(query)
    }

    // Suspicious vessels pattern
    if (
      lowerQuery.includes('suspicious') ||
      lowerQuery.includes('anomal') ||
      (lowerQuery.includes('unusual') && lowerQuery.includes('behavi'))
    ) {
      return this.parseSuspiciousVesselsQuery(query)
    }

    // Loitering vessels pattern
    if (
      lowerQuery.includes('loiter') ||
      lowerQuery.includes('stationary') ||
      lowerQuery.includes('anchored') ||
      (lowerQuery.includes('wait') && lowerQuery.includes('vessel'))
    ) {
      return this.parseLoiteringVesselsQuery(query)
    }

    // Vessel rendezvous / meeting pattern
    if (
      lowerQuery.includes('rendezvous') ||
      lowerQuery.includes('meeting') ||
      (lowerQuery.includes('vessel') && lowerQuery.includes('close')) ||
      lowerQuery.includes('ship-to-ship')
    ) {
      return this.parseVesselRendezvousQuery(query)
    }

    // Generic anomaly search pattern
    if (
      lowerQuery.includes('speed anomal') ||
      lowerQuery.includes('course deviation') ||
      lowerQuery.includes('erratic')
    ) {
      return this.parseAnomalySearchQuery(query)
    }

    // === STANDARD PATTERNS ===

    // Vessel density pattern
    if (lowerQuery.includes('vessel') && (lowerQuery.includes('density') || lowerQuery.includes('traffic'))) {
      return this.parseVesselDensityQuery(query)
    }

    // Shipping lanes pattern
    if (lowerQuery.includes('shipping') && lowerQuery.includes('lane')) {
      return this.parseShippingLanesQuery(query)
    }

    // Port analysis pattern
    if (lowerQuery.includes('port')) {
      return this.parsePortAnalysisQuery(query)
    }

    // General maritime traffic
    if (lowerQuery.includes('maritime') || lowerQuery.includes('ocean')) {
      return this.parseMaritimeTrafficQuery(query)
    }

    return null
  }

  /**
   * Parse vessel density queries
   */
  private static parseVesselDensityQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'vessel-density',
      location,
      radius: 50000 // 50km default for maritime
    }
  }

  /**
   * Parse shipping lanes queries
   */
  private static parseShippingLanesQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:in|near|through)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'shipping-lanes',
      location
    }
  }

  /**
   * Parse port analysis queries
   */
  private static parsePortAnalysisQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/port\s+(?:of\s+)?([w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'port-analysis',
      location
    }
  }

  /**
   * Parse general maritime traffic queries
   */
  private static parseMaritimeTrafficQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:in|at|near)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'maritime-traffic',
      location,
      radius: 100000 // 100km default for general maritime
    }
  }

  /**
   * Execute maritime domain analysis
   */
  static async executeAnalysis(
    parsedQuery: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      switch (parsedQuery.type) {
        // Standard maritime queries
        case 'vessel-density':
          return await this.handleVesselDensity(parsedQuery, layers)

        case 'shipping-lanes':
          return await this.handleShippingLanes(parsedQuery, layers)

        case 'port-analysis':
          return await this.handlePortAnalysis(parsedQuery, layers)

        case 'maritime-traffic':
          return await this.handleMaritimeTraffic(parsedQuery, layers)

        // Anomaly detection queries
        case 'dark-vessels':
          return await this.handleDarkVessels(parsedQuery, layers)

        case 'suspicious-vessels':
          return await this.handleSuspiciousVessels(parsedQuery, layers)

        case 'loitering-vessels':
          return await this.handleLoiteringVessels(parsedQuery, layers)

        case 'vessel-rendezvous':
          return await this.handleVesselRendezvous(parsedQuery, layers)

        case 'anomaly-search':
          return await this.handleAnomalySearch(parsedQuery, layers)

        default:
          return {
            success: false,
            domain: 'maritime',
            queryType: parsedQuery.type,
            message: 'Unknown maritime domain query type',
            intTypes: [],
            layersApplied: []
          }
      }
    } catch (error) {
      console.error('Maritime domain analysis error:', error)
      return {
        success: false,
        domain: 'maritime',
        queryType: parsedQuery.type,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle vessel density analysis
   */
  private static async handleVesselDensity(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    return {
      success: true,
      domain: 'maritime',
      queryType: 'vessel-density',
      data: {
        message: 'Maritime domain analysis is available. Vessel density analysis would be displayed on the map.',
        location: query.location,
        radius: query.radius
      },
      message: `Analyzing vessel density${query.location ? ` near ${query.location}` : ''}...`,
      intTypes: ['GEOINT', 'OSINT', 'TEMPORAL'],
      layersApplied: layers
    }
  }

  /**
   * Handle shipping lanes analysis
   */
  private static async handleShippingLanes(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    return {
      success: true,
      domain: 'maritime',
      queryType: 'shipping-lanes',
      data: {
        message: 'Maritime domain analysis is available. Shipping lanes would be displayed on the map.',
        location: query.location
      },
      message: `Analyzing shipping lanes${query.location ? ` in ${query.location}` : ''}...`,
      intTypes: ['GEOINT', 'OSINT'],
      layersApplied: layers
    }
  }

  /**
   * Handle port analysis
   */
  private static async handlePortAnalysis(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    return {
      success: true,
      domain: 'maritime',
      queryType: 'port-analysis',
      data: {
        message: 'Maritime domain analysis is available. Port infrastructure would be analyzed.',
        location: query.location
      },
      message: `Analyzing port${query.location ? ` ${query.location}` : ''}...`,
      intTypes: ['GEOINT', 'OSINT', 'IMINT'],
      layersApplied: layers
    }
  }

  /**
   * Handle general maritime traffic
   */
  private static async handleMaritimeTraffic(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    return {
      success: true,
      domain: 'maritime',
      queryType: 'maritime-traffic',
      data: {
        message: 'Maritime domain analysis is available. Traffic patterns would be displayed.',
        location: query.location,
        radius: query.radius
      },
      message: `Analyzing maritime traffic${query.location ? ` in ${query.location}` : ''}...`,
      intTypes: ['GEOINT', 'OSINT', 'TEMPORAL'],
      layersApplied: layers
    }
  }

  // ===========================================
  // ANOMALY DETECTION QUERY PARSERS
  // ===========================================

  /**
   * Parse dark vessels / AIS gap queries
   */
  private static parseDarkVesselsQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around|off)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    // Check for duration mentions
    const durationMatch = query.match(/(\d+)\s*(?:hour|hr|minute|min)/i)

    return {
      type: 'dark-vessels',
      location,
      anomalyTypes: ['AIS_GAP'],
      minSeverity: 'medium'
    }
  }

  /**
   * Parse suspicious vessels queries
   */
  private static parseSuspiciousVesselsQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around|off)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    // Check for severity mentions
    let minSeverity: AnomalySeverity = 'medium'
    if (query.toLowerCase().includes('critical') || query.toLowerCase().includes('urgent')) {
      minSeverity = 'critical'
    } else if (query.toLowerCase().includes('high')) {
      minSeverity = 'high'
    }

    return {
      type: 'suspicious-vessels',
      location,
      minSeverity,
      // All anomaly types for suspicious vessel search
      anomalyTypes: ['AIS_GAP', 'LOITERING', 'RENDEZVOUS', 'SPEED_ANOMALY', 'COURSE_DEVIATION']
    }
  }

  /**
   * Parse loitering vessels queries
   */
  private static parseLoiteringVesselsQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around|off|outside)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'loitering-vessels',
      location,
      anomalyTypes: ['LOITERING'],
      minSeverity: 'low'
    }
  }

  /**
   * Parse vessel rendezvous queries
   */
  private static parseVesselRendezvousQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around|off)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    return {
      type: 'vessel-rendezvous',
      location,
      anomalyTypes: ['RENDEZVOUS'],
      minSeverity: 'medium'
    }
  }

  /**
   * Parse generic anomaly search queries
   */
  private static parseAnomalySearchQuery(query: string): MaritimeDomainQuery {
    const locationMatch = query.match(/(?:near|at|in|around|off)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    // Detect which anomaly types are mentioned
    const anomalyTypes: AnomalyType[] = []
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('speed')) anomalyTypes.push('SPEED_ANOMALY')
    if (lowerQuery.includes('course') || lowerQuery.includes('heading')) anomalyTypes.push('COURSE_DEVIATION')
    if (lowerQuery.includes('erratic')) {
      anomalyTypes.push('SPEED_ANOMALY', 'COURSE_DEVIATION')
    }

    // Default to all if none specified
    if (anomalyTypes.length === 0) {
      anomalyTypes.push('AIS_GAP', 'LOITERING', 'RENDEZVOUS', 'SPEED_ANOMALY', 'COURSE_DEVIATION')
    }

    return {
      type: 'anomaly-search',
      location,
      anomalyTypes,
      minSeverity: 'low'
    }
  }

  // ===========================================
  // ANOMALY DETECTION HANDLERS
  // ===========================================

  /**
   * Handle dark vessels query
   */
  private static async handleDarkVessels(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      // Call the anomalies API
      const response = await fetch('/api/maritime/anomalies?types=AIS_GAP&demo=true')
      const data = await response.json()

      return {
        success: true,
        domain: 'maritime',
        queryType: 'dark-vessels',
        data: {
          anomalies: data.anomalies || [],
          count: data.count || 0,
          message: `Found ${data.count || 0} dark vessel events (AIS gaps)`,
          location: query.location
        },
        message: `Detected ${data.count || 0} vessels with AIS gaps${query.location ? ` near ${query.location}` : ' in the Kattegat Strait'}`,
        intTypes: ['SIGINT', 'GEOINT', 'TEMPORAL'],
        layersApplied: layers
      }
    } catch (error) {
      return {
        success: false,
        domain: 'maritime',
        queryType: 'dark-vessels',
        message: 'Failed to query dark vessels data',
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle suspicious vessels query
   */
  private static async handleSuspiciousVessels(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      const minSeverity = query.minSeverity || 'medium'
      const response = await fetch(`/api/maritime/anomalies?minSeverity=${minSeverity}&demo=true`)
      const data = await response.json()

      return {
        success: true,
        domain: 'maritime',
        queryType: 'suspicious-vessels',
        data: {
          anomalies: data.anomalies || [],
          count: data.count || 0,
          statistics: data.statistics,
          message: `Found ${data.count || 0} suspicious vessel activities`,
          location: query.location
        },
        message: `Detected ${data.count || 0} suspicious vessel activities${query.location ? ` near ${query.location}` : ' in the Kattegat Strait'}`,
        intTypes: ['SIGINT', 'GEOINT', 'TEMPORAL', 'MASINT'],
        layersApplied: layers
      }
    } catch (error) {
      return {
        success: false,
        domain: 'maritime',
        queryType: 'suspicious-vessels',
        message: 'Failed to query suspicious vessels data',
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle loitering vessels query
   */
  private static async handleLoiteringVessels(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      const response = await fetch('/api/maritime/anomalies?types=LOITERING&demo=true')
      const data = await response.json()

      return {
        success: true,
        domain: 'maritime',
        queryType: 'loitering-vessels',
        data: {
          anomalies: data.anomalies || [],
          count: data.count || 0,
          message: `Found ${data.count || 0} loitering vessels`,
          location: query.location
        },
        message: `Detected ${data.count || 0} vessels loitering${query.location ? ` near ${query.location}` : ' in the Kattegat Strait'}`,
        intTypes: ['GEOINT', 'TEMPORAL', 'IMINT'],
        layersApplied: layers
      }
    } catch (error) {
      return {
        success: false,
        domain: 'maritime',
        queryType: 'loitering-vessels',
        message: 'Failed to query loitering vessels data',
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle vessel rendezvous query
   */
  private static async handleVesselRendezvous(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      const response = await fetch('/api/maritime/anomalies?types=RENDEZVOUS&demo=true')
      const data = await response.json()

      return {
        success: true,
        domain: 'maritime',
        queryType: 'vessel-rendezvous',
        data: {
          anomalies: data.anomalies || [],
          count: data.count || 0,
          message: `Found ${data.count || 0} vessel rendezvous events`,
          location: query.location
        },
        message: `Detected ${data.count || 0} vessel rendezvous events${query.location ? ` near ${query.location}` : ' in the Kattegat Strait'}`,
        intTypes: ['GEOINT', 'TEMPORAL', 'SIGINT'],
        layersApplied: layers
      }
    } catch (error) {
      return {
        success: false,
        domain: 'maritime',
        queryType: 'vessel-rendezvous',
        message: 'Failed to query vessel rendezvous data',
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle generic anomaly search query
   */
  private static async handleAnomalySearch(
    query: MaritimeDomainQuery,
    layers: ICLayerId[]
  ): Promise<MaritimeDomainResult> {
    try {
      const types = query.anomalyTypes?.join(',') || ''
      const minSeverity = query.minSeverity || 'low'
      const response = await fetch(
        `/api/maritime/anomalies?types=${types}&minSeverity=${minSeverity}&demo=true`
      )
      const data = await response.json()

      return {
        success: true,
        domain: 'maritime',
        queryType: 'anomaly-search',
        data: {
          anomalies: data.anomalies || [],
          count: data.count || 0,
          statistics: data.statistics,
          message: `Found ${data.count || 0} anomalies`,
          location: query.location
        },
        message: `Detected ${data.count || 0} maritime anomalies${query.location ? ` near ${query.location}` : ' in the Kattegat Strait'}`,
        intTypes: ['SIGINT', 'GEOINT', 'TEMPORAL', 'MASINT'],
        layersApplied: layers
      }
    } catch (error) {
      return {
        success: false,
        domain: 'maritime',
        queryType: 'anomaly-search',
        message: 'Failed to query anomaly data',
        intTypes: [],
        layersApplied: []
      }
    }
  }
}

/**
 * Singleton accessor
 */
export function getMaritimeDomainHandler(): typeof MaritimeDomainHandler {
  return MaritimeDomainHandler
}
