'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MissionControlLayout from '@/components/opintel/layout/MissionControlLayout'
import LeftSidebar from '@/components/opintel/panels/LeftSidebar'
import RightPanel from '@/components/opintel/panels/RightPanel'
import GERSMapLayer from '@/components/gers/GERSMapLayer'
import { useMapStore, usePanelStore } from '@/lib/stores'
import { GERSPlace, LOD_CONFIG } from '@/lib/services/gersDemoService'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

export default function OperationsPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  // Zustand stores
  const { setMap, isLoaded, setLoaded, selectFeature } = useMapStore()
  const { rightPanelMode, rightPanelData, openRightPanel, closeRightPanel } = usePanelStore()

  // GERs search state
  const [gersPlaces, setGersPlaces] = useState<GERSPlace[]>([])
  const [selectedPlace, setSelectedPlace] = useState<GERSPlace | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🗺️ Initializing Mapbox map...')

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Mundi light theme
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4,
        pitch: 0,
        bearing: 0,
        antialias: true
      })

      map.current = mapInstance

      mapInstance.on('load', () => {
        console.log('✅ Map loaded successfully!')
        setMap(mapInstance)
        setLoaded(true)
      })

      mapInstance.on('error', (e) => {
        console.error('❌ Map error:', e)
      })
    } catch (error) {
      console.error('❌ Failed to initialize map:', error)
    }

    return () => {
      map.current?.remove()
      setMap(null)
    }
  }, [setMap, setLoaded])

  // Demo data for left sidebar
  const dataSources = [
    {
      id: 'ops-feed',
      name: 'Operations Feed',
      type: 'stream' as const,
      status: 'connected' as const,
      lastUpdated: 'Live',
      recordCount: 1247
    },
    {
      id: 'network-data',
      name: 'Network Status',
      type: 'api' as const,
      status: 'connected' as const,
      lastUpdated: '2 min ago',
      recordCount: 89
    },
    {
      id: 'sensor-grid',
      name: 'Sensor Grid',
      type: 'database' as const,
      status: 'connected' as const,
      lastUpdated: '5 min ago',
      recordCount: 342
    }
  ]

  const layers = [
    {
      id: 'operations',
      name: 'Operations Layer',
      type: 'point',
      visible: true,
      opacity: 1,
      color: '#10b981'
    },
    {
      id: 'network',
      name: 'Network Layer',
      type: 'line',
      visible: true,
      opacity: 0.8,
      color: '#3b82f6'
    },
    {
      id: 'coverage',
      name: 'Coverage Areas',
      type: 'polygon',
      visible: false,
      opacity: 0.4,
      color: '#93C5FD'
    }
  ]

  const liveStreams = [
    {
      id: 'ops-stream',
      name: 'Operations Stream',
      status: 'active' as const,
      messagesPerSecond: 12.4,
      totalMessages: 45623,
      latency: 28
    },
    {
      id: 'telemetry-stream',
      name: 'Telemetry Feed',
      status: 'active' as const,
      messagesPerSecond: 8.7,
      totalMessages: 32891,
      latency: 42
    }
  ]

  const handleToggleLayer = (layerId: string) => {
    console.log('Toggle layer:', layerId)
  }

  const handleLayerSettings = (layerId: string) => {
    console.log('Layer settings:', layerId)
  }

  const handleSearch = (query: string) => {
    console.log('Search:', query)
  }

  const handleGERSResults = (places: GERSPlace[]) => {
    setGersPlaces(places)
    console.log(`Found ${places.length} GERs places`)
  }

  const handleGERSPlaceSelect = (place: GERSPlace) => {
    setSelectedPlace(place)
    console.log('Selected place:', place.name, 'LoD:', place.levelOfDetail)

    // Fly to place on map with LoD-appropriate zoom
    if (map.current) {
      const zoomLevel = LOD_CONFIG[place.levelOfDetail].zoom
      map.current.flyTo({
        center: place.location.coordinates as [number, number],
        zoom: zoomLevel,
        duration: 1500
      })
    }

    // Open right panel with place details
    openRightPanel('details', {
      title: place.name,
      data: place
    })
  }

  return (
    <MissionControlLayout
      projectName="Operations Intelligence"
      notificationCount={5}
      isLive={true}
      activeUsers={12}
      onSearch={handleSearch}
      onPlaceSelect={handleGERSPlaceSelect}
      leftSidebar={
        <LeftSidebar
          dataSources={dataSources}
          layers={layers}
          liveStreams={liveStreams}
          onToggleLayer={handleToggleLayer}
          onLayerSettings={handleLayerSettings}
        />
      }
      rightPanel={
        rightPanelMode ? (
          <RightPanel mode={rightPanelMode} data={rightPanelData} onClose={closeRightPanel} />
        ) : null
      }
    >
      {/* Map Canvas */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full bg-slate-900"
        style={{ minHeight: '100%' }}
      />

      {/* Map Loading Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#176BF8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-foreground font-medium">Loading operations map...</div>
          </div>
        </div>
      )}

      {/* GERs Map Layer */}
      {map.current && (
        <GERSMapLayer
          map={map.current}
          places={gersPlaces}
          onPlaceClick={handleGERSPlaceSelect}
        />
      )}
    </MissionControlLayout>
  )
}
