/**
 * Anomaly Analysis Service
 * AI-powered maritime anomaly analysis using Vultr LLM
 *
 * Features:
 * - Risk assessment for detected anomalies
 * - Pattern recognition across vessel behavior
 * - Contextual explanations of suspicious activity
 * - Actionable recommendations for analysts
 */

import type {
  DetectedAnomaly,
  VesselTrack,
  AnomalyType,
  AnomalySeverity
} from '@/lib/types/ais-anomaly'
import { VultrLLMService } from './vultrLLMService'

export interface AnomalyAnalysisResult {
  anomalyId: string
  executiveSummary: string
  riskAssessment: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    smugglingRisk: number // 0-100
    illegalFishingRisk: number // 0-100
    sanctionsEvasionRisk: number // 0-100
    factors: string[]
  }
  behaviorAnalysis: {
    anomalyType: AnomalyType
    description: string
    possibleExplanations: Array<{
      explanation: string
      likelihood: 'low' | 'medium' | 'high'
      isLegitimate: boolean
    }>
    patterns: string[]
  }
  vesselContext: {
    vesselType: string
    historicalBehavior: string
    flagStateRisk: string
    routeAnalysis: string
  }
  geospatialContext: {
    locationSignificance: string
    nearbyPorts: string[]
    territorialWaters: string
    shippingLaneProximity: string
    tacticalConsiderations: string[]
  }
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low'
    action: string
    rationale: string
    agency: string // e.g., "Coast Guard", "Maritime Police", "Port Authority"
    timeline: string
  }>
  relatedAnomalies: Array<{
    id: string
    type: AnomalyType
    relationship: string
  }>
  confidence: number // 0-100
  generatedAt: Date
  cached: boolean
}

/**
 * Anomaly type descriptions for AI context
 */
const ANOMALY_TYPE_CONTEXT: Record<AnomalyType, string> = {
  AIS_GAP: 'AIS transmission gap - vessel stopped broadcasting its position. This can indicate intentional concealment of location (often associated with illegal activities) or technical failure.',
  LOITERING: 'Extended stationary period at sea - vessel remained in one location for an unusual duration. May indicate waiting for cargo transfer, fishing, or surveillance.',
  RENDEZVOUS: 'Close proximity meeting between two or more vessels - potential ship-to-ship transfer event. Often associated with smuggling or illegal cargo transfers.',
  SPEED_ANOMALY: 'Unusual speed change - vessel exhibited unexpected acceleration or deceleration. May indicate evasive maneuvers or operational issues.',
  COURSE_DEVIATION: 'Sudden heading change - vessel deviated significantly from expected course. Can indicate evasive action, weather avoidance, or intentional course change.'
}

/**
 * Kattegat Strait context for AI
 */
const REGION_CONTEXT = `
Geographic Region: Kattegat Strait
Location: Between Denmark (west) and Sweden (east), connecting North Sea to Baltic Sea
Coordinates: Approximately 10-12°E longitude, 56-58°N latitude
Significance:
- Major international shipping corridor
- High traffic density with container ships, tankers, ferries, and fishing vessels
- Strategic chokepoint for Baltic Sea access
- Key ports: Gothenburg (Sweden), Aarhus (Denmark), Frederikshavn (Denmark)
- Subject to international maritime regulations (SOLAS, MARPOL)
`

/**
 * Anomaly Analysis Service Class
 */
export class AnomalyAnalysisService {
  private llmService: VultrLLMService | null = null
  private analysisCache = new Map<string, { result: AnomalyAnalysisResult; expiresAt: number }>()
  private readonly CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

  /**
   * Initialize with Vultr LLM service
   */
  initialize(apiKey: string) {
    this.llmService = new VultrLLMService({ apiKey })
  }

  /**
   * Analyze a maritime anomaly with comprehensive AI-powered insights
   */
  async analyzeAnomaly(
    anomaly: DetectedAnomaly,
    vesselTrack?: VesselTrack,
    allAnomalies?: DetectedAnomaly[],
    options?: {
      forceRefresh?: boolean
      vesselMetadata?: {
        name?: string
        type?: string
        flag?: string
        callSign?: string
      }
    }
  ): Promise<AnomalyAnalysisResult> {
    // Check cache first
    if (!options?.forceRefresh) {
      const cached = this.getCachedAnalysis(anomaly.id)
      if (cached) {
        console.log(`Using cached analysis for anomaly ${anomaly.id}`)
        return cached
      }
    }

    if (!this.llmService) {
      console.warn('LLM service not initialized, using fallback analysis')
      return this.generateFallbackAnalysis(anomaly, vesselTrack, allAnomalies || [])
    }

    console.log(`Generating AI analysis for anomaly: ${anomaly.type} - ${anomaly.id}`)

    // Find related anomalies
    const relatedAnomalies = this.findRelatedAnomalies(anomaly, allAnomalies || [])

    // Build comprehensive context
    const analysisPrompt = this.buildAnalysisPrompt(
      anomaly,
      vesselTrack,
      relatedAnomalies,
      options?.vesselMetadata
    )

    try {
      // Call Vultr LLM for analysis
      const response = await this.llmService.chat({
        messages: [
          {
            role: 'system',
            content: `You are an expert maritime intelligence analyst specializing in AIS data analysis, vessel behavior patterns, and maritime security. You have deep knowledge of:
- Illegal fishing indicators
- Smuggling and trafficking patterns
- Sanctions evasion tactics
- Ship-to-ship transfer operations
- Maritime domain awareness

Provide comprehensive, actionable analysis in JSON format. Be specific about risks and recommendations.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })

      // Parse AI response
      const aiAnalysis = this.parseAIResponse(response.choices[0].message.content)

      // Build structured result
      const result: AnomalyAnalysisResult = {
        anomalyId: anomaly.id,
        executiveSummary: aiAnalysis.executiveSummary,
        riskAssessment: aiAnalysis.riskAssessment,
        behaviorAnalysis: aiAnalysis.behaviorAnalysis,
        vesselContext: aiAnalysis.vesselContext,
        geospatialContext: aiAnalysis.geospatialContext,
        recommendations: aiAnalysis.recommendations,
        relatedAnomalies: relatedAnomalies.map(r => ({
          id: r.id,
          type: r.type,
          relationship: this.describeRelationship(anomaly, r)
        })),
        confidence: aiAnalysis.confidence || 80,
        generatedAt: new Date(),
        cached: false
      }

      // Cache the result
      this.cacheAnalysis(anomaly.id, result)

      console.log(`AI analysis generated for anomaly ${anomaly.id}`)
      return result

    } catch (error) {
      console.error('Failed to generate AI analysis:', error)
      return this.generateFallbackAnalysis(anomaly, vesselTrack, allAnomalies || [])
    }
  }

  /**
   * Find anomalies related by vessel, time, or location
   */
  private findRelatedAnomalies(
    anomaly: DetectedAnomaly,
    allAnomalies: DetectedAnomaly[]
  ): DetectedAnomaly[] {
    return allAnomalies
      .filter(a => {
        if (a.id === anomaly.id) return false

        // Same vessel
        if (a.affectedVessels.some(v => anomaly.affectedVessels.includes(v))) {
          return true
        }

        // Within 30 minutes and 10km
        const timeDiff = Math.abs(a.timestamp.getTime() - anomaly.timestamp.getTime())
        if (timeDiff <= 30 * 60 * 1000) {
          const distance = this.calculateDistance(
            anomaly.location.lat,
            anomaly.location.lng,
            a.location.lat,
            a.location.lng
          )
          if (distance <= 10) return true
        }

        return false
      })
      .slice(0, 5)
  }

  /**
   * Calculate distance between two coordinates (km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Describe the relationship between two anomalies
   */
  private describeRelationship(a1: DetectedAnomaly, a2: DetectedAnomaly): string {
    if (a2.affectedVessels.some(v => a1.affectedVessels.includes(v))) {
      return 'Same vessel involved'
    }

    const timeDiff = Math.abs(a1.timestamp.getTime() - a2.timestamp.getTime())
    if (timeDiff <= 30 * 60 * 1000) {
      return 'Occurred within same time window'
    }

    return 'Nearby location'
  }

  /**
   * Build AI analysis prompt
   */
  private buildAnalysisPrompt(
    anomaly: DetectedAnomaly,
    vesselTrack?: VesselTrack,
    relatedAnomalies?: DetectedAnomaly[],
    vesselMetadata?: { name?: string; type?: string; flag?: string; callSign?: string }
  ): string {
    const trackStats = vesselTrack ? `
Track Statistics:
- Duration: ${((vesselTrack.endTime.getTime() - vesselTrack.startTime.getTime()) / 3600000).toFixed(1)} hours
- Distance: ${vesselTrack.totalDistanceKm.toFixed(1)} km
- Avg Speed: ${vesselTrack.avgSpeedKnots.toFixed(1)} knots
- Max Speed: ${vesselTrack.maxSpeedKnots.toFixed(1)} knots
- Positions: ${vesselTrack.positions.length}
- Track Quality: ${vesselTrack.trackQuality}
- Previous Anomalies: ${vesselTrack.anomalies.length}
` : ''

    const relatedInfo = relatedAnomalies && relatedAnomalies.length > 0 ? `
Related Anomalies:
${relatedAnomalies.map(r => `- ${r.type}: ${r.description} (${r.timestamp.toISOString()})`).join('\n')}
` : ''

    return `Analyze this maritime anomaly detected in AIS data:

${REGION_CONTEXT}

## ANOMALY DETAILS
Type: ${anomaly.type}
Description: ${ANOMALY_TYPE_CONTEXT[anomaly.type]}
Severity: ${anomaly.severity}
Timestamp: ${anomaly.timestamp.toISOString()}
Location: ${anomaly.location.lat.toFixed(5)}°N, ${anomaly.location.lng.toFixed(5)}°E
Confidence: ${(anomaly.confidence * 100).toFixed(0)}%
Affected Vessels: ${anomaly.affectedVessels.join(', ')}

Anomaly Description: ${anomaly.description}

## VESSEL INFORMATION
${vesselMetadata ? `
Name: ${vesselMetadata.name || 'Unknown'}
Type: ${vesselMetadata.type || 'Unknown'}
Flag: ${vesselMetadata.flag || 'Unknown'}
Call Sign: ${vesselMetadata.callSign || 'Unknown'}
` : `MMSI: ${anomaly.affectedVessels[0]}`}

${trackStats}

${relatedInfo}

${anomaly.metadata ? `
Additional Metadata:
${JSON.stringify(anomaly.metadata, null, 2)}
` : ''}

Provide analysis in JSON format:
{
  "executiveSummary": "2-3 sentence assessment of this anomaly and its significance",
  "riskAssessment": {
    "threatLevel": "low|medium|high|critical",
    "smugglingRisk": <0-100>,
    "illegalFishingRisk": <0-100>,
    "sanctionsEvasionRisk": <0-100>,
    "factors": ["risk factor 1", "risk factor 2", "risk factor 3"]
  },
  "behaviorAnalysis": {
    "anomalyType": "${anomaly.type}",
    "description": "Detailed behavior description",
    "possibleExplanations": [
      {
        "explanation": "What could explain this behavior",
        "likelihood": "low|medium|high",
        "isLegitimate": true/false
      }
    ],
    "patterns": ["behavior pattern 1", "pattern 2"]
  },
  "vesselContext": {
    "vesselType": "Assessment of vessel type and expected behavior",
    "historicalBehavior": "Assessment based on track data",
    "flagStateRisk": "Assessment of flag state risk factors",
    "routeAnalysis": "Analysis of vessel route in context"
  },
  "geospatialContext": {
    "locationSignificance": "Why this location matters",
    "nearbyPorts": ["port 1", "port 2"],
    "territorialWaters": "Which country's waters",
    "shippingLaneProximity": "Proximity to shipping lanes",
    "tacticalConsiderations": ["consideration 1", "consideration 2"]
  },
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "Specific action to take",
      "rationale": "Why this action",
      "agency": "Coast Guard|Maritime Police|Port Authority|Naval Intelligence",
      "timeline": "When to act"
    }
  ],
  "confidence": <0-100>
}`
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      throw new Error('Invalid AI response format')
    }
  }

  /**
   * Generate fallback analysis if AI fails
   */
  private generateFallbackAnalysis(
    anomaly: DetectedAnomaly,
    vesselTrack?: VesselTrack,
    allAnomalies?: DetectedAnomaly[]
  ): AnomalyAnalysisResult {
    const relatedAnomalies = this.findRelatedAnomalies(anomaly, allAnomalies || [])

    // Severity-based threat level mapping
    const threatLevelMap: Record<AnomalySeverity, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    }

    // Type-based risk assessment
    const riskByType: Record<AnomalyType, { smuggling: number; fishing: number; sanctions: number }> = {
      AIS_GAP: { smuggling: 70, fishing: 50, sanctions: 80 },
      LOITERING: { smuggling: 40, fishing: 70, sanctions: 30 },
      RENDEZVOUS: { smuggling: 85, fishing: 30, sanctions: 75 },
      SPEED_ANOMALY: { smuggling: 30, fishing: 20, sanctions: 40 },
      COURSE_DEVIATION: { smuggling: 25, fishing: 15, sanctions: 35 }
    }

    const risks = riskByType[anomaly.type]

    // Possible explanations by type
    const explanationsByType: Record<AnomalyType, Array<{ explanation: string; likelihood: 'low' | 'medium' | 'high'; isLegitimate: boolean }>> = {
      AIS_GAP: [
        { explanation: 'Equipment malfunction or maintenance', likelihood: 'medium', isLegitimate: true },
        { explanation: 'Poor satellite coverage in area', likelihood: 'low', isLegitimate: true },
        { explanation: 'Intentional disabling for illicit activity', likelihood: 'high', isLegitimate: false }
      ],
      LOITERING: [
        { explanation: 'Waiting for port berth availability', likelihood: 'high', isLegitimate: true },
        { explanation: 'Fishing operations', likelihood: 'medium', isLegitimate: true },
        { explanation: 'Ship-to-ship transfer preparation', likelihood: 'medium', isLegitimate: false }
      ],
      RENDEZVOUS: [
        { explanation: 'Scheduled cargo or crew transfer', likelihood: 'medium', isLegitimate: true },
        { explanation: 'Emergency assistance', likelihood: 'low', isLegitimate: true },
        { explanation: 'Illicit goods transfer', likelihood: 'high', isLegitimate: false }
      ],
      SPEED_ANOMALY: [
        { explanation: 'Weather-related speed adjustment', likelihood: 'high', isLegitimate: true },
        { explanation: 'Engine issues', likelihood: 'medium', isLegitimate: true },
        { explanation: 'Evasive maneuver', likelihood: 'low', isLegitimate: false }
      ],
      COURSE_DEVIATION: [
        { explanation: 'Weather avoidance', likelihood: 'high', isLegitimate: true },
        { explanation: 'Traffic separation', likelihood: 'medium', isLegitimate: true },
        { explanation: 'Evasive action from patrol', likelihood: 'low', isLegitimate: false }
      ]
    }

    return {
      anomalyId: anomaly.id,
      executiveSummary: `${anomaly.severity.toUpperCase()} severity ${anomaly.type.replace('_', ' ')} detected for vessel ${anomaly.affectedVessels[0]}. ${anomaly.description} This behavior warrants ${anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'immediate attention' : 'monitoring'}.`,
      riskAssessment: {
        threatLevel: threatLevelMap[anomaly.severity],
        smugglingRisk: risks.smuggling,
        illegalFishingRisk: risks.fishing,
        sanctionsEvasionRisk: risks.sanctions,
        factors: [
          `Anomaly type: ${anomaly.type}`,
          `Severity level: ${anomaly.severity}`,
          `Detection confidence: ${(anomaly.confidence * 100).toFixed(0)}%`,
          relatedAnomalies.length > 0 ? `${relatedAnomalies.length} related anomalies detected` : 'Isolated incident'
        ]
      },
      behaviorAnalysis: {
        anomalyType: anomaly.type,
        description: anomaly.description,
        possibleExplanations: explanationsByType[anomaly.type],
        patterns: vesselTrack && vesselTrack.anomalies.length > 1
          ? ['Vessel has history of anomalous behavior', 'Pattern suggests intentional activity']
          : ['Isolated anomaly', 'No established pattern']
      },
      vesselContext: {
        vesselType: 'Assessment requires vessel database lookup',
        historicalBehavior: vesselTrack
          ? `Vessel track shows ${vesselTrack.positions.length} positions over ${((vesselTrack.endTime.getTime() - vesselTrack.startTime.getTime()) / 3600000).toFixed(1)} hours`
          : 'No historical track available',
        flagStateRisk: 'Flag state risk assessment requires external database',
        routeAnalysis: `Anomaly occurred at ${anomaly.location.lat.toFixed(4)}°N, ${anomaly.location.lng.toFixed(4)}°E in the Kattegat Strait`
      },
      geospatialContext: {
        locationSignificance: 'Kattegat Strait - major international shipping corridor',
        nearbyPorts: ['Gothenburg (Sweden)', 'Aarhus (Denmark)', 'Frederikshavn (Denmark)'],
        territorialWaters: 'Danish/Swedish territorial waters - subject to EU maritime regulations',
        shippingLaneProximity: 'Within primary North Sea to Baltic shipping route',
        tacticalConsiderations: [
          'High traffic density area',
          'Multiple jurisdictions (Denmark/Sweden)',
          'IMO-designated traffic separation scheme'
        ]
      },
      recommendations: [
        {
          priority: anomaly.severity === 'critical' ? 'immediate' : anomaly.severity === 'high' ? 'high' : 'medium',
          action: 'Monitor vessel position and verify AIS data integrity',
          rationale: 'Initial assessment required before escalation',
          agency: 'Maritime Police',
          timeline: anomaly.severity === 'critical' ? 'Immediate' : 'Within 2 hours'
        },
        {
          priority: 'medium',
          action: 'Cross-reference with port records and cargo manifests',
          rationale: 'Verify legitimate business purpose',
          agency: 'Port Authority',
          timeline: 'Within 24 hours'
        }
      ],
      relatedAnomalies: relatedAnomalies.map(r => ({
        id: r.id,
        type: r.type,
        relationship: this.describeRelationship(anomaly, r)
      })),
      confidence: 65,
      generatedAt: new Date(),
      cached: false
    }
  }

  /**
   * Cache analysis result
   */
  private cacheAnalysis(anomalyId: string, result: AnomalyAnalysisResult): void {
    this.analysisCache.set(anomalyId, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL_MS
    })
  }

  /**
   * Get cached analysis if available
   */
  private getCachedAnalysis(anomalyId: string): AnomalyAnalysisResult | null {
    const cached = this.analysisCache.get(anomalyId)

    if (!cached) return null

    if (Date.now() > cached.expiresAt) {
      this.analysisCache.delete(anomalyId)
      return null
    }

    return { ...cached.result, cached: true }
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear()
    console.log('Anomaly analysis cache cleared')
  }
}

// Singleton instance
let anomalyAnalysisServiceInstance: AnomalyAnalysisService | null = null

/**
 * Get or create Anomaly Analysis Service instance
 */
export function getAnomalyAnalysisService(): AnomalyAnalysisService {
  if (!anomalyAnalysisServiceInstance) {
    anomalyAnalysisServiceInstance = new AnomalyAnalysisService()

    // Initialize with API key from environment
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY
    if (apiKey) {
      anomalyAnalysisServiceInstance.initialize(apiKey)
    } else {
      console.warn('Vultr API key not found. Anomaly analysis will use fallback mode.')
    }
  }

  return anomalyAnalysisServiceInstance
}
