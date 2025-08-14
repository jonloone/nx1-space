'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView, _GlobeView as GlobeView, LinearInterpolator } from '@deck.gl/core'
import { TerrainLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, TextLayer, LineLayer, ArcLayer, SolidPolygonLayer } from '@deck.gl/layers'
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions'
import { createMaritimeHotspotLayers } from '../layers/MaritimeHotspotLayer'
import { sampleMaritimeData, generateAdditionalMaritimeData } from '../../data/sampleMaritimeData'

// Ground station data
const GROUND_STATIONS = [
  { 
    id: 'manassas-va', 
    name: 'Manassas, VA', 
    position: [-77.4753, 38.7509], 
    coverageRadiusKm: 2000, 
    utilization: 75,
    bandwidth: '40 Gbps',
    satellites: 18
  },
  { 
    id: 'clarksburg-md', 
    name: 'Clarksburg, MD', 
    position: [-77.2814, 39.2388], 
    coverageRadiusKm: 1800, 
    utilization: 45,
    bandwidth: '20 Gbps',
    satellites: 12
  },
  { 
    id: 'woodbine-md', 
    name: 'Woodbine, MD', 
    position: [-77.0647, 39.3376], 
    coverageRadiusKm: 1600, 
    utilization: 82,
    bandwidth: '60 Gbps',
    satellites: 24
  },
  {
    id: 'ashburn-va',
    name: 'Ashburn, VA',
    position: [-77.4875, 39.0437],
    coverageRadiusKm: 2200,
    utilization: 88,
    bandwidth: '100 Gbps',
    satellites: 32
  },
  {
    id: 'baltimore-md',
    name: 'Baltimore, MD',
    position: [-76.6122, 39.2904],
    coverageRadiusKm: 1900,
    utilization: 72,
    bandwidth: '45 Gbps',
    satellites: 20
  }
]

// Sample satellite data for globe view
const SATELLITES = [
  { id: 'sat-1', name: 'SES-17', position: [-77, 0, 35786000], type: 'GEO' },
  { id: 'sat-2', name: 'SES-14', position: [-45, 0, 35786000], type: 'GEO' },
  { id: 'sat-3', name: 'O3b mPOWER-1', position: [-60, 15, 8062000], type: 'MEO' },
  { id: 'sat-4', name: 'O3b mPOWER-2', position: [-30, -10, 8062000], type: 'MEO' },
  { id: 'sat-5', name: 'O3b mPOWER-3', position: [0, 20, 8062000], type: 'MEO' },
]

const INITIAL_VIEW_STATE = {
  latitude: 38.8,
  longitude: -77.2,
  zoom: 7,
  pitch: 45,
  bearing: 0,
  maxPitch: 85,
  minZoom: 1,
  maxZoom: 15
}

interface HybridGlobeMapProps {
  activeTab?: 'operations' | 'optimizer' | 'opportunities'
  showTerrain?: boolean
  showCoverage?: boolean
  showLabels?: boolean
  showSatellites?: boolean
  showMaritimeHotspots?: boolean
  selectedStation?: string | null
  onStationClick?: (station: any) => void
}

export const HybridGlobeMap: React.FC<HybridGlobeMapProps> = ({
  activeTab = 'operations',
  showTerrain = true,
  showCoverage = true,
  showLabels = true,
  showSatellites = true,
  showMaritimeHotspots = false,
  selectedStation = null,
  onStationClick
}) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredStation, setHoveredStation] = useState<string | null>(null)
  const [hoveredHotspot, setHoveredHotspot] = useState<any>(null)
  const [isGlobeView, setIsGlobeView] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const previousZoomRef = useRef(viewState.zoom)

  // Generate maritime data with additional points for more realistic clustering
  const maritimeData = useMemo(() => {
    if (!showMaritimeHotspots) return []
    return generateAdditionalMaritimeData(sampleMaritimeData)
  }, [showMaritimeHotspots])

  // Automatically switch between globe and map based on zoom and tab
  useEffect(() => {
    // Force globe view for optimizer tab (satellites)
    if (activeTab === 'optimizer') {
      if (!isGlobeView) {
        setIsTransitioning(true)
        setIsGlobeView(true)
        setViewState(prev => ({
          ...prev,
          zoom: 2,
          pitch: 0,
          transitionDuration: 1500,
          transitionInterpolator: new LinearInterpolator(['longitude', 'latitude', 'zoom', 'pitch'])
        }))
        setTimeout(() => setIsTransitioning(false), 1500)
      }
    } else {
      // Auto-switch based on zoom level for other tabs
      const shouldBeGlobe = viewState.zoom < 5.5
      const wasGlobe = previousZoomRef.current < 5.5
      
      // Only transition if crossing the threshold
      if (shouldBeGlobe !== wasGlobe) {
        setIsTransitioning(true)
        setIsGlobeView(shouldBeGlobe)
        
        // Smooth transition when switching views
        if (shouldBeGlobe) {
          // Transitioning to globe view
          setViewState(prev => ({
            ...prev,
            pitch: 0,
            transitionDuration: 800,
            transitionInterpolator: new LinearInterpolator(['pitch'])
          }))
        } else {
          // Transitioning to map view
          setViewState(prev => ({
            ...prev,
            pitch: 45,
            transitionDuration: 800,
            transitionInterpolator: new LinearInterpolator(['pitch'])
          }))
        }
        
        setTimeout(() => setIsTransitioning(false), 800)
      }
      
      previousZoomRef.current = viewState.zoom
    }
  }, [viewState.zoom, activeTab, isGlobeView])

  // Create appropriate view based on mode
  const view = useMemo(() => {
    if (isGlobeView) {
      return new GlobeView({
        id: 'globe-view',
        controller: true
      })
    } else {
      return new MapView({
        id: 'map-view',
        repeat: true,
        controller: true
      })
    }
  }, [isGlobeView])

  const layers = useMemo(() => {
    const allLayers = []

    // For globe view, add a simple earth representation
    if (isGlobeView) {
      // Earth sphere (simple solid color for now)
      allLayers.push(new SolidPolygonLayer({
        id: 'earth-sphere',
        data: [{
          polygon: [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90]
          ]
        }],
        getPolygon: d => d.polygon,
        getFillColor: [30, 50, 70],
        opacity: 1
      }))

      // Satellites (only in globe view)
      if (showSatellites && (activeTab === 'optimizer' || viewState.zoom < 4)) {
        // Satellite orbital arcs
        const satelliteArcs = SATELLITES.map(sat => ({
          source: sat.position.slice(0, 2),
          target: GROUND_STATIONS[0].position,
          satellite: sat
        }))

        allLayers.push(new ArcLayer({
          id: 'satellite-links',
          data: satelliteArcs,
          getSourcePosition: d => d.source,
          getTargetPosition: d => d.target,
          getSourceColor: d => d.satellite.type === 'GEO' ? [0, 255, 100] : [0, 150, 255],
          getTargetColor: [255, 255, 255],
          getWidth: 2,
          getHeight: 0.3,
          opacity: 0.6
        }))

        // Satellite points
        allLayers.push(new ScatterplotLayer({
          id: 'satellites',
          data: SATELLITES,
          getPosition: d => d.position.slice(0, 2),
          getRadius: 50000,
          getFillColor: d => d.type === 'GEO' ? [0, 255, 100] : [0, 150, 255],
          radiusMinPixels: 6,
          radiusMaxPixels: 12
        }))

        // Satellite labels
        if (showLabels && viewState.zoom > 2) {
          allLayers.push(new TextLayer({
            id: 'satellite-labels',
            data: SATELLITES,
            getPosition: d => d.position.slice(0, 2),
            getText: d => d.name,
            getSize: 12,
            getColor: [255, 255, 255],
            getBackgroundColor: [0, 0, 0, 200],
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            background: true,
            backgroundPadding: [4, 2],
            getPixelOffset: [0, -15]
          }))
        }
      }
    } else {
      // Map view with terrain (zoom >= 5.5)
      if (showTerrain) {
        allLayers.push(new TerrainLayer({
          id: 'terrain-layer',
          minZoom: 0,
          maxZoom: 15,
          
          // FREE terrain elevation tiles from AWS Terrarium format
          elevationData: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
          elevationDecoder: {
            rScaler: 256,
            gScaler: 1,
            bScaler: 1 / 256,
            offset: -32768
          },
          
          // FREE satellite imagery from ESRI
          texture: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          
          // Terrain appearance - reduced specularity for more realistic look
          wireframe: false,
          material: {
            ambient: 0.45,              // Increased for better ambient lighting
            diffuse: 0.6,               
            shininess: 1,                // Reduced to minimize shine
            specularColor: [50, 50, 50]  // Much darker to reduce reflections
          },
          
          // Elevation scale (exaggerate at low zoom for visibility)
          elevationScale: viewState.zoom < 8 ? 3 : 1.5,
          
          // Performance optimization
          meshMaxError: 10,
          refinementStrategy: 'best-available'
        }))
      }
    }

    // Ground stations (visible in both views)
    // Station coverage areas
    if (showCoverage && viewState.zoom > 4) {
      allLayers.push(new ScatterplotLayer({
        id: 'coverage-areas',
        data: GROUND_STATIONS,
        
        getPosition: d => d.position,
        getRadius: d => d.coverageRadiusKm * 1000,
        
        // Color based on utilization
        getFillColor: d => {
          const isSelected = d.id === selectedStation
          const isHovered = d.id === hoveredStation
          const alpha = isSelected ? 80 : isHovered ? 50 : 30
          
          if (d.utilization > 80) return [34, 197, 94, alpha] // Green
          if (d.utilization > 60) return [59, 130, 246, alpha] // Blue
          if (d.utilization > 40) return [245, 158, 11, alpha] // Yellow
          return [239, 68, 68, alpha] // Red
        },
        
        getLineColor: d => {
          const isSelected = d.id === selectedStation
          const isHovered = d.id === hoveredStation
          const alpha = isSelected ? 255 : isHovered ? 200 : 150
          
          if (d.utilization > 80) return [34, 197, 94, alpha]
          if (d.utilization > 60) return [59, 130, 246, alpha]
          if (d.utilization > 40) return [245, 158, 11, alpha]
          return [239, 68, 68, alpha]
        },
        
        stroked: true,
        filled: true,
        radiusMinPixels: isGlobeView ? 20 : 40,
        radiusMaxPixels: isGlobeView ? 80 : 150,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 4,
        
        // Enable terrain draping in map view
        extensions: showTerrain && !isGlobeView ? [new TerrainExtension()] : [],
        terrainDrawMode: 'drape',
        
        // Interaction
        pickable: true,
        onHover: ({ object, picked }) => {
          setHoveredStation(picked ? object?.id : null)
        },
        onClick: ({ object }) => {
          if (onStationClick) onStationClick(object)
        },
        
        updateTriggers: {
          getFillColor: [selectedStation, hoveredStation],
          getLineColor: [selectedStation, hoveredStation]
        }
      }))
    }

    // Station center points
    allLayers.push(new ScatterplotLayer({
      id: 'station-points',
      data: GROUND_STATIONS,
      
      getPosition: d => d.position,
      getRadius: d => {
        const isSelected = d.id === selectedStation
        const isHovered = d.id === hoveredStation
        return isGlobeView 
          ? (isSelected ? 50000 : isHovered ? 40000 : 30000)
          : (isSelected ? 3000 : isHovered ? 2000 : 1500)
      },
      
      getFillColor: [255, 255, 255, 255],
      getLineColor: d => {
        if (d.utilization > 80) return [34, 197, 94, 255]
        if (d.utilization > 60) return [59, 130, 246, 255]
        if (d.utilization > 40) return [245, 158, 11, 255]
        return [239, 68, 68, 255]
      },
      
      stroked: true,
      filled: true,
      radiusMinPixels: isGlobeView ? 4 : 8,
      radiusMaxPixels: isGlobeView ? 12 : 16,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
      
      // Enable terrain draping in map view
      extensions: showTerrain && !isGlobeView ? [new TerrainExtension()] : [],
      
      // Interaction
      pickable: true,
      onHover: ({ object, picked }) => {
        setHoveredStation(picked ? object?.id : null)
      },
      onClick: ({ object }) => {
        if (onStationClick) onStationClick(object)
      },
      
      updateTriggers: {
        getRadius: [selectedStation, hoveredStation, isGlobeView]
      }
    }))

    // Station labels
    if (showLabels && (isGlobeView ? viewState.zoom > 3 : viewState.zoom > 5)) {
      allLayers.push(new TextLayer({
        id: 'station-labels',
        data: GROUND_STATIONS,
        
        getPosition: d => d.position,
        getText: d => d.name,
        getSize: d => {
          const isSelected = d.id === selectedStation
          const isHovered = d.id === hoveredStation
          return isSelected ? 16 : isHovered ? 15 : 14
        },
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 200],
        
        // Text styling
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        characterSet: 'auto',
        background: true,
        backgroundPadding: [6, 4],
        
        // Billboard for 3D mode
        billboard: !isGlobeView && showTerrain,
        sizeScale: 1,
        sizeUnits: 'pixels',
        
        // Enable terrain draping in map view
        extensions: showTerrain && !isGlobeView ? [new TerrainExtension()] : [],
        
        // Offset to avoid overlap with point
        getPixelOffset: [0, -20],
        
        updateTriggers: {
          getSize: [selectedStation, hoveredStation]
        }
      }))
    }

    // Connection lines between stations (in map view when station selected)
    if (selectedStation && !isGlobeView) {
      const selectedStationData = GROUND_STATIONS.find(s => s.id === selectedStation)
      if (selectedStationData) {
        const connections = GROUND_STATIONS
          .filter(s => s.id !== selectedStation)
          .map(station => ({
            source: selectedStationData.position,
            target: station.position,
            strength: Math.min(1, (selectedStationData.utilization + station.utilization) / 200)
          }))

        allLayers.push(new LineLayer({
          id: 'station-connections',
          data: connections,
          
          getSourcePosition: d => d.source,
          getTargetPosition: d => d.target,
          getColor: d => [0, 212, 255, Math.floor(d.strength * 100)],
          getWidth: d => d.strength * 3,
          
          widthMinPixels: 1,
          widthMaxPixels: 5,
          
          // Enable terrain draping
          extensions: showTerrain ? [new TerrainExtension()] : []
        }))
      }
    }

    // Maritime hotspot layers (visible in both globe and map views)
    if (showMaritimeHotspots && maritimeData.length > 0) {
      const maritimeHotspotLayers = createMaritimeHotspotLayers({
        maritimeData,
        visible: true,
        onHover: (hotspot) => setHoveredHotspot(hotspot),
        onClick: (hotspot) => {
          console.log('Maritime hotspot clicked:', hotspot)
        },
        showLabels: showLabels && viewState.zoom > (isGlobeView ? 3 : 5),
        showHeatmap: true,
        showHotspots: true,
        isGlobeView
      })
      allLayers.push(...maritimeHotspotLayers)
    }

    return allLayers
  }, [
    showTerrain, 
    showCoverage, 
    showLabels, 
    showSatellites, 
    showMaritimeHotspots,
    maritimeData,
    selectedStation, 
    hoveredStation, 
    hoveredHotspot,
    viewState.zoom, 
    isGlobeView, 
    activeTab, 
    onStationClick
  ])

  return (
    <>
      <DeckGL
        views={view}
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as any)}
        controller={true}
        layers={layers}
        parameters={{
          clearColor: isGlobeView ? [0.02, 0.02, 0.05, 1] : [0.07, 0.14, 0.19, 1], // Darker for globe
          depthTest: true,
          cull: true
        }}
        getTooltip={({ object }) => {
          if (!object) return null
          
          // Check if it's a satellite
          if (object.type === 'GEO' || object.type === 'MEO') {
            return {
              html: `
                <div style="
                  background: rgba(0, 0, 0, 0.9);
                  color: white;
                  padding: 12px;
                  border-radius: 8px;
                  font-size: 14px;
                  min-width: 150px;
                ">
                  <div style="font-weight: bold; margin-bottom: 8px;">${object.name}</div>
                  <div>Type: ${object.type}</div>
                  <div>Altitude: ${object.type === 'GEO' ? '35,786 km' : '8,062 km'}</div>
                </div>
              `,
              style: {
                backgroundColor: 'transparent',
                border: 'none'
              }
            }
          }
          
          // Check if it's a maritime hotspot
          if (object.center && object.zScore && object.type) {
            const significance = Math.abs(object.zScore) > 3 ? 'Very High' : 
                                Math.abs(object.zScore) > 2.5 ? 'High' : 'Moderate'
            const trendIcon = object.temporalTrend === 'growing' ? '📈' : 
                             object.temporalTrend === 'declining' ? '📉' : '➡️'
            
            return {
              html: `
                <div style="
                  background: rgba(0, 0, 0, 0.9);
                  color: white;
                  padding: 12px;
                  border-radius: 8px;
                  font-size: 14px;
                  min-width: 200px;
                ">
                  <div style="font-weight: bold; margin-bottom: 8px; color: ${object.type === 'hot' ? '#f87171' : '#60a5fa'};">
                    ${object.type.toUpperCase()} SPOT ${trendIcon}
                  </div>
                  <div>Z-Score: ${object.zScore.toFixed(2)}</div>
                  <div>Significance: ${significance}</div>
                  <div>Confidence: ${(object.confidence * 100).toFixed(1)}%</div>
                  <div>Vessel Density: ${object.vesselDensity.toFixed(1)} ships/km²</div>
                  <div>Radius: ${object.radius.toFixed(1)} km</div>
                  <div>Trend: ${object.temporalTrend}</div>
                </div>
              `,
              style: {
                backgroundColor: 'transparent',
                border: 'none'
              }
            }
          }
          
          // Ground station tooltip
          return {
            html: `
              <div style="
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                min-width: 200px;
              ">
                <div style="font-weight: bold; margin-bottom: 8px;">${object.name}</div>
                <div>Utilization: ${object.utilization}%</div>
                <div>Bandwidth: ${object.bandwidth}</div>
                <div>Active Satellites: ${object.satellites}</div>
                <div>Coverage: ${object.coverageRadiusKm} km</div>
              </div>
            `,
            style: {
              backgroundColor: 'transparent',
              border: 'none'
            }
          }
        }}
      />
      
      {/* View indicator with transition state */}
      <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <div className="text-sm font-medium flex items-center gap-2">
          {isGlobeView ? '🌍 Globe View' : '🗺️ Map View'}
          {isTransitioning && (
            <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded animate-pulse">
              Transitioning...
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {isGlobeView 
            ? 'Zoom in to switch to terrain map' 
            : 'Zoom out to see global view'}
        </div>
      </div>
      
      {/* Zoom controls hint */}
      <div className="absolute bottom-20 right-4 bg-black/60 text-white px-3 py-2 rounded-lg text-xs">
        <div>Scroll: Zoom</div>
        <div>Drag: Rotate</div>
        {!isGlobeView && <div>Right-drag: Tilt</div>}
        <div className="mt-1 pt-1 border-t border-white/20">
          Zoom {isGlobeView ? 'in' : 'out'} to switch views
        </div>
      </div>
    </>
  )
}