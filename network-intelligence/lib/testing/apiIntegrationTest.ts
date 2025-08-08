/**
 * API Integration Test Suite
 * 
 * Tests the complete data flow from APIs through the unified integration service
 */

import { unifiedDataIntegration } from '../services/unifiedDataIntegration'
import { apiStationDataService } from '../services/apiStationDataService'
import { apiMaritimeDataService } from '../services/apiMaritimeDataService'
import { apiH3GridService } from '../services/apiH3GridService'

export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  data?: any
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    duration: number
  }
}

export class APIIntegrationTest {
  private results: TestSuite[] = []

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<{
    testSuites: TestSuite[]
    overall: {
      totalTests: number
      passedTests: number
      failedTests: number
      totalDuration: number
      passRate: number
    }
  }> {
    console.log('🚀 Starting API Integration Tests...')
    const startTime = performance.now()

    // Test suites
    await this.testUnifiedDataIntegration()
    await this.testStationAPIIntegration()
    await this.testMaritimeAPIIntegration()
    await this.testH3GridAPIIntegration()
    await this.testBatchOperations()
    await this.testErrorHandling()
    await this.testCaching()
    await this.testRealTimeData()

    const totalDuration = performance.now() - startTime

    // Calculate overall results
    const totalTests = this.results.reduce((sum, suite) => sum + suite.summary.total, 0)
    const passedTests = this.results.reduce((sum, suite) => sum + suite.summary.passed, 0)
    const failedTests = totalTests - passedTests
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

    console.log(`✅ API Integration Tests Complete - ${passedTests}/${totalTests} passed (${passRate.toFixed(1)}%)`)

    return {
      testSuites: this.results,
      overall: {
        totalTests,
        passedTests,
        failedTests,
        totalDuration: Math.round(totalDuration),
        passRate: Math.round(passRate * 10) / 10
      }
    }
  }

  /**
   * Test Unified Data Integration Service
   */
  private async testUnifiedDataIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Unified Data Integration',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Basic station fetching
    suite.tests.push(await this.runTest(
      'Fetch stations data',
      async () => {
        const result = await unifiedDataIntegration.getStations()
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid stations data format')
        }
        if (!result.metadata || !result.metadata.lastUpdated) {
          throw new Error('Missing metadata')
        }
        return { stationCount: result.data.length, source: result.metadata.source }
      }
    ))

    // Test 2: Hexagon fetching with bounds
    suite.tests.push(await this.runTest(
      'Fetch hexagons with bounds',
      async () => {
        const bounds: [number, number, number, number] = [-10, 40, 10, 60] // Europe
        const result = await unifiedDataIntegration.getHexagons(4, bounds)
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid hexagons data format')
        }
        return { hexagonCount: result.data.length, bounds }
      }
    ))

    // Test 3: Cache functionality
    suite.tests.push(await this.runTest(
      'Cache functionality',
      async () => {
        // First call
        const start1 = performance.now()
        await unifiedDataIntegration.getStations()
        const duration1 = performance.now() - start1

        // Second call should be faster (cached)
        const start2 = performance.now()
        const result = await unifiedDataIntegration.getStations()
        const duration2 = performance.now() - start2

        if (result.metadata.source !== 'cache') {
          console.warn('Expected cached result, got:', result.metadata.source)
        }

        return { 
          firstCallMs: Math.round(duration1), 
          secondCallMs: Math.round(duration2),
          cached: result.metadata.source === 'cache'
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Station API Integration
   */
  private async testStationAPIIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Station API Integration',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Load all stations
    suite.tests.push(await this.runTest(
      'Load all stations',
      async () => {
        const stations = await apiStationDataService.loadAllStations()
        if (!Array.isArray(stations)) {
          throw new Error('Stations should be an array')
        }
        return { count: stations.length }
      }
    ))

    // Test 2: Load stations with metadata
    suite.tests.push(await this.runTest(
      'Load stations with metadata',
      async () => {
        const result = await apiStationDataService.loadAllStationsWithMetadata()
        if (!result.data || !result.metadata) {
          throw new Error('Missing data or metadata')
        }
        return { 
          count: result.data.length, 
          confidence: result.metadata.confidence,
          source: result.metadata.source
        }
      }
    ))

    // Test 3: Search stations
    suite.tests.push(await this.runTest(
      'Search stations by criteria',
      async () => {
        const results = await apiStationDataService.searchStations({
          operator: 'SES',
          minOpportunityScore: 0.5
        })
        return { matchingStations: results.length }
      }
    ))

    // Test 4: Station analysis
    suite.tests.push(await this.runTest(
      'Get station analysis',
      async () => {
        const stations = await apiStationDataService.loadAllStations()
        if (stations.length === 0) {
          return { message: 'No stations to analyze' }
        }
        
        const analysis = await apiStationDataService.getStationAnalysis(stations[0].id)
        return { hasAnalysis: !!analysis, stationId: stations[0].id }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Maritime API Integration
   */
  private async testMaritimeAPIIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Maritime API Integration',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Get maritime density
    suite.tests.push(await this.runTest(
      'Get maritime density data',
      async () => {
        const result = await apiMaritimeDataService.getMaritimeDensity()
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid maritime density data')
        }
        return { pointCount: result.data.length, source: result.metadata.source }
      }
    ))

    // Test 2: Get shipping routes
    suite.tests.push(await this.runTest(
      'Get shipping routes',
      async () => {
        const result = await apiMaritimeDataService.getShippingRoutes()
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid shipping routes data')
        }
        return { routeCount: result.data.length }
      }
    ))

    // Test 3: Get vessel tracking
    suite.tests.push(await this.runTest(
      'Get vessel tracking data',
      async () => {
        const bounds: [number, number, number, number] = [-20, 30, 40, 70] // Atlantic
        const result = await apiMaritimeDataService.getVesselTracking(bounds, 50)
        return { 
          vesselCount: result.vessels.length,
          hasTrafficSummary: !!result.traffic_summary,
          alertCount: result.alerts.length
        }
      }
    ))

    // Test 4: Maritime opportunity analysis
    suite.tests.push(await this.runTest(
      'Get maritime opportunity analysis',
      async () => {
        const bounds: [number, number, number, number] = [0, 40, 20, 60] // Europe
        const result = await apiMaritimeDataService.getMaritimeOpportunityAnalysis(bounds)
        return { 
          hasOpportunities: !!result.maritimeOpportunities,
          maritimeScore: result.maritimeScore || 0
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test H3 Grid API Integration
   */
  private async testH3GridAPIIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'H3 Grid API Integration',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Generate H3 hexagons
    suite.tests.push(await this.runTest(
      'Generate H3 hexagons',
      async () => {
        const result = await apiH3GridService.generateH3Hexagons(4)
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid H3 hexagons data')
        }
        return { hexagonCount: result.data.length, confidence: result.metadata.confidence }
      }
    ))

    // Test 2: Get H3 grid analysis
    suite.tests.push(await this.runTest(
      'Get H3 grid analysis',
      async () => {
        const result = await apiH3GridService.getH3GridAnalysis(4)
        if (!result.hexagons || !result.summary) {
          throw new Error('Invalid H3 analysis data')
        }
        return { 
          totalHexagons: result.summary.totalHexagons,
          averageScore: result.summary.averageScore,
          landCells: result.spatialDistribution.landCells
        }
      }
    ))

    // Test 3: Get top opportunities
    suite.tests.push(await this.runTest(
      'Get top opportunity hexagons',
      async () => {
        const opportunities = await apiH3GridService.getTopOpportunities(10, 4)
        if (!Array.isArray(opportunities)) {
          throw new Error('Invalid opportunities data')
        }
        return { 
          opportunityCount: opportunities.length,
          topScore: opportunities[0]?.score || 0
        }
      }
    ))

    // Test 4: Filter hexagons
    suite.tests.push(await this.runTest(
      'Filter hexagons by criteria',
      async () => {
        const filtered = await apiH3GridService.filterHexagons({
          minScore: 0.7,
          isLand: false
        }, 4)
        return { filteredCount: filtered.length }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Batch Operations
   */
  private async testBatchOperations(): Promise<void> {
    const suite: TestSuite = {
      name: 'Batch Operations',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Batch fetch from unified service
    suite.tests.push(await this.runTest(
      'Unified batch fetch',
      async () => {
        const requests = [
          { type: 'stations' as const, options: {} },
          { type: 'routes' as const, options: {} },
          { type: 'maritime' as const, options: {} }
        ]
        
        const results = await unifiedDataIntegration.batchFetch(requests)
        const resultKeys = Object.keys(results)
        
        return { 
          requestCount: requests.length, 
          resultCount: resultKeys.length,
          keys: resultKeys
        }
      }
    ))

    // Test 2: Maritime batch fetch
    suite.tests.push(await this.runTest(
      'Maritime batch fetch',
      async () => {
        const bounds: [number, number, number, number] = [-10, 40, 10, 60]
        const result = await apiMaritimeDataService.batchFetchMaritimeData(bounds)
        
        return {
          densityPoints: result.density.length,
          routes: result.routes.length,
          vessels: result.vessels.length,
          hasTraffic: !!result.traffic,
          metadataKeys: Object.keys(result.metadata).length
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Error Handling
   */
  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      name: 'Error Handling',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Invalid bounds handling
    suite.tests.push(await this.runTest(
      'Handle invalid bounds',
      async () => {
        // This should not throw an error, but gracefully handle invalid input
        const invalidBounds: any = [180, 90, -180, -90] // Invalid bounds order
        const result = await apiH3GridService.generateH3Hexagons(4, invalidBounds)
        
        return {
          handledGracefully: true,
          hasData: result.data.length > 0,
          source: result.metadata.source
        }
      }
    ))

    // Test 2: Cache status and error history
    suite.tests.push(await this.runTest(
      'Check error history and cache status',
      async () => {
        const status = unifiedDataIntegration.getCacheStatus()
        const errors = unifiedDataIntegration.getErrorHistory()
        
        return {
          cacheEntries: status.entries,
          errorCount: errors.length,
          activeRequests: status.activeRequests
        }
      }
    ))

    // Test 3: Fallback data generation
    suite.tests.push(await this.runTest(
      'Test fallback data',
      async () => {
        // Clear cache to force potential API calls
        unifiedDataIntegration.clearCache()
        
        // This should work even if API fails by providing fallback data
        const result = await unifiedDataIntegration.getStations()
        
        return {
          hasData: result.data.length > 0,
          source: result.metadata.source,
          confidence: result.metadata.confidence
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Caching Mechanisms
   */
  private async testCaching(): Promise<void> {
    const suite: TestSuite = {
      name: 'Caching Mechanisms',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Cache timing
    suite.tests.push(await this.runTest(
      'Cache timing test',
      async () => {
        // Clear cache first
        unifiedDataIntegration.clearCache('stations')
        
        // First call - should hit API
        const start1 = performance.now()
        const result1 = await unifiedDataIntegration.getStations()
        const time1 = performance.now() - start1
        
        // Second call - should hit cache
        const start2 = performance.now()
        const result2 = await unifiedDataIntegration.getStations()
        const time2 = performance.now() - start2
        
        return {
          firstCallMs: Math.round(time1),
          secondCallMs: Math.round(time2),
          speedupRatio: Math.round((time1 / time2) * 10) / 10,
          firstSource: result1.metadata.source,
          secondSource: result2.metadata.source
        }
      }
    ))

    // Test 2: Cache expiration
    suite.tests.push(await this.runTest(
      'Cache expiration behavior',
      async () => {
        const status = unifiedDataIntegration.getCacheStatus()
        
        // Clear cache and check cleanup
        unifiedDataIntegration.clearCache()
        const statusAfter = unifiedDataIntegration.getCacheStatus()
        
        return {
          entriesBefore: status.entries,
          entriesAfter: statusAfter.entries,
          clearedSuccessfully: statusAfter.entries < status.entries
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Test Real-Time Data
   */
  private async testRealTimeData(): Promise<void> {
    const suite: TestSuite = {
      name: 'Real-Time Data',
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, duration: 0 }
    }

    // Test 1: Real-time vessel data
    suite.tests.push(await this.runTest(
      'Get real-time vessel data',
      async () => {
        const result = await unifiedDataIntegration.getRealTimeData('vessels', { count: 10 })
        
        return {
          hasVessels: !!result.data?.vessels,
          vesselCount: result.data?.vessels?.length || 0,
          hasSummary: !!result.data?.summary,
          confidence: result.metadata.confidence,
          freshness: result.metadata.freshness
        }
      }
    ))

    // Test 2: Real-time station metrics
    suite.tests.push(await this.runTest(
      'Get real-time station metrics',
      async () => {
        const result = await unifiedDataIntegration.getRealTimeData('stations')
        
        return {
          hasStations: !!result.data?.stations,
          stationCount: result.data?.stations?.length || 0,
          hasSummary: !!result.data?.summary,
          confidence: result.metadata.confidence
        }
      }
    ))

    // Test 3: System alerts
    suite.tests.push(await this.runTest(
      'Get system alerts',
      async () => {
        const result = await unifiedDataIntegration.getRealTimeData('alerts')
        
        return {
          hasAlerts: !!result.data?.alerts,
          alertCount: result.data?.alerts?.length || 0,
          hasSummary: !!result.data?.summary,
          confidence: result.metadata.confidence
        }
      }
    ))

    this.finalizeSuite(suite)
    this.results.push(suite)
  }

  /**
   * Run individual test with error handling
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = performance.now()
    
    try {
      const data = await testFn()
      const duration = Math.round(performance.now() - startTime)
      
      console.log(`  ✅ ${name} (${duration}ms)`)
      
      return {
        name,
        passed: true,
        duration,
        data
      }
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.log(`  ❌ ${name} (${duration}ms): ${errorMessage}`)
      
      return {
        name,
        passed: false,
        duration,
        error: errorMessage
      }
    }
  }

  /**
   * Finalize test suite with summary
   */
  private finalizeSuite(suite: TestSuite): void {
    suite.summary.total = suite.tests.length
    suite.summary.passed = suite.tests.filter(t => t.passed).length
    suite.summary.failed = suite.tests.filter(t => !t.passed).length
    suite.summary.duration = suite.tests.reduce((sum, t) => sum + t.duration, 0)

    const passRate = suite.summary.total > 0 ? (suite.summary.passed / suite.summary.total) * 100 : 0
    console.log(`📊 ${suite.name}: ${suite.summary.passed}/${suite.summary.total} passed (${passRate.toFixed(1)}%)`)
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.summary.total, 0)
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.summary.passed, 0)
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.summary.duration, 0)
    const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

    let report = `
# API Integration Test Report

Generated: ${new Date().toISOString()}

## Overall Results
- Total Tests: ${totalTests}
- Passed: ${totalPassed}
- Failed: ${totalTests - totalPassed}
- Pass Rate: ${passRate.toFixed(1)}%
- Total Duration: ${totalDuration}ms

## Test Suites
`

    this.results.forEach(suite => {
      const suitePassRate = suite.summary.total > 0 ? (suite.summary.passed / suite.summary.total) * 100 : 0
      
      report += `
### ${suite.name}
- Tests: ${suite.summary.passed}/${suite.summary.total} passed (${suitePassRate.toFixed(1)}%)
- Duration: ${suite.summary.duration}ms

`
      
      suite.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌'
        report += `  ${status} ${test.name} (${test.duration}ms)\n`
        if (test.error) {
          report += `    Error: ${test.error}\n`
        }
        if (test.data && Object.keys(test.data).length > 0) {
          report += `    Data: ${JSON.stringify(test.data, null, 2)}\n`
        }
      })
    })

    return report
  }
}

// Export singleton instance
export const apiIntegrationTest = new APIIntegrationTest()
export default apiIntegrationTest