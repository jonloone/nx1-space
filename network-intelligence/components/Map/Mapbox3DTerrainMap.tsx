'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { ScatterplotLayer, IconLayer, LineLayer } from '@deck.gl/layers'
import { MAPBOX_CONFIG } from '@/config/mapboxConfig'
import { type GroundStation } from '../layers/GroundStationLayer'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken

// SVG satellite dish icon as data URI
const SATELLITE_DISH_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white">
    <path d="M192 32c0-17.7 14.3-32 32-32C383.1 0 512 128.9 512 288c0 17.7-14.3 32-32 32s-32-14.3-32-32C448 164.3 347.7 64 224 64c-17.7 0-32-14.3-32-32zM60.6 220.6L164.7 324.7l28.4-28.4c-.7-2.6-1.1-5.4-1.1-8.3c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32c-2.9 0-5.6-.4-8.3-1.1l-28.4 28.4L291.4 451.4c14.5 14.5 11.8 38.8-7.3 46.3C260.5 506.9 234.9 512 208 512C93.1 512 0 418.9 0 304c0-26.9 5.1-52.5 14.4-76.1c7.5-19 31.8-21.8 46.3-7.3zM224 96c106 0 192 86 192 192c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-70.7-57.3-128-128-128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
  </svg>
`)

interface Mapbox3DTerrainMapProps {
  groundStations: GroundStation[]
  onStationClick?: (station: GroundStation) => void
  onStationHover?: (station: GroundStation | null) => void
}

const Mapbox3DTerrainMap: React.FC<Mapbox3DTerrainMapProps> = ({
  groundStations,
  onStationClick,
  onStationHover
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
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
    
    // Initialize Mapbox map with DARK style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // DARK STYLE
      center: MAPBOX_CONFIG.defaultViews.northAmerica.center,
      zoom: MAPBOX_CONFIG.defaultViews.northAmerica.zoom,
      pitch: MAPBOX_CONFIG.defaultViews.northAmerica.pitch,
      bearing: MAPBOX_CONFIG.defaultViews.northAmerica.bearing,
      antialias: true,
      hash: false
    })
    
    // Initialize Deck.gl overlay
    deckOverlay.current = new MapboxOverlay({
      interleaved: true,
      layers: []
    })
    
    map.current.on('load', () => {
      // Add terrain source (elevation data)
      map.current!.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      })
      
      // Add hillshade layer for terrain visualization on dark map
      map.current!.addSource('hillshade', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 256
      })
      
      map.current!.addLayer({
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
      }, 'waterway-label') // Place under labels
      
      // Enable 3D terrain
      if (terrainEnabled) {
        map.current!.setTerrain({ 
          source: 'mapbox-dem', 
          exaggeration: terrainExaggeration
        })
      }
      
      // Add dark sky layer for atmosphere
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 5, // Lower intensity for dark theme
          'sky-atmosphere-color': 'rgba(13, 21, 38, 0.8)', // Dark blue
          'sky-atmosphere-halo-color': 'rgba(34, 88, 143, 0.4)' // Muted halo
        }
      })
      
      // Add dark fog for depth perception
      map.current!.setFog({
        color: 'rgb(13, 21, 38)', // Dark blue fog
        'high-color': 'rgb(8, 12, 24)', // Darker upper atmosphere
        'horizon-blend': 0.05, // Subtle blend at horizon
        'space-color': 'rgb(0, 0, 0)', // Black space
        'star-intensity': 0.8 // More visible stars in dark mode
      })
      
      // Add Deck.gl overlay to map
      map.current!.addControl(deckOverlay.current as any)
      
      setMapLoaded(true)
      
      // Add navigation controls with dark theme
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Add scale control
      map.current!.addControl(new mapboxgl.ScaleControl({
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
        map.current.setTerrain(null) // Disable terrain
        map.current.setLayoutProperty('hillshade-layer', 'visibility', 'none')
      } else {
        map.current.setTerrain({ 
          source: 'mapbox-dem', 
          exaggeration: terrainExaggeration 
        })
        map.current.setLayoutProperty('hillshade-layer', 'visibility', 'visible')
      }
      setTerrainEnabled(!terrainEnabled)
    }
  }
  
  // Toggle map style
  const toggleMapStyle = () => {
    if (map.current) {
      const newStyle = mapStyle === 'dark' ? 'satellite' : 'dark'
      const styleUrl = newStyle === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/satellite-streets-v12'
      
      map.current.setStyle(styleUrl)
      setMapStyle(newStyle)
      
      // Re-add terrain after style change
      setTimeout(() => {
        if (terrainEnabled && map.current) {
          map.current.setTerrain({ 
            source: 'mapbox-dem', 
            exaggeration: terrainExaggeration 
          })
        }
      }, 1000)
    }
  }
  
  // Update terrain exaggeration
  useEffect(() => {
    if (map.current && mapLoaded && terrainEnabled) {
      map.current.setTerrain({
        source: 'mapbox-dem',
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
  
  // Create Deck.gl layers for ground stations with glowing effect for dark theme
  const deckLayers = useMemo(() => {
    if (!mapLoaded) return []
    
    // Process ground stations to add elevation
    const stationsWithElevation = groundStations.map(station => ({
      ...station,
      position: [station.longitude, station.latitude, 100] as [number, number, number]
    }))
    
    return [
      // Outer glow for stations (looks great on dark background)
      ...stationsWithElevation.map((station) => {
        const baseColor = getProfitabilityColor(station.margin)
        const utilizationFraction = station.utilization / 100
        
        return new ScatterplotLayer({
          id: `station-glow-${station.id}`,
          data: [station],
          
          getPosition: d => d.position,
          getRadius: 40000 * utilizationFraction, // 40km max radius for glow
          
          getFillColor: [...baseColor, 10], // Very transparent glow
          getLineColor: [0, 0, 0, 0],
          
          stroked: false,
          filled: true,
          
          radiusMinPixels: 50,
          radiusMaxPixels: 120,
          
          pickable: false
        })
      }),
      
      // Ground station coverage areas with gradient
      ...stationsWithElevation.map((station) => {
        const baseColor = getProfitabilityColor(station.margin)
        const utilizationFraction = station.utilization / 100
        
        // Create gradient rings
        const gradientRings = [
          { fraction: 1.0, opacity: 80 },
          { fraction: 0.7, opacity: 40 },
          { fraction: 0.4, opacity: 20 },
          { fraction: 0.1, opacity: 5 }
        ]
        
        return gradientRings.map((ring, ringIndex) => 
          new ScatterplotLayer({
            id: `station-coverage-${station.id}-ring-${ringIndex}`,
            data: [station],
            
            getPosition: d => d.position,
            getRadius: 25000 * utilizationFraction * ring.fraction, // 25km max radius
            
            getFillColor: [...baseColor, ring.opacity * 0.3],
            getLineColor: ringIndex === 0 ? [...baseColor, 200] : [0, 0, 0, 0], // Bright on dark
            
            stroked: ringIndex === 0,
            filled: true,
            lineWidthMinPixels: ringIndex === 0 ? 2 : 0,
            lineWidthMaxPixels: ringIndex === 0 ? 3 : 0,
            
            radiusMinPixels: 30 * ring.fraction,
            radiusMaxPixels: 80 * ring.fraction,
            
            pickable: ringIndex === 0,
            autoHighlight: true,
            onHover: ringIndex === 0 ? (info) => onStationHover?.(info.object || null) : undefined,
            onClick: ringIndex === 0 ? (info) => onStationClick?.(info.object) : undefined
          })
        )
      }).flat(),
      
      // Station center points (bright white on dark background)
      new ScatterplotLayer({
        id: 'station-points',
        data: stationsWithElevation,
        
        getPosition: d => d.position,
        getRadius: 800,
        
        getFillColor: [255, 255, 255, 255], // White centers
        getLineColor: (d: GroundStation) => {
          const color = getProfitabilityColor(d.margin)
          return [...color, 255]
        },
        
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
        
        radiusMinPixels: 6,
        radiusMaxPixels: 10,
        
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
  const flyToRegion = (region: keyof typeof MAPBOX_CONFIG.defaultViews) => {
    const view = MAPBOX_CONFIG.defaultViews[region]
    map.current?.flyTo({
      ...view,
      duration: 2000,
      essential: true
    })
  }
  
  return (
    <div className="relative w-full h-full bg-gray-900">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Dark-themed 3D Terrain Controls */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-4 text-gray-100 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">3D Terrain Controls</h3>
        
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
      </div>
      
      {/* Style Toggle (Dark/Satellite) */}
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
      
      {/* Dark-themed Legend */}
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

export default Mapbox3DTerrainMap