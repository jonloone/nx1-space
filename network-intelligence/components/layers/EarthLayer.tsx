'use client'

import { GeoJsonLayer, SolidPolygonLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'

// Simple earth sphere data - continents outline
const EARTH_SPHERE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Earth' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-180, -90],
          [-180, 90],
          [180, 90],
          [180, -90],
          [-180, -90]
        ]]
      }
    }
  ]
}

// Simplified continent outlines for visual reference
const CONTINENTS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // North America
    {
      type: 'Feature',
      properties: { name: 'North America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-170, 70], [-170, 30], [-150, 20], [-120, 20], [-100, 25],
          [-95, 30], [-90, 30], [-85, 25], [-80, 25], [-75, 35],
          [-75, 45], [-70, 45], [-65, 45], [-60, 50], [-55, 52],
          [-55, 60], [-60, 65], [-65, 70], [-80, 73], [-95, 70],
          [-110, 70], [-130, 70], [-150, 70], [-170, 70]
        ]]
      }
    },
    // South America
    {
      type: 'Feature',
      properties: { name: 'South America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-80, 10], [-75, 5], [-70, 0], [-65, -5], [-60, -5],
          [-55, 0], [-50, 0], [-45, -5], [-40, -10], [-35, -10],
          [-35, -25], [-40, -30], [-45, -35], [-55, -35], [-60, -40],
          [-65, -45], [-70, -50], [-72, -52], [-70, -55], [-67, -55],
          [-65, -52], [-60, -50], [-55, -45], [-50, -35], [-45, -25],
          [-40, -15], [-45, -5], [-50, 5], [-55, 10], [-60, 10],
          [-70, 10], [-75, 10], [-80, 10]
        ]]
      }
    },
    // Europe
    {
      type: 'Feature',
      properties: { name: 'Europe' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-10, 35], [-5, 36], [0, 38], [5, 43], [10, 45],
          [15, 45], [20, 45], [25, 45], [30, 45], [35, 45],
          [40, 45], [40, 50], [35, 55], [30, 60], [25, 65],
          [20, 70], [15, 70], [10, 65], [5, 60], [0, 55],
          [-5, 50], [-10, 45], [-10, 35]
        ]]
      }
    },
    // Africa
    {
      type: 'Feature',
      properties: { name: 'Africa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-20, 35], [-15, 30], [-10, 25], [-5, 20], [0, 15],
          [5, 10], [10, 5], [15, 0], [20, -5], [25, -10],
          [30, -15], [35, -20], [35, -30], [30, -35], [25, -35],
          [20, -35], [18, -32], [15, -25], [10, -15], [5, -5],
          [0, 0], [-5, 5], [-10, 10], [-15, 15], [-17, 20],
          [-20, 25], [-20, 35]
        ]]
      }
    },
    // Asia
    {
      type: 'Feature',
      properties: { name: 'Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [25, 35], [30, 35], [35, 35], [40, 35], [45, 35],
          [50, 35], [55, 35], [60, 35], [65, 35], [70, 30],
          [75, 25], [80, 20], [85, 20], [90, 20], [95, 20],
          [100, 15], [105, 10], [110, 10], [115, 5], [120, 5],
          [125, 10], [130, 15], [135, 20], [140, 25], [145, 30],
          [145, 35], [140, 40], [135, 45], [130, 50], [125, 55],
          [120, 60], [115, 65], [110, 70], [100, 70], [90, 70],
          [80, 70], [70, 70], [60, 70], [50, 70], [40, 70],
          [30, 65], [25, 60], [25, 50], [25, 40], [25, 35]
        ]]
      }
    },
    // Australia
    {
      type: 'Feature',
      properties: { name: 'Australia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [115, -35], [115, -30], [115, -25], [115, -20], [120, -15],
          [125, -12], [130, -12], [135, -12], [140, -15], [145, -20],
          [150, -25], [153, -30], [153, -35], [150, -38], [145, -38],
          [140, -38], [135, -35], [130, -33], [125, -33], [120, -35],
          [115, -35]
        ]]
      }
    }
  ]
}

interface EarthLayerProps {
  visible: boolean
  isGlobeView: boolean
}

/**
 * Creates Earth background layers for globe visualization
 */
export function createEarthLayers({ 
  visible, 
  isGlobeView 
}: EarthLayerProps): Layer[] {
  if (!visible) return []

  const layers: Layer[] = []

  // Ocean background (blue sphere)
  layers.push(
    new GeoJsonLayer({
      id: 'earth-ocean',
      data: EARTH_SPHERE_GEOJSON,
      
      // Styling
      getFillColor: [10, 20, 40, 255], // Dark blue ocean
      getLineColor: [30, 50, 70, 255], // Slightly lighter blue outline
      lineWidthMinPixels: isGlobeView ? 0 : 1,
      
      // Rendering
      filled: true,
      stroked: isGlobeView,
      extruded: false,
      wireframe: false,
      
      pickable: false
    })
  )

  // Continents layer
  layers.push(
    new GeoJsonLayer({
      id: 'earth-continents',
      data: CONTINENTS_GEOJSON,
      
      // Styling
      getFillColor: [30, 60, 30, 200], // Dark green land
      getLineColor: [50, 80, 50, 255], // Lighter green outline
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 2,
      
      // Rendering
      filled: true,
      stroked: true,
      extruded: false,
      
      pickable: false
    })
  )

  // Grid lines for reference (optional)
  if (isGlobeView) {
    const gridLines = []
    
    // Latitude lines (every 30 degrees)
    for (let lat = -60; lat <= 60; lat += 30) {
      const points = []
      for (let lon = -180; lon <= 180; lon += 10) {
        points.push([lon, lat])
      }
      gridLines.push({
        path: points,
        color: [50, 50, 50, 100] // Subtle gray
      })
    }
    
    // Longitude lines (every 30 degrees)
    for (let lon = -180; lon <= 180; lon += 30) {
      const points = []
      for (let lat = -90; lat <= 90; lat += 10) {
        points.push([lon, lat])
      }
      gridLines.push({
        path: points,
        color: [50, 50, 50, 100] // Subtle gray
      })
    }
    
    // Add equator (highlighted)
    gridLines.push({
      path: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0]),
      color: [100, 100, 100, 150] // Brighter for equator
    })
    
    // Add prime meridian (highlighted)
    gridLines.push({
      path: Array.from({ length: 37 }, (_, i) => [0, -90 + i * 5]),
      color: [100, 100, 100, 150] // Brighter for prime meridian
    })
  }

  return layers
}

/**
 * Generate more detailed earth data from Natural Earth or similar sources
 * This is a placeholder for more detailed continent data
 */
export async function loadDetailedEarthData() {
  // In production, this would load from Natural Earth data
  // For now, we use the simplified geometry above
  return CONTINENTS_GEOJSON
}

/**
 * Creates a sphere mesh for 3D globe visualization
 * This creates a more realistic 3D sphere when using GlobeView
 */
export function createGlobeSphere(resolution: number = 32): any {
  const vertices = []
  const indices = []
  
  // Generate sphere vertices
  for (let lat = 0; lat <= resolution; lat++) {
    const theta = (lat * Math.PI) / resolution
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    
    for (let lon = 0; lon <= resolution; lon++) {
      const phi = (lon * 2 * Math.PI) / resolution
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)
      
      const x = cosPhi * sinTheta
      const y = cosTheta
      const z = sinPhi * sinTheta
      
      vertices.push({
        position: [
          x * 180, // Convert to longitude
          y * 90,  // Convert to latitude
          0        // Sea level
        ]
      })
    }
  }
  
  // Generate sphere indices
  for (let lat = 0; lat < resolution; lat++) {
    for (let lon = 0; lon < resolution; lon++) {
      const first = lat * (resolution + 1) + lon
      const second = first + resolution + 1
      
      indices.push(first, second, first + 1)
      indices.push(second, second + 1, first + 1)
    }
  }
  
  return { vertices, indices }
}