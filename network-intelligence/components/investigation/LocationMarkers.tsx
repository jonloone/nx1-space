'use client'

/**
 * Location Markers Component
 *
 * Interactive markers at dwell locations with significance indicators.
 * Displays key locations where subject spent time with visual indicators
 * for routine, suspicious, and anomaly classifications.
 *
 * Features:
 * - Color-coded by significance (Routine/Suspicious/Anomaly)
 * - Size scaled by dwell time
 * - Click to open analysis panel
 * - Hover for quick info
 * - Visit count badge
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React, { useMemo } from 'react'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { LocationStop } from '@/lib/demo/investigation-demo-data'

export type RenderQuality = 'minimal' | 'standard' | 'detailed'

interface LocationMarkersProps {
  locations: LocationStop[]
  onLocationClick?: (location: LocationStop) => void
  currentTime?: Date
  showLabels?: boolean
  renderQuality?: RenderQuality
}

/**
 * Get color based on location significance
 */
const getSignificanceColor = (significance: string): [number, number, number] => {
  switch (significance) {
    case 'routine':
      return [16, 185, 129] // Green
    case 'suspicious':
      return [245, 158, 11] // Orange
    case 'anomaly':
      return [239, 68, 68] // Red
    default:
      return [156, 163, 175] // Gray
  }
}

/**
 * Get marker size based on dwell time
 */
const getMarkerSize = (dwellTimeMinutes: number, visitCount: number): number => {
  // Base size on dwell time
  const baseSize = Math.min(100, 30 + dwellTimeMinutes * 0.5)

  // Increase size for multiple visits
  const visitMultiplier = 1 + (visitCount - 1) * 0.2

  return baseSize * visitMultiplier
}

/**
 * Generate DeckGL layers for location markers
 *
 * Render Quality Levels:
 * - minimal: Single marker layer only (1 layer total)
 * - standard: Marker + labels (2 layers total)
 * - detailed: Marker + glow for anomalies + labels (3-4 layers max)
 */
export function useLocationMarkersLayers({
  locations,
  onLocationClick,
  currentTime,
  showLabels = true,
  renderQuality = 'standard'
}: LocationMarkersProps) {
  const layers = useMemo(() => {
    const layerArray: any[] = []

    if (!locations || locations.length === 0) {
      return layerArray
    }

    // Filter locations that have been visited by current time
    const currentTimestamp = currentTime?.getTime() || Date.now()
    const visibleLocations = locations.filter(
      (loc) => loc.arrivalTime.getTime() <= currentTimestamp
    )

    if (visibleLocations.length === 0) {
      return layerArray
    }

    // Layer 1: Glow rings for anomalies (detailed mode only)
    if (renderQuality === 'detailed') {
      const anomalies = visibleLocations.filter(loc => loc.significance === 'anomaly')
      if (anomalies.length > 0) {
        layerArray.push(
          new ScatterplotLayer({
            id: 'location-markers-glow',
            data: anomalies,
            getPosition: (d: LocationStop) => [d.lng, d.lat],
            getFillColor: (d: LocationStop) => {
              const color = getSignificanceColor(d.significance)
              return [...color, 60] // Reduced opacity for subtlety
            },
            getRadius: (d: LocationStop) => getMarkerSize(d.dwellTimeMinutes, d.visitCount) * 1.5,
            radiusMinPixels: 18,
            radiusMaxPixels: 150,
            pickable: false,
            stroked: false
          })
        )
      }
    }

    // Layer 2: Main location markers (all quality levels)
    // Single unified marker with white border for visibility
    layerArray.push(
      new ScatterplotLayer({
        id: 'location-markers-main',
        data: visibleLocations,
        getPosition: (d: LocationStop) => [d.lng, d.lat],
        getFillColor: (d: LocationStop) => {
          const color = getSignificanceColor(d.significance)
          return [...color, 230] // Slightly transparent for depth
        },
        getRadius: (d: LocationStop) => getMarkerSize(d.dwellTimeMinutes, d.visitCount),
        radiusMinPixels: 10,
        radiusMaxPixels: 100,
        pickable: true,
        stroked: true,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
        lineWidthMinPixels: 2,
        onClick: (info: any) => {
          if (info.object && onLocationClick) {
            onLocationClick(info.object)
          }
        },
        updateTriggers: {
          getFillColor: [currentTime],
          getRadius: [currentTime]
        }
      })
    )

    // Layer 3: Location labels with visit count (standard & detailed modes)
    if (showLabels && renderQuality !== 'minimal') {
      layerArray.push(
        new TextLayer({
          id: 'location-labels',
          data: visibleLocations,
          getPosition: (d: LocationStop) => [d.lng, d.lat - 0.0004],
          getText: (d: LocationStop) => {
            // Include visit count in label if > 1
            return d.visitCount > 1 ? `${d.name} (${d.visitCount}×)` : d.name
          },
          getSize: 11,
          sizeMinPixels: 9,
          sizeMaxPixels: 13,
          getColor: [23, 23, 23, 255],
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '600',
          pickable: false,
          background: true,
          backgroundPadding: [4, 2],
          getBackgroundColor: [255, 255, 255, 230],
          getBorderColor: [229, 229, 229, 255],
          getBorderWidth: 1
        })
      )
    }

    console.log(`🎨 LocationMarkers: ${layerArray.length} layers (quality: ${renderQuality})`)

    return layerArray
  }, [locations, onLocationClick, currentTime, showLabels, renderQuality])

  return layers
}

/**
 * Location Marker Legend Component
 */
export function LocationMarkerLegend() {
  const significanceLevels = [
    {
      type: 'routine',
      label: 'Routine',
      color: 'bg-[#10B981]',
      description: 'Expected, regular pattern'
    },
    {
      type: 'suspicious',
      label: 'Suspicious',
      color: 'bg-[#F59E0B]',
      description: 'Unusual but not critical'
    },
    {
      type: 'anomaly',
      label: 'Anomaly',
      color: 'bg-[#EF4444]',
      description: 'Critical anomaly requiring attention'
    }
  ]

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-3">
      <h4 className="text-xs font-semibold text-[#171717] mb-3">Location Significance</h4>
      <div className="space-y-2">
        {significanceLevels.map((level) => (
          <div key={level.type} className="flex items-start gap-2">
            <div className={`w-3 h-3 rounded-full ${level.color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#171717]">{level.label}</div>
              <div className="text-[10px] text-[#737373]">{level.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
        <div className="text-[10px] text-[#737373]">
          • Marker size indicates dwell time
          <br />
          • Numbers show visit frequency
          <br />
          • Click markers for detailed analysis
        </div>
      </div>
    </div>
  )
}

export default useLocationMarkersLayers
