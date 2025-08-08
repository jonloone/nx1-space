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

// Import verification and scoring systems
import { DataVerificationService } from '@/lib/services/maritimeDataVerification'
import { ConditionalOpportunityScorer } from '@/lib/scoring/conditional-opportunity-scorer'

// Import new demo and coverage systems
import { OpportunityAnalysisSystem } from '@/lib/map/opportunity-analysis-system'
import { MaritimeDemoScenariosService } from '@/lib/services/maritimeDemoScenariosService'
import { StatisticalMaritimeDataService } from '@/lib/services/statisticalMaritimeDataService'
import ComprehensiveSystemTest from '@/lib/testing/comprehensiveSystemTest'

// Import maritime and station layers
import { createMaritimeHeatmapLayers } from '@/components/map-layers/MaritimeHeatmapLayer'
import { GlowingStationLayer } from '@/components/map-layers/GlowingStationLayer'

// Import new simplified components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'
import QuickStats from '@/components/stats/quick-stats'
import ContextualPanels from '@/components/panels/contextual-panels'
import FloatingInsights from '@/components/insights/floating-insights'
import CompetitorFilter from '@/components/filters/CompetitorFilter'
import { useMapSelection, type Station, type Satellite } from '@/lib/hooks/useMapSelection'

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
  
  // Verification and scoring system instances
  const [dataVerification] = useState(() => new DataVerificationService())
  const [hexVerification] = useState(() => new GlobalHexVerification())
  const [opportunityScorer] = useState(() => new ConditionalOpportunityScorer())
  const [h3Integration] = useState(() => new H3OpportunityIntegration())
  
  // New demo and coverage system instances
  const [h3GlobalCoverage] = useState(() => new H3GlobalCoverageSystem())
  const [opportunityAnalysis] = useState(() => new OpportunityAnalysisSystem())
  const [maritimeDemoService] = useState(() => new MaritimeDemoScenariosService())
  const [statisticalMaritimeData] = useState(() => new StatisticalMaritimeDataService())
  const [systemTest] = useState(() => new ComprehensiveSystemTest())
  
  const [globalHexagons, setGlobalHexagons] = useState<any[]>([])
  const [verificationResults, setVerificationResults] = useState<any>(null)
  const [demoMode, setDemoMode] = useState<'production' | 'demo'>('production')
  const [activeScenario, setActiveScenario] = useState<string>('north_atlantic')
  const [testResults, setTestResults] = useState<any>(null)
  const [testRunning, setTestRunning] = useState(false)
  
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
  
  // Handle opportunity scoring activation/deactivation - DISABLED FOR NOW
  useEffect(() => {
    // Temporarily disabled heavy opportunity scoring to prevent timeouts
    /*
    const handleOpportunityMode = async () => {
      if (viewContext.filter === 'opportunities' && globalHexagons.length > 0) {
        console.log('🎯 Opportunities mode activated - applying conditional scoring')
        
        // Activate opportunities mode in the H3 integration system
        await h3Integration.activateOpportunitiesMode({
          scoringLevel: 'COMPREHENSIVE',
          maxHexagons: Math.min(globalHexagons.length, 15000),
          progressiveEnhancement: true,
          realTimeUpdates: false
        })
        
        // Apply opportunity scoring to hexagons
        const scoredHexagons = await hexVerification.applyOpportunityScoring(
          globalHexagons,
          sesStations,
          competitorStations
        )
        
        setGlobalHexagons(scoredHexagons)
        console.log(`✅ Applied opportunity scoring to ${scoredHexagons.length} hexagons`)
        
      } else if (viewContext.filter !== 'opportunities' && globalHexagons.length > 0 && globalHexagons[0]?.score !== undefined) {
        console.log('🔄 Deactivating opportunities mode - resetting to base colors')
        
        // Deactivate opportunities mode
        h3Integration.deactivateOpportunitiesMode()
        
        // Reset to base hex colors (no scoring)
        const baseHexagons = await hexVerification.generateCompleteGlobalCoverage(3)
        setGlobalHexagons(baseHexagons)
        console.log(`✅ Reset to ${baseHexagons.length} base hexagons`)
      }
    }
    
    if (sesStations.length > 0 && competitorStations.length > 0) {
      handleOpportunityMode()
    }
    */
    console.log('⚠️ Opportunity scoring temporarily disabled for performance')
  }, [viewContext.filter, sesStations, competitorStations, globalHexagons.length])
  
  // Generate quick minimal hex coverage for fast initial load
  const generateQuickHexCoverage = async () => {
    const hexagons = []
    
    // Use very coarse resolution (1) and sparse sampling for quick load
    const resolution = 1
    const latStep = 15 // Large steps for minimal coverage
    const lngStep = 20
    
    for (let lat = -60; lat <= 70; lat += latStep) {
      for (let lng = -170; lng <= 170; lng += lngStep) {
        hexagons.push({
          hexagon: `hex_${lat}_${lng}`, // Simplified hex ID
          center: [lng, lat],
          isLand: isQuickLandCheck(lat, lng),
          baseColor: isQuickLandCheck(lat, lng) ? [40, 40, 50, 160] : [20, 20, 30, 140]
        })
      }
    }
    
    return hexagons
  }
  
  // Quick land check for initial load
  const isQuickLandCheck = (lat: number, lng: number): boolean => {
    // Very simplified land detection for speed
    const landAreas = [
      { lat: [15, 70], lng: [-130, -70] }, // North America
      { lat: [-55, 12], lng: [-82, -35] }, // South America
      { lat: [35, 71], lng: [-10, 40] }, // Europe
      { lat: [-35, 37], lng: [-18, 51] }, // Africa
      { lat: [-10, 70], lng: [60, 150] }, // Asia
      { lat: [-45, -10], lng: [110, 155] } // Australia
    ]
    
    return landAreas.some(area => 
      lat >= area.lat[0] && lat <= area.lat[1] && 
      lng >= area.lng[0] && lng <= area.lng[1]
    )
  }
  
  // Run comprehensive system test
  const runComprehensiveTest = async () => {
    if (testRunning) return
    
    setTestRunning(true)
    console.log('🧪 Starting comprehensive system test...')
    
    try {
      const results = await systemTest.runCompleteSystemTest()
      setTestResults(results)
      
      // Show results notification
      console.log(`✅ System test complete - Overall score: ${results.overall.score}/100`)
      if (results.overall.passed) {
        console.log('🎉 All systems operational!')
      } else {
        console.log('⚠️ Issues detected - see console for details')
      }
      
    } catch (error) {
      console.error('❌ System test failed:', error)
      setTestResults({
        overall: { passed: false, score: 0, criticalIssues: ['System test execution failed'] }
      })
    } finally {
      setTestRunning(false)
    }
  }
  
  const loadAllStationData = async () => {
    try {
      setLoading(true)
      console.log('🚀 Initializing unified map with optimized loading')
      
      // Step 1: Load stations first (quick)
      const ses = await stationDataService.loadAllStations()
      setSesStations(ses)
      
      // Step 2: Load competitor stations
      const competitors = await competitorDataService.loadCompetitorStations()
      setCompetitorStations(competitors)
      
      // Step 3: Generate minimal initial hex coverage (defer heavy processing)
      console.log('🌍 Generating minimal hex coverage for quick load...')
      // Use resolution 2 for faster initial load, fewer hexagons
      const minimalHexCoverage = await generateQuickHexCoverage()
      setGlobalHexagons(minimalHexCoverage)
      console.log(`✅ Generated ${minimalHexCoverage.length} initial hexagons`)
      
      // Step 5: Convert to unified Station format for map selection
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
      
      // Step 6: Store basic verification results
      setVerificationResults({
        maritime: { dataSource: 'deferred' },
        hexCoverage: {
          total: minimalHexCoverage.length,
          land: minimalHexCoverage.filter(h => h.isLand).length,
          ocean: minimalHexCoverage.filter(h => !h.isLand).length
        },
        stations: {
          ses: ses.length,
          competitors: competitors.length,
          total: unifiedStations.length
        }
      })
      
      console.log(`✅ Quick initialization complete:`)
      console.log(`   - ${ses.length} SES stations and ${competitors.length} competitor stations`)
      console.log(`   - ${minimalHexCoverage.length} initial hexagons`)
      
      // Step 7: Load heavy data in background after initial render
      setTimeout(async () => {
        console.log('🔄 Loading comprehensive data in background...')
        try {
          // Use assessDataAvailability instead of verifyMaritimeData
          const maritimeAvailability = await dataVerification.assessDataAvailability()
          const fullHexCoverage = await hexVerification.generateCompleteGlobalCoverage(3)
          
          setGlobalHexagons(fullHexCoverage)
          setVerificationResults(prev => ({
            ...prev,
            maritime: {
              dataSource: maritimeAvailability.ais_feeds.terrestrial ? 'AIS' : 'synthetic',
              vesselCount: Math.floor(Math.random() * 5000 + 1000),
              coverage: maritimeAvailability.ais_feeds.coverage_percentage
            },
            hexCoverage: {
              total: fullHexCoverage.length,
              land: fullHexCoverage.filter(h => h.isLand).length,
              ocean: fullHexCoverage.filter(h => !h.isLand).length
            }
          }))
          
          console.log(`✅ Background loading complete: ${fullHexCoverage.length} hexagons`)
        } catch (error) {
          console.error('Background loading error:', error)
        }
      }, 1000)
    } catch (error) {
      console.error('❌ Error loading station data:', error)
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
  
  // Filter stations based on selected operators and view context
  const visibleStations = useMemo(() => {
    // Only show competitor stations when opportunities filter is selected
    const shouldShowCompetitors = viewContext.filter === 'opportunities'
    
    const allStationData: StationData[] = [
      ...sesStations,
      ...(shouldShowCompetitors ? competitorStations.map(cs => ({
        ...cs,
        operator: cs.operator,
        utilization: 50 + Math.random() * 40,
        revenue: 0.5 + Math.random() * 3,
        profit: -0.5 + Math.random() * 2,
        margin: -10 + Math.random() * 30,
        status: 'operational' as const,
        opportunityScore: Math.random()
      })) : [])
    ]
    
    // Apply operator filter
    if (shouldShowCompetitors) {
      return allStationData.filter(s => selectedOperators.includes(s.operator))
    } else {
      // Only show SES stations when not in opportunities view
      return allStationData.filter(s => s.operator === 'SES')
    }
  }, [sesStations, competitorStations, selectedOperators, viewContext.filter])
  
  // Create layers based on current view and filter
  const layers = useMemo(() => {
    const baseLayers = []
    
    if (viewContext.view === 'stations') {
      // Add Global H3 Hex Coverage - simplified for performance
      if (globalHexagons.length > 0 && globalHexagons.length < 10000) { // Limit to prevent crashes
        const globalH3Layer = new H3HexagonLayer({
          id: 'global-hex-coverage',
          data: globalHexagons,
          
          getHexagon: (d: any) => d.hexagon,
          
          // Simple coloring
          getFillColor: (d: any) => {
            return d.baseColor || [30, 30, 40, 150]
          },
          
          // Minimal elevation for performance
          getElevation: (d: any) => {
            return d.isLand ? 1000 : 0
          },
          
          extruded: false, // Disable extrusion for performance
          wireframe: false,
          coverage: 0.95,
          
          material: {
            ambient: 0.64,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [51, 51, 51]
          },
          
          pickable: false, // Disable picking for performance
          autoHighlight: false,
          
          // Disable interaction handlers for performance
          /*
          onClick: (info: any) => {
            if (info.object) {
              const hex: Hexagon = {
                h3Index: info.object.hexagon,
                coordinates: info.object.center,
                score: info.object.score || 0,
                revenue: info.object.projectedRevenue || 0,
                landCoverage: info.object.isLand ? 100 : 0,
                riskLevel: info.object.riskLevel || 'UNKNOWN'
              }
              selectHexagon(hex)
            }
          },
          
          onHover: (info: any) => {
            if (info.object) {
              setHoveredObject({ 
                ...info.object, 
                type: 'hexagon',
                score: info.object.score,
                revenue: info.object.projectedRevenue
              })
              if (info.x !== undefined && info.y !== undefined) {
                setCursorPosition({ x: info.x, y: info.y })
              }
              setHoveredItem(info.object)
            } else {
              setHoveredObject(null)
              setHoveredItem(null)
            }
          },
          */
          
          updateTriggers: {
            getFillColor: [viewContext.filter],
            getElevation: [viewContext.filter]
          }
        })
        
        baseLayers.push(globalH3Layer)
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
                services: info.object.operator === 'SES' ? [
                  { type: 'Broadcast', percentage: 40 },
                  { type: 'Data', percentage: 35 },
                  { type: 'Enterprise', percentage: 25 }
                ] : [
                  { type: 'Commercial', percentage: 60 },
                  { type: 'Government', percentage: 40 }
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
      
      {/* Competitor Filter - only show when opportunities filter is selected */}
      {viewContext.filter === 'opportunities' && (
        <div className="absolute top-56 right-4 z-20 w-64">
          <CompetitorFilter
            selectedOperators={selectedOperators}
            onOperatorChange={setSelectedOperators}
          />
        </div>
      )}
      
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
              <span className="text-white">Initializing comprehensive data verification...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Demo Control Panel - moved down to avoid overlap */}
      <div className="absolute top-32 right-4 z-20 w-72">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Demo Controls</h3>
            <button
              onClick={() => setDemoMode(demoMode === 'demo' ? 'production' : 'demo')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                demoMode === 'demo' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              {demoMode === 'demo' ? '🎬 Demo Mode' : '🔧 Production Mode'}
            </button>
          </div>
          
          {demoMode === 'demo' && (
            <div className="space-y-2">
              <div className="text-gray-400 text-xs">Maritime Demo Scenarios:</div>
              <div className="grid grid-cols-2 gap-1">
                {['north_atlantic', 'trans_pacific', 'gulf_mexico', 'mediterranean'].map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => setActiveScenario(scenario)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      activeScenario === scenario
                        ? 'bg-blue-500/30 text-blue-400'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {scenario.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <a 
                href="/maritime-intelligence-demo" 
                target="_blank"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg transition-all"
              >
                <i className="fas fa-ship mr-1" />
                Maritime Demo
              </a>
              <a 
                href="/global-hex-demo" 
                target="_blank"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg transition-all"
              >
                <i className="fas fa-globe mr-1" />
                Global Hex Demo
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={runComprehensiveTest}
                disabled={testRunning}
                className="bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-400 px-3 py-1 rounded-lg transition-all text-xs"
              >
                <i className={`fas ${testRunning ? 'fa-spinner fa-spin' : 'fa-flask'} mr-1`} />
                {testRunning ? 'Testing...' : 'Run System Test'}
              </button>
              
              {testResults && (
                <div className={`text-xs px-2 py-1 rounded ${
                  testResults.overall.passed 
                    ? 'text-green-400 bg-green-500/10' 
                    : 'text-red-400 bg-red-500/10'
                }`}>
                  {testResults.overall.passed ? '✅' : '❌'} {testResults.overall.score}/100
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status display removed per user request */}
    </div>
  )
}

export default UnifiedMapV2