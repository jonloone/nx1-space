/**
 * Satellite Coverage Layer
 * Displays real satellite visibility and coverage from CelesTrak TLE data
 * Shows coverage circles, orbital paths, and visibility windows
 */

import { ScatterplotLayer, ArcLayer, PolygonLayer, TextLayer } from '@deck.gl/layers'
import { TLEData } from '@/lib/tle-loader'

interface SatellitePosition {
  satellite: TLEData
  position: {
    latitude: number
    longitude: number
    altitude: number
  }
  coverage: {
    radius: number // km
    elevation: number // degrees
  }
  value: number
}

export function createSatelliteCoverageLayers(
  satellites: SatellitePosition[],
  selectedSatellite?: string
) {
  const layers = []
  
  // Satellite coverage circles (footprints)
  const coveragePolygons = satellites.map(sat => {
    const points = generateCoverageCircle(
      sat.position.latitude,
      sat.position.longitude,
      sat.coverage.radius
    )
    return {
      satellite: sat.satellite,
      polygon: points,
      value: sat.value,
      altitude: sat.position.altitude
    }
  })
  
  layers.push(
    new PolygonLayer({
      id: 'satellite-coverage',
      data: coveragePolygons,
      getPolygon: (d: any) => d.polygon,
      getFillColor: (d: any) => {
        // Color by satellite type/value
        if (d.value >= 80) return [255, 215, 0, 30]      // Gold for critical
        if (d.value >= 60) return [30, 144, 255, 25]     // Blue for high-value
        if (d.value >= 40) return [50, 205, 50, 20]      // Green for medium
        return [169, 169, 169, 15]                        // Gray for standard
      },
      getLineColor: (d: any) => {
        if (d.satellite.satellite_name === selectedSatellite) {
          return [255, 255, 0, 255] // Yellow for selected
        }
        if (d.value >= 80) return [255, 215, 0, 100]
        if (d.value >= 60) return [30, 144, 255, 80]
        if (d.value >= 40) return [50, 205, 50, 60]
        return [169, 169, 169, 40]
      },
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      pickable: true,
      stroked: true,
      filled: true,
      wireframe: false,
      extruded: false
    })
  )
  
  // Satellite position markers
  layers.push(
    new ScatterplotLayer({
      id: 'satellite-positions',
      data: satellites,
      getPosition: (d: SatellitePosition) => [
        d.position.longitude,
        d.position.latitude
      ],
      getFillColor: (d: SatellitePosition) => {
        const name = d.satellite.satellite_name.toUpperCase()
        
        // Color by constellation
        if (name.includes('STARLINK')) return [100, 200, 255, 255]    // Light blue
        if (name.includes('ONEWEB')) return [255, 100, 100, 255]      // Light red
        if (name.includes('IRIDIUM')) return [100, 255, 100, 255]     // Light green
        if (name.includes('INTELSAT')) return [255, 215, 0, 255]       // Gold
        if (name.includes('SES')) return [255, 140, 0, 255]          // Dark orange
        if (name.includes('GPS')) return [128, 0, 128, 255]          // Purple
        return [200, 200, 200, 255]                                   // Light gray
      },
      getRadius: (d: SatellitePosition) => {
        // Size by altitude (GEO satellites appear larger)
        if (d.position.altitude > 35000) return 500  // GEO
        if (d.position.altitude > 8000) return 400   // MEO
        return 300                                    // LEO
      },
      radiusMinPixels: 2,
      radiusMaxPixels: 8,
      pickable: true,
      stroked: true,
      lineWidthMinPixels: 1,
      getLineColor: [255, 255, 255, 100]
    })
  )
  
  // Orbital paths (for selected satellite or high-value satellites)
  const orbitPaths = satellites
    .filter(sat => 
      sat.satellite.satellite_name === selectedSatellite || 
      sat.value >= 80
    )
    .map(sat => generateOrbitPath(sat.satellite))
  
  if (orbitPaths.length > 0) {
    layers.push(
      new ArcLayer({
        id: 'orbital-paths',
        data: orbitPaths,
        getSourcePosition: (d: any) => d.start,
        getTargetPosition: (d: any) => d.end,
        getSourceColor: (d: any) => d.color.concat([150]),
        getTargetColor: (d: any) => d.color.concat([50]),
        getWidth: 2,
        getHeight: (d: any) => d.altitude / 10000, // Normalize altitude for arc height
        widthMinPixels: 1,
        widthMaxPixels: 3
      })
    )
  }
  
  // Satellite labels for high-value or selected satellites
  const labeledSatellites = satellites.filter(sat => 
    sat.satellite.satellite_name === selectedSatellite || 
    sat.value >= 80
  )
  
  if (labeledSatellites.length > 0) {
    layers.push(
      new TextLayer({
        id: 'satellite-labels',
        data: labeledSatellites,
        getPosition: (d: SatellitePosition) => [
          d.position.longitude,
          d.position.latitude
        ],
        getText: (d: SatellitePosition) => {
          const name = d.satellite.satellite_name
          const shortName = name.length > 20 ? 
            name.substring(0, 17) + '...' : name
          return `${shortName}\n${d.position.altitude.toFixed(0)}km`
        },
        getSize: 11,
        getColor: [255, 255, 255, 255],
        getBackgroundColor: [0, 0, 0, 200],
        backgroundPadding: [3, 2],
        getPixelOffset: [0, -15],
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 500,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom'
      })
    )
  }
  
  return layers
}

/**
 * Generate coverage circle points
 */
function generateCoverageCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  points: number = 64
): [number, number][] {
  const circle: [number, number][] = []
  const radiusDeg = radiusKm / 111 // Rough conversion to degrees
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    const lat = centerLat + radiusDeg * Math.sin(angle)
    const lon = centerLon + radiusDeg * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180)
    circle.push([lon, lat])
  }
  
  return circle
}

/**
 * Generate orbital path segments
 */
function generateOrbitPath(tle: TLEData): any {
  // Simplified orbital path generation
  // In production, use proper SGP4 propagation
  
  const inclination = tle.inclination
  const raan = tle.raan
  
  // Generate a few points along the orbit
  const segments = []
  const numPoints = 8
  
  for (let i = 0; i < numPoints; i++) {
    const angle1 = (i / numPoints) * 2 * Math.PI
    const angle2 = ((i + 1) / numPoints) * 2 * Math.PI
    
    const lat1 = inclination * Math.sin(angle1)
    const lon1 = raan + (angle1 * 180 / Math.PI)
    const lat2 = inclination * Math.sin(angle2)
    const lon2 = raan + (angle2 * 180 / Math.PI)
    
    // Normalize longitude to -180 to 180
    const normLon1 = ((lon1 + 180) % 360) - 180
    const normLon2 = ((lon2 + 180) % 360) - 180
    
    segments.push({
      start: [normLon1, lat1],
      end: [normLon2, lat2],
      altitude: estimateAltitude(tle.mean_motion),
      color: getSatelliteColor(tle.satellite_name)
    })
  }
  
  return segments
}

/**
 * Estimate altitude from mean motion
 */
function estimateAltitude(meanMotion: number): number {
  const orbitalPeriod = 1440 / meanMotion // minutes
  const semiMajorAxis = Math.pow((orbitalPeriod * orbitalPeriod * 398600.4418) / (4 * Math.PI * Math.PI), 1/3)
  return semiMajorAxis - 6371 // Subtract Earth radius
}

/**
 * Get satellite color based on name/constellation
 */
function getSatelliteColor(name: string): [number, number, number] {
  const upperName = name.toUpperCase()
  
  if (upperName.includes('STARLINK')) return [100, 200, 255]
  if (upperName.includes('ONEWEB')) return [255, 100, 100]
  if (upperName.includes('IRIDIUM')) return [100, 255, 100]
  if (upperName.includes('INTELSAT')) return [255, 215, 0]
  if (upperName.includes('SES')) return [255, 140, 0]
  if (upperName.includes('GPS')) return [128, 0, 128]
  
  return [200, 200, 200]
}

/**
 * Create visibility window visualization
 */
export function createVisibilityWindows(
  stationLat: number,
  stationLon: number,
  satellites: SatellitePosition[]
): any[] {
  const visibleSatellites = satellites.filter(sat => {
    // Calculate if satellite is visible from station
    const distance = calculateDistance(
      stationLat, stationLon,
      sat.position.latitude, sat.position.longitude
    )
    
    // Rough visibility check
    return distance < sat.coverage.radius
  })
  
  // Create arcs from station to visible satellites
  return visibleSatellites.map(sat => ({
    sourcePosition: [stationLon, stationLat, 0],
    targetPosition: [sat.position.longitude, sat.position.latitude, sat.position.altitude * 1000],
    color: [0, 255, 0], // Green for visible
    width: 2
  }))
}

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}