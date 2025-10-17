/**
 * POI Context Service
 *
 * Enriches investigation locations with nearby Points of Interest from Overture Maps.
 * Provides geographic context for location analysis.
 */

export interface POIContext {
  id: string
  name: string
  category: string
  distance: number // meters
  bearing: string // N, NE, E, SE, S, SW, W, NW
  lat: number
  lng: number
}

export interface LocationContext {
  location: {
    name: string
    lat: number
    lng: number
  }
  nearbyPOIs: POIContext[]
  contextSummary: string
  significantPOIs: POIContext[] // Airports, hospitals, government buildings
}

/**
 * POI Context Service
 */
export class POIContextService {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? '' : 'http://localhost:3000')
  }

  /**
   * Get nearby POIs for a location
   */
  async getNearbyPOIs(lat: number, lng: number, radiusMeters: number = 1000, limit: number = 20): Promise<POIContext[]> {
    try {
      // Build URL with proper base
      const baseUrl = this.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
      const url = new URL('/api/query/places', baseUrl)
      url.searchParams.set('lat', lat.toString())
      url.searchParams.set('lng', lng.toString())
      url.searchParams.set('radius', radiusMeters.toString())
      url.searchParams.set('limit', limit.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        console.warn(`POI query failed: ${response.statusText}`)
        return []
      }

      const data = await response.json()

      // Convert results to POIContext format
      return data.results.map((poi: any) => {
        const distance = this.calculateDistance(lat, lng, poi.lat, poi.lng)
        const bearing = this.calculateBearing(lat, lng, poi.lat, poi.lng)

        return {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          distance,
          bearing,
          lat: poi.lat,
          lng: poi.lng
        }
      }).sort((a: POIContext, b: POIContext) => a.distance - b.distance)
    } catch (error) {
      console.error('Error fetching nearby POIs:', error)
      return []
    }
  }

  /**
   * Get full location context including significant POIs
   */
  async getLocationContext(
    name: string,
    lat: number,
    lng: number,
    radiusMeters: number = 1000
  ): Promise<LocationContext> {
    const pois = await this.getNearbyPOIs(lat, lng, radiusMeters, 50)

    // Filter significant POI categories
    const significantCategories = [
      'airport', 'seaport', 'hospital', 'police_station',
      'fire_station', 'government', 'embassy', 'military',
      'prison', 'courthouse', 'university', 'stadium'
    ]

    const significantPOIs = pois.filter(poi =>
      significantCategories.includes(poi.category)
    )

    // Generate context summary
    const contextSummary = this.generateContextSummary(pois, significantPOIs)

    return {
      location: { name, lat, lng },
      nearbyPOIs: pois.slice(0, 10), // Top 10 closest
      significantPOIs,
      contextSummary
    }
  }

  /**
   * Enrich location notes with POI context
   */
  enrichLocationNotes(originalNotes: string, pois: POIContext[]): string {
    if (pois.length === 0) {
      return originalNotes
    }

    const topPOIs = pois.slice(0, 3)
    const poiList = topPOIs.map(poi => {
      const icon = this.getCategoryIcon(poi.category)
      const distanceKm = (poi.distance / 1000).toFixed(1)
      return `${icon} ${poi.name} (${distanceKm} km ${poi.bearing})`
    }).join(', ')

    return `${originalNotes}\n\nNearby: ${poiList}`
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
   * Calculate bearing between two points
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    const θ = Math.atan2(y, x)
    const bearing = (θ * 180 / Math.PI + 360) % 360

    // Convert to cardinal direction
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }

  /**
   * Generate context summary from POIs
   */
  private generateContextSummary(allPOIs: POIContext[], significantPOIs: POIContext[]): string {
    if (allPOIs.length === 0) {
      return 'No nearby points of interest identified'
    }

    const parts: string[] = []

    // Significant POIs first
    if (significantPOIs.length > 0) {
      const closest = significantPOIs[0]
      const distanceKm = (closest.distance / 1000).toFixed(1)
      parts.push(`Near ${closest.name} (${distanceKm} km ${closest.bearing})`)
    }

    // POI density
    const densityWithin500m = allPOIs.filter(poi => poi.distance <= 500).length
    if (densityWithin500m > 10) {
      parts.push('High POI density area')
    } else if (densityWithin500m > 5) {
      parts.push('Moderate POI density')
    } else if (densityWithin500m < 2) {
      parts.push('Isolated area, limited infrastructure')
    }

    // Category distribution
    const categories = [...new Set(allPOIs.map(poi => poi.category))]
    if (categories.includes('airport')) {
      parts.push('airport vicinity')
    }
    if (categories.includes('hospital')) {
      parts.push('medical facilities nearby')
    }
    if (categories.includes('university')) {
      parts.push('educational district')
    }
    if (categories.some(c => ['warehouse', 'industrial', 'port'].includes(c))) {
      parts.push('industrial zone')
    }

    return parts.join('; ') || 'Urban area with mixed use'
  }

  /**
   * Get emoji icon for POI category
   */
  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      airport: '✈️',
      seaport: '⚓',
      hospital: '🏥',
      police_station: '👮',
      fire_station: '🚒',
      government: '🏛️',
      embassy: '🏛️',
      military: '🪖',
      prison: '🔒',
      courthouse: '⚖️',
      university: '🎓',
      school: '🏫',
      hotel: '🏨',
      restaurant: '🍽️',
      cafe: '☕',
      shopping_mall: '🛍️',
      park: '🌳',
      stadium: '🏟️',
      museum: '🏛️',
      library: '📚',
      theater: '🎭',
      gym: '💪',
      bank: '🏦',
      post_office: '📮',
      pharmacy: '💊',
      gas_station: '⛽',
      parking: '🅿️',
      subway_station: '🚇',
      bus_station: '🚌',
      train_station: '🚉',
      ferry_terminal: '⛴️'
    }

    return icons[category] || '📍'
  }

  /**
   * Get CSS color for POI category
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      airport: '#176BF8', // Blue
      seaport: '#0EA5E9', // Cyan
      hospital: '#EF4444', // Red
      police_station: '#3B82F6', // Blue
      fire_station: '#EF4444', // Red
      government: '#8B5CF6', // Purple
      university: '#8B5CF6', // Purple
      hotel: '#F59E0B', // Orange
      restaurant: '#10B981', // Green
      park: '#10B981', // Green
      stadium: '#F59E0B', // Orange
      museum: '#F59E0B', // Orange
    }

    return colors[category] || '#737373' // Gray default
  }
}

// Singleton instance
let serviceInstance: POIContextService | null = null

export function getPOIContextService(baseUrl?: string): POIContextService {
  if (!serviceInstance) {
    serviceInstance = new POIContextService(baseUrl)
  }
  return serviceInstance
}

// Example usage:
//
// const service = getPOIContextService()
//
// // Get nearby POIs
// const pois = await service.getNearbyPOIs(40.7661, -73.9912, 1000)
//
// // Get full context
// const context = await service.getLocationContext('Hell\'s Kitchen Apt', 40.7661, -73.9912)
// console.log(context.contextSummary)
// // "Near Port Authority Bus Terminal (0.5 km E); High POI density area"
//
// // Enrich location notes
// const enriched = service.enrichLocationNotes(
//   'Subject residence',
//   context.nearbyPOIs
// )
// // "Subject residence\n\nNearby: ✈️ Port Authority (0.5 km E), 🏨 Marriott Marquis (0.3 km SE)"
