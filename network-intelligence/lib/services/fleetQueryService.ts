/**
 * Fleet Query Service
 *
 * Parses natural language queries and executes them on fleet data
 * Uses Vultr LLM for intent understanding
 */

import * as turf from '@turf/turf'
import type { SpatialEntity, EntityType, EntityStatus } from '@/lib/models/SpatialEntity'

export interface QueryIntent {
  action: 'filter' | 'search' | 'analyze' | 'aggregate' | 'unknown'
  filters?: {
    status?: EntityStatus[]
    type?: EntityType[]
    properties?: Record<string, any>
  }
  search?: {
    keyword?: string
    location?: string
    radius?: number // km
  }
  analysis?: {
    type: 'buffer' | 'proximity' | 'heatmap' | 'cluster' | 'route'
    params?: Record<string, any>
  }
  aggregation?: {
    metric: 'count' | 'average' | 'sum' | 'min' | 'max'
    field?: string
  }
}

export interface QueryResult {
  intent: QueryIntent
  entities: SpatialEntity[]
  summary: string
  visualHint?: {
    type: 'highlight' | 'buffer' | 'heatmap' | 'route'
    data?: any
  }
}

/**
 * Parse natural language query using LLM
 */
export async function parseFleetQuery(
  query: string,
  vultrApiKey?: string
): Promise<QueryIntent> {
  // For now, use rule-based parsing until we integrate Vultr LLM properly
  const queryLower = query.toLowerCase()

  // Reset/Show all queries
  if (
    queryLower.includes('show all') ||
    queryLower.includes('reset') ||
    queryLower.includes('clear filter') ||
    queryLower === 'all'
  ) {
    return { action: 'filter', filters: {} } // Empty filters = show all
  }

  // Filter queries
  if (queryLower.includes('active') || queryLower.includes('idle') || queryLower.includes('alert')) {
    return parseFilterQuery(queryLower)
  }

  // Location-based queries
  if (queryLower.includes('near') || queryLower.includes('within') || queryLower.includes('on')) {
    return parseLocationQuery(queryLower)
  }

  // Analysis queries
  if (queryLower.includes('buffer') || queryLower.includes('zone') || queryLower.includes('radius')) {
    return parseAnalysisQuery(queryLower)
  }

  // Aggregation queries
  if (queryLower.includes('how many') || queryLower.includes('average') || queryLower.includes('total')) {
    return parseAggregationQuery(queryLower)
  }

  return { action: 'unknown' }
}

/**
 * Execute query on entities
 */
export function executeFleetQuery(
  intent: QueryIntent,
  entities: SpatialEntity[]
): QueryResult {
  let filteredEntities = [...entities]
  let summary = ''
  let visualHint: QueryResult['visualHint']

  switch (intent.action) {
    case 'filter':
      filteredEntities = applyFilters(entities, intent.filters!)
      summary = generateFilterSummary(intent.filters!, filteredEntities.length)
      visualHint = { type: 'highlight' }
      break

    case 'search':
      filteredEntities = applySearch(entities, intent.search!)
      summary = generateSearchSummary(intent.search!, filteredEntities.length)
      visualHint = { type: 'highlight' }
      break

    case 'analyze':
      const analysisResult = performAnalysis(entities, intent.analysis!)
      filteredEntities = analysisResult.entities
      summary = analysisResult.summary
      visualHint = analysisResult.visualHint
      break

    case 'aggregate':
      const aggregationResult = performAggregation(entities, intent.aggregation!)
      summary = aggregationResult.summary
      filteredEntities = entities
      break

    default:
      summary = "I'm not sure what you're asking. Try: 'Show all active vehicles' or 'Find vehicles on Market Street'"
  }

  return {
    intent,
    entities: filteredEntities,
    summary,
    visualHint
  }
}

/**
 * Helper: Parse filter queries
 */
function parseFilterQuery(query: string): QueryIntent {
  const filters: QueryIntent['filters'] = {}

  // Status filters
  if (query.includes('active')) filters.status = ['active']
  if (query.includes('idle')) filters.status = ['idle']
  if (query.includes('alert') || query.includes('delayed')) filters.status = ['alert']
  if (query.includes('maintenance')) filters.status = ['maintenance']

  // Type filters
  if (query.includes('vehicle') || query.includes('van') || query.includes('truck')) {
    filters.type = ['vehicle']
  }

  return {
    action: 'filter',
    filters
  }
}

/**
 * Helper: Parse location queries
 */
function parseLocationQuery(query: string): QueryIntent {
  const search: QueryIntent['search'] = {}

  // Extract road/street names
  const roadPatterns = [
    /on (.+?) (street|st|avenue|ave|boulevard|blvd|road|rd)/i,
    /at (.+)/i,
    /(market|van ness|geary|mission|california|polk)/i
  ]

  for (const pattern of roadPatterns) {
    const match = query.match(pattern)
    if (match) {
      search.location = match[1] || match[0]
      break
    }
  }

  // Extract radius
  const radiusMatch = query.match(/(\d+)\s?(km|kilometer|mile)/i)
  if (radiusMatch) {
    const value = parseInt(radiusMatch[1])
    const unit = radiusMatch[2]
    search.radius = unit.startsWith('m') ? value * 1.60934 : value // miles to km
  }

  // Default radius for "near" queries
  if ((query.includes('near') || query.includes('around')) && !search.radius) {
    search.radius = 5 // 5km default
  }

  return {
    action: 'search',
    search
  }
}

/**
 * Helper: Parse analysis queries
 */
function parseAnalysisQuery(query: string): QueryIntent {
  const analysis: QueryIntent['analysis'] = {
    type: 'buffer',
    params: {}
  }

  // Extract radius for buffer
  const radiusMatch = query.match(/(\d+)\s?(km|kilometer|mile)/i)
  if (radiusMatch) {
    const value = parseInt(radiusMatch[1])
    const unit = radiusMatch[2]
    analysis.params!.radius = unit.startsWith('m') ? value * 1.60934 : value
  } else {
    analysis.params!.radius = 5 // default 5km
  }

  // Determine analysis type
  if (query.includes('heatmap') || query.includes('density')) {
    analysis.type = 'heatmap'
  } else if (query.includes('cluster') || query.includes('group')) {
    analysis.type = 'cluster'
  } else if (query.includes('route') || query.includes('path')) {
    analysis.type = 'route'
  }

  return {
    action: 'analyze',
    analysis
  }
}

/**
 * Helper: Parse aggregation queries
 */
function parseAggregationQuery(query: string): QueryIntent {
  const aggregation: QueryIntent['aggregation'] = {
    metric: 'count'
  }

  if (query.includes('average') || query.includes('avg')) {
    aggregation.metric = 'average'
    if (query.includes('speed')) aggregation.field = 'speed'
  } else if (query.includes('total') || query.includes('sum')) {
    aggregation.metric = 'sum'
  }

  return {
    action: 'aggregate',
    aggregation
  }
}

/**
 * Apply filters
 */
function applyFilters(
  entities: SpatialEntity[],
  filters: QueryIntent['filters']
): SpatialEntity[] {
  return entities.filter((entity) => {
    if (filters!.status && !filters!.status.includes(entity.status)) return false
    if (filters!.type && !filters!.type.includes(entity.type)) return false
    return true
  })
}

/**
 * Apply search
 */
function applySearch(
  entities: SpatialEntity[],
  search: QueryIntent['search']
): SpatialEntity[] {
  let filtered = entities

  // Filter by location (road name)
  if (search!.location) {
    const locationLower = search!.location.toLowerCase()
    filtered = filtered.filter((entity) => {
      const roadName = entity.properties.roadName?.toLowerCase() || ''
      return roadName.includes(locationLower)
    })
  }

  // TODO: Radius search when center point is specified
  // For now, just return filtered by location

  return filtered
}

/**
 * Perform analysis
 */
function performAnalysis(
  entities: SpatialEntity[],
  analysis: QueryIntent['analysis']
): {
  entities: SpatialEntity[]
  summary: string
  visualHint: QueryResult['visualHint']
} {
  switch (analysis!.type) {
    case 'buffer':
      return {
        entities,
        summary: `Created ${analysis!.params?.radius}km buffer zones around ${entities.length} entities`,
        visualHint: {
          type: 'buffer',
          data: { radius: analysis!.params?.radius || 5 }
        }
      }

    case 'heatmap':
      return {
        entities,
        summary: `Generated density heatmap for ${entities.length} entities`,
        visualHint: { type: 'heatmap' }
      }

    default:
      return {
        entities,
        summary: 'Analysis completed',
        visualHint: { type: 'highlight' }
      }
  }
}

/**
 * Perform aggregation
 */
function performAggregation(
  entities: SpatialEntity[],
  aggregation: QueryIntent['aggregation']
): {
  summary: string
} {
  switch (aggregation!.metric) {
    case 'count':
      return {
        summary: `Found ${entities.length} vehicles`
      }

    case 'average':
      if (aggregation!.field === 'speed') {
        const speeds = entities
          .map((e) => e.motion?.speed || 0)
          .filter((s) => s > 0)
        const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
        return {
          summary: `Average speed: ${avg.toFixed(1)} mph across ${speeds.length} moving vehicles`
        }
      }
      return { summary: 'Average calculated' }

    default:
      return { summary: 'Aggregation completed' }
  }
}

/**
 * Generate filter summary
 */
function generateFilterSummary(
  filters: QueryIntent['filters'],
  count: number
): string {
  // Check if filters are empty (show all case)
  const hasFilters = filters && (filters.status || filters.type || filters.properties)

  if (!hasFilters) {
    return `Showing all ${count} vehicles`
  }

  const parts: string[] = []

  if (filters!.status) {
    parts.push(`status: ${filters!.status.join(', ')}`)
  }
  if (filters!.type) {
    parts.push(`type: ${filters!.type.join(', ')}`)
  }

  return `Found ${count} entities${parts.length > 0 ? ` with ${parts.join(' and ')}` : ''}`
}

/**
 * Generate search summary
 */
function generateSearchSummary(
  search: QueryIntent['search'],
  count: number
): string {
  const parts: string[] = []

  if (search!.location) {
    parts.push(`on ${search!.location}`)
  }
  if (search!.radius) {
    parts.push(`within ${search!.radius}km`)
  }

  return `Found ${count} vehicles${parts.length > 0 ? ` ${parts.join(' ')}` : ''}`
}
