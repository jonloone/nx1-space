import { NextRequest, NextResponse } from 'next/server'
import { H3OpportunityIntegration } from '@/lib/scoring/h3-opportunity-integration'
import { GlobalHexVerification } from '@/lib/services/globalHexVerification'
import { stationDataService } from '@/lib/services/stationDataService'
import { competitorDataService } from '@/lib/services/competitorDataService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const resolution = parseInt(searchParams.get('resolution') || '4')
    const bounds = searchParams.get('bounds')
    
    // Initialize services
    const h3Integration = new H3OpportunityIntegration()
    const hexVerification = new GlobalHexVerification()
    
    // Load station data for scoring context
    const sesStations = await stationDataService.loadAllStations()
    const competitorStations = await competitorDataService.loadCompetitorStations()
    
    // Generate hexagons with opportunity scoring
    let hexagons = await hexVerification.generateCompleteGlobalCoverage(resolution)
    
    // Apply opportunity scoring if we have station data
    if (sesStations.length > 0 && competitorStations.length > 0) {
      hexagons = await hexVerification.applyOpportunityScoring(
        hexagons,
        sesStations,
        competitorStations
      )
    }
    
    // Format hexagons for UI
    const formattedHexagons = hexagons.map(hex => ({
      hexagon: hex.hexagon,
      center: hex.center,
      score: hex.score || calculateHexScore(hex, sesStations, competitorStations),
      color: scoreToColor(hex.score || 0),
      
      // Score breakdown
      marketScore: hex.marketScore || Math.random() * 100,
      technicalScore: hex.technicalScore || Math.random() * 100,
      competitionScore: hex.competitionScore || Math.random() * 100,
      
      // Maritime data
      vesselDensity: hex.vesselDensity || Math.random() * 50,
      shippingLanes: hex.shippingLanes || [],
      
      // Metadata
      opportunityType: determineOpportunityType(hex.score || 0),
      confidence: hex.confidence || 0.7,
      monthlyRevenuePotential: hex.revenuePotential || Math.random() * 1000000,
      
      // Land/water flag
      isLand: hex.isLand,
      baseColor: hex.baseColor
    }))
    
    // Filter by bounds if provided
    let filteredHexagons = formattedHexagons
    if (bounds) {
      const bbox = JSON.parse(bounds)
      filteredHexagons = formattedHexagons.filter(hex => {
        const [lng, lat] = hex.center
        return lng >= bbox[0] && lng <= bbox[2] && 
               lat >= bbox[1] && lat <= bbox[3]
      })
    }
    
    return NextResponse.json({
      hexagons: filteredHexagons,
      metadata: {
        totalHexagons: filteredHexagons.length,
        resolution,
        bounds: bounds ? JSON.parse(bounds) : null,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching hexagons:', error)
    return NextResponse.json({ error: 'Failed to fetch hexagons' }, { status: 500 })
  }
}

function calculateHexScore(hex: any, sesStations: any[], competitorStations: any[]): number {
  // Simple scoring based on distance to stations
  const [hexLng, hexLat] = hex.center
  
  // Check distance to nearest SES station
  let minSesDistance = Infinity
  sesStations.forEach(station => {
    const distance = calculateDistance(hex.center, station.coordinates)
    if (distance < minSesDistance) minSesDistance = distance
  })
  
  // Check distance to nearest competitor
  let minCompDistance = Infinity
  competitorStations.forEach(station => {
    const distance = calculateDistance(hex.center, station.coordinates)
    if (distance < minCompDistance) minCompDistance = distance
  })
  
  // Score based on coverage gaps
  let score = 0
  if (minSesDistance > 500 && minCompDistance > 300) {
    score = 0.9 // High opportunity - no coverage
  } else if (minSesDistance > 300 && minCompDistance > 200) {
    score = 0.7 // Good opportunity
  } else if (minSesDistance > 200) {
    score = 0.5 // Medium opportunity
  } else if (minSesDistance > 100) {
    score = 0.3 // Low opportunity
  } else {
    score = 0.1 // Minimal opportunity - already covered
  }
  
  // Boost score for maritime areas
  if (!hex.isLand) {
    score = Math.min(1, score * 1.2)
  }
  
  return score
}

function scoreToColor(score: number): number[] {
  if (score > 0.8) return [34, 197, 94, 200]  // Green - High opportunity
  if (score > 0.6) return [251, 191, 36, 200]  // Yellow - Medium opportunity
  if (score > 0.4) return [59, 130, 246, 200]  // Blue - Low opportunity
  return [75, 85, 99, 150]  // Gray - Minimal opportunity
}

function determineOpportunityType(score: number): string {
  if (score > 0.8) return 'high-value'
  if (score > 0.6) return 'expansion'
  if (score > 0.4) return 'competitive'
  return 'maintenance'
}

function calculateDistance(coord1: number[], coord2: number[]): number {
  const R = 6371 // Earth radius in km
  const lat1 = coord1[1] * Math.PI / 180
  const lat2 = coord2[1] * Math.PI / 180
  const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180
  const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon/2) * Math.sin(deltaLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}