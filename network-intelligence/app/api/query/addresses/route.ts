/**
 * Address Query API
 *
 * Query NYC addresses from PMTiles by street, number, or bounds
 *
 * Examples:
 * - /api/query/addresses?street=Broadway&number=123
 * - /api/query/addresses?bounds=-74.01,40.71,-73.99,40.73
 * - /api/query/addresses?postcode=10019
 */

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { PMTiles } from 'pmtiles'
import { FileSource } from '@/lib/utils/pmtilesFileSource'
import VectorTile from '@mapbox/vector-tile'
import Protobuf from 'pbf'

const ADDRESSES_FILE = path.join(process.cwd(), 'public/tiles/addresses-nyc.pmtiles')

// NYC bounds
const NYC_BOUNDS = {
  minLng: -74.2591,
  maxLng: -73.7004,
  minLat: 40.4774,
  maxLat: 40.9176
}

interface AddressFeature {
  id: string
  address: string
  number: string
  street: string
  postcode: string
  unit: string
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
 * Decode MVT tile and extract address features
 */
function decodeAddressesTile(tileData: ArrayBuffer): AddressFeature[] {
  try {
    const tile = new VectorTile(new Protobuf(tileData))
    const layer = tile.layers['addresses']

    if (!layer) {
      return []
    }

    const features: AddressFeature[] = []

    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i)
      const geom = feature.loadGeometry()
      const props = feature.properties

      // Get coordinates (MVT coordinates are in tile space, need to convert)
      if (geom.length > 0 && geom[0].length > 0) {
        const point = geom[0][0]

        features.push({
          id: props.id || `addr_${i}`,
          address: props.address || '',
          number: props.number || '',
          street: props.street || '',
          postcode: props.postcode || '',
          unit: props.unit || '',
          lat: point.y, // These are tile coordinates, would need conversion for exact lat/lng
          lng: point.x
        })
      }
    }

    return features
  } catch (error) {
    console.error('Error decoding tile:', error)
    return []
  }
}

/**
 * GET /api/query/addresses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const street = searchParams.get('street')
    const number = searchParams.get('number')
    const postcode = searchParams.get('postcode')
    const boundsParam = searchParams.get('bounds')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    // Determine search bounds
    let searchBounds = NYC_BOUNDS

    if (boundsParam) {
      const [minLng, minLat, maxLng, maxLat] = boundsParam.split(',').map(Number)
      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        searchBounds = { minLng, minLat, maxLng, maxLat }
      }
    }

    // Open PMTiles file
    const fileSource = new FileSource(ADDRESSES_FILE)
    const pmtiles = new PMTiles(fileSource)

    // Get metadata to determine optimal zoom level
    const header = await pmtiles.getHeader()
    const searchZoom = Math.min(header.maxZoom || 14, 14) // Use zoom 14 for address searches

    console.log(`[Address Query] Searching at zoom ${searchZoom}`)

    // Get tiles for search area
    const tiles = getTilesForBounds(searchBounds, searchZoom)
    console.log(`[Address Query] Need to query ${tiles.length} tiles`)

    // Limit tiles to avoid timeout
    const tilesToQuery = tiles.slice(0, 50)

    // Query tiles and collect features
    const allFeatures: AddressFeature[] = []

    for (const { x, y, z } of tilesToQuery) {
      try {
        const tile = await pmtiles.getZxy(z, x, y)
        if (tile) {
          const features = decodeAddressesTile(tile.data)
          allFeatures.push(...features)
        }
      } catch (error) {
        console.error(`Error querying tile ${z}/${x}/${y}:`, error)
      }
    }

    console.log(`[Address Query] Found ${allFeatures.length} raw features`)

    // Filter features based on query parameters
    let filtered = allFeatures

    if (street) {
      const streetLower = street.toLowerCase()
      filtered = filtered.filter(f =>
        f.street.toLowerCase().includes(streetLower) ||
        f.address.toLowerCase().includes(streetLower)
      )
    }

    if (number) {
      filtered = filtered.filter(f => f.number === number)
    }

    if (postcode) {
      filtered = filtered.filter(f => f.postcode === postcode)
    }

    // Apply limit
    const results = filtered.slice(0, limit)

    console.log(`[Address Query] Returning ${results.length} results`)

    return NextResponse.json({
      results,
      total: filtered.length,
      searched_tiles: tilesToQuery.length,
      query: {
        street,
        number,
        postcode,
        bounds: searchBounds
      }
    })

  } catch (error) {
    console.error('Error querying addresses:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
