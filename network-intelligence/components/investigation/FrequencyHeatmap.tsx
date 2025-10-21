'use client'

/**
 * Frequency Heatmap Integration
 *
 * Integrates with existing heatmap system to visualize location frequency
 * analysis for pattern-of-life investigation.
 *
 * Uses existing heatmap-analysis.ts engine with new LOCATION_FREQUENCY mode.
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React, { useMemo } from 'react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import type { LocationStop } from '@/lib/demo/investigation-demo-data'

interface FrequencyHeatmapProps {
  locations: LocationStop[]
  visible?: boolean
  intensity?: number
  radiusPixels?: number
}

/**
 * Convert location stops to heatmap data points
 */
function convertToHeatmapData(locations: LocationStop[]) {
  return locations.flatMap(location => {
    // Create multiple points weighted by visit count and dwell time
    const weight = location.visitCount * (1 + location.dwellTimeMinutes / 100)

    // Add significance multiplier
    const significanceMultiplier =
      location.significance === 'anomaly' ? 3.0 :
      location.significance === 'suspicious' ? 2.0 : 1.0

    const finalWeight = weight * significanceMultiplier

    // Generate points (one per visit for better visualization)
    return Array(location.visitCount).fill(null).map(() => ({
      position: [location.lng, location.lat],
      weight: finalWeight / location.visitCount
    }))
  })
}

/**
 * Generate DeckGL heatmap layer for location frequency
 */
export function useFrequencyHeatmapLayer({
  locations,
  visible = true,
  intensity = 1.0,
  radiusPixels = 50
}: FrequencyHeatmapProps) {
  const layer = useMemo(() => {
    if (!visible || !locations || locations.length === 0) {
      return null
    }

    const heatmapData = convertToHeatmapData(locations)

    return new HeatmapLayer({
      id: 'investigation-frequency-heatmap',
      data: heatmapData,
      getPosition: (d: any) => d.position,
      getWeight: (d: any) => d.weight,
      radiusPixels: radiusPixels,
      intensity: intensity,
      threshold: 0.05,
      colorRange: [
        [255, 255, 204, 0],     // Transparent yellow (low)
        [255, 237, 160, 100],   // Light yellow
        [254, 217, 118, 150],   // Yellow-orange
        [254, 178, 76, 200],    // Orange
        [253, 141, 60, 220],    // Dark orange
        [252, 78, 42, 255],     // Red-orange
        [227, 26, 28, 255],     // Red
        [189, 0, 38, 255]       // Dark red (high)
      ],
      aggregation: 'SUM',
      pickable: false
    })
  }, [locations, visible, intensity, radiusPixels])

  return layer
}

/**
 * Heatmap Control Panel Component
 */
interface HeatmapControlProps {
  visible: boolean
  intensity: number
  radius: number
  onVisibilityChange: (visible: boolean) => void
  onIntensityChange: (intensity: number) => void
  onRadiusChange: (radius: number) => void
}

export function FrequencyHeatmapControl({
  visible,
  intensity,
  radius,
  onVisibilityChange,
  onIntensityChange,
  onRadiusChange
}: HeatmapControlProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#171717]">Frequency Heatmap</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => onVisibilityChange(e.target.checked)}
            className="w-4 h-4 accent-[#EF4444] rounded"
          />
          <span className="text-xs text-[#525252]">Show</span>
        </label>
      </div>

      {visible && (
        <>
          <div>
            <label className="text-xs text-[#737373] mb-1 block">
              Intensity: {intensity.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="w-full accent-[#EF4444]"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373] mb-1 block">
              Radius: {radius}px
            </label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              className="w-full accent-[#EF4444]"
            />
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-[#E5E5E5]">
            <div className="text-[10px] text-[#737373] mb-1">Activity Level</div>
            <div className="flex h-4 rounded overflow-hidden">
              <div className="flex-1 bg-[#FFFFCC]" title="Low" />
              <div className="flex-1 bg-[#FFEDA0]" title="Low-Medium" />
              <div className="flex-1 bg-[#FED976]" title="Medium" />
              <div className="flex-1 bg-[#FEB24C]" title="Medium-High" />
              <div className="flex-1 bg-[#FD8D3C]" title="High" />
              <div className="flex-1 bg-[#FC4E2A]" title="Very High" />
              <div className="flex-1 bg-[#E31A1C]" title="Critical" />
              <div className="flex-1 bg-[#BD0026]" title="Extreme" />
            </div>
            <div className="flex justify-between text-[9px] text-[#737373] mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default useFrequencyHeatmapLayer
