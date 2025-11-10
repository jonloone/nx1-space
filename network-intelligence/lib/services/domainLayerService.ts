/**
 * Domain Layer Service
 * Manages automatic layer switching based on IC operational domain
 */

import { type ICDomainId } from '@/lib/config/icDomains'
import {
  getDomainDefaultLayers,
  getDomainBasemap,
  basemapToMapboxStyle,
  type LayerConfig
} from '@/lib/config/icDomainVisualization'
import { useLayerStore } from '@/lib/stores/layerStore'
import type mapboxgl from 'mapbox-gl'

export interface DomainSwitchResult {
  layersChanged: LayerConfig[]
  basemapChanged: string
  viewportChanged: { pitch: number; bearing: number; zoom: number }
}

/**
 * Domain Layer Service
 * Singleton service for domain-based layer management
 */
export class DomainLayerService {
  private currentDomain: ICDomainId | null = null
  private currentDomains: ICDomainId[] = []

  /**
   * Switch to multiple IC operational domains (multi-domain fusion)
   * Merges layer configurations and intelligently selects basemap
   */
  switchMultipleDomains(
    domainIds: ICDomainId[],
    map: mapboxgl.Map | null,
    options?: {
      animateViewport?: boolean
      preserveUserLayers?: boolean
    }
  ): DomainSwitchResult {
    const { animateViewport = true, preserveUserLayers = false } = options || {}

    console.log(`[DomainLayerService] Switching to multi-domain: [${domainIds.join(', ')}]`)

    if (domainIds.length === 0) {
      console.warn('[DomainLayerService] No domains provided, defaulting to ground')
      return this.switchDomain('ground', map, options)
    }

    if (domainIds.length === 1) {
      // Single domain - use standard switch
      return this.switchDomain(domainIds[0], map, options)
    }

    // Multi-domain fusion logic
    // Step 1: Merge layers from all domains
    const mergedLayers = this.mergeDomainLayers(domainIds)
    console.log(`[DomainLayerService] Merged ${mergedLayers.length} layers from ${domainIds.length} domains`)

    // Step 2: Select optimal basemap for domain combination
    const basemap = this.selectOptimalBasemap(domainIds)
    const basemapUrl = basemapToMapboxStyle(basemap)
    console.log(`[DomainLayerService] Selected basemap: ${basemap}`)

    // Step 3: Apply layer configuration
    const layerStore = useLayerStore.getState()

    if (!preserveUserLayers) {
      mergedLayers.forEach(layerConfig => {
        const layer = layerStore.getLayer(layerConfig.id)

        if (layer) {
          layerStore.updateLayer(layerConfig.id, {
            enabled: layerConfig.enabled,
            visible: layerConfig.enabled,
            opacity: layerConfig.opacity,
            zIndex: layerConfig.zIndex
          })
        } else {
          console.log(`[DomainLayerService] Layer ${layerConfig.id} not found in store (may be added later)`)
        }
      })
    }

    // Step 4: Apply basemap and domain-specific features
    if (map) {
      const currentStyle = map.getStyle()
      const currentStyleUrl = (currentStyle as any)?.sprite || ''

      if (!currentStyleUrl.includes(basemap)) {
        console.log(`[DomainLayerService] Changing basemap to ${basemap} (${basemapUrl})`)
        map.setStyle(basemapUrl)

        map.once('style.load', () => {
          setTimeout(() => {
            this.applyMultiDomainFeatures(domainIds, map)
          }, 100)
        })
      } else {
        setTimeout(() => {
          this.applyMultiDomainFeatures(domainIds, map)
        }, 100)
      }
    }

    // Store current domains
    this.currentDomains = domainIds
    this.currentDomain = domainIds[0] // Primary domain for backwards compatibility

    return {
      layersChanged: mergedLayers,
      basemapChanged: basemapUrl,
      viewportChanged: { pitch: 0, bearing: 0, zoom: 12 }
    }
  }

  /**
   * Merge layer configurations from multiple domains
   * Handles conflicts by prioritizing layers with higher priority (lower number)
   */
  private mergeDomainLayers(domainIds: ICDomainId[]): LayerConfig[] {
    const layerMap = new Map<string, LayerConfig>()

    // Collect all layers from all domains
    domainIds.forEach(domainId => {
      const layers = getDomainDefaultLayers(domainId)

      layers.forEach(layer => {
        const existing = layerMap.get(layer.id)

        if (!existing) {
          // New layer - add it
          layerMap.set(layer.id, { ...layer })
        } else {
          // Layer exists in multiple domains - merge intelligently
          // Use the configuration with highest priority (lowest number)
          if (layer.priority < existing.priority) {
            layerMap.set(layer.id, { ...layer })
          } else if (layer.priority === existing.priority) {
            // Same priority - enable if ANY domain wants it enabled
            layerMap.set(layer.id, {
              ...existing,
              enabled: existing.enabled || layer.enabled,
              // Average opacity for balanced visibility
              opacity: (existing.opacity + layer.opacity) / 2,
              // Keep higher zIndex for proper layering
              zIndex: Math.max(existing.zIndex, layer.zIndex)
            })
          }
        }
      })
    })

    // Convert to array and sort by priority
    return Array.from(layerMap.values()).sort((a, b) => a.priority - b.priority)
  }

  /**
   * Select optimal basemap for domain combination
   * Uses intelligent heuristics based on domain mix
   */
  private selectOptimalBasemap(domainIds: ICDomainId[]): BasemapStyle {
    // Priority rules for basemap selection:
    // 1. If Surface domain is present, use satellite-streets (for 3D buildings)
    // 2. If Space domain is present, use dark (for contrast)
    // 3. If Maritime domain is present, prefer satellite
    // 4. Default to light for Ground/Air

    if (domainIds.includes('surface')) {
      return 'satellite-streets' // Best for 3D terrain + buildings
    }

    if (domainIds.includes('space')) {
      return 'dark' // Best for orbital/imagery visualization
    }

    if (domainIds.includes('maritime')) {
      return 'satellite' // Best for ocean/vessel tracking
    }

    // Default for Ground, Air, Subsurface combinations
    return 'light'
  }

  /**
   * Apply features for multi-domain combinations
   */
  private applyMultiDomainFeatures(domainIds: ICDomainId[], map: mapboxgl.Map) {
    // Enable 3D terrain if Surface domain is included
    if (domainIds.includes('surface')) {
      this.enable3DTerrain(map)
    } else {
      this.disable3DTerrain(map)
    }

    // Additional multi-domain feature logic can go here
    // e.g., special overlays for Ground + Space (ground station coverage)
  }

  /**
   * Switch to a new IC operational domain
   * Automatically updates layers, basemap, and viewport
   */
  switchDomain(
    domainId: ICDomainId,
    map: mapboxgl.Map | null,
    options?: {
      animateViewport?: boolean
      preserveUserLayers?: boolean
    }
  ): DomainSwitchResult {
    const { animateViewport = true, preserveUserLayers = false } = options || {}

    console.log(`[DomainLayerService] Switching to ${domainId} domain`)

    // Get domain configuration
    const defaultLayers = getDomainDefaultLayers(domainId)
    const basemap = getDomainBasemap(domainId)
    const basemapUrl = basemapToMapboxStyle(basemap)

    // Get layer store
    const layerStore = useLayerStore.getState()

    // Apply layer configuration
    if (!preserveUserLayers) {
      console.log(`[DomainLayerService] Applying ${defaultLayers.length} default layers for ${domainId}`)

      defaultLayers.forEach(layerConfig => {
        const layer = layerStore.getLayer(layerConfig.id)

        if (layer) {
          // Update existing layer
          layerStore.updateLayer(layerConfig.id, {
            enabled: layerConfig.enabled,
            visible: layerConfig.enabled,
            opacity: layerConfig.opacity,
            zIndex: layerConfig.zIndex
          })
        } else {
          // Layer doesn't exist yet - would be added when data loads
          console.log(`[DomainLayerService] Layer ${layerConfig.id} not found in store (may be added later)`)
        }
      })
    }

    // Apply basemap change
    if (map) {
      const currentStyle = map.getStyle()
      const currentStyleUrl = (currentStyle as any)?.sprite || ''

      // Only change if different
      if (!currentStyleUrl.includes(basemap)) {
        console.log(`[DomainLayerService] Changing basemap to ${basemap} (${basemapUrl})`)
        map.setStyle(basemapUrl)

        // Wait for style to load before applying terrain
        map.once('style.load', () => {
          // Small delay to ensure style is fully ready
          setTimeout(() => {
            this.applyDomainSpecificFeatures(domainId, map)
          }, 100)
        })
      } else {
        // Style is already loaded, apply features with small delay for safety
        setTimeout(() => {
          this.applyDomainSpecificFeatures(domainId, map)
        }, 100)
      }
    }

    // Store current domain
    this.currentDomain = domainId

    return {
      layersChanged: defaultLayers,
      basemapChanged: basemapUrl,
      viewportChanged: { pitch: 0, bearing: 0, zoom: 12 } // Placeholder, would come from config
    }
  }

  /**
   * Apply domain-specific map features (terrain, special layers, etc.)
   */
  private applyDomainSpecificFeatures(domainId: ICDomainId, map: mapboxgl.Map) {
    // Surface domain: Enable 3D terrain
    if (domainId === 'surface') {
      this.enable3DTerrain(map)
    } else {
      // Other domains: Disable terrain for flat view
      this.disable3DTerrain(map)
    }
  }

  /**
   * Enable 3D terrain rendering for Surface domain
   */
  private enable3DTerrain(map: mapboxgl.Map) {
    try {
      console.log('[DomainLayerService] Enabling 3D terrain for Surface domain')

      // Add Mapbox terrain DEM source
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        })
      }

      // Enable terrain with moderate exaggeration
      map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 2.0  // Balanced exaggeration for clear terrain visibility
      })

      // Add hillshading layer with stronger contrast
      if (!map.getLayer('hillshading')) {
        map.addLayer({
          id: 'hillshading',
          type: 'hillshade',
          source: 'mapbox-dem',
          layout: { visibility: 'visible' },
          paint: {
            'hillshade-shadow-color': '#000000',
            'hillshade-illumination-direction': 315,
            'hillshade-exaggeration': 0.8,  // Higher for more pronounced shadows
            'hillshade-accent-color': '#FFFFFF'
          }
        })
      }

      // Add Mapbox 3D buildings for urban terrain obstacles
      if (!map.getLayer('3d-buildings')) {
        map.addLayer({
          id: '3d-buildings',
          type: 'fill-extrusion',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.8
          }
        })
      }

      console.log('[DomainLayerService] 3D terrain and buildings enabled')
    } catch (error) {
      console.error('[DomainLayerService] Failed to enable 3D terrain:', error)
    }
  }

  /**
   * Disable 3D terrain rendering for other domains
   */
  private disable3DTerrain(map: mapboxgl.Map) {
    try {
      // Remove terrain
      if (map.getTerrain()) {
        map.setTerrain(null)
        console.log('[DomainLayerService] 3D terrain disabled')
      }

      // Remove hillshading layer
      if (map.getLayer('hillshading')) {
        map.removeLayer('hillshading')
      }

      // Remove 3D buildings layer
      if (map.getLayer('3d-buildings')) {
        map.removeLayer('3d-buildings')
      }
    } catch (error) {
      console.error('[DomainLayerService] Failed to disable 3D terrain:', error)
    }
  }

  /**
   * Get current active domain
   */
  getCurrentDomain(): ICDomainId | null {
    return this.currentDomain
  }

  /**
   * Get all current active domains (for multi-domain mode)
   */
  getCurrentDomains(): ICDomainId[] {
    return this.currentDomains.length > 0 ? this.currentDomains : (this.currentDomain ? [this.currentDomain] : [])
  }

  /**
   * Enable specific layer for current domain
   */
  enableLayer(layerId: string) {
    const layerStore = useLayerStore.getState()
    layerStore.toggleLayer(layerId)
  }

  /**
   * Disable specific layer for current domain
   */
  disableLayer(layerId: string) {
    const layerStore = useLayerStore.getState()
    layerStore.toggleLayer(layerId)
  }

  /**
   * Get all enabled layers for current domain
   */
  getEnabledLayers(): string[] {
    const layerStore = useLayerStore.getState()
    return Array.from(layerStore.activeLayerIds)
  }
}

/**
 * Singleton instance
 */
let domainLayerServiceInstance: DomainLayerService | null = null

/**
 * Get singleton instance of domain layer service
 */
export function getDomainLayerService(): DomainLayerService {
  if (!domainLayerServiceInstance) {
    domainLayerServiceInstance = new DomainLayerService()
  }
  return domainLayerServiceInstance
}
