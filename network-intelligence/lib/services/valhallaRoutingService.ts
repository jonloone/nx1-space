/**
 * Valhalla Routing Service
 *
 * Self-hosted routing engine for:
 * - Multi-modal routing (driving, walking, cycling)
 * - Isochrone generation (reachability analysis)
 * - Map matching (clean noisy GPS tracks)
 * - Time-distance matrices (bulk analysis)
 *
 * Features:
 * - Automatic fallback to Mapbox Directions API
 * - Support for offline/air-gapped deployments
 * - Cost savings (no API rate limits)
 * - Enhanced control over routing logic
 */

// Configuration
// Use API proxy when running in browser, direct connection when running on server
const VALHALLA_URL = typeof window !== 'undefined'
  ? '/api/routing' // Browser: use Next.js API proxy
  : (process.env.VALHALLA_URL || 'http://localhost:8002') // Server: direct connection

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

export type TransportMode = 'driving' | 'walking' | 'cycling'
export type CostingModel = 'auto' | 'pedestrian' | 'bicycle' | 'bus' | 'truck' | 'motor_scooter'

export interface RoutePoint {
  lat: number
  lng: number
  timestamp: Date
}

export interface Route {
  path: [number, number][] // [lng, lat] coordinates
  distance: number // meters
  duration: number // seconds
  waypoints: RoutePoint[] // Detailed tracking points
  summary?: string
}

export interface IsochroneOptions {
  center: [number, number] // [lng, lat]
  mode: TransportMode
  contours: number[] // Time contours in minutes (e.g., [15, 30, 45])
  polygons?: boolean // Return polygons (true) or lines (false)
  denoise?: number // Simplification tolerance (0-1)
}

export interface IsochroneContour {
  time: number // minutes
  geometry: {
    type: 'Polygon' | 'LineString'
    coordinates: [number, number][][] | [number, number][]
  }
  color?: string // Suggested color for visualization
}

export interface MapMatchOptions {
  coordinates: [number, number][] // [lng, lat] GPS trace points
  timestamps?: Date[] // Optional timestamps for each point
  mode: TransportMode
  accuracy?: number[] // GPS accuracy in meters for each point
}

export interface MapMatchResult {
  matched_points: Array<{
    lat: number
    lng: number
    edge_index: number
  }>
  confidence_score: number // 0-1
  matched_distance: number // meters
  original_distance: number // meters
}

/**
 * Check if Valhalla service is available
 */
async function isValhallaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    // When using API proxy, use GET endpoint for health check
    const checkUrl = typeof window !== 'undefined'
      ? VALHALLA_URL // API proxy GET endpoint
      : `${VALHALLA_URL}/status` // Direct Valhalla status endpoint

    const response = await fetch(checkUrl, {
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (response.ok && typeof window !== 'undefined') {
      // Parse API proxy response
      const data = await response.json()
      return data.available === true
    }

    return response.ok
  } catch (error) {
    console.warn('⚠️ Valhalla service unavailable, will use Mapbox fallback')
    return false
  }
}

/**
 * Convert mode to Valhalla costing model
 */
function modeToCostingModel(mode: TransportMode): CostingModel {
  const mapping: Record<TransportMode, CostingModel> = {
    driving: 'auto',
    walking: 'pedestrian',
    cycling: 'bicycle'
  }
  return mapping[mode]
}

/**
 * Convert mode to Mapbox profile (fallback)
 */
function modeToMapboxProfile(mode: TransportMode): string {
  const mapping: Record<TransportMode, string> = {
    driving: 'driving-traffic',
    walking: 'walking',
    cycling: 'cycling'
  }
  return mapping[mode]
}

/**
 * Generate route using Valhalla
 */
async function generateRouteValhalla(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
  startTime: Date
): Promise<Route> {
  const costing = modeToCostingModel(mode)

  const requestBody = {
    locations: [
      { lat: from[1], lon: from[0] },
      { lat: to[1], lon: to[0] }
    ],
    costing,
    directions_options: {
      units: 'kilometers'
    }
  }

  // When using API proxy (browser), POST to /api/routing
  // When using direct connection (server), POST to /route endpoint
  const routeUrl = typeof window !== 'undefined'
    ? VALHALLA_URL // API proxy handles /route internally
    : `${VALHALLA_URL}/route` // Direct Valhalla endpoint

  const response = await fetch(routeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Valhalla routing failed: ${response.status}`)
  }

  const data = await response.json()

  if (!data.trip || !data.trip.legs || data.trip.legs.length === 0) {
    throw new Error('No route found')
  }

  const leg = data.trip.legs[0]

  // Decode shape (encoded polyline)
  const path = decodePolyline(leg.shape)
  const distance = leg.summary.length * 1000 // Convert km to meters
  const duration = leg.summary.time // Already in seconds

  // Generate waypoints with timestamps
  const waypoints = generateWaypointsWithTiming(path, distance, duration, startTime, mode)

  return {
    path,
    distance,
    duration,
    waypoints,
    summary: leg.summary.narrative || `${mode} route`
  }
}

/**
 * Generate route using Mapbox (fallback)
 */
async function generateRouteMapbox(
  from: [number, number],
  to: [number, number],
  mode: TransportMode,
  startTime: Date
): Promise<Route> {
  const profile = modeToMapboxProfile(mode)
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Mapbox routing failed: ${response.status}`)
  }

  const data = await response.json()

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found')
  }

  const route = data.routes[0]
  const path = route.geometry.coordinates as [number, number][]
  const distance = route.distance
  const duration = route.duration

  const waypoints = generateWaypointsWithTiming(path, distance, duration, startTime, mode)

  return {
    path,
    distance,
    duration,
    waypoints,
    summary: `${mode} route via Mapbox`
  }
}

/**
 * Generate route (auto-selects Valhalla or Mapbox)
 */
export async function generateRoute(
  from: [number, number],
  to: [number, number],
  mode: TransportMode = 'driving',
  startTime: Date = new Date()
): Promise<Route> {
  const useValhalla = await isValhallaAvailable()

  try {
    if (useValhalla) {
      console.log('🗺️ Using Valhalla for routing')
      return await generateRouteValhalla(from, to, mode, startTime)
    } else {
      console.log('🗺️ Using Mapbox for routing (fallback)')
      return await generateRouteMapbox(from, to, mode, startTime)
    }
  } catch (error) {
    console.error('❌ Routing failed with primary method, trying fallback:', error)

    // Try fallback
    if (useValhalla) {
      console.log('🔄 Falling back to Mapbox')
      return await generateRouteMapbox(from, to, mode, startTime)
    } else {
      throw error
    }
  }
}

/**
 * Generate isochrone (reachability analysis)
 * Shows areas reachable within specified time thresholds
 */
export async function generateIsochrone(options: IsochroneOptions): Promise<IsochroneContour[]> {
  const useValhalla = await isValhallaAvailable()

  if (!useValhalla) {
    console.warn('⚠️ Isochrone generation requires Valhalla (not available via Mapbox fallback)')
    throw new Error('Isochrone generation requires Valhalla service')
  }

  const costing = modeToCostingModel(options.mode)

  const requestBody = {
    locations: [
      { lat: options.center[1], lon: options.center[0] }
    ],
    costing,
    contours: options.contours.map(minutes => ({
      time: minutes,
      color: getIsochroneColor(minutes)
    })),
    polygons: options.polygons !== false,
    denoise: options.denoise || 0.5
  }

  const response = await fetch(`${VALHALLA_URL}/isochrone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Valhalla isochrone failed: ${response.status}`)
  }

  const data = await response.json()

  // Convert GeoJSON features to our format
  return data.features.map((feature: any) => ({
    time: feature.properties.contour,
    geometry: feature.geometry,
    color: feature.properties.color
  }))
}

/**
 * Map matching - Clean noisy GPS tracks to actual roads
 */
export async function mapMatch(options: MapMatchOptions): Promise<MapMatchResult> {
  const useValhalla = await isValhallaAvailable()

  if (!useValhalla) {
    console.warn('⚠️ Map matching requires Valhalla (not available via Mapbox fallback)')
    throw new Error('Map matching requires Valhalla service')
  }

  const costing = modeToCostingModel(options.mode)

  // Build trace points with timestamps
  const shape = options.coordinates.map((coord, i) => ({
    lat: coord[1],
    lon: coord[0],
    time: options.timestamps?.[i]?.getTime() || Date.now() + i * 1000,
    accuracy: options.accuracy?.[i] || 10
  }))

  const requestBody = {
    shape,
    costing,
    shape_match: 'map_snap' // Snap to nearest road
  }

  const response = await fetch(`${VALHALLA_URL}/trace_attributes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Valhalla map matching failed: ${response.status}`)
  }

  const data = await response.json()

  // Parse matched points
  const matchedPoints = data.matched_points?.map((point: any) => ({
    lat: point.lat,
    lng: point.lon,
    edge_index: point.edge_index
  })) || []

  // Calculate confidence (based on distance between original and matched)
  const confidence = data.confidence_score || 0.9

  return {
    matched_points: matchedPoints,
    confidence_score: confidence,
    matched_distance: data.trip?.summary?.length * 1000 || 0,
    original_distance: calculateTotalDistance(options.coordinates)
  }
}

/**
 * Decode Valhalla polyline (encoded format)
 */
function decodePolyline(encoded: string, precision: number = 6): [number, number][] {
  const factor = Math.pow(10, precision)
  const coordinates: [number, number][] = []
  let lat = 0
  let lng = 0
  let index = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push([lng / factor, lat / factor])
  }

  return coordinates
}

/**
 * Generate waypoints with timestamps along route
 */
function generateWaypointsWithTiming(
  geometry: [number, number][],
  totalDistance: number,
  totalDuration: number,
  startTime: Date,
  mode: TransportMode
): RoutePoint[] {
  const waypoints: RoutePoint[] = []
  const targetInterval = 5 * 60 // 5 minutes
  const numPoints = Math.max(5, Math.ceil(totalDuration / targetInterval))

  const step = (geometry.length - 1) / (numPoints - 1)

  for (let i = 0; i < numPoints; i++) {
    const index = Math.min(Math.floor(i * step), geometry.length - 1)
    const [lng, lat] = geometry[index]
    const progress = i / (numPoints - 1)
    const timestamp = new Date(startTime.getTime() + progress * totalDuration * 1000)

    waypoints.push({ lat, lng, timestamp })
  }

  return waypoints
}

/**
 * Calculate total distance of a path
 */
function calculateTotalDistance(coordinates: [number, number][]): number {
  let distance = 0

  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1]
    const [lng2, lat2] = coordinates[i]
    distance += haversineDistance(lat1, lng1, lat2, lng2)
  }

  return distance
}

/**
 * Haversine distance calculation
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get isochrone color based on time threshold
 */
function getIsochroneColor(minutes: number): string {
  if (minutes <= 15) return '#10B981' // Green
  if (minutes <= 30) return '#F59E0B' // Orange
  if (minutes <= 45) return '#EF4444' // Red
  return '#7C3AED' // Purple
}

/**
 * Batch route generation with rate limiting
 */
export async function generateMultipleRoutes(
  routes: Array<{
    from: [number, number]
    to: [number, number]
    mode: TransportMode
    startTime: Date
  }>
): Promise<Route[]> {
  const results: Route[] = []

  // Valhalla has no rate limits, but add small delay for safety
  for (const route of routes) {
    const result = await generateRoute(
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

/**
 * Service health check
 */
export async function getServiceHealth(): Promise<{
  valhalla: boolean
  mapbox: boolean
  preferredService: 'valhalla' | 'mapbox'
}> {
  const valhallaAvailable = await isValhallaAvailable()

  return {
    valhalla: valhallaAvailable,
    mapbox: true, // Mapbox is always available as fallback
    preferredService: valhallaAvailable ? 'valhalla' : 'mapbox'
  }
}
