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

      console.log('[DomainLayerService] 3D terrain enabled')
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
