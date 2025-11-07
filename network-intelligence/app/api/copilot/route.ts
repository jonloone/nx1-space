import { NextRequest, NextResponse } from 'next/server'
import { getMapActionHandler } from '@/lib/services/mapActionHandler'

/**
 * Copilot API Route - Natural Language Map Control
 * Direct integration with Vultr LLM API
 *
 * Supports natural language queries like:
 * - "Show me coffee shops near Central Park"
 * - "Zoom to Los Angeles"
 * - "What's around here?"
 * - "Analyze downtown LA"
 */

// System instructions for the AI
const SYSTEM_PROMPT = `You are a map control AI. You MUST respond with ONLY a tool call - nothing else.

CRITICAL: Your entire response must be EXACTLY in this format: TOOL_CALL: toolName(param1="value", param2="value")
DO NOT include explanations, reasoning, thinking, or any other text.
DO NOT use <think> tags.
Your response must start with "TOOL_CALL:" and contain ONLY the function call.

TOOLS:
1. searchPlaces(location, categories, radius) - Search POIs near location
2. flyToLocation(location, zoom) - Navigate to location
3. showNearby(categories, radius) - Show POIs in current view
4. analyzeArea(location, radius) - Analyze area infrastructure
5. showBuildings(enable3D) - Toggle buildings layer (2D or 3D)
6. toggleLayer(layerName, visible) - Show/hide map layers
7. showWeather(weatherType) - Show weather overlay (precipitation, temperature, wind, clouds, pressure)
8. analyzeRoute(fromLocation, toLocation, mode, startTime) - Intelligence-grade route analysis with multi-INT waypoint assessment (GEOINT, SIGINT, OSINT, Temporal). Mode: driving/walking/cycling. StartTime: ISO timestamp (optional, defaults to current time)
9. analyzeImagery(location, startDate, endDate, includeChangeDetection, includeActivity) - Satellite imagery analysis with change detection and activity assessment. Dates in ISO format (defaults to last 90 days). Detects construction, demolition, vegetation changes, infrastructure modifications
10. analyzeIsochrone(location, modes, contours) - Multi-modal reachability analysis showing areas accessible within time thresholds. Modes: ["driving", "walking", "cycling"] (defaults to all). Contours: [15, 30, 45] (minutes, defaults to [15, 30, 45])
11. analyzeMultiLayer(location, analysisTypes, routeFrom, routeTo) - Comprehensive multi-layer intelligence analysis combining route, imagery, and reachability. AnalysisTypes: ["route", "imagery", "isochrone", "all"] (defaults to ["all"]). RouteFrom/RouteTo: optional for route analysis

CATEGORIES:
coffee_shop, cafe, restaurant, fast_food, hospital, emergency_room, clinic, port, seaport, marine_terminal, warehouse, logistics_facility, airport, school, university, college, gas_station, fuel

MAP LAYERS:
buildings, roads, water, boundaries

WEATHER TYPES:
precipitation, temperature, wind, clouds, pressure

RESPONSE FORMAT:
User query → Output ONLY: TOOL_CALL: toolName(param1="value", param2=["array"], param3=number)

EXAMPLES:
"Show me hospitals near NYC" → TOOL_CALL: searchPlaces(location="NYC", categories=["hospital", "emergency_room", "clinic"], radius=5000)
"Fly to Chicago" → TOOL_CALL: flyToLocation(location="Chicago", zoom=12)
"Gas stations nearby" → TOOL_CALL: showNearby(categories=["gas_station", "fuel"], radius=5000)
"Show buildings in 3D" → TOOL_CALL: showBuildings(enable3D=true)
"Show roads" → TOOL_CALL: toggleLayer(layerName="roads", visible=true)
"Hide boundaries" → TOOL_CALL: toggleLayer(layerName="boundaries", visible=false)
"Show precipitation" → TOOL_CALL: showWeather(weatherType="precipitation")
"Show temperature" → TOOL_CALL: showWeather(weatherType="temperature")
"Analyze route from Times Square to Central Park" → TOOL_CALL: analyzeRoute(fromLocation="Times Square, NYC", toLocation="Central Park, NYC", mode="walking")
"Plan a route to the airport" → TOOL_CALL: analyzeRoute(fromLocation="current", toLocation="LAX Airport", mode="driving")
"Analyze satellite imagery for Buenos Aires" → TOOL_CALL: analyzeImagery(location="Buenos Aires, Argentina", includeChangeDetection=true, includeActivity=true)
"Check for changes at this location" → TOOL_CALL: analyzeImagery(location="current", startDate="2024-09-01", endDate="2024-11-01", includeChangeDetection=true)
"How accessible is downtown LA?" → TOOL_CALL: analyzeIsochrone(location="Downtown LA", modes=["driving", "walking", "cycling"], contours=[15, 30, 45])
"Show reachability zones for this area" → TOOL_CALL: analyzeIsochrone(location="current", modes=["driving"], contours=[10, 20, 30])
"Full intelligence assessment for Buenos Aires" → TOOL_CALL: analyzeMultiLayer(location="Buenos Aires", analysisTypes=["all"])
"Comprehensive analysis with route planning" → TOOL_CALL: analyzeMultiLayer(location="NYC", analysisTypes=["all"], routeFrom="Times Square", routeTo="JFK Airport")

NO explanations. NO reasoning. ONLY tool calls.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      )
    }

    console.log('Processing chat request with', messages.length, 'messages')
    if (context) {
      console.log('📍 Application context:', context)
    }

    // Build messages array with optional context
    const llmMessages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    // Add context as a system-level message if provided
    if (context) {
      llmMessages.push({
        role: 'system',
        content: `CURRENT APPLICATION STATE:\n${context}\n\nUse this context to provide more relevant responses. For example, if the user says "show nearby hospitals" and a location is selected, search near that selected location.`
      })
    }

    // Add user messages
    llmMessages.push(...messages)

    // Call Vultr LLM API directly
    const response = await fetch('https://api.vultrinference.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VULTR_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-instruct',
        messages: llmMessages,
        temperature: 0.1,
        max_tokens: 150
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vultr API error:', response.status, errorText)
      throw new Error(`Vultr API error: ${response.status}`)
    }

    const data = await response.json()
    let rawResponse = data.choices[0]?.message?.content || 'No response generated'

    // Extract thinking (for logging/routing) and final answer
    const { thinking, answer } = extractThinkingAndAnswer(rawResponse)

    // Log thinking for debugging/routing (could be used by CrewAI)
    if (thinking) {
      console.log('🧠 Model reasoning:', thinking.substring(0, 300) + '...')
    }

    // Use only the final answer for user display
    let assistantMessage = answer

    console.log('💬 Final answer:', assistantMessage.substring(0, 200))

    // Initialize result variable (will be set if tool is called)
    let toolCall: any = null

    // Check if LLM wants to call a tool
    const toolCallMatch = assistantMessage.match(/TOOL_CALL:\s*(\w+)\((.*?)\)/)

    if (toolCallMatch) {
      const [, toolName, paramsStr] = toolCallMatch
      console.log('🔧 Tool call detected:', toolName, paramsStr)

      try {
        // Parse parameters from string format
        const params = parseToolParams(paramsStr)

        // Return tool call for CLIENT-SIDE execution
        // The client has access to the map and can execute the action
        toolCall = {
          tool: toolName,
          params,
          // Provide a user-friendly message while the action executes
          pendingMessage: getPendingMessage(toolName, params)
        }

        console.log('📤 Returning tool call to client for execution')

        // Set a pending message for the user
        assistantMessage = toolCall.pendingMessage
      } catch (error) {
        console.error('Tool parsing error:', error)
        assistantMessage = 'I encountered an error parsing that command. Please try again.'
      }
    }

    // Return response in OpenAI-compatible format with action data
    return NextResponse.json({
      id: data.id || `msg-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'deepseek-r1-distill-qwen-32b',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: assistantMessage
          },
          finish_reason: 'stop'
        }
      ],
      usage: data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      // Include tool call for client-side execution
      toolCall: toolCall || null
    })
  } catch (error) {
    console.error('Chat API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Generate user-friendly pending message for tool execution
 */
function getPendingMessage(toolName: string, params: Record<string, any>): string {
  switch (toolName) {
    case 'searchPlaces': {
      const categories = params.categories?.join(', ') || 'places'
      return `Searching for ${categories} near ${params.location}...`
    }

    case 'flyToLocation':
      return `Navigating to ${params.location}...`

    case 'showNearby': {
      const nearbyCategories = params.categories?.join(', ') || 'places'
      return `Finding ${nearbyCategories} in current view...`
    }

    case 'analyzeArea':
      return `Analyzing ${params.location}...`

    case 'showBuildings': {
      const mode = params.enable3D ? '3D' : '2D'
      return `Showing buildings in ${mode} mode...`
    }

    case 'toggleLayer': {
      const action = params.visible ? 'Showing' : 'Hiding'
      return `${action} ${params.layerName} layer...`
    }

    case 'showWeather': {
      const weatherType = params.weatherType || 'weather'
      return `Loading ${weatherType} layer...`
    }

    case 'analyzeRoute': {
      const mode = params.mode || 'driving'
      return `Analyzing ${mode} route from ${params.fromLocation} to ${params.toLocation} with multi-INT assessment...`
    }

    case 'analyzeImagery': {
      const changeDetection = params.includeChangeDetection ? ' with change detection' : ''
      const activity = params.includeActivity ? ' and activity analysis' : ''
      return `Analyzing satellite imagery for ${params.location}${changeDetection}${activity}...`
    }

    case 'analyzeIsochrone': {
      const isoModes = params.modes?.join(', ') || 'all transportation modes'
      return `Analyzing reachability zones for ${params.location} using ${isoModes}...`
    }

    case 'analyzeMultiLayer': {
      const analysisTypes = params.analysisTypes?.join(', ') || 'all layers'
      return `Running comprehensive multi-layer intelligence analysis (${analysisTypes}) for ${params.location}...`
    }

    default:
      return 'Processing request...'
  }
}

/**
 * Extract thinking/reasoning from DeepSeek R1 response
 * DeepSeek R1 outputs reasoning in <think> tags, followed by the final answer
 *
 * @param response - Raw LLM response
 * @returns Object with thinking (reasoning) and answer (final output)
 */
function extractThinkingAndAnswer(response: string): {
  thinking: string | null
  answer: string
} {
  // Match <think>...</think> tags
  const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/i)

  if (thinkMatch) {
    const thinking = thinkMatch[1].trim()
    // Remove the entire <think>...</think> block from the response
    const answer = response.replace(/<think>[\s\S]*?<\/think>/i, '').trim()

    return { thinking, answer }
  }

  // No thinking tags found, return full response as answer
  return { thinking: null, answer: response }
}

/**
 * Parse tool parameters from string format
 * Example: location="Central Park", categories=["coffee_shop"], radius=5000
 * Handles quoted strings with commas like: location="Los Angeles, CA"
 */
function parseToolParams(paramsStr: string): Record<string, any> {
  const params: Record<string, any> = {}

  // More robust regex that handles quoted strings, arrays, and bare words
  // Matches: key="value with, commas" or key=["array", "values"] or key=123 or key=true
  const paramRegex = /(\w+)=((?:"[^"]*"|'[^']*'|\[[^\]]*\]|\w+))(?:,\s*|$)/g
  let match

  while ((match = paramRegex.exec(paramsStr)) !== null) {
    const [, key, value] = match

    try {
      const cleanValue = value.trim()

      // Handle arrays: ["item1", "item2"]
      if (cleanValue.startsWith('[')) {
        const arrayMatch = cleanValue.match(/\[(.*?)\]/)
        if (arrayMatch) {
          params[key] = arrayMatch[1]
            .split(',')
            .map(item => item.trim().replace(/['"]/g, ''))
            .filter(item => item.length > 0)
        }
      }
      // Handle quoted strings: "value" or 'value'
      else if (cleanValue.startsWith('"') || cleanValue.startsWith("'")) {
        params[key] = cleanValue.slice(1, -1) // Remove quotes
      }
      // Handle booleans
      else if (cleanValue === 'true' || cleanValue === 'false') {
        params[key] = cleanValue === 'true'
      }
      // Handle numbers
      else if (!isNaN(Number(cleanValue))) {
        params[key] = Number(cleanValue)
      }
      // Plain string
      else {
        params[key] = cleanValue
      }

      console.log(`Parsed param: ${key} =`, params[key])
    } catch (e) {
      console.error('Failed to parse param:', key, value)
    }
  }

  return params
}

export async function GET() {
  return NextResponse.json({
    status: 'Copilot API is running',
    version: '3.0.0',
    engine: 'Vultr LLM Direct Integration',
    tools: [
      'searchPlaces',
      'flyToLocation',
      'showNearby',
      'analyzeArea',
      'showBuildings',
      'toggleLayer',
      'showWeather',
      'analyzeRoute',
      'analyzeImagery',
      'analyzeIsochrone',
      'analyzeMultiLayer'
    ],
    message: 'Send POST requests with messages array to interact with the map via natural language'
  })
}
