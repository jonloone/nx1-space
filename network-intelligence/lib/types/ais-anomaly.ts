/**
 * AIS Anomaly Detection Type Definitions
 *
 * Types for processing Kaggle AIS data and detecting maritime anomalies
 * in the Kattegat Strait region (Denmark/Sweden).
 *
 * Data source: https://www.kaggle.com/datasets/eminserkanerdonmez/ais-dataset
 */

// ============================================================================
// AIS Data Types (matching Kaggle dataset structure)
// ============================================================================

/**
 * Navigation status codes from AIS message type 1/2/3
 * Per ITU-R M.1371-5 standard
 */
export type NavigationStatus =
  | 'under_way_using_engine'
  | 'at_anchor'
  | 'not_under_command'
  | 'restricted_manoeuvrability'
  | 'constrained_by_draught'
  | 'moored'
  | 'aground'
  | 'engaged_in_fishing'
  | 'under_way_sailing'
  | 'reserved_hsc'
  | 'reserved_wig'
  | 'reserved_1'
  | 'reserved_2'
  | 'reserved_3'
  | 'ais_sart'
  | 'undefined'

/**
 * Vessel type classification
 */
export type VesselType =
  | 'cargo'
  | 'tanker'
  | 'passenger'
  | 'fishing'
  | 'tug'
  | 'pilot'
  | 'pleasure'
  | 'high_speed_craft'
  | 'military'
  | 'law_enforcement'
  | 'medical'
  | 'sar'
  | 'other'
  | 'unknown'

/**
 * AIS device class
 */
export type DeviceClass = 'A' | 'B'

/**
 * Raw AIS record from Kaggle CSV
 * Matches the dataset fields exactly
 */
export interface AISRecord {
  // Static information
  mmsi: string                    // Maritime Mobile Service Identity (9 digits)
  imo?: string                    // IMO number (7 digits)
  callSign?: string               // Radio call sign
  shipName?: string               // Vessel name
  shipType: VesselType            // Vessel classification
  deviceClass: DeviceClass        // AIS device class (A or B)
  length?: number                 // Ship length in meters
  width?: number                  // Ship width in meters
  draught?: number                // Ship draught in meters

  // GPS antenna position (for precise positioning)
  gpsType?: string                // GPS device type
  lengthToBow?: number            // Distance from GPS to bow (A)
  lengthToStern?: number          // Distance from GPS to stern (B)
  lengthToStarboard?: number      // Distance from GPS to starboard (C)
  lengthToPort?: number           // Distance from GPS to port (D)

  // Dynamic information
  timestamp: Date                 // Message timestamp (UTC)
  latitude: number                // Position latitude (-90 to 90)
  longitude: number               // Position longitude (-180 to 180)
  sog: number                     // Speed Over Ground in knots
  cog: number                     // Course Over Ground in degrees (0-360)
  heading: number                 // True heading in degrees (0-360, 511 = not available)
  rot?: number                    // Rate of Turn in degrees/minute
  navStatus: NavigationStatus     // Navigational status

  // Voyage information
  destination?: string            // Port of destination
  eta?: Date                      // Estimated time of arrival
  cargoType?: string              // Type of cargo
}

/**
 * Vessel metadata (static information)
 */
export interface VesselMetadata {
  mmsi: string
  imo?: string
  callSign?: string
  name?: string
  type: VesselType
  deviceClass: DeviceClass
  dimensions: {
    length?: number
    width?: number
    draught?: number
  }
  flag?: string                   // Derived from MMSI MID
}

/**
 * Single point in a vessel track with computed fields
 */
export interface TrackPoint {
  timestamp: Date
  position: [number, number]      // [longitude, latitude]
  sog: number                     // Speed Over Ground (knots)
  cog: number                     // Course Over Ground (degrees)
  heading: number                 // True heading (degrees)
  rot?: number                    // Rate of Turn
  navStatus: NavigationStatus

  // Computed fields (added during track reconstruction)
  deltaTimeSeconds?: number       // Seconds since previous point
  deltaDistanceKm?: number        // Distance from previous point (km)
  computedSpeedKnots?: number     // Derived speed from delta
  courseChangeDegrees?: number    // Course change from previous
  headingChangeDegrees?: number   // Heading change from previous
}

/**
 * Track quality metrics
 */
export interface TrackQuality {
  score: number                   // 0-1 quality score
  totalPoints: number             // Total AIS messages
  gapCount: number                // Number of transmission gaps
  avgUpdateIntervalSeconds: number
  maxGapSeconds: number
  completeness: number            // 0-1, ratio of expected vs actual points
}

/**
 * Complete vessel track with all positions and anomalies
 */
export interface VesselTrack {
  mmsi: string
  vesselInfo: VesselMetadata
  positions: TrackPoint[]
  anomalies: DetectedAnomaly[]
  trackQuality: TrackQuality

  // Track statistics
  startTime: Date
  endTime: Date
  totalDistanceKm: number
  avgSpeedKnots: number
  maxSpeedKnots: number
}

// ============================================================================
// Anomaly Detection Types
// ============================================================================

/**
 * Types of maritime anomalies to detect
 */
export type AnomalyType =
  | 'AIS_GAP'             // Transmission gap (potential dark vessel)
  | 'LOITERING'           // Stationary behavior outside port
  | 'RENDEZVOUS'          // Ship-to-ship meeting
  | 'SPEED_ANOMALY'       // Sudden speed change
  | 'COURSE_DEVIATION'    // Unexpected heading change

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Base anomaly interface
 */
export interface DetectedAnomaly {
  id: string
  type: AnomalyType
  severity: AnomalySeverity
  confidence: number              // 0-1 statistical confidence
  timestamp: Date                 // When the anomaly occurred
  startTimestamp: Date            // Start of anomaly period
  endTimestamp?: Date             // End of anomaly period (if applicable)
  location: {
    coordinates: [number, number] // [longitude, latitude]
    startCoordinates?: [number, number]
    endCoordinates?: [number, number]
  }
  affectedVessels: string[]       // MMSIs of vessels involved
  description: string
  metadata: Record<string, unknown>
}

/**
 * AIS Gap / Dark Vessel anomaly
 * Vessel stops transmitting for extended period
 */
export interface AISGapAnomaly extends DetectedAnomaly {
  type: 'AIS_GAP'
  metadata: {
    gapDurationMinutes: number
    lastKnownPosition: [number, number]
    reappearancePosition?: [number, number]
    distanceTraveledKm?: number
    expectedTransmissions: number
    possibleSpoofing: boolean     // Position jump indicates possible spoofing
    nearLand: boolean             // Was gap near land (possible legitimate reason)
  }
}

/**
 * Loitering anomaly
 * Vessel remains stationary outside normal anchorage areas
 */
export interface LoiteringAnomaly extends DetectedAnomaly {
  type: 'LOITERING'
  metadata: {
    durationMinutes: number
    centerPoint: [number, number]
    radiusMeters: number
    avgSpeedKnots: number
    positionCount: number
    nearPort: boolean
    nearAnchorage: boolean
    nearShippingLane: boolean
  }
}

/**
 * Rendezvous anomaly
 * Two vessels meet in close proximity
 */
export interface RendezvousAnomaly extends DetectedAnomaly {
  type: 'RENDEZVOUS'
  metadata: {
    vessel1MMSI: string
    vessel2MMSI: string
    vessel1Name?: string
    vessel2Name?: string
    closestApproachMeters: number
    durationMinutes: number
    meetingLocation: [number, number]
    bothStopped: boolean          // Both vessels < 1 knot
    inOpenWater: boolean          // Away from ports/anchorages
    parallelCourse: boolean       // Vessels traveling together
  }
}

/**
 * Speed anomaly
 * Sudden acceleration or deceleration
 */
export interface SpeedAnomaly extends DetectedAnomaly {
  type: 'SPEED_ANOMALY'
  metadata: {
    speedBefore: number           // Knots
    speedAfter: number            // Knots
    speedDeltaKnots: number       // Absolute change
    accelerationKnotsPerMin: number
    expectedSpeedRange: [number, number]
    nearObstacle: boolean
    nearPort: boolean
  }
}

/**
 * Course deviation anomaly
 * Unexpected change in vessel heading
 */
export interface CourseDeviationAnomaly extends DetectedAnomaly {
  type: 'COURSE_DEVIATION'
  metadata: {
    courseBefore: number          // Degrees
    courseAfter: number           // Degrees
    deviationDegrees: number      // Absolute change
    deviationPoint: [number, number]
    expectedCourse?: number
    shippingLaneDeviation: boolean
    possibleEvasion: boolean
  }
}

/**
 * Union type for all anomaly types
 */
export type MaritimeAnomaly =
  | AISGapAnomaly
  | LoiteringAnomaly
  | RendezvousAnomaly
  | SpeedAnomaly
  | CourseDeviationAnomaly

// ============================================================================
// Detection Configuration
// ============================================================================

/**
 * Configurable thresholds for anomaly detection
 */
export interface AnomalyDetectionConfig {
  // AIS Gap detection
  aisGap: {
    minGapMinutes: number         // Default: 30
    criticalGapMinutes: number    // Default: 120
    maxDistanceForSpoofingKm: number // Default: 100
  }

  // Loitering detection
  loitering: {
    minDurationMinutes: number    // Default: 120
    maxSpeedKnots: number         // Default: 1
    maxRadiusMeters: number       // Default: 2000
    portExclusionRadiusKm: number // Default: 5
  }

  // Rendezvous detection
  rendezvous: {
    maxDistanceMeters: number     // Default: 500
    minDurationMinutes: number    // Default: 15
    openWaterMinDistanceFromLandKm: number // Default: 10
  }

  // Speed anomaly detection
  speedAnomaly: {
    minDeltaKnots: number         // Default: 5
    minAccelerationKnotsPerMin: number // Default: 2
  }

  // Course deviation detection
  courseDeviation: {
    minDeviationDegrees: number   // Default: 30
    minTimeWindowMinutes: number  // Default: 5
  }
}

/**
 * Default detection configuration
 */
export const DEFAULT_DETECTION_CONFIG: AnomalyDetectionConfig = {
  aisGap: {
    minGapMinutes: 30,
    criticalGapMinutes: 120,
    maxDistanceForSpoofingKm: 100
  },
  loitering: {
    minDurationMinutes: 120,
    maxSpeedKnots: 1,
    maxRadiusMeters: 2000,
    portExclusionRadiusKm: 5
  },
  rendezvous: {
    maxDistanceMeters: 500,
    minDurationMinutes: 15,
    openWaterMinDistanceFromLandKm: 10
  },
  speedAnomaly: {
    minDeltaKnots: 5,
    minAccelerationKnotsPerMin: 2
  },
  courseDeviation: {
    minDeviationDegrees: 30,
    minTimeWindowMinutes: 5
  }
}

// ============================================================================
// Geographic Reference Data
// ============================================================================

/**
 * Port/anchorage location for exclusion zones
 */
export interface PortLocation {
  name: string
  coordinates: [number, number]   // [longitude, latitude]
  radiusKm: number
  type: 'port' | 'anchorage' | 'fishing_ground'
}

/**
 * Kattegat Strait ports and anchorages
 */
export const KATTEGAT_PORTS: PortLocation[] = [
  { name: 'Gothenburg', coordinates: [11.9670, 57.7089], radiusKm: 10, type: 'port' },
  { name: 'Aarhus', coordinates: [10.2134, 56.1629], radiusKm: 5, type: 'port' },
  { name: 'Frederikshavn', coordinates: [10.5364, 57.4407], radiusKm: 3, type: 'port' },
  { name: 'Aalborg', coordinates: [9.9187, 57.0488], radiusKm: 5, type: 'port' },
  { name: 'Varberg', coordinates: [12.2502, 57.1059], radiusKm: 3, type: 'port' },
  { name: 'Grenaa', coordinates: [10.8793, 56.4155], radiusKm: 3, type: 'port' },
  { name: 'Skagen', coordinates: [10.5833, 57.7167], radiusKm: 3, type: 'port' },
  // Anchorage areas
  { name: 'Gothenburg Anchorage', coordinates: [11.8500, 57.6500], radiusKm: 3, type: 'anchorage' },
  { name: 'Kattegat Central Anchorage', coordinates: [11.5000, 57.0000], radiusKm: 5, type: 'anchorage' }
]

/**
 * Kattegat Strait bounding box
 */
export const KATTEGAT_BOUNDS = {
  north: 58.0,
  south: 55.5,
  east: 13.0,
  west: 9.5,
  center: [11.25, 56.75] as [number, number]
}

// ============================================================================
// Analysis Results
// ============================================================================

/**
 * Complete anomaly analysis results
 */
export interface AnomalyAnalysisResult {
  // Data summary
  timeRange: {
    start: Date
    end: Date
  }
  vesselsAnalyzed: number
  totalPositions: number

  // Detected anomalies by type
  anomalies: {
    aisGaps: AISGapAnomaly[]
    loitering: LoiteringAnomaly[]
    rendezvous: RendezvousAnomaly[]
    speedAnomalies: SpeedAnomaly[]
    courseDeviations: CourseDeviationAnomaly[]
  }

  // Summary statistics
  statistics: {
    totalAnomalies: number
    bySeverity: Record<AnomalySeverity, number>
    byType: Record<AnomalyType, number>
    highRiskVessels: string[]     // MMSIs with multiple anomalies
  }

  // Analysis metadata
  config: AnomalyDetectionConfig
  processingTimeMs: number
}

/**
 * AI-generated anomaly explanation
 */
export interface AnomalyExplanation {
  anomalyId: string
  summary: string
  riskAssessment: {
    level: 'benign' | 'suspicious' | 'highly_suspicious' | 'critical'
    confidence: number
    reasoning: string
  }
  possibleExplanations: Array<{
    explanation: string
    probability: number
    supportingEvidence: string[]
  }>
  recommendations: string[]
  relatedAnomalies: string[]
}
