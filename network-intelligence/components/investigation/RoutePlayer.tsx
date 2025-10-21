'use client'

/**
 * Route Player Component
 *
 * Animated playback of subject movement with temporal visualization.
 * Integrates with timeline controls for temporal analysis.
 *
 * Features:
 * - Animated path playback
 * - Color-coded by time of day
 * - Speed indicators
 * - Transport mode visualization
 * - Current position marker
 * - Trail effect
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers'
import type { TrackingPoint, RouteSegment } from '@/lib/demo/investigation-demo-data'

interface RoutePlayerProps {
  trackingPoints: TrackingPoint[]
  routeSegments: RouteSegment[]
  currentTime?: Date
  isPlaying?: boolean
  showTrail?: boolean
  onTimeUpdate?: (time: Date) => void
}

/**
 * Get color based on time of day
 */
const getTimeOfDayColor = (timestamp: Date): [number, number, number] => {
  const hour = timestamp.getHours()

  if (hour >= 5 && hour < 9) {
    // Early morning - Orange
    return [251, 146, 60]
  } else if (hour >= 9 && hour < 12) {
    // Morning - Yellow
    return [250, 204, 21]
  } else if (hour >= 12 && hour < 17) {
    // Afternoon - Blue
    return [59, 130, 246]
  } else if (hour >= 17 && hour < 21) {
    // Evening - Purple
    return [139, 92, 246]
  } else if (hour >= 21 || hour < 5) {
    // Night/Late night - Red (suspicious)
    return [239, 68, 68]
  } else {
    return [156, 163, 175] // Default gray
  }
}

/**
 * Get transport mode icon
 */
const getTransportModeIcon = (mode: string): string => {
  switch (mode) {
    case 'walking':
      return '🚶'
    case 'driving':
      return '🚗'
    case 'transit':
      return '🚇'
    default:
      return '❓'
  }
}

/**
 * Generate DeckGL layers for route visualization
 */
export function useRoutePlayerLayers({
  trackingPoints,
  routeSegments,
  currentTime,
  showTrail = true
}: RoutePlayerProps) {
  const layers = useMemo(() => {
    const layerArray: any[] = []

    if (!trackingPoints || trackingPoints.length === 0) {
      return layerArray
    }

    // Filter points up to current time
    const currentTimestamp = currentTime?.getTime() || Date.now()
    const visiblePoints = trackingPoints.filter(
      (p) => p.timestamp.getTime() <= currentTimestamp
    )

    if (visiblePoints.length === 0) {
      return layerArray
    }

    // 1. Path Trail Layer - Shows historical movement
    if (showTrail && visiblePoints.length > 1) {
      const pathData = [{
        path: visiblePoints.map(p => [p.lng, p.lat]),
        timestamps: visiblePoints.map(p => p.timestamp)
      }]

      layerArray.push(
        new PathLayer({
          id: 'route-trail',
          data: pathData,
          getPath: (d: any) => d.path,
          getColor: [239, 68, 68, 180], // Red with transparency
          getWidth: 3,
          widthMinPixels: 2,
          widthMaxPixels: 6,
          capRounded: true,
          jointRounded: true,
          billboard: false,
          pickable: false
        })
      )
    }

    // 2. Segment Layers - Color-coded by time of day
    routeSegments.forEach((segment, index) => {
      const segmentStart = segment.startTime.getTime()
      const segmentEnd = segment.endTime.getTime()

      // Only show segments that have started
      if (currentTimestamp >= segmentStart) {
        const color = getTimeOfDayColor(segment.startTime)

        // Calculate how much of the segment to show
        const progress = currentTimestamp >= segmentEnd
          ? 1.0
          : (currentTimestamp - segmentStart) / (segmentEnd - segmentStart)

        const visiblePathLength = Math.floor(segment.path.length * progress)
        const visiblePath = segment.path.slice(0, Math.max(1, visiblePathLength))

        layerArray.push(
          new PathLayer({
            id: `route-segment-${index}`,
            data: [{ path: visiblePath }],
            getPath: (d: any) => d.path,
            getColor: [...color, 255],
            getWidth: 4,
            widthMinPixels: 3,
            widthMaxPixels: 8,
            capRounded: true,
            jointRounded: true,
            billboard: false,
            pickable: true,
            onClick: (info: any) => {
              console.log('Route segment clicked:', segment)
            }
          })
        )
      }
    })

    // 3. Current Position Marker
    const currentPoint = visiblePoints[visiblePoints.length - 1]
    if (currentPoint) {
      layerArray.push(
        new ScatterplotLayer({
          id: 'current-position-pulse',
          data: [currentPoint],
          getPosition: (d: TrackingPoint) => [d.lng, d.lat],
          getFillColor: [239, 68, 68, 100],
          getRadius: 80,
          radiusMinPixels: 20,
          radiusMaxPixels: 100,
          pickable: false,
          stroked: false
        })
      )

      layerArray.push(
        new ScatterplotLayer({
          id: 'current-position-marker',
          data: [currentPoint],
          getPosition: (d: TrackingPoint) => [d.lng, d.lat],
          getFillColor: [239, 68, 68, 255],
          getRadius: 40,
          radiusMinPixels: 8,
          radiusMaxPixels: 40,
          pickable: true,
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          onClick: (info: any) => {
            console.log('Current position:', currentPoint)
          }
        })
      )

      // Heading indicator (arrow)
      if (currentPoint.heading) {
        layerArray.push(
          new ScatterplotLayer({
            id: 'heading-indicator',
            data: [currentPoint],
            getPosition: (d: TrackingPoint) => {
              // Calculate position ahead based on heading
              const distance = 0.0003 // ~30 meters
              const headingRad = (d.heading * Math.PI) / 180
              const lat = d.lat + distance * Math.cos(headingRad)
              const lng = d.lng + distance * Math.sin(headingRad)
              return [lng, lat]
            },
            getFillColor: [239, 68, 68, 255],
            getRadius: 20,
            radiusMinPixels: 4,
            radiusMaxPixels: 20,
            pickable: false
          })
        )
      }
    }

    return layerArray
  }, [trackingPoints, routeSegments, currentTime, showTrail])

  return layers
}

/**
 * Route Player Controls Component
 */
interface RoutePlayerControlsProps {
  isPlaying: boolean
  currentTime: Date
  startTime: Date
  endTime: Date
  playbackSpeed: number
  onPlayPause: () => void
  onTimeSeek: (time: Date) => void
  onSpeedChange: (speed: number) => void
}

export function RoutePlayerControls({
  isPlaying,
  currentTime,
  startTime,
  endTime,
  playbackSpeed,
  onPlayPause,
  onTimeSeek,
  onSpeedChange
}: RoutePlayerControlsProps) {
  const totalDuration = endTime.getTime() - startTime.getTime()
  const currentProgress = (currentTime.getTime() - startTime.getTime()) / totalDuration
  const progressPercent = Math.max(0, Math.min(100, currentProgress * 100))

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value)
    const newTime = new Date(startTime.getTime() + (totalDuration * percent) / 100)
    onTimeSeek(newTime)
  }

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 space-y-2">
      {/* Time Display */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#737373]">{formatTime(currentTime)}</span>
        <span className="text-[#171717] font-medium">
          {Math.round(progressPercent)}%
        </span>
        <span className="text-[#737373]">{formatTime(endTime)}</span>
      </div>

      {/* Progress Slider */}
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={progressPercent}
        onChange={handleSliderChange}
        className="w-full accent-[#EF4444] h-1.5 rounded-full"
      />

      {/* Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPlayPause}
          className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded text-xs font-medium"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#737373]">Speed:</span>
          {[0.5, 1, 2, 5, 10].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-2 py-1 rounded text-[10px] font-medium ${
                playbackSpeed === speed
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default useRoutePlayerLayers
