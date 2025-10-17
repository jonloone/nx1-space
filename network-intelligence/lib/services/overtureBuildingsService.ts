/**
 * Overture Buildings Service
 * Loads building footprints from self-hosted PMTiles with 3D extrusion
 *
 * Features:
 * - 2D building footprints (polygons)
 * - 3D extrusions based on height data
 * - Color coding by building type
 * - Progressive loading (zoom 12-16)
 */

import { PMTiles } from 'pmtiles'
import mapboxgl from 'mapbox-gl'

export interface BuildingFeature {
  id: string
  name?: string
  class: 'residential' | 'commercial' | 'industrial' | 'public' | 'mixed' | 'building'
  height: number
  floors: number
}

export class OvertureBuildingsService {
  private pmtiles: PMTiles | null = null
  private isInitialized = false
  private is3DEnabled = false

  /**
   * Initialize Buildings PMTiles
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const pmtilesUrl = '/tiles/buildings-usa.pmtiles'

      // Note: PMTiles protocol already registered by OverturePlacesService
      this.pmtiles = new PMTiles(pmtilesUrl)

      const metadata = await this.pmtiles.getMetadata()
      console.log('🏢 Overture Buildings PMTiles loaded:', {
        minZoom: metadata.minzoom,
        maxZoom: metadata.maxzoom,
        bounds: metadata.bounds
      })

      this.isInitialized = true
    } catch (error) {
      console.error('❌ Failed to initialize Overture Buildings:', error)
      throw error
    }
  }

  /**
   * Add Buildings layers to map
   */
  async addToMap(map: mapboxgl.Map, enable3D: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    this.is3DEnabled = enable3D

    try {
      // Add PMTiles as vector tile source
      map.addSource('overture-buildings', {
        type: 'vector',
        url: 'pmtiles:///tiles/buildings-usa.pmtiles',
        minzoom: 12,
        maxzoom: 16
      })

      if (enable3D) {
        this.add3DLayers(map)
      } else {
        this.add2DLayers(map)
      }

      console.log('✅ Overture Buildings layers added to map (3D:', enable3D, ')')
    } catch (error) {
      console.error('❌ Failed to add Overture Buildings to map:', error)
      throw error
    }
  }

  /**
   * Add 2D building footprints
   */
  private add2DLayers(map: mapboxgl.Map): void {
    // Building footprints with color by type
    map.addLayer({
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
          '#D4D4D4' // default
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#737373'
      }
    })

    // Building outlines
    map.addLayer({
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
   * Add 3D building extrusions
   */
  private add3DLayers(map: mapboxgl.Map): void {
    // 3D extruded buildings
    map.addLayer({
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'overture-buildings',
      'source-layer': 'buildings',
      minzoom: 12,
      paint: {
        // Extrude based on height
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,

        // Color by building type
        'fill-extrusion-color': [
          'match',
          ['get', 'class'],
          'residential', '#EF4444',
          'commercial', '#3B82F6',
          'industrial', '#8B5CF6',
          'public', '#10B981',
          'mixed', '#F59E0B',
          '#A3A3A3' // default
        ],

        // Opacity and lighting
        'fill-extrusion-opacity': 0.8,
        'fill-extrusion-vertical-gradient': true
      }
    })
  }

  /**
   * Toggle between 2D and 3D view
   */
  toggle3D(map: mapboxgl.Map, enable3D: boolean): void {
    if (enable3D === this.is3DEnabled) return

    // Remove existing layers
    if (map.getLayer('buildings-2d')) map.removeLayer('buildings-2d')
    if (map.getLayer('buildings-2d-outline')) map.removeLayer('buildings-2d-outline')
    if (map.getLayer('buildings-3d')) map.removeLayer('buildings-3d')

    // Add new layers
    if (enable3D) {
      this.add3DLayers(map)
      // Enable pitch/bearing for 3D view
      map.easeTo({
        pitch: 60,
        bearing: -17.6,
        duration: 1000
      })
    } else {
      this.add2DLayers(map)
      // Reset to top-down view
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      })
    }

    this.is3DEnabled = enable3D
  }

  /**
   * Show/hide buildings layer
   */
  setVisible(map: mapboxgl.Map, visible: boolean): void {
    const layerIds = this.is3DEnabled
      ? ['buildings-3d']
      : ['buildings-2d', 'buildings-2d-outline']

    layerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
      }
    })
  }

  /**
   * Get building stats in viewport
   */
  getBuildingsInViewport(map: mapboxgl.Map): number {
    if (!this.isInitialized) return 0

    try {
      const layerId = this.is3DEnabled ? 'buildings-3d' : 'buildings-2d'

      if (!map.getLayer(layerId)) return 0

      const features = map.querySourceFeatures('overture-buildings', {
        sourceLayer: 'buildings'
      })

      return features.length
    } catch (error) {
      console.error('Error counting buildings:', error)
      return 0
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.pmtiles = null
    this.isInitialized = false
  }
}

// Singleton instance
let buildingsServiceInstance: OvertureBuildingsService | null = null

export function getOvertureBuildingsService(): OvertureBuildingsService {
  if (!buildingsServiceInstance) {
    buildingsServiceInstance = new OvertureBuildingsService()
  }
  return buildingsServiceInstance
}
