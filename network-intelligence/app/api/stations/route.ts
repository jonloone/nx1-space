import { NextRequest, NextResponse } from 'next/server'
import { stationDataService } from '@/lib/services/stationDataService'
import { competitorDataService } from '@/lib/services/competitorDataService'
import { ConditionalOpportunityScorer } from '@/lib/scoring/conditional-opportunity-scorer'

export async function GET(request: NextRequest) {
  try {
    // Load station data
    const sesStations = await stationDataService.loadAllStations()
    const competitorStations = await competitorDataService.loadCompetitorStations()
    
    // Initialize opportunity scorer
    const scorer = new ConditionalOpportunityScorer()
    
    // Format stations for UI consumption
    const stations = await Promise.all(sesStations.map(async station => ({
      id: station.id,
      name: station.name,
      operator: 'SES',
      location: station.location,
      coordinates: station.coordinates,
      elevation: station.elevation || 0,
      
      // Metrics
      utilization: station.utilization || Math.random() * 100,
      revenue: station.revenue || Math.random() * 10000000,
      profit: station.profit || Math.random() * 2000000,
      margin: station.margin || 15 + Math.random() * 20,
      
      // Opportunity scoring
      opportunityScore: await scorer.calculateStationOpportunity(station),
      opportunityType: station.opportunityType || 'expansion',
      
      // Status
      status: calculateStationStatus(station),
      
      // Additional data
      antennas: station.antennas || [],
      satelliteVisibility: station.satellites || {},
      maritimeCoverage: {
        vessels: Math.floor(Math.random() * 500),
        coverage: Math.random() * 100
      },
      competitionIndex: calculateCompetitionIndex(station, competitorStations)
    })))
    
    // Add competitor stations
    const formattedCompetitors = competitorStations.map(station => ({
      id: station.id,
      name: station.name,
      operator: station.operator,
      location: station.location,
      coordinates: station.coordinates,
      elevation: station.elevation || 0,
      utilization: station.utilization || Math.random() * 100,
      revenue: 0, // Hidden for competitors
      profit: 0, // Hidden for competitors
      margin: 0, // Hidden for competitors
      opportunityScore: 0,
      opportunityType: 'competitor',
      status: 'competitor',
      antennas: station.antennas || [],
      satelliteVisibility: {},
      maritimeCoverage: {},
      competitionIndex: 0
    }))
    
    return NextResponse.json({
      stations: [...stations, ...formattedCompetitors],
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalStations: stations.length + formattedCompetitors.length,
        sesStations: stations.length,
        competitorStations: formattedCompetitors.length
      }
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
  }
}

function calculateStationStatus(station: any): string {
  const utilization = station.utilization || 0
  const margin = station.margin || 0
  
  if (utilization > 80 && margin > 25) return 'optimal'
  if (utilization > 60 && margin > 15) return 'good'
  if (utilization > 40 || margin > 10) return 'warning'
  return 'critical'
}

function calculateCompetitionIndex(station: any, competitors: any[]): number {
  // Calculate how many competitors are within 100km
  const nearbyCompetitors = competitors.filter(comp => {
    const distance = calculateDistance(
      station.coordinates,
      comp.coordinates
    )
    return distance < 100
  })
  
  return nearbyCompetitors.length
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