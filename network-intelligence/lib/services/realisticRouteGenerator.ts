/**
 * Realistic Route Generator
 *
 * Generates realistic routes that follow actual roads using Valhalla (self-hosted)
 * with automatic fallback to Mapbox Directions API if Valhalla is unavailable.
 *
 * Features:
 * - Snap routes to actual road network via Valhalla routing engine
 * - Automatic fallback to Mapbox when Valhalla unavailable
 * - Realistic travel times and distances
 * - Support for walking, driving, cycling
 * - Waypoint generation for detailed tracking
 * - Cost savings (no API rate limits with Valhalla)
 */

import { generateRoute as generateRouteValhalla } from './valhallaRoutingService'

export interface RoutePoint {
  lat: number
  lng: number
  timestamp: Date
}

export interface RealisticRoute {
  path: [number, number][] // [lng, lat] coordinates following actual roads
  distance: number // meters
  duration: number // seconds
  waypoints: RoutePoint[] // Detailed tracking points along route
}

export type TransportMode = 'driving' | 'walking' | 'cycling'

/**
 * Generate realistic route using Valhalla (with automatic Mapbox fallback)
 */
export async function generateRealisticRoute(
  from: [number, number], // [lng, lat]
  to: [number, number],
  mode: TransportMode = 'driving',
  startTime: Date
): Promise<RealisticRoute> {
  try {
    // Use Valhalla service (automatically falls back to Mapbox if Valhalla unavailable)
    const route = await generateRouteValhalla(from, to, mode, startTime)

    return {
      path: route.path,
      distance: route.distance,
      duration: route.duration,
      waypoints: route.waypoints
    }
  } catch (error) {
    console.warn('⚠️ Routing service failed, using geometric fallback:', error)

    // Final fallback to geometric interpolation
    return generateFallbackRoute(from, to, mode, startTime)
  }
}

/**
 * Generate waypoints with realistic timing along a route
 */
function generateWaypointsWithTiming(
  geometry: [number, number][],
  totalDistance: number,
  totalDuration: number,
  startTime: Date,
  mode: TransportMode
): RoutePoint[] {
  const waypoints: RoutePoint[] = []

  // Target: ~1 point every 5 minutes of travel
  const targetInterval = 5 * 60 // 5 minutes in seconds
  const numPoints = Math.max(5, Math.ceil(totalDuration / targetInterval))

  // If geometry has fewer points than needed, interpolate
  if (geometry.length < numPoints) {
    // Interpolate additional points
    const interpolatedGeometry: [number, number][] = []
    const step = (geometry.length - 1) / (numPoints - 1)

    for (let i = 0; i < numPoints; i++) {
      const index = i * step
      const lowerIndex = Math.floor(index)
      const upperIndex = Math.ceil(index)
      const fraction = index - lowerIndex

      if (upperIndex >= geometry.length) {
        interpolatedGeometry.push(geometry[geometry.length - 1])
      } else if (fraction === 0) {
        interpolatedGeometry.push(geometry[lowerIndex])
      } else {
        // Linear interpolation
        const [lng1, lat1] = geometry[lowerIndex]
        const [lng2, lat2] = geometry[upperIndex]
        interpolatedGeometry.push([
          lng1 + (lng2 - lng1) * fraction,
          lat1 + (lat2 - lat1) * fraction
        ])
      }
    }

    // Use interpolated geometry
    for (let i = 0; i < interpolatedGeometry.length; i++) {
      const [lng, lat] = interpolatedGeometry[i]
      const progress = i / (interpolatedGeometry.length - 1)
      const timestamp = new Date(startTime.getTime() + progress * totalDuration * 1000)

      waypoints.push({ lat, lng, timestamp })
    }
  } else {
    // Sample from existing geometry
    const samplingRate = Math.floor(geometry.length / numPoints)

    for (let i = 0; i < geometry.length; i += samplingRate) {
      const [lng, lat] = geometry[i]
      const progress = i / (geometry.length - 1)
      const timestamp = new Date(startTime.getTime() + progress * totalDuration * 1000)

      waypoints.push({ lat, lng, timestamp })
    }

    // Ensure last point is included
    if (waypoints[waypoints.length - 1]?.lng !== geometry[geometry.length - 1][0]) {
      const [lng, lat] = geometry[geometry.length - 1]
      const timestamp = new Date(startTime.getTime() + totalDuration * 1000)
      waypoints.push({ lat, lng, timestamp })
    }
  }

  return waypoints
}

/**
 * Fallback route generator using geometric interpolation
 */
function generateFallbackRoute(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
  startTime: Date
): RealisticRoute {
  // Calculate straight-line distance (Haversine formula)
  const R = 6371000 // Earth radius in meters
  const lat1 = from[1] * Math.PI / 180
  const lat2 = to[1] * Math.PI / 180
  const deltaLat = (to[1] - from[1]) * Math.PI / 180
  const deltaLng = (to[0] - from[0]) * Math.PI / 180

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Estimate duration based on mode
  // Driving: ~30 km/h in city, Walking: ~5 km/h, Cycling: ~15 km/h
  const speeds = {
    driving: 30 / 3.6, // m/s
    walking: 5 / 3.6,
    cycling: 15 / 3.6
  }
  const duration = distance / speeds[mode]

  // Generate path with intermediate waypoints (adding some curvature for realism)
  const numIntermediatePoints = Math.max(5, Math.ceil(duration / 300)) // Point every 5 minutes
  const path: [number, number][] = []

  for (let i = 0; i <= numIntermediatePoints; i++) {
    const t = i / numIntermediatePoints
    // Add some jitter to simulate road curves
    const jitterLng = (Math.random() - 0.5) * 0.002 * (1 - Math.abs(t - 0.5) * 2) // Peak jitter at midpoint
    const jitterLat = (Math.random() - 0.5) * 0.002 * (1 - Math.abs(t - 0.5) * 2)

    path.push([
      from[0] + (to[0] - from[0]) * t + jitterLng,
      from[1] + (to[1] - from[1]) * t + jitterLat
    ])
  }

  // Generate waypoints with timestamps
  const waypoints: RoutePoint[] = path.map((coord, i) => ({
    lng: coord[0],
    lat: coord[1],
    timestamp: new Date(startTime.getTime() + (duration * 1000 * i) / path.length)
  }))

  return {
    path,
    distance,
    duration,
    waypoints
  }
}

/**
 * Generate multiple routes in batch (useful for demo data generation)
 * Valhalla has no rate limits, but we add small delays for safety
 */
export async function generateMultipleRoutes(
  routes: Array<{
    from: [number, number]
    to: [number, number]
    mode: TransportMode
    startTime: Date
  }>
): Promise<RealisticRoute[]> {
  const results: RealisticRoute[] = []

  // Process routes sequentially
  for (const route of routes) {
    const result = await generateRealisticRoute(
      route.from,
      route.to,
      route.mode,
      route.startTime
    )
    results.push(result)

    // Small delay to avoid overwhelming the service
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  return results
}
