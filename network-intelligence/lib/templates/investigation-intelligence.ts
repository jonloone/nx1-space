/**
 * Investigation Intelligence Template
 *
 * Pattern-of-Life analysis for authorized law enforcement investigations
 * - Subject tracking and movement analysis
 * - Location identification and dwell time analysis
 * - Frequency heatmaps for pattern detection
 * - Temporal analysis and anomaly detection
 *
 * ⚠️ LEGAL DISCLAIMER:
 * For authorized law enforcement use only.
 * Requires proper legal authorization (warrant/court order).
 * Complies with applicable privacy laws and regulations.
 */

import type { TemplateConfig } from '@/lib/models/Template'
import { createBaseTemplate } from '@/lib/models/Template'

export const investigationIntelligenceTemplate: TemplateConfig = createBaseTemplate(
  'investigation-intelligence',
  'Investigation Intelligence',
  'law-enforcement',
  {
    description: 'Pattern-of-life analysis for authorized investigations',
    icon: '🔍',

    supportedEntityTypes: ['person-of-interest', 'location', 'route', 'associate'],

    defaultEntityProperties: {
      subjectId: '',
      caseNumber: '',
      classification: 'person-of-interest',
      investigation: '',
      legalAuthorization: '',
      startDate: null,
      endDate: null,
      riskLevel: 'medium'
    },

    dataSources: [
      {
        id: 'tracking-data',
        name: 'Subject Tracking Data',
        type: 'stream',
        refreshInterval: 5000 // 5 seconds for real-time
      },
      {
        id: 'location-intelligence',
        name: 'Location Intelligence',
        type: 'database'
      },
      {
        id: 'associates-network',
        name: 'Associates Network',
        type: 'api',
        endpoint: '/api/investigation/associates'
      },
      {
        id: 'eo-imagery',
        name: 'Earth Observation Imagery',
        type: 'api',
        endpoint: '/api/satellite/imagery'
      },
      {
        id: 'camera-footage',
        name: 'CCTV Footage Metadata',
        type: 'database'
      }
    ],

    defaultLayers: [
      {
        id: 'movement-path',
        name: 'Movement Path',
        type: 'PathLayer' as any,
        visible: true,
        opacity: 0.9,
        color: '#ef4444' // Red for tracked subject
      },
      {
        id: 'location-markers',
        name: 'Location Stops',
        type: 'ScatterplotLayer' as any,
        visible: true,
        opacity: 1.0,
        color: '#f59e0b' // Orange for stops
      },
      {
        id: 'frequency-heatmap',
        name: 'Frequency Heatmap',
        type: 'HeatmapLayer' as any,
        visible: false,
        opacity: 0.7,
        color: '#dc2626' // Red for hotspots
      },
      {
        id: 'associates',
        name: 'Associates Network',
        type: 'ScatterplotLayer' as any,
        visible: false,
        opacity: 0.8,
        color: '#8b5cf6' // Purple for associates
      },
      {
        id: 'buildings-context',
        name: 'Building Context',
        type: 'FillExtrusionLayer' as any,
        visible: true,
        opacity: 0.6,
        color: '#6b7280' // Gray for context
      }
    ],

    ui: {
      projectName: 'Investigation Intelligence',
      showTimeline: true,
      showAlerts: true,
      defaultViewport: {
        longitude: -73.9851, // NYC - Times Square
        latitude: 40.7589,
        zoom: 12,
        pitch: 45,
        bearing: 0
      }
    },

    features: {
      realTimeTracking: true,
      historicalPlayback: true,
      routeOptimization: false,
      geofencing: true,
      alerts: true,
      analytics: true
    }
  }
)

/**
 * Subject classification types
 */
export const subjectClassifications = [
  {
    id: 'person-of-interest',
    name: 'Person of Interest',
    color: '#f59e0b', // Orange
    icon: '👤',
    description: 'Individual under investigation'
  },
  {
    id: 'suspect',
    name: 'Suspect',
    color: '#ef4444', // Red
    icon: '🔴',
    description: 'Primary suspect in investigation'
  },
  {
    id: 'associate',
    name: 'Associate',
    color: '#8b5cf6', // Purple
    icon: '🟣',
    description: 'Known associate or contact'
  },
  {
    id: 'witness',
    name: 'Witness',
    color: '#3b82f6', // Blue
    icon: '🔵',
    description: 'Witness to events'
  }
]

/**
 * Location significance levels
 */
export const locationSignificance = {
  routine: {
    color: '#10b981', // Green
    label: 'Routine',
    icon: '🟢',
    description: 'Expected, regular pattern'
  },
  suspicious: {
    color: '#f59e0b', // Orange
    label: 'Suspicious',
    icon: '🟠',
    description: 'Unusual but not critical'
  },
  anomaly: {
    color: '#ef4444', // Red
    label: 'Anomaly',
    icon: '🔴',
    description: 'Critical anomaly requiring attention'
  }
}

/**
 * Alert types for investigation intelligence
 */
export const investigationAlertTypes = [
  {
    id: 'new-location',
    name: 'New Location Visited',
    severity: 'medium' as const,
    color: '#f59e0b'
  },
  {
    id: 'pattern-break',
    name: 'Pattern Deviation',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'associate-meeting',
    name: 'Associate Meeting',
    severity: 'high' as const,
    color: '#dc2626'
  },
  {
    id: 'late-night-activity',
    name: 'Unusual Time Activity',
    severity: 'high' as const,
    color: '#ef4444'
  },
  {
    id: 'restricted-area',
    name: 'Restricted Area Entry',
    severity: 'critical' as const,
    color: '#dc2626'
  },
  {
    id: 'signal-loss',
    name: 'Tracking Signal Lost',
    severity: 'high' as const,
    color: '#f59e0b'
  },
  {
    id: 'transport-hub',
    name: 'Transportation Hub Visit',
    severity: 'medium' as const,
    color: '#f59e0b'
  }
]

/**
 * Transport modes for route analysis
 */
export const transportModes = [
  { id: 'walking', name: 'Walking', icon: '🚶', avgSpeed: 5 }, // km/h
  { id: 'driving', name: 'Driving', icon: '🚗', avgSpeed: 30 },
  { id: 'transit', name: 'Public Transit', icon: '🚇', avgSpeed: 25 },
  { id: 'unknown', name: 'Unknown', icon: '❓', avgSpeed: 15 }
]

/**
 * Time of day categories for pattern analysis
 */
export const timeOfDayCategories = {
  earlyMorning: { start: 5, end: 9, label: 'Early Morning', icon: '🌅' },
  morning: { start: 9, end: 12, label: 'Morning', icon: '☀️' },
  afternoon: { start: 12, end: 17, label: 'Afternoon', icon: '🌤️' },
  evening: { start: 17, end: 21, label: 'Evening', icon: '🌆' },
  night: { start: 21, end: 24, label: 'Night', icon: '🌙' },
  lateNight: { start: 0, end: 5, label: 'Late Night', icon: '🌃' }
}

/**
 * Location types for intelligence analysis
 */
export const locationTypes = [
  { id: 'residence', name: 'Residence', icon: '🏠', significance: 'high' },
  { id: 'workplace', name: 'Workplace', icon: '🏢', significance: 'medium' },
  { id: 'commercial', name: 'Commercial', icon: '🏪', significance: 'low' },
  { id: 'meeting', name: 'Meeting Point', icon: '🤝', significance: 'high' },
  { id: 'transport', name: 'Transportation', icon: '✈️', significance: 'medium' },
  { id: 'unknown', name: 'Unknown', icon: '❓', significance: 'high' }
]
