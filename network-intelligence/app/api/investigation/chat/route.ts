/**
 * Investigation Chat API
 *
 * Endpoint for AI-powered investigation queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInvestigationAgent, type ChatMessage } from '@/lib/agents/investigationAgent'
import type { InvestigationSubject, LocationStop } from '@/lib/demo/investigation-demo-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ChatRequest {
  query: string
  conversationHistory?: ChatMessage[]
  context?: {
    subject?: InvestigationSubject
    locations?: LocationStop[]
    timeline?: { start: string; end: string }
    scenario?: any
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    console.log('💬 Chat query received:', body.query)

    const { query, conversationHistory = [], context } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Get agent instance
    const agent = getInvestigationAgent()

    // Update agent context if provided
    if (context) {
      agent.setContext({
        subject: context.subject,
        locations: context.locations,
        timeline: context.timeline ? {
          start: new Date(context.timeline.start),
          end: new Date(context.timeline.end)
        } : undefined,
        scenario: context.scenario
      })
    }

    // Process query
    const response = await agent.processQuery(query, conversationHistory)

    console.log('✅ Chat response generated')

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Chat API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for suggested questions
export async function GET(request: NextRequest) {
  try {
    const agent = getInvestigationAgent()
    const suggestions = agent.getSuggestedQuestions()

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('❌ Failed to get suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
