/**
 * Statistical Scoring Validation Test
 * 
 * Validates that scoring systems produce statistically sound results
 * against known test cases and expected score ranges.
 * 
 * Expected Test Cases:
 * - NYC (40.7, -74.0): ~85 score (excellent telecom hub)
 * - Ocean (0, 0): ~25 score (poor orbital + no infrastructure)  
 * - Polar (85, 0): ~20 score (extreme orbital penalty)
 */

import { UnifiedDataServiceClient } from '@/lib/data/unified-data-service-client';
import { getRealityBasedSpatialScorer } from '@/lib/scoring/reality-based-spatial-scoring';

export interface ValidationTestCase {
  name: string;
  latitude: number;
  longitude: number;
  expectedScore: number;
  tolerance: number;
  description: string;
}

export interface ValidationResult {
  testCase: ValidationTestCase;
  actualScore: number;
  passed: boolean;
  error: number;
  confidence: number;
  issues: string[];
}

export interface StatisticalValidationReport {
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  overallAccuracy: number;
  rmse: number;
  maxError: number;
  results: ValidationResult[];
  statisticalAnalysis: {
    scoringDistribution: {
      low: number;    // 0-40
      medium: number; // 40-70
      high: number;   // 70-100
    };
    confidenceAnalysis: {
      averageConfidence: number;
      minConfidence: number;
      maxConfidence: number;
    };
    systematicBias: number;
    recommendations: string[];
  };
}

export class StatisticalScoringValidator {
  private unifiedDataService = new UnifiedDataServiceClient();
  private spatialScorer = getRealityBasedSpatialScorer();

  // Definitive test cases based on domain knowledge
  private testCases: ValidationTestCase[] = [
    {
      name: 'NYC - Excellent Telecom Hub',
      latitude: 40.7128,
      longitude: -74.0060,
      expectedScore: 85,
      tolerance: 10,
      description: 'Major financial/telecom hub with excellent infrastructure'
    },
    {
      name: 'Ocean - Mid Atlantic', 
      latitude: 0.0,
      longitude: 0.0,
      expectedScore: 25,
      tolerance: 10,
      description: 'Ocean location with poor orbital access and no infrastructure'
    },
    {
      name: 'Polar - High Arctic',
      latitude: 85.0,
      longitude: 0.0,
      expectedScore: 20,
      tolerance: 8,
      description: 'Extreme polar location with severe orbital penalties'
    },
    {
      name: 'London - Major European Hub',
      latitude: 51.5074,
      longitude: -0.1278,
      expectedScore: 80,
      tolerance: 10,
      description: 'Major European financial/telecom center'
    },
    {
      name: 'Luxembourg - Satellite Hub',
      latitude: 49.6847,
      longitude: 6.3501,
      expectedScore: 90,
      tolerance: 8,
      description: 'Known SES satellite operations hub'
    },
    {
      name: 'Singapore - Asia Pacific Hub',
      latitude: 1.3521,
      longitude: 103.8198,
      expectedScore: 88,
      tolerance: 10,
      description: 'Major Asia-Pacific telecom and shipping hub'
    },
    {
      name: 'Sahara Desert - Remote Land',
      latitude: 23.0,
      longitude: 5.0,
      expectedScore: 35,
      tolerance: 12,
      description: 'Remote desert with poor infrastructure'
    },
    {
      name: 'Antarctic - Extreme Location',
      latitude: -75.0,
      longitude: 0.0,
      expectedScore: 15,
      tolerance: 8,
      description: 'Antarctic location with extreme conditions'
    }
  ];

  /**
   * Run comprehensive statistical validation of scoring systems
   */
  async runValidation(): Promise<StatisticalValidationReport> {
    console.log('🔬 Running Statistical Scoring Validation...');
    console.log(`   Testing ${this.testCases.length} critical test cases`);
    
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    
    // Initialize spatial scorer
    try {
      await this.spatialScorer.initialize();
      console.log('✅ Reality-based spatial scorer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize spatial scorer:', error);
    }

    // Run each test case
    for (const testCase of this.testCases) {
      console.log(`\n   Testing: ${testCase.name} (${testCase.latitude}, ${testCase.longitude})`);
      
      const result = await this.validateTestCase(testCase);
      results.push(result);
      
      const statusIcon = result.passed ? '✅' : '❌';
      const errorStr = result.error > 0 ? ` (error: ${result.error.toFixed(1)})` : '';
      console.log(`   ${statusIcon} Score: ${result.actualScore} (expected: ${testCase.expectedScore})${errorStr}`);
      
      if (!result.passed) {
        result.issues.forEach(issue => console.log(`      ⚠️  ${issue}`));
      }
    }

    const report = this.generateReport(results);
    
    const duration = Date.now() - startTime;
    console.log(`\n📊 Validation Complete in ${duration}ms:`);
    console.log(`   Overall Accuracy: ${report.overallAccuracy.toFixed(1)}%`);
    console.log(`   RMSE: ${report.rmse.toFixed(2)}`);
    console.log(`   Passed: ${report.passed}/${report.totalTests}`);
    
    return report;
  }

  /**
   * Validate a single test case against both systems
   */
  private async validateTestCase(testCase: ValidationTestCase): Promise<ValidationResult> {
    const issues: string[] = [];
    
    try {
      // Test unified data service (should now use improved scoring)
      const unifiedResult = await this.unifiedDataService.fetchLocationData(
        testCase.latitude, 
        testCase.longitude,
        500
      );
      
      // Test spatial scorer directly
      let spatialResult = null;
      try {
        spatialResult = await this.spatialScorer.scoreLocation(
          testCase.latitude,
          testCase.longitude
        );
      } catch (error) {
        issues.push(`Spatial scorer failed: ${error.message}`);
      }

      // Use spatial score if available, otherwise use unified overall score
      const actualScore = spatialResult ? spatialResult.score : unifiedResult.scores.overall;
      const confidence = spatialResult ? spatialResult.confidence : unifiedResult.confidence;
      
      const error = Math.abs(actualScore - testCase.expectedScore);
      const passed = error <= testCase.tolerance;

      // Statistical validations
      if (actualScore < 0 || actualScore > 100) {
        issues.push(`Score ${actualScore} outside valid range [0,100]`);
      }
      
      if (confidence < 0 || confidence > 1) {
        issues.push(`Confidence ${confidence} outside valid range [0,1]`);
      }
      
      // Domain-specific validations
      if (testCase.name.includes('Ocean') && actualScore > 50) {
        issues.push('Ocean locations should not score >50 due to infrastructure limitations');
      }
      
      if (testCase.name.includes('Polar') && actualScore > 40) {
        issues.push('Polar locations should not score >40 due to orbital limitations');
      }
      
      if (testCase.name.includes('Hub') && actualScore < 70) {
        issues.push('Known telecom hubs should score >70');
      }

      return {
        testCase,
        actualScore: Math.round(actualScore),
        passed: passed && issues.length === 0,
        error,
        confidence,
        issues
      };
      
    } catch (error) {
      issues.push(`Test execution failed: ${error.message}`);
      
      return {
        testCase,
        actualScore: 0,
        passed: false,
        error: testCase.expectedScore,
        confidence: 0,
        issues
      };
    }
  }

  /**
   * Generate comprehensive validation report
   */
  private generateReport(results: ValidationResult[]): StatisticalValidationReport {
    const totalTests = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = totalTests - passed;
    
    // Calculate statistical metrics
    const errors = results.map(r => r.error);
    const actualScores = results.map(r => r.actualScore);
    const expectedScores = results.map(r => r.testCase.expectedScore);
    
    const overallAccuracy = (passed / totalTests) * 100;
    const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e * e, 0) / totalTests);
    const maxError = Math.max(...errors);
    
    // Systematic bias calculation
    const biases = results.map((r, i) => r.actualScore - r.testCase.expectedScore);
    const systematicBias = biases.reduce((sum, b) => sum + b, 0) / biases.length;
    
    // Score distribution analysis
    const lowScores = actualScores.filter(s => s <= 40).length;
    const mediumScores = actualScores.filter(s => s > 40 && s <= 70).length;
    const highScores = actualScores.filter(s => s > 70).length;
    
    // Confidence analysis
    const confidences = results.map(r => r.confidence).filter(c => c > 0);
    const averageConfidence = confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length 
      : 0;
    const minConfidence = confidences.length > 0 ? Math.min(...confidences) : 0;
    const maxConfidence = confidences.length > 0 ? Math.max(...confidences) : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overallAccuracy < 70) {
      recommendations.push('CRITICAL: Overall accuracy below 70% threshold - review scoring algorithms');
    }
    
    if (rmse > 15) {
      recommendations.push('HIGH: RMSE >15 indicates significant scoring variance - improve calibration');
    }
    
    if (Math.abs(systematicBias) > 5) {
      const direction = systematicBias > 0 ? 'over-scoring' : 'under-scoring';
      recommendations.push(`MEDIUM: Systematic bias detected (${direction} by ${Math.abs(systematicBias).toFixed(1)} points)`);
    }
    
    if (averageConfidence < 0.5) {
      recommendations.push('LOW: Average confidence <0.5 indicates low model certainty - more training data needed');
    }
    
    const allIssuesCount = results.reduce((sum, r) => sum + r.issues.length, 0);
    if (allIssuesCount > totalTests * 0.3) {
      recommendations.push('HIGH: Many domain validation issues detected - review scoring logic');
    }

    return {
      timestamp: new Date(),
      totalTests,
      passed,
      failed,
      overallAccuracy,
      rmse,
      maxError,
      results,
      statisticalAnalysis: {
        scoringDistribution: {
          low: lowScores,
          medium: mediumScores,
          high: highScores
        },
        confidenceAnalysis: {
          averageConfidence,
          minConfidence,
          maxConfidence
        },
        systematicBias,
        recommendations
      }
    };
  }

  /**
   * Export results for further analysis
   */
  exportResults(report: StatisticalValidationReport): string {
    const csv = [
      'Test Case,Latitude,Longitude,Expected,Actual,Error,Confidence,Passed,Issues',
      ...report.results.map(r => [
        r.testCase.name,
        r.testCase.latitude,
        r.testCase.longitude,
        r.testCase.expectedScore,
        r.actualScore,
        r.error.toFixed(2),
        r.confidence.toFixed(3),
        r.passed ? 'PASS' : 'FAIL',
        r.issues.join('; ')
      ].join(','))
    ].join('\n');
    
    return csv;
  }
}

// Export singleton for testing
export const statisticalValidator = new StatisticalScoringValidator();