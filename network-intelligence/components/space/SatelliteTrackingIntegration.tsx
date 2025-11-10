'use client'

/**
 * Satellite Tracking Integration
 * Connects satellite tracking store to Mapbox visualization
 */

import { useEffect, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import { useSatelliteTrackingStore } from '@/lib/stores/satelliteTrackingStore'
import {
  initializeSatelliteOrbitLayers,
  updateSatellitePositions,
  updateOrbitGroundTracks,
  setupSatelliteClickHandlers,
  removeSatelliteOrbitLayers
} from '@/lib/layers/satelliteOrbitLayer'
import { SatelliteTrackingPanel } from './SatelliteTrackingPanel'

interface SatelliteTrackingIntegrationProps {
  map: mapboxgl.Map | null
  isActive: boolean
  showOrbits?: boolean
  showLabels?: boolean
}

export function SatelliteTrackingIntegration({
  map,
  isActive,
  showOrbits = true,
  showLabels = true
}: SatelliteTrackingIntegrationProps) {
  const {
    satellites,
    selectedSatellite,
    groundTracks,
    selectSatellite
  } = useSatelliteTrackingStore()

  const hasInitialized = useRef(false)

  // Initialize map layers
  useEffect(() => {
    if (!map || !isActive || hasInitialized.current) {
      return
    }

    console.log('🛰️ Initializing satellite tracking layers')

    initializeSatelliteOrbitLayers(map, {
      showOrbits,
      showLabels,
      orbitColor: '#3b82f6',
      satelliteSize: 8
    })

    // Set up click handlers
    setupSatelliteClickHandlers(map, (catalogNumber) => {
      selectSatellite(catalogNumber)
    })

    hasInitialized.current = true

    return () => {
      if (map && hasInitialized.current) {
        removeSatelliteOrbitLayers(map)
        hasInitialized.current = false
      }
    }
  }, [map, isActive, showOrbits, showLabels, selectSatellite])

  // Update satellite positions on map
  useEffect(() => {
    if (!map || !hasInitialized.current) {
      return
    }

    updateSatellitePositions(
      map,
      satellites,
      selectedSatellite?.catalogNumber || null
    )
  }, [map, satellites, selectedSatellite])

  // Update orbit ground tracks
  useEffect(() => {
    if (!map || !hasInitialized.current || !showOrbits) {
      return
    }

    updateOrbitGroundTracks(
      map,
      groundTracks,
      selectedSatellite?.catalogNumber || null
    )
  }, [map, groundTracks, selectedSatellite, showOrbits])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map && hasInitialized.current) {
        removeSatelliteOrbitLayers(map)
      }
    }
  }, [map])

  if (!isActive) {
    return null
  }

  return (
    <>
      <SatelliteTrackingPanel />
    </>
  )
}
