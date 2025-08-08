/**
 * API-based H3 Grid Service
 * 
 * Provides H3 hexagon data through API calls with caching and error handling
 */

import { unifiedDataIntegration, type Hexagon, type DataMetadata } from './unifiedDataIntegration'

export interface H3HexagonOpportunity {
  hexagon: string
  center: number[]
  score: number
  color: number[]
  marketScore?: number
  technicalScore?: number
  competitionScore?: number
  vesselDensity?: number
  shippingLanes?: any[]
  opportunityType?: string
  confidence?: number
  monthlyRevenuePotential?: number
  isLand?: boolean
  baseColor?: number[]
}

export interface H3GridWithMetadata {
  data: H3HexagonOpportunity[]
  metadata: DataMetadata
}

export interface H3GridAnalysis {
  hexagons: H3HexagonOpportunity[]
  summary: {
    totalHexagons: number
    highOpportunity: number
    mediumOpportunity: number
    lowOpportunity: number
    averageScore: number
    totalRevenuePotential: number
  }
  spatialDistribution: {
    landCells: number
    waterCells: number
    coverageByRegion: Record<string, number>
  }
}

export class APIH3GridService {
  /**
   * Generate H3 hexagons for opportunity analysis
   */
  async generateH3Hexagons(
    resolution = 4,
    bounds?: [number, number, number, number],
    forceRefresh = false
  ): Promise<H3GridWithMetadata> {
    try {
      const result = await unifiedDataIntegration.getHexagons(resolution, bounds, forceRefresh)
      
      // Convert to our expected format
      const hexagons: H3HexagonOpportunity[] = result.data.map(hex => ({
        hexagon: hex.hexagon,
        center: hex.center,
        score: hex.score,
        color: hex.color,
        marketScore: hex.marketScore,
        technicalScore: hex.technicalScore,
        competitionScore: hex.competitionScore,
        vesselDensity: hex.vesselDensity,
        shippingLanes: hex.shippingLanes || [],
        opportunityType: hex.opportunityType,
        confidence: hex.confidence,
        monthlyRevenuePotential: hex.monthlyRevenuePotential,
        isLand: hex.isLand,
        baseColor: hex.baseColor || hex.color
      }))

      return {
        data: hexagons,
        metadata: result.metadata
      }
    } catch (error) {
      console.error('Error generating H3 hexagons:', error)
      return {
        data: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          confidence: 0,
          freshness: 0
        }
      }
    }
  }

  /**
   * Get H3 hexagons with comprehensive analysis
   */
  async getH3GridAnalysis(
    resolution = 4,
    bounds?: [number, number, number, number],
    forceRefresh = false
  ): Promise<H3GridAnalysis> {
    try {
      const result = await this.generateH3Hexagons(resolution, bounds, forceRefresh)
      const hexagons = result.data

      const analysis = this.analyzeH3Grid(hexagons)
      
      return {
        hexagons,
        summary: analysis.summary,
        spatialDistribution: analysis.spatialDistribution
      }
    } catch (error) {
      console.error('Error getting H3 grid analysis:', error)
      return {
        hexagons: [],
        summary: {
          totalHexagons: 0,
          highOpportunity: 0,
          mediumOpportunity: 0,
          lowOpportunity: 0,
          averageScore: 0,
          totalRevenuePotential: 0
        },
        spatialDistribution: {
          landCells: 0,
          waterCells: 0,
          coverageByRegion: {}
        }
      }
    }
  }

  /**
   * Get hexagon by H3 index
   */
  async getHexagonByIndex(
    h3Index: string,
    resolution = 4,
    forceRefresh = false
  ): Promise<H3HexagonOpportunity | null> {
    try {
      const result = await this.generateH3Hexagons(resolution, undefined, forceRefresh)
      return result.data.find(hex => hex.hexagon === h3Index) || null
    } catch (error) {
      console.error(`Error getting hexagon ${h3Index}:`, error)
      return null
    }
  }

  /**
   * Get hexagons within radius of a point
   */
  async getHexagonsNearPoint(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    resolution = 4,
    forceRefresh = false
  ): Promise<H3HexagonOpportunity[]> {
    try {
      // Calculate bounding box for the radius
      const kmPerDegree = 111.32 // Approximate km per degree of latitude
      const latDelta = radiusKm / kmPerDegree
      const lngDelta = radiusKm / (kmPerDegree * Math.cos(centerLat * Math.PI / 180))

      const bounds: [number, number, number, number] = [
        centerLng - lngDelta, // west
        centerLat - latDelta, // south
        centerLng + lngDelta, // east
        centerLat + latDelta  // north
      ]

      const result = await this.generateH3Hexagons(resolution, bounds, forceRefresh)
      
      // Filter by actual distance
      return result.data.filter(hex => {
        const distance = this.calculateDistance(centerLat, centerLng, hex.center[1], hex.center[0])
        return distance <= radiusKm
      })
    } catch (error) {
      console.error('Error getting hexagons near point:', error)
      return []
    }
  }

  /**
   * Get top opportunity hexagons
   */
  async getTopOpportunities(
    count = 50,
    resolution = 4,
    bounds?: [number, number, number, number],
    forceRefresh = false
  ): Promise<H3HexagonOpportunity[]> {
    try {
      const result = await this.generateH3Hexagons(resolution, bounds, forceRefresh)
      
      return result.data
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
    } catch (error) {
      console.error('Error getting top opportunities:', error)
      return []
    }
  }

  /**
   * Filter hexagons by criteria
   */
  async filterHexagons(
    criteria: {
      minScore?: number
      maxScore?: number
      opportunityType?: string
      isLand?: boolean
      minVesselDensity?: number
      maxVesselDensity?: number
      bounds?: [number, number, number, number]
    },
    resolution = 4,
    forceRefresh = false
  ): Promise<H3HexagonOpportunity[]> {
    try {
      const result = await this.generateH3Hexagons(resolution, criteria.bounds, forceRefresh)
      let hexagons = result.data

      if (criteria.minScore !== undefined) {
        hexagons = hexagons.filter(h => h.score >= criteria.minScore!)
      }

      if (criteria.maxScore !== undefined) {
        hexagons = hexagons.filter(h => h.score <= criteria.maxScore!)
      }

      if (criteria.opportunityType) {
        hexagons = hexagons.filter(h => h.opportunityType === criteria.opportunityType)
      }

      if (criteria.isLand !== undefined) {
        hexagons = hexagons.filter(h => h.isLand === criteria.isLand)
      }

      if (criteria.minVesselDensity !== undefined) {
        hexagons = hexagons.filter(h => (h.vesselDensity || 0) >= criteria.minVesselDensity!)
      }

      if (criteria.maxVesselDensity !== undefined) {
        hexagons = hexagons.filter(h => (h.vesselDensity || 0) <= criteria.maxVesselDensity!)
      }

      return hexagons
    } catch (error) {
      console.error('Error filtering hexagons:', error)
      return []
    }
  }

  /**
   * Get hexagon cluster analysis
   */
  async getHexagonClusters(
    resolution = 4,
    bounds?: [number, number, number, number],
    minClusterSize = 5,
    forceRefresh = false
  ): Promise<any[]> {
    try {
      const result = await this.generateH3Hexagons(resolution, bounds, forceRefresh)
      const hexagons = result.data

      // Group hexagons into clusters based on proximity and score similarity
      const clusters = this.clusterHexagons(hexagons, minClusterSize)

      return clusters.map(cluster => ({
        id: `cluster_${Math.random().toString(36).substring(7)}`,
        hexagons: cluster.hexagons,
        centroid: cluster.centroid,
        averageScore: cluster.averageScore,
        totalRevenuePotential: cluster.totalRevenuePotential,
        dominantOpportunityType: cluster.dominantOpportunityType,
        size: cluster.hexagons.length,
        bounds: cluster.bounds
      }))
    } catch (error) {
      console.error('Error getting hexagon clusters:', error)
      return []
    }
  }

  /**
   * Get hexagon temporal analysis (if available)
   */
  async getHexagonTrends(
    h3Index: string,
    days = 7,
    resolution = 4
  ): Promise<any> {
    try {
      // This would typically require historical data
      // For now, we'll simulate trend data
      const currentHex = await this.getHexagonByIndex(h3Index, resolution)
      
      if (!currentHex) {
        return null
      }

      const trends = {
        hexagon: h3Index,
        current_score: currentHex.score,
        historical_data: Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          score: currentHex.score + (Math.random() - 0.5) * 0.2, // ±10% variation
          vessel_density: (currentHex.vesselDensity || 0) + (Math.random() - 0.5) * 10
        })),
        trend_direction: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        volatility: Math.random() * 0.3, // 0-30% volatility
        forecast: {
          next_7_days: currentHex.score * (0.95 + Math.random() * 0.1), // ±5% change
          confidence: 0.7 + Math.random() * 0.2 // 70-90% confidence
        }
      }

      return trends
    } catch (error) {
      console.error(`Error getting trends for hexagon ${h3Index}:`, error)
      return null
    }
  }

  /**
   * Batch update hexagon analysis
   */
  async batchUpdateHexagons(
    h3Indices: string[],
    resolution = 4,
    forceRefresh = true
  ): Promise<Record<string, H3HexagonOpportunity | null>> {
    try {
      const result = await this.generateH3Hexagons(resolution, undefined, forceRefresh)
      const hexagonMap = new Map(result.data.map(hex => [hex.hexagon, hex]))

      const updates: Record<string, H3HexagonOpportunity | null> = {}
      
      h3Indices.forEach(index => {
        updates[index] = hexagonMap.get(index) || null
      })

      return updates
    } catch (error) {
      console.error('Error in batch hexagon update:', error)
      return {}
    }
  }

  // Private helper methods

  private analyzeH3Grid(hexagons: H3HexagonOpportunity[]) {
    const totalHexagons = hexagons.length
    const highOpportunity = hexagons.filter(h => h.score > 0.8).length
    const mediumOpportunity = hexagons.filter(h => h.score > 0.5 && h.score <= 0.8).length
    const lowOpportunity = hexagons.filter(h => h.score <= 0.5).length
    const averageScore = hexagons.reduce((sum, h) => sum + h.score, 0) / totalHexagons
    const totalRevenuePotential = hexagons.reduce((sum, h) => sum + (h.monthlyRevenuePotential || 0), 0)

    const landCells = hexagons.filter(h => h.isLand).length
    const waterCells = hexagons.filter(h => !h.isLand).length

    const coverageByRegion = this.calculateRegionalCoverage(hexagons)

    return {
      summary: {
        totalHexagons,
        highOpportunity,
        mediumOpportunity,
        lowOpportunity,
        averageScore: Math.round(averageScore * 1000) / 1000,
        totalRevenuePotential: Math.round(totalRevenuePotential)
      },
      spatialDistribution: {
        landCells,
        waterCells,
        coverageByRegion
      }
    }
  }

  private calculateRegionalCoverage(hexagons: H3HexagonOpportunity[]): Record<string, number> {
    const regions: Record<string, number> = {}

    hexagons.forEach(hex => {
      const [lng, lat] = hex.center
      const region = this.determineRegion(lat, lng)
      regions[region] = (regions[region] || 0) + 1
    })

    return regions
  }

  private determineRegion(lat: number, lng: number): string {
    if (lat > 66.5) return 'arctic'
    if (lat < -66.5) return 'antarctic'
    if (lat > 30 && lng < -60 && lng > -130) return 'north_america'
    if (lat > 35 && lng > -10 && lng < 40) return 'europe'
    if (lat > 10 && lat < 35 && lng > 35 && lng < 75) return 'middle_east'
    if (lat > 0 && lat < 40 && lng > 70 && lng < 140) return 'asia'
    if (lat > -35 && lat < 35 && lng > 110 && lng < 180) return 'oceania'
    if (lat > -35 && lat < 15 && lng > -80 && lng < -35) return 'south_america'
    if (lat > -35 && lat < 35 && lng > -20 && lng < 55) return 'africa'
    
    // Ocean regions
    if (lat > 0 && lng < -30 && lng > -70) return 'north_atlantic'
    if (lat < 0 && lng < -20 && lng > -70) return 'south_atlantic'
    if (lng > 30 && lng < 120 && lat > -40 && lat < 30) return 'indian_ocean'
    if (lng > 120 || lng < -120) return 'pacific'

    return 'other'
  }

  private clusterHexagons(hexagons: H3HexagonOpportunity[], minClusterSize: number): any[] {
    // Simple clustering algorithm based on geographic proximity and score similarity
    const clusters: any[] = []
    const processed = new Set<string>()

    hexagons.forEach(hex => {
      if (processed.has(hex.hexagon)) return

      const cluster = {
        hexagons: [hex],
        centroid: [...hex.center],
        averageScore: hex.score,
        totalRevenuePotential: hex.monthlyRevenuePotential || 0,
        dominantOpportunityType: hex.opportunityType,
        bounds: {
          minLat: hex.center[1],
          maxLat: hex.center[1],
          minLng: hex.center[0],
          maxLng: hex.center[0]
        }
      }

      processed.add(hex.hexagon)

      // Find nearby similar hexagons
      hexagons.forEach(otherHex => {
        if (processed.has(otherHex.hexagon)) return

        const distance = this.calculateDistance(
          hex.center[1], hex.center[0],
          otherHex.center[1], otherHex.center[0]
        )
        const scoreDiff = Math.abs(hex.score - otherHex.score)

        // Group if within 100km and score difference < 0.3
        if (distance < 100 && scoreDiff < 0.3) {
          cluster.hexagons.push(otherHex)
          processed.add(otherHex.hexagon)
          
          // Update cluster properties
          cluster.totalRevenuePotential += otherHex.monthlyRevenuePotential || 0
          cluster.bounds.minLat = Math.min(cluster.bounds.minLat, otherHex.center[1])
          cluster.bounds.maxLat = Math.max(cluster.bounds.maxLat, otherHex.center[1])
          cluster.bounds.minLng = Math.min(cluster.bounds.minLng, otherHex.center[0])
          cluster.bounds.maxLng = Math.max(cluster.bounds.maxLng, otherHex.center[0])
        }
      })

      // Calculate final cluster properties
      if (cluster.hexagons.length >= minClusterSize) {
        cluster.averageScore = cluster.hexagons.reduce((sum, h) => sum + h.score, 0) / cluster.hexagons.length
        
        // Calculate centroid
        const sumLat = cluster.hexagons.reduce((sum, h) => sum + h.center[1], 0)
        const sumLng = cluster.hexagons.reduce((sum, h) => sum + h.center[0], 0)
        cluster.centroid = [sumLng / cluster.hexagons.length, sumLat / cluster.hexagons.length]

        clusters.push(cluster)
      }
    })

    return clusters
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Clear H3 grid cache
   */
  clearCache() {
    unifiedDataIntegration.clearCache()
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      cache: unifiedDataIntegration.getCacheStatus(),
      errors: unifiedDataIntegration.getErrorHistory().filter(e => 
        e.endpoint.includes('hexagon') || e.endpoint.includes('opportunities')
      )
    }
  }
}

// Export singleton instance
export const apiH3GridService = new APIH3GridService()
export default apiH3GridService