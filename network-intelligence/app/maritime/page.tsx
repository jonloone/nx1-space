'use client'

/**
 * Maritime Intelligence Page
 *
 * Unified, chat-first maritime intelligence platform.
 * Clean map-centric design with progressive disclosure.
 *
 * Features:
 * - Full-screen Mapbox map with vessel icons
 * - Fixed bottom chat bar for queries
 * - Floating stats card (top-left)
 * - Right slide-in panel for vessel details
 * - Bottom slide-up panel for analysis
 * - Professional glassmorphism design
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import MapboxVesselLayer, { type VesselMapData } from '@/components/map/MapboxVesselLayer'
import ChatInputBar, { type ChatResponse } from '@/components/chat/ChatInputBar'
import FloatingStatsCard, { createMaritimeStats, type StatItem } from '@/components/shared/FloatingStatsCard'
import QuickInfoPanel, { type VesselDetails } from '@/components/panels/QuickInfoPanel'
import AnalysisSlidePanel, { type AnalysisPanelTab } from '@/components/panels/AnalysisSlidePanel'
import MaritimeTable, { createVesselColumns, createAnomalyColumns } from '@/components/tables/MaritimeTable'
import type { AnalysisType, AnomalyTableRow } from '@/lib/types/maritime-analysis'

// ============================================================================
// Constants
// ============================================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const INITIAL_VIEW = {
  center: [11.0, 57.0] as [number, number], // Kattegat Strait
  zoom: 7
}

const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11'

// ============================================================================
// Types
// ============================================================================

interface MaritimePageState {
  vessels: VesselMapData[]
  anomalies: AnomalyTableRow[]
  isLoading: boolean
  error: string | null
}

// ============================================================================
// Component
// ============================================================================

export default function MaritimePage() {
  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Data state
  const [state, setState] = useState<MaritimePageState>({
    vessels: [],
    anomalies: [],
    isLoading: true,
    error: null
  })

  // UI state
  const [selectedVessel, setSelectedVessel] = useState<VesselDetails | null>(null)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisType>('vessels')
  const [chatLoading, setChatLoading] = useState(false)
  const [lastChatResponse, setLastChatResponse] = useState<ChatResponse | null>(null)
  const [showStats, setShowStats] = useState(true)

  // ============================================================================
  // Map Initialization
  // ============================================================================

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      attributionControl: false,
      pitchWithRotate: false
    })

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    )

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    map.on('load', () => {
      mapRef.current = map
      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadMaritimeData()
  }, [])

  const loadMaritimeData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch vessels and anomalies in parallel
      const [vesselsResponse, anomaliesResponse] = await Promise.all([
        fetch('/api/maritime/vessels?demo=true'),
        fetch('/api/maritime/anomalies?demo=true')
      ])

      if (!vesselsResponse.ok) throw new Error('Failed to load vessel data')
      if (!anomaliesResponse.ok) throw new Error('Failed to load anomaly data')

      const [vesselsData, anomaliesData] = await Promise.all([
        vesselsResponse.json(),
        anomaliesResponse.json()
      ])

      // Build vessel map from vessels endpoint
      const vesselMap = new Map<string, VesselMapData>()

      if (vesselsData.vessels) {
        vesselsData.vessels.forEach((vessel: any) => {
          if (vessel.lastPosition?.position) {
            const [lng, lat] = vessel.lastPosition.position
            vesselMap.set(vessel.mmsi, {
              mmsi: vessel.mmsi,
              name: vessel.name || `Vessel ${vessel.mmsi}`,
              vesselType: vessel.type || 'Unknown',
              status: (vessel.lastPosition.sog || 0) > 0.5 ? 'moving' : 'idle',
              lat,
              lng,
              heading: vessel.lastPosition.heading || 0,
              speed: vessel.lastPosition.sog || 0,
              anomalyCount: vessel.trackInfo?.anomalyCount || 0
            })
          }
        })
      }

      // Process anomalies
      const anomalies: AnomalyTableRow[] = []

      if (anomaliesData.anomalies) {
        anomaliesData.anomalies.forEach((anomaly: any) => {
          // Get vessel MMSI from affectedVessels array
          const vesselMmsi = anomaly.affectedVessels?.[0] || anomaly.vesselMmsi

          // Increment vessel anomaly count
          const vessel = vesselMap.get(vesselMmsi)
          if (vessel) {
            vessel.anomalyCount = (vessel.anomalyCount || 0) + 1
          }

          // Add to anomaly list
          anomalies.push({
            id: anomaly.id,
            vesselMmsi: vesselMmsi,
            vesselName: vessel?.name || `Vessel ${vesselMmsi}`,
            type: anomaly.type,
            severity: anomaly.severity,
            timestamp: new Date(anomaly.timestamp || anomaly.startTimestamp),
            endTime: anomaly.endTimestamp ? new Date(anomaly.endTimestamp) : undefined,
            duration: anomaly.durationMinutes,
            location: anomaly.location,
            description: anomaly.description || '',
            confidence: Math.round((anomaly.confidence || 0.85) * 100)
          })
        })
      }

      setState({
        vessels: Array.from(vesselMap.values()),
        anomalies,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error('Failed to load maritime data:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load maritime data'
      }))
    }
  }

  // ============================================================================
  // Stats Calculation
  // ============================================================================

  const stats: StatItem[] = createMaritimeStats({
    totalVessels: state.vessels.length,
    activeVessels: state.vessels.filter(v => v.status === 'moving' || v.status === 'active').length,
    anomalyCount: state.anomalies.length,
    avgSpeed: state.vessels.length > 0
      ? state.vessels.reduce((sum, v) => sum + v.speed, 0) / state.vessels.length
      : 0
  })

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleVesselClick = useCallback((vessel: VesselMapData) => {
    setSelectedVessel(vessel as VesselDetails)
  }, [])

  const handleVesselClose = useCallback(() => {
    setSelectedVessel(null)
  }, [])

  const handleShowDetails = useCallback((vessel: VesselDetails) => {
    setSelectedVessel(null)
    setShowAnalysisPanel(true)
    setActiveAnalysisTab('vessels')
  }, [])

  const handleShowTrack = useCallback((vessel: VesselDetails) => {
    // TODO: Implement track visualization
    console.log('Show track for:', vessel.mmsi)
  }, [])

  const handleShowAnomalies = useCallback((vessel: VesselDetails) => {
    setSelectedVessel(null)
    setShowAnalysisPanel(true)
    setActiveAnalysisTab('anomalies')
  }, [])

  const handleChatSubmit = useCallback(async (query: string) => {
    setChatLoading(true)
    setLastChatResponse(null)

    try {
      // Simple demo response - in production, this would call the AI
      await new Promise(resolve => setTimeout(resolve, 1000))

      const queryLower = query.toLowerCase()
      let response: ChatResponse

      if (queryLower.includes('vessel') || queryLower.includes('ship')) {
        response = {
          id: Date.now().toString(),
          query,
          summary: `Found ${state.vessels.length} vessels in the Kattegat Strait region. ${state.vessels.filter(v => v.status === 'moving').length} are currently underway.`,
          type: 'vessels',
          resultCount: state.vessels.length,
          timestamp: new Date()
        }
        setShowAnalysisPanel(true)
        setActiveAnalysisTab('vessels')
      } else if (queryLower.includes('anomal') || queryLower.includes('suspicious')) {
        response = {
          id: Date.now().toString(),
          query,
          summary: `Detected ${state.anomalies.length} anomalies. ${state.anomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length} are high priority.`,
          type: 'anomalies',
          resultCount: state.anomalies.length,
          timestamp: new Date()
        }
        setShowAnalysisPanel(true)
        setActiveAnalysisTab('anomalies')
      } else if (queryLower.includes('route')) {
        response = {
          id: Date.now().toString(),
          query,
          summary: 'Route analysis shows major shipping lanes between Gothenburg and Aarhus.',
          type: 'routes',
          timestamp: new Date()
        }
      } else if (queryLower.includes('port')) {
        response = {
          id: Date.now().toString(),
          query,
          summary: 'Port activity data shows Gothenburg as the busiest port in the region.',
          type: 'ports',
          timestamp: new Date()
        }
      } else {
        response = {
          id: Date.now().toString(),
          query,
          summary: `Analyzing: "${query}". Try asking about vessels, anomalies, routes, or ports.`,
          type: 'general',
          timestamp: new Date()
        }
      }

      setLastChatResponse(response)
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setChatLoading(false)
    }
  }, [state.vessels, state.anomalies])

  const handleExpandChat = useCallback(() => {
    setShowAnalysisPanel(true)
  }, [])

  const handleAnalysisPanelClose = useCallback(() => {
    setShowAnalysisPanel(false)
  }, [])

  const handleTableRowClick = useCallback((row: any) => {
    if (row.mmsi) {
      // It's a vessel
      const vessel = state.vessels.find(v => v.mmsi === row.mmsi)
      if (vessel) {
        setSelectedVessel(vessel as VesselDetails)
        // Center map on vessel
        mapRef.current?.flyTo({
          center: [vessel.lng, vessel.lat],
          zoom: 10
        })
      }
    }
  }, [state.vessels])

  const handleShowOnMap = useCallback((row: any) => {
    if (row.lat && row.lng) {
      mapRef.current?.flyTo({
        center: [row.lng, row.lat],
        zoom: 12
      })
    } else if (row.location) {
      mapRef.current?.flyTo({
        center: [row.location.lng, row.location.lat],
        zoom: 12
      })
    }
  }, [])

  // ============================================================================
  // Analysis Panel Tabs
  // ============================================================================

  const analysisTabs: AnalysisPanelTab[] = [
    { id: 'vessels', label: 'Vessels', icon: require('lucide-react').Ship, count: state.vessels.length },
    { id: 'anomalies', label: 'Anomalies', icon: require('lucide-react').AlertTriangle, count: state.anomalies.length }
  ]

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="h-screen w-full relative bg-slate-950 overflow-hidden">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 map-container-maritime"
      />

      {/* Vessel Layer */}
      {mapLoaded && (
        <MapboxVesselLayer
          map={mapRef.current}
          vessels={state.vessels}
          selectedVesselId={selectedVessel?.mmsi}
          onVesselClick={handleVesselClick}
          showTrails={false}
        />
      )}

      {/* Floating Stats Card */}
      <FloatingStatsCard
        stats={stats}
        title="Maritime Overview"
        subtitle="Kattegat Strait"
        visible={showStats && !state.isLoading}
        position="top-left"
        collapsible={true}
      />

      {/* Quick Info Panel (Right Slide-In) */}
      <QuickInfoPanel
        data={selectedVessel}
        isOpen={!!selectedVessel}
        onClose={handleVesselClose}
        onShowDetails={handleShowDetails}
        onShowTrack={handleShowTrack}
        onShowAnomalies={handleShowAnomalies}
      />

      {/* Chat Input Bar (Fixed Bottom) */}
      <ChatInputBar
        onSubmit={handleChatSubmit}
        onExpand={handleExpandChat}
        domain="maritime"
        isLoading={chatLoading}
        lastResponse={lastChatResponse}
      />

      {/* Analysis Slide Panel (Bottom) */}
      <AnalysisSlidePanel
        isOpen={showAnalysisPanel}
        onClose={handleAnalysisPanelClose}
        tabs={analysisTabs}
        activeTab={activeAnalysisTab}
        onTabChange={setActiveAnalysisTab}
        rowCount={activeAnalysisTab === 'vessels' ? state.vessels.length : state.anomalies.length}
      >
        {activeAnalysisTab === 'vessels' && (
          <MaritimeTable
            data={state.vessels}
            columns={createVesselColumns()}
            onRowClick={handleTableRowClick}
            onShowOnMap={handleShowOnMap}
            selectedId={selectedVessel?.mmsi}
            idKey="mmsi"
            isLoading={state.isLoading}
            emptyMessage="No vessels found"
          />
        )}
        {activeAnalysisTab === 'anomalies' && (
          <MaritimeTable
            data={state.anomalies}
            columns={createAnomalyColumns()}
            onRowClick={handleTableRowClick}
            onShowOnMap={handleShowOnMap}
            idKey="id"
            isLoading={state.isLoading}
            emptyMessage="No anomalies detected"
          />
        )}
      </AnalysisSlidePanel>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50">
          <div className="flex items-center gap-3 text-slate-300">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading maritime data...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel-premium px-4 py-2 rounded-lg text-red-400 text-sm">
            {state.error}
          </div>
        </div>
      )}
    </div>
  )
}
