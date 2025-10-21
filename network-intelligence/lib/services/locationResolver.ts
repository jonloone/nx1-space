/**
 * Location Resolver Service
 * Resolves natural language location names to coordinates
 *
 * Priority:
 * 1. Known landmarks (Central Park, Times Square, etc.)
 * 2. GERS demo places (cities, ports, hospitals, etc.)
 * 3. Overture Places cache (future)
 * 4. Geocoding API (future)
 */

import { getGERSDemoService, type GERSPlace, type LevelOfDetail } from './gersDemoService'

export interface ResolvedLocation {
  name: string
  coordinates: [number, number]
  type: 'landmark' | 'place' | 'city' | 'state' | 'country' | 'neighborhood'
  confidence: number
  bbox?: [number, number, number, number] // [west, south, east, north]
  suggestedZoom: number
  source: 'known' | 'gers' | 'overture' | 'geocoding'
}

/**
 * Well-known locations and landmarks
 * These take priority over search results for accuracy
 */
const KNOWN_LOCATIONS = new Map<string, Omit<ResolvedLocation, 'source'>>([
  // NYC Landmarks
  ['central park', {
    name: 'Central Park',
    coordinates: [-73.9654, 40.7829],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 15,
    bbox: [-73.9812, 40.7641, -73.9496, 40.8006]
  }],
  ['times square', {
    name: 'Times Square',
    coordinates: [-73.9855, 40.7580],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 16,
    bbox: [-73.9875, 40.7570, -73.9835, 40.7590]
  }],
  ['empire state building', {
    name: 'Empire State Building',
    coordinates: [-73.9857, 40.7484],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 17
  }],
  ['brooklyn bridge', {
    name: 'Brooklyn Bridge',
    coordinates: [-73.9969, 40.7061],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 16
  }],
  ['statue of liberty', {
    name: 'Statue of Liberty',
    coordinates: [-74.0445, 40.6892],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 16
  }],

  // NYC Neighborhoods
  ['manhattan', {
    name: 'Manhattan',
    coordinates: [-73.9712, 40.7831],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 13,
    bbox: [-74.0479, 40.6829, -73.9067, 40.8820]
  }],
  ['brooklyn', {
    name: 'Brooklyn',
    coordinates: [-73.9442, 40.6782],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 13,
    bbox: [-74.0421, 40.5707, -73.8334, 40.7395]
  }],
  ['queens', {
    name: 'Queens',
    coordinates: [-73.7949, 40.7282],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 13,
    bbox: [-73.9626, 40.5431, -73.7004, 40.8007]
  }],
  ['downtown manhattan', {
    name: 'Downtown Manhattan',
    coordinates: [-74.0060, 40.7128],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],
  ['midtown manhattan', {
    name: 'Midtown Manhattan',
    coordinates: [-73.9772, 40.7549],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],

  // LA Landmarks
  ['hollywood sign', {
    name: 'Hollywood Sign',
    coordinates: [-118.3215, 34.1341],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 16
  }],
  ['santa monica pier', {
    name: 'Santa Monica Pier',
    coordinates: [-118.4973, 34.0094],
    type: 'landmark',
    confidence: 1.0,
    suggestedZoom: 16
  }],
  ['downtown los angeles', {
    name: 'Downtown Los Angeles',
    coordinates: [-118.2437, 34.0522],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14,
    bbox: [-118.2800, 34.0200, -118.2100, 34.0800]
  }],
  ['downtown la', {
    name: 'Downtown Los Angeles',
    coordinates: [-118.2437, 34.0522],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],

  // Major Cities
  ['chicago', {
    name: 'Chicago',
    coordinates: [-87.6298, 41.8781],
    type: 'city',
    confidence: 1.0,
    suggestedZoom: 12
  }],
  ['downtown chicago', {
    name: 'Downtown Chicago',
    coordinates: [-87.6298, 41.8781],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],
  ['houston', {
    name: 'Houston',
    coordinates: [-95.3698, 29.7604],
    type: 'city',
    confidence: 1.0,
    suggestedZoom: 12
  }],
  ['downtown houston', {
    name: 'Downtown Houston',
    coordinates: [-95.3698, 29.7604],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],
  ['downtown miami', {
    name: 'Downtown Miami',
    coordinates: [-80.1918, 25.7617],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],
  ['downtown seattle', {
    name: 'Downtown Seattle',
    coordinates: [-122.3321, 47.6062],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],
  ['downtown san francisco', {
    name: 'Downtown San Francisco',
    coordinates: [-122.4194, 37.7749],
    type: 'neighborhood',
    confidence: 1.0,
    suggestedZoom: 14
  }],

  // Generic terms
  ['here', {
    name: 'Current Location',
    coordinates: [-118.2437, 34.0522], // Default to LA
    type: 'neighborhood',
    confidence: 0.5,
    suggestedZoom: 14
  }]
])

/**
 * Category aliases for natural language mapping
 */
export const CATEGORY_ALIASES: Record<string, string[]> = {
  'coffee shop': ['coffee_shop', 'cafe'],
  'coffee shops': ['coffee_shop', 'cafe'],
  'cafe': ['coffee_shop', 'cafe'],
  'cafes': ['coffee_shop', 'cafe'],

  'hospital': ['hospital', 'emergency_room', 'clinic'],
  'hospitals': ['hospital', 'emergency_room', 'clinic'],
  'clinic': ['clinic', 'hospital'],
  'clinics': ['clinic', 'hospital'],

  'restaurant': ['restaurant', 'fast_food', 'cafe'],
  'restaurants': ['restaurant', 'fast_food', 'cafe'],
  'food': ['restaurant', 'fast_food', 'cafe'],

  'gas station': ['gas_station', 'fuel'],
  'gas stations': ['gas_station', 'fuel'],
  'fuel station': ['gas_station', 'fuel'],

  'port': ['port', 'seaport', 'marine_terminal'],
  'ports': ['port', 'seaport', 'marine_terminal'],
  'seaport': ['port', 'seaport', 'marine_terminal'],

  'warehouse': ['warehouse', 'logistics_facility', 'distribution_center'],
  'warehouses': ['warehouse', 'logistics_facility', 'distribution_center'],
  'distribution center': ['warehouse', 'logistics_facility', 'distribution_center'],

  'airport': ['airport'],
  'airports': ['airport'],

  'school': ['school', 'university', 'college'],
  'schools': ['school', 'university', 'college'],
  'university': ['university', 'college'],
  'universities': ['university', 'college'],

  'police': ['police_station'],
  'police station': ['police_station'],
  'fire station': ['fire_station'],
  'emergency': ['emergency_room', 'fire_station', 'police_station'],

  'hotel': ['hotel', 'accommodation'],
  'hotels': ['hotel', 'accommodation'],

  'park': ['park', 'national_park'],
  'parks': ['park', 'national_park'],

  'museum': ['museum'],
  'museums': ['museum'],
  'theater': ['theater', 'stadium', 'arena'],
  'stadium': ['stadium', 'arena']
}

export class LocationResolverService {
  private gersService = getGERSDemoService()

  /**
   * Resolve location name to coordinates
   */
  async resolveLocation(locationName: string): Promise<ResolvedLocation | null> {
    if (!locationName || locationName.trim() === '') {
      return null
    }

    const normalized = locationName.toLowerCase().trim()

    // 1. Check known landmarks and locations (highest priority)
    const known = KNOWN_LOCATIONS.get(normalized)
    if (known) {
      console.log(`✅ Resolved "${locationName}" from known locations`)
      return { ...known, source: 'known' }
    }

    // 2. Search GERS demo places
    const places = await this.gersService.search({
      text: locationName,
      limit: 5
    })

    if (places.length > 0) {
      const place = places[0]
      console.log(`✅ Resolved "${locationName}" from GERS: ${place.name}`)
      return {
        name: place.name,
        coordinates: place.location.coordinates,
        type: place.levelOfDetail,
        confidence: 0.8,
        suggestedZoom: this.getZoomForLoD(place.levelOfDetail),
        source: 'gers'
      }
    }

    // 3. Try partial match on known locations
    for (const [key, value] of KNOWN_LOCATIONS.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        console.log(`✅ Resolved "${locationName}" via partial match: ${key}`)
        return { ...value, source: 'known', confidence: 0.7 }
      }
    }

    console.warn(`⚠️ Could not resolve location: "${locationName}"`)
    return null
  }

  /**
   * Get suggested zoom level for Level of Detail
   */
  getZoomForLoD(lod: LevelOfDetail): number {
    const zoomMap: Record<LevelOfDetail, number> = {
      'landmark': 17,
      'place': 15,
      'city': 12,
      'state': 7,
      'country': 5
    }
    return zoomMap[lod] || 14
  }

  /**
   * Resolve category alias to GERS categories
   */
  resolveCategory(categoryAlias: string): string[] {
    const normalized = categoryAlias.toLowerCase().trim()
    return CATEGORY_ALIASES[normalized] || [normalized]
  }

  /**
   * Extract location and categories from natural language query
   * Example: "coffee shops near Central Park" → { location: "Central Park", categories: ["coffee_shop", "cafe"] }
   */
  parseQuery(query: string): {
    location?: string
    categories: string[]
    radius?: number
    nearby?: boolean
  } {
    const normalized = query.toLowerCase()

    // Extract location (after "near", "in", "at", "around")
    let location: string | undefined
    const locationMatches = normalized.match(/(?:near|in|at|around|by)\s+(.+?)(?:\s+within|\s+radius|$)/i)
    if (locationMatches) {
      location = locationMatches[1].trim()
    }

    // Extract categories (before "near/in/at")
    const categories: string[] = []
    Object.keys(CATEGORY_ALIASES).forEach(alias => {
      if (normalized.includes(alias)) {
        categories.push(...CATEGORY_ALIASES[alias])
      }
    })

    // Check for "nearby" or "around here"
    const nearby = normalized.includes('nearby') || normalized.includes('around here')

    // Extract radius (e.g., "within 5km", "within 1 mile")
    let radius: number | undefined
    const radiusMatch = normalized.match(/within\s+(\d+)\s*(km|kilometer|mile|m|meter)/i)
    if (radiusMatch) {
      const value = parseInt(radiusMatch[1])
      const unit = radiusMatch[2].toLowerCase()
      if (unit.startsWith('km') || unit.startsWith('kilometer')) {
        radius = value * 1000
      } else if (unit.startsWith('mi')) {
        radius = value * 1609.34
      } else {
        radius = value
      }
    }

    return {
      location: location || (nearby ? 'here' : undefined),
      categories: [...new Set(categories)], // Remove duplicates
      radius,
      nearby
    }
  }

  /**
   * Get all known locations (for testing/debugging)
   */
  getKnownLocations(): string[] {
    return Array.from(KNOWN_LOCATIONS.keys())
  }

  /**
   * Check if location is in known locations
   */
  isKnownLocation(locationName: string): boolean {
    return KNOWN_LOCATIONS.has(locationName.toLowerCase().trim())
  }
}

// Singleton instance
let serviceInstance: LocationResolverService | null = null

export function getLocationResolverService(): LocationResolverService {
  if (!serviceInstance) {
    serviceInstance = new LocationResolverService()
  }
  return serviceInstance
}
