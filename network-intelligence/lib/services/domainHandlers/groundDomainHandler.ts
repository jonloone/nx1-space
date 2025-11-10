/**
 * Ground Domain Handler
 * Processes queries for ground-level operations and infrastructure
 *
 * Capabilities:
 * - Route analysis with multi-INT assessment
 * - Building and address intelligence
 * - Place search and POI analysis
 * - Road network analysis
 * - Pattern-of-life (temporal analysis)
 */

import { type ICLayerId } from '@/lib/config/icLayers'

export interface GroundDomainQuery {
  type: 'route' | 'place-search' | 'area-analysis' | 'building-analysis'
  location?: string
  fromLocation?: string
  toLocation?: string
  categories?: string[]
  radius?: number
  mode?: 'driving' | 'walking' | 'cycling'
}

export interface GroundDomainResult {
  success: boolean
  domain: 'ground'
  queryType: GroundDomainQuery['type']
  data?: any
  message: string
  intTypes: string[]  // INT types used (GEOINT, SIGINT, OSINT, etc.)
  layersApplied: ICLayerId[]
}

/**
 * Ground Domain Handler
 * Routes ground-level queries to appropriate analysis services
 */
export class GroundDomainHandler {
  /**
   * Parse natural language query for ground domain
   */
  static parseQuery(query: string): GroundDomainQuery | null {
    const lowerQuery = query.toLowerCase()

    // Route analysis pattern
    if (lowerQuery.includes('route') || lowerQuery.includes('from')) {
      return this.parseRouteQuery(query)
    }

    // Place search pattern
    if (lowerQuery.includes('show') || lowerQuery.includes('find') || lowerQuery.includes('search')) {
      return this.parsePlaceSearchQuery(query)
    }

    // Area analysis pattern
    if (lowerQuery.includes('analyze') || lowerQuery.includes('assessment')) {
      return this.parseAreaAnalysisQuery(query)
    }

    return null
  }

  /**
   * Parse route analysis queries
   * Examples: "route from X to Y", "show route between A and B"
   */
  private static parseRouteQuery(query: string): GroundDomainQuery | null {
    let fromLocation: string | undefined
    let toLocation: string | undefined

    // Pattern 1: "from X to Y"
    const fromToMatch = query.match(/from\s+([\w\s,.-]+?)\s+to\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    if (fromToMatch) {
      fromLocation = fromToMatch[1].trim()
      toLocation = fromToMatch[2].trim()
    }

    // Pattern 2: "between X and Y"
    if (!fromLocation) {
      const betweenMatch = query.match(/between\s+([\w\s,.-]+?)\s+and\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
      if (betweenMatch) {
        fromLocation = betweenMatch[1].trim()
        toLocation = betweenMatch[2].trim()
      }
    }

    // Pattern 3: "route X to Y"
    if (!fromLocation) {
      const routeMatch = query.match(/route\s+([\w\s,.-]+?)\s+to\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
      if (routeMatch) {
        fromLocation = routeMatch[1].trim()
        toLocation = routeMatch[2].trim()
      }
    }

    // Pattern 4: "from X and Y" (common typo)
    if (!fromLocation) {
      const fromAndMatch = query.match(/from\s+([\w\s,.-]+?)\s+and\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
      if (fromAndMatch) {
        fromLocation = fromAndMatch[1].trim()
        toLocation = fromAndMatch[2].trim()
      }
    }

    if (!fromLocation || !toLocation) {
      return null
    }

    // Detect travel mode
    let mode: 'driving' | 'walking' | 'cycling' = 'driving'
    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes('walk')) mode = 'walking'
    else if (lowerQuery.includes('cycl') || lowerQuery.includes('bike')) mode = 'cycling'

    return {
      type: 'route',
      fromLocation,
      toLocation,
      mode
    }
  }

  /**
   * Parse place search queries
   * Examples: "show hospitals near X", "find coffee shops in Manhattan"
   */
  private static parsePlaceSearchQuery(query: string): GroundDomainQuery | null {
    // Extract location
    const locationMatch = query.match(/(?:near|in|at|around)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    // Extract categories (simplified - could be enhanced)
    const categories: string[] = []
    if (query.includes('hospital')) categories.push('hospital', 'emergency_room', 'clinic')
    if (query.includes('coffee') || query.includes('cafe')) categories.push('coffee_shop', 'cafe')
    if (query.includes('restaurant')) categories.push('restaurant')
    if (query.includes('airport')) categories.push('airport')
    if (query.includes('port')) categories.push('port', 'seaport', 'marine_terminal')

    return {
      type: 'place-search',
      location,
      categories,
      radius: 5000
    }
  }

  /**
   * Parse area analysis queries
   * Examples: "analyze downtown LA", "assessment of Brooklyn"
   */
  private static parseAreaAnalysisQuery(query: string): GroundDomainQuery | null {
    // Extract location
    const locationMatch = query.match(/(?:analyze|assessment of|analyze)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    if (!location) {
      return null
    }

    return {
      type: 'area-analysis',
      location,
      radius: 10000
    }
  }

  /**
   * Execute ground domain analysis
   */
  static async executeAnalysis(
    parsedQuery: GroundDomainQuery,
    layers: ICLayerId[]
  ): Promise<GroundDomainResult> {
    try {
      switch (parsedQuery.type) {
        case 'route':
          return await this.handleRouteAnalysis(parsedQuery, layers)

        case 'place-search':
          return await this.handlePlaceSearch(parsedQuery, layers)

        case 'area-analysis':
          return await this.handleAreaAnalysis(parsedQuery, layers)

        default:
          return {
            success: false,
            domain: 'ground',
            queryType: parsedQuery.type,
            message: 'Unknown ground domain query type',
            intTypes: [],
            layersApplied: []
          }
      }
    } catch (error) {
      console.error('Ground domain analysis error:', error)
      return {
        success: false,
        domain: 'ground',
        queryType: parsedQuery.type,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle route analysis with multi-INT
   */
  private static async handleRouteAnalysis(
    query: GroundDomainQuery,
    layers: ICLayerId[]
  ): Promise<GroundDomainResult> {
    // This will be executed as a tool call in CopilotSidebarWrapper
    // We just return the intent here
    return {
      success: true,
      domain: 'ground',
      queryType: 'route',
      data: {
        toolCall: {
          tool: 'analyzeRoute',
          params: {
            fromLocation: query.fromLocation,
            toLocation: query.toLocation,
            mode: query.mode || 'driving'
          }
        }
      },
      message: `Analyzing ${query.mode || 'driving'} route from ${query.fromLocation} to ${query.toLocation}...`,
      intTypes: ['GEOINT', 'SIGINT', 'OSINT', 'TEMPORAL'],
      layersApplied: layers
    }
  }

  /**
   * Handle place search
   */
  private static async handlePlaceSearch(
    query: GroundDomainQuery,
    layers: ICLayerId[]
  ): Promise<GroundDomainResult> {
    return {
      success: true,
      domain: 'ground',
      queryType: 'place-search',
      data: {
        toolCall: {
          tool: 'searchPlaces',
          params: {
            location: query.location || 'current',
            categories: query.categories || [],
            radius: query.radius || 5000
          }
        }
      },
      message: `Searching for ${query.categories?.join(', ') || 'places'} near ${query.location || 'current location'}...`,
      intTypes: ['GEOINT', 'OSINT'],
      layersApplied: layers
    }
  }

  /**
   * Handle area analysis
   */
  private static async handleAreaAnalysis(
    query: GroundDomainQuery,
    layers: ICLayerId[]
  ): Promise<GroundDomainResult> {
    return {
      success: true,
      domain: 'ground',
      queryType: 'area-analysis',
      data: {
        toolCall: {
          tool: 'analyzeArea',
          params: {
            location: query.location,
            radius: query.radius || 10000
          }
        }
      },
      message: `Analyzing ${query.location} area...`,
      intTypes: ['GEOINT', 'OSINT'],
      layersApplied: layers
    }
  }
}

/**
 * Singleton accessor
 */
export function getGroundDomainHandler(): typeof GroundDomainHandler {
  return GroundDomainHandler
}
