'use client'

import React, { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MissionControlLayout from '@/components/opintel/layout/MissionControlLayout'
import LeftSidebar from '@/components/opintel/panels/LeftSidebar'
import RightPanel from '@/components/opintel/panels/RightPanel'
import TimelineControl from '@/components/opintel/controls/TimelineControl'
import { useMapStore, usePanelStore, useTimelineStore, useEntityStore } from '@/lib/stores'
import { fleetTrackingTemplate } from '@/lib/templates/fleet-tracking'
import { generateSanFranciscoFleet, updateVehiclePositions } from '@/lib/generators/fleetDataGenerator'
import type { SpatialEntity } from '@/lib/models/SpatialEntity'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

export default function FleetDemo() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())

  // Zustand stores
  const { setMap, isLoaded, setLoaded, selectFeature } = useMapStore()
  const { rightPanelMode, rightPanelData, openRightPanel, closeRightPanel } = usePanelStore()
  const {
    isPlaying,
    currentTime,
    playbackSpeed,
    isTimelineExpanded,
    setCurrentTime,
    setTimelineExpanded,
    togglePlayback
  } = useTimelineStore()
  const { entities, setEntities, getVisibleEntities, selectEntity } = useEntityStore()

  // Initialize fleet data
  useEffect(() => {
    console.log('🚚 Generating San Francisco fleet (200 vehicles)...')
    const fleet = generateSanFranciscoFleet()
    setEntities(fleet)
    console.log(`✅ Generated ${fleet.length} vehicles`)
  }, [setEntities])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('🗺️ Initializing Mapbox map...')

    const template = fleetTrackingTemplate
    const viewport = template.ui.defaultViewport

    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        pitch: viewport.pitch || 45,
        bearing: viewport.bearing || 0,
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

  // Update markers when entities change
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const visibleEntities = getVisibleEntities()
    const currentMarkers = markersRef.current

    // Remove markers for entities that no longer exist
    currentMarkers.forEach((marker, entityId) => {
      if (!visibleEntities.find((e) => e.id === entityId)) {
        marker.remove()
        currentMarkers.delete(entityId)
      }
    })

    // Add or update markers for visible entities
    visibleEntities.forEach((entity) => {
      let marker = currentMarkers.get(entity.id)

      if (!marker) {
        // Create new marker
        const el = document.createElement('div')
        el.className = 'vehicle-marker'
        el.style.width = '12px'
        el.style.height = '12px'
        el.style.borderRadius = '50%'
        el.style.border = '2px solid white'
        el.style.cursor = 'pointer'
        el.style.backgroundColor = entity.style?.color || '#3b82f6'
        el.title = entity.name

        el.addEventListener('click', () => {
          selectEntity(entity.id)
          selectFeature({
            id: entity.id,
            type: entity.type,
            name: entity.name,
            coordinates: [entity.position.longitude, entity.position.latitude],
            properties: entity.properties
          })
          openRightPanel('feature', {
            ...entity,
            coordinates: [entity.position.longitude, entity.position.latitude]
          })
        })

        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([entity.position.longitude, entity.position.latitude])
          .addTo(map.current!)

        currentMarkers.set(entity.id, marker)
      } else {
        // Update existing marker position
        marker.setLngLat([entity.position.longitude, entity.position.latitude])

        // Update marker color
        const el = marker.getElement()
        el.style.backgroundColor = entity.style?.color || '#3b82f6'
      }
    })

    console.log(`🎯 Displaying ${visibleEntities.length} vehicles`)
  }, [entities, isLoaded, getVisibleEntities, selectEntity, selectFeature, openRightPanel])

  // Simulate vehicle movement
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const currentEntities = Array.from(entities.values())
      if (currentEntities.length === 0) return

      // Update positions (simulate 1 second of movement per tick)
      const updatedEntities = updateVehiclePositions(currentEntities, 1 * playbackSpeed)
      setEntities(updatedEntities)

      // Update time
      setCurrentTime(new Date(currentTime.getTime() + 1000 * playbackSpeed))
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, currentTime, entities, setEntities, setCurrentTime])

  // Demo data for left sidebar
  const dataSources = [
    {
      id: 'vehicle-gps',
      name: 'Vehicle GPS Feed',
      type: 'stream' as const,
      status: 'connected' as const,
      lastUpdated: 'Live',
      recordCount: entities.size
    },
    {
      id: 'delivery-zones',
      name: 'Service Zones',
      type: 'file' as const,
      status: 'connected' as const,
      lastUpdated: '1 hour ago',
      recordCount: 12
    },
    {
      id: 'routes',
      name: 'Planned Routes',
      type: 'database' as const,
      status: 'connected' as const,
      lastUpdated: '5 min ago',
      recordCount: 26
    }
  ]

  const layers = fleetTrackingTemplate.defaultLayers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    opacity: layer.opacity,
    color: layer.color
  }))

  const liveStreams = [
    {
      id: 'gps-stream',
      name: 'GPS Position Updates',
      status: 'active' as const,
      messagesPerSecond: entities.size > 0 ? entities.size / 10 : 0,
      totalMessages: entities.size * 120,
      latency: 45
    },
    {
      id: 'alerts-stream',
      name: 'Fleet Alerts',
      status: 'active' as const,
      messagesPerSecond: 0.5,
      totalMessages: 247,
      latency: 32
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

  return (
    <MissionControlLayout
      projectName={fleetTrackingTemplate.ui.projectName}
      notificationCount={3}
      isLive={true}
      activeUsers={5}
      onSearch={handleSearch}
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
      bottomTimeline={
        <TimelineControl
          isPlaying={isPlaying}
          currentTime={currentTime}
          startTime={new Date(currentTime.getTime() - 24 * 60 * 60 * 1000)}
          endTime={currentTime}
          playbackSpeed={playbackSpeed}
          isExpanded={isTimelineExpanded}
          onPlayPause={togglePlayback}
          onTimeChange={setCurrentTime}
          onSpeedChange={(speed) => console.log('Speed:', speed)}
          onExpandToggle={() => setTimelineExpanded(!isTimelineExpanded)}
        />
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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-sm">Loading map...</div>
          </div>
        </div>
      )}

      {/* Fleet Stats Badge */}
      {isLoaded && entities.size > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-blue-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
          <div className="font-semibold text-lg">{entities.size} Vehicles</div>
          <div className="text-sm text-white/80">
            {Array.from(entities.values()).filter((e) => e.status === 'active').length} Active
            {' · '}
            {Array.from(entities.values()).filter((e) => e.status === 'idle').length} Idle
          </div>
        </div>
      )}

      {/* Demo Info Badge */}
      <div className="absolute bottom-20 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
        <div className="font-semibold mb-1">🚚 Fleet Tracking Demo</div>
        <div className="text-white/60">
          • {entities.size} vehicles in San Francisco
          <br />
          • Click vehicles to view details
          <br />• Press play to simulate movement
        </div>
      </div>
    </MissionControlLayout>
  )
}
