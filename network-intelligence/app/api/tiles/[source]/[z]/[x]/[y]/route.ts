/**
 * PMTiles Tile Server API Route
 * Serves individual vector tiles from PMTiles archives
 *
 * Route: /api/tiles/[source]/[z]/[x]/[y]
 * Example: /api/tiles/places/6/10/24.pbf
 */

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { PMTiles, TileType } from 'pmtiles'
import { FileSource } from '@/lib/utils/pmtilesFileSource'

// Cache PMTiles instances to avoid reopening files
const pmtilesCache = new Map<string, PMTiles>()

// Map source names to file paths
const SOURCE_FILES: Record<string, string> = {
  places: path.join(process.cwd(), 'public/tiles/places-global.pmtiles'),
  buildings: path.join(process.cwd(), 'public/tiles/buildings-usa.pmtiles'),
  addresses: path.join(process.cwd(), 'public/tiles/addresses-nyc.pmtiles'),
  transportation: path.join(process.cwd(), 'public/tiles/transportation-usa.pmtiles'),
  water: path.join(process.cwd(), 'public/tiles/water-usa.pmtiles'),
  boundaries: path.join(process.cwd(), 'public/tiles/boundaries-usa.pmtiles')
}

// Map tile types to content-type headers
const TILE_TYPE_HEADERS: Record<TileType, string> = {
  [TileType.Mvt]: 'application/vnd.mapbox-vector-tile',
  [TileType.Png]: 'image/png',
  [TileType.Jpeg]: 'image/jpeg',
  [TileType.Webp]: 'image/webp',
  [TileType.Avif]: 'image/avif',
  [TileType.Unknown]: 'application/octet-stream'
}

/**
 * Get or create cached PMTiles instance
 */
function getPMTilesInstance(source: string): PMTiles | null {
  const filePath = SOURCE_FILES[source]
  if (!filePath) {
    return null
  }

  // Check cache
  if (pmtilesCache.has(source)) {
    return pmtilesCache.get(source)!
  }

  try {
    // Create new instance with FileSource
    console.log(`[PMTiles] Opening file for ${source}: ${filePath}`)
    const fileSource = new FileSource(filePath)
    const pmtiles = new PMTiles(fileSource)

    // Log metadata
    pmtiles.getMetadata().then(metadata => {
      console.log(`[PMTiles] ${source} metadata:`, JSON.stringify(metadata))
    }).catch(err => {
      console.error(`[PMTiles] Failed to get metadata for ${source}:`, err)
    })

    // Cache it
    pmtilesCache.set(source, pmtiles)

    return pmtiles
  } catch (error) {
    console.error(`Failed to open PMTiles file for ${source}:`, error)
    return null
  }
}

/**
 * GET /api/tiles/[source]/[z]/[x]/[y]
 * Serves a single tile from the PMTiles archive
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { source: string; z: string; x: string; y: string } }
) {
  try {
    const { source, z, x, y } = params

    // Remove file extension from y parameter (e.g., "24.pbf" -> "24")
    const yCoord = y.split('.')[0]

    // Validate parameters
    const zNum = Number(z)
    const xNum = Number(x)
    const yNum = Number(yCoord)

    if (isNaN(zNum) || isNaN(xNum) || isNaN(yNum)) {
      return NextResponse.json(
        { error: 'Invalid tile coordinates' },
        { status: 400 }
      )
    }

    // Get PMTiles instance
    const pmtiles = getPMTilesInstance(source)
    if (!pmtiles) {
      return NextResponse.json(
        { error: `Unknown source: ${source}` },
        { status: 404 }
      )
    }

    // Fetch tile data
    console.log(`[PMTiles] Requesting tile: ${source} z=${zNum} x=${xNum} y=${yNum}`)
    const tile = await pmtiles.getZxy(zNum, xNum, yNum)

    if (!tile) {
      // Tile doesn't exist (empty tile or out of bounds)
      console.log(`[PMTiles] No tile found for: ${source} z=${zNum} x=${xNum} y=${yNum}`)
      return new NextResponse(null, { status: 204 })
    }

    console.log(`[PMTiles] Tile found: ${source} z=${zNum} x=${xNum} y=${yNum}, size=${tile.data.byteLength} bytes`)

    // Get header to determine tile type
    const header = await pmtiles.getHeader()
    const contentType = TILE_TYPE_HEADERS[header.tileType] || 'application/octet-stream'

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(tile.data)

    // Return tile with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Encoding': header.tileCompression === 1 ? 'gzip' : 'identity',
        'Cache-Control': 'public, max-age=31536000', // Cache tiles for 1 year
        'Access-Control-Allow-Origin': '*' // Allow CORS
      }
    })
  } catch (error) {
    console.error('Error serving tile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
