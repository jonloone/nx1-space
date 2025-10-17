/**
 * Spatial Grid Utilities
 * Quadkey-based spatial indexing for fast location queries
 *
 * Uses Bing Maps tile system for efficient spatial lookups
 * https://docs.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system
 */

export interface Tile {
  x: number
  y: number
  z: number
}

/**
 * Convert lat/lon to tile coordinates at given zoom level
 */
export function latLonToTile(lat: number, lon: number, zoom: number): Tile {
  const latRad = (lat * Math.PI) / 180
  const n = Math.pow(2, zoom)

  const x = Math.floor(((lon + 180) / 360) * n)
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )

  return { x, y, z: zoom }
}

/**
 * Convert tile coordinates to quadkey string
 * Quadkey is a string representation of tile coordinates
 * Each character represents a quadrant at each zoom level
 */
export function tileToQuadkey(tile: Tile): string {
  let quadkey = ''

  for (let i = tile.z; i > 0; i--) {
    let digit = 0
    const mask = 1 << (i - 1)

    if ((tile.x & mask) !== 0) digit++
    if ((tile.y & mask) !== 0) digit += 2

    quadkey += digit.toString()
  }

  return quadkey
}

/**
 * Convert lat/lon directly to quadkey (convenience function)
 */
export function toQuadkey(lat: number, lon: number, zoom: number): string {
  const tile = latLonToTile(lat, lon, zoom)
  return tileToQuadkey(tile)
}

/**
 * Convert quadkey back to tile coordinates
 */
export function quadkeyToTile(quadkey: string): Tile {
  const zoom = quadkey.length
  let x = 0
  let y = 0

  for (let i = zoom; i > 0; i--) {
    const mask = 1 << (i - 1)
    const digit = parseInt(quadkey[zoom - i])

    if ((digit & 1) !== 0) x |= mask
    if ((digit & 2) !== 0) y |= mask
  }

  return { x, y, z: zoom }
}

/**
 * Get all neighboring quadkeys (8 surrounding tiles)
 */
export function getNeighborQuadkeys(quadkey: string): string[] {
  const tile = quadkeyToTile(quadkey)
  const neighbors: string[] = []

  // 8 surrounding tiles
  const offsets = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1]
  ]

  for (const [dx, dy] of offsets) {
    const neighborTile: Tile = {
      x: tile.x + dx,
      y: tile.y + dy,
      z: tile.z
    }

    // Check if tile is valid at this zoom level
    const maxTile = Math.pow(2, tile.z)
    if (
      neighborTile.x >= 0 &&
      neighborTile.x < maxTile &&
      neighborTile.y >= 0 &&
      neighborTile.y < maxTile
    ) {
      neighbors.push(tileToQuadkey(neighborTile))
    }
  }

  return neighbors
}

/**
 * Get quadkey bounds (lat/lon bounding box)
 */
export function quadkeyToBounds(quadkey: string): {
  north: number
  south: number
  east: number
  west: number
} {
  const tile = quadkeyToTile(quadkey)
  const n = Math.pow(2, tile.z)

  const lonWest = (tile.x / n) * 360 - 180
  const lonEast = ((tile.x + 1) / n) * 360 - 180

  const latNorth = Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) * (180 / Math.PI)
  const latSouth =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * (tile.y + 1)) / n))) * (180 / Math.PI)

  return {
    north: latNorth,
    south: latSouth,
    east: lonEast,
    west: lonWest
  }
}

/**
 * Get all quadkeys that cover a bounding box
 * Useful for querying all tiles in a viewport
 */
export function getQuadkeysInBounds(
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number
): string[] {
  const quadkeys = new Set<string>()

  // Get corner tiles
  const nwTile = latLonToTile(bounds.north, bounds.west, zoom)
  const seTile = latLonToTile(bounds.south, bounds.east, zoom)

  // Iterate over all tiles in the bounding box
  for (let x = nwTile.x; x <= seTile.x; x++) {
    for (let y = nwTile.y; y <= seTile.y; y++) {
      const tile: Tile = { x, y, z: zoom }
      quadkeys.add(tileToQuadkey(tile))
    }
  }

  return Array.from(quadkeys)
}

/**
 * Calculate distance between two quadkeys (Haversine formula)
 */
export function quadkeyDistance(quadkey1: string, quadkey2: string): number {
  const bounds1 = quadkeyToBounds(quadkey1)
  const bounds2 = quadkeyToBounds(quadkey2)

  // Use center points
  const lat1 = (bounds1.north + bounds1.south) / 2
  const lon1 = (bounds1.east + bounds1.west) / 2
  const lat2 = (bounds2.north + bounds2.south) / 2
  const lon2 = (bounds2.east + bounds2.west) / 2

  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

/**
 * Get quadkeys within a radius of a center quadkey
 * Useful for proximity searches
 */
export function getQuadkeysWithinRadius(
  centerQuadkey: string,
  radiusKm: number
): string[] {
  const result: string[] = [centerQuadkey]
  const visited = new Set<string>([centerQuadkey])
  const queue = [centerQuadkey]

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = getNeighborQuadkeys(current)

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)

        const distance = quadkeyDistance(centerQuadkey, neighbor)
        if (distance <= radiusKm) {
          result.push(neighbor)
          queue.push(neighbor)
        }
      }
    }
  }

  return result
}
