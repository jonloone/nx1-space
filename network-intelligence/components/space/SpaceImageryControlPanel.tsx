'use client'

/**
 * Space Imagery Control Panel
 * Viewport-first controls for loading satellite imagery
 * Phase 2: Removed zoom gating, uses current viewport bounds
 */

import { useState, useEffect } from 'react'
import type mapboxgl from 'mapbox-gl'
import { Satellite, MapPin, Maximize2, Loader2, Info } from 'lucide-react'
import { useSpaceStore } from '@/lib/stores/spaceStore'

interface SpaceImageryControlPanelProps {
  map: mapboxgl.Map | null
  className?: string
}

export function SpaceImageryControlPanel({ map, className = '' }: SpaceImageryControlPanelProps) {
  const { loadTimeSeries, isLoading, images, currentLocation } = useSpaceStore()
  const [currentZoom, setCurrentZoom] = useState(4)
  const [viewportBounds, setViewportBounds] = useState<{
    north: number
    south: number
    east: number
    west: number
  } | null>(null)

  // Track zoom and viewport changes
  useEffect(() => {
    if (!map) return

    const updateViewport = () => {
      const zoom = map.getZoom()
      setCurrentZoom(zoom)

      // Get viewport bounds
      const bounds = map.getBounds()
      setViewportBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    }

    // Initial check
    updateViewport()

    // Listen for viewport changes
    map.on('move', updateViewport)
    map.on('zoom', updateViewport)

    return () => {
      map.off('move', updateViewport)
      map.off('zoom', updateViewport)
    }
  }, [map])

  const handleQueryImagery = () => {
    if (!map) return

    const center = map.getCenter()
    const location: [number, number] = [center.lng, center.lat]

    console.log('🛰️ Querying imagery for viewport:', viewportBounds, 'zoom:', currentZoom.toFixed(1))

    // Generate location name from center coordinates
    const locationName = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`

    loadTimeSeries(location, locationName)
  }

  const hasImageryLoaded = images.length > 0

  return (
    <div className={`bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Satellite className="w-5 h-5 text-blue-500" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Satellite Imagery</h3>
          <p className="text-xs text-gray-400">Sentinel-2 time-series analysis</p>
        </div>
      </div>

      {/* Viewport Info */}
      {viewportBounds && (
        <div className="mb-3 px-3 py-2 bg-gray-800/50 rounded space-y-1">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-300">Current Viewport</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono">
            <div className="text-gray-500">N: <span className="text-gray-400">{viewportBounds.north.toFixed(4)}</span></div>
            <div className="text-gray-500">E: <span className="text-gray-400">{viewportBounds.east.toFixed(4)}</span></div>
            <div className="text-gray-500">S: <span className="text-gray-400">{viewportBounds.south.toFixed(4)}</span></div>
            <div className="text-gray-500">W: <span className="text-gray-400">{viewportBounds.west.toFixed(4)}</span></div>
          </div>
          <div className="pt-1 border-t border-gray-700/50 mt-1">
            <span className="text-[10px] text-gray-500">Zoom: <span className="text-gray-400 font-medium">{currentZoom.toFixed(1)}</span></span>
          </div>
        </div>
      )}

      {/* Query Imagery Button */}
      <button
        onClick={handleQueryImagery}
        disabled={isLoading}
        className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
          !isLoading
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Querying Imagery...</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4" />
            <span>Query Imagery in View</span>
          </>
        )}
      </button>

      {/* Info Tip */}
      {!hasImageryLoaded && !isLoading && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-blue-900/20 border border-blue-900/30 rounded text-xs text-blue-400">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Pan and zoom the map to your area of interest, then click to query available imagery</p>
        </div>
      )}

      {/* Status Info */}
      {hasImageryLoaded && currentLocation && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-400">Imagery Loaded</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Center:</span>
            <span className="text-gray-300 font-mono">
              {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500">Images:</span>
            <span className="text-blue-400 font-medium">{images.length} scenes</span>
          </div>
        </div>
      )}
    </div>
  )
}
