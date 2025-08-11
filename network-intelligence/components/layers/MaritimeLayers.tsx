'use client'

import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { Layer } from '@deck.gl/core'

export interface VesselPosition {
  id: string
  latitude: number
  longitude: number
  vesselType: string
  speed: number
  heading: number
  timestamp: Date
  confidence: number
}

export interface ShippingLane {
  id: string
  name: string
  coordinates: [number, number][]
  dailyVessels: number
  cargoValue: number
  direction: 'bidirectional' | 'eastbound' | 'westbound'
}

export interface Port {
  id: string
  name: string
  latitude: number
  longitude: number
  rank: 1 | 2 | 3  // 1 = major, 2 = secondary, 3 = minor
  vesselCapacity: number
  monthlyThroughput: number
}

interface MaritimeLayersProps {
  vessels: VesselPosition[]
  shippingLanes: ShippingLane[]
  ports: Port[]
  visible: boolean
  zoom: number
  landMask?: (lat: number, lon: number) => boolean
}

/**
 * Maritime visualization layers for opportunities mode
 * Ocean-only heatmap with dynamic resolution and shipping lane visualization
 */
export function createMaritimeLayers({
  vessels,
  shippingLanes,
  ports,
  visible,
  zoom,
  landMask
}: MaritimeLayersProps): Layer[] {
  if (!visible) return []

  const layers: Layer[] = []
  
  // Ocean blue color palette
  const OCEAN_BLUES = [
    [0, 50, 100, 0],      // Transparent
    [0, 80, 120, 100],    // Dark blue
    [0, 120, 160, 150],   // Medium blue
    [0, 160, 200, 200],   // Light blue
    [0, 200, 255, 255],   // Bright blue
    [100, 220, 255, 255]  // Very bright blue
  ]
  
  // 1. Maritime Traffic Heatmap (Ocean-only, dynamic resolution)
  if (vessels.length > 0) {
    // Filter vessels to ocean areas only
    const oceanVessels = landMask 
      ? vessels.filter(v => !landMask(v.latitude, v.longitude))
      : vessels
    
    // Dynamic resolution based on zoom level
    const getHeatmapRadius = (zoom: number): number => {
      if (zoom < 4) return 100000  // 100km at world view
      if (zoom < 6) return 50000   // 50km at regional view
      if (zoom < 8) return 25000   // 25km at local view
      return 10000                 // 10km at detailed view
    }
    
    layers.push(
      new HeatmapLayer({
        id: 'maritime-heatmap',
        data: oceanVessels,
        
        getPosition: (d: VesselPosition) => [d.longitude, d.latitude],
        getWeight: (d: VesselPosition) => {
          // Weight by vessel importance and confidence
          const speedFactor = Math.min(d.speed / 20, 2) // Faster vessels weighted more
          const confidenceFactor = d.confidence
          return speedFactor * confidenceFactor
        },
        
        // Dynamic resolution
        radiusPixels: Math.max(20, Math.min(100, getHeatmapRadius(zoom) / Math.pow(2, zoom - 10))),
        
        // Styling
        colorRange: OCEAN_BLUES,
        intensity: 1.5,
        threshold: 0.03,
        
        // Performance
        visible: true,
        pickable: false,
        
        updateTriggers: {
          radiusPixels: zoom
        }
      })
    )
  }
  
  // 2. Major Shipping Lanes
  if (shippingLanes.length > 0) {
    layers.push(
      new PathLayer({
        id: 'shipping-lanes',
        data: shippingLanes,
        
        getPath: (d: ShippingLane) => d.coordinates,
        getColor: (d: ShippingLane) => {
          // Color based on traffic intensity
          const intensity = d.dailyVessels
          if (intensity > 200) return [0, 200, 255, 220]  // High traffic - bright blue
          if (intensity > 100) return [0, 150, 200, 180]  // Medium traffic
          if (intensity > 50) return [0, 120, 160, 140]   // Low traffic
          return [0, 100, 130, 100]                        // Very low traffic
        },
        getWidth: (d: ShippingLane) => {
          // Width based on cargo value and vessel count
          const baseWidth = Math.sqrt(d.dailyVessels) * 500
          const valueMultiplier = Math.log10(Math.max(d.cargoValue, 1)) / 10
          return Math.max(1000, baseWidth * (1 + valueMultiplier))
        },
        
        // Styling
        widthMinPixels: 2,
        widthMaxPixels: 12,
        capRounded: true,
        billboard: false,
        
        // Interaction
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        
        // Smooth lines for better aesthetics
        getMarkerPercentages: () => [],
        
        updateTriggers: {
          getColor: 'traffic-intensity',
          getWidth: 'cargo-value'
        }
      })
    )
  }
  
  // 3. Major Ports (Context for opportunities)
  if (ports.length > 0) {
    // Filter to major ports only in opportunities mode
    const majorPorts = ports.filter(p => p.rank <= 2)
    
    layers.push(
      new ScatterplotLayer({
        id: 'major-ports',
        data: majorPorts,
        
        getPosition: (d: Port) => [d.longitude, d.latitude],
        getRadius: (d: Port) => {
          // Size based on throughput and rank
          const baseRadius = d.rank === 1 ? 8000 : 5000
          const throughputFactor = Math.sqrt(d.monthlyThroughput / 1000) // Normalize by 1000 TEU
          return baseRadius + (throughputFactor * 2000)
        },
        radiusMinPixels: 6,
        radiusMaxPixels: 25,
        
        // Port styling
        getFillColor: (d: Port) => {
          if (d.rank === 1) return [255, 200, 0, 200]    // Gold for major ports
          if (d.rank === 2) return [192, 192, 192, 180]  // Silver for secondary ports
          return [205, 133, 63, 160]                      // Bronze for minor ports
        },
        
        // Subtle halo
        stroked: true,
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 3,
        
        // Interaction
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 150],
        
        updateTriggers: {
          getFillColor: 'port-rank',
          getRadius: 'throughput'
        }
      })
    )
  }
  
  // 4. Real-time Vessel Positions (at high zoom only)
  if (zoom >= 7 && vessels.length > 0) {
    // Show individual vessels at detailed zoom levels
    const recentVessels = vessels
      .filter(v => Date.now() - v.timestamp.getTime() < 3600000) // Last hour only
      .slice(0, 500) // Limit for performance
    
    layers.push(
      new ScatterplotLayer({
        id: 'vessel-positions',
        data: recentVessels,
        
        getPosition: (d: VesselPosition) => [d.longitude, d.latitude],
        getRadius: () => 500, // 500m radius
        radiusMinPixels: 2,
        radiusMaxPixels: 6,
        
        // Vessel type color coding
        getFillColor: (d: VesselPosition) => {
          switch (d.vesselType.toLowerCase()) {
            case 'container': return [30, 144, 255, 200]   // Dodger blue
            case 'tanker': return [255, 140, 0, 200]       // Dark orange
            case 'bulk': return [128, 128, 128, 200]       // Gray
            case 'cruise': return [255, 20, 147, 200]      // Deep pink
            default: return [169, 169, 169, 200]           // Light gray
          }
        },
        
        // Movement indication
        stroked: true,
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        
        // Opacity based on speed (moving vessels more visible)
        getOpacity: (d: VesselPosition) => Math.min(1, 0.3 + (d.speed / 30)),
        
        pickable: true,
        autoHighlight: true
      })
    )
  }
  
  return layers
}

/**
 * Generate sample shipping lanes data for major routes
 */
export function generateMajorShippingLanes(): ShippingLane[] {
  return [
    {
      id: 'transatlantic-north',
      name: 'North Atlantic Route',
      coordinates: [
        [-74.0, 40.7],   // New York
        [-50.0, 45.0],   // Mid-Atlantic
        [-25.0, 50.0],   // Approach Europe
        [0.0, 51.5]      // London
      ],
      dailyVessels: 150,
      cargoValue: 50000000, // $50M daily
      direction: 'bidirectional'
    },
    {
      id: 'transatlantic-central',
      name: 'Central Atlantic Route', 
      coordinates: [
        [-80.0, 26.0],   // Miami
        [-40.0, 30.0],   // Mid-Atlantic
        [-10.0, 35.0],   // Approach Europe
        [5.0, 43.0]      // Mediterranean
      ],
      dailyVessels: 120,
      cargoValue: 35000000, // $35M daily
      direction: 'bidirectional'
    },
    {
      id: 'europe-caribbean',
      name: 'Europe-Caribbean Route',
      coordinates: [
        [0.0, 51.0],     // English Channel
        [-20.0, 40.0],   // Off Portugal
        [-40.0, 25.0],   // Mid-Atlantic
        [-65.0, 18.0]    // Caribbean
      ],
      dailyVessels: 80,
      cargoValue: 25000000, // $25M daily
      direction: 'bidirectional'
    }
  ]
}

/**
 * Simple land mask function (can be enhanced with actual coastline data)
 */
export function createSimpleLandMask(): (lat: number, lon: number) => boolean {
  return (lat: number, lon: number): boolean => {
    // Very simplified land detection
    // In production, use actual coastline polygons
    
    // North America
    if (lat > 25 && lat < 70 && lon > -130 && lon < -60) return true
    
    // Europe
    if (lat > 35 && lat < 70 && lon > -10 && lon < 40) return true
    
    // Africa (rough)
    if (lat > -35 && lat < 35 && lon > -20 && lon < 50) return true
    
    // Asia (very rough)
    if (lat > -10 && lat < 70 && lon > 60 && lon < 180) return true
    
    // Australia
    if (lat > -45 && lat < -10 && lon > 110 && lon < 155) return true
    
    // Default to ocean
    return false
  }
}