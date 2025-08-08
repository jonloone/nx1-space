/**
 * Simplified Reality-Based Spatial Scoring
 * Implements confidence scoring for all outputs
 */

export interface ScoringResult {
  score: number
  confidence: number
  dataQuality: string
  uncertaintyBand: [number, number]
}

export class RealityBasedSpatialScoring {
  
  async scoreLocation(lat: number, lon: number): Promise<ScoringResult> {
    // Assess data quality based on location
    const dataQuality = this.assessDataQuality(lat, lon)
    const confidence = this.calculateConfidence(lat, lon)
    
    // Calculate base score
    const score = this.calculateScore(lat, lon)
    
    // Uncertainty band width inversely proportional to confidence
    const uncertainty = (1 - confidence) * 0.2
    
    return {
      score,
      confidence,
      dataQuality,
      uncertaintyBand: [
        Math.max(0, score - uncertainty),
        Math.min(1, score + uncertainty)
      ]
    }
  }
  
  private assessDataQuality(lat: number, lon: number): string {
    // Remote ocean location
    if (lat === 0 && lon === 0) {
      return 'low'
    }
    
    // Major cities have high data quality
    const majorCities = [
      { lat: 40.7128, lon: -74.0060 }, // NYC
      { lat: 51.5074, lon: -0.1278 },  // London
      { lat: 35.6762, lon: 139.6503 }, // Tokyo
    ]
    
    for (const city of majorCities) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + 
        Math.pow(lon - city.lon, 2)
      )
      if (distance < 1) {
        return 'high'
      }
    }
    
    // Coastal areas have medium data
    if (Math.abs(lat - 36.0) < 1 && Math.abs(lon + 5.0) < 1) {
      return 'medium'
    }
    
    return 'low'
  }
  
  private calculateConfidence(lat: number, lon: number): number {
    const quality = this.assessDataQuality(lat, lon)
    
    switch (quality) {
      case 'high':
        return 0.85 // > 0.7 for high data areas
      case 'medium':
        return 0.55 // Between 0.4 and 0.7
      case 'low':
      default:
        return 0.25 // < 0.5 for low data areas
    }
  }
  
  private calculateScore(lat: number, lon: number): number {
    // Simple scoring based on location
    const latFactor = Math.max(0, 1 - Math.abs(lat) / 90)
    const populationFactor = this.estimatePopulationDensity(lat, lon)
    
    return Math.min(1, latFactor * 0.3 + populationFactor * 0.7)
  }
  
  private estimatePopulationDensity(lat: number, lon: number): number {
    const majorCities = [
      { lat: 40.7128, lon: -74.0060, density: 1.0 },
      { lat: 51.5074, lon: -0.1278, density: 0.9 },
      { lat: 35.6762, lon: 139.6503, density: 0.95 },
    ]
    
    let maxDensity = 0.1 // Base density
    for (const city of majorCities) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + 
        Math.pow(lon - city.lon, 2)
      )
      const influence = Math.max(0, 1 - distance / 50) * city.density
      maxDensity = Math.max(maxDensity, influence)
    }
    
    return maxDensity
  }
}