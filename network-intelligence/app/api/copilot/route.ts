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
const SYSTEM_PROMPT = `You are an AI assistant for a geospatial intelligence platform with interactive map control.

YOUR ROLE:
- Help users search and discover locations (POIs, buildings, addresses)
- Navigate the map using natural language commands
- Analyze spatial patterns and infrastructure
- Provide contextual insights about locations and areas

AVAILABLE TOOLS:
You have 4 powerful tools to control the map:

1. searchPlaces(location, categories, radius) - Search for places by category near a location
2. flyToLocation(location, zoom) - Navigate to a specific location
3. showNearby(categories, radius) - Show places in the current viewport
4. analyzeArea(location, radius) - Analyze facilities and infrastructure around a location

RESPONSE STYLE:
- Be conversational and helpful
- Confirm what action was taken
- Report quantitative results (e.g., "Found 12 coffee shops")
- Suggest follow-up actions
- Use markdown for formatting

CATEGORIES YOU CAN SEARCH:
- Coffee/Cafes: coffee_shop, cafe
- Restaurants: restaurant, fast_food
- Hospitals: hospital, emergency_room, clinic
- Ports: port, seaport, marine_terminal
- Warehouses: warehouse, logistics_facility
- Airports: airport
- Schools: school, university, college
- Gas Stations: gas_station, fuel

IMPORTANT: When a user asks you to perform a map action, you MUST call the appropriate tool by responding with:
TOOL_CALL: searchPlaces(location="Central Park", categories=["coffee_shop", "cafe"], radius=5000)

Always include the TOOL_CALL: prefix followed by the function call syntax.

Example:
User: "Show me coffee shops near Central Park"
You: TOOL_CALL: searchPlaces(location="Central Park", categories=["coffee_shop", "cafe"], radius=5000)`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      )
    }

    console.log('Processing chat request with', messages.length, 'messages')

    // Call Vultr LLM API directly
    const response = await fetch('https://api.vultrinference.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VULTR_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-qwen-32b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vultr API error:', response.status, errorText)
      throw new Error(`Vultr API error: ${response.status}`)
    }

    const data = await response.json()
    let assistantMessage = data.choices[0]?.message?.content || 'No response generated'

    console.log('LLM Response:', assistantMessage.substring(0, 200))

    // Initialize result variable (will be set if tool is called)
    let result: any = null

    // Check if LLM wants to call a tool
    const toolCallMatch = assistantMessage.match(/TOOL_CALL:\s*(\w+)\((.*?)\)/)

    if (toolCallMatch) {
      const [, toolName, paramsStr] = toolCallMatch
      console.log('Tool call detected:', toolName, paramsStr)

      try {
        // Parse parameters from string format
        const params = parseToolParams(paramsStr)

        // Execute the tool
        const handler = getMapActionHandler()

        switch (toolName) {
          case 'searchPlaces':
            result = await handler.handleSearchNearLocation(
              params.location,
              params.categories || [],
              params.radius || 5000
            )
            break

          case 'flyToLocation':
            result = await handler.handleFlyTo(params.location, params.zoom)
            break

          case 'showNearby':
            result = await handler.handleSearchInViewport(
              params.categories,
              params.radius || 5000
            )
            break

          case 'analyzeArea':
            result = await handler.handleAnalyzeArea(
              params.location,
              params.radius || 10000
            )
            break

          default:
            result = { success: false, message: `Unknown tool: ${toolName}` }
        }

        console.log('Tool execution result:', result.success, result.message)

        // Replace the TOOL_CALL with the result
        assistantMessage = result.message
      } catch (error) {
        console.error('Tool execution error:', error)
        assistantMessage = 'I encountered an error executing that action. Please try again.'
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
      // Include action data for client-side execution
      actionData: result || null
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
 * Parse tool parameters from string format
 * Example: location="Central Park", categories=["coffee_shop"], radius=5000
 * Handles quoted strings with commas like: location="Los Angeles, CA"
 */
function parseToolParams(paramsStr: string): Record<string, any> {
  const params: Record<string, any> = {}

  // More robust regex that handles quoted strings and arrays
  // Matches: key="value with, commas" or key=["array", "values"] or key=123
  const paramRegex = /(\w+)=((?:"[^"]*"|'[^']*'|\[[^\]]*\]|\d+))(?:,\s*|$)/g
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
    version: '2.0.0',
    engine: 'Vultr LLM Direct Integration',
    tools: ['searchPlaces', 'flyToLocation', 'showNearby', 'analyzeArea'],
    message: 'Send POST requests with messages array to interact with the map via natural language'
  })
}
