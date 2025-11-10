/**
 * Space Domain Handler
 * Processes queries for space-based operations and imagery intelligence
 *
 * Capabilities:
 * - Satellite imagery analysis
 * - Change detection
 * - Activity monitoring
 * - Multi-spectral analysis
 * - Time-series imagery
 */

import { type ICLayerId } from '@/lib/config/icLayers'

export interface SpaceDomainQuery {
  type: 'imagery-analysis' | 'change-detection' | 'activity-monitoring' | 'time-series'
  location?: string
  startDate?: Date
  endDate?: Date
  includeChangeDetection?: boolean
  includeActivity?: boolean
}

export interface SpaceDomainResult {
  success: boolean
  domain: 'space'
  queryType: SpaceDomainQuery['type']
  data?: any
  message: string
  intTypes: string[]
  layersApplied: ICLayerId[]
}

/**
 * Space Domain Handler
 * Routes space-based imagery queries to appropriate analysis services
 */
export class SpaceDomainHandler {
  /**
   * Parse natural language query for space domain
   */
  static parseQuery(query: string): SpaceDomainQuery | null {
    const lowerQuery = query.toLowerCase()

    // Imagery analysis pattern
    if (lowerQuery.includes('imagery') || lowerQuery.includes('satellite')) {
      return this.parseImageryQuery(query)
    }

    // Change detection pattern
    if (lowerQuery.includes('change') || lowerQuery.includes('compare')) {
      return this.parseChangeDetectionQuery(query)
    }

    // Activity monitoring pattern
    if (lowerQuery.includes('activity') || lowerQuery.includes('monitor')) {
      return this.parseActivityMonitoringQuery(query)
    }

    return null
  }

  /**
   * Parse imagery analysis queries
   */
  private static parseImageryQuery(query: string): SpaceDomainQuery {
    const locationMatch = query.match(/(?:for|of|at|in)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    const includeChangeDetection = query.toLowerCase().includes('change')
    const includeActivity = query.toLowerCase().includes('activity')

    // Default to last 90 days if no dates specified
    const endDate = new Date()
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    return {
      type: 'imagery-analysis',
      location,
      startDate,
      endDate,
      includeChangeDetection,
      includeActivity
    }
  }

  /**
   * Parse change detection queries
   */
  private static parseChangeDetectionQuery(query: string): SpaceDomainQuery {
    const locationMatch = query.match(/(?:for|of|at|in)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    const endDate = new Date()
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    return {
      type: 'change-detection',
      location,
      startDate,
      endDate,
      includeChangeDetection: true,
      includeActivity: false
    }
  }

  /**
   * Parse activity monitoring queries
   */
  private static parseActivityMonitoringQuery(query: string): SpaceDomainQuery {
    const locationMatch = query.match(/(?:at|in|for)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    const location = locationMatch ? locationMatch[1].trim() : undefined

    const endDate = new Date()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days for activity

    return {
      type: 'activity-monitoring',
      location,
      startDate,
      endDate,
      includeChangeDetection: false,
      includeActivity: true
    }
  }

  /**
   * Execute space domain analysis
   */
  static async executeAnalysis(
    parsedQuery: SpaceDomainQuery,
    layers: ICLayerId[]
  ): Promise<SpaceDomainResult> {
    try {
      switch (parsedQuery.type) {
        case 'imagery-analysis':
        case 'change-detection':
        case 'activity-monitoring':
        case 'time-series':
          return await this.handleImageryAnalysis(parsedQuery, layers)

        default:
          return {
            success: false,
            domain: 'space',
            queryType: parsedQuery.type,
            message: 'Unknown space domain query type',
            intTypes: [],
            layersApplied: []
          }
      }
    } catch (error) {
      console.error('Space domain analysis error:', error)
      return {
        success: false,
        domain: 'space',
        queryType: parsedQuery.type,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        intTypes: [],
        layersApplied: []
      }
    }
  }

  /**
   * Handle imagery analysis (all types use same tool)
   */
  private static async handleImageryAnalysis(
    query: SpaceDomainQuery,
    layers: ICLayerId[]
  ): Promise<SpaceDomainResult> {
    if (!query.location) {
      return {
        success: false,
        domain: 'space',
        queryType: query.type,
        message: 'Location required for imagery analysis',
        intTypes: [],
        layersApplied: []
      }
    }

    return {
      success: true,
      domain: 'space',
      queryType: query.type,
      data: {
        toolCall: {
          tool: 'analyzeImagery',
          params: {
            location: query.location,
            startDate: query.startDate?.toISOString(),
            endDate: query.endDate?.toISOString(),
            includeChangeDetection: query.includeChangeDetection || false,
            includeActivity: query.includeActivity || false
          }
        }
      },
      message: `Analyzing satellite imagery for ${query.location}${query.includeChangeDetection ? ' with change detection' : ''}${query.includeActivity ? ' and activity analysis' : ''}...`,
      intTypes: ['IMINT', 'GEOINT', 'TEMPORAL'],
      layersApplied: layers
    }
  }
}

/**
 * Singleton accessor
 */
export function getSpaceDomainHandler(): typeof SpaceDomainHandler {
  return SpaceDomainHandler
}
