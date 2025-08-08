/**
 * Market Scorer with Confidence
 * Scores locations based on market factors
 */

export interface MarketScoringResult {
  score: number
  confidence: number
  factors: {
    market: number
    economic: number
    population: number
    infrastructure: number
  }
}

export class MarketScorer {
  
  async score(location: { lat: number, lon: number }): Promise<MarketScoringResult> {
    const factors = this.calculateMarketFactors(location.lat, location.lon)
    const confidence = this.calculateConfidence(location.lat, location.lon)
    
    // Weighted average of factors
    const score = (
      factors.market * 0.35 +
      factors.economic * 0.25 +
      factors.population * 0.25 +
      factors.infrastructure * 0.15
    )
    
    return {
      score: Math.min(1, Math.max(0, score)),
      confidence,
      factors
    }
  }
  
  private calculateMarketFactors(lat: number, lon: number): any {
    const marketActivity = this.assessMarketActivity(lat, lon)
    const economicStrength = this.assessEconomicStrength(lat, lon)
    const populationDensity = this.estimatePopulationDensity(lat, lon)
    const infrastructure = this.assessInfrastructure(lat, lon)
    
    return {
      market: marketActivity,
      economic: economicStrength,
      population: populationDensity,
      infrastructure
    }
  }
  
  private calculateConfidence(lat: number, lon: number): number {
    // Major economic centers have high confidence data
    const economicCenters = [
      { lat: 40.7128, lon: -74.0060 },  // NYC
      { lat: 51.5074, lon: -0.1278 },   // London
      { lat: 35.6762, lon: 139.6503 },  // Tokyo
      { lat: 1.3521, lon: 103.8198 },   // Singapore
    ]
    
    let maxConfidence = 0.3 // Base confidence
    
    for (const center of economicCenters) {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + 
        Math.pow(lon - center.lon, 2)
      )
      
      if (distance < 5) {
        maxConfidence = Math.max(maxConfidence, 0.9 - distance * 0.1)
      }
    }
    
    return Math.min(1, Math.max(0, maxConfidence))
  }
  
  private assessMarketActivity(lat: number, lon: number): number {
    // Simplified market activity assessment
    if (Math.abs(lat - 40.7) < 1 && Math.abs(lon + 74) < 1) return 0.95 // NYC
    if (Math.abs(lat - 51.5) < 1 && Math.abs(lon) < 1) return 0.9 // London
    if (Math.abs(lat - 35.7) < 1 && Math.abs(lon - 139.7) < 1) return 0.92 // Tokyo
    
    return 0.4 // Default market activity
  }
  
  private assessEconomicStrength(lat: number, lon: number): number {
    // GDP-weighted regions
    if (lat > 25 && lat < 50 && lon > -130 && lon < -60) return 0.9  // US
    if (lat > 35 && lat < 70 && lon > -10 && lon < 40) return 0.85  // Europe
    if (lat > -10 && lat < 40 && lon > 95 && lon < 145) return 0.8  // East Asia
    
    return 0.4 // Default economic strength
  }
  
  private estimatePopulationDensity(lat: number, lon: number): number {
    const majorCities = [
      { lat: 40.7128, lon: -74.0060, density: 1.0 },
      { lat: 51.5074, lon: -0.1278, density: 0.9 },
      { lat: 35.6762, lon: 139.6503, density: 0.95 },
      { lat: 1.3521, lon: 103.8198, density: 0.9 },
      { lat: 19.0760, lon: 72.8777, density: 0.85 }, // Mumbai
      { lat: -23.5505, lon: -46.6333, density: 0.8 }, // São Paulo
    ]
    
    let maxDensity = 0.1
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
  
  private assessInfrastructure(lat: number, lon: number): number {
    // Developed regions have better infrastructure
    if (lat > 35 && lat < 55 && lon > -130 && lon < -70) return 0.95  // US East Coast
    if (lat > 45 && lat < 60 && lon > -5 && lon < 20) return 0.9     // Northern Europe
    if (lat > 30 && lat < 40 && lon > 130 && lon < 145) return 0.88  // Japan
    if (lat > -35 && lat < -30 && lon > 150 && lon < 155) return 0.85 // Sydney
    
    return 0.5 // Default infrastructure
  }
}