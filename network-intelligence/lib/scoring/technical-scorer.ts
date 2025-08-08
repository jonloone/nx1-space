/**
 * Technical Scorer with Confidence
 * Scores locations based on technical factors like orbital mechanics
 */

export interface TechnicalScoringResult {
  score: number
  confidence: number
  factors: {
    orbital: number
    weather: number
    terrain: number
    latitudeFactor: number
  }
}

export class TechnicalScorer {
  
  async score(location: { lat: number, lon: number }): Promise<TechnicalScoringResult> {
    const factors = this.calculateTechnicalFactors(location.lat, location.lon)
    const confidence = this.calculateConfidence(location.lat, location.lon)
    
    // Weighted average of technical factors
    const score = (
      factors.orbital * 0.4 +
      factors.weather * 0.2 +
      factors.terrain * 0.2 +
      factors.latitudeFactor * 0.2
    )
    
    return {
      score: Math.min(1, Math.max(0, score)),
      confidence,
      factors
    }
  }
  
  private calculateTechnicalFactors(lat: number, lon: number): any {
    const absLat = Math.abs(lat)
    
    return {
      orbital: this.calculateOrbitalScore(absLat),
      weather: this.calculateWeatherScore(absLat),
      terrain: this.calculateTerrainScore(lat, lon),
      latitudeFactor: this.calculateLatitudeFactor(absLat)
    }
  }
  
  private calculateConfidence(lat: number, lon: number): number {
    // Confidence based on data availability and location
    const absLat = Math.abs(lat)
    
    // Well-studied regions have higher confidence
    if (absLat < 60) {
      // Temperate and tropical zones - good data
      return 0.75 + (60 - absLat) / 60 * 0.15
    } else {
      // Polar regions - less data
      return 0.4 + (90 - absLat) / 30 * 0.2
    }
  }
  
  private calculateOrbitalScore(absLat: number): number {
    // Better orbital access near equator for most satellites
    const equatorialBonus = (90 - absLat) / 90
    
    // LEO satellites provide good coverage at all latitudes
    const leoFactor = 0.3
    
    // MEO/GEO better at lower latitudes
    const geoFactor = equatorialBonus * 0.7
    
    return leoFactor + geoFactor
  }
  
  private calculateWeatherScore(absLat: number): number {
    // Weather reliability by latitude
    if (absLat < 23.5) {
      // Tropical - more weather issues
      return 0.6
    } else if (absLat < 35) {
      // Subtropical - good weather
      return 0.85
    } else if (absLat < 60) {
      // Temperate - variable weather
      return 0.75
    } else {
      // Polar - harsh conditions
      return 0.5
    }
  }
  
  private calculateTerrainScore(lat: number, lon: number): number {
    // Simplified terrain assessment
    // Coastal and flat areas are better
    
    // Known good locations
    const goodLocations = [
      { lat: 38.75, lon: -77.48, score: 0.95 },  // Manassas VA - flat
      { lat: 36.14, lon: -5.35, score: 0.9 },    // Gibraltar - strategic
      { lat: 1.35, lon: 103.82, score: 0.88 },   // Singapore - developed
    ]
    
    for (const loc of goodLocations) {
      const distance = Math.sqrt(
        Math.pow(lat - loc.lat, 2) + 
        Math.pow(lon - loc.lon, 2)
      )
      if (distance < 2) {
        return loc.score
      }
    }
    
    // Mountain regions are challenging
    if (lat > 25 && lat < 45 && lon > -110 && lon < -100) return 0.4 // Rocky Mountains
    if (lat > 27 && lat < 35 && lon > 75 && lon < 95) return 0.3 // Himalayas
    
    return 0.7 // Default terrain score
  }
  
  private calculateLatitudeFactor(absLat: number): number {
    // Optimal latitudes for ground stations
    if (absLat < 10) return 0.95  // Equatorial - excellent for GEO
    if (absLat < 30) return 0.9   // Low latitude - very good
    if (absLat < 45) return 0.85  // Mid latitude - good
    if (absLat < 60) return 0.7   // High latitude - acceptable
    if (absLat < 70) return 0.5   // Arctic/Antarctic - challenging
    return 0.3 // Extreme polar
  }
}