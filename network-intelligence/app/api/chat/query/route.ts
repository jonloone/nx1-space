/**
 * Chat Query API Endpoint
 *
 * POST /api/chat/query
 *
 * Processes natural language queries for geospatial data analysis
 * across Ground, Maritime, and Space domains.
 *
 * Request body:
 * {
 *   query: string,
 *   domain: 'ground' | 'maritime' | 'space' | 'all',
 *   conversationId?: string,
 *   context?: {
 *     viewport?: { bounds?, center?, zoom? },
 *     previousQueries?: string[]
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   results: QueryResult | null,
 *   naturalLanguageResponse: string,
 *   sql: string,
 *   domain: string,
 *   agentInsights?: string[],
 *   suggestions?: string[],
 *   processingTimeMs: number,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getChatQueryService, type IntelDomain, type ConversationContext } from '@/lib/services/chatQueryService'

// Request validation schema
interface ChatQueryRequest {
  query: string
  domain: IntelDomain
  conversationId?: string
  context?: ConversationContext
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'anonymous'

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        processingTimeMs: Date.now() - startTime
      },
      { status: 429 }
    )
  }

  try {
    // Parse request body
    const body: ChatQueryRequest = await request.json()

    // Validate required fields
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required and must be a string',
          processingTimeMs: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    // Validate domain
    const validDomains: IntelDomain[] = ['ground', 'maritime', 'space', 'all']
    const domain = validDomains.includes(body.domain) ? body.domain : 'all'

    // Clean query (basic sanitization)
    const cleanQuery = body.query.trim().slice(0, 1000) // Max 1000 chars

    if (cleanQuery.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query too short. Please provide at least 3 characters.',
          processingTimeMs: Date.now() - startTime
        },
        { status: 400 }
      )
    }

    console.log(`📝 Chat query received: "${cleanQuery}" (domain: ${domain})`)

    // Get ChatQueryService and process
    const chatService = getChatQueryService()
    const response = await chatService.processQuery(cleanQuery, domain, body.context)

    // Log processing time
    console.log(`✅ Query processed in ${response.processingTimeMs}ms`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Chat query API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        processingTimeMs: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'chat-query',
    version: '1.0.0',
    supportedDomains: ['ground', 'maritime', 'space', 'all']
  })
}
