/**
 * Route Analysis Service
 *
 * Intelligence-grade route analysis combining:
 * - Route generation (Valhalla/Mapbox)
 * - Multi-INT waypoint analysis (GEOINT, SIGINT, OSINT, Temporal)
 * - Anomaly detection along route
 * - Risk scoring and recommendations
 *
 * Use cases:
 * - Subject movement analysis
 * - Operational planning
 * - Route reconnaissance
 */

import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { generateRoute, type Route, type TransportMode } from './valhallaRoutingService'
import { getMultiIntReportService, type MultiIntEventAnalysis } from './multiIntReportService'

export interface RouteAnalysisOptions {
  from: [number, number] // [lng, lat]
  to: [number, number] // [lng, lat]
  mode: TransportMode
  startTime?: Date
  analysisInterval?: number // meters between analysis points (default: 500m)
}

export interface AnalyzedWaypoint {
  coordinates: [number, number] // [lng, lat]
  timestamp: Date
  distanceFromStart: number // meters
  analysis: MultiIntEventAnalysis
}

export interface RouteAnomalyDetection {
  hasAnomalies: boolean
  anomalyCount: number
  anomalies: Array<{
    waypointIndex: number
    location: string
    reasons: string[]
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

export interface RouteRiskAssessment {
  overallRiskScore: number // 0-100 (weighted average)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  highRiskSegments: Array<{
    startIndex: number
    endIndex: number
    riskScore: number
    reason: string
  }>
  recommendedActions: string[]
}

export interface AnalyzedRoute {
  // Route geometry and metadata
  route: Route
  mode: TransportMode
  startTime: Date

  // Analyzed waypoints with multi-INT data
  analyzedWaypoints: AnalyzedWaypoint[]

  // Anomaly detection
  anomalyDetection: RouteAnomalyDetection

  // Risk assessment
  riskAssessment: RouteRiskAssessment

  // Overall statistics
  statistics: {
    totalDistance: number // meters
    totalDuration: number // seconds
    averageConfidence: number // 0-100
    sigintCoverage: number // percentage of route with cell coverage
    highRiskPercentage: number // percentage of route in high-risk areas
  }
}

export class RouteAnalysisService {
  private multiIntService = getMultiIntReportService()

  /**
   * Generate and analyze a route with full multi-INT analysis
   */
  async generateAnalyzedRoute(options: RouteAnalysisOptions): Promise<AnalyzedRoute> {
    const {
      from,
      to,
      mode,
      startTime = new Date(),
      analysisInterval = 500 // 500m between analysis points
    } = options

    console.log('🗺️ Generating route with intelligence analysis...')

    // Step 1: Generate base route
    const route = await generateRoute(from, to, mode, startTime)
    console.log(`✓ Route generated: ${(route.distance / 1000).toFixed(2)}km, ${Math.round(route.duration / 60)}min`)

    // Step 2: Select waypoints for analysis (every ~500m)
    const analysisWaypoints = this.selectAnalysisWaypoints(route, analysisInterval)
    console.log(`🔍 Analyzing ${analysisWaypoints.length} waypoints along route...`)

    // Step 3: Perform multi-INT analysis on each waypoint
    const analyzedWaypoints = await this.analyzeWaypoints(analysisWaypoints, route)
    console.log('✓ Multi-INT analysis complete')

    // Step 4: Detect anomalies
    const anomalyDetection = this.detectAnomalies(analyzedWaypoints)
    console.log(`⚠️ Detected ${anomalyDetection.anomalyCount} anomalies`)

    // Step 5: Calculate risk assessment
    const riskAssessment = this.calculateRouteRisk(analyzedWaypoints, anomalyDetection)
    console.log(`📊 Overall risk level: ${riskAssessment.riskLevel.toUpperCase()}`)

    // Step 6: Calculate statistics
    const statistics = this.calculateStatistics(route, analyzedWaypoints)

    return {
      route,
      mode,
      startTime,
      analyzedWaypoints,
      anomalyDetection,
      riskAssessment,
      statistics
    }
  }

  /**
   * Select waypoints along route for analysis
   */
  private selectAnalysisWaypoints(route: Route, intervalMeters: number): RoutePoint[] {
    const waypoints: RoutePoint[] = []
    let accumulatedDistance = 0
    let nextAnalysisPoint = 0

    // Always include start point
    if (route.path.length > 0) {
      const [lng, lat] = route.path[0]
      waypoints.push({
        coordinates: [lng, lat],
        timestamp: route.waypoints[0]?.timestamp || new Date(),
        distanceFromStart: 0
      })
    }

    // Add points at regular intervals
    for (let i = 1; i < route.path.length; i++) {
      const [lng1, lat1] = route.path[i - 1]
      const [lng2, lat2] = route.path[i]
      const segmentDistance = this.haversineDistance(lat1, lng1, lat2, lng2)
      accumulatedDistance += segmentDistance

      if (accumulatedDistance >= nextAnalysisPoint) {
        // Calculate timestamp for this point
        const progress = accumulatedDistance / route.distance
        const timestamp = new Date(
          route.waypoints[0].timestamp.getTime() + progress * route.duration * 1000
        )

        waypoints.push({
          coordinates: [lng2, lat2],
          timestamp,
          distanceFromStart: accumulatedDistance
        })

        nextAnalysisPoint += intervalMeters
      }
    }

    // Always include end point
    if (route.path.length > 0) {
      const [lng, lat] = route.path[route.path.length - 1]
      const lastWaypoint = waypoints[waypoints.length - 1]

      // Only add if not already added
      if (lastWaypoint.distanceFromStart < route.distance - 100) {
        waypoints.push({
          coordinates: [lng, lat],
          timestamp: route.waypoints[route.waypoints.length - 1]?.timestamp || new Date(),
          distanceFromStart: route.distance
        })
      }
    }

    return waypoints
  }

  /**
   * Analyze waypoints with multi-INT analysis
   */
  private async analyzeWaypoints(
    waypoints: RoutePoint[],
    route: Route
  ): Promise<AnalyzedWaypoint[]> {
    const analyzedWaypoints: AnalyzedWaypoint[] = []

    for (const waypoint of waypoints) {
      // Create a synthetic timeline event for multi-INT analysis
      const event: TimelineEvent = {
        id: `route-waypoint-${analyzedWaypoints.length}`,
        timestamp: waypoint.timestamp.toISOString(),
        title: `Route waypoint at ${(waypoint.distanceFromStart / 1000).toFixed(2)}km`,
        description: `Analysis point along ${route.summary || 'route'}`,
        location: {
          name: `Waypoint ${analyzedWaypoints.length + 1}`,
          coordinates: waypoint.coordinates,
          address: undefined
        },
        subjects: [],
        significance: 'routine'
      }

      // Perform multi-INT analysis
      const analysis = await this.multiIntService.analyzeEvent(event)

      analyzedWaypoints.push({
        coordinates: waypoint.coordinates,
        timestamp: waypoint.timestamp,
        distanceFromStart: waypoint.distanceFromStart,
        analysis
      })
    }

    return analyzedWaypoints
  }

  /**
   * Detect anomalies along route
   */
  private detectAnomalies(waypoints: AnalyzedWaypoint[]): RouteAnomalyDetection {
    const anomalies: RouteAnomalyDetection['anomalies'] = []

    waypoints.forEach((waypoint, index) => {
      const reasons: string[] = []
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

      // Check temporal anomalies
      if (waypoint.analysis.temporal.is_anomalous) {
        reasons.push(...waypoint.analysis.temporal.anomaly_reasons)
        severity = 'medium'
      }

      // Check OSINT-based anomalies
      if (waypoint.analysis.osint) {
        if (waypoint.analysis.osint.owner_subject_link) {
          reasons.push(`Location owned by investigation subject`)
          severity = 'critical'
        }
        if (waypoint.analysis.osint.risk_score >= 70) {
          reasons.push(`High-risk location (score: ${waypoint.analysis.osint.risk_score}/100)`)
          severity = severity === 'critical' ? 'critical' : 'high'
        }
      }

      // Check GEOINT anomalies
      if (waypoint.analysis.geoint.land_use_zone === 'industrial' &&
          waypoint.analysis.temporal.time_of_day === 'late_night') {
        reasons.push('Industrial area during late-night hours')
        severity = severity === 'critical' ? 'critical' : 'high'
      }

      // Add to anomalies if any detected
      if (reasons.length > 0) {
        anomalies.push({
          waypointIndex: index,
          location: waypoint.analysis.location.name,
          reasons,
          severity
        })
      }
    })

    return {
      hasAnomalies: anomalies.length > 0,
      anomalyCount: anomalies.length,
      anomalies
    }
  }

  /**
   * Calculate route risk assessment
   */
  private calculateRouteRisk(
    waypoints: AnalyzedWaypoint[],
    anomalyDetection: RouteAnomalyDetection
  ): RouteRiskAssessment {
    // Calculate weighted average risk score
    const riskScores = waypoints.map(w => {
      let score = 0

      // Base score from OSINT risk
      if (w.analysis.osint) {
        score += w.analysis.osint.risk_score * 0.4
      }

      // Temporal anomaly contribution
      if (w.analysis.temporal.is_anomalous) {
        score += 30
      }

      // Risk indicator contribution
      score += w.analysis.risk_indicators.length * 10

      return Math.min(score, 100)
    })

    const overallRiskScore = Math.round(
      riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
    )

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (overallRiskScore >= 80 || anomalyDetection.anomalies.some(a => a.severity === 'critical')) {
      riskLevel = 'critical'
    } else if (overallRiskScore >= 60) {
      riskLevel = 'high'
    } else if (overallRiskScore >= 30) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // Identify high-risk segments (consecutive waypoints with risk > 60)
    const highRiskSegments: RouteRiskAssessment['highRiskSegments'] = []
    let segmentStart: number | null = null

    riskScores.forEach((score, index) => {
      if (score >= 60) {
        if (segmentStart === null) {
          segmentStart = index
        }
      } else {
        if (segmentStart !== null) {
          const avgScore = riskScores
            .slice(segmentStart, index)
            .reduce((sum, s) => sum + s, 0) / (index - segmentStart)

          highRiskSegments.push({
            startIndex: segmentStart,
            endIndex: index - 1,
            riskScore: Math.round(avgScore),
            reason: this.getHighRiskSegmentReason(waypoints.slice(segmentStart, index))
          })

          segmentStart = null
        }
      }
    })

    // Close final segment if needed
    if (segmentStart !== null) {
      const avgScore = riskScores
        .slice(segmentStart)
        .reduce((sum, s) => sum + s, 0) / (riskScores.length - segmentStart)

      highRiskSegments.push({
        startIndex: segmentStart,
        endIndex: waypoints.length - 1,
        riskScore: Math.round(avgScore),
        reason: this.getHighRiskSegmentReason(waypoints.slice(segmentStart))
      })
    }

    // Generate recommendations
    const recommendedActions = this.generateRouteRecommendations(
      riskLevel,
      anomalyDetection,
      highRiskSegments
    )

    return {
      overallRiskScore,
      riskLevel,
      highRiskSegments,
      recommendedActions
    }
  }

  /**
   * Get reason for high-risk segment
   */
  private getHighRiskSegmentReason(waypoints: AnalyzedWaypoint[]): string {
    const reasons = new Set<string>()

    waypoints.forEach(w => {
      if (w.analysis.temporal.is_anomalous) {
        reasons.add('unusual timing')
      }
      if (w.analysis.osint?.risk_score >= 70) {
        reasons.add('high-risk locations')
      }
      if (w.analysis.geoint.land_use_zone === 'industrial') {
        reasons.add('industrial area')
      }
    })

    return Array.from(reasons).join(', ')
  }

  /**
   * Generate route-level recommendations
   */
  private generateRouteRecommendations(
    riskLevel: string,
    anomalyDetection: RouteAnomalyDetection,
    highRiskSegments: RouteRiskAssessment['highRiskSegments']
  ): string[] {
    const actions: string[] = []

    if (riskLevel === 'critical') {
      actions.push('⚠️ CRITICAL: Do not proceed without tactical support')
      actions.push('🚨 Request backup units along route')
      actions.push('📡 Establish continuous communication protocol')
    } else if (riskLevel === 'high') {
      actions.push('⚠️ High-risk route: Exercise extreme caution')
      actions.push('👥 Consider multi-agent surveillance')
    }

    if (anomalyDetection.anomalies.some(a => a.severity === 'critical')) {
      actions.push('🔍 Investigate critical anomalies before route execution')
    }

    if (highRiskSegments.length > 0) {
      actions.push(`📍 ${highRiskSegments.length} high-risk segment(s) identified - plan alternate routes`)
    }

    if (actions.length === 0) {
      actions.push('✓ Route appears safe for standard surveillance operations')
    }

    return actions
  }

  /**
   * Calculate route statistics
   */
  private calculateStatistics(
    route: Route,
    waypoints: AnalyzedWaypoint[]
  ): AnalyzedRoute['statistics'] {
    // Average confidence
    const averageConfidence = Math.round(
      waypoints.reduce((sum, w) => sum + w.analysis.confidence_score, 0) / waypoints.length
    )

    // SIGINT coverage (waypoints with cell tower data)
    const sigintCoverage = Math.round(
      (waypoints.filter(w => w.analysis.sigint).length / waypoints.length) * 100
    )

    // High-risk percentage (waypoints with risk score >= 60)
    const highRiskCount = waypoints.filter(w => {
      const riskScore = (w.analysis.osint?.risk_score || 0) * 0.4 +
                       (w.analysis.temporal.is_anomalous ? 30 : 0) +
                       w.analysis.risk_indicators.length * 10
      return riskScore >= 60
    }).length
    const highRiskPercentage = Math.round((highRiskCount / waypoints.length) * 100)

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      averageConfidence,
      sigintCoverage,
      highRiskPercentage
    }
  }

  /**
   * Haversine distance calculation (copied from valhalla service for independence)
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}

// Internal type
interface RoutePoint {
  coordinates: [number, number]
  timestamp: Date
  distanceFromStart: number
}

// Singleton instance
let routeAnalysisService: RouteAnalysisService | null = null

export function getRouteAnalysisService(): RouteAnalysisService {
  if (!routeAnalysisService) {
    routeAnalysisService = new RouteAnalysisService()
  }
  return routeAnalysisService
}
