/**
 * Maritime Vessel Detail API
 *
 * GET /api/maritime/vessels/[mmsi] - Get vessel details and track
 * GET /api/maritime/vessels/[mmsi]?anomalies=true - Include anomalies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKattegatAISLoader, initializeWithDemoData } from '@/lib/data/kattegatAISLoader'
import { getAISAnomalyDetector } from '@/lib/analysis/aisAnomalyDetector'

interface RouteParams {
  params: Promise<{ mmsi: string }>
}

/**
 * GET /api/maritime/vessels/[mmsi]
 * Get detailed vessel information and track
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { mmsi } = await params
    const { searchParams } = new URL(request.url)
    const includeAnomalies = searchParams.get('anomalies') === 'true'
    const includeTrack = searchParams.get('track') !== 'false'
    const demo = searchParams.get('demo') === 'true'

    // Initialize with demo data if requested
    const loader = getKattegatAISLoader()
    if (demo && !loader.getAISService().isDataLoaded()) {
      await initializeWithDemoData({ hoursOfData: 24 })
    }

    if (!loader.getAISService().isDataLoaded()) {
      return NextResponse.json({
        success: false,
        error: 'No AIS data loaded. Use demo=true or load data first.'
      }, { status: 400 })
    }

    // Get vessel metadata
    const metadata = loader.getAISService().getVesselMetadata(mmsi)
    if (!metadata) {
      return NextResponse.json({
        success: false,
        error: `Vessel with MMSI ${mmsi} not found`
      }, { status: 404 })
    }

    // Get vessel track
    const tracks = loader.getVesselTracks()
    const track = tracks.find(t => t.mmsi === mmsi)

    if (!track) {
      return NextResponse.json({
        success: false,
        error: `Track for vessel ${mmsi} not found`
      }, { status: 404 })
    }

    // Get anomalies if requested
    let anomalies = track.anomalies
    if (includeAnomalies && anomalies.length === 0) {
      // Run detection for this vessel
      const detector = getAISAnomalyDetector()
      const analysis = detector.detectAllAnomalies([track])
      anomalies = [
        ...analysis.anomalies.aisGaps,
        ...analysis.anomalies.loitering,
        ...analysis.anomalies.rendezvous.filter(r => r.affectedVessels.includes(mmsi)),
        ...analysis.anomalies.speedAnomalies,
        ...analysis.anomalies.courseDeviations
      ]
    }

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      vessel: {
        ...metadata,
        trackInfo: {
          startTime: track.startTime,
          endTime: track.endTime,
          totalDistanceKm: track.totalDistanceKm,
          avgSpeedKnots: track.avgSpeedKnots,
          maxSpeedKnots: track.maxSpeedKnots,
          positionCount: track.positions.length,
          trackQuality: track.trackQuality
        }
      }
    }

    if (includeTrack) {
      // Simplify track for response (remove computed fields for brevity)
      response.track = track.positions.map(p => ({
        timestamp: p.timestamp,
        position: p.position,
        sog: p.sog,
        cog: p.cog,
        heading: p.heading,
        navStatus: p.navStatus
      }))
    }

    if (includeAnomalies) {
      response.anomalies = anomalies
      response.anomalyCount = anomalies.length
    }

    // Last known position
    const lastPos = track.positions[track.positions.length - 1]
    response.lastPosition = {
      timestamp: lastPos.timestamp,
      position: lastPos.position,
      sog: lastPos.sog,
      cog: lastPos.cog,
      navStatus: lastPos.navStatus
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Vessel detail API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
