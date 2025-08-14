'use client'

import { PathLayer, ScatterplotLayer, TextLayer, HexagonLayer } from '@deck.gl/layers'
import { Layer } from '@deck.gl/core'
import { groundStationOptimizer, type StationLocation, type TechnicalMetrics } from '@/lib/optimizer/ground-station-optimizer'

export interface OptimizerPoint {
  position: [number, number]
  feasibilityScore: number
  dailyPasses: number
  contactTime: number
  dataCapacity: number
  confidence: number
}

export interface CoverageCone {
  stationId: string
  position: [number, number]
  radius: number // km
  elevationAngle: number
  color: [number, number, number, number]
}

interface OptimizerLayerProps {
  mode: 'coverage' | 'capacity' | 'feasibility'
  optimizerPoints?: OptimizerPoint[]
  coverageCones?: CoverageCone[]
  orbitPaths?: Array<{ path: [number, number, number][]; color: [number, number, number, number] }>
  visible: boolean
  showLabels?: boolean
  onHover?: (point: OptimizerPoint | null) => void
  onClick?: (point: OptimizerPoint) => void
}

/**
 * Creates visualization layers for technical validation
 */
export function createOptimizerLayers({
  mode,
  optimizerPoints = [],
  coverageCones = [],
  orbitPaths = [],
  visible,
  showLabels = false,
  onHover,
  onClick
}: OptimizerLayerProps): Layer[] {
  if (!visible) return []
  
  const layers: Layer[] = []
  
  // Mode-specific visualizations
  if (mode === 'coverage') {
    // Coverage cones for existing stations
    if (coverageCones.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'coverage-cones',
          data: coverageCones,
          
          getPosition: (d: CoverageCone) => d.position,
          getRadius: (d: CoverageCone) => d.radius * 1000, // Convert km to meters
          radiusMinPixels: 20,
          radiusMaxPixels: 500,
          
          getFillColor: (d: CoverageCone) => d.color,
          getLineColor: [255, 255, 255, 100],
          
          filled: true,
          stroked: true,
          lineWidthMinPixels: 2,
          
          opacity: 0.15, // Semi-transparent to show overlaps
          pickable: false
        })
      )
    }
    
    // Orbit paths visualization
    if (orbitPaths.length > 0) {
      layers.push(
        new PathLayer({
          id: 'orbit-paths',
          data: orbitPaths,
          
          getPath: (d) => d.path,
          getColor: (d) => d.color,
          getWidth: 2,
          widthMinPixels: 1,
          widthMaxPixels: 3,
          
          opacity: 0.4,
          pickable: false
        })
      )
    }
  }
  
  if (mode === 'capacity') {
    // Data capacity visualization using ScatterplotLayer with gradient
    if (optimizerPoints.length > 0) {
      // Create multiple layers with different radiuses to simulate heatmap
      for (let i = 3; i >= 0; i--) {
        layers.push(
          new ScatterplotLayer({
            id: `capacity-gradient-${i}`,
            data: optimizerPoints,
            
            getPosition: (d: OptimizerPoint) => d.position,
            getRadius: (d: OptimizerPoint) => (d.dataCapacity / 10) * (1 + i * 0.5) * 1000,
            radiusMinPixels: 10 + i * 10,
            radiusMaxPixels: 50 + i * 20,
            
            getFillColor: (d: OptimizerPoint) => {
              const intensity = d.dataCapacity / 100
              const opacity = 30 + (3 - i) * 20
              if (intensity > 0.8) return [255, 182, 193, opacity] // Light pink
              if (intensity > 0.6) return [218, 112, 214, opacity] // Orchid
              if (intensity > 0.4) return [138, 43, 226, opacity]  // Blue violet
              if (intensity > 0.2) return [75, 0, 130, opacity]    // Indigo
              return [25, 0, 51, opacity]                          // Dark purple
            },
            
            opacity: 0.3,
            filled: true,
            stroked: false,
            pickable: false
          })
        )
      }
      
      // Capacity indicators
      const highCapacityPoints = optimizerPoints.filter(p => p.dataCapacity > 50)
      if (highCapacityPoints.length > 0) {
        layers.push(
          new ScatterplotLayer({
            id: 'capacity-markers',
            data: highCapacityPoints,
            
            getPosition: (d: OptimizerPoint) => d.position,
            getRadius: (d: OptimizerPoint) => Math.sqrt(d.dataCapacity) * 1000,
            radiusMinPixels: 5,
            radiusMaxPixels: 30,
            
            getFillColor: (d: OptimizerPoint) => {
              if (d.dataCapacity > 100) return [0, 255, 0, 100]  // Green for high
              if (d.dataCapacity > 50) return [255, 255, 0, 100] // Yellow for medium
              return [255, 100, 0, 100]                           // Orange for low
            },
            
            stroked: true,
            getLineColor: [255, 255, 255, 200],
            lineWidthMinPixels: 2,
            
            pickable: true,
            onHover: (info) => onHover?.(info.object),
            onClick: (info) => onClick?.(info.object)
          })
        )
      }
    }
  }
  
  if (mode === 'feasibility') {
    // Technical feasibility scoring visualization
    if (optimizerPoints.length > 0) {
      // Feasibility visualization using layered ScatterplotLayers
      for (let i = 4; i >= 0; i--) {
        layers.push(
          new ScatterplotLayer({
            id: `feasibility-gradient-${i}`,
            data: optimizerPoints,
            
            getPosition: (d: OptimizerPoint) => d.position,
            getRadius: (d: OptimizerPoint) => (d.feasibilityScore / 20) * (1 + i * 0.4) * 1000,
            radiusMinPixels: 15 + i * 12,
            radiusMaxPixels: 60 + i * 25,
            
            getFillColor: (d: OptimizerPoint) => {
              const score = d.feasibilityScore / 100
              const opacity = 25 + (4 - i) * 15
              if (score > 0.85) return [0, 255, 0, opacity]      // Green (highly feasible)
              if (score > 0.70) return [124, 252, 0, opacity]    // Lawn green
              if (score > 0.50) return [255, 215, 0, opacity]    // Gold
              if (score > 0.30) return [255, 140, 0, opacity]    // Dark orange
              if (score > 0.15) return [255, 0, 0, opacity]      // Red
              return [139, 0, 0, opacity]                        // Dark red (not feasible)
            },
            
            opacity: 0.35,
            filled: true,
            stroked: false,
            pickable: false
          })
        )
      }
      
      // Feasibility markers for high-scoring locations
      const feasibleLocations = optimizerPoints.filter(p => p.feasibilityScore > 70)
      if (feasibleLocations.length > 0) {
        layers.push(
          new ScatterplotLayer({
            id: 'feasibility-markers',
            data: feasibleLocations,
            
            getPosition: (d: OptimizerPoint) => d.position,
            getRadius: 5000,
            radiusMinPixels: 8,
            radiusMaxPixels: 20,
            
            getFillColor: (d: OptimizerPoint) => {
              const opacity = Math.round(d.confidence * 200)
              if (d.feasibilityScore > 85) return [0, 255, 0, opacity]
              if (d.feasibilityScore > 70) return [255, 215, 0, opacity]
              return [255, 140, 0, opacity]
            },
            
            stroked: true,
            getLineColor: [255, 255, 255, 255],
            lineWidthMinPixels: 2,
            
            pickable: true,
            onHover: (info) => onHover?.(info.object),
            onClick: (info) => onClick?.(info.object)
          })
        )
        
        // Labels for top feasible locations
        if (showLabels) {
          const topLocations = feasibleLocations
            .sort((a, b) => b.feasibilityScore - a.feasibilityScore)
            .slice(0, 10)
          
          layers.push(
            new TextLayer({
              id: 'feasibility-labels',
              data: topLocations,
              
              getPosition: (d: OptimizerPoint) => d.position,
              getText: (d: OptimizerPoint) => `${d.feasibilityScore}%`,
              getSize: 14,
              getColor: [255, 255, 255, 255],
              getBackgroundColor: [0, 0, 0, 200],
              backgroundPadding: [4, 2],
              
              getTextAnchor: 'middle' as const,
              getAlignmentBaseline: 'center' as const,
              billboard: true,
              pickable: false
            })
          )
        }
      }
    }
  }
  
  // Pass frequency indicators (all modes)
  if (optimizerPoints.length > 0 && mode !== 'capacity') {
    const frequencyData = optimizerPoints.map(p => ({
      position: p.position,
      frequency: p.dailyPasses,
      opacity: Math.min(p.dailyPasses / 100, 1) * 255
    }))
    
    layers.push(
      new ScatterplotLayer({
        id: 'pass-frequency',
        data: frequencyData,
        
        getPosition: (d) => d.position,
        getRadius: 2000,
        radiusMinPixels: 2,
        radiusMaxPixels: 8,
        
        getFillColor: (d) => [100, 200, 255, d.opacity],
        
        pickable: false
      })
    )
  }
  
  return layers
}

/**
 * Generate technical feasibility grid for analysis
 */
export async function generateFeasibilityGrid(
  bounds: { north: number; south: number; east: number; west: number },
  resolution: number = 0.5, // degrees
  satellites: Array<{ id: string; name: string; tle?: any }>
): Promise<OptimizerPoint[]> {
  const points: OptimizerPoint[] = []
  
  // Generate grid points
  for (let lat = bounds.south; lat <= bounds.north; lat += resolution) {
    for (let lon = bounds.west; lon <= bounds.east; lon += resolution) {
      // Skip ocean areas (simplified check)
      if (!isLandArea(lat, lon)) continue
      
      const location: StationLocation = {
        latitude: lat,
        longitude: lon,
        altitude: 0,
        minElevation: 5
      }
      
      // Calculate passes for this location
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      
      const passes = groundStationOptimizer.calculatePasses(
        location,
        satellites.slice(0, 100), // Sample for performance
        startTime,
        endTime
      )
      
      // Calculate technical metrics
      const metrics = groundStationOptimizer.calculateTechnicalMetrics(location, passes)
      
      // Calculate confidence based on data quality
      const confidence = calculateConfidence(passes.length, metrics.constellationDiversity)
      
      points.push({
        position: [lon, lat],
        feasibilityScore: metrics.technicalFeasibilityScore,
        dailyPasses: metrics.dailyPasses,
        contactTime: metrics.totalContactTime,
        dataCapacity: metrics.dataCapacity,
        confidence
      })
    }
  }
  
  return points
}

/**
 * Calculate coverage cones for existing stations
 */
export function calculateCoverageCones(
  stations: Array<{ id: string; latitude: number; longitude: number }>,
  elevationAngle: number = 5
): CoverageCone[] {
  return stations.map(station => {
    // Calculate coverage radius based on elevation angle
    // Simplified calculation - actual would use satellite altitude
    const earthRadius = 6371 // km
    const satelliteAltitude = 550 // km (LEO average)
    const totalRadius = earthRadius + satelliteAltitude
    
    // Coverage radius calculation
    const angle = (90 - elevationAngle) * Math.PI / 180
    const coverageRadius = earthRadius * Math.acos(
      earthRadius * Math.cos(angle) / totalRadius
    ) / Math.PI * 180 * 111 // Convert to km
    
    return {
      stationId: station.id,
      position: [station.longitude, station.latitude] as [number, number],
      radius: Math.min(coverageRadius, 2000), // Cap at 2000km
      elevationAngle,
      color: [59, 130, 246, 50] // Blue with transparency
    }
  })
}

/**
 * Simple land/ocean check (would use actual coastline data in production)
 */
function isLandArea(lat: number, lon: number): boolean {
  // Simplified continental boundaries
  // North America
  if (lat > 25 && lat < 70 && lon > -170 && lon < -50) return true
  // South America
  if (lat > -55 && lat < 15 && lon > -85 && lon < -35) return true
  // Europe
  if (lat > 35 && lat < 72 && lon > -10 && lon < 40) return true
  // Africa
  if (lat > -35 && lat < 38 && lon > -20 && lon < 52) return true
  // Asia
  if (lat > -10 && lat < 75 && lon > 25 && lon < 180) return true
  // Australia
  if (lat > -45 && lat < -10 && lon > 110 && lon < 155) return true
  
  return false
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidence(passCount: number, diversity: number): number {
  const passConfidence = Math.min(passCount / 100, 1) * 0.6
  const diversityConfidence = diversity * 0.4
  return Math.min(passConfidence + diversityConfidence, 1)
}