/**
 * Data Integrity Service
 *
 * Validates investigation data for accuracy and consistency.
 * Ensures geospatial and temporal authenticity for law enforcement use.
 *
 * Validation checks:
 * - Temporal consistency (no time travel)
 * - Route speeds (realistic for NYC)
 * - Coordinate validity (within expected bounds)
 * - Dwell time reasonableness
 * - Route continuity
 */

import type { InvestigationDemoData, LocationStop, TrackingPoint } from '@/lib/demo/investigation-demo-data'
import { calculateDistance } from '@/lib/utils/geospatial'

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info'
  category: 'temporal' | 'geospatial' | 'speed' | 'continuity' | 'data'
  message: string
  details?: any
  timestamp?: Date
  location?: string
}

export interface ValidationReport {
  valid: boolean
  score: number // 0-100
  issues: ValidationIssue[]
  summary: {
    critical: number
    warnings: number
    info: number
  }
  checks: {
    temporal: boolean
    geospatial: boolean
    speed: boolean
    continuity: boolean
  }
}

export class DataIntegrityService {
  // Validation thresholds
  private readonly NYC_BOUNDS = {
    minLat: 40.4774,
    maxLat: 40.9176,
    minLng: -74.2591,
    maxLng: -73.7004
  }

  private readonly MAX_SPEED_KMH = 120 // Maximum realistic speed in NYC
  private readonly MAX_DWELL_HOURS = 24 // Maximum reasonable dwell time
  private readonly MIN_DWELL_MINUTES = 1 // Minimum dwell time

  /**
   * Validate investigation data
   */
  validate(data: InvestigationDemoData): ValidationReport {
    console.log('🔍 Starting data integrity validation...')

    const issues: ValidationIssue[] = []

    // Run all validation checks
    issues.push(...this.validateTemporal(data))
    issues.push(...this.validateGeospatial(data))
    issues.push(...this.validateSpeed(data))
    issues.push(...this.validateContinuity(data))
    issues.push(...this.validateDataQuality(data))

    // Calculate summary
    const summary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length
    }

    // Calculate validation score (100 = perfect, 0 = critical issues)
    const score = this.calculateScore(summary)

    // Determine if data is valid (no critical issues)
    const valid = summary.critical === 0

    const checks = {
      temporal: !issues.some(i => i.category === 'temporal' && i.severity === 'critical'),
      geospatial: !issues.some(i => i.category === 'geospatial' && i.severity === 'critical'),
      speed: !issues.some(i => i.category === 'speed' && i.severity === 'critical'),
      continuity: !issues.some(i => i.category === 'continuity' && i.severity === 'critical')
    }

    console.log(`✅ Validation complete: ${valid ? 'PASS' : 'FAIL'} (Score: ${score}/100)`)
    console.log(`   Critical: ${summary.critical}, Warnings: ${summary.warnings}, Info: ${summary.info}`)

    return {
      valid,
      score,
      issues,
      summary,
      checks
    }
  }

  /**
   * Validate temporal consistency
   */
  private validateTemporal(data: InvestigationDemoData): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check location stops for time travel
    for (let i = 0; i < data.locationStops.length - 1; i++) {
      const current = data.locationStops[i]
      const next = data.locationStops[i + 1]

      // Check if departure time is before arrival time
      if (current.departureTime > current.arrivalTime) {
        issues.push({
          severity: 'critical',
          category: 'temporal',
          message: `Location ${current.name}: Departure before arrival`,
          details: {
            arrival: current.arrivalTime.toISOString(),
            departure: current.departureTime.toISOString(),
            location: current.name
          }
        })
      }

      // Check if next arrival is after current departure
      if (next.arrivalTime < current.departureTime) {
        issues.push({
          severity: 'critical',
          category: 'temporal',
          message: `Time travel detected: ${current.name} → ${next.name}`,
          details: {
            from: current.name,
            departure: current.departureTime.toISOString(),
            to: next.name,
            arrival: next.arrivalTime.toISOString(),
            timeGap: (next.arrivalTime.getTime() - current.departureTime.getTime()) / 1000 / 60
          }
        })
      }

      // Check for suspiciously short travel time
      const travelTime = (next.arrivalTime.getTime() - current.departureTime.getTime()) / 1000 / 60
      const distance = calculateDistance(current.lat, current.lng, next.lat, next.lng)

      if (distance > 1 && travelTime < 1) {
        issues.push({
          severity: 'warning',
          category: 'temporal',
          message: `Very short travel time: ${current.name} → ${next.name}`,
          details: {
            distance: `${distance.toFixed(2)} km`,
            travelTime: `${travelTime.toFixed(1)} minutes`,
            impliedSpeed: `${(distance / (travelTime / 60)).toFixed(0)} km/h`
          }
        })
      }
    }

    // Check tracking points for temporal order
    if (data.trackingPoints) {
      for (let i = 0; i < data.trackingPoints.length - 1; i++) {
        const current = data.trackingPoints[i]
        const next = data.trackingPoints[i + 1]

        if (next.timestamp < current.timestamp) {
          issues.push({
            severity: 'warning',
            category: 'temporal',
            message: 'Tracking points not in chronological order',
            details: {
              index: i,
              currentTime: current.timestamp.toISOString(),
              nextTime: next.timestamp.toISOString()
            }
          })
          break // Only report first occurrence
        }
      }
    }

    // Check dwell times
    data.locationStops.forEach(stop => {
      const dwellHours = stop.dwellTimeMinutes / 60

      if (dwellHours > this.MAX_DWELL_HOURS) {
        issues.push({
          severity: 'warning',
          category: 'temporal',
          message: `Unusually long dwell time: ${stop.name}`,
          details: {
            location: stop.name,
            dwellTime: `${dwellHours.toFixed(1)} hours`,
            threshold: `${this.MAX_DWELL_HOURS} hours`
          }
        })
      }

      if (stop.dwellTimeMinutes < this.MIN_DWELL_MINUTES) {
        issues.push({
          severity: 'info',
          category: 'temporal',
          message: `Very short dwell time: ${stop.name}`,
          details: {
            location: stop.name,
            dwellTime: `${stop.dwellTimeMinutes} minutes`
          }
        })
      }
    })

    return issues
  }

  /**
   * Validate geospatial data
   */
  private validateGeospatial(data: InvestigationDemoData): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check location coordinates
    data.locationStops.forEach(stop => {
      if (!this.isWithinNYCBounds(stop.lat, stop.lng)) {
        issues.push({
          severity: 'critical',
          category: 'geospatial',
          message: `Location outside NYC bounds: ${stop.name}`,
          details: {
            location: stop.name,
            coordinates: [stop.lng, stop.lat],
            bounds: this.NYC_BOUNDS
          }
        })
      }

      // Check for invalid coordinates
      if (Math.abs(stop.lat) > 90 || Math.abs(stop.lng) > 180) {
        issues.push({
          severity: 'critical',
          category: 'geospatial',
          message: `Invalid coordinates: ${stop.name}`,
          details: {
            location: stop.name,
            lat: stop.lat,
            lng: stop.lng
          }
        })
      }
    })

    // Check tracking points
    if (data.trackingPoints) {
      const invalidPoints = data.trackingPoints.filter(
        point => !this.isWithinNYCBounds(point.lat, point.lng)
      )

      if (invalidPoints.length > 0) {
        issues.push({
          severity: 'warning',
          category: 'geospatial',
          message: `${invalidPoints.length} tracking points outside NYC bounds`,
          details: {
            count: invalidPoints.length,
            total: data.trackingPoints.length,
            percentage: ((invalidPoints.length / data.trackingPoints.length) * 100).toFixed(1)
          }
        })
      }
    }

    return issues
  }

  /**
   * Validate speed calculations
   */
  private validateSpeed(data: InvestigationDemoData): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check speeds between locations
    for (let i = 0; i < data.locationStops.length - 1; i++) {
      const current = data.locationStops[i]
      const next = data.locationStops[i + 1]

      const distance = calculateDistance(current.lat, current.lng, next.lat, next.lng)
      const timeDiff = (next.arrivalTime.getTime() - current.departureTime.getTime()) / 1000 / 3600 // hours

      if (timeDiff > 0) {
        const speed = distance / timeDiff // km/h

        if (speed > this.MAX_SPEED_KMH) {
          issues.push({
            severity: 'critical',
            category: 'speed',
            message: `Unrealistic speed: ${current.name} → ${next.name}`,
            details: {
              from: current.name,
              to: next.name,
              speed: `${speed.toFixed(0)} km/h`,
              threshold: `${this.MAX_SPEED_KMH} km/h`,
              distance: `${distance.toFixed(2)} km`,
              time: `${(timeDiff * 60).toFixed(1)} minutes`
            }
          })
        }

        // Info for very slow movement
        if (speed < 5 && distance > 1) {
          issues.push({
            severity: 'info',
            category: 'speed',
            message: `Slow movement: ${current.name} → ${next.name}`,
            details: {
              from: current.name,
              to: next.name,
              speed: `${speed.toFixed(1)} km/h`,
              distance: `${distance.toFixed(2)} km`,
              time: `${(timeDiff * 60).toFixed(0)} minutes`
            }
          })
        }
      }
    }

    return issues
  }

  /**
   * Validate route continuity
   */
  private validateContinuity(data: InvestigationDemoData): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check if we have route segments for location transitions
    if (data.routeSegments) {
      const expectedRoutes = data.locationStops.length - 1
      const actualRoutes = data.routeSegments.length

      if (actualRoutes < expectedRoutes) {
        issues.push({
          severity: 'warning',
          category: 'continuity',
          message: 'Missing route segments',
          details: {
            expected: expectedRoutes,
            actual: actualRoutes,
            missing: expectedRoutes - actualRoutes
          }
        })
      }

      // Check for route segment gaps
      for (let i = 0; i < data.routeSegments.length - 1; i++) {
        const current = data.routeSegments[i]
        const next = data.routeSegments[i + 1]

        const gap = (next.startTime.getTime() - current.endTime.getTime()) / 1000 / 60

        if (gap > 5) {
          issues.push({
            severity: 'info',
            category: 'continuity',
            message: `Gap in route segments: ${gap.toFixed(1)} minutes`,
            details: {
              index: i,
              gap: `${gap.toFixed(1)} minutes`,
              currentEnd: current.endTime.toISOString(),
              nextStart: next.startTime.toISOString()
            }
          })
        }
      }
    } else {
      issues.push({
        severity: 'info',
        category: 'continuity',
        message: 'No route segments provided',
        details: {
          locationCount: data.locationStops.length
        }
      })
    }

    return issues
  }

  /**
   * Validate general data quality
   */
  private validateDataQuality(data: InvestigationDemoData): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Check for minimum data requirements
    if (data.locationStops.length < 2) {
      issues.push({
        severity: 'critical',
        category: 'data',
        message: 'Insufficient location data',
        details: {
          locationCount: data.locationStops.length,
          minimum: 2
        }
      })
    }

    // Check for duplicate locations
    const locationNames = new Set<string>()
    data.locationStops.forEach(stop => {
      if (locationNames.has(stop.name)) {
        issues.push({
          severity: 'info',
          category: 'data',
          message: `Duplicate location name: ${stop.name}`,
          details: {
            location: stop.name
          }
        })
      }
      locationNames.add(stop.name)
    })

    // Check for missing metadata
    data.locationStops.forEach(stop => {
      if (!stop.type || stop.type === 'unknown') {
        issues.push({
          severity: 'info',
          category: 'data',
          message: `Missing location type: ${stop.name}`,
          details: {
            location: stop.name
          }
        })
      }
    })

    return issues
  }

  /**
   * Check if coordinates are within NYC bounds
   */
  private isWithinNYCBounds(lat: number, lng: number): boolean {
    return (
      lat >= this.NYC_BOUNDS.minLat &&
      lat <= this.NYC_BOUNDS.maxLat &&
      lng >= this.NYC_BOUNDS.minLng &&
      lng <= this.NYC_BOUNDS.maxLng
    )
  }

  /**
   * Calculate validation score
   */
  private calculateScore(summary: { critical: number; warnings: number; info: number }): number {
    // Start at 100, deduct points for issues
    let score = 100

    // Critical issues: -20 points each
    score -= summary.critical * 20

    // Warnings: -5 points each
    score -= summary.warnings * 5

    // Info: -1 point each
    score -= summary.info * 1

    // Ensure score doesn't go below 0
    return Math.max(0, score)
  }

  /**
   * Generate human-readable validation summary
   */
  summarize(report: ValidationReport): string {
    const lines: string[] = []

    lines.push('═══════════════════════════════════════════')
    lines.push('  DATA INTEGRITY VALIDATION REPORT')
    lines.push('═══════════════════════════════════════════')
    lines.push('')
    lines.push(`Status: ${report.valid ? '✅ PASS' : '❌ FAIL'}`)
    lines.push(`Score: ${report.score}/100`)
    lines.push('')
    lines.push('Validation Checks:')
    lines.push(`  Temporal:    ${report.checks.temporal ? '✅' : '❌'}`)
    lines.push(`  Geospatial:  ${report.checks.geospatial ? '✅' : '❌'}`)
    lines.push(`  Speed:       ${report.checks.speed ? '✅' : '❌'}`)
    lines.push(`  Continuity:  ${report.checks.continuity ? '✅' : '❌'}`)
    lines.push('')
    lines.push('Issues Summary:')
    lines.push(`  🚨 Critical: ${report.summary.critical}`)
    lines.push(`  ⚠️  Warnings: ${report.summary.warnings}`)
    lines.push(`  ℹ️  Info:     ${report.summary.info}`)

    if (report.issues.length > 0) {
      lines.push('')
      lines.push('Detailed Issues:')
      lines.push('───────────────────────────────────────────')

      // Group by severity
      const critical = report.issues.filter(i => i.severity === 'critical')
      const warnings = report.issues.filter(i => i.severity === 'warning')
      const info = report.issues.filter(i => i.severity === 'info')

      if (critical.length > 0) {
        lines.push('')
        lines.push('🚨 CRITICAL ISSUES:')
        critical.forEach(issue => {
          lines.push(`   • ${issue.message}`)
          if (issue.details) {
            lines.push(`     ${JSON.stringify(issue.details, null, 2).split('\n').join('\n     ')}`)
          }
        })
      }

      if (warnings.length > 0) {
        lines.push('')
        lines.push('⚠️  WARNINGS:')
        warnings.forEach(issue => {
          lines.push(`   • ${issue.message}`)
        })
      }

      if (info.length > 0 && info.length <= 5) {
        lines.push('')
        lines.push('ℹ️  INFO:')
        info.forEach(issue => {
          lines.push(`   • ${issue.message}`)
        })
      } else if (info.length > 5) {
        lines.push('')
        lines.push(`ℹ️  INFO: ${info.length} informational messages (use verbose mode to see all)`)
      }
    }

    lines.push('')
    lines.push('═══════════════════════════════════════════')

    return lines.join('\n')
  }
}

// Singleton instance
let serviceInstance: DataIntegrityService | null = null

export function getDataIntegrityService(): DataIntegrityService {
  if (!serviceInstance) {
    serviceInstance = new DataIntegrityService()
  }
  return serviceInstance
}
