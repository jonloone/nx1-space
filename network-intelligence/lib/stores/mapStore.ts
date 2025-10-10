import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type mapboxgl from 'mapbox-gl'

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

interface MapState {
  // Map instance
  map: mapboxgl.Map | null
  setMap: (map: mapboxgl.Map | null) => void

  // Viewport
  viewport: MapViewport
  setViewport: (viewport: Partial<MapViewport>) => void

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

  // Actions
  flyTo: (longitude: number, latitude: number, zoom?: number) => void
  resetViewport: () => void
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
      }
    }),
    { name: 'MapStore' }
  )
)
