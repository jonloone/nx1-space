import { NextRequest, NextResponse } from 'next/server'
import { StatisticalMaritimeDataService } from '@/lib/services/statisticalMaritimeDataService'
import { MaritimeDemoScenariosService } from '@/lib/services/maritimeDemoScenariosService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zoom = parseInt(searchParams.get('zoom') || '5')
    const bounds = searchParams.get('bounds')
    
    // Initialize services
    const maritimeService = new StatisticalMaritimeDataService()
    const demoService = new MaritimeDemoScenariosService()
    
    // Generate realistic maritime density points
    const densityPoints = generateMaritimeDensityPoints(bounds)
    
    // Get active vessel data
    const activeVessels = await maritimeService.generateStatisticalVessels(500)
    
    // Convert vessels to density points
    const points = activeVessels.map(vessel => ({
      position: vessel.current_position,
      weight: getVesselWeight(vessel.vessel_type),
      vesselTypes: { [vessel.vessel_type]: 1 },
      value: vessel.monthly_value || 10000,
      vesselInfo: {
        id: vessel.vessel_id,
        name: vessel.vessel_name,
        type: vessel.vessel_type,
        flag: vessel.flag_state,
        route: vessel.route_name
      }
    }))
    
    // Add density hotspots for major ports and shipping lanes
    const hotspots = getMaritimeHotspots()
    hotspots.forEach(hotspot => {
      for (let i = 0; i < hotspot.density; i++) {
        points.push({
          position: [
            hotspot.center[0] + (Math.random() - 0.5) * hotspot.radius,
            hotspot.center[1] + (Math.random() - 0.5) * hotspot.radius
          ],
          weight: Math.random() * 5 + 1,
          vesselTypes: hotspot.vesselTypes,
          value: hotspot.avgValue,
          vesselInfo: null
        })
      }
    })
    
    // Filter by bounds if provided
    let filteredPoints = points
    if (bounds) {
      const bbox = JSON.parse(bounds)
      filteredPoints = points.filter(point => {
        const [lng, lat] = point.position
        return lng >= bbox[0] && lng <= bbox[2] && 
               lat >= bbox[1] && lat <= bbox[3]
      })
    }
    
    return NextResponse.json({
      points: filteredPoints,
      metadata: {
        lastUpdated: new Date().toISOString(),
        coverage: bounds ? JSON.parse(bounds) : 'global',
        totalVessels: filteredPoints.length,
        zoom,
        dataQuality: 'statistical_model',
        confidence: 0.85
      }
    })
  } catch (error) {
    console.error('Error fetching maritime density:', error)
    return NextResponse.json({ error: 'Failed to fetch maritime density' }, { status: 500 })
  }
}

function generateMaritimeDensityPoints(bounds: string | null): any[] {
  const points = []
  
  // Major shipping routes with realistic density
  const shippingLanes = [
    // North Atlantic
    { start: [-74, 40], end: [5, 51], density: 150 },
    // Mediterranean
    { start: [-5, 36], end: [35, 31], density: 120 },
    // Suez Canal approach
    { start: [32, 30], end: [43, 12], density: 200 },
    // Indian Ocean
    { start: [43, 12], end: [80, 6], density: 100 },
    // Malacca Strait
    { start: [80, 6], end: [104, 1], density: 250 },
    // South China Sea
    { start: [104, 1], end: [122, 31], density: 180 },
    // Trans-Pacific
    { start: [122, 31], end: [-122, 37], density: 80 }
  ]
  
  shippingLanes.forEach(lane => {
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const lng = lane.start[0] + (lane.end[0] - lane.start[0]) * t
      const lat = lane.start[1] + (lane.end[1] - lane.start[1]) * t
      
      // Add vessels along the route with some scatter
      for (let j = 0; j < lane.density / steps; j++) {
        points.push({
          position: [
            lng + (Math.random() - 0.5) * 2,
            lat + (Math.random() - 0.5) * 2
          ],
          weight: Math.random() * 3 + 1
        })
      }
    }
  })
  
  return points
}

function getVesselWeight(vesselType: string): number {
  const weights: Record<string, number> = {
    'CONTAINER_SHIP': 3,
    'CRUISE_SHIP': 5,
    'OIL_TANKER': 4,
    'LNG_CARRIER': 4,
    'BULK_CARRIER': 2,
    'CAR_CARRIER': 2,
    'FISHING': 1,
    'YACHT': 1
  }
  return weights[vesselType] || 1
}

function getMaritimeHotspots(): any[] {
  return [
    // Major ports
    {
      name: 'Singapore',
      center: [103.85, 1.29],
      radius: 0.5,
      density: 100,
      vesselTypes: { CONTAINER_SHIP: 60, OIL_TANKER: 40 },
      avgValue: 50000
    },
    {
      name: 'Rotterdam',
      center: [4.48, 51.92],
      radius: 0.3,
      density: 80,
      vesselTypes: { CONTAINER_SHIP: 70, BULK_CARRIER: 30 },
      avgValue: 45000
    },
    {
      name: 'Shanghai',
      center: [121.47, 31.23],
      radius: 0.4,
      density: 90,
      vesselTypes: { CONTAINER_SHIP: 80, CAR_CARRIER: 20 },
      avgValue: 48000
    },
    {
      name: 'Los Angeles',
      center: [-118.27, 33.74],
      radius: 0.3,
      density: 70,
      vesselTypes: { CONTAINER_SHIP: 65, CAR_CARRIER: 35 },
      avgValue: 42000
    },
    {
      name: 'Dubai',
      center: [55.27, 25.25],
      radius: 0.3,
      density: 60,
      vesselTypes: { CONTAINER_SHIP: 50, OIL_TANKER: 50 },
      avgValue: 40000
    }
  ]
}