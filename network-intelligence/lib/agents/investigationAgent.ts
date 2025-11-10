/**
 * Investigation Intelligence Agent
 *
 * AI agent that interprets natural language queries about investigations
 * and triggers appropriate map actions and responses.
 *
 * Capabilities:
 * - Natural language understanding
 * - Context-aware responses
 * - Map action triggers (flyTo, highlight, playSegment)
 * - Intelligence analysis
 * - Pattern recognition
 */

import { VultrLLMService } from '../services/vultrLLMService'
import { crewaiService, type CrewAIResponse } from '../services/crewaiService'
import type { InvestigationDemoData, LocationStop } from '../demo/investigation-demo-data'
import type { InvestigationSubject } from '../demo/investigation-demo-data'

export interface AgentAction {
  type: 'flyTo' | 'highlight' | 'playSegment' | 'showSummary' | 'generateReport' | 'none'
  params?: {
    location?: { lat: number; lng: number; zoom?: number }
    locationId?: string
    startTime?: Date
    endTime?: Date
    phase?: string
    reportType?: 'full' | 'multi-int' | 'summary'
  }
}

export interface AgentResponse {
  message: string
  actions: AgentAction[]
  insights?: string[]
  relatedLocations?: LocationStop[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: AgentAction[]
}

export class InvestigationAgent {
  private llm: VultrLLMService
  private useCrewAI: boolean = true // Enable CrewAI for enhanced intelligence
  private context: {
    subject?: InvestigationSubject
    locations?: LocationStop[]
    timeline?: { start: Date; end: Date }
    scenario?: any
  } = {}

  constructor(llm: VultrLLMService, options?: { useCrewAI?: boolean }) {
    this.llm = llm
    this.useCrewAI = options?.useCrewAI !== undefined ? options.useCrewAI : true
  }

  /**
   * Initialize agent with investigation context
   */
  setContext(context: {
    subject?: InvestigationSubject
    locations?: LocationStop[]
    timeline?: { start: Date; end: Date }
    scenario?: any
  }) {
    this.context = context
    console.log('🤖 Investigation Agent context updated')
  }

  /**
   * Process user query and generate response with actions
   */
  async processQuery(query: string, conversationHistory: ChatMessage[] = []): Promise<AgentResponse> {
    console.log('🔍 Processing query:', query)

    // Check if this is a route analysis query and CrewAI is enabled
    if (this.useCrewAI && this.isRouteQuery(query)) {
      console.log('🚀 Delegating to CrewAI for route intelligence analysis')
      try {
        return await this.processWithCrewAI(query)
      } catch (error) {
        console.error('❌ CrewAI failed, falling back to standard LLM:', error)
        // Fall through to standard processing
      }
    }

    // Build context for LLM
    const systemPrompt = this.buildSystemPrompt()
    const userPrompt = this.buildUserPrompt(query, conversationHistory)

    try {
      // Get LLM response
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-5).map(msg => ({ // Last 5 messages for context
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      const content = response.choices[0]?.message?.content || ''

      // Parse response and extract actions
      const parsed = this.parseResponse(content)

      console.log('✅ Agent response:', parsed.message.substring(0, 100) + '...')
      console.log('🎬 Actions:', parsed.actions.length)

      return parsed
    } catch (error) {
      console.error('❌ Agent query failed:', error)
      return {
        message: 'I apologize, but I encountered an error processing your query. Please try again or rephrase your question.',
        actions: []
      }
    }
  }

  /**
   * Check if query is a route analysis query
   */
  private isRouteQuery(query: string): boolean {
    const queryLower = query.toLowerCase()
    const routeKeywords = [
      'route', 'path', 'navigate', 'from', 'to',
      'drive', 'walk', 'travel', 'journey', 'waypoint',
      'analyze route', 'plan route', 'assess route'
    ]

    return routeKeywords.some(keyword => queryLower.includes(keyword))
  }

  /**
   * Process route query with CrewAI multi-agent system
   */
  private async processWithCrewAI(query: string): Promise<AgentResponse> {
    try {
      // Build context for CrewAI
      const mapContext = {
        subject_id: this.context.subject?.subjectId,
        case_number: this.context.subject?.caseNumber,
        locations: this.context.locations?.map(loc => ({
          name: loc.name,
          lat: loc.latitude,
          lng: loc.longitude,
          type: loc.type
        }))
      }

      // Execute CrewAI workflow
      const crewResponse: CrewAIResponse = await crewaiService.autoExecute(
        query,
        mapContext
      )

      if (!crewResponse.success) {
        throw new Error(crewResponse.error || 'CrewAI execution failed')
      }

      // Convert CrewAI response to AgentResponse format
      const actions: AgentAction[] = crewResponse.actions.map(action => ({
        type: action.type as any,
        params: action
      }))

      // Extract insights from the intelligence report
      const insights = this.extractInsights(crewResponse.output)

      return {
        message: crewResponse.output,
        actions,
        insights
      }
    } catch (error) {
      console.error('❌ CrewAI processing error:', error)
      throw error
    }
  }

  /**
   * Extract key insights from CrewAI intelligence report
   */
  private extractInsights(report: string): string[] {
    const insights: string[] = []

    // Extract recommendations
    const recommendationsMatch = report.match(/### RECOMMENDATIONS\n([\s\S]*?)(?=\n###|$)/i)
    if (recommendationsMatch) {
      const recommendations = recommendationsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())
      insights.push(...recommendations)
    }

    // Extract key findings from executive summary
    const summaryMatch = report.match(/### EXECUTIVE SUMMARY\n([\s\S]*?)(?=\n###|$)/i)
    if (summaryMatch) {
      insights.push(summaryMatch[1].trim())
    }

    return insights.slice(0, 5) // Return top 5 insights
  }

  /**
   * Build system prompt with investigation context
   */
  private buildSystemPrompt(): string {
    const subject = this.context.subject
    const locations = this.context.locations || []
    const scenario = this.context.scenario

    return `You are an Investigation Intelligence Assistant analyzing subject ${subject?.subjectId || 'Unknown'} in case ${subject?.caseNumber || 'Unknown'}.

INVESTIGATION OVERVIEW:
- Subject: ${subject?.classification || 'Person of Interest'}
- Case: ${scenario?.title || 'Investigation'}
- Timeline: ${subject?.startDate ? new Date(subject.startDate).toLocaleDateString() : 'Unknown'} to ${subject?.endDate ? new Date(subject.endDate).toLocaleDateString() : 'Unknown'}
- Total Locations: ${locations.length}

KEY LOCATIONS:
${locations.slice(0, 10).map(loc =>
  `- ${loc.name} (${loc.type}, ${loc.significance === 'anomaly' ? '🚨 ANOMALY' : loc.significance === 'suspicious' ? '⚠️ SUSPICIOUS' : 'routine'})`
).join('\n')}

${scenario?.narrative ? `\nINVESTIGATION NARRATIVE:\n${scenario.narrative}\n` : ''}

${scenario?.keyFindings ? `\nKEY FINDINGS:\n${scenario.keyFindings.slice(0, 5).join('\n')}\n` : ''}

YOUR ROLE:
- Answer questions about the subject's movements, patterns, and activities
- Identify suspicious behavior and anomalies
- Provide intelligence analysis and insights
- Trigger map actions to visualize locations and routes

RESPONSE FORMAT:
Always respond in JSON format with this structure:
{
  "message": "Your conversational response to the user",
  "actions": [
    {
      "type": "flyTo" | "highlight" | "playSegment" | "showSummary" | "generateReport" | "none",
      "params": { ... }
    }
  ],
  "insights": ["Insight 1", "Insight 2"],
  "relatedLocations": [location IDs]
}

ACTION TYPES:
- flyTo: Zoom map to location { location: { lat, lng, zoom: 16 } }
- highlight: Pulse effect on location { locationId: "stop-X" }
- playSegment: Animate route { startTime: ISO8601, endTime: ISO8601 }
- showSummary: Display summary panel { phase: "day-1" | "day-2" | "day-3" }
- generateReport: Generate Multi-INT intelligence report with SIGINT, OSINT, GEOINT, Temporal analysis { reportType: "multi-int" }

IMPORTANT:
- Be concise but thorough
- Focus on intelligence value, not just facts
- Suggest relevant follow-up actions
- Use precise timestamps when referencing events
- Flag anomalies and patterns
- Recommend investigative actions`
  }

  /**
   * Build user prompt with query context
   */
  private buildUserPrompt(query: string, history: ChatMessage[]): string {
    return `User Query: "${query}"

${history.length > 0 ? `Recent Conversation:\n${history.slice(-3).map(msg => `${msg.role}: ${msg.content.substring(0, 200)}`).join('\n')}\n` : ''}

Please analyze this query and provide:
1. A clear, conversational answer
2. Appropriate map actions to visualize the answer
3. Intelligence insights related to the query
4. Related locations for further investigation

Respond ONLY with valid JSON matching the format specified in the system prompt.`
  }

  /**
   * Parse LLM response and extract message + actions
   */
  private parseResponse(content: string): AgentResponse {
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      const parsed = JSON.parse(jsonStr)

      return {
        message: parsed.message || content,
        actions: parsed.actions || [],
        insights: parsed.insights || [],
        relatedLocations: parsed.relatedLocations || []
      }
    } catch (error) {
      // Fallback: return raw message without actions
      console.warn('Failed to parse agent response as JSON, using fallback')
      return {
        message: content,
        actions: []
      }
    }
  }

  /**
   * Get suggested questions based on current context
   */
  getSuggestedQuestions(): string[] {
    const locations = this.context.locations || []
    const suspiciousCount = locations.filter(l => l.significance === 'suspicious' || l.significance === 'anomaly').length

    const suggestions = [
      'What happened after midnight?',
      'Show me all suspicious locations',
      'Where did the subject go on Day 2?',
      'What are the anomalies in this investigation?'
    ]

    if (suspiciousCount > 0) {
      suggestions.push(`Why are ${suspiciousCount} locations flagged as suspicious?`)
    }

    const lateNightLocations = locations.filter(l => {
      const hour = new Date(l.arrivalTime).getHours()
      return hour >= 23 || hour < 5
    })

    if (lateNightLocations.length > 0) {
      suggestions.push('Show me late-night activity')
    }

    return suggestions
  }

  /**
   * Generate summary for a specific phase
   */
  async generatePhaseSummary(phase: 'day-1' | 'day-2' | 'day-3'): Promise<string> {
    const locations = this.context.locations || []
    const scenario = this.context.scenario

    const dayNumber = parseInt(phase.split('-')[1])
    const phaseLocations = locations.filter(loc => {
      const locDay = Math.floor((new Date(loc.arrivalTime).getTime() - new Date(this.context.subject!.startDate).getTime()) / (24 * 60 * 60 * 1000)) + 1
      return locDay === dayNumber
    })

    const prompt = `Generate a concise intelligence summary for ${phase.toUpperCase()} of the investigation.

Locations visited (${phaseLocations.length}):
${phaseLocations.map(l => `- ${l.name} (${l.type}, ${new Date(l.arrivalTime).toLocaleTimeString()})`).join('\n')}

${scenario?.narrative ? `Overall context: ${scenario.narrative.substring(0, 500)}` : ''}

Provide a 3-4 sentence summary focusing on:
1. Pattern assessment (routine vs deviation)
2. Significant events or anomalies
3. Intelligence value and investigative leads`

    const response = await this.llm.chat({
      messages: [
        { role: 'system', content: 'You are an intelligence analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    })

    return response.choices[0]?.message?.content || 'Summary unavailable'
  }
}

// Helper: Create agent instance
let agentInstance: InvestigationAgent | null = null

export function getInvestigationAgent(): InvestigationAgent {
  if (!agentInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY not configured')
    }

    const llm = new VultrLLMService({
      apiKey,
      baseURL: 'https://api.vultrinference.com/v1',
      model: 'llama2-13b-chat'
    })

    agentInstance = new InvestigationAgent(llm)
  }

  return agentInstance
}
