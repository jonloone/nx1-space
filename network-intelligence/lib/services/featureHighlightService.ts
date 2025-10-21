/**
 * Feature Highlight Service
 * Manages visual highlighting of selected features (buildings, places, etc.)
 */

import mapboxgl from 'mapbox-gl'
import type { SelectedFeature } from '@/lib/stores/mapStore'

export class FeatureHighlightService {
  private map: mapboxgl.Map | null = null
  private currentHighlight: SelectedFeature | null = null
  private animationFrame: number | null = null
  private highlightOpacity = 1

  /**
   * Initialize the service with a map instance
   */
  initialize(map: mapboxgl.Map) {
    this.map = map

    // Wait for map to be fully loaded before setting up layers
    if (map.isStyleLoaded()) {
      this.setupHighlightLayers()
    } else {
      map.once('load', () => {
        this.setupHighlightLayers()
      })
    }

    console.log('✅ Feature Highlight Service initialized')
  }

  /**
   * Setup highlight layers for different feature types
   */
  private setupHighlightLayers() {
    if (!this.map) return

    // Double check map is loaded
    if (!this.map.isStyleLoaded()) {
      console.warn('⚠️ Map style not loaded yet, deferring highlight layer setup')
      this.map.once('styledata', () => this.setupHighlightLayers())
      return
    }

    // Add highlight source (will be updated with selected feature geometry)
    if (!this.map.getSource('highlight-source')) {
      this.map.addSource('highlight-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })
    }

    // Add highlight layers for different geometry types
    // Point highlight (for places, POIs)
    if (!this.map.getLayer('highlight-point')) {
      this.map.addLayer({
        id: 'highlight-point',
        type: 'circle',
        source: 'highlight-source',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 8,
            14, 16,
            18, 24
          ],
          'circle-color': '#FF6B35',
          'circle-opacity': 0.8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 1
        }
      })
    }

    // Point pulse layer (animated outer ring)
    if (!this.map.getLayer('highlight-point-pulse')) {
      this.map.addLayer({
        id: 'highlight-point-pulse',
        type: 'circle',
        source: 'highlight-source',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 12,
            14, 24,
            18, 36
          ],
          'circle-color': '#FF6B35',
          'circle-opacity': 0, // Will be animated
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FF6B35',
          'circle-stroke-opacity': 0 // Will be animated
        }
      })
    }

    // Polygon highlight (for buildings)
    if (!this.map.getLayer('highlight-polygon-fill')) {
      this.map.addLayer({
        id: 'highlight-polygon-fill',
        type: 'fill',
        source: 'highlight-source',
        filter: ['any',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['geometry-type'], 'MultiPolygon']
        ],
        paint: {
          'fill-color': '#FF6B35',
          'fill-opacity': 0.3
        }
      })
    }

    // Polygon outline (for buildings)
    if (!this.map.getLayer('highlight-polygon-outline')) {
      this.map.addLayer({
        id: 'highlight-polygon-outline',
        type: 'line',
        source: 'highlight-source',
        filter: ['any',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['geometry-type'], 'MultiPolygon']
        ],
        paint: {
          'line-color': '#FF6B35',
          'line-width': 5,
          'line-opacity': 1,
          'line-offset': 0
        }
      })
    }

    // Polygon outer glow (animated)
    if (!this.map.getLayer('highlight-polygon-glow')) {
      this.map.addLayer({
        id: 'highlight-polygon-glow',
        type: 'line',
        source: 'highlight-source',
        filter: ['any',
          ['==', ['geometry-type'], 'Polygon'],
          ['==', ['geometry-type'], 'MultiPolygon']
        ],
        paint: {
          'line-color': '#FF6B35',
          'line-width': 8,
          'line-opacity': 0, // Will be animated
          'line-blur': 4,
          'line-offset': 0
        }
      })
    }

    // 3D extrusion highlight (for 3D buildings)
    if (!this.map.getLayer('highlight-extrusion')) {
      this.map.addLayer({
        id: 'highlight-extrusion',
        type: 'fill-extrusion',
        source: 'highlight-source',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-extrusion-color': '#FF6B35',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7,
          'fill-extrusion-vertical-gradient': true
        }
      })
    }

    console.log('✅ Highlight layers added to map')
  }

  /**
   * Highlight a selected feature
   */
  highlightFeature(feature: SelectedFeature) {
    if (!this.map) return

    this.currentHighlight = feature

    // Try to get the actual feature geometry from map layers
    const actualGeometry = this.queryFeatureGeometry(feature)

    // Create GeoJSON feature
    const geoJsonFeature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: actualGeometry || {
        type: 'Point',
        coordinates: feature.coordinates
      },
      properties: {
        ...feature.properties,
        name: feature.name,
        id: feature.id,
        type: feature.type
      }
    }

    // Update highlight source
    const source = this.map.getSource('highlight-source') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [geoJsonFeature]
      })
    }

    // Start animation based on geometry type
    if (geoJsonFeature.geometry.type === 'Point') {
      this.startPulseAnimation()
    } else if (geoJsonFeature.geometry.type === 'Polygon' || geoJsonFeature.geometry.type === 'MultiPolygon') {
      this.startPolygonGlowAnimation()
    }

    // Fly to the feature
    this.map.flyTo({
      center: feature.coordinates,
      zoom: Math.max(this.map.getZoom(), 16), // Zoom in if needed
      pitch: feature.type === 'building' ? 60 : 45, // More pitch for buildings
      duration: 1500,
      essential: true
    })

    console.log(`🎯 Highlighted ${feature.type}: ${feature.name}`, actualGeometry ? 'with actual geometry' : 'with point fallback')
  }

  /**
   * Query the actual feature geometry from map layers
   */
  private queryFeatureGeometry(feature: SelectedFeature): GeoJSON.Geometry | null {
    if (!this.map) return null

    try {
      // Define layer priorities to check (check more specific layers first)
      const layerPriority = [
        // Buildings
        'buildings-3d',
        'buildings-2d',
        'buildings-2d-outline',
        // Places
        'overture-airports',
        'overture-hospitals',
        'overture-education',
        'overture-cultural',
        'overture-transport',
        'overture-general',
        // Other infrastructure
        'ports',
        'transportation'
      ]

      // Query features at the point location
      const point = this.map.project(feature.coordinates)
      const queryRadius = 5 // 5 pixel radius for querying

      // Try each layer in priority order
      for (const layerId of layerPriority) {
        if (!this.map.getLayer(layerId)) continue

        const features = this.map.queryRenderedFeatures(
          [
            [point.x - queryRadius, point.y - queryRadius],
            [point.x + queryRadius, point.y + queryRadius]
          ],
          {
            layers: [layerId]
          }
        )

        // Look for matching feature by name or ID
        for (const mapFeature of features) {
          const matchesName = mapFeature.properties?.name === feature.name ||
                            mapFeature.properties?.names?.primary === feature.name
          const matchesId = mapFeature.properties?.id === feature.id ||
                          mapFeature.properties?.gersId === feature.id

          if (matchesName || matchesId) {
            // Extract geometry from the feature
            if (mapFeature.geometry) {
              console.log(`✅ Found geometry for ${feature.name} in layer ${layerId}:`, mapFeature.geometry.type)
              return mapFeature.geometry as GeoJSON.Geometry
            }
          }
        }
      }

      // If no match found in layers, try to query all rendered features nearby
      const allFeatures = this.map.queryRenderedFeatures(
        [
          [point.x - queryRadius, point.y - queryRadius],
          [point.x + queryRadius, point.y + queryRadius]
        ]
      )

      // Find closest feature by name
      for (const mapFeature of allFeatures) {
        const matchesName = mapFeature.properties?.name === feature.name ||
                          mapFeature.properties?.names?.primary === feature.name

        if (matchesName && mapFeature.geometry) {
          console.log(`✅ Found geometry for ${feature.name} in any layer:`, mapFeature.geometry.type)
          return mapFeature.geometry as GeoJSON.Geometry
        }
      }

      console.log(`⚠️ No geometry found for ${feature.name}, using point fallback`)
      return null
    } catch (error) {
      console.error('Error querying feature geometry:', error)
      return null
    }
  }

  /**
   * Start pulse animation for point features
   */
  private startPulseAnimation() {
    if (!this.map) return

    // Stop any existing animation
    this.stopPulseAnimation()

    let pulseRadius = 0
    const animate = () => {
      if (!this.map) return

      // Pulse between 0 and 1
      pulseRadius = (pulseRadius + 0.02) % 1
      const opacity = 1 - pulseRadius

      // Update pulse layer opacity
      if (this.map.getLayer('highlight-point-pulse')) {
        this.map.setPaintProperty('highlight-point-pulse', 'circle-opacity', opacity * 0.3)
        this.map.setPaintProperty('highlight-point-pulse', 'circle-stroke-opacity', opacity * 0.6)
      }

      this.animationFrame = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Stop pulse animation
   */
  private stopPulseAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  /**
   * Start glow animation for polygon features
   */
  private startPolygonGlowAnimation() {
    if (!this.map) return

    // Stop any existing animation
    this.stopPulseAnimation()

    let glowPhase = 0
    const animate = () => {
      if (!this.map) return

      // Glow between 0 and 1
      glowPhase = (glowPhase + 0.03) % 1
      const opacity = Math.sin(glowPhase * Math.PI * 2) * 0.5 + 0.5 // Smooth sine wave 0-1

      // Update polygon glow layer opacity
      if (this.map.getLayer('highlight-polygon-glow')) {
        this.map.setPaintProperty('highlight-polygon-glow', 'line-opacity', opacity * 0.6)
      }

      this.animationFrame = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Clear the current highlight
   */
  clearHighlight() {
    if (!this.map) return

    // Stop animation
    this.stopPulseAnimation()

    // Clear highlight source
    const source = this.map.getSource('highlight-source') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      })
    }

    this.currentHighlight = null
    console.log('🔄 Highlight cleared')
  }

  /**
   * Get the currently highlighted feature
   */
  getCurrentHighlight(): SelectedFeature | null {
    return this.currentHighlight
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopPulseAnimation()
    this.clearHighlight()
    this.map = null
  }
}

// Singleton instance
let highlightServiceInstance: FeatureHighlightService | null = null

export function getFeatureHighlightService(): FeatureHighlightService {
  if (!highlightServiceInstance) {
    highlightServiceInstance = new FeatureHighlightService()
  }
  return highlightServiceInstance
}
