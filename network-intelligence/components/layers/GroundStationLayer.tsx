'use client'

import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'

export interface GroundStation {
  id: string
  name: string
  operator: 'SES' | 'Intelsat' | 'Other'
  latitude: number
  longitude: number
  
  // Operational metrics
  utilization: number        // 0-100 percentage
  revenue: number           // monthly $M
  profit: number            // monthly $M
  margin: number            // 0-1 percentage
  confidence: number        // 0-1 data confidence
  
  // Technical metrics
  satellitesVisible?: number
  avgPassDuration?: number  // minutes
  dataCapacity?: number     // Gbps
  
  // Analysis
  opportunities?: string[]
  risks?: string[]
  isActive: boolean
}

interface GroundStationLayerProps {
  stations: GroundStation[]
  visible: boolean
  onHover?: (station: GroundStation | null) => void
  onClick?: (station: GroundStation) => void
  showLabels?: boolean
  mode?: 'operations' | 'opportunities'
}

/**
 * Professional ground station visualization with performance-based halos
 * Visual encoding: size=revenue, color=profitability, halo=confidence
 */
export function createGroundStationLayers({
  stations,
  visible,
  onHover,
  onClick,
  showLabels = true,
  mode = 'operations'
}: GroundStationLayerProps): Layer[] {
  if (!visible || stations.length === 0) return []

  const layers: Layer[] = []
  
  // Filter to active stations only
  const activeStations = stations.filter(s => s.isActive)
  
  // Main station markers with performance halos
  layers.push(
    new ScatterplotLayer({
      id: 'ground-stations-main',
      data: activeStations,
      
      // Position
      getPosition: (d: GroundStation) => [d.longitude, d.latitude],
      
      // Size encoding: Based on revenue/importance
      getRadius: (d: GroundStation) => {
        // Logarithmic scaling for revenue (1M-100M range)
        const minRadius = 2000   // 2km base radius
        const maxRadius = 15000  // 15km max radius
        const logRevenue = Math.log10(Math.max(d.revenue, 0.1))
        const logMin = Math.log10(0.1)  // $100K minimum
        const logMax = Math.log10(100)  // $100M maximum
        
        const normalizedRevenue = (logRevenue - logMin) / (logMax - logMin)
        return minRadius + (normalizedRevenue * (maxRadius - minRadius))
      },
      radiusMinPixels: 8,
      radiusMaxPixels: 50,
      
      // Color encoding: Performance indicator
      getFillColor: (d: GroundStation) => {
        if (d.margin > 0.25) return [34, 197, 94, 200]   // Green - Highly profitable (>25% margin)
        if (d.margin > 0.10) return [132, 204, 22, 200]  // Light green - Good profit (10-25%)
        if (d.margin > 0) return [251, 191, 36, 200]     // Yellow - Marginal (0-10%)
        if (d.margin > -0.10) return [249, 115, 22, 200] // Orange - Small loss (0-10% loss)
        return [239, 68, 68, 200]                         // Red - Major loss (>10% loss)
      },
      
      // Halo effect: Confidence level
      stroked: true,
      getLineColor: (d: GroundStation) => {
        // Use same color as fill but with confidence-based opacity
        const fillColor = d.margin > 0.25 ? [34, 197, 94] :
                         d.margin > 0.10 ? [132, 204, 22] :
                         d.margin > 0 ? [251, 191, 36] :
                         d.margin > -0.10 ? [249, 115, 22] :
                         [239, 68, 68]
        
        const confidence = Math.max(0.3, d.confidence) // Minimum 30% opacity
        return [...fillColor, Math.round(confidence * 100)]
      },
      getLineWidth: (d: GroundStation) => {
        // Wider halo for higher confidence
        return Math.round(d.confidence * 8) + 2  // 2-10 pixel range
      },
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 12,
      
      // Opacity based on confidence
      getOpacity: (d: GroundStation) => Math.max(0.6, d.confidence),
      
      // Interaction
      pickable: true,
      onHover: (info) => onHover?.(info.object),
      onClick: (info) => onClick?.(info.object),
      
      // Performance
      updateTriggers: {
        getFillColor: [mode],
        getRadius: [mode],
        getLineColor: [mode]
      }
    })
  )
  
  // Station labels (for major stations)
  if (showLabels) {
    const majorStations = activeStations.filter(s => s.revenue > 5 || s.margin > 0.15) // >$5M or >15% margin
    
    layers.push(
      new TextLayer({
        id: 'ground-stations-labels',
        data: majorStations,
        
        getPosition: (d: GroundStation) => [d.longitude, d.latitude],
        getText: (d: GroundStation) => `${d.name}\n${d.operator}`,
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [8, 4, 8, 4],
        getPixelOffset: [0, -35],
        
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'bottom' as const,
        
        pickable: false,
        billboard: true,
        
        // Only show labels at higher zoom levels
        visible: true
      })
    )
  }
  
  // Opportunities mode: Add competitor stations
  if (mode === 'opportunities') {
    const competitorStations = stations.filter(s => s.operator === 'Other' && s.isActive)
    
    if (competitorStations.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'competitor-stations',
          data: competitorStations,
          
          getPosition: (d: GroundStation) => [d.longitude, d.latitude],
          getRadius: (d: GroundStation) => Math.sqrt(d.revenue) * 2000,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          
          // Competitor styling (gray with red outline)
          getFillColor: [128, 128, 128, 150],
          stroked: true,
          getLineColor: [239, 68, 68, 200],
          lineWidthMinPixels: 2,
          
          pickable: true,
          onHover: (info) => onHover?.(info.object),
          onClick: (info) => onClick?.(info.object)
        })
      )
    }
  }
  
  return layers
}

/**
 * Get performance color for legends and UI
 */
export function getPerformanceColor(margin: number): [number, number, number] {
  if (margin > 0.25) return [34, 197, 94]    // Green
  if (margin > 0.10) return [132, 204, 22]   // Light green
  if (margin > 0) return [251, 191, 36]      // Yellow
  if (margin > -0.10) return [249, 115, 22]  // Orange
  return [239, 68, 68]                        // Red
}

/**
 * Get performance label for UI
 */
export function getPerformanceLabel(margin: number): string {
  if (margin > 0.25) return 'Highly Profitable'
  if (margin > 0.10) return 'Profitable'
  if (margin > 0) return 'Marginal'
  if (margin > -0.10) return 'Minor Loss'
  return 'Major Loss'
}