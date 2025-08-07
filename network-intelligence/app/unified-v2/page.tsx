'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Import data services
import { stationDataService, type Station as StationData } from '@/lib/services/stationDataService'
import { competitorDataService, type CompetitorStation } from '@/lib/services/competitorDataService'

// Import our new H3 and Maritime layers
import { createH3OpportunityLayer } from '@/components/map-layers/H3OpportunityLayer'
import { createMaritimeHeatmapLayers } from '@/components/map-layers/MaritimeHeatmapLayer'
import { GlowingStationLayer } from '@/components/map-layers/GlowingStationLayer'
import type { H3HexagonOpportunity } from '@/lib/services/h3GridService'

// Import new simplified components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'
import QuickStats from '@/components/stats/quick-stats'
import ContextualPanels from '@/components/panels/contextual-panels'
import FloatingInsights from '@/components/insights/floating-insights'
import CompetitorFilter from '@/components/filters/CompetitorFilter'
import { useMapSelection, type Station, type Hexagon, type Satellite } from '@/lib/hooks/useMapSelection'

// We'll load real station data from services
let ALL_STATIONS: Station[] = []

// Sample satellite data
const SATELLITES: Satellite[] = [
  { id: 'sat-1', name: 'SES-17', type: 'GEO', orbit: 'Geostationary', coverage: 95, capacity: 140, status: 'active' },
  { id: 'sat-2', name: 'O3b mPOWER', type: 'MEO', orbit: 'Medium Earth', coverage: 78, capacity: 200, status: 'active' },
  { id: 'sat-3', name: 'Starlink-1234', type: 'LEO', orbit: 'Low Earth', coverage: 65, capacity: 20, status: 'idle' }
]

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 30,
  zoom: 2,
  pitch: 0,
  bearing: 0
}

const UnifiedMapV2: React.FC = () => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredObject, setHoveredObject] = useState<any>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [allStations, setAllStations] = useState<Station[]>([])
  const [sesStations, setSesStations] = useState<StationData[]>([])
  const [competitorStations, setCompetitorStations] = useState<CompetitorStation[]>([])
  const [selectedOperators, setSelectedOperators] = useState(['SES'])
  const [loading, setLoading] = useState(true)
  
  const {
    viewContext,
    selectStation,
    selectHexagon,
    selectSatellite,
    clearSelection,
    setHoveredItem
  } = useMapSelection()
  
  // Load all station data on mount
  useEffect(() => {
    loadAllStationData()
  }, [])
  
  const loadAllStationData = async () => {
    try {
      setLoading(true)
      
      // Load SES stations
      const ses = await stationDataService.loadAllStations()
      setSesStations(ses)
      
      // Load competitor stations
      const competitors = await competitorDataService.loadCompetitorStations()
      setCompetitorStations(competitors)
      
      // Convert to unified Station format for map selection
      const unifiedStations: Station[] = [
        ...ses.map(s => ({
          id: s.id,
          name: s.name,
          location: s.country,
          coordinates: [s.longitude, s.latitude] as [number, number],
          utilization: s.utilization || 50,
          revenue: s.revenue || 1,
          margin: s.margin || 0,
          status: s.status as 'active' | 'idle' | 'critical' || 'active',
          services: [
            { type: 'Broadcast', percentage: 40 },
            { type: 'Data', percentage: 35 },
            { type: 'Enterprise', percentage: 25 }
          ],
          utilizationHistory: Array(7).fill(0).map(() => 40 + Math.random() * 50),
          utilizationTrend: Math.random() * 2 - 1
        })),
        ...competitors.map(c => ({
          id: c.id,
          name: c.name,
          location: c.country || 'Unknown',
          coordinates: [c.longitude, c.latitude] as [number, number],
          utilization: 50 + Math.random() * 40,
          revenue: 0.5 + Math.random() * 3,
          margin: -10 + Math.random() * 30,
          status: 'active' as const,
          services: [
            { type: 'Commercial', percentage: 60 },
            { type: 'Government', percentage: 40 }
          ],
          utilizationHistory: Array(7).fill(0).map(() => 40 + Math.random() * 50),
          utilizationTrend: Math.random() * 2 - 1
        }))
      ]
      
      setAllStations(unifiedStations)
      ALL_STATIONS = unifiedStations
      
      console.log(`Loaded ${ses.length} SES stations and ${competitors.length} competitor stations`)
    } catch (error) {
      console.error('Error loading station data:', error)
    } finally {
      setLoading(false)
    }
  }
  
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
  
  // Handle layer clicks
  const handleClick = (info: any) => {
    if (!info.object) {
      clearSelection()
      return
    }
    
    // Handle clicks based on layer
    if (info.layer.id === 'ground-stations') {
      selectStation(info.object)
    } else if (info.layer.id === 'h3-opportunity-layer') {
      const hexagon: Hexagon = {
        h3Index: info.object.h3Index,
        coordinates: info.object.coordinates,
        score: info.object.overallScore || info.object.score,
        revenue: info.object.projectedAnnualRevenue || info.object.revenue,
        landCoverage: info.object.landCoverage,
        riskLevel: info.object.riskLevel
      }
      selectHexagon(hexagon)
    } else if (info.layer.id === 'satellites') {
      selectSatellite(info.object)
    }
  }
  
  // Filter stations based on selected operators
  const visibleStations = useMemo(() => {
    const allStationData: StationData[] = [
      ...sesStations,
      ...competitorStations.map(cs => ({
        ...cs,
        operator: cs.operator,
        utilization: 50 + Math.random() * 40,
        revenue: 0.5 + Math.random() * 3,
        profit: -0.5 + Math.random() * 2,
        margin: -10 + Math.random() * 30,
        status: 'operational' as const,
        opportunityScore: Math.random()
      }))
    ]
    
    return allStationData.filter(s => selectedOperators.includes(s.operator))
  }, [sesStations, competitorStations, selectedOperators])
  
  // Create layers based on current view and filter
  const layers = useMemo(() => {
    const baseLayers = []
    
    if (viewContext.view === 'stations') {
      // Add H3 Opportunity Layer for opportunities filter
      if (viewContext.filter === 'opportunities') {
        const h3Layer = createH3OpportunityLayer({
          visible: true,
          mode: 'opportunities',
          resolutions: [5, 6],
          maxOpportunities: 500,
          onHexagonClick: (hexagon) => {
            const hex: Hexagon = {
              h3Index: hexagon.h3Index,
              coordinates: hexagon.coordinates,
              score: hexagon.overallScore,
              revenue: hexagon.projectedAnnualRevenue,
              landCoverage: hexagon.landCoverage,
              riskLevel: hexagon.riskLevel
            }
            selectHexagon(hex)
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
            setHoveredItem(hexagon)
          }
        })
        
        if (h3Layer) {
          baseLayers.push(h3Layer)
        }
      }
      
      // Add Maritime Layers for maritime filter
      if (viewContext.filter === 'maritime') {
        const maritimeLayers = createMaritimeHeatmapLayers({
          visible: true,
          mode: 'traffic',
          showRoutes: true,
          onZoneClick: (zone) => {
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
            setHoveredItem(zone)
          }
        })
        
        baseLayers.push(...maritimeLayers)
      }
      
      // Ground stations layer with glowing effect (always visible in stations view)
      baseLayers.push(
        new GlowingStationLayer({
          id: 'ground-stations',
          data: visibleStations,
          analysisMode: viewContext.filter as any,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              // Convert to Station format for selection
              const station: Station = {
                id: info.object.id,
                name: info.object.name,
                location: info.object.country || 'Unknown',
                coordinates: [info.object.longitude, info.object.latitude],
                utilization: info.object.utilization || 50,
                revenue: info.object.revenue || 1,
                margin: info.object.margin || 0,
                status: info.object.status || 'active',
                services: [
                  { type: 'Broadcast', percentage: 40 },
                  { type: 'Data', percentage: 35 },
                  { type: 'Enterprise', percentage: 25 }
                ],
                utilizationHistory: Array(7).fill(0).map(() => 40 + Math.random() * 50),
                utilizationTrend: Math.random() * 2 - 1
              }
              selectStation(station)
            }
          },
          onHover: (info: any) => {
            setHoveredObject(info.object ? { ...info.object, type: 'station' } : null)
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
            setHoveredItem(info.object)
          }
        })
      )
      
      // Station labels are now included in GlowingStationLayer
      // baseLayers.push(
      //   new TextLayer({
      //     id: 'station-labels',
      //     data: ALL_STATIONS,
      //     getPosition: (d: Station) => d.coordinates,
      //     getText: (d: Station) => d.name,
      //     getSize: 12,
      //     getColor: [255, 255, 255, 200],
      //     getAngle: 0,
      //     getTextAnchor: 'start',
      //     getAlignmentBaseline: 'center',
      //     getPixelOffset: [15, 0],
      //     pickable: false,
      //     fontFamily: 'Arial, sans-serif',
      //     fontWeight: 500,
      //   })
      // )
    }
    
    // Satellite view layers
    if (viewContext.view === 'satellites') {
      // Add satellite visualization layers here
      baseLayers.push(
        new ScatterplotLayer({
          id: 'satellites',
          data: SATELLITES,
          getPosition: () => [Math.random() * 360 - 180, Math.random() * 180 - 90], // Random positions for demo
          getRadius: 20000,
          getFillColor: (d: Satellite) => {
            return d.status === 'active' ? [34, 197, 94] : [156, 163, 175]
          },
          getLineColor: [255, 255, 255, 150],
          getLineWidth: 3,
          stroked: true,
          filled: true,
          radiusMinPixels: 10,
          radiusMaxPixels: 30,
          pickable: true,
          onClick: handleClick,
          onHover: (info: any) => {
            setHoveredObject(info.object ? { ...info.object, type: 'satellite' } : null)
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
            setHoveredItem(info.object)
          }
        })
      )
    }
    
    return baseLayers
  }, [viewContext, visibleStations, selectStation, selectHexagon, selectSatellite, setHoveredItem, sesStations, competitorStations, selectedOperators])
  
  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-950">
      {/* Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        views={new MapView({ id: 'map' })}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
        onClick={handleClick}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          preventStyleDiffing={true}
        />
      </DeckGL>
      
      {/* Quick Stats Overlay */}
      <QuickStats />
      
      {/* Floating Insights */}
      <FloatingInsights />
      
      {/* Competitor Filter - positioned top right */}
      <div className="absolute top-4 right-4 z-20 w-64">
        <CompetitorFilter
          selectedOperators={selectedOperators}
          onOperatorChange={setSelectedOperators}
        />
      </div>
      
      {/* Contextual Panels */}
      <ContextualPanels />
      
      {/* Simplified Bottom Navigation */}
      <SimplifiedBottomNavigation />
      
      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredObject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 pointer-events-none"
            style={getTooltipStyle()}
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-80">
              <div className="text-sm text-white">
                {hoveredObject.type === 'station' ? (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <i className="fas fa-satellite-dish text-xs" />
                          {hoveredObject.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{hoveredObject.operator || 'Unknown'}</div>
                      </div>
                      {hoveredObject.operator && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: 
                              hoveredObject.operator === 'SES' ? '#3B82F6' :
                              hoveredObject.operator === 'AWS' ? '#FF9900' :
                              hoveredObject.operator === 'Telesat' ? '#9C27B0' :
                              hoveredObject.operator === 'SpaceX' ? '#00BCD4' :
                              hoveredObject.operator === 'KSAT' ? '#FFEB3B' :
                              '#9CA3AF'
                          }}
                        />
                      )}
                    </div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-gray-500" />
                        <span>Location: {hoveredObject.location || hoveredObject.country}</span>
                      </div>
                      {hoveredObject.utilization && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-chart-line text-gray-500" />
                          <span>Utilization: {hoveredObject.utilization.toFixed(0)}%</span>
                        </div>
                      )}
                      {hoveredObject.margin !== undefined && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-dollar-sign text-gray-500" />
                          <span>Margin: {hoveredObject.margin?.toFixed(0)}%</span>
                        </div>
                      )}
                      {hoveredObject.threatLevel && (
                        <div className="flex items-center gap-2">
                          <i className={`fas fa-exclamation-triangle text-xs ${
                            hoveredObject.threatLevel === 'HIGH' ? 'text-red-400' :
                            hoveredObject.threatLevel === 'MEDIUM' ? 'text-yellow-400' :
                            'text-green-400'
                          }`} />
                          <span>Threat Level: {hoveredObject.threatLevel}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : hoveredObject.type === 'hexagon' ? (
                  <>
                    <div className="font-semibold mb-1">Opportunity Zone</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>Score: {hoveredObject.score || hoveredObject.overallScore}/100</div>
                      <div>Revenue: ${((hoveredObject.revenue || hoveredObject.projectedAnnualRevenue) / 1000000).toFixed(1)}M</div>
                      <div>Land Coverage: {hoveredObject.landCoverage}%</div>
                    </div>
                  </>
                ) : hoveredObject.type === 'satellite' ? (
                  <>
                    <div className="font-semibold mb-1">{hoveredObject.name}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>Type: {hoveredObject.type}</div>
                      <div>Coverage: {hoveredObject.coverage}%</div>
                      <div>Status: {hoveredObject.status}</div>
                    </div>
                  </>
                ) : hoveredObject.type === 'maritime' ? (
                  <>
                    <div className="font-semibold mb-1">{hoveredObject.route || 'Maritime Zone'}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      {hoveredObject.vesselCount && <div>Vessels: {hoveredObject.vesselCount}</div>}
                      {hoveredObject.avgSpeed && <div>Avg Speed: {hoveredObject.avgSpeed} kts</div>}
                      {hoveredObject.traffic && <div>Traffic: {Math.round(hoveredObject.traffic * 100)}%</div>}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-circle-notch fa-spin text-blue-400 text-xl" />
              <span className="text-white">Loading station data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedMapV2