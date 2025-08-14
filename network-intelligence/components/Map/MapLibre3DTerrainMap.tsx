'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers'
import { type GroundStation } from '../layers/GroundStationLayer'
import 'maplibre-gl/dist/maplibre-gl.css'

// SVG satellite dish icon as data URI
const SATELLITE_DISH_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white">
    <path d="M192 32c0-17.7 14.3-32 32-32C383.1 0 512 128.9 512 288c0 17.7-14.3 32-32 32s-32-14.3-32-32C448 164.3 347.7 64 224 64c-17.7 0-32-14.3-32-32zM60.6 220.6L164.7 324.7l28.4-28.4c-.7-2.6-1.1-5.4-1.1-8.3c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32c-2.9 0-5.6-.4-8.3-1.1l-28.4 28.4L291.4 451.4c14.5 14.5 11.8 38.8-7.3 46.3C260.5 506.9 234.9 512 208 512C93.1 512 0 418.9 0 304c0-26.9 5.1-52.5 14.4-76.1c7.5-19 31.8-21.8 46.3-7.3zM224 96c106 0 192 86 192 192c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-70.7-57.3-128-128-128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
  </svg>
`)

interface MapLibre3DTerrainMapProps {
  groundStations: GroundStation[]
  onStationClick?: (station: GroundStation) => void
  onStationHover?: (station: GroundStation | null) => void
}

const MapLibre3DTerrainMap: React.FC<MapLibre3DTerrainMapProps> = ({
  groundStations,
  onStationClick,
  onStationHover
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const deckOverlay = useRef<MapboxOverlay | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [terrainEnabled, setTerrainEnabled] = useState(true)
  const [terrainExaggeration, setTerrainExaggeration] = useState(1.5)
  const [cameraPitch, setCameraPitch] = useState(60)
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark')
  
  // Get color based on profitability
  const getProfitabilityColor = (margin: number): [number, number, number] => {
    if (margin > 0.30) return [34, 197, 94]      // Bright green
    if (margin > 0.20) return [74, 222, 128]     // Green
    if (margin > 0.10) return [254, 240, 138]    // Yellow
    if (margin > 0) return [251, 191, 36]        // Orange
    return [239, 68, 68]                         // Red
  }
  
  useEffect(() => {
    if (!mapContainer.current) return
    
    // Initialize MapLibre with FREE resources
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          // FREE terrain from Terrarium tiles
          terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          },
          // FREE hillshade from same source
          hillshade: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], 
            encoding: 'terrarium',
            tileSize: 256
          },
          // FREE dark base map from CARTO
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© CARTO © OpenStreetMap contributors'
          },
          // FREE satellite imagery from ESRI
          'esri-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri'
          }
        },
        layers: [
          {
            id: 'base-layer',
            type: 'raster',
            source: 'carto-dark', // Start with dark theme
            minzoom: 0,
            maxzoom: 22
          },
          {
            id: 'hillshade-layer',
            type: 'hillshade',
            source: 'hillshade',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#000000',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#446688',
              'hillshade-illumination-direction': 335,
              'hillshade-illumination-anchor': 'viewport'
            }
          }
        ]
      },
      center: [-77.5, 38.9], // Virginia/Maryland area
      zoom: 7,
      pitch: 60,
      bearing: -45,
      antialias: true,
      hash: false
    })
    
    // Initialize Deck.gl overlay
    deckOverlay.current = new MapboxOverlay({
      interleaved: true,
      layers: []
    })
    
    map.current.on('load', () => {
      // Enable 3D terrain
      if (terrainEnabled) {
        map.current!.setTerrain({ 
          source: 'terrain', 
          exaggeration: terrainExaggeration
        })
      }
      
      // Add atmospheric effects if supported
      try {
        map.current!.setFog({
          color: 'rgb(13, 21, 38)',
          'horizon-blend': 0.05
        })
      } catch (error) {
        console.log('Fog not supported in this MapLibre version')
      }
      
      // Add Deck.gl overlay to map
      map.current!.addControl(deckOverlay.current as any)
      
      setMapLoaded(true)
      
      // Add navigation controls
      map.current!.addControl(new maplibregl.NavigationControl(), 'top-right')
      
      // Add scale control
      map.current!.addControl(new maplibregl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }), 'bottom-right')
    })
    
    return () => {
      map.current?.remove()
    }
  }, [])
  
  // Toggle terrain on/off
  const toggleTerrain = () => {
    if (map.current) {
      if (terrainEnabled) {
        map.current.setTerrain(undefined) // Disable terrain
        map.current.setLayoutProperty('hillshade-layer', 'visibility', 'none')
      } else {
        map.current.setTerrain({ 
          source: 'terrain', 
          exaggeration: terrainExaggeration 
        })
        map.current.setLayoutProperty('hillshade-layer', 'visibility', 'visible')
      }
      setTerrainEnabled(!terrainEnabled)
    }
  }
  
  // Toggle map style - simplified to avoid issues
  const toggleMapStyle = () => {
    if (map.current && mapLoaded) {
      const newStyle = mapStyle === 'dark' ? 'satellite' : 'dark'
      
      try {
        // Simple source change
        if (newStyle === 'satellite') {
          map.current.getSource('base-layer')?.setTiles?.(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'])
        } else {
          map.current.getSource('base-layer')?.setTiles?.(['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'])
        }
        setMapStyle(newStyle)
      } catch (error) {
        console.log('Style change not supported, using current style')
      }
    }
  }
  
  // Update terrain exaggeration
  useEffect(() => {
    if (map.current && mapLoaded && terrainEnabled) {
      map.current.setTerrain({
        source: 'terrain',
        exaggeration: terrainExaggeration
      })
    }
  }, [terrainExaggeration, mapLoaded, terrainEnabled])
  
  // Update camera pitch
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setPitch(cameraPitch)
    }
  }, [cameraPitch, mapLoaded])
  
  // Create Deck.gl layers for ground stations with FIXED gradient
  const deckLayers = useMemo(() => {
    if (!mapLoaded) return []
    
    console.log('Creating deck layers with', groundStations.length, 'ground stations')
    
    // If no ground stations provided, create test data
    let stationsToRender = groundStations
    if (groundStations.length === 0) {
      console.log('No ground stations provided, using test data')
      stationsToRender = [
        {
          id: 'test-1',
          name: 'Test Station Virginia',
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
          name: 'Test Station California',
          operator: 'SES',
          latitude: 37.4,
          longitude: -122.1,
          utilization: 60,
          revenue: 12,
          profit: 3,
          margin: 0.15,
          confidence: 0.8,
          isActive: true
        }
      ] as GroundStation[]
    }
    
    // Process ground stations to add elevation
    const stationsWithElevation = stationsToRender.map(station => ({
      ...station,
      position: [station.longitude, station.latitude, 100] as [number, number, number]
    }))
    
    console.log('Stations with elevation:', stationsWithElevation.length)
    
    return [
      // FIXED Gradient: Multiple rings with proper opacity (opaque edge -> transparent center)
      ...stationsWithElevation.map((station) => {
        const baseColor = getProfitabilityColor(station.margin)
        const utilizationFraction = station.utilization / 100
        
        // Gradient rings with CORRECT opacity distribution
        const gradientRings = [
          { fraction: 1.0, strokeOpacity: 200, fillOpacity: 0 },   // Edge: strong stroke only
          { fraction: 0.85, strokeOpacity: 120, fillOpacity: 40 }, // Fading inward
          { fraction: 0.7, strokeOpacity: 60, fillOpacity: 30 },
          { fraction: 0.55, strokeOpacity: 30, fillOpacity: 20 },
          { fraction: 0.4, strokeOpacity: 10, fillOpacity: 10 },
          { fraction: 0.25, strokeOpacity: 0, fillOpacity: 5 },
          { fraction: 0.1, strokeOpacity: 0, fillOpacity: 0 }     // Center: transparent
        ]
        
        return gradientRings.map((ring, ringIndex) => 
          new ScatterplotLayer({
            id: `station-coverage-${station.id}-ring-${ringIndex}`,
            data: [station],
            
            getPosition: d => d.position,
            getRadius: 25000 * utilizationFraction * ring.fraction,
            
            // FIXED: Proper opacity gradient
            getFillColor: [...baseColor, ring.fillOpacity],
            getLineColor: [...baseColor, ring.strokeOpacity],
            
            stroked: ring.strokeOpacity > 0,
            filled: ring.fillOpacity > 0,
            lineWidthMinPixels: ringIndex === 0 ? 2 : 1,
            lineWidthMaxPixels: ringIndex === 0 ? 3 : 1,
            
            radiusMinPixels: 30 * ring.fraction,
            radiusMaxPixels: 80 * ring.fraction,
            
            pickable: ringIndex === 0,
            autoHighlight: true,
            onHover: ringIndex === 0 ? (info) => onStationHover?.(info.object || null) : undefined,
            onClick: ringIndex === 0 ? (info) => onStationClick?.(info.object) : undefined
          })
        )
      }).flat(),
      
      // Station icons at center (where gradient is transparent)
      new IconLayer({
        id: 'station-icons',
        data: stationsWithElevation,
        
        getPosition: d => d.position,
        getIcon: () => ({
          url: SATELLITE_DISH_ICON,
          width: 128,
          height: 128,
          anchorY: 64
        }),
        
        getSize: 20,
        sizeMinPixels: 16,
        sizeMaxPixels: 24,
        
        getColor: [255, 255, 255, 255], // White icons
        
        pickable: true,
        onHover: (info) => onStationHover?.(info.object || null),
        onClick: (info) => onStationClick?.(info.object)
      })
    ]
  }, [groundStations, mapLoaded, onStationClick, onStationHover])
  
  // Update Deck.gl layers
  useEffect(() => {
    if (deckOverlay.current && mapLoaded) {
      deckOverlay.current.setProps({ layers: deckLayers })
    }
  }, [deckLayers, mapLoaded])
  
  // Fly to specific regions
  const flyToRegion = (region: string) => {
    const views: Record<string, any> = {
      northAmerica: { center: [-77.5, 38.9], zoom: 7, pitch: 60, bearing: -45 },
      europe: { center: [6.13, 49.61], zoom: 7, pitch: 60, bearing: 30 },
      asia: { center: [103.82, 1.35], zoom: 8, pitch: 60, bearing: 0 },
      global: { center: [-40, 30], zoom: 2, pitch: 0, bearing: 0 }
    }
    
    const view = views[region]
    if (view) {
      map.current?.flyTo({
        ...view,
        duration: 2000,
        essential: true
      })
    }
  }
  
  return (
    <div className="relative w-full h-full bg-gray-900">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* 3D Terrain Controls */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-4 text-gray-100 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">
          3D Terrain Controls (FREE)
        </h3>
        
        {/* Terrain Toggle */}
        <div className="mb-3">
          <button
            onClick={toggleTerrain}
            className={`w-full px-3 py-2 rounded text-xs font-medium transition-all
                     ${terrainEnabled 
                       ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50' 
                       : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
          >
            {terrainEnabled ? '3D Terrain ON' : '3D Terrain OFF'}
          </button>
        </div>
        
        {/* Terrain Exaggeration */}
        {terrainEnabled && (
          <div className="mb-3">
            <label className="text-xs text-gray-400">Elevation: {terrainExaggeration}x</label>
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
        
        {/* Camera Pitch */}
        <div className="mb-3">
          <label className="text-xs text-gray-400">Tilt: {cameraPitch}°</label>
          <input
            type="range"
            min="0"
            max="85"
            value={cameraPitch}
            onChange={(e) => setCameraPitch(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
        
        {/* Quick Views */}
        <div className="space-y-1">
          <button
            onClick={() => flyToRegion('northAmerica')}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            North America
          </button>
          <button
            onClick={() => flyToRegion('europe')}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Europe
          </button>
          <button
            onClick={() => flyToRegion('asia')}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Asia Pacific
          </button>
          <button
            onClick={() => flyToRegion('global')}
            className="w-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 
                     hover:border-cyan-600/50 text-gray-300 hover:text-cyan-400 
                     rounded px-2 py-1 transition-all"
          >
            Global View
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Using FREE terrain data
          </p>
        </div>
      </div>
      
      {/* Style Toggle */}
      <div className="absolute top-4 right-20 bg-gray-900/90 backdrop-blur-md rounded-lg p-2 
                    border border-gray-700">
        <button
          onClick={toggleMapStyle}
          className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 
                   hover:text-cyan-400 rounded transition-all border border-gray-600"
        >
          {mapStyle === 'dark' ? 'Satellite' : 'Dark'} Style
        </button>
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
      </div>
    </div>
  )
}

export default MapLibre3DTerrainMap