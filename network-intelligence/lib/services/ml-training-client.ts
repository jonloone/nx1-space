/**
 * ML Training Client for Network Intelligence
 * 
 * TypeScript client for the Python ML backend service.
 * Handles training Random Forest models and getting predictions with SHAP explanations.
 */

import type { GroundStation } from '../../data/groundStations'

// Types matching the Python backend API

export interface TrainingRequest {
  stations: GroundStation[]
  target_metric?: 'profit' | 'revenue' | 'utilization' | 'margin'
  model_version?: string
  hyperparameters?: Record<string, any>
}

export interface PredictionFeatures {
  latitude: number
  longitude: number
  maritimeDensity?: number
  gdpPerCapita?: number
  populationDensity?: number
  elevation?: number
  competitorCount?: number
  infrastructureScore?: number
  weatherReliability?: number
  regulatoryScore?: number
}

export interface SHAPExplanation {
  feature: string
  value: number
  shap_value: number
  baseline_value: number
  impact_direction: 'positive' | 'negative' | 'neutral'
}

export interface PredictionResponse {
  prediction: number
  confidence_interval: [number, number]
  model_confidence: number
  shap_explanations: SHAPExplanation[]
  feature_importance_rank: Record<string, number>
  model_version: string
  prediction_timestamp: string
}

export interface TrainingResponse {
  model_version: string
  training_metrics: Record<string, number>
  feature_importance: Record<string, number>
  cross_validation_scores: number[]
  model_performance: Record<string, number>
  shap_baseline_values: Record<string, number>
  training_timestamp: string
  training_duration_seconds: number
}

export interface ModelInfo {
  model_version: string
  target_name: string
  feature_names: string[]
  n_features: number
  training_timestamp: string
  training_metrics: Record<string, number>
  feature_importance: Record<string, number>
  shap_baseline_values: Record<string, number>
  model_type: string
  is_trained: boolean
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  model_version?: string
  uptime_seconds: number
  memory_usage_mb: number
}

export class MLTrainingClient {
  private baseUrl: string
  private timeout: number
  
  constructor(baseUrl: string = 'http://localhost:8000', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = timeout
  }

  /**
   * Check if the ML service is healthy and responsive
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await this.makeRequest<HealthResponse>('GET', '/health')
    return response
  }

  /**
   * Train a new Random Forest model with ground station data
   */
  async trainModel(request: TrainingRequest): Promise<TrainingResponse> {
    console.log(`Training ML model with ${request.stations.length} stations...`)
    
    // Validate request
    if (request.stations.length < 10) {
      throw new Error('Need at least 10 stations for reliable training')
    }

    // Ensure all required fields are present
    const validatedStations = request.stations.map(station => ({
      ...station,
      utilization: station.utilization ?? 70,
      revenue: station.revenue ?? 40,
      profit: station.profit ?? 8,
      margin: station.margin ?? 0.2,
      confidence: station.confidence ?? 0.8
    }))

    const validatedRequest: TrainingRequest = {
      ...request,
      stations: validatedStations,
      target_metric: request.target_metric ?? 'profit'
    }

    const response = await this.makeRequest<TrainingResponse>('POST', '/train', validatedRequest)
    
    console.log(`Model training completed. Version: ${response.model_version}`)
    console.log(`Performance: R² = ${response.model_performance.accuracy?.toFixed(3)}`)
    
    return response
  }

  /**
   * Get prediction with SHAP explanations for a location
   */
  async predict(features: PredictionFeatures): Promise<PredictionResponse> {
    // Validate coordinates
    if (features.latitude < -90 || features.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90')
    }
    if (features.longitude < -180 || features.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180')
    }

    const response = await this.makeRequest<PredictionResponse>('POST', '/predict', features)
    return response
  }

  /**
   * Get information about the currently trained model
   */
  async getModelInfo(): Promise<ModelInfo> {
    const response = await this.makeRequest<ModelInfo>('GET', '/model/info')
    return response
  }

  /**
   * Get feature importance from the trained model
   */
  async getFeatureImportance(): Promise<Record<string, number>> {
    const response = await this.makeRequest<Record<string, number>>('GET', '/model/feature-importance')
    return response
  }

  /**
   * Reset/clear the current model
   */
  async resetModel(): Promise<{ status: string; message: string }> {
    const response = await this.makeRequest<{ status: string; message: string }>('DELETE', '/model')
    return response
  }

  /**
   * Train model with existing ground station data
   */
  async trainWithGroundStations(
    stations: GroundStation[],
    targetMetric: 'profit' | 'revenue' | 'utilization' | 'margin' = 'profit'
  ): Promise<TrainingResponse> {
    return this.trainModel({
      stations,
      target_metric: targetMetric,
      model_version: `ground_stations_${Date.now()}`
    })
  }

  /**
   * Predict opportunity score for a location with optional context features
   */
  async predictOpportunity(
    latitude: number,
    longitude: number,
    context?: Partial<PredictionFeatures>
  ): Promise<{
    score: number
    confidence: number
    explanations: Array<{
      feature: string
      impact: number
      direction: 'positive' | 'negative' | 'neutral'
    }>
    featureImportance: Array<{
      feature: string
      importance: number
      rank: number
    }>
  }> {
    const features: PredictionFeatures = {
      latitude,
      longitude,
      ...context
    }

    const response = await this.predict(features)

    // Transform SHAP explanations to match existing interface
    const explanations = response.shap_explanations.map(exp => ({
      feature: exp.feature,
      impact: Math.abs(exp.shap_value),
      direction: exp.impact_direction
    }))

    // Transform feature importance
    const featureImportance = Object.entries(response.feature_importance_rank)
      .map(([feature, rank]) => ({
        feature,
        importance: 1.0 / rank, // Convert rank to importance score
        rank
      }))
      .sort((a, b) => a.rank - b.rank)

    return {
      score: Math.max(0, Math.min(100, response.prediction)),
      confidence: response.model_confidence,
      explanations,
      featureImportance
    }
  }

  /**
   * Batch predictions for multiple locations
   */
  async batchPredict(locations: Array<{ lat: number; lon: number; context?: Partial<PredictionFeatures> }>): Promise<PredictionResponse[]> {
    const predictions = await Promise.all(
      locations.map(async ({ lat, lon, context }) => {
        try {
          return await this.predict({
            latitude: lat,
            longitude: lon,
            ...context
          })
        } catch (error) {
          console.warn(`Failed to predict for location (${lat}, ${lon}):`, error)
          return null
        }
      })
    )

    return predictions.filter((p): p is PredictionResponse => p !== null)
  }

  /**
   * Get training recommendations based on current data
   */
  async getTrainingRecommendations(stations: GroundStation[]): Promise<{
    canTrain: boolean
    dataQuality: number
    recommendations: string[]
    issues: string[]
  }> {
    const recommendations: string[] = []
    const issues: string[] = []

    // Check data quantity
    if (stations.length < 10) {
      issues.push(`Only ${stations.length} stations available. Need at least 10 for training.`)
    } else if (stations.length < 20) {
      recommendations.push('More training data would improve model accuracy.')
    }

    // Check data completeness
    const requiredFields = ['revenue', 'profit', 'utilization', 'latitude', 'longitude']
    let missingDataCount = 0

    stations.forEach(station => {
      requiredFields.forEach(field => {
        if (!(field in station) || station[field as keyof GroundStation] == null) {
          missingDataCount++
        }
      })
    })

    const completeness = 1 - (missingDataCount / (stations.length * requiredFields.length))

    if (completeness < 0.8) {
      issues.push(`${Math.round((1 - completeness) * 100)}% of required data is missing.`)
    } else if (completeness < 0.95) {
      recommendations.push('Some data fields are missing - consider data enrichment.')
    }

    // Check data diversity
    const operators = new Set(stations.map(s => s.operator).filter(Boolean))
    const countries = new Set(stations.map(s => s.country).filter(Boolean))

    if (operators.size < 3) {
      recommendations.push('More operator diversity would improve model generalization.')
    }

    if (countries.size < 5) {
      recommendations.push('Geographic diversity could enhance model performance.')
    }

    // Overall assessment
    const canTrain = stations.length >= 10 && completeness >= 0.7
    const dataQuality = Math.min(
      stations.length >= 20 ? 1.0 : stations.length / 20,
      completeness,
      Math.min(operators.size / 5, 1.0) * 0.5 + 0.5,
      Math.min(countries.size / 10, 1.0) * 0.3 + 0.7
    )

    if (canTrain && dataQuality > 0.8) {
      recommendations.push('Data quality is good for training a reliable model.')
    }

    return {
      canTrain,
      dataQuality,
      recommendations,
      issues
    }
  }

  /**
   * Make HTTP request to ML backend with error handling
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(this.timeout)
    }

    if (body && (method === 'POST')) {
      requestOptions.body = JSON.stringify(body)
    }

    try {
      console.log(`Making ${method} request to ${url}`)
      
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch {
          // Ignore JSON parsing errors for error responses
        }

        throw new Error(`ML Backend Error: ${errorMessage}`)
      }

      const data = await response.json()
      return data as T

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${this.timeout}ms`)
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Cannot connect to ML backend at ${this.baseUrl}. Is the service running?`)
        }
      }
      throw error
    }
  }
}

// Singleton instance for easy usage
export const mlClient = new MLTrainingClient()

// Utility functions
export function createMLClient(baseUrl?: string, timeout?: number): MLTrainingClient {
  return new MLTrainingClient(baseUrl, timeout)
}

export function isMLServiceAvailable(): Promise<boolean> {
  return mlClient.checkHealth()
    .then(() => true)
    .catch(() => false)
}

export async function trainOpportunityModel(stations: GroundStation[]): Promise<TrainingResponse | null> {
  try {
    const recommendations = await mlClient.getTrainingRecommendations(stations)
    
    if (!recommendations.canTrain) {
      console.warn('Cannot train model:', recommendations.issues.join(', '))
      return null
    }

    if (recommendations.issues.length > 0) {
      console.warn('Training issues:', recommendations.issues.join(', '))
    }

    console.log('Training recommendations:', recommendations.recommendations.join(', '))
    
    return await mlClient.trainWithGroundStations(stations)
  } catch (error) {
    console.error('Failed to train opportunity model:', error)
    return null
  }
}