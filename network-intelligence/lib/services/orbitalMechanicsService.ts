/**
 * Orbital Mechanics Service
 * Uses satellite.js for SGP4/SDP4 orbit propagation
 *
 * Provides:
 * - Satellite position calculation (ECI → Geodetic)
 * - Ground track generation
 * - Pass predictions
 * - Visibility calculations
 */

import * as satellite from 'satellite.js'
import type { TLE } from './tleDataService'

export interface SatellitePosition {
  /** Latitude in degrees (-90 to 90) */
  latitude: number
  /** Longitude in degrees (-180 to 180) */
  longitude: number
  /** Altitude in kilometers above sea level */
  altitude: number
  /** Timestamp */
  time: Date
}

export interface SatelliteVelocity {
  /** Velocity in km/s */
  speed: number
  /** Velocity vector in ECI frame (km/s) */
  x: number
  y: number
  z: number
}

export interface SatelliteState {
  position: SatellitePosition
  velocity: SatelliteVelocity
}

export interface GroundTrackPoint extends SatellitePosition {
  /** Footprint radius in km (visibility circle) */
  footprintRadius?: number
}

export interface PassPrediction {
  /** Satellite name */
  satelliteName: string
  /** Rise time (when satellite appears above horizon) */
  riseTime: Date
  /** Rise azimuth in degrees */
  riseAzimuth: number
  /** Time of maximum elevation */
  maxTime: Date
  /** Maximum elevation in degrees */
  maxElevation: number
  /** Azimuth at maximum elevation */
  maxAzimuth: number
  /** Set time (when satellite disappears below horizon) */
  setTime: Date
  /** Set azimuth in degrees */
  setAzimuth: number
  /** Pass duration in minutes */
  duration: number
  /** Is satellite illuminated by sun? */
  visible: boolean
}

export interface ObserverLocation {
  latitude: number
  longitude: number
  altitude?: number // meters above sea level (default 0)
}

export class OrbitalMechanicsService {
  /**
   * Calculate satellite position at a specific time
   */
  getSatellitePosition(tle: TLE, date: Date = new Date()): SatelliteState | null {
    try {
      // Validate TLE data
      if (!tle.line1 || !tle.line2) {
        console.error(`❌ Invalid TLE data for ${tle.name}: Missing line1 or line2`)
        return null
      }

      if (typeof tle.line1 !== 'string' || typeof tle.line2 !== 'string') {
        console.error(`❌ Invalid TLE data for ${tle.name}: line1 and line2 must be strings`)
        return null
      }

      // Initialize satellite record from TLE
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2)

      if (satrec.error !== 0) {
        console.error(`❌ TLE initialization error for ${tle.name}: ${satrec.error}`)
        return null
      }

      // Propagate to the specified time
      const positionAndVelocity = satellite.propagate(satrec, date)

      // Check if position is valid
      if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
        return null
      }

      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>
      const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>

      // Convert ECI to Geodetic (lat/lon/alt)
      const gmst = satellite.gstime(date)
      const positionGd = satellite.eciToGeodetic(positionEci, gmst)

      return {
        position: {
          latitude: satellite.degreesLat(positionGd.latitude),
          longitude: satellite.degreesLong(positionGd.longitude),
          altitude: positionGd.height, // km
          time: date
        },
        velocity: {
          speed: Math.sqrt(
            velocityEci.x * velocityEci.x +
            velocityEci.y * velocityEci.y +
            velocityEci.z * velocityEci.z
          ),
          x: velocityEci.x,
          y: velocityEci.y,
          z: velocityEci.z
        }
      }
    } catch (error) {
      console.error('❌ Failed to calculate satellite position:', error)
      return null
    }
  }

  /**
   * Generate ground track (orbit path on Earth surface)
   *
   * @param tle TLE data
   * @param startDate Start time for ground track
   * @param durationMinutes How many minutes of orbit to generate
   * @param stepSeconds Time step between points (default: 60 seconds)
   */
  getGroundTrack(
    tle: TLE,
    startDate: Date = new Date(),
    durationMinutes: number = 100,
    stepSeconds: number = 60
  ): GroundTrackPoint[] {
    const points: GroundTrackPoint[] = []
    const steps = Math.floor((durationMinutes * 60) / stepSeconds)

    for (let i = 0; i <= steps; i++) {
      const time = new Date(startDate.getTime() + i * stepSeconds * 1000)
      const state = this.getSatellitePosition(tle, time)

      if (state) {
        points.push({
          ...state.position,
          footprintRadius: this.calculateFootprintRadius(state.position.altitude)
        })
      }
    }

    return points
  }

  /**
   * Calculate footprint radius (visibility circle) based on altitude
   * Formula: R = sqrt(h^2 + 2*h*R_earth) where R_earth = 6371 km
   */
  private calculateFootprintRadius(altitudeKm: number): number {
    const R_EARTH = 6371 // km
    return Math.sqrt(altitudeKm * altitudeKm + 2 * altitudeKm * R_EARTH)
  }

  /**
   * Calculate look angles (azimuth and elevation) from observer to satellite
   */
  getLookAngles(
    tle: TLE,
    observer: ObserverLocation,
    date: Date = new Date()
  ): { azimuth: number; elevation: number; range: number } | null {
    try {
      // Initialize satellite
      const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
      const positionAndVelocity = satellite.propagate(satrec, date)

      if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
        return null
      }

      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>

      // Observer location in ECF (Earth-Centered Fixed)
      const observerGd = {
        latitude: satellite.degreesToRadians(observer.latitude),
        longitude: satellite.degreesToRadians(observer.longitude),
        height: (observer.altitude || 0) / 1000 // Convert meters to km
      }

      // Calculate GMST for ECI to ECF conversion
      const gmst = satellite.gstime(date)

      // Convert ECI position to ECF
      const positionEcf = satellite.eciToEcf(positionEci, gmst)

      // Calculate look angles
      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf)

      return {
        azimuth: satellite.degreesLong(lookAngles.azimuth),
        elevation: satellite.degreesLat(lookAngles.elevation),
        range: lookAngles.rangeSat // km
      }
    } catch (error) {
      console.error('❌ Failed to calculate look angles:', error)
      return null
    }
  }

  /**
   * Check if satellite is visible from observer location
   */
  isVisible(
    tle: TLE,
    observer: ObserverLocation,
    date: Date = new Date(),
    minElevation: number = 0 // degrees above horizon
  ): boolean {
    const lookAngles = this.getLookAngles(tle, observer, date)
    return lookAngles !== null && lookAngles.elevation >= minElevation
  }

  /**
   * Predict next pass over observer location
   *
   * @param tle TLE data
   * @param observer Observer location
   * @param startTime When to start looking for passes (default: now)
   * @param maxDays How many days ahead to search (default: 7)
   */
  async predictNextPass(
    tle: TLE,
    observer: ObserverLocation,
    startTime: Date = new Date(),
    maxDays: number = 7
  ): Promise<PassPrediction | null> {
    const stepMinutes = 1 // Check every minute
    const maxSteps = maxDays * 24 * 60

    let wasVisible = false
    let riseTime: Date | null = null
    let riseAzimuth: number = 0
    let maxElevation: number = 0
    let maxTime: Date | null = null
    let maxAzimuth: number = 0

    for (let i = 0; i < maxSteps; i++) {
      const time = new Date(startTime.getTime() + i * stepMinutes * 60 * 1000)
      const lookAngles = this.getLookAngles(tle, observer, time)

      if (!lookAngles) continue

      const isCurrentlyVisible = lookAngles.elevation > 0

      // Rising
      if (isCurrentlyVisible && !wasVisible) {
        riseTime = time
        riseAzimuth = lookAngles.azimuth
        maxElevation = lookAngles.elevation
        maxTime = time
        maxAzimuth = lookAngles.azimuth
      }

      // During pass - track maximum elevation
      if (isCurrentlyVisible && lookAngles.elevation > maxElevation) {
        maxElevation = lookAngles.elevation
        maxTime = time
        maxAzimuth = lookAngles.azimuth
      }

      // Setting
      if (!isCurrentlyVisible && wasVisible && riseTime && maxTime) {
        const setTime = time
        const setAzimuth = lookAngles.azimuth
        const duration = (setTime.getTime() - riseTime.getTime()) / (1000 * 60)

        // Check if satellite is illuminated by sun
        const visible = this.isSatelliteIlluminated(tle, maxTime)

        return {
          satelliteName: tle.name,
          riseTime,
          riseAzimuth,
          maxTime,
          maxElevation,
          maxAzimuth,
          setTime,
          setAzimuth,
          duration,
          visible
        }
      }

      wasVisible = isCurrentlyVisible
    }

    return null // No pass found
  }

  /**
   * Check if satellite is illuminated by sun (visible pass)
   * Simplified check - just checks if satellite is in sunlight
   */
  private isSatelliteIlluminated(tle: TLE, date: Date): boolean {
    const state = this.getSatellitePosition(tle, date)
    if (!state) return false

    // Simple heuristic: If altitude > 400km and not in Earth's shadow, likely illuminated
    // More accurate calculation would check sun angle and Earth's shadow cone
    return state.position.altitude > 400
  }

  /**
   * Calculate orbital period in minutes
   */
  getOrbitalPeriod(tle: TLE): number {
    // Mean motion is in revolutions per day
    return (24 * 60) / tle.meanMotion
  }

  /**
   * Calculate apogee and perigee
   */
  getOrbitalElements(tle: TLE): {
    period: number // minutes
    apogee: number // km
    perigee: number // km
    inclination: number // degrees
    eccentricity: number
    semiMajorAxis: number // km
  } {
    const R_EARTH = 6371 // km
    const MU = 398600.4418 // Earth's gravitational parameter (km^3/s^2)

    // Calculate semi-major axis from mean motion
    const n = tle.meanMotion * (2 * Math.PI / 86400) // Convert to rad/s
    const a = Math.pow(MU / (n * n), 1/3) // Semi-major axis

    const e = tle.eccentricity
    const apogee = a * (1 + e) - R_EARTH
    const perigee = a * (1 - e) - R_EARTH

    return {
      period: this.getOrbitalPeriod(tle),
      apogee,
      perigee,
      inclination: tle.inclination,
      eccentricity: tle.eccentricity,
      semiMajorAxis: a
    }
  }
}

// Singleton instance
let orbitalMechanicsService: OrbitalMechanicsService | null = null

export function getOrbitalMechanicsService(): OrbitalMechanicsService {
  if (!orbitalMechanicsService) {
    orbitalMechanicsService = new OrbitalMechanicsService()
  }
  return orbitalMechanicsService
}
