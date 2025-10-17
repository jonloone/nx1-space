/**
 * Factory functions to create artifacts from investigation data
 */

import type {
  SubjectProfileArtifact,
  TimelineArtifact,
  IntelligenceAnalysisArtifact,
  HeatmapSummaryArtifact
} from '@/lib/types/chatArtifacts'
import type {
  InvestigationSubject,
  LocationStop
} from '@/lib/demo/investigation-demo-data'
import type { InvestigationIntelligence } from '@/lib/services/investigationIntelligenceService'
import { getChatMapSyncManager } from '@/lib/services/chatMapSyncManager'

/**
 * Create Subject Profile Artifact
 */
export function createSubjectProfileArtifact(
  subject: InvestigationSubject,
  intelligence: InvestigationIntelligence,
  locationStops?: LocationStop[]
): SubjectProfileArtifact {
  // Count location types if provided
  const stats = locationStops ? {
    totalLocations: locationStops.length,
    anomalies: locationStops.filter(l => l.significance === 'anomaly').length,
    suspicious: locationStops.filter(l => l.significance === 'suspicious').length,
    routine: locationStops.filter(l => l.significance === 'routine').length,
    estimatedAssociates: intelligence.networkInference.likelyAssociates
  } : {
    totalLocations: 0,
    anomalies: 0,
    suspicious: 0,
    routine: 0,
    estimatedAssociates: intelligence.networkInference.likelyAssociates
  }

  return {
    type: 'subject-profile',
    data: {
      subjectId: subject.subjectId,
      caseNumber: subject.caseNumber,
      classification: subject.classification,
      riskScore: intelligence.riskScore,
      status: 'active',
      investigation: subject.investigation,
      period: {
        start: subject.startDate,
        end: subject.endDate
      },
      stats
    },
    actions: [
      {
        id: 'view-timeline',
        label: 'View Timeline',
        icon: '📅',
        handler: async (data) => {
          const syncManager = getChatMapSyncManager()
          await syncManager.handleArtifactAction('subject-profile', 'view-timeline', data)
        }
      },
      {
        id: 'show-heatmap',
        label: 'Show Heatmap',
        icon: '🗺️',
        handler: async (data) => {
          const syncManager = getChatMapSyncManager()
          await syncManager.handleArtifactAction('subject-profile', 'show-heatmap', data)
        }
      },
      {
        id: 'export',
        label: 'Export',
        icon: '💾',
        handler: async (data) => {
          const syncManager = getChatMapSyncManager()
          await syncManager.handleArtifactAction('subject-profile', 'export', data)
        }
      }
    ]
  }
}

/**
 * Create Timeline Artifact
 */
export function createTimelineArtifact(
  locations: LocationStop[],
  subject: InvestigationSubject
): TimelineArtifact {
  const events = locations.map(loc => ({
    id: loc.id,
    timestamp: loc.arrivalTime,
    location: {
      name: loc.name,
      coordinates: [loc.lng, loc.lat] as [number, number]
    },
    type: 'stop' as const,
    significance: loc.significance,
    dwellTime: loc.dwellTimeMinutes,
    notes: loc.notes
  }))

  return {
    type: 'timeline',
    data: {
      title: `Timeline: ${subject.subjectId}`,
      period: {
        start: subject.startDate,
        end: subject.endDate
      },
      events
    },
    actions: [
      {
        id: 'play-route',
        label: 'Play Route',
        icon: '▶️',
        handler: async (data) => {
          const syncManager = getChatMapSyncManager()
          await syncManager.handleArtifactAction('timeline', 'play-route', data)
        }
      }
    ]
  }
}

/**
 * Create Intelligence Analysis Artifact
 */
export function createIntelligenceAnalysisArtifact(
  intelligence: InvestigationIntelligence
): IntelligenceAnalysisArtifact {
  return {
    type: 'intelligence-analysis',
    data: {
      executiveSummary: intelligence.summary,
      riskScore: intelligence.riskScore,
      behavioralInsights: intelligence.behavioralInsights,
      geographicIntelligence: intelligence.geographicIntelligence,
      networkInference: intelligence.networkInference,
      recommendations: intelligence.recommendations
    },
    actions: [
      {
        id: 'export-pdf',
        label: 'Export PDF',
        icon: '📄',
        handler: async (data) => {
          console.log('📄 Exporting intelligence report as PDF')
          // PDF export implementation
        }
      }
    ]
  }
}

/**
 * Create Heatmap Summary Artifact
 */
export function createHeatmapSummaryArtifact(
  locations: LocationStop[]
): HeatmapSummaryArtifact {
  // Group by time of day
  const timeOfDay = {
    earlyMorning: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    lateNight: 0
  }

  locations.forEach(loc => {
    const hour = loc.arrivalTime.getHours()
    if (hour >= 5 && hour < 9) timeOfDay.earlyMorning++
    else if (hour >= 9 && hour < 12) timeOfDay.morning++
    else if (hour >= 12 && hour < 17) timeOfDay.afternoon++
    else if (hour >= 17 && hour < 21) timeOfDay.evening++
    else if (hour >= 21) timeOfDay.night++
    else timeOfDay.lateNight++
  })

  // Get top locations
  const topLocations = locations
    .slice()
    .sort((a, b) => (b.visitCount * b.dwellTimeMinutes) - (a.visitCount * a.dwellTimeMinutes))
    .slice(0, 10)
    .map(loc => ({
      name: loc.name,
      coordinates: [loc.lng, loc.lat] as [number, number],
      visits: loc.visitCount,
      totalDwellTime: loc.dwellTimeMinutes,
      significance: loc.significance
    }))

  return {
    type: 'heatmap-summary',
    data: {
      title: 'Location Frequency Analysis',
      period: {
        start: locations[0]?.arrivalTime || new Date(),
        end: locations[locations.length - 1]?.departureTime || new Date()
      },
      topLocations,
      timeOfDayBreakdown: timeOfDay,
      clusters: 3,
      totalVisits: locations.length
    },
    actions: [
      {
        id: 'toggle-heatmap',
        label: 'Toggle Heatmap',
        icon: '🗺️',
        handler: async (data) => {
          const syncManager = getChatMapSyncManager()
          await syncManager.handleArtifactAction('heatmap-summary', 'toggle-heatmap', data)
        }
      }
    ]
  }
}
