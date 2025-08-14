/**
 * Station Database Service
 * 
 * Provides persistent storage for enhanced ground station data and ML training results.
 * Supports caching enriched data, training history, and model performance metrics.
 */

import { GroundStation } from '../types/ground-station'
import { EnrichedGroundStation } from '../data/data-integration-service'

export interface StationRecord extends EnrichedGroundStation {
  // Database metadata
  id: string
  createdAt: Date
  updatedAt: Date
  version: number
  
  // Data lineage
  dataSourceVersion: string
  enrichmentVersion: string
  lastEnrichmentRun: string
  
  // Quality metadata
  validationStatus: 'valid' | 'invalid' | 'pending'
  validationErrors: string[]
  validationTimestamp: Date
}

export interface TrainingRecord {
  id: string
  modelVersion: string
  trainingTimestamp: Date
  
  // Training configuration
  targetMetric: string
  stationsUsed: string[]
  featuresUsed: string[]
  hyperparameters: Record<string, any>
  
  // Training results
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  rmse: number
  crossValidationScores: number[]
  
  // Feature importance
  featureImportance: Record<string, number>
  shapBaseline: Record<string, number>
  
  // Model performance on validation set
  validationResults: Array<{
    stationId: string
    actualValue: number
    predictedValue: number
    confidence: number
    error: number
  }>
  
  // Deployment information
  deploymentStatus: 'trained' | 'validated' | 'deployed' | 'retired'
  deploymentTimestamp?: Date
  rollbackAvailable: boolean
}

export interface PipelineRunRecord {
  id: string
  runTimestamp: Date
  runType: 'data-only' | 'training-only' | 'full' | 'test'
  
  // Run configuration
  stationsProcessed: number
  dataSourcesUsed: string[]
  processingTime: number
  
  // Results
  status: 'completed' | 'failed' | 'partial'
  dataQuality: number
  completeness: number
  
  // Outputs
  enrichedStationsCount: number
  modelVersion?: string
  trainingRecordId?: string
  
  // Issues
  errors: string[]
  warnings: string[]
}

export class StationDatabase {
  private stationRecords = new Map<string, StationRecord>()
  private trainingRecords = new Map<string, TrainingRecord>()
  private pipelineRuns = new Map<string, PipelineRunRecord>()
  
  // In production, this would be replaced with actual database connections
  // (e.g., PostgreSQL, MongoDB, etc.)
  
  constructor() {
    this.initializeDatabase()
  }

  /**
   * Initialize database with seed data
   */
  private initializeDatabase(): void {
    console.log('Initializing station database...')
    // Database would be initialized with existing station data
  }

  // Station Records Management

  /**
   * Store enriched station data
   */
  async saveStationRecord(station: EnrichedGroundStation, metadata: {
    dataSourceVersion: string
    enrichmentVersion: string
    runId: string
  }): Promise<StationRecord> {
    const existingRecord = this.stationRecords.get(station.id)
    const version = existingRecord ? existingRecord.version + 1 : 1
    
    const record: StationRecord = {
      ...station,
      
      // Database metadata
      createdAt: existingRecord?.createdAt || new Date(),
      updatedAt: new Date(),
      version,
      
      // Data lineage
      dataSourceVersion: metadata.dataSourceVersion,
      enrichmentVersion: metadata.enrichmentVersion,
      lastEnrichmentRun: metadata.runId,
      
      // Quality metadata
      validationStatus: 'pending',
      validationErrors: [],
      validationTimestamp: new Date()
    }
    
    this.stationRecords.set(station.id, record)
    
    console.log(`Saved station record: ${station.id} (version ${version})`)
    return record
  }

  /**
   * Get station record by ID
   */
  async getStationRecord(stationId: string): Promise<StationRecord | null> {
    return this.stationRecords.get(stationId) || null
  }

  /**
   * Get all station records
   */
  async getAllStationRecords(): Promise<StationRecord[]> {
    return Array.from(this.stationRecords.values())
  }

  /**
   * Get stations by operator
   */
  async getStationsByOperator(operator: string): Promise<StationRecord[]> {
    return Array.from(this.stationRecords.values())
      .filter(record => record.operator === operator)
  }

  /**
   * Get stations enriched after a certain date
   */
  async getStationsEnrichedAfter(date: Date): Promise<StationRecord[]> {
    return Array.from(this.stationRecords.values())
      .filter(record => new Date(record.lastUpdated) > date)
  }

  /**
   * Update station validation status
   */
  async updateStationValidation(
    stationId: string, 
    status: 'valid' | 'invalid' | 'pending',
    errors: string[] = []
  ): Promise<boolean> {
    const record = this.stationRecords.get(stationId)
    if (!record) return false
    
    record.validationStatus = status
    record.validationErrors = errors
    record.validationTimestamp = new Date()
    record.updatedAt = new Date()
    
    this.stationRecords.set(stationId, record)
    return true
  }

  // Training Records Management

  /**
   * Store training results
   */
  async saveTrainingRecord(trainingData: {
    modelVersion: string
    targetMetric: string
    stationsUsed: string[]
    featuresUsed: string[]
    hyperparameters: Record<string, any>
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    rmse: number
    crossValidationScores: number[]
    featureImportance: Record<string, number>
    shapBaseline: Record<string, number>
    validationResults: Array<{
      stationId: string
      actualValue: number
      predictedValue: number
      confidence: number
      error: number
    }>
  }): Promise<TrainingRecord> {
    const id = `training_${Date.now()}`
    
    const record: TrainingRecord = {
      id,
      trainingTimestamp: new Date(),
      deploymentStatus: 'trained',
      rollbackAvailable: false,
      ...trainingData
    }
    
    this.trainingRecords.set(id, record)
    
    console.log(`Saved training record: ${id} (accuracy: ${(trainingData.accuracy * 100).toFixed(1)}%)`)
    return record
  }

  /**
   * Get training record by ID
   */
  async getTrainingRecord(recordId: string): Promise<TrainingRecord | null> {
    return this.trainingRecords.get(recordId) || null
  }

  /**
   * Get latest training record
   */
  async getLatestTrainingRecord(): Promise<TrainingRecord | null> {
    const records = Array.from(this.trainingRecords.values())
    if (records.length === 0) return null
    
    return records.sort((a, b) => 
      b.trainingTimestamp.getTime() - a.trainingTimestamp.getTime()
    )[0]
  }

  /**
   * Get training records by model version
   */
  async getTrainingRecordsByVersion(modelVersion: string): Promise<TrainingRecord[]> {
    return Array.from(this.trainingRecords.values())
      .filter(record => record.modelVersion === modelVersion)
  }

  /**
   * Get training history
   */
  async getTrainingHistory(limit: number = 10): Promise<TrainingRecord[]> {
    return Array.from(this.trainingRecords.values())
      .sort((a, b) => b.trainingTimestamp.getTime() - a.trainingTimestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Update training deployment status
   */
  async updateTrainingDeployment(
    recordId: string,
    status: 'trained' | 'validated' | 'deployed' | 'retired',
    rollbackAvailable: boolean = false
  ): Promise<boolean> {
    const record = this.trainingRecords.get(recordId)
    if (!record) return false
    
    record.deploymentStatus = status
    record.rollbackAvailable = rollbackAvailable
    
    if (status === 'deployed') {
      record.deploymentTimestamp = new Date()
    }
    
    this.trainingRecords.set(recordId, record)
    return true
  }

  // Pipeline Run Management

  /**
   * Store pipeline run results
   */
  async savePipelineRun(runData: {
    runType: 'data-only' | 'training-only' | 'full' | 'test'
    stationsProcessed: number
    dataSourcesUsed: string[]
    processingTime: number
    status: 'completed' | 'failed' | 'partial'
    dataQuality: number
    completeness: number
    enrichedStationsCount: number
    modelVersion?: string
    trainingRecordId?: string
    errors: string[]
    warnings: string[]
  }): Promise<PipelineRunRecord> {
    const id = `run_${Date.now()}`
    
    const record: PipelineRunRecord = {
      id,
      runTimestamp: new Date(),
      ...runData
    }
    
    this.pipelineRuns.set(id, record)
    
    console.log(`Saved pipeline run: ${id} (status: ${runData.status})`)
    return record
  }

  /**
   * Get pipeline run history
   */
  async getPipelineHistory(limit: number = 20): Promise<PipelineRunRecord[]> {
    return Array.from(this.pipelineRuns.values())
      .sort((a, b) => b.runTimestamp.getTime() - a.runTimestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get pipeline runs by type
   */
  async getPipelineRunsByType(runType: string): Promise<PipelineRunRecord[]> {
    return Array.from(this.pipelineRuns.values())
      .filter(record => record.runType === runType)
  }

  /**
   * Get pipeline success rate
   */
  async getPipelineSuccessRate(days: number = 7): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const recentRuns = Array.from(this.pipelineRuns.values())
      .filter(record => record.runTimestamp > cutoff)
    
    if (recentRuns.length === 0) return 0
    
    const successfulRuns = recentRuns.filter(record => record.status === 'completed')
    return successfulRuns.length / recentRuns.length
  }

  // Analytics and Reporting

  /**
   * Get station data quality metrics
   */
  async getDataQualityMetrics(): Promise<{
    totalStations: number
    validStations: number
    invalidStations: number
    pendingValidation: number
    averageDataQuality: number
    averageCompleteness: number
    lastEnrichmentDate: Date | null
  }> {
    const records = Array.from(this.stationRecords.values())
    
    const validStations = records.filter(r => r.validationStatus === 'valid').length
    const invalidStations = records.filter(r => r.validationStatus === 'invalid').length
    const pendingValidation = records.filter(r => r.validationStatus === 'pending').length
    
    const avgDataQuality = records.reduce((sum, r) => sum + (r.confidenceScore || 0), 0) / records.length
    const avgCompleteness = records.reduce((sum, r) => sum + (r.dataCompleteness || 0), 0) / records.length
    
    const lastEnrichmentDate = records.length > 0 ? 
      new Date(Math.max(...records.map(r => new Date(r.lastUpdated).getTime()))) : 
      null
    
    return {
      totalStations: records.length,
      validStations,
      invalidStations,
      pendingValidation,
      averageDataQuality: avgDataQuality || 0,
      averageCompleteness: avgCompleteness || 0,
      lastEnrichmentDate
    }
  }

  /**
   * Get model performance trends
   */
  async getModelPerformanceTrends(): Promise<{
    accuracyTrend: Array<{ date: Date; accuracy: number; modelVersion: string }>
    featureImportanceTrend: Record<string, number[]>
    deploymentHistory: Array<{ date: Date; modelVersion: string; status: string }>
  }> {
    const trainingRecords = Array.from(this.trainingRecords.values())
      .sort((a, b) => a.trainingTimestamp.getTime() - b.trainingTimestamp.getTime())
    
    const accuracyTrend = trainingRecords.map(record => ({
      date: record.trainingTimestamp,
      accuracy: record.accuracy,
      modelVersion: record.modelVersion
    }))
    
    // Track feature importance changes over time
    const featureImportanceTrend: Record<string, number[]> = {}
    trainingRecords.forEach(record => {
      Object.entries(record.featureImportance).forEach(([feature, importance]) => {
        if (!featureImportanceTrend[feature]) {
          featureImportanceTrend[feature] = []
        }
        featureImportanceTrend[feature].push(importance)
      })
    })
    
    const deploymentHistory = trainingRecords
      .filter(record => record.deploymentTimestamp)
      .map(record => ({
        date: record.deploymentTimestamp!,
        modelVersion: record.modelVersion,
        status: record.deploymentStatus
      }))
    
    return {
      accuracyTrend,
      featureImportanceTrend,
      deploymentHistory
    }
  }

  /**
   * Get operational insights
   */
  async getOperationalInsights(): Promise<{
    topPerformingStations: Array<{ stationId: string; score: number; operator: string }>
    dataSourceReliability: Record<string, number>
    enrichmentEfficiency: { averageTime: number; successRate: number }
    recommendedActions: string[]
  }> {
    const stations = Array.from(this.stationRecords.values())
    const pipelineRuns = Array.from(this.pipelineRuns.values())
    
    // Top performing stations by investment score
    const topPerformingStations = stations
      .filter(s => s.investmentScore !== undefined)
      .sort((a, b) => (b.investmentScore || 0) - (a.investmentScore || 0))
      .slice(0, 10)
      .map(s => ({
        stationId: s.id,
        score: s.investmentScore || 0,
        operator: s.operator
      }))
    
    // Data source reliability (placeholder - would be calculated from actual API success rates)
    const dataSourceReliability = {
      maritime: 0.85,
      economic: 0.92,
      weather: 0.78,
      infrastructure: 0.88,
      satellites: 0.95
    }
    
    // Enrichment efficiency
    const recentRuns = pipelineRuns.slice(-10)
    const avgTime = recentRuns.reduce((sum, r) => sum + r.processingTime, 0) / recentRuns.length
    const successRate = recentRuns.filter(r => r.status === 'completed').length / recentRuns.length
    
    // Generate recommendations
    const recommendedActions: string[] = []
    
    if (successRate < 0.9) {
      recommendedActions.push('Improve pipeline reliability - success rate below 90%')
    }
    
    if (avgTime > 60000) { // > 1 minute
      recommendedActions.push('Optimize pipeline performance - average run time high')
    }
    
    const invalidStations = stations.filter(s => s.validationStatus === 'invalid').length
    if (invalidStations > 0) {
      recommendedActions.push(`Review ${invalidStations} stations with validation errors`)
    }
    
    return {
      topPerformingStations,
      dataSourceReliability,
      enrichmentEfficiency: { averageTime: avgTime || 0, successRate: successRate || 0 },
      recommendedActions
    }
  }

  // Database maintenance

  /**
   * Clean up old records
   */
  async cleanupOldRecords(retentionDays: number = 90): Promise<{
    stationsCleanedUp: number
    trainingRecordsCleanedUp: number
    pipelineRunsCleanedUp: number
  }> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    let stationsCleanedUp = 0
    let trainingRecordsCleanedUp = 0
    let pipelineRunsCleanedUp = 0
    
    // Keep latest version of each station, clean up old versions
    // (In a real database, this would be more sophisticated)
    
    // Clean up old training records
    for (const [id, record] of this.trainingRecords.entries()) {
      if (record.trainingTimestamp < cutoff && record.deploymentStatus === 'retired') {
        this.trainingRecords.delete(id)
        trainingRecordsCleanedUp++
      }
    }
    
    // Clean up old pipeline runs
    for (const [id, record] of this.pipelineRuns.entries()) {
      if (record.runTimestamp < cutoff) {
        this.pipelineRuns.delete(id)
        pipelineRunsCleanedUp++
      }
    }
    
    console.log(`Cleanup completed: ${trainingRecordsCleanedUp} training records, ${pipelineRunsCleanedUp} pipeline runs`)
    
    return {
      stationsCleanedUp,
      trainingRecordsCleanedUp,
      pipelineRunsCleanedUp
    }
  }

  /**
   * Export database to JSON for backup
   */
  async exportData(): Promise<{
    stations: StationRecord[]
    trainingRecords: TrainingRecord[]
    pipelineRuns: PipelineRunRecord[]
    exportTimestamp: Date
  }> {
    return {
      stations: Array.from(this.stationRecords.values()),
      trainingRecords: Array.from(this.trainingRecords.values()),
      pipelineRuns: Array.from(this.pipelineRuns.values()),
      exportTimestamp: new Date()
    }
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    stations: StationRecord[]
    trainingRecords: TrainingRecord[]
    pipelineRuns: PipelineRunRecord[]
  }): Promise<boolean> {
    try {
      // Clear existing data
      this.stationRecords.clear()
      this.trainingRecords.clear()
      this.pipelineRuns.clear()
      
      // Import new data
      data.stations.forEach(record => {
        this.stationRecords.set(record.id, record)
      })
      
      data.trainingRecords.forEach(record => {
        this.trainingRecords.set(record.id, record)
      })
      
      data.pipelineRuns.forEach(record => {
        this.pipelineRuns.set(record.id, record)
      })
      
      console.log(`Imported ${data.stations.length} stations, ${data.trainingRecords.length} training records, ${data.pipelineRuns.length} pipeline runs`)
      
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalRecords: number
    stationRecords: number
    trainingRecords: number
    pipelineRuns: number
    dataSize: number // approximate size in bytes
    oldestRecord: Date | null
    newestRecord: Date | null
  }> {
    const stations = Array.from(this.stationRecords.values())
    const training = Array.from(this.trainingRecords.values())
    const runs = Array.from(this.pipelineRuns.values())
    
    const allDates = [
      ...stations.map(s => s.createdAt),
      ...training.map(t => t.trainingTimestamp),
      ...runs.map(r => r.runTimestamp)
    ]
    
    const oldestRecord = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : null
    const newestRecord = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null
    
    // Approximate data size
    const dataSize = JSON.stringify({
      stations,
      training,
      runs
    }).length
    
    return {
      totalRecords: stations.length + training.length + runs.length,
      stationRecords: stations.length,
      trainingRecords: training.length,
      pipelineRuns: runs.length,
      dataSize,
      oldestRecord,
      newestRecord
    }
  }
}

// Export singleton instance
export const stationDatabase = new StationDatabase()
export default stationDatabase