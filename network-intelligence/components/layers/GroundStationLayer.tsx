'use client'

import { ScatterplotLayer, TextLayer, IconLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'

export interface GroundStation {
  id: string
  name: string
  operator: string  // Now supports any operator name
  latitude: number
  longitude: number
  country?: string
  city?: string
  state?: string
  
  // Operational metrics
  utilization: number        // 0-100 percentage
  revenue: number           // monthly $M
  profit: number            // monthly $M
  margin: number            // 0-1 percentage
  confidence: number        // 0-1 data confidence
  
  // Technical specifications
  serviceModel?: 'Traditional' | 'GSaaS' | 'Direct-to-Consumer' | 'Hybrid'
  networkType?: 'LEO' | 'MEO' | 'GEO' | 'Multi-orbit'
  frequencyBands?: string[]
  antennaCount?: number
  
  // Technical metrics
  satellitesVisible?: number
  avgPassDuration?: number  // minutes
  dataCapacity?: number     // Gbps
  
  // Strategic analysis
  certifications?: string[]
  opportunities?: string[]
  risks?: string[]
  dataSource?: 'FCC' | 'ITU' | 'Public' | 'Industry' | 'Community'
  lastUpdated?: string
  isActive: boolean
  
  // Add empirical scoring if available
  empiricalScore?: number
  empiricalConfidence?: number
}

interface GroundStationLayerProps {
  stations: GroundStation[]
  visible: boolean
  onHover?: (station: GroundStation | null) => void
  onClick?: (station: GroundStation) => void
  showLabels?: boolean
  mode?: string
  layer?: string
}

// SVG satellite dish icon as data URI
const SATELLITE_DISH_ICON = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white">
    <path d="M192 32c0-17.7 14.3-32 32-32C383.1 0 512 128.9 512 288c0 17.7-14.3 32-32 32s-32-14.3-32-32C448 164.3 347.7 64 224 64c-17.7 0-32-14.3-32-32zM60.6 220.6L164.7 324.7l28.4-28.4c-.7-2.6-1.1-5.4-1.1-8.3c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32c-2.9 0-5.6-.4-8.3-1.1l-28.4 28.4L291.4 451.4c14.5 14.5 11.8 38.8-7.3 46.3C260.5 506.9 234.9 512 208 512C93.1 512 0 418.9 0 304c0-26.9 5.1-52.5 14.4-76.1c7.5-19 31.8-21.8 46.3-7.3zM224 96c106 0 192 86 192 192c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-70.7-57.3-128-128-128c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
  </svg>
`)

/**
 * Get profitability color based on margin
 */
function getProfitabilityColor(margin: number, alpha: number = 200): [number, number, number, number] {
  if (margin > 0.30) return [34, 197, 94, alpha]      // Bright green - Excellent
  if (margin > 0.25) return [74, 222, 128, alpha]     // Green - Very good
  if (margin > 0.20) return [134, 239, 172, alpha]    // Light green - Good
  if (margin > 0.15) return [187, 247, 208, alpha]    // Pale green - Above average
  if (margin > 0.10) return [254, 240, 138, alpha]    // Light yellow - Average
  if (margin > 0.05) return [253, 224, 71, alpha]     // Yellow - Below average
  if (margin > 0) return [251, 191, 36, alpha]        // Orange-yellow - Marginal
  if (margin > -0.05) return [251, 146, 60, alpha]    // Orange - Small loss
  if (margin > -0.10) return [239, 68, 68, alpha]     // Red - Loss
  return [127, 29, 29, alpha]                         // Dark red - Major loss
}

/**
 * Professional ground station visualization with satellite dish icons and soft radial gradients
 * Visual encoding: 
 * - Icon: Satellite dish from Font Awesome
 * - Ring size: Utilization percentage with soft radial gradient
 * - Ring color: Profitability
 * - Gradient: 0% opacity at center, fading to 100% at utilization edge
 */
export function createGroundStationLayers({
  stations,
  visible,
  onHover,
  onClick,
  showLabels = true,
  mode = 'operations',
  layer = 'operations'
}: GroundStationLayerProps): Layer[] {
  if (!visible || stations.length === 0) return []

  const layers: Layer[] = []
  
  // Filter stations based on view
  // In operations mode, only show SES stations (including merged Intelsat)
  // In other modes, show all active stations
  const activeStations = stations.filter(s => {
    if (!s.isActive) return false
    if (layer === 'operations') {
      // Only show SES stations in operations view (Intelsat is now part of SES)
      return s.operator === 'SES' || s.operator === 'Intelsat'
    }
    return true
  })
  
  // Layer 1: 100% Utilization Reference Rings (thin outer border)
  layers.push(
    new ScatterplotLayer({
      id: 'ground-stations-100-percent-rings',
      data: activeStations,
      
      // Position
      getPosition: (d: GroundStation) => [d.longitude, d.latitude],
      
      // Fixed size representing 100% capacity - MUCH SMALLER
      getRadius: () => 15000, // Reduced from 25000
      radiusMinPixels: 40,    // Reduced from 60
      radiusMaxPixels: 100,   // Reduced from 150
      
      // Thin gray border
      filled: false,
      stroked: true,
      getLineColor: [150, 150, 150, 60], // Light gray, semi-transparent
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 1.5,
      
      // Non-interactive
      pickable: false,
      
      updateTriggers: {
        getRadius: [mode, layer]
      }
    })
  )
  
  // Layer 2: FIXED Radial Gradient - Opaque at EDGE, Transparent at CENTER
  // Create multiple overlapping circles with proper opacity gradient
  const gradientRings = [
    { fraction: 1.0, strokeOpacity: 200, fillOpacity: 0 },   // Outermost ring - strong stroke, no fill
    { fraction: 0.85, strokeOpacity: 120, fillOpacity: 40 }, // 85% radius - fading stroke
    { fraction: 0.7, strokeOpacity: 60, fillOpacity: 30 },   // 70% radius - lighter
    { fraction: 0.55, strokeOpacity: 30, fillOpacity: 20 },  // 55% radius - very light
    { fraction: 0.4, strokeOpacity: 10, fillOpacity: 10 },   // 40% radius - barely visible
    { fraction: 0.25, strokeOpacity: 0, fillOpacity: 5 },    // 25% radius - fill only
    { fraction: 0.1, strokeOpacity: 0, fillOpacity: 0 }      // Inner area - fully transparent
  ]
  
  // Draw rings from largest to smallest for proper layering
  gradientRings.forEach((ring, index) => {
    layers.push(
      new ScatterplotLayer({
        id: `ground-stations-gradient-ring-${index}`,
        data: activeStations,
        
        // Position
        getPosition: (d: GroundStation) => [d.longitude, d.latitude],
        
        // Size based on utilization percentage and ring fraction
        getRadius: (d: GroundStation) => {
          const baseRadius = 15000 // Reduced from 25000
          const utilizationFraction = d.utilization / 100
          return baseRadius * utilizationFraction * ring.fraction
        },
        
        // Sizing constraints - MUCH SMALLER
        radiusMinPixels: 40 * ring.fraction,   // Reduced from 60
        radiusMaxPixels: 100 * ring.fraction,  // Reduced from 150
        
        // FIXED: Proper gradient - opaque at edge, transparent at center
        getFillColor: (d: GroundStation) => {
          const baseColor = getProfitabilityColor(d.margin, 255)
          // Fill is stronger for outer rings, transparent for inner
          return [baseColor[0], baseColor[1], baseColor[2], ring.fillOpacity]
        },
        
        // Stroke is strongest at edge, fades toward center
        filled: ring.fillOpacity > 0,
        stroked: ring.strokeOpacity > 0,
        getLineColor: (d: GroundStation) => {
          const baseColor = getProfitabilityColor(d.margin, 255)
          return [baseColor[0], baseColor[1], baseColor[2], ring.strokeOpacity]
        },
        lineWidthMinPixels: index === 0 ? 2 : 1,
        lineWidthMaxPixels: index === 0 ? 2.5 : 1.5,
        
        // Only outermost ring is interactive
        pickable: index === 0,
        onHover: index === 0 ? (info) => onHover?.(info.object) : undefined,
        onClick: index === 0 ? (info) => onClick?.(info.object) : undefined,
        
        updateTriggers: {
          getFillColor: [mode, layer],
          getRadius: [mode, layer]
        }
      })
    )
  })
  
  // Layer 3: Satellite Dish Icons - SMALLER
  layers.push(
    new IconLayer({
      id: 'ground-stations-satellite-dishes',
      data: activeStations,
      
      // Position
      getPosition: (d: GroundStation) => [d.longitude, d.latitude],
      
      // Icon configuration
      getIcon: () => ({
        url: SATELLITE_DISH_ICON,
        width: 128,
        height: 128,
        anchorY: 64
      }),
      
      // Size - REDUCED
      getSize: 18,  // Reduced from 24
      sizeScale: 1,
      sizeMinPixels: 14,  // Reduced from 20
      sizeMaxPixels: 22,  // Reduced from 32
      
      // Color
      getColor: [255, 255, 255, 255], // White icons
      
      // Interaction
      pickable: true,
      onHover: (info) => onHover?.(info.object),
      onClick: (info) => onClick?.(info.object),
      
      // Billboard for consistent size
      billboard: false,
      
      updateTriggers: {
        getColor: [mode, layer]
      }
    })
  )
  
  // Layer 4: Station Labels (only for major stations at high zoom)
  if (showLabels) {
    const majorStations = activeStations.filter(s => 
      s.revenue > 10 || // High revenue stations
      s.margin > 0.20 || // High margin stations
      s.utilization > 90 // High utilization stations
    )
    
    layers.push(
      new TextLayer({
        id: 'ground-stations-labels',
        data: majorStations,
        
        getPosition: (d: GroundStation) => [d.longitude, d.latitude],
        getText: (d: GroundStation) => d.name,
        getSize: 10,  // Reduced from 11
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 200],
        backgroundPadding: [5, 2, 5, 2],  // Reduced padding
        getPixelOffset: [0, -45], // Adjusted for smaller circles
        
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 500,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'bottom' as const,
        
        pickable: false,
        billboard: true,
        
        // Only show labels at higher zoom levels
        visible: true
      })
    )
  }
  
  return layers
}

/**
 * Get performance color for legends and UI
 */
export function getPerformanceColor(margin: number): [number, number, number] {
  if (margin > 0.30) return [34, 197, 94]    // Bright green
  if (margin > 0.20) return [74, 222, 128]   // Green
  if (margin > 0.10) return [254, 240, 138]  // Yellow
  if (margin > 0) return [251, 191, 36]      // Orange
  return [239, 68, 68]                       // Red
}

/**
 * Get performance label for UI
 */
export function getPerformanceLabel(margin: number): string {
  if (margin > 0.30) return 'Excellent'
  if (margin > 0.20) return 'Very Good'
  if (margin > 0.10) return 'Good'
  if (margin > 0.05) return 'Average'
  if (margin > 0) return 'Marginal'
  return 'Loss'
}