/**
 * Analysis Mode Handler
 * Routes queries to appropriate handlers based on selected analysis mode
 * Eliminates pattern matching conflicts by using explicit mode selection
 */

import { AnalysisMode } from '@/lib/config/analysisModes'

export interface ModeHandlerResult {
  success: boolean
  message?: string
  toolCall?: {
    tool: string
    params: any
    pendingMessage?: string
  }
  error?: string
}

/**
 * Parse routing queries in routing mode
 * Supports multiple patterns: "from X to Y", "between X and Y", "route X to Y"
 */
export function parseRoutingQuery(query: string): ModeHandlerResult {
  const lowerQuery = query.toLowerCase()

  // Check if this looks like a routing query
  const isRoutingQuery = lowerQuery.includes('route') ||
                         lowerQuery.includes('from') ||
                         lowerQuery.includes('between')

  if (!isRoutingQuery) {
    return {
      success: false,
      error: 'Query does not appear to be a routing request. Try: "Show route from X to Y"'
    }
  }

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

  // Pattern 3: "route X to Y" (without from)
  if (!fromLocation) {
    const routeMatch = query.match(/route\s+([\w\s,.-]+?)\s+to\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    if (routeMatch) {
      fromLocation = routeMatch[1].trim()
      toLocation = routeMatch[2].trim()
    }
  }

  // Pattern 4: "from X and Y" (and instead of to)
  // Check this AFTER "between X and Y" to avoid conflicts
  if (!fromLocation) {
    const fromAndMatch = query.match(/from\s+([\w\s,.-]+?)\s+and\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i)
    if (fromAndMatch) {
      fromLocation = fromAndMatch[1].trim()
      toLocation = fromAndMatch[2].trim()
    }
  }

  if (!fromLocation || !toLocation) {
    return {
      success: false,
      error: 'Could not parse locations. Please specify both origin and destination.'
    }
  }

  // Detect travel mode
  let mode = 'driving'
  if (lowerQuery.includes('walk')) mode = 'walking'
  else if (lowerQuery.includes('cycl') || lowerQuery.includes('bike')) mode = 'cycling'

  return {
    success: true,
    toolCall: {
      tool: 'analyzeRoute',
      params: {
        fromLocation,
        toLocation,
        mode
      },
      pendingMessage: `Analyzing route from ${fromLocation} to ${toLocation}...`
    }
  }
}

/**
 * Parse investigation queries in investigation mode
 * Always uses investigation command handler
 */
export function parseInvestigationQuery(query: string): ModeHandlerResult {
  // In investigation mode, all queries go to investigation handler
  // This is handled by the investigation command handler
  return {
    success: true,
    message: 'Query will be processed by investigation handler'
  }
}

/**
 * Parse imagery analysis queries in imagery mode
 */
export function parseImageryQuery(query: string): ModeHandlerResult {
  const lowerQuery = query.toLowerCase()

  // Extract location
  const locationPatterns = [
    /imagery\s+(?:for|of|at)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /analyze\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /satellite\s+(?:for|of|at)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i
  ]

  let location: string | undefined
  for (const pattern of locationPatterns) {
    const match = query.match(pattern)
    if (match) {
      location = match[1].trim()
      break
    }
  }

  if (!location) {
    return {
      success: false,
      error: 'Could not identify location. Try: "Analyze satellite imagery for Manhattan"'
    }
  }

  // Check for change detection
  const includeChangeDetection = lowerQuery.includes('change') || lowerQuery.includes('compare')
  const includeActivity = lowerQuery.includes('activity') || lowerQuery.includes('monitor')

  return {
    success: true,
    toolCall: {
      tool: 'analyzeImagery',
      params: {
        location,
        includeChangeDetection,
        includeActivity
      },
      pendingMessage: `Analyzing satellite imagery for ${location}...`
    }
  }
}

/**
 * Parse multi-INT analysis queries
 */
export function parseMultiIntQuery(query: string): ModeHandlerResult {
  const lowerQuery = query.toLowerCase()

  // Extract location
  const locationPatterns = [
    /(?:for|of|at)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /analyze\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /intelligence\s+(?:for|on)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i
  ]

  let location: string | undefined
  for (const pattern of locationPatterns) {
    const match = query.match(pattern)
    if (match) {
      location = match[1].trim()
      break
    }
  }

  if (!location) {
    return {
      success: false,
      error: 'Could not identify location. Try: "Multi-INT analysis for Brooklyn"'
    }
  }

  return {
    success: true,
    toolCall: {
      tool: 'analyzeMultiLayer',
      params: {
        location,
        analysisTypes: ['all']
      },
      pendingMessage: `Performing multi-layer intelligence analysis for ${location}...`
    }
  }
}

/**
 * Parse OSINT research queries
 */
export function parseOSINTQuery(query: string): ModeHandlerResult {
  const lowerQuery = query.toLowerCase()

  // Extract location or entity
  const locationPatterns = [
    /(?:for|about|on)\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /research\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i,
    /find\s+([\w\s,.-]+?)(?:\s|$|[.?!])/i
  ]

  let location: string | undefined
  for (const pattern of locationPatterns) {
    const match = query.match(pattern)
    if (match) {
      location = match[1].trim()
      break
    }
  }

  if (!location) {
    return {
      success: false,
      error: 'Could not identify target. Try: "Research businesses in Manhattan"'
    }
  }

  return {
    success: true,
    toolCall: {
      tool: 'osintResearch',
      params: {
        location,
        query: query
      },
      pendingMessage: `Conducting OSINT research on ${location}...`
    }
  }
}

/**
 * Main analysis mode handler
 * Routes queries to appropriate handler based on selected mode
 */
export class AnalysisModeHandler {
  /**
   * Process query in the context of the selected analysis mode
   */
  static processQuery(query: string, mode: AnalysisMode): ModeHandlerResult {
    console.log(`[AnalysisModeHandler] Processing query in ${mode.id} mode:`, query)

    switch (mode.handler) {
      case 'routing':
        return parseRoutingQuery(query)

      case 'investigation':
        return parseInvestigationQuery(query)

      case 'imagery':
        return parseImageryQuery(query)

      case 'multi-int':
        return parseMultiIntQuery(query)

      case 'osint':
        return parseOSINTQuery(query)

      case 'general':
        // General mode uses LLM for tool selection
        return {
          success: true,
          message: 'Query will be processed by LLM with tool calling'
        }

      default:
        return {
          success: false,
          error: `Unknown mode handler: ${mode.handler}`
        }
    }
  }

  /**
   * Check if a query is valid for the selected mode
   */
  static validateQueryForMode(query: string, mode: AnalysisMode): boolean {
    const result = this.processQuery(query, mode)
    return result.success
  }

  /**
   * Get suggestions for a mode
   */
  static getSuggestionsForMode(mode: AnalysisMode): string[] {
    return mode.examples || []
  }
}

/**
 * Singleton instance
 */
export function getAnalysisModeHandler(): typeof AnalysisModeHandler {
  return AnalysisModeHandler
}
