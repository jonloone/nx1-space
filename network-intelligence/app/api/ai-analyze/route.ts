import { NextRequest, NextResponse } from 'next/server'
import { VultrLLMService } from '@/lib/services/vultrLLMService'

export async function POST(request: NextRequest) {
  try {
    const { station } = await request.json()

    if (!station) {
      return NextResponse.json(
        { error: 'Missing station data' },
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

    // Analyze the station
    const insight = await llmService.analyzeStation(station)

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('AI Analyze error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
