'use client'

import React, { useMemo } from 'react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'
import { maritimeHotSpotDetector } from '../../lib/analysis/maritime-hotspot-detector'

interface MaritimePoint {
  latitude: number
  longitude: number
  vesselCount: number
  avgSpeed: number
  avgSize: number
}

interface HotSpot {
  center: [number, number]  // [lon, lat]
  radius: number            // km
  zScore: number           // Statistical significance
  pValue: number          // Probability value
  confidence: number      // Confidence level (0-1)
  vesselDensity: number   // Vessels per sq km
  type: 'hot' | 'cold' | 'neutral'
  temporalTrend: 'growing' | 'stable' | 'declining'
}

interface MaritimeHotspotLayerProps {
  maritimeData: MaritimePoint[]
  visible: boolean
  onHover?: (hotspot: HotSpot | null) => void
  onClick?: (hotspot: HotSpot) => void
  showLabels?: boolean
  showHeatmap?: boolean
  showHotspots?: boolean
  isGlobeView?: boolean
}

/**
 * Get color for hotspot based on z-score and type
 */
function getHotspotColor(hotspot: HotSpot, alpha: number = 200): [number, number, number, number] {
  const absZ = Math.abs(hotspot.zScore)
  
  if (hotspot.type === 'hot') {
    // Red/orange gradient for hot spots
    if (absZ > 3) return [220, 38, 127, alpha]     // Hot pink - extremely significant
    if (absZ > 2.5) return [239, 68, 68, alpha]   // Red - very significant
    if (absZ > 2) return [251, 146, 60, alpha]    // Orange - significant
    return [251, 191, 36, alpha]                  // Yellow-orange - moderate
  } else if (hotspot.type === 'cold') {
    // Blue gradient for cold spots
    if (absZ > 3) return [30, 58, 138, alpha]     // Dark blue - extremely significant
    if (absZ > 2.5) return [59, 130, 246, alpha] // Blue - very significant
    if (absZ > 2) return [96, 165, 250, alpha]   // Light blue - significant
    return [147, 197, 253, alpha]                 // Pale blue - moderate
  }
  
  // Neutral (shouldn't happen with our filtering, but just in case)
  return [156, 163, 175, alpha] // Gray
}

/**
 * Get trend indicator icon
 */
function getTrendIcon(trend: 'growing' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'growing': return '📈'
    case 'declining': return '📉'
    case 'stable': return '➡️'
  }
}

/**
 * Create maritime hotspot visualization layers
 */
export function createMaritimeHotspotLayers({
  maritimeData,
  visible,
  onHover,
  onClick,
  showLabels = true,
  showHeatmap = true,
  showHotspots = true,
  isGlobeView = false
}: MaritimeHotspotLayerProps): Layer[] {
  if (!visible || maritimeData.length === 0) return []

  // Detect hotspots using the maritime hotspot detector
  const hotspots = useMemo(() => {
    return maritimeHotSpotDetector.detectHotSpots(maritimeData)
  }, [maritimeData])

  const layers: Layer[] = []

  // Layer 1: Heatmap showing raw maritime traffic density
  if (showHeatmap) {
    layers.push(
      new HeatmapLayer({
        id: 'maritime-heatmap',
        data: maritimeData,
        getPosition: (d: MaritimePoint) => [d.longitude, d.latitude],
        getWeight: (d: MaritimePoint) => d.vesselCount,
        radiusPixels: isGlobeView ? 25 : 40,
        intensity: 0.8,
        threshold: 0.1,
        colorRange: [
          [255, 255, 178, 25],   // Very light yellow - low density
          [254, 217, 118, 85],   // Light orange - moderate density  
          [254, 178, 76, 127],   // Orange - higher density
          [253, 141, 60, 170],   // Dark orange - high density
          [240, 59, 32, 200],    // Red - very high density
          [189, 0, 38, 255]      // Dark red - maximum density
        ],
        pickable: false
      })
    )
  }

  // Layer 2: Hotspot circles showing statistical significance
  if (showHotspots && hotspots.length > 0) {
    // Main hotspot circles
    layers.push(
      new ScatterplotLayer({
        id: 'maritime-hotspots',
        data: hotspots,
        
        getPosition: (d: HotSpot) => d.center,
        getRadius: (d: HotSpot) => d.radius * 1000, // Convert km to meters
        
        getFillColor: (d: HotSpot) => getHotspotColor(d, Math.floor(d.confidence * 120)),
        getLineColor: (d: HotSpot) => getHotspotColor(d, 255),
        
        filled: true,
        stroked: true,
        
        radiusMinPixels: isGlobeView ? 15 : 25,
        radiusMaxPixels: isGlobeView ? 60 : 100,
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 3,
        
        pickable: true,
        onHover: (info) => onHover?.(info.object),
        onClick: (info) => onClick?.(info.object),
        
        updateTriggers: {
          getFillColor: hotspots,
          getLineColor: hotspots,
          getRadius: hotspots
        }
      })
    )

    // Confidence rings - outer rings showing statistical confidence
    layers.push(
      new ScatterplotLayer({
        id: 'maritime-hotspot-confidence-rings',
        data: hotspots.filter(h => h.confidence > 0.9), // Only highly confident hotspots
        
        getPosition: (d: HotSpot) => d.center,
        getRadius: (d: HotSpot) => d.radius * 1000 * 1.3, // Slightly larger than main circle
        
        getFillColor: [0, 0, 0, 0], // Transparent fill
        getLineColor: (d: HotSpot) => {
          const baseColor = getHotspotColor(d, 255)
          return [baseColor[0], baseColor[1], baseColor[2], 100] // Semi-transparent
        },
        
        filled: false,
        stroked: true,
        
        radiusMinPixels: isGlobeView ? 20 : 35,
        radiusMaxPixels: isGlobeView ? 80 : 130,
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 2,
        
        pickable: false,
        
        updateTriggers: {
          getLineColor: hotspots
        }
      })
    )
  }

  // Layer 3: Hotspot labels and trend indicators
  if (showLabels && hotspots.length > 0) {
    // Main labels
    layers.push(
      new TextLayer({
        id: 'maritime-hotspot-labels',
        data: hotspots.filter(h => h.confidence > 0.8), // Only show labels for high-confidence hotspots
        
        getPosition: (d: HotSpot) => d.center,
        getText: (d: HotSpot) => {
          const significance = Math.abs(d.zScore) > 3 ? 'Very High' : 
                              Math.abs(d.zScore) > 2.5 ? 'High' : 'Moderate'
          return `${d.type.toUpperCase()} SPOT\n${significance}`
        },
        
        getSize: isGlobeView ? 10 : 12,
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 180],
        
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        
        background: true,
        backgroundPadding: [4, 2],
        getPixelOffset: [0, 0],
        
        pickable: false,
        billboard: true
      })
    )

    // Trend indicators as separate text layer
    layers.push(
      new TextLayer({
        id: 'maritime-hotspot-trends',
        data: hotspots.filter(h => h.confidence > 0.8),
        
        getPosition: (d: HotSpot) => d.center,
        getText: (d: HotSpot) => getTrendIcon(d.temporalTrend),
        
        getSize: isGlobeView ? 16 : 20,
        getColor: [255, 255, 255, 255],
        
        fontFamily: 'system-ui, -apple-system, sans-serif',
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        
        getPixelOffset: [25, -15], // Offset to top-right of main label
        
        pickable: false,
        billboard: true
      })
    )
  }

  return layers
}

/**
 * Get hotspot significance level for UI
 */
export function getHotspotSignificanceLevel(zScore: number): string {
  const absZ = Math.abs(zScore)
  if (absZ > 3) return 'Extremely Significant'
  if (absZ > 2.5) return 'Very Significant'
  if (absZ > 2) return 'Significant'
  if (absZ > 1.96) return 'Statistically Significant'
  return 'Not Significant'
}

/**
 * Get hotspot confidence description for UI
 */
export function getHotspotConfidenceDescription(confidence: number): string {
  if (confidence > 0.99) return 'Very High Confidence'
  if (confidence > 0.95) return 'High Confidence'
  if (confidence > 0.90) return 'Good Confidence'
  if (confidence > 0.80) return 'Moderate Confidence'
  return 'Low Confidence'
}

/**
 * Default export for React component usage
 */
export const MaritimeHotspotLayer: React.FC<MaritimeHotspotLayerProps> = (props) => {
  const layers = createMaritimeHotspotLayers(props)
  return null // This is just a layer factory, not a visual component
}

export default MaritimeHotspotLayer