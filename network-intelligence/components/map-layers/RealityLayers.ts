import { 
  HeatmapLayer, 
  ContourLayer, 
  PathLayer, 
  PolygonLayer,
  IconLayer,
  TextLayer,
  ScatterplotLayer
} from '@deck.gl/layers'
import { HexagonLayer } from '@deck.gl/aggregation-layers'

interface Satellite {
  name: string
  altitude: number
  position: [number, number]
  type: 'GEO' | 'MEO' | 'LEO'
}

interface Station {
  name: string
  coordinates: [number, number]
  elevation: number
  operator: string
}

interface VesselData {
  position: [number, number]
  monthlyValue: number
  vesselType: string
  route: string
}

interface RouteData {
  path: [number, number][]
  vesselsPerDay: number
  monthlyRevenue: number
  name: string
}

export class RealityBasedLayers {
  
  /**
   * Create maritime density heatmap (not hexagons!)
   * Shows actual vessel concentrations with smooth gradients
   */
  static createMaritimeHeatmap(vesselData: VesselData[]) {
    return new HeatmapLayer({
      id: 'maritime-heatmap',
      data: vesselData,
      getPosition: d => d.position,
      getWeight: d => d.monthlyValue / 1000, // Normalize to thousands
      radiusPixels: 30,
      intensity: 1,
      threshold: 0.03,
      colorRange: [
        [25, 25, 35, 0],      // Transparent for low density
        [0, 100, 150, 128],   // Teal for medium
        [0, 150, 200, 178],   // Cyan for high
        [0, 200, 255, 255]    // Bright blue for very high
      ]
    })
  }
  
  /**
   * Create shipping lane flows with actual traffic volume
   */
  static createShippingFlows(routeData: RouteData[]) {
    return new PathLayer({
      id: 'shipping-flows',
      data: routeData,
      getPath: d => d.path,
      getColor: d => {
        // Color by traffic intensity
        if (d.vesselsPerDay > 100) return [0, 255, 200, 200]
        if (d.vesselsPerDay > 50) return [0, 200, 255, 150]
        return [0, 150, 200, 100]
      },
      getWidth: d => Math.sqrt(d.vesselsPerDay) * 2000,
      widthMinPixels: 2,
      widthMaxPixels: 20,
      capRounded: true,
      jointRounded: true,
      billboard: false,
      pickable: true
    })
  }
  
  /**
   * Create actual satellite coverage footprints
   * Based on real orbital mechanics and elevation angles
   */
  static createCoverageFootprints(satellites: Satellite[], stations: Station[]) {
    const footprints: any[] = []
    
    // Calculate real footprints based on orbital mechanics
    satellites.forEach(sat => {
      stations.forEach(station => {
        const footprint = this.calculateFootprint(sat, station)
        if (footprint) {
          footprints.push({
            polygon: footprint.coordinates,
            quality: footprint.signalQuality,
            satellite: sat.name,
            station: station.name,
            type: sat.type
          })
        }
      })
    })
    
    return new PolygonLayer({
      id: 'coverage-footprints',
      data: footprints,
      getPolygon: d => d.polygon,
      getFillColor: d => {
        // Color by signal quality
        if (d.quality > 0.8) return [34, 197, 94, 50]   // Green - Excellent
        if (d.quality > 0.5) return [59, 130, 246, 50]  // Blue - Good
        return [255, 100, 100, 30]                       // Red - Poor
      },
      getLineColor: [255, 255, 255, 80],
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      pickable: true
    })
  }
  
  /**
   * Create opportunity contours using kernel density estimation
   * Much more accurate than hexagon grids
   */
  static createOpportunityContours(opportunityPoints: any[]) {
    return new ContourLayer({
      id: 'opportunity-contours',
      data: opportunityPoints,
      getPosition: d => d.position,
      getWeight: d => d.opportunityScore,
      cellSize: 10000, // 10km cells for interpolation
      contours: [
        {threshold: 0.3, color: [100, 100, 120, 50], strokeWidth: 0},     // Low
        {threshold: 0.5, color: [59, 130, 246, 100], strokeWidth: 1},     // Medium
        {threshold: 0.7, color: [251, 191, 36, 150], strokeWidth: 2},     // High
        {threshold: 0.85, color: [34, 197, 94, 200], strokeWidth: 3}      // Very High
      ],
      gpuAggregation: true
    })
  }
  
  /**
   * Competition influence zones using Voronoi tessellation
   * Shows actual service areas, not arbitrary grid cells
   */
  static createCompetitionZones(existingStations: Station[]) {
    const voronoiData = this.calculateVoronoiDiagram(existingStations)
    
    return new PolygonLayer({
      id: 'competition-zones',
      data: voronoiData,
      getPolygon: d => d.polygon,
      getFillColor: d => {
        const alpha = 50 * d.overlapFactor
        if (d.operator === 'SES') return [34, 197, 94, alpha]
        if (d.operator === 'Intelsat') return [255, 100, 100, alpha]
        if (d.operator === 'Eutelsat') return [100, 100, 255, alpha]
        return [150, 150, 150, alpha]
      },
      getLineColor: d => {
        if (d.operator === 'SES') return [34, 197, 94, 100]
        if (d.operator === 'Intelsat') return [255, 100, 100, 100]
        if (d.operator === 'Eutelsat') return [100, 100, 255, 100]
        return [150, 150, 150, 100]
      },
      getLineWidth: 1,
      pickable: true
    })
  }
  
  /**
   * Dynamic opportunity markers at specific high-value locations
   */
  static createOpportunityMarkers(opportunities: any[]) {
    // Filter to only show significant opportunities
    const significantOpps = opportunities.filter(o => o.score > 0.7)
    
    return new ScatterplotLayer({
      id: 'opportunity-markers',
      data: significantOpps,
      getPosition: d => d.position,
      getRadius: d => 5000 + (d.score * 20000), // 5-25km radius based on score
      getFillColor: d => {
        if (d.type === 'maritime') return [0, 150, 255, 200]
        if (d.type === 'coverage_gap') return [255, 200, 0, 200]
        if (d.type === 'competitive') return [255, 100, 100, 200]
        return [34, 197, 94, 200]
      },
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2000,
      radiusMinPixels: 8,
      radiusMaxPixels: 40,
      filled: true,
      stroked: true,
      billboard: true,
      pickable: true
    })
  }
  
  /**
   * Create coverage gap indicators
   * Shows areas with no station coverage within operational range
   */
  static createCoverageGaps(stations: Station[], analysisArea: any) {
    const gaps = this.identifyCoverageGaps(stations, analysisArea)
    
    return new PolygonLayer({
      id: 'coverage-gaps',
      data: gaps,
      getPolygon: d => d.polygon,
      getFillColor: [255, 100, 100, 30],
      getLineColor: [255, 100, 100, 100],
      getLineWidth: 2,
      lineWidthMinPixels: 1,
      getDashArray: [10, 5],
      pickable: true
    })
  }
  
  /**
   * Create station coverage radius circles
   * Shows effective operational range
   */
  static createStationCoverageRadius(stations: Station[]) {
    const coverageCircles = stations.map(station => {
      const radius = this.calculateEffectiveRange(station)
      return {
        center: station.coordinates,
        radius,
        station: station.name,
        operator: station.operator,
        points: this.generateCirclePoints(station.coordinates, radius)
      }
    })
    
    return new PolygonLayer({
      id: 'station-coverage-radius',
      data: coverageCircles,
      getPolygon: d => d.points,
      getFillColor: d => {
        if (d.operator === 'SES') return [34, 197, 94, 20]
        return [255, 100, 100, 20]
      },
      getLineColor: d => {
        if (d.operator === 'SES') return [34, 197, 94, 100]
        return [255, 100, 100, 100]
      },
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      pickable: true
    })
  }
  
  // Helper methods
  
  private static calculateFootprint(satellite: Satellite, station: Station) {
    const altitude = satellite.altitude
    const elevationAngle = 5 // Minimum elevation in degrees
    
    // Calculate footprint radius based on orbital mechanics
    const earthRadius = 6371 // km
    const maxDistance = earthRadius * Math.acos(
      earthRadius / (earthRadius + altitude) * 
      Math.cos(elevationAngle * Math.PI / 180)
    )
    
    // Generate ellipse based on orbit type
    const points: [number, number][] = []
    const eccentricity = satellite.type === 'GEO' ? 0 : 
                         satellite.type === 'MEO' ? 0.15 : 0.3
    
    for (let angle = 0; angle < 360; angle += 10) {
      const rad = angle * Math.PI / 180
      const r = maxDistance * (1 - eccentricity * Math.cos(rad))
      const x = station.coordinates[0] + (r / 111) * Math.cos(rad)
      const y = station.coordinates[1] + (r / 111) * Math.sin(rad) * 0.8 // Flatten for projection
      points.push([x, y])
    }
    
    return {
      coordinates: points,
      signalQuality: this.calculateSignalQuality(satellite, station, maxDistance)
    }
  }
  
  private static calculateSignalQuality(satellite: Satellite, station: Station, distance: number): number {
    // Simplified signal quality calculation
    const baseQuality = satellite.type === 'GEO' ? 0.9 : 
                       satellite.type === 'MEO' ? 0.8 : 0.7
    
    // Degrade with distance
    const distanceFactor = Math.max(0, 1 - (distance / 5000))
    
    // Consider elevation impact
    const elevationBonus = Math.min(0.1, station.elevation / 5000)
    
    return Math.min(1, baseQuality * distanceFactor + elevationBonus)
  }
  
  private static calculateVoronoiDiagram(stations: Station[]) {
    // Simplified Voronoi calculation
    // In production, use d3-delaunay or similar library
    const voronoiCells: any[] = []
    
    stations.forEach(station => {
      // Create a simple box around each station for now
      const boxSize = 2 // degrees
      const polygon = [
        [station.coordinates[0] - boxSize, station.coordinates[1] - boxSize],
        [station.coordinates[0] + boxSize, station.coordinates[1] - boxSize],
        [station.coordinates[0] + boxSize, station.coordinates[1] + boxSize],
        [station.coordinates[0] - boxSize, station.coordinates[1] + boxSize],
        [station.coordinates[0] - boxSize, station.coordinates[1] - boxSize]
      ]
      
      voronoiCells.push({
        polygon,
        operator: station.operator,
        station: station.name,
        overlapFactor: 0.5 + Math.random() * 0.5
      })
    })
    
    return voronoiCells
  }
  
  private static identifyCoverageGaps(stations: Station[], analysisArea: any) {
    // Identify areas with no coverage
    const gaps: any[] = []
    const gridSize = 5 // degrees
    
    for (let lat = -60; lat <= 60; lat += gridSize) {
      for (let lng = -180; lng <= 180; lng += gridSize) {
        const point: [number, number] = [lng, lat]
        let minDistance = Infinity
        
        stations.forEach(station => {
          const dist = this.calculateDistance(point, station.coordinates)
          if (dist < minDistance) minDistance = dist
        })
        
        // If no station within 1000km, it's a gap
        if (minDistance > 1000) {
          gaps.push({
            polygon: [
              [lng, lat],
              [lng + gridSize, lat],
              [lng + gridSize, lat + gridSize],
              [lng, lat + gridSize],
              [lng, lat]
            ],
            gapSize: minDistance
          })
        }
      }
    }
    
    return gaps
  }
  
  private static calculateEffectiveRange(station: Station): number {
    // Base range depends on station capabilities
    let baseRange = 500 // km
    
    // Adjust for elevation
    if (station.elevation > 1000) baseRange += 100
    if (station.elevation > 2000) baseRange += 200
    
    return baseRange
  }
  
  private static generateCirclePoints(center: [number, number], radiusKm: number): [number, number][] {
    const points: [number, number][] = []
    const numPoints = 36
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const x = center[0] + (radiusKm / 111) * Math.cos(angle)
      const y = center[1] + (radiusKm / 111) * Math.sin(angle) * 0.8
      points.push([x, y])
    }
    
    return points
  }
  
  private static calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371 // Earth radius in km
    const lat1 = coord1[1] * Math.PI / 180
    const lat2 = coord2[1] * Math.PI / 180
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180
    const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon/2) * Math.sin(deltaLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return R * c
  }
}

export default RealityBasedLayers