/**
 * Imagery Analysis Service
 *
 * Advanced satellite imagery analysis including:
 * - Change detection (temporal comparison)
 * - Object recognition (buildings, vehicles, infrastructure)
 * - Anomaly detection
 * - Activity analysis
 * - Intelligence assessment
 *
 * Supports multi-temporal analysis for operational intelligence
 */

import type { SatelliteImage, SatelliteTimeSeries } from './satelliteImageryService'

export interface ChangeDetectionOptions {
  beforeImage: SatelliteImage
  afterImage: SatelliteImage
  sensitivity?: 'low' | 'medium' | 'high' // Detection threshold
  changeTypes?: ('construction' | 'demolition' | 'vegetation' | 'all')[]
}

export interface DetectedChange {
  id: string
  type: 'construction' | 'demolition' | 'vegetation_loss' | 'vegetation_gain' | 'infrastructure' | 'unknown'
  location: {
    center: [number, number]
    bounds: {
      west: number
      south: number
      east: number
      north: number
    }
  }
  confidence: number // 0-100
  magnitude: number // 0-100 (how significant the change is)
  description: string
  detectedAt: Date
  timespan: {
    before: Date
    after: Date
    daysBetween: number
  }
}

export interface ChangeDetectionResult {
  summary: {
    totalChanges: number
    significantChanges: number // confidence > 70
    changeTypes: Record<string, number>
    analysisDate: Date
  }
  changes: DetectedChange[]
  beforeImage: SatelliteImage
  afterImage: SatelliteImage
  statistics: {
    averageConfidence: number
    largestChange: DetectedChange | null
    mostCommonType: string
  }
}

export interface ObjectDetectionResult {
  objects: Array<{
    type: 'building' | 'vehicle' | 'aircraft' | 'ship' | 'infrastructure' | 'unknown'
    location: [number, number]
    confidence: number
    size: { width: number; height: number } // meters
    orientation?: number // degrees
    metadata?: Record<string, any>
  }>
  summary: {
    totalObjects: number
    byType: Record<string, number>
    analysisDate: Date
  }
}

export interface ActivityAnalysis {
  location: {
    center: [number, number]
    name?: string
  }
  timeRange: {
    start: Date
    end: Date
  }
  activityLevel: 'none' | 'low' | 'medium' | 'high' | 'very_high'
  activityScore: number // 0-100
  indicators: Array<{
    type: string
    description: string
    confidence: number
    detectedAt: Date
  }>
  changeFrequency: number // changes per month
  intelligence: {
    summary: string
    keyFindings: string[]
    riskIndicators: string[]
    recommendedActions: string[]
  }
}

export class ImageryAnalysisService {
  /**
   * Detect changes between two satellite images
   */
  async detectChanges(options: ChangeDetectionOptions): Promise<ChangeDetectionResult> {
    const { beforeImage, afterImage, sensitivity = 'medium' } = options

    console.log(`🔍 Running change detection between ${beforeImage.acquisitionDate.toISOString()} and ${afterImage.acquisitionDate.toISOString()}`)

    // Calculate time difference
    const daysBetween = Math.floor(
      (afterImage.acquisitionDate.getTime() - beforeImage.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // In production, this would use ML models for change detection
    // For now, generate intelligent mock data
    const changes = this.generateMockChanges(beforeImage, afterImage, daysBetween, sensitivity)

    // Calculate statistics
    const significantChanges = changes.filter(c => c.confidence >= 70).length
    const changeTypes: Record<string, number> = {}
    changes.forEach(change => {
      changeTypes[change.type] = (changeTypes[change.type] || 0) + 1
    })

    const averageConfidence = changes.length > 0
      ? changes.reduce((sum, c) => sum + c.confidence, 0) / changes.length
      : 0

    const largestChange = changes.length > 0
      ? changes.reduce((max, c) => c.magnitude > max.magnitude ? c : max)
      : null

    const mostCommonType = Object.entries(changeTypes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'

    return {
      summary: {
        totalChanges: changes.length,
        significantChanges,
        changeTypes,
        analysisDate: new Date()
      },
      changes,
      beforeImage,
      afterImage,
      statistics: {
        averageConfidence: Math.round(averageConfidence * 10) / 10,
        largestChange,
        mostCommonType
      }
    }
  }

  /**
   * Detect objects in satellite imagery
   */
  async detectObjects(image: SatelliteImage, objectTypes?: string[]): Promise<ObjectDetectionResult> {
    console.log(`🎯 Detecting objects in ${image.id}`)

    // In production, use object detection ML models
    const objects = this.generateMockObjectDetection(image)

    const byType: Record<string, number> = {}
    objects.forEach(obj => {
      byType[obj.type] = (byType[obj.type] || 0) + 1
    })

    return {
      objects,
      summary: {
        totalObjects: objects.length,
        byType,
        analysisDate: new Date()
      }
    }
  }

  /**
   * Analyze activity over time using time-series imagery
   */
  async analyzeActivity(
    timeSeries: SatelliteTimeSeries,
    locationName?: string
  ): Promise<ActivityAnalysis> {
    console.log(`📊 Analyzing activity for ${timeSeries.images.length} images`)

    const { images, dateRange, location } = timeSeries

    // Run change detection between consecutive images
    const changeResults: ChangeDetectionResult[] = []
    for (let i = 1; i < images.length; i++) {
      const result = await this.detectChanges({
        beforeImage: images[i - 1],
        afterImage: images[i],
        sensitivity: 'medium'
      })
      changeResults.push(result)
    }

    // Calculate activity metrics
    const totalChanges = changeResults.reduce((sum, r) => sum + r.summary.totalChanges, 0)
    const significantChanges = changeResults.reduce((sum, r) => sum + r.summary.significantChanges, 0)

    // Changes per month
    const monthsInRange = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const changeFrequency = monthsInRange > 0 ? totalChanges / monthsInRange : 0

    // Activity score (0-100)
    let activityScore = 0
    if (changeFrequency < 1) {
      activityScore = 10
    } else if (changeFrequency < 5) {
      activityScore = 30
    } else if (changeFrequency < 15) {
      activityScore = 60
    } else {
      activityScore = 90
    }

    // Activity level
    let activityLevel: ActivityAnalysis['activityLevel']
    if (activityScore < 20) activityLevel = 'none'
    else if (activityScore < 40) activityLevel = 'low'
    else if (activityScore < 60) activityLevel = 'medium'
    else if (activityScore < 80) activityLevel = 'high'
    else activityLevel = 'very_high'

    // Collect indicators
    const indicators: ActivityAnalysis['indicators'] = []
    changeResults.forEach(result => {
      result.changes.forEach(change => {
        if (change.confidence >= 70) {
          indicators.push({
            type: change.type,
            description: change.description,
            confidence: change.confidence,
            detectedAt: change.timespan.after
          })
        }
      })
    })

    // Generate intelligence assessment
    const intelligence = this.generateActivityIntelligence(
      activityLevel,
      activityScore,
      indicators,
      changeResults
    )

    return {
      location: {
        center: location.center,
        name: locationName || location.name
      },
      timeRange: dateRange,
      activityLevel,
      activityScore: Math.round(activityScore),
      indicators,
      changeFrequency: Math.round(changeFrequency * 10) / 10,
      intelligence
    }
  }

  /**
   * Generate intelligence assessment from activity data
   */
  private generateActivityIntelligence(
    activityLevel: string,
    activityScore: number,
    indicators: ActivityAnalysis['indicators'],
    changeResults: ChangeDetectionResult[]
  ): ActivityAnalysis['intelligence'] {
    const keyFindings: string[] = []
    const riskIndicators: string[] = []
    const recommendedActions: string[] = []

    // Analyze construction activity
    const constructionChanges = changeResults.reduce(
      (sum, r) => sum + (r.summary.changeTypes['construction'] || 0),
      0
    )
    if (constructionChanges > 0) {
      keyFindings.push(`${constructionChanges} construction event(s) detected`)
      if (constructionChanges > 5) {
        riskIndicators.push('High construction activity may indicate infrastructure development')
      }
    }

    // Analyze demolition activity
    const demolitionChanges = changeResults.reduce(
      (sum, r) => sum + (r.summary.changeTypes['demolition'] || 0),
      0
    )
    if (demolitionChanges > 0) {
      keyFindings.push(`${demolitionChanges} demolition event(s) detected`)
      if (demolitionChanges > 3) {
        riskIndicators.push('Multiple demolitions may indicate site clearance or redevelopment')
      }
    }

    // Activity level assessment
    if (activityLevel === 'very_high' || activityLevel === 'high') {
      riskIndicators.push(`${activityLevel.replace('_', ' ')} activity level detected`)
      recommendedActions.push('Increase surveillance frequency')
      recommendedActions.push('Deploy ground assets for verification')
    }

    // High-confidence indicators
    const highConfidenceIndicators = indicators.filter(i => i.confidence >= 85)
    if (highConfidenceIndicators.length > 0) {
      keyFindings.push(`${highConfidenceIndicators.length} high-confidence change(s) detected`)
    }

    // Generate summary
    const summary = this.generateActivitySummary(
      activityLevel,
      activityScore,
      keyFindings,
      riskIndicators
    )

    // Default recommendations if none found
    if (recommendedActions.length === 0) {
      if (activityLevel === 'none' || activityLevel === 'low') {
        recommendedActions.push('Continue routine monitoring')
      } else {
        recommendedActions.push('Maintain current surveillance posture')
      }
    }

    return {
      summary,
      keyFindings,
      riskIndicators,
      recommendedActions
    }
  }

  /**
   * Generate activity summary text
   */
  private generateActivitySummary(
    activityLevel: string,
    activityScore: number,
    keyFindings: string[],
    riskIndicators: string[]
  ): string {
    const parts: string[] = []

    parts.push(`Location exhibits **${activityLevel.replace('_', ' ')}** activity (score: ${activityScore}/100).`)

    if (keyFindings.length > 0) {
      parts.push(`Analysis identified ${keyFindings.length} key finding(s).`)
    }

    if (riskIndicators.length > 0) {
      parts.push(`${riskIndicators.length} risk indicator(s) flagged for review.`)
    }

    return parts.join(' ')
  }

  /**
   * Generate mock change detection data
   */
  private generateMockChanges(
    beforeImage: SatelliteImage,
    afterImage: SatelliteImage,
    daysBetween: number,
    sensitivity: string
  ): DetectedChange[] {
    const changes: DetectedChange[] = []
    const [lng, lat] = [(beforeImage.bounds.west + beforeImage.bounds.east) / 2, (beforeImage.bounds.north + beforeImage.bounds.south) / 2]

    // More changes for longer time periods
    const baseChangeCount = Math.min(Math.floor(daysBetween / 30), 8)
    const changeCount = sensitivity === 'high' ? baseChangeCount + 2 : sensitivity === 'low' ? Math.max(1, baseChangeCount - 1) : baseChangeCount

    const changeTypes: DetectedChange['type'][] = ['construction', 'demolition', 'vegetation_loss', 'vegetation_gain', 'infrastructure']

    for (let i = 0; i < changeCount; i++) {
      const type = changeTypes[Math.floor(Math.random() * changeTypes.length)]
      const confidence = 50 + Math.random() * 45 // 50-95%
      const magnitude = 30 + Math.random() * 70 // 30-100%

      const offset = 0.001 * (Math.random() - 0.5)
      const center: [number, number] = [lng + offset, lat + offset]

      changes.push({
        id: `change-${i}-${Date.now()}`,
        type,
        location: {
          center,
          bounds: {
            west: center[0] - 0.0005,
            south: center[1] - 0.0005,
            east: center[0] + 0.0005,
            north: center[1] + 0.0005
          }
        },
        confidence: Math.round(confidence * 10) / 10,
        magnitude: Math.round(magnitude * 10) / 10,
        description: this.getChangeDescription(type, magnitude),
        detectedAt: new Date(),
        timespan: {
          before: beforeImage.acquisitionDate,
          after: afterImage.acquisitionDate,
          daysBetween
        }
      })
    }

    return changes.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Generate change description
   */
  private getChangeDescription(type: string, magnitude: number): string {
    const intensity = magnitude > 70 ? 'Significant' : magnitude > 50 ? 'Moderate' : 'Minor'

    switch (type) {
      case 'construction':
        return `${intensity} construction activity detected - possible new structure or infrastructure`
      case 'demolition':
        return `${intensity} demolition or removal detected - structure may have been removed`
      case 'vegetation_loss':
        return `${intensity} vegetation loss detected - possible clearing or deforestation`
      case 'vegetation_gain':
        return `${intensity} vegetation growth detected - natural regrowth or landscaping`
      case 'infrastructure':
        return `${intensity} infrastructure change detected - roads, utilities, or facilities`
      default:
        return `${intensity} change detected in area`
    }
  }

  /**
   * Generate mock object detection results
   */
  private generateMockObjectDetection(image: SatelliteImage): ObjectDetectionResult['objects'] {
    const objects: ObjectDetectionResult['objects'] = []
    const [lng, lat] = [(image.bounds.west + image.bounds.east) / 2, (image.bounds.north + image.bounds.south) / 2]

    const objectTypes: ObjectDetectionResult['objects'][0]['type'][] = ['building', 'vehicle', 'aircraft', 'ship', 'infrastructure']
    const objectCount = 3 + Math.floor(Math.random() * 7) // 3-10 objects

    for (let i = 0; i < objectCount; i++) {
      const type = objectTypes[Math.floor(Math.random() * objectTypes.length)]
      const offset = 0.002 * (Math.random() - 0.5)

      objects.push({
        type,
        location: [lng + offset, lat + offset],
        confidence: 60 + Math.random() * 35, // 60-95%
        size: {
          width: 10 + Math.random() * 40,
          height: 10 + Math.random() * 40
        },
        orientation: Math.random() * 360
      })
    }

    return objects
  }
}

// Singleton instance
let imageryAnalysisService: ImageryAnalysisService | null = null

export function getImageryAnalysisService(): ImageryAnalysisService {
  if (!imageryAnalysisService) {
    imageryAnalysisService = new ImageryAnalysisService()
  }
  return imageryAnalysisService
}
