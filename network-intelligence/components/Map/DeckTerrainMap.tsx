'use client'

import React, { useState, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { TerrainLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, TextLayer, LineLayer } from '@deck.gl/layers'
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions'

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

const INITIAL_VIEW_STATE = {
  latitude: 38.8,
  longitude: -77.2,
  zoom: 7,
  pitch: 45,
  bearing: 0,
  maxPitch: 85,
  minZoom: 5,
  maxZoom: 15
}

interface DeckTerrainMapProps {
  showTerrain?: boolean
  showCoverage?: boolean
  showLabels?: boolean
  selectedStation?: string | null
  onStationClick?: (station: any) => void
}

export const DeckTerrainMap: React.FC<DeckTerrainMapProps> = ({
  showTerrain = true,
  showCoverage = true,
  showLabels = true,
  selectedStation = null,
  onStationClick
}) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [hoveredStation, setHoveredStation] = useState<string | null>(null)

  const layers = useMemo(() => {
    const allLayers = []

    // 3D Terrain layer (if enabled)
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
          ambient: 0.45,              // Increased from 0.35 for better ambient lighting
          diffuse: 0.6,               // Keep diffuse the same
          shininess: 1,                // Reduced from 4 to minimize shine
          specularColor: [50, 50, 50]  // Much darker than [255, 255, 255] to reduce reflections
        },
        
        // Elevation scale (exaggerate at low zoom for visibility)
        elevationScale: viewState.zoom < 8 ? 3 : 1.5,
        
        // Performance optimization
        meshMaxError: 10,
        refinementStrategy: 'best-available'
      }))
    }

    // Station coverage areas
    if (showCoverage) {
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
        radiusMinPixels: 40,
        radiusMaxPixels: 150,
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 4,
        
        // Enable terrain draping
        extensions: showTerrain ? [new TerrainExtension()] : [],
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
        return isSelected ? 3000 : isHovered ? 2000 : 1500
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
      radiusMinPixels: 8,
      radiusMaxPixels: 16,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
      
      // Enable terrain draping
      extensions: showTerrain ? [new TerrainExtension()] : [],
      
      // Interaction
      pickable: true,
      onHover: ({ object, picked }) => {
        setHoveredStation(picked ? object?.id : null)
      },
      onClick: ({ object }) => {
        if (onStationClick) onStationClick(object)
      },
      
      updateTriggers: {
        getRadius: [selectedStation, hoveredStation]
      }
    }))

    // Station labels
    if (showLabels) {
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
        billboard: showTerrain,
        sizeScale: 1,
        sizeUnits: 'pixels',
        
        // Enable terrain draping
        extensions: showTerrain ? [new TerrainExtension()] : [],
        
        // Offset to avoid overlap with point
        getPixelOffset: [0, -20],
        
        updateTriggers: {
          getSize: [selectedStation, hoveredStation]
        }
      }))
    }

    // Connection lines between stations (optional visualization)
    if (selectedStation) {
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

    return allLayers
  }, [showTerrain, showCoverage, showLabels, selectedStation, hoveredStation, viewState.zoom, onStationClick])

  return (
    <DeckGL
      views={new MapView({ repeat: true })}
      viewState={viewState}
      onViewStateChange={({ viewState }) => setViewState(viewState as any)}
      controller={true}
      layers={layers}
      parameters={{
        clearColor: [0.07, 0.14, 0.19, 1], // Dark blue background
        depthTest: true,
        cull: true
      }}
      getTooltip={({ object }) => {
        if (!object) return null
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
  )
}