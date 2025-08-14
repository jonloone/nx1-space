'use client'

import { ScatterplotLayer, PathLayer, TextLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'
import * as satellite from 'satellite.js'

export interface SatelliteData {
  id: string
  name: string
  operator: string
  position: [number, number, number] // [longitude, latitude, altitude]
  velocity?: [number, number, number]
  noradId?: string
  constellation?: string
  type?: 'GEO' | 'MEO' | 'LEO'
}

export interface OrbitPath {
  id: string
  path: [number, number, number][]
  color: [number, number, number, number]
}

interface SatelliteLayerProps {
  satellites: SatelliteData[]
  orbits?: OrbitPath[]
  visible: boolean
  onHover?: (satellite: SatelliteData | null) => void
  onClick?: (satellite: SatelliteData) => void
  showLabels?: boolean
  currentTime?: Date
}

/**
 * Creates satellite and orbit visualization layers for 3D globe view
 */
export function createSatelliteLayers({
  satellites,
  orbits = [],
  visible,
  onHover,
  onClick,
  showLabels = true,
  currentTime = new Date()
}: SatelliteLayerProps): Layer[] {
  if (!visible || satellites.length === 0) return []

  const layers: Layer[] = []

  // Orbit paths layer
  if (orbits.length > 0) {
    layers.push(
      new PathLayer({
        id: 'satellite-orbits',
        data: orbits,
        
        getPath: (d: OrbitPath) => d.path,
        getColor: (d: OrbitPath) => d.color,
        getWidth: 2,
        widthMinPixels: 1,
        widthMaxPixels: 3,
        
        pickable: false,
        billboard: false,
        jointRounded: true,
        capRounded: true,
        
        // 3D positioning
        coordinateSystem: 2, // COORDINATE_SYSTEM.LNGLAT
        coordinateOrigin: [0, 0, 0],
        modelMatrix: null
      })
    )
  }

  // Satellite positions layer
  layers.push(
    new ScatterplotLayer({
      id: 'satellite-positions',
      data: satellites,
      
      // 3D positioning with altitude
      getPosition: (d: SatelliteData) => d.position,
      coordinateSystem: 2, // COORDINATE_SYSTEM.LNGLAT
      
      // Size based on satellite type - increased for visibility
      getRadius: (d: SatelliteData) => {
        if (d.type === 'GEO') return 100000  // 100km visual radius for GEO
        if (d.type === 'MEO') return 75000   // 75km for MEO
        return 50000  // 50km for LEO
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      
      // Color based on operator
      getFillColor: (d: SatelliteData) => {
        // SES satellites in green
        if (d.operator === 'SES') return [34, 197, 94, 200]
        
        // Starlink in blue
        if (d.constellation === 'Starlink') return [59, 130, 246, 200]
        
        // OneWeb in orange
        if (d.constellation === 'OneWeb') return [251, 146, 60, 200]
        
        // Iridium in cyan
        if (d.constellation === 'Iridium' || d.constellation === 'Iridium-NEXT') 
          return [34, 211, 238, 200]
        
        // Others in purple
        return [147, 51, 234, 200]
      },
      
      // Enhanced glow effect for visibility
      stroked: true,
      getLineColor: (d: SatelliteData) => {
        const fillColor = d.operator === 'SES' ? [34, 197, 94] :
                         d.constellation === 'Starlink' ? [59, 130, 246] :
                         d.constellation === 'OneWeb' ? [251, 146, 60] :
                         d.constellation === 'Iridium' ? [34, 211, 238] :
                         [147, 51, 234]
        return [...fillColor, 255]  // Full opacity for glow
      },
      lineWidthMinPixels: 3,
      lineWidthMaxPixels: 6,
      
      // Interaction
      pickable: true,
      onHover: (info) => onHover?.(info.object),
      onClick: (info) => onClick?.(info.object)
    })
  )

  // Satellite labels for major satellites
  if (showLabels) {
    const majorSatellites = satellites.filter(s => 
      s.operator === 'SES' || 
      s.type === 'GEO' ||
      // Sample of constellation satellites
      (s.constellation && Math.random() < 0.02) // Show 2% of constellation satellites
    )
    
    layers.push(
      new TextLayer({
        id: 'satellite-labels',
        data: majorSatellites,
        
        getPosition: (d: SatelliteData) => d.position,
        getText: (d: SatelliteData) => d.name,
        getSize: 10,
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [6, 3, 6, 3],
        getPixelOffset: [0, -20],
        
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'bottom' as const,
        
        pickable: false,
        billboard: true,
        sizeUnits: 'pixels',
        coordinateSystem: 2 // COORDINATE_SYSTEM.LNGLAT
      })
    )
  }

  return layers
}

/**
 * Calculate satellite position from TLE data
 */
export function calculateSatellitePosition(
  tleLine1: string,
  tleLine2: string,
  date: Date = new Date()
): [number, number, number] {
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2)
  const positionAndVelocity = satellite.propagate(satrec, date)
  
  if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
    const gmst = satellite.gstime(date)
    const position = satellite.eciToGeodetic(positionAndVelocity.position, gmst)
    
    const longitude = satellite.degreesLong(position.longitude)
    const latitude = satellite.degreesLat(position.latitude)
    const altitude = position.height * 1000 // Convert km to meters
    
    return [longitude, latitude, altitude]
  }
  
  return [0, 0, 0]
}

/**
 * Generate orbit path for a satellite
 */
export function generateOrbitPath(
  tleLine1: string,
  tleLine2: string,
  startDate: Date,
  durationMinutes: number = 90,
  stepMinutes: number = 1
): [number, number, number][] {
  const path: [number, number, number][] = []
  const steps = Math.floor(durationMinutes / stepMinutes)
  
  for (let i = 0; i <= steps; i++) {
    const time = new Date(startDate.getTime() + i * stepMinutes * 60000)
    const position = calculateSatellitePosition(tleLine1, tleLine2, time)
    path.push(position)
  }
  
  return path
}

/**
 * Get satellite constellation color
 */
export function getConstellationColor(constellation: string): [number, number, number, number] {
  const colors: Record<string, [number, number, number, number]> = {
    'SES': [34, 197, 94, 200],          // Green
    'Starlink': [59, 130, 246, 200],    // Blue
    'OneWeb': [251, 146, 60, 200],      // Orange
    'Iridium': [34, 211, 238, 200],     // Cyan
    'Iridium-NEXT': [34, 211, 238, 200], // Cyan
    'Globalstar': [168, 85, 247, 200],  // Purple
    'Planet': [236, 72, 153, 200],      // Pink
    'Spire': [250, 204, 21, 200],       // Yellow
    'Default': [147, 51, 234, 200]      // Violet
  }
  
  return colors[constellation] || colors.Default
}