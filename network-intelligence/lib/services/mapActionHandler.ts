/**
 * Map Action Handler Service
 * Orchestrates map actions triggered by LLM responses
 *
 * Handles:
 * - Search places near location
 * - Fly to location
 * - Show nearby in viewport
 * - Filter by category
 */

import { useMapStore } from '../stores/mapStore'
import { getGERSDemoService, type GERSPlace } from './gersDemoService'
import { getOverturePlacesService } from './overturePlacesService'
import {
  getLocationResolverService,
  type ResolvedLocation
} from './locationResolver'

export interface MapAction {
  type: 'search' | 'flyTo' | 'showNearby' | 'filter' | 'analyze'
  payload: any
}

export interface ActionResult {
  success: boolean
  action: string
  data?: {
    location?: ResolvedLocation
    places?: GERSPlace[]
    viewport?: {
      center: [number, number]
      zoom: number
    }
    count?: number
  }
  message: string
  error?: string
}

/**
 * Map Action Handler
 * Coordinates between LLM intents and map operations
 */
export class MapActionHandler {
  private locationResolver = getLocationResolverService()
  private gersService = getGERSDemoService()
  private overtureService = getOverturePlacesService()

  /**
   * Handle "Show me X near Y" queries
   * Example: "Show me coffee shops near Central Park"
   */
  async handleSearchNearLocation(
    locationName: string,
    categories: string[],
    radius: number = 5000
  ): Promise<ActionResult> {
    try {
      // 1. Resolve location
      const location = await this.locationResolver.resolveLocation(locationName)

      if (!location) {
        return {
          success: false,
          action: 'search',
          message: `I couldn't find the location "${locationName}". Could you be more specific or try a different location?`,
          error: 'LOCATION_NOT_FOUND'
        }
      }

      // 2. Search for places
      const places = await this.gersService.search({
        categories,
        near: location.coordinates,
        radius,
        limit: 100
      })

      // 3. Update map
      const mapStore = useMapStore.getState()
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        location.suggestedZoom
      )
      mapStore.setVisiblePlaces(places)

      // 4. Select first place if only one found
      if (places.length === 1) {
        mapStore.selectFeature({
          id: places[0].gersId,
          type: 'place',
          name: places[0].name,
          coordinates: places[0].location.coordinates,
          properties: places[0].properties || {}
        })
      }

      // 5. Build response message
      const categoryStr = categories.length > 0
        ? categories.join(', ')
        : 'places'

      const message = places.length > 0
        ? `Found ${places.length} ${categoryStr} near ${location.name}. The map has zoomed to the area and marked all locations.`
        : `I couldn't find any ${categoryStr} near ${location.name}. Try expanding the search radius or searching for different categories.`

      return {
        success: places.length > 0,
        action: 'search',
        data: {
          location,
          places,
          count: places.length,
          viewport: {
            center: location.coordinates,
            zoom: location.suggestedZoom
          }
        },
        message
      }
    } catch (error) {
      console.error('Error in handleSearchNearLocation:', error)
      return {
        success: false,
        action: 'search',
        message: 'I encountered an error while searching. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Handle "Zoom to X" queries
   * Example: "Zoom to Los Angeles"
   */
  async handleFlyTo(locationName: string, zoom?: number): Promise<ActionResult> {
    try {
      // 1. Resolve location
      const location = await this.locationResolver.resolveLocation(locationName)

      if (!location) {
        return {
          success: false,
          action: 'flyTo',
          message: `I couldn't find "${locationName}". Could you provide more details or try a different location?`,
          error: 'LOCATION_NOT_FOUND'
        }
      }

      // 2. Fly to location
      const mapStore = useMapStore.getState()
      const targetZoom = zoom || location.suggestedZoom
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        targetZoom
      )

      return {
        success: true,
        action: 'flyTo',
        data: {
          location,
          viewport: {
            center: location.coordinates,
            zoom: targetZoom
          }
        },
        message: `Zooming to ${location.name}...`
      }
    } catch (error) {
      console.error('Error in handleFlyTo:', error)
      return {
        success: false,
        action: 'flyTo',
        message: 'I encountered an error while navigating. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Handle "What's around here?" queries
   * Searches in current viewport
   */
  async handleSearchInViewport(
    categories?: string[],
    radius: number = 5000
  ): Promise<ActionResult> {
    try {
      const mapStore = useMapStore.getState()

      // 1. Get current viewport center
      const viewport = mapStore.viewport
      const center: [number, number] = [viewport.longitude, viewport.latitude]

      // 2. Search for places
      const places = await this.gersService.search({
        categories,
        near: center,
        radius,
        limit: 100
      })

      // 3. Update visible places
      mapStore.setVisiblePlaces(places)

      // 4. Build response message
      const categoryStr = categories && categories.length > 0
        ? categories.join(', ')
        : 'places'

      const message = places.length > 0
        ? `Found ${places.length} ${categoryStr} in this area.`
        : `I couldn't find any ${categoryStr} in this area. Try zooming out or searching for different categories.`

      return {
        success: places.length > 0,
        action: 'showNearby',
        data: {
          places,
          count: places.length,
          viewport: {
            center,
            zoom: viewport.zoom
          }
        },
        message
      }
    } catch (error) {
      console.error('Error in handleSearchInViewport:', error)
      return {
        success: false,
        action: 'showNearby',
        message: 'I encountered an error while searching. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Handle natural language query parsing and execution
   * Example: "Show me coffee shops near Central Park"
   */
  async handleNaturalLanguageQuery(query: string): Promise<ActionResult> {
    try {
      // 1. Parse query using location resolver
      const parsed = this.locationResolver.parseQuery(query)

      console.log('Parsed query:', parsed)

      // 2. Determine action type
      if (query.toLowerCase().includes('zoom to') || query.toLowerCase().includes('go to')) {
        // Fly to location
        if (parsed.location) {
          return this.handleFlyTo(parsed.location)
        }
        return {
          success: false,
          action: 'flyTo',
          message: "I couldn't determine where you want to go. Could you specify a location?",
          error: 'MISSING_LOCATION'
        }
      } else if (parsed.nearby || query.toLowerCase().includes('around here')) {
        // Search in current viewport
        return this.handleSearchInViewport(parsed.categories, parsed.radius)
      } else if (parsed.location && parsed.categories.length > 0) {
        // Search near location
        return this.handleSearchNearLocation(
          parsed.location,
          parsed.categories,
          parsed.radius
        )
      } else if (parsed.location) {
        // Just a location, fly to it
        return this.handleFlyTo(parsed.location)
      } else if (parsed.categories.length > 0) {
        // Just categories, search in viewport
        return this.handleSearchInViewport(parsed.categories, parsed.radius)
      }

      // Couldn't parse query
      return {
        success: false,
        action: 'unknown',
        message: "I couldn't understand your request. Try asking something like 'Show me coffee shops near Central Park' or 'Zoom to Los Angeles'.",
        error: 'UNPARSEABLE_QUERY'
      }
    } catch (error) {
      console.error('Error in handleNaturalLanguageQuery:', error)
      return {
        success: false,
        action: 'error',
        message: 'I encountered an error processing your request. Please try rephrasing.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Analyze area around a location
   * Example: "Analyze the area around downtown LA"
   */
  async handleAnalyzeArea(locationName: string, radius: number = 10000): Promise<ActionResult> {
    try {
      // 1. Resolve location
      const location = await this.locationResolver.resolveLocation(locationName)

      if (!location) {
        return {
          success: false,
          action: 'analyze',
          message: `I couldn't find "${locationName}". Could you provide more details?`,
          error: 'LOCATION_NOT_FOUND'
        }
      }

      // 2. Get nearby context
      const context = await this.gersService.getNearbyContext(
        location.coordinates,
        radius
      )

      // 3. Update map
      const mapStore = useMapStore.getState()
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        location.suggestedZoom - 1 // Zoom out a bit for analysis view
      )
      mapStore.setVisiblePlaces(context.all)

      // 4. Build analysis summary
      const summary = `
Analysis of ${location.name} (${radius / 1000}km radius):

**Maritime**: ${context.maritime.length} facilities
**Logistics**: ${context.logistics.length} facilities
**Defense/Critical Infrastructure**: ${context.defense.length} facilities

**Total Places**: ${context.all.length}
      `.trim()

      return {
        success: true,
        action: 'analyze',
        data: {
          location,
          places: context.all,
          count: context.all.length,
          viewport: {
            center: location.coordinates,
            zoom: location.suggestedZoom - 1
          }
        },
        message: summary
      }
    } catch (error) {
      console.error('Error in handleAnalyzeArea:', error)
      return {
        success: false,
        action: 'analyze',
        message: 'I encountered an error while analyzing. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Get summary of places in array
   */
  private getPlacesSummary(places: GERSPlace[]): string {
    if (places.length === 0) return 'No places found.'

    // Group by category
    const byCategory = new Map<string, number>()
    places.forEach(place => {
      place.categories.forEach(cat => {
        byCategory.set(cat, (byCategory.get(cat) || 0) + 1)
      })
    })

    // Format top 5 categories
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ')

    return `${places.length} places (${topCategories})`
  }
}

// Singleton instance
let handlerInstance: MapActionHandler | null = null

export function getMapActionHandler(): MapActionHandler {
  if (!handlerInstance) {
    handlerInstance = new MapActionHandler()
  }
  return handlerInstance
}
