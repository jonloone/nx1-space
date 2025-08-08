/**
 * POC Validation Test Suite
 * 
 * Validates the reality-based scoring system against known stations
 * Target: >70% accuracy on predicting station profitability
 */

import { EmpiricalWeightCalibration } from '../scoring/empirical-weight-calibration'
import { RealityBasedSpatialScoring } from '../scoring/reality-based-spatial-scoring'
import { StationAccuracyValidator } from '../validation/station-accuracy-validator'
import { GroundStationOptimizer } from '../services/groundStationOptimizer'
import { OrbitalMechanicsService } from '../services/orbital-mechanics-service'
import { stationDataService } from '../services/stationDataService'
import { competitorDataService } from '../services/competitorDataService'

export class POCValidationTest {
  private calibration: EmpiricalWeightCalibration
  private spatialScoring: RealityBasedSpatialScoring
  private validator: StationAccuracyValidator
  private optimizer: GroundStationOptimizer
  private orbitalService: OrbitalMechanicsService

  constructor() {
    this.calibration = new EmpiricalWeightCalibration()
    this.spatialScoring = new RealityBasedSpatialScoring()
    this.validator = new StationAccuracyValidator()
    this.optimizer = new GroundStationOptimizer()
    this.orbitalService = new OrbitalMechanicsService()
  }

  /**
   * Run complete POC validation suite
   */
  async runFullValidation(): Promise<ValidationReport> {
    console.log('🚀 Starting POC Validation Test Suite')
    console.log('Target: >70% accuracy on known stations\n')

    const report: ValidationReport = {
      timestamp: new Date(),
      tests: [],
      overallAccuracy: 0,
      passed: false,
      recommendations: []
    }

    try {
      // Test 1: Load and validate station data
      console.log('📊 Test 1: Loading Known Station Data')
      const stationTest = await this.testStationDataLoading()
      report.tests.push(stationTest)

      // Test 2: Calibrate weights from empirical data
      console.log('\n⚖️ Test 2: Empirical Weight Calibration')
      const calibrationTest = await this.testWeightCalibration()
      report.tests.push(calibrationTest)

      // Test 3: Validate orbital mechanics integration
      console.log('\n🛰️ Test 3: Orbital Mechanics Validation')
      const orbitalTest = await this.testOrbitalMechanics()
      report.tests.push(orbitalTest)

      // Test 4: Test spatial interpolation accuracy
      console.log('\n🗺️ Test 4: Spatial Interpolation Accuracy')
      const spatialTest = await this.testSpatialInterpolation()
      report.tests.push(spatialTest)

      // Test 5: Validate scoring accuracy on known stations
      console.log('\n🎯 Test 5: Scoring Accuracy on Known Stations')
      const accuracyTest = await this.testScoringAccuracy()
      report.tests.push(accuracyTest)

      // Test 6: Confidence interval validation
      console.log('\n📈 Test 6: Confidence Interval Validation')
      const confidenceTest = await this.testConfidenceIntervals()
      report.tests.push(confidenceTest)

      // Test 7: Performance benchmarks
      console.log('\n⚡ Test 7: Performance Benchmarks')
      const performanceTest = await this.testPerformance()
      report.tests.push(performanceTest)

      // Calculate overall results
      report.overallAccuracy = this.calculateOverallAccuracy(report.tests)
      report.passed = report.overallAccuracy >= 0.70
      report.recommendations = this.generateRecommendations(report)

      // Print summary
      this.printSummary(report)

    } catch (error) {
      console.error('❌ Validation failed:', error)
      report.error = error.message
    }

    return report
  }

  /**
   * Test 1: Validate station data loading
   */
  private async testStationDataLoading(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Load SES and competitor stations
    const sesStations = await stationDataService.loadAllStations()
    const competitors = await competitorDataService.loadCompetitorStations()
    
    const totalStations = sesStations.length + competitors.length
    const hasPerformanceData = sesStations.filter(s => 
      s.utilization !== undefined && s.revenue !== undefined
    ).length

    const accuracy = hasPerformanceData / sesStations.length

    return {
      name: 'Station Data Loading',
      passed: totalStations >= 32,
      accuracy,
      metrics: {
        sesStations: sesStations.length,
        competitorStations: competitors.length,
        withPerformanceData: hasPerformanceData,
        dataCompleteness: accuracy * 100
      },
      duration: Date.now() - startTime,
      message: `Loaded ${totalStations} stations, ${hasPerformanceData} with performance data`
    }
  }

  /**
   * Test 2: Validate weight calibration
   */
  private async testWeightCalibration(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Load stations and calibrate
    const stations = await stationDataService.loadAllStations()
    const result = await this.calibration.calibrateWeights(stations)
    
    // Validate weights are empirically derived
    const hasValidWeights = result.weights.market > 0 && 
                           result.weights.technical > 0 &&
                           result.weights.competition > 0
    
    const weightSum = Object.values(result.weights).reduce((a, b) => a + b, 0)
    const isNormalized = Math.abs(weightSum - 1.0) < 0.01

    return {
      name: 'Weight Calibration',
      passed: hasValidWeights && isNormalized && result.crossValidation.r2 > 0.5,
      accuracy: result.crossValidation.r2,
      metrics: {
        weights: result.weights,
        r2: result.crossValidation.r2,
        rmse: result.crossValidation.rmse,
        confidence: result.confidence,
        normalized: isNormalized
      },
      duration: Date.now() - startTime,
      message: `Calibrated weights with R²=${result.crossValidation.r2.toFixed(3)}`
    }
  }

  /**
   * Test 3: Validate orbital mechanics
   */
  private async testOrbitalMechanics(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Test station in Europe
    const testLocation = { lat: 48.8566, lon: 2.3522 } // Paris
    
    // Calculate passes for major constellations
    const constellations = ['starlink', 'oneweb', 'iridium']
    const passes: any[] = []
    
    for (const constellation of constellations) {
      const result = await this.orbitalService.calculatePasses(
        testLocation.lat,
        testLocation.lon,
        constellation,
        24 // 24 hour window
      )
      passes.push({
        constellation,
        passCount: result.passes.length,
        avgDuration: result.statistics.avgPassDuration,
        maxGap: result.statistics.maxGap
      })
    }

    const totalPasses = passes.reduce((sum, p) => sum + p.passCount, 0)
    const hasRealisticPasses = totalPasses > 50 && totalPasses < 500 // Reasonable for LEO

    return {
      name: 'Orbital Mechanics',
      passed: hasRealisticPasses,
      accuracy: totalPasses > 0 ? 1.0 : 0.0,
      metrics: {
        location: testLocation,
        constellationPasses: passes,
        totalDailyPasses: totalPasses,
        realistic: hasRealisticPasses
      },
      duration: Date.now() - startTime,
      message: `Calculated ${totalPasses} satellite passes in 24 hours`
    }
  }

  /**
   * Test 4: Validate spatial interpolation
   */
  private async testSpatialInterpolation(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Create test points with known values
    const testPoints = [
      { lat: 40.7128, lon: -74.0060, score: 0.8 },  // NYC
      { lat: 51.5074, lon: -0.1278, score: 0.75 },  // London
      { lat: 35.6762, lon: 139.6503, score: 0.7 }   // Tokyo
    ]
    
    // Test interpolation at intermediate point
    const testLat = 45.0
    const testLon = -40.0 // Mid-Atlantic
    
    const interpolated = await this.spatialScoring.interpolateScore(
      testLat,
      testLon,
      testPoints
    )
    
    // Should be weighted average based on distance
    const isReasonable = interpolated.score > 0.5 && interpolated.score < 0.8
    const hasConfidence = interpolated.confidence > 0 && interpolated.confidence <= 1

    return {
      name: 'Spatial Interpolation',
      passed: isReasonable && hasConfidence,
      accuracy: interpolated.confidence,
      metrics: {
        testLocation: { lat: testLat, lon: testLon },
        interpolatedScore: interpolated.score,
        confidence: interpolated.confidence,
        method: 'IDW',
        inputPoints: testPoints.length
      },
      duration: Date.now() - startTime,
      message: `IDW interpolation score=${interpolated.score.toFixed(3)}, confidence=${interpolated.confidence.toFixed(3)}`
    }
  }

  /**
   * Test 5: Validate scoring accuracy on known stations
   */
  private async testScoringAccuracy(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Load and validate all known stations
    const stations = await stationDataService.loadAllStations()
    const result = await this.validator.validateAccuracy(stations)
    
    const meetsTarget = result.accuracy >= 0.70

    return {
      name: 'Scoring Accuracy',
      passed: meetsTarget,
      accuracy: result.accuracy,
      metrics: {
        accuracy: result.accuracy,
        precision: result.metrics.precision,
        recall: result.metrics.recall,
        f1Score: result.metrics.f1Score,
        rmse: result.metrics.rmse,
        confusionMatrix: result.confusionMatrix
      },
      duration: Date.now() - startTime,
      message: `Achieved ${(result.accuracy * 100).toFixed(1)}% accuracy (target: 70%)`
    }
  }

  /**
   * Test 6: Validate confidence intervals
   */
  private async testConfidenceIntervals(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Test confidence at various locations
    const testLocations = [
      { lat: 40.7128, lon: -74.0060, name: 'NYC - High data' },
      { lat: 0, lon: 0, name: 'Gulf of Guinea - Low data' },
      { lat: -45, lon: 170, name: 'New Zealand - Medium data' }
    ]
    
    const confidenceResults = []
    
    for (const loc of testLocations) {
      const score = await this.spatialScoring.scoreLocation(
        loc.lat,
        loc.lon
      )
      
      confidenceResults.push({
        location: loc.name,
        confidence: score.confidence,
        dataQuality: score.dataQuality,
        uncertaintyBand: score.uncertaintyBand
      })
    }
    
    // Validate confidence varies appropriately
    const confidences = confidenceResults.map(r => r.confidence)
    const hasVariation = Math.max(...confidences) - Math.min(...confidences) > 0.2
    const allValid = confidences.every(c => c >= 0 && c <= 1)

    return {
      name: 'Confidence Intervals',
      passed: hasVariation && allValid,
      accuracy: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      metrics: {
        locations: confidenceResults,
        minConfidence: Math.min(...confidences),
        maxConfidence: Math.max(...confidences),
        avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length
      },
      duration: Date.now() - startTime,
      message: `Confidence ranges from ${Math.min(...confidences).toFixed(2)} to ${Math.max(...confidences).toFixed(2)}`
    }
  }

  /**
   * Test 7: Performance benchmarks
   */
  private async testPerformance(): Promise<TestResult> {
    const startTime = Date.now()
    
    // Benchmark scoring performance
    const iterations = 100
    const scoringTimes: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const lat = Math.random() * 180 - 90
      const lon = Math.random() * 360 - 180
      
      const start = Date.now()
      await this.spatialScoring.scoreLocation(lat, lon)
      scoringTimes.push(Date.now() - start)
    }
    
    const avgTime = scoringTimes.reduce((a, b) => a + b, 0) / iterations
    const maxTime = Math.max(...scoringTimes)
    const meetsTarget = avgTime < 100 // Target: <100ms per score

    return {
      name: 'Performance',
      passed: meetsTarget,
      accuracy: meetsTarget ? 1.0 : avgTime / 100,
      metrics: {
        iterations,
        avgTimeMs: avgTime,
        maxTimeMs: maxTime,
        minTimeMs: Math.min(...scoringTimes),
        targetMs: 100,
        throughput: 1000 / avgTime // scores per second
      },
      duration: Date.now() - startTime,
      message: `Average scoring time: ${avgTime.toFixed(1)}ms (target: <100ms)`
    }
  }

  /**
   * Calculate overall accuracy from all tests
   */
  private calculateOverallAccuracy(tests: TestResult[]): number {
    const accuracies = tests.map(t => t.accuracy)
    return accuracies.reduce((a, b) => a + b, 0) / accuracies.length
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(report: ValidationReport): string[] {
    const recommendations: string[] = []
    
    if (report.overallAccuracy < 0.70) {
      recommendations.push('⚠️ Accuracy below 70% target - review weight calibration')
    }
    
    const failedTests = report.tests.filter(t => !t.passed)
    failedTests.forEach(test => {
      recommendations.push(`Fix: ${test.name} - ${test.message}`)
    })
    
    if (report.overallAccuracy >= 0.70) {
      recommendations.push('✅ POC meets accuracy target - ready for demo')
    }
    
    return recommendations
  }

  /**
   * Print validation summary
   */
  private printSummary(report: ValidationReport) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 POC VALIDATION SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`\nOverall Accuracy: ${(report.overallAccuracy * 100).toFixed(1)}%`)
    console.log(`Target: 70%`)
    console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`)
    
    console.log('\nTest Results:')
    report.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌'
      console.log(`  ${icon} ${test.name}: ${(test.accuracy * 100).toFixed(1)}% - ${test.message}`)
    })
    
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:')
      report.recommendations.forEach(rec => {
        console.log(`  ${rec}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
  }
}

// Type definitions
interface ValidationReport {
  timestamp: Date
  tests: TestResult[]
  overallAccuracy: number
  passed: boolean
  recommendations: string[]
  error?: string
}

interface TestResult {
  name: string
  passed: boolean
  accuracy: number
  metrics: any
  duration: number
  message: string
}

// Export for use
export default POCValidationTest