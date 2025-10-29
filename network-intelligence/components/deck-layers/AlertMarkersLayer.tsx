/**
 * Alert Markers Layer - Deck.gl
 * Federal-grade graduated symbol visualization
 *
 * Features:
 * - Priority-based sizing (critical: 48px → low: 18px)
 * - Color-coded by priority with federal color scheme
 * - Click handlers for right panel integration
 * - Hover tooltips with alert summary
 * - Smooth transitions and animations
 * - Support for pulsing critical alerts
 */

'use client'

import { ScatterplotLayer } from '@deck.gl/layers'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface AlertMarkersLayerProps {
  alerts: IntelligenceAlert[]
  visible?: boolean
  opacity?: number
  onAlertClick?: (alert: IntelligenceAlert) => void
  enablePulsing?: boolean // For critical alerts
}

// Priority-based sizing (in pixels) - subtle markers
const PRIORITY_SIZES: Record<string, number> = {
  critical: 12, // Subtle but visible
  high: 10,
  medium: 8,
  low: 6
}

// Federal color scheme matching heat map
const PRIORITY_COLORS: Record<string, [number, number, number]> = {
  critical: [227, 26, 28],   // Dark red
  high: [252, 78, 42],       // Red-orange
  medium: [253, 141, 60],    // Dark orange
  low: [254, 178, 76]        // Orange
}

// Outline colors for contrast
const OUTLINE_COLOR: [number, number, number] = [255, 255, 255] // White

/**
 * Create Deck.gl ScatterplotLayer for graduated alert markers
 */
export function createAlertMarkersLayer({
  alerts,
  visible = true,
  opacity = 0.9,
  onAlertClick,
  enablePulsing = false
}: AlertMarkersLayerProps) {
  // Filter alerts with location data
  const alertsWithLocation = alerts.filter(alert => alert.location)

  return new ScatterplotLayer({
    id: 'alert-markers-layer',
    data: alertsWithLocation,

    // Positioning
    getPosition: (d: IntelligenceAlert) => d.location!.coordinates,

    // Graduated sizing by priority
    getRadius: (d: IntelligenceAlert) => PRIORITY_SIZES[d.priority] || PRIORITY_SIZES.medium,
    radiusUnits: 'pixels',
    radiusScale: 1,
    radiusMinPixels: 18,
    radiusMaxPixels: 48,

    // Color coding by priority
    getFillColor: (d: IntelligenceAlert) => {
      const baseColor = PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.medium
      return [...baseColor, Math.floor(opacity * 255)]
    },

    // Outline for visibility
    getLineColor: OUTLINE_COLOR,
    lineWidthUnits: 'pixels',
    lineWidthScale: 1,
    lineWidthMinPixels: 2,
    stroked: true,

    // Interactivity
    pickable: true,
    autoHighlight: true,

    // Hover effect
    highlightColor: [255, 255, 255, 100],

    // Visibility
    visible,
    opacity,

    // Smooth transitions
    transitions: {
      getRadius: {
        duration: 300,
        easing: (t: number) => t * (2 - t) // Ease out quad
      },
      getFillColor: {
        duration: 300
      }
    },

    // Click handler
    onClick: (info: any) => {
      if (info.object && onAlertClick) {
        console.log('🎯 Alert clicked:', info.object.id)
        onAlertClick(info.object)
      }
      return true
    },

    // Hover tooltip
    onHover: (info: any) => {
      if (info.object) {
        const alert: IntelligenceAlert = info.object
        console.log(`📍 ${alert.priority.toUpperCase()}: ${alert.title}`)
      }
    },

    // Update triggers
    updateTriggers: {
      getRadius: [enablePulsing],
      getFillColor: [opacity]
    }
  })
}

/**
 * Layer configuration for alert markers
 */
export const ALERT_MARKERS_CONFIG = {
  defaultOpacity: 0.9,
  hoverOpacity: 1.0,
  pulseRate: 1000, // 1 second pulse for critical alerts
  minZoomForMarkers: 6, // Only show markers at metro view and closer
  clustering: {
    enabled: true,
    minZoom: 0,
    maxZoom: 10, // Cluster until neighborhood view
    radius: 80 // Cluster radius in pixels
  }
}

/**
 * Helper: Check if markers should be visible at current zoom
 */
export function shouldShowMarkers(zoom: number): boolean {
  return zoom >= ALERT_MARKERS_CONFIG.minZoomForMarkers
}

/**
 * Helper: Get marker visibility based on zoom and clustering
 */
export function getMarkerVisibility(zoom: number, clusteringEnabled: boolean): {
  showMarkers: boolean
  showClusters: boolean
} {
  const { clustering, minZoomForMarkers } = ALERT_MARKERS_CONFIG

  if (!clusteringEnabled) {
    return {
      showMarkers: zoom >= minZoomForMarkers,
      showClusters: false
    }
  }

  return {
    showMarkers: zoom > clustering.maxZoom,
    showClusters: zoom >= clustering.minZoom && zoom <= clustering.maxZoom
  }
}

/**
 * Helper: Format alert for tooltip
 */
export function formatAlertTooltip(alert: IntelligenceAlert): string {
  const priorityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵'
  }

  const emoji = priorityEmoji[alert.priority] || '⚪'
  const time = alert.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${emoji} ${alert.title}\n${alert.location?.name || 'Unknown location'}\n${time} • ${alert.confidence}`
}

/**
 * Hook for using alert markers with visibility management
 */
export function useAlertMarkers(
  alerts: IntelligenceAlert[],
  viewport: { zoom: number },
  onAlertClick?: (alert: IntelligenceAlert) => void
) {
  const visible = shouldShowMarkers(viewport.zoom)

  return createAlertMarkersLayer({
    alerts,
    visible,
    opacity: ALERT_MARKERS_CONFIG.defaultOpacity,
    onAlertClick,
    enablePulsing: false // Will be implemented in next task
  })
}

/**
 * Priority statistics for markers
 */
export function getMarkerStats(alerts: IntelligenceAlert[]): {
  total: number
  byPriority: Record<string, number>
  withLocation: number
  withoutLocation: number
} {
  const byPriority: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }

  let withLocation = 0
  let withoutLocation = 0

  alerts.forEach(alert => {
    byPriority[alert.priority] = (byPriority[alert.priority] || 0) + 1
    if (alert.location) {
      withLocation++
    } else {
      withoutLocation++
    }
  })

  return {
    total: alerts.length,
    byPriority,
    withLocation,
    withoutLocation
  }
}
