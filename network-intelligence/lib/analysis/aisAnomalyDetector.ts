/**
 * AIS Anomaly Detector
 *
 * Detects maritime anomalies from AIS vessel tracks:
 * - AIS Gaps (dark vessels)
 * - Loitering behavior
 * - Ship-to-ship rendezvous
 * - Speed anomalies
 * - Course deviations
 *
 * Based on the pattern from maritime-hotspot-detector.ts
 */

import {
  VesselTrack,
  TrackPoint,
  DetectedAnomaly,
  AISGapAnomaly,
  LoiteringAnomaly,
  RendezvousAnomaly,
  SpeedAnomaly,
  CourseDeviationAnomaly,
  AnomalyType,
  AnomalySeverity,
  AnomalyDetectionConfig,
  DEFAULT_DETECTION_CONFIG,
  KATTEGAT_PORTS,
  AnomalyAnalysisResult,
  PortLocation
} from '@/lib/types/ais-anomaly'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID for anomaly
 */
function generateAnomalyId(type: AnomalyType, mmsi: string, timestamp: Date): string {
  return `${type}-${mmsi}-${timestamp.getTime()}`
}

/**
 * Calculate distance between two points (km)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calculate angular difference between two angles (degrees)
 */
function angularDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2)
  if (diff > 180) diff = 360 - diff
  return diff
}

/**
 * Check if position is near a port
 */
function isNearPort(
  lon: number,
  lat: number,
  ports: PortLocation[],
  thresholdKm: number = 5
): { near: boolean; port?: PortLocation } {
  for (const port of ports) {
    const distance = haversineDistance(lat, lon, port.coordinates[1], port.coordinates[0])
    if (distance <= port.radiusKm + thresholdKm) {
      return { near: true, port }
    }
  }
  return { near: false }
}

/**
 * Determine severity based on confidence and context
 */
function determineSeverity(
  confidence: number,
  inOpenWater: boolean,
  anomalyType: AnomalyType
): AnomalySeverity {
  // Base severity on confidence
  let severity: AnomalySeverity = 'low'

  if (confidence >= 0.9) {
    severity = 'critical'
  } else if (confidence >= 0.7) {
    severity = 'high'
  } else if (confidence >= 0.5) {
    severity = 'medium'
  }

  // Adjust for context
  if (inOpenWater && (anomalyType === 'RENDEZVOUS' || anomalyType === 'LOITERING')) {
    // More suspicious in open water
    if (severity === 'medium') severity = 'high'
    if (severity === 'high') severity = 'critical'
  }

  return severity
}

// ============================================================================
// AIS Anomaly Detector Class
// ============================================================================

export class AISAnomalyDetector {
  private config: AnomalyDetectionConfig
  private ports: PortLocation[]

  constructor(
    config: Partial<AnomalyDetectionConfig> = {},
    ports: PortLocation[] = KATTEGAT_PORTS
  ) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config }
    this.ports = ports
  }

  /**
   * Detect all anomalies in a set of vessel tracks
   */
  detectAllAnomalies(tracks: VesselTrack[]): AnomalyAnalysisResult {
    const startTime = Date.now()

    const aisGaps: AISGapAnomaly[] = []
    const loitering: LoiteringAnomaly[] = []
    const speedAnomalies: SpeedAnomaly[] = []
    const courseDeviations: CourseDeviationAnomaly[] = []

    // Single-vessel anomalies
    for (const track of tracks) {
      aisGaps.push(...this.detectAISGaps(track))
      loitering.push(...this.detectLoitering(track))
      speedAnomalies.push(...this.detectSpeedAnomalies(track))
      courseDeviations.push(...this.detectCourseDeviations(track))
    }

    // Multi-vessel anomalies
    const rendezvous = this.detectRendezvous(tracks)

    // Calculate statistics
    const allAnomalies = [
      ...aisGaps,
      ...loitering,
      ...rendezvous,
      ...speedAnomalies,
      ...courseDeviations
    ]

    const bySeverity: Record<AnomalySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    const byType: Record<AnomalyType, number> = {
      AIS_GAP: aisGaps.length,
      LOITERING: loitering.length,
      RENDEZVOUS: rendezvous.length,
      SPEED_ANOMALY: speedAnomalies.length,
      COURSE_DEVIATION: courseDeviations.length
    }

    for (const anomaly of allAnomalies) {
      bySeverity[anomaly.severity]++
    }

    // Find high-risk vessels (multiple anomalies)
    const vesselAnomalyCounts = new Map<string, number>()
    for (const anomaly of allAnomalies) {
      for (const mmsi of anomaly.affectedVessels) {
        vesselAnomalyCounts.set(mmsi, (vesselAnomalyCounts.get(mmsi) || 0) + 1)
      }
    }
    const highRiskVessels = Array.from(vesselAnomalyCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([mmsi]) => mmsi)

    // Determine time range
    let minTime: Date | null = null
    let maxTime: Date | null = null
    for (const track of tracks) {
      if (!minTime || track.startTime < minTime) minTime = track.startTime
      if (!maxTime || track.endTime > maxTime) maxTime = track.endTime
    }

    return {
      timeRange: {
        start: minTime || new Date(),
        end: maxTime || new Date()
      },
      vesselsAnalyzed: tracks.length,
      totalPositions: tracks.reduce((sum, t) => sum + t.positions.length, 0),
      anomalies: {
        aisGaps,
        loitering,
        rendezvous,
        speedAnomalies,
        courseDeviations
      },
      statistics: {
        totalAnomalies: allAnomalies.length,
        bySeverity,
        byType,
        highRiskVessels
      },
      config: this.config,
      processingTimeMs: Date.now() - startTime
    }
  }

  /**
   * Detect AIS gaps (dark vessel periods)
   */
  detectAISGaps(track: VesselTrack): AISGapAnomaly[] {
    const anomalies: AISGapAnomaly[] = []
    const { minGapMinutes, criticalGapMinutes, maxDistanceForSpoofingKm } = this.config.aisGap

    for (let i = 1; i < track.positions.length; i++) {
      const prev = track.positions[i - 1]
      const curr = track.positions[i]
      const deltaMinutes = (curr.deltaTimeSeconds || 0) / 60

      if (deltaMinutes >= minGapMinutes) {
        const distanceKm = curr.deltaDistanceKm || 0

        // Calculate expected distance at typical speed
        const typicalSpeedKnots = 12
        const expectedDistanceKm = (typicalSpeedKnots * 1.852 * deltaMinutes) / 60

        // Check for spoofing (unrealistic distance for time)
        const possibleSpoofing = distanceKm > maxDistanceForSpoofingKm ||
          distanceKm > expectedDistanceKm * 2

        // Check if near land (legitimate reason for gap)
        const nearLand = isNearPort(prev.position[0], prev.position[1], this.ports, 10).near

        // Calculate confidence
        let confidence = 0.5
        if (deltaMinutes >= criticalGapMinutes) confidence += 0.3
        if (possibleSpoofing) confidence += 0.2
        if (!nearLand) confidence += 0.1

        const severity = determineSeverity(confidence, !nearLand, 'AIS_GAP')

        anomalies.push({
          id: generateAnomalyId('AIS_GAP', track.mmsi, prev.timestamp),
          type: 'AIS_GAP',
          severity,
          confidence: Math.min(1, confidence),
          timestamp: prev.timestamp,
          startTimestamp: prev.timestamp,
          endTimestamp: curr.timestamp,
          location: {
            coordinates: prev.position,
            startCoordinates: prev.position,
            endCoordinates: curr.position
          },
          affectedVessels: [track.mmsi],
          description: `AIS transmission gap of ${Math.round(deltaMinutes)} minutes. Vessel traveled ${distanceKm.toFixed(1)} km during gap.`,
          metadata: {
            gapDurationMinutes: Math.round(deltaMinutes),
            lastKnownPosition: prev.position,
            reappearancePosition: curr.position,
            distanceTraveledKm: Math.round(distanceKm * 100) / 100,
            expectedTransmissions: Math.floor(deltaMinutes / 3),
            possibleSpoofing,
            nearLand
          }
        })
      }
    }

    return anomalies
  }

  /**
   * Detect loitering behavior
   */
  detectLoitering(track: VesselTrack): LoiteringAnomaly[] {
    const anomalies: LoiteringAnomaly[] = []
    const { minDurationMinutes, maxSpeedKnots, maxRadiusMeters, portExclusionRadiusKm } = this.config.loitering

    // Find sequences of low-speed positions
    let loiterStart: number | null = null
    let loiterPositions: TrackPoint[] = []

    for (let i = 0; i < track.positions.length; i++) {
      const point = track.positions[i]

      if (point.sog <= maxSpeedKnots) {
        if (loiterStart === null) {
          loiterStart = i
          loiterPositions = [point]
        } else {
          loiterPositions.push(point)
        }
      } else if (loiterStart !== null) {
        // End of loitering sequence
        this.evaluateLoiteringSequence(
          track,
          loiterPositions,
          anomalies,
          minDurationMinutes,
          maxRadiusMeters,
          portExclusionRadiusKm
        )
        loiterStart = null
        loiterPositions = []
      }
    }

    // Check final sequence
    if (loiterPositions.length > 0) {
      this.evaluateLoiteringSequence(
        track,
        loiterPositions,
        anomalies,
        minDurationMinutes,
        maxRadiusMeters,
        portExclusionRadiusKm
      )
    }

    return anomalies
  }

  /**
   * Evaluate a sequence of positions for loitering
   */
  private evaluateLoiteringSequence(
    track: VesselTrack,
    positions: TrackPoint[],
    anomalies: LoiteringAnomaly[],
    minDurationMinutes: number,
    maxRadiusMeters: number,
    portExclusionRadiusKm: number
  ): void {
    if (positions.length < 3) return

    const durationMinutes =
      (positions[positions.length - 1].timestamp.getTime() - positions[0].timestamp.getTime()) / 60000

    if (durationMinutes < minDurationMinutes) return

    // Calculate center and radius
    const center = this.calculateCentroid(positions)
    const radiusMeters = this.calculateMaxDistanceFromCenter(positions, center)

    if (radiusMeters > maxRadiusMeters) return

    // Check if near port/anchorage
    const portCheck = isNearPort(center[0], center[1], this.ports, portExclusionRadiusKm)
    const nearAnchorage = this.ports.some(
      p => p.type === 'anchorage' &&
        haversineDistance(center[1], center[0], p.coordinates[1], p.coordinates[0]) <= p.radiusKm
    )

    // If in port or anchorage, likely legitimate - lower confidence
    let confidence = 0.5
    if (!portCheck.near && !nearAnchorage) confidence += 0.3
    if (durationMinutes > minDurationMinutes * 2) confidence += 0.2

    // Check if near shipping lane (suspicious if blocking)
    const nearShippingLane = center[1] > 56.5 && center[1] < 57.5 && center[0] > 10.5 && center[0] < 11.5

    const avgSpeed = positions.reduce((sum, p) => sum + p.sog, 0) / positions.length

    const severity = determineSeverity(confidence, !portCheck.near && !nearAnchorage, 'LOITERING')

    anomalies.push({
      id: generateAnomalyId('LOITERING', track.mmsi, positions[0].timestamp),
      type: 'LOITERING',
      severity,
      confidence: Math.min(1, confidence),
      timestamp: positions[0].timestamp,
      startTimestamp: positions[0].timestamp,
      endTimestamp: positions[positions.length - 1].timestamp,
      location: {
        coordinates: center,
        startCoordinates: positions[0].position,
        endCoordinates: positions[positions.length - 1].position
      },
      affectedVessels: [track.mmsi],
      description: `Vessel loitered for ${Math.round(durationMinutes)} minutes in a ${Math.round(radiusMeters)}m radius area.`,
      metadata: {
        durationMinutes: Math.round(durationMinutes),
        centerPoint: center,
        radiusMeters: Math.round(radiusMeters),
        avgSpeedKnots: Math.round(avgSpeed * 100) / 100,
        positionCount: positions.length,
        nearPort: portCheck.near,
        nearAnchorage,
        nearShippingLane
      }
    })
  }

  /**
   * Calculate centroid of positions
   */
  private calculateCentroid(positions: TrackPoint[]): [number, number] {
    const sumLon = positions.reduce((sum, p) => sum + p.position[0], 0)
    const sumLat = positions.reduce((sum, p) => sum + p.position[1], 0)
    return [sumLon / positions.length, sumLat / positions.length]
  }

  /**
   * Calculate maximum distance from center
   */
  private calculateMaxDistanceFromCenter(
    positions: TrackPoint[],
    center: [number, number]
  ): number {
    let maxDist = 0
    for (const p of positions) {
      const dist = haversineDistance(center[1], center[0], p.position[1], p.position[0]) * 1000
      if (dist > maxDist) maxDist = dist
    }
    return maxDist
  }

  /**
   * Detect ship-to-ship rendezvous
   */
  detectRendezvous(tracks: VesselTrack[]): RendezvousAnomaly[] {
    const anomalies: RendezvousAnomaly[] = []
    const { maxDistanceMeters, minDurationMinutes, openWaterMinDistanceFromLandKm } = this.config.rendezvous

    // Build time-indexed positions for all vessels
    const timeIndex = new Map<number, Array<{ mmsi: string; position: TrackPoint }>>()

    for (const track of tracks) {
      for (const point of track.positions) {
        // Round to 1-minute buckets
        const timeBucket = Math.floor(point.timestamp.getTime() / 60000)

        const existing = timeIndex.get(timeBucket) || []
        existing.push({ mmsi: track.mmsi, position: point })
        timeIndex.set(timeBucket, existing)
      }
    }

    // Check each time bucket for nearby vessels
    const checkedPairs = new Set<string>()

    for (const [timeBucket, vessels] of timeIndex) {
      if (vessels.length < 2) continue

      for (let i = 0; i < vessels.length; i++) {
        for (let j = i + 1; j < vessels.length; j++) {
          const v1 = vessels[i]
          const v2 = vessels[j]
          const pairKey = [v1.mmsi, v2.mmsi].sort().join('-')

          if (checkedPairs.has(pairKey)) continue

          const distance = haversineDistance(
            v1.position.position[1],
            v1.position.position[0],
            v2.position.position[1],
            v2.position.position[0]
          ) * 1000 // Convert to meters

          if (distance <= maxDistanceMeters) {
            // Found a close approach - check duration
            const rendezvousInfo = this.analyzeRendezvous(
              v1.mmsi,
              v2.mmsi,
              tracks,
              timeBucket,
              maxDistanceMeters
            )

            if (rendezvousInfo && rendezvousInfo.durationMinutes >= minDurationMinutes) {
              checkedPairs.add(pairKey)

              // Check if in open water
              const portCheck = isNearPort(
                rendezvousInfo.meetingPoint[0],
                rendezvousInfo.meetingPoint[1],
                this.ports,
                openWaterMinDistanceFromLandKm
              )

              let confidence = 0.5
              if (!portCheck.near) confidence += 0.3
              if (rendezvousInfo.bothStopped) confidence += 0.2

              const severity = determineSeverity(confidence, !portCheck.near, 'RENDEZVOUS')

              // Get vessel names
              const track1 = tracks.find(t => t.mmsi === v1.mmsi)
              const track2 = tracks.find(t => t.mmsi === v2.mmsi)

              anomalies.push({
                id: generateAnomalyId('RENDEZVOUS', `${v1.mmsi}-${v2.mmsi}`, v1.position.timestamp),
                type: 'RENDEZVOUS',
                severity,
                confidence: Math.min(1, confidence),
                timestamp: v1.position.timestamp,
                startTimestamp: new Date(timeBucket * 60000),
                endTimestamp: new Date((timeBucket + rendezvousInfo.durationMinutes) * 60000),
                location: {
                  coordinates: rendezvousInfo.meetingPoint
                },
                affectedVessels: [v1.mmsi, v2.mmsi],
                description: `Vessels met for ${Math.round(rendezvousInfo.durationMinutes)} minutes at ${Math.round(rendezvousInfo.minDistance)}m distance.`,
                metadata: {
                  vessel1MMSI: v1.mmsi,
                  vessel2MMSI: v2.mmsi,
                  vessel1Name: track1?.vesselInfo.name,
                  vessel2Name: track2?.vesselInfo.name,
                  closestApproachMeters: Math.round(rendezvousInfo.minDistance),
                  durationMinutes: Math.round(rendezvousInfo.durationMinutes),
                  meetingLocation: rendezvousInfo.meetingPoint,
                  bothStopped: rendezvousInfo.bothStopped,
                  inOpenWater: !portCheck.near,
                  parallelCourse: false
                }
              })
            }
          }
        }
      }
    }

    return anomalies
  }

  /**
   * Analyze a potential rendezvous between two vessels
   */
  private analyzeRendezvous(
    mmsi1: string,
    mmsi2: string,
    tracks: VesselTrack[],
    startBucket: number,
    maxDistanceMeters: number
  ): {
    durationMinutes: number
    minDistance: number
    meetingPoint: [number, number]
    bothStopped: boolean
  } | null {
    const track1 = tracks.find(t => t.mmsi === mmsi1)
    const track2 = tracks.find(t => t.mmsi === mmsi2)

    if (!track1 || !track2) return null

    let durationMinutes = 0
    let minDistance = Infinity
    let meetingLon = 0
    let meetingLat = 0
    let stoppedCount = 0
    let totalCount = 0

    // Check forward in time
    for (let bucket = startBucket; bucket < startBucket + 120; bucket++) { // Max 2 hours
      const p1 = this.getPositionAtTime(track1, bucket * 60000)
      const p2 = this.getPositionAtTime(track2, bucket * 60000)

      if (!p1 || !p2) break

      const distance = haversineDistance(
        p1.position[1], p1.position[0],
        p2.position[1], p2.position[0]
      ) * 1000

      if (distance <= maxDistanceMeters) {
        durationMinutes++
        totalCount++

        if (distance < minDistance) {
          minDistance = distance
          meetingLon = (p1.position[0] + p2.position[0]) / 2
          meetingLat = (p1.position[1] + p2.position[1]) / 2
        }

        if (p1.sog < 1 && p2.sog < 1) {
          stoppedCount++
        }
      } else if (durationMinutes > 0) {
        break // End of encounter
      }
    }

    if (durationMinutes === 0) return null

    return {
      durationMinutes,
      minDistance,
      meetingPoint: [meetingLon, meetingLat],
      bothStopped: stoppedCount / totalCount > 0.5
    }
  }

  /**
   * Get interpolated position at a specific time
   */
  private getPositionAtTime(track: VesselTrack, timeMs: number): TrackPoint | null {
    for (let i = 0; i < track.positions.length - 1; i++) {
      const p1 = track.positions[i]
      const p2 = track.positions[i + 1]

      if (p1.timestamp.getTime() <= timeMs && p2.timestamp.getTime() >= timeMs) {
        // Interpolate
        const ratio = (timeMs - p1.timestamp.getTime()) /
          (p2.timestamp.getTime() - p1.timestamp.getTime())

        return {
          ...p1,
          position: [
            p1.position[0] + (p2.position[0] - p1.position[0]) * ratio,
            p1.position[1] + (p2.position[1] - p1.position[1]) * ratio
          ],
          sog: p1.sog + (p2.sog - p1.sog) * ratio
        }
      }
    }

    return null
  }

  /**
   * Detect speed anomalies
   */
  detectSpeedAnomalies(track: VesselTrack): SpeedAnomaly[] {
    const anomalies: SpeedAnomaly[] = []
    const { minDeltaKnots, minAccelerationKnotsPerMin } = this.config.speedAnomaly

    for (let i = 1; i < track.positions.length; i++) {
      const prev = track.positions[i - 1]
      const curr = track.positions[i]

      const speedDelta = Math.abs(curr.sog - prev.sog)
      const timeMinutes = (curr.deltaTimeSeconds || 1) / 60
      const acceleration = speedDelta / timeMinutes

      if (speedDelta >= minDeltaKnots && acceleration >= minAccelerationKnotsPerMin) {
        // Check context
        const portCheck = isNearPort(curr.position[0], curr.position[1], this.ports, 5)

        let confidence = 0.5
        if (!portCheck.near) confidence += 0.2
        if (speedDelta > minDeltaKnots * 2) confidence += 0.2
        if (acceleration > minAccelerationKnotsPerMin * 2) confidence += 0.1

        const severity = determineSeverity(confidence, !portCheck.near, 'SPEED_ANOMALY')

        anomalies.push({
          id: generateAnomalyId('SPEED_ANOMALY', track.mmsi, prev.timestamp),
          type: 'SPEED_ANOMALY',
          severity,
          confidence: Math.min(1, confidence),
          timestamp: prev.timestamp,
          startTimestamp: prev.timestamp,
          endTimestamp: curr.timestamp,
          location: {
            coordinates: curr.position,
            startCoordinates: prev.position,
            endCoordinates: curr.position
          },
          affectedVessels: [track.mmsi],
          description: `Speed changed by ${speedDelta.toFixed(1)} knots in ${timeMinutes.toFixed(1)} minutes (${prev.sog.toFixed(1)} → ${curr.sog.toFixed(1)} kn).`,
          metadata: {
            speedBefore: Math.round(prev.sog * 100) / 100,
            speedAfter: Math.round(curr.sog * 100) / 100,
            speedDeltaKnots: Math.round(speedDelta * 100) / 100,
            accelerationKnotsPerMin: Math.round(acceleration * 100) / 100,
            expectedSpeedRange: [8, 16], // Typical for cargo
            nearObstacle: false,
            nearPort: portCheck.near
          }
        })
      }
    }

    return anomalies
  }

  /**
   * Detect course deviations
   */
  detectCourseDeviations(track: VesselTrack): CourseDeviationAnomaly[] {
    const anomalies: CourseDeviationAnomaly[] = []
    const { minDeviationDegrees, minTimeWindowMinutes } = this.config.courseDeviation

    for (let i = 1; i < track.positions.length; i++) {
      const prev = track.positions[i - 1]
      const curr = track.positions[i]

      const courseChange = curr.courseChangeDegrees || 0
      const timeMinutes = (curr.deltaTimeSeconds || 1) / 60

      // Only flag rapid changes
      if (courseChange >= minDeviationDegrees && timeMinutes <= minTimeWindowMinutes) {
        // Check context
        const portCheck = isNearPort(curr.position[0], curr.position[1], this.ports, 5)

        // Near-port turns are usually legitimate
        if (portCheck.near) continue

        let confidence = 0.5
        if (courseChange > minDeviationDegrees * 1.5) confidence += 0.2
        if (prev.sog > 5) confidence += 0.1 // More suspicious at speed

        const severity = determineSeverity(confidence, true, 'COURSE_DEVIATION')

        anomalies.push({
          id: generateAnomalyId('COURSE_DEVIATION', track.mmsi, prev.timestamp),
          type: 'COURSE_DEVIATION',
          severity,
          confidence: Math.min(1, confidence),
          timestamp: prev.timestamp,
          startTimestamp: prev.timestamp,
          endTimestamp: curr.timestamp,
          location: {
            coordinates: curr.position,
            startCoordinates: prev.position,
            endCoordinates: curr.position
          },
          affectedVessels: [track.mmsi],
          description: `Course changed by ${Math.round(courseChange)}° in ${timeMinutes.toFixed(1)} minutes.`,
          metadata: {
            courseBefore: Math.round(prev.cog),
            courseAfter: Math.round(curr.cog),
            deviationDegrees: Math.round(courseChange),
            deviationPoint: curr.position,
            shippingLaneDeviation: false,
            possibleEvasion: courseChange > 90
          }
        })
      }
    }

    return anomalies
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AnomalyDetectionConfig>): void {
    this.config = {
      ...this.config,
      aisGap: { ...this.config.aisGap, ...config.aisGap },
      loitering: { ...this.config.loitering, ...config.loitering },
      rendezvous: { ...this.config.rendezvous, ...config.rendezvous },
      speedAnomaly: { ...this.config.speedAnomaly, ...config.speedAnomaly },
      courseDeviation: { ...this.config.courseDeviation, ...config.courseDeviation }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AnomalyDetectionConfig {
    return { ...this.config }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let detectorInstance: AISAnomalyDetector | null = null

export function getAISAnomalyDetector(
  config?: Partial<AnomalyDetectionConfig>
): AISAnomalyDetector {
  if (!detectorInstance) {
    detectorInstance = new AISAnomalyDetector(config)
  }
  return detectorInstance
}

/**
 * Reset the singleton (for testing)
 */
export function resetAISAnomalyDetector(): void {
  detectorInstance = null
}
