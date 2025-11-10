/**
 * Investigation Command Handler
 * Processes natural language investigation queries and generates artifacts
 */

import type { ChatMessage } from '@/components/ai/AIChatPanel'

export interface InvestigationQuery {
  type: 'show-alerts' | 'load-case' | 'analyze-subject' | 'show-route' | 'list-subjects'
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

    // Show alerts pattern (only for investigation-specific queries, not analysis commands)
    // Skip if query contains analysis-related keywords
    const isAnalysisCommand = lowerQuery.includes('analyze') ||
                               lowerQuery.includes('imagery') ||
                               lowerQuery.includes('satellite') ||
                               lowerQuery.includes('isochrone') ||
                               lowerQuery.includes('reachability') ||
                               lowerQuery.includes('accessibility') ||
                               (lowerQuery.includes('route') && !lowerQuery.includes('subject'))

    if (!isAnalysisCommand && (
      lowerQuery.includes('alert') ||
      (lowerQuery.includes('show') && lowerQuery.includes('me')) ||
      lowerQuery.includes('what\'s happening') ||
      lowerQuery.includes('whats happening') ||
      lowerQuery.includes('updates') ||
      lowerQuery.includes('citizens')
    )) {
      return { type: 'show-alerts', params: {} }
    }

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

    // Show route pattern (only for investigation-specific route commands with subject reference)
    if (
      lowerQuery.includes('subject') && (lowerQuery.includes('route') || lowerQuery.includes('movement'))
    ) {
      return { type: 'show-route', params: {} }
    }

    // List subjects pattern
    if (
      (lowerQuery.includes('list') || lowerQuery.includes('show')) &&
      (lowerQuery.includes('subject') || lowerQuery.includes('all'))
    ) {
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
      case 'show-alerts':
        return this.handleShowAlerts()

      case 'load-case':
        return this.handleLoadCase(command.params.caseNumber)

      case 'analyze-subject':
        return this.handleAnalyzeSubject(command.params.subjectId)

      case 'list-subjects':
        return this.handleListSubjects()

      case 'show-route':
        return this.handleShowRoute()

      default:
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Command not yet implemented. Try: "Show me the alerts" or "Show all subjects"',
          timestamp: new Date()
        }]
    }
  }

  /**
   * Handle: Show intelligence alerts
   */
  private async handleShowAlerts(): Promise<ChatMessage[]> {
    try {
      const { getCitizens360DataService } = await import('./citizens360DataService')
      const dataService = getCitizens360DataService()

      // Generate intelligence alerts from recent activity
      const alerts = await dataService.generateIntelligenceAlerts()

      if (alerts.length === 0) {
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: '✅ **No active alerts**\n\nAll monitored cases show routine activity. No critical events or anomalies detected in the past 24 hours.',
          timestamp: new Date()
        }]
      }

      // Count critical and high-priority alerts
      const criticalCount = alerts.filter(a => a.priority === 'critical').length
      const highCount = alerts.filter(a => a.priority === 'high').length

      // Find the most critical alert with a location
      const criticalAlert = alerts.find(a => a.priority === 'critical' && a.location)

      // Generate LLM analysis
      const analysis = await this.generateAlertAnalysis(alerts, criticalCount, highCount)

      const messages: ChatMessage[] = []

      // 1. Add LLM analysis message
      messages.push({
        id: `${Date.now()}-analysis`,
        role: 'assistant',
        content: analysis,
        timestamp: new Date()
      })

      // 2. Add map actions - zoom to critical alert and show alert markers
      if (criticalAlert && criticalAlert.location) {
        messages.push({
          id: `${Date.now()}-map-zoom`,
          role: 'assistant',
          content: `📍 Zooming to critical alert: **${criticalAlert.location.name}**`,
          timestamp: new Date(),
          mapAction: {
            type: 'flyTo',
            coordinates: criticalAlert.location.coordinates,
            zoom: 15,
            pitch: 45,
            bearing: 0
          }
        })

        // Add alert markers to map
        const alertMarkers = alerts
          .filter(a => a.location)
          .map(a => ({
            id: a.id,
            coordinates: a.location!.coordinates,
            properties: {
              title: a.title,
              priority: a.priority,
              category: a.category,
              subjectName: a.subjectName,
              caseName: a.caseName,
              timestamp: a.timestamp.toISOString(),
              description: a.description
            }
          }))

        messages.push({
          id: `${Date.now()}-alert-markers`,
          role: 'assistant',
          content: `🗺️ Displaying ${alertMarkers.length} alert location${alertMarkers.length !== 1 ? 's' : ''} on map`,
          timestamp: new Date(),
          mapAction: {
            type: 'addMarkers',
            markers: alertMarkers,
            markerStyle: 'alert-priority' // Color by priority
          }
        })
      }

      // 3. Add summary message with alerts artifact
      const summary = `🚨 **Intelligence Alerts** - ${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}\n\n` +
        `**Critical:** ${criticalCount} | **High:** ${highCount}\n\n` +
        `Showing alerts from the past 24 hours requiring investigative action.`

      messages.push({
        id: `${Date.now()}-alerts`,
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
        artifact: {
          type: 'intelligence-alerts',
          data: {
            title: 'Active Intelligence Alerts',
            timestamp: new Date(),
            alerts,
            summary: `${criticalCount} critical and ${highCount} high-priority alerts detected`,
            totalCritical: criticalCount,
            totalAnomalies: alerts.filter(a => a.category === 'behavioral-anomaly' || a.category === 'location-anomaly').length
          }
        }
      })

      // 4. Add details for top 3 critical/high alerts
      const topAlerts = alerts.slice(0, 3)
      for (const alert of topAlerts) {
        const priorityEmoji = alert.priority === 'critical' ? '🔴' : '🟠'
        const timeAgo = this.formatTimeAgo(alert.timestamp)

        messages.push({
          id: `${Date.now()}-detail-${alert.id}`,
          role: 'assistant',
          content: `${priorityEmoji} **${alert.title}**\n\n` +
            `**Case:** ${alert.caseName} (${alert.caseNumber})\n` +
            `**Subject:** ${alert.subjectName}\n` +
            `**Category:** ${this.formatCategory(alert.category)}\n` +
            `**Time:** ${timeAgo}\n` +
            `**Confidence:** ${alert.confidence}\n\n` +
            `${alert.description}` +
            (alert.actionRequired ? '\n\n⚠️ **Action Required**' : ''),
          timestamp: new Date()
        })
      }

      if (alerts.length > 3) {
        messages.push({
          id: `${Date.now()}-more`,
          role: 'assistant',
          content: `📋 *${alerts.length - 3} additional alert${alerts.length - 3 !== 1 ? 's' : ''} in full report above.*\n\n` +
            `To investigate a specific case, ask: "Load investigation case CT-2024-8473"`,
          timestamp: new Date()
        })
      }

      return messages

    } catch (error) {
      console.error('Failed to generate alerts:', error)
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to load intelligence alerts. ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]
    }
  }

  /**
   * Generate LLM analysis of alerts
   */
  private async generateAlertAnalysis(alerts: any[], criticalCount: number, highCount: number): Promise<string> {
    try {
      // Prepare alert summary for LLM
      const alertSummary = alerts.slice(0, 5).map(a => ({
        priority: a.priority,
        category: a.category,
        title: a.title,
        subject: a.subjectName,
        case: a.caseName,
        timestamp: this.formatTimeAgo(a.timestamp),
        location: a.location?.name || 'Unknown'
      }))

      const prompt = `You are a senior intelligence analyst reviewing alert data. Provide a brief, professional analysis.

ALERT SUMMARY:
- Total Alerts: ${alerts.length}
- Critical: ${criticalCount}
- High Priority: ${highCount}

TOP ALERTS:
${alertSummary.map((a, i) => `${i + 1}. [${a.priority.toUpperCase()}] ${a.title}
   Subject: ${a.subject} | Case: ${a.case}
   Location: ${a.location} | Time: ${a.timestamp}
   Category: ${a.category}`).join('\n\n')}

Provide a 2-3 sentence intelligence assessment focusing on:
1. Overall threat pattern
2. Most concerning activity
3. Recommended immediate action

Be concise, professional, and action-oriented. Do not use emojis.`

      const response = await fetch('https://api.vult.r.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama2-13b-chat-Q5_K_M',
          messages: [
            { role: 'system', content: 'You are a senior intelligence analyst. Be concise and professional.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        console.warn('LLM analysis failed, using fallback')
        return this.getFallbackAnalysis(alerts, criticalCount, highCount)
      }

      const data = await response.json()
      const analysis = data.choices?.[0]?.message?.content?.trim()

      if (!analysis) {
        return this.getFallbackAnalysis(alerts, criticalCount, highCount)
      }

      return `🎯 **Intelligence Assessment**\n\n${analysis}`

    } catch (error) {
      console.error('LLM analysis error:', error)
      return this.getFallbackAnalysis(alerts, criticalCount, highCount)
    }
  }

  /**
   * Fallback analysis if LLM fails
   */
  private getFallbackAnalysis(alerts: any[], criticalCount: number, highCount: number): string {
    const topAlert = alerts[0]
    const categories = [...new Set(alerts.map(a => a.category))]

    return `🎯 **Intelligence Assessment**\n\n` +
      `Multiple high-priority alerts detected across ${categories.length} threat categories. ` +
      `Primary concern: ${topAlert.title} involving ${topAlert.subjectName}. ` +
      `Recommend immediate review of critical alerts and coordination with case teams for ${topAlert.caseName}.`
  }

  /**
   * Format time ago (e.g., "2 hours ago")
   */
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }

  /**
   * Format category for display
   */
  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Handle: Load investigation case
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
      // Load case data from Citizens 360 Data Service
      const { getCitizens360DataService } = await import('./citizens360DataService')
      const dataService = getCitizens360DataService()

      // Get case metadata
      const caseMetadata = await dataService.getCaseMetadata(caseNumber)
      if (!caseMetadata) {
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Case ${caseNumber} not found. Available cases: CT-2024-8473`,
          timestamp: new Date()
        }]
      }

      // Load all subjects for this case
      const subjects = await dataService.loadCaseSubjects(caseNumber)
      if (subjects.length === 0) {
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ No subjects found for case ${caseNumber}`,
          timestamp: new Date()
        }]
      }

      // Get primary subject (first one)
      const primarySubject = subjects[0]

      // Load timeline for primary subject
      const timelineEvents = await dataService.loadTimeline(caseNumber, primarySubject.subjectId)

      // Create artifact messages
      const messages: ChatMessage[] = []

      // 1. Case Overview
      messages.push({
        id: `${Date.now()}-0`,
        role: 'assistant',
        content: `🔒 **${caseMetadata.codename}** (${caseNumber})\n\n${caseMetadata.briefing}\n\n**Status:** ${caseMetadata.status} | **Priority:** ${caseMetadata.priority} | **Subjects:** ${subjects.length}`,
        timestamp: new Date()
      })

      // 2. Subject Profile (using new comprehensive data)
      messages.push({
        id: `${Date.now()}-1`,
        role: 'assistant',
        content: `👤 **Primary Subject:** ${primarySubject.name.full}\n**Classification:** ${primarySubject.classification}\n**Status:** ${primarySubject.status}\n**Threat Level:** ${primarySubject.intelligence.threatLevel}`,
        timestamp: new Date(),
        artifact: {
          type: 'subject-profile',
          data: primarySubject
        }
      })

      // 3. Timeline (if available)
      if (timelineEvents.length > 0) {
        const stats = await dataService.getTimelineStats(caseNumber, primarySubject.subjectId)

        messages.push({
          id: `${Date.now()}-2`,
          role: 'assistant',
          content: `📅 **Timeline:** ${stats.totalEvents} events over ${Math.round((stats.dateRange.end.getTime() - stats.dateRange.start.getTime()) / (1000 * 60 * 60))} hours\n\n**Breakdown:** ${stats.bySignificance.routine || 0} routine, ${stats.bySignificance.suspicious || 0} suspicious, ${stats.bySignificance.anomaly || 0} anomalies, ${stats.bySignificance.critical || 0} critical`,
          timestamp: new Date(),
          artifact: {
            type: 'timeline',
            data: {
              title: `${primarySubject.name.full} - 72 Hour Surveillance`,
              period: stats.dateRange,
              events: timelineEvents,
              summary: `${stats.totalEvents} events tracked during surveillance period`
            }
          }
        })
      }

      // 4. Associates List (if any)
      if (subjects.length > 1) {
        const associatesList = subjects.slice(1).map(s =>
          `• **${s.name.full}** (${s.subjectId}) - ${s.classification} - Threat: ${s.intelligence.threatLevel}`
        ).join('\n')

        messages.push({
          id: `${Date.now()}-3`,
          role: 'assistant',
          content: `👥 **Associates (${subjects.length - 1}):**\n\n${associatesList}`,
          timestamp: new Date()
        })
      }

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
   * Handle: List all subjects under investigation
   */
  private async handleListSubjects(): Promise<ChatMessage[]> {
    try {
      const { getCitizens360DataService } = await import('./citizens360DataService')
      const dataService = getCitizens360DataService()

      // Get all subjects from the database
      const subjects = await dataService.getAllSubjects()

      if (subjects.length === 0) {
        return [{
          id: Date.now().toString(),
          role: 'assistant',
          content: '📋 **No Active Subjects**\n\nNo subjects are currently under investigation.',
          timestamp: new Date()
        }]
      }

      // Format subject list
      const subjectList = subjects.map((subject, index) => {
        const statusIcon = subject.status === 'active' ? '🟢' : subject.status === 'pending' ? '🟡' : '⚪'
        return `${index + 1}. ${statusIcon} **${subject.name}** (${subject.id})\n   Risk: ${subject.riskLevel} | Status: ${subject.status}`
      }).join('\n\n')

      const content = `📋 **Active Subjects** (${subjects.length} total)\n\n${subjectList}\n\n*Use "Analyze subject [ID]" for detailed investigation*`

      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date()
      }]
    } catch (error) {
      console.error('Error listing subjects:', error)
      return [{
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Error loading subjects. Please try again.',
        timestamp: new Date()
      }]
    }
  }

  /**
   * Handle: Show subject route/movement
   */
  private async handleShowRoute(): Promise<ChatMessage[]> {
    return [{
      id: Date.now().toString(),
      role: 'assistant',
      content: '🗺️ **Subject Movement Analysis**\n\nThis feature displays subject movement patterns, frequent locations, and route analysis. (Demo mode: Full implementation in production)',
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
        content: '🔍 **Citizens 360 Intelligence Platform**\n\nTry asking:\n• "Show me the alerts"\n• "What\'s the current status?"\n• "Show investigation updates"\n\nOr load a specific case: "Load investigation case CT-2024-8473"',
        timestamp: new Date()
      }]
    }

    // 2. Execute command
    return this.executeCommand(command)
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
