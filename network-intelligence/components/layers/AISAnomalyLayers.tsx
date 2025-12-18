'use client'

/**
 * AIS Anomaly Visualization Layers
 *
 * deck.gl layers for visualizing maritime anomalies:
 * - Anomaly markers with severity-based styling
 * - Vessel tracks with anomaly highlights
 * - Rendezvous connections
 * - Loitering areas
 * - AIS gap indicators
 */

import { useMemo, useState, useEffect } from 'react'
import {
  ScatterplotLayer,
  PathLayer,
  ArcLayer,
  TextLayer,
  IconLayer
} from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import type {
  DetectedAnomaly,
  AnomalyType,
  AnomalySeverity,
  VesselTrack,
  TrackPoint,
  AISGapAnomaly,
  LoiteringAnomaly,
  RendezvousAnomaly
} from '@/lib/types/ais-anomaly'

// ============================================================================
// Types
// ============================================================================

export interface AISAnomalyLayerProps {
  anomalies: DetectedAnomaly[]
  vesselTracks: VesselTrack[]
  visible: boolean
  selectedAnomalyId?: string | null
  highlightedVesselMMSI?: string | null
  showLabels?: boolean
  showTracks?: boolean
  showAnomalyMarkers?: boolean
  showRendezvousArcs?: boolean
  showLoiteringAreas?: boolean
  showAISGaps?: boolean
  pulsePhase?: number
  onAnomalyClick?: (anomaly: DetectedAnomaly) => void
  onAnomalyHover?: (anomaly: DetectedAnomaly | null) => void
  onVesselClick?: (track: VesselTrack) => void
}

// ============================================================================
// Constants
// ============================================================================

// Anomaly type colors (RGBA)
export const ANOMALY_COLORS: Record<AnomalyType, [number, number, number, number]> = {
  AIS_GAP: [255, 59, 48, 220],        // Red
  LOITERING: [255, 149, 0, 200],      // Orange
  RENDEZVOUS: [175, 82, 222, 220],    // Purple
  SPEED_ANOMALY: [255, 204, 0, 200],  // Yellow
  COURSE_DEVIATION: [90, 200, 250, 200] // Cyan
}

// Severity-based glow settings
const SEVERITY_CONFIG: Record<AnomalySeverity, {
  outerRadius: number
  innerRadius: number
  outerOpacity: number
  pulse: boolean
}> = {
  critical: { outerRadius: 2.5, innerRadius: 1.5, outerOpacity: 0.4, pulse: true },
  high: { outerRadius: 2.0, innerRadius: 1.3, outerOpacity: 0.3, pulse: true },
  medium: { outerRadius: 1.5, innerRadius: 1.2, outerOpacity: 0.2, pulse: false },
  low: { outerRadius: 1.2, innerRadius: 1.1, outerOpacity: 0.15, pulse: false }
}

// Anomaly type labels
const ANOMALY_LABELS: Record<AnomalyType, string> = {
  AIS_GAP: 'AIS Gap',
  LOITERING: 'Loitering',
  RENDEZVOUS: 'Rendezvous',
  SPEED_ANOMALY: 'Speed',
  COURSE_DEVIATION: 'Course'
}

// ============================================================================
// Animation Hook
// ============================================================================

export function useAnomalyPulseAnimation(enabled: boolean = true): number {
  const [pulsePhase, setPulsePhase] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setPulsePhase(0)
      return
    }

    let animationId: number
    const startTime = performance.now()
    const PULSE_RATE = 2000 // 2 second cycle

    const animate = () => {
      const elapsed = performance.now() - startTime
      const phase = (elapsed % PULSE_RATE) / PULSE_RATE
      setPulsePhase(phase)
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [enabled])

  return pulsePhase
}

// ============================================================================
// Layer Generation Functions
// ============================================================================

/**
 * Create anomaly marker layers (outer glow + inner marker)
 */
function createAnomalyMarkerLayers(
  anomalies: DetectedAnomaly[],
  pulsePhase: number,
  selectedId: string | null,
  onHover: ((anomaly: DetectedAnomaly | null) => void) | undefined,
  onClick: ((anomaly: DetectedAnomaly) => void) | undefined
): (ScatterplotLayer<DetectedAnomaly> | TextLayer<DetectedAnomaly>)[] {
  // Filter critical/high for glow
  const glowAnomalies = anomalies.filter(
    a => a.severity === 'critical' || a.severity === 'high'
  )

  return [
    // Outer glow layer (critical/high only)
    new ScatterplotLayer<DetectedAnomaly>({
      id: 'anomaly-glow-outer',
      data: glowAnomalies,
      getPosition: d => d.location.coordinates,
      getRadius: d => {
        const config = SEVERITY_CONFIG[d.severity]
        const base = config.outerRadius * 6000
        if (config.pulse) {
          const scale = 1 + 0.3 * Math.sin(pulsePhase * Math.PI * 2)
          return base * scale
        }
        return base
      },
      getFillColor: d => {
        const color = ANOMALY_COLORS[d.type]
        const opacity = SEVERITY_CONFIG[d.severity].outerOpacity * 255
        return [color[0], color[1], color[2], opacity]
      },
      radiusMinPixels: 20,
      radiusMaxPixels: 80,
      pickable: false,
      updateTriggers: {
        getRadius: pulsePhase
      }
    }),

    // Inner glow layer
    new ScatterplotLayer<DetectedAnomaly>({
      id: 'anomaly-glow-inner',
      data: glowAnomalies,
      getPosition: d => d.location.coordinates,
      getRadius: d => SEVERITY_CONFIG[d.severity].innerRadius * 5000,
      getFillColor: d => {
        const color = ANOMALY_COLORS[d.type]
        return [color[0], color[1], color[2], 80]
      },
      radiusMinPixels: 12,
      radiusMaxPixels: 50,
      pickable: false
    }),

    // Main anomaly markers
    new ScatterplotLayer<DetectedAnomaly>({
      id: 'anomaly-markers',
      data: anomalies,
      getPosition: d => d.location.coordinates,
      getRadius: d => {
        const base = d.severity === 'critical' ? 4000 : 3000
        return d.id === selectedId ? base * 1.3 : base
      },
      getFillColor: d => {
        const color = ANOMALY_COLORS[d.type]
        return d.id === selectedId ? [255, 255, 255, 255] : color
      },
      getLineColor: d => {
        const color = ANOMALY_COLORS[d.type]
        return d.id === selectedId ? color : [255, 255, 255, 200]
      },
      lineWidthMinPixels: 2,
      stroked: true,
      radiusMinPixels: 6,
      radiusMaxPixels: 25,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      onHover: (info: PickingInfo<DetectedAnomaly>) => {
        onHover?.(info.object || null)
      },
      onClick: (info: PickingInfo<DetectedAnomaly>) => {
        if (info.object) {
          onClick?.(info.object)
          return true
        }
        return false
      },
      updateTriggers: {
        getRadius: selectedId,
        getFillColor: selectedId,
        getLineColor: selectedId
      }
    }),

    // Labels for markers
    new TextLayer<DetectedAnomaly>({
      id: 'anomaly-labels',
      data: anomalies.filter(a => a.severity === 'critical' || a.severity === 'high'),
      getPosition: d => d.location.coordinates,
      getText: d => ANOMALY_LABELS[d.type],
      getSize: 11,
      getColor: [255, 255, 255, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'top',
      getPixelOffset: [0, 20],
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600,
      outlineWidth: 2,
      outlineColor: [0, 0, 0, 200],
      pickable: false
    })
  ]
}

/**
 * Create vessel track layers
 */
function createVesselTrackLayers(
  tracks: VesselTrack[],
  anomalies: DetectedAnomaly[],
  highlightedMMSI: string | null,
  onVesselClick: ((track: VesselTrack) => void) | undefined
): PathLayer<VesselTrack>[] {
  // Create anomaly segment data
  const anomalySegments = anomalies
    .filter(a => a.location.startCoordinates && a.location.endCoordinates)
    .map(a => ({
      path: [a.location.startCoordinates!, a.location.endCoordinates!],
      type: a.type,
      severity: a.severity
    }))

  return [
    // Base vessel tracks
    new PathLayer<VesselTrack>({
      id: 'vessel-tracks',
      data: tracks,
      getPath: track => track.positions.map(p => p.position),
      getColor: track => {
        if (track.mmsi === highlightedMMSI) {
          return [0, 150, 255, 200]
        }
        // Color by vessel type
        const typeColors: Record<string, [number, number, number, number]> = {
          cargo: [100, 150, 200, 120],
          tanker: [200, 100, 100, 120],
          passenger: [100, 200, 100, 120],
          fishing: [200, 200, 100, 120],
          default: [150, 150, 150, 100]
        }
        return typeColors[track.vesselInfo.type] || typeColors.default
      },
      getWidth: track => track.mmsi === highlightedMMSI ? 4 : 2,
      widthMinPixels: 1,
      widthMaxPixels: 8,
      capRounded: true,
      jointRounded: true,
      pickable: true,
      onClick: (info: PickingInfo<VesselTrack>) => {
        if (info.object) {
          onVesselClick?.(info.object)
          return true
        }
        return false
      },
      updateTriggers: {
        getColor: highlightedMMSI,
        getWidth: highlightedMMSI
      }
    }),

    // Anomaly highlight segments
    new PathLayer<{ path: [number, number][]; type: AnomalyType; severity: AnomalySeverity }>({
      id: 'track-anomaly-highlights',
      data: anomalySegments,
      getPath: d => d.path,
      getColor: d => ANOMALY_COLORS[d.type],
      getWidth: 6,
      widthMinPixels: 3,
      widthMaxPixels: 12,
      capRounded: true,
      pickable: false
    })
  ]
}

/**
 * Create AIS gap visualization layers
 */
function createAISGapLayers(
  anomalies: DetectedAnomaly[]
): (PathLayer<AISGapAnomaly> | ScatterplotLayer<AISGapAnomaly>)[] {
  const aisGaps = anomalies.filter(a => a.type === 'AIS_GAP') as AISGapAnomaly[]

  return [
    // Dashed path showing gap
    new PathLayer<AISGapAnomaly>({
      id: 'ais-gap-paths',
      data: aisGaps.filter(g => g.metadata.reappearancePosition),
      getPath: d => [d.metadata.lastKnownPosition, d.metadata.reappearancePosition!],
      getColor: [255, 59, 48, 150],
      getWidth: 3,
      widthMinPixels: 2,
      widthMaxPixels: 6,
      getDashArray: [8, 4],
      capRounded: true,
      pickable: false
    }),

    // Last known position marker
    new ScatterplotLayer<AISGapAnomaly>({
      id: 'ais-gap-start',
      data: aisGaps,
      getPosition: d => d.metadata.lastKnownPosition,
      getRadius: 2500,
      getFillColor: [255, 100, 100, 200],
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: false
    }),

    // Reappearance position marker
    new ScatterplotLayer<AISGapAnomaly>({
      id: 'ais-gap-end',
      data: aisGaps.filter(g => g.metadata.reappearancePosition),
      getPosition: d => d.metadata.reappearancePosition!,
      getRadius: 2500,
      getFillColor: [100, 255, 100, 200],
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: false
    })
  ]
}

/**
 * Create loitering area visualization
 */
function createLoiteringLayers(
  anomalies: DetectedAnomaly[]
): (ScatterplotLayer<LoiteringAnomaly> | TextLayer<LoiteringAnomaly>)[] {
  const loitering = anomalies.filter(a => a.type === 'LOITERING') as LoiteringAnomaly[]

  return [
    // Loitering area circle
    new ScatterplotLayer<LoiteringAnomaly>({
      id: 'loitering-areas',
      data: loitering,
      getPosition: d => d.metadata.centerPoint,
      getRadius: d => Math.max(d.metadata.radiusMeters, 500),
      getFillColor: [255, 149, 0, 40],
      getLineColor: [255, 149, 0, 180],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      radiusMinPixels: 15,
      radiusMaxPixels: 100,
      pickable: false
    }),

    // Duration label
    new TextLayer<LoiteringAnomaly>({
      id: 'loitering-labels',
      data: loitering,
      getPosition: d => d.metadata.centerPoint,
      getText: d => {
        const hours = Math.floor(d.metadata.durationMinutes / 60)
        const mins = d.metadata.durationMinutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      },
      getSize: 12,
      getColor: [255, 255, 255, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600,
      outlineWidth: 2,
      outlineColor: [255, 149, 0, 200],
      background: true,
      backgroundPadding: [4, 2],
      getBackgroundColor: [255, 149, 0, 200],
      pickable: false
    })
  ]
}

/**
 * Create rendezvous connection arcs
 */
function createRendezvousLayers(
  anomalies: DetectedAnomaly[]
): (ArcLayer<RendezvousAnomaly> | ScatterplotLayer<RendezvousAnomaly>)[] {
  const rendezvous = anomalies.filter(a => a.type === 'RENDEZVOUS') as RendezvousAnomaly[]

  return [
    // Meeting point marker
    new ScatterplotLayer<RendezvousAnomaly>({
      id: 'rendezvous-points',
      data: rendezvous,
      getPosition: d => d.metadata.meetingLocation,
      getRadius: 4000,
      getFillColor: d => d.metadata.inOpenWater
        ? [255, 59, 48, 220]    // Red for open water (suspicious)
        : [175, 82, 222, 180],  // Purple for near port
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: 2,
      stroked: true,
      radiusMinPixels: 10,
      radiusMaxPixels: 30,
      pickable: false
    }),

    // Connection indicator (pulsing ring)
    new ScatterplotLayer<RendezvousAnomaly>({
      id: 'rendezvous-rings',
      data: rendezvous,
      getPosition: d => d.metadata.meetingLocation,
      getRadius: 6000,
      getFillColor: [0, 0, 0, 0],
      getLineColor: d => d.metadata.inOpenWater
        ? [255, 59, 48, 150]
        : [175, 82, 222, 150],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: false,
      radiusMinPixels: 15,
      radiusMaxPixels: 50,
      pickable: false
    })
  ]
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Generate all AIS anomaly visualization layers
 */
export function useAISAnomalyLayers(props: AISAnomalyLayerProps) {
  const {
    anomalies,
    vesselTracks,
    visible,
    selectedAnomalyId = null,
    highlightedVesselMMSI = null,
    showLabels = true,
    showTracks = true,
    showAnomalyMarkers = true,
    showRendezvousArcs = true,
    showLoiteringAreas = true,
    showAISGaps = true,
    pulsePhase = 0,
    onAnomalyClick,
    onAnomalyHover,
    onVesselClick
  } = props

  const layers = useMemo(() => {
    if (!visible) return []

    const allLayers: unknown[] = []

    // Vessel tracks (render first, below anomalies)
    if (showTracks && vesselTracks.length > 0) {
      allLayers.push(
        ...createVesselTrackLayers(vesselTracks, anomalies, highlightedVesselMMSI, onVesselClick)
      )
    }

    // AIS gap indicators
    if (showAISGaps) {
      allLayers.push(...createAISGapLayers(anomalies))
    }

    // Loitering areas
    if (showLoiteringAreas) {
      allLayers.push(...createLoiteringLayers(anomalies))
    }

    // Rendezvous connections
    if (showRendezvousArcs) {
      allLayers.push(...createRendezvousLayers(anomalies))
    }

    // Anomaly markers (render last, on top)
    if (showAnomalyMarkers) {
      const markerLayers = createAnomalyMarkerLayers(
        anomalies,
        pulsePhase,
        selectedAnomalyId,
        onAnomalyHover,
        onAnomalyClick
      )
      // Only add labels layer if showLabels is true
      if (showLabels) {
        allLayers.push(...markerLayers)
      } else {
        allLayers.push(...markerLayers.filter(l => l.id !== 'anomaly-labels'))
      }
    }

    return allLayers
  }, [
    visible,
    anomalies,
    vesselTracks,
    selectedAnomalyId,
    highlightedVesselMMSI,
    showLabels,
    showTracks,
    showAnomalyMarkers,
    showRendezvousArcs,
    showLoiteringAreas,
    showAISGaps,
    pulsePhase,
    onAnomalyClick,
    onAnomalyHover,
    onVesselClick
  ])

  return layers
}

/**
 * Export color utilities for legend/UI
 */
export function getAnomalyColor(type: AnomalyType): string {
  const color = ANOMALY_COLORS[type]
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`
}

export function getAnomalyLabel(type: AnomalyType): string {
  return ANOMALY_LABELS[type]
}

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: AnomalySeverity): [number, number, number, number] {
  const colors: Record<AnomalySeverity, [number, number, number, number]> = {
    critical: [255, 59, 48, 255],   // Red
    high: [255, 149, 0, 255],       // Orange
    medium: [255, 204, 0, 255],     // Yellow
    low: [90, 200, 250, 255]        // Blue
  }
  return colors[severity]
}

// ============================================================================
// Standalone Layer Creation Functions
// ============================================================================

// Helper to get position from anomaly location (handles both formats)
function getAnomalyPosition(location: any): [number, number] {
  if (!location) return [0, 0]
  if (typeof location.lng === 'number' && typeof location.lat === 'number') {
    return [location.lng, location.lat]
  }
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return [location.coordinates[0], location.coordinates[1]] // GeoJSON: [lng, lat]
  }
  return [0, 0]
}

/**
 * Create anomaly marker layers
 */
export function createAnomalyLayers(
  anomalies: DetectedAnomaly[],
  options: {
    visible?: boolean
    selectedAnomalyId?: string | null
    onAnomalyClick?: (anomaly: DetectedAnomaly) => void
  } = {}
) {
  const { visible = true, selectedAnomalyId, onAnomalyClick } = options

  if (!visible || anomalies.length === 0) return []

  // Anomaly markers layer
  const markersLayer = new ScatterplotLayer<DetectedAnomaly>({
    id: 'anomaly-markers',
    data: anomalies,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 8,
    radiusMaxPixels: 25,
    lineWidthMinPixels: 2,
    getPosition: (d) => getAnomalyPosition(d.location),
    getRadius: (d) => {
      const isSelected = d.id === selectedAnomalyId
      const config = SEVERITY_CONFIG[d.severity]
      return isSelected ? 1000 : 600 * config.outerRadius
    },
    getFillColor: (d) => {
      const color = ANOMALY_COLORS[d.type]
      const isSelected = d.id === selectedAnomalyId
      return isSelected
        ? [color[0], color[1], color[2], 255] as [number, number, number, number]
        : color
    },
    getLineColor: (d) => {
      const isSelected = d.id === selectedAnomalyId
      return isSelected ? [255, 255, 255, 255] : [255, 255, 255, 100]
    },
    getLineWidth: (d) => d.id === selectedAnomalyId ? 3 : 1,
    onClick: (info) => {
      if (info.object && onAnomalyClick) {
        onAnomalyClick(info.object)
        return true
      }
      return false
    },
    updateTriggers: {
      getRadius: [selectedAnomalyId],
      getFillColor: [selectedAnomalyId],
      getLineColor: [selectedAnomalyId],
      getLineWidth: [selectedAnomalyId]
    }
  })

  return [markersLayer]
}

/**
 * Create vessel track layer
 */
export function createVesselTrackLayer(
  track: VesselTrack,
  layerId: string,
  options: {
    visible?: boolean
    highlightAnomalies?: boolean
    color?: [number, number, number, number]
  } = {}
) {
  const { visible = true, highlightAnomalies = true, color = [100, 149, 237, 180] } = options

  if (!visible || track.positions.length < 2) return null

  // Build path data
  const pathData = track.positions.map((p, i) => {
    const hasAnomaly = track.anomalies.some(a => {
      const timeDiff = Math.abs(new Date(a.timestamp).getTime() - new Date(p.timestamp).getTime())
      return timeDiff < 10 * 60 * 1000 // Within 10 minutes
    })

    return {
      position: [p.position.lng, p.position.lat] as [number, number],
      timestamp: p.timestamp,
      hasAnomaly,
      index: i
    }
  })

  // Create path coordinates
  const path = pathData.map(p => p.position)

  return new PathLayer({
    id: layerId,
    data: [{ path, anomalySegments: pathData }],
    pickable: false,
    widthScale: 1,
    widthMinPixels: 2,
    widthMaxPixels: 6,
    getPath: (d: any) => d.path,
    getColor: color,
    getWidth: 3,
    opacity: 0.7,
    jointRounded: true,
    capRounded: true
  })
}
