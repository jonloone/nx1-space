/**
 * Maritime Domain Type Definitions
 * For DoD Intelligence Demo
 */

// Vessel position with timestamp
export interface Position {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// Suspicious behavior types
export type SuspiciousBehavior = 
  | 'AIS_GAP'           // AIS transmission gap > 12 hours
  | 'LOITERING'         // Low speed near area of interest
  | 'DARK_VESSEL'       // No AIS transmission
  | 'SURVEILLANCE'      // Parallel tracking pattern
  | 'RENDEZVOUS'        // Close approach to another vessel
  | 'CLUSTERING'        // Part of vessel cluster
  | 'DRIFT'            // Drifting with engines off
  | 'ZIGZAG'           // Evasive maneuvering

// Main vessel data structure
export interface VesselData {
  id: string;
  imo: string;                    // International Maritime Organization number
  mmsi: string;                   // Maritime Mobile Service Identity
  name: string;
  flag: string;                   // Flag state
  vesselType: string;             // Cargo, Tanker, Fishing, etc.
  length: number;                 // Meters
  width: number;                  // Meters
  draught: number;                // Meters
  position: Position;
  speed: number;                  // Knots
  heading: number;                // Degrees (0-360)
  course: number;                 // Course over ground
  destination?: string;           // Port name
  eta?: Date;                     // Estimated time of arrival
  lastAisTime: Date;              // Last AIS transmission
  riskScore: number;              // 0-100
  behaviors: string[];            // List of suspicious behaviors
  navStatus?: string;             // Navigation status
  cargoType?: string;             // Type of cargo
}

// Vessel track point for historical data
export interface VesselTrack {
  vesselId: string;
  position: Position;
  speed: number;
  heading: number;
  course: number;
  navStatus?: string;
}

// Vessel cluster for group analysis
export interface VesselCluster {
  id: string;
  vessels: string[];              // Vessel IDs in cluster
  center: Position;
  radius: number;                 // Meters
  vesselCount: number;
  riskScore: number;
  type: 'SUSPICIOUS_GATHERING' | 'FISHING_FLEET' | 'CONVOY' | 'NAVAL_FORMATION';
  confidence?: number;            // Detection confidence 0-1
}

// AIS gap detection result
export interface AisGap {
  vesselId: string;
  startTime: Date;
  endTime: Date;
  duration: number;               // Hours
  startPosition: Position;
  endPosition?: Position;
  distance?: number;              // Nautical miles between positions
  riskScore: number;
}

// Pattern detection result
export interface PatternDetection {
  id: string;
  type: 'LOITERING' | 'SURVEILLANCE' | 'RENDEZVOUS' | 'DRIFT' | 'ZIGZAG';
  vesselIds: string[];
  startTime: Date;
  endTime?: Date;
  location: Position;
  confidence: number;             // 0-1
  description: string;
}

// Area selection for analysis
export interface AreaSelection {
  id: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  polygon?: [number, number][];   // Optional polygon points
  createdAt: Date;
}

// Area statistics
export interface AreaStatistics {
  totalVessels: number;
  byFlag: Record<string, number>;
  byType: Record<string, number>;
  suspiciousCount: number;
  darkVessels: number;
  averageRiskScore: number;
  behaviors: Record<string, number>;
  densityHeatmap?: HeatmapPoint[];
}

// Heatmap point for density visualization
export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

// Risk assessment for vessel or area
export interface RiskAssessment {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;                  // 0-100
  factors: RiskFactor[];
  recommendation: string;
  confidence: number;              // 0-1
}

// Individual risk factor
export interface RiskFactor {
  type: string;
  weight: number;                 // Contribution to overall risk
  description: string;
  evidence?: string[];
}

// Intelligence alert
export interface IntelligenceAlert {
  id: string;
  type: 'VESSEL' | 'AREA' | 'PATTERN' | 'ANOMALY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  vesselIds?: string[];
  location?: Position;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired?: string;
}

// Maritime dataset metadata
export interface MaritimeDataset {
  vessels: VesselData[];
  tracks: Map<string, VesselTrack[]>;
  clusters: VesselCluster[];
  metadata: {
    totalVessels: number;
    suspiciousVessels: number;
    darkVessels: number;
    clusterCount: number;
    generatedAt: Date;
    region: string;
    classification: string;
  };
}

// Export format options
export interface ExportOptions {
  format: 'CSV' | 'JSON' | 'KML' | 'GEOJSON';
  includeHistory: boolean;
  includePredictions: boolean;
  classification: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Map layer visibility settings
export interface MaritimeLayerSettings {
  vessels: boolean;
  tracks: boolean;
  clusters: boolean;
  heatmap: boolean;
  riskZones: boolean;
  aisGaps: boolean;
  alerts: boolean;
}

// Vessel filter criteria
export interface VesselFilter {
  flags?: string[];
  types?: string[];
  minRiskScore?: number;
  maxRiskScore?: number;
  behaviors?: string[];
  speedRange?: [number, number];
  lastSeenHours?: number;
}

// Demo scenario configuration
export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  duration: number;               // Minutes
  steps: ScenarioStep[];
  initialView: {
    center: [number, number];
    zoom: number;
  };
}

// Individual step in demo scenario
export interface ScenarioStep {
  id: string;
  title: string;
  description: string;
  action: 'PAN' | 'ZOOM' | 'SELECT' | 'FILTER' | 'ANALYZE' | 'ALERT';
  target?: {
    vesselId?: string;
    area?: AreaSelection;
    position?: [number, number];
  };
  duration: number;               // Seconds
  narration?: string;
}

// Classification banner configuration
export interface ClassificationConfig {
  level: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP SECRET';
  caveat?: string;
  backgroundColor: string;
  textColor: string;
  position: 'top' | 'bottom';
}

// Enhanced Timeline Types for Maritime Intelligence Platform
export interface TimelineRange {
  start: Date;
  end: Date;
}

export interface ActivityHeatmapData {
  timestamp: number;
  vesselCount: number;
  encounterCount: number;
  intensity: number; // 0-1 scale for visualization
  riskLevel: number; // aggregated risk score
  geographicCenter?: [number, number];
}

export interface VesselEncounter {
  id: string;
  timestamp: number;
  vesselIds: string[];
  type: 'sts_transfer' | 'rendezvous' | 'close_approach' | 'formation' | 'collision_risk';
  location: [number, number];
  distance: number; // meters
  duration: number; // milliseconds
  confidence: number; // 0-1 scale
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    transferVolume?: number;
    cargoType?: string;
    suspiciousActivity?: boolean;
    weatherConditions?: string;
    seaState?: string;
    estimatedCost?: number;
    regulatoryZone?: string;
  };
}

export interface TemporalVesselData extends VesselData {
  timestamp: number;
  trackHistory?: Array<{
    position: [number, number];
    timestamp: number;
    speed?: number;
    heading?: number;
    riskScore?: number;
  }>;
  path?: [number, number][];
  pathTimestamps?: number[];
}

export interface TimelinePlaybackState {
  isPlaying: boolean;
  speed: number;
  currentTime: number;
  totalDuration: number;
  loop: boolean;
}

export interface TimelineMarker {
  id: string;
  timestamp: number;
  type: 'event' | 'milestone' | 'alert' | 'note' | 'encounter';
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  vesselIds?: string[];
}

export interface DemoNarrative extends DemoScenario {
  timeRange: TimelineRange;
  keyEvents: Array<{
    timestamp: number;
    type: 'vessel_departure' | 'encounter' | 'ais_gap' | 'port_arrival' | 'suspicious_activity';
    title: string;
    description: string;
    location: [number, number];
    involvedVessels: string[];
    significance: 'low' | 'medium' | 'high' | 'critical';
  }>;
  narrativeSegments: Array<{
    id: string;
    timestamp: number;
    title: string;
    content: string;
    mediaType?: 'text' | 'chart' | 'map_view' | 'vessel_detail';
    duration?: number;
    autoAdvance?: boolean;
  }>;
  focusVessels: string[];
}

export interface VesselTrip {
  id: string;
  vesselId: string;
  path: [number, number][];
  timestamps: number[];
  speeds?: number[];
  headings?: number[];
  riskScores?: number[];
  encounters?: VesselEncounter[];
}

export interface EncounterAnalytics {
  totalEncounters: number;
  stsTransfers: number;
  rendezvous: number;
  suspiciousActivities: number;
  averageDistance: number;
  averageDuration: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  geographicHotspots: Array<{
    location: [number, number];
    encounterCount: number;
    avgRiskScore: number;
  }>;
}