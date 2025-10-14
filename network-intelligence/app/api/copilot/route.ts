import { NextRequest, NextResponse } from 'next/server'
import { getCopilotAdapter } from '@/lib/adapters/copilotVultrAdapter'

/**
 * CopilotKit API Route
 * Handles chat requests from CopilotKit frontend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, action, parameters, context } = body

    // Get the Vultr adapter
    const adapter = getCopilotAdapter()

    // Handle action execution
    if (action) {
      const result = await adapter.executeAction(action, parameters, context)
      return NextResponse.json({ result })
    }

    // Handle chat messages
    if (messages && Array.isArray(messages)) {
      const response = await adapter.processRequest(messages)
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        model: 'llama2-13b-chat-Q5_K_M',
        choices: [
          {
            message: {
              role: 'assistant',
              content: response
            },
            finish_reason: 'stop'
          }
        ]
      })
    }

    return NextResponse.json(
      { error: 'Invalid request: must include messages or action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('CopilotKit API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'CopilotKit API is running',
    version: '1.0.0',
    adapter: 'Vultr LLM'
  })
}
