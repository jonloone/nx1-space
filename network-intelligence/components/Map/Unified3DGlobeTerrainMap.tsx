'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import DeckGL from '@deck.gl/react'
import { _GlobeView as GlobeView, MapView, FlyToInterpolator } from '@deck.gl/core'
import { TileLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer, IconLayer, PathLayer, BitmapLayer } from '@deck.gl/layers'
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
  terrain: boolean
}

interface Unified3DGlobeTerrainMapProps {
  groundStations: GroundStation[]
  onStationClick?: (station: GroundStation) => void
  onStationHover?: (station: GroundStation | null) => void
}

// Earth imagery sources
const EARTH_IMAGERY_SOURCES = {
  natural: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  bluemarble: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BlueMarble_ShadedRelief_Bathymetry&STYLE=default&FORMAT=image%2Fjpeg&TileMatrixSet=EPSG4326_250m&TileMatrix={z}&TileRow={y}&TileCol={x}'
}

// Terrain sources for close-up views
const TERRAIN_SOURCES = {
  elevation: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  hillshade: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
}

const Unified3DGlobeTerrainMap: React.FC<Unified3DGlobeTerrainMapProps> = ({
  groundStations,
  onStationClick,
  onStationHover
}) => {
  // View state with intelligent zoom-based view switching
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 0.5, // Start in globe view
    pitch: 0,
    bearing: 0
  })
  
  const [earthTexture, setEarthTexture] = useState<'natural' | 'dark' | 'bluemarble'>('natural')
  const [terrainExaggeration, setTerrainExaggeration] = useState(1.5)
  
  // Layer visibility controls
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    groundStations: true,
    satellites: false, // Initially off
    orbits: false,     // Initially off
    coverage: true,
    labels: true,
    terrain: true      // Terrain enabled by default
  })
  
  // Determine view mode based on zoom level
  const viewMode = useMemo(() => {
    if (viewState.zoom < 2) return 'globe'      // Space view - show as globe
    if (viewState.zoom < 6) return 'regional'   // Regional view - hybrid
    return 'terrain'                            // Close view - 3D terrain
  }, [viewState.zoom])
  
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
          id: 'test-1', name: 'SES Virginia', operator: 'SES',
          latitude: 38.9, longitude: -77.5, utilization: 75,
          revenue: 15, profit: 5, margin: 0.25, confidence: 0.9, isActive: true
        },
        {
          id: 'test-2', name: 'SES Luxembourg', operator: 'SES',
          latitude: 49.6, longitude: 6.1, utilization: 85,
          revenue: 20, profit: 8, margin: 0.35, confidence: 0.95, isActive: true
        },
        {
          id: 'test-3', name: 'SES Singapore', operator: 'SES',
          latitude: 1.35, longitude: 103.8, utilization: 60,
          revenue: 12, profit: 3, margin: 0.15, confidence: 0.8, isActive: true
        },
        {
          id: 'test-4', name: 'SES Brazil', operator: 'SES',
          latitude: -15.8, longitude: -47.9, utilization: 90,
          revenue: 18, profit: 7, margin: 0.30, confidence: 0.9, isActive: true
        },
        {
          id: 'test-5', name: 'SES Australia', operator: 'SES',
          latitude: -33.9, longitude: 151.2, utilization: 70,
          revenue: 14, profit: 4, margin: 0.20, confidence: 0.85, isActive: true
        },
        {
          id: 'test-6', name: 'SES Japan', operator: 'SES',
          latitude: 35.7, longitude: 139.7, utilization: 65,
          revenue: 13, profit: 3, margin: 0.18, confidence: 0.82, isActive: true
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
    { id: 'geo-4', name: 'SES-4', latitude: 0, longitude: 22, altitude: 35786000, constellation: 'GEO', operator: 'SES' },
    
    // MEO satellites (O3b constellation)
    { id: 'meo-1', name: 'O3b-1', latitude: 30, longitude: 45, altitude: 8063000, constellation: 'MEO', operator: 'SES' },
    { id: 'meo-2', name: 'O3b-2', latitude: -30, longitude: 135, altitude: 8063000, constellation: 'MEO', operator: 'SES' },
    { id: 'meo-3', name: 'O3b-3', latitude: 15, longitude: -90, altitude: 8063000, constellation: 'MEO', operator: 'SES' },
    
    // LEO satellites  
    { id: 'leo-1', name: 'Starlink-1', latitude: 53, longitude: -120, altitude: 550000, constellation: 'LEO', operator: 'SpaceX' },
    { id: 'leo-2', name: 'Starlink-2', latitude: -53, longitude: 60, altitude: 550000, constellation: 'LEO', operator: 'SpaceX' },
    { id: 'leo-3', name: 'Starlink-3', latitude: 25, longitude: 15, altitude: 550000, constellation: 'LEO', operator: 'SpaceX' }
  ], [])
  
  // Generate test orbit paths
  const testOrbitPaths = useMemo((): OrbitPath[] => [
    // GEO orbit (stationary ring)
    {
      id: 'geo-orbit-ring',
      satelliteId: 'geo-ring',
      constellation: 'GEO',
      path: Array.from({ length: 360 }, (_, i) => [
        i - 180, // Complete ring around Earth
        0,       // Equatorial
        35786000 // GEO altitude
      ])
    },
    // MEO orbit
    {
      id: 'meo-orbit-1', 
      satelliteId: 'meo-1',
      constellation: 'MEO',
      path: Array.from({ length: 100 }, (_, i) => [
        (i * 3.6) - 180, // Complete orbit
        30 * Math.sin(i * 0.1), // Inclined orbit
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
        53 * Math.cos(i * 0.15), // Polar-ish orbit
        550000
      ])
    }
  ], [])
  
  // Create the appropriate view based on zoom level
  const deckView = useMemo(() => {
    if (viewMode === 'globe') {
      // Globe view for space perspective
      return new GlobeView({ 
        id: 'unified-view', 
        controller: true,
        resolution: 2
      })
    } else {
      // Map view for terrain details
      return new MapView({ 
        id: 'unified-view', 
        controller: true
      })
    }
  }, [viewMode])
  
  // Create deck.gl layers based on view mode
  const layers = useMemo(() => {
    const allLayers = []
    
    // Base Earth imagery - always visible
    allLayers.push(
      new TileLayer({
        id: 'earth-surface',
        data: EARTH_IMAGERY_SOURCES[earthTexture],
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: props => {
          const {
            bbox: { west, south, east, north }
          } = props.tile;
          
          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north]
          });
        },
        pickable: false
      })
    )
    
    // Add terrain/hillshade for close-up views
    if (viewMode === 'terrain' && layerVisibility.terrain) {
      allLayers.push(
        new TileLayer({
          id: 'terrain-hillshade',
          data: TERRAIN_SOURCES.hillshade,
          tileSize: 256,
          opacity: 0.3,
          renderSubLayers: props => {
            const {
              bbox: { west, south, east, north }
            } = props.tile;
            
            return new BitmapLayer(props, {
              data: null,
              image: props.data,
              bounds: [west, south, east, north],
              desaturate: 0.5,
              transparentColor: [0, 0, 0, 0]
            });
          },
          pickable: false
        })
      )
    }
    
    // Ground station coverage areas (if enabled)
    if (layerVisibility.coverage && layerVisibility.groundStations) {
      stationsToRender.forEach((station) => {
        const baseColor = getProfitabilityColor(station.margin)
        const utilizationFraction = station.utilization / 100
        
        // Adaptive radius based on view mode
        const baseRadius = viewMode === 'globe' ? 300000 : 
                          viewMode === 'regional' ? 150000 : 25000
        
        // FIXED gradient rings (opaque edge, transparent center) - Reduced for performance
        const gradientRings = viewMode === 'globe' ? [
          { fraction: 1.0, strokeOpacity: 200, fillOpacity: 0 },
          { fraction: 0.7, strokeOpacity: 60, fillOpacity: 30 },
          { fraction: 0.4, strokeOpacity: 10, fillOpacity: 10 },
          { fraction: 0.1, strokeOpacity: 0, fillOpacity: 0 }
        ] : [
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
              
              getPosition: d => [d.longitude, d.latitude, viewMode === 'globe' ? 1000 : 100],
              getRadius: baseRadius * utilizationFraction * ring.fraction,
              
              getFillColor: [...baseColor, ring.fillOpacity],
              getLineColor: [...baseColor, ring.strokeOpacity],
              
              stroked: ring.strokeOpacity > 0,
              filled: ring.fillOpacity > 0,
              lineWidthMinPixels: ringIndex === 0 ? 2 : 1,
              lineWidthMaxPixels: ringIndex === 0 ? 4 : 2,
              
              radiusMinPixels: viewMode === 'globe' ? 10 * ring.fraction : 20 * ring.fraction,
              radiusMaxPixels: viewMode === 'globe' ? 40 * ring.fraction : 80 * ring.fraction,
              
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
          
          getPosition: d => [d.longitude, d.latitude, viewMode === 'globe' ? 2000 : 200],
          getIcon: () => ({
            url: SATELLITE_DISH_ICON,
            width: 128,
            height: 128,
            anchorY: 64
          }),
          
          getSize: viewMode === 'globe' ? 20 : 25,
          sizeMinPixels: viewMode === 'globe' ? 15 : 18,
          sizeMaxPixels: viewMode === 'globe' ? 30 : 35,
          
          getColor: [255, 255, 255, 255],
          
          pickable: true,
          onHover: (info) => onStationHover?.(info.object || null),
          onClick: (info) => onStationClick?.(info.object),
          
          billboard: viewMode !== 'globe' // Billboard in map view, not in globe view
        })
      )
    }
    
    // Satellite orbits (if enabled and in space view)
    if (layerVisibility.orbits && viewMode === 'globe') {
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
            
            widthMinPixels: 1,
            widthMaxPixels: 6,
            
            pickable: false,
            billboard: false
          })
        )
      })
    }
    
    // Satellites (if enabled and in space view)
    if (layerVisibility.satellites && viewMode === 'globe') {
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
          
          radiusMinPixels: 3,
          radiusMaxPixels: 10,
          
          pickable: true,
          autoHighlight: true
        })
      )
    }
    
    return allLayers
  }, [stationsToRender, earthTexture, layerVisibility, viewMode, viewState.zoom, onStationClick, onStationHover, testSatellites, testOrbitPaths, terrainExaggeration])
  
  // Handle view state changes
  const onViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState)
  }, [])
  
  // Fly to different regions with appropriate zoom
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
  
  // Quick zoom presets
  const setViewMode = (mode: 'space' | 'global' | 'regional' | 'local') => {
    const zoomLevels = {
      space: 0.5,    // True space view
      global: 1.5,   // Global overview
      regional: 4,   // Regional view
      local: 8       // Local terrain detail
    }
    
    setViewState({
      ...viewState,
      zoom: zoomLevels[mode],
      transitionDuration: 1500,
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
        views={deckView}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layers}
        parameters={{
          clearColor: [0, 0, 0, 1]
        }}
      />
      
      {/* Unified 3D Controls */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-4 text-gray-100 border border-gray-700 max-w-sm">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">
          Unified 3D Globe + Terrain
        </h3>
        
        {/* Current View Mode Indicator */}
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400">Current Mode:</div>
          <div className="text-sm font-semibold text-white capitalize">
            {viewMode} View (Zoom: {viewState.zoom.toFixed(1)})
          </div>
        </div>
        
        {/* Quick View Modes */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-2">Quick Views</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setViewMode('space')}
              className={`text-xs px-2 py-1 rounded transition-all border ${
                viewMode === 'globe' && viewState.zoom < 1
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-600/50'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              Space
            </button>
            <button
              onClick={() => setViewMode('global')}
              className={`text-xs px-2 py-1 rounded transition-all border ${
                viewMode === 'globe' && viewState.zoom >= 1
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-600/50'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setViewMode('regional')}
              className={`text-xs px-2 py-1 rounded transition-all border ${
                viewMode === 'regional'
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-600/50'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              Regional
            </button>
            <button
              onClick={() => setViewMode('local')}
              className={`text-xs px-2 py-1 rounded transition-all border ${
                viewMode === 'terrain'
                  ? 'bg-cyan-600/20 text-cyan-400 border-cyan-600/50'
                  : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>
        
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
        
        {/* Terrain Controls (when in terrain view) */}
        {viewMode === 'terrain' && (
          <div className="mb-3">
            <label className="text-xs text-gray-400">Terrain Exaggeration: {terrainExaggeration}x</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={terrainExaggeration}
              onChange={(e) => setTerrainExaggeration(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        )}
        
        {/* Layer Toggles */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-2">Layers</label>
          <div className="space-y-2">
            {Object.entries(layerVisibility).map(([key, value]) => {
              // Only show relevant layers for current view mode
              const relevantLayers = viewMode === 'globe' 
                ? ['groundStations', 'coverage', 'satellites', 'orbits', 'labels']
                : ['groundStations', 'coverage', 'terrain', 'labels']
                
              if (!relevantLayers.includes(key)) return null
              
              return (
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
              )
            })}
          </div>
        </div>
        
        {/* Regional Navigation */}
        <div className="space-y-1">
          <button
            onClick={() => flyToRegion(-77.5, 38.9, 4)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            North America
          </button>
          <button
            onClick={() => flyToRegion(6.1, 49.6, 4)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Europe
          </button>
          <button
            onClick={() => flyToRegion(103.8, 1.35, 4)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Asia Pacific
          </button>
          <button
            onClick={() => flyToRegion(0, 0, 0.5)}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Space View
          </button>
        </div>
      </div>
      
      {/* Layer Status & Legend */}
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
        
        {layerVisibility.satellites && viewMode === 'globe' && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h4 className="text-xs font-semibold mb-2 text-cyan-400">Satellites</h4>
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
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Stations: {stationsToRender.length} | Mode: {viewMode}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Unified3DGlobeTerrainMap