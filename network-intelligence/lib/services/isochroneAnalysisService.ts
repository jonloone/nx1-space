/**
 * Isochrone Analysis Service
 *
 * Advanced reachability analysis with intelligence assessment:
 * - Multi-modal isochrone generation (driving, walking, cycling)
 * - Coverage area analysis
 * - Accessibility scoring
 * - Strategic location assessment
 * - Emergency response time analysis
 *
 * Use Cases:
 * - Ground station accessibility planning
 * - Service coverage optimization
 * - Emergency response analysis
 * - Site selection intelligence
 */

import { generateIsochrone, type TransportMode, type IsochroneContour } from './valhallaRoutingService'
import { getMultiIntReportService, type MultiIntEventAnalysis } from './multiIntReportService'

export interface IsochroneAnalysisOptions {
  center: [number, number] // [lng, lat]
  locationName?: string
  modes: TransportMode[] // Multiple modes to compare
  contours: number[] // Time contours in minutes
  analysisType?: 'coverage' | 'accessibility' | 'emergency-response' | 'strategic'
}

export interface IsochroneAnalysisResult {
  location: {
    center: [number, number]
    name?: string
  }
  timestamp: Date

  // Multi-modal isochrone data
  isochrones: Array<{
    mode: TransportMode
    contours: IsochroneContour[]
    coverage: {
      area: number // square kilometers
      population?: number // estimated population covered
      pointsOfInterest?: number // POIs within area
    }
  }>

  // Comparative analysis
  comparison: {
    fastestMode: TransportMode
    largestCoverage: TransportMode
    modeRankings: Array<{
      mode: TransportMode
      score: number // 0-100
      rank: number
    }>
  }

  // Accessibility scoring
  accessibility: {
    overallScore: number // 0-100
    scores: {
      driving: number
      walking: number
      cycling: number
    }
    level: 'excellent' | 'good' | 'moderate' | 'poor' | 'very_poor'
    factors: string[]
  }

  // Strategic assessment
  intelligence: {
    summary: string
    keyFindings: string[]
    strengths: string[]
    weaknesses: string[]
    recommendedActions: string[]
  }

  // Statistics
  statistics: {
    totalArea: number // Total coverage across all modes (sq km)
    averageReachability: number // Average time to reach boundaries
    coverageOverlap: number // Percentage of overlapping coverage
  }
}

export class IsochroneAnalysisService {
  private multiIntService = getMultiIntReportService()

  /**
   * Generate comprehensive isochrone analysis
   */
  async analyzeReachability(options: IsochroneAnalysisOptions): Promise<IsochroneAnalysisResult> {
    const {
      center,
      locationName,
      modes,
      contours,
      analysisType = 'coverage'
    } = options

    console.log(`🗺️ Analyzing reachability for ${modes.length} modes at ${locationName || 'location'}`)

    // Generate isochrones for each mode
    const isochrones = await this.generateMultiModalIsochrones(center, modes, contours)

    // Calculate coverage metrics
    const coverageMetrics = this.calculateCoverageMetrics(isochrones)

    // Compare modes
    const comparison = this.compareModes(isochrones, analysisType)

    // Calculate accessibility scores
    const accessibility = this.calculateAccessibility(isochrones, comparison)

    // Generate strategic intelligence
    const intelligence = this.generateIntelligence(
      locationName || 'Location',
      isochrones,
      comparison,
      accessibility,
      analysisType
    )

    // Calculate statistics
    const statistics = this.calculateStatistics(isochrones)

    return {
      location: {
        center,
        name: locationName
      },
      timestamp: new Date(),
      isochrones,
      comparison,
      accessibility,
      intelligence,
      statistics
    }
  }

  /**
   * Generate isochrones for multiple modes
   */
  private async generateMultiModalIsochrones(
    center: [number, number],
    modes: TransportMode[],
    contours: number[]
  ): Promise<IsochroneAnalysisResult['isochrones']> {
    const results: IsochroneAnalysisResult['isochrones'] = []

    for (const mode of modes) {
      try {
        const isochroneContours = await generateIsochrone({
          center,
          mode,
          contours,
          polygons: true,
          denoise: 0.5
        })

        // Calculate coverage area (rough approximation)
        const largestContour = isochroneContours[isochroneContours.length - 1]
        const area = this.estimateArea(largestContour)

        results.push({
          mode,
          contours: isochroneContours,
          coverage: {
            area,
            population: this.estimatePopulation(area),
            pointsOfInterest: this.estimatePOIs(area)
          }
        })
      } catch (error) {
        console.error(`Failed to generate isochrone for ${mode}:`, error)
      }
    }

    return results
  }

  /**
   * Calculate coverage metrics
   */
  private calculateCoverageMetrics(isochrones: IsochroneAnalysisResult['isochrones']): void {
    // This would calculate detailed coverage metrics
    // For now, metrics are embedded in the isochrone objects
    return
  }

  /**
   * Compare transportation modes
   */
  private compareModes(
    isochrones: IsochroneAnalysisResult['isochrones'],
    analysisType: string
  ): IsochroneAnalysisResult['comparison'] {
    // Rank modes by coverage area
    const rankings = isochrones
      .map((iso, index) => ({
        mode: iso.mode,
        score: this.calculateModeScore(iso, analysisType),
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }))

    const fastestMode = rankings[0]?.mode || 'driving'
    const largestCoverage = isochrones.reduce((max, iso) =>
      iso.coverage.area > (max?.coverage.area || 0) ? iso : max
    )?.mode || 'driving'

    return {
      fastestMode,
      largestCoverage,
      modeRankings: rankings
    }
  }

  /**
   * Calculate mode score based on analysis type
   */
  private calculateModeScore(iso: IsochroneAnalysisResult['isochrones'][0], analysisType: string): number {
    let score = 50 // Base score

    // Weight by coverage area
    score += Math.min(30, iso.coverage.area * 2)

    // Bonus for specific analysis types
    if (analysisType === 'emergency-response') {
      // Driving gets bonus for emergency response
      if (iso.mode === 'driving') score += 20
    } else if (analysisType === 'accessibility') {
      // Walking gets bonus for accessibility
      if (iso.mode === 'walking') score += 15
    } else if (analysisType === 'strategic') {
      // Balanced scoring
      score += 10
    }

    // Population coverage bonus
    if (iso.coverage.population) {
      score += Math.min(20, iso.coverage.population / 10000)
    }

    return Math.min(100, Math.round(score))
  }

  /**
   * Calculate accessibility scores
   */
  private calculateAccessibility(
    isochrones: IsochroneAnalysisResult['isochrones'],
    comparison: IsochroneAnalysisResult['comparison']
  ): IsochroneAnalysisResult['accessibility'] {
    const scores = {
      driving: 0,
      walking: 0,
      cycling: 0
    }

    // Calculate individual scores
    isochrones.forEach(iso => {
      const ranking = comparison.modeRankings.find(r => r.mode === iso.mode)
      if (ranking) {
        scores[iso.mode] = ranking.score
      }
    })

    // Overall score (weighted average)
    const overallScore = Math.round(
      (scores.driving * 0.4 + scores.walking * 0.3 + scores.cycling * 0.3)
    )

    // Determine accessibility level
    let level: IsochroneAnalysisResult['accessibility']['level']
    if (overallScore >= 80) level = 'excellent'
    else if (overallScore >= 65) level = 'good'
    else if (overallScore >= 50) level = 'moderate'
    else if (overallScore >= 35) level = 'poor'
    else level = 'very_poor'

    // Identify factors
    const factors: string[] = []
    if (scores.driving >= 70) factors.push('Strong vehicle access')
    if (scores.walking >= 60) factors.push('Pedestrian-friendly area')
    if (scores.cycling >= 60) factors.push('Bike-accessible routes')
    if (scores.driving < 50) factors.push('Limited road network')
    if (scores.walking < 40) factors.push('Poor pedestrian infrastructure')

    return {
      overallScore,
      scores,
      level,
      factors
    }
  }

  /**
   * Generate strategic intelligence assessment
   */
  private generateIntelligence(
    locationName: string,
    isochrones: IsochroneAnalysisResult['isochrones'],
    comparison: IsochroneAnalysisResult['comparison'],
    accessibility: IsochroneAnalysisResult['accessibility'],
    analysisType: string
  ): IsochroneAnalysisResult['intelligence'] {
    const keyFindings: string[] = []
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendedActions: string[] = []

    // Key findings based on comparison
    keyFindings.push(
      `${comparison.fastestMode} provides fastest access to surrounding areas`
    )
    keyFindings.push(
      `${comparison.largestCoverage} mode offers largest coverage radius`
    )

    // Accessibility-based findings
    if (accessibility.level === 'excellent' || accessibility.level === 'good') {
      strengths.push(`${accessibility.level} overall accessibility (score: ${accessibility.overallScore}/100)`)
    } else {
      weaknesses.push(`${accessibility.level} overall accessibility (score: ${accessibility.overallScore}/100)`)
    }

    // Mode-specific analysis
    isochrones.forEach(iso => {
      const ranking = comparison.modeRankings.find(r => r.mode === iso.mode)
      if (ranking && ranking.score >= 70) {
        strengths.push(`Strong ${iso.mode} access with ${iso.coverage.area.toFixed(1)} sq km coverage`)
      } else if (ranking && ranking.score < 50) {
        weaknesses.push(`Limited ${iso.mode} accessibility`)
      }
    })

    // Generate recommendations based on analysis type
    if (analysisType === 'emergency-response') {
      if (accessibility.scores.driving < 60) {
        recommendedActions.push('Improve road network for emergency vehicle access')
      }
      recommendedActions.push('Establish multiple access routes for redundancy')
    } else if (analysisType === 'strategic') {
      if (weaknesses.length > 2) {
        recommendedActions.push('Consider infrastructure improvements to enhance accessibility')
      }
      if (accessibility.scores.walking < 50) {
        recommendedActions.push('Develop pedestrian pathways for local access')
      }
    }

    // Default recommendation
    if (recommendedActions.length === 0) {
      recommendedActions.push('Maintain current infrastructure and monitor accessibility metrics')
    }

    // Generate summary
    const summary = this.generateAccessibilitySummary(
      locationName,
      accessibility,
      comparison
    )

    return {
      summary,
      keyFindings,
      strengths,
      weaknesses,
      recommendedActions
    }
  }

  /**
   * Generate accessibility summary text
   */
  private generateAccessibilitySummary(
    locationName: string,
    accessibility: IsochroneAnalysisResult['accessibility'],
    comparison: IsochroneAnalysisResult['comparison']
  ): string {
    return `${locationName} exhibits **${accessibility.level.replace('_', ' ')}** accessibility (score: ${accessibility.overallScore}/100). ${comparison.fastestMode} mode provides optimal access, with ${comparison.modeRankings.length} transportation modes analyzed.`
  }

  /**
   * Calculate overall statistics
   */
  private calculateStatistics(isochrones: IsochroneAnalysisResult['isochrones']): IsochroneAnalysisResult['statistics'] {
    const totalArea = isochrones.reduce((sum, iso) => sum + iso.coverage.area, 0)

    // Average reachability (using largest contour as proxy)
    const avgReachability = isochrones.length > 0
      ? isochrones.reduce((sum, iso) => {
          const largestContour = iso.contours[iso.contours.length - 1]
          return sum + (largestContour?.time || 0)
        }, 0) / isochrones.length
      : 0

    // Coverage overlap (simplified calculation)
    const coverageOverlap = isochrones.length > 1
      ? Math.round((1 - (totalArea / (isochrones.length * Math.max(...isochrones.map(i => i.coverage.area))))) * 100)
      : 0

    return {
      totalArea: Math.round(totalArea * 10) / 10,
      averageReachability: Math.round(avgReachability),
      coverageOverlap: Math.max(0, Math.min(100, coverageOverlap))
    }
  }

  /**
   * Estimate area from isochrone polygon (simplified)
   */
  private estimateArea(contour: IsochroneContour): number {
    // Simplified area calculation (would use proper geospatial calculations in production)
    // For now, estimate based on time (rough approximation)
    const timeFactor = contour.time / 60 // Convert to hours
    const speedKmh = 40 // Average speed
    const radius = timeFactor * speedKmh
    const area = Math.PI * radius * radius

    return Math.round(area * 10) / 10
  }

  /**
   * Estimate population within area
   */
  private estimatePopulation(area: number): number {
    // Rough estimate: 1000 people per sq km (urban average)
    return Math.round(area * 1000)
  }

  /**
   * Estimate points of interest within area
   */
  private estimatePOIs(area: number): number {
    // Rough estimate: 50 POIs per sq km
    return Math.round(area * 50)
  }
}

// Singleton instance
let isochroneAnalysisService: IsochroneAnalysisService | null = null

export function getIsochroneAnalysisService(): IsochroneAnalysisService {
  if (!isochroneAnalysisService) {
    isochroneAnalysisService = new IsochroneAnalysisService()
  }
  return isochroneAnalysisService
}
