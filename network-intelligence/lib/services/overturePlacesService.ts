/**
 * Overture Places Service
 * Loads global places from self-hosted PMTiles with progressive caching
 *
 * Features:
 * - Self-hosted PMTiles (no external dependencies)
 * - Viewport-aware querying
 * - IndexedDB caching for offline support
 * - Progressive loading (zoom 6-10 initial, 11-14 on-demand)
 */

import mapboxgl from 'mapbox-gl'
import type { GERSPlace, LevelOfDetail } from './gersDemoService'
import { PLACE_CATEGORIES, getCategoryConfig } from '../config/placesCategories'
import { getPlacesCache } from './placesCache'
import type { ViewportBounds } from '../stores/mapStore'

export interface OverturePlaceFeature {
  id: string
  name: string
  category: string
  longitude: number
  latitude: number
  confidence: number
  address?: string
  city?: string
  state?: string
  country?: string
  website?: string
  phone?: string
}

export class OverturePlacesService {
  private isInitialized = false
  private map: mapboxgl.Map | null = null
  private enabledCategories: Set<string> = new Set()
  private cache = getPlacesCache()
  private cacheEnabled = true // Enable cache-first strategy

  constructor() {
    // Initialize enabled categories from configuration
    Object.values(PLACE_CATEGORIES).forEach(category => {
      if (category.enabled) {
        this.enabledCategories.add(category.id)
      }
    })
  }

  /**
   * Initialize service (minimal setup)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Initialize cache
    if (this.cacheEnabled) {
      try {
        await this.cache.initialize()
        console.log('✅ Places cache initialized')
      } catch (error) {
        console.warn('⚠️ Cache initialization failed, continuing without cache:', error)
        this.cacheEnabled = false
      }
    }

    console.log('✅ Overture Places service initialized (HTTP tile mode)')
    this.isInitialized = true
  }

  /**
   * Add Overture Places layers to map
   */
  async addToMap(map: mapboxgl.Map): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.map = map

    try {
      // Add vector tile source using HTTP API endpoint (must be absolute URL)
      const tileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/tiles/places/{z}/{x}/{y}.pbf`
        : '/api/tiles/places/{z}/{x}/{y}.pbf'

      map.addSource('overture-places', {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 6,
        maxzoom: 10  // Progressive loading
      })

      // Add layers for different place types
      this.addPlaceLayers(map)

      console.log('✅ Overture Places layers added to map')
    } catch (error) {
      console.error('❌ Failed to add Overture Places to map:', error)
      throw error
    }
  }

  /**
   * Add styled layers for different place categories
   */
  private addPlaceLayers(map: mapboxgl.Map): void {
    // Layer 1: Airports (always visible, even at low zoom)
    map.addLayer({
      id: 'overture-airports',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: ['==', ['get', 'category'], 'airport'],
      minzoom: 6,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          6, 4,
          10, 10,
          14, 16
        ],
        'circle-color': '#176BF8',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.9
      }
    })

    // Layer 2: Hospitals and healthcare
    map.addLayer({
      id: 'overture-hospitals',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: [
        'in',
        ['get', 'category'],
        ['literal', ['hospital', 'clinic', 'emergency_room']]
      ],
      minzoom: 7,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 3,
          10, 8,
          14, 14
        ],
        'circle-color': '#EF4444',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.9
      }
    })

    // Layer 3: Education (universities, colleges)
    map.addLayer({
      id: 'overture-education',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: [
        'in',
        ['get', 'category'],
        ['literal', ['university', 'college', 'school']]
      ],
      minzoom: 8,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 3,
          10, 7,
          14, 12
        ],
        'circle-color': '#8B5CF6',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.8
      }
    })

    // Layer 4: Cultural places (museums, theaters, stadiums)
    map.addLayer({
      id: 'overture-cultural',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: [
        'in',
        ['get', 'category'],
        ['literal', ['museum', 'library', 'theater', 'stadium', 'arena']]
      ],
      minzoom: 8,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 2,
          10, 6,
          14, 11
        ],
        'circle-color': '#F59E0B',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.8
      }
    })

    // Layer 5: Transportation hubs (ports, stations)
    map.addLayer({
      id: 'overture-transport',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: [
        'in',
        ['get', 'category'],
        ['literal', ['seaport', 'bus_station', 'train_station', 'ferry_terminal']]
      ],
      minzoom: 7,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 3,
          10, 8,
          14, 13
        ],
        'circle-color': '#0EA5E9',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.8
      }
    })

    // Layer 6: All other places (hotels, parks, etc.)
    map.addLayer({
      id: 'overture-general',
      type: 'circle',
      source: 'overture-places',
      'source-layer': 'places',
      filter: [
        '!',
        ['in', ['get', 'category'], ['literal', [
          'airport', 'hospital', 'clinic', 'emergency_room',
          'university', 'college', 'school',
          'museum', 'library', 'theater', 'stadium', 'arena',
          'seaport', 'bus_station', 'train_station', 'ferry_terminal'
        ]]]
      ],
      minzoom: 9,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          9, 2,
          10, 5,
          14, 10
        ],
        'circle-color': '#10B981',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.7
      }
    })
  }

  /**
   * Query places visible in current viewport
   */
  queryVisiblePlaces(map: mapboxgl.Map): GERSPlace[] {
    if (!this.isInitialized) {
      console.warn('Overture Places not initialized yet')
      return []
    }

    try {
      // Query all visible Overture place layers
      const layerIds = [
        'overture-airports',
        'overture-hospitals',
        'overture-education',
        'overture-cultural',
        'overture-transport',
        'overture-general'
      ]

      const allFeatures: mapboxgl.MapboxGeoJSONFeature[] = []

      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          const features = map.querySourceFeatures('overture-places', {
            sourceLayer: 'places',
            // Only get features in viewport
            validate: false
          })
          allFeatures.push(...features)
        }
      })

      // Deduplicate by ID
      const uniqueFeatures = Array.from(
        new Map(allFeatures.map(f => [f.properties?.id, f])).values()
      )

      // Convert to GERSPlace format
      return uniqueFeatures.map(f => this.featureToGERSPlace(f)).filter(Boolean) as GERSPlace[]
    } catch (error) {
      console.error('❌ Error querying visible places:', error)
      return []
    }
  }

  /**
   * Convert Overture feature to GERSPlace format
   */
  private featureToGERSPlace(feature: mapboxgl.MapboxGeoJSONFeature): GERSPlace | null {
    if (!feature.properties || !feature.geometry || feature.geometry.type !== 'Point') {
      return null
    }

    const props = feature.properties
    const coords = (feature.geometry as GeoJSON.Point).coordinates

    return {
      gersId: props.id || `overture-${Date.now()}`,
      name: props.name || 'Unknown Place',
      categories: [props.category || 'unknown'],
      levelOfDetail: this.categoryToLoD(props.category),
      location: {
        type: 'Point',
        coordinates: [coords[0], coords[1]]
      },
      address: {
        street: props.address,
        city: props.city,
        state: props.state,
        country: props.country
      },
      contact: {
        phone: props.phone,
        website: props.website
      },
      properties: {
        confidence: props.confidence,
        source: 'overture'
      }
    }
  }

  /**
   * Map category to Level of Detail
   */
  private categoryToLoD(category: string): LevelOfDetail {
    const landmarks = [
      'airport', 'seaport', 'hospital', 'university',
      'stadium', 'arena', 'national_park', 'dam'
    ]

    if (landmarks.includes(category)) {
      return 'landmark'
    }

    return 'place'
  }

  /**
   * Toggle a single category on/off
   */
  toggleCategory(categoryId: string): void {
    if (this.enabledCategories.has(categoryId)) {
      this.disableCategory(categoryId)
    } else {
      this.enableCategory(categoryId)
    }
  }

  /**
   * Enable a category
   */
  enableCategory(categoryId: string): void {
    const config = getCategoryConfig(categoryId)
    if (!config) {
      console.warn(`Unknown category: ${categoryId}`)
      return
    }

    this.enabledCategories.add(categoryId)
    this.updateLayerFilters()
    console.log(`✅ Enabled category: ${categoryId}`)
  }

  /**
   * Disable a category
   */
  disableCategory(categoryId: string): void {
    this.enabledCategories.delete(categoryId)
    this.updateLayerFilters()
    console.log(`❌ Disabled category: ${categoryId}`)
  }

  /**
   * Toggle multiple categories (for group toggle)
   */
  toggleCategoryGroup(categoryIds: string[], enabled: boolean): void {
    categoryIds.forEach(categoryId => {
      if (enabled) {
        this.enabledCategories.add(categoryId)
      } else {
        this.enabledCategories.delete(categoryId)
      }
    })

    this.updateLayerFilters()
    console.log(`🔄 Toggled ${categoryIds.length} categories: ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Get currently enabled categories
   */
  getEnabledCategories(): string[] {
    return Array.from(this.enabledCategories)
  }

  /**
   * Query places with cache-first strategy
   * 1. Check IndexedDB cache
   * 2. If cache miss, query map
   * 3. Save results to cache
   * 4. Apply zoom-aware filtering
   */
  async queryPlacesWithCache(bounds: ViewportBounds): Promise<GERSPlace[]> {
    if (!this.cacheEnabled || !this.map) {
      // Fallback to direct map query
      return this.queryVisiblePlaces(this.map!)
    }

    try {
      // Get current zoom level
      const currentZoom = this.map!.getZoom()

      // TIER 1: Try IndexedDB cache first (warm cache)
      const cachedPlaces = await this.cache.getPlacesByBounds(bounds)

      if (cachedPlaces.length > 0) {
        console.log(`📦 Cache HIT: ${cachedPlaces.length} places from IndexedDB`)
        // Apply zoom-aware filtering to cached results
        return this.filterByZoomLevel(cachedPlaces, currentZoom)
      }

      // TIER 2: Cache MISS - query map (cold - PMTiles)
      console.log('❄️ Cache MISS: Querying PMTiles...')
      const freshPlaces = this.queryVisiblePlaces(this.map!)

      // TIER 3: Save to cache for next time
      if (freshPlaces.length > 0) {
        await this.cache.savePlaces(freshPlaces)
        console.log(`💾 Saved ${freshPlaces.length} places to cache`)
      }

      // Apply zoom-aware filtering
      return this.filterByZoomLevel(freshPlaces, currentZoom)
    } catch (error) {
      console.error('❌ Cache query failed, falling back to map query:', error)
      return this.queryVisiblePlaces(this.map!)
    }
  }

  /**
   * Filter places by zoom level based on category minZoom thresholds
   */
  private filterByZoomLevel(places: GERSPlace[], currentZoom: number): GERSPlace[] {
    return places.filter(place => {
      // Get category configuration
      const categoryId = place.categories[0] // Use first category
      const categoryConfig = getCategoryConfig(categoryId)

      if (!categoryConfig) return true // Show if no config found

      // Check if current zoom meets minimum zoom for this category
      return currentZoom >= categoryConfig.minZoom
    })
  }

  /**
   * Preload cache for a specific area (cache warming)
   */
  async warmCache(bounds: ViewportBounds): Promise<void> {
    if (!this.cacheEnabled || !this.map) return

    try {
      console.log('🔥 Warming cache for viewport...')
      const places = this.queryVisiblePlaces(this.map!)
      await this.cache.savePlaces(places)
      console.log(`✅ Cache warmed: ${places.length} places`)
    } catch (error) {
      console.error('❌ Failed to warm cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.cacheEnabled) return null
    return await this.cache.getStats()
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    if (!this.cacheEnabled) return
    await this.cache.clearCache()
  }

  /**
   * Update map layer filters based on enabled categories
   */
  private updateLayerFilters(): void {
    if (!this.map) return

    const layerIds = [
      'overture-airports',
      'overture-hospitals',
      'overture-education',
      'overture-cultural',
      'overture-transport',
      'overture-general'
    ]

    // Create a filter that includes all enabled categories
    const enabledArray = Array.from(this.enabledCategories)

    if (enabledArray.length === 0) {
      // If no categories enabled, hide all layers
      layerIds.forEach(layerId => {
        if (this.map!.getLayer(layerId)) {
          this.map!.setLayoutProperty(layerId, 'visibility', 'none')
        }
      })
      return
    }

    // Update each layer's filter to only show enabled categories
    const categoriesFilter: any = ['in', ['get', 'category'], ['literal', enabledArray]]

    layerIds.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        // Show layer
        this.map!.setLayoutProperty(layerId, 'visibility', 'visible')

        // Get existing filter and combine with category filter
        const layer = this.map!.getLayer(layerId) as any
        const existingFilter = layer.filter

        // If layer has a specific category filter (like airports), check if it's still enabled
        if (existingFilter && existingFilter[0] === '==') {
          const specificCategory = existingFilter[2]
          if (Array.isArray(specificCategory) && specificCategory[1] === 'category') {
            const categoryValue = existingFilter[2][2]
            if (!enabledArray.includes(categoryValue)) {
              // Category is disabled, hide this layer
              this.map!.setLayoutProperty(layerId, 'visibility', 'none')
            }
          }
        } else if (existingFilter && existingFilter[0] === 'in') {
          // Layer has multiple categories, filter to enabled ones only
          const layerCategories = existingFilter[3][1] as string[]
          const enabledLayerCategories = layerCategories.filter(cat => enabledArray.includes(cat))

          if (enabledLayerCategories.length === 0) {
            this.map!.setLayoutProperty(layerId, 'visibility', 'none')
          } else if (enabledLayerCategories.length !== layerCategories.length) {
            // Update filter to only show enabled categories
            const newFilter: any = [
              'in',
              ['get', 'category'],
              ['literal', enabledLayerCategories]
            ]
            this.map!.setFilter(layerId, newFilter)
          }
        } else if (existingFilter && existingFilter[0] === '!' && existingFilter[1] && existingFilter[1][0] === 'in') {
          // General layer - exclude disabled categories
          const allCategories = Object.keys(PLACE_CATEGORIES)
          const disabledCategories = allCategories.filter(cat => !enabledArray.includes(cat))

          const newFilter: any = [
            '!',
            ['in', ['get', 'category'], ['literal', disabledCategories]]
          ]
          this.map!.setFilter(layerId, newFilter)
        }
      }
    })
  }

  /**
   * Search for places near a specific location
   * @param center - Center coordinates [longitude, latitude]
   * @param radius - Search radius in meters
   * @param categories - Optional category filter
   * @param limit - Maximum number of results
   */
  async searchNear(params: {
    center: [number, number]
    radius: number
    categories?: string[]
    limit?: number
  }): Promise<GERSPlace[]> {
    if (!this.map) {
      console.warn('Map not initialized for searchNear')
      return []
    }

    try {
      const { center, radius, categories, limit = 100 } = params

      console.log(`🔍 searchNear: center=${center}, radius=${radius}m, categories=${categories?.join(',') || 'all'}, zoom=${this.map.getZoom()}`)

      // Query all features from the source
      const features = this.map.querySourceFeatures('overture-places', {
        sourceLayer: 'places'
      })

      console.log(`📊 querySourceFeatures returned ${features.length} total features`)

      // Log categories found
      const categoriesFound = new Set(features.map(f => f.properties?.category).filter(Boolean))
      console.log(`📂 Categories in loaded tiles: ${Array.from(categoriesFound).join(', ')}`)

      // Filter by distance and categories
      const results: GERSPlace[] = []

      for (const feature of features) {
        if (feature.geometry.type !== 'Point') continue

        const coords = (feature.geometry as GeoJSON.Point).coordinates
        const distance = this.calculateDistance(center, [coords[0], coords[1]])

        // Check if within radius
        if (distance > radius) continue

        // Check if matches categories
        const featureCategory = feature.properties?.category
        if (categories && categories.length > 0 && !categories.includes(featureCategory)) {
          continue
        }

        // Convert to GERSPlace
        const place = this.featureToGERSPlace(feature)
        if (place) {
          place.distance = distance
          place.bearing = this.calculateBearing(center, [coords[0], coords[1]])
          results.push(place)
        }

        // Check limit
        if (results.length >= limit) break
      }

      // Sort by distance
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0))

      console.log(`✅ searchNear found ${results.length} places within ${radius}m matching criteria`)
      return results.slice(0, limit)
    } catch (error) {
      console.error('❌ Error in searchNear:', error)
      return []
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @returns Distance in meters
   */
  private calculateDistance(
    point1: [number, number],
    point2: [number, number]
  ): number {
    const [lon1, lat1] = point1
    const [lon2, lat2] = point2
    const R = 6371000 // Earth's radius in meters

    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Calculate bearing between two points
   * @returns Bearing in degrees (0-360)
   */
  private calculateBearing(
    point1: [number, number],
    point2: [number, number]
  ): number {
    const [lon1, lat1] = point1
    const [lon2, lat2] = point2

    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    const θ = Math.atan2(y, x)
    return ((θ * 180) / Math.PI + 360) % 360
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.map = null
    this.isInitialized = false
  }
}

// Singleton instance
let serviceInstance: OverturePlacesService | null = null

export function getOverturePlacesService(): OverturePlacesService {
  if (!serviceInstance) {
    serviceInstance = new OverturePlacesService()
  }
  return serviceInstance
}
