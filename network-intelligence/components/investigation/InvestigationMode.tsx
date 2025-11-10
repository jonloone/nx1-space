'use client'

/**
 * Investigation Mode Component
 *
 * Coordinates all investigation intelligence components and DeckGL layers.
 * Manages state for investigation demo including legal disclaimer, timeline,
 * and panel interactions.
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React, { useState, useEffect, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import type mapboxgl from 'mapbox-gl'
import {
  SubjectProfile,
  LocationAnalysis,
  IntelligenceReport,
  FrequencyHeatmapControl,
  TemporalAnalysis,
  RoutePlayerControls,
  useRoutePlayerLayers,
  useLocationMarkersLayers,
  useFrequencyHeatmapLayer
} from '@/components/investigation'
import InvestigationChat from '@/components/investigation/InvestigationChat'
import type { AgentAction } from '@/lib/agents/investigationAgent'
import { analyzePatterns } from '@/lib/demo/investigation-demo-data'
import { SCENARIO_DIGITAL_SHADOW } from '@/lib/demo/investigation-scenarios'
import { getEnrichedScenarioLoader, type EnrichedDemoData, type EnrichedLocation } from '@/lib/services/enrichedScenarioLoader'
import { getInvestigationIntelligenceService } from '@/lib/services/investigationIntelligenceService'
import type { InvestigationIntelligence } from '@/lib/services/investigationIntelligenceService'
import { getOverturePlacesService } from '@/lib/services/overturePlacesService'
import { getOvertureBuildingsService } from '@/lib/services/overtureBuildingsService'
import { getFeatureHighlightService } from '@/lib/services/featureHighlightService'
import { useTimelinePanelStore } from '@/lib/stores/timelinePanelStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { X, FileText, BarChart3, User, Map, Brain, MapPin, Building2, AlertTriangle, Clock, MapPinned, MessageSquare } from 'lucide-react'

interface InvestigationModeProps {
  map: mapboxgl.Map
  onExit: () => void
}

type ActivePanel = 'profile' | 'location' | 'report' | 'temporal' | 'chat' | null

export default function InvestigationMode({ map, onExit }: InvestigationModeProps) {
  // Investigation data (scenario-based with POI enrichment)
  const [demoData, setDemoData] = useState<EnrichedDemoData | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [intelligence, setIntelligence] = useState<InvestigationIntelligence | null>(null)
  const [isGeneratingIntelligence, setIsGeneratingIntelligence] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<EnrichedLocation | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null)
  const [showNarrativeIntro, setShowNarrativeIntro] = useState(false)

  // Get timeline selection state
  const { selectedLocationId } = useTimelinePanelStore()

  const patternAnalysis = useMemo(
    () => demoData ? analyzePatterns(demoData.locationStops) : null,
    [demoData]
  )

  // Load enriched scenario on mount
  useEffect(() => {
    async function loadScenario() {
      setIsGenerating(true)
      console.log('📖 Loading enriched investigation scenario...')
      console.log(`   Scenario: ${SCENARIO_DIGITAL_SHADOW.title}`)
      try {
        const loader = getEnrichedScenarioLoader()
        const enrichedData = await loader.loadScenarioSafe(SCENARIO_DIGITAL_SHADOW)
        setDemoData(enrichedData)

        // Log enrichment stats
        const stats = loader.getEnrichmentStats(enrichedData)
        console.log('✅ Scenario loaded with enrichment!')
        console.log(`   📍 ${stats.totalLocations} locations`)
        console.log(`   ✓ ${stats.verified} verified addresses`)
        console.log(`   🌍 ${stats.withPOIs} locations with nearby POIs`)
        console.log(`   📊 Avg ${stats.avgPOIsPerLocation} POIs per location`)
        console.log(`   🚨 ${stats.significantPOIs} significant POIs (airports, hospitals, etc.)`)

        // Show narrative introduction after data loads
        setShowNarrativeIntro(true)
      } catch (error) {
        console.error('❌ Failed to load enriched scenario:', error)
        // Fallback to simple scenario loading
        const authService = await import('@/lib/services/authenticInvestigationDataService')
        const service = authService.getAuthenticInvestigationDataService()
        const data = await service.scenarioToDemo(SCENARIO_DIGITAL_SHADOW)
        setDemoData({ ...data, scenario: SCENARIO_DIGITAL_SHADOW } as EnrichedDemoData)
        setShowNarrativeIntro(true)
      }
      setIsGenerating(false)
    }
    loadScenario()
  }, [])

  // Generate AI intelligence analysis when data loads
  useEffect(() => {
    async function generateAIIntelligence() {
      if (!demoData || intelligence || isGeneratingIntelligence) return

      setIsGeneratingIntelligence(true)
      console.log('🤖 Generating AI intelligence analysis...')

      try {
        const intelligenceService = getInvestigationIntelligenceService()
        const aiIntelligence = await intelligenceService.generateIntelligence(
          demoData.subject,
          demoData.locationStops,
          demoData.trackingPoints
        )
        setIntelligence(aiIntelligence)
        console.log('✅ AI intelligence generated!')
        console.log('📊 Risk Score:', aiIntelligence.riskScore)
        console.log('💡 Insights:', aiIntelligence.behavioralInsights.length)
      } catch (error) {
        console.error('❌ Failed to generate AI intelligence:', error)
        // Continue without intelligence - UI will gracefully degrade
      } finally {
        setIsGeneratingIntelligence(false)
      }
    }

    generateAIIntelligence()
  }, [demoData, intelligence, isGeneratingIntelligence])

  // Timeline state (initialized when data loads)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Initialize timeline when data loads
  // Start timeline at the end of all routes so they're visible
  useEffect(() => {
    if (demoData && !currentTime) {
      // Set timeline to the end so all routes are visible initially
      setCurrentTime(demoData.subject.endDate)
      console.log('⏰ Timeline initialized to end of investigation period (all routes visible)')
    }
  }, [demoData, currentTime])

  // Listen for timeline events to fly map to selected locations
  useEffect(() => {
    const handleFlyToLocation = (event: CustomEvent) => {
      if (map && event.detail) {
        const { coordinates, locationId, zoom } = event.detail
        console.log('✈️ Flying to timeline location:', { coordinates, locationId, zoom })

        // Fly to location
        map.flyTo({
          center: coordinates,
          zoom: zoom || 16,
          duration: 2000,
          essential: true
        })

        // Find and highlight the location
        if (locationId && demoData?.locationStops) {
          const location = demoData.locationStops.find(loc => loc.id === locationId)
          if (location) {
            setSelectedLocation(location)
            setActivePanel('location')
          }
        }
      }
    }

    window.addEventListener('timeline:fly-to-location', handleFlyToLocation as EventListener)
    return () => {
      window.removeEventListener('timeline:fly-to-location', handleFlyToLocation as EventListener)
    }
  }, [map, demoData])

  // Panel state
  const [activePanel, setActivePanel] = useState<ActivePanel>('profile')

  // Heatmap state
  const [heatmapVisible, setHeatmapVisible] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState(1.0)
  const [heatmapRadius, setHeatmapRadius] = useState(50)

  // Show trail effect (full route history)
  const [showTrail, setShowTrail] = useState(true)

  // POI layer visibility
  const [poiVisible, setPoiVisible] = useState(false)

  // Buildings layer visibility and 3D mode
  const [buildingsVisible, setBuildingsVisible] = useState(true)
  const [buildings3D, setBuildings3D] = useState(false)

  /**
   * Handle agent-triggered actions from chat
   */
  function handleAgentAction(action: AgentAction) {
    console.log('🎬 Executing agent action:', action.type)

    switch (action.type) {
      case 'flyTo':
        if (action.params?.location && map) {
          map.flyTo({
            center: [action.params.location.lng, action.params.location.lat],
            zoom: action.params.location.zoom || 16,
            duration: 2000,
            essential: true
          })
        }
        break

      case 'highlight':
        if (action.params?.locationId && demoData) {
          const location = demoData.locationStops.find(l => l.id === action.params.locationId)
          if (location) {
            setSelectedLocation(location)
            setActivePanel('location')

            // Fly to location
            if (map) {
              map.flyTo({
                center: [location.lng, location.lat],
                zoom: 16,
                duration: 1500
              })
            }
          }
        }
        break

      case 'playSegment':
        if (action.params?.startTime && action.params?.endTime) {
          setCurrentTime(new Date(action.params.startTime))
          setTimeout(() => setIsPlaying(true), 500)
        }
        break

      case 'showSummary':
        if (action.params?.phase) {
          // Could implement phase-specific views here
          setActivePanel('report')
        }
        break

      case 'generateReport':
        // AI-triggered Multi-INT intelligence report
        console.log('🤖 AI requesting Multi-INT intelligence report')
        setActivePanel('report')
        break

      default:
        console.log('Unknown action type:', action.type)
    }
  }

  // Generate DeckGL layers (only when data is loaded and timeline is initialized)
  const routeLayers = useRoutePlayerLayers({
    trackingPoints: demoData?.trackingPoints || [],
    routeSegments: demoData?.routeSegments || [],
    currentTime: currentTime || new Date(),
    isPlaying,
    showTrail
  })

  const locationLayers = useLocationMarkersLayers({
    locations: demoData?.locationStops || [],
    onLocationClick: async (location) => {
      setSelectedLocation(location)
      setActivePanel('location')

      // Query building at this location and highlight it
      if (map) {
        try {
          const point = map.project([location.lng, location.lat])
          const queryRadius = 10

          // Query buildings at location
          const features = map.queryRenderedFeatures(
            [
              [point.x - queryRadius, point.y - queryRadius],
              [point.x + queryRadius, point.y + queryRadius]
            ],
            {
              layers: ['buildings-2d', 'buildings-3d']
            }
          )

          if (features.length > 0) {
            const building = features[0]
            console.log('🏢 Found building at location:', building.properties)

            // Store building info
            setSelectedBuilding({
              name: building.properties?.name || location.name,
              type: building.properties?.class || 'building',
              levels: building.properties?.floors || building.properties?.levels,
              height: building.properties?.height
            })

            // Highlight the building
            const highlightService = getFeatureHighlightService()
            highlightService.highlightFeature({
              id: building.id?.toString() || `building-${location.id}`,
              name: building.properties?.name || location.name,
              type: 'building',
              coordinates: [location.lng, location.lat],
              properties: building.properties
            })
          } else {
            console.log('⚠️ No building found at location')
            setSelectedBuilding(null)
          }
        } catch (error) {
          console.error('Error querying building:', error)
        }
      }
    },
    currentTime: currentTime || new Date(),
    showLabels: true,
    selectedLocationId: selectedLocationId || undefined
  })

  const heatmapLayer = useFrequencyHeatmapLayer({
    locations: demoData?.locationStops || [],
    visible: heatmapVisible,
    intensity: heatmapIntensity,
    radiusPixels: heatmapRadius
  })

  // Combine all layers
  const investigationLayers = useMemo(() => {
    const layers = []

    if (heatmapLayer) layers.push(heatmapLayer)
    if (routeLayers) layers.push(...routeLayers)
    if (locationLayers) layers.push(...locationLayers)

    return layers
  }, [routeLayers, locationLayers, heatmapLayer])

  // Animation loop for route playback
  useEffect(() => {
    if (!isPlaying || !demoData) return

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const nextTime = new Date(prevTime.getTime() + (60000 * playbackSpeed)) // Advance by 1 minute * speed

        // Loop back to start if we reach the end
        if (nextTime >= demoData.subject.endDate) {
          setIsPlaying(false)
          return demoData.subject.endDate
        }

        return nextTime
      })
    }, 100) // Update 10 times per second for smooth animation

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, demoData])

  // Center map on critical location and initialize layers when data loads
  useEffect(() => {
    if (demoData && map) {
      // Center on Brooklyn Navy Yard (critical anomaly location)
      // This ensures the most important location is immediately visible
      map.flyTo({
        center: [-73.9721, 40.7007], // Brooklyn Navy Yard Warehouse
        zoom: 14.5, // Closer zoom for better route visibility
        pitch: 50,
        bearing: -20,
        duration: 2500
      })

      // Initialize Overture Places POI layer (only if not already added)
      const initPlaces = async () => {
        try {
          // Check if source already exists
          if (map.getSource('overture-places')) {
            console.log('ℹ️  Places layer already exists, skipping initialization')
            return
          }
          const placesService = getOverturePlacesService()
          await placesService.addToMap(map)
          console.log('✅ Places POI layer added to investigation map')
        } catch (error) {
          console.error('❌ Failed to add Places layer:', error)
        }
      }
      initPlaces()

      // Initialize Overture Buildings layer (only if not already added)
      const initBuildings = async () => {
        try {
          // Check if source already exists
          if (map.getSource('overture-buildings')) {
            console.log('ℹ️  Buildings layer already exists, skipping initialization')
            return
          }
          const buildingsService = getOvertureBuildingsService()
          await buildingsService.addToMap(map, buildings3D)
          console.log('✅ Buildings layer added to investigation map (3D:', buildings3D, ')')
        } catch (error) {
          console.error('❌ Failed to add Buildings layer:', error)
        }
      }
      initBuildings()

      // Initialize Feature Highlight Service
      const highlightService = getFeatureHighlightService()
      highlightService.initialize(map)
    }
  }, [demoData, map, buildings3D])

  // Toggle POI layer visibility
  useEffect(() => {
    if (!map) return

    const layerIds = [
      'overture-airports',
      'overture-hospitals',
      'overture-education',
      'overture-cultural',
      'overture-transport',
      'overture-general'
    ]

    layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', poiVisible ? 'visible' : 'none')
      }
    })
  }, [poiVisible, map])

  // Toggle Buildings layer visibility
  useEffect(() => {
    if (!map) return

    const buildingsService = getOvertureBuildingsService()
    buildingsService.setVisible(map, buildingsVisible)
  }, [buildingsVisible, map])

  // Show loading indicator while generating realistic data
  if (!demoData || isGenerating) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg p-8 shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 border-4 border-[#176BF8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-[#171717] mb-2">
            {isGenerating ? 'Generating Investigation Data' : 'Preparing Intelligence Analysis'}
          </div>
          <div className="text-sm text-[#737373]">
            {isGenerating && 'Loading Operation Digital Shadow with POI enrichment...'}
            {!isGenerating && isGeneratingIntelligence && 'Analyzing patterns with AI...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* DeckGL Overlay for Investigation Layers */}
      <DeckGL
        layers={investigationLayers}
        views={new MapView({ repeat: true })}
        controller={false} // Map controls handled by Mapbox
        getTooltip={({ object }: any) => {
          if (object && object.name) {
            return {
              html: `<div style="background: white; padding: 8px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                <strong>${object.name}</strong><br/>
                ${object.significance ? `<span style="color: ${
                  object.significance === 'anomaly' ? '#EF4444' :
                  object.significance === 'suspicious' ? '#F59E0B' : '#10B981'
                }">${object.significance.toUpperCase()}</span>` : ''}
              </div>`,
              style: {
                backgroundColor: 'transparent',
                fontSize: '12px'
              }
            }
          }
          return null
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto'
        }}
      />

      {/* Top Control Bar with Investigation Flow */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex flex-col gap-2">
        {/* Main Control Bar */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-sm font-semibold text-[#171717]">
              Investigation Mode
            </span>
          </div>
          <div className="w-px h-4 bg-[#E5E5E5]" />
          <div className="text-xs text-[#737373]">
            {demoData?.subject.subjectId} • {demoData?.subject.caseNumber}
          </div>
          <div className="w-px h-4 bg-[#E5E5E5]" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-xs text-[#737373] hover:text-[#171717]"
          >
            <X className="h-3 w-3 mr-1" />
            Exit
          </Button>
        </div>

        {/* Investigation Flow Steps */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#10B981] text-white">
                <AlertTriangle className="h-3 w-3" />
              </div>
              <span className="font-medium text-[#10B981]">Alert</span>
            </div>
            <div className="w-8 h-px bg-[#E5E5E5]" />
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#176BF8] text-white">
                <MapPin className="h-3 w-3" />
              </div>
              <span className="font-medium text-[#176BF8]">Location Analysis</span>
            </div>
            <div className="w-8 h-px bg-[#E5E5E5]" />
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full ${
                activePanel === 'profile' ? 'bg-[#176BF8] text-white' : 'bg-[#E5E5E5] text-[#737373]'
              }`}>
                <User className="h-3 w-3" />
              </div>
              <span className={`font-medium ${
                activePanel === 'profile' ? 'text-[#176BF8]' : 'text-[#737373]'
              }`}>Citizen360</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Panel - Controls */}
      <div className="absolute top-28 left-4 z-30 space-y-3" style={{ width: '280px' }}>
        {/* Panel Selector */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-lg p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activePanel === 'profile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('profile')}
              className="text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              Profile
            </Button>
            <Button
              variant={activePanel === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('chat')}
              className="text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              AI Chat
            </Button>
            <Button
              variant={activePanel === 'temporal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('temporal')}
              className="text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Temporal
            </Button>
            <Button
              variant={activePanel === 'report' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePanel('report')}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTrail(!showTrail)}
              className="text-xs"
            >
              <Map className="h-3 w-3 mr-1" />
              {showTrail ? 'Hide' : 'Show'} Trail
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPoiVisible(!poiVisible)}
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {poiVisible ? 'Hide' : 'Show'} POIs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBuildingsVisible(!buildingsVisible)}
              className="text-xs"
            >
              <Building2 className="h-3 w-3 mr-1" />
              {buildingsVisible ? 'Hide' : 'Show'} Buildings
            </Button>
          </div>
        </div>

        {/* Route Player Controls */}
        {demoData && currentTime && (
          <RoutePlayerControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            startTime={demoData.subject.startDate}
            endTime={demoData.subject.endDate}
            playbackSpeed={playbackSpeed}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onTimeSeek={setCurrentTime}
            onSpeedChange={setPlaybackSpeed}
          />
        )}

        {/* Heatmap Controls */}
        <FrequencyHeatmapControl
          visible={heatmapVisible}
          intensity={heatmapIntensity}
          radius={heatmapRadius}
          onVisibilityChange={setHeatmapVisible}
          onIntensityChange={setHeatmapIntensity}
          onRadiusChange={setHeatmapRadius}
        />
      </div>

      {/* Right Panel - Analysis */}
      {activePanel && (
        <div
          className="absolute top-28 right-4 z-30 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden flex flex-col"
          style={{ width: '400px', maxHeight: 'calc(100vh - 140px)' }}
        >
          {activePanel === 'profile' && (
            <>
              <div className="flex-shrink-0 p-4 pb-2 border-b border-[#E5E5E5]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#171717]">Citizen360 Intelligence</h3>
                    {isGeneratingIntelligence && (
                      <div className="flex items-center gap-1 text-[10px] text-[#3B82F6]">
                        <Brain className="h-3 w-3 animate-pulse" />
                        <span>Analyzing...</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActivePanel(null)}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {demoData && patternAnalysis && (
                    <SubjectProfile
                      subject={demoData.subject}
                      stats={{
                        locationsVisited: demoData.locationStops.length,
                        alertsTriggered: patternAnalysis.anomalyLocations.length + patternAnalysis.suspiciousLocations.length,
                        daysTracked: 3,
                        lastUpdate: '2 minutes ago'
                      }}
                      intelligence={intelligence || undefined}
                    />
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {activePanel === 'location' && selectedLocation && (
            <LocationAnalysis
              location={selectedLocation}
              buildingInfo={selectedBuilding}
              onClose={() => {
                setSelectedLocation(null)
                setSelectedBuilding(null)
                setActivePanel('profile')

                // Clear building highlight
                const highlightService = getFeatureHighlightService()
                highlightService.clearHighlight()
              }}
            />
          )}

          {activePanel === 'report' && demoData && patternAnalysis && (
            <div className="h-full">
              <IntelligenceReport
                subject={demoData.subject}
                locations={demoData.locationStops}
                trackingPointsCount={demoData.trackingPoints.length}
                patternAnalysis={patternAnalysis}
                onClose={() => setActivePanel('profile')}
              />
            </div>
          )}

          {activePanel === 'temporal' && demoData && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#171717]">Temporal Analysis</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePanel(null)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <TemporalAnalysis
                trackingPoints={demoData.trackingPoints}
                locations={demoData.locationStops}
              />
            </div>
          )}

          {activePanel === 'chat' && demoData && (
            <InvestigationChat
              investigationData={demoData}
              onAction={handleAgentAction}
            />
          )}
        </div>
      )}

      {/* Narrative Introduction Dialog */}
      <AlertDialog open={showNarrativeIntro} onOpenChange={setShowNarrativeIntro}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EF4444]/10">
                <AlertTriangle className="h-6 w-6 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <AlertDialogTitle className="text-xl font-bold text-[#171717]">
                  {SCENARIO_DIGITAL_SHADOW.title}
                </AlertDialogTitle>
                <p className="text-sm text-[#737373] mt-1">
                  {SCENARIO_DIGITAL_SHADOW.description}
                </p>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogDescription className="space-y-4">
            {/* Critical Alert */}
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#EF4444] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#171717] text-sm mb-1">CRITICAL ALERT</h4>
                  <p className="text-sm text-[#404040]">
                    Subject detected at Brooklyn Navy Yard warehouse at 2:47 AM with multiple unidentified associates.
                    Thermal imaging confirms 3-4 individuals and heavy equipment present.
                  </p>
                </div>
              </div>
            </div>

            {/* Investigation Narrative */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#171717] text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Investigation Summary
              </h4>
              <div className="text-sm text-[#404040] space-y-2 leading-relaxed">
                {SCENARIO_DIGITAL_SHADOW.narrative.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Key Findings */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[#171717] text-sm flex items-center gap-2">
                <MapPinned className="h-4 w-4" />
                Key Findings
              </h4>
              <div className="space-y-2">
                {SCENARIO_DIGITAL_SHADOW.keyFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm text-[#404040] p-2 rounded bg-[#F5F5F5]"
                  >
                    <span className="flex-shrink-0">{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation Stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E5E5E5]">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#171717]">{SCENARIO_DIGITAL_SHADOW.locations.length}</div>
                <div className="text-xs text-[#737373]">Locations Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#EF4444]">3</div>
                <div className="text-xs text-[#737373]">Critical Anomalies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#171717]">72h</div>
                <div className="text-xs text-[#737373]">Surveillance Period</div>
              </div>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowNarrativeIntro(false)
                // Reset timeline to start and begin playback
                if (demoData) {
                  setCurrentTime(demoData.subject.startDate)
                  setTimeout(() => setIsPlaying(true), 1000)
                }
              }}
              className="bg-[#176BF8] hover:bg-[#1557c7] text-white"
            >
              Begin Investigation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
