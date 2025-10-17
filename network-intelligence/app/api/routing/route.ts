/**
 * Valhalla Routing API Proxy
 *
 * Proxies routing requests from browser to Valhalla service running on localhost:8002
 * This is necessary because browser cannot access localhost:8002 directly
 */

import { NextRequest, NextResponse } from 'next/server'

const VALHALLA_URL = process.env.VALHALLA_URL || 'http://localhost:8002'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Routing API] Proxying request to Valhalla:', {
      locations: body.locations?.length,
      costing: body.costing
    })

    // Forward request to Valhalla
    const response = await fetch(`${VALHALLA_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      console.error('[Routing API] Valhalla request failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Valhalla routing failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    console.log('[Routing API] Route generated:', {
      distance: data.trip?.summary?.length,
      duration: data.trip?.summary?.time
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[Routing API] Error:', error.message)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Routing request timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: `Routing service error: ${error.message}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check - test Valhalla connectivity
    const response = await fetch(`${VALHALLA_URL}/status`, {
      signal: AbortSignal.timeout(2000)
    })

    if (!response.ok) {
      return NextResponse.json(
        { available: false, error: 'Valhalla service unhealthy' },
        { status: 503 }
      )
    }

    const status = await response.json()

    return NextResponse.json({
      available: true,
      version: status.version,
      url: VALHALLA_URL
    })
  } catch (error: any) {
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 503 }
    )
  }
}
