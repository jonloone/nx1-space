'use client'

/**
 * Maritime Anomalies Page
 * End-to-end AIS anomaly detection and analysis interface
 *
 * Layout:
 * - Left sidebar: Natural language query interface with anomaly examples
 * - Center: deck.gl map with anomaly visualization layers
 * - Right panel: Vessel/anomaly detail panel
 * - Bottom: Anomaly timeline panel
 *
 * Region: Kattegat Strait (Denmark/Sweden)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Map as MapGL, NavigationControl, ScaleControl } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { MapViewState, FlyToInterpolator } from '@deck.gl/core'
import type { PickingInfo } from '@deck.gl/core'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Ship,
  Loader2,
  RefreshCw,
  Map as MapIcon,
  List,
  Info,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import AskDataSidebar from '@/components/ask-data/AskDataSidebar'
import { AnomalyTimelinePanel } from '@/components/panels/AnomalyTimelinePanel'
import { VesselAnomalyDetailPanel } from '@/components/panels/VesselAnomalyDetailPanel'
import { AnomalyAlertPanel } from '@/components/maritime/AnomalyAlertPanel'
import {
  createAnomalyLayers,
  createVesselTrackLayer,
  ANOMALY_COLORS
} from '@/components/layers/AISAnomalyLayers'

import type {
  DetectedAnomaly,
  VesselTrack,
  AnomalyType
} from '@/lib/types/ais-anomaly'
import { KATTEGAT_BOUNDS, KATTEGAT_PORTS } from '@/lib/types/ais-anomaly'

// Helper functions to extract lat/lng from various location formats
function getLocationLat(location: any): number {
  if (!location) return 0
  if (typeof location.lat === 'number') return location.lat
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[1] // GeoJSON format: [lng, lat]
  }
  return 0
}

function getLocationLng(location: any): number {
  if (!location) return 0
  if (typeof location.lng === 'number') return location.lng
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[0] // GeoJSON format: [lng, lat]
  }
  return 0
}

// Map style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Initial view state centered on Kattegat Strait
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 11.0,
  latitude: 57.0,
  zoom: 8,
  pitch: 0,
  bearing: 0
}

// Panel view mode
type ViewMode = 'alerts' | 'detail'

export default function MaritimeAnomaliesPage() {
  // View state
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE)

  // Data state
  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([])
  const [vessels, setVessels] = useState<Map<string, any>>(new Map())
  const [vesselTracks, setVesselTracks] = useState<VesselTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [selectedAnomaly, setSelectedAnomaly] = useState<DetectedAnomaly | null>(null)
  const [selectedVessel, setSelectedVessel] = useState<any | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<VesselTrack | null>(null)
  const [hoveredAnomaly, setHoveredAnomaly] = useState<DetectedAnomaly | null>(null)
  const [showTimeline, setShowTimeline] = useState(true)
  const [rightPanelMode, setRightPanelMode] = useState<ViewMode>('alerts')
  const [showRightPanel, setShowRightPanel] = useState(true)

  // Load data on mount
  useEffect(() => {
    loadAnomalyData()
  }, [])

  // Fetch anomaly data from API
  const loadAnomalyData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch anomalies
      const anomalyResponse = await fetch('/api/maritime/anomalies?demo=true')
      if (!anomalyResponse.ok) throw new Error('Failed to fetch anomalies')
      const anomalyData = await anomalyResponse.json()

      // Fetch vessels
      const vesselsResponse = await fetch('/api/maritime/vessels?demo=true')
      if (!vesselsResponse.ok) throw new Error('Failed to fetch vessels')
      const vesselsData = await vesselsResponse.json()

      // Process anomalies - convert dates
      const processedAnomalies = (anomalyData.anomalies || []).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        endTime: a.endTime ? new Date(a.endTime) : undefined
      }))

      // Process vessels into map
      const vesselMap = new Map<string, any>()
      const tracks: VesselTrack[] = []

      for (const vessel of vesselsData.vessels || []) {
        vesselMap.set(vessel.mmsi, vessel)

        // Fetch track for vessels with anomalies
        if (vessel.trackInfo?.anomalyCount > 0) {
          try {
            const trackResponse = await fetch(
              `/api/maritime/vessels/${vessel.mmsi}?demo=true&track=true&anomalies=true`
            )
            if (trackResponse.ok) {
              const trackData = await trackResponse.json()
              if (trackData.track) {
                tracks.push({
                  mmsi: vessel.mmsi,
                  positions: trackData.track.map((p: any) => ({
                    ...p,
                    timestamp: new Date(p.timestamp)
                  })),
                  startTime: new Date(trackData.vessel.trackInfo.startTime),
                  endTime: new Date(trackData.vessel.trackInfo.endTime),
                  totalDistanceKm: trackData.vessel.trackInfo.totalDistanceKm,
                  avgSpeedKnots: trackData.vessel.trackInfo.avgSpeedKnots,
                  maxSpeedKnots: trackData.vessel.trackInfo.maxSpeedKnots,
                  trackQuality: trackData.vessel.trackInfo.trackQuality,
                  anomalies: trackData.anomalies || []
                })
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch track for ${vessel.mmsi}`, err)
          }
        }
      }

      setAnomalies(processedAnomalies)
      setVessels(vesselMap)
      setVesselTracks(tracks)

      console.log(`Loaded ${processedAnomalies.length} anomalies, ${vesselMap.size} vessels, ${tracks.length} tracks`)
    } catch (err) {
      console.error('Failed to load anomaly data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get time range from anomalies
  const timeRange = useMemo(() => {
    if (anomalies.length === 0) {
      const now = new Date()
      return {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now
      }
    }

    const timestamps = anomalies.map(a => a.timestamp.getTime())
    return {
      start: new Date(Math.min(...timestamps) - 60 * 60 * 1000),
      end: new Date(Math.max(...timestamps) + 60 * 60 * 1000)
    }
  }, [anomalies])

  // Get vessel names map
  const vesselNames = useMemo(() => {
    const names = new Map<string, string>()
    vessels.forEach((v, mmsi) => {
      names.set(mmsi, v.name || mmsi)
    })
    return names
  }, [vessels])

  // Handle anomaly click
  const handleAnomalyClick = useCallback((anomaly: DetectedAnomaly) => {
    setSelectedAnomaly(anomaly)

    // Get vessel info
    const mmsi = anomaly.affectedVessels[0]
    const vessel = vessels.get(mmsi)
    const track = vesselTracks.find(t => t.mmsi === mmsi)

    setSelectedVessel(vessel || { mmsi })
    setSelectedTrack(track || null)
    setRightPanelMode('detail')

    // Fly to anomaly location
    setViewState(prev => ({
      ...prev,
      longitude: getLocationLng(anomaly.location),
      latitude: getLocationLat(anomaly.location),
      zoom: 11,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }))
  }, [vessels, vesselTracks])

  // Handle map click
  const handleMapClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer) {
      const layerId = info.layer.id

      if (layerId === 'anomaly-markers' || layerId.includes('anomaly')) {
        const anomaly = info.object as DetectedAnomaly
        handleAnomalyClick(anomaly)
      }
    }
  }, [handleAnomalyClick])

  // Fly to position
  const handleFlyToPosition = useCallback((lat: number, lng: number) => {
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: 12,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }))
  }, [])

  // Close detail panel
  const handleCloseDetailPanel = useCallback(() => {
    setSelectedAnomaly(null)
    setSelectedVessel(null)
    setSelectedTrack(null)
    setRightPanelMode('alerts')
  }, [])

  // Create deck.gl layers
  const layers = useMemo(() => {
    const allLayers: any[] = []

    // Vessel track layers
    vesselTracks.forEach(track => {
      const trackLayer = createVesselTrackLayer(
        track,
        `track-${track.mmsi}`,
        {
          visible: true,
          highlightAnomalies: true
        }
      )
      allLayers.push(trackLayer)
    })

    // Anomaly layers
    const anomalyLayers = createAnomalyLayers(anomalies, {
      visible: true,
      selectedAnomalyId: selectedAnomaly?.id || null,
      onAnomalyClick: handleAnomalyClick
    })
    allLayers.push(...anomalyLayers)

    return allLayers
  }, [anomalies, vesselTracks, selectedAnomaly, handleAnomalyClick])

  // Get vessel anomalies for detail panel
  const selectedVesselAnomalies = useMemo(() => {
    if (!selectedVessel) return []
    return anomalies.filter(a => a.affectedVessels.includes(selectedVessel.mmsi))
  }, [anomalies, selectedVessel])

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 flex">
      {/* Left Sidebar - Natural Language Query Interface */}
      <aside className="w-[320px] h-full flex-shrink-0 border-r border-slate-800 z-20">
        <AskDataSidebar
          onResultsReceived={() => {}}
          onDomainChange={() => {}}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 relative flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState: newViewState }) =>
              setViewState(newViewState as MapViewState)
            }
            controller={true}
            layers={layers}
            onClick={handleMapClick}
            getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
          >
            <MapGL
              mapStyle={MAP_STYLE}
              reuseMaps
              attributionControl={false}
            >
              <NavigationControl position="top-right" />
              <ScaleControl position="bottom-left" />
            </MapGL>
          </DeckGL>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-30">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading maritime data...</p>
                <p className="text-xs text-slate-500 mt-1">Kattegat Strait Region</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-400 hover:text-red-300"
                  onClick={loadAnomalyData}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {/* Region Info */}
            <div className="bg-slate-900/90 border border-slate-700/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Kattegat Strait</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Denmark / Sweden</p>
            </div>

            {/* Stats Card */}
            {!isLoading && (
              <div className="bg-slate-900/90 border border-slate-700/50 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-400 mb-1">Detected Anomalies</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{anomalies.length}</span>
                  <span className="text-xs text-slate-500">
                    across {vessels.size} vessels
                  </span>
                </div>
              </div>
            )}

            {/* Toggle Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
                className={cn(
                  'bg-slate-900/90 border border-slate-700/50 hover:bg-slate-800',
                  showTimeline && 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                )}
              >
                Timeline
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={cn(
                  'bg-slate-900/90 border border-slate-700/50 hover:bg-slate-800',
                  showRightPanel && 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                )}
              >
                {rightPanelMode === 'detail' ? 'Details' : 'Alerts'}
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-8 left-4 z-20 bg-slate-900/90 border border-slate-700/50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-slate-400 mb-2">Anomaly Types</h4>
            <div className="space-y-1">
              {(Object.entries(ANOMALY_COLORS) as [AnomalyType, [number, number, number, number]][]).map(
                ([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                      }}
                    />
                    <span className="text-xs text-slate-300">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Alerts or Detail */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[380px] h-full flex-shrink-0 border-l border-slate-700/50 z-20 bg-slate-900"
            >
              {rightPanelMode === 'detail' && selectedVessel && selectedTrack ? (
                <VesselAnomalyDetailPanel
                  vessel={selectedVessel}
                  track={selectedTrack}
                  anomalies={selectedVesselAnomalies}
                  onClose={handleCloseDetailPanel}
                  onAnomalyClick={handleAnomalyClick}
                  onFlyToPosition={handleFlyToPosition}
                />
              ) : (
                <AnomalyAlertPanel
                  anomalies={anomalies}
                  vesselNames={vesselNames}
                  selectedAnomalyId={selectedAnomaly?.id}
                  isLoading={isLoading}
                  onAnomalyClick={handleAnomalyClick}
                  onAnomalyHover={setHoveredAnomaly}
                  onRefresh={loadAnomalyData}
                />
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Timeline Panel */}
      <AnomalyTimelinePanel
        anomalies={anomalies}
        timeRange={timeRange}
        isOpen={showTimeline && !isLoading}
        onClose={() => setShowTimeline(false)}
        onAnomalyClick={handleAnomalyClick}
        selectedAnomalyId={selectedAnomaly?.id}
      />
    </div>
  )
}
