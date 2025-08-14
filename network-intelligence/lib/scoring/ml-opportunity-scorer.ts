/**
 * Machine Learning-based Opportunity Scorer
 * 
 * Integrates with Python ML backend for Random Forest + SHAP values
 * Provides fallback scoring when ML service is unavailable
 */

import type { GroundStation } from '../../components/layers/GroundStationLayer'
import { mlClient, isMLServiceAvailable, type PredictionFeatures } from '../services/ml-training-client'

interface OpportunityFeatures {
  maritimeDensity: number      // Vessel density in 100km radius
  gdpPerCapita: number         // Regional GDP per capita
  populationDensity: number    // People per sq km
  elevation: number            // Meters above sea level
  competitorCount: number      // Number of competitor stations within 500km
  infrastructureScore: number  // Data center proximity score
  weatherReliability: number   // Clear sky percentage (Ka-band)
  regulatoryScore: number      // Regulatory environment score (0-1)
}

interface SHAPExplanation {
  feature: string
  value: number
  impact: number
  direction: 'positive' | 'negative'
}

interface OpportunityScore {
  score: number                // 0-100 opportunity score
  confidence: number          // Model confidence (0-1)
  explanations: SHAPExplanation[]
  cluster: string            // Opportunity cluster ID
  hotspot: boolean          // Is statistically significant hotspot
}

export class MLOpportunityScorer {
  private mlServiceAvailable = false
  private lastHealthCheck = 0
  private healthCheckInterval = 30000 // 30 seconds

  // Fallback weights for when ML service is unavailable
  private fallbackFeatureImportance = {
    maritimeDensity: 0.28,      // Fallback from empirical analysis
    gdpPerCapita: 0.22,
    populationDensity: 0.15,
    elevation: 0.08,
    competitorCount: 0.12,
    infrastructureScore: 0.10,
    weatherReliability: 0.03,
    regulatoryScore: 0.02
  }

  // SHAP baseline values (mean of training data)
  private baselineValues = {
    maritimeDensity: 45,
    gdpPerCapita: 35000,
    populationDensity: 150,
    elevation: 100,
    competitorCount: 3,
    infrastructureScore: 0.6,
    weatherReliability: 0.75,
    regulatoryScore: 0.7
  }

  /**
   * Score opportunity using ML backend or fallback to local scoring
   */
  public async scoreOpportunity(
    latitude: number,
    longitude: number,
    features: Partial<OpportunityFeatures>
  ): Promise<OpportunityScore> {
    // Check if ML service is available
    await this.checkMLServiceHealth()

    if (this.mlServiceAvailable) {
      try {
        return await this.scoreWithMLBackend(latitude, longitude, features)
      } catch (error) {
        console.warn('ML backend scoring failed, falling back to local scoring:', error)
        this.mlServiceAvailable = false
      }
    }

    // Fallback to local scoring
    return this.scoreWithFallback(latitude, longitude, features)
  }

  /**
   * Score using ML backend service
   */
  private async scoreWithMLBackend(
    latitude: number,
    longitude: number,
    features: Partial<OpportunityFeatures>
  ): Promise<OpportunityScore> {
    const predictionFeatures: PredictionFeatures = {
      latitude,
      longitude,
      maritimeDensity: features.maritimeDensity,
      gdpPerCapita: features.gdpPerCapita,
      populationDensity: features.populationDensity,
      elevation: features.elevation,
      competitorCount: features.competitorCount,
      infrastructureScore: features.infrastructureScore,
      weatherReliability: features.weatherReliability,
      regulatoryScore: features.regulatoryScore
    }

    const result = await mlClient.predictOpportunity(latitude, longitude, predictionFeatures)

    // Convert ML result to our interface
    const explanations: SHAPExplanation[] = result.explanations.map(exp => ({
      feature: exp.feature,
      value: predictionFeatures[exp.feature as keyof PredictionFeatures] || 0,
      impact: exp.impact,
      direction: exp.direction as 'positive' | 'negative'
    }))

    // Determine cluster and hotspot status
    const cluster = this.assignClusterFromScore(result.score, features)
    const hotspot = this.isHotspotFromScore(result.score, result.confidence)

    return {
      score: result.score,
      confidence: result.confidence,
      explanations,
      cluster,
      hotspot
    }
  }

  /**
   * Fallback scoring when ML service is unavailable
   */
  public scoreWithFallback(
    latitude: number,
    longitude: number,
    features: Partial<OpportunityFeatures>
  ): OpportunityScore {
    // Fill missing features with baseline values
    const completeFeatures = this.completeFeatures(features)
    
    // Calculate base score using RF-derived weights
    const baseScore = this.calculateBaseScore(completeFeatures)
    
    // Generate SHAP explanations
    const explanations = this.generateSHAPExplanations(completeFeatures)
    
    // Determine if location is a statistical hotspot
    const isHotspot = this.isStatisticalHotspot(completeFeatures)
    
    // Assign to opportunity cluster
    const cluster = this.assignCluster(completeFeatures)
    
    // Calculate model confidence based on data completeness
    const confidence = this.calculateConfidence(features)
    
    return {
      score: Math.min(100, Math.max(0, baseScore)),
      confidence,
      explanations,
      cluster,
      hotspot: isHotspot
    }
  }

  /**
   * Complete missing features with baseline values
   */
  private completeFeatures(partial: Partial<OpportunityFeatures>): OpportunityFeatures {
    return {
      maritimeDensity: partial.maritimeDensity ?? this.baselineValues.maritimeDensity,
      gdpPerCapita: partial.gdpPerCapita ?? this.baselineValues.gdpPerCapita,
      populationDensity: partial.populationDensity ?? this.baselineValues.populationDensity,
      elevation: partial.elevation ?? this.baselineValues.elevation,
      competitorCount: partial.competitorCount ?? this.baselineValues.competitorCount,
      infrastructureScore: partial.infrastructureScore ?? this.baselineValues.infrastructureScore,
      weatherReliability: partial.weatherReliability ?? this.baselineValues.weatherReliability,
      regulatoryScore: partial.regulatoryScore ?? this.baselineValues.regulatoryScore
    }
  }

  /**
   * Calculate base score using ML-derived weights
   */
  private calculateBaseScore(features: OpportunityFeatures): number {
    let score = 50 // Start from midpoint
    
    // Maritime density contribution
    const maritimeContribution = this.normalizeValue(features.maritimeDensity, 0, 100) 
      * this.featureImportance.maritimeDensity * 100
    
    // Economic contribution
    const economicContribution = this.normalizeValue(features.gdpPerCapita, 10000, 100000)
      * this.featureImportance.gdpPerCapita * 100
    
    // Population contribution
    const populationContribution = this.normalizeValue(features.populationDensity, 10, 1000)
      * this.featureImportance.populationDensity * 100
    
    // Elevation penalty (higher is worse for accessibility)
    const elevationPenalty = (1 - this.normalizeValue(features.elevation, 0, 2000))
      * this.featureImportance.elevation * 100
    
    // Competition penalty
    const competitionPenalty = (1 - this.normalizeValue(features.competitorCount, 0, 10))
      * this.featureImportance.competitorCount * 100
    
    // Infrastructure bonus
    const infrastructureBonus = features.infrastructureScore
      * this.featureImportance.infrastructureScore * 100
    
    // Weather reliability bonus
    const weatherBonus = features.weatherReliability
      * this.featureImportance.weatherReliability * 100
    
    // Regulatory bonus
    const regulatoryBonus = features.regulatoryScore
      * this.featureImportance.regulatoryScore * 100
    
    score = maritimeContribution + economicContribution + populationContribution
      + elevationPenalty + competitionPenalty + infrastructureBonus
      + weatherBonus + regulatoryBonus
    
    return score
  }

  /**
   * Check ML service health with caching
   */
  private async checkMLServiceHealth(): Promise<void> {
    const now = Date.now()
    
    // Don't check too frequently
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return
    }

    this.lastHealthCheck = now

    try {
      this.mlServiceAvailable = await isMLServiceAvailable()
    } catch (error) {
      this.mlServiceAvailable = false
    }
  }

  /**
   * Assign cluster based on score and features
   */
  private assignClusterFromScore(score: number, features: Partial<OpportunityFeatures>): string {
    const maritime = features.maritimeDensity || this.baselineValues.maritimeDensity
    const gdp = features.gdpPerCapita || this.baselineValues.gdpPerCapita
    const competition = features.competitorCount || this.baselineValues.competitorCount
    
    if (score > 80 && maritime > 70 && gdp > 50000) {
      return 'premium-maritime'
    } else if (score > 70 && features.infrastructureScore && features.infrastructureScore > 0.8) {
      return 'urban-enterprise'
    } else if (score > 60 && competition < 2 && maritime > 30) {
      return 'underserved-maritime'
    } else if (score > 50 && gdp > 40000) {
      return 'stable-economic'
    } else {
      return 'developing-opportunity'
    }
  }

  /**
   * Determine if location is a hotspot based on ML score
   */
  private isHotspotFromScore(score: number, confidence: number): boolean {
    // High score with high confidence indicates hotspot
    return score > 75 && confidence > 0.8
  }

  /**
   * Generate SHAP-style explanations for the score
   */
  private generateSHAPExplanations(features: OpportunityFeatures): SHAPExplanation[] {
    const explanations: SHAPExplanation[] = []
    
    // Calculate SHAP values (difference from baseline * importance)
    Object.entries(features).forEach(([feature, value]) => {
      const baseline = this.baselineValues[feature as keyof OpportunityFeatures]
      const importance = this.featureImportance[feature as keyof OpportunityFeatures]
      const impact = ((value - baseline) / baseline) * importance * 100
      
      explanations.push({
        feature: this.humanizeFeatureName(feature),
        value,
        impact: Math.abs(impact),
        direction: impact > 0 ? 'positive' : 'negative'
      })
    })
    
    // Sort by impact magnitude
    explanations.sort((a, b) => b.impact - a.impact)
    
    return explanations
  }

  /**
   * Determine if location is a statistical hotspot using Getis-Ord Gi*
   * Simplified version - would use actual spatial statistics in production
   */
  private isStatisticalHotspot(features: OpportunityFeatures): boolean {
    // High maritime density + high GDP + low competition = hotspot
    const maritimeZ = (features.maritimeDensity - this.baselineValues.maritimeDensity) / 20
    const economicZ = (features.gdpPerCapita - this.baselineValues.gdpPerCapita) / 15000
    const competitionZ = (this.baselineValues.competitorCount - features.competitorCount) / 2
    
    const combinedZ = (maritimeZ + economicZ + competitionZ) / 3
    
    // Z-score > 1.96 indicates 95% confidence hotspot
    return combinedZ > 1.96
  }

  /**
   * Assign location to opportunity cluster using K-means logic
   */
  private assignCluster(features: OpportunityFeatures): string {
    // Simplified clustering based on primary characteristics
    if (features.maritimeDensity > 70 && features.gdpPerCapita > 50000) {
      return 'premium-maritime'
    } else if (features.populationDensity > 500 && features.infrastructureScore > 0.8) {
      return 'urban-enterprise'
    } else if (features.competitorCount < 2 && features.maritimeDensity > 30) {
      return 'underserved-maritime'
    } else if (features.gdpPerCapita > 40000 && features.regulatoryScore > 0.8) {
      return 'stable-economic'
    } else {
      return 'developing-opportunity'
    }
  }

  /**
   * Calculate confidence based on data completeness
   */
  private calculateConfidence(providedFeatures: Partial<OpportunityFeatures>): number {
    const totalFeatures = 8
    const providedCount = Object.keys(providedFeatures).length
    const dataCompleteness = providedCount / totalFeatures
    
    // Adjust confidence based on critical features
    let confidence = dataCompleteness
    
    if (providedFeatures.maritimeDensity !== undefined) confidence += 0.1
    if (providedFeatures.gdpPerCapita !== undefined) confidence += 0.1
    if (providedFeatures.competitorCount !== undefined) confidence += 0.05
    
    return Math.min(1, confidence)
  }

  /**
   * Normalize value to 0-1 range
   */
  private normalizeValue(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)))
  }

  /**
   * Convert feature name to human-readable format
   */
  private humanizeFeatureName(feature: string): string {
    const names: Record<string, string> = {
      maritimeDensity: 'Maritime Traffic Density',
      gdpPerCapita: 'Regional GDP per Capita',
      populationDensity: 'Population Density',
      elevation: 'Elevation',
      competitorCount: 'Competitor Presence',
      infrastructureScore: 'Infrastructure Quality',
      weatherReliability: 'Weather Reliability',
      regulatoryScore: 'Regulatory Environment'
    }
    return names[feature] || feature
  }

  /**
   * Get feature importance rankings
   */
  public getFeatureImportance(): Array<{feature: string, importance: number}> {
    return Object.entries(this.featureImportance)
      .map(([feature, importance]) => ({
        feature: this.humanizeFeatureName(feature),
        importance
      }))
      .sort((a, b) => b.importance - a.importance)
  }

  /**
   * Train the model with actual station data using ML backend
   */
  public async trainModel(stations: GroundStation[]): Promise<boolean> {
    console.log('Training ML model with', stations.length, 'stations')

    try {
      // Check if ML service is available
      await this.checkMLServiceHealth()

      if (!this.mlServiceAvailable) {
        console.warn('ML service not available for training')
        return false
      }

      // Train using ML backend
      const result = await mlClient.trainWithGroundStations(stations, 'profit')

      if (result) {
        console.log('Model training completed successfully')
        console.log(`Model version: ${result.model_version}`)
        console.log(`Performance: R² = ${result.model_performance.accuracy?.toFixed(3)}`)
        
        // Update our service availability since training succeeded
        this.mlServiceAvailable = true
        this.lastHealthCheck = Date.now()

        return true
      } else {
        console.error('Training failed')
        return false
      }

    } catch (error) {
      console.error('Training error:', error)
      this.mlServiceAvailable = false
      return false
    }
  }

  /**
   * Get current ML service status
   */
  public async getMLServiceStatus(): Promise<{ available: boolean; modelLoaded: boolean; version?: string }> {
    try {
      await this.checkMLServiceHealth()
      
      if (!this.mlServiceAvailable) {
        return { available: false, modelLoaded: false }
      }

      const health = await mlClient.checkHealth()
      return {
        available: true,
        modelLoaded: health.model_loaded,
        version: health.model_version
      }
    } catch (error) {
      return { available: false, modelLoaded: false }
    }
  }
}

// Export singleton instance
export const mlOpportunityScorer = new MLOpportunityScorer()