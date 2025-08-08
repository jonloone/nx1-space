'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'

// Import data services
import { stationDataService, type Station as StationData } from '@/lib/services/stationDataService'
import { competitorDataService, type CompetitorStation } from '@/lib/services/competitorDataService'

// Import layers
import { GlowingStationLayer } from '@/components/map-layers/GlowingStationLayer'

// Import components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'
import FloatingInsights from '@/components/insights/floating-insights'

// Map configuration
const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.7,
  zoom: 4,
  pitch: 0,
  bearing: 0
}

const UnifiedMapV2Lite: React.FC = () => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredObject, setHoveredObject] = useState<any>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [sesStations, setSesStations] = useState<StationData[]>([])
  const [competitorStations, setCompetitorStations] = useState<CompetitorStation[]>([])
  const [selectedOperators, setSelectedOperators] = useState(['SES'])
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<any>(null)
  const [viewFilter, setViewFilter] = useState('default')
  
  // Load station data only
  useEffect(() => {
    loadStationData()
  }, [])
  
  const loadStationData = async () => {
    try {
      setLoading(true)
      console.log('Loading station data...')
      
      // Load SES stations
      const ses = await stationDataService.loadAllStations()
      setSesStations(ses)
      
      // Load competitor stations
      const competitors = await competitorDataService.loadCompetitorStations()
      setCompetitorStations(competitors)
      
      // Data loaded successfully
      console.log(`Loaded ${ses.length} SES stations and ${competitors.length} competitor stations`)
      
    } catch (error) {
      console.error('Error loading station data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Filter stations based on selected operators and current filter
  const visibleStations = useMemo(() => {
    const shouldShowCompetitors = viewFilter === 'opportunities'
    
    const allStationData: StationData[] = [
      ...sesStations,
      ...(shouldShowCompetitors ? competitorStations.map(cs => ({
        id: cs.id,
        name: cs.name,
        latitude: cs.latitude,
        longitude: cs.longitude,
        country: cs.country || 'Unknown',
        operator: cs.operator,
        type: cs.type || 'competitor',
        threatLevel: cs.threatLevel,
        status: 'active' as const,
        utilization: 50 + Math.random() * 40,
        revenue: 0.5 + Math.random() * 3,
        profit: 0.1 + Math.random() * 1,
        margin: -10 + Math.random() * 30
      })) : [])
    ]
    
    // Filter by selected operators
    return allStationData.filter(station => {
      if (selectedOperators.includes('All')) return true
      return selectedOperators.includes(station.operator)
    })
  }, [sesStations, competitorStations, selectedOperators, viewFilter])
  
  // Create layers
  const layers = useMemo(() => {
    const baseLayers = []
    
    // Add glowing station layer
    baseLayers.push(
      new GlowingStationLayer({
        id: 'ground-stations',
        data: visibleStations,
        analysisMode: viewFilter as any,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) {
            setSelectedStation(info.object)
          }
        },
        onHover: (info: any) => {
          if (info.object) {
            setHoveredObject(info.object)
            if (info.x !== undefined && info.y !== undefined) {
              setCursorPosition({ x: info.x, y: info.y })
            }
            // Set hovered item
          } else {
            setHoveredObject(null)
          }
        }
      })
    )
    
    return baseLayers
  }, [visibleStations, viewFilter])
  
  // Calculate tooltip position
  const getTooltipStyle = () => {
    const offset = 15
    const maxX = window.innerWidth - 300
    const maxY = window.innerHeight - 150
    
    let x = cursorPosition.x + offset
    let y = cursorPosition.y + offset
    
    if (x > maxX) x = cursorPosition.x - 300 - offset
    if (y > maxY) y = cursorPosition.y - 150 - offset
    
    return {
      left: `${x}px`,
      top: `${y}px`
    }
  }
  
  
  return (
    <div className="relative w-full h-full bg-black">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
        parameters={{
          clearColor: [0, 0, 0, 1],
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
      
      {/* Bottom Navigation */}
      <SimplifiedBottomNavigation />
      
      {/* Floating Insights - left side */}
      <FloatingInsights />
      
      {/* Hover tooltip */}
      {hoveredObject && (
        <div
          className="absolute pointer-events-none bg-black/80 backdrop-blur-xl text-white p-3 rounded-lg border border-white/10 text-sm z-50 max-w-[300px]"
          style={getTooltipStyle()}
        >
          <div className="font-medium text-blue-400">{hoveredObject.name}</div>
          <div className="text-xs text-gray-400 mt-1">
            {hoveredObject.operator} • {hoveredObject.country || 'Unknown'}
          </div>
          {hoveredObject.utilization !== undefined && (
            <div className="text-xs mt-2">
              Utilization: {hoveredObject.utilization.toFixed(1)}%
            </div>
          )}
          {hoveredObject.threatLevel && (
            <div className={`text-xs mt-1 ${
              hoveredObject.threatLevel === 'HIGH' ? 'text-red-400' :
              hoveredObject.threatLevel === 'MEDIUM' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              Threat Level: {hoveredObject.threatLevel}
            </div>
          )}
        </div>
      )}
      
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
      
      {/* Simple status display */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-xs">
          <div className="text-white font-medium mb-2 flex items-center gap-2">
            <i className="fas fa-check-circle text-green-400" />
            Lite Version
          </div>
          <div className="text-gray-400 space-y-1">
            <div>🏢 {sesStations.length} SES stations</div>
            <div>🎯 {competitorStations.length} competitors</div>
            <div>📊 Mode: {viewFilter}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedMapV2Lite