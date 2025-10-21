/**
 * Overture Layers Manager
 * Unified manager for all Overture Maps layers
 *
 * Supports:
 * - Places (POIs)
 * - Buildings (footprints + 3D)
 * - Transportation (roads)
 * - Water (rivers, lakes)
 * - Boundaries (admin boundaries)
 */

import mapboxgl from 'mapbox-gl'

export type OvertureLayerId =
  | 'places'
  | 'buildings-2d'
  | 'buildings-3d'
  | 'transportation'
  | 'water'
  | 'boundaries'

export interface OvertureLayerConfig {
  id: OvertureLayerId
  name: string
  description: string
  theme: string // Overture theme name
  color: string // UI indicator color
  icon: string // Emoji or icon
  enabled: boolean
  visible: boolean
  opacity: number
  minZoom: number
  maxZoom: number
  pmtilesPath?: string // Path to PMTiles file (if available)
  requiresGeneration: boolean // True if PMTiles needs to be generated first
}

export const OVERTURE_LAYER_CONFIGS: Record<OvertureLayerId, OvertureLayerConfig> = {
  'places': {
    id: 'places',
    name: 'Places',
    description: '50,000 global POIs (airports, hospitals, etc.)',
    theme: 'places',
    color: '#10B981',
    icon: '📍',
    enabled: true,
    visible: true,
    opacity: 1.0,
    minZoom: 6,
    maxZoom: 14,
    pmtilesPath: '/tiles/places-global.pmtiles',
    requiresGeneration: false // Already generated
  },
  'buildings-2d': {
    id: 'buildings-2d',
    name: 'Buildings (2D)',
    description: 'Building footprints with color by type',
    theme: 'buildings',
    color: '#3B82F6',
    icon: '🏢',
    enabled: false,
    visible: false,
    opacity: 0.8,
    minZoom: 12,
    maxZoom: 16,
    pmtilesPath: '/tiles/buildings-usa.pmtiles',
    requiresGeneration: false // PMTiles ready (100K buildings)
  },
  'buildings-3d': {
    id: 'buildings-3d',
    name: 'Buildings (3D)',
    description: '3D extruded buildings with height data',
    theme: 'buildings',
    color: '#3B82F6',
    icon: '🏗️',
    enabled: false,
    visible: false,
    opacity: 0.8,
    minZoom: 12,
    maxZoom: 16,
    pmtilesPath: '/tiles/buildings-usa.pmtiles',
    requiresGeneration: false // PMTiles ready (100K buildings)
  },
  'transportation': {
    id: 'transportation',
    name: 'Roads',
    description: 'Road network (highways, streets)',
    theme: 'transportation',
    color: '#F59E0B',
    icon: '🛣️',
    enabled: false,
    visible: false,
    opacity: 1.0,
    minZoom: 8,
    maxZoom: 14,
    pmtilesPath: '/tiles/transportation-usa.pmtiles',
    requiresGeneration: true
  },
  'water': {
    id: 'water',
    name: 'Water',
    description: 'Rivers, lakes, and oceans',
    theme: 'base',
    color: '#0EA5E9',
    icon: '🌊',
    enabled: false,
    visible: false,
    opacity: 0.7,
    minZoom: 2,
    maxZoom: 14,
    pmtilesPath: '/tiles/water-global.pmtiles',
    requiresGeneration: true
  },
  'boundaries': {
    id: 'boundaries',
    name: 'Boundaries',
    description: 'Countries, states, cities',
    theme: 'boundaries',
    color: '#8B5CF6',
    icon: '🗺️',
    enabled: false,
    visible: false,
    opacity: 1.0,
    minZoom: 2,
    maxZoom: 12,
    pmtilesPath: '/tiles/boundaries-usa.pmtiles',
    requiresGeneration: true
  }
}

export class OvertureLayersManager {
  private map: mapboxgl.Map | null = null
  private layerStates: Map<OvertureLayerId, OvertureLayerConfig> = new Map()
  private initialized = false

  constructor() {
    // Initialize layer states from configs
    Object.values(OVERTURE_LAYER_CONFIGS).forEach((config) => {
      this.layerStates.set(config.id, { ...config })
    })
  }

  /**
   * Initialize manager with map instance
   */
  async initialize(map: mapboxgl.Map): Promise<void> {
    if (this.initialized) return

    this.map = map

    console.log('✅ Overture Layers Manager initialized (HTTP tile mode)')
    this.initialized = true
  }

  /**
   * Add a specific layer to the map
   */
  async addLayer(layerId: OvertureLayerId): Promise<void> {
    if (!this.map) throw new Error('Map not initialized')

    const config = this.layerStates.get(layerId)
    if (!config) throw new Error(`Layer ${layerId} not found`)

    try {
      // Check if PMTiles file exists (for layers that require it)
      if (config.pmtilesPath) {
        const response = await fetch(config.pmtilesPath, { method: 'HEAD' })
        if (!response.ok) {
          console.warn(`⚠️ PMTiles file not found for ${layerId}: ${config.pmtilesPath}`)
          config.requiresGeneration = true
          return
        }
      }

      // Add layer based on type
      switch (layerId) {
        case 'places':
          await this.addPlacesLayer()
          break
        case 'buildings-2d':
          await this.addBuildings2DLayer()
          break
        case 'buildings-3d':
          await this.addBuildings3DLayer()
          break
        case 'transportation':
          await this.addTransportationLayer()
          break
        case 'water':
          await this.addWaterLayer()
          break
        case 'boundaries':
          await this.addBoundariesLayer()
          break
      }

      config.enabled = true
      console.log(`✅ Added layer: ${layerId}`)
    } catch (error) {
      console.error(`❌ Failed to add layer ${layerId}:`, error)
      throw error
    }
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(layerId: OvertureLayerId, visible: boolean): void {
    if (!this.map) return

    const config = this.layerStates.get(layerId)
    if (!config || !config.enabled) return

    // Get all map layer IDs for this Overture layer
    const mapLayerIds = this.getMapLayerIds(layerId)

    mapLayerIds.forEach((id) => {
      if (this.map!.getLayer(id)) {
        this.map!.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
      }
    })

    config.visible = visible
    console.log(`🔄 Toggled ${layerId}: ${visible ? 'visible' : 'hidden'}`)
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: OvertureLayerId, opacity: number): void {
    if (!this.map) return

    const config = this.layerStates.get(layerId)
    if (!config || !config.enabled) return

    const mapLayerIds = this.getMapLayerIds(layerId)

    mapLayerIds.forEach((id) => {
      const layer = this.map!.getLayer(id)
      if (!layer) return

      // Set opacity based on layer type
      if (layer.type === 'circle') {
        this.map!.setPaintProperty(id, 'circle-opacity', opacity)
      } else if (layer.type === 'fill') {
        this.map!.setPaintProperty(id, 'fill-opacity', opacity)
      } else if (layer.type === 'fill-extrusion') {
        this.map!.setPaintProperty(id, 'fill-extrusion-opacity', opacity)
      } else if (layer.type === 'line') {
        this.map!.setPaintProperty(id, 'line-opacity', opacity)
      }
    })

    config.opacity = opacity
  }

  /**
   * Get map layer IDs for an Overture layer
   */
  private getMapLayerIds(layerId: OvertureLayerId): string[] {
    switch (layerId) {
      case 'places':
        return [
          'overture-airports',
          'overture-hospitals',
          'overture-education',
          'overture-cultural',
          'overture-transport',
          'overture-general'
        ]
      case 'buildings-2d':
        return ['buildings-2d', 'buildings-2d-outline']
      case 'buildings-3d':
        return ['buildings-3d']
      case 'transportation':
        return ['transportation-motorway', 'transportation-major', 'transportation-minor']
      case 'water':
        return ['water-layer']
      case 'boundaries':
        return ['boundaries-country', 'boundaries-state', 'boundaries-county']
      default:
        return []
    }
  }

  /**
   * Add Places layer
   */
  private async addPlacesLayer(): Promise<void> {
    // Ensure map style is loaded before adding layers
    if (!this.map!.isStyleLoaded()) {
      console.warn('⚠️ Waiting for map style to load before adding Places layer...')
      await new Promise<void>((resolve) => {
        this.map!.once('styledata', () => resolve())
      })
    }

    // Initialize and add Places layer using OverturePlacesService
    const { getOverturePlacesService } = await import('./overturePlacesService')
    const placesService = getOverturePlacesService()

    // Check if source already exists (safe check)
    try {
      const existingSource = this.map!.getSource('overture-places')
      if (existingSource) {
        console.log('ℹ️ Places layer already exists on map')
        return
      }
    } catch (e) {
      // Source doesn't exist, which is fine - we'll add it
    }

    // Add the Places layer
    await placesService.addToMap(this.map!)
    console.log('✅ Places layer added via OverturePlacesService')
  }

  /**
   * Add Buildings 2D layer
   */
  private async addBuildings2DLayer(): Promise<void> {
    // Ensure map style is loaded
    if (!this.map!.isStyleLoaded()) {
      console.warn('⚠️ Waiting for map style to load before adding Buildings 2D layer...')
      await new Promise<void>((resolve) => {
        this.map!.once('styledata', () => resolve())
      })
    }

    if (!this.map!.getSource('overture-buildings')) {
      // Must use absolute URL for tile requests
      const tileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/tiles/buildings/{z}/{x}/{y}.pbf`
        : '/api/tiles/buildings/{z}/{x}/{y}.pbf'

      this.map!.addSource('overture-buildings', {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 12,
        maxzoom: 16
      })
    }

    this.map!.addLayer({
      id: 'buildings-2d',
      type: 'fill',
      source: 'overture-buildings',
      'source-layer': 'buildings',
      minzoom: 12,
      paint: {
        'fill-color': [
          'match',
          ['get', 'class'],
          'residential', '#FCA5A5',
          'commercial', '#93C5FD',
          'industrial', '#C4B5FD',
          'public', '#86EFAC',
          'mixed', '#FDE68A',
          '#D4D4D4'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#737373'
      }
    })

    this.map!.addLayer({
      id: 'buildings-2d-outline',
      type: 'line',
      source: 'overture-buildings',
      'source-layer': 'buildings',
      minzoom: 14,
      paint: {
        'line-color': '#525252',
        'line-width': 1,
        'line-opacity': 0.5
      }
    })
  }

  /**
   * Add Buildings 3D layer
   */
  private async addBuildings3DLayer(): Promise<void> {
    // Ensure map style is loaded
    if (!this.map!.isStyleLoaded()) {
      console.warn('⚠️ Waiting for map style to load before adding Buildings 3D layer...')
      await new Promise<void>((resolve) => {
        this.map!.once('styledata', () => resolve())
      })
    }

    if (!this.map!.getSource('overture-buildings')) {
      // Must use absolute URL for tile requests
      const tileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/tiles/buildings/{z}/{x}/{y}.pbf`
        : '/api/tiles/buildings/{z}/{x}/{y}.pbf'

      this.map!.addSource('overture-buildings', {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 12,
        maxzoom: 16
      })
    }

    this.map!.addLayer({
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'overture-buildings',
      'source-layer': 'buildings',
      minzoom: 12,
      paint: {
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-color': [
          'match',
          ['get', 'class'],
          'residential', '#EF4444',
          'commercial', '#3B82F6',
          'industrial', '#8B5CF6',
          'public', '#10B981',
          'mixed', '#F59E0B',
          '#A3A3A3'
        ],
        'fill-extrusion-opacity': 0.8,
        'fill-extrusion-vertical-gradient': true
      }
    })

    // Enable 3D view
    this.map!.easeTo({ pitch: 60, bearing: -17.6, duration: 1000 })
  }

  /**
   * Add Transportation layer (placeholder - requires PMTiles generation)
   */
  private async addTransportationLayer(): Promise<void> {
    console.log('🚧 Transportation layer requires PMTiles generation')
  }

  /**
   * Add Water layer (placeholder - requires PMTiles generation)
   */
  private async addWaterLayer(): Promise<void> {
    console.log('🚧 Water layer requires PMTiles generation')
  }

  /**
   * Add Boundaries layer (placeholder - requires PMTiles generation)
   */
  private async addBoundariesLayer(): Promise<void> {
    console.log('🚧 Boundaries layer requires PMTiles generation')
  }

  /**
   * Get all layer configs
   */
  getAllLayers(): OvertureLayerConfig[] {
    return Array.from(this.layerStates.values())
  }

  /**
   * Get layer config by ID
   */
  getLayer(layerId: OvertureLayerId): OvertureLayerConfig | undefined {
    return this.layerStates.get(layerId)
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.map = null
    this.initialized = false
  }
}

// Singleton instance
let managerInstance: OvertureLayersManager | null = null

export function getOvertureLayersManager(): OvertureLayersManager {
  if (!managerInstance) {
    managerInstance = new OvertureLayersManager()
  }
  return managerInstance
}
