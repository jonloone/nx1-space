import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type mapboxgl from 'mapbox-gl'
import type { GERSPlace } from '@/lib/services/gersDemoService'
import { getPlacesCache, type CacheStats } from '@/lib/services/placesCache'

export interface MapViewport {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export interface SelectedFeature {
  id: string
  type: string
  name: string
  coordinates: [number, number]
  properties: Record<string, any>
}

export interface ViewportBounds {
  north: number
  south: number
  east: number
  west: number
}

interface MapState {
  // Map instance
  map: mapboxgl.Map | null
  setMap: (map: mapboxgl.Map | null) => void

  // Viewport
  viewport: MapViewport
  setViewport: (viewport: Partial<MapViewport>) => void
  viewportBounds: ViewportBounds | null
  setViewportBounds: (bounds: ViewportBounds) => void

  // Map interactions
  isInteractive: boolean
  setInteractive: (interactive: boolean) => void

  // Selected features
  selectedFeature: SelectedFeature | null
  selectFeature: (feature: SelectedFeature | null) => void

  // Hovered features
  hoveredFeature: SelectedFeature | null
  setHoveredFeature: (feature: SelectedFeature | null) => void

  // Map mode (e.g., 'view', 'draw', 'measure')
  mapMode: 'view' | 'draw' | 'measure' | 'select'
  setMapMode: (mode: 'view' | 'draw' | 'measure' | 'select') => void

  // Loading state
  isLoaded: boolean
  setLoaded: (loaded: boolean) => void

  // Overture Places state
  visiblePlaces: GERSPlace[]
  setVisiblePlaces: (places: GERSPlace[]) => void
  allCachedPlaces: GERSPlace[]
  addCachedPlaces: (places: GERSPlace[]) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredPlaces: GERSPlace[]

  // Overture Places actions
  getVisiblePlacesCount: () => number
  getPlacesByCategory: (category: string) => GERSPlace[]
  searchPlaces: (query: string) => GERSPlace[]

  // Multi-tier cache state
  cacheStats: CacheStats | null
  isCacheInitialized: boolean
  setCacheStats: (stats: CacheStats) => void

  // Multi-tier cache actions
  initializeCache: () => Promise<void>
  loadFromCache: (bounds: ViewportBounds) => Promise<GERSPlace[]>
  saveToCache: (places: GERSPlace[]) => Promise<void>
  getCacheStats: () => Promise<CacheStats>
  clearCache: () => Promise<void>

  // Actions
  flyTo: (longitude: number, latitude: number, zoom?: number) => void
  resetViewport: () => void
  setPadding: (padding: { top?: number; bottom?: number; left?: number; right?: number }) => void

  // Chat context helpers
  getViewportContext: () => {
    bounds?: [number, number, number, number] // [west, south, east, north]
    center?: [number, number]
    zoom?: number
  }
  getEnabledLayers: () => string[]
  getSelectedFeatureIds: () => string[]
}

const DEFAULT_VIEWPORT: MapViewport = {
  longitude: -122.4194,
  latitude: 37.7749,
  zoom: 12,
  pitch: 45,
  bearing: 0
}

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      // Map instance
      map: null,
      setMap: (map) => set({ map }),

      // Viewport
      viewport: DEFAULT_VIEWPORT,
      setViewport: (viewport) =>
        set((state) => ({
          viewport: { ...state.viewport, ...viewport }
        })),
      viewportBounds: null,
      setViewportBounds: (bounds) => set({ viewportBounds: bounds }),

      // Map interactions
      isInteractive: true,
      setInteractive: (interactive) => set({ isInteractive: interactive }),

      // Selected features
      selectedFeature: null,
      selectFeature: (feature) => set({ selectedFeature: feature }),

      // Hovered features
      hoveredFeature: null,
      setHoveredFeature: (feature) => set({ hoveredFeature: feature }),

      // Map mode
      mapMode: 'view',
      setMapMode: (mode) => set({ mapMode: mode }),

      // Loading state
      isLoaded: false,
      setLoaded: (loaded) => set({ isLoaded: loaded }),

      // Overture Places state
      visiblePlaces: [],
      setVisiblePlaces: (places) => {
        set({ visiblePlaces: places })
        // Also update the filtered places based on current search
        const { searchQuery } = get()
        if (searchQuery) {
          set({
            filteredPlaces: places.filter((p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          })
        } else {
          set({ filteredPlaces: places })
        }
      },
      allCachedPlaces: [],
      addCachedPlaces: (places) => {
        const { allCachedPlaces } = get()
        // Deduplicate by gersId
        const existingIds = new Set(allCachedPlaces.map((p) => p.gersId))
        const newPlaces = places.filter((p) => !existingIds.has(p.gersId))
        set({ allCachedPlaces: [...allCachedPlaces, ...newPlaces] })
      },
      searchQuery: '',
      setSearchQuery: (query) => {
        set({ searchQuery: query })
        // Update filtered places based on new query
        const { visiblePlaces } = get()
        if (query) {
          set({
            filteredPlaces: visiblePlaces.filter((p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.categories.some((c) => c.toLowerCase().includes(query.toLowerCase()))
            )
          })
        } else {
          set({ filteredPlaces: visiblePlaces })
        }
      },
      filteredPlaces: [],

      // Overture Places actions
      getVisiblePlacesCount: () => get().visiblePlaces.length,
      getPlacesByCategory: (category) => {
        const { visiblePlaces } = get()
        return visiblePlaces.filter((p) => p.categories.includes(category))
      },
      searchPlaces: (query) => {
        const { visiblePlaces } = get()
        if (!query) return visiblePlaces
        const lowerQuery = query.toLowerCase()
        return visiblePlaces.filter((p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.categories.some((c) => c.toLowerCase().includes(lowerQuery)) ||
          p.address?.city?.toLowerCase().includes(lowerQuery) ||
          p.address?.state?.toLowerCase().includes(lowerQuery) ||
          p.address?.country?.toLowerCase().includes(lowerQuery)
        )
      },

      // Multi-tier cache state
      cacheStats: null,
      isCacheInitialized: false,
      setCacheStats: (stats) => set({ cacheStats: stats }),

      // Multi-tier cache actions
      initializeCache: async () => {
        try {
          const cache = getPlacesCache()
          await cache.initialize()
          const stats = await cache.getStats()
          set({ isCacheInitialized: true, cacheStats: stats })
          console.log('✅ Multi-tier cache initialized:', stats)
        } catch (error) {
          console.error('❌ Failed to initialize cache:', error)
        }
      },

      loadFromCache: async (bounds: ViewportBounds) => {
        try {
          const cache = getPlacesCache()
          const places = await cache.getPlacesByBounds(bounds)
          console.log(`📦 Loaded ${places.length} places from IndexedDB cache`)
          return places
        } catch (error) {
          console.error('❌ Failed to load from cache:', error)
          return []
        }
      },

      saveToCache: async (places: GERSPlace[]) => {
        try {
          const cache = getPlacesCache()
          await cache.savePlaces(places)
          // Update stats after save
          const stats = await cache.getStats()
          set({ cacheStats: stats })
          console.log(`💾 Saved ${places.length} places to IndexedDB cache`)
        } catch (error) {
          console.error('❌ Failed to save to cache:', error)
        }
      },

      getCacheStats: async () => {
        try {
          const cache = getPlacesCache()
          const stats = await cache.getStats()
          set({ cacheStats: stats })
          return stats
        } catch (error) {
          console.error('❌ Failed to get cache stats:', error)
          return {
            totalPlaces: 0,
            categoryCounts: new Map(),
            oldestCacheTime: 0,
            newestCacheTime: 0,
            estimatedSizeKB: 0
          }
        }
      },

      clearCache: async () => {
        try {
          const cache = getPlacesCache()
          await cache.clearCache()
          set({ cacheStats: null, allCachedPlaces: [] })
          console.log('🗑️ Cache cleared')
        } catch (error) {
          console.error('❌ Failed to clear cache:', error)
        }
      },

      // Actions
      flyTo: (longitude, latitude, zoom = 14) => {
        const { map } = get()
        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom,
            pitch: 45,
            bearing: 0,
            essential: true
          })
        }
        set((state) => ({
          viewport: {
            ...state.viewport,
            longitude,
            latitude,
            zoom
          }
        }))
      },

      resetViewport: () => {
        const { map } = get()
        if (map) {
          map.flyTo({
            center: [DEFAULT_VIEWPORT.longitude, DEFAULT_VIEWPORT.latitude],
            zoom: DEFAULT_VIEWPORT.zoom,
            pitch: DEFAULT_VIEWPORT.pitch,
            bearing: DEFAULT_VIEWPORT.bearing,
            essential: true
          })
        }
        set({ viewport: DEFAULT_VIEWPORT })
      },

      setPadding: (padding) => {
        const { map } = get()
        if (map) {
          map.easeTo({
            padding,
            duration: 300
          })
        }
      },

      // Chat context helpers
      getViewportContext: () => {
        const { viewport, viewportBounds } = get()
        return {
          bounds: viewportBounds
            ? [viewportBounds.west, viewportBounds.south, viewportBounds.east, viewportBounds.north]
            : undefined,
          center: [viewport.longitude, viewport.latitude],
          zoom: viewport.zoom
        }
      },

      getEnabledLayers: () => {
        // For now, return empty array
        // This will be populated when we implement layer management
        return []
      },

      getSelectedFeatureIds: () => {
        const { selectedFeature } = get()
        return selectedFeature ? [selectedFeature.id] : []
      }
    }),
    { name: 'MapStore' }
  )
)
