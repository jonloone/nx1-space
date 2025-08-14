'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { FlyToInterpolator } from '@deck.gl/core'

// Components
import ThreeLayerNavigation, { type Layer, type OperationsMode, type OptimizerMode, type OpportunitiesMode } from './navigation/ThreeLayerNavigation'
import StreamlinedBottomNav from './navigation/StreamlinedBottomNav'
import LayerControlPanel from './controls/LayerControlPanel'
import { createGroundStationLayers, type GroundStation } from './layers/GroundStationLayer'
import { createMaritimeLayers, generateMajorShippingLanes, createSimpleLandMask } from './layers/MaritimeLayers'
import { createSatelliteLayers, calculateSatellitePosition, generateOrbitPath, type SatelliteData, type OrbitPath } from './layers/SatelliteLayer'
import { createEarthLayers } from './layers/EarthLayer'
import { createOptimizerLayers, calculateCoverageCones, type OptimizerPoint } from './layers/OptimizerLayer'
import { createMEOGlobeLayers, generateMEOSatellites, calculateMEOAdvantages } from './Globe/MEOGlobeView'
import { createEnterpriseLayers } from './layers/EnterpriseLayer'
import CompetitorFilter from './ui/CompetitorFilter'
import SatelliteSearchPanel, { type SatelliteInfo } from './panels/SatelliteSearchPanel'
import LayerToggle, { type LayerConfig } from './ui/LayerToggle'
import Enhanced3DGlobe, { type Satellite3D, type OrbitPath3D } from './Globe/Enhanced3DGlobe'

// Dynamically import Hybrid Globe/Map as the primary 3D solution
const HybridGlobeMap = dynamic(
  () => import('./Map/HybridGlobeMap').then(mod => ({ default: mod.HybridGlobeMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white">Loading 3D Globe...</div>
      </div>
    )
  }
)

// Import ClientOnly wrapper
import ClientOnly from './ClientOnly'

// Services - temporarily simplified to avoid performance issues
// import { celestrakService } from '@/lib/data/celestrak-service'
// import { marineCadastreService } from '@/lib/data/marine-cadastre-service'
// import { naturalEarthService } from '@/lib/data/natural-earth-service'
import { meoEnterpriseScorer } from '@/lib/scoring/meo-enterprise-scorer'
// import { EmpiricalStationScoring } from '@/lib/services/empirical-station-scoring'

const INITIAL_VIEW_STATE = {
  longitude: -40,
  latitude: 40,
  zoom: 4,
  pitch: 0,
  bearing: 0
}

// ESRI World Imagery configuration
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_REFERENCE_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface PlatformState {
  layer: Layer
  mode: OperationsMode | OptimizerMode | OpportunitiesMode
  selectedStation: GroundStation | null
  selectedSatellite: SatelliteInfo | null
  showSatellitePanel: boolean
  hoveredObject: any
  loading: boolean
  show3DTerrain: boolean
  show3DGlobe: boolean
  competitorFilters: {
    showSES: boolean
    showViasat: boolean
    showSpaceX: boolean
    showOthers: boolean
  }
}

const ProfessionalIntelligencePlatform: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [platformState, setPlatformState] = useState<PlatformState>({
    layer: 'operations',
    mode: 'utilization',
    selectedStation: null,
    selectedSatellite: null,
    showSatellitePanel: false,
    hoveredObject: null,
    loading: true,
    show3DTerrain: false,
    show3DGlobe: false,
    competitorFilters: {
      showSES: true,
      showViasat: true,
      showSpaceX: true,
      showOthers: true
    }
  })
  
  // Data state
  const [groundStations, setGroundStations] = useState<GroundStation[]>([])
  const [satelliteData, setSatelliteData] = useState<SatelliteData[]>([])
  const [orbitPaths, setOrbitPaths] = useState<OrbitPath[]>([])
  const [realTimeData, setRealTimeData] = useState({
    vessels: [],
    ports: [],
    satellites: []
  })
  const [modelAccuracy, setModelAccuracy] = useState<number>(0.72) // 72% default
  // const [empiricalScoring] = useState(() => new EmpiricalStationScoring())
  const [optimizerPoints, setOptimizerPoints] = useState<OptimizerPoint[]>([])
  const [coverageCones, setCoverageCones] = useState<any[]>([])
  
  // Import complete ground station network
  const [groundStationData, setGroundStationData] = useState<GroundStation[]>([])
  
  // Layer toggle state
  const [enabledLayers, setEnabledLayers] = useState<LayerConfig>({
    satellites: false,
    orbits: false,
    stations: true,
    coverage: false,
    enterprise: true,
    heatmap: true
  })
  
  const toggleLayer = (key: keyof LayerConfig) => {
    setEnabledLayers(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  useEffect(() => {
    // Load complete ground station network including competitors
    import('@/data/groundStations').then(async module => {
      const stations = module.completeGroundStationNetwork || module.groundStationNetwork
      
      // For now, just use the stations as-is without empirical scoring
      // TODO: Fix empirical scoring service
      const scoredStations = stations.map(station => ({
        ...station,
        empiricalScore: 0.7, // Default score
        empiricalConfidence: 0.8 // Default confidence
      }))
      
      setModelAccuracy(0.72) // Default accuracy
      setGroundStationData(scoredStations)
    })
  }, [])
  
  // Temporary fallback stations until data loads
  const fallbackStations: GroundStation[] = [
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
    {
      id: 'ses-woodbine',
      name: 'Woodbine',
      operator: 'SES',
      latitude: 39.3611,
      longitude: -76.7330,
      utilization: 75,
      revenue: 32.5,
      profit: 9.8,
      margin: 0.30,
      confidence: 0.85,
      satellitesVisible: 12,
      avgPassDuration: 40,
      dataCapacity: 85,
      opportunities: ['Government contracts', 'Enterprise backup'],
      risks: ['Infrastructure aging'],
      isActive: true
    },
    {
      id: 'ses-manassas',
      name: 'Manassas',
      operator: 'SES',
      latitude: 38.7509,
      longitude: -77.4753,
      utilization: 68,
      revenue: 28.3,
      profit: 7.1,
      margin: 0.25,
      confidence: 0.82,
      satellitesVisible: 14,
      avgPassDuration: 41,
      dataCapacity: 75,
      opportunities: ['Federal services', 'Data center connectivity'],
      risks: ['Competition from fiber'],
      isActive: true
    },
    {
      id: 'ses-hawaii',
      name: 'Hawaii Teleport',
      operator: 'SES',
      latitude: 21.3099,
      longitude: -157.8581,
      utilization: 88,
      revenue: 48.6,
      profit: 16.5,
      margin: 0.34,
      confidence: 0.93,
      satellitesVisible: 22,
      avgPassDuration: 50,
      dataCapacity: 180,
      opportunities: ['Trans-Pacific coverage', 'Island connectivity'],
      risks: ['Natural disasters', 'High operational costs'],
      isActive: true
    },
    {
      id: 'intelsat-riverside',
      name: 'Riverside',
      operator: 'Intelsat',
      latitude: 33.9533,
      longitude: -117.3962,
      utilization: 72,
      revenue: 35.2,
      profit: 5.3,
      margin: 0.15,
      confidence: 0.78,
      satellitesVisible: 15,
      avgPassDuration: 44,
      dataCapacity: 90,
      opportunities: ['West Coast coverage', 'Media distribution'],
      risks: ['Earthquake zone', 'High real estate costs'],
      isActive: true
    },
    {
      id: 'intelsat-mountainside',
      name: 'Mountainside',
      operator: 'Intelsat',
      latitude: 40.6792,
      longitude: -74.3578,
      utilization: 83,
      revenue: 44.1,
      profit: 11.0,
      margin: 0.25,
      confidence: 0.89,
      satellitesVisible: 17,
      avgPassDuration: 43,
      dataCapacity: 115,
      opportunities: ['NYC market proximity', 'Financial services'],
      risks: ['Weather interruptions', 'Spectrum congestion'],
      isActive: true
    },
    {
      id: 'intelsat-fuchsstadt',
      name: 'Fuchsstadt',
      operator: 'Intelsat',
      latitude: 50.1078,
      longitude: 10.1469,
      utilization: 79,
      revenue: 38.7,
      profit: 8.5,
      margin: 0.22,
      confidence: 0.86,
      satellitesVisible: 13,
      avgPassDuration: 37,
      dataCapacity: 95,
      opportunities: ['European distribution', 'Broadcast services'],
      risks: ['Regulatory changes', 'Energy costs'],
      isActive: true
    },
    {
      id: 'intelsat-ellenwood',
      name: 'Ellenwood',
      operator: 'Intelsat',
      latitude: 33.6318,
      longitude: -84.2646,
      utilization: 65,
      revenue: 29.8,
      profit: 3.0,
      margin: 0.10,
      confidence: 0.75,
      satellitesVisible: 11,
      avgPassDuration: 36,
      dataCapacity: 70,
      opportunities: ['Southeast market', 'Disaster recovery'],
      risks: ['High competition', 'Infrastructure needs upgrade'],
      isActive: true
    },
    {
      id: 'ses-luxembourg',
      name: 'Luxembourg HQ',
      operator: 'SES',
      latitude: 49.6117,
      longitude: 6.1300,
      utilization: 91,
      revenue: 55.3,
      profit: 19.4,
      margin: 0.35,
      confidence: 0.96,
      satellitesVisible: 18,
      avgPassDuration: 46,
      dataCapacity: 160,
      opportunities: ['European hub', 'Regulatory advantages'],
      risks: ['Limited expansion space'],
      isActive: true
    }
  ]
  
  const shippingLanes = useMemo(() => generateMajorShippingLanes(), [])
  const landMask = useMemo(() => createSimpleLandMask(), [])
  
  // Load essential data only - remove expensive real-time API calls
  useEffect(() => {
    // Simplified loading without heavy API calls
    setGroundStations(groundStationData.length > 0 ? groundStationData : fallbackStations)
    setPlatformState(prev => ({ ...prev, loading: false }))
  }, [groundStationData])
  
  // Simplified data loading - removed expensive API calls
  const loadRealTimeData = async () => {
    // This function now does minimal work to avoid timeouts
    console.log('📡 Loading simplified intelligence data...')
    
    try {
      // Use fallback data instead of expensive API calls
      setRealTimeData({
        vessels: [], // Empty for now to avoid performance issues
        ports: [], // Empty for now to avoid performance issues
        satellites: [] // Empty for now to avoid performance issues
      })
      
      console.log('✅ Loaded simplified data successfully')
      
    } catch (error) {
      console.error('❌ Failed to load data:', error)
    }
  }
  
  // Simplified satellite loading - removed expensive calculations
  const loadSatelliteData = async () => {
    try {
      console.log('🛰️ Loading simplified satellite data...')
      
      // Use static satellite data instead of expensive real-time calculations
      const simplifiedSatellites: SatelliteData[] = [
        {
          id: 'ses-1',
          name: 'SES-17',
          operator: 'SES',
          position: [-77, 38, 35786000], // GEO position over Americas
          type: 'GEO',
          constellation: 'SES'
        },
        {
          id: 'ses-2',
          name: 'SES-14',
          operator: 'SES',
          position: [-45, 0, 35786000], // GEO position over Atlantic
          type: 'GEO',
          constellation: 'SES'
        }
      ]
      
      setSatelliteData(simplifiedSatellites)
      setOrbitPaths([]) // No orbit paths to avoid performance issues
      
      console.log(`✅ Loaded ${simplifiedSatellites.length} simplified satellites`)
      
    } catch (error) {
      console.error('❌ Failed to load satellite data:', error)
    }
  }
  
  // Navigation handlers
  const handleLayerChange = useCallback((layer: Layer) => {
    setPlatformState(prev => ({ 
      ...prev, 
      layer,
      mode: layer === 'operations' ? 'utilization' : layer === 'optimizer' ? 'coverage' : 'market',
      selectedStation: null,
      selectedSatellite: null,
      showSatellitePanel: false
    }))
    
    // Adjust camera for different layers
    if (layer === 'optimizer') {
      setViewState(prev => ({
        ...prev,
        zoom: 1, // Zoom out for technical analysis
        pitch: 0,
        bearing: 0
      }))
    } else if (layer === 'opportunities') {
      // Focus on enterprise hubs (Northern Virginia data center region)
      setViewState({
        longitude: -77,
        latitude: 38.9,
        zoom: 6,
        pitch: 0,
        bearing: 0
      })
    } else {
      // Operations layer - focus on populated areas
      setViewState({
        longitude: -20,
        latitude: 45,
        zoom: 4,
        pitch: 0,
        bearing: 0
      })
    }
  }, [])
  
  const handleModeChange = useCallback((mode: OperationsMode | OptimizerMode | OpportunitiesMode) => {
    setPlatformState(prev => ({ ...prev, mode }))
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
  
  const handleSatelliteSelect = useCallback((satellite: SatelliteInfo) => {
    setPlatformState(prev => ({ ...prev, selectedSatellite: satellite }))
    
    // Fly to satellite position
    if (satellite.position) {
      setViewState(prev => ({
        ...prev,
        longitude: satellite.position[0],
        latitude: satellite.position[1],
        zoom: 3,
        transitionDuration: 1500,
        transitionInterpolator: new FlyToInterpolator()
      }))
    }
  }, [])
  
  const handleCloseSatellitePanel = useCallback(() => {
    setPlatformState(prev => ({ ...prev, showSatellitePanel: false }))
  }, [])
  
  // Layer visibility rules
  const layerVisibility = useMemo(() => {
    const { layer, mode } = platformState
    
    return {
      groundStations: true, // Always visible for context
      maritimeHeatmap: false, // Deprecated - replaced by enterprise
      shippingLanes: false, // Deprecated - replaced by enterprise
      ports: false, // Deprecated - replaced by enterprise
      enterpriseLocations: layer === 'opportunities',
      satelliteOrbits: layer === 'optimizer',
      satelliteCoverage: layer === 'optimizer' && mode === 'coverage',
      performanceHalos: layer === 'operations',
      technicalAnalysis: layer === 'optimizer',
      marketIntelligence: layer === 'opportunities'
    }
  }, [platformState])
  
  // Deck.gl layers are no longer needed - using DeckTerrainMap
  // Keeping layer configuration for future use if needed
  const layers = useMemo(() => {
    // All layer logic moved to DeckTerrainMap component
    return []
    
    /* Original layer code preserved for reference:
    const allLayers = []
    
    // Add ESRI satellite base layer when in map mode
    if (platformState.layer !== 'optimizer' || viewState.zoom > 2) {
      // ESRI World Imagery base layer
      allLayers.push(
        new TileLayer({
          id: 'esri-satellite',
          data: ESRI_SATELLITE_URL,
          minZoom: 0,
          maxZoom: 19,
          tileSize: 256,
          opacity: 0.9, // Slightly reduce opacity to make data overlays more visible
          renderSubLayers: props => {
            const {
              bbox: { west, south, east, north }
            } = props.tile
            
            return new BitmapLayer(props, {
              data: null,
              image: props.data,
              bounds: [west, south, east, north]
            })
          }
        })
      )
      
      // Add reference overlay for context (boundaries and place names)
      if (viewState.zoom > 3) {
        allLayers.push(
          new TileLayer({
            id: 'esri-reference',
            data: ESRI_REFERENCE_URL,
            minZoom: 3,
            maxZoom: 12,
            tileSize: 256,
            opacity: 0.3,
            renderSubLayers: props => {
              const {
                bbox: { west, south, east, north }
              } = props.tile
              
              return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [west, south, east, north]
              })
            }
          })
        )
      }
    }
    
    // Simplified optimizer layers - temporarily disabled complex 3D globe
    // Will re-enable with proper LOD system based on zoom level
    // This fixes the optimization view breaking issue
    
    // Filter ground stations based on competitor filters (in opportunities layer)
    let filteredStations = groundStations
    if (platformState.layer === 'opportunities') {
      filteredStations = groundStations.filter(station => {
        if (station.operator === 'SES' && !platformState.competitorFilters.showSES) return false
        if (station.operator === 'Viasat' && !platformState.competitorFilters.showViasat) return false
        if (station.operator === 'SpaceX' && !platformState.competitorFilters.showSpaceX) return false
        if (!['SES', 'Viasat', 'SpaceX'].includes(station.operator) && 
            !platformState.competitorFilters.showOthers) return false
        return true
      })
    }
    
    // Ground station layers (respect toggle state)
    if (enabledLayers.stations) {
      const stationLayers = createGroundStationLayers({
        stations: filteredStations,
        visible: layerVisibility.groundStations,
        onHover: handleStationHover,
        onClick: handleStationClick,
        showLabels: viewState.zoom > 5,
        mode: platformState.mode,
        layer: platformState.layer
      })
      allLayers.push(...stationLayers)
    }
    
    // Enterprise layers (opportunities mode only) - REPLACED MARITIME
    if (layerVisibility.enterpriseLocations && enabledLayers.enterprise) {
      // Determine enterprise mode based on opportunities sub-mode
      let enterpriseMode: 'data_centers' | 'government' | 'telecom' | 'economic' = 'data_centers'
      if (platformState.mode === 'market') enterpriseMode = 'data_centers'
      else if (platformState.mode === 'competition') enterpriseMode = 'telecom'
      else if (platformState.mode === 'expansion') enterpriseMode = 'economic'
      
      const enterpriseLayers = createEnterpriseLayers({
        visible: true,
        mode: enterpriseMode,
        showLabels: viewState.zoom > 5,
        onHover: (object) => {
          if (object) {
            const score = meoEnterpriseScorer.scoreLocation(object.latitude, object.longitude)
            setPlatformState(prev => ({ 
              ...prev, 
              hoveredObject: {
                ...object,
                meoScore: score.score,
                meoConfidence: score.confidence,
                recommendations: score.recommendations
              }
            }))
          } else {
            setPlatformState(prev => ({ ...prev, hoveredObject: null }))
          }
        },
        onClick: (object) => {
          const score = meoEnterpriseScorer.scoreLocation(object.latitude, object.longitude)
          console.log('Enterprise location clicked:', object, 'MEO Score:', score)
        }
      })
      allLayers.push(...enterpriseLayers)
    }
    
    // Optimizer layers for technical validation - SIMPLIFIED
    if (platformState.layer === 'optimizer') {
      // Level of Detail (LOD) based rendering
      const zoomLevel = viewState.zoom
      
      // Simplified optimizer layers - removed expensive calculations
      if (zoomLevel > 2) {
        // Skip expensive coverage calculations for now
        console.log('Optimizer mode active - simplified view')
        // TODO: Re-implement with performance optimization
      }
      
      // Simplified satellite rendering - reduced complexity
      if (zoomLevel > 5 && satelliteData.length > 0 && enabledLayers.satellites) {
        // Show minimal satellites to avoid performance issues
        const satelliteCount = Math.min(5, satelliteData.length)
        try {
          const satelliteLayers = createSatelliteLayers({
            satellites: satelliteData.slice(0, satelliteCount),
            orbits: [], // No orbits for now to avoid performance issues
            visible: true,
            showLabels: false, // No labels for performance
            onHover: (sat) => setPlatformState(prev => ({ ...prev, hoveredObject: sat })),
            onClick: (sat) => {
              const satelliteInfo: SatelliteInfo = sat as SatelliteInfo
              handleSatelliteSelect(satelliteInfo)
            }
          })
          allLayers.push(...satelliteLayers)
        } catch (error) {
          console.warn('Satellite layer error:', error)
        }
      }
    }
    
    return allLayers
    */
  }, [])
  
  // Views are handled by DeckTerrainMap component now

  // Always use the Unified 3D Globe + Terrain as the main view
  // All old conditional rendering has been removed - we only use the unified 3D globe now
  
  // Main render - Use DeckTerrainMap as the primary 3D visualization
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" suppressHydrationWarning>
      {/* Render HybridGlobeMap as the main and only map with hydration safety */}
      <ClientOnly
        fallback={
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white">Initializing 3D Globe...</div>
          </div>
        }
      >
        <HybridGlobeMap 
          activeTab={platformState.layer}
          showTerrain={true}
          showCoverage={enabledLayers.coverage}
          showLabels={true}
          showSatellites={enabledLayers.satellites}
          selectedStation={platformState.selectedStation?.id || null}
          onStationClick={handleStationClick}
        />
      </ClientOnly>
      
      {/* Layer Control Panel - New design on the right */}
      <LayerControlPanel
        layers={enabledLayers}
        onToggle={toggleLayer}
        currentView={platformState.layer}
      />
      
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
      
      
      {/* Satellite Search Panel (Optimizer Layer Only) */}
      <SatelliteSearchPanel
        satellites={satelliteData as SatelliteInfo[]}
        selectedSatellite={platformState.selectedSatellite}
        onSelectSatellite={handleSatelliteSelect}
        onClose={handleCloseSatellitePanel}
        visible={platformState.showSatellitePanel}
      />
      
      {/* Satellite Search Toggle Button (when panel is hidden) */}
      {platformState.layer === 'optimizer' && !platformState.showSatellitePanel && (
        <button
          onClick={() => setPlatformState(prev => ({ ...prev, showSatellitePanel: true }))}
          className="absolute right-4 top-20 bg-black/80 backdrop-blur-xl text-white px-4 py-2 
                     rounded-lg border border-white/20 hover:bg-black/90 transition-colors
                     flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Satellites
        </button>
      )}
      
      {/* Competitor Filter (Opportunities Layer Only) */}
      <CompetitorFilter
        filters={platformState.competitorFilters}
        onFilterChange={(operator, value) => {
          setPlatformState(prev => ({
            ...prev,
            competitorFilters: {
              ...prev.competitorFilters,
              [operator]: value
            }
          }))
        }}
        visible={platformState.layer === 'opportunities'}
      />
      
      {/* No need for 3D toggle buttons - always in 3D mode */}
      
      {/* Streamlined Bottom Navigation */}
      <StreamlinedBottomNav
        currentLayer={platformState.layer}
        onLayerChange={handleLayerChange}
      />
      
    </div>
  )
}

export default ProfessionalIntelligencePlatform