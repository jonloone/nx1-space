import { NextRequest, NextResponse } from 'next/server'
import { ConditionalOpportunityScorer } from '@/lib/scoring/conditional-opportunity-scorer'
import { OpportunityAnalysisSystem } from '@/lib/map/opportunity-analysis-system'
import { stationDataService } from '@/lib/services/stationDataService'
import { competitorDataService } from '@/lib/services/competitorDataService'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const analysisType = searchParams.get('type') || 'opportunity'
    const bounds = searchParams.get('bounds')
    const stationId = searchParams.get('stationId')

    console.log('Analysis API request:', { analysisType, bounds, stationId })

    switch (analysisType) {
      case 'opportunity':
        return await handleOpportunityAnalysis(bounds)
      
      case 'station':
        if (!stationId) {
          return NextResponse.json({ error: 'stationId required for station analysis' }, { status: 400 })
        }
        return await handleStationAnalysis(stationId)
      
      case 'competitive':
        return await handleCompetitiveAnalysis(bounds)
      
      case 'market':
        return await handleMarketAnalysis(bounds)
      
      default:
        return NextResponse.json({ 
          error: 'Invalid analysis type',
          supportedTypes: ['opportunity', 'station', 'competitive', 'market']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json({ 
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleOpportunityAnalysis(bounds: string | null) {
  const analysisSystem = new OpportunityAnalysisSystem()
  const scorer = new ConditionalOpportunityScorer()

  // Load station data
  const sesStations = await stationDataService.loadAllStations()
  const competitorStations = await competitorDataService.loadCompetitorStations()

  // Parse bounds if provided
  let bbox = null
  if (bounds) {
    try {
      bbox = JSON.parse(bounds)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid bounds format' }, { status: 400 })
    }
  }

  // Generate opportunity analysis
  const opportunities = await Promise.all(
    sesStations.map(async (station) => {
      const opportunityScore = await scorer.calculateStationOpportunity(station)
      const competitorProximity = calculateCompetitorProximity(station, competitorStations)
      
      return {
        stationId: station.id,
        stationName: station.name,
        location: station.location,
        coordinates: station.coordinates,
        opportunityScore,
        competitorProximity,
        marketPotential: calculateMarketPotential(station),
        riskFactors: calculateRiskFactors(station),
        recommendations: generateRecommendations(opportunityScore, competitorProximity)
      }
    })
  )

  // Filter by bounds if provided
  const filteredOpportunities = bbox 
    ? opportunities.filter(opp => {
        const [lng, lat] = opp.coordinates
        return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
      })
    : opportunities

  return NextResponse.json({
    analysis: {
      type: 'opportunity',
      timestamp: new Date().toISOString(),
      bounds: bbox,
      totalOpportunities: filteredOpportunities.length,
      opportunities: filteredOpportunities,
      summary: {
        highPotential: filteredOpportunities.filter(o => o.opportunityScore > 0.8).length,
        mediumPotential: filteredOpportunities.filter(o => o.opportunityScore > 0.5 && o.opportunityScore <= 0.8).length,
        lowPotential: filteredOpportunities.filter(o => o.opportunityScore <= 0.5).length,
        averageScore: filteredOpportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / filteredOpportunities.length
      }
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      dataFreshness: 'real-time'
    }
  })
}

async function handleStationAnalysis(stationId: string) {
  const station = await stationDataService.loadStationById(stationId)
  if (!station) {
    return NextResponse.json({ error: 'Station not found' }, { status: 404 })
  }

  const scorer = new ConditionalOpportunityScorer()
  const competitorStations = await competitorDataService.loadCompetitorStations()

  // Detailed station analysis
  const opportunityScore = await scorer.calculateStationOpportunity(station)
  const competitorProximity = calculateCompetitorProximity(station, competitorStations)
  const performanceMetrics = calculatePerformanceMetrics(station)
  const marketAnalysis = calculateMarketPotential(station)

  return NextResponse.json({
    analysis: {
      type: 'station',
      station: {
        ...station,
        opportunityScore,
        competitorProximity,
        performanceMetrics,
        marketAnalysis,
        swotAnalysis: generateSWOTAnalysis(station, opportunityScore, competitorProximity),
        improvements: generateImprovementRecommendations(station, performanceMetrics),
        threatLevel: calculateThreatLevel(competitorProximity)
      }
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      stationId,
      analysisDepth: 'comprehensive'
    }
  })
}

async function handleCompetitiveAnalysis(bounds: string | null) {
  const competitorStations = await competitorDataService.loadCompetitorStations()
  const sesStations = await stationDataService.loadAllStations()

  // Parse bounds if provided
  let bbox = null
  if (bounds) {
    try {
      bbox = JSON.parse(bounds)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid bounds format' }, { status: 400 })
    }
  }

  // Filter stations by bounds
  const relevantCompetitors = bbox 
    ? competitorStations.filter(station => {
        const [lng, lat] = station.coordinates
        return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
      })
    : competitorStations

  const relevantSesStations = bbox
    ? sesStations.filter(station => {
        const [lng, lat] = station.coordinates
        return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
      })
    : sesStations

  // Competitive landscape analysis
  const competitorsByOperator = groupBy(relevantCompetitors, 'operator')
  const marketShare = calculateMarketShare(competitorsByOperator, relevantSesStations)
  const competitiveThreats = identifyCompetitiveThreats(relevantCompetitors, relevantSesStations)
  const marketGaps = identifyMarketGaps(relevantCompetitors, relevantSesStations)

  return NextResponse.json({
    analysis: {
      type: 'competitive',
      timestamp: new Date().toISOString(),
      bounds: bbox,
      competitors: {
        total: relevantCompetitors.length,
        byOperator: Object.fromEntries(
          Object.entries(competitorsByOperator).map(([operator, stations]) => [
            operator,
            { count: stations.length, marketShare: marketShare[operator] || 0 }
          ])
        ),
        details: relevantCompetitors.map(station => ({
          id: station.id,
          name: station.name,
          operator: station.operator,
          coordinates: station.coordinates,
          threatLevel: calculateThreatLevel([station]),
          strengths: identifyCompetitorStrengths(station),
          weaknesses: identifyCompetitorWeaknesses(station)
        }))
      },
      threats: competitiveThreats,
      opportunities: marketGaps,
      recommendations: generateCompetitiveRecommendations(competitiveThreats, marketGaps)
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      analysisScope: bbox ? 'regional' : 'global'
    }
  })
}

async function handleMarketAnalysis(bounds: string | null) {
  // Market analysis implementation
  const sesStations = await stationDataService.loadAllStations()
  const competitorStations = await competitorDataService.loadCompetitorStations()

  // Calculate market metrics
  const totalMarketSize = calculateTotalMarketSize(sesStations, competitorStations)
  const growthTrends = calculateGrowthTrends()
  const marketSegmentation = analyzeMarketSegmentation(sesStations, competitorStations)

  return NextResponse.json({
    analysis: {
      type: 'market',
      timestamp: new Date().toISOString(),
      market: {
        totalSize: totalMarketSize,
        growthRate: growthTrends.annualGrowthRate,
        segmentation: marketSegmentation,
        trends: growthTrends.trends,
        forecast: generateMarketForecast(totalMarketSize, growthTrends),
        keyDrivers: identifyMarketDrivers(),
        risks: identifyMarketRisks()
      }
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      forecastPeriod: '5 years'
    }
  })
}

// Helper functions
function calculateCompetitorProximity(station: any, competitors: any[]): number {
  const nearbyCompetitors = competitors.filter(comp => {
    const distance = calculateDistance(station.coordinates, comp.coordinates)
    return distance < 200 // Within 200km
  })
  return nearbyCompetitors.length
}

function calculateMarketPotential(station: any): number {
  // Simplified market potential calculation
  const baseScore = (station.utilization || 50) / 100
  const locationMultiplier = getLocationMultiplier(station.coordinates)
  return Math.min(100, baseScore * locationMultiplier * 100)
}

function calculateRiskFactors(station: any): string[] {
  const risks = []
  
  if (station.utilization > 90) risks.push('overcapacity')
  if (station.margin < 10) risks.push('low_profitability')
  if (station.status === 'critical') risks.push('operational_issues')
  
  // Geographic risks
  const [lng, lat] = station.coordinates
  if (Math.abs(lat) > 60) risks.push('extreme_weather')
  if (isInPoliticallyUnstableRegion(lng, lat)) risks.push('political_instability')
  
  return risks
}

function generateRecommendations(opportunityScore: number, competitorCount: number): string[] {
  const recommendations = []
  
  if (opportunityScore > 0.8) {
    recommendations.push('High-priority expansion candidate')
  } else if (opportunityScore > 0.5) {
    recommendations.push('Consider capacity upgrade')
  } else {
    recommendations.push('Monitor for efficiency improvements')
  }
  
  if (competitorCount > 3) {
    recommendations.push('Implement competitive differentiation strategy')
  }
  
  return recommendations
}

function calculatePerformanceMetrics(station: any) {
  return {
    efficiency: (station.utilization || 50) / 100,
    profitability: Math.max(0, (station.margin || 0) / 100),
    reliability: station.status === 'operational' ? 0.95 : 0.7,
    capacity: station.utilization || 50,
    growth: Math.random() * 0.2 - 0.1 // -10% to +10%
  }
}

function generateSWOTAnalysis(station: any, opportunityScore: number, competitorCount: number) {
  return {
    strengths: [
      opportunityScore > 0.7 ? 'Strong market position' : null,
      station.status === 'operational' ? 'Reliable operations' : null,
      (station.margin || 0) > 20 ? 'High profitability' : null
    ].filter(Boolean),
    weaknesses: [
      opportunityScore < 0.3 ? 'Limited growth potential' : null,
      (station.utilization || 0) > 90 ? 'Capacity constraints' : null,
      (station.margin || 0) < 10 ? 'Low profitability' : null
    ].filter(Boolean),
    opportunities: [
      competitorCount < 2 ? 'Low competition' : null,
      opportunityScore > 0.5 ? 'Market expansion potential' : null
    ].filter(Boolean),
    threats: [
      competitorCount > 5 ? 'High competition' : null,
      station.status === 'critical' ? 'Operational risks' : null
    ].filter(Boolean)
  }
}

function generateImprovementRecommendations(station: any, metrics: any): string[] {
  const recommendations = []
  
  if (metrics.efficiency < 0.7) {
    recommendations.push('Optimize capacity utilization')
  }
  if (metrics.profitability < 0.1) {
    recommendations.push('Review pricing strategy')
  }
  if (metrics.reliability < 0.9) {
    recommendations.push('Improve operational reliability')
  }
  
  return recommendations
}

function calculateThreatLevel(competitors: any[]): 'low' | 'medium' | 'high' {
  if (competitors.length > 5) return 'high'
  if (competitors.length > 2) return 'medium'
  return 'low'
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

function getLocationMultiplier(coordinates: number[]): number {
  // Simplified location-based multiplier
  const [lng, lat] = coordinates
  
  // Higher multiplier for strategic locations
  if (Math.abs(lat) < 30 && Math.abs(lng) < 50) return 1.2 // Europe/Africa
  if (lng > 100 && lng < 150 && lat > 20 && lat < 50) return 1.3 // Asia-Pacific
  if (lng < -60 && lng > -130 && lat > 25 && lat < 50) return 1.1 // North America
  
  return 1.0
}

function isInPoliticallyUnstableRegion(lng: number, lat: number): boolean {
  // Simplified political stability check
  const unstableRegions = [
    { minLng: 35, maxLng: 45, minLat: 12, maxLat: 20 }, // Horn of Africa
    { minLng: 40, maxLng: 65, minLat: 25, maxLat: 35 }, // Middle East
  ]
  
  return unstableRegions.some(region => 
    lng >= region.minLng && lng <= region.maxLng &&
    lat >= region.minLat && lat <= region.maxLat
  )
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = (groups[String(item[key])] ||= [])
    group.push(item)
    return groups
  }, {} as Record<string, T[]>)
}

function calculateMarketShare(competitorsByOperator: Record<string, any[]>, sesStations: any[]) {
  const totalStations = Object.values(competitorsByOperator).flat().length + sesStations.length
  const marketShare: Record<string, number> = {}
  
  for (const [operator, stations] of Object.entries(competitorsByOperator)) {
    marketShare[operator] = (stations.length / totalStations) * 100
  }
  
  marketShare['SES'] = (sesStations.length / totalStations) * 100
  
  return marketShare
}

function identifyCompetitiveThreats(competitors: any[], sesStations: any[]): any[] {
  return competitors
    .filter(comp => {
      // Find competitors close to SES stations
      return sesStations.some(ses => 
        calculateDistance(comp.coordinates, ses.coordinates) < 100
      )
    })
    .map(comp => ({
      operator: comp.operator,
      station: comp.name,
      coordinates: comp.coordinates,
      threatLevel: 'medium', // Simplified
      reason: 'Close proximity to SES facility'
    }))
}

function identifyMarketGaps(competitors: any[], sesStations: any[]): any[] {
  // Simplified gap analysis - areas with low coverage
  const allStations = [...competitors, ...sesStations]
  const coverage = new Map()
  
  // This would be more sophisticated in production
  return [
    { region: 'Arctic Routes', potential: 'high', reason: 'Emerging shipping lanes' },
    { region: 'Southern Ocean', potential: 'medium', reason: 'Limited current coverage' }
  ]
}

function generateCompetitiveRecommendations(threats: any[], opportunities: any[]): string[] {
  const recommendations = []
  
  if (threats.length > 5) {
    recommendations.push('Strengthen competitive positioning in high-threat areas')
  }
  
  if (opportunities.length > 0) {
    recommendations.push(`Explore expansion opportunities in ${opportunities[0].region}`)
  }
  
  recommendations.push('Monitor competitor activities for early threat detection')
  
  return recommendations
}

function calculateTotalMarketSize(sesStations: any[], competitors: any[]): number {
  // Simplified market size calculation
  const totalStations = sesStations.length + competitors.length
  const avgRevenuePerStation = 5000000 // $5M
  return totalStations * avgRevenuePerStation
}

function calculateGrowthTrends() {
  return {
    annualGrowthRate: 0.085, // 8.5%
    trends: [
      'Increasing maritime traffic',
      'Growing demand for connectivity',
      'Expansion into new regions'
    ]
  }
}

function analyzeMarketSegmentation(sesStations: any[], competitors: any[]) {
  return {
    commercial: 0.6,
    government: 0.25,
    maritime: 0.15
  }
}

function generateMarketForecast(currentSize: number, trends: any) {
  const years = [1, 2, 3, 4, 5]
  return years.map(year => ({
    year: new Date().getFullYear() + year,
    projectedSize: currentSize * Math.pow(1 + trends.annualGrowthRate, year),
    confidence: Math.max(0.6, 0.95 - year * 0.05)
  }))
}

function identifyMarketDrivers(): string[] {
  return [
    'Growing maritime commerce',
    'Digitalization of shipping',
    'Regulatory requirements for connectivity',
    'Increasing vessel automation'
  ]
}

function identifyMarketRisks(): string[] {
  return [
    'Economic downturns affecting shipping',
    'Competitive pressure on pricing',
    'Technological disruption',
    'Regulatory changes'
  ]
}