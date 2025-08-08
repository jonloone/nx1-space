/**
 * Location Intelligence API Endpoint
 * 
 * POST /api/gee/location
 * Body: { lat: number, lon: number, radius?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { geeRESTService } from '../../../../lib/services/googleEarthEngineRESTService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lon, radius = 50000 } = body

    // Validate input
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude must be numbers'
      }, { status: 400 })
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates'
      }, { status: 400 })
    }

    // Get location intelligence
    const intelligence = await geeRESTService.getLocationIntelligence({ lat, lon, radius })

    return NextResponse.json({
      success: true,
      data: intelligence
    })

  } catch (error) {
    console.error('Location Intelligence API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get location intelligence'
    }, { status: 500 })
  }
}