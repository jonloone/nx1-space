'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import Map from 'react-map-gl/maplibre'
import { motion, AnimatePresence } from 'framer-motion'

// Reality-based visualization layers
import { RealityBasedLayers } from '@/components/map-layers/RealityLayers'
import { OperationalAnalysisModes, getAnalysisLayers } from '@/lib/analysis/OperationalAnalysisModes'

// Data services
import { stationDataService } from '@/lib/services/stationDataService'
import { competitorDataService } from '@/lib/services/competitorDataService'
import { StatisticalMaritimeDataService } from '@/lib/services/statisticalMaritimeDataService'

// UI Components
import SimplifiedBottomNavigation from '@/components/layout/simplified-bottom-navigation'

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2.5,
  pitch: 0,
  bearing: 0
}

const OperationalIntelligence: React.FC = () => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [selectedMode, setSelectedMode] = useState('maritime')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [stations, setStations] = useState<any[]>([])
  const [vesselData, setVesselData] = useState<any[]>([])
  const [shippingRoutes, setShippingRoutes] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [satellites, setSatellites] = useState<any[]>([])
  
  // Services
  const [maritimeService] = useState(() => new StatisticalMaritimeDataService())
  
  // Load all data on mount
  useEffect(() => {
    loadOperationalData()
  }, [])
  
  const loadOperationalData = async () => {
    try {
      setLoading(true)
      
      // Load station data
      const [sesStations, competitors] = await Promise.all([
        stationDataService.loadAllStations(),
        competitorDataService.loadCompetitorStations()
      ])
      
      // Combine all stations
      const allStations = [
        ...sesStations.map(s => ({ ...s, operator: 'SES' })),
        ...competitors
      ]
      setStations(allStations)
      
      // Generate maritime data
      const vessels = await maritimeService.generateStatisticalVessels(1000)
      const vesselPoints = vessels.map(v => ({
        position: v.current_position,
        monthlyValue: v.monthly_value || 10000,
        vesselType: v.vessel_type,
        route: v.route_name
      }))
      setVesselData(vesselPoints)
      
      // Create shipping routes
      const routes = generateShippingRoutes()
      setShippingRoutes(routes)
      
      // Generate opportunity points
      const opps = generateOpportunityPoints(allStations, vesselPoints)
      setOpportunities(opps)
      
      // Mock satellite data
      const sats = generateSatelliteData()
      setSatellites(sats)
      
    } catch (error) {
      console.error('Error loading operational data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Generate layers based on selected mode
  const getLayers = useCallback(() => {
    const layers = []
    const modeLayers = getAnalysisLayers(selectedMode)
    
    modeLayers.forEach(layerId => {
      switch(layerId) {
        case 'maritime-heatmap':
          if (vesselData.length > 0) {
            layers.push(RealityBasedLayers.createMaritimeHeatmap(vesselData))
          }
          break
          
        case 'shipping-flows':
          if (shippingRoutes.length > 0) {
            layers.push(RealityBasedLayers.createShippingFlows(shippingRoutes))
          }
          break
          
        case 'coverage-footprints':
          if (satellites.length > 0 && stations.length > 0) {
            layers.push(RealityBasedLayers.createCoverageFootprints(satellites, stations))
          }
          break
          
        case 'station-coverage-radius':
          if (stations.length > 0) {
            layers.push(RealityBasedLayers.createStationCoverageRadius(stations))
          }
          break
          
        case 'opportunity-contours':
          if (opportunities.length > 0) {
            layers.push(RealityBasedLayers.createOpportunityContours(opportunities))
          }
          break
          
        case 'opportunity-markers':
          if (opportunities.length > 0) {
            layers.push(RealityBasedLayers.createOpportunityMarkers(opportunities))
          }
          break
          
        case 'competition-zones':
          if (stations.length > 0) {
            layers.push(RealityBasedLayers.createCompetitionZones(stations))
          }
          break
          
        case 'coverage-gaps':
          if (stations.length > 0) {
            layers.push(RealityBasedLayers.createCoverageGaps(stations, null))
          }
          break
      }
    })
    
    // Always add ground stations on top
    if (modeLayers.includes('ground-stations')) {
      layers.push(createStationLayer(stations))
    }
    
    return layers
  }, [selectedMode, stations, vesselData, shippingRoutes, opportunities, satellites])
  
  return (
    <div className="relative w-full h-screen bg-gray-950">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={getLayers()}
        getTooltip={({ object }) => object && {
          html: `<div class="bg-black/80 text-white p-2 rounded text-sm">
            ${object.name || object.station || object.route || 'Data Point'}
          </div>`
        }}
      >
        <MapView id="map" width="100%" height="100%" controller={true}>
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
          />
        </MapView>
      </DeckGL>
      
      {/* Mode Selector */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <h3 className="text-white text-sm font-medium mb-3">Analysis Mode</h3>
          <div className="space-y-2">
            {Object.values(OperationalAnalysisModes).map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-all
                  ${selectedMode === mode.id 
                    ? 'bg-blue-500/20 border border-blue-400 text-white' 
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <i className={`fas ${mode.icon} text-sm`} />
                  <div>
                    <div className="text-sm font-medium">{mode.name}</div>
                    <div className="text-xs opacity-70">{mode.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Metrics Panel */}
      <div className="absolute top-4 right-4 z-10">
        <MetricsPanel mode={selectedMode} data={{ stations, vesselData, opportunities }} />
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-24 right-4 z-10">
        <Legend mode={selectedMode} />
      </div>
      
      {/* Bottom Navigation */}
      <SimplifiedBottomNavigation />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading Operational Intelligence...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components

const MetricsPanel: React.FC<{ mode: string, data: any }> = ({ mode, data }) => {
  const getMetrics = () => {
    switch(mode) {
      case 'maritime':
        return [
          { label: 'Vessels in View', value: data.vesselData.length.toLocaleString() },
          { label: 'Coverage', value: '78%' },
          { label: 'Monthly Value', value: '$12.5M' }
        ]
      case 'coverage':
        return [
          { label: 'Stations', value: data.stations.length },
          { label: 'Coverage Area', value: '65%' },
          { label: 'Avg Signal', value: '85%' }
        ]
      case 'opportunity':
        return [
          { label: 'Opportunities', value: data.opportunities.filter(o => o.score > 0.7).length },
          { label: 'Total Value', value: '$127M' },
          { label: 'ROI', value: '3.2x' }
        ]
      default:
        return []
    }
  }
  
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-64">
      <h3 className="text-white text-sm font-medium mb-3">Key Metrics</h3>
      <div className="space-y-2">
        {getMetrics().map((metric, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">{metric.label}</span>
            <span className="text-white text-sm font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const Legend: React.FC<{ mode: string }> = ({ mode }) => {
  const getLegendItems = () => {
    const modeConfig = OperationalAnalysisModes[mode]
    if (!modeConfig) return []
    
    return Object.entries(modeConfig.colorScheme).map(([label, color]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1).replace(/([A-Z])/g, ' $1'),
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`
    }))
  }
  
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
      <div className="space-y-1">
        {getLegendItems().map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Data generation helpers

function createStationLayer(stations: any[]) {
  const { ScatterplotLayer } = require('@deck.gl/layers')
  
  return new ScatterplotLayer({
    id: 'ground-stations',
    data: stations,
    getPosition: d => d.coordinates,
    getFillColor: d => d.operator === 'SES' ? [34, 197, 94, 255] : [255, 100, 100, 255],
    getRadius: 5000,
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    pickable: true
  })
}

function generateShippingRoutes() {
  return [
    {
      name: 'Trans-Atlantic',
      path: [[-74, 40], [-50, 43], [-30, 48], [-10, 50], [4, 51]],
      vesselsPerDay: 150,
      monthlyRevenue: 25000000
    },
    {
      name: 'Asia-Europe',
      path: [[121, 31], [104, 1], [80, 6], [43, 12], [32, 30], [14, 35], [4, 51]],
      vesselsPerDay: 200,
      monthlyRevenue: 45000000
    },
    {
      name: 'Trans-Pacific',
      path: [[121, 31], [140, 35], [180, 25], [-140, 25], [-122, 37]],
      vesselsPerDay: 120,
      monthlyRevenue: 30000000
    }
  ]
}

function generateOpportunityPoints(stations: any[], vessels: any[]) {
  const opportunities = []
  
  // Generate opportunities based on vessel density and coverage gaps
  for (let lat = -60; lat <= 60; lat += 10) {
    for (let lng = -180; lng <= 180; lng += 15) {
      const nearbyVessels = vessels.filter(v => {
        const [vLng, vLat] = v.position
        return Math.abs(vLng - lng) < 10 && Math.abs(vLat - lat) < 10
      })
      
      const nearbyStations = stations.filter(s => {
        const [sLng, sLat] = s.coordinates
        const dist = Math.sqrt(Math.pow(sLng - lng, 2) + Math.pow(sLat - lat, 2))
        return dist < 15
      })
      
      if (nearbyVessels.length > 5 && nearbyStations.length < 2) {
        opportunities.push({
          position: [lng, lat],
          score: Math.min(1, nearbyVessels.length / 20),
          type: 'maritime',
          opportunityScore: Math.min(1, nearbyVessels.length / 20)
        })
      }
    }
  }
  
  return opportunities
}

function generateSatelliteData() {
  return [
    { name: 'SES-17', altitude: 35786, position: [-61.5, 0], type: 'GEO' },
    { name: 'O3b mPOWER', altitude: 8000, position: [0, 0], type: 'MEO' },
    { name: 'SES-15', altitude: 35786, position: [-129, 0], type: 'GEO' }
  ]
}

export default OperationalIntelligence