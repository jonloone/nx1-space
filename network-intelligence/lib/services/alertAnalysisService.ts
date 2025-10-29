/**
 * Alert Analysis Service
 * Real-time AI-powered intelligence alert analysis using Vultr LLM
 *
 * Features:
 * - Executive summaries
 * - Risk assessments
 * - Pattern detection
 * - Geospatial context analysis
 * - Actionable recommendations
 */

import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { VultrLLMService } from './vultrLLMService'

export interface AlertAnalysisResult {
  alertId: string
  executiveSummary: string
  riskAssessment: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
    escalationProbability: number // 0-100
    timeframe: string // e.g., "Within 24 hours", "Immediate"
    factors: string[]
  }
  patternAnalysis: {
    relatedAlerts: Array<{
      id: string
      title: string
      similarity: string
    }>
    temporalPatterns: string[]
    spatialPatterns: string[]
    insights: string[]
  }
  geospatialContext: {
    locationSignificance: string
    nearbyInfrastructure: string[]
    areaCharacteristics: string[]
    tacticalConsiderations: string[]
  }
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low'
    action: string
    rationale: string
    resources: string[]
    timeline: string
  }>
  confidence: number // 0-100
  generatedAt: Date
  cached: boolean
}

/**
 * Alert Analysis Service Class
 */
export class AlertAnalysisService {
  private llmService: VultrLLMService | null = null
  private analysisCache = new Map<string, { result: AlertAnalysisResult; expiresAt: number }>()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Initialize with Vultr LLM service
   */
  initialize(apiKey: string) {
    this.llmService = new VultrLLMService({ apiKey })
  }

  /**
   * Analyze an intelligence alert with comprehensive AI-powered insights
   */
  async analyzeAlert(
    alert: IntelligenceAlert,
    allAlerts: IntelligenceAlert[],
    options?: {
      forceRefresh?: boolean
    }
  ): Promise<AlertAnalysisResult> {
    // Check cache first
    if (!options?.forceRefresh) {
      const cached = this.getCachedAnalysis(alert.id)
      if (cached) {
        console.log(`Using cached analysis for alert ${alert.id}`)
        return cached
      }
    }

    if (!this.llmService) {
      throw new Error('Alert Analysis Service not initialized. Call initialize() first.')
    }

    console.log(`Generating AI analysis for alert: ${alert.title}`)

    // Find nearby alerts (within ~5km)
    const nearbyAlerts = this.findNearbyAlerts(alert, allAlerts, 5)

    // Find temporally related alerts (within 24 hours)
    const temporalAlerts = this.findTemporalAlerts(alert, allAlerts, 24)

    // Find similar category alerts
    const categoryAlerts = allAlerts.filter(
      a => a.id !== alert.id && a.category === alert.category
    ).slice(0, 5)

    // Build comprehensive context
    const analysisPrompt = this.buildAnalysisPrompt(
      alert,
      nearbyAlerts,
      temporalAlerts,
      categoryAlerts
    )

    try {
      // Call Vultr LLM for analysis
      const response = await this.llmService.chat({
        messages: [
          {
            role: 'system',
            content: 'You are an expert federal intelligence analyst specializing in threat assessment, pattern recognition, and geospatial analysis. Provide comprehensive, actionable intelligence analysis in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more focused analysis
        max_tokens: 2000
      })

      // Parse AI response
      const aiAnalysis = this.parseAIResponse(response.choices[0].message.content)

      // Build structured result
      const result: AlertAnalysisResult = {
        alertId: alert.id,
        executiveSummary: aiAnalysis.executiveSummary,
        riskAssessment: aiAnalysis.riskAssessment,
        patternAnalysis: aiAnalysis.patternAnalysis,
        geospatialContext: aiAnalysis.geospatialContext,
        recommendations: aiAnalysis.recommendations,
        confidence: aiAnalysis.confidence || 85,
        generatedAt: new Date(),
        cached: false
      }

      // Cache the result
      this.cacheAnalysis(alert.id, result)

      console.log(`✅ AI analysis generated for alert ${alert.id}`)
      return result

    } catch (error) {
      console.error('Failed to generate AI analysis:', error)

      // Return fallback analysis
      return this.generateFallbackAnalysis(alert, nearbyAlerts, temporalAlerts)
    }
  }

  /**
   * Find alerts within specified radius (km)
   */
  private findNearbyAlerts(
    alert: IntelligenceAlert,
    allAlerts: IntelligenceAlert[],
    radiusKm: number
  ): IntelligenceAlert[] {
    if (!alert.location) return []

    const [lng1, lat1] = alert.location.coordinates

    return allAlerts
      .filter(a => {
        if (a.id === alert.id || !a.location) return false

        const [lng2, lat2] = a.location.coordinates
        const distance = this.calculateDistance(lat1, lng1, lat2, lng2)

        return distance <= radiusKm
      })
      .slice(0, 10) // Limit to 10 nearest
  }

  /**
   * Find alerts within specified time window (hours)
   */
  private findTemporalAlerts(
    alert: IntelligenceAlert,
    allAlerts: IntelligenceAlert[],
    hoursWindow: number
  ): IntelligenceAlert[] {
    const alertTime = alert.timestamp.getTime()
    const windowMs = hoursWindow * 60 * 60 * 1000

    return allAlerts
      .filter(a => {
        if (a.id === alert.id) return false
        const timeDiff = Math.abs(a.timestamp.getTime() - alertTime)
        return timeDiff <= windowMs
      })
      .slice(0, 10)
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
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
   * Build comprehensive AI analysis prompt
   */
  private buildAnalysisPrompt(
    alert: IntelligenceAlert,
    nearbyAlerts: IntelligenceAlert[],
    temporalAlerts: IntelligenceAlert[],
    categoryAlerts: IntelligenceAlert[]
  ): string {
    return `Analyze this intelligence alert and provide comprehensive threat assessment:

## PRIMARY ALERT
ID: ${alert.id}
Priority: ${alert.priority}
Category: ${alert.category}
Title: ${alert.title}
Description: ${alert.description}
Location: ${alert.location?.name || 'Unknown'} (${alert.location?.coordinates.join(', ') || 'N/A'})
Subject: ${alert.subjectName} (${alert.subjectId})
Case: ${alert.caseName} (${alert.caseNumber})
Confidence: ${alert.confidence}
Action Required: ${alert.actionRequired ? 'YES' : 'No'}
Timestamp: ${alert.timestamp.toISOString()}

## NEARBY ALERTS (Within 5km)
${nearbyAlerts.length > 0 ? nearbyAlerts.map(a => `- [${a.priority}] ${a.title} at ${a.location?.name}`).join('\n') : 'None'}

## TEMPORAL CONTEXT (Within 24 hours)
${temporalAlerts.length > 0 ? temporalAlerts.map(a => `- [${a.timestamp.toLocaleString()}] ${a.title}`).join('\n') : 'None'}

## SIMILAR CATEGORY ALERTS
${categoryAlerts.length > 0 ? categoryAlerts.map(a => `- ${a.title}`).join('\n') : 'None'}

Provide analysis in JSON format:
{
  "executiveSummary": "2-3 sentence overview of the alert and its significance",
  "riskAssessment": {
    "threatLevel": "low|medium|high|critical",
    "escalationProbability": <number 0-100>,
    "timeframe": "description of urgency",
    "factors": ["factor 1", "factor 2", "factor 3"]
  },
  "patternAnalysis": {
    "relatedAlerts": [{"id": "ID", "title": "Title", "similarity": "Why related"}],
    "temporalPatterns": ["pattern 1", "pattern 2"],
    "spatialPatterns": ["pattern 1", "pattern 2"],
    "insights": ["insight 1", "insight 2", "insight 3"]
  },
  "geospatialContext": {
    "locationSignificance": "Why this location matters",
    "nearbyInfrastructure": ["infrastructure 1", "infrastructure 2"],
    "areaCharacteristics": ["characteristic 1", "characteristic 2"],
    "tacticalConsiderations": ["consideration 1", "consideration 2"]
  },
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "Specific action to take",
      "rationale": "Why this action is needed",
      "resources": ["resource 1", "resource 2"],
      "timeline": "When to act"
    }
  ],
  "confidence": <number 0-100>
}`
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(content: string): any {
    try {
      // Extract JSON from response (may have markdown code blocks)
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
    alert: IntelligenceAlert,
    nearbyAlerts: IntelligenceAlert[],
    temporalAlerts: IntelligenceAlert[]
  ): AlertAnalysisResult {
    return {
      alertId: alert.id,
      executiveSummary: `${alert.priority.toUpperCase()} priority ${alert.category} alert detected involving ${alert.subjectName}. ${alert.description}`,
      riskAssessment: {
        threatLevel: alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'high' : 'medium',
        escalationProbability: alert.priority === 'critical' ? 90 : alert.priority === 'high' ? 70 : 50,
        timeframe: alert.actionRequired ? 'Immediate action required' : 'Within 24-48 hours',
        factors: [
          `Alert priority: ${alert.priority}`,
          `${nearbyAlerts.length} related alerts in vicinity`,
          `Confidence level: ${alert.confidence}`
        ]
      },
      patternAnalysis: {
        relatedAlerts: nearbyAlerts.slice(0, 3).map(a => ({
          id: a.id,
          title: a.title,
          similarity: `Same category: ${a.category}`
        })),
        temporalPatterns: temporalAlerts.length > 0 ? ['Multiple alerts in recent timeframe'] : [],
        spatialPatterns: nearbyAlerts.length > 0 ? ['Geographic clustering detected'] : [],
        insights: [
          `Alert generated at ${alert.location?.name || 'unknown location'}`,
          `Subject: ${alert.subjectName}`,
          `Case: ${alert.caseName}`
        ]
      },
      geospatialContext: {
        locationSignificance: alert.location ? `Alert location: ${alert.location.name}` : 'Location unknown',
        nearbyInfrastructure: [],
        areaCharacteristics: [],
        tacticalConsiderations: alert.actionRequired ? ['Immediate response required'] : []
      },
      recommendations: [
        {
          priority: alert.actionRequired ? 'immediate' : 'high',
          action: 'Review alert details and assess situation',
          rationale: 'Initial assessment required',
          resources: ['Field agents', 'Intelligence analysts'],
          timeline: alert.actionRequired ? 'Immediate' : 'Within 24 hours'
        }
      ],
      confidence: 70,
      generatedAt: new Date(),
      cached: false
    }
  }

  /**
   * Cache analysis result
   */
  private cacheAnalysis(alertId: string, result: AlertAnalysisResult): void {
    this.analysisCache.set(alertId, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL_MS
    })
  }

  /**
   * Get cached analysis if available and not expired
   */
  private getCachedAnalysis(alertId: string): AlertAnalysisResult | null {
    const cached = this.analysisCache.get(alertId)

    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.analysisCache.delete(alertId)
      return null
    }

    return { ...cached.result, cached: true }
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear()
    console.log('Analysis cache cleared')
  }
}

// Singleton instance
let alertAnalysisServiceInstance: AlertAnalysisService | null = null

/**
 * Get or create Alert Analysis Service instance
 */
export function getAlertAnalysisService(): AlertAnalysisService {
  if (!alertAnalysisServiceInstance) {
    alertAnalysisServiceInstance = new AlertAnalysisService()

    // Initialize with API key from environment
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY
    if (apiKey) {
      alertAnalysisServiceInstance.initialize(apiKey)
    } else {
      console.warn('Vultr API key not found. AI analysis will use fallback mode.')
    }
  }

  return alertAnalysisServiceInstance
}
