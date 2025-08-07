'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Import our new H3 and Maritime layers
import { createH3OpportunityLayer } from '@/components/map-layers/H3OpportunityLayer'
import { createMaritimeHeatmapLayers } from '@/components/map-layers/MaritimeHeatmapLayer'
import type { H3HexagonOpportunity } from '@/lib/services/h3GridService'

// Import new simplified components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'
import QuickStats from '@/components/stats/quick-stats'
import ContextualPanels from '@/components/panels/contextual-panels'
import FloatingInsights from '@/components/insights/floating-insights'
import { useMapSelection, type Station, type Hexagon, type Satellite } from '@/lib/hooks/useMapSelection'

// Sample ground station data
const ALL_STATIONS: Station[] = [
  { 
    id: 'ses-betzdorf', 
    name: 'Betzdorf', 
    location: 'Luxembourg',
    coordinates: [6.3501, 49.6847], 
    utilization: 85,
    revenue: 3.5,
    margin: 23,
    status: 'active',
    services: [
      { type: 'Broadcast', percentage: 45 },
      { type: 'Data', percentage: 35 },
      { type: 'Government', percentage: 20 }
    ],
    utilizationHistory: [82, 83, 84, 85, 84, 85, 85],
    utilizationTrend: 0.5
  },
  { 
    id: 'ses-manassas', 
    name: 'Manassas VA', 
    location: 'USA',
    coordinates: [-77.4753, 38.7509], 
    utilization: 72,
    revenue: 3.2,
    margin: 18,
    status: 'active',
    services: [
      { type: 'Enterprise', percentage: 60 },
      { type: 'Government', percentage: 40 }
    ],
    utilizationHistory: [70, 71, 72, 71, 72, 73, 72],
    utilizationTrend: 0.3
  },
  { 
    id: 'intelsat-riverside', 
    name: 'Riverside CA', 
    location: 'USA',
    coordinates: [-117.3962, 33.9533], 
    utilization: 45,
    revenue: 2.8,
    margin: 12,
    status: 'idle',
    services: [
      { type: 'Broadcast', percentage: 70 },
      { type: 'Data', percentage: 30 }
    ],
    utilizationHistory: [48, 47, 46, 45, 44, 45, 45],
    utilizationTrend: -0.5
  }
]

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
  
  const {
    viewContext,
    selectStation,
    selectHexagon,
    selectSatellite,
    clearSelection,
    setHoveredItem
  } = useMapSelection()
  
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
      
      // Ground stations layer (always visible in stations view)
      baseLayers.push(
        new ScatterplotLayer({
          id: 'ground-stations',
          data: ALL_STATIONS,
          getPosition: (d: Station) => d.coordinates,
          getRadius: 15000,
          getFillColor: (d: Station) => {
            if (viewContext.filter === 'utilization') {
              return d.utilization > 70 ? [34, 197, 94] : d.utilization > 50 ? [234, 179, 8] : [239, 68, 68]
            } else if (viewContext.filter === 'profit') {
              return d.margin > 20 ? [34, 197, 94] : d.margin > 10 ? [234, 179, 8] : [239, 68, 68]
            }
            return [99, 102, 241]
          },
          getLineColor: [255, 255, 255, 100],
          getLineWidth: 2,
          stroked: true,
          filled: true,
          radiusMinPixels: 8,
          radiusMaxPixels: 40,
          pickable: true,
          onClick: handleClick,
          onHover: (info: any) => {
            setHoveredObject(info.object ? { ...info.object, type: 'station' } : null)
            if (info.object && info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
            setHoveredItem(info.object)
          },
          updateTriggers: {
            getFillColor: viewContext.filter
          }
        })
      )
      
      // Station labels
      baseLayers.push(
        new TextLayer({
          id: 'station-labels',
          data: ALL_STATIONS,
          getPosition: (d: Station) => d.coordinates,
          getText: (d: Station) => d.name,
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
  }, [viewContext, selectStation, selectHexagon, selectSatellite, setHoveredItem])
  
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
                    <div className="font-semibold mb-1">{hoveredObject.name}</div>
                    <div className="text-white/70 text-xs space-y-1">
                      <div>Location: {hoveredObject.location}</div>
                      <div>Utilization: {hoveredObject.utilization}%</div>
                      <div>Status: {hoveredObject.status}</div>
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
    </div>
  )
}

export default UnifiedMapV2