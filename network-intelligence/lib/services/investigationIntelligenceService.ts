/**
 * Investigation Intelligence Service
 *
 * AI-powered intelligence analysis for pattern-of-life tracking
 * Generates behavioral insights, anomaly detection, and actionable recommendations
 */

import { VultrLLMService } from './vultrLLMService'
import type {
  InvestigationSubject,
  LocationStop,
  TrackingPoint
} from '@/lib/demo/investigation-demo-data'

export interface BehavioralInsight {
  type: 'pattern' | 'anomaly' | 'risk' | 'opportunity'
  title: string
  description: string
  confidence: number // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
}

export interface GeographicIntelligence {
  primaryZone: string
  secondaryZones: string[]
  clusters: Array<{
    name: string
    center: [number, number]
    locations: string[]
    significance: string
  }>
  travelPatterns: string[]
}

export interface NetworkInference {
  likelyAssociates: number
  meetingLocations: string[]
  suspiciousContacts: string[]
  networkRisk: 'low' | 'medium' | 'high' | 'critical'
  inference: string
}

export interface ActionableRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low'
  action: string
  rationale: string
  resources: string[]
}

export interface InvestigationIntelligence {
  behavioralInsights: BehavioralInsight[]
  geographicIntelligence: GeographicIntelligence
  networkInference: NetworkInference
  recommendations: ActionableRecommendation[]
  riskScore: number // 0-100
  summary: string
}

export class InvestigationIntelligenceService {
  private llm: VultrLLMService

  constructor(llm: VultrLLMService) {
    this.llm = llm
  }

  /**
   * Generate comprehensive intelligence analysis
   */
  async generateIntelligence(
    subject: InvestigationSubject,
    locationStops: LocationStop[],
    trackingPoints: TrackingPoint[]
  ): Promise<InvestigationIntelligence> {
    console.log('🤖 Generating AI intelligence analysis...')

    try {
      // Run analyses in parallel for speed
      const [behavioral, geographic, network, recommendations] = await Promise.all([
        this.generateBehavioralInsights(locationStops, subject),
        this.analyzeGeography(locationStops),
        this.inferNetwork(locationStops, subject),
        this.generateRecommendations(locationStops, subject)
      ])

      // Calculate risk score
      const riskScore = this.calculateRiskScore(locationStops, behavioral, network)

      // Generate summary
      const summary = await this.generateSummary(
        subject,
        behavioral,
        geographic,
        network,
        riskScore
      )

      return {
        behavioralInsights: behavioral,
        geographicIntelligence: geographic,
        networkInference: network,
        recommendations,
        riskScore,
        summary
      }
    } catch (error) {
      console.error('❌ Failed to generate intelligence:', error)
      // Return fallback analysis
      return this.getFallbackIntelligence(locationStops, subject)
    }
  }

  /**
   * Generate behavioral insights using AI
   */
  private async generateBehavioralInsights(
    locations: LocationStop[],
    subject: InvestigationSubject
  ): Promise<BehavioralInsight[]> {
    const routineCount = locations.filter(l => l.significance === 'routine').length
    const suspiciousCount = locations.filter(l => l.significance === 'suspicious').length
    const anomalyCount = locations.filter(l => l.significance === 'anomaly').length

    const systemPrompt = `You are an intelligence analyst specializing in behavioral pattern analysis.
Analyze location tracking data and generate concise, actionable insights about subject behavior.
Focus on patterns, anomalies, operational security indicators, and risk factors.`

    const userPrompt = `Subject: ${subject.subjectId}
Investigation: ${subject.investigation}
Classification: ${subject.classification}
Tracking Period: ${Math.round((subject.endDate.getTime() - subject.startDate.getTime()) / (1000 * 60 * 60))} hours

Location Activity Summary:
- Total Locations: ${locations.length}
- Routine Locations: ${routineCount}
- Suspicious Locations: ${suspiciousCount}
- Anomaly Locations: ${anomalyCount}

Key Locations:
${locations.slice(0, 10).map(l =>
  `- ${l.name} (${l.type}): ${l.significance} - ${l.dwellTimeMinutes}min dwell, visited ${l.visitCount}x`
).join('\n')}

${locations.filter(l => l.notes).map(l => `Note: ${l.name} - ${l.notes}`).join('\n')}

Generate 4-6 behavioral insights in this JSON format:
{
  "insights": [
    {
      "type": "pattern|anomaly|risk|opportunity",
      "title": "Brief insight title",
      "description": "1-2 sentence description",
      "confidence": 0-100,
      "severity": "low|medium|high|critical",
      "tags": ["tag1", "tag2"]
    }
  ]
}`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 1500
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      const parsed = JSON.parse(jsonStr)

      return parsed.insights || []
    } catch (error) {
      console.error('Failed to generate behavioral insights:', error)
      return this.getFallbackBehavioralInsights(locations)
    }
  }

  /**
   * Analyze geographic patterns
   */
  private async analyzeGeography(
    locations: LocationStop[]
  ): Promise<GeographicIntelligence> {
    const systemPrompt = `You are a geospatial intelligence analyst. Analyze location data to identify geographic patterns, operational zones, and travel behaviors.`

    const userPrompt = `Analyze these locations and identify:
1. Primary operational zone (main area of activity)
2. Secondary zones (other areas of activity)
3. Location clusters (groups of related locations)
4. Travel patterns and mobility

Locations:
${locations.map(l => `- ${l.name} (${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}): ${l.type}, ${l.significance}`).join('\n')}

Return JSON:
{
  "primaryZone": "neighborhood/area name",
  "secondaryZones": ["area1", "area2"],
  "clusters": [
    {
      "name": "cluster name",
      "center": [lng, lat],
      "locations": ["loc1", "loc2"],
      "significance": "why this cluster matters"
    }
  ],
  "travelPatterns": ["pattern description 1", "pattern description 2"]
}`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to analyze geography:', error)
      return this.getFallbackGeography(locations)
    }
  }

  /**
   * Infer network connections and associations
   */
  private async inferNetwork(
    locations: LocationStop[],
    subject: InvestigationSubject
  ): Promise<NetworkInference> {
    const meetingLocations = locations.filter(l =>
      l.type === 'meeting' ||
      l.significance !== 'routine' ||
      (l.notes && l.notes.includes('associate'))
    )

    const systemPrompt = `You are a network analysis specialist. Analyze location patterns to infer social/criminal networks, meeting behaviors, and contact patterns.`

    const userPrompt = `Subject: ${subject.subjectId} (${subject.classification})

Potential meeting locations:
${meetingLocations.map(l => `- ${l.name}: ${l.notes || l.type}`).join('\n')}

All locations: ${locations.length}
Suspicious locations: ${locations.filter(l => l.significance === 'suspicious').length}
Anomaly locations: ${locations.filter(l => l.significance === 'anomaly').length}

Infer:
1. Likely number of associates/contacts
2. Meeting locations and patterns
3. Suspicious contact indicators
4. Network risk level

Return JSON:
{
  "likelyAssociates": number,
  "meetingLocations": ["location1", "location2"],
  "suspiciousContacts": ["description1", "description2"],
  "networkRisk": "low|medium|high|critical",
  "inference": "2-3 sentence summary of network analysis"
}`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 800
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      return JSON.parse(jsonStr)
    } catch (error) {
      console.error('Failed to infer network:', error)
      return this.getFallbackNetwork(locations)
    }
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    locations: LocationStop[],
    subject: InvestigationSubject
  ): Promise<ActionableRecommendation[]> {
    const suspiciousLocs = locations.filter(l => l.significance !== 'routine')

    const systemPrompt = `You are an investigation operations planner. Generate specific, actionable recommendations for law enforcement based on intelligence analysis.`

    const userPrompt = `Investigation: ${subject.investigation}
Subject Classification: ${subject.classification}

Key findings:
${suspiciousLocs.map(l => `- ${l.name}: ${l.notes || l.significance}`).join('\n')}

Generate 3-5 actionable recommendations prioritized by urgency.

Return JSON:
{
  "recommendations": [
    {
      "priority": "immediate|high|medium|low",
      "action": "Specific action to take",
      "rationale": "Why this action is recommended",
      "resources": ["resource1", "resource2"]
    }
  ]
}`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      const parsed = JSON.parse(jsonStr)

      return parsed.recommendations || []
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return this.getFallbackRecommendations(locations)
    }
  }

  /**
   * Generate executive summary
   */
  private async generateSummary(
    subject: InvestigationSubject,
    behavioral: BehavioralInsight[],
    geographic: GeographicIntelligence,
    network: NetworkInference,
    riskScore: number
  ): Promise<string> {
    const highSeverityInsights = behavioral.filter(i =>
      i.severity === 'high' || i.severity === 'critical'
    ).length

    const systemPrompt = `You are a senior intelligence analyst. Write concise executive summaries for investigation briefings.`

    const userPrompt = `Subject: ${subject.subjectId}
Investigation: ${subject.investigation}
Classification: ${subject.classification}
Risk Score: ${riskScore}/100

Analysis Summary:
- ${behavioral.length} behavioral insights identified
- ${highSeverityInsights} high/critical severity findings
- Primary operational zone: ${geographic.primaryZone}
- Estimated associates: ${network.likelyAssociates}
- Network risk: ${network.networkRisk}

Write a 3-4 sentence executive summary highlighting the most critical findings and overall threat assessment.`

    try {
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 300
      })

      return response.choices[0]?.message?.content || this.getFallbackSummary(subject, riskScore)
    } catch (error) {
      console.error('Failed to generate summary:', error)
      return this.getFallbackSummary(subject, riskScore)
    }
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    locations: LocationStop[],
    behavioral: BehavioralInsight[],
    network: NetworkInference
  ): number {
    let score = 30 // Base score

    // Location-based risk
    const anomalyCount = locations.filter(l => l.significance === 'anomaly').length
    const suspiciousCount = locations.filter(l => l.significance === 'suspicious').length
    score += anomalyCount * 15
    score += suspiciousCount * 8

    // Behavioral insights risk
    const criticalInsights = behavioral.filter(i => i.severity === 'critical').length
    const highInsights = behavioral.filter(i => i.severity === 'high').length
    score += criticalInsights * 12
    score += highInsights * 6

    // Network risk
    const networkRiskMap = { low: 0, medium: 10, high: 20, critical: 30 }
    score += networkRiskMap[network.networkRisk]

    return Math.min(100, Math.max(0, score))
  }

  // Fallback methods for when AI is unavailable

  private getFallbackBehavioralInsights(locations: LocationStop[]): BehavioralInsight[] {
    const insights: BehavioralInsight[] = []

    const anomalies = locations.filter(l => l.significance === 'anomaly')
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Anomalous behavior detected',
        description: `${anomalies.length} locations flagged as anomalous, including ${anomalies[0].name}`,
        confidence: 85,
        severity: 'high',
        tags: ['anomaly', 'behavior-change']
      })
    }

    const suspicious = locations.filter(l => l.significance === 'suspicious')
    if (suspicious.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Suspicious activity pattern',
        description: `${suspicious.length} suspicious locations identified requiring further investigation`,
        confidence: 75,
        severity: 'medium',
        tags: ['suspicious', 'investigation-required']
      })
    }

    return insights
  }

  private getFallbackGeography(locations: LocationStop[]): GeographicIntelligence {
    return {
      primaryZone: 'Multiple zones',
      secondaryZones: ['Secondary activity areas detected'],
      clusters: [{
        name: 'Primary cluster',
        center: [locations[0]?.lng || 0, locations[0]?.lat || 0],
        locations: locations.slice(0, 3).map(l => l.name),
        significance: 'Main area of activity'
      }],
      travelPatterns: ['Pattern analysis requires additional data']
    }
  }

  private getFallbackNetwork(locations: LocationStop[]): NetworkInference {
    const meetingLocs = locations.filter(l => l.type === 'meeting')
    return {
      likelyAssociates: meetingLocs.length * 2,
      meetingLocations: meetingLocs.map(l => l.name),
      suspiciousContacts: ['Network analysis pending'],
      networkRisk: 'medium',
      inference: 'Multiple potential contacts identified at meeting locations'
    }
  }

  private getFallbackRecommendations(locations: LocationStop[]): ActionableRecommendation[] {
    return [{
      priority: 'high',
      action: 'Review suspicious locations',
      rationale: 'Multiple locations flagged for investigation',
      resources: ['Surveillance team', 'Warrant preparation']
    }]
  }

  private getFallbackSummary(subject: InvestigationSubject, riskScore: number): string {
    return `Subject ${subject.subjectId} under investigation for ${subject.investigation}. Risk assessment score: ${riskScore}/100. Multiple locations of interest identified requiring further investigation.`
  }

  private getFallbackIntelligence(
    locations: LocationStop[],
    subject: InvestigationSubject
  ): InvestigationIntelligence {
    return {
      behavioralInsights: this.getFallbackBehavioralInsights(locations),
      geographicIntelligence: this.getFallbackGeography(locations),
      networkInference: this.getFallbackNetwork(locations),
      recommendations: this.getFallbackRecommendations(locations),
      riskScore: 50,
      summary: this.getFallbackSummary(subject, 50)
    }
  }
}

// Singleton instance
let intelligenceServiceInstance: InvestigationIntelligenceService | null = null

export function getInvestigationIntelligenceService(): InvestigationIntelligenceService {
  if (!intelligenceServiceInstance) {
    const apiKey = process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY

    if (!apiKey) {
      throw new Error('VULTR_API_KEY environment variable is not set')
    }

    const llm = new VultrLLMService({
      apiKey,
      baseURL: 'https://api.vultrinference.com/v1',
      model: 'llama2-13b-chat' // Standard Vultr model name
    })

    intelligenceServiceInstance = new InvestigationIntelligenceService(llm)
  }

  return intelligenceServiceInstance
}
