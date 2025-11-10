/**
 * Satellite Imagery Map Layer
 * Manages satellite imagery overlay on Mapbox map
 */

import type mapboxgl from 'mapbox-gl'
import type { SatelliteImage } from '../services/satelliteImageryService'
import { getSatelliteImageryService } from '../services/satelliteImageryService'

const LAYER_ID = 'satellite-imagery-temporal'
const SOURCE_ID = 'satellite-imagery-temporal'

export interface SatelliteImageryLayerOptions {
  opacity?: number
  fadeIn?: boolean
  fadeDuration?: number
}

/**
 * Add or update satellite imagery layer on map
 */
export function addSatelliteImageryLayer(
  map: mapboxgl.Map,
  image: SatelliteImage,
  options: SatelliteImageryLayerOptions = {}
) {
  const {
    opacity = 0.8,
    fadeIn = true,
    fadeDuration = 300
  } = options

  console.log(`🗺️ Adding satellite imagery layer: ${image.id}`)

  // Remove existing layer and source
  if (map.getLayer(LAYER_ID)) {
    map.removeLayer(LAYER_ID)
  }
  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID)
  }

  // Get tile info for the image
  const imageryService = getSatelliteImageryService()
  const tileInfo = imageryService.getTileLayer(image)

  if (!tileInfo.url) {
    console.warn('⚠️ No tile URL available for image, skipping layer')
    return
  }

  try {
    // Add new raster source
    map.addSource(SOURCE_ID, {
      type: 'raster',
      tiles: [tileInfo.url],
      tileSize: tileInfo.tileSize,
      minzoom: tileInfo.minZoom,
      maxzoom: tileInfo.maxZoom,
      attribution: tileInfo.attribution
    })

    // Add raster layer
    // Insert below labels but above other data layers
    const beforeLayerId = getInsertionLayer(map)

    map.addLayer({
      id: LAYER_ID,
      type: 'raster',
      source: SOURCE_ID,
      paint: {
        'raster-opacity': fadeIn ? 0 : opacity,
        'raster-fade-duration': fadeDuration,
        'raster-resampling': 'linear'
      }
    }, beforeLayerId)

    // Fade in animation
    if (fadeIn && map.getLayer(LAYER_ID)) {
      setTimeout(() => {
        map.setPaintProperty(LAYER_ID, 'raster-opacity', opacity)
      }, 50)
    }

    console.log(`✓ Satellite imagery layer added successfully`)
  } catch (error) {
    console.error('❌ Failed to add satellite imagery layer:', error)
  }
}

/**
 * Update imagery layer opacity
 */
export function updateSatelliteImageryOpacity(map: mapboxgl.Map, opacity: number) {
  if (!map.getLayer(LAYER_ID)) {
    return
  }

  map.setPaintProperty(LAYER_ID, 'raster-opacity', Math.max(0, Math.min(1, opacity)))
}

/**
 * Remove satellite imagery layer
 */
export function removeSatelliteImageryLayer(map: mapboxgl.Map) {
  if (map.getLayer(LAYER_ID)) {
    map.removeLayer(LAYER_ID)
  }
  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID)
  }

  console.log('🗺️ Satellite imagery layer removed')
}

/**
 * Check if imagery layer is currently active
 */
export function hasSatelliteImageryLayer(map: mapboxgl.Map): boolean {
  return !!map.getLayer(LAYER_ID)
}

/**
 * Get the appropriate layer ID to insert before
 * We want satellite imagery to appear below labels but above most other layers
 */
function getInsertionLayer(map: mapboxgl.Map): string | undefined {
  const layers = map.getStyle()?.layers

  if (!layers) return undefined

  // Try to find a label layer to insert before
  const labelLayer = layers.find(layer =>
    layer.id.includes('label') ||
    layer.id.includes('place') ||
    layer.id.includes('poi')
  )

  return labelLayer?.id
}
