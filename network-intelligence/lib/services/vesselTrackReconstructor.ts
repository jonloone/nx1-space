/**
 * Vessel Track Reconstructor Service
 *
 * Reconstructs continuous vessel tracks from discrete AIS position reports.
 * Handles track segmentation on gaps, computes derived fields, and calculates
 * track quality metrics.
 */

import {
  AISRecord,
  VesselMetadata,
  VesselTrack,
  TrackPoint,
  TrackQuality,
  DetectedAnomaly
} from '@/lib/types/ais-anomaly'
import { AISDataService, getAISDataService } from './aisDataService'

// ============================================================================
// Configuration
// ============================================================================

export interface TrackReconstructionConfig {
  /** Maximum gap in minutes before splitting into new track segment */
  maxGapMinutes: number
  /** Minimum number of points for a valid track */
  minPointsForTrack: number
  /** Expected update interval in seconds (for quality calculation) */
  expectedUpdateIntervalSeconds: number
}

const DEFAULT_CONFIG: TrackReconstructionConfig = {
  maxGapMinutes: 60,            // Split track if gap > 1 hour
  minPointsForTrack: 5,         // Need at least 5 points
  expectedUpdateIntervalSeconds: 180  // Expect updates every 3 minutes
}

// ============================================================================
// Geographic Utilities
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate bearing between two points
 * @returns Bearing in degrees (0-360)
 */
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1)
  const lat1Rad = toRadians(lat1)
  const lat2Rad = toRadians(lat2)

  const y = Math.sin(dLon) * Math.cos(lat2Rad)
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)

  let bearing = Math.atan2(y, x)
  bearing = ((bearing * 180) / Math.PI + 360) % 360

  return bearing
}

/**
 * Calculate angular difference between two bearings
 * @returns Absolute difference in degrees (0-180)
 */
function angularDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2)
  if (diff > 180) diff = 360 - diff
  return diff
}

/**
 * Convert speed from km/h to knots
 */
function kmhToKnots(kmh: number): number {
  return kmh / 1.852
}

// ============================================================================
// Track Reconstruction Service
// ============================================================================

export class VesselTrackReconstructor {
  private config: TrackReconstructionConfig
  private aisService: AISDataService

  constructor(config: Partial<TrackReconstructionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.aisService = getAISDataService()
  }

  /**
   * Reconstruct track for a single vessel
   */
  reconstructVesselTrack(mmsi: string, metadata?: VesselMetadata): VesselTrack | null {
    const records = this.aisService.getVesselRecords(mmsi)
    if (records.length < this.config.minPointsForTrack) {
      return null
    }

    // Sort by timestamp (should already be sorted, but ensure)
    const sortedRecords = [...records].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )

    // Convert to track points with computed fields
    const points = this.buildTrackPoints(sortedRecords)

    // Get or create vessel metadata
    const vesselInfo = metadata || this.aisService.getVesselMetadata(mmsi) || {
      mmsi,
      type: 'unknown' as const,
      deviceClass: 'A' as const,
      dimensions: {}
    }

    // Calculate track quality
    const quality = this.calculateTrackQuality(points)

    // Calculate track statistics
    const stats = this.calculateTrackStatistics(points)

    return {
      mmsi,
      vesselInfo,
      positions: points,
      anomalies: [], // Will be populated by anomaly detector
      trackQuality: quality,
      startTime: points[0].timestamp,
      endTime: points[points.length - 1].timestamp,
      totalDistanceKm: stats.totalDistance,
      avgSpeedKnots: stats.avgSpeed,
      maxSpeedKnots: stats.maxSpeed
    }
  }

  /**
   * Reconstruct tracks for all vessels in the dataset
   */
  reconstructAllTracks(): VesselTrack[] {
    const mmsis = this.aisService.getAllVesselMMSIs()
    const tracks: VesselTrack[] = []

    for (const mmsi of mmsis) {
      const track = this.reconstructVesselTrack(mmsi)
      if (track) {
        tracks.push(track)
      }
    }

    return tracks
  }

  /**
   * Build track points from AIS records with computed fields
   */
  private buildTrackPoints(records: AISRecord[]): TrackPoint[] {
    const points: TrackPoint[] = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const prevRecord = i > 0 ? records[i - 1] : null

      // Calculate deltas from previous point
      let deltaTimeSeconds: number | undefined
      let deltaDistanceKm: number | undefined
      let computedSpeedKnots: number | undefined
      let courseChangeDegrees: number | undefined
      let headingChangeDegrees: number | undefined

      if (prevRecord) {
        deltaTimeSeconds =
          (record.timestamp.getTime() - prevRecord.timestamp.getTime()) / 1000

        deltaDistanceKm = haversineDistance(
          prevRecord.latitude,
          prevRecord.longitude,
          record.latitude,
          record.longitude
        )

        // Compute speed from distance/time (km/h then to knots)
        if (deltaTimeSeconds > 0) {
          const speedKmh = (deltaDistanceKm / deltaTimeSeconds) * 3600
          computedSpeedKnots = kmhToKnots(speedKmh)
        }

        // Calculate course change
        courseChangeDegrees = angularDifference(prevRecord.cog, record.cog)

        // Calculate heading change
        headingChangeDegrees = angularDifference(prevRecord.heading, record.heading)
      }

      points.push({
        timestamp: record.timestamp,
        position: [record.longitude, record.latitude],
        sog: record.sog,
        cog: record.cog,
        heading: record.heading,
        rot: record.rot,
        navStatus: record.navStatus,
        deltaTimeSeconds,
        deltaDistanceKm,
        computedSpeedKnots,
        courseChangeDegrees,
        headingChangeDegrees
      })
    }

    return points
  }

  /**
   * Calculate track quality metrics
   */
  private calculateTrackQuality(points: TrackPoint[]): TrackQuality {
    if (points.length < 2) {
      return {
        score: 0,
        totalPoints: points.length,
        gapCount: 0,
        avgUpdateIntervalSeconds: 0,
        maxGapSeconds: 0,
        completeness: 0
      }
    }

    // Calculate update intervals
    const intervals: number[] = []
    let gapCount = 0
    let maxGap = 0

    for (let i = 1; i < points.length; i++) {
      const delta = points[i].deltaTimeSeconds || 0
      intervals.push(delta)

      if (delta > this.config.maxGapMinutes * 60) {
        gapCount++
      }
      if (delta > maxGap) {
        maxGap = delta
      }
    }

    const avgInterval =
      intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : 0

    // Calculate completeness (ratio of expected vs actual points)
    const trackDuration =
      (points[points.length - 1].timestamp.getTime() -
        points[0].timestamp.getTime()) /
      1000
    const expectedPoints =
      trackDuration / this.config.expectedUpdateIntervalSeconds
    const completeness = Math.min(1, points.length / Math.max(1, expectedPoints))

    // Calculate overall quality score
    // Factors: completeness, gap count, avg interval consistency
    const intervalConsistency = Math.max(
      0,
      1 - Math.abs(avgInterval - this.config.expectedUpdateIntervalSeconds) / 600
    )
    const gapPenalty = Math.max(0, 1 - gapCount * 0.1)

    const score = (completeness * 0.4 + intervalConsistency * 0.3 + gapPenalty * 0.3)

    return {
      score: Math.round(score * 100) / 100,
      totalPoints: points.length,
      gapCount,
      avgUpdateIntervalSeconds: Math.round(avgInterval),
      maxGapSeconds: maxGap,
      completeness: Math.round(completeness * 100) / 100
    }
  }

  /**
   * Calculate track statistics
   */
  private calculateTrackStatistics(points: TrackPoint[]): {
    totalDistance: number
    avgSpeed: number
    maxSpeed: number
  } {
    let totalDistance = 0
    let totalSpeed = 0
    let maxSpeed = 0

    for (const point of points) {
      if (point.deltaDistanceKm) {
        totalDistance += point.deltaDistanceKm
      }
      totalSpeed += point.sog
      if (point.sog > maxSpeed) {
        maxSpeed = point.sog
      }
    }

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      avgSpeed: Math.round((totalSpeed / points.length) * 100) / 100,
      maxSpeed: Math.round(maxSpeed * 100) / 100
    }
  }

  /**
   * Segment a track into continuous segments based on time gaps
   */
  segmentTrack(points: TrackPoint[]): TrackPoint[][] {
    const segments: TrackPoint[][] = []
    let currentSegment: TrackPoint[] = []

    for (const point of points) {
      if (
        currentSegment.length > 0 &&
        point.deltaTimeSeconds &&
        point.deltaTimeSeconds > this.config.maxGapMinutes * 60
      ) {
        // Gap detected, start new segment
        if (currentSegment.length >= this.config.minPointsForTrack) {
          segments.push(currentSegment)
        }
        currentSegment = []
      }
      currentSegment.push(point)
    }

    // Add final segment
    if (currentSegment.length >= this.config.minPointsForTrack) {
      segments.push(currentSegment)
    }

    return segments
  }

  /**
   * Find time gaps in a track
   */
  findTrackGaps(
    points: TrackPoint[],
    minGapMinutes: number = 30
  ): Array<{
    startIndex: number
    endIndex: number
    startTime: Date
    endTime: Date
    durationMinutes: number
    startPosition: [number, number]
    endPosition: [number, number]
    distanceKm: number
  }> {
    const gaps: Array<{
      startIndex: number
      endIndex: number
      startTime: Date
      endTime: Date
      durationMinutes: number
      startPosition: [number, number]
      endPosition: [number, number]
      distanceKm: number
    }> = []

    for (let i = 1; i < points.length; i++) {
      const deltaSeconds = points[i].deltaTimeSeconds || 0
      const deltaMinutes = deltaSeconds / 60

      if (deltaMinutes >= minGapMinutes) {
        const distanceKm = points[i].deltaDistanceKm || 0

        gaps.push({
          startIndex: i - 1,
          endIndex: i,
          startTime: points[i - 1].timestamp,
          endTime: points[i].timestamp,
          durationMinutes: Math.round(deltaMinutes),
          startPosition: points[i - 1].position,
          endPosition: points[i].position,
          distanceKm: Math.round(distanceKm * 100) / 100
        })
      }
    }

    return gaps
  }

  /**
   * Calculate the bounding box of a track
   */
  getTrackBounds(points: TrackPoint[]): {
    north: number
    south: number
    east: number
    west: number
  } {
    let north = -90
    let south = 90
    let east = -180
    let west = 180

    for (const point of points) {
      const [lon, lat] = point.position
      if (lat > north) north = lat
      if (lat < south) south = lat
      if (lon > east) east = lon
      if (lon < west) west = lon
    }

    return { north, south, east, west }
  }

  /**
   * Get configuration
   */
  getConfig(): TrackReconstructionConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TrackReconstructionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let trackReconstructorInstance: VesselTrackReconstructor | null = null

export function getTrackReconstructor(
  config?: Partial<TrackReconstructionConfig>
): VesselTrackReconstructor {
  if (!trackReconstructorInstance) {
    trackReconstructorInstance = new VesselTrackReconstructor(config)
  }
  return trackReconstructorInstance
}

/**
 * Reset the singleton (for testing)
 */
export function resetTrackReconstructor(): void {
  trackReconstructorInstance = null
}
