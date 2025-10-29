/**
 * Vultr LLM Inference Service
 * Provides AI-powered natural language search and analysis capabilities
 */

export interface VultrLLMConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class VultrLLMService {
  private apiKey: string
  private baseURL: string
  private model: string

  constructor(config: VultrLLMConfig) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || 'https://api.vultrinference.com/v1' // Fixed: was 'vultrinfer', correct is 'vultrinference'
    this.model = config.model || 'qwen2.5-32b-instruct' // Updated Vultr model (2025)
  }

  /**
   * Send a chat completion request to Vultr LLM
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        stream: request.stream ?? false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vultr LLM API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Search for ground stations using natural language
   */
  async searchGroundStations(query: string, stations: any[]): Promise<any[]> {
    const systemPrompt = `You are a ground station search assistant. Given a natural language query about ground stations, analyze the query and return relevant station IDs or filters.

Available stations data includes:
- Station names, locations, countries
- Operators (SES, AWS, Telesat, SpaceX, KSAT, etc.)
- Utilization percentages
- Revenue and margin data
- Geographic coordinates

Return your response as a JSON object with:
{
  "stations": [array of matching station names or IDs],
  "filters": {
    "operator": "operator name if specified",
    "country": "country if specified",
    "minUtilization": number if specified,
    "maxUtilization": number if specified
  },
  "reasoning": "brief explanation of your search criteria"
}`

    const userPrompt = `Search query: "${query}"

Available stations (first 10 as examples):
${JSON.stringify(stations.slice(0, 10), null, 2)}

Please analyze this query and return matching stations or search criteria.`

    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more focused responses
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content || '{}'

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to parse LLM response:', error)
      return {
        stations: [],
        filters: {},
        reasoning: 'Failed to parse search results',
        rawResponse: content
      }
    }
  }

  /**
   * Analyze a station and provide insights
   */
  async analyzeStation(station: any): Promise<string> {
    const systemPrompt = `You are a satellite communications analyst. Provide concise, actionable insights about ground stations based on their metrics.`

    const userPrompt = `Analyze this ground station:

Name: ${station.name}
Operator: ${station.operator}
Location: ${station.country || station.location}
Utilization: ${station.utilization}%
Revenue: $${station.revenue}M
Margin: ${station.margin}%

Provide a brief 2-3 sentence analysis focusing on:
1. Performance assessment
2. Potential opportunities or concerns
3. Competitive positioning`

    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return response.choices[0]?.message?.content || 'Unable to analyze station'
  }

  /**
   * Generate natural language explanation for map interaction
   */
  async explainMapFeature(feature: any, context: string): Promise<string> {
    const systemPrompt = `You are a geospatial intelligence assistant. Explain map features and geographic data in clear, concise language.`

    const userPrompt = `Context: ${context}

Feature data:
${JSON.stringify(feature, null, 2)}

Provide a brief, natural explanation of this feature and what it represents.`

    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || 'Unable to explain feature'
  }
}

// Create singleton instance
let vultrLLMInstance: VultrLLMService | null = null

export function getVultrLLMService(): VultrLLMService {
  if (!vultrLLMInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    vultrLLMInstance = new VultrLLMService({ apiKey })
  }

  return vultrLLMInstance
}
