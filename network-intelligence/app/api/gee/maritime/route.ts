/**
 * Maritime Activity API Endpoint
 * 
 * GET /api/gee/maritime?lat=40.7128&lon=-74.0060&radius=50000&scale=500
 */

import { NextRequest, NextResponse } from 'next/server'
import { geeService } from '../../../../lib/services/googleEarthEngineService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lon = parseFloat(searchParams.get('lon') || '0')
    const radius = parseInt(searchParams.get('radius') || '50000')
    const scale = parseInt(searchParams.get('scale') || '500')

    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 })
    }

    // Get maritime activity data
    const result = await geeService.getMaritimeActivity({
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      scale,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      dataset: 'maritime'
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Maritime API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get maritime activity data'
    }, { status: 500 })
  }
}