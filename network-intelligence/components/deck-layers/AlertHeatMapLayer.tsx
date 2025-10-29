/**
 * Alert Heat Map Layer - Deck.gl
 * Federal-grade alert density visualization
 *
 * Features:
 * - Priority-weighted hexagon aggregation
 * - Dynamic color ramp (yellow → orange → red)
 * - 3D extrusion for visual prominence
 * - Real-time updates every 30 seconds
 */

'use client'

import { HexagonLayer } from '@deck.gl/aggregation-layers'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface AlertHeatMapLayerProps {
  alerts: IntelligenceAlert[]
  visible?: boolean
  opacity?: number
  radius?: number // Hexagon radius in meters
  elevationScale?: number
}

// Priority weight mapping for heat calculation
const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
}

// Color ramp: Low (yellow) → High (dark red)
const COLOR_RANGE = [
  [255, 255, 178], // Very light yellow
  [254, 217, 118], // Light orange
  [254, 178, 76],  // Orange
  [253, 141, 60],  // Dark orange
  [252, 78, 42],   // Red-orange
  [227, 26, 28],   // Dark red
  [177, 0, 38]     // Very dark red (critical)
]

/**
 * Create Deck.gl HexagonLayer for alert heat map
 */
export function createAlertHeatMapLayer({
  alerts,
  visible = true,
  opacity = 0.8,
  radius = 1000, // 1km hexagons
  elevationScale = 50
}: AlertHeatMapLayerProps) {
  // Convert alerts to point data
  const alertPoints = alerts
    .filter(alert => alert.location) // Only alerts with location data
    .map(alert => ({
      position: alert.location!.coordinates,
      weight: PRIORITY_WEIGHTS[alert.priority] || 1
    }))

  return new HexagonLayer({
    id: 'alert-heatmap-layer',
    data: alertPoints,

    // Positioning
    getPosition: (d: any) => d.position,
    getElevationWeight: (d: any) => d.weight,
    getColorWeight: (d: any) => d.weight,

    // Hexagon properties
    radius,
    elevationScale,
    extruded: true, // 3D hexagons
    coverage: 0.9, // Hexagon coverage (0-1)

    // Visual styling
    colorRange: COLOR_RANGE,
    elevationRange: [0, 1000], // Max elevation in meters

    // Aggregation
    colorAggregation: 'SUM', // Sum weights for color
    elevationAggregation: 'SUM', // Sum weights for height

    // Material properties
    material: {
      ambient: 0.64,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [51, 51, 51]
    },

    // Interactivity
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],

    // Visibility
    visible,
    opacity,

    // Transitions
    transitions: {
      getElevationWeight: {
        duration: 300,
        easing: (t: number) => t * (2 - t) // Ease out quad
      }
    },

    // Tooltip on hover
    onHover: ({ object, x, y }: any) => {
      if (object) {
        const count = object.points?.length || 0
        const totalWeight = object.colorValue || 0

        console.log(`Heat map cell - Alerts: ${count}, Weight: ${totalWeight.toFixed(1)}`)
      }
    }
  })
}

/**
 * Export layer configuration for use in Deck.gl
 */
export const ALERT_HEATMAP_CONFIG = {
  defaultRadius: 1000, // 1km hexagons for city view
  zoomRadiusMap: {
    4: 10000,  // National view: 10km hexagons
    6: 5000,   // State view: 5km
    8: 2000,   // Metro view: 2km
    10: 1000,  // City view: 1km
    12: 500,   // Neighborhood: 500m
    14: 250    // Street level: 250m
  },
  updateInterval: 30000, // 30 seconds
  minDataPoints: 3 // Minimum alerts required to show hexagon
}

/**
 * Helper: Calculate adaptive radius based on zoom level
 */
export function getAdaptiveHexagonRadius(zoom: number): number {
  const { zoomRadiusMap } = ALERT_HEATMAP_CONFIG

  // Find closest zoom level
  const zoomLevels = Object.keys(zoomRadiusMap).map(Number).sort((a, b) => a - b)
  let selectedRadius = ALERT_HEATMAP_CONFIG.defaultRadius

  for (const level of zoomLevels) {
    if (zoom >= level) {
      selectedRadius = zoomRadiusMap[level as keyof typeof zoomRadiusMap]
    } else {
      break
    }
  }

  return selectedRadius
}

/**
 * Hook for using alert heat map with auto-updates
 */
export function useAlertHeatMap(alerts: IntelligenceAlert[], viewport: { zoom: number }) {
  const radius = getAdaptiveHexagonRadius(viewport.zoom)

  return createAlertHeatMapLayer({
    alerts,
    radius,
    visible: true,
    opacity: 0.8,
    elevationScale: viewport.zoom > 10 ? 100 : 50 // More dramatic at closer zoom
  })
}
