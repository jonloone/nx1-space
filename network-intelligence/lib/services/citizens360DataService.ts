/**
 * Citizens 360 Data Service
 * Centralized service for loading and managing investigation case data
 */

import type { SubjectProfileData, TimelineEvent, IntelligenceAlert } from '@/lib/types/chatArtifacts'
import type { CaseMetadata } from '@/lib/data/citizens360/cases-index'

/**
 * Citizens 360 Data Service
 * Manages loading and accessing investigation case data
 */
export class Citizens360DataService {
  private casesIndex: Record<string, CaseMetadata> | null = null
  private loadedCases = new Map<string, any>()
  private loadedTimelines = new Map<string, TimelineEvent[]>()

  /**
   * Get all available cases
   */
  async getAllCases(): Promise<CaseMetadata[]> {
    if (!this.casesIndex) {
      const { INVESTIGATION_CASES } = await import('@/lib/data/citizens360/cases-index')
      this.casesIndex = INVESTIGATION_CASES
    }

    return Object.values(this.casesIndex).sort((a, b) =>
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    )
  }

  /**
   * Get case metadata by case number
   */
  async getCaseMetadata(caseNumber: string): Promise<CaseMetadata | null> {
    if (!this.casesIndex) {
      await this.getAllCases()
    }

    return this.casesIndex?.[caseNumber] || null
  }

  /**
   * Load case subjects by case number
   */
  async loadCaseSubjects(caseNumber: string): Promise<SubjectProfileData[]> {
    // Check cache first
    const cached = this.loadedCases.get(caseNumber)
    if (cached) {
      return cached
    }

    // Load case data based on case number
    try {
      switch (caseNumber.toUpperCase()) {
        case 'CT-2024-8473': {
          const { getAllSubjects } = await import('@/lib/data/citizens360/case-ct-2024-8473')
          const subjects = getAllSubjects()
          this.loadedCases.set(caseNumber, subjects)
          return subjects
        }

        // Future cases will be added here
        case 'OC-2024-3721':
        case 'CR-2024-5512':
        case 'MP-2024-7834':
        case 'FC-2024-6249':
          throw new Error(`Case ${caseNumber} data not yet implemented. Only CT-2024-8473 is available.`)

        default:
          throw new Error(`Unknown case number: ${caseNumber}`)
      }
    } catch (error) {
      console.error(`Failed to load case ${caseNumber}:`, error)
      throw error
    }
  }

  /**
   * Get subject by ID from a specific case
   */
  async getSubjectById(caseNumber: string, subjectId: string): Promise<SubjectProfileData | null> {
    const subjects = await this.loadCaseSubjects(caseNumber)
    return subjects.find(s => s.subjectId === subjectId) || null
  }

  /**
   * Get primary subject for a case (first subject in the list)
   */
  async getPrimarySubject(caseNumber: string): Promise<SubjectProfileData | null> {
    const subjects = await this.loadCaseSubjects(caseNumber)
    return subjects.length > 0 ? subjects[0] : null
  }

  /**
   * Load timeline events for a subject
   */
  async loadTimeline(caseNumber: string, subjectId: string): Promise<TimelineEvent[]> {
    // Check cache first
    const cacheKey = `${caseNumber}-${subjectId}`
    const cached = this.loadedTimelines.get(cacheKey)
    if (cached) {
      return cached
    }

    // Load timeline data based on case and subject
    try {
      switch (caseNumber.toUpperCase()) {
        case 'CT-2024-8473': {
          // Only SUBJECT-2547 has timeline data currently
          if (subjectId === 'SUBJECT-2547') {
            const { generateSubject2547Timeline } = await import('@/lib/data/citizens360/timeline-ct-2024-8473')
            const timeline = generateSubject2547Timeline()
            this.loadedTimelines.set(cacheKey, timeline)
            return timeline
          } else {
            // Return empty timeline for other subjects
            return []
          }
        }

        default:
          throw new Error(`Timeline data not available for case: ${caseNumber}`)
      }
    } catch (error) {
      console.error(`Failed to load timeline for ${caseNumber}/${subjectId}:`, error)
      throw error
    }
  }

  /**
   * Get timeline statistics
   */
  async getTimelineStats(caseNumber: string, subjectId: string): Promise<{
    totalEvents: number
    bySignificance: Record<string, number>
    byType: Record<string, number>
    dateRange: { start: Date; end: Date }
  }> {
    const events = await this.loadTimeline(caseNumber, subjectId)

    if (events.length === 0) {
      const now = new Date()
      return {
        totalEvents: 0,
        bySignificance: {},
        byType: {},
        dateRange: { start: now, end: now }
      }
    }

    // Calculate statistics
    const bySignificance: Record<string, number> = {}
    const byType: Record<string, number> = {}

    events.forEach(event => {
      bySignificance[event.significance] = (bySignificance[event.significance] || 0) + 1
      byType[event.type] = (byType[event.type] || 0) + 1
    })

    const timestamps = events.map(e => e.timestamp.getTime())
    const dateRange = {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps))
    }

    return {
      totalEvents: events.length,
      bySignificance,
      byType,
      dateRange
    }
  }

  /**
   * Search cases by query
   */
  async searchCases(query: string): Promise<CaseMetadata[]> {
    const allCases = await this.getAllCases()
    const lowerQuery = query.toLowerCase()

    return allCases.filter(c =>
      c.tags.some(tag => tag.includes(lowerQuery)) ||
      c.briefing.toLowerCase().includes(lowerQuery) ||
      c.codename.toLowerCase().includes(lowerQuery) ||
      c.city.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get cases by status
   */
  async getCasesByStatus(status: 'active' | 'monitoring' | 'closed' | 'archived'): Promise<CaseMetadata[]> {
    const allCases = await this.getAllCases()
    return allCases.filter(c => c.status === status)
  }

  /**
   * Get cases by priority
   */
  async getCasesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<CaseMetadata[]> {
    const allCases = await this.getAllCases()
    return allCases.filter(c => c.priority === priority)
  }

  /**
   * Generate intelligence alerts from recent activity
   * Analyzes timeline events and case data to create actionable alerts
   */
  async generateIntelligenceAlerts(): Promise<IntelligenceAlert[]> {
    const alerts: IntelligenceAlert[] = []

    // Get all active/monitoring cases
    const allCases = await this.getAllCases()
    const activeCases = allCases.filter(c => c.status === 'active' || c.status === 'monitoring')

    for (const caseData of activeCases) {
      try {
        // Load subjects for this case
        const subjects = await this.loadCaseSubjects(caseData.caseNumber)

        for (const subject of subjects) {
          // Load timeline events
          const timeline = await this.loadTimeline(caseData.caseNumber, subject.subjectId)

          // Generate alerts from critical and anomaly events
          const recentEvents = timeline.filter(e => {
            const hoursSinceEvent = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60)
            return hoursSinceEvent <= 24 && (e.significance === 'critical' || e.significance === 'anomaly')
          })

          for (const event of recentEvents) {
            const alert: IntelligenceAlert = {
              id: `alert-${event.id}`,
              timestamp: event.timestamp,
              priority: event.significance === 'critical' ? 'critical' : 'high',
              category: this.categorizeEvent(event),
              title: event.title,
              description: event.description,
              caseNumber: caseData.caseNumber,
              caseName: caseData.codename,
              subjectId: subject.subjectId,
              subjectName: subject.name.full,
              location: event.location ? {
                name: event.location.name,
                coordinates: event.location.coordinates,
                address: event.location.address
              } : undefined,
              confidence: event.confidence,
              actionRequired: event.significance === 'critical',
              relatedEventId: event.id,
              tags: this.generateAlertTags(event, subject)
            }

            alerts.push(alert)
          }
        }
      } catch (error) {
        console.warn(`Failed to generate alerts for case ${caseData.caseNumber}:`, error)
        // Continue with other cases
      }
    }

    // Sort by priority (critical first) and timestamp (newest first)
    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  /**
   * Categorize an event into an alert category
   */
  private categorizeEvent(event: TimelineEvent): IntelligenceAlert['category'] {
    switch (event.type) {
      case 'meeting':
        return 'network-activity'
      case 'financial':
        return 'financial-activity'
      case 'communication':
        return 'communication-pattern'
      case 'location':
      case 'movement':
        return 'location-anomaly'
      case 'digital':
        return 'threat-indicator'
      default:
        return 'behavioral-anomaly'
    }
  }

  /**
   * Generate relevant tags for an alert
   */
  private generateAlertTags(event: TimelineEvent, subject: SubjectProfileData): string[] {
    const tags: string[] = []

    // Add event type
    tags.push(event.type)

    // Add significance
    tags.push(event.significance)

    // Add threat level
    tags.push(`threat-${subject.intelligence.threatLevel.toLowerCase()}`)

    // Add time-based tags
    const hour = event.timestamp.getHours()
    if (hour >= 22 || hour < 5) {
      tags.push('late-night')
    }

    // Add location-based tags if available
    if (event.location) {
      if (event.location.name.toLowerCase().includes('warehouse')) tags.push('warehouse')
      if (event.location.name.toLowerCase().includes('airport')) tags.push('airport')
      if (event.location.name.toLowerCase().includes('hotel')) tags.push('hotel')
    }

    return tags
  }

  /**
   * Get subject profile by subject ID (searches across all cases)
   */
  getSubjectProfile(subjectId: string): SubjectProfileData | null {
    // For now, default to case CT-2024-8473
    // In the future, this could search across all loaded cases
    const caseNumber = 'CT-2024-8473'

    // Check if case is already loaded
    const cached = this.loadedCases.get(caseNumber)
    if (cached) {
      return cached.find((s: SubjectProfileData) => s.subjectId === subjectId) || null
    }

    // If not cached, return null and trigger async load
    this.loadCaseSubjects(caseNumber).then(subjects => {
      // Will be cached for next call
    }).catch(err => {
      console.error(`Failed to load subject ${subjectId}:`, err)
    })

    return null
  }

  /**
   * Get subject timeline by subject ID
   */
  getSubjectTimeline(subjectId: string): { events: TimelineEvent[]; subjectName?: string } | null {
    // For now, default to case CT-2024-8473
    const caseNumber = 'CT-2024-8473'

    // Check if timeline is already loaded
    const cacheKey = `${caseNumber}-${subjectId}`
    const cached = this.loadedTimelines.get(cacheKey)

    if (cached) {
      // Try to get subject name
      const subjects = this.loadedCases.get(caseNumber)
      const subject = subjects?.find((s: SubjectProfileData) => s.subjectId === subjectId)

      return {
        events: cached,
        subjectName: subject?.name?.full
      }
    }

    // If not cached, return null and trigger async load
    this.loadTimeline(caseNumber, subjectId).then(events => {
      // Will be cached for next call
    }).catch(err => {
      console.error(`Failed to load timeline for ${subjectId}:`, err)
    })

    return null
  }

  /**
   * Get network analysis for a subject
   * Generates network graph from timeline events and known associates
   */
  getSubjectNetwork(subjectId: string): {
    centerNode: { id: string; name: string; type: 'subject'; riskLevel?: 'high' | 'medium' | 'low' }
    nodes: Array<{ id: string; name: string; type: 'subject' | 'associate' | 'location' | 'organization'; riskLevel?: 'high' | 'medium' | 'low' }>
    connections: Array<{ from: string; to: string; type: 'communication' | 'meeting' | 'financial' | 'social'; frequency: number; lastContact?: Date }>
  } | null {
    const caseNumber = 'CT-2024-8473'

    // Get subject profile
    const subjects = this.loadedCases.get(caseNumber)
    const subject = subjects?.find((s: SubjectProfileData) => s.subjectId === subjectId)

    if (!subject) return null

    // Get timeline to extract network connections
    const cacheKey = `${caseNumber}-${subjectId}`
    const timeline = this.loadedTimelines.get(cacheKey)

    // Build network from subject data and timeline
    const nodes: any[] = []
    const connections: any[] = []

    // Add center node
    const centerNode = {
      id: subject.subjectId,
      name: subject.name.full,
      type: 'subject' as const,
      riskLevel: subject.intelligence.threatLevel.toLowerCase() as 'high' | 'medium' | 'low'
    }

    // Add associates as nodes
    if (subject.associates) {
      subject.associates.forEach((associate, index) => {
        const nodeId = associate.id || `associate-${index}`
        nodes.push({
          id: nodeId,
          name: associate.name,
          type: associate.relationship.includes('organization') ? 'organization' as const : 'associate' as const,
          riskLevel: associate.riskLevel
        })

        // Add connection
        connections.push({
          from: subject.subjectId,
          to: nodeId,
          type: associate.relationship.includes('financial') ? 'financial' as const :
                associate.relationship.includes('meeting') ? 'meeting' as const :
                associate.relationship.includes('communication') ? 'communication' as const : 'social' as const,
          frequency: Math.floor(Math.random() * 20) + 5
        })
      })
    }

    // Add locations from timeline as nodes
    if (timeline) {
      const uniqueLocations = new Map<string, any>()
      timeline.forEach(event => {
        if (event.location && !uniqueLocations.has(event.location.name)) {
          uniqueLocations.set(event.location.name, event.location)
        }
      })

      uniqueLocations.forEach((location, name) => {
        const nodeId = `location-${name.replace(/\s/g, '-').toLowerCase()}`
        nodes.push({
          id: nodeId,
          name,
          type: 'location' as const
        })

        connections.push({
          from: subject.subjectId,
          to: nodeId,
          type: 'meeting' as const,
          frequency: Math.floor(Math.random() * 10) + 1
        })
      })
    }

    return {
      centerNode,
      nodes,
      connections
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.loadedCases.clear()
    this.loadedTimelines.clear()
    this.casesIndex = null
  }
}

// Singleton instance
let serviceInstance: Citizens360DataService | null = null

/**
 * Get the Citizens 360 Data Service singleton
 */
export function getCitizens360DataService(): Citizens360DataService {
  if (!serviceInstance) {
    serviceInstance = new Citizens360DataService()
  }
  return serviceInstance
}
