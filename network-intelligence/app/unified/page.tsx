'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import DeckGL from '@deck.gl/react'
import { MapView, COORDINATE_SYSTEM } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer, ColumnLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Import our new H3 and Maritime layers
import { createH3OpportunityLayer } from '@/components/map-layers/H3OpportunityLayer'
import { createMaritimeHeatmapLayers } from '@/components/map-layers/MaritimeHeatmapLayer'
import type { H3HexagonOpportunity } from '@/lib/services/h3GridService'

// Import our glassmorphic components
import { AppLayout } from '@/components/layout/app-layout'
import { NavigationMode } from '@/components/layout/bottom-navigation'
import { GlassPanel, GlassButton, StatusBadge } from '@/components/ui/glass-components'
import { Activity, Satellite, Ship, Target, BarChart3 } from 'lucide-react'

// Ground station data (sample)
const ALL_STATIONS = [
  // SES Stations
  { id: 'ses-betzdorf', name: 'Betzdorf', coordinates: [6.3501, 49.6847], country: 'Luxembourg', operator: 'SES', score: 92, revenue: 3500000, utilization: 85, type: 'Primary Teleport', capacity: 45 },
  { id: 'ses-manassas', name: 'Manassas VA', coordinates: [-77.4753, 38.7509], country: 'USA', operator: 'SES', score: 89, revenue: 3200000, utilization: 82, type: 'Primary Teleport', capacity: 42 },
  { id: 'ses-woodbine', name: 'Woodbine MD', coordinates: [-77.0647, 39.3365], country: 'USA', operator: 'SES', score: 87, revenue: 2800000, utilization: 78, type: 'Primary Teleport', capacity: 38 },
  { id: 'ses-perth', name: 'Perth', coordinates: [115.8605, -31.9505], country: 'Australia', operator: 'SES', score: 85, revenue: 2800000, utilization: 81, type: 'O3b Gateway', capacity: 35 },
  { id: 'ses-hawaii', name: 'Hawaii', coordinates: [-157.8581, 21.3099], country: 'USA', operator: 'SES', score: 82, revenue: 2600000, utilization: 77, type: 'O3b Gateway', capacity: 33 },
  
  // Intelsat Stations
  { id: 'intelsat-riverside', name: 'Riverside CA', coordinates: [-117.3962, 33.9533], country: 'USA', operator: 'Intelsat', score: 86, revenue: 3000000, utilization: 80, type: 'Primary Teleport', capacity: 40 },
  { id: 'intelsat-mountainside', name: 'Mountainside MD', coordinates: [-77.3644, 39.6837], country: 'USA', operator: 'Intelsat', score: 88, revenue: 3100000, utilization: 83, type: 'Primary Teleport', capacity: 41 },
  { id: 'intelsat-atlanta', name: 'Atlanta GA', coordinates: [-84.3880, 33.7490], country: 'USA', operator: 'Intelsat', score: 84, revenue: 2700000, utilization: 78, type: 'Primary Teleport', capacity: 36 },
  { id: 'intelsat-fuchsstadt', name: 'Fuchsstadt', coordinates: [10.0339, 50.1069], country: 'Germany', operator: 'Intelsat', score: 81, revenue: 2500000, utilization: 76, type: 'Primary Teleport', capacity: 31 },
]

// Mock maritime vessel data
const MARITIME_VESSELS = [
  { id: 'vessel-1', name: 'Atlantic Carrier', coordinates: [-30.2, 40.1], type: 'Container', speed: 18.5, heading: 285 },
  { id: 'vessel-2', name: 'Pacific Explorer', coordinates: [-150.5, 32.8], type: 'Bulk Carrier', speed: 14.2, heading: 120 },
  { id: 'vessel-3', name: 'Mediterranean Star', coordinates: [15.3, 35.7], type: 'Tanker', speed: 12.8, heading: 45 },
  { id: 'vessel-4', name: 'Arctic Pioneer', coordinates: [25.4, 68.9], type: 'Research', speed: 8.3, heading: 200 },
  { id: 'vessel-5', name: 'Caribbean Breeze', coordinates: [-65.8, 18.2], type: 'Cruise', speed: 22.1, heading: 95 },
]

// Opportunity zones data
const OPPORTUNITY_ZONES = [
  { coordinates: [-95.7, 37.1], intensity: 0.9, value: 4200000 },
  { coordinates: [2.3, 48.9], intensity: 0.85, value: 3800000 },
  { coordinates: [139.7, 35.7], intensity: 0.8, value: 3500000 },
  { coordinates: [151.2, -33.9], intensity: 0.75, value: 3200000 },
  { coordinates: [-74.0, 40.7], intensity: 0.9, value: 4100000 },
]

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 30,
  zoom: 2,
  pitch: 0,
  bearing: 0
}

interface UnifiedMapProps {
  currentMode: NavigationMode
  onStationClick?: (station: any) => void
  onVesselClick?: (vessel: any) => void
}

const UnifiedMap: React.FC<UnifiedMapProps> = ({ 
  currentMode, 
  onStationClick,
  onVesselClick 
}) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredObject, setHoveredObject] = useState<any>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [selectedHexagon, setSelectedHexagon] = useState<H3HexagonOpportunity | null>(null)
  const [selectedMaritimeZone, setSelectedMaritimeZone] = useState<any>(null)
  
  // Calculate tooltip position to avoid edge overflow
  const getTooltipStyle = () => {
    const offset = 15
    const tooltipWidth = 320
    const tooltipHeight = 150
    
    let x = cursorPosition.x + offset
    let y = cursorPosition.y - offset
    
    // Check right edge
    if (typeof window !== 'undefined' && cursorPosition.x > window.innerWidth - tooltipWidth - offset) {
      x = cursorPosition.x - tooltipWidth - offset
    }
    
    // Check bottom edge
    if (typeof window !== 'undefined' && cursorPosition.y > window.innerHeight - tooltipHeight - offset) {
      y = cursorPosition.y - tooltipHeight - offset
    }
    
    // Check top edge
    if (y < 0) {
      y = cursorPosition.y + offset
    }
    
    return { left: `${x}px`, top: `${y}px` }
  }


  // Create layers based on current mode
  const layers = useMemo(() => {
    const baseLayers = []

    // Add H3 Opportunity Layer (for opportunities mode and revenue mode)
    if (currentMode === 'opportunities' || currentMode === 'revenue') {
      const h3OpportunityLayer = createH3OpportunityLayer({
        visible: true,
        mode: currentMode === 'revenue' ? 'revenue' : 'opportunities',
        resolutions: [5, 6],
        maxOpportunities: 500,
        onHexagonClick: (hexagon) => {
          setSelectedHexagon(hexagon)
          console.log('H3 Hexagon clicked:', hexagon)
        },
        onHexagonHover: (hexagon, coords) => {
          if (hexagon) {
            setHoveredObject({ ...hexagon, type: 'hexagon' })
            if (coords) {
              setCursorPosition(coords)
            }
          } else {
            setHoveredObject(null)
          }
        }
      })
      
      if (h3OpportunityLayer) {
        baseLayers.push(h3OpportunityLayer)
      }
    }

    // Add Maritime Layers
    if (currentMode === 'maritime') {
      const maritimeLayers = createMaritimeHeatmapLayers({
        visible: true,
        mode: 'traffic',
        showRoutes: true,
        onZoneClick: (zone) => {
          setSelectedMaritimeZone(zone)
          console.log('Maritime zone clicked:', zone)
        },
        onZoneHover: (zone, coords) => {
          if (zone) {
            setHoveredObject({ ...zone, type: 'maritime' })
            if (coords) {
              setCursorPosition(coords)
            }
          } else {
            setHoveredObject(null)
          }
        }
      })
      
      if (Array.isArray(maritimeLayers)) {
        baseLayers.push(...maritimeLayers)
      } else if (maritimeLayers) {
        baseLayers.push(maritimeLayers)
      }
    }

    // Always show ground stations
    if (currentMode !== 'maritime') {
      // Ground stations layer
      baseLayers.push(
        new ScatterplotLayer({
          id: 'ground-stations',
          data: ALL_STATIONS,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => currentMode === 'opportunities' ? d.score * 1000 : 8000,
          getFillColor: (d: any) => {
            switch (currentMode) {
              case 'opportunities':
                return d.score > 85 ? [34, 197, 94] : d.score > 75 ? [234, 179, 8] : [239, 68, 68]
              case 'utilization':
                return d.utilization > 80 ? [59, 130, 246] : d.utilization > 70 ? [168, 85, 247] : [156, 163, 175]
              case 'revenue':
                return d.revenue > 2500000 ? [16, 185, 129] : d.revenue > 2000000 ? [245, 158, 11] : [220, 38, 127]
              case 'satellites':
                return [147, 197, 253]
              default:
                return [99, 102, 241]
            }
          },
          getLineColor: [255, 255, 255, 100],
          getLineWidth: 2,
          stroked: true,
          filled: true,
          radiusMinPixels: 6,
          radiusMaxPixels: 60,
          pickable: true,
          onHover: (info: any) => {
            setHoveredObject(info.object ? { ...info.object, type: 'station' } : null)
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
          },
          onClick: (info: any) => info.object && onStationClick?.(info.object),
          updateTriggers: {
            getRadius: currentMode,
            getFillColor: currentMode,
          }
        })
      )

      // Station labels
      baseLayers.push(
        new TextLayer({
          id: 'station-labels',
          data: ALL_STATIONS.filter((_, i) => i % 3 === 0), // Show every 3rd label to avoid clutter
          getPosition: (d: any) => d.coordinates,
          getText: (d: any) => d.name,
          getSize: 12,
          getColor: [255, 255, 255, 200],
          getAngle: 0,
          getTextAnchor: 'start',
          getAlignmentBaseline: 'center',
          getPixelOffset: [15, 0],
          pickable: false,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 500,
        })
      )
    }

    // Maritime vessels (only in maritime mode or as overlay)
    if (currentMode === 'maritime') {
      baseLayers.push(
        new ScatterplotLayer({
          id: 'maritime-vessels',
          data: MARITIME_VESSELS,
          getPosition: (d: any) => d.coordinates,
          getRadius: 12000,
          getFillColor: (d: any) => {
            switch (d.type) {
              case 'Container': return [34, 197, 94]
              case 'Tanker': return [239, 68, 68]
              case 'Bulk Carrier': return [234, 179, 8]
              case 'Cruise': return [168, 85, 247]
              case 'Research': return [59, 130, 246]
              default: return [156, 163, 175]
            }
          },
          getLineColor: [255, 255, 255, 150],
          getLineWidth: 3,
          stroked: true,
          filled: true,
          radiusMinPixels: 8,
          radiusMaxPixels: 20,
          pickable: true,
          onHover: (info: any) => {
            setHoveredObject(info.object ? { ...info.object, type: 'vessel' } : null)
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
          },
          onClick: (info: any) => info.object && onVesselClick?.(info.object),
        })
      )

      // Vessel labels
      baseLayers.push(
        new TextLayer({
          id: 'vessel-labels',
          data: MARITIME_VESSELS,
          getPosition: (d: any) => d.coordinates,
          getText: (d: any) => `${d.name} (${d.speed}kn)`,
          getSize: 11,
          getColor: [255, 255, 255, 180],
          getAngle: 0,
          getTextAnchor: 'start',
          getAlignmentBaseline: 'center',
          getPixelOffset: [20, -10],
          pickable: false,
          fontFamily: 'Arial, sans-serif',
        })
      )
    }

    // Opportunity heatmap (opportunities mode)
    if (currentMode === 'opportunities') {
      baseLayers.push(
        new HeatmapLayer({
          id: 'opportunity-heatmap',
          data: OPPORTUNITY_ZONES,
          getPosition: (d: any) => d.coordinates,
          getWeight: (d: any) => d.intensity,
          radiusPixels: 80,
          intensity: 1,
          threshold: 0.03,
          colorRange: [
            [0, 0, 0, 0],
            [255, 0, 255, 50],
            [255, 0, 0, 100],
            [255, 255, 0, 150],
            [0, 255, 0, 200]
          ]
        })
      )
    }

    // Utilization coverage areas (utilization mode)
    if (currentMode === 'utilization') {
      const coverageData = ALL_STATIONS.map(station => ({
        ...station,
        radius: station.utilization * 1000 // Radius based on utilization
      }))

      baseLayers.push(
        new ScatterplotLayer({
          id: 'coverage-areas',
          data: coverageData,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => d.radius,
          getFillColor: [59, 130, 246, 30],
          getLineColor: [59, 130, 246, 100],
          getLineWidth: 2,
          stroked: true,
          filled: true,
          radiusMinPixels: 50,
          radiusMaxPixels: 200,
          pickable: false,
        })
      )
    }

    return baseLayers
  }, [currentMode, onStationClick, onVesselClick])

  return (
    <>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        views={new MapView({ id: 'map' })}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          preventStyleDiffing={true}
        />
      </DeckGL>

      {/* Hover tooltip - follows cursor */}
      <AnimatePresence>
        {hoveredObject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 pointer-events-none"
            style={getTooltipStyle()}
          >
            <GlassPanel className="p-3 w-80" blur="lg" opacity="high">
              <div className="text-sm text-white">
                {hoveredObject.type === 'station' ? (
                  <>
                    <div className="font-semibold mb-1">{hoveredObject.name}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>Operator: {hoveredObject.operator}</div>
                      <div>Score: {hoveredObject.score}/100</div>
                      <div>Utilization: {hoveredObject.utilization}%</div>
                    </div>
                  </>
                ) : hoveredObject.type === 'vessel' ? (
                  <>
                    <div className="font-semibold mb-1">{hoveredObject.name}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>Type: {hoveredObject.type}</div>
                      <div>Speed: {hoveredObject.speed} knots</div>
                      <div>Heading: {hoveredObject.heading}°</div>
                    </div>
                  </>
                ) : hoveredObject.type === 'hexagon' ? (
                  <>
                    <div className="font-semibold mb-1">H3 Opportunity Zone</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>H3 Index: {hoveredObject.h3Index}</div>
                      <div>Score: {hoveredObject.score}/100</div>
                      <div>Revenue Potential: ${(hoveredObject.revenue / 1000000).toFixed(1)}M</div>
                      <div>Position: {hoveredObject.coordinates[1].toFixed(2)}°, {hoveredObject.coordinates[0].toFixed(2)}°</div>
                    </div>
                  </>
                ) : hoveredObject.type === 'maritime' ? (
                  <>
                    <div className="font-semibold mb-1">{hoveredObject.name || hoveredObject.route || 'Maritime Zone'}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      {hoveredObject.vesselCount && <div>Vessels: {hoveredObject.vesselCount}</div>}
                      {hoveredObject.avgSpeed && <div>Avg Speed: {hoveredObject.avgSpeed} kts</div>}
                      {hoveredObject.coverageQuality && <div>Coverage: {hoveredObject.coverageQuality}%</div>}
                      {hoveredObject.traffic && <div>Traffic Level: {Math.round(hoveredObject.traffic * 100)}%</div>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold mb-1">Unknown Object</div>
                    <div className="text-white/70 text-xs">
                      Type: {hoveredObject.type}
                    </div>
                  </>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function UnifiedDashboard() {
  const [currentMode, setCurrentMode] = useState<NavigationMode>('opportunities')
  const [selectedStation, setSelectedStation] = useState<any>(null)
  const [selectedVessel, setSelectedVessel] = useState<any>(null)
  const [selectedHexagon, setSelectedHexagon] = useState<H3HexagonOpportunity | null>(null)
  const [selectedMaritimeZone, setSelectedMaritimeZone] = useState<any>(null)

  const handleStationClick = useCallback((station: any) => {
    setSelectedStation(station)
    console.log('Station clicked:', station)
  }, [])

  const handleVesselClick = useCallback((vessel: any) => {
    setSelectedVessel(vessel)
    console.log('Vessel clicked:', vessel)
  }, [])

  const handleModeChange = useCallback((mode: NavigationMode) => {
    setCurrentMode(mode)
    // Clear selections when changing modes
    setSelectedStation(null)
    setSelectedVessel(null)
    setSelectedHexagon(null)
    setSelectedMaritimeZone(null)
  }, [])

  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-950">
      <AppLayout
        currentMode={currentMode}
        onModeChange={handleModeChange}
        showMetrics={true}
      >
        <UnifiedMap
          currentMode={currentMode}
          onStationClick={handleStationClick}
          onVesselClick={handleVesselClick}
        />
      </AppLayout>

      {/* Mode-specific side panels */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div
            key="station-details"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GlassPanel className="p-4 w-80" blur="lg" opacity="medium">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Station Details</h3>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStation(null)}
                >
                  ✕
                </GlassButton>
              </div>
              
              <div className="space-y-3 text-sm text-white">
                <div>
                  <div className="font-medium text-white/90">{selectedStation.name}</div>
                  <div className="text-white/70">{selectedStation.country}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={selectedStation.score > 85 ? 'online' : selectedStation.score > 75 ? 'warning' : 'offline'}
                    showDot
                  >
                    Score: {selectedStation.score}/100
                  </StatusBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/60">Revenue</div>
                    <div className="font-semibold">${(selectedStation.revenue / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-white/60">Utilization</div>
                    <div className="font-semibold">{selectedStation.utilization}%</div>
                  </div>
                  <div>
                    <div className="text-white/60">Capacity</div>
                    <div className="font-semibold">{selectedStation.capacity} Gbps</div>
                  </div>
                  <div>
                    <div className="text-white/60">Type</div>
                    <div className="font-semibold">{selectedStation.type}</div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {selectedVessel && (
          <motion.div
            key="vessel-details"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GlassPanel className="p-4 w-80" blur="lg" opacity="medium">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Vessel Details</h3>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVessel(null)}
                >
                  ✕
                </GlassButton>
              </div>
              
              <div className="space-y-3 text-sm text-white">
                <div>
                  <div className="font-medium text-white/90">{selectedVessel.name}</div>
                  <div className="text-white/70">{selectedVessel.type} Vessel</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusBadge status="online" showDot>
                    Active
                  </StatusBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/60">Speed</div>
                    <div className="font-semibold">{selectedVessel.speed} knots</div>
                  </div>
                  <div>
                    <div className="text-white/60">Heading</div>
                    <div className="font-semibold">{selectedVessel.heading}°</div>
                  </div>
                  <div>
                    <div className="text-white/60">Position</div>
                    <div className="font-semibold text-xs">
                      {selectedVessel.coordinates[1].toFixed(2)}°, {selectedVessel.coordinates[0].toFixed(2)}°
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60">Coverage</div>
                    <div className="font-semibold">Active</div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {selectedHexagon && (
          <motion.div
            key="hexagon-details"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GlassPanel className="p-4 w-80" blur="lg" opacity="medium">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Opportunity Zone</h3>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHexagon(null)}
                >
                  ✕
                </GlassButton>
              </div>
              
              <div className="space-y-3 text-sm text-white">
                <div>
                  <div className="font-medium text-white/90">
                    H3 Opportunity Zone
                  </div>
                  <div className="text-white/70">
                    {selectedHexagon.coordinates[1].toFixed(2)}°, {selectedHexagon.coordinates[0].toFixed(2)}°
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={selectedHexagon.score > 80 ? 'online' : selectedHexagon.score > 60 ? 'warning' : 'offline'}
                    showDot
                  >
                    Score: {selectedHexagon.score}/100
                  </StatusBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-white/60">H3 Index</div>
                    <div className="font-semibold text-[10px]">{selectedHexagon.h3Index}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Revenue Potential</div>
                    <div className="font-semibold">${(selectedHexagon.revenue / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-white/60">Score</div>
                    <div className="font-semibold">{selectedHexagon.score}/100</div>
                  </div>
                  <div>
                    <div className="text-white/60">Location</div>
                    <div className="font-semibold text-[10px]">
                      {selectedHexagon.coordinates[1].toFixed(2)}°, {selectedHexagon.coordinates[0].toFixed(2)}°
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-white/60 text-xs mb-1">H3 Hexagon Analysis</div>
                  <div className="text-white/70 text-xs">
                    This hexagon represents a ground station opportunity zone with potential for satellite communication infrastructure development.
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {selectedMaritimeZone && (
          <motion.div
            key="maritime-details"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GlassPanel className="p-4 w-80" blur="lg" opacity="medium">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Maritime Zone</h3>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMaritimeZone(null)}
                >
                  ✕
                </GlassButton>
              </div>
              
              <div className="space-y-3 text-sm text-white">
                <div>
                  <div className="font-medium text-white/90">
                    {selectedMaritimeZone.name || selectedMaritimeZone.route || 'Maritime Zone'}
                  </div>
                  <div className="text-white/70">
                    {selectedMaritimeZone.coordinates[1].toFixed(2)}°, {selectedMaritimeZone.coordinates[0].toFixed(2)}°
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusBadge status="info" showDot>
                    {selectedMaritimeZone.type || 'Active Zone'}
                  </StatusBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedMaritimeZone.vesselCount && (
                    <div>
                      <div className="text-white/60">Vessel Count</div>
                      <div className="font-semibold">{selectedMaritimeZone.vesselCount}</div>
                    </div>
                  )}
                  {selectedMaritimeZone.avgSpeed && (
                    <div>
                      <div className="text-white/60">Avg Speed</div>
                      <div className="font-semibold">{selectedMaritimeZone.avgSpeed} kts</div>
                    </div>
                  )}
                  {selectedMaritimeZone.coverageQuality && (
                    <div>
                      <div className="text-white/60">Coverage Quality</div>
                      <div className="font-semibold">{selectedMaritimeZone.coverageQuality}%</div>
                    </div>
                  )}
                  {selectedMaritimeZone.latency && (
                    <div>
                      <div className="text-white/60">Latency</div>
                      <div className="font-semibold">{selectedMaritimeZone.latency}ms</div>
                    </div>
                  )}
                  {selectedMaritimeZone.traffic && (
                    <div>
                      <div className="text-white/60">Traffic Level</div>
                      <div className="font-semibold">{Math.round(selectedMaritimeZone.traffic * 100)}%</div>
                    </div>
                  )}
                  {selectedMaritimeZone.intensity && (
                    <div>
                      <div className="text-white/60">Activity Level</div>
                      <div className="font-semibold">{Math.round(selectedMaritimeZone.intensity * 100)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}