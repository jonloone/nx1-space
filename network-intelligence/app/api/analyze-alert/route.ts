/**
 * AI Alert Analysis API Route
 * Server-side endpoint for secure Vultr LLM-powered alert analysis
 *
 * POST /api/analyze-alert
 * Body: { alert, allAlerts?, forceRefresh? }
 * Returns: AlertAnalysisResult
 */

import { NextRequest, NextResponse } from 'next/server'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getAlertAnalysisService, type AlertAnalysisResult } from '@/lib/services/alertAnalysisService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Rate limiting (simple in-memory store)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // requests per window
const RATE_WINDOW_MS = 60 * 1000 // 1 minute

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = requestCounts.get(ip)

  // Reset if window expired
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_WINDOW_MS
    })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  // Check limit
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  // Increment count
  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

/**
 * POST handler - Analyze alert
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(clientIp)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_WINDOW_MS).toISOString()
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { alert, allAlerts, forceRefresh } = body as {
      alert: IntelligenceAlert
      allAlerts?: IntelligenceAlert[]
      forceRefresh?: boolean
    }

    // Validate input
    if (!alert || !alert.id) {
      return NextResponse.json(
        { error: 'Invalid request: alert object required' },
        { status: 400 }
      )
    }

    console.log(`🔍 API: Analyzing alert ${alert.id} - ${alert.title}`)

    // Get analysis service
    const analysisService = getAlertAnalysisService()

    // Deserialize timestamps (JSON serialization converts Date objects to strings)
    const deserializeAlert = (a: any): IntelligenceAlert => ({
      ...a,
      timestamp: new Date(a.timestamp)
    })

    const alertWithDates = deserializeAlert(alert)
    const allAlertsWithDates = (allAlerts || []).map(deserializeAlert)

    // Perform analysis
    const result: AlertAnalysisResult = await analysisService.analyzeAlert(
      alertWithDates,
      allAlertsWithDates,
      { forceRefresh }
    )

    console.log(`✅ API: Analysis complete for ${alert.id} (cached: ${result.cached})`)

    // Return analysis
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'Cache-Control': result.cached ? 'public, max-age=300' : 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ API: Alert analysis failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to analyze alert',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * GET handler - Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'AI Alert Analysis',
    status: 'operational',
    timestamp: new Date().toISOString()
  })
}
