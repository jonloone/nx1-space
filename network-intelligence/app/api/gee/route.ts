/**
 * Google Earth Engine API Endpoints
 * 
 * Provides REST API access to Google Earth Engine data
 */

import { NextRequest, NextResponse } from 'next/server'
import { geeService } from '../../../lib/services/googleEarthEngineService'

/**
 * GET /api/gee/test
 * Test GEE connection and authentication
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const path = url.pathname.split('/').pop()

  try {
    if (path === 'test') {
      const result = await geeService.testConnection()
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid endpoint'
    }, { status: 400 })

  } catch (error) {
    console.error('GEE API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/gee/location-intelligence
 * Get comprehensive location intelligence data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lon, radius = 50000 } = body

    // Validate input
    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 })
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates'
      }, { status: 400 })
    }

    // Get location intelligence
    const intelligence = await geeService.getLocationIntelligence(lat, lon, radius)

    return NextResponse.json({
      success: true,
      data: intelligence
    })

  } catch (error) {
    console.error('Location Intelligence API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get location intelligence'
    }, { status: 500 })
  }
}