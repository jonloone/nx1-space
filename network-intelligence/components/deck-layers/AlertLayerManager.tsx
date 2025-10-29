/**
 * Alert Layer Manager
 * Pure functions for unified management of all alert visualization layers
 *
 * Integrates:
 * - Heat map layer (HexagonLayer)
 * - Cluster layer (ScatterplotLayer + Supercluster)
 * - Individual markers (ScatterplotLayer)
 * - Pulsing critical alerts (animated ScatterplotLayer)
 *
 * Features:
 * - Automatic layer selection based on zoom level
 * - Performance optimization
 * - Click handlers for right panel integration
 * - Real-time alert updates
 * - Zero React hooks - pure functional architecture
 */

'use client'

import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { createAlertHeatMapLayer, getAdaptiveHexagonRadius } from './AlertHeatMapLayer'
import { createAlertClusterLayers } from './AlertClusterLayer'
import { createAlertMarkersLayer } from './AlertMarkersLayer'
import { createPulsingAlertLayer, shouldEnablePulsing } from './PulsingAlertLayer'

export interface AlertLayerManagerConfig {
  alerts: IntelligenceAlert[]
  viewport: {
    zoom: number
    latitude: number
    longitude: number
    bounds?: [number, number, number, number]
  }
  pulsePhase: number // Current animation phase (0-1)
  onAlertClick?: (alert: IntelligenceAlert) => void
  onClusterClick?: (
    clusterId: number,
    expansionZoom: number,
    clusterAlerts: IntelligenceAlert[],
    coordinates: [number, number]
  ) => void
  layerVisibility?: {
    heatMap?: boolean
    clusters?: boolean
    markers?: boolean
    pulsing?: boolean
  }
}

export interface LayerVisibility {
  heatMap: boolean
  clusters: boolean
  markers: boolean
  pulsing: boolean
}

/**
 * Determine which layers should be visible at current zoom level
 * Pure function - no side effects
 */
export function getLayerVisibilityForZoom(
  zoom: number,
  customVisibility?: Partial<LayerVisibility>
): LayerVisibility {
  // Industry-standard zoom thresholds:
  // - Google Maps clusters up to zoom 14
  // - Mapbox clusters up to zoom 14
  // - We use zoom 12 as threshold (neighborhood → street level)
  const CLUSTER_MAX_ZOOM = 12
  const DETAIL_MIN_ZOOM = 13

  const defaults: LayerVisibility = {
    // Heat map: Disabled (not needed with proper clustering)
    heatMap: false,

    // Clusters: Show at low to medium zoom (country → neighborhood)
    clusters: zoom <= CLUSTER_MAX_ZOOM,

    // Individual markers: Show at high zoom (street level and closer)
    markers: zoom >= DETAIL_MIN_ZOOM,

    // Pulsing: Only at street level (zoom 13+) for critical alerts
    pulsing: zoom >= DETAIL_MIN_ZOOM
  }

  // Override with custom visibility if provided
  return {
    heatMap: customVisibility?.heatMap ?? defaults.heatMap,
    clusters: customVisibility?.clusters ?? defaults.clusters,
    markers: customVisibility?.markers ?? defaults.markers,
    pulsing: customVisibility?.pulsing ?? defaults.pulsing
  }
}

/**
 * Create all alert layers based on current viewport and configuration
 * Pure function - no React hooks, no side effects
 *
 * @param config - Layer configuration including viewport and pulse phase
 * @returns Array of Deck.gl layers in rendering order
 */
export function createAlertLayers(config: AlertLayerManagerConfig): any[] {
  const { alerts, viewport, pulsePhase, onAlertClick, onClusterClick, layerVisibility } = config
  const { zoom, bounds } = viewport

  // Determine which layers to show
  const visibility = getLayerVisibilityForZoom(zoom, layerVisibility)

  const allLayers: any[] = []

  // 1. Heat map layer (bottom layer - density overview)
  if (visibility.heatMap) {
    const radius = getAdaptiveHexagonRadius(zoom)
    const heatMapLayer = createAlertHeatMapLayer({
      alerts,
      radius,
      visible: true,
      opacity: 0.8,
      elevationScale: zoom > 10 ? 100 : 50
    })
    if (heatMapLayer) {
      allLayers.push(heatMapLayer)
    }
  }

  // 2. Cluster layers (middle layer - for zoom 0-10)
  if (visibility.clusters && bounds) {
    const clusterLayers = createAlertClusterLayers({
      alerts,
      zoom,
      bounds,
      visible: true,
      onClusterClick: (clusterId, expansionZoom, clusterAlerts, coordinates) => {
        console.log(`🔍 Cluster clicked: ${clusterAlerts.length} alerts at [${coordinates}]`)
        if (onClusterClick) {
          onClusterClick(clusterId, expansionZoom, clusterAlerts, coordinates)
        }
      },
      onAlertClick: (alert) => {
        console.log(`🎯 Alert clicked from cluster: ${alert.title}`)
        if (onAlertClick) {
          onAlertClick(alert)
        }
      }
    })
    allLayers.push(...clusterLayers)
  }

  // 3. Individual marker layer (shown when not clustering)
  if (visibility.markers) {
    const markerLayer = createAlertMarkersLayer({
      alerts,
      visible: true,
      opacity: 0.9,
      onAlertClick: (alert) => {
        console.log(`🎯 Alert clicked: ${alert.title}`)
        if (onAlertClick) {
          onAlertClick(alert)
        }
      },
      enablePulsing: false // Pulsing handled by separate layer
    })
    if (markerLayer) {
      allLayers.push(markerLayer)
    }
  }

  // 4. Pulsing layer for critical alerts (topmost - draws attention)
  if (visibility.pulsing) {
    const pulsingLayer = createPulsingAlertLayer({
      alerts,
      pulsePhase,
      visible: true,
      opacity: 0.95,
      onAlertClick: (alert) => {
        console.log(`🚨 Critical alert clicked: ${alert.title}`)
        if (onAlertClick) {
          onAlertClick(alert)
        }
      }
    })
    if (pulsingLayer) {
      allLayers.push(pulsingLayer)
    }
  }

  return allLayers
}

/**
 * Calculate layer statistics for debugging/monitoring
 * Pure function - no hooks
 */
export function getAlertLayerStats(
  alerts: IntelligenceAlert[],
  zoom: number
): {
  totalAlerts: number
  alertsWithLocation: number
  criticalAlerts: number
  byPriority: {
    critical: number
    high: number
    medium: number
    low: number
  }
  activeLayers: LayerVisibility
  zoom: number
} {
  const visibility = getLayerVisibilityForZoom(zoom)

  const alertsWithLocation = alerts.filter(a => a.location)
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' && a.location)

  const byPriority = {
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length
  }

  return {
    totalAlerts: alerts.length,
    alertsWithLocation: alertsWithLocation.length,
    criticalAlerts: criticalAlerts.length,
    byPriority,
    activeLayers: visibility,
    zoom
  }
}

/**
 * Configuration export
 */
export const ALERT_LAYER_CONFIG = {
  // Zoom thresholds
  zoomThresholds: {
    clusterEnd: 10,      // Stop clustering
    markersStart: 6,     // Start showing individual markers
    pulsingStart: 8,     // Start pulsing critical alerts
    heatMapAdaptive: true // Always adjust heat map radius
  },

  // Performance limits
  performance: {
    maxAlerts: 10000,           // Maximum alerts to render
    maxClusters: 1000,          // Maximum clusters to show
    updateThrottle: 100,        // ms between layer updates
    enableWebGL2: true          // Use WebGL2 if available
  },

  // Visual settings
  visual: {
    heatMapOpacity: 0.8,
    markerOpacity: 0.9,
    pulsingOpacity: 0.95,
    clusterOpacity: 0.9
  }
}

/**
 * Performance check
 * Pure function - analyzes alert count and zoom level
 */
export function checkAlertLayerPerformance(
  alertCount: number,
  zoom: number
): {
  performanceLevel: 'excellent' | 'good' | 'degraded' | 'poor'
  recommendations: string[]
  estimatedFPS: number
} {
  const { maxAlerts } = ALERT_LAYER_CONFIG.performance

  let performanceLevel: 'excellent' | 'good' | 'degraded' | 'poor' = 'excellent'
  const recommendations: string[] = []
  let estimatedFPS = 60

  if (alertCount > maxAlerts) {
    performanceLevel = 'poor'
    estimatedFPS = 15
    recommendations.push(`Alert count (${alertCount}) exceeds maximum (${maxAlerts})`)
    recommendations.push('Consider filtering alerts by time range or priority')
  } else if (alertCount > maxAlerts * 0.7) {
    performanceLevel = 'degraded'
    estimatedFPS = 30
    recommendations.push('High alert count may impact performance')
  } else if (alertCount > maxAlerts * 0.4) {
    performanceLevel = 'good'
    estimatedFPS = 50
  }

  // Zoom-based recommendations
  if (zoom < 6 && alertCount > 1000) {
    recommendations.push('Use clustering at low zoom levels for better performance')
  }

  if (zoom > 14 && alertCount > 500) {
    recommendations.push('Consider using viewport filtering at high zoom levels')
  }

  return {
    performanceLevel,
    recommendations,
    estimatedFPS
  }
}
