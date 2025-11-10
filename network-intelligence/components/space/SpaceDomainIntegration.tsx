'use client'

/**
 * Space Domain Integration
 * Manages satellite imagery timeline and map overlay integration
 */

import { useEffect, useRef, useState } from 'react'
import type mapboxgl from 'mapbox-gl'
import { SatelliteTimelinePanel } from './SatelliteTimelinePanel'
import { useSpaceStore } from '@/lib/stores/spaceStore'
import {
  addSatelliteImageryLayer,
  updateSatelliteImageryOpacity,
  removeSatelliteImageryLayer,
  hasSatelliteImageryLayer
} from '@/lib/layers/satelliteImageryLayer'
import { Satellite, X } from 'lucide-react'

interface SpaceDomainIntegrationProps {
  map: mapboxgl.Map | null
  isActive: boolean
  initialLocation?: [number, number] // [lng, lat]
  initialLocationName?: string
}

export function SpaceDomainIntegration({
  map,
  isActive,
  initialLocation,
  initialLocationName
}: SpaceDomainIntegrationProps) {
  const {
    selectedImage,
    images,
    isLoading,
    imageOpacity,
    currentLocation,
    loadTimeSeries,
    setImageOpacity
  } = useSpaceStore()

  const [isExpanded, setIsExpanded] = useState(true)
  const hasInitialized = useRef(false)

  // Load initial imagery when activated
  useEffect(() => {
    if (!isActive || !initialLocation || hasInitialized.current) {
      return
    }

    console.log('🛰️ Initializing Space domain imagery for:', initialLocationName)
    loadTimeSeries(initialLocation, initialLocationName)
    hasInitialized.current = true
  }, [isActive, initialLocation, initialLocationName, loadTimeSeries])

  // Update map overlay when selected image changes
  useEffect(() => {
    if (!map || !selectedImage || !isActive) {
      return
    }

    console.log('🗺️ Updating satellite imagery layer:', selectedImage.acquisitionDate)

    try {
      addSatelliteImageryLayer(map, selectedImage, {
        opacity: imageOpacity,
        fadeIn: true,
        fadeDuration: 300
      })
    } catch (error) {
      console.error('Failed to add satellite imagery layer:', error)
    }
  }, [map, selectedImage, isActive, imageOpacity])

  // Update opacity when slider changes
  useEffect(() => {
    if (!map || !hasSatelliteImageryLayer(map)) {
      return
    }

    updateSatelliteImageryOpacity(map, imageOpacity)
  }, [map, imageOpacity])

  // Cleanup: Remove layer when component unmounts or becomes inactive
  useEffect(() => {
    if (!map) return

    return () => {
      if (hasSatelliteImageryLayer(map)) {
        removeSatelliteImageryLayer(map)
      }
    }
  }, [map, isActive])

  // Don't render if not active
  if (!isActive) {
    return null
  }

  // Don't render if no location loaded
  if (!currentLocation && !isLoading) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <Satellite className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-300">
            Click a location on the map to load satellite imagery
          </span>
        </div>
      </div>
    )
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-gray-800/95 transition-colors"
        >
          <Satellite className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-300">
            {images.length} satellite images
            {currentLocation && ` • ${currentLocation[1].toFixed(4)}, ${currentLocation[0].toFixed(4)}`}
          </span>
        </button>
      </div>
    )
  }

  // Expanded timeline panel
  return (
    <div className="fixed bottom-6 left-6 right-6 z-30">
      <div className="relative">
        <SatelliteTimelinePanel />

        {/* Collapse button */}
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute -top-10 right-0 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-t-lg px-3 py-1 flex items-center gap-2 hover:bg-gray-800/95 transition-colors"
          title="Minimize timeline"
        >
          <span className="text-xs text-gray-400">Minimize</span>
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
