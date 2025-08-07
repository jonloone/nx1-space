/**
 * Glowing Ground Station Layer
 * Creates a multi-layer effect with glow, main circle, and bright core
 */

import { CompositeLayer } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import type { Station } from '@/lib/services/stationDataService'

interface GlowingStationLayerProps {
  data: Station[]
  analysisMode?: 'utilization' | 'profit' | 'opportunities' | 'maritime'
  pickable?: boolean
  onHover?: (info: any) => void
  onClick?: (info: any) => void
  visible?: boolean
}

export class GlowingStationLayer extends CompositeLayer<GlowingStationLayerProps> {
  static layerName = 'GlowingStationLayer'
  static defaultProps = {
    pickable: true,
    visible: true,
    analysisMode: 'utilization'
  }

  renderLayers() {
    const { data, analysisMode, pickable, onHover, onClick, visible } = this.props
    
    if (!visible || !data || data.length === 0) return []
    
    return [
      // Outer glow effect layer (largest, most transparent)
      new ScatterplotLayer({
        id: 'station-glow-outer',
        data,
        getPosition: (d: Station) => [d.longitude, d.latitude],
        getRadius: (d: Station) => this.getStationRadius(d, analysisMode) * 2,
        getFillColor: (d: Station) => [...this.getStationColor(d, analysisMode).slice(0, 3), 30],
        getLineColor: [0, 0, 0, 0],
        radiusMinPixels: 30,
        radiusMaxPixels: 120,
        radiusScale: 2000,
        opacity: 0.3,
        pickable: false
      }),
      
      // Middle glow effect layer
      new ScatterplotLayer({
        id: 'station-glow-middle',
        data,
        getPosition: (d: Station) => [d.longitude, d.latitude],
        getRadius: (d: Station) => this.getStationRadius(d, analysisMode) * 1.5,
        getFillColor: (d: Station) => [...this.getStationColor(d, analysisMode).slice(0, 3), 50],
        getLineColor: [0, 0, 0, 0],
        radiusMinPixels: 25,
        radiusMaxPixels: 100,
        radiusScale: 2000,
        opacity: 0.4,
        pickable: false
      }),
      
      // Main station circle with border
      new ScatterplotLayer({
        id: 'station-main',
        data,
        getPosition: (d: Station) => [d.longitude, d.latitude],
        getRadius: (d: Station) => this.getStationRadius(d, analysisMode),
        getFillColor: (d: Station) => this.getStationColor(d, analysisMode),
        getLineColor: (d: Station) => this.getStationBorderColor(d),
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 3,
        radiusMinPixels: 15,
        radiusMaxPixels: 60,
        radiusScale: 2000,
        pickable,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        onHover,
        onClick
      }),
      
      // Inner bright core
      new ScatterplotLayer({
        id: 'station-core',
        data,
        getPosition: (d: Station) => [d.longitude, d.latitude],
        getRadius: (d: Station) => this.getStationRadius(d, analysisMode) * 0.4,
        getFillColor: (d: Station) => this.getBrightCoreColor(d, analysisMode),
        getLineColor: [0, 0, 0, 0],
        radiusMinPixels: 6,
        radiusMaxPixels: 25,
        radiusScale: 2000,
        opacity: 0.95,
        pickable: false
      }),
      
      // Station labels (only for zoom > 4)
      new TextLayer({
        id: 'station-labels',
        data,
        getPosition: (d: Station) => [d.longitude, d.latitude],
        getText: (d: Station) => d.name,
        getSize: 12,
        getColor: [255, 255, 255, 200],
        getPixelOffset: [0, 20],
        billboard: true,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 600,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'top',
        visible: this.context.viewport.zoom > 4
      })
    ]
  }
  
  getStationRadius(station: Station, analysisMode?: string): number {
    const baseRadius = 40 // Base radius in meters
    
    switch(analysisMode) {
      case 'utilization':
        // Scale by utilization (40-90% -> radius multiplier 1-2)
        const utilization = station.utilization || 50
        return baseRadius * (0.5 + (utilization / 100) * 1.5)
        
      case 'profit':
        // Scale by profit margin
        const margin = station.margin || 0
        const marginFactor = Math.max(0.5, 1 + (margin / 100))
        return baseRadius * marginFactor
        
      case 'opportunities':
        // Scale by opportunity score
        const score = station.opportunityScore || 0.5
        return baseRadius * (0.5 + score * 1.5)
        
      case 'maritime':
        // Fixed size for maritime view
        return baseRadius * 1.2
        
      default:
        return baseRadius
    }
  }
  
  getStationColor(station: Station, analysisMode?: string): [number, number, number, number] {
    // Different colors for competitors
    if (station.operator !== 'SES') {
      const operatorColors: Record<string, [number, number, number, number]> = {
        'AWS': [255, 153, 0, 200],      // Orange
        'Telesat': [156, 39, 176, 200], // Purple
        'SpaceX': [0, 188, 212, 200],   // Cyan
        'KSAT': [255, 235, 59, 200],    // Yellow
        'Viasat': [103, 58, 183, 200],  // Deep Purple
        'Eutelsat': [33, 150, 243, 200], // Blue
        'OneWeb': [76, 175, 80, 200],   // Green
        'default': [158, 158, 158, 200] // Gray
      }
      return operatorColors[station.operator] || operatorColors.default
    }
    
    // SES stations colored by performance
    switch(analysisMode) {
      case 'utilization':
        const utilization = station.utilization || 50
        if (utilization >= 80) return [34, 197, 94, 220]   // Green - high utilization
        if (utilization >= 60) return [251, 191, 36, 220]  // Yellow - moderate
        if (utilization >= 40) return [251, 146, 60, 220]  // Orange - low
        return [239, 68, 68, 220]                           // Red - critical
        
      case 'profit':
        const margin = station.margin || 0
        if (margin >= 25) return [34, 197, 94, 220]    // Green - high margin
        if (margin >= 10) return [59, 130, 246, 220]   // Blue - good margin
        if (margin >= 0) return [251, 191, 36, 220]    // Yellow - low margin
        return [239, 68, 68, 220]                       // Red - negative margin
        
      case 'opportunities':
        const score = station.opportunityScore || 0.5
        if (score >= 0.75) return [147, 51, 234, 220]  // Purple - high opportunity
        if (score >= 0.5) return [59, 130, 246, 220]   // Blue - medium opportunity
        if (score >= 0.25) return [251, 191, 36, 220]  // Yellow - low opportunity
        return [156, 163, 175, 220]                     // Gray - minimal opportunity
        
      case 'maritime':
        return [0, 150, 199, 220] // Teal for maritime
        
      default:
        return [59, 130, 246, 220] // Default blue
    }
  }
  
  getStationBorderColor(station: Station): [number, number, number, number] {
    // Critical stations get red border
    if (station.status === 'critical') return [255, 0, 0, 255]
    
    // Competitor stations get white border
    if (station.operator !== 'SES') return [255, 255, 255, 100]
    
    // Default white border for SES
    return [255, 255, 255, 200]
  }
  
  getBrightCoreColor(station: Station, analysisMode?: string): [number, number, number, number] {
    const baseColor = this.getStationColor(station, analysisMode)
    // Brighten the color for the core (increase each RGB component)
    return [
      Math.min(255, baseColor[0] + 80),
      Math.min(255, baseColor[1] + 80),
      Math.min(255, baseColor[2] + 80),
      250
    ]
  }
}

export const createGlowingStationLayer = (props: GlowingStationLayerProps) => {
  return new GlowingStationLayer(props)
}