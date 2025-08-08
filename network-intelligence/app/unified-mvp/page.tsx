'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { HeatmapLayer, ContourLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Import real data services (client-safe versions)
import { unifiedDataServiceClient, type UnifiedDataPoint, type OpportunityAnalysis } from '@/lib/data/unified-data-service-client'
import { celestrakService } from '@/lib/data/celestrak-service'
import { marineCadastreService } from '@/lib/data/marine-cadastre-service'
import { naturalEarthService } from '@/lib/data/natural-earth-service'

// Import simplified components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'
import QuickStats from '@/components/stats/quick-stats'
import ContextualPanels from '@/components/panels/contextual-panels'
import FloatingInsights from '@/components/insights/floating-insights'

const INITIAL_VIEW_STATE = {
  longitude: -40,
  latitude: 40,
  zoom: 3,
  pitch: 0,
  bearing: 0
}

const UnifiedMVPMap: React.FC = () => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredObject, setHoveredObject] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<OpportunityAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [realData, setRealData] = useState<{
    satellites: any[]
    vessels: any[]
    ports: any[]
    opportunities: OpportunityAnalysis[]
  }>({
    satellites: [],
    vessels: [],
    ports: [],
    opportunities: []
  })
  
  // Stats for display
  const [stats, setStats] = useState({
    satellitesTracked: 0,
    vesselsMonitored: 0,
    portsAnalyzed: 0,
    totalRevenuePotential: 0
  })

  // Load real data on mount
  useEffect(() => {
    loadRealData()
  }, [])

  const loadRealData = async () => {
    setLoading(true)
    try {
      console.log('📡 Loading real data from all sources...')
      
      // Load satellites
      const satellites = await celestrakService.fetchHighValueSatellites()
      console.log(`✅ Loaded ${satellites.length} satellites`)
      
      // Load vessels
      const vessels = await marineCadastreService.fetchAISData()
      console.log(`✅ Loaded ${vessels.length} vessels`)
      
      // Load ports
      const ports = naturalEarthService.getPortsWithMetrics()
      console.log(`✅ Loaded ${ports.length} ports`)
      
      // Score some key locations
      const keyLocations = [
        { name: 'New York', lat: 40.7128, lon: -74.0060 },
        { name: 'Boston', lat: 42.3601, lon: -71.0589 },
        { name: 'Norfolk', lat: 36.8508, lon: -76.2859 },
        { name: 'Miami', lat: 25.7617, lon: -80.1918 },
        { name: 'Halifax', lat: 44.6488, lon: -63.5752 }
      ]
      
      const opportunities = await Promise.all(
        keyLocations.map(loc => 
          unifiedDataServiceClient.fetchLocationData(loc.lat, loc.lon, 300)
        )
      )
      
      // Update state
      setRealData({
        satellites,
        vessels: vessels.slice(0, 200), // Limit for performance
        ports,
        opportunities
      })
      
      // Update stats
      setStats({
        satellitesTracked: satellites.length,
        vesselsMonitored: vessels.length,
        portsAnalyzed: ports.length,
        totalRevenuePotential: opportunities.reduce((sum, o) => sum + o.revenue.annual, 0)
      })
      
    } catch (error) {
      console.error('Error loading real data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Click handler for location analysis
  const handleMapClick = useCallback(async (info: any) => {
    if (info.coordinate) {
      const [lon, lat] = info.coordinate
      setLoading(true)
      
      try {
        const analysis = await unifiedDataServiceClient.fetchLocationData(lat, lon, 300)
        setSelectedLocation(analysis)
      } catch (error) {
        console.error('Error analyzing location:', error)
      } finally {
        setLoading(false)
      }
    }
  }, [])

  // Create layers
  const layers = useMemo(() => {
    const layerList = []
    
    // Maritime vessel heatmap
    if (realData.vessels.length > 0) {
      layerList.push(
        new HeatmapLayer({
          id: 'vessel-heatmap',
          data: realData.vessels,
          getPosition: (d: any) => [d.position.longitude, d.position.latitude],
          getWeight: (d: any) => d.value.score / 100,
          radiusPixels: 50,
          intensity: 1,
          threshold: 0.05,
          colorRange: [
            [25, 0, 31, 0],
            [25, 0, 31, 100],
            [17, 81, 122, 150],
            [43, 131, 186, 200],
            [100, 181, 246, 255],
            [215, 238, 250, 255]
          ]
        })
      )
    }
    
    // Port markers
    if (realData.ports.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: 'ports',
          data: realData.ports,
          getPosition: (d: any) => d.coordinates,
          getFillColor: (d: any) => {
            if (d.rank === 1) return [255, 200, 0, 200] // Gold for major ports
            if (d.rank === 2) return [192, 192, 192, 180] // Silver for secondary
            return [184, 115, 51, 160] // Bronze for minor
          },
          getRadius: (d: any) => Math.sqrt(d.vesselCapacity) * 1000,
          radiusMinPixels: 3,
          radiusMaxPixels: 30,
          pickable: true,
          stroked: true,
          lineWidthMinPixels: 2,
          getLineColor: [255, 255, 255, 100]
        })
      )
      
      // Port labels for major ports
      layerList.push(
        new TextLayer({
          id: 'port-labels',
          data: realData.ports.filter((p: any) => p.rank === 1),
          getPosition: (d: any) => d.coordinates,
          getText: (d: any) => d.name,
          getSize: 14,
          getColor: [255, 255, 255, 255],
          getBackgroundColor: [0, 0, 0, 180],
          backgroundPadding: [4, 2],
          getPixelOffset: [0, -20],
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600
        })
      )
    }
    
    // Opportunity zones from scored locations
    if (realData.opportunities.length > 0) {
      const heatmapData = realData.opportunities.flatMap(opp => {
        // Generate points around each opportunity for smooth heatmap
        const points = []
        for (let i = -5; i <= 5; i++) {
          for (let j = -5; j <= 5; j++) {
            points.push({
              position: [
                opp.location.longitude + (j * 0.5),
                opp.location.latitude + (i * 0.5)
              ],
              score: opp.scores.overall,
              confidence: opp.confidence
            })
          }
        }
        return points
      })
      
      layerList.push(
        new HeatmapLayer({
          id: 'opportunity-heatmap',
          data: heatmapData,
          getPosition: (d: any) => d.position,
          getWeight: (d: any) => d.score * d.confidence / 100,
          radiusPixels: 100,
          intensity: 0.5,
          threshold: 0.1,
          colorRange: [
            [0, 0, 0, 0],
            [139, 0, 139, 80],    // Dark purple (low)
            [75, 0, 130, 120],    // Indigo
            [0, 0, 255, 160],     // Blue
            [0, 255, 0, 200],     // Green (medium)
            [255, 255, 0, 240],   // Yellow
            [255, 0, 0, 255]      // Red (high)
          ]
        })
      )
    }
    
    // Vessel markers (show top value vessels)
    const topVessels = realData.vessels
      .sort((a: any, b: any) => b.value.score - a.value.score)
      .slice(0, 50)
    
    if (topVessels.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: 'vessel-markers',
          data: topVessels,
          getPosition: (d: any) => [d.position.longitude, d.position.latitude],
          getFillColor: (d: any) => {
            const type = d.vessel.type
            if (type.includes('cruise')) return [255, 20, 147, 200] // Deep pink
            if (type.includes('container')) return [30, 144, 255, 200] // Dodger blue
            if (type.includes('tanker')) return [255, 140, 0, 200] // Dark orange
            return [169, 169, 169, 200] // Gray
          },
          getRadius: (d: any) => Math.sqrt(d.value.score) * 300,
          radiusMinPixels: 2,
          radiusMaxPixels: 10,
          pickable: true
        })
      )
    }
    
    return layerList
  }, [realData])

  // Generate insights
  const insights = useMemo(() => {
    const insightList = []
    
    if (stats.satellitesTracked > 0) {
      insightList.push({
        type: 'satellite' as const,
        title: 'Satellite Coverage',
        value: `${stats.satellitesTracked.toLocaleString()} satellites tracked`,
        trend: 'up' as const,
        priority: 'high' as const
      })
    }
    
    if (stats.vesselsMonitored > 0) {
      insightList.push({
        type: 'maritime' as const,
        title: 'Maritime Activity',
        value: `${stats.vesselsMonitored.toLocaleString()} vessels in North Atlantic`,
        trend: 'stable' as const,
        priority: 'medium' as const
      })
    }
    
    if (stats.totalRevenuePotential > 0) {
      insightList.push({
        type: 'revenue' as const,
        title: 'Revenue Opportunity',
        value: `$${(stats.totalRevenuePotential / 1000000).toFixed(1)}M annual potential`,
        trend: 'up' as const,
        priority: 'high' as const
      })
    }
    
    if (selectedLocation) {
      insightList.push({
        type: 'opportunity' as const,
        title: 'Selected Location Score',
        value: `${selectedLocation.scores.overall}/100 opportunity score`,
        trend: selectedLocation.scores.overall > 60 ? 'up' : 'down' as const,
        priority: selectedLocation.scores.overall > 80 ? 'high' : 'medium' as const
      })
    }
    
    return insightList
  }, [stats, selectedLocation])

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Main Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        onClick={handleMapClick}
        onHover={(info) => setHoveredObject(info.object)}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Analyzing location...</span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <QuickStats
        satellitesTracked={stats.satellitesTracked}
        stationsMonitored={stats.portsAnalyzed}
        activeAlerts={0}
        systemHealth={95}
      />

      {/* Floating Insights */}
      <FloatingInsights
        insights={insights}
        className="absolute bottom-24 right-4"
      />

      {/* Selected Location Details */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute top-20 left-4 bg-black/80 text-white p-4 rounded-lg max-w-sm"
        >
          <h3 className="text-lg font-semibold mb-2">Location Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Overall Score:</span>
              <span className={`font-bold ${selectedLocation.scores.overall > 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                {selectedLocation.scores.overall}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span>Satellite:</span>
              <span>{selectedLocation.scores.satellite}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Maritime:</span>
              <span>{selectedLocation.scores.maritime}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Economic:</span>
              <span>{selectedLocation.scores.economic}/100</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span>{(selectedLocation.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span>Monthly Revenue:</span>
                <span className="text-green-400">${selectedLocation.revenue.monthly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Revenue:</span>
                <span className="text-green-400 font-bold">${selectedLocation.revenue.annual.toLocaleString()}</span>
              </div>
            </div>
            {selectedLocation.insights.length > 0 && (
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="text-xs space-y-1">
                  {selectedLocation.insights.slice(0, 3).map((insight, i) => (
                    <div key={i}>{insight}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedLocation(null)}
            className="mt-3 text-xs text-gray-400 hover:text-white"
          >
            Click anywhere to analyze
          </button>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <SimplifiedBottomNavigation
        onViewChange={(view) => {
          // Handle view changes
          if (view === 'atlantic') {
            setViewState({
              ...viewState,
              longitude: -40,
              latitude: 40,
              zoom: 4
            })
          } else if (view === 'global') {
            setViewState({
              ...INITIAL_VIEW_STATE,
              zoom: 2
            })
          }
        }}
      />

      {/* Real Data Badge */}
      <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
        REAL DATA
      </div>
    </div>
  )
}

export default UnifiedMVPMap