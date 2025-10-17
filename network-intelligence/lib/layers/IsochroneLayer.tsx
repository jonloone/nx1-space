/**
 * Isochrone Layer
 *
 * Visualizes reachability zones from a point based on travel time.
 * Shows areas accessible within specified time thresholds (e.g., 15, 30, 45 minutes).
 *
 * Use Cases:
 * - Ground station accessibility analysis
 * - Service coverage area visualization
 * - Site selection based on travel time
 * - Emergency response time analysis
 * - Market reachability studies
 *
 * Powered by Valhalla routing engine (not available with Mapbox)
 */

'use client'

import { useMemo, useEffect, useState } from 'react'
import { PolygonLayer } from '@deck.gl/layers'
import { generateIsochrone, type TransportMode } from '@/lib/services/valhallaRoutingService'

export interface IsochroneLayerOptions {
  id?: string
  center: [number, number] // [lng, lat]
  mode?: TransportMode
  contours?: number[] // Time contours in minutes
  visible?: boolean
  opacity?: number
  interactive?: boolean
  onHover?: (info: any) => void
  onClick?: (info: any) => void
}

interface IsochroneData {
  contours: Array<{
    time: number
    geometry: {
      type: 'Polygon'
      coordinates: [number, number][][]
    }
    color: string
  }>
  loading: boolean
  error?: string
}

/**
 * Hook to generate and cache isochrone data
 */
export function useIsochroneData(
  center: [number, number],
  mode: TransportMode = 'driving',
  contours: number[] = [15, 30, 45]
): IsochroneData {
  const [data, setData] = useState<IsochroneData>({
    contours: [],
    loading: true
  })

  useEffect(() => {
    let cancelled = false

    async function fetchIsochrones() {
      setData({ contours: [], loading: true })

      try {
        const result = await generateIsochrone({
          center,
          mode,
          contours,
          polygons: true,
          denoise: 0.5
        })

        if (!cancelled) {
          setData({
            contours: result.map(r => ({
              time: r.time,
              geometry: r.geometry as { type: 'Polygon'; coordinates: [number, number][][] },
              color: r.color || getDefaultColor(r.time)
            })),
            loading: false
          })
        }
      } catch (error) {
        console.error('❌ Failed to generate isochrones:', error)
        if (!cancelled) {
          setData({
            contours: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to generate isochrones'
          })
        }
      }
    }

    fetchIsochrones()

    return () => {
      cancelled = true
    }
  }, [center[0], center[1], mode, contours.join(',')])

  return data
}

/**
 * Create DeckGL polygon layers for isochrone visualization
 */
export function useIsochroneLayers(options: IsochroneLayerOptions) {
  const {
    id = 'isochrone',
    center,
    mode = 'driving',
    contours = [15, 30, 45],
    visible = true,
    opacity = 0.4,
    interactive = true,
    onHover,
    onClick
  } = options

  const isochroneData = useIsochroneData(center, mode, contours)

  const layers = useMemo(() => {
    if (!visible || isochroneData.loading || isochroneData.contours.length === 0) {
      return []
    }

    // Create a layer for each contour (largest to smallest for proper rendering)
    const sortedContours = [...isochroneData.contours].sort((a, b) => b.time - a.time)

    return sortedContours.map((contour, index) => {
      const hexColor = hexToRgb(contour.color)

      return new PolygonLayer({
        id: `${id}-contour-${contour.time}`,
        data: [contour.geometry],
        filled: true,
        stroked: true,
        extruded: false,
        wireframe: false,
        lineWidthMinPixels: 2,
        getPolygon: (d: any) => d.coordinates[0], // Extract outer ring
        getFillColor: [...hexColor, opacity * 255],
        getLineColor: [...hexColor, 255],
        getLineWidth: 2,
        pickable: interactive,
        onHover: onHover ? (info: any) => {
          if (info.picked) {
            onHover({
              ...info,
              object: {
                time: contour.time,
                mode,
                type: 'isochrone'
              }
            })
          }
        } : undefined,
        onClick: onClick ? (info: any) => {
          if (info.picked) {
            onClick({
              ...info,
              object: {
                time: contour.time,
                mode,
                type: 'isochrone'
              }
            })
          }
        } : undefined,
        updateTriggers: {
          getFillColor: [opacity, contour.color],
          getLineColor: [contour.color]
        }
      })
    })
  }, [
    id,
    visible,
    isochroneData.loading,
    isochroneData.contours,
    opacity,
    interactive,
    mode,
    onHover,
    onClick
  ])

  return {
    layers,
    loading: isochroneData.loading,
    error: isochroneData.error
  }
}

/**
 * Get default color for time contour
 */
function getDefaultColor(minutes: number): string {
  if (minutes <= 15) return '#10B981' // Green - Close
  if (minutes <= 30) return '#F59E0B' // Orange - Medium
  if (minutes <= 45) return '#EF4444' // Red - Far
  return '#7C3AED' // Purple - Very far
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0]
}

/**
 * Helper function to format time for display
 */
export function formatIsochroneTime(minutes: number, mode: TransportMode): string {
  const modeLabel = mode === 'driving' ? 'drive' : mode === 'walking' ? 'walk' : 'cycle'
  return `${minutes} min ${modeLabel}`
}

/**
 * Get legend data for isochrone visualization
 */
export function getIsochroneLegend(contours: number[], mode: TransportMode) {
  return contours.map(time => ({
    label: formatIsochroneTime(time, mode),
    color: getDefaultColor(time),
    time
  }))
}
