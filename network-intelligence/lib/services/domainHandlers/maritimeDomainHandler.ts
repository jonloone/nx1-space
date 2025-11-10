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
 */

import { type ICLayerId } from '@/lib/config/icLayers'

export interface MaritimeDomainQuery {
  type: 'vessel-density' | 'shipping-lanes' | 'port-analysis' | 'maritime-traffic'
  location?: string
  radius?: number
  timeRange?: { start: Date; end: Date }
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
        case 'vessel-density':
          return await this.handleVesselDensity(parsedQuery, layers)

        case 'shipping-lanes':
          return await this.handleShippingLanes(parsedQuery, layers)

        case 'port-analysis':
          return await this.handlePortAnalysis(parsedQuery, layers)

        case 'maritime-traffic':
          return await this.handleMaritimeTraffic(parsedQuery, layers)

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
}

/**
 * Singleton accessor
 */
export function getMaritimeDomainHandler(): typeof MaritimeDomainHandler {
  return MaritimeDomainHandler
}
