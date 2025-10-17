/**
 * Vultr LLM Adapter for CopilotKit
 * Integrates Vultr AI Inference with CopilotKit runtime
 */

import { VultrLLMService } from '@/lib/services/vultrLLMService'

export interface CopilotMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CopilotStreamResponse {
  id: string
  choices: Array<{
    delta: {
      content?: string
      role?: string
    }
    finish_reason?: string
  }>
}

export class CopilotVultrAdapter {
  private vultrService: VultrLLMService

  constructor(apiKey: string) {
    this.vultrService = new VultrLLMService({ apiKey })
  }

  /**
   * Process chat messages for CopilotKit
   */
  async processRequest(messages: CopilotMessage[]): Promise<string> {
    try {
      const response = await this.vultrService.chat({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 2000
      })

      return response.choices[0]?.message?.content || 'No response generated'
    } catch (error) {
      console.error('CopilotVultrAdapter error:', error)
      throw new Error('Failed to process chat request')
    }
  }

  /**
   * Stream chat response (for future streaming support)
   */
  async *streamRequest(messages: CopilotMessage[]): AsyncGenerator<string> {
    // For now, return the full response
    // TODO: Implement actual streaming when Vultr supports it
    const content = await this.processRequest(messages)
    yield content
  }

  /**
   * Execute a CopilotKit action
   */
  async executeAction(actionName: string, parameters: any, context: any): Promise<any> {
    // Build a prompt that describes the action
    const actionPrompt = this.buildActionPrompt(actionName, parameters, context)

    const response = await this.vultrService.chat({
      messages: [
        {
          role: 'system',
          content: 'You are a geospatial analysis assistant. Execute the requested action and return structured data.'
        },
        {
          role: 'user',
          content: actionPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more focused responses
      max_tokens: 1500
    })

    const content = response.choices[0]?.message?.content || '{}'

    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      return JSON.parse(jsonStr)
    } catch (error) {
      return { result: content }
    }
  }

  /**
   * Build prompt for action execution
   */
  private buildActionPrompt(actionName: string, parameters: any, context: any): string {
    switch (actionName) {
      case 'toggleLayer':
        return `Toggle the layer "${parameters.layerName}". Current state: ${context.layers}. Return JSON with the new layer state.`

      case 'analyzeStation':
        const stationData = parameters.station || context.station
        return `Analyze this ground station comprehensively:

Station: ${stationData.name}
Operator: ${stationData.operator}
Location: ${stationData.location || stationData.country}
Utilization: ${stationData.utilization}%
Revenue: $${stationData.revenue}M
Margin: ${stationData.margin}%
Status: ${stationData.status}

Provide detailed analysis in JSON format:
{
  "summary": "Brief overview in 2-3 sentences",
  "performance": {
    "score": 0-100,
    "strengths": ["list key strengths"],
    "weaknesses": ["list areas for improvement"]
  },
  "opportunities": {
    "shortTerm": ["list immediate opportunities"],
    "longTerm": ["list strategic opportunities"],
    "estimatedRevenue": "revenue potential"
  },
  "risks": {
    "level": "low/medium/high",
    "factors": ["list risk factors"],
    "mitigationStrategies": ["list strategies"]
  },
  "recommendations": {
    "priority": ["list top 3 recommendations"],
    "timeline": "suggested implementation timeline"
  },
  "competitivePosition": "analysis vs competitors"
}`

      case 'findOpportunities':
        return `Analyze the ground station network for business opportunities.

Context:
- Total Stations: ${context.stations?.length || 0}
- Region: ${parameters.region || 'Global'}
- Focus Operator: ${parameters.operator || 'All operators'}

Identify opportunities in JSON format:
{
  "opportunities": [
    {
      "title": "opportunity name",
      "location": "where",
      "type": "expansion/optimization/partnership",
      "score": 0-100,
      "reasoning": "why this is an opportunity",
      "revenuePotential": "$XM annually",
      "investmentRequired": "$XM",
      "timeframe": "months to realize",
      "riskLevel": "low/medium/high"
    }
  ],
  "topPriority": "which opportunity to pursue first",
  "marketTrends": ["list relevant trends"]
}`

      case 'compareStations':
        return `Compare these ground stations:

Stations: ${parameters.stationIds?.join(', ') || 'Selected stations'}
Data: ${JSON.stringify(context.stations)}

Provide comparison in JSON format:
{
  "summary": "key takeaways from comparison",
  "metrics": {
    "utilization": {"leader": "station name", "average": 0, "details": {}},
    "revenue": {"leader": "station name", "total": 0, "details": {}},
    "efficiency": {"leader": "station name", "score": 0, "details": {}}
  },
  "strengths": {
    "stationName": ["list strengths"]
  },
  "weaknesses": {
    "stationName": ["list weaknesses"]
  },
  "recommendations": ["strategic recommendations based on comparison"],
  "bestPractices": ["what can be learned and replicated"]
}`

      case 'summarizeData':
        return `Provide intelligent summary of the current data selection.

Data: ${JSON.stringify(context.data || context.stations || context)}

Generate summary in JSON format:
{
  "overview": "brief overview",
  "keyMetrics": {
    "totalStations": 0,
    "averageUtilization": 0,
    "totalRevenue": 0,
    "topPerformer": "station name"
  },
  "insights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "trends": ["identified trends"],
  "recommendations": ["actionable recommendations"],
  "alerts": ["anything requiring immediate attention"]
}`

      case 'predictTrends':
        return `Analyze historical data and predict future trends.

Historical Data: ${JSON.stringify(context.history || context.utilizationHistory)}
Current Metrics: ${JSON.stringify(context.currentMetrics)}

Provide predictions in JSON format:
{
  "predictions": {
    "nextMonth": {
      "utilization": 0,
      "revenue": 0,
      "confidence": "low/medium/high"
    },
    "nextQuarter": {
      "utilization": 0,
      "revenue": 0,
      "confidence": "low/medium/high"
    }
  },
  "factors": ["key factors influencing predictions"],
  "scenarios": {
    "best": "best case scenario",
    "likely": "most likely scenario",
    "worst": "worst case scenario"
  },
  "recommendations": ["actions to optimize outcomes"]
}`

      case 'generateInsights':
        return `Generate automated insights from the data.

Dataset: ${JSON.stringify(context.data || context.stations)}
View Context: ${JSON.stringify(context.viewContext)}

Generate insights in JSON format:
{
  "insights": [
    {
      "type": "opportunity/risk/trend/anomaly",
      "title": "insight title",
      "description": "detailed description",
      "impact": "low/medium/high",
      "actionable": true/false,
      "suggestedAction": "what to do"
    }
  ],
  "priority": "which insights to focus on first"
}`

      // === MAP ACTIONS ===

      case 'searchPlaces':
        return `Search for places on the map.

Query: ${parameters.query || 'general search'}
Location: ${parameters.location || 'current viewport'}
Categories: ${parameters.categories?.join(', ') || 'all'}
Radius: ${parameters.radius || 5000}m

Execute the search and provide results in JSON format:
{
  "success": true/false,
  "placesFound": 0,
  "summary": "brief description of what was found",
  "topResults": [
    {
      "name": "place name",
      "category": "category",
      "distance": "distance from location"
    }
  ]
}`

      case 'flyToLocation':
        return `Navigate the map to a specific location.

Location: ${parameters.location}
Zoom Level: ${parameters.zoom || 'auto'}

Execute navigation and confirm in JSON format:
{
  "success": true/false,
  "locationName": "resolved location name",
  "coordinates": [longitude, latitude],
  "zoom": zoomLevel,
  "message": "confirmation message"
}`

      case 'showNearby':
        return `Show places near the current map location.

Categories: ${parameters.categories?.join(', ') || 'all'}
Radius: ${parameters.radius || 5000}m
Current Viewport: ${JSON.stringify(context.viewport)}

Search and provide results in JSON format:
{
  "success": true/false,
  "placesFound": 0,
  "summary": "what was found in the area",
  "categories": {
    "category_name": count
  }
}`

      case 'analyzeArea':
        return `Analyze the area around a specific location.

Location: ${parameters.location}
Radius: ${parameters.radius || 10000}m

Provide comprehensive area analysis in JSON format:
{
  "location": "location name",
  "summary": "overview of the area",
  "maritimeFacilities": count,
  "logisticsFacilities": count,
  "defenseCriticalInfrastructure": count,
  "totalPlaces": count,
  "insights": [
    "key insight 1",
    "key insight 2",
    "key insight 3"
  ],
  "recommendations": ["suggested actions or observations"]
}`

      default:
        return `Execute action "${actionName}" with parameters: ${JSON.stringify(parameters)}. Context: ${JSON.stringify(context)}`
    }
  }

  /**
   * Get system message for CopilotKit
   */
  getSystemMessage(): string {
    return `You are an expert geospatial intelligence analyst with interactive map control capabilities.

AVAILABLE DATA:
- GERS Demo Places: Maritime (ports, fuel docks, customs), Logistics (warehouses, truck stops, delivery stops), Defense (hospitals, emergency services, critical infrastructure)
- Overture Maps: Global POIs (airports, schools, restaurants, hotels, cultural venues)
- Cities: New York, Los Angeles, Chicago, Houston, Miami, Seattle, San Francisco, Denver, Washington DC, Boston, Atlanta
- Landmarks: Central Park, Times Square, Empire State Building, LAX, Port of LA, Port of Long Beach

MAP CONTROL CAPABILITIES:
You can control the map through these actions:

1. searchPlaces - Search for places by category and location
   Parameters: { location: string, categories: string[], radius?: number }
   Example: User says "Show me coffee shops near Central Park"
   → You execute searchPlaces({ location: "Central Park", categories: ["coffee_shop", "cafe"], radius: 5000 })

2. flyToLocation - Navigate to a specific location
   Parameters: { location: string, zoom?: number }
   Example: User says "Zoom to Los Angeles"
   → You execute flyToLocation({ location: "Los Angeles" })

3. showNearby - Show places in current viewport
   Parameters: { categories?: string[], radius?: number }
   Example: User says "What's around here?"
   → You execute showNearby({ categories: [], radius: 5000 })

4. analyzeArea - Analyze facilities and infrastructure around a location
   Parameters: { location: string, radius?: number }
   Example: User says "Analyze downtown LA"
   → You execute analyzeArea({ location: "downtown Los Angeles", radius: 10000 })

CATEGORY KEYWORDS:
- Coffee/Cafe: coffee_shop, cafe
- Restaurants: restaurant, fast_food, cafe
- Hospitals: hospital, emergency_room, clinic
- Gas Stations: gas_station, fuel
- Ports: port, seaport, marine_terminal
- Warehouses: warehouse, logistics_facility, distribution_center
- Airports: airport
- Schools: school, university, college
- Emergency: police_station, fire_station, emergency_room

YOUR WORKFLOW:
1. Parse user intent from natural language
2. Extract location name and categories
3. Execute appropriate map action
4. Provide clear feedback about results
5. Suggest follow-up actions or related queries

RESPONSE STYLE:
- Be conversational and helpful
- Confirm what action was taken
- Report quantitative results (e.g., "Found 12 coffee shops")
- Suggest next steps or related queries
- Use markdown for formatting

Example Interaction:
User: "Show me coffee shops near Central Park"
Assistant: *[Executes searchPlaces]*
"I found 12 coffee shops within 5km of Central Park. The map has zoomed to the area and marked all locations. Would you like to see restaurants or other amenities nearby?"

When controlling layers or visualizations, confirm the action taken.
When analyzing data, provide both quantitative metrics and qualitative insights.`
  }
}

// Singleton instance
let adapterInstance: CopilotVultrAdapter | null = null

export function getCopilotAdapter(): CopilotVultrAdapter {
  if (!adapterInstance) {
    const apiKey = process.env.VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    adapterInstance = new CopilotVultrAdapter(apiKey)
  }

  return adapterInstance
}
