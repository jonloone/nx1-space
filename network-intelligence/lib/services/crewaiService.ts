/**
 * CrewAI Service Client
 *
 * Client for interacting with the Python CrewAI multi-agent orchestration API.
 * Provides access to specialized intelligence crews for route analysis,
 * site assessment, and comprehensive investigations.
 */

export interface CrewAIRequest {
  query: string
  context?: {
    map_center?: { lat: number; lng: number }
    map_zoom?: number
    selected_location?: string
    [key: string]: any
  }
  crew_type?: 'route' | 'site' | 'investigation' | 'auto'
  verbose?: boolean
}

export interface TaskResult {
  task_id: string
  agent_name: string
  output: any
  success: boolean
  duration_ms?: number
  tokens_used?: number
}

export interface CrewAIResponse {
  success: boolean
  output: string // Final synthesized intelligence report
  task_results: TaskResult[]
  artifacts: Array<{
    type: string
    title?: string
    data?: any
  }>
  actions: Array<{
    type: string
    [key: string]: any
  }>
  total_duration_ms?: number
  total_tokens?: number
  error?: string
}

export class CrewAIService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl
  }

  /**
   * Check CrewAI service health
   */
  async checkHealth(): Promise<{
    status: string
    version: string
    crews_available: string[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ CrewAI health check failed:', error)
      throw error
    }
  }

  /**
   * Execute a CrewAI workflow
   *
   * @param request - Request with query, context, and crew type
   * @returns Intelligence analysis with artifacts and map actions
   */
  async executeCrew(request: CrewAIRequest): Promise<CrewAIResponse> {
    console.log('🚀 Executing CrewAI workflow:', request.crew_type || 'auto')

    try {
      const response = await fetch(`${this.baseUrl}/api/crew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `CrewAI execution failed: ${response.statusText} - ${
            errorData.error || errorData.detail || 'Unknown error'
          }`
        )
      }

      const result = await response.json()

      console.log('✅ CrewAI workflow completed:', {
        success: result.success,
        artifacts: result.artifacts?.length || 0,
        actions: result.actions?.length || 0,
        duration: result.total_duration_ms,
      })

      return result
    } catch (error) {
      console.error('❌ CrewAI execution error:', error)
      throw error
    }
  }

  /**
   * Execute route intelligence analysis
   *
   * Convenience method for route analysis workflows.
   */
  async analyzeRoute(params: {
    query: string
    from?: string
    to?: string
    mode?: 'driving' | 'walking' | 'cycling'
    context?: any
  }): Promise<CrewAIResponse> {
    const { query, from, to, mode, context } = params

    // Build enhanced context
    const enhancedContext = {
      ...context,
      from_location: from,
      to_location: to,
      transportation_mode: mode || 'driving',
    }

    return this.executeCrew({
      query,
      context: enhancedContext,
      crew_type: 'route',
      verbose: true,
    })
  }

  /**
   * Execute site intelligence assessment
   *
   * Convenience method for site assessment workflows.
   */
  async assessSite(params: {
    query: string
    location: string
    context?: any
  }): Promise<CrewAIResponse> {
    const { query, location, context } = params

    const enhancedContext = {
      ...context,
      target_location: location,
    }

    return this.executeCrew({
      query,
      context: enhancedContext,
      crew_type: 'site',
      verbose: true,
    })
  }

  /**
   * Execute comprehensive investigation
   *
   * Convenience method for full investigation workflows.
   */
  async investigate(params: {
    query: string
    subject?: string
    locations?: string[]
    timeframe?: { start: string; end: string }
    context?: any
  }): Promise<CrewAIResponse> {
    const { query, subject, locations, timeframe, context } = params

    const enhancedContext = {
      ...context,
      investigation_subject: subject,
      locations_of_interest: locations,
      time_period: timeframe,
    }

    return this.executeCrew({
      query,
      context: enhancedContext,
      crew_type: 'investigation',
      verbose: true,
    })
  }

  /**
   * Auto-detect and execute appropriate crew
   *
   * The CrewAI service will automatically determine the best crew
   * based on query content and context.
   */
  async autoExecute(query: string, context?: any): Promise<CrewAIResponse> {
    return this.executeCrew({
      query,
      context,
      crew_type: 'auto',
      verbose: true,
    })
  }
}

// Singleton instance
export const crewaiService = new CrewAIService(
  process.env.CREWAI_API_URL || 'http://localhost:8000'
)
