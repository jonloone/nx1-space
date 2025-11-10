/**
 * Multi-INT Investigation Report Service
 * Generates comprehensive intelligence reports combining SIGINT, OSINT, GEOINT, and Temporal analysis
 */

import type { TimelineEvent } from '@/lib/types/chatArtifacts'
import { getCellTowerService } from './cellTowerLayerService'
import { getOSINTEnrichmentService } from './osintEnrichmentService'

export interface MultiIntEventAnalysis {
  event_id: string
  timestamp: string
  location: {
    name: string
    address?: string
    coordinates: [number, number]
  }

  // GEOINT Analysis
  geoint: {
    building_type?: string
    land_use_zone?: string
    address_verified: boolean
    contextual_notes: string[]
  }

  // SIGINT Analysis
  sigint?: {
    primary_tower_id: string
    operator: string
    radio_type: string
    distance_meters: number
    signal_strength: 'strong' | 'medium' | 'weak'
    coverage_notes: string
  }

  // OSINT Analysis
  osint?: {
    business_name?: string
    business_owner?: string
    owner_subject_link?: string
    operating_hours?: string
    business_status?: 'open' | 'closed'
    social_media_presence: 'high' | 'medium' | 'low' | 'none'
    suspicious_flags: string[]
    risk_score: number
  }

  // Temporal Analysis
  temporal: {
    time_of_day: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night'
    day_of_week: string
    is_anomalous: boolean
    anomaly_reasons: string[]
    traffic_level?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
    pedestrian_density?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  }

  // Overall Assessment
  intelligence_summary: string
  risk_indicators: string[]
  recommended_actions: string[]
  confidence_score: number // 0-100
}

export class MultiIntReportService {
  private cellTowerService = getCellTowerService()
  private osintService = getOSINTEnrichmentService()

  /**
   * Analyze a timeline event with multi-INT fusion
   */
  async analyzeEvent(event: TimelineEvent): Promise<MultiIntEventAnalysis> {
    const [lng, lat] = event.location.coordinates
    const timestamp = new Date(event.timestamp)

    // GEOINT Analysis
    const geoint = await this.analyzeGEOINT(event)

    // SIGINT Analysis
    const sigint = await this.analyzeSIGINT(lng, lat)

    // OSINT Analysis
    const osint = await this.analyzeOSINT(event.location.name)

    // Temporal Analysis
    const temporal = this.analyzeTemporal(timestamp, event)

    // Generate intelligence summary
    const intelligence_summary = this.generateSummary({
      event,
      geoint,
      sigint,
      osint,
      temporal
    })

    // Calculate risk indicators
    const risk_indicators = this.identifyRiskIndicators({
      event,
      geoint,
      sigint,
      osint,
      temporal
    })

    // Generate recommendations
    const recommended_actions = this.generateRecommendations({
      event,
      risk_indicators,
      osint
    })

    // Calculate confidence
    const confidence_score = this.calculateConfidence({
      geoint,
      sigint,
      osint,
      temporal
    })

    return {
      event_id: event.id,
      timestamp: event.timestamp,
      location: {
        name: event.location.name,
        address: event.location.address,
        coordinates: event.location.coordinates
      },
      geoint,
      sigint,
      osint,
      temporal,
      intelligence_summary,
      risk_indicators,
      recommended_actions,
      confidence_score
    }
  }

  /**
   * GEOINT Analysis
   */
  private async analyzeGEOINT(event: TimelineEvent): Promise<MultiIntEventAnalysis['geoint']> {
    // In production, this would query actual building/land use data
    const contextual_notes: string[] = []

    // Infer from location name
    const name = event.location.name.toLowerCase()
    let building_type: string | undefined
    let land_use_zone: string | undefined

    if (name.includes('warehouse') || name.includes('industrial')) {
      building_type = 'industrial'
      land_use_zone = 'industrial'
      contextual_notes.push('Industrial area - unusual for non-work hours')
    } else if (name.includes('office') || name.includes('tech')) {
      building_type = 'commercial'
      land_use_zone = 'commercial'
    } else if (name.includes('residence') || name.includes('apartment')) {
      building_type = 'residential'
      land_use_zone = 'residential'
    }

    // Address verification (simplified)
    const address_verified = !!event.location.address

    if (address_verified) {
      contextual_notes.push(`Address verified: ${event.location.address}`)
    }

    return {
      building_type,
      land_use_zone,
      address_verified,
      contextual_notes
    }
  }

  /**
   * SIGINT Analysis
   */
  private async analyzeSIGINT(
    longitude: number,
    latitude: number
  ): Promise<MultiIntEventAnalysis['sigint'] | undefined> {
    // Find nearby cell towers
    const towers = await this.cellTowerService.findNearbyTowers(longitude, latitude, 5000)

    if (towers.length === 0) return undefined

    const primaryTower = towers[0]

    return {
      primary_tower_id: primaryTower.tower_id,
      operator: primaryTower.operator,
      radio_type: primaryTower.radio,
      distance_meters: primaryTower.distance_meters,
      signal_strength: primaryTower.signal_strength_estimate,
      coverage_notes: `Subject's device would ping tower ${primaryTower.tower_id} (${primaryTower.operator} ${primaryTower.radio}). Signal strength: ${primaryTower.signal_strength_estimate}.`
    }
  }

  /**
   * OSINT Analysis
   */
  private async analyzeOSINT(
    locationName: string
  ): Promise<MultiIntEventAnalysis['osint'] | undefined> {
    // Try to find enriched place data
    // In production, this would do fuzzy matching or ID-based lookup
    const enrichedPlaces = this.osintService.getAllEnrichedPlaces()

    for (const place of enrichedPlaces) {
      if (locationName.toLowerCase().includes(place.name.toLowerCase())) {
        const socialMediaScore =
          (place.social_media?.yelp_reviews || 0) +
          (place.social_media?.google_reviews || 0)

        let social_media_presence: 'high' | 'medium' | 'low' | 'none'
        if (socialMediaScore > 100) social_media_presence = 'high'
        else if (socialMediaScore > 20) social_media_presence = 'medium'
        else if (socialMediaScore > 0) social_media_presence = 'low'
        else social_media_presence = 'none'

        return {
          business_name: place.name,
          business_owner: place.ownership?.owner_name,
          owner_subject_link: place.ownership?.owner_subject_id,
          operating_hours: place.business_hours
            ? `${place.business_hours.weekday.open}-${place.business_hours.weekday.close}`
            : undefined,
          business_status: this.osintService.isPlaceOpen(place.place_id) ? 'open' : 'closed',
          social_media_presence,
          suspicious_flags: place.suspicious?.flags || [],
          risk_score: place.suspicious?.risk_score || 0
        }
      }
    }

    return undefined
  }

  /**
   * Temporal Analysis
   */
  private analyzeTemporal(
    timestamp: Date,
    event: TimelineEvent
  ): MultiIntEventAnalysis['temporal'] {
    const hour = timestamp.getHours()
    const dayOfWeek = timestamp.toLocaleDateString('en-US', { weekday: 'long' })

    // Categorize time of day
    let time_of_day: MultiIntEventAnalysis['temporal']['time_of_day']
    if (hour >= 0 && hour < 5) time_of_day = 'late_night'
    else if (hour >= 5 && hour < 8) time_of_day = 'early_morning'
    else if (hour >= 8 && hour < 12) time_of_day = 'morning'
    else if (hour >= 12 && hour < 17) time_of_day = 'afternoon'
    else if (hour >= 17 && hour < 21) time_of_day = 'evening'
    else time_of_day = 'night'

    // Detect anomalies
    const anomaly_reasons: string[] = []
    let is_anomalous = false

    // Check if marked as anomaly or suspicious
    if (event.significance === 'anomaly' || event.significance === 'suspicious') {
      is_anomalous = true
      anomaly_reasons.push(`Event marked as ${event.significance}`)
    }

    // Time-based anomalies
    if (time_of_day === 'late_night' || time_of_day === 'early_morning') {
      is_anomalous = true
      anomaly_reasons.push(`Activity during ${time_of_day.replace('_', ' ')} hours (${hour}:00)`)
    }

    // Estimate traffic/pedestrian levels based on time
    let traffic_level: MultiIntEventAnalysis['temporal']['traffic_level']
    let pedestrian_density: MultiIntEventAnalysis['temporal']['pedestrian_density']

    if (time_of_day === 'late_night' || time_of_day === 'early_morning') {
      traffic_level = 'very_low'
      pedestrian_density = 'very_low'
    } else if (time_of_day === 'morning' || time_of_day === 'evening') {
      traffic_level = 'high'
      pedestrian_density = 'high'
    } else {
      traffic_level = 'medium'
      pedestrian_density = 'medium'
    }

    return {
      time_of_day,
      day_of_week: dayOfWeek,
      is_anomalous,
      anomaly_reasons,
      traffic_level,
      pedestrian_density
    }
  }

  /**
   * Generate intelligence summary
   */
  private generateSummary(data: {
    event: TimelineEvent
    geoint: MultiIntEventAnalysis['geoint']
    sigint?: MultiIntEventAnalysis['sigint']
    osint?: MultiIntEventAnalysis['osint']
    temporal: MultiIntEventAnalysis['temporal']
  }): string {
    const parts: string[] = []

    // Event header
    parts.push(`**${data.event.title}**`)
    parts.push(`Location: ${data.event.location.name}`)
    parts.push(`Time: ${new Date(data.event.timestamp).toLocaleString()}`)
    parts.push('')

    // GEOINT
    if (data.geoint.building_type || data.geoint.land_use_zone) {
      parts.push('**GEOINT:**')
      if (data.geoint.building_type) {
        parts.push(`- Building Type: ${data.geoint.building_type}`)
      }
      if (data.geoint.land_use_zone) {
        parts.push(`- Land Use: ${data.geoint.land_use_zone}`)
      }
      if (data.geoint.contextual_notes.length > 0) {
        data.geoint.contextual_notes.forEach(note => {
          parts.push(`- ${note}`)
        })
      }
      parts.push('')
    }

    // SIGINT
    if (data.sigint) {
      parts.push('**SIGINT:**')
      parts.push(`- Cell Tower: ${data.sigint.primary_tower_id}`)
      parts.push(`- Operator: ${data.sigint.operator} (${data.sigint.radio_type})`)
      parts.push(`- Distance: ${data.sigint.distance_meters}m`)
      parts.push(`- Signal Strength: ${data.sigint.signal_strength.toUpperCase()}`)
      parts.push(`- ${data.sigint.coverage_notes}`)
      parts.push('')
    }

    // OSINT
    if (data.osint) {
      parts.push('**OSINT:**')
      if (data.osint.business_name) {
        parts.push(`- Business: ${data.osint.business_name}`)
      }
      if (data.osint.business_owner) {
        parts.push(`- Owner: ${data.osint.business_owner}`)
        if (data.osint.owner_subject_link) {
          parts.push(`- ⚠️ **CRITICAL**: Owner is ${data.osint.owner_subject_link} (investigation subject)`)
        }
      }
      if (data.osint.business_status) {
        parts.push(`- Status: ${data.osint.business_status.toUpperCase()}`)
      }
      parts.push(`- Online Presence: ${data.osint.social_media_presence}`)
      if (data.osint.suspicious_flags.length > 0) {
        parts.push(`- Suspicious Indicators: ${data.osint.suspicious_flags.join(', ')}`)
      }
      parts.push(`- Risk Score: ${data.osint.risk_score}/100`)
      parts.push('')
    }

    // Temporal
    parts.push('**TEMPORAL ANALYSIS:**')
    parts.push(`- Time of Day: ${data.temporal.time_of_day.replace('_', ' ')}`)
    parts.push(`- Traffic Level: ${data.temporal.traffic_level || 'unknown'}`)
    parts.push(`- Pedestrian Density: ${data.temporal.pedestrian_density || 'unknown'}`)
    if (data.temporal.is_anomalous) {
      parts.push(`- ⚠️ **ANOMALY DETECTED**`)
      data.temporal.anomaly_reasons.forEach(reason => {
        parts.push(`  - ${reason}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * Identify risk indicators
   */
  private identifyRiskIndicators(data: {
    event: TimelineEvent
    geoint: MultiIntEventAnalysis['geoint']
    sigint?: MultiIntEventAnalysis['sigint']
    osint?: MultiIntEventAnalysis['osint']
    temporal: MultiIntEventAnalysis['temporal']
  }): string[] {
    const risks: string[] = []

    // Temporal risks
    if (data.temporal.is_anomalous) {
      risks.push(`Anomalous timing: ${data.temporal.anomaly_reasons.join('; ')}`)
    }

    // OSINT risks
    if (data.osint) {
      if (data.osint.owner_subject_link) {
        risks.push(`Location owned by investigation subject ${data.osint.owner_subject_link}`)
      }
      if (data.osint.risk_score >= 70) {
        risks.push(`High-risk location (OSINT score: ${data.osint.risk_score}/100)`)
      }
      if (data.osint.social_media_presence === 'none' && data.osint.business_name) {
        risks.push('Business has no online presence (suspicious)')
      }
    }

    // GEOINT risks
    if (data.geoint.land_use_zone === 'industrial' && data.temporal.time_of_day === 'late_night') {
      risks.push('Industrial area activity during late night hours')
    }

    // Event-level risks
    if (data.event.significance === 'suspicious') {
      risks.push('Event flagged as suspicious by surveillance team')
    }

    return risks
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(data: {
    event: TimelineEvent
    risk_indicators: string[]
    osint?: MultiIntEventAnalysis['osint']
  }): string[] {
    const actions: string[] = []

    if (data.risk_indicators.length >= 3) {
      actions.push('⚠️ Escalate to FBI Counter-Terrorism Division')
      actions.push('📸 Request FISA warrant for enhanced surveillance')
    }

    if (data.osint?.owner_subject_link) {
      actions.push(`🔍 Investigate relationship with ${data.osint.owner_subject_link}`)
      actions.push('💰 Request financial records for business entity')
    }

    if (data.osint && data.osint.risk_score >= 80) {
      actions.push('🏢 Conduct physical site assessment')
    }

    if (data.event.significance === 'suspicious') {
      actions.push('👁️ Intensify physical surveillance')
      actions.push('📞 Monitor communications')
    }

    if (actions.length === 0) {
      actions.push('Continue routine monitoring')
    }

    return actions
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(data: {
    geoint: MultiIntEventAnalysis['geoint']
    sigint?: MultiIntEventAnalysis['sigint']
    osint?: MultiIntEventAnalysis['osint']
    temporal: MultiIntEventAnalysis['temporal']
  }): number {
    let confidence = 50 // Base confidence

    // GEOINT boosts
    if (data.geoint.address_verified) confidence += 15
    if (data.geoint.building_type) confidence += 10

    // SIGINT boosts
    if (data.sigint) {
      if (data.sigint.signal_strength === 'strong') confidence += 15
      else if (data.sigint.signal_strength === 'medium') confidence += 10
      else confidence += 5
    }

    // OSINT boosts
    if (data.osint) {
      confidence += 10
      if (data.osint.owner_subject_link) confidence += 10
    }

    // Temporal confidence
    if (!data.temporal.is_anomalous) confidence += 5

    return Math.min(confidence, 100)
  }

  /**
   * Generate full investigation report for multiple events
   */
  async generateInvestigationReport(events: TimelineEvent[]): Promise<string> {
    const analyses = await Promise.all(
      events.map(event => this.analyzeEvent(event))
    )

    const report: string[] = []

    report.push('# MULTI-INT INVESTIGATION REPORT')
    report.push('## Citizens 360 Intelligence Platform')
    report.push('')
    report.push(`**Report Generated:** ${new Date().toLocaleString()}`)
    report.push(`**Events Analyzed:** ${events.length}`)
    report.push('')

    // Executive Summary
    const highRiskEvents = analyses.filter(a => a.risk_indicators.length >= 2)
    const criticalEvents = analyses.filter(a => a.risk_indicators.length >= 3)

    report.push('## EXECUTIVE SUMMARY')
    report.push('')
    report.push(`- Total Events: ${events.length}`)
    report.push(`- High Risk Events: ${highRiskEvents.length}`)
    report.push(`- Critical Events: ${criticalEvents.length}`)
    report.push(`- Average Confidence: ${Math.round(analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length)}%`)
    report.push('')

    // Detailed Analysis
    report.push('## DETAILED MULTI-INT ANALYSIS')
    report.push('')

    analyses.forEach((analysis, idx) => {
      report.push(`### Event ${idx + 1}: ${events[idx].title}`)
      report.push('')
      report.push(analysis.intelligence_summary)
      report.push('')

      if (analysis.risk_indicators.length > 0) {
        report.push('**⚠️ RISK INDICATORS:**')
        analysis.risk_indicators.forEach(risk => {
          report.push(`- ${risk}`)
        })
        report.push('')
      }

      report.push('**RECOMMENDED ACTIONS:**')
      analysis.recommended_actions.forEach(action => {
        report.push(`- ${action}`)
      })
      report.push('')
      report.push(`**Confidence:** ${analysis.confidence_score}%`)
      report.push('')
      report.push('---')
      report.push('')
    })

    return report.join('\n')
  }
}

// Singleton instance
let multiIntReportService: MultiIntReportService | null = null

export function getMultiIntReportService(): MultiIntReportService {
  if (!multiIntReportService) {
    multiIntReportService = new MultiIntReportService()
  }
  return multiIntReportService
}
