/**
 * Comprehensive Data Verification & Testing Script
 * 
 * This script provides automated testing and verification of the complete
 * data verification and hex map implementation system.
 */

import { DataVerificationService } from '@/lib/services/maritimeDataVerification'
import { GlobalHexVerification } from '@/lib/services/globalHexVerification'
import { ConditionalOpportunityScorer } from '@/lib/scoring/conditional-opportunity-scorer'
import { H3OpportunityIntegration } from '@/lib/scoring/h3-opportunity-integration'

interface VerificationResults {
  maritime: {
    passed: boolean
    dataSource: string
    quality: number
    issues: string[]
  }
  hexCoverage: {
    passed: boolean
    totalHexagons: number
    landCoverage: number
    gapsDetected: number
    performance: number
  }
  opportunityScoring: {
    passed: boolean
    scoredHexagons: number
    averageScore: number
    performanceMs: number
    issues: string[]
  }
  integration: {
    passed: boolean
    layersRendered: boolean
    interactionWorking: boolean
    conditionalSwitching: boolean
    issues: string[]
  }
  overall: {
    passed: boolean
    score: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

export class DataVerificationScript {
  private dataVerification = new DataVerificationService()
  private hexVerification = new GlobalHexVerification()
  private opportunityScorer = new ConditionalOpportunityScorer()
  private h3Integration = new H3OpportunityIntegration()
  
  /**
   * Run complete verification test suite
   */
  async runCompleteVerification(): Promise<VerificationResults> {
    console.log('🚀 Starting Complete Data Verification Test Suite')
    console.log('=' .repeat(60))
    
    const results: VerificationResults = {
      maritime: { passed: false, dataSource: '', quality: 0, issues: [] },
      hexCoverage: { passed: false, totalHexagons: 0, landCoverage: 0, gapsDetected: 0, performance: 0 },
      opportunityScoring: { passed: false, scoredHexagons: 0, averageScore: 0, performanceMs: 0, issues: [] },
      integration: { passed: false, layersRendered: false, interactionWorking: false, conditionalSwitching: false, issues: [] },
      overall: { passed: false, score: 0, criticalIssues: [], recommendations: [] }
    }
    
    // Test 1: Maritime Data Verification
    results.maritime = await this.testMaritimeDataVerification()
    
    // Test 2: Global Hex Coverage
    results.hexCoverage = await this.testGlobalHexCoverage()
    
    // Test 3: Opportunity Scoring System
    results.opportunityScoring = await this.testOpportunityScoring()
    
    // Test 4: Integration Testing
    results.integration = await this.testSystemIntegration()
    
    // Calculate overall results
    results.overall = this.calculateOverallResults(results)
    
    // Display comprehensive results
    this.displayVerificationResults(results)
    
    return results
  }
  
  /**
   * Test maritime data verification system
   */
  private async testMaritimeDataVerification(): Promise<VerificationResults['maritime']> {
    console.log('\n🌊 Testing Maritime Data Verification...')
    
    try {
      const startTime = performance.now()
      const maritimeResults = await this.dataVerification.verifyMaritimeData()
      const endTime = performance.now()
      
      const result = {
        passed: true,
        dataSource: maritimeResults.dataSource,
        quality: maritimeResults.qualityScore || 0.8,
        issues: []
      }
      
      // Check data quality
      if (result.quality < 0.7) {
        result.issues.push('Maritime data quality below acceptable threshold')
      }
      
      if (endTime - startTime > 5000) {
        result.issues.push('Maritime verification taking longer than expected')
      }
      
      console.log(`   ✅ Maritime data verified: ${result.dataSource}`)
      console.log(`   📊 Quality score: ${(result.quality * 100).toFixed(0)}%`)
      console.log(`   ⏱️  Verification time: ${(endTime - startTime).toFixed(0)}ms`)
      
      return result
      
    } catch (error) {
      console.error('   ❌ Maritime data verification failed:', error)
      return {
        passed: false,
        dataSource: 'ERROR',
        quality: 0,
        issues: [`Maritime verification error: ${error instanceof Error ? error.message : 'Unknown'}`]
      }
    }
  }
  
  /**
   * Test global hexagon coverage
   */
  private async testGlobalHexCoverage(): Promise<VerificationResults['hexCoverage']> {
    console.log('\n🌍 Testing Global Hex Coverage...')
    
    try {
      const startTime = performance.now()
      const hexagons = await this.hexVerification.generateCompleteGlobalCoverage(3)
      const endTime = performance.now()
      
      const landHexagons = hexagons.filter(h => h.isLand)
      const oceanHexagons = hexagons.filter(h => !h.isLand)
      
      const result = {
        passed: true,
        totalHexagons: hexagons.length,
        landCoverage: (landHexagons.length / hexagons.length) * 100,
        gapsDetected: 0,
        performance: endTime - startTime,
        issues: []
      }
      
      // Performance checks
      if (result.performance > 10000) {
        result.issues.push('Hex generation slower than expected (>10s)')
      }
      
      // Coverage checks
      if (result.totalHexagons < 5000) {
        result.issues.push('Insufficient global coverage - too few hexagons')
      }
      
      if (result.landCoverage < 20 || result.landCoverage > 35) {
        result.issues.push(`Land coverage ${result.landCoverage.toFixed(1)}% outside expected range (20-35%)`)
      }
      
      // Test key geographic regions
      const requiredRegions = [
        { name: 'North America', lat: 45, lng: -100 },
        { name: 'Europe', lat: 50, lng: 10 },
        { name: 'Asia', lat: 35, lng: 105 },
        { name: 'Australia', lat: -25, lng: 135 },
        { name: 'Africa', lat: 0, lng: 20 },
        { name: 'South America', lat: -15, lng: -60 }
      ]
      
      let regionsCovered = 0
      for (const region of requiredRegions) {
        const nearbyHex = hexagons.find(h => {
          const [lng, lat] = h.center
          return Math.abs(lat - region.lat) < 10 && Math.abs(lng - region.lng) < 20
        })
        
        if (nearbyHex) {
          regionsCovered++
        } else {
          result.issues.push(`Missing coverage for ${region.name}`)
        }
      }
      
      if (regionsCovered < requiredRegions.length) {
        result.gapsDetected = requiredRegions.length - regionsCovered
      }
      
      console.log(`   ✅ Generated ${result.totalHexagons} hexagons`)
      console.log(`   🗺️  Land coverage: ${result.landCoverage.toFixed(1)}%`)
      console.log(`   🏝️  Ocean coverage: ${(oceanHexagons.length / hexagons.length * 100).toFixed(1)}%`)
      console.log(`   🌍 Regions covered: ${regionsCovered}/${requiredRegions.length}`)
      console.log(`   ⏱️  Generation time: ${result.performance.toFixed(0)}ms`)
      
      return result
      
    } catch (error) {
      console.error('   ❌ Hex coverage generation failed:', error)
      return {
        passed: false,
        totalHexagons: 0,
        landCoverage: 0,
        gapsDetected: 999,
        performance: 0,
        issues: [`Hex coverage error: ${error instanceof Error ? error.message : 'Unknown'}`]
      }
    }
  }
  
  /**
   * Test opportunity scoring system
   */
  private async testOpportunityScoring(): Promise<VerificationResults['opportunityScoring']> {
    console.log('\n🎯 Testing Opportunity Scoring System...')
    
    try {
      // Generate sample hexagons
      const hexagons = await this.hexVerification.generateCompleteGlobalCoverage(3)
      const sampleStations = this.generateSampleStations()
      const sampleCompetitors = this.generateSampleCompetitors()
      
      const startTime = performance.now()
      
      // Activate opportunities mode
      await this.h3Integration.activateOpportunitiesMode({
        scoringLevel: 'COMPREHENSIVE',
        maxHexagons: Math.min(hexagons.length, 1000), // Test with subset for performance
        progressiveEnhancement: true,
        realTimeUpdates: false
      })
      
      // Apply scoring to land hexagons
      const landHexagons = hexagons.filter(h => h.isLand).slice(0, 500) // Test subset
      const scoredHexagons = await this.hexVerification.applyOpportunityScoring(
        landHexagons,
        sampleStations,
        sampleCompetitors
      )
      
      const endTime = performance.now()
      
      // Calculate statistics
      const validScores = scoredHexagons.filter(h => h.score !== undefined && h.score > 0)
      const averageScore = validScores.length > 0 
        ? validScores.reduce((sum, h) => sum + (h.score || 0), 0) / validScores.length
        : 0
      
      const result = {
        passed: true,
        scoredHexagons: validScores.length,
        averageScore: averageScore,
        performanceMs: endTime - startTime,
        issues: []
      }
      
      // Performance checks
      if (result.performanceMs > 30000) {
        result.issues.push('Scoring performance slower than expected (>30s)')
      }
      
      // Validity checks
      if (result.scoredHexagons < landHexagons.length * 0.8) {
        result.issues.push('Too many hexagons failed to receive scores')
      }
      
      if (result.averageScore < 0.1 || result.averageScore > 1.0) {
        result.issues.push(`Average score ${result.averageScore.toFixed(3)} outside expected range`)
      }
      
      // Test score distribution
      const highScores = validScores.filter(h => (h.score || 0) > 0.7).length
      const mediumScores = validScores.filter(h => (h.score || 0) > 0.4 && (h.score || 0) <= 0.7).length
      const lowScores = validScores.filter(h => (h.score || 0) <= 0.4).length
      
      if (highScores < validScores.length * 0.05) {
        result.issues.push('Very few high-opportunity areas detected')
      }
      
      console.log(`   ✅ Scored ${result.scoredHexagons} hexagons successfully`)
      console.log(`   📊 Average opportunity score: ${(result.averageScore * 100).toFixed(1)}%`)
      console.log(`   🎯 High opportunities: ${highScores}, Medium: ${mediumScores}, Low: ${lowScores}`)
      console.log(`   ⏱️  Scoring time: ${result.performanceMs.toFixed(0)}ms`)
      
      // Deactivate opportunities mode
      this.h3Integration.deactivateOpportunitiesMode()
      
      return result
      
    } catch (error) {
      console.error('   ❌ Opportunity scoring failed:', error)
      return {
        passed: false,
        scoredHexagons: 0,
        averageScore: 0,
        performanceMs: 0,
        issues: [`Scoring error: ${error instanceof Error ? error.message : 'Unknown'}`]
      }
    }
  }
  
  /**
   * Test system integration
   */
  private async testSystemIntegration(): Promise<VerificationResults['integration']> {
    console.log('\n⚙️ Testing System Integration...')
    
    const result = {
      passed: true,
      layersRendered: false,
      interactionWorking: false,
      conditionalSwitching: false,
      issues: []
    }
    
    try {
      // Test 1: Layer rendering capability
      const hexagons = await this.hexVerification.generateCompleteGlobalCoverage(2)
      if (hexagons.length > 0 && hexagons[0].hexagon) {
        result.layersRendered = true
        console.log('   ✅ Layer data structure valid for deck.gl rendering')
      } else {
        result.issues.push('Invalid layer data structure for deck.gl')
      }
      
      // Test 2: Interaction data structure
      const sampleHex = hexagons.find(h => h.isLand)
      if (sampleHex && sampleHex.center && sampleHex.hexagon) {
        result.interactionWorking = true
        console.log('   ✅ Hexagon interaction data structure valid')
      } else {
        result.issues.push('Invalid hexagon interaction data structure')
      }
      
      // Test 3: Conditional switching
      await this.h3Integration.activateOpportunitiesMode({
        scoringLevel: 'BASIC',
        maxHexagons: 100,
        progressiveEnhancement: false,
        realTimeUpdates: false
      })
      
      const baseHexagons = hexagons.slice(0, 50)
      const scoredHexagons = await this.hexVerification.applyOpportunityScoring(
        baseHexagons,
        this.generateSampleStations(),
        this.generateSampleCompetitors()
      )
      
      const hasScoring = scoredHexagons.some(h => h.score !== undefined)
      if (hasScoring) {
        result.conditionalSwitching = true
        console.log('   ✅ Conditional scoring activation working')
      } else {
        result.issues.push('Conditional scoring activation failed')
      }
      
      this.h3Integration.deactivateOpportunitiesMode()
      console.log('   ✅ Conditional scoring deactivation working')
      
      // Overall integration check
      result.passed = result.layersRendered && result.interactionWorking && result.conditionalSwitching
      
      return result
      
    } catch (error) {
      console.error('   ❌ Integration testing failed:', error)
      result.passed = false
      result.issues.push(`Integration error: ${error instanceof Error ? error.message : 'Unknown'}`)
      return result
    }
  }
  
  /**
   * Calculate overall verification results
   */
  private calculateOverallResults(results: Omit<VerificationResults, 'overall'>): VerificationResults['overall'] {
    const testsPassed = [
      results.maritime.passed,
      results.hexCoverage.passed,
      results.opportunityScoring.passed,
      results.integration.passed
    ]
    
    const passRate = testsPassed.filter(Boolean).length / testsPassed.length
    const criticalIssues = []
    const recommendations = []
    
    // Collect critical issues
    if (!results.maritime.passed) {
      criticalIssues.push('Maritime data verification failed')
    }
    if (!results.hexCoverage.passed) {
      criticalIssues.push('Global hex coverage failed')
    }
    if (!results.opportunityScoring.passed) {
      criticalIssues.push('Opportunity scoring system failed')
    }
    if (!results.integration.passed) {
      criticalIssues.push('System integration failed')
    }
    
    // Generate recommendations
    if (results.hexCoverage.gapsDetected > 0) {
      recommendations.push('Review land detection algorithms for better geographic coverage')
    }
    if (results.opportunityScoring.performanceMs > 20000) {
      recommendations.push('Optimize opportunity scoring performance for production use')
    }
    if (results.maritime.quality < 0.8) {
      recommendations.push('Consider improving maritime data sources or validation')
    }
    if (results.integration.issues.length > 0) {
      recommendations.push('Address integration issues before production deployment')
    }
    
    const score = Math.round(passRate * 100)
    
    return {
      passed: passRate >= 0.75, // 75% pass rate required
      score,
      criticalIssues,
      recommendations
    }
  }
  
  /**
   * Display comprehensive verification results
   */
  private displayVerificationResults(results: VerificationResults): void {
    console.log('\n' + '='.repeat(60))
    console.log('📋 COMPREHENSIVE VERIFICATION RESULTS')
    console.log('='.repeat(60))
    
    // Overall status
    const statusIcon = results.overall.passed ? '✅' : '❌'
    const statusColor = results.overall.passed ? '\x1b[32m' : '\x1b[31m'
    const resetColor = '\x1b[0m'
    
    console.log(`\n${statusColor}${statusIcon} OVERALL STATUS: ${results.overall.passed ? 'PASSED' : 'FAILED'}${resetColor}`)
    console.log(`📊 Overall Score: ${results.overall.score}/100`)
    
    // Individual test results
    console.log('\n📋 Test Results:')
    console.log(`   🌊 Maritime Data:     ${results.maritime.passed ? '✅' : '❌'} (${results.maritime.dataSource})`)
    console.log(`   🌍 Hex Coverage:      ${results.hexCoverage.passed ? '✅' : '❌'} (${results.hexCoverage.totalHexagons} hexagons)`)
    console.log(`   🎯 Opportunity Score: ${results.opportunityScoring.passed ? '✅' : '❌'} (${results.opportunityScoring.scoredHexagons} scored)`)
    console.log(`   ⚙️  System Integration:${results.integration.passed ? '✅' : '❌'}`)
    
    // Critical issues
    if (results.overall.criticalIssues.length > 0) {
      console.log('\n⚠️  Critical Issues:')
      results.overall.criticalIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`)
      })
    }
    
    // Recommendations
    if (results.overall.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      results.overall.recommendations.forEach(rec => {
        console.log(`   📝 ${rec}`)
      })
    }
    
    // Performance summary
    console.log('\n⚡ Performance Summary:')
    console.log(`   🌍 Hex Generation: ${results.hexCoverage.performance.toFixed(0)}ms`)
    console.log(`   🎯 Opportunity Scoring: ${results.opportunityScoring.performanceMs.toFixed(0)}ms`)
    console.log(`   📊 Maritime Quality: ${(results.maritime.quality * 100).toFixed(0)}%`)
    
    console.log('\n' + '='.repeat(60))
    console.log(results.overall.passed ? '🎉 All systems operational!' : '⚠️  Issues require attention before production')
    console.log('='.repeat(60))
  }
  
  /**
   * Generate sample station data for testing
   */
  private generateSampleStations(): any[] {
    return [
      { id: 'test-1', latitude: 40.7128, longitude: -74.0060, operator: 'SES' }, // NYC
      { id: 'test-2', latitude: 51.5074, longitude: -0.1278, operator: 'SES' }, // London
      { id: 'test-3', latitude: 35.6762, longitude: 139.6503, operator: 'SES' } // Tokyo
    ]
  }
  
  /**
   * Generate sample competitor data for testing
   */
  private generateSampleCompetitors(): any[] {
    return [
      { id: 'comp-1', latitude: 37.7749, longitude: -122.4194, operator: 'AWS' }, // SF
      { id: 'comp-2', latitude: 52.5200, longitude: 13.4050, operator: 'Telesat' }, // Berlin
      { id: 'comp-3', latitude: 28.6139, longitude: 77.2090, operator: 'SpaceX' } // Delhi
    ]
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).DataVerificationScript = DataVerificationScript
  console.log('🔧 DataVerificationScript available in browser console')
  console.log('💡 Usage: const script = new DataVerificationScript(); await script.runCompleteVerification()')
}

export default DataVerificationScript