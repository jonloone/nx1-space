import { NextRequest, NextResponse } from 'next/server'
import { VultrLLMService } from '@/lib/services/vultrLLMService'

export async function POST(request: NextRequest) {
  try {
    const { query, stations } = await request.json()

    if (!query || !stations) {
      return NextResponse.json(
        { error: 'Missing query or stations data' },
        { status: 400 }
      )
    }

    // Get API key from environment
    const apiKey = process.env.VULTR_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vultr API key not configured' },
        { status: 500 }
      )
    }

    // Create LLM service instance
    const llmService = new VultrLLMService({ apiKey })

    // Perform the search
    const results = await llmService.searchGroundStations(query, stations)

    return NextResponse.json(results)
  } catch (error) {
    console.error('AI Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
