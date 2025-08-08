/**
 * Maritime Reality Layer
 * Displays real vessel positions and density from Marine Cadastre data
 * No hexagons - uses smooth heatmaps and contours
 */

import { HeatmapLayer, ContourLayer } from '@deck.gl/aggregation-layers'
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'
import { VesselAISData } from '@/lib/data/maritimeDataSources'

export function createMaritimeRealityLayers(vessels: VesselAISData[]) {
  const layers = []
  
  // Vessel density heatmap
  layers.push(
    new HeatmapLayer({
      id: 'vessel-density-heatmap',
      data: vessels,
      getPosition: (d: VesselAISData) => [d.position.longitude, d.position.latitude],
      getWeight: (d: VesselAISData) => {
        // Weight by vessel value and communication needs
        const valueWeight = d.value.score / 100
        const commWeight = (d.communication.dataRequirementGbPerMonth || 100) / 1000
        return valueWeight * 0.7 + commWeight * 0.3
      },
      radiusPixels: 60,
      intensity: 1.5,
      threshold: 0.03,
      colorRange: [
        [0, 0, 0, 0],
        [14, 17, 35, 25],      // Very dark blue
        [31, 38, 79, 50],      // Dark blue
        [58, 72, 138, 100],    // Medium blue
        [87, 108, 188, 150],   // Light blue
        [116, 144, 225, 200],  // Bright blue
        [158, 180, 238, 255]   // Very bright blue
      ]
    })
  )
  
  // Vessel value contours
  const valueGrid = generateValueGrid(vessels)
  if (valueGrid.length > 0) {
    layers.push(
      new ContourLayer({
        id: 'vessel-value-contours',
        data: valueGrid,
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => d.value,
        contours: [
          { threshold: 20, color: [100, 100, 200, 50] },   // Low value
          { threshold: 40, color: [150, 150, 255, 80] },   // Medium value
          { threshold: 60, color: [200, 200, 255, 120] },  // High value
          { threshold: 80, color: [255, 255, 255, 180] }   // Very high value
        ],
        cellSize: 10000, // 10km cells
        gpuAggregation: true
      })
    )
  }
  
  // Individual vessel markers for high-value vessels
  const highValueVessels = vessels
    .filter(v => v.value.score >= 70)
    .sort((a, b) => b.value.score - a.value.score)
    .slice(0, 100) // Top 100 high-value vessels
  
  layers.push(
    new ScatterplotLayer({
      id: 'high-value-vessels',
      data: highValueVessels,
      getPosition: (d: VesselAISData) => [d.position.longitude, d.position.latitude],
      getFillColor: (d: VesselAISData) => {
        // Color by vessel type
        switch(d.vessel.type) {
          case 'cruise_ship': return [255, 20, 147, 200]      // Deep pink
          case 'container_ship': return [30, 144, 255, 200]   // Dodger blue
          case 'oil_tanker': return [255, 140, 0, 200]        // Dark orange
          case 'lng_carrier': return [0, 191, 255, 200]       // Deep sky blue
          case 'offshore_platform': return [255, 215, 0, 200] // Gold
          case 'drilling_rig': return [255, 69, 0, 200]       // Red orange
          default: return [169, 169, 169, 200]                // Gray
        }
      },
      getRadius: (d: VesselAISData) => {
        // Size by monthly revenue potential
        const revenue = d.value.monthlyRevenuePotential
        if (revenue > 50000) return 800
        if (revenue > 30000) return 600
        if (revenue > 10000) return 400
        return 300
      },
      radiusMinPixels: 3,
      radiusMaxPixels: 15,
      pickable: true,
      stroked: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 100],
      
      // Add animation for moving vessels
      transitions: {
        getPosition: {
          duration: 3000,
          type: 'interpolation'
        }
      }
    })
  )
  
  // Shipping lanes (derived from vessel positions)
  const shippingLanes = extractShippingLanes(vessels)
  if (shippingLanes.length > 0) {
    layers.push(
      new PathLayer({
        id: 'shipping-lanes',
        data: shippingLanes,
        getPath: (d: any) => d.path,
        getColor: (d: any) => {
          const intensity = d.vesselCount / 50
          return [
            100 + intensity * 100,
            100 + intensity * 100,
            200 + intensity * 55,
            Math.min(255, 50 + intensity * 100)
          ]
        },
        getWidth: (d: any) => Math.min(5000, 1000 + d.vesselCount * 50),
        widthMinPixels: 1,
        widthMaxPixels: 10,
        pickable: false,
        rounded: true,
        billboard: false
      })
    )
  }
  
  return layers
}

/**
 * Generate a value grid from vessel positions
 */
function generateValueGrid(vessels: VesselAISData[]): any[] {
  const grid: Map<string, { position: [number, number], value: number, count: number }> = new Map()
  const gridSize = 0.5 // 0.5 degree grid
  
  vessels.forEach(vessel => {
    const lat = Math.floor(vessel.position.latitude / gridSize) * gridSize
    const lon = Math.floor(vessel.position.longitude / gridSize) * gridSize
    const key = `${lat},${lon}`
    
    const existing = grid.get(key) || { 
      position: [lon + gridSize/2, lat + gridSize/2] as [number, number], 
      value: 0, 
      count: 0 
    }
    
    existing.value += vessel.value.score
    existing.count += 1
    grid.set(key, existing)
  })
  
  return Array.from(grid.values()).map(cell => ({
    position: cell.position,
    value: cell.value / Math.max(1, cell.count) // Average value
  }))
}

/**
 * Extract shipping lanes from vessel movement patterns
 */
function extractShippingLanes(vessels: VesselAISData[]): any[] {
  const lanes: Map<string, { path: [number, number][], vesselCount: number }> = new Map()
  
  // Group vessels by destination
  const byDestination: Map<string, VesselAISData[]> = new Map()
  vessels.forEach(vessel => {
    if (vessel.voyage?.destination) {
      const dest = vessel.voyage.destination
      const existing = byDestination.get(dest) || []
      existing.push(vessel)
      byDestination.set(dest, existing)
    }
  })
  
  // Create lanes for destinations with multiple vessels
  byDestination.forEach((destVessels, destination) => {
    if (destVessels.length >= 3) {
      // Sort vessels by longitude to create a path
      const sorted = destVessels
        .sort((a, b) => a.position.longitude - b.position.longitude)
        .slice(0, 10) // Limit to 10 points per lane
      
      const path = sorted.map(v => [v.position.longitude, v.position.latitude] as [number, number])
      
      if (path.length >= 2) {
        lanes.set(destination, {
          path,
          vesselCount: destVessels.length
        })
      }
    }
  })
  
  return Array.from(lanes.values())
}

/**
 * Create vessel tracking animation layer
 */
export function createVesselAnimationLayer(vessels: VesselAISData[], time: number) {
  // Animate vessel positions based on speed and course
  const animatedVessels = vessels.map(vessel => {
    const speed = vessel.movement.speedKnots * 1.852 // Convert to km/h
    const distance = (speed * time) / 3600 // Distance in km
    const distanceDegrees = distance / 111 // Rough conversion to degrees
    
    // Calculate new position based on course
    const courseRad = vessel.movement.course * Math.PI / 180
    const newLat = vessel.position.latitude + distanceDegrees * Math.cos(courseRad)
    const newLon = vessel.position.longitude + distanceDegrees * Math.sin(courseRad) / Math.cos(vessel.position.latitude * Math.PI / 180)
    
    return {
      ...vessel,
      position: {
        ...vessel.position,
        latitude: newLat,
        longitude: newLon
      }
    }
  })
  
  return createMaritimeRealityLayers(animatedVessels)
}