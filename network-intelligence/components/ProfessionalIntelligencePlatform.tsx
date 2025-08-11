'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView, FlyToInterpolator } from '@deck.gl/core'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import ProfessionalNavigation from './navigation/ProfessionalNavigation'
import { createGroundStationLayers, type GroundStation } from './layers/GroundStationLayer'
import { createMaritimeLayers, generateMajorShippingLanes, createSimpleLandMask } from './layers/MaritimeLayers'

// Services
import { celestrakService } from '@/lib/data/celestrak-service'
import { marineCadastreService } from '@/lib/data/marine-cadastre-service'
import { naturalEarthService } from '@/lib/data/natural-earth-service'

const INITIAL_VIEW_STATE = {
  longitude: -40,
  latitude: 40,
  zoom: 4,
  pitch: 0,
  bearing: 0
}

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface PlatformState {
  view: 'groundStations' | 'satellites'
  mode: 'operations' | 'opportunities' | 'coverage' | 'orbits'
  selectedStation: GroundStation | null
  hoveredObject: any
  loading: boolean
}

const ProfessionalIntelligencePlatform: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [platformState, setPlatformState] = useState<PlatformState>({
    view: 'groundStations',
    mode: 'operations',
    selectedStation: null,
    hoveredObject: null,
    loading: true
  })
  
  // Data state
  const [groundStations, setGroundStations] = useState<GroundStation[]>([])
  const [realTimeData, setRealTimeData] = useState({
    vessels: [],
    ports: [],
    satellites: []
  })
  
  // Generate sample ground stations (SES/Intelsat network)
  const sampleGroundStations: GroundStation[] = [
    {
      id: 'ses-betzdorf',
      name: 'Betzdorf',
      operator: 'SES',
      latitude: 49.6867,
      longitude: 6.3333,
      utilization: 92,
      revenue: 45.2,
      profit: 13.6,
      margin: 0.30,
      confidence: 0.95,
      satellitesVisible: 15,
      avgPassDuration: 45,
      dataCapacity: 120,
      opportunities: ['5G backhaul expansion', 'Maritime coverage'],
      risks: ['Regulatory changes', 'Competition'],
      isActive: true
    },
    {
      id: 'ses-princeton',
      name: 'Princeton',
      operator: 'SES',
      latitude: 40.3573,
      longitude: -74.6672,
      utilization: 87,
      revenue: 52.1,
      profit: 15.6,
      margin: 0.30,
      confidence: 0.92,
      satellitesVisible: 18,
      avgPassDuration: 42,
      dataCapacity: 150,
      opportunities: ['Financial sector demand', 'Cruise ship coverage'],
      risks: ['Weather impacts', 'Fiber competition'],
      isActive: true
    },
    {
      id: 'intelsat-atlanta',
      name: 'Atlanta Teleport',
      operator: 'Intelsat',
      latitude: 33.7490,
      longitude: -84.3880,
      utilization: 78,
      revenue: 38.4,
      profit: 7.7,
      margin: 0.20,
      confidence: 0.88,
      satellitesVisible: 14,
      avgPassDuration: 38,
      dataCapacity: 95,
      opportunities: ['Government services', 'Disaster recovery'],
      risks: ['Budget constraints', 'Technology refresh needed'],
      isActive: true
    },
    {
      id: 'ses-singapore',
      name: 'Singapore Hub',
      operator: 'SES',
      latitude: 1.3521,
      longitude: 103.8198,
      utilization: 95,
      revenue: 62.8,
      profit: 22.0,
      margin: 0.35,
      confidence: 0.98,
      satellitesVisible: 20,
      avgPassDuration: 48,
      dataCapacity: 200,
      opportunities: ['Banking hub', 'Shipping coordination', 'Regional expansion'],
      risks: ['High real estate costs'],
      isActive: true
    },
    {
      id: 'intelsat-london',
      name: 'London Gateway',
      operator: 'Intelsat',
      latitude: 51.5074,
      longitude: -0.1278,
      utilization: 85,
      revenue: 41.2,
      profit: 10.3,
      margin: 0.25,
      confidence: 0.90,
      satellitesVisible: 16,
      avgPassDuration: 35,
      dataCapacity: 110,
      opportunities: ['Financial markets', 'European distribution'],
      risks: ['Brexit regulations', 'Spectrum conflicts'],
      isActive: true
    },
    // Add more sample stations...
    {
      id: 'competitor-viasat',
      name: 'ViaSat Ground Station',
      operator: 'Other',
      latitude: 33.1581,
      longitude: -117.3506,
      utilization: 80,
      revenue: 25.0,
      profit: 5.0,
      margin: 0.20,
      confidence: 0.75,
      isActive: true
    }
  ]
  
  const shippingLanes = useMemo(() => generateMajorShippingLanes(), [])
  const landMask = useMemo(() => createSimpleLandMask(), [])
  
  // Load real-time data
  useEffect(() => {
    loadRealTimeData()
  }, [])
  
  const loadRealTimeData = async () => {
    setPlatformState(prev => ({ ...prev, loading: true }))
    
    try {
      console.log('📡 Loading real-time intelligence data...')
      
      // Load vessels for maritime analysis
      const vessels = await marineCadastreService.fetchAISData()
      
      // Load ports for context
      const ports = naturalEarthService.getPortsWithMetrics()
      
      // Load satellites for coverage analysis
      const satellites = await celestrakService.fetchHighValueSatellites()
      
      setRealTimeData({
        vessels: vessels.slice(0, 1000), // Limit for performance
        ports,
        satellites: satellites.slice(0, 200) // Sample for visualization
      })
      
      setGroundStations(sampleGroundStations)
      
      console.log(`✅ Loaded ${vessels.length} vessels, ${ports.length} ports, ${satellites.length} satellites`)
      
    } catch (error) {
      console.error('❌ Failed to load real-time data:', error)
    } finally {
      setPlatformState(prev => ({ ...prev, loading: false }))
    }
  }
  
  // Navigation handlers
  const handleViewChange = useCallback((view: 'groundStations' | 'satellites') => {
    setPlatformState(prev => ({ 
      ...prev, 
      view,
      selectedStation: null // Clear selection when switching views
    }))
    
    // Adjust camera for different views
    if (view === 'satellites') {
      setViewState(prev => ({
        ...prev,
        zoom: Math.max(3, prev.zoom - 1), // Zoom out for satellite view
        pitch: 30 // Add pitch for 3D effect
      }))
    } else {
      setViewState(prev => ({
        ...prev,
        pitch: 0 // Flat view for ground stations
      }))
    }
  }, [])
  
  const handleModeChange = useCallback((mode: 'operations' | 'opportunities' | 'coverage' | 'orbits') => {
    setPlatformState(prev => ({ ...prev, mode }))
    
    // Adjust view based on mode
    if (mode === 'opportunities') {
      // Focus on North Atlantic for maritime opportunities
      setViewState({
        longitude: -40,
        latitude: 40,
        zoom: 5,
        pitch: 0,
        bearing: 0
      })
    } else if (mode === 'operations') {
      // Focus on populated areas with ground stations
      setViewState({
        longitude: -20,
        latitude: 45,
        zoom: 4,
        pitch: 0,
        bearing: 0
      })
    }
  }, [])
  
  const handleStationClick = useCallback((station: GroundStation) => {
    setPlatformState(prev => ({ ...prev, selectedStation: station }))
    
    // Fly to station
    setViewState(prev => ({
      ...prev,
      longitude: station.longitude,
      latitude: station.latitude,
      zoom: Math.max(8, prev.zoom),
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator()
    }))
  }, [])
  
  const handleStationHover = useCallback((station: GroundStation | null) => {
    setPlatformState(prev => ({ ...prev, hoveredObject: station }))
  }, [])
  
  // Layer visibility rules
  const layerVisibility = useMemo(() => {
    const { view, mode } = platformState
    
    return {
      groundStations: true, // Always visible for context
      maritimeHeatmap: view === 'groundStations' && mode === 'opportunities',
      shippingLanes: view === 'groundStations' && mode === 'opportunities', 
      ports: view === 'groundStations' && mode === 'opportunities',
      satelliteOrbits: view === 'satellites',
      satelliteCoverage: view === 'satellites' && mode === 'coverage'
    }
  }, [platformState])
  
  // Create deck.gl layers
  const layers = useMemo(() => {
    const allLayers = []
    
    // Ground station layers (always include for context)
    const stationLayers = createGroundStationLayers({
      stations: groundStations,
      visible: layerVisibility.groundStations,
      onHover: handleStationHover,
      onClick: handleStationClick,
      showLabels: viewState.zoom > 5,
      mode: platformState.mode
    })
    allLayers.push(...stationLayers)
    
    // Maritime layers (opportunities mode only)
    if (layerVisibility.maritimeHeatmap || layerVisibility.shippingLanes) {
      const maritimeLayers = createMaritimeLayers({
        vessels: realTimeData.vessels.map(v => ({
          id: v.mmsi,
          latitude: v.position.latitude,
          longitude: v.position.longitude,
          vesselType: v.vessel.type,
          speed: v.movement.speedKnots,
          heading: v.movement.course,
          timestamp: new Date(),
          confidence: 0.9
        })),
        shippingLanes,
        ports: realTimeData.ports.map(p => ({
          id: p.name,
          name: p.name,
          latitude: p.coordinates[1],
          longitude: p.coordinates[0],
          rank: p.rank as 1 | 2 | 3,
          vesselCapacity: p.vesselCapacity,
          monthlyThroughput: p.vesselCapacity * 10
        })),
        visible: layerVisibility.maritimeHeatmap,
        zoom: viewState.zoom,
        landMask
      })
      allLayers.push(...maritimeLayers)
    }
    
    // TODO: Add satellite orbit layers for satellite view mode
    
    return allLayers
  }, [
    groundStations,
    realTimeData,
    layerVisibility,
    viewState.zoom,
    shippingLanes,
    landMask,
    handleStationHover,
    handleStationClick,
    platformState.mode
  ])
  
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Main Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        getTooltip={({ object }) => {
          if (!object) return null
          
          if (object.name) {
            // Ground station tooltip
            return {
              html: `
                <div class="bg-black/80 text-white p-3 rounded-lg text-xs">
                  <div class="font-semibold">${object.name}</div>
                  <div class="text-gray-300">${object.operator}</div>
                  <div class="mt-2">
                    <div>Revenue: $${object.revenue?.toFixed(1)}M/mo</div>
                    <div>Margin: ${((object.margin || 0) * 100).toFixed(1)}%</div>
                    <div>Utilization: ${object.utilization || 0}%</div>
                  </div>
                </div>
              `,
              style: { pointerEvents: 'none' }
            }
          }
          
          return null
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>
      
      {/* Loading Indicator */}
      <AnimatePresence>
        {platformState.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
          >
            <div className="bg-black/80 text-white px-6 py-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading Intelligence Platform...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Station Detail Panel */}
      <AnimatePresence>
        {platformState.selectedStation && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 w-96 h-full bg-black/90 border-l border-white/10 
                     backdrop-blur-xl text-white overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{platformState.selectedStation.name}</h2>
                  <p className="text-gray-400">{platformState.selectedStation.operator}</p>
                </div>
                <button
                  onClick={() => setPlatformState(prev => ({ ...prev, selectedStation: null }))}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {/* Operational Metrics */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Performance</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Revenue</div>
                      <div className="font-bold text-green-400">${platformState.selectedStation.revenue?.toFixed(1)}M/mo</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Margin</div>
                      <div className="font-bold">{((platformState.selectedStation.margin || 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Utilization</div>
                      <div className="font-bold">{platformState.selectedStation.utilization}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Capacity</div>
                      <div className="font-bold">{platformState.selectedStation.dataCapacity} Gbps</div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Metrics */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Technical</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Satellites Visible</span>
                      <span>{platformState.selectedStation.satellitesVisible}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Pass Duration</span>
                      <span>{platformState.selectedStation.avgPassDuration} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Opportunities */}
                {platformState.selectedStation.opportunities && (
                  <div className="bg-green-500/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-green-400">Opportunities</h3>
                    <div className="space-y-1 text-sm">
                      {platformState.selectedStation.opportunities.map((opp, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                          <span>{opp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Risks */}
                {platformState.selectedStation.risks && (
                  <div className="bg-yellow-500/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-yellow-400">Risk Factors</h3>
                    <div className="space-y-1 text-sm">
                      {platformState.selectedStation.risks.map((risk, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Statistics Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-xl 
                    border border-white/10 rounded-xl px-6 py-3 text-white">
        <div className="flex items-center space-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <i className="fas fa-satellite-dish text-blue-400"></i>
            <span className="text-gray-400">Stations:</span>
            <span className="font-bold">{groundStations.filter(s => s.isActive).length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-ship text-cyan-400"></i>
            <span className="text-gray-400">Vessels:</span>
            <span className="font-bold">{realTimeData.vessels.length.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fas fa-satellite text-green-400"></i>
            <span className="text-gray-400">Satellites:</span>
            <span className="font-bold">{realTimeData.satellites.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">Live Data</span>
          </div>
        </div>
      </div>
      
      {/* Professional Navigation */}
      <ProfessionalNavigation
        onViewChange={handleViewChange}
        onModeChange={handleModeChange}
      />
      
      {/* Professional Badge */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 
                    rounded-full text-xs font-semibold border border-white/20">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>GROUND STATION INTELLIGENCE</span>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalIntelligencePlatform