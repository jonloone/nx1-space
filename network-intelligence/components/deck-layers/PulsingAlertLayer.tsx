/**
 * Pulsing Alert Layer - Deck.gl
 * Pure functions for animated critical alert visualization with pulsing "breathing" effect
 *
 * Features:
 * - Smooth sine-wave pulsing animation (1s cycle)
 * - Only affects critical priority alerts
 * - 100% → 130% size variation
 * - Zero React hooks - animation state managed by parent
 * - Minimal performance impact
 */

'use client'

import { ScatterplotLayer } from '@deck.gl/layers'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

export interface PulsingAlertLayerConfig {
  alerts: IntelligenceAlert[]
  pulsePhase: number // 0-1: Current phase in animation cycle
  visible?: boolean
  opacity?: number
  onAlertClick?: (alert: IntelligenceAlert) => void
  pulseAmplitude?: number // Size multiplier at peak (1.0 = no pulse, 1.3 = 30% larger)
}

// Base size for critical alerts (matches AlertMarkersLayer)
const CRITICAL_BASE_SIZE = 12

// Color for critical alerts (dark red)
const CRITICAL_COLOR: [number, number, number] = [227, 26, 28]
const OUTLINE_COLOR: [number, number, number] = [255, 255, 255]

/**
 * Calculate pulse scale factor using sine wave
 * Returns 1.0 to pulseAmplitude in a smooth breathing pattern
 *
 * @param phase - Current animation phase (0-1)
 * @param pulseAmplitude - Maximum scale at peak (default 1.3 = 30% increase)
 * @returns Scale factor for radius
 */
export function calculatePulseScale(
  phase: number,
  pulseAmplitude: number = 1.3
): number {
  // Sine wave: -1 → 0 → 1 → 0 → -1 (smooth breathing)
  const sineWave = Math.sin(phase * Math.PI * 2)

  // Map from [-1, 1] to [1.0, pulseAmplitude]
  const normalized = (sineWave + 1) / 2 // Now [0, 1]
  const scale = 1.0 + (normalized * (pulseAmplitude - 1.0))

  return scale
}

/**
 * Create Deck.gl ScatterplotLayer with pulsing animation for critical alerts
 * Pure function - no React hooks, no side effects
 *
 * @param config - Layer configuration including current pulse phase
 * @returns ScatterplotLayer or null if no critical alerts
 */
export function createPulsingAlertLayer({
  alerts,
  pulsePhase,
  visible = true,
  opacity = 0.95,
  onAlertClick,
  pulseAmplitude = 1.3
}: PulsingAlertLayerConfig): ScatterplotLayer | null {
  // Filter only critical alerts with location
  const criticalAlerts = alerts.filter(
    alert => alert.priority === 'critical' && alert.location
  )

  if (!visible || criticalAlerts.length === 0) {
    return null
  }

  // Calculate current scale based on pulse phase
  const currentScale = calculatePulseScale(pulsePhase, pulseAmplitude)
  const radiusPixels = CRITICAL_BASE_SIZE * currentScale

  return new ScatterplotLayer({
    id: 'pulsing-alert-layer',
    data: criticalAlerts,

    // Positioning
    getPosition: (d: IntelligenceAlert) => d.location!.coordinates,

    // Pulsing radius - changes with animation phase
    getRadius: radiusPixels,
    radiusUnits: 'pixels',

    // Critical red color
    getFillColor: [...CRITICAL_COLOR, Math.floor(opacity * 255)],

    // White outline for high contrast
    getLineColor: OUTLINE_COLOR,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 3, // Thicker outline for pulsing alerts
    stroked: true,

    // Interactivity
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 150],

    // Visibility
    visible,
    opacity,

    // No transitions - handled by animation loop
    transitions: undefined,

    // Click handler
    onClick: (info: any) => {
      if (info.object && onAlertClick) {
        console.log('🚨 Critical alert clicked:', info.object.id)
        onAlertClick(info.object)
      }
      return true
    },

    // Hover tooltip
    onHover: (info: any) => {
      if (info.object) {
        const alert: IntelligenceAlert = info.object
        console.log(`🔴 CRITICAL: ${alert.title}`)
      }
    },

    // Update trigger based on pulse phase
    updateTriggers: {
      getRadius: pulsePhase
    }
  })
}

/**
 * Configuration for pulsing alerts
 */
export const PULSING_CONFIG = {
  pulseRate: 1000, // 1 second per cycle (milliseconds)
  pulseAmplitude: 1.3, // 30% size increase at peak
  minZoomForPulsing: 8, // Only pulse at metro view and closer
  enableGlow: true, // Future: add glow effect
  glowIntensity: 0.5
}

/**
 * Check if pulsing should be enabled at current zoom level
 *
 * @param zoom - Current map zoom level
 * @returns true if zoom >= minimum pulsing zoom
 */
export function shouldEnablePulsing(zoom: number): boolean {
  return zoom >= PULSING_CONFIG.minZoomForPulsing
}

/**
 * Get critical alerts that need pulsing visualization
 *
 * @param alerts - All alerts
 * @returns Filtered array of critical alerts with locations
 */
export function getCriticalAlertsForPulsing(
  alerts: IntelligenceAlert[]
): IntelligenceAlert[] {
  return alerts.filter(
    alert => alert.priority === 'critical' && alert.location
  )
}

/**
 * Performance metrics for pulsing animation
 *
 * @param criticalAlertCount - Number of critical alerts being animated
 * @param fps - Target frames per second
 * @returns Performance assessment
 */
export function getPulsingPerformanceMetrics(
  criticalAlertCount: number,
  fps: number = 60
): {
  estimatedCPULoad: string
  recommended: boolean
  maxRecommendedAlerts: number
} {
  const maxRecommended = 100
  const cpuLoadPercent = (criticalAlertCount / maxRecommended) * 100

  return {
    estimatedCPULoad: `${cpuLoadPercent.toFixed(1)}%`,
    recommended: criticalAlertCount <= maxRecommended,
    maxRecommendedAlerts: maxRecommended
  }
}
