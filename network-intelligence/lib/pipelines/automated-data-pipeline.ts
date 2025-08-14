/**
 * Automated Data Pipeline for ML Model Training
 * 
 * Orchestrates all data fetching, preprocessing, feature engineering, and ML training.
 * Implements the pattern from AUTOMATED_PIPELINE.md with comprehensive automation.
 * 
 * Features:
 * - Parallel data fetching from multiple sources
 * - Intelligent caching and cache invalidation
 * - Data quality monitoring and validation
 * - Automated feature engineering pipeline
 * - ML model training orchestration
 * - Error handling and recovery
 * - Progress tracking and logging
 * - Configurable scheduling and triggers
 */

import { dataIntegrationService, EnrichedGroundStation } from '../data/data-integration-service'
import { mlClient, TrainingResponse } from '../services/ml-training-client'
import { groundStationNetwork } from '../../data/groundStations'
import { unifiedDataIntegration } from '../services/unifiedDataIntegration'
import { stationDatabase } from '../database/station-database'

export interface PipelineConfig {
  // Data sources
  enableMaritimeData: boolean
  enableEconomicData: boolean
  enableWeatherData: boolean
  enableCompetitorData: boolean
  enableInfrastructureData: boolean
  
  // Processing options
  batchSize: number
  maxConcurrency: number
  cacheTimeout: number
  
  // Quality thresholds
  minDataQuality: number
  minCompleteness: number
  minStations: number
  
  // ML training options
  targetMetric: 'profit' | 'revenue' | 'utilization' | 'margin'
  autoRetrain: boolean
  retrainThreshold: number
  
  // Scheduling
  autoRun: boolean
  scheduleInterval: number // milliseconds
  
  // Error handling
  maxRetries: number
  retryDelay: number
  fallbackMode: boolean
}

export interface PipelineStatus {
  id: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'retrying'
  phase: string
  progress: number
  startTime: Date
  endTime?: Date
  duration?: number
  
  // Data metrics
  stationsProcessed: number
  dataQuality: number
  completeness: number
  
  // Model metrics
  modelTrained: boolean
  modelAccuracy?: number
  modelVersion?: string
  
  // Errors and warnings
  errors: string[]
  warnings: string[]
  
  // Performance metrics
  fetchTime: number
  processingTime: number
  trainingTime: number
  totalTime: number
}

export interface PipelineResult {
  status: PipelineStatus
  enrichedStations: EnrichedGroundStation[]
  trainingResult?: TrainingResponse
  dataSourceStatuses: any[]
  recommendations: string[]
  nextRun?: Date
}

export class AutomatedDataPipeline {
  private config: PipelineConfig
  private currentStatus: PipelineStatus | null = null
  private scheduledRun: NodeJS.Timeout | null = null
  private runHistory: PipelineStatus[] = []
  
  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      // Default configuration
      enableMaritimeData: true,
      enableEconomicData: true,
      enableWeatherData: true,
      enableCompetitorData: true,
      enableInfrastructureData: true,
      
      batchSize: 10,
      maxConcurrency: 5,
      cacheTimeout: 30 * 60 * 1000, // 30 minutes
      
      minDataQuality: 0.7,
      minCompleteness: 0.8,
      minStations: 15,
      
      targetMetric: 'profit',
      autoRetrain: true,
      retrainThreshold: 0.05, // Retrain if accuracy drops by 5%
      
      autoRun: false,
      scheduleInterval: 6 * 60 * 60 * 1000, // 6 hours
      
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      fallbackMode: true,
      
      ...config
    }
    
    if (this.config.autoRun) {
      this.scheduleNextRun()
    }
  }

  /**
   * Main pipeline execution method
   */
  async run(options: {
    forceRefresh?: boolean
    skipTraining?: boolean
    stations?: string[]
  } = {}): Promise<PipelineResult> {
    const runId = `pipeline_${Date.now()}`
    
    console.log(`Starting automated data pipeline run: ${runId}`)
    
    // Initialize status tracking
    this.currentStatus = {
      id: runId,
      status: 'running',
      phase: 'initialization',
      progress: 0,
      startTime: new Date(),
      stationsProcessed: 0,
      dataQuality: 0,
      completeness: 0,
      modelTrained: false,
      errors: [],
      warnings: [],
      fetchTime: 0,
      processingTime: 0,
      trainingTime: 0,
      totalTime: 0
    }

    try {
      // Phase 1: Data Acquisition
      this.updateStatus('data-acquisition', 10)
      const fetchStartTime = Date.now()
      
      const stations = options.stations ? 
        groundStationNetwork.filter(s => options.stations!.includes(s.id)) :
        groundStationNetwork.filter(s => s.isActive)
      
      console.log(`Processing ${stations.length} ground stations`)
      
      if (stations.length < this.config.minStations) {
        throw new Error(`Insufficient stations: ${stations.length} < ${this.config.minStations}`)
      }

      // Phase 2: Data Enrichment
      this.updateStatus('data-enrichment', 25)
      const enrichmentResult = await dataIntegrationService.enrichGroundStations(stations)
      
      this.currentStatus.fetchTime = Date.now() - fetchStartTime
      this.currentStatus.stationsProcessed = enrichmentResult.enrichedStations.length
      this.currentStatus.dataQuality = enrichmentResult.dataQuality
      this.currentStatus.completeness = enrichmentResult.completeness
      
      console.log(`Data enrichment completed: ${enrichmentResult.enrichedStations.length} stations enriched`)
      console.log(`Data quality: ${(enrichmentResult.dataQuality * 100).toFixed(1)}%`)
      console.log(`Completeness: ${(enrichmentResult.completeness * 100).toFixed(1)}%`)

      // Validate data quality
      if (enrichmentResult.dataQuality < this.config.minDataQuality) {
        this.currentStatus.warnings.push(
          `Data quality ${(enrichmentResult.dataQuality * 100).toFixed(1)}% below threshold ${(this.config.minDataQuality * 100).toFixed(1)}%`
        )
      }
      
      if (enrichmentResult.completeness < this.config.minCompleteness) {
        this.currentStatus.warnings.push(
          `Data completeness ${(enrichmentResult.completeness * 100).toFixed(1)}% below threshold ${(this.config.minCompleteness * 100).toFixed(1)}%`
        )
      }

      // Phase 3: Feature Engineering
      this.updateStatus('feature-engineering', 50)
      const processingStartTime = Date.now()
      
      const featuresEngineered = await this.engineerFeatures(enrichmentResult.enrichedStations)
      
      this.currentStatus.processingTime = Date.now() - processingStartTime
      
      console.log(`Feature engineering completed: ${featuresEngineered.length} features per station`)

      // Phase 4: ML Model Training (if not skipped)
      let trainingResult: TrainingResponse | undefined
      
      if (!options.skipTraining) {
        this.updateStatus('model-training', 75)
        const trainingStartTime = Date.now()
        
        try {
          trainingResult = await this.trainModel(enrichmentResult.enrichedStations)
          
          this.currentStatus.trainingTime = Date.now() - trainingStartTime
          this.currentStatus.modelTrained = true
          this.currentStatus.modelAccuracy = trainingResult.model_performance.accuracy
          this.currentStatus.modelVersion = trainingResult.model_version
          
          console.log(`Model training completed: ${trainingResult.model_version}`)
          console.log(`Model accuracy: ${(trainingResult.model_performance.accuracy * 100).toFixed(1)}%`)
          
        } catch (error) {
          console.warn('Model training failed:', error)
          this.currentStatus.warnings.push(`Model training failed: ${error}`)
        }
      }

      // Phase 5: Database Storage
      this.updateStatus('database-storage', 85)
      
      try {
        // Store enriched stations in database
        const runId = this.currentStatus.id
        const stationRecords = []
        
        for (const station of enrichmentResult.enrichedStations) {
          const record = await stationDatabase.saveStationRecord(station, {
            dataSourceVersion: 'v1.0',
            enrichmentVersion: 'v1.0',
            runId
          })
          stationRecords.push(record)
        }
        
        // Store pipeline run results
        await stationDatabase.savePipelineRun({
          runType: options.skipTraining ? 'data-only' : 'full',
          stationsProcessed: enrichmentResult.enrichedStations.length,
          dataSourcesUsed: enrichmentResult.dataSourceStatuses.map(s => s.name),
          processingTime: this.currentStatus.processingTime,
          status: 'completed',
          dataQuality: enrichmentResult.dataQuality,
          completeness: enrichmentResult.completeness,
          enrichedStationsCount: enrichmentResult.enrichedStations.length,
          modelVersion: trainingResult?.model_version,
          trainingRecordId: undefined, // Will be set if training was done
          errors: this.currentStatus.errors,
          warnings: this.currentStatus.warnings
        })
        
        console.log(`Stored ${stationRecords.length} station records in database`)
        
      } catch (dbError) {
        console.warn('Database storage failed:', dbError)
        this.currentStatus.warnings.push(`Database storage failed: ${dbError}`)
      }

      // Phase 6: Results and Recommendations
      this.updateStatus('finalization', 90)
      
      const recommendations = this.generateRecommendations(
        enrichmentResult,
        trainingResult,
        this.currentStatus
      )

      // Phase 6: Complete
      this.updateStatus('completed', 100)
      this.currentStatus.status = 'completed'
      this.currentStatus.endTime = new Date()
      this.currentStatus.duration = this.currentStatus.endTime.getTime() - this.currentStatus.startTime.getTime()
      this.currentStatus.totalTime = this.currentStatus.fetchTime + this.currentStatus.processingTime + this.currentStatus.trainingTime

      // Add to history
      this.runHistory.push({ ...this.currentStatus })
      if (this.runHistory.length > 10) {
        this.runHistory = this.runHistory.slice(-10) // Keep last 10 runs
      }

      // Schedule next run if auto-run is enabled
      if (this.config.autoRun) {
        this.scheduleNextRun()
      }

      console.log(`Pipeline completed successfully in ${this.currentStatus.duration}ms`)

      return {
        status: this.currentStatus,
        enrichedStations: enrichmentResult.enrichedStations,
        trainingResult,
        dataSourceStatuses: enrichmentResult.dataSourceStatuses,
        recommendations,
        nextRun: this.config.autoRun ? 
          new Date(Date.now() + this.config.scheduleInterval) : 
          undefined
      }

    } catch (error) {
      console.error('Pipeline failed:', error)
      
      this.currentStatus.status = 'failed'
      this.currentStatus.errors.push(error instanceof Error ? error.message : String(error))
      this.currentStatus.endTime = new Date()
      
      // Add failed run to history
      this.runHistory.push({ ...this.currentStatus })
      
      // Retry if configured
      if (this.config.maxRetries > 0) {
        console.log(`Retrying pipeline in ${this.config.retryDelay}ms...`)
        setTimeout(() => {
          this.config.maxRetries--
          this.run(options)
        }, this.config.retryDelay)
      }

      throw error
    }
  }

  /**
   * Engineer features from enriched station data for ML training
   */
  private async engineerFeatures(stations: EnrichedGroundStation[]): Promise<string[]> {
    console.log('Engineering features for ML training...')
    
    // Feature categories that will be used for ML training
    const featureCategories = {
      location: ['latitude', 'longitude', 'elevation'],
      maritime: ['maritimeDensity', 'vesselTrafficValue', 'portProximity', 'shippingLaneAccess'],
      economic: ['gdpPerCapita', 'populationDensity', 'economicGrowthRate', 'digitalMaturity'],
      competition: ['competitorCount', 'competitorDensity', 'marketSaturation', 'marketGap'],
      infrastructure: ['infrastructureScore', 'fiberConnectivity', 'powerReliability', 'regulatoryFriendliness'],
      environment: ['weatherReliability', 'clearSkyDays', 'disasterRisk'],
      technical: ['satelliteVisibility', 'passFrequency', 'signalQuality', 'interferenceLevel']
    }

    // Create derived features
    for (const station of stations) {
      // Market opportunity composite score
      station.marketOpportunityScore = (
        (station.maritimeDensity / 100) * 0.3 +
        (station.gdpPerCapita / 100000) * 0.25 +
        (1 - station.marketSaturation) * 0.25 +
        station.infrastructureScore * 0.2
      )

      // Technical feasibility score
      station.technicalFeasibilityScore = (
        (station.satelliteVisibility / 25) * 0.3 +
        station.weatherReliability * 0.3 +
        station.signalQuality * 0.2 +
        (1 - station.interferenceLevel) * 0.2
      )

      // Risk assessment score
      station.riskScore = (
        station.disasterRisk * 0.3 +
        (1 - station.powerReliability) * 0.2 +
        (1 - station.regulatoryFriendliness) * 0.2 +
        station.competitorDensity / 10 * 0.2 +
        (1 - station.weatherReliability) * 0.1
      )

      // Investment attractiveness
      station.investmentScore = (
        station.marketOpportunityScore * 0.4 +
        station.technicalFeasibilityScore * 0.35 +
        (1 - station.riskScore) * 0.25
      )
    }

    // Return list of all feature names
    const allFeatures = [
      ...Object.values(featureCategories).flat(),
      'marketOpportunityScore',
      'technicalFeasibilityScore', 
      'riskScore',
      'investmentScore'
    ]

    console.log(`Engineered ${allFeatures.length} features for ${stations.length} stations`)
    return allFeatures
  }

  /**
   * Train ML model with enriched station data
   */
  private async trainModel(stations: EnrichedGroundStation[]): Promise<TrainingResponse> {
    console.log('Training ML model...')
    
    // Check if ML service is available
    const isMLAvailable = await mlClient.checkHealth()
      .then(() => true)
      .catch(() => false)
    
    if (!isMLAvailable) {
      throw new Error('ML backend service is not available')
    }

    // Validate stations have required target metrics
    const validStations = stations.filter(s => 
      s.profit != null && 
      s.revenue != null && 
      s.utilization != null &&
      s.margin != null
    )

    if (validStations.length < this.config.minStations) {
      throw new Error(`Insufficient valid stations for training: ${validStations.length} < ${this.config.minStations}`)
    }

    console.log(`Training with ${validStations.length} valid stations`)

    // Convert to format expected by ML backend
    const trainingStations = validStations.map(station => ({
      id: station.id,
      name: station.name,
      operator: station.operator,
      latitude: station.latitude,
      longitude: station.longitude,
      country: station.country,
      city: station.city,
      
      // Target metrics
      utilization: station.utilization,
      revenue: station.revenue,
      profit: station.profit,
      margin: station.margin,
      confidence: station.confidence,
      
      // Technical specifications
      serviceModel: station.serviceModel,
      networkType: station.networkType,
      frequencyBands: station.frequencyBands,
      antennaCount: station.antennaCount,
      
      // Technical metrics
      satellitesVisible: station.satelliteVisibility,
      avgPassDuration: station.passFrequency,
      dataCapacity: station.dataCapacity,
      
      // Strategic analysis
      certifications: station.certifications,
      opportunities: station.opportunities,
      risks: station.risks,
      isActive: station.isActive
    }))

    // Train the model
    const trainingResult = await mlClient.trainModel({
      stations: trainingStations,
      target_metric: this.config.targetMetric,
      model_version: `automated_${Date.now()}`,
      hyperparameters: {
        n_estimators: 100,
        max_depth: 10,
        random_state: 42
      }
    })

    console.log(`Model training completed successfully`)
    console.log(`Cross-validation scores: ${trainingResult.cross_validation_scores.map(s => s.toFixed(3)).join(', ')}`)
    
    return trainingResult
  }

  /**
   * Generate recommendations based on pipeline results
   */
  private generateRecommendations(
    enrichmentResult: any,
    trainingResult?: TrainingResponse,
    status?: PipelineStatus
  ): string[] {
    const recommendations: string[] = []

    // Data quality recommendations
    if (enrichmentResult.dataQuality < 0.8) {
      recommendations.push('Consider improving data source connections to increase data quality')
    }

    if (enrichmentResult.completeness < 0.9) {
      recommendations.push('Some data fields are missing - investigate data source issues')
    }

    // Performance recommendations
    if (status && status.fetchTime > 60000) { // > 1 minute
      recommendations.push('Data fetching is slow - consider optimizing API calls or caching')
    }

    if (status && status.processingTime > 30000) { // > 30 seconds
      recommendations.push('Feature engineering is slow - consider optimization or parallel processing')
    }

    // Model recommendations
    if (trainingResult) {
      const accuracy = trainingResult.model_performance.accuracy || 0
      
      if (accuracy < 0.7) {
        recommendations.push('Model accuracy is low - consider feature engineering or more training data')
      } else if (accuracy > 0.9) {
        recommendations.push('Model accuracy is excellent - consider deploying to production')
      }

      // Feature importance insights
      const featureImportance = trainingResult.feature_importance
      const topFeatures = Object.entries(featureImportance)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name)
      
      recommendations.push(`Top predictive features: ${topFeatures.join(', ')}`)
    }

    // Data source recommendations
    const failedSources = enrichmentResult.dataSourceStatuses
      .filter((s: any) => !s.available)
      .map((s: any) => s.name)
    
    if (failedSources.length > 0) {
      recommendations.push(`Check failed data sources: ${failedSources.join(', ')}`)
    }

    // Scheduling recommendations
    if (this.config.autoRun && status) {
      const avgRunTime = this.runHistory.reduce((sum, run) => sum + (run.duration || 0), 0) / this.runHistory.length
      
      if (avgRunTime > this.config.scheduleInterval * 0.5) {
        recommendations.push('Pipeline runtime is approaching schedule interval - consider optimization')
      }
    }

    return recommendations
  }

  /**
   * Update pipeline status
   */
  private updateStatus(phase: string, progress: number): void {
    if (this.currentStatus) {
      this.currentStatus.phase = phase
      this.currentStatus.progress = progress
      console.log(`Pipeline ${this.currentStatus.id}: ${phase} (${progress}%)`)
    }
  }

  /**
   * Schedule next pipeline run
   */
  private scheduleNextRun(): void {
    if (this.scheduledRun) {
      clearTimeout(this.scheduledRun)
    }

    this.scheduledRun = setTimeout(() => {
      console.log('Starting scheduled pipeline run...')
      this.run().catch(error => {
        console.error('Scheduled pipeline run failed:', error)
      })
    }, this.config.scheduleInterval)

    console.log(`Next pipeline run scheduled in ${this.config.scheduleInterval / (60 * 1000)} minutes`)
  }

  /**
   * Stop scheduled runs
   */
  stopScheduler(): void {
    if (this.scheduledRun) {
      clearTimeout(this.scheduledRun)
      this.scheduledRun = null
      console.log('Pipeline scheduler stopped')
    }
  }

  /**
   * Get current pipeline status
   */
  getStatus(): PipelineStatus | null {
    return this.currentStatus
  }

  /**
   * Get pipeline run history
   */
  getHistory(): PipelineStatus[] {
    return [...this.runHistory]
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart scheduler if auto-run settings changed
    if (newConfig.autoRun !== undefined || newConfig.scheduleInterval !== undefined) {
      this.stopScheduler()
      if (this.config.autoRun) {
        this.scheduleNextRun()
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config }
  }

  /**
   * Check if pipeline is currently running
   */
  isRunning(): boolean {
    return this.currentStatus?.status === 'running'
  }

  /**
   * Get pipeline metrics and statistics
   */
  getMetrics(): {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    averageRunTime: number
    averageDataQuality: number
    lastRunTime?: Date
    nextRunTime?: Date
  } {
    const successfulRuns = this.runHistory.filter(run => run.status === 'completed').length
    const failedRuns = this.runHistory.filter(run => run.status === 'failed').length
    const avgRunTime = this.runHistory.reduce((sum, run) => sum + (run.duration || 0), 0) / this.runHistory.length
    const avgDataQuality = this.runHistory.reduce((sum, run) => sum + run.dataQuality, 0) / this.runHistory.length

    return {
      totalRuns: this.runHistory.length,
      successfulRuns,
      failedRuns,
      averageRunTime: avgRunTime || 0,
      averageDataQuality: avgDataQuality || 0,
      lastRunTime: this.runHistory.length > 0 ? this.runHistory[this.runHistory.length - 1].endTime : undefined,
      nextRunTime: this.config.autoRun ? new Date(Date.now() + this.config.scheduleInterval) : undefined
    }
  }

  /**
   * Force immediate pipeline run (bypass scheduler)
   */
  async runNow(options?: {
    forceRefresh?: boolean
    skipTraining?: boolean
    stations?: string[]
  }): Promise<PipelineResult> {
    if (this.isRunning()) {
      throw new Error('Pipeline is already running')
    }

    return this.run(options)
  }

  /**
   * Quick health check of all pipeline components
   */
  async healthCheck(): Promise<{
    pipeline: boolean
    dataIntegration: boolean
    mlBackend: boolean
    dataSources: Record<string, boolean>
  }> {
    const results = {
      pipeline: true,
      dataIntegration: true,
      mlBackend: false,
      dataSources: {} as Record<string, boolean>
    }

    try {
      // Check ML backend
      await mlClient.checkHealth()
      results.mlBackend = true
    } catch {
      results.mlBackend = false
    }

    // Check data sources
    const dataSourceStatuses = dataIntegrationService.getDataSourceStatuses()
    for (const source of dataSourceStatuses) {
      results.dataSources[source.name] = source.available
    }

    // Overall pipeline health
    results.pipeline = results.mlBackend && Object.values(results.dataSources).some(available => available)

    return results
  }
}

// Export pre-configured pipeline instances
export const automatedDataPipeline = new AutomatedDataPipeline()

// Development configuration
export const devPipeline = new AutomatedDataPipeline({
  autoRun: false,
  minDataQuality: 0.5,
  minCompleteness: 0.6,
  minStations: 5,
  maxRetries: 1
})

// Production configuration  
export const prodPipeline = new AutomatedDataPipeline({
  autoRun: true,
  scheduleInterval: 6 * 60 * 60 * 1000, // 6 hours
  minDataQuality: 0.8,
  minCompleteness: 0.9,
  minStations: 15,
  maxRetries: 3,
  cacheTimeout: 60 * 60 * 1000 // 1 hour
})

export default automatedDataPipeline

// Utility functions for pipeline management

/**
 * Run quick data pipeline test
 */
export async function runPipelineTest(): Promise<boolean> {
  try {
    const testPipeline = new AutomatedDataPipeline({
      autoRun: false,
      minStations: 1,
      minDataQuality: 0.1,
      minCompleteness: 0.1
    })

    const testStations = groundStationNetwork.slice(0, 3) // Test with 3 stations
    const result = await testPipeline.run({ 
      skipTraining: true,
      stations: testStations.map(s => s.id)
    })

    console.log('Pipeline test completed successfully')
    console.log(`Processed ${result.enrichedStations.length} stations`)
    console.log(`Data quality: ${(result.status.dataQuality * 100).toFixed(1)}%`)
    
    return true
  } catch (error) {
    console.error('Pipeline test failed:', error)
    return false
  }
}

/**
 * Get pipeline performance metrics
 */
export function getPipelineMetrics(): {
  lastRun?: Date
  nextRun?: Date
  successRate: number
  avgDataQuality: number
  recommendations: string[]
} {
  const metrics = automatedDataPipeline.getMetrics()
  const history = automatedDataPipeline.getHistory()
  
  const successRate = metrics.totalRuns > 0 ? metrics.successfulRuns / metrics.totalRuns : 0
  
  const recommendations: string[] = []
  if (successRate < 0.8) {
    recommendations.push('Pipeline success rate is low - investigate recurring failures')
  }
  if (metrics.averageDataQuality < 0.7) {
    recommendations.push('Average data quality is low - check data source connections')
  }
  if (metrics.averageRunTime > 5 * 60 * 1000) { // > 5 minutes
    recommendations.push('Pipeline runs are slow - consider performance optimization')
  }

  return {
    lastRun: metrics.lastRunTime,
    nextRun: metrics.nextRunTime,
    successRate,
    avgDataQuality: metrics.averageDataQuality,
    recommendations
  }
}