/**
 * Places Query API
 *
 * Query POI places from PMTiles by category, name, or bounds
 *
 * Examples:
 * - /api/query/places?category=hospital
 * - /api/query/places?name=LaGuardia
 * - /api/query/places?bounds=-74.01,40.71,-73.99,40.73
 * - /api/query/places?lat=40.7589&lng=-73.9851&radius=1000
 */

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { PMTiles } from 'pmtiles'
import { FileSource } from '@/lib/utils/pmtilesFileSource'
import VectorTile from '@mapbox/vector-tile'
import Protobuf from 'pbf'

const PLACES_FILE = path.join(process.cwd(), 'public/tiles/places-global.pmtiles')

interface PlaceFeature {
  id: string
  name: string
  category: string
  confidence: number
  lat: number
  lng: number
}

/**
 * Convert lng/lat to tile coordinates at given zoom
 */
function lngLatToTile(lng: number, lat: number, zoom: number) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom))
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
  return { x, y, z: zoom }
}

/**
 * Get tiles covering a bounding box
 */
function getTilesForBounds(bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }, zoom: number) {
  const topLeft = lngLatToTile(bounds.minLng, bounds.maxLat, zoom)
  const bottomRight = lngLatToTile(bounds.maxLng, bounds.minLat, zoom)

  const tiles = []
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom })
    }
  }
  return tiles
}

/**
 * Calculate distance between two points in meters (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Decode MVT tile and extract place features
 */
function decodePlacesTile(tileData: ArrayBuffer): PlaceFeature[] {
  try {
    const tile = new VectorTile(new Protobuf(tileData))
    const layer = tile.layers['places']

    if (!layer) {
      return []
    }

    const features: PlaceFeature[] = []

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i)
      const geom = feature.loadGeometry()
      const props = feature.properties

      // Get coordinates
      if (geom.length > 0 && geom[0].length > 0) {
        const point = geom[0][0]

        features.push({
          id: props.id || `place_${i}`,
          name: props.name || 'Unknown',
          category: props.category || 'unknown',
          confidence: props.confidence || 0,
          lat: point.y,
          lng: point.x
        })
      }
    }

    return features
  } catch (error) {
    console.error('Error decoding places tile:', error)
    return []
  }
}

/**
 * GET /api/query/places
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const name = searchParams.get('name')
    const category = searchParams.get('category')
    const boundsParam = searchParams.get('bounds')
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 1000 // default 1km
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    // Determine search bounds
    let searchBounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }

    if (lat !== null && lng !== null && radius) {
      // Create bounds from radius around point
      const kmRadius = radius / 1000
      const latDelta = kmRadius / 111 // 1 degree latitude ≈ 111 km
      const lngDelta = kmRadius / (111 * Math.cos(lat * Math.PI / 180))

      searchBounds = {
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
        minLat: lat - latDelta,
        maxLat: lat + latDelta
      }
    } else if (boundsParam) {
      const [minLng, minLat, maxLng, maxLat] = boundsParam.split(',').map(Number)
      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        searchBounds = { minLng, minLat, maxLng, maxLat }
      } else {
        return NextResponse.json(
          { error: 'Invalid bounds parameter' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Must provide either bounds or lat/lng with radius' },
        { status: 400 }
      )
    }

    // Open PMTiles file
    const fileSource = new FileSource(PLACES_FILE)
    const pmtiles = new PMTiles(fileSource)

    // Get metadata to determine optimal zoom level
    const header = await pmtiles.getHeader()
    const searchZoom = Math.min(header.maxZoom || 10, 10)

    console.log(`[Places Query] Searching at zoom ${searchZoom}`)

    // Get tiles for search area
    const tiles = getTilesForBounds(searchBounds, searchZoom)
    console.log(`[Places Query] Need to query ${tiles.length} tiles`)

    // Limit tiles to avoid timeout
    const tilesToQuery = tiles.slice(0, 20)

    // Query tiles and collect features
    const allFeatures: PlaceFeature[] = []

    for (const { x, y, z } of tilesToQuery) {
      try {
        const tile = await pmtiles.getZxy(z, x, y)
        if (tile) {
          const features = decodePlacesTile(tile.data)
          allFeatures.push(...features)
        }
      } catch (error) {
        console.error(`Error querying tile ${z}/${x}/${y}:`, error)
      }
    }

    console.log(`[Places Query] Found ${allFeatures.length} raw features`)

    // Filter features based on query parameters
    let filtered = allFeatures

    if (name) {
      const nameLower = name.toLowerCase()
      filtered = filtered.filter(f => f.name.toLowerCase().includes(nameLower))
    }

    if (category) {
      const categoryLower = category.toLowerCase()
      filtered = filtered.filter(f => f.category.toLowerCase() === categoryLower)
    }

    // Filter by radius if lat/lng provided
    if (lat !== null && lng !== null && radius) {
      filtered = filtered.filter(f => {
        const distance = calculateDistance(lat, lng, f.lat, f.lng)
        return distance <= radius
      })
    }

    // Apply limit
    const results = filtered.slice(0, limit)

    console.log(`[Places Query] Returning ${results.length} results`)

    return NextResponse.json({
      results,
      total: filtered.length,
      searched_tiles: tilesToQuery.length,
      query: {
        name,
        category,
        lat,
        lng,
        radius,
        bounds: searchBounds
      }
    })

  } catch (error) {
    console.error('Error querying places:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
