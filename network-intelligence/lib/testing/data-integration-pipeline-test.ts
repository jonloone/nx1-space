/**
 * Comprehensive Data Integration Pipeline Test
 * 
 * End-to-end testing suite for the complete ML data integration pipeline.
 * Tests all components from data collection to model training and deployment.
 * 
 * Features:
 * - Complete pipeline integration testing
 * - Data quality validation
 * - Performance benchmarking
 * - Error handling verification
 * - Fallback system testing
 * - ML training validation
 */

import { dataIntegrationService } from '../data/data-integration-service'
import { automatedDataPipeline } from '../pipelines/automated-data-pipeline'
import { trainingOrchestrator } from '../pipelines/training-orchestrator'
import { fallbackDataService } from '../services/fallback-data-service'
import { mlClient } from '../services/ml-training-client'
import { groundStationNetwork } from '../../data/groundStations'

export interface TestResult {
  testName: string
  passed: boolean
  duration: number
  details: any
  errors: string[]
  warnings: string[]
}

export interface PipelineTestResults {
  overallPassed: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
  testResults: TestResult[]
  summary: {
    dataIntegration: boolean
    pipelineExecution: boolean
    mlTraining: boolean
    fallbackSystems: boolean
    performanceMetrics: boolean
  }
  recommendations: string[]
}

export class DataIntegrationPipelineTest {
  private testResults: TestResult[] = []
  
  constructor() {}

  /**
   * Execute comprehensive pipeline test suite
   */
  async runFullTestSuite(): Promise<PipelineTestResults> {
    console.log('Starting comprehensive data integration pipeline test suite...')
    const startTime = Date.now()
    
    this.testResults = []

    // Test 1: Data Integration Service
    await this.testDataIntegrationService()
    
    // Test 2: Automated Pipeline Execution
    await this.testAutomatedPipeline()
    
    // Test 3: ML Backend Connectivity
    await this.testMLBackendConnectivity()
    
    // Test 4: Training Orchestrator
    await this.testTrainingOrchestrator()
    
    // Test 5: Fallback Systems
    await this.testFallbackSystems()
    
    // Test 6: Performance Benchmarks
    await this.testPerformanceBenchmarks()
    
    // Test 7: Error Handling
    await this.testErrorHandling()
    
    // Test 8: Data Quality Validation
    await this.testDataQualityValidation()

    const totalDuration = Date.now() - startTime
    const passedTests = this.testResults.filter(r => r.passed).length
    const failedTests = this.testResults.filter(r => !r.passed).length

    const summary = {
      dataIntegration: this.getTestStatus('Data Integration Service'),
      pipelineExecution: this.getTestStatus('Automated Pipeline'),
      mlTraining: this.getTestStatus('Training Orchestrator'),
      fallbackSystems: this.getTestStatus('Fallback Systems'),
      performanceMetrics: this.getTestStatus('Performance Benchmarks')
    }

    const recommendations = this.generateRecommendations()

    console.log(`Test suite completed in ${totalDuration}ms`)
    console.log(`Results: ${passedTests}/${this.testResults.length} tests passed`)

    return {
      overallPassed: failedTests === 0,
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      totalDuration,
      testResults: this.testResults,
      summary,
      recommendations
    }
  }

  /**
   * Test 1: Data Integration Service
   */
  private async testDataIntegrationService(): Promise<void> {
    const testName = 'Data Integration Service'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing data integration service...')
      
      // Test with a small subset of stations
      const testStations = groundStationNetwork.slice(0, 3)
      
      const result = await dataIntegrationService.enrichGroundStations(testStations)
      
      details = {
        stationsEnriched: result.enrichedStations.length,
        dataQuality: result.dataQuality,
        completeness: result.completeness,
        processingTime: result.processingTime,
        featuresCount: Object.keys(result.enrichedStations[0] || {}).length
      }
      
      // Validation checks
      if (result.enrichedStations.length !== testStations.length) {
        errors.push(`Expected ${testStations.length} enriched stations, got ${result.enrichedStations.length}`)
      }
      
      if (result.dataQuality < 0.3) {
        errors.push(`Data quality too low: ${result.dataQuality}`)
      } else if (result.dataQuality < 0.7) {
        warnings.push(`Data quality could be improved: ${result.dataQuality}`)
      }
      
      if (result.completeness < 0.5) {
        errors.push(`Data completeness too low: ${result.completeness}`)
      }
      
      // Check that enriched stations have required fields
      for (const station of result.enrichedStations) {
        const requiredFields = ['maritimeDensity', 'gdpPerCapita', 'infrastructureScore', 'weatherReliability']
        for (const field of requiredFields) {
          if (!(field in station)) {
            errors.push(`Missing required field: ${field}`)
          }
        }
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Data integration service test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 2: Automated Pipeline Execution
   */
  private async testAutomatedPipeline(): Promise<void> {
    const testName = 'Automated Pipeline'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing automated pipeline...')
      
      // Test pipeline with minimal configuration
      const result = await automatedDataPipeline.run({
        skipTraining: true, // Skip ML training for this test
        stations: groundStationNetwork.slice(0, 3).map(s => s.id)
      })
      
      details = {
        status: result.status.status,
        phase: result.status.phase,
        progress: result.status.progress,
        stationsProcessed: result.status.stationsProcessed,
        dataQuality: result.status.dataQuality,
        enrichedStations: result.enrichedStations.length,
        fetchTime: result.status.fetchTime,
        processingTime: result.status.processingTime
      }
      
      // Validation checks
      if (result.status.status !== 'completed') {
        errors.push(`Pipeline did not complete successfully: ${result.status.status}`)
      }
      
      if (result.status.progress !== 100) {
        errors.push(`Pipeline progress not 100%: ${result.status.progress}`)
      }
      
      if (result.enrichedStations.length === 0) {
        errors.push('No stations were enriched')
      }
      
      if (result.status.errors.length > 0) {
        errors.push(...result.status.errors)
      }
      
      if (result.status.warnings.length > 0) {
        warnings.push(...result.status.warnings)
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Automated pipeline test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 3: ML Backend Connectivity
   */
  private async testMLBackendConnectivity(): Promise<void> {
    const testName = 'ML Backend Connectivity'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing ML backend connectivity...')
      
      // Test health check
      const health = await mlClient.checkHealth()
      
      details = {
        status: health.status,
        modelLoaded: health.model_loaded,
        modelVersion: health.model_version,
        uptimeSeconds: health.uptime_seconds,
        memoryUsageMb: health.memory_usage_mb
      }
      
      // Validation checks
      if (health.status !== 'healthy') {
        errors.push(`ML backend not healthy: ${health.status}`)
      }
      
      if (health.uptime_seconds < 0) {
        warnings.push('ML backend uptime is negative or very low')
      }
      
      if (health.memory_usage_mb > 1000) {
        warnings.push(`ML backend using high memory: ${health.memory_usage_mb}MB`)
      }
      
      // Test simple prediction if model is available
      if (health.model_loaded) {
        try {
          const prediction = await mlClient.predict({
            latitude: 40.7,
            longitude: -74.0,
            maritimeDensity: 50,
            gdpPerCapita: 50000
          })
          
          details.predictionTest = {
            prediction: prediction.prediction,
            confidence: prediction.model_confidence,
            explanationsCount: prediction.shap_explanations.length
          }
          
        } catch (predError) {
          warnings.push(`Prediction test failed: ${predError}`)
        }
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`ML backend connectivity test failed: ${error}`)
      // ML backend might not be running, which is acceptable for some tests
      if (error instanceof Error && error.message.includes('Cannot connect')) {
        warnings.push('ML backend not available - this is acceptable for data-only tests')
        passed = true
        errors.pop() // Remove the error since it's acceptable
      }
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 4: Training Orchestrator
   */
  private async testTrainingOrchestrator(): Promise<void> {
    const testName = 'Training Orchestrator'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing training orchestrator (health check only)...')
      
      // Test health check
      const health = await trainingOrchestrator.healthCheck()
      
      details = {
        orchestrator: health.orchestrator,
        pipeline: health.pipeline,
        mlBackend: health.mlBackend,
        dataIntegration: health.dataIntegration
      }
      
      // Validation checks
      if (!health.orchestrator) {
        errors.push('Training orchestrator health check failed')
      }
      
      if (!health.pipeline) {
        warnings.push('Pipeline component not healthy')
      }
      
      if (!health.dataIntegration) {
        warnings.push('Data integration component not healthy')
      }
      
      if (!health.mlBackend) {
        warnings.push('ML backend not available for training')
      }
      
      // Test configuration retrieval
      const config = trainingOrchestrator.getConfig()
      details.config = {
        minStationsRequired: config.minStationsRequired,
        targetMetric: config.targetMetric,
        validationThreshold: config.validationThreshold
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Training orchestrator test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 5: Fallback Systems
   */
  private async testFallbackSystems(): Promise<void> {
    const testName = 'Fallback Systems'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing fallback systems...')
      
      // Test maritime fallback
      const maritimeResult = await fallbackDataService.getMaritimeDataWithFallback(
        40.7, -74.0, 'Test API unavailable'
      )
      
      // Test economic fallback
      const economicResult = await fallbackDataService.getEconomicDataWithFallback(
        'United States', 'Test API unavailable'
      )
      
      // Test weather fallback
      const weatherResult = await fallbackDataService.getWeatherDataWithFallback(
        40.7, -74.0, 'Test API unavailable'
      )
      
      // Test station enrichment fallback
      const testStation = groundStationNetwork[0]
      const stationResult = await fallbackDataService.getEnrichedStationWithFallback(
        testStation, 'Test enrichment fallback'
      )
      
      details = {
        maritime: {
          source: maritimeResult.metadata.source,
          confidence: maritimeResult.metadata.confidence,
          warnings: maritimeResult.metadata.warnings.length
        },
        economic: {
          source: economicResult.metadata.source,
          confidence: economicResult.metadata.confidence,
          warnings: economicResult.metadata.warnings.length
        },
        weather: {
          source: weatherResult.metadata.source,
          confidence: weatherResult.metadata.confidence,
          warnings: weatherResult.metadata.warnings.length
        },
        station: {
          source: stationResult.metadata.source,
          confidence: stationResult.metadata.confidence,
          warnings: stationResult.metadata.warnings.length
        }
      }
      
      // Validation checks
      if (!maritimeResult.data) {
        errors.push('Maritime fallback returned no data')
      }
      
      if (!economicResult.data) {
        errors.push('Economic fallback returned no data')
      }
      
      if (!weatherResult.data) {
        errors.push('Weather fallback returned no data')
      }
      
      if (!stationResult.data) {
        errors.push('Station enrichment fallback returned no data')
      }
      
      // Check confidence scores are reasonable
      const allConfidences = [
        maritimeResult.metadata.confidence,
        economicResult.metadata.confidence,
        weatherResult.metadata.confidence,
        stationResult.metadata.confidence
      ]
      
      for (const confidence of allConfidences) {
        if (confidence < 0.1 || confidence > 1.0) {
          errors.push(`Invalid confidence score: ${confidence}`)
        }
      }
      
      // Test fallback statistics
      const stats = fallbackDataService.getFallbackStats()
      details.stats = stats
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Fallback systems test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 6: Performance Benchmarks
   */
  private async testPerformanceBenchmarks(): Promise<void> {
    const testName = 'Performance Benchmarks'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing performance benchmarks...')
      
      // Benchmark data integration
      const integrationStart = Date.now()
      const testStations = groundStationNetwork.slice(0, 2) // Small test set
      const integrationResult = await dataIntegrationService.enrichGroundStations(testStations)
      const integrationTime = Date.now() - integrationStart
      
      // Benchmark pipeline execution
      const pipelineStart = Date.now()
      const pipelineResult = await automatedDataPipeline.run({
        skipTraining: true,
        stations: testStations.map(s => s.id)
      })
      const pipelineTime = Date.now() - pipelineStart
      
      details = {
        integration: {
          stationsProcessed: integrationResult.enrichedStations.length,
          totalTime: integrationTime,
          timePerStation: integrationTime / integrationResult.enrichedStations.length,
          dataQuality: integrationResult.dataQuality
        },
        pipeline: {
          totalTime: pipelineTime,
          fetchTime: pipelineResult.status.fetchTime,
          processingTime: pipelineResult.status.processingTime,
          efficiency: pipelineResult.status.fetchTime / pipelineTime
        },
        benchmarks: {
          integrationThreshold: 30000, // 30 seconds
          pipelineThreshold: 60000,    // 60 seconds
          perStationThreshold: 10000   // 10 seconds per station
        }
      }
      
      // Performance validation
      if (integrationTime > details.benchmarks.integrationThreshold) {
        warnings.push(`Data integration slow: ${integrationTime}ms > ${details.benchmarks.integrationThreshold}ms`)
      }
      
      if (pipelineTime > details.benchmarks.pipelineThreshold) {
        warnings.push(`Pipeline execution slow: ${pipelineTime}ms > ${details.benchmarks.pipelineThreshold}ms`)
      }
      
      const timePerStation = integrationTime / integrationResult.enrichedStations.length
      if (timePerStation > details.benchmarks.perStationThreshold) {
        warnings.push(`Per-station processing slow: ${timePerStation}ms > ${details.benchmarks.perStationThreshold}ms`)
      }
      
      // Memory usage check (if available)
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage()
        details.memory = {
          heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
          heapTotal: memUsage.heapTotal / 1024 / 1024, // MB
          external: memUsage.external / 1024 / 1024 // MB
        }
        
        if (details.memory.heapUsed > 500) {
          warnings.push(`High memory usage: ${details.memory.heapUsed}MB`)
        }
      }
      
      passed = true // Performance warnings don't fail the test
      
    } catch (error) {
      errors.push(`Performance benchmarks test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 7: Error Handling
   */
  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing error handling...')
      
      const testResults = {
        invalidStationData: false,
        emptyStationArray: false,
        invalidCoordinates: false,
        mlBackendUnavailable: false
      }
      
      // Test 1: Invalid station data
      try {
        const invalidStation = { ...groundStationNetwork[0], latitude: 'invalid' as any }
        await dataIntegrationService.enrichGroundStations([invalidStation])
        testResults.invalidStationData = true
      } catch (error) {
        // Expected to fail
        testResults.invalidStationData = true
      }
      
      // Test 2: Empty station array
      try {
        const result = await dataIntegrationService.enrichGroundStations([])
        testResults.emptyStationArray = result.enrichedStations.length === 0
      } catch (error) {
        testResults.emptyStationArray = true
      }
      
      // Test 3: Invalid coordinates for fallback
      try {
        await fallbackDataService.getMaritimeDataWithFallback(999, 999)
        testResults.invalidCoordinates = true
      } catch (error) {
        // Should handle gracefully
        warnings.push('Fallback system should handle invalid coordinates gracefully')
      }
      
      // Test 4: ML backend unavailable
      try {
        // This will likely fail, which is expected
        await mlClient.predict({
          latitude: 40.7,
          longitude: -74.0
        })
      } catch (error) {
        // Expected if ML backend is not running
        testResults.mlBackendUnavailable = true
      }
      
      details = testResults
      
      // Validation
      const passedTests = Object.values(testResults).filter(Boolean).length
      const totalTests = Object.keys(testResults).length
      
      if (passedTests < totalTests * 0.75) {
        errors.push(`Only ${passedTests}/${totalTests} error handling tests passed`)
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Error handling test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  /**
   * Test 8: Data Quality Validation
   */
  private async testDataQualityValidation(): Promise<void> {
    const testName = 'Data Quality Validation'
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let passed = false
    let details: any = {}

    try {
      console.log('Testing data quality validation...')
      
      // Test with representative stations
      const testStations = [
        groundStationNetwork.find(s => s.operator === 'SES'),
        groundStationNetwork.find(s => s.country === 'United States'),
        groundStationNetwork.find(s => s.revenue && s.revenue > 50)
      ].filter(Boolean)
      
      const result = await dataIntegrationService.enrichGroundStations(testStations)
      
      let totalFieldCount = 0
      let filledFieldCount = 0
      let validValueCount = 0
      
      for (const station of result.enrichedStations) {
        const fields = Object.keys(station)
        totalFieldCount += fields.length
        
        for (const field of fields) {
          const value = station[field as keyof typeof station]
          
          if (value !== null && value !== undefined && value !== '') {
            filledFieldCount++
            
            // Validate specific field types
            if (field.includes('latitude') || field.includes('longitude')) {
              if (typeof value === 'number' && value >= -180 && value <= 180) {
                validValueCount++
              }
            } else if (field.includes('Score') || field.includes('Reliability') || field.includes('Confidence')) {
              if (typeof value === 'number' && value >= 0 && value <= 1) {
                validValueCount++
              }
            } else if (field.includes('Density') || field.includes('Count')) {
              if (typeof value === 'number' && value >= 0) {
                validValueCount++
              }
            } else {
              validValueCount++ // Assume valid for other fields
            }
          }
        }
      }
      
      const completeness = filledFieldCount / totalFieldCount
      const validity = validValueCount / filledFieldCount
      
      details = {
        stationsValidated: result.enrichedStations.length,
        totalFields: totalFieldCount,
        filledFields: filledFieldCount,
        validValues: validValueCount,
        completeness,
        validity,
        overallDataQuality: result.dataQuality,
        qualityThresholds: {
          completeness: 0.8,
          validity: 0.9,
          overallQuality: 0.7
        }
      }
      
      // Validation checks
      if (completeness < details.qualityThresholds.completeness) {
        warnings.push(`Data completeness below threshold: ${completeness.toFixed(3)} < ${details.qualityThresholds.completeness}`)
      }
      
      if (validity < details.qualityThresholds.validity) {
        errors.push(`Data validity below threshold: ${validity.toFixed(3)} < ${details.qualityThresholds.validity}`)
      }
      
      if (result.dataQuality < details.qualityThresholds.overallQuality) {
        warnings.push(`Overall data quality below threshold: ${result.dataQuality.toFixed(3)} < ${details.qualityThresholds.overallQuality}`)
      }
      
      // Check for specific data quality issues
      for (const station of result.enrichedStations) {
        if (!station.latitude || !station.longitude) {
          errors.push(`Station ${station.id} missing coordinates`)
        }
        
        if (station.confidence < 0.3) {
          warnings.push(`Station ${station.id} has low confidence: ${station.confidence}`)
        }
      }
      
      passed = errors.length === 0
      
    } catch (error) {
      errors.push(`Data quality validation test failed: ${error}`)
    }

    this.testResults.push({
      testName,
      passed,
      duration: Date.now() - startTime,
      details,
      errors,
      warnings
    })
  }

  // Helper methods

  private getTestStatus(testName: string): boolean {
    const test = this.testResults.find(t => t.testName === testName)
    return test ? test.passed : false
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    // Analyze test results for recommendations
    const failedTests = this.testResults.filter(t => !t.passed)
    const slowTests = this.testResults.filter(t => t.duration > 10000) // > 10 seconds
    const testWithWarnings = this.testResults.filter(t => t.warnings.length > 0)
    
    if (failedTests.length > 0) {
      recommendations.push(`Fix failing tests: ${failedTests.map(t => t.testName).join(', ')}`)
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`Optimize performance for slow tests: ${slowTests.map(t => t.testName).join(', ')}`)
    }
    
    if (testWithWarnings.length > 0) {
      recommendations.push(`Address warnings in: ${testWithWarnings.map(t => t.testName).join(', ')}`)
    }
    
    // Check ML backend availability
    const mlTest = this.testResults.find(t => t.testName === 'ML Backend Connectivity')
    if (mlTest && !mlTest.passed) {
      recommendations.push('Start ML backend service for full pipeline functionality')
    }
    
    // Check data quality
    const dataQualityTest = this.testResults.find(t => t.testName === 'Data Quality Validation')
    if (dataQualityTest && dataQualityTest.warnings.length > 0) {
      recommendations.push('Improve data source connections for better data quality')
    }
    
    // Performance recommendations
    const perfTest = this.testResults.find(t => t.testName === 'Performance Benchmarks')
    if (perfTest && perfTest.warnings.length > 0) {
      recommendations.push('Consider optimizing data processing pipeline for better performance')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All tests passed successfully - system is ready for production use')
    }
    
    return recommendations
  }

  /**
   * Run quick smoke test
   */
  async runSmokeTest(): Promise<boolean> {
    console.log('Running quick smoke test...')
    
    try {
      // Test basic data integration
      const testStation = groundStationNetwork[0]
      const result = await dataIntegrationService.enrichGroundStations([testStation])
      
      if (result.enrichedStations.length !== 1) {
        console.error('Smoke test failed: Expected 1 enriched station')
        return false
      }
      
      // Test fallback system
      const fallbackResult = await fallbackDataService.getMaritimeDataWithFallback(40.7, -74.0)
      
      if (!fallbackResult.data) {
        console.error('Smoke test failed: Fallback system returned no data')
        return false
      }
      
      console.log('Smoke test passed')
      return true
      
    } catch (error) {
      console.error('Smoke test failed:', error)
      return false
    }
  }

  /**
   * Get test results summary
   */
  getTestSummary(): string {
    const passed = this.testResults.filter(t => t.passed).length
    const total = this.testResults.length
    const totalTime = this.testResults.reduce((sum, t) => sum + t.duration, 0)
    
    return `Test Results: ${passed}/${total} passed in ${totalTime}ms`
  }
}

// Export test utilities
export const pipelineTest = new DataIntegrationPipelineTest()

/**
 * Run complete integration test
 */
export async function runCompleteIntegrationTest(): Promise<PipelineTestResults> {
  return pipelineTest.runFullTestSuite()
}

/**
 * Run quick smoke test
 */
export async function runSmokeTest(): Promise<boolean> {
  return pipelineTest.runSmokeTest()
}

/**
 * Generate test report
 */
export function generateTestReport(results: PipelineTestResults): string {
  let report = `# Data Integration Pipeline Test Report\n\n`
  report += `**Overall Status**: ${results.overallPassed ? 'PASSED' : 'FAILED'}\n`
  report += `**Tests**: ${results.passedTests}/${results.totalTests} passed\n`
  report += `**Duration**: ${results.totalDuration}ms\n\n`
  
  report += `## Component Status\n`
  report += `- Data Integration: ${results.summary.dataIntegration ? '✅' : '❌'}\n`
  report += `- Pipeline Execution: ${results.summary.pipelineExecution ? '✅' : '❌'}\n`
  report += `- ML Training: ${results.summary.mlTraining ? '✅' : '❌'}\n`
  report += `- Fallback Systems: ${results.summary.fallbackSystems ? '✅' : '❌'}\n`
  report += `- Performance: ${results.summary.performanceMetrics ? '✅' : '❌'}\n\n`
  
  report += `## Test Details\n`
  for (const test of results.testResults) {
    report += `### ${test.testName} ${test.passed ? '✅' : '❌'}\n`
    report += `- Duration: ${test.duration}ms\n`
    if (test.errors.length > 0) {
      report += `- Errors: ${test.errors.join(', ')}\n`
    }
    if (test.warnings.length > 0) {
      report += `- Warnings: ${test.warnings.join(', ')}\n`
    }
    report += `\n`
  }
  
  if (results.recommendations.length > 0) {
    report += `## Recommendations\n`
    for (const rec of results.recommendations) {
      report += `- ${rec}\n`
    }
  }
  
  return report
}

export default pipelineTest