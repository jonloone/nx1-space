import * as h3 from 'h3-js'

// Types for maritime data
export interface VesselDensityPoint {
  lat: number
  lng: number
  density: number // vessels per day
  vesselTypes: string[]
  averageSize: number // in gross tonnage
}

export interface ShippingLane {
  id: string
  name: string
  coordinates: [number, number][] // [lng, lat] pairs
  trafficVolume: number // vessels per month
  primaryVesselTypes: string[]
  economicValue: number // annual trade value in USD
}

export interface MaritimeMetrics {
  vesselDensity: number
  proximityToLanes: number
  economicActivity: number
  portAccessibility: number
  maritimeRisk: number
}

export interface MaritimeH3Cell {
  h3Index: string
  hexagon: string // For H3HexagonLayer compatibility
  vesselDensity: number
  nearestLaneDistance: number
  maritimeScore: number
  economicValue: number
}

export class MaritimeDataService {
  private vesselDensityGrid: Map<string, VesselDensityPoint> = new Map()
  private shippingLanes: ShippingLane[] = []
  private maritimeH3Cells: Map<string, MaritimeH3Cell> = new Map()
  
  constructor() {
    this.loadHistoricalAISData()
    this.loadShippingLanes()
  }
  
  /**
   * Load historical AIS vessel tracking data
   */
  private loadHistoricalAISData(): void {
    // Major global shipping hotspots with vessel density
    const maritimeHotspots = [
      // Singapore Strait
      { lat: 1.2, lng: 103.8, density: 450, types: ['container', 'tanker', 'bulk'] },
      { lat: 1.3, lng: 104.0, density: 420, types: ['container', 'tanker'] },
      
      // Malacca Strait
      { lat: 2.5, lng: 101.5, density: 380, types: ['tanker', 'container'] },
      { lat: 3.0, lng: 100.5, density: 350, types: ['tanker', 'bulk'] },
      
      // English Channel
      { lat: 50.5, lng: 0.5, density: 320, types: ['container', 'ferry', 'tanker'] },
      { lat: 51.0, lng: 1.5, density: 300, types: ['container', 'ferry'] },
      
      // Suez Canal approaches
      { lat: 30.5, lng: 32.5, density: 280, types: ['container', 'tanker'] },
      { lat: 29.9, lng: 32.6, density: 290, types: ['container', 'tanker', 'bulk'] },
      
      // Panama Canal approaches
      { lat: 9.0, lng: -79.5, density: 250, types: ['container', 'bulk'] },
      { lat: 8.9, lng: -79.6, density: 240, types: ['container', 'tanker'] },
      
      // Gulf of Aden
      { lat: 12.5, lng: 45.0, density: 220, types: ['container', 'tanker'] },
      { lat: 13.0, lng: 48.0, density: 200, types: ['container', 'tanker'] },
      
      // US West Coast
      { lat: 33.7, lng: -118.2, density: 180, types: ['container', 'tanker'] }, // LA/Long Beach
      { lat: 37.8, lng: -122.4, density: 120, types: ['container', 'bulk'] }, // SF Bay
      
      // US East Coast
      { lat: 40.7, lng: -74.0, density: 160, types: ['container', 'tanker'] }, // NY/NJ
      { lat: 32.0, lng: -81.1, density: 140, types: ['container', 'bulk'] }, // Savannah
      
      // Mediterranean
      { lat: 36.1, lng: 5.4, density: 200, types: ['container', 'ferry'] }, // Gibraltar
      { lat: 41.4, lng: 2.2, density: 150, types: ['container', 'cruise'] }, // Barcelona
      
      // North Sea
      { lat: 51.9, lng: 4.0, density: 280, types: ['container', 'tanker'] }, // Rotterdam
      { lat: 53.5, lng: 9.9, density: 220, types: ['container', 'bulk'] }, // Hamburg
      
      // Asian ports
      { lat: 22.3, lng: 114.2, density: 320, types: ['container', 'ferry'] }, // Hong Kong
      { lat: 31.2, lng: 121.5, density: 300, types: ['container', 'bulk'] }, // Shanghai
      { lat: 35.4, lng: 139.6, density: 280, types: ['container', 'tanker'] }, // Tokyo Bay
      { lat: 1.3, lng: 103.8, density: 400, types: ['container', 'tanker'] }, // Singapore
      
      // Middle East
      { lat: 25.3, lng: 55.3, density: 180, types: ['tanker', 'container'] }, // Dubai
      { lat: 26.2, lng: 50.6, density: 160, types: ['tanker', 'bulk'] }, // Bahrain
      
      // South American
      { lat: -23.0, lng: -43.2, density: 120, types: ['container', 'tanker'] }, // Rio
      { lat: -34.6, lng: -58.4, density: 100, types: ['container', 'bulk'] }, // Buenos Aires
      
      // African
      { lat: -33.9, lng: 18.4, density: 110, types: ['container', 'tanker'] }, // Cape Town
      { lat: 6.4, lng: 3.4, density: 90, types: ['tanker', 'container'] }, // Lagos
      
      // Australian
      { lat: -33.9, lng: 151.2, density: 140, types: ['container', 'bulk'] }, // Sydney
      { lat: -37.8, lng: 144.9, density: 120, types: ['container', 'bulk'] }, // Melbourne
    ]
    
    // Generate density grid with interpolation
    maritimeHotspots.forEach(point => {
      const h3Index = h3.latLngToCell(point.lat, point.lng, 5)
      
      // Store primary point
      this.vesselDensityGrid.set(h3Index, {
        lat: point.lat,
        lng: point.lng,
        density: point.density,
        vesselTypes: point.types,
        averageSize: 50000 // Average gross tonnage
      })
      
      // Generate surrounding cells with decreasing density
      const neighbors = h3.gridDisk(h3Index, 2)
      neighbors.forEach(neighborIndex => {
        if (neighborIndex !== h3Index && !this.vesselDensityGrid.has(neighborIndex)) {
          const [nLat, nLng] = h3.cellToLatLng(neighborIndex)
          const distance = h3.gridDistance(h3Index, neighborIndex)
          const scaledDensity = point.density * Math.max(0.2, 1 - (distance * 0.3))
          
          this.vesselDensityGrid.set(neighborIndex, {
            lat: nLat,
            lng: nLng,
            density: scaledDensity,
            vesselTypes: point.types,
            averageSize: 35000
          })
        }
      })
    })
  }
  
  /**
   * Load major global shipping lanes
   */
  private loadShippingLanes(): void {
    this.shippingLanes = [
      {
        id: 'transpacific',
        name: 'Trans-Pacific Route',
        coordinates: [
          [121.5, 31.2], // Shanghai
          [140.0, 35.0], // Pacific crossing
          [180.0, 40.0], // International date line
          [-140.0, 45.0], // North Pacific
          [-118.2, 33.7], // Los Angeles
        ],
        trafficVolume: 12000,
        primaryVesselTypes: ['container', 'bulk'],
        economicValue: 500000000000 // $500B annual
      },
      {
        id: 'transatlantic',
        name: 'Trans-Atlantic Route',
        coordinates: [
          [4.0, 51.9], // Rotterdam
          [-5.0, 50.0], // English Channel
          [-20.0, 48.0], // North Atlantic
          [-40.0, 45.0], // Mid-Atlantic
          [-74.0, 40.7], // New York
        ],
        trafficVolume: 8000,
        primaryVesselTypes: ['container', 'tanker'],
        economicValue: 350000000000 // $350B annual
      },
      {
        id: 'asia-europe',
        name: 'Asia-Europe Route',
        coordinates: [
          [121.5, 31.2], // Shanghai
          [114.2, 22.3], // Hong Kong
          [103.8, 1.3], // Singapore
          [80.0, 6.0], // Indian Ocean
          [45.0, 12.5], // Gulf of Aden
          [32.5, 30.5], // Suez Canal
          [14.0, 36.0], // Mediterranean
          [5.4, 36.1], // Gibraltar
          [4.0, 51.9], // Rotterdam
        ],
        trafficVolume: 15000,
        primaryVesselTypes: ['container', 'tanker', 'bulk'],
        economicValue: 600000000000 // $600B annual
      },
      {
        id: 'cape-route',
        name: 'Cape of Good Hope Route',
        coordinates: [
          [103.8, 1.3], // Singapore
          [80.0, 6.0], // Indian Ocean
          [60.0, -10.0], // Southern Indian Ocean
          [40.0, -30.0], // Approaching Cape
          [18.4, -33.9], // Cape Town
          [0.0, -20.0], // South Atlantic
          [-20.0, 0.0], // Equatorial Atlantic
          [-43.2, -23.0], // Rio de Janeiro
        ],
        trafficVolume: 5000,
        primaryVesselTypes: ['tanker', 'bulk'],
        economicValue: 200000000000 // $200B annual
      },
      {
        id: 'panama-route',
        name: 'Panama Canal Route',
        coordinates: [
          [121.5, 31.2], // Shanghai
          [140.0, 20.0], // Western Pacific
          [-140.0, 10.0], // Eastern Pacific
          [-79.5, 9.0], // Panama Canal
          [-80.0, 20.0], // Caribbean
          [-74.0, 40.7], // New York
        ],
        trafficVolume: 7000,
        primaryVesselTypes: ['container', 'bulk'],
        economicValue: 250000000000 // $250B annual
      },
      {
        id: 'north-sea-baltic',
        name: 'North Sea-Baltic Route',
        coordinates: [
          [4.0, 51.9], // Rotterdam
          [9.9, 53.5], // Hamburg
          [12.0, 55.0], // Danish Straits
          [20.0, 59.0], // Baltic Sea
          [30.0, 60.0], // St. Petersburg
        ],
        trafficVolume: 4000,
        primaryVesselTypes: ['container', 'ferry', 'tanker'],
        economicValue: 100000000000 // $100B annual
      },
      {
        id: 'mediterranean',
        name: 'Mediterranean Route',
        coordinates: [
          [32.5, 30.5], // Port Said
          [25.0, 35.0], // Eastern Med
          [15.0, 37.0], // Central Med
          [5.0, 38.0], // Western Med
          [2.2, 41.4], // Barcelona
          [5.4, 36.1], // Gibraltar
        ],
        trafficVolume: 6000,
        primaryVesselTypes: ['container', 'ferry', 'cruise'],
        economicValue: 150000000000 // $150B annual
      },
      {
        id: 'persian-gulf',
        name: 'Persian Gulf Energy Route',
        coordinates: [
          [55.3, 25.3], // Dubai
          [50.0, 27.0], // Persian Gulf
          [48.0, 29.0], // Kuwait
          [56.0, 27.0], // Strait of Hormuz
          [60.0, 25.0], // Gulf of Oman
          [65.0, 20.0], // Arabian Sea
        ],
        trafficVolume: 10000,
        primaryVesselTypes: ['tanker', 'bulk'],
        economicValue: 400000000000 // $400B annual (oil/gas)
      }
    ]
  }
  
  /**
   * Generate density grid from shipping lanes
   */
  private generateDensityFromLanes(): void {
    this.shippingLanes.forEach(lane => {
      lane.coordinates.forEach((coord, idx) => {
        if (idx < lane.coordinates.length - 1) {
          const [lng1, lat1] = coord
          const [lng2, lat2] = lane.coordinates[idx + 1]
          
          // Interpolate points along the segment
          const steps = 20
          for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const lat = lat1 + (lat2 - lat1) * t
            const lng = lng1 + (lng2 - lng1) * t
            
            const h3Index = h3.latLngToCell(lat, lng, 5)
            
            // Add density based on traffic volume
            const existingPoint = this.vesselDensityGrid.get(h3Index)
            const additionalDensity = lane.trafficVolume / 365 // Daily average
            
            if (existingPoint) {
              existingPoint.density += additionalDensity
            } else {
              this.vesselDensityGrid.set(h3Index, {
                lat,
                lng,
                density: additionalDensity,
                vesselTypes: lane.primaryVesselTypes,
                averageSize: 45000
              })
            }
          }
        }
      })
    })
  }
  
  /**
   * Calculate maritime metrics for an H3 cell
   */
  public calculateMaritimeMetrics(h3Index: string): MaritimeMetrics {
    const [lat, lng] = h3.cellToLatLng(h3Index)
    
    // Get vessel density for this cell
    const densityPoint = this.vesselDensityGrid.get(h3Index)
    const vesselDensity = densityPoint?.density || 0
    
    // Calculate proximity to shipping lanes
    let minLaneDistance = Infinity
    let nearestLaneValue = 0
    
    this.shippingLanes.forEach(lane => {
      lane.coordinates.forEach(coord => {
        const distance = this.calculateDistance(lat, lng, coord[1], coord[0])
        if (distance < minLaneDistance) {
          minLaneDistance = distance
          nearestLaneValue = lane.economicValue
        }
      })
    })
    
    // Proximity score (0-100, closer is better)
    const proximityToLanes = Math.max(0, 100 - (minLaneDistance / 10))
    
    // Economic activity based on lane value and density
    const economicActivity = Math.min(100, 
      (vesselDensity / 5) + 
      (nearestLaneValue / 10000000000) // Normalize by $10B
    )
    
    // Port accessibility (simplified - based on known port locations)
    const portAccessibility = this.calculatePortAccessibility(lat, lng)
    
    // Maritime risk factors
    const maritimeRisk = this.calculateMaritimeRisk(lat, lng)
    
    return {
      vesselDensity,
      proximityToLanes,
      economicActivity,
      portAccessibility,
      maritimeRisk
    }
  }
  
  /**
   * Calculate distance between two points in km
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  /**
   * Calculate port accessibility score
   */
  private calculatePortAccessibility(lat: number, lng: number): number {
    const majorPorts = [
      { lat: 1.3, lng: 103.8, size: 100 }, // Singapore
      { lat: 31.2, lng: 121.5, size: 95 }, // Shanghai
      { lat: 22.3, lng: 114.2, size: 90 }, // Hong Kong
      { lat: 51.9, lng: 4.0, size: 85 }, // Rotterdam
      { lat: 25.3, lng: 55.3, size: 80 }, // Dubai
      { lat: 33.7, lng: -118.2, size: 85 }, // LA/Long Beach
      { lat: 40.7, lng: -74.0, size: 75 }, // NY/NJ
    ]
    
    let maxScore = 0
    majorPorts.forEach(port => {
      const distance = this.calculateDistance(lat, lng, port.lat, port.lng)
      const score = Math.max(0, port.size * (1 - distance / 5000))
      maxScore = Math.max(maxScore, score)
    })
    
    return maxScore
  }
  
  /**
   * Calculate maritime risk score
   */
  private calculateMaritimeRisk(lat: number, lng: number): number {
    // High-risk areas
    const riskZones = [
      { lat: 12.5, lng: 45.0, risk: 80 }, // Gulf of Aden (piracy)
      { lat: 5.0, lng: 5.0, risk: 70 }, // Gulf of Guinea (piracy)
      { lat: 1.2, lng: 103.8, risk: 40 }, // Singapore Strait (congestion)
      { lat: 56.0, lng: 27.0, risk: 60 }, // Strait of Hormuz (geopolitical)
      { lat: 30.0, lng: 32.5, risk: 50 }, // Suez Canal (congestion)
    ]
    
    let maxRisk = 20 // Base risk
    riskZones.forEach(zone => {
      const distance = this.calculateDistance(lat, lng, zone.lat, zone.lng)
      if (distance < 500) {
        const riskFactor = zone.risk * (1 - distance / 500)
        maxRisk = Math.max(maxRisk, riskFactor)
      }
    })
    
    return maxRisk
  }
  
  /**
   * Generate maritime H3 cells with scoring
   */
  public generateMaritimeH3Cells(resolution: number = 5, maxCells: number = 1000): MaritimeH3Cell[] {
    const cells: MaritimeH3Cell[] = []
    
    // First, generate density from lanes
    this.generateDensityFromLanes()
    
    // Convert vessel density points to H3 cells
    this.vesselDensityGrid.forEach((point, h3Index) => {
      const metrics = this.calculateMaritimeMetrics(h3Index)
      
      // Calculate maritime score
      const maritimeScore = 
        metrics.vesselDensity * 0.3 +
        metrics.proximityToLanes * 0.25 +
        metrics.economicActivity * 0.25 +
        metrics.portAccessibility * 0.15 +
        (100 - metrics.maritimeRisk) * 0.05
      
      // Calculate economic value
      const economicValue = 
        metrics.vesselDensity * 10000 + // $10k per vessel/day
        metrics.economicActivity * 50000 + // Economic multiplier
        metrics.portAccessibility * 20000 // Port access value
      
      cells.push({
        h3Index,
        hexagon: h3Index, // For H3HexagonLayer compatibility
        vesselDensity: metrics.vesselDensity,
        nearestLaneDistance: 100 - metrics.proximityToLanes, // Convert back to distance
        maritimeScore,
        economicValue
      })
    })
    
    // Sort by maritime score and return top cells
    cells.sort((a, b) => b.maritimeScore - a.maritimeScore)
    return cells.slice(0, maxCells)
  }
  
  /**
   * Get shipping lanes data
   */
  public getShippingLanes(): ShippingLane[] {
    return this.shippingLanes
  }
  
  /**
   * Get vessel density grid
   */
  public getVesselDensityGrid(): Map<string, VesselDensityPoint> {
    return this.vesselDensityGrid
  }
  
  /**
   * Identify maritime competitors in a region
   */
  public identifyMaritimeCompetitors(h3Index: string): string[] {
    const competitors = []
    
    // Check proximity to major satellite operators' coverage
    const [lat, lng] = h3.cellToLatLng(h3Index)
    
    // Inmarsat - strong maritime coverage
    if (Math.abs(lat) < 70) {
      competitors.push('Inmarsat FleetBroadband')
    }
    
    // Iridium - global coverage including poles
    competitors.push('Iridium Certus Maritime')
    
    // VSAT operators in high-traffic areas
    const metrics = this.calculateMaritimeMetrics(h3Index)
    if (metrics.vesselDensity > 50) {
      competitors.push('KVH TracPhone')
      competitors.push('Intellian FleetBroadband')
    }
    
    // Starlink Maritime in coverage areas
    if (Math.abs(lat) < 55) {
      competitors.push('Starlink Maritime')
    }
    
    // Regional operators
    if (lng > 60 && lng < 150 && lat > -40 && lat < 40) {
      competitors.push('Thuraya MarineStar')
    }
    
    return competitors
  }
}

// Export singleton instance
export const maritimeDataService = new MaritimeDataService()