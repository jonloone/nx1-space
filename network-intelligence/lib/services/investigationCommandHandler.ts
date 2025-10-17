/**
 * Investigation Command Handler
 * Processes natural language investigation queries and generates artifacts
 */

import type { ChatMessage } from '@/components/ai/AIChatPanel'
import type { InvestigationSubject, LocationStop } from '@/lib/demo/investigation-demo-data'
import {
  createSubjectProfileArtifact,
  createTimelineArtifact,
  createIntelligenceAnalysisArtifact,
  createHeatmapSummaryArtifact
} from '@/lib/utils/artifactFactories'

export interface InvestigationQuery {
  type: 'load-case' | 'analyze-subject' | 'show-route' | 'list-subjects'
  params: {
    caseNumber?: string
    subjectId?: string
  }
}

export class InvestigationCommandHandler {
  /**
   * Parse natural language query into structured command
   */
  parseQuery(query: string): InvestigationQuery | null {
    const lowerQuery = query.toLowerCase()

    // Load case pattern
    if (lowerQuery.includes('load') && /ct-\d{4}-\d{4}/.test(lowerQuery)) {
      const caseMatch = lowerQuery.match(/ct-\d{4}-\d{4}/)
      return {
        type: 'load-case',
        params: { caseNumber: caseMatch ? caseMatch[0] : undefined }
      }
    }

    // Analyze subject pattern
    if (lowerQuery.includes('analyze') && /subject-\d{4}/.test(lowerQuery)) {
      const subjectMatch = lowerQuery.match(/subject-\d{4}/)
      return {
        type: 'analyze-subject',
        params: { subjectId: subjectMatch ? subjectMatch[0] : undefined }
      }
    }

    // Show route pattern
    if (lowerQuery.includes('route') || lowerQuery.includes('movement')) {
      return { type: 'show-route', params: {} }
    }

    // List subjects pattern
    if (lowerQuery.includes('list') && lowerQuery.includes('subject')) {
      return { type: 'list-subjects', params: {} }
    }

    return null
  }

  /**
   * Execute investigation command
   */
  async executeCommand(command: InvestigationQuery): Promise<ChatMessage[]> {
    console.log('🔍 Executing investigation command:', command.type)

    switch (command.type) {
      case 'load-case':
        return this.handleLoadCase(command.params.caseNumber)

      case 'analyze-subject':
        return this.handleAnalyzeSubject(command.params.subjectId)

      default:
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Command not yet implemented. Try: "Load investigation case CT-2024-8473"',
          timestamp: new Date()
        }]
    }
  }

  /**
   * Handle: Load investigation case (Demo implementation)
   */
  private async handleLoadCase(caseNumber?: string): Promise<ChatMessage[]> {
    if (!caseNumber) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please provide a case number. Format: CT-YYYY-NNNN',
        timestamp: new Date()
      }]
    }

    try {
      // Create demo data
      const demoData = this.createDemoInvestigationData()

      // Create artifact messages
      const messages: ChatMessage[] = []

      // 1. Subject Profile
      messages.push({
        id: `${Date.now()}-1`,
        role: 'assistant',
        content: `📋 Investigation Case Loaded: ${caseNumber}`,
        timestamp: new Date(),
        artifact: createSubjectProfileArtifact(
          demoData.subject,
          demoData.intelligence,
          demoData.locationStops
        )
      })

      // 2. Intelligence Analysis
      messages.push({
        id: `${Date.now()}-2`,
        role: 'assistant',
        content: demoData.intelligence.summary,
        timestamp: new Date(),
        artifact: createIntelligenceAnalysisArtifact(demoData.intelligence)
      })

      // 3. Timeline
      messages.push({
        id: `${Date.now()}-3`,
        role: 'assistant',
        content: `📅 Timeline: ${demoData.locationStops.length} locations tracked`,
        timestamp: new Date(),
        artifact: createTimelineArtifact(demoData.locationStops, demoData.subject)
      })

      return messages

    } catch (error) {
      console.error('Failed to load case:', error)
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to load case ${caseNumber}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]
    }
  }

  /**
   * Handle: Analyze subject
   */
  private async handleAnalyzeSubject(subjectId?: string): Promise<ChatMessage[]> {
    if (!subjectId) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please provide a subject ID. Format: SUBJECT-NNNN',
        timestamp: new Date()
      }]
    }

    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: `🧠 Analyzing subject ${subjectId}... (Demo mode: Full implementation in production)`,
      timestamp: new Date()
    }]
  }

  /**
   * Process chat query (main entry point)
   */
  async processQuery(query: string): Promise<ChatMessage[]> {
    console.log('🤖 Processing investigation query:', query)

    // 1. Parse query
    const command = this.parseQuery(query)

    if (!command) {
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Try: "Load investigation case CT-2024-8473" to see Citizens 360 artifacts in action!',
        timestamp: new Date()
      }]
    }

    // 2. Execute command
    return this.executeCommand(command)
  }

  /**
   * Create demo investigation data
   */
  private createDemoInvestigationData() {
    const now = new Date()
    const startDate = new Date(now.getTime() - 72 * 60 * 60 * 1000)

    const subject: InvestigationSubject = {
      subjectId: 'SUBJECT-8473',
      caseNumber: 'CT-2024-8473',
      classification: 'person-of-interest',
      investigation: 'Operation Digital Shadow',
      startDate,
      endDate: now,
      legalAuthorization: 'Federal Warrant (SDNY)'
    }

    const locationStops: LocationStop[] = [
      {
        id: 'stop-1',
        name: 'Williamsburg Apartment',
        type: 'residence',
        lat: 40.7145,
        lng: -73.9566,
        arrivalTime: new Date(startDate.getTime()),
        departureTime: new Date(startDate.getTime() + 8 * 60 * 60 * 1000),
        dwellTimeMinutes: 480,
        visitCount: 1,
        significance: 'routine',
        notes: 'Subject\'s residence'
      },
      {
        id: 'stop-2',
        name: 'Chelsea Tech Office',
        type: 'workplace',
        lat: 40.7450,
        lng: -74.0010,
        arrivalTime: new Date(startDate.getTime() + 9 * 60 * 60 * 1000),
        departureTime: new Date(startDate.getTime() + 17 * 60 * 60 * 1000),
        dwellTimeMinutes: 480,
        visitCount: 1,
        significance: 'routine',
        notes: 'Regular workplace'
      },
      {
        id: 'stop-3',
        name: 'Red Hook Warehouse',
        type: 'meeting',
        lat: 40.6743,
        lng: -74.0140,
        arrivalTime: new Date(startDate.getTime() + 26 * 60 * 60 * 1000),
        departureTime: new Date(startDate.getTime() + 27 * 60 * 60 * 1000),
        dwellTimeMinutes: 42,
        visitCount: 1,
        significance: 'anomaly',
        notes: '⚠️ Late night meeting at 2:47 AM'
      }
    ]

    const intelligence = {
      behavioralInsights: [
        {
          type: 'anomaly' as const,
          title: 'Late Night Activity',
          description: 'Subject visited industrial warehouse at unusual hour (2:47 AM)',
          confidence: 92,
          severity: 'high' as const,
          tags: ['late-night', 'warehouse']
        }
      ],
      geographicIntelligence: {
        primaryZone: 'Williamsburg, Brooklyn',
        secondaryZones: ['Chelsea, Manhattan', 'Red Hook, Brooklyn'],
        clusters: [],
        travelPatterns: ['Regular commute pattern with late-night deviation']
      },
      networkInference: {
        likelyAssociates: 2,
        meetingLocations: ['Red Hook Warehouse'],
        suspiciousContacts: ['Unidentified associates at warehouse'],
        networkRisk: 'high' as const,
        inference: 'Multiple associates detected at industrial site'
      },
      recommendations: [
        {
          priority: 'immediate' as const,
          action: 'Warrant for warehouse facility',
          rationale: 'Critical anomaly detected',
          resources: ['Surveillance team', 'Warrant preparation']
        }
      ],
      riskScore: 72,
      summary: 'Subject exhibits established routine with critical deviation on Night 2/3. Late-night warehouse visit with multiple associates indicates high-priority activity requiring immediate attention.'
    }

    return { subject, locationStops, intelligence }
  }
}

// Singleton instance
let commandHandlerInstance: InvestigationCommandHandler | null = null

export function getInvestigationCommandHandler(): InvestigationCommandHandler {
  if (!commandHandlerInstance) {
    commandHandlerInstance = new InvestigationCommandHandler()
  }
  return commandHandlerInstance
}
