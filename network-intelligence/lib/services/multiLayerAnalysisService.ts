/**
 * Multi-Layer Analysis Service
 *
 * Integrates multiple analysis capabilities into unified intelligence workflows:
 * - Route analysis + satellite imagery
 * - Isochrone analysis + site assessment
 * - Change detection + route planning
 * - Comprehensive location intelligence
 *
 * Use Cases:
 * - Operational planning with full situational awareness
 * - Site selection with accessibility and imagery analysis
 * - Subject movement analysis with environmental context
 * - Strategic planning with multi-source intelligence
 */

import { getRouteAnalysisService, type AnalyzedRoute, type RouteAnalysisOptions } from './routeAnalysisService'
import { getSatelliteImageryService, type SatelliteImage } from './satelliteImageryService'
import { getImageryAnalysisService, type ActivityAnalysis, type ChangeDetectionResult } from './imageryAnalysisService'
import { getIsochroneAnalysisService, type IsochroneAnalysisResult, type IsochroneAnalysisOptions } from './isochroneAnalysisService'

export interface MultiLayerAnalysisOptions {
  center: [number, number] // [lng, lat]
  locationName?: string
  analysisTypes: ('route' | 'imagery' | 'isochrone' | 'all')[]

  // Route-specific options
  route?: {
    from?: [number, number]
    to?: [number, number]
    mode?: 'driving' | 'walking' | 'cycling'
  }

  // Imagery-specific options
  imagery?: {
    startDate?: Date
    endDate?: Date
    includeChangeDetection?: boolean
    includeActivityAnalysis?: boolean
  }

  // Isochrone-specific options
  isochrone?: {
    modes?: ('driving' | 'walking' | 'cycling')[]
    contours?: number[]
  }
}

export interface MultiLayerAnalysisResult {
  location: {
    center: [number, number]
    name?: string
  }
  timestamp: Date

  // Analysis results
  route?: AnalyzedRoute
  imagery?: {
    recentImages: SatelliteImage[]
    changeDetection?: ChangeDetectionResult
    activityAnalysis?: ActivityAnalysis
  }
  isochrone?: IsochroneAnalysisResult

  // Integrated intelligence
  integration: {
    summary: string
    overallRiskScore: number // 0-100 (composite)
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    keyFindings: string[]
    correlations: string[] // Cross-layer correlations
    recommendedActions: string[]
  }

  // Metadata
  metadata: {
    analysisTypes: string[]
    dataSourcesUsed: string[]
    confidenceScore: number // 0-100 (overall confidence)
  }
}

export class MultiLayerAnalysisService {
  private routeService = getRouteAnalysisService()
  private imageryService = getSatelliteImageryService()
  private imageryAnalysisService = getImageryAnalysisService()
  private isochroneService = getIsochroneAnalysisService()

  /**
   * Perform comprehensive multi-layer analysis
   */
  async analyzeLocation(options: MultiLayerAnalysisOptions): Promise<MultiLayerAnalysisResult> {
    const {
      center,
      locationName,
      analysisTypes,
      route: routeOptions,
      imagery: imageryOptions,
      isochrone: isochroneOptions
    } = options

    console.log(`🔍 Starting multi-layer analysis for ${locationName || 'location'}`)
    console.log(`📊 Analysis types: ${analysisTypes.join(', ')}`)

    const results: Partial<MultiLayerAnalysisResult> = {
      location: { center, name: locationName },
      timestamp: new Date()
    }

    const dataSourcesUsed: string[] = []
    const enabledAnalysisTypes: string[] = []

    // Run analyses in parallel where possible
    const analyses: Promise<void>[] = []

    // 1. Route Analysis
    if (analysisTypes.includes('route') || analysisTypes.includes('all')) {
      if (routeOptions?.from && routeOptions?.to) {
        enabledAnalysisTypes.push('route')
        analyses.push(
          this.runRouteAnalysis(routeOptions.from, routeOptions.to, routeOptions.mode || 'driving')
            .then(result => {
              results.route = result
              dataSourcesUsed.push('Valhalla Routing', 'Multi-INT Analysis')
            })
            .catch(err => console.error('Route analysis failed:', err))
        )
      } else {
        console.warn('⚠️ Route analysis requires from/to coordinates')
      }
    }

    // 2. Satellite Imagery Analysis
    if (analysisTypes.includes('imagery') || analysisTypes.includes('all')) {
      enabledAnalysisTypes.push('imagery')
      analyses.push(
        this.runImageryAnalysis(center, imageryOptions, locationName)
          .then(result => {
            results.imagery = result
            dataSourcesUsed.push('Sentinel-2', 'Imagery Analysis ML')
          })
          .catch(err => console.error('Imagery analysis failed:', err))
      )
    }

    // 3. Isochrone Analysis
    if (analysisTypes.includes('isochrone') || analysisTypes.includes('all')) {
      enabledAnalysisTypes.push('isochrone')
      analyses.push(
        this.runIsochroneAnalysis(center, locationName, isochroneOptions)
          .then(result => {
            results.isochrone = result
            dataSourcesUsed.push('Valhalla Isochrone')
          })
          .catch(err => console.error('Isochrone analysis failed:', err))
      )
    }

    // Wait for all analyses to complete
    await Promise.all(analyses)

    // Generate integrated intelligence
    const integration = this.generateIntegratedIntelligence(results, enabledAnalysisTypes)

    // Calculate metadata
    const metadata = this.calculateMetadata(enabledAnalysisTypes, dataSourcesUsed, results)

    return {
      ...results,
      integration,
      metadata
    } as MultiLayerAnalysisResult
  }

  /**
   * Run route analysis
   */
  private async runRouteAnalysis(
    from: [number, number],
    to: [number, number],
    mode: 'driving' | 'walking' | 'cycling'
  ): Promise<AnalyzedRoute> {
    console.log(`🗺️ Running route analysis (${mode})`)
    return await this.routeService.generateAnalyzedRoute({
      from,
      to,
      mode,
      startTime: new Date(),
      analysisInterval: 500
    })
  }

  /**
   * Run imagery analysis
   */
  private async runImageryAnalysis(
    center: [number, number],
    options: MultiLayerAnalysisOptions['imagery'],
    locationName?: string
  ): Promise<NonNullable<MultiLayerAnalysisResult['imagery']>> {
    console.log('🛰️ Running satellite imagery analysis')

    const startDate = options?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    const endDate = options?.endDate || new Date()

    // Get time-series imagery
    const timeSeries = await this.imageryService.getTimeSeries(
      center,
      startDate,
      endDate,
      { maxCloudCover: 20 }
    )

    const result: NonNullable<MultiLayerAnalysisResult['imagery']> = {
      recentImages: timeSeries.images
    }

    // Change detection (if enough images)
    if (options?.includeChangeDetection && timeSeries.images.length >= 2) {
      const beforeImage = timeSeries.images[0]
      const afterImage = timeSeries.images[timeSeries.images.length - 1]

      result.changeDetection = await this.imageryAnalysisService.detectChanges({
        beforeImage,
        afterImage,
        sensitivity: 'medium'
      })
    }

    // Activity analysis (if enabled)
    if (options?.includeActivityAnalysis) {
      result.activityAnalysis = await this.imageryAnalysisService.analyzeActivity(
        timeSeries,
        locationName
      )
    }

    return result
  }

  /**
   * Run isochrone analysis
   */
  private async runIsochroneAnalysis(
    center: [number, number],
    locationName: string | undefined,
    options: MultiLayerAnalysisOptions['isochrone']
  ): Promise<IsochroneAnalysisResult> {
    console.log('🎯 Running isochrone reachability analysis')

    return await this.isochroneService.analyzeReachability({
      center,
      locationName,
      modes: options?.modes || ['driving', 'walking', 'cycling'],
      contours: options?.contours || [15, 30, 45],
      analysisType: 'strategic'
    })
  }

  /**
   * Generate integrated intelligence from multiple analyses
   */
  private generateIntegratedIntelligence(
    results: Partial<MultiLayerAnalysisResult>,
    analysisTypes: string[]
  ): MultiLayerAnalysisResult['integration'] {
    const keyFindings: string[] = []
    const correlations: string[] = []
    const recommendedActions: string[] = []
    let overallRiskScore = 0
    let riskScoreCount = 0

    // Route intelligence
    if (results.route) {
      keyFindings.push(
        `Route analysis: ${results.route.riskAssessment.riskLevel} risk (${results.route.riskAssessment.overallRiskScore}/100)`
      )
      overallRiskScore += results.route.riskAssessment.overallRiskScore
      riskScoreCount++

      if (results.route.anomalyDetection.hasAnomalies) {
        keyFindings.push(`${results.route.anomalyDetection.anomalyCount} route anomalies detected`)
      }

      recommendedActions.push(...results.route.riskAssessment.recommendedActions)
    }

    // Imagery intelligence
    if (results.imagery) {
      if (results.imagery.changeDetection) {
        const cd = results.imagery.changeDetection
        keyFindings.push(
          `Satellite analysis: ${cd.summary.totalChanges} changes detected (${cd.summary.significantChanges} high-confidence)`
        )

        // Map change detection confidence to risk
        const changeRisk = 100 - cd.statistics.averageConfidence
        overallRiskScore += changeRisk
        riskScoreCount++
      }

      if (results.imagery.activityAnalysis) {
        const aa = results.imagery.activityAnalysis
        keyFindings.push(
          `Activity level: ${aa.activityLevel.replace('_', ' ')} (${aa.activityScore}/100)`
        )

        overallRiskScore += aa.activityScore
        riskScoreCount++

        recommendedActions.push(...aa.intelligence.recommendedActions)

        // Correlate with route if available
        if (results.route && aa.activityLevel === 'high' || aa.activityLevel === 'very_high') {
          correlations.push('High satellite activity correlates with route risk indicators')
        }
      }
    }

    // Isochrone intelligence
    if (results.isochrone) {
      keyFindings.push(
        `Accessibility: ${results.isochrone.accessibility.level.replace('_', ' ')} (${results.isochrone.accessibility.overallScore}/100)`
      )

      recommendedActions.push(...results.isochrone.intelligence.recommendedActions)

      // Inverse correlation (better accessibility = lower risk in this context)
      const accessibilityRisk = 100 - results.isochrone.accessibility.overallScore
      overallRiskScore += accessibilityRisk
      riskScoreCount++

      // Correlate with route if available
      if (results.route && results.isochrone.accessibility.level === 'poor') {
        correlations.push('Poor accessibility may impact route execution feasibility')
      }
    }

    // Calculate composite risk score
    const finalRiskScore = riskScoreCount > 0
      ? Math.round(overallRiskScore / riskScoreCount)
      : 50

    // Determine overall risk level
    let riskLevel: MultiLayerAnalysisResult['integration']['riskLevel']
    if (finalRiskScore >= 75) riskLevel = 'critical'
    else if (finalRiskScore >= 55) riskLevel = 'high'
    else if (finalRiskScore >= 35) riskLevel = 'medium'
    else riskLevel = 'low'

    // Generate summary
    const summary = this.generateIntegratedSummary(
      analysisTypes,
      keyFindings.length,
      riskLevel,
      finalRiskScore
    )

    // Deduplicate recommendations
    const uniqueActions = Array.from(new Set(recommendedActions)).slice(0, 5)

    return {
      summary,
      overallRiskScore: finalRiskScore,
      riskLevel,
      keyFindings,
      correlations,
      recommendedActions: uniqueActions
    }
  }

  /**
   * Generate integrated summary
   */
  private generateIntegratedSummary(
    analysisTypes: string[],
    findingsCount: number,
    riskLevel: string,
    riskScore: number
  ): string {
    const typesList = analysisTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
    return `Integrated **${typesList}** analysis complete. ${findingsCount} key finding(s) identified. Overall risk assessment: **${riskLevel.toUpperCase()}** (${riskScore}/100).`
  }

  /**
   * Calculate analysis metadata
   */
  private calculateMetadata(
    analysisTypes: string[],
    dataSources: string[],
    results: Partial<MultiLayerAnalysisResult>
  ): MultiLayerAnalysisResult['metadata'] {
    let totalConfidence = 0
    let confidenceCount = 0

    // Route confidence
    if (results.route) {
      totalConfidence += results.route.statistics.averageConfidence
      confidenceCount++
    }

    // Imagery confidence
    if (results.imagery?.changeDetection) {
      totalConfidence += results.imagery.changeDetection.statistics.averageConfidence
      confidenceCount++
    }

    // Isochrone is always high confidence (direct calculation)
    if (results.isochrone) {
      totalConfidence += 90
      confidenceCount++
    }

    const overallConfidence = confidenceCount > 0
      ? Math.round(totalConfidence / confidenceCount)
      : 75

    return {
      analysisTypes,
      dataSourcesUsed: Array.from(new Set(dataSources)),
      confidenceScore: overallConfidence
    }
  }

  /**
   * Quick operational planning analysis (preset workflow)
   */
  async quickOperationalPlan(
    from: [number, number],
    to: [number, number],
    locationName: string
  ): Promise<MultiLayerAnalysisResult> {
    return this.analyzeLocation({
      center: from,
      locationName,
      analysisTypes: ['route', 'isochrone'],
      route: { from, to, mode: 'driving' },
      isochrone: {
        modes: ['driving'],
        contours: [15, 30]
      }
    })
  }

  /**
   * Site assessment analysis (preset workflow)
   */
  async siteAssessment(
    center: [number, number],
    locationName: string
  ): Promise<MultiLayerAnalysisResult> {
    return this.analyzeLocation({
      center,
      locationName,
      analysisTypes: ['imagery', 'isochrone'],
      imagery: {
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
        endDate: new Date(),
        includeChangeDetection: true,
        includeActivityAnalysis: true
      },
      isochrone: {
        modes: ['driving', 'walking', 'cycling'],
        contours: [15, 30, 45]
      }
    })
  }
}

// Singleton instance
let multiLayerAnalysisService: MultiLayerAnalysisService | null = null

export function getMultiLayerAnalysisService(): MultiLayerAnalysisService {
  if (!multiLayerAnalysisService) {
    multiLayerAnalysisService = new MultiLayerAnalysisService()
  }
  return multiLayerAnalysisService
}
