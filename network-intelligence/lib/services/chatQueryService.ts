/**
 * Chat Query Service
 *
 * Unified service for processing natural language queries across all domains
 * (Ground, Maritime, Space). Integrates with:
 * - Vultr LLM for intent parsing
 * - Intent Classifier for query understanding
 * - CrewAI for complex multi-agent analysis
 * - Domain-specific data services
 */

import { VultrLLMService, getVultrLLMService } from './vultrLLMService'
import { IntentClassificationService, getIntentClassifier } from './intentClassifier'
import { CrewAIService, crewaiService } from './crewaiService'

// Domain types
export type IntelDomain = 'ground' | 'maritime' | 'space' | 'all'

// Query result interface
export interface QueryResult {
  sql: string
  data: any[]
  columns: string[]
  executionTime?: number
  domain?: IntelDomain
  agentInsights?: string[]
  suggestions?: string[]
}

// Conversation context for follow-up queries
export interface ConversationContext {
  previousQueries: string[]
  previousResults?: QueryResult[]
  viewport?: {
    bounds?: [number, number, number, number] // [west, south, east, north]
    center?: [number, number]
    zoom?: number
  }
  selectedFeatures?: string[]
}

// Service response with enhanced metadata
export interface ChatQueryResponse {
  success: boolean
  results: QueryResult | null
  naturalLanguageResponse: string
  sql: string
  domain: IntelDomain
  agentInsights?: string[]
  suggestions?: string[]
  processingTimeMs: number
  error?: string
}

/**
 * ChatQueryService
 *
 * Main service for processing natural language data queries
 */
export class ChatQueryService {
  private llm: VultrLLMService | null = null
  private intentClassifier: IntentClassificationService | null = null
  private crewai: CrewAIService
  private crewaiAvailable: boolean = false
  private llmAvailable: boolean = false

  constructor() {
    // Try to initialize LLM services (may fail if API key not set)
    try {
      this.llm = getVultrLLMService()
      this.intentClassifier = getIntentClassifier()
      this.llmAvailable = true
      console.log('✅ LLM services initialized')
    } catch (error) {
      console.log('⚠️  LLM services unavailable, using demo mode:', error instanceof Error ? error.message : 'Unknown error')
      this.llmAvailable = false
    }

    this.crewai = crewaiService

    // Check CrewAI availability on init
    this.checkCrewAIAvailability()
  }

  /**
   * Check if CrewAI service is available
   */
  private async checkCrewAIAvailability(): Promise<void> {
    try {
      await this.crewai.checkHealth()
      this.crewaiAvailable = true
      console.log('✅ CrewAI service is available')
    } catch (error) {
      this.crewaiAvailable = false
      console.log('⚠️  CrewAI service unavailable, using LLM-only mode')
    }
  }

  /**
   * Process a natural language query
   */
  async processQuery(
    query: string,
    domain: IntelDomain,
    context?: ConversationContext
  ): Promise<ChatQueryResponse> {
    const startTime = Date.now()
    console.log(`🔍 Processing query: "${query}" (domain: ${domain})`)

    try {
      // Step 1: Classify intent (or use default if LLM not available)
      let intentType = 'search'
      let confidence = 0.7

      if (this.llmAvailable && this.intentClassifier) {
        try {
          const intent = await this.intentClassifier.classifyIntent(query, context)
          intentType = intent.type
          confidence = intent.confidence
          console.log(`🎯 Intent: ${intentType} (confidence: ${confidence})`)
        } catch (err) {
          console.log('⚠️  Intent classification failed, using default')
        }
      } else {
        console.log('🔄 Using demo mode (LLM not available)')
      }

      const intent = { type: intentType, confidence }

      // Step 2: Route based on intent and domain
      let results: QueryResult | null = null
      let nlResponse = ''
      let sql = ''
      let insights: string[] = []
      let suggestions: string[] = []

      // For complex analysis, try CrewAI if available
      if (this.crewaiAvailable && this.shouldUseCrewAI(intent.type, query)) {
        try {
          const crewResponse = await this.processWithCrewAI(query, domain, context)
          results = crewResponse.results
          nlResponse = crewResponse.response
          insights = crewResponse.insights
        } catch (crewError) {
          console.warn('CrewAI processing failed, falling back to LLM:', crewError)
          const llmResponse = await this.processWithLLM(query, domain, context)
          results = llmResponse.results
          nlResponse = llmResponse.response
          sql = llmResponse.sql
        }
      } else {
        // Process with LLM-only approach
        const llmResponse = await this.processWithLLM(query, domain, context)
        results = llmResponse.results
        nlResponse = llmResponse.response
        sql = llmResponse.sql
      }

      // Generate follow-up suggestions
      suggestions = await this.generateSuggestions(query, domain, results)

      return {
        success: true,
        results,
        naturalLanguageResponse: nlResponse,
        sql,
        domain,
        agentInsights: insights.length > 0 ? insights : undefined,
        suggestions,
        processingTimeMs: Date.now() - startTime
      }
    } catch (error) {
      console.error('❌ Query processing error:', error)
      return {
        success: false,
        results: null,
        naturalLanguageResponse: 'Sorry, I encountered an error processing your query. Please try again.',
        sql: '',
        domain,
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Determine if query should use CrewAI
   */
  private shouldUseCrewAI(intentType: string, query: string): boolean {
    // Use CrewAI for complex analysis queries
    const complexKeywords = [
      'analyze', 'investigate', 'comprehensive', 'route',
      'assessment', 'intelligence', 'deep dive', 'multi-int'
    ]

    if (intentType === 'analysis') return true
    return complexKeywords.some(kw => query.toLowerCase().includes(kw))
  }

  /**
   * Process query using CrewAI multi-agent system
   */
  private async processWithCrewAI(
    query: string,
    domain: IntelDomain,
    context?: ConversationContext
  ): Promise<{ results: QueryResult | null; response: string; insights: string[] }> {
    // Determine crew type based on domain
    const crewType = this.mapDomainToCrewType(domain)

    const crewResponse = await this.crewai.executeCrew({
      query,
      context: {
        domain,
        map_center: context?.viewport?.center
          ? { lat: context.viewport.center[1], lng: context.viewport.center[0] }
          : undefined,
        map_zoom: context?.viewport?.zoom
      },
      crew_type: crewType,
      verbose: false
    })

    // Extract results from crew response
    const results: QueryResult | null = crewResponse.artifacts.length > 0
      ? {
          sql: 'Generated by CrewAI multi-agent analysis',
          data: crewResponse.artifacts.map(a => a.data).filter(Boolean).flat(),
          columns: this.inferColumns(crewResponse.artifacts),
          executionTime: crewResponse.total_duration_ms,
          domain,
          agentInsights: crewResponse.task_results.map(t => t.output).filter(Boolean)
        }
      : null

    return {
      results,
      response: crewResponse.output,
      insights: crewResponse.task_results.map(t => `${t.agent_name}: ${t.output}`).filter(Boolean)
    }
  }

  /**
   * Process query using LLM-only approach
   */
  private async processWithLLM(
    query: string,
    domain: IntelDomain,
    context?: ConversationContext
  ): Promise<{ results: QueryResult; response: string; sql: string }> {
    // Generate SQL based on query and domain
    const sql = this.generateSQL(query, domain)

    // Generate mock/demo results (in production, would execute against real database)
    const results = await this.generateResults(query, domain)

    // Generate natural language response
    const response = this.generateNLResponse(query, results, domain)

    return { results, response, sql }
  }

  /**
   * Generate SQL from natural language query
   */
  private generateSQL(query: string, domain: IntelDomain): string {
    const lowerQuery = query.toLowerCase()
    const tablePrefix = domain === 'all' ? '' : `${domain}_`

    // Ground domain queries
    if (domain === 'ground' || domain === 'all') {
      if (lowerQuery.includes('airport')) {
        return `SELECT id, name, type, elevation_ft, latitude, longitude
FROM ${tablePrefix}airports
WHERE country = 'US'
ORDER BY elevation_ft DESC
LIMIT 10;`
      }
      if (lowerQuery.includes('hospital')) {
        return `SELECT id, name, address, beds, latitude, longitude,
  ST_Distance(geom, ST_MakePoint(-74.006, 40.7128)) as distance_m
FROM ${tablePrefix}hospitals
ORDER BY distance_m ASC
LIMIT 20;`
      }
    }

    // Maritime domain queries
    if (domain === 'maritime' || domain === 'all') {
      if (lowerQuery.includes('port') || lowerQuery.includes('seaport')) {
        return `SELECT id, name, port_type, cargo_capacity_teu, latitude, longitude
FROM maritime_ports
WHERE port_type IN ('container', 'bulk', 'ro-ro')
ORDER BY cargo_capacity_teu DESC
LIMIT 20;`
      }
      if (lowerQuery.includes('ship') || lowerQuery.includes('vessel')) {
        return `SELECT mmsi, vessel_name, vessel_type, flag_country, latitude, longitude
FROM maritime_vessels
WHERE last_seen > NOW() - INTERVAL '24 hours'
ORDER BY last_seen DESC
LIMIT 50;`
      }
    }

    // Space domain queries
    if (domain === 'space' || domain === 'all') {
      if (lowerQuery.includes('satellite')) {
        return `SELECT norad_id, name, orbit_type, altitude_km, inclination_deg, latitude, longitude
FROM space_satellites
WHERE status = 'active'
ORDER BY launch_date DESC
LIMIT 30;`
      }
      if (lowerQuery.includes('ground station')) {
        return `SELECT id, name, operator, country, antennas, latitude, longitude
FROM space_ground_stations
ORDER BY utilization_pct DESC
LIMIT 20;`
      }
    }

    // Default query
    return `SELECT id, name, type, latitude, longitude
FROM ${tablePrefix}entities
WHERE LOWER(name) LIKE '%${lowerQuery.split(' ').slice(0, 3).join('%')}%'
LIMIT 20;`
  }

  /**
   * Generate results based on domain and query
   */
  private async generateResults(query: string, domain: IntelDomain): Promise<QueryResult> {
    const lowerQuery = query.toLowerCase()
    const startTime = Date.now()

    // Ground domain results
    if (domain === 'ground' || (domain === 'all' && this.isGroundQuery(lowerQuery))) {
      if (lowerQuery.includes('airport')) {
        return {
          sql: this.generateSQL(query, domain),
          columns: ['ID', 'NAME', 'TYPE', 'ELEVATION', 'LATITUDE', 'LONGITUDE'],
          data: [
            { id: 1, name: 'Leadville Lake County Airport', type: 'small_airport', elevation: 9927, lat: 39.2203, lng: -106.3167 },
            { id: 2, name: 'Telluride Regional Airport', type: 'medium_airport', elevation: 9070, lat: 37.9538, lng: -107.9084 },
            { id: 3, name: 'Aspen/Pitkin County Airport', type: 'medium_airport', elevation: 7820, lat: 39.2232, lng: -106.8688 },
            { id: 4, name: 'Alamosa San Luis Valley Regional', type: 'small_airport', elevation: 7539, lat: 37.4350, lng: -105.8667 },
            { id: 5, name: 'Flagstaff Pulliam Airport', type: 'medium_airport', elevation: 7014, lat: 35.1403, lng: -111.6691 },
          ],
          executionTime: Date.now() - startTime,
          domain
        }
      }
    }

    // Maritime domain results
    if (domain === 'maritime' || (domain === 'all' && this.isMaritimeQuery(lowerQuery))) {
      return {
        sql: this.generateSQL(query, domain),
        columns: ['ID', 'NAME', 'PORT_TYPE', 'CARGO_TEU', 'LATITUDE', 'LONGITUDE'],
        data: [
          { id: 1, name: 'Port of Los Angeles', port_type: 'container', cargo_teu: 9213000, lat: 33.7406, lng: -118.2712 },
          { id: 2, name: 'Port of Long Beach', port_type: 'container', cargo_teu: 8091000, lat: 33.7540, lng: -118.2166 },
          { id: 3, name: 'Port of New York/New Jersey', port_type: 'container', cargo_teu: 7619000, lat: 40.6698, lng: -74.0446 },
          { id: 4, name: 'Port of Savannah', port_type: 'container', cargo_teu: 5763000, lat: 32.1280, lng: -81.1403 },
          { id: 5, name: 'Port of Houston', port_type: 'bulk', cargo_teu: 3712000, lat: 29.7355, lng: -95.0185 },
        ],
        executionTime: Date.now() - startTime,
        domain
      }
    }

    // Space domain results
    if (domain === 'space' || (domain === 'all' && this.isSpaceQuery(lowerQuery))) {
      return {
        sql: this.generateSQL(query, domain),
        columns: ['NORAD_ID', 'NAME', 'ORBIT_TYPE', 'ALTITUDE_KM', 'LATITUDE', 'LONGITUDE'],
        data: [
          { norad_id: 25544, name: 'ISS (ZARYA)', orbit_type: 'LEO', altitude_km: 420, lat: 51.6435, lng: -0.0014 },
          { norad_id: 48274, name: 'STARLINK-2305', orbit_type: 'LEO', altitude_km: 550, lat: 53.1235, lng: 6.7892 },
          { norad_id: 43013, name: 'NOAA 20', orbit_type: 'SSO', altitude_km: 824, lat: -23.5505, lng: -46.6333 },
          { norad_id: 29155, name: 'GOES 13', orbit_type: 'GEO', altitude_km: 35786, lat: 0.0, lng: -75.0 },
          { norad_id: 41866, name: 'SENTINEL-2A', orbit_type: 'SSO', altitude_km: 786, lat: 48.8566, lng: 2.3522 },
        ],
        executionTime: Date.now() - startTime,
        domain
      }
    }

    // Default results
    return {
      sql: this.generateSQL(query, domain),
      columns: ['ID', 'NAME', 'TYPE', 'LATITUDE', 'LONGITUDE'],
      data: [
        { id: 1, name: 'Location Alpha', type: 'infrastructure', lat: 40.7128, lng: -74.006 },
        { id: 2, name: 'Location Beta', type: 'infrastructure', lat: 40.7580, lng: -73.9855 },
      ],
      executionTime: Date.now() - startTime,
      domain
    }
  }

  /**
   * Generate natural language response
   */
  private generateNLResponse(query: string, results: QueryResult, domain: IntelDomain): string {
    const count = results.data.length
    const domainLabel = domain === 'all' ? 'locations' : `${domain} entities`

    if (count === 0) {
      return `I couldn't find any ${domainLabel} matching your query. Try refining your search criteria or selecting a different domain.`
    }

    // Generate contextual response
    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes('airport') && lowerQuery.includes('altitude')) {
      return `Found **${count} airports** sorted by elevation. The highest is ${results.data[0]?.name} at ${results.data[0]?.elevation?.toLocaleString()} feet.`
    }
    if (lowerQuery.includes('port') || lowerQuery.includes('seaport')) {
      return `Found **${count} seaports** ranked by cargo volume. ${results.data[0]?.name} handles the most TEUs.`
    }
    if (lowerQuery.includes('satellite')) {
      return `Found **${count} active satellites**. The ISS is currently orbiting at ${results.data[0]?.altitude_km}km altitude.`
    }

    return `Found **${count} ${domainLabel}** matching your query. Results are displayed on the map and in the data panel below.`
  }

  /**
   * Generate follow-up query suggestions
   */
  private async generateSuggestions(query: string, domain: IntelDomain, results: QueryResult | null): Promise<string[]> {
    const suggestions: string[] = []

    if (domain === 'ground') {
      suggestions.push('Show hospitals near these airports')
      suggestions.push('Analyze road infrastructure in this area')
    } else if (domain === 'maritime') {
      suggestions.push('Show shipping routes between these ports')
      suggestions.push('Analyze vessel traffic patterns')
    } else if (domain === 'space') {
      suggestions.push('Show ground stations covering these satellites')
      suggestions.push('Calculate pass times for this region')
    } else {
      suggestions.push('Focus analysis on maritime domain')
      suggestions.push('Show infrastructure correlation')
    }

    return suggestions
  }

  /**
   * Map domain to CrewAI crew type
   */
  private mapDomainToCrewType(domain: IntelDomain): 'route' | 'site' | 'investigation' | 'auto' {
    // For now, default to 'auto' which will be extended when we add domain-specific crews
    return 'auto'
  }

  /**
   * Infer columns from artifacts
   */
  private inferColumns(artifacts: any[]): string[] {
    if (artifacts.length === 0) return ['ID', 'NAME', 'TYPE', 'LATITUDE', 'LONGITUDE']

    const firstArtifact = artifacts.find(a => a.data && Array.isArray(a.data))
    if (!firstArtifact?.data?.[0]) return ['ID', 'NAME', 'TYPE', 'LATITUDE', 'LONGITUDE']

    return Object.keys(firstArtifact.data[0]).map(k => k.toUpperCase())
  }

  /**
   * Domain detection helpers
   */
  private isGroundQuery(query: string): boolean {
    const groundKeywords = ['airport', 'hospital', 'building', 'road', 'infrastructure', 'city', 'address']
    return groundKeywords.some(kw => query.includes(kw))
  }

  private isMaritimeQuery(query: string): boolean {
    const maritimeKeywords = ['port', 'seaport', 'ship', 'vessel', 'maritime', 'ocean', 'shipping', 'cargo']
    return maritimeKeywords.some(kw => query.includes(kw))
  }

  private isSpaceQuery(query: string): boolean {
    const spaceKeywords = ['satellite', 'orbit', 'space', 'ground station', 'leo', 'geo', 'starlink', 'norad']
    return spaceKeywords.some(kw => query.includes(kw))
  }
}

// Singleton instance
let chatQueryServiceInstance: ChatQueryService | null = null

export function getChatQueryService(): ChatQueryService {
  if (!chatQueryServiceInstance) {
    chatQueryServiceInstance = new ChatQueryService()
  }
  return chatQueryServiceInstance
}
