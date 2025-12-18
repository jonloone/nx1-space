/**
 * Response Router Service
 *
 * Determines where chat responses should be displayed:
 * - Inline in chat (NL responses, small tables <=5 rows)
 * - Document panel (entity details, analysis reports, 6-15 rows)
 * - Bottom panel (large tables >15 rows)
 */

import type { ResponseDisplayMode, DocumentPanelMode } from '@/lib/stores/panelStore'
import type { ChatQueryResponse, QueryResult } from './chatQueryService'

// Thresholds for routing decisions
export const ROUTING_THRESHOLDS = {
  inlineMaxRows: 5,          // <=5 rows: inline in chat
  documentPanelMaxRows: 15,  // 6-15 rows: document panel
  bottomPanelMinRows: 16     // >15 rows: bottom panel
}

// Entity types that trigger document panel
export type EntityType = 'vessel' | 'port' | 'route' | 'anomaly' | 'satellite' | 'ground-station' | 'generic'

// Analysis report types
export type AnalysisReportType = 'intelligence' | 'risk' | 'route-analysis' | 'area-analysis' | 'multi-int'

// Extended response interface with routing hints
export interface RoutedChatResponse extends ChatQueryResponse {
  displayMode: ResponseDisplayMode
  documentPanelMode?: DocumentPanelMode
  entityType?: EntityType
  isAnalysisReport?: boolean
  analysisReportType?: AnalysisReportType
}

/**
 * Determine where a chat response should be displayed
 */
export function determineDisplayMode(response: ChatQueryResponse): ResponseDisplayMode {
  // No results or NL-only response -> inline
  if (!response.results || !response.results.data || response.results.data.length === 0) {
    return 'inline'
  }

  const rowCount = response.results.data.length

  // Check if this is an entity detail request
  if (isEntityDetailResponse(response)) {
    return 'document-panel'
  }

  // Check if this is an analysis report
  if (isAnalysisReport(response)) {
    return 'document-panel'
  }

  // Route based on row count
  if (rowCount <= ROUTING_THRESHOLDS.inlineMaxRows) {
    return 'inline'
  }

  if (rowCount <= ROUTING_THRESHOLDS.documentPanelMaxRows) {
    return 'document-panel'
  }

  // Large result sets -> bottom panel
  return 'bottom-panel'
}

/**
 * Determine the document panel mode for a response
 */
export function determineDocumentPanelMode(response: ChatQueryResponse): DocumentPanelMode {
  if (isEntityDetailResponse(response)) {
    return 'entity-details'
  }

  if (isAnalysisReport(response)) {
    return 'analysis-report'
  }

  // Default to compact table for medium-sized results
  const rowCount = response.results?.data?.length ?? 0
  if (rowCount > ROUTING_THRESHOLDS.inlineMaxRows && rowCount <= ROUTING_THRESHOLDS.documentPanelMaxRows) {
    return 'compact-table'
  }

  return null
}

/**
 * Detect entity type from response
 */
export function detectEntityType(response: ChatQueryResponse): EntityType | undefined {
  const query = response.naturalLanguageResponse?.toLowerCase() || ''
  const domain = response.domain

  // Check for specific entity patterns
  if (domain === 'maritime') {
    if (query.includes('vessel') || query.includes('ship')) return 'vessel'
    if (query.includes('port') || query.includes('seaport')) return 'port'
    if (query.includes('route')) return 'route'
    if (query.includes('anomal')) return 'anomaly'
  }

  if (domain === 'space') {
    if (query.includes('satellite')) return 'satellite'
    if (query.includes('ground station')) return 'ground-station'
  }

  // Check data columns for entity clues
  const columns = response.results?.columns?.map(c => c.toLowerCase()) || []

  if (columns.includes('mmsi') || columns.includes('vessel_name') || columns.includes('imo')) {
    return 'vessel'
  }
  if (columns.includes('port_type') || columns.includes('cargo_teu')) {
    return 'port'
  }
  if (columns.includes('norad_id') || columns.includes('orbit_type')) {
    return 'satellite'
  }
  if (columns.includes('anomaly_type') || columns.includes('severity')) {
    return 'anomaly'
  }

  return 'generic'
}

/**
 * Detect analysis report type
 */
export function detectAnalysisReportType(response: ChatQueryResponse): AnalysisReportType | undefined {
  const insights = response.agentInsights || []
  const nlResponse = response.naturalLanguageResponse?.toLowerCase() || ''

  // Check for multi-agent insights
  if (insights.length > 1) {
    return 'multi-int'
  }

  // Check response content for report type
  if (nlResponse.includes('risk') || nlResponse.includes('assessment')) {
    return 'risk'
  }
  if (nlResponse.includes('route analysis') || nlResponse.includes('path')) {
    return 'route-analysis'
  }
  if (nlResponse.includes('area') || nlResponse.includes('region')) {
    return 'area-analysis'
  }

  return 'intelligence'
}

/**
 * Check if response is an entity detail (single entity focus)
 */
export function isEntityDetailResponse(response: ChatQueryResponse): boolean {
  const rowCount = response.results?.data?.length ?? 0

  // Single result is typically an entity detail
  if (rowCount === 1) {
    return true
  }

  // Check if the query suggests entity lookup
  const nlResponse = response.naturalLanguageResponse?.toLowerCase() || ''
  const entityKeywords = [
    'details about', 'information on', 'tell me about',
    'what is', 'who is', 'where is', 'show me'
  ]

  return entityKeywords.some(kw => nlResponse.includes(kw)) && rowCount <= 3
}

/**
 * Check if response is an analysis report
 */
export function isAnalysisReport(response: ChatQueryResponse): boolean {
  // Has agent insights from CrewAI
  if (response.agentInsights && response.agentInsights.length > 0) {
    return true
  }

  // Check for analysis keywords
  const nlResponse = response.naturalLanguageResponse?.toLowerCase() || ''
  const analysisKeywords = [
    'analysis', 'assessment', 'investigation', 'intelligence',
    'comprehensive', 'deep dive', 'findings', 'recommendations',
    'risk', 'threat', 'pattern'
  ]

  return analysisKeywords.some(kw => nlResponse.includes(kw))
}

/**
 * Route a chat response with full metadata
 */
export function routeResponse(response: ChatQueryResponse): RoutedChatResponse {
  const displayMode = determineDisplayMode(response)
  const documentPanelMode = displayMode === 'document-panel'
    ? determineDocumentPanelMode(response)
    : undefined

  return {
    ...response,
    displayMode,
    documentPanelMode,
    entityType: detectEntityType(response),
    isAnalysisReport: isAnalysisReport(response),
    analysisReportType: isAnalysisReport(response)
      ? detectAnalysisReportType(response)
      : undefined
  }
}

/**
 * Get display mode label for UI
 */
export function getDisplayModeLabel(mode: ResponseDisplayMode): string {
  switch (mode) {
    case 'inline':
      return 'Chat'
    case 'document-panel':
      return 'Document Panel'
    case 'bottom-panel':
      return 'Data Table'
    default:
      return 'Unknown'
  }
}

// Singleton service
class ResponseRouterService {
  route(response: ChatQueryResponse): RoutedChatResponse {
    return routeResponse(response)
  }

  getDisplayMode(response: ChatQueryResponse): ResponseDisplayMode {
    return determineDisplayMode(response)
  }

  getDocumentPanelMode(response: ChatQueryResponse): DocumentPanelMode {
    return determineDocumentPanelMode(response)
  }
}

let instance: ResponseRouterService | null = null

export function getResponseRouterService(): ResponseRouterService {
  if (!instance) {
    instance = new ResponseRouterService()
  }
  return instance
}

export { ResponseRouterService }
