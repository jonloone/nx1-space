'use client'

import React, { useState, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer } from '@deck.gl/layers'
import Map from 'react-map-gl/maplibre'
import { generateGroundStationOpportunities } from '@/lib/services/h3GridService'

export default function H3DebugPage() {
  const [viewState, setViewState] = useState({
    longitude: -40,
    latitude: 35,
    zoom: 3,
    pitch: 45,
    bearing: 0
  })
  
  const [hexagonData, setHexagonData] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState('')
  
  useEffect(() => {
    // Generate hexagons using our service
    try {
      console.log('Generating hexagons...')
      const result = generateGroundStationOpportunities({
        resolutions: [5, 6],
        maxOpportunities: 100,
        globalAnalysis: true
      })
      
      console.log('Generated result:', result)
      
      if (result && result.topOpportunities) {
        const hexagons = result.topOpportunities
        console.log(`Generated ${hexagons.length} hexagons`)
        
        // Log first hexagon for debugging
        if (hexagons.length > 0) {
          console.log('First hexagon structure:', hexagons[0])
          console.log('Has hexagon property?', 'hexagon' in hexagons[0])
          console.log('Has h3Index property?', 'h3Index' in hexagons[0])
        }
        
        setHexagonData(hexagons)
        setDebugInfo(`${hexagons.length} hexagons loaded`)
      } else {
        setDebugInfo('No hexagons generated')
      }
    } catch (error) {
      console.error('Error generating hexagons:', error)
      setDebugInfo(`Error: ${error}`)
    }
  }, [])
  
  const layers = [
    // H3 Hexagon layer
    hexagonData.length > 0 && new H3HexagonLayer({
      id: 'h3-debug-layer',
      data: hexagonData,
      
      getHexagon: (d: any) => {
        const hex = d.hexagon || d.h3Index
        if (!hex) {
          console.error('No hexagon property in:', d)
        }
        return hex
      },
      
      getFillColor: (d: any) => {
        const score = d.overallScore || d.score || 0
        if (score > 80) return [34, 197, 94, 180]
        if (score > 60) return [251, 191, 36, 180]
        if (score > 40) return [59, 130, 246, 180]
        return [239, 68, 68, 180]
      },
      
      getElevation: (d: any) => (d.overallScore || d.score || 0) * 500,
      elevationScale: 1,
      
      extruded: true,
      wireframe: false,
      filled: true,
      coverage: 0.95,
      
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      
      onHover: (info: any) => {
        if (info.object) {
          console.log('Hovering:', info.object)
        }
      }
    }),
    
    // Also show hexagon centers as points for debugging
    new ScatterplotLayer({
      id: 'hexagon-centers',
      data: hexagonData,
      getPosition: (d: any) => d.coordinates || [d.centerLon, d.centerLat],
      getRadius: 5000,
      getFillColor: [255, 0, 0, 200],
      pickable: false
    })
  ].filter(Boolean)
  
  return (
    <div className="w-full h-screen relative">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        views={new MapView({ id: 'map' })}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          preventStyleDiffing={true}
        />
      </DeckGL>
      
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-xl text-white p-4 rounded-lg max-w-md">
        <h2 className="text-lg font-bold mb-2">H3 Debug Info</h2>
        <div className="text-sm space-y-1">
          <div>Status: {debugInfo}</div>
          <div>Hexagons in view: {hexagonData.length}</div>
          <div>Zoom: {viewState.zoom.toFixed(2)}</div>
        </div>
        
        {hexagonData.length > 0 && (
          <div className="mt-3 text-xs">
            <div className="font-bold mb-1">First Hexagon:</div>
            <pre className="bg-black/50 p-2 rounded overflow-x-auto">
              {JSON.stringify({
                hexagon: hexagonData[0].hexagon,
                h3Index: hexagonData[0].h3Index,
                score: hexagonData[0].overallScore || hexagonData[0].score,
                coordinates: hexagonData[0].coordinates
              }, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-400">
          <div>Red dots = hexagon centers</div>
          <div>Colored hexagons = H3 cells</div>
          <div>Check console for detailed logs</div>
        </div>
      </div>
    </div>
  )
}