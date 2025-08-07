'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import Map from 'react-map-gl/maplibre'
import { motion } from 'framer-motion'

// Import services
import { stationDataService, type Station } from '@/lib/services/stationDataService'
import { competitorDataService, type CompetitorStation } from '@/lib/services/competitorDataService'

// Import layers
import { GlowingStationLayer } from '@/components/map-layers/GlowingStationLayer'

// Import UI components
import CompetitorFilter from '@/components/filters/CompetitorFilter'

export default function StationsDemoPage() {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 30,
    zoom: 2.5,
    pitch: 0,
    bearing: 0
  })
  
  const [sesStations, setSesStations] = useState<Station[]>([])
  const [competitorStations, setCompetitorStations] = useState<CompetitorStation[]>([])
  const [selectedOperators, setSelectedOperators] = useState(['SES'])
  const [analysisMode, setAnalysisMode] = useState<'utilization' | 'profit' | 'opportunities' | 'maritime'>('utilization')
  const [hoveredStation, setHoveredStation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStations: 0,
    sesCount: 0,
    competitorCount: 0,
    avgUtilization: 0
  })
  
  // Load all station data
  useEffect(() => {
    loadAllData()
  }, [])
  
  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load SES stations
      const ses = await stationDataService.loadAllStations()
      setSesStations(ses)
      console.log(`Loaded ${ses.length} SES stations`)
      
      // Load competitor stations
      const competitors = await competitorDataService.loadCompetitorStations()
      setCompetitorStations(competitors)
      console.log(`Loaded ${competitors.length} competitor stations`)
      
      // Calculate stats
      const avgUtil = ses.reduce((sum, s) => sum + (s.utilization || 0), 0) / ses.length
      setStats({
        totalStations: ses.length + competitors.length,
        sesCount: ses.length,
        competitorCount: competitors.length,
        avgUtilization: avgUtil
      })
      
    } catch (error) {
      console.error('Error loading station data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Combine and filter stations based on selected operators
  const visibleStations = useMemo(() => {
    const allStations: Station[] = [
      ...sesStations,
      ...competitorStations.map(cs => ({
        ...cs,
        utilization: 50 + Math.random() * 40,
        revenue: 0.5 + Math.random() * 3,
        profit: -0.5 + Math.random() * 2,
        margin: -10 + Math.random() * 30,
        status: 'operational' as const,
        opportunityScore: Math.random()
      }))
    ]
    
    return allStations.filter(s => selectedOperators.includes(s.operator))
  }, [sesStations, competitorStations, selectedOperators])
  
  // Create layers
  const layers = useMemo(() => {
    return [
      new GlowingStationLayer({
        id: 'ground-stations',
        data: visibleStations,
        analysisMode,
        pickable: true,
        onHover: ({ object, x, y }) => {
          setHoveredStation(object ? { ...object, x, y } : null)
        },
        onClick: ({ object }) => {
          if (object) {
            console.log('Clicked station:', object)
          }
        }
      })
    ]
  }, [visibleStations, analysisMode])
  
  return (
    <div className="w-full h-screen relative bg-black">
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
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          preventStyleDiffing={true}
        />
      </DeckGL>
      
      {/* Top Stats Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3">
          <h1 className="text-white text-lg font-semibold flex items-center gap-2">
            <i className="fas fa-satellite-dish text-blue-400" />
            Ground Station Network
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <i className="fas fa-globe text-green-400 text-sm" />
              <div>
                <p className="text-gray-400 text-xs">Total Stations</p>
                <p className="text-white text-sm font-semibold">{stats.totalStations}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-satellite-dish text-blue-400 text-sm" />
              <div>
                <p className="text-gray-400 text-xs">SES Network</p>
                <p className="text-white text-sm font-semibold">{stats.sesCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-chart-line text-yellow-400 text-sm" />
              <div>
                <p className="text-gray-400 text-xs">Avg Utilization</p>
                <p className="text-white text-sm font-semibold">{stats.avgUtilization.toFixed(0)}%</p>
              </div>
            </div>
          </div>
          
          {/* Analysis Mode Selector */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1 flex">
            {[
              { mode: 'utilization', icon: 'fa-chart-line', label: 'Utilization' },
              { mode: 'profit', icon: 'fa-dollar-sign', label: 'Profit' },
              { mode: 'opportunities', icon: 'fa-bullseye', label: 'Opportunities' },
              { mode: 'maritime', icon: 'fa-ship', label: 'Maritime' }
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setAnalysisMode(mode as any)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                  flex items-center gap-2
                  ${analysisMode === mode 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <i className={`fas ${icon}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Competitor Filter */}
      <div className="absolute top-20 right-4 z-10 w-64">
        <CompetitorFilter
          selectedOperators={selectedOperators}
          onOperatorChange={setSelectedOperators}
        />
      </div>
      
      {/* Hover Tooltip */}
      {hoveredStation && (
        <div 
          className="absolute z-20 pointer-events-none"
          style={{ 
            left: hoveredStation.x + 10, 
            top: hoveredStation.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-3 min-w-[200px]"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-white font-semibold text-sm">{hoveredStation.name}</h3>
                <p className="text-gray-400 text-xs">{hoveredStation.operator}</p>
              </div>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: hoveredStation.operator === 'SES' ? '#3B82F6' :
                                  hoveredStation.operator === 'AWS' ? '#FF9900' :
                                  hoveredStation.operator === 'Telesat' ? '#9C27B0' :
                                  hoveredStation.operator === 'SpaceX' ? '#00BCD4' :
                                  '#9CA3AF'
                }}
              />
            </div>
            
            {hoveredStation.operator === 'SES' && (
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Utilization:</span>
                  <span className="text-white">{hoveredStation.utilization?.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Revenue:</span>
                  <span className="text-white">${hoveredStation.revenue?.toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Margin:</span>
                  <span className={hoveredStation.margin > 0 ? 'text-green-400' : 'text-red-400'}>
                    {hoveredStation.margin?.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            
            {hoveredStation.threatLevel && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <i className={`fas fa-exclamation-triangle text-xs ${
                    hoveredStation.threatLevel === 'HIGH' ? 'text-red-400' :
                    hoveredStation.threatLevel === 'MEDIUM' ? 'text-yellow-400' :
                    'text-green-400'
                  }`} />
                  <span className="text-xs text-gray-400">
                    Threat Level: {hoveredStation.threatLevel}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
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
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 z-10">
        <p className="text-white text-xs font-medium mb-2">Station Size = {analysisMode}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-2 bg-gradient-to-r from-red-500 to-green-500 rounded" />
            <span className="text-gray-400">Performance Scale</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-white/20 ring-2 ring-white/40 ring-offset-2 ring-offset-black" />
            <span className="text-gray-400">Glow Effect</span>
          </div>
        </div>
      </div>
    </div>
  )
}