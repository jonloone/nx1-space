/**
 * Population Density API Endpoint
 * 
 * GET /api/gee/population?lat=40.7128&lon=-74.0060&scale=100
 */

import { NextRequest, NextResponse } from 'next/server'
import { geeService } from '../../../../lib/services/googleEarthEngineService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lon = parseFloat(searchParams.get('lon') || '0')
    const scale = parseInt(searchParams.get('scale') || '100')

    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required'
      }, { status: 400 })
    }

    // Get population density data
    const result = await geeService.getPopulationDensity({
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      scale,
      dataset: 'population'
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Population API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get population data'
    }, { status: 500 })
  }
}