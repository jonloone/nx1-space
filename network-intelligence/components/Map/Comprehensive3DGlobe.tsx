'use client'

import React, { useState, useMemo, useCallback } from 'react'
import DeckGL from '@deck.gl/react'
import { _GlobeView as GlobeView, FlyToInterpolator } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, IconLayer, LineLayer, PathLayer } from '@deck.gl/layers'
import { type GroundStation } from '../layers/GroundStationLayer'

// SVG satellite dish icon as data URI
const SATELLITE_DISH_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white">
    <path d="M192 32c0-17.7 14.3-32 32-32C383.1 0 512 128.9 512 288c0 17.7-14.3 32-32 32s-32-14.3-32-32C448 164.3 347.7 64 224 64c-17.7 0-32-14.3-32-32zM60.6 220.6L164.7 324.7l28.4-28.4c-.7-2.6-1.1-5.4-1.1-8.3c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32c-2.9 0-5.6-.4-8.3-1.1l-28.4 28.4L291.4 451.4c14.5 14.5 11.8 38.8-7.3 46.3C260.5 506.9 234.9 512 208 512C93.1 512 0 418.9 0 304c0-26.9 5.1-52.5 14.4-76.1c7.5-19 31.8-21.8 46.3-7.3zM224 96c106 0 192 86 192 192c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-70.7-57.3-128-128-128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
  </svg>
`)

interface Satellite {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number
  constellation: 'LEO' | 'MEO' | 'GEO'
  operator: string
}

interface OrbitPath {
  id: string
  satelliteId: string
  path: [number, number, number][]
  constellation: 'LEO' | 'MEO' | 'GEO'
}

interface LayerVisibility {
  groundStations: boolean
  satellites: boolean
  orbits: boolean
  coverage: boolean
  labels: boolean
}

interface Comprehensive3DGlobeProps {
  groundStations: GroundStation[]
  onStationClick?: (station: GroundStation) => void
  onStationHover?: (station: GroundStation | null) => void
}

const INITIAL_GLOBE_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0,
  pitch: 0,
  bearing: 0
}

// Earth imagery sources
const EARTH_IMAGERY_SOURCES = {
  natural: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  bluemarble: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BlueMarble_ShadedRelief_Bathymetry&STYLE=default&FORMAT=image%2Fjpeg&TileMatrixSet=EPSG4326_250m&TileMatrix={z}&TileRow={y}&TileCol={x}'
}

const Comprehensive3DGlobe: React.FC<Comprehensive3DGlobeProps> = ({
  groundStations,
  onStationClick,
  onStationHover
}) => {
  const [viewState, setViewState] = useState(INITIAL_GLOBE_VIEW_STATE)
  const [earthTexture, setEarthTexture] = useState<'natural' | 'dark' | 'bluemarble'>('natural')
  const [globeResolution, setGlobeResolution] = useState(2)
  
  // Layer visibility controls
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    groundStations: true,
    satellites: false, // Initially off as requested
    orbits: false,     // Initially off as requested
    coverage: true,
    labels: true
  })
  
  // Get color based on profitability
  const getProfitabilityColor = (margin: number): [number, number, number] => {
    if (margin > 0.30) return [34, 197, 94]      // Bright green
    if (margin > 0.20) return [74, 222, 128]     // Green
    if (margin > 0.10) return [254, 240, 138]    // Yellow
    if (margin > 0) return [251, 191, 36]        // Orange
    return [239, 68, 68]                         // Red
  }
  
  // Create test data if no ground stations provided
  const stationsToRender = useMemo(() => {
    if (groundStations.length === 0) {
      return [
        {
          id: 'test-1',
          name: 'SES Virginia',
          operator: 'SES',
          latitude: 38.9,
          longitude: -77.5,
          utilization: 75,
          revenue: 15,
          profit: 5,
          margin: 0.25,
          confidence: 0.9,
          isActive: true
        },
        {
          id: 'test-2', 
          name: 'SES Luxembourg',
          operator: 'SES',
          latitude: 49.6,
          longitude: 6.1,
          utilization: 85,
          revenue: 20,
          profit: 8,
          margin: 0.35,
          confidence: 0.95,
          isActive: true
        },
        {
          id: 'test-3',
          name: 'SES Singapore',
          operator: 'SES',
          latitude: 1.35,
          longitude: 103.8,
          utilization: 60,
          revenue: 12,
          profit: 3,
          margin: 0.15,
          confidence: 0.8,
          isActive: true
        },
        {
          id: 'test-4',
          name: 'SES Brazil',
          operator: 'SES',
          latitude: -15.8,
          longitude: -47.9,
          utilization: 90,
          revenue: 18,
          profit: 7,
          margin: 0.30,
          confidence: 0.9,
          isActive: true
        },
        {
          id: 'test-5',
          name: 'SES Australia',
          operator: 'SES',
          latitude: -33.9,
          longitude: 151.2,
          utilization: 70,
          revenue: 14,
          profit: 4,
          margin: 0.20,
          confidence: 0.85,
          isActive: true
        }
      ] as GroundStation[]
    }
    return groundStations
  }, [groundStations])
  
  // Generate test satellites
  const testSatellites = useMemo((): Satellite[] => [
    // GEO satellites
    { id: 'geo-1', name: 'SES-1', latitude: 0, longitude: -101, altitude: 35786000, constellation: 'GEO', operator: 'SES' },
    { id: 'geo-2', name: 'SES-2', latitude: 0, longitude: -87, altitude: 35786000, constellation: 'GEO', operator: 'SES' },
    { id: 'geo-3', name: 'SES-3', latitude: 0, longitude: 103, altitude: 35786000, constellation: 'GEO', operator: 'SES' },
    
    // MEO satellites
    { id: 'meo-1', name: 'O3b-1', latitude: 30, longitude: 45, altitude: 8063000, constellation: 'MEO', operator: 'SES' },
    { id: 'meo-2', name: 'O3b-2', latitude: -30, longitude: 135, altitude: 8063000, constellation: 'MEO', operator: 'SES' },
    
    // LEO satellites  
    { id: 'leo-1', name: 'Starlink-1', latitude: 53, longitude: -120, altitude: 550000, constellation: 'LEO', operator: 'SpaceX' },
    { id: 'leo-2', name: 'Starlink-2', latitude: -53, longitude: 60, altitude: 550000, constellation: 'LEO', operator: 'SpaceX' }
  ], [])
  
  // Generate test orbit paths
  const testOrbitPaths = useMemo((): OrbitPath[] => [
    // GEO orbit (stationary)
    {
      id: 'geo-orbit-1',
      satelliteId: 'geo-1',
      constellation: 'GEO',
      path: Array.from({ length: 360 }, (_, i) => [
        -101 + (i * 0.1), // Small movement for visibility
        0,
        35786000
      ])
    },
    // MEO orbit
    {
      id: 'meo-orbit-1', 
      satelliteId: 'meo-1',
      constellation: 'MEO',
      path: Array.from({ length: 100 }, (_, i) => [
        (i * 3.6) - 180, // Complete orbit
        30 * Math.sin(i * 0.1),
        8063000
      ])
    },
    // LEO orbit
    {
      id: 'leo-orbit-1',
      satelliteId: 'leo-1', 
      constellation: 'LEO',
      path: Array.from({ length: 90 }, (_, i) => [
        (i * 4) - 180, // Fast orbit
        53 * Math.cos(i * 0.15),
        550000
      ])
    }
  ], [])
  
  // Create deck.gl layers
  const layers = useMemo(() => {
    console.log('Creating comprehensive globe layers')
    const allLayers = []
    
    // Earth surface imagery
    allLayers.push(
      new TileLayer({
        id: 'earth-surface',
        data: EARTH_IMAGERY_SOURCES[earthTexture],
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        pickable: false
      })
    )
    
    // Ground station coverage areas (if enabled)
    if (layerVisibility.coverage && layerVisibility.groundStations) {
      stationsToRender.forEach((station) => {
        const baseColor = getProfitabilityColor(station.margin)
        const utilizationFraction = station.utilization / 100
        
        // FIXED gradient rings (opaque edge, transparent center)
        const gradientRings = [
          { fraction: 1.0, strokeOpacity: 200, fillOpacity: 0 },
          { fraction: 0.85, strokeOpacity: 120, fillOpacity: 40 },
          { fraction: 0.7, strokeOpacity: 60, fillOpacity: 30 },
          { fraction: 0.55, strokeOpacity: 30, fillOpacity: 20 },
          { fraction: 0.4, strokeOpacity: 10, fillOpacity: 10 },
          { fraction: 0.25, strokeOpacity: 0, fillOpacity: 5 },
          { fraction: 0.1, strokeOpacity: 0, fillOpacity: 0 }
        ]
        
        gradientRings.forEach((ring, ringIndex) => {
          allLayers.push(
            new ScatterplotLayer({
              id: `station-coverage-${station.id}-ring-${ringIndex}`,
              data: [station],
              
              getPosition: d => [d.longitude, d.latitude, 1000],
              getRadius: 300000 * utilizationFraction * ring.fraction,
              
              getFillColor: [...baseColor, ring.fillOpacity],
              getLineColor: [...baseColor, ring.strokeOpacity],
              
              stroked: ring.strokeOpacity > 0,
              filled: ring.fillOpacity > 0,
              lineWidthMinPixels: ringIndex === 0 ? 3 : 1,
              lineWidthMaxPixels: ringIndex === 0 ? 5 : 2,
              
              radiusMinPixels: 15 * ring.fraction,
              radiusMaxPixels: 50 * ring.fraction,
              
              pickable: ringIndex === 0,
              autoHighlight: true,
              onHover: ringIndex === 0 ? (info) => onStationHover?.(info.object || null) : undefined,
              onClick: ringIndex === 0 ? (info) => onStationClick?.(info.object) : undefined
            })
          )
        })
      })
    }
    
    // Ground station icons (if enabled)
    if (layerVisibility.groundStations) {
      allLayers.push(
        new IconLayer({
          id: 'station-icons',
          data: stationsToRender,
          
          getPosition: d => [d.longitude, d.latitude, 2000],
          getIcon: () => ({
            url: SATELLITE_DISH_ICON,
            width: 128,
            height: 128,
            anchorY: 64
          }),
          
          getSize: 25,
          sizeMinPixels: 18,
          sizeMaxPixels: 35,
          
          getColor: [255, 255, 255, 255],
          
          pickable: true,
          onHover: (info) => onStationHover?.(info.object || null),
          onClick: (info) => onStationClick?.(info.object),
          
          billboard: false
        })
      )
    }
    
    // Satellite orbits (if enabled)
    if (layerVisibility.orbits) {
      testOrbitPaths.forEach(orbit => {
        const orbitColor = orbit.constellation === 'GEO' ? [255, 215, 0] : 
                          orbit.constellation === 'MEO' ? [0, 255, 255] : [255, 105, 180]
        
        allLayers.push(
          new PathLayer({
            id: `orbit-${orbit.id}`,
            data: [orbit],
            
            getPath: d => d.path,
            getColor: [...orbitColor, 120],
            getWidth: orbit.constellation === 'GEO' ? 5 : 3,
            
            widthMinPixels: 2,
            widthMaxPixels: 8,
            
            pickable: false,
            billboard: false
          })
        )
      })
    }
    
    // Satellites (if enabled)
    if (layerVisibility.satellites) {
      allLayers.push(
        new ScatterplotLayer({
          id: 'satellites',
          data: testSatellites,
          
          getPosition: d => [d.longitude, d.latitude, d.altitude],
          getRadius: d => d.constellation === 'GEO' ? 150000 : 
                          d.constellation === 'MEO' ? 100000 : 50000,
          
          getFillColor: d => {
            const colors = {
              'GEO': [255, 215, 0, 200],    // Gold
              'MEO': [0, 255, 255, 200],    // Cyan  
              'LEO': [255, 105, 180, 200]   // Hot pink
            }
            return colors[d.constellation]
          },
          
          getLineColor: [255, 255, 255, 255],
          
          stroked: true,
          filled: true,
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 2,
          
          radiusMinPixels: 4,
          radiusMaxPixels: 12,
          
          pickable: true,
          autoHighlight: true
        })
      )
    }
    
    return allLayers
  }, [stationsToRender, earthTexture, layerVisibility, onStationClick, onStationHover, testSatellites, testOrbitPaths])
  
  // Handle view state changes
  const onViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState)
  }, [])
  
  // Fly to different regions
  const flyToRegion = (longitude: number, latitude: number, zoom: number = 2) => {
    setViewState({
      ...viewState,
      longitude,
      latitude,
      zoom,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator()
    })
  }
  
  // Toggle layer visibility
  const toggleLayer = (layerName: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }))
  }
  
  return (
    <div className="relative w-full h-full bg-black">
      <DeckGL
        views={new GlobeView({ id: 'globe', controller: true, resolution: globeResolution })}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layers}
        parameters={{
          clearColor: [0, 0, 0, 1]
        }}
      />
      
      {/* Comprehensive 3D Globe Controls */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-4 text-gray-100 border border-gray-700 max-w-sm">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">
          3D Globe Controls
        </h3>
        
        {/* Earth Texture */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Earth Texture</label>
          <select
            value={earthTexture}
            onChange={(e) => setEarthTexture(e.target.value as any)}
            className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="natural">Natural Earth</option>
            <option value="dark">Dark Theme</option>
            <option value="bluemarble">Blue Marble</option>
          </select>
        </div>
        
        {/* Globe Resolution */}
        <div className="mb-3">
          <label className="text-xs text-gray-400">Resolution: {globeResolution}</label>
          <input
            type="range"
            min="1"
            max="4"
            value={globeResolution}
            onChange={(e) => setGlobeResolution(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
        
        {/* Layer Toggles */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-2">Layers</label>
          <div className="space-y-2">
            {Object.entries(layerVisibility).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => toggleLayer(key as keyof LayerVisibility)}
                  className="accent-cyan-500"
                />
                <span className="text-gray-300 capitalize">
                  {key === 'groundStations' ? 'Ground Stations' : key}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Quick Views */}
        <div className="space-y-1">
          <button
            onClick={() => flyToRegion(-77.5, 38.9, 3)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            North America
          </button>
          <button
            onClick={() => flyToRegion(6.1, 49.6, 3)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Europe
          </button>
          <button
            onClick={() => flyToRegion(103.8, 1.35, 3)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Asia Pacific
          </button>
          <button
            onClick={() => flyToRegion(0, 0, 0)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Global View
          </button>
        </div>
      </div>
      
      {/* Layer Status Indicator */}
      <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-3 
                    text-gray-100 border border-gray-700">
        <h4 className="text-xs font-semibold mb-2 text-cyan-400">Active Layers</h4>
        <div className="text-xs space-y-1">
          {Object.entries(layerVisibility).filter(([_, visible]) => visible).map(([key]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span className="text-gray-300 capitalize">
                {key === 'groundStations' ? 'Ground Stations' : key}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Stations: {stationsToRender.length}
          </p>
          <p className="text-xs text-gray-500">
            Satellites: {layerVisibility.satellites ? testSatellites.length : 0}
          </p>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-3 
                    text-gray-100 border border-gray-700">
        <h4 className="text-xs font-semibold mb-2 text-cyan-400">Station Profitability</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
            <span className="text-gray-300">Excellent (&gt;30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-300 shadow-lg shadow-green-300/50"></div>
            <span className="text-gray-300">Good (20-30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"></div>
            <span className="text-gray-300">Average (10-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50"></div>
            <span className="text-gray-300">Marginal (0-10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-400/50"></div>
            <span className="text-gray-300">Loss (&lt;0%)</span>
          </div>
        </div>
        
        {layerVisibility.satellites && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h4 className="text-xs font-semibold mb-2 text-cyan-400">Satellite Constellations</h4>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-300">GEO (35,786 km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-gray-300">MEO (8,063 km)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                <span className="text-gray-300">LEO (550 km)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Comprehensive3DGlobe