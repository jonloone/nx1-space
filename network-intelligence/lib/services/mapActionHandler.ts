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
import { PLACE_CATEGORIES } from '../config/placesCategories'

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
   * Calculate appropriate zoom level for given categories
   * Returns the maximum minZoom required to display all categories
   */
  private getZoomForCategories(categories: string[]): number {
    if (!categories || categories.length === 0) return 13 // Default city zoom

    let maxMinZoom = 0
    categories.forEach(cat => {
      const category = PLACE_CATEGORIES[cat]
      if (category && category.minZoom) {
        maxMinZoom = Math.max(maxMinZoom, category.minZoom)
      }
    })

    // Add 1 zoom level buffer to ensure visibility
    return maxMinZoom > 0 ? maxMinZoom + 1 : 13
  }

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

      // 2. Calculate appropriate zoom for categories being searched
      const categoryZoom = this.getZoomForCategories(categories)
      const finalZoom = Math.max(location.suggestedZoom, categoryZoom)

      console.log(`📍 Zoom calculation: location=${location.suggestedZoom}, categories=${categoryZoom}, final=${finalZoom}`)

      // 3. Fly to location FIRST at appropriate zoom (this loads the tiles)
      const mapStore = useMapStore.getState()
      mapStore.flyTo(
        location.coordinates[0],
        location.coordinates[1],
        finalZoom
      )

      // 4. Wait for map to finish moving and tiles to load
      await this.waitForMapMove()

      // 5. NOW search in the loaded viewport using Overture Places
      const places = await this.overtureService.searchNear({
        center: location.coordinates,
        radius,
        categories,
        limit: 100
      })

      // 6. Update visible places in store
      mapStore.setVisiblePlaces(places)

      // 7. Select first place if only one found
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

      // 2. Check if current zoom is sufficient for categories
      if (categories && categories.length > 0) {
        const requiredZoom = this.getZoomForCategories(categories)
        if (viewport.zoom < requiredZoom) {
          console.log(`📍 Auto-zoom: current=${viewport.zoom}, required=${requiredZoom}`)
          mapStore.flyTo(center[0], center[1], requiredZoom)
          await this.waitForMapMove()
        }
      }

      // 3. Search for places using Overture Places (comprehensive real data)
      const places = await this.overtureService.searchNear({
        center,
        radius,
        categories,
        limit: 100
      })

      // 4. Update visible places
      mapStore.setVisiblePlaces(places)

      // 5. Build response message
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
   * Handle "Show buildings" queries
   * Toggle buildings layer (2D or 3D)
   */
  async handleShowBuildings(enable3D: boolean = false): Promise<ActionResult> {
    try {
      const { getOvertureLayersManager } = await import('./overtureLayersManager')
      const layersManager = getOvertureLayersManager()

      // Toggle appropriate buildings layer
      const layerId = enable3D ? 'buildings-3d' : 'buildings-2d'
      const otherLayerId = enable3D ? 'buildings-2d' : 'buildings-3d'

      // Enable requested layer, disable the other
      layersManager.setLayerVisibility(layerId, true)
      layersManager.setLayerVisibility(otherLayerId, false)

      const mode = enable3D ? '3D' : '2D'

      return {
        success: true,
        action: 'toggleLayer',
        data: {
          layerId,
          enabled: true,
          mode
        },
        message: `Buildings layer enabled in ${mode} mode.`
      }
    } catch (error) {
      console.error('Error in handleShowBuildings:', error)
      return {
        success: false,
        action: 'toggleLayer',
        message: 'Error toggling buildings layer. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Handle generic layer toggle requests
   * Example: "Show roads", "Hide boundaries"
   */
  async handleToggleLayer(layerName: string, visible: boolean): Promise<ActionResult> {
    try {
      const { getOvertureLayersManager } = await import('./overtureLayersManager')
      const layersManager = getOvertureLayersManager()

      // Map friendly names to layer IDs
      const layerMap: Record<string, string> = {
        'buildings': 'buildings-2d',
        'roads': 'transportation',
        'water': 'water',
        'boundaries': 'boundaries'
      }

      const layerId = layerMap[layerName.toLowerCase()]

      if (!layerId) {
        return {
          success: false,
          action: 'toggleLayer',
          message: `Layer "${layerName}" not found. Available layers: buildings, roads, water, boundaries.`,
          error: 'LAYER_NOT_FOUND'
        }
      }

      layersManager.setLayerVisibility(layerId, visible)

      const action = visible ? 'enabled' : 'disabled'

      return {
        success: true,
        action: 'toggleLayer',
        data: {
          layerId,
          enabled: visible
        },
        message: `${layerName.charAt(0).toUpperCase() + layerName.slice(1)} layer ${action}.`
      }
    } catch (error) {
      console.error('Error in handleToggleLayer:', error)
      return {
        success: false,
        action: 'toggleLayer',
        message: 'Error toggling layer. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Handle "Show weather" queries
   * Example: "Show precipitation", "Show temperature"
   */
  async handleShowWeather(weatherType: string): Promise<ActionResult> {
    try {
      const { getWeatherLayersService } = await import('./weatherLayersService')
      const weatherService = getWeatherLayersService()

      // Map friendly names to weather types
      const typeMap: Record<string, string> = {
        'precipitation': 'precipitation',
        'rain': 'precipitation',
        'radar': 'precipitation',
        'temperature': 'temperature',
        'temp': 'temperature',
        'wind': 'wind',
        'clouds': 'clouds',
        'cloud': 'clouds',
        'pressure': 'pressure'
      }

      const layerType = typeMap[weatherType.toLowerCase()]

      if (!layerType) {
        return {
          success: false,
          action: 'showWeather',
          message: `Weather layer "${weatherType}" not found. Available: precipitation, temperature, wind, clouds, pressure.`,
          error: 'WEATHER_LAYER_NOT_FOUND'
        }
      }

      // Get map instance from store
      const mapStore = useMapStore.getState()
      const mapInstance = mapStore.map

      if (!mapInstance) {
        return {
          success: false,
          action: 'showWeather',
          message: 'Map not initialized. Please try again.',
          error: 'MAP_NOT_INITIALIZED'
        }
      }

      const result = await weatherService.showWeatherLayer(
        layerType as any,
        mapInstance
      )

      return {
        success: result.success,
        action: 'showWeather',
        data: {
          weatherType: layerType,
          enabled: result.success
        },
        message: result.message,
        error: result.success ? undefined : 'WEATHER_LAYER_ERROR'
      }
    } catch (error) {
      console.error('Error in handleShowWeather:', error)
      return {
        success: false,
        action: 'showWeather',
        message: 'Error loading weather layer. Please try again.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      }
    }
  }

  /**
   * Geocode a location name to coordinates
   * Used by copilot sidebar for route analysis and other features
   * Returns [lng, lat] array format to match routing service expectations
   */
  async geocodeLocation(locationName: string): Promise<[number, number] | null> {
    try {
      const location = await this.locationResolver.resolveLocation(locationName)
      if (location) {
        // Return coordinates as [lng, lat] tuple
        return location.coordinates
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
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
