import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Major global shipping routes with realistic paths
    const shippingRoutes = [
      {
        id: 'north-atlantic',
        name: 'Trans-Atlantic',
        path: [
          [-74.0060, 40.7128],  // New York
          [-70, 41],
          [-50, 43],
          [-30, 48],
          [-10, 50],
          [4.4777, 51.9244]  // Rotterdam
        ],
        traffic: 150,
        value: 25000000,
        vesselTypes: ['CONTAINER_SHIP', 'OIL_TANKER'],
        color: [0, 200, 255, 200]
      },
      {
        id: 'asia-europe',
        name: 'Asia-Europe via Suez',
        path: [
          [121.4737, 31.2304],  // Shanghai
          [114, 22],
          [104, 1.3],  // Singapore
          [80, 6],
          [60, 12],
          [43, 12],  // Red Sea
          [32.5, 30],  // Suez Canal
          [14, 35],  // Mediterranean
          [4.4777, 51.9244]  // Rotterdam
        ],
        traffic: 200,
        value: 45000000,
        vesselTypes: ['CONTAINER_SHIP', 'CAR_CARRIER'],
        color: [255, 200, 0, 200]
      },
      {
        id: 'trans-pacific',
        name: 'Trans-Pacific',
        path: [
          [121.4737, 31.2304],  // Shanghai
          [140, 35],  // Japan
          [160, 30],
          [180, 25],
          [-160, 20],
          [-140, 25],
          [-122.4194, 37.7749]  // San Francisco
        ],
        traffic: 120,
        value: 30000000,
        vesselTypes: ['CONTAINER_SHIP', 'CAR_CARRIER', 'BULK_CARRIER'],
        color: [100, 255, 100, 200]
      },
      {
        id: 'mediterranean',
        name: 'Mediterranean Circuit',
        path: [
          [-5.3, 36.1],  // Gibraltar
          [2.3, 41.4],  // Barcelona
          [12.5, 41.9],  // Rome
          [23.7, 37.9],  // Athens
          [29, 41],  // Istanbul
          [35, 33],  // Cyprus
          [31.2, 30.0],  // Alexandria
          [10, 37],  // Tunisia
          [-5.3, 36.1]  // Back to Gibraltar
        ],
        traffic: 80,
        value: 15000000,
        vesselTypes: ['CRUISE_SHIP', 'CONTAINER_SHIP'],
        color: [255, 100, 255, 200]
      },
      {
        id: 'middle-east-asia',
        name: 'Middle East - Asia',
        path: [
          [55.3, 25.3],  // Dubai
          [58, 23],
          [60, 20],
          [65, 15],
          [72, 18],  // Mumbai
          [80, 13],
          [80, 6],  // Sri Lanka
          [97, 2],
          [103.85, 1.29]  // Singapore
        ],
        traffic: 90,
        value: 20000000,
        vesselTypes: ['OIL_TANKER', 'LNG_CARRIER'],
        color: [255, 150, 0, 200]
      },
      {
        id: 'south-america-europe',
        name: 'South America - Europe',
        path: [
          [-43.2, -22.9],  // Rio de Janeiro
          [-35, -8],
          [-20, 0],
          [-10, 10],
          [-5, 20],
          [0, 35],
          [4.4777, 51.9244]  // Rotterdam
        ],
        traffic: 60,
        value: 12000000,
        vesselTypes: ['BULK_CARRIER', 'CONTAINER_SHIP'],
        color: [100, 150, 255, 200]
      },
      {
        id: 'australia-asia',
        name: 'Australia - Asia',
        path: [
          [151.2, -33.9],  // Sydney
          [145, -30],
          [130, -20],
          [120, -10],
          [110, -5],
          [104, 1],  // Singapore
          [103.85, 1.29]
        ],
        traffic: 70,
        value: 18000000,
        vesselTypes: ['BULK_CARRIER', 'LNG_CARRIER'],
        color: [200, 100, 100, 200]
      },
      {
        id: 'arctic-route',
        name: 'Northern Sea Route',
        path: [
          [12.5, 78],  // Svalbard
          [50, 75],
          [90, 73],
          [140, 70],
          [170, 66],
          [-170, 65],  // Bering Strait
        ],
        traffic: 20,
        value: 5000000,
        vesselTypes: ['LNG_CARRIER', 'CONTAINER_SHIP'],
        color: [150, 200, 255, 150]
      }
    ]
    
    // Calculate derived metrics for each route
    const enrichedRoutes = shippingRoutes.map(route => ({
      ...route,
      distance: calculateRouteDistance(route.path),
      congestion: calculateCongestion(route.traffic),
      riskLevel: calculateRiskLevel(route),
      averageSpeed: 15 + Math.random() * 10, // knots
      transitTime: calculateTransitTime(route.path),
      fuelCost: calculateFuelCost(route.path, route.traffic)
    }))
    
    return NextResponse.json({
      routes: enrichedRoutes,
      metadata: {
        totalRoutes: enrichedRoutes.length,
        totalTraffic: enrichedRoutes.reduce((sum, r) => sum + r.traffic, 0),
        totalValue: enrichedRoutes.reduce((sum, r) => sum + r.value, 0),
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching shipping routes:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping routes' }, { status: 500 })
  }
}

function calculateRouteDistance(path: number[][]): number {
  let distance = 0
  for (let i = 1; i < path.length; i++) {
    distance += calculateDistance(path[i-1], path[i])
  }
  return Math.round(distance)
}

function calculateDistance(coord1: number[], coord2: number[]): number {
  const R = 6371 // Earth radius in km
  const lat1 = coord1[1] * Math.PI / 180
  const lat2 = coord2[1] * Math.PI / 180
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon/2) * Math.sin(deltaLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

function calculateCongestion(traffic: number): string {
  if (traffic > 150) return 'high'
  if (traffic > 80) return 'medium'
  return 'low'
}

function calculateRiskLevel(route: any): string {
  // Simplified risk calculation based on route characteristics
  if (route.id === 'arctic-route') return 'high'
  if (route.path.some((p: number[]) => Math.abs(p[1]) > 60)) return 'medium'
  if (route.traffic > 180) return 'medium'
  return 'low'
}

function calculateTransitTime(path: number[][]): number {
  const distance = calculateRouteDistance(path)
  const avgSpeed = 20 // knots
  const hours = distance / (avgSpeed * 1.852) // Convert to km/h
  return Math.round(hours / 24) // Return days
}

function calculateFuelCost(path: number[][], traffic: number): number {
  const distance = calculateRouteDistance(path)
  const fuelPerKm = 0.3 // Simplified fuel consumption
  const fuelPrice = 600 // USD per ton
  return Math.round(distance * fuelPerKm * fuelPrice * (traffic / 100))
}