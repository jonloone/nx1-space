'use client'

/**
 * Maritime Analysis Page
 * Unified maritime analytics interface with tabbed analysis views
 *
 * Layout:
 * - Left sidebar: Natural language query interface
 * - Center: deck.gl map with vessel/anomaly visualization
 * - Bottom: Tabbed analysis panel with multiple views
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Map as MapGL, NavigationControl, ScaleControl } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { MapViewState, FlyToInterpolator } from '@deck.gl/core'
import type { PickingInfo } from '@deck.gl/core'
import {
  AlertTriangle,
  Ship,
  Loader2,
  RefreshCw,
  Map as MapIcon,
  Anchor,
  Navigation,
  Shield,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Components
import AskDataSidebar from '@/components/ask-data/AskDataSidebar'
import { BaseAnalysisPanel } from '@/components/maritime/analysis/BaseAnalysisPanel'
import { AnomalyAnalysisView } from '@/components/maritime/analysis/views/AnomalyAnalysisView'
import { FleetOverviewView } from '@/components/maritime/analysis/views/FleetOverviewView'
import { VesselAnalyticsView } from '@/components/maritime/analysis/views/VesselAnalyticsView'
import { RiskAnalysisView } from '@/components/maritime/analysis/views/RiskAnalysisView'
import { RouteAnalysisView } from '@/components/maritime/analysis/views/RouteAnalysisView'
import { PortPerformanceView } from '@/components/maritime/analysis/views/PortPerformanceView'
import {
  createAnomalyLayers,
  createVesselTrackLayer,
  ANOMALY_COLORS
} from '@/components/layers/AISAnomalyLayers'

// Types
import type {
  AnalysisType,
  AnalysisTab,
  FleetVessel,
  VesselAnalytics,
  VesselRiskAssessment,
  RouteAnalytics,
  PortAnalytics
} from '@/lib/types/maritime-analysis'
import type { DetectedAnomaly, VesselTrack, AnomalyType } from '@/lib/types/ais-anomaly'
import { KATTEGAT_BOUNDS, KATTEGAT_PORTS } from '@/lib/types/ais-anomaly'

// ============================================================================
// Constants
// ============================================================================

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 11.0,
  latitude: 57.0,
  zoom: 8,
  pitch: 0,
  bearing: 0
}

// Tab configuration
const ANALYSIS_TABS: AnalysisTab[] = [
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, columns: [], showKPIs: true, hasFilters: true },
  { id: 'fleet', label: 'Fleet', icon: Ship, columns: [], showKPIs: true },
  { id: 'vessels', label: 'Vessels', icon: Navigation, columns: [], showKPIs: true, hasFilters: true },
  { id: 'risk', label: 'Risk', icon: Shield, columns: [], showKPIs: true },
  { id: 'routes', label: 'Routes', icon: BarChart3, columns: [], showKPIs: true },
  { id: 'ports', label: 'Ports', icon: Anchor, columns: [], showKPIs: true }
]

// ============================================================================
// Helper Functions
// ============================================================================

function getLocationLat(location: any): number {
  if (!location) return 0
  if (typeof location.lat === 'number') return location.lat
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[1]
  }
  return 0
}

function getLocationLng(location: any): number {
  if (!location) return 0
  if (typeof location.lng === 'number') return location.lng
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[0]
  }
  return 0
}

// Transform vessel data for different views
function transformToFleetVessel(vessel: any, anomalyCount: number = 0): FleetVessel {
  return {
    mmsi: vessel.mmsi,
    name: vessel.name || vessel.mmsi,
    vesselType: vessel.vesselType || vessel.type || 'Unknown',
    flag: vessel.flag || '',
    status: vessel.trackInfo?.endTime
      ? (Date.now() - new Date(vessel.trackInfo.endTime).getTime() < 3600000 ? 'active' : 'inactive')
      : 'unknown',
    position: {
      lat: vessel.lastPosition?.lat || 0,
      lng: vessel.lastPosition?.lng || 0
    },
    speed: vessel.trackInfo?.avgSpeedKnots || 0,
    heading: vessel.heading || 0,
    lastUpdate: new Date(vessel.trackInfo?.endTime || Date.now()),
    trackQuality: vessel.trackInfo?.trackQuality || 0,
    anomalyCount
  }
}

function transformToVesselAnalytics(vessel: any, anomalies: DetectedAnomaly[]): VesselAnalytics {
  const vesselAnomalies = anomalies.filter(a => a.affectedVessels.includes(vessel.mmsi))
  const aisGaps = vesselAnomalies.filter(a => a.type === 'AIS_GAP')
  const darkHours = aisGaps.reduce((sum, a) => sum + (a.duration || 0), 0) / 60

  // Calculate risk score based on anomalies
  const riskScore = Math.min(100, vesselAnomalies.length * 10 + aisGaps.length * 15 + darkHours)
  const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low'

  return {
    mmsi: vessel.mmsi,
    name: vessel.name || vessel.mmsi,
    vesselType: vessel.vesselType || vessel.type || 'Unknown',
    flag: vessel.flag || '',
    riskScore: Math.round(riskScore),
    riskLevel,
    anomalyCount: vesselAnomalies.length,
    aisGapCount: aisGaps.length,
    darkPeriodHours: darkHours,
    trackQuality: vessel.trackInfo?.trackQuality || 0,
    lastPosition: {
      lat: vessel.lastPosition?.lat || 0,
      lng: vessel.lastPosition?.lng || 0,
      timestamp: new Date(vessel.trackInfo?.endTime || Date.now())
    },
    totalDistanceKm: vessel.trackInfo?.totalDistanceKm || 0,
    avgSpeedKnots: vessel.trackInfo?.avgSpeedKnots || 0,
    portCalls: 0
  }
}

function transformToRiskAssessment(vessel: any, anomalies: DetectedAnomaly[]): VesselRiskAssessment {
  const analytics = transformToVesselAnalytics(vessel, anomalies)
  const vesselAnomalies = anomalies.filter(a => a.affectedVessels.includes(vessel.mmsi))

  const riskFactors = vesselAnomalies.map(a => ({
    type: a.type,
    description: a.description || `${a.type} detected`,
    severity: a.severity,
    weight: a.severity === 'critical' ? 4 : a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1
  }))

  return {
    ...analytics,
    riskFactors,
    loiteringEvents: vesselAnomalies.filter(a => a.type === 'LOITERING').length,
    rendezvousEvents: vesselAnomalies.filter(a => a.type === 'RENDEZVOUS').length,
    complianceStatus: analytics.riskLevel === 'critical' || analytics.riskLevel === 'high' ? 'non-compliant' :
                      analytics.riskLevel === 'medium' ? 'warning' : 'compliant'
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function MaritimeAnalysisPage() {
  // View state
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE)
  const [activeTab, setActiveTab] = useState<AnalysisType>('anomalies')
  const [showPanel, setShowPanel] = useState(true)

  // Data state
  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([])
  const [vessels, setVessels] = useState<Map<string, any>>(new Map())
  const [vesselTracks, setVesselTracks] = useState<VesselTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null)
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Fetch data from APIs
  const loadData = useCallback(async () => {
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

      // Process anomalies
      const processedAnomalies = (anomalyData.anomalies || []).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        endTime: a.endTime ? new Date(a.endTime) : undefined
      }))

      // Process vessels
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
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Vessel names map
  const vesselNames = useMemo(() => {
    const names = new Map<string, string>()
    vessels.forEach((v, mmsi) => {
      names.set(mmsi, v.name || mmsi)
    })
    return names
  }, [vessels])

  // Transform data for each view
  const fleetData = useMemo((): FleetVessel[] => {
    const anomalyCountByVessel: Record<string, number> = {}
    anomalies.forEach(a => {
      a.affectedVessels.forEach(mmsi => {
        anomalyCountByVessel[mmsi] = (anomalyCountByVessel[mmsi] || 0) + 1
      })
    })

    return Array.from(vessels.values()).map(v =>
      transformToFleetVessel(v, anomalyCountByVessel[v.mmsi] || 0)
    )
  }, [vessels, anomalies])

  const vesselAnalyticsData = useMemo((): VesselAnalytics[] => {
    return Array.from(vessels.values()).map(v =>
      transformToVesselAnalytics(v, anomalies)
    )
  }, [vessels, anomalies])

  const riskAssessmentData = useMemo((): VesselRiskAssessment[] => {
    return Array.from(vessels.values()).map(v =>
      transformToRiskAssessment(v, anomalies)
    )
  }, [vessels, anomalies])

  // Mock route and port data (would come from API in production)
  const routeData = useMemo((): RouteAnalytics[] => {
    return KATTEGAT_PORTS.slice(0, 3).flatMap((origin, i) =>
      KATTEGAT_PORTS.slice(i + 1).map((dest, j) => ({
        id: `${origin.name}-${dest.name}`,
        originPort: origin.name,
        originCountry: origin.country,
        destinationPort: dest.name,
        destinationCountry: dest.country,
        vesselCount: Math.floor(Math.random() * 20) + 5,
        avgDurationHours: Math.random() * 24 + 4,
        distanceNm: Math.random() * 100 + 20,
        avgSpeedKnots: Math.random() * 8 + 6
      }))
    )
  }, [])

  const portData = useMemo((): PortAnalytics[] => {
    return KATTEGAT_PORTS.map(port => ({
      id: port.name,
      name: port.name,
      country: port.country,
      position: { lat: port.lat, lng: port.lng },
      arrivals: Math.floor(Math.random() * 50) + 10,
      departures: Math.floor(Math.random() * 50) + 10,
      avgDwellHours: Math.random() * 48 + 12,
      congestionIndex: Math.random() * 100,
      vesselTypesServed: ['Cargo', 'Tanker', 'Passenger'].slice(0, Math.floor(Math.random() * 3) + 1),
      currentVessels: Math.floor(Math.random() * 15)
    }))
  }, [])

  // Handle anomaly click
  const handleAnomalyClick = useCallback((anomaly: DetectedAnomaly) => {
    setSelectedAnomalyId(anomaly.id)
    setSelectedVesselId(anomaly.affectedVessels[0] || null)

    setViewState(prev => ({
      ...prev,
      longitude: getLocationLng(anomaly.location),
      latitude: getLocationLat(anomaly.location),
      zoom: 11,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }))
  }, [])

  // Handle vessel click
  const handleVesselClick = useCallback((vessel: FleetVessel | VesselAnalytics | VesselRiskAssessment) => {
    setSelectedVesselId(vessel.mmsi)

    if ('position' in vessel && vessel.position) {
      setViewState(prev => ({
        ...prev,
        longitude: vessel.position.lng,
        latitude: vessel.position.lat,
        zoom: 11,
        transitionDuration: 1500,
        transitionInterpolator: new FlyToInterpolator()
      }))
    } else if ('lastPosition' in vessel && vessel.lastPosition) {
      setViewState(prev => ({
        ...prev,
        longitude: vessel.lastPosition.lng,
        latitude: vessel.lastPosition.lat,
        zoom: 11,
        transitionDuration: 1500,
        transitionInterpolator: new FlyToInterpolator()
      }))
    }
  }, [])

  // Handle port click
  const handlePortClick = useCallback((port: PortAnalytics) => {
    setViewState(prev => ({
      ...prev,
      longitude: port.position.lng,
      latitude: port.position.lat,
      zoom: 12,
      transitionDuration: 1500,
      transitionInterpolator: new FlyToInterpolator()
    }))
  }, [])

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'json') => {
    let dataToExport: any[] = []
    let filename = 'maritime-analysis'

    switch (activeTab) {
      case 'anomalies':
        dataToExport = anomalies
        filename = 'anomalies'
        break
      case 'fleet':
        dataToExport = fleetData
        filename = 'fleet'
        break
      case 'vessels':
        dataToExport = vesselAnalyticsData
        filename = 'vessels'
        break
      case 'risk':
        dataToExport = riskAssessmentData
        filename = 'risk-assessment'
        break
      case 'routes':
        dataToExport = routeData
        filename = 'routes'
        break
      case 'ports':
        dataToExport = portData
        filename = 'ports'
        break
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      if (dataToExport.length === 0) return
      const keys = Object.keys(dataToExport[0])
      const csv = [
        keys.join(','),
        ...dataToExport.map(row =>
          keys.map(k => {
            const val = (row as any)[k]
            if (typeof val === 'string' && val.includes(',')) return `"${val}"`
            if (val instanceof Date) return val.toISOString()
            if (typeof val === 'object') return JSON.stringify(val)
            return val
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [activeTab, anomalies, fleetData, vesselAnalyticsData, riskAssessmentData, routeData, portData])

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
      selectedAnomalyId,
      onAnomalyClick: handleAnomalyClick
    })
    allLayers.push(...anomalyLayers)

    return allLayers
  }, [anomalies, vesselTracks, selectedAnomalyId, handleAnomalyClick])

  // Get row count for active tab
  const getRowCount = useCallback(() => {
    switch (activeTab) {
      case 'anomalies': return anomalies.length
      case 'fleet': return fleetData.length
      case 'vessels': return vesselAnalyticsData.length
      case 'risk': return riskAssessmentData.length
      case 'routes': return routeData.length
      case 'ports': return portData.length
      default: return 0
    }
  }, [activeTab, anomalies, fleetData, vesselAnalyticsData, riskAssessmentData, routeData, portData])

  // Render active view
  const renderActiveView = useCallback(() => {
    switch (activeTab) {
      case 'anomalies':
        return (
          <AnomalyAnalysisView
            data={anomalies}
            isLoading={isLoading}
            onRowClick={handleAnomalyClick}
            onShowOnMap={handleAnomalyClick}
            selectedId={selectedAnomalyId}
            vesselNames={vesselNames}
          />
        )
      case 'fleet':
        return (
          <FleetOverviewView
            data={fleetData}
            isLoading={isLoading}
            onRowClick={handleVesselClick}
            onShowOnMap={handleVesselClick}
            selectedId={selectedVesselId}
          />
        )
      case 'vessels':
        return (
          <VesselAnalyticsView
            data={vesselAnalyticsData}
            isLoading={isLoading}
            onRowClick={handleVesselClick}
            onShowOnMap={handleVesselClick}
            selectedId={selectedVesselId}
          />
        )
      case 'risk':
        return (
          <RiskAnalysisView
            data={riskAssessmentData}
            isLoading={isLoading}
            onRowClick={handleVesselClick}
            onShowOnMap={handleVesselClick}
            selectedId={selectedVesselId}
          />
        )
      case 'routes':
        return (
          <RouteAnalysisView
            data={routeData}
            isLoading={isLoading}
            selectedId={null}
          />
        )
      case 'ports':
        return (
          <PortPerformanceView
            data={portData}
            isLoading={isLoading}
            onRowClick={handlePortClick}
            onShowOnMap={handlePortClick}
            selectedId={null}
          />
        )
      default:
        return null
    }
  }, [
    activeTab, anomalies, fleetData, vesselAnalyticsData, riskAssessmentData,
    routeData, portData, isLoading, selectedAnomalyId, selectedVesselId,
    vesselNames, handleAnomalyClick, handleVesselClick, handlePortClick
  ])

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 flex">
      {/* Left Sidebar */}
      <aside className="w-[320px] h-full flex-shrink-0 border-r border-slate-800 z-20">
        <AskDataSidebar
          onResultsReceived={() => {}}
          onDomainChange={() => {}}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div className="absolute inset-0">
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState: newViewState }) =>
              setViewState(newViewState as MapViewState)
            }
            controller={true}
            layers={layers}
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
                  onClick={loadData}
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
                <div className="text-xs text-slate-400 mb-1">Analysis Data</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">{anomalies.length}</span>
                  <span className="text-xs text-slate-500">anomalies</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-white">{vessels.size}</span>
                  <span className="text-xs text-slate-500">vessels</span>
                </div>
              </div>
            )}

            {/* Panel Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPanel(!showPanel)}
              className={cn(
                'bg-slate-900/90 border border-slate-700/50 hover:bg-slate-800',
                showPanel && 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              )}
            >
              Analysis Panel
            </Button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-[calc(45vh+16px)] left-4 z-20 bg-slate-900/90 border border-slate-700/50 rounded-lg p-3">
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

        {/* Bottom Analysis Panel */}
        <BaseAnalysisPanel
          title="Maritime Analysis"
          tabs={ANALYSIS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={showPanel && !isLoading}
          onClose={() => setShowPanel(false)}
          onExport={handleExport}
          rowCount={getRowCount()}
          leftOffset={320}
        >
          {renderActiveView()}
        </BaseAnalysisPanel>
      </div>
    </div>
  )
}
