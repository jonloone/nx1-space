/**
 * IC Analysis Handler
 * Central router for IC domain-based analysis
 *
 * Routes queries to appropriate domain handlers based on selected domain and layers
 * Coordinates intelligence fusion across domains and enrichment layers
 */

import { type ICDomainId, getICDomain } from '@/lib/config/icDomains'
import { type ICLayerId, isLayerCompatible } from '@/lib/config/icLayers'
import { GroundDomainHandler } from './domainHandlers/groundDomainHandler'
import { MaritimeDomainHandler } from './domainHandlers/maritimeDomainHandler'
import { SpaceDomainHandler } from './domainHandlers/spaceDomainHandler'

export interface ICAnalysisRequest {
  query: string
  domain: ICDomainId
  layers: ICLayerId[]
}

export interface ICAnalysisResult {
  success: boolean
  domain: ICDomainId
  layers: ICLayerId[]
  message: string
  toolCall?: {
    tool: string
    params: any
    pendingMessage?: string
  }
  data?: any
  intTypes: string[]
  error?: string
}

/**
 * IC Analysis Handler
 * Routes analysis requests to appropriate domain handlers
 */
export class ICAnalysisHandler {
  /**
   * Process query in the context of selected IC domain and layers
   */
  static async processQuery(
    query: string,
    domain: ICDomainId,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    console.log(`[ICAnalysisHandler] Processing query in ${domain} domain with layers:`, layers)
    console.log(`[ICAnalysisHandler] Query:`, query)

    // Validate domain
    const domainConfig = getICDomain(domain)
    if (!domainConfig) {
      return {
        success: false,
        domain,
        layers,
        message: `Unknown domain: ${domain}`,
        intTypes: [],
        error: 'INVALID_DOMAIN'
      }
    }

    // Check domain availability
    if (domainConfig.status === 'unavailable') {
      return {
        success: false,
        domain,
        layers,
        message: `${domainConfig.name} is not yet available. ${domainConfig.statusMessage || ''}`,
        intTypes: [],
        error: 'DOMAIN_UNAVAILABLE'
      }
    }

    // Validate layers are compatible with domain
    const incompatibleLayers = layers.filter(layer => !isLayerCompatible(layer, domain))
    if (incompatibleLayers.length > 0) {
      console.warn(`[ICAnalysisHandler] Incompatible layers for ${domain}:`, incompatibleLayers)
      // Filter out incompatible layers
      layers = layers.filter(layer => isLayerCompatible(layer, domain))
    }

    // Route to appropriate domain handler
    try {
      switch (domain) {
        case 'ground':
          return await this.handleGroundDomain(query, layers)

        case 'maritime':
          return await this.handleMaritimeDomain(query, layers)

        case 'space':
          return await this.handleSpaceDomain(query, layers)

        case 'surface':
          return await this.handleSurfaceDomain(query, layers)

        case 'air':
          return await this.handleAirDomain(query, layers)

        case 'subsurface':
          return await this.handleSubsurfaceDomain(query, layers)

        default:
          return {
            success: false,
            domain,
            layers,
            message: `Domain handler not implemented: ${domain}`,
            intTypes: [],
            error: 'HANDLER_NOT_IMPLEMENTED'
          }
      }
    } catch (error) {
      console.error('[ICAnalysisHandler] Error processing query:', error)
      return {
        success: false,
        domain,
        layers,
        message: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        intTypes: [],
        error: 'PROCESSING_ERROR'
      }
    }
  }

  /**
   * Handle Ground domain queries
   */
  private static async handleGroundDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    const parsedQuery = GroundDomainHandler.parseQuery(query)

    if (!parsedQuery) {
      return {
        success: false,
        domain: 'ground',
        layers,
        message: 'Could not parse ground domain query. Try: "Analyze route from X to Y" or "Find hospitals near Manhattan"',
        intTypes: [],
        error: 'QUERY_PARSE_ERROR'
      }
    }

    const result = await GroundDomainHandler.executeAnalysis(parsedQuery, layers)

    // Convert domain result to IC analysis result
    return {
      success: result.success,
      domain: 'ground',
      layers: result.layersApplied,
      message: result.message,
      toolCall: result.data?.toolCall,
      data: result.data,
      intTypes: result.intTypes
    }
  }

  /**
   * Handle Maritime domain queries
   */
  private static async handleMaritimeDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    const parsedQuery = MaritimeDomainHandler.parseQuery(query)

    if (!parsedQuery) {
      return {
        success: false,
        domain: 'maritime',
        layers,
        message: 'Could not parse maritime domain query. Try: "Show vessel density near Los Angeles port" or "Analyze shipping lanes in Pacific"',
        intTypes: [],
        error: 'QUERY_PARSE_ERROR'
      }
    }

    const result = await MaritimeDomainHandler.executeAnalysis(parsedQuery, layers)

    return {
      success: result.success,
      domain: 'maritime',
      layers: result.layersApplied,
      message: result.message,
      data: result.data,
      intTypes: result.intTypes
    }
  }

  /**
   * Handle Space domain queries
   */
  private static async handleSpaceDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    const parsedQuery = SpaceDomainHandler.parseQuery(query)

    if (!parsedQuery) {
      return {
        success: false,
        domain: 'space',
        layers,
        message: 'Could not parse space domain query. Try: "Analyze satellite imagery for Buenos Aires" or "Change detection over last 90 days"',
        intTypes: [],
        error: 'QUERY_PARSE_ERROR'
      }
    }

    const result = await SpaceDomainHandler.executeAnalysis(parsedQuery, layers)

    return {
      success: result.success,
      domain: 'space',
      layers: result.layersApplied,
      message: result.message,
      toolCall: result.data?.toolCall,
      data: result.data,
      intTypes: result.intTypes
    }
  }

  /**
   * Handle Surface domain queries (partial implementation)
   */
  private static async handleSurfaceDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    return {
      success: false,
      domain: 'surface',
      layers,
      message: 'Surface domain analysis is partially available. Terrain visualization is supported via the map basemap.',
      intTypes: ['GEOINT'],
      error: 'PARTIAL_IMPLEMENTATION'
    }
  }

  /**
   * Handle Air domain queries (unavailable)
   */
  private static async handleAirDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    return {
      success: false,
      domain: 'air',
      layers,
      message: 'Air domain analysis is not yet available. Airport locations can be found via Ground domain place search.',
      intTypes: [],
      error: 'DOMAIN_UNAVAILABLE'
    }
  }

  /**
   * Handle Subsurface domain queries (unavailable)
   */
  private static async handleSubsurfaceDomain(
    query: string,
    layers: ICLayerId[]
  ): Promise<ICAnalysisResult> {
    return {
      success: false,
      domain: 'subsurface',
      layers,
      message: 'Subsurface domain analysis is not yet available.',
      intTypes: [],
      error: 'DOMAIN_UNAVAILABLE'
    }
  }

  /**
   * Get suggested queries for a domain
   */
  static getSuggestionsForDomain(domain: ICDomainId, layers: ICLayerId[]): string[] {
    const domainConfig = getICDomain(domain)
    if (!domainConfig) return []

    return domainConfig.examples
  }

  /**
   * Get INT types available for domain + layer combination
   */
  static getAvailableINTTypes(domain: ICDomainId, layers: ICLayerId[]): string[] {
    const domainConfig = getICDomain(domain)
    if (!domainConfig) return []

    const intTypes = new Set<string>()

    // Add INT types from domain capabilities
    Object.entries(domainConfig.capabilities).forEach(([intType, level]) => {
      if (level !== 'none') {
        intTypes.add(intType)
      }
    })

    // Add layer-specific INT types
    if (layers.includes('cyber')) {
      intTypes.add('SIGINT')
    }
    if (layers.includes('social-media') || layers.includes('business-intel')) {
      intTypes.add('OSINT')
    }

    return Array.from(intTypes)
  }
}

/**
 * Singleton accessor
 */
export function getICAnalysisHandler(): typeof ICAnalysisHandler {
  return ICAnalysisHandler
}
