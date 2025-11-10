/**
 * Chat Artifact Type Definitions
 * Defines all artifact types for Citizens 360 investigation intelligence
 */

// ============================================================================
// Core Types
// ============================================================================

export type ArtifactType =
  | 'subject-profile'
  | 'timeline'
  | 'route'
  | 'route-analysis' // Route with full multi-INT analysis
  | 'investigation-list'
  | 'intelligence-analysis'
  | 'heatmap-summary'
  | 'network-graph'
  | 'location-details'
  | 'intelligence-alerts'
  | 'intelligence-alert' // Single alert card (inline expandable)

export interface ChatArtifact {
  type: ArtifactType
  data: any
  actions?: ArtifactAction[]
}

export interface ArtifactAction {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'outline' | 'destructive'
  handler: (data: any) => void | Promise<void>
}

// ============================================================================
// Subject Profile Artifact
// ============================================================================

export interface SubjectProfileArtifact extends ChatArtifact {
  type: 'subject-profile'
  data: SubjectProfileData
}

export interface SubjectProfileData {
  subjectId: string
  caseNumber: string
  classification: string // 'Person of Interest', 'Suspect', 'Associate - High Risk', etc.
  status: string // 'Under Surveillance', 'Monitoring', 'Active', etc.

  // Biographical Information
  name: {
    full: string
    aliases: string[]
  }

  demographics: {
    dateOfBirth: string
    age: number
    nationality: string[]
    languages: string[]
    occupation: string
    employer: string
  }

  // Identity Documents & Contact
  identifiers: {
    ssn: string
    passports: string[]
    driversLicense: string
    phoneNumbers: string[]
    emailAddresses: string[]
    socialMedia?: Record<string, string>
  }

  // Physical Description
  physical: {
    height: string
    weight: string
    build: string
    eyeColor: string
    hairColor: string
    distinctiveFeatures: string[]
  }

  // Residential Information
  addresses: {
    current: {
      address: string
      city: string
      state: string
      zip: string
      type: string
      since: string
      ownership: string
    }
    previous: Array<{
      address: string
      city: string
      state: string
      zip: string
      type: string
      duration: string
    }>
  }

  // Employment History
  employment?: {
    current: {
      employer: string
      position: string
      since: string
      salary: string
      location: string
    }
    previous: Array<{
      employer: string
      position: string
      duration: string
      location: string
    }>
  }

  // Associates & Networks
  associates: Array<{
    id: string
    name: string
    relationship: string
    riskLevel: 'low' | 'medium' | 'high'
    notes: string
  }>

  // Financial Profile
  financial?: {
    bankAccounts: Array<{
      institution: string
      type: string
      balance: string
      activity: string
    }>
    creditCards: number
    creditScore: number
    unusualActivity: string[]
  }

  // Travel History
  travel?: {
    recentTrips: Array<{
      destination: string
      dates: string
      purpose: string
      flagged: boolean
      notes?: string
    }>
    frequentDestinations: string[]
  }

  // Behavioral Patterns
  behavior: {
    routines: string[]
    deviations: string[]
    riskIndicators: string[]
  }

  // Intelligence Assessment
  intelligence: {
    threatLevel: string // 'LOW', 'MEDIUM', 'MEDIUM-HIGH', 'HIGH', 'CRITICAL'
    confidence: string // 'LOW', 'MODERATE', 'HIGH', 'VERY HIGH'
    assessmentDate: Date
    keyFindings: string[]
    recommendations: string[]
  }

  // Legal Authorization
  legalAuth: {
    warrant: string
    issuedBy: string
    issuedDate: Date
    expirationDate: Date
    scope: string
    leadInvestigator: string
  }

  // Timeline Reference
  timeline: {
    totalEvents: number
    dateRange: {
      start: Date
      end: Date
    }
    keyEvents: Array<{
      timestamp: Date
      type: string
      description: string
    }>
  }
}

// ============================================================================
// Timeline Artifact
// ============================================================================

export interface TimelineArtifact extends ChatArtifact {
  type: 'timeline'
  data: TimelineData
}

export interface TimelineData {
  title: string
  period: {
    start: Date
    end: Date
  }
  events: TimelineEvent[]
  summary?: string
}

export interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'movement' | 'communication' | 'meeting' | 'financial' | 'digital' | 'location' | 'status'
  title: string
  description: string
  location?: {
    name: string
    coordinates: [number, number]
    address?: string
  }
  significance: 'routine' | 'suspicious' | 'anomaly' | 'critical'
  confidence: 'confirmed' | 'high-confidence' | 'medium-confidence' | 'low-confidence'
  source: string
  participants?: string[]
  mediaAttached?: boolean
  relatedEvents?: string[]
}

// ============================================================================
// Route Artifact
// ============================================================================

export interface RouteArtifact extends ChatArtifact {
  type: 'route'
  data: RouteData
}

export interface RouteData {
  title: string
  path: Array<[number, number]> // [lng, lat]
  distance: number // meters
  duration: number // seconds
  mode: 'driving' | 'walking' | 'transit' | 'unknown'
  waypoints: RouteWaypoint[]
  startTime: Date
  endTime: Date
}

export interface RouteWaypoint {
  location: string
  coordinates: [number, number]
  timestamp: Date
  dwellTime?: number
  significance?: 'routine' | 'suspicious' | 'anomaly'
}

// ============================================================================
// Route Analysis Artifact (Intelligence-Grade)
// ============================================================================

export interface RouteAnalysisArtifact extends ChatArtifact {
  type: 'route-analysis'
  data: RouteAnalysisData
}

export interface RouteAnalysisData {
  // Basic route information
  title: string
  from: {
    name: string
    coordinates: [number, number]
  }
  to: {
    name: string
    coordinates: [number, number]
  }
  mode: 'driving' | 'walking' | 'cycling'
  startTime: Date

  // Route geometry and metadata
  path: Array<[number, number]> // [lng, lat]
  distance: number // meters
  duration: number // seconds

  // Analyzed waypoints with multi-INT data
  analyzedWaypoints: Array<{
    coordinates: [number, number]
    timestamp: Date
    distanceFromStart: number
    analysis: {
      // GEOINT
      geoint?: {
        buildingType?: string
        landUseZone?: string
        addressVerified: boolean
        contextualNotes: string[]
      }
      // SIGINT
      sigint?: {
        primaryTowerId: string
        operator: string
        radioType: string
        distanceMeters: number
        signalStrength: 'strong' | 'medium' | 'weak'
      }
      // OSINT
      osint?: {
        businessName?: string
        businessOwner?: string
        ownerSubjectLink?: string
        riskScore: number
        suspiciousFlags: string[]
      }
      // Temporal
      temporal: {
        timeOfDay: string
        isAnomalous: boolean
        anomalyReasons: string[]
        trafficLevel?: string
        pedestrianDensity?: string
      }
      // Overall assessment for this waypoint
      riskIndicators: string[]
      recommendedActions: string[]
      confidenceScore: number
    }
  }>

  // Anomaly detection results
  anomalyDetection: {
    hasAnomalies: boolean
    anomalyCount: number
    anomalies: Array<{
      waypointIndex: number
      location: string
      reasons: string[]
      severity: 'low' | 'medium' | 'high' | 'critical'
    }>
  }

  // Route-level risk assessment
  riskAssessment: {
    overallRiskScore: number // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    highRiskSegments: Array<{
      startIndex: number
      endIndex: number
      riskScore: number
      reason: string
    }>
    recommendedActions: string[]
  }

  // Statistics
  statistics: {
    totalDistance: number // meters
    totalDuration: number // seconds
    averageConfidence: number // 0-100
    sigintCoverage: number // percentage with cell coverage
    highRiskPercentage: number // percentage in high-risk areas
  }
}

// ============================================================================
// Investigation List Artifact
// ============================================================================

export interface InvestigationListArtifact extends ChatArtifact {
  type: 'investigation-list'
  data: InvestigationListData
}

export interface InvestigationListData {
  title: string
  items: InvestigationListItem[]
  sortBy: 'risk' | 'recent' | 'name'
  filterBy?: string[]
}

export interface InvestigationListItem {
  id: string
  subjectId: string
  name?: string
  classification: string
  riskScore: number
  status: 'active' | 'inactive'
  lastSeen: {
    location: string
    timestamp: Date
  }
  connection?: string // How they're connected to primary subject
}

// ============================================================================
// Intelligence Analysis Artifact
// ============================================================================

export interface IntelligenceAnalysisArtifact extends ChatArtifact {
  type: 'intelligence-analysis'
  data: IntelligenceAnalysisData
}

export interface IntelligenceAnalysisData {
  executiveSummary: string
  riskScore: number
  behavioralInsights: BehavioralInsight[]
  geographicIntelligence: GeographicIntelligence
  networkInference: NetworkInference
  recommendations: ActionableRecommendation[]
}

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
  clusters: GeographicCluster[]
  travelPatterns: string[]
}

export interface GeographicCluster {
  name: string
  center: [number, number]
  locations: string[]
  significance: string
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

// ============================================================================
// Heatmap Summary Artifact
// ============================================================================

export interface HeatmapSummaryArtifact extends ChatArtifact {
  type: 'heatmap-summary'
  data: HeatmapSummaryData
}

export interface HeatmapSummaryData {
  title: string
  period: {
    start: Date
    end: Date
  }
  topLocations: TopLocation[]
  timeOfDayBreakdown: TimeOfDayBreakdown
  clusters: number
  totalVisits: number
}

export interface TopLocation {
  name: string
  coordinates: [number, number]
  visits: number
  totalDwellTime: number // minutes
  significance: 'routine' | 'suspicious' | 'anomaly'
}

export interface TimeOfDayBreakdown {
  earlyMorning: number // 5-9 AM
  morning: number // 9 AM-12 PM
  afternoon: number // 12-5 PM
  evening: number // 5-9 PM
  night: number // 9 PM-12 AM
  lateNight: number // 12-5 AM
}

// ============================================================================
// Network Graph Artifact
// ============================================================================

export interface NetworkGraphArtifact extends ChatArtifact {
  type: 'network-graph'
  data: NetworkGraphData
}

export interface NetworkGraphData {
  title: string
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  centerNode: string // Subject ID
}

export interface NetworkNode {
  id: string
  label: string
  type: 'subject' | 'associate' | 'location' | 'entity'
  riskScore?: number
  properties?: Record<string, any>
}

export interface NetworkEdge {
  source: string
  target: string
  type: 'meeting' | 'communication' | 'transaction' | 'association'
  weight: number
  timestamp?: Date
  label?: string
}

// ============================================================================
// Location Details Artifact
// ============================================================================

export interface LocationDetailsArtifact extends ChatArtifact {
  type: 'location-details'
  data: LocationDetailsData
}

export interface LocationDetailsData {
  name: string
  coordinates: [number, number]
  address?: string
  type: string
  visits: number
  totalDwellTime: number
  significance: 'routine' | 'suspicious' | 'anomaly'
  properties?: Record<string, any>
}

// ============================================================================
// Intelligence Alerts Artifact
// ============================================================================

export interface IntelligenceAlertsArtifact extends ChatArtifact {
  type: 'intelligence-alerts'
  data: IntelligenceAlertsData
}

export interface IntelligenceAlertsData {
  title: string
  timestamp: Date
  alerts: IntelligenceAlert[]
  summary: string
  totalCritical: number
  totalAnomalies: number
}

export interface IntelligenceAlert {
  id: string
  timestamp: Date
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'behavioral-anomaly' | 'network-activity' | 'financial-activity' | 'location-anomaly' | 'communication-pattern' | 'threat-indicator'
  title: string
  description: string
  caseNumber: string
  caseName: string
  subjectId: string
  subjectName: string
  location?: {
    name: string
    coordinates: [number, number]
    address?: string
  }
  confidence: 'confirmed' | 'high' | 'medium' | 'low'
  actionRequired: boolean
  relatedEventId?: string
  tags: string[]
  // Multi-INT Analysis (optional, populated when alert is analyzed)
  analysis?: {
    intelligenceSummary: string
    riskIndicators: string[]
    recommendedActions: string[]
    confidenceScore: number
    // Optional detailed INT breakdowns
    geoint?: {
      buildingType?: string
      landUseZone?: string
      addressVerified: boolean
      contextualNotes: string[]
    }
    sigint?: {
      nearbyCellTowers: number
      strongestTower?: {
        operator: string
        radioType: string
        distanceMeters: number
      }
      estimatedSignalStrength?: number
    }
    osint?: {
      businessData?: {
        name: string
        owner?: string
        operatingHours?: string
        status?: 'open' | 'closed'
        ownership?: {
          owner_subject_id?: string
        }
        suspicious?: {
          risk_score: number
          flags: string[]
        }
      }
      socialMediaPresence?: {
        level: 'high' | 'medium' | 'low' | 'none'
        has_website: boolean
      }
    }
    temporal?: {
      timeOfDay: string
      dayOfWeek: string
      anomalyDetected: boolean
      anomalyReasons: string[]
      trafficLevel?: string
      pedestrianDensity?: string
    }
  }
}

// ============================================================================
// Intelligence Alert Artifact (Single Alert Card)
// ============================================================================

export interface IntelligenceAlertArtifact extends ChatArtifact {
  type: 'intelligence-alert'
  data: IntelligenceAlert
}

// ============================================================================
// Type Guards
// ============================================================================

export function isSubjectProfileArtifact(
  artifact: ChatArtifact
): artifact is SubjectProfileArtifact {
  return artifact.type === 'subject-profile'
}

export function isTimelineArtifact(artifact: ChatArtifact): artifact is TimelineArtifact {
  return artifact.type === 'timeline'
}

export function isRouteArtifact(artifact: ChatArtifact): artifact is RouteArtifact {
  return artifact.type === 'route'
}

export function isInvestigationListArtifact(
  artifact: ChatArtifact
): artifact is InvestigationListArtifact {
  return artifact.type === 'investigation-list'
}

export function isIntelligenceAnalysisArtifact(
  artifact: ChatArtifact
): artifact is IntelligenceAnalysisArtifact {
  return artifact.type === 'intelligence-analysis'
}

export function isHeatmapSummaryArtifact(
  artifact: ChatArtifact
): artifact is HeatmapSummaryArtifact {
  return artifact.type === 'heatmap-summary'
}

export function isNetworkGraphArtifact(
  artifact: ChatArtifact
): artifact is NetworkGraphArtifact {
  return artifact.type === 'network-graph'
}

export function isLocationDetailsArtifact(
  artifact: ChatArtifact
): artifact is LocationDetailsArtifact {
  return artifact.type === 'location-details'
}

export function isIntelligenceAlertsArtifact(
  artifact: ChatArtifact
): artifact is IntelligenceAlertsArtifact {
  return artifact.type === 'intelligence-alerts'
}

export function isIntelligenceAlertArtifact(
  artifact: ChatArtifact
): artifact is IntelligenceAlertArtifact {
  return artifact.type === 'intelligence-alert'
}
