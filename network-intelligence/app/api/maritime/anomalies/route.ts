/**
 * Maritime Anomalies API
 *
 * GET /api/maritime/anomalies - Query detected anomalies
 * POST /api/maritime/anomalies/analyze - Run anomaly detection on current data
 *
 * Query Parameters (GET):
 * - types: comma-separated anomaly types (AIS_GAP, LOITERING, RENDEZVOUS, SPEED_ANOMALY, COURSE_DEVIATION)
 * - minSeverity: minimum severity (low, medium, high, critical)
 * - mmsi: filter by vessel MMSI
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - demo: if true, load demo data first
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKattegatAISLoader, initializeWithDemoData } from '@/lib/data/kattegatAISLoader'
import { getAISAnomalyDetector } from '@/lib/analysis/aisAnomalyDetector'
import {
  AnomalyType,
  AnomalySeverity,
  DetectedAnomaly,
  AnomalyAnalysisResult
} from '@/lib/types/ais-anomaly'

// Cache for analysis results
let cachedAnalysis: AnomalyAnalysisResult | null = null
let cacheTimestamp: number = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * GET /api/maritime/anomalies
 * Query detected anomalies with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const typesParam = searchParams.get('types')
    const minSeverity = searchParams.get('minSeverity') as AnomalySeverity | null
    const mmsi = searchParams.get('mmsi')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const demo = searchParams.get('demo') === 'true'

    // Initialize with demo data if requested and not loaded
    const loader = getKattegatAISLoader()
    if (demo && !loader.getAISService().isDataLoaded()) {
      await initializeWithDemoData({ hoursOfData: 24 })
    }

    // Check if data is loaded
    if (!loader.getAISService().isDataLoaded()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No AIS data loaded. Use demo=true or load data first.',
          anomalies: [],
          statistics: null
        },
        { status: 400 }
      )
    }

    // Get or run analysis
    const analysis = await getOrRunAnalysis()

    // Apply filters
    let anomalies: DetectedAnomaly[] = [
      ...analysis.anomalies.aisGaps,
      ...analysis.anomalies.loitering,
      ...analysis.anomalies.rendezvous,
      ...analysis.anomalies.speedAnomalies,
      ...analysis.anomalies.courseDeviations
    ]

    // Filter by type
    if (typesParam) {
      const types = typesParam.split(',') as AnomalyType[]
      anomalies = anomalies.filter(a => types.includes(a.type))
    }

    // Filter by severity
    if (minSeverity) {
      const severityOrder: AnomalySeverity[] = ['low', 'medium', 'high', 'critical']
      const minIndex = severityOrder.indexOf(minSeverity)
      anomalies = anomalies.filter(a => severityOrder.indexOf(a.severity) >= minIndex)
    }

    // Filter by MMSI
    if (mmsi) {
      anomalies = anomalies.filter(a => a.affectedVessels.includes(mmsi))
    }

    // Filter by time range
    if (startTime) {
      const start = new Date(startTime)
      anomalies = anomalies.filter(a => a.timestamp >= start)
    }
    if (endTime) {
      const end = new Date(endTime)
      anomalies = anomalies.filter(a => a.timestamp <= end)
    }

    // Sort by timestamp descending (newest first)
    anomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return NextResponse.json({
      success: true,
      anomalies,
      count: anomalies.length,
      statistics: analysis.statistics,
      timeRange: analysis.timeRange,
      filters: {
        types: typesParam?.split(',') || null,
        minSeverity,
        mmsi,
        startTime,
        endTime
      }
    })
  } catch (error) {
    console.error('Anomaly API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        anomalies: []
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/maritime/anomalies
 * Run anomaly detection with custom configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config, forceRefresh, loadDemo } = body

    // Initialize with demo data if requested
    if (loadDemo) {
      await initializeWithDemoData({
        hoursOfData: body.hoursOfData || 24,
        startDate: body.startDate ? new Date(body.startDate) : undefined
      })
    }

    const loader = getKattegatAISLoader()
    if (!loader.getAISService().isDataLoaded()) {
      return NextResponse.json(
        {
          success: false,
          error: 'No AIS data loaded. Set loadDemo=true or load data first.'
        },
        { status: 400 }
      )
    }

    // Update detector config if provided
    const detector = getAISAnomalyDetector()
    if (config) {
      detector.setConfig(config)
    }

    // Force refresh the cache
    if (forceRefresh) {
      cachedAnalysis = null
      cacheTimestamp = 0
    }

    // Run analysis
    const analysis = await getOrRunAnalysis(true)

    return NextResponse.json({
      success: true,
      analysis,
      config: detector.getConfig()
    })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get cached analysis or run new analysis
 */
async function getOrRunAnalysis(forceRefresh = false): Promise<AnomalyAnalysisResult> {
  const now = Date.now()

  // Return cached if valid
  if (!forceRefresh && cachedAnalysis && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedAnalysis
  }

  // Run new analysis
  const loader = getKattegatAISLoader()
  const tracks = loader.getVesselTracks()
  const detector = getAISAnomalyDetector()

  console.log(`Running anomaly detection on ${tracks.length} vessel tracks...`)
  const analysis = detector.detectAllAnomalies(tracks)
  console.log(`Detected ${analysis.statistics.totalAnomalies} anomalies in ${analysis.processingTimeMs}ms`)

  // Cache results
  cachedAnalysis = analysis
  cacheTimestamp = now

  return analysis
}
