/**
 * Maritime Vessels API
 *
 * GET /api/maritime/vessels - List all vessels
 * Query Parameters:
 * - type: filter by vessel type
 * - flag: filter by flag country
 * - demo: if true, load demo data first
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKattegatAISLoader, initializeWithDemoData } from '@/lib/data/kattegatAISLoader'
import { VesselType, KATTEGAT_BOUNDS } from '@/lib/types/ais-anomaly'

/**
 * GET /api/maritime/vessels
 * List all vessels with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type') as VesselType | null
    const flagFilter = searchParams.get('flag')
    const demo = searchParams.get('demo') === 'true'

    // Initialize with demo data if requested
    const loader = getKattegatAISLoader()
    if (demo && !loader.getAISService().isDataLoaded()) {
      await initializeWithDemoData({ hoursOfData: 24 })
    }

    if (!loader.getAISService().isDataLoaded()) {
      return NextResponse.json({
        success: false,
        error: 'No AIS data loaded. Use demo=true or load data first.',
        vessels: []
      }, { status: 400 })
    }

    // Get all vessel metadata
    let vessels = loader.getAISService().getAllVesselMetadata()

    // Apply filters
    if (typeFilter) {
      vessels = vessels.filter(v => v.type === typeFilter)
    }
    if (flagFilter) {
      vessels = vessels.filter(v => v.flag?.toLowerCase().includes(flagFilter.toLowerCase()))
    }

    // Get track info for each vessel
    const tracks = loader.getVesselTracks()
    const trackMap = new Map(tracks.map(t => [t.mmsi, t]))

    const enrichedVessels = vessels.map(vessel => {
      const track = trackMap.get(vessel.mmsi)
      return {
        ...vessel,
        trackInfo: track ? {
          startTime: track.startTime,
          endTime: track.endTime,
          totalDistanceKm: track.totalDistanceKm,
          avgSpeedKnots: track.avgSpeedKnots,
          maxSpeedKnots: track.maxSpeedKnots,
          positionCount: track.positions.length,
          anomalyCount: track.anomalies.length,
          trackQuality: track.trackQuality
        } : null,
        lastPosition: track?.positions[track.positions.length - 1] || null
      }
    })

    // Get statistics
    const stats = loader.getAISService().getStatistics()

    return NextResponse.json({
      success: true,
      vessels: enrichedVessels,
      count: enrichedVessels.length,
      statistics: stats,
      bounds: KATTEGAT_BOUNDS
    })
  } catch (error) {
    console.error('Vessels API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      vessels: []
    }, { status: 500 })
  }
}
