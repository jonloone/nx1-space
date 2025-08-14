/**
 * Empirical Station Scoring Service
 * Applies ML-based opportunity scoring to ground stations for Phase 2 visualization
 */

import { GroundStation, groundStationNetwork } from '@/data/groundStations'
import { EmpiricalWeightCalibration } from '@/lib/scoring/empirical-weight-calibration-client'
import { mlOpportunityScorer } from '@/lib/scoring/ml-opportunity-scorer'

export interface ScoredStation extends GroundStation {
  // Empirical scoring results
  empiricalScore: number
  empiricalConfidence: number
  uncertaintyBand: [number, number]
  
  // Visual encoding properties
  visualSize: number        // Based on revenue/importance
  visualColor: string       // Performance-based color
  visualOpacity: number     // Confidence level
  haloIntensity: number    // Emphasis ring strength
  
  // Performance indicators
  performanceCategory: 'profitable' | 'marginal' | 'loss'
  modelAccuracy: number     // How well model predicts this station
}

export class EmpiricalStationScoringService {
  private calibration: EmpiricalWeightCalibration
  private cachedWeights: any = null
  
  constructor() {
    this.calibration = new EmpiricalWeightCalibration()
  }
  
  /**
   * Score all SES/Intelsat stations using empirical weights
   */
  async scoreAllStations(): Promise<ScoredStation[]> {
    // Get empirical weights if not cached
    if (!this.cachedWeights) {
      this.cachedWeights = await this.calibration.calibrateWeights()
    }
    
    // Filter to get only SES/Intelsat stations
    const sesIntelstations = groundStationNetwork.filter(
      s => (s.operator === 'SES' || s.operator === 'Intelsat') && s.isActive
    )
    
    // Score each station
    const scoredStations: ScoredStation[] = []
    
    for (const station of sesIntelstations) {
      const scoredStation = await this.scoreStation(station)
      scoredStations.push(scoredStation)
    }
    
    // Sort by empirical score for importance ranking
    scoredStations.sort((a, b) => b.empiricalScore - a.empiricalScore)
    
    return scoredStations
  }
  
  /**
   * Score individual station with ML scorer combined with empirical data
   */
  private async scoreStation(station: GroundStation): Promise<ScoredStation> {
    // Prepare features for ML scorer based on station characteristics
    const mlFeatures = {
      gdpPerCapita: this.estimateRegionalGDP(station.latitude, station.longitude),
      populationDensity: this.estimatePopulationDensity(station.latitude, station.longitude),
      competitorCount: this.estimateLocalCompetition(station.latitude, station.longitude),
      infrastructureScore: this.calculateInfrastructureScore(station),
      maritimeDensity: this.estimateMaritimeActivity(station.latitude, station.longitude),
      elevation: 100, // Default elevation
      weatherReliability: this.estimateWeatherReliability(station.latitude),
      regulatoryScore: this.estimateRegulatoryEnvironment(station.latitude, station.longitude)
    }
    
    // Get ML-based opportunity score
    const mlResult = mlOpportunityScorer.scoreOpportunity(
      station.latitude, 
      station.longitude, 
      mlFeatures
    )
    
    // Also get traditional empirical score for comparison
    const stationData = {
      id: station.id,
      name: station.name,
      lat: station.latitude,
      lon: station.longitude,
      profitable: station.margin > 0.15,
      operational: station.isActive,
      margin: station.margin,
      utilization: station.utilization,
      antennaSize: station.antennaCount ? station.antennaCount * 3.5 : 7,
      frequency: station.frequencyBands?.[0] || 'Ku-band',
      capabilities: station.certifications || []
    }
    
    const empiricalResult = await this.calibration.scoreWithConfidence(
      stationData,
      this.cachedWeights.weights
    )
    
    // Combine ML and empirical scores with weighted average
    const mlWeight = mlResult.confidence
    const empiricalWeight = 1 - mlWeight
    const combinedScore = (mlResult.score / 100 * mlWeight) + (empiricalResult.score * empiricalWeight)
    
    const scoreResult = {
      score: combinedScore,
      confidence: Math.max(mlResult.confidence, empiricalResult.confidence),
      uncertaintyBand: empiricalResult.uncertaintyBand
    }
    
    // Determine performance category based on margin
    let performanceCategory: 'profitable' | 'marginal' | 'loss'
    if (station.margin >= 0.25) {
      performanceCategory = 'profitable'
    } else if (station.margin >= 0.10) {
      performanceCategory = 'marginal'
    } else {
      performanceCategory = 'loss'
    }
    
    // Calculate visual properties
    const visualSize = this.calculateVisualSize(station)
    const visualColor = this.calculateVisualColor(performanceCategory, station.margin)
    const visualOpacity = this.calculateVisualOpacity(scoreResult.confidence)
    const haloIntensity = this.calculateHaloIntensity(station, scoreResult.score)
    
    // Calculate model accuracy for this station
    const modelAccuracy = this.calculateModelAccuracy(
      scoreResult.score,
      station.margin,
      performanceCategory
    )
    
    return {
      ...station,
      empiricalScore: scoreResult.score,
      empiricalConfidence: scoreResult.confidence,
      uncertaintyBand: scoreResult.uncertaintyBand,
      visualSize,
      visualColor,
      visualOpacity,
      haloIntensity,
      performanceCategory,
      modelAccuracy
    }
  }
  
  /**
   * Calculate visual size based on revenue/importance
   */
  private calculateVisualSize(station: GroundStation): number {
    // Size range: 20-100 based on revenue
    const maxRevenue = 60 // millions
    const minSize = 20
    const maxSize = 100
    
    const normalizedRevenue = Math.min(station.revenue / maxRevenue, 1)
    return minSize + (maxSize - minSize) * Math.sqrt(normalizedRevenue)
  }
  
  /**
   * Calculate performance-based color
   */
  private calculateVisualColor(category: string, margin: number): string {
    switch (category) {
      case 'profitable':
        // Green gradient based on margin strength
        if (margin >= 0.30) return '#10b981' // Emerald-500
        if (margin >= 0.25) return '#22c55e' // Green-500
        return '#4ade80' // Green-400
        
      case 'marginal':
        // Yellow/amber gradient
        if (margin >= 0.15) return '#f59e0b' // Amber-500
        return '#fbbf24' // Yellow-400
        
      case 'loss':
        // Red gradient based on loss severity
        if (margin <= 0) return '#dc2626' // Red-600
        if (margin <= 0.05) return '#ef4444' // Red-500
        return '#f87171' // Red-400
        
      default:
        return '#6b7280' // Gray-500
    }
  }
  
  /**
   * Calculate opacity based on confidence level
   */
  private calculateVisualOpacity(confidence: number): number {
    // Map confidence (0-1) to opacity (0.4-1.0)
    return 0.4 + (confidence * 0.6)
  }
  
  /**
   * Calculate halo intensity for emphasis
   */
  private calculateHaloIntensity(station: GroundStation, score: number): number {
    // Higher intensity for critical stations
    let intensity = 0
    
    // High utilization stations get emphasis
    if (station.utilization > 85) intensity += 0.3
    
    // High margin stations get emphasis  
    if (station.margin > 0.25) intensity += 0.3
    
    // High score stations get emphasis
    if (score > 0.8) intensity += 0.4
    
    return Math.min(intensity, 1)
  }
  
  /**
   * Calculate how accurately the model predicts this station's performance
   */
  private calculateModelAccuracy(
    empiricalScore: number,
    actualMargin: number,
    category: string
  ): number {
    // Model should predict high scores for profitable stations
    if (category === 'profitable') {
      if (empiricalScore > 0.7) return 1.0 // Perfect prediction
      if (empiricalScore > 0.5) return 0.7 // Good prediction
      return 0.3 // Poor prediction
    }
    
    // Model should predict medium scores for marginal stations
    if (category === 'marginal') {
      if (empiricalScore >= 0.4 && empiricalScore <= 0.6) return 1.0
      if (empiricalScore >= 0.3 && empiricalScore <= 0.7) return 0.7
      return 0.3
    }
    
    // Model should predict low scores for loss-making stations
    if (category === 'loss') {
      if (empiricalScore < 0.3) return 1.0
      if (empiricalScore < 0.5) return 0.7
      return 0.3
    }
    
    return 0.5 // Default
  }
  
  /**
   * Get validation metrics for the empirical model
   */
  async getValidationMetrics(): Promise<{
    overallAccuracy: number
    profitablePrecision: number
    profitableRecall: number
    marginalPrecision: number
    marginalRecall: number
    lossPrecision: number
    lossRecall: number
    confidenceDistribution: { low: number, medium: number, high: number }
  }> {
    const stations = await this.scoreAllStations()
    
    // Calculate accuracy metrics
    let correctPredictions = 0
    let profitableTP = 0, profitableFP = 0, profitableFN = 0
    let marginalTP = 0, marginalFP = 0, marginalFN = 0
    let lossTP = 0, lossFP = 0, lossFN = 0
    
    let lowConfidence = 0, mediumConfidence = 0, highConfidence = 0
    
    for (const station of stations) {
      // Check if model prediction aligns with actual performance
      const predictedCategory = this.getPredictedCategory(station.empiricalScore)
      const actualCategory = station.performanceCategory
      
      if (predictedCategory === actualCategory) {
        correctPredictions++
      }
      
      // Track precision/recall for each category
      if (actualCategory === 'profitable') {
        if (predictedCategory === 'profitable') profitableTP++
        else profitableFN++
      } else {
        if (predictedCategory === 'profitable') profitableFP++
      }
      
      if (actualCategory === 'marginal') {
        if (predictedCategory === 'marginal') marginalTP++
        else marginalFN++
      } else {
        if (predictedCategory === 'marginal') marginalFP++
      }
      
      if (actualCategory === 'loss') {
        if (predictedCategory === 'loss') lossTP++
        else lossFN++
      } else {
        if (predictedCategory === 'loss') lossFP++
      }
      
      // Track confidence distribution
      if (station.empiricalConfidence < 0.4) lowConfidence++
      else if (station.empiricalConfidence < 0.7) mediumConfidence++
      else highConfidence++
    }
    
    const total = stations.length
    
    return {
      overallAccuracy: (correctPredictions / total) * 100,
      profitablePrecision: profitableTP / (profitableTP + profitableFP) || 0,
      profitableRecall: profitableTP / (profitableTP + profitableFN) || 0,
      marginalPrecision: marginalTP / (marginalTP + marginalFP) || 0,
      marginalRecall: marginalTP / (marginalTP + marginalFN) || 0,
      lossPrecision: lossTP / (lossTP + lossFP) || 0,
      lossRecall: lossTP / (lossTP + lossFN) || 0,
      confidenceDistribution: {
        low: (lowConfidence / total) * 100,
        medium: (mediumConfidence / total) * 100,
        high: (highConfidence / total) * 100
      }
    }
  }
  
  /**
   * Get predicted category based on empirical score
   */
  private getPredictedCategory(score: number): 'profitable' | 'marginal' | 'loss' {
    if (score >= 0.6) return 'profitable'
    if (score >= 0.4) return 'marginal'
    return 'loss'
  }
  
  /**
   * Estimate regional GDP per capita for ML features
   */
  private estimateRegionalGDP(lat: number, lon: number): number {
    // Simplified GDP estimation based on geographic regions
    // US/Canada
    if (lat > 25 && lat < 70 && lon > -170 && lon < -50) return 60000
    // Western Europe
    if (lat > 35 && lat < 70 && lon > -10 && lon < 30) return 50000
    // Japan/South Korea
    if (lat > 30 && lat < 50 && lon > 125 && lon < 145) return 40000
    // Australia/New Zealand
    if (lat > -50 && lat < -10 && lon > 110 && lon < 180) return 45000
    // Singapore/Hong Kong
    if (Math.abs(lat - 1.3) < 5 && Math.abs(lon - 103.8) < 5) return 70000
    if (Math.abs(lat - 22.3) < 5 && Math.abs(lon - 114.2) < 5) return 55000
    // Default for other regions
    return 25000
  }
  
  /**
   * Estimate population density for ML features
   */
  private estimatePopulationDensity(lat: number, lon: number): number {
    // Major urban areas get higher density estimates
    const urbanCenters = [
      { lat: 40.7, lon: -74.0, density: 1200 }, // NYC
      { lat: 51.5, lon: -0.1, density: 1000 },  // London
      { lat: 35.7, lon: 139.7, density: 1500 }, // Tokyo
      { lat: 1.3, lon: 103.8, density: 800 },   // Singapore
    ]
    
    for (const center of urbanCenters) {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lon - center.lon, 2)
      )
      if (distance < 2) { // Within ~200km
        return center.density * (1 - distance / 2)
      }
    }
    
    return 100 // Default rural density
  }
  
  /**
   * Estimate local competition for ML features
   */
  private estimateLocalCompetition(lat: number, lon: number): number {
    // Higher competition in developed regions
    if (lat > 35 && lat < 70 && lon > -10 && lon < 30) return 5 // Europe
    if (lat > 25 && lat < 50 && lon > -125 && lon < -65) return 4 // US
    if (lat > 30 && lat < 50 && lon > 125 && lon < 145) return 3 // Japan
    return 2 // Default
  }
  
  /**
   * Calculate infrastructure score based on station characteristics
   */
  private calculateInfrastructureScore(station: GroundStation): number {
    let score = 0.5 // Base score
    
    if (station.antennaCount && station.antennaCount > 3) score += 0.2
    if (station.frequencyBands && station.frequencyBands.length > 1) score += 0.1
    if (station.certifications && station.certifications.length > 2) score += 0.1
    if (station.utilization > 80) score += 0.1
    
    return Math.min(score, 1.0)
  }
  
  /**
   * Estimate maritime activity for ML features
   */
  private estimateMaritimeActivity(lat: number, lon: number): number {
    // Coastal regions get higher maritime scores
    const coastalProximity = this.estimateCoastalProximity(lat, lon)
    return coastalProximity * 50 // Scale to typical maritime density values
  }
  
  /**
   * Estimate coastal proximity (simplified)
   */
  private estimateCoastalProximity(lat: number, lon: number): number {
    // Very simplified - in production would use actual coastline data
    const majorCoastalAreas = [
      { lat: 40.7, lon: -74.0 }, // US East Coast
      { lat: 34.0, lon: -118.0 }, // US West Coast
      { lat: 51.5, lon: -0.1 }, // UK
      { lat: 1.3, lon: 103.8 }, // Singapore
    ]
    
    for (const coast of majorCoastalAreas) {
      const distance = Math.sqrt(
        Math.pow(lat - coast.lat, 2) + Math.pow(lon - coast.lon, 2)
      )
      if (distance < 5) {
        return 1 - distance / 5
      }
    }
    return 0.1
  }
  
  /**
   * Estimate weather reliability based on latitude
   */
  private estimateWeatherReliability(lat: number): number {
    const absLat = Math.abs(lat)
    if (absLat < 10) return 0.75 // Equatorial - frequent storms
    if (absLat < 23.5) return 0.80 // Tropical
    if (absLat < 40) return 0.90 // Subtropical
    if (absLat < 60) return 0.95 // Temperate
    return 0.85 // Polar regions
  }
  
  /**
   * Estimate regulatory environment
   */
  private estimateRegulatoryEnvironment(lat: number, lon: number): number {
    // Developed countries generally have more stable regulatory environments
    // US/Canada
    if (lat > 25 && lat < 70 && lon > -170 && lon < -50) return 0.90
    // Western Europe
    if (lat > 35 && lat < 70 && lon > -10 && lon < 30) return 0.85
    // Japan/South Korea/Australia
    if ((lat > 30 && lat < 50 && lon > 125 && lon < 145) || 
        (lat > -50 && lat < -10 && lon > 110 && lon < 180)) return 0.80
    // Singapore
    if (Math.abs(lat - 1.3) < 5 && Math.abs(lon - 103.8) < 5) return 0.95
    // Default
    return 0.70
  }
}

// Export singleton instance
export const empiricalStationScoring = new EmpiricalStationScoringService()
export { EmpiricalStationScoringService as EmpiricalStationScoring }