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
  | 'investigation-list'
  | 'intelligence-analysis'
  | 'heatmap-summary'
  | 'network-graph'
  | 'location-details'

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
  classification: 'person-of-interest' | 'suspect' | 'associate' | 'witness'
  riskScore: number // 0-100
  status: 'active' | 'inactive' | 'archived'
  investigation: string
  period: {
    start: Date
    end: Date
  }
  stats: {
    totalLocations: number
    anomalies: number
    suspicious: number
    routine: number
    estimatedAssociates: number
  }
  lastSeen?: {
    location: string
    coordinates: [number, number]
    timestamp: Date
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
  location: {
    name: string
    coordinates: [number, number]
  }
  type: 'arrival' | 'departure' | 'stop' | 'meeting' | 'alert'
  significance: 'routine' | 'suspicious' | 'anomaly'
  dwellTime?: number // minutes
  notes?: string
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
