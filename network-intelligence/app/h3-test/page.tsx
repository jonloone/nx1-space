'use client'

import React, { useState, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import Map from 'react-map-gl/maplibre'
import * as h3 from 'h3-js'

// Generate test hexagons
const generateTestHexagons = () => {
  const hexagons = []
  
  // Generate hexagons around major cities
  const cities = [
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 }
  ]
  
  cities.forEach(city => {
    // Generate a cluster of hexagons around each city
    for (let i = 0; i < 20; i++) {
      const lat = city.lat + (Math.random() - 0.5) * 2
      const lng = city.lng + (Math.random() - 0.5) * 2
      const resolution = 5
      
      try {
        const h3Index = h3.latLngToCell(lat, lng, resolution)
        
        hexagons.push({
          // CRITICAL: Must be called 'hexagon' for H3HexagonLayer
          hexagon: h3Index,
          score: Math.random(),
          value: Math.floor(Math.random() * 10000000),
          city: city.name,
          type: ['EXPANSION', 'OPTIMIZATION', 'MARKETING', 'RISK', 'MONITOR'][Math.floor(Math.random() * 5)]
        })
      } catch (error) {
        console.error('Error generating H3 index:', error)
      }
    }
  })
  
  console.log(`Generated ${hexagons.length} test hexagons`)
  return hexagons
}

export default function H3TestPage() {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 30,
    zoom: 2,
    pitch: 45,
    bearing: 0
  })
  
  const hexagonData = useMemo(() => generateTestHexagons(), [])
  
  const layers = [
    new H3HexagonLayer({
      id: 'h3-test-layer',
      data: hexagonData,
      
      // CRITICAL: Must use 'hexagon' property
      getHexagon: (d: any) => d.hexagon,
      
      // Color based on type
      getFillColor: (d: any) => {
        const colors: Record<string, [number, number, number, number]> = {
          'EXPANSION': [34, 197, 94, 180],      // Green
          'OPTIMIZATION': [251, 191, 36, 180],  // Yellow
          'MARKETING': [59, 130, 246, 180],     // Blue
          'RISK': [239, 68, 68, 180],          // Red
          'MONITOR': [156, 163, 175, 120]      // Gray
        }
        return colors[d.type] || colors['MONITOR']
      },
      
      // 3D elevation based on score
      getElevation: (d: any) => d.score * 50000,
      elevationScale: 1,
      
      // Visual properties
      extruded: true,
      wireframe: false,
      filled: true,
      coverage: 0.95,
      
      // Interaction
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      
      // Callbacks
      onHover: (info: any) => {
        if (info.object) {
          console.log('Hovering hexagon:', info.object)
        }
      },
      onClick: (info: any) => {
        if (info.object) {
          console.log('Clicked hexagon:', info.object)
          alert(`
            City: ${info.object.city}
            Type: ${info.object.type}
            Score: ${(info.object.score * 100).toFixed(0)}%
            Value: $${(info.object.value / 1000000).toFixed(1)}M
            H3 Index: ${info.object.hexagon}
          `)
        }
      }
    })
  ]
  
  return (
    <div className="w-full h-screen relative">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={layers}
        views={new MapView({ id: 'map' })}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          preventStyleDiffing={true}
        />
      </DeckGL>
      
      {/* Debug info */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xl text-white p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-2">H3 Hexagon Test</h2>
        <div className="text-sm space-y-1">
          <div>Total Hexagons: {hexagonData.length}</div>
          <div>Zoom: {viewState.zoom.toFixed(2)}</div>
          <div>Center: {viewState.latitude.toFixed(2)}°, {viewState.longitude.toFixed(2)}°</div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          <div>✅ H3 indexes generated</div>
          <div>✅ Using 'hexagon' property</div>
          <div>✅ 3D extrusion enabled</div>
          <div>Click on hexagons for details</div>
        </div>
      </div>
    </div>
  )
}