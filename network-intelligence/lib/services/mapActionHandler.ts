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
   *
   * Strategy: Fly to location first, wait for tiles to load, then search
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
          message: `Location "${locationName}" not found. Try a different city or address.`,
          error: 'LOCATION_NOT_FOUND'
        }
      }

      // 2. Fly to location FIRST (this loads the tiles)
      const mapStore = useMapStore.getState()
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        location.suggestedZoom
      )

      // 3. Wait for map to finish moving and tiles to load
      await this.waitForMapMove()

      // 4. NOW search in the loaded viewport using Overture Places
      const places = await this.overtureService.searchNear({
        center: location.coordinates,
        radius,
        categories,
        limit: 100
      })

      // 5. Update visible places in store
      mapStore.setVisiblePlaces(places)

      // 6. Select first place if only one found
      if (places.length === 1) {
        mapStore.selectFeature({
          id: places[0].gersId,
          type: 'place',
          name: places[0].name,
          coordinates: places[0].location.coordinates,
          properties: places[0].properties || {}
        })
      }

      // 7. Build response message
      const categoryStr = categories.length > 0
        ? categories.join(', ').replace(/_/g, ' ')
        : 'places'

      const message = places.length > 0
        ? `Found ${places.length} ${categoryStr} near ${location.name}.`
        : `No ${categoryStr} found near ${location.name}. Try a different area or search term.`

      return {
        success: places.length > 0,
        action: 'search',
        data: {
          location,
          places,
          categories,
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
        message: 'Search error. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Wait for map to finish moving and tiles to load
   */
  private async waitForMapMove(): Promise<void> {
    return new Promise((resolve) => {
      // Wait for map movement + tile loading (give it 2 seconds)
      setTimeout(resolve, 2000)
    })
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
          message: `Location "${locationName}" not found. Try a different city or address.`,
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
        message: `Viewing ${location.name}`
      }
    } catch (error) {
      console.error('Error in handleFlyTo:', error)
      return {
        success: false,
        action: 'flyTo',
        message: 'Navigation error. Please try again.',
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

      // 2. Search for places using Overture Places (comprehensive real data)
      const places = await this.overtureService.searchNear({
        center,
        radius,
        categories,
        limit: 100
      })

      // 3. Update visible places
      mapStore.setVisiblePlaces(places)

      // 4. Build response message
      const categoryStr = categories && categories.length > 0
        ? categories.join(', ').replace(/_/g, ' ')
        : 'places'

      const message = places.length > 0
        ? `Found ${places.length} ${categoryStr} in view.`
        : `No ${categoryStr} found. Try zooming out or different search terms.`

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
        message: 'Search error. Please try again.',
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
          message: "Please specify a location.",
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
        message: "Try: 'coffee shops near Central Park' or 'zoom to Los Angeles'",
        error: 'UNPARSEABLE_QUERY'
      }
    } catch (error) {
      console.error('Error in handleNaturalLanguageQuery:', error)
      return {
        success: false,
        action: 'error',
        message: 'Error processing request. Please try again.',
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
          message: `Location "${locationName}" not found.`,
          error: 'LOCATION_NOT_FOUND'
        }
      }

      // 2. Search for all places using Overture Places
      const places = await this.overtureService.searchNear({
        center: location.coordinates,
        radius,
        limit: 200 // Get more places for analysis
      })

      // 3. Update map
      const mapStore = useMapStore.getState()
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        location.suggestedZoom - 1 // Zoom out a bit for analysis view
      )
      mapStore.setVisiblePlaces(places)

      // 4. Build analysis summary with category breakdown
      const categoryBreakdown = new Map<string, number>()
      places.forEach(place => {
        place.categories.forEach(cat => {
          categoryBreakdown.set(cat, (categoryBreakdown.get(cat) || 0) + 1)
        })
      })

      // Get top categories
      const topCategories = Array.from(categoryBreakdown.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => `**${cat}**: ${count}`)
        .join('\n')

      const summary = `
Analysis of ${location.name} (${radius / 1000}km radius):

${topCategories}

**Total Places**: ${places.length}
      `.trim()

      return {
        success: true,
        action: 'analyze',
        data: {
          location,
          places,
          count: places.length,
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
        message: 'Analysis error. Please try again.',
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
