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
import type { InvestigationDemoData, LocationStop } from '../demo/investigation-demo-data'
import type { InvestigationSubject } from '../demo/investigation-demo-data'

export interface AgentAction {
  type: 'flyTo' | 'highlight' | 'playSegment' | 'showSummary' | 'none'
  params?: {
    location?: { lat: number; lng: number; zoom?: number }
    locationId?: string
    startTime?: Date
    endTime?: Date
    phase?: string
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
  private context: {
    subject?: InvestigationSubject
    locations?: LocationStop[]
    timeline?: { start: Date; end: Date }
    scenario?: any
  } = {}

  constructor(llm: VultrLLMService) {
    this.llm = llm
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
      "type": "flyTo" | "highlight" | "playSegment" | "showSummary" | "none",
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
