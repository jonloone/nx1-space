'use client'

import React, { useState, useRef, useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MissionControlLayout from '@/components/opintel/layout/MissionControlLayout'
import LeftSidebar from '@/components/opintel/panels/LeftSidebar'
import RightPanel from '@/components/opintel/panels/RightPanel'
import TimelineControl from '@/components/opintel/controls/TimelineControl'

export default function OpIntelDemo() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Panel state
  const [rightPanelMode, setRightPanelMode] = useState<
    'feature' | 'alert' | 'layer' | 'analysis' | null
  >(null)
  const [rightPanelData, setRightPanelData] = useState<any>(null)

  // Timeline state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)

  // Initialize time on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Demo data
  const [dataSources] = useState([
    {
      id: 'fleet-data',
      name: 'Fleet Tracking',
      type: 'stream' as const,
      status: 'connected' as const,
      lastUpdated: '2 min ago',
      recordCount: 247
    },
    {
      id: 'delivery-zones',
      name: 'Delivery Zones',
      type: 'file' as const,
      status: 'connected' as const,
      lastUpdated: '1 hour ago',
      recordCount: 52
    },
    {
      id: 'customer-locations',
      name: 'Customer Addresses',
      type: 'database' as const,
      status: 'connected' as const,
      lastUpdated: '5 min ago',
      recordCount: 1847
    }
  ])

  const [layers, setLayers] = useState([
    {
      id: 'vehicles',
      name: 'Vehicle Fleet',
      type: 'ScatterplotLayer',
      visible: true,
      opacity: 1,
      color: '#3b82f6'
    },
    {
      id: 'routes',
      name: 'Delivery Routes',
      type: 'PathLayer',
      visible: true,
      opacity: 0.8,
      color: '#10b981'
    },
    {
      id: 'zones',
      name: 'Service Zones',
      type: 'PolygonLayer',
      visible: false,
      opacity: 0.5,
      color: '#8b5cf6'
    },
    {
      id: 'heatmap',
      name: 'Demand Heatmap',
      type: 'HeatmapLayer',
      visible: false,
      opacity: 0.6,
      color: '#ef4444'
    }
  ])

  const [liveStreams] = useState([
    {
      id: 'fleet-stream',
      name: 'Fleet Positions',
      status: 'active' as const,
      messagesPerSecond: 23.5,
      totalMessages: 84723,
      latency: 45
    },
    {
      id: 'alerts-stream',
      name: 'Alert Feed',
      status: 'active' as const,
      messagesPerSecond: 2.1,
      totalMessages: 1547,
      latency: 32
    }
  ])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Use Mapbox style with your token
    const MAPBOX_TOKEN = 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`,
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12,
      pitch: 45,
      bearing: 0,
      antialias: true
    })

    map.current.on('load', () => {
      setMapLoaded(true)

      // Add some demo markers
      const demoVehicles = [
        { lng: -122.4194, lat: 37.7749, name: 'Vehicle 1' },
        { lng: -122.4094, lat: 37.7849, name: 'Vehicle 2' },
        { lng: -122.4294, lat: 37.7649, name: 'Vehicle 3' }
      ]

      demoVehicles.forEach((vehicle) => {
        const el = document.createElement('div')
        el.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-pointer'
        el.title = vehicle.name

        el.addEventListener('click', () => {
          openFeaturePanel({
            id: vehicle.name.toLowerCase().replace(' ', '-'),
            type: 'Vehicle',
            name: vehicle.name,
            coordinates: [vehicle.lng, vehicle.lat],
            properties: {
              status: 'Active',
              speed: '45 mph',
              heading: '180°',
              lastUpdate: '2 minutes ago',
              driver: 'John Doe',
              route: 'Route A',
              eta: '15 minutes'
            }
          })
        })

        new maplibregl.Marker({ element: el })
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map.current!)
      })
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Panel handlers
  const openFeaturePanel = (feature: any) => {
    setRightPanelMode('feature')
    setRightPanelData(feature)
  }

  const closeRightPanel = () => {
    setRightPanelMode(null)
    setRightPanelData(null)
  }

  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
  }

  const handleLayerSettings = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId)
    if (layer) {
      setRightPanelMode('layer')
      setRightPanelData(layer)
    }
  }

  const handleSearch = (query: string) => {
    console.log('Search:', query)
  }

  // Timeline handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeChange = (time: Date) => {
    setCurrentTime(time)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  const handleExpandToggle = () => {
    setIsTimelineExpanded(!isTimelineExpanded)
  }

  // Playback simulation
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000 * playbackSpeed))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed])

  return (
    <MissionControlLayout
      projectName="Last-Mile Delivery"
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
          <RightPanel
            mode={rightPanelMode}
            data={rightPanelData}
            onClose={closeRightPanel}
          />
        ) : null
      }
      bottomTimeline={
        currentTime ? (
          <TimelineControl
            isPlaying={isPlaying}
            currentTime={currentTime}
            startTime={new Date(currentTime.getTime() - 24 * 60 * 60 * 1000)}
            endTime={currentTime}
            playbackSpeed={playbackSpeed}
            isExpanded={isTimelineExpanded}
            onPlayPause={handlePlayPause}
            onTimeChange={handleTimeChange}
            onSpeedChange={handleSpeedChange}
            onExpandToggle={handleExpandToggle}
          />
        ) : null
      }
    >
      {/* Map Canvas */}
      <div ref={mapContainer} className="absolute inset-0 bg-slate-900" />

      {/* Demo Alert Badge */}
      {mapLoaded && (
        <div
          className="absolute top-4 right-4 z-10 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-orange-600 transition-colors"
          onClick={() => {
            setRightPanelMode('alert')
            setRightPanelData({
              id: 'alert-1',
              title: 'Vehicle Delayed',
              severity: 'high',
              type: 'delivery',
              timestamp: currentTime?.toISOString() || new Date().toISOString(),
              description:
                'Vehicle Unit-247 is running 25 minutes behind schedule on Route A.',
              affectedEntities: ['Unit-247', 'Route A'],
              recommendations: [
                'Notify customer of delay',
                'Reassign next delivery',
                'Contact driver'
              ],
              status: 'active'
            })
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">3 Active Alerts</span>
          </div>
        </div>
      )}

      {/* Demo Info Badge */}
      <div className="absolute bottom-20 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
        <div className="font-semibold mb-1">OpIntel Demo</div>
        <div className="text-white/60">
          • Click vehicles to view details
          <br />
          • Toggle layers in left sidebar
          <br />
          • Click alert badge for demo
        </div>
      </div>
    </MissionControlLayout>
  )
}
