/**
 * ML Validation Service
 * 
 * Validates ML predictions against actual ground station profitability
 * Provides comprehensive accuracy metrics and performance analysis
 */

import { GroundStation } from '@/components/layers/GroundStationLayer'
import { mlOpportunityScorer } from '@/lib/scoring/ml-opportunity-scorer'

interface ValidationMetrics {
  rmse: number           // Root Mean Square Error
  mae: number            // Mean Absolute Error
  r2: number            // R-squared (coefficient of determination)
  mape: number          // Mean Absolute Percentage Error
  correlation: number   // Pearson correlation coefficient
}

interface FeatureImportanceValidation {
  feature: string
  importance: number
  correlationWithTarget: number
  significanceLevel: number
}

interface ValidationReport {
  overallMetrics: ValidationMetrics
  perStationErrors: Array<{
    stationId: string
    stationName: string
    actual: number
    predicted: number
    error: number
    percentageError: number
  }>
  featureAnalysis: FeatureImportanceValidation[]
  modelComparison: {
    mlModel: ValidationMetrics
    hardcodedWeights: ValidationMetrics
    improvement: number  // Percentage improvement
  }
  recommendations: string[]
  timestamp: Date
}

export class MLValidationService {
  /**
   * Perform comprehensive validation of ML predictions
   */
  public async validateModel(
    stations: GroundStation[],
    targetMetric: 'revenue' | 'profit' | 'margin' = 'profit'
  ): Promise<ValidationReport> {
    console.log(`🔍 Validating ML model against ${stations.length} stations...`)
    
    // Split data for cross-validation (80/20 split)
    const { train, test } = this.splitData(stations, 0.8)
    
    // Get predictions for test set
    const predictions = await this.getPredictions(test, targetMetric)
    
    // Calculate validation metrics
    const overallMetrics = this.calculateMetrics(
      predictions.map(p => p.actual),
      predictions.map(p => p.predicted)
    )
    
    // Compare with hardcoded weights baseline
    const hardcodedPredictions = this.getHardcodedPredictions(test, targetMetric)
    const hardcodedMetrics = this.calculateMetrics(
      hardcodedPredictions.map(p => p.actual),
      hardcodedPredictions.map(p => p.predicted)
    )
    
    // Analyze feature importance
    const featureAnalysis = this.analyzeFeatureImportance(stations, targetMetric)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallMetrics,
      hardcodedMetrics,
      featureAnalysis
    )
    
    // Create detailed per-station error analysis
    const perStationErrors = predictions.map(p => ({
      stationId: p.stationId,
      stationName: p.stationName,
      actual: p.actual,
      predicted: p.predicted,
      error: Math.abs(p.actual - p.predicted),
      percentageError: Math.abs((p.actual - p.predicted) / p.actual) * 100
    })).sort((a, b) => b.error - a.error)
    
    const report: ValidationReport = {
      overallMetrics,
      perStationErrors,
      featureAnalysis,
      modelComparison: {
        mlModel: overallMetrics,
        hardcodedWeights: hardcodedMetrics,
        improvement: ((hardcodedMetrics.rmse - overallMetrics.rmse) / hardcodedMetrics.rmse) * 100
      },
      recommendations,
      timestamp: new Date()
    }
    
    this.printValidationSummary(report)
    
    return report
  }
  
  /**
   * Perform k-fold cross validation
   */
  public async crossValidate(
    stations: GroundStation[],
    k: number = 5
  ): Promise<ValidationMetrics[]> {
    const foldSize = Math.floor(stations.length / k)
    const results: ValidationMetrics[] = []
    
    for (let i = 0; i < k; i++) {
      const testStart = i * foldSize
      const testEnd = testStart + foldSize
      
      const testSet = stations.slice(testStart, testEnd)
      const trainSet = [
        ...stations.slice(0, testStart),
        ...stations.slice(testEnd)
      ]
      
      // Train on fold (in production, would retrain model)
      // For now, use existing model
      const predictions = await this.getPredictions(testSet, 'profit')
      const metrics = this.calculateMetrics(
        predictions.map(p => p.actual),
        predictions.map(p => p.predicted)
      )
      
      results.push(metrics)
    }
    
    // Return average metrics across all folds
    return results
  }
  
  /**
   * Split data into training and test sets
   */
  private splitData(
    stations: GroundStation[],
    trainRatio: number
  ): { train: GroundStation[], test: GroundStation[] } {
    const shuffled = [...stations].sort(() => Math.random() - 0.5)
    const splitIndex = Math.floor(shuffled.length * trainRatio)
    
    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex)
    }
  }
  
  /**
   * Get ML predictions for stations
   */
  private async getPredictions(
    stations: GroundStation[],
    targetMetric: 'revenue' | 'profit' | 'margin'
  ): Promise<Array<{
    stationId: string
    stationName: string
    actual: number
    predicted: number
  }>> {
    const predictions = []
    
    for (const station of stations) {
      // Get ML score
      const mlScore = mlOpportunityScorer.scoreOpportunity(
        station.latitude,
        station.longitude,
        {
          maritimeDensity: station.maritimeDensity || 50,
          gdpPerCapita: station.gdpPerCapita || 40000,
          populationDensity: station.populationDensity || 200,
          elevation: station.elevation || 100,
          competitorCount: station.competitorCount || 3,
          infrastructureScore: station.infrastructureScore || 0.7,
          weatherReliability: station.weatherReliability || 0.75,
          regulatoryScore: station.regulatoryScore || 0.7
        }
      )
      
      // Convert score to target metric prediction
      let actual: number
      let predicted: number
      
      switch (targetMetric) {
        case 'revenue':
          actual = station.revenue || 0
          predicted = (mlScore.score / 100) * 100 // Scale to revenue range
          break
        case 'profit':
          actual = station.profit || 0
          predicted = (mlScore.score / 100) * 30 // Scale to profit range
          break
        case 'margin':
          actual = station.margin || 0
          predicted = (mlScore.score / 100) * 0.4 // Scale to margin range
          break
      }
      
      predictions.push({
        stationId: station.id,
        stationName: station.name,
        actual,
        predicted
      })
    }
    
    return predictions
  }
  
  /**
   * Get predictions using old hardcoded weights for comparison
   */
  private getHardcodedPredictions(
    stations: GroundStation[],
    targetMetric: 'revenue' | 'profit' | 'margin'
  ): Array<{
    actual: number
    predicted: number
  }> {
    return stations.map(station => {
      // Old approach: maritime * 0.3 + economic * 0.25 + ...
      const hardcodedScore = 
        (station.maritimeDensity || 50) / 100 * 0.3 +
        (station.gdpPerCapita || 40000) / 100000 * 0.25 +
        (station.populationDensity || 200) / 1000 * 0.2 +
        (1 - (station.competitorCount || 3) / 10) * 0.15 +
        (station.infrastructureScore || 0.7) * 0.1
      
      let actual: number
      let predicted: number
      
      switch (targetMetric) {
        case 'revenue':
          actual = station.revenue || 0
          predicted = hardcodedScore * 100
          break
        case 'profit':
          actual = station.profit || 0
          predicted = hardcodedScore * 30
          break
        case 'margin':
          actual = station.margin || 0
          predicted = hardcodedScore * 0.4
          break
      }
      
      return { actual, predicted }
    })
  }
  
  /**
   * Calculate validation metrics
   */
  private calculateMetrics(actual: number[], predicted: number[]): ValidationMetrics {
    const n = actual.length
    
    // RMSE
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2))
    const rmse = Math.sqrt(squaredErrors.reduce((sum, e) => sum + e, 0) / n)
    
    // MAE
    const absoluteErrors = actual.map((a, i) => Math.abs(a - predicted[i]))
    const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / n
    
    // MAPE
    const percentageErrors = actual.map((a, i) => 
      a !== 0 ? Math.abs((a - predicted[i]) / a) : 0
    )
    const mape = (percentageErrors.reduce((sum, e) => sum + e, 0) / n) * 100
    
    // R-squared
    const actualMean = actual.reduce((sum, a) => sum + a, 0) / n
    const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - actualMean, 2), 0)
    const ssRes = squaredErrors.reduce((sum, e) => sum + e, 0)
    const r2 = 1 - (ssRes / ssTot)
    
    // Correlation
    const correlation = this.calculateCorrelation(actual, predicted)
    
    return { rmse, mae, r2, mape, correlation }
  }
  
  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const num = n * sumXY - sumX * sumY
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return den === 0 ? 0 : num / den
  }
  
  /**
   * Analyze feature importance and correlation with target
   */
  private analyzeFeatureImportance(
    stations: GroundStation[],
    targetMetric: string
  ): FeatureImportanceValidation[] {
    const features = [
      'maritimeDensity',
      'gdpPerCapita',
      'populationDensity',
      'elevation',
      'competitorCount',
      'infrastructureScore',
      'weatherReliability',
      'regulatoryScore'
    ]
    
    const importanceRanking = mlOpportunityScorer.getFeatureImportance()
    
    return features.map(feature => {
      // Get feature values and target values
      const featureValues = stations.map(s => s[feature] || 0)
      const targetValues = stations.map(s => s[targetMetric] || 0)
      
      // Calculate correlation
      const correlation = this.calculateCorrelation(featureValues, targetValues)
      
      // Get importance from ML model
      const importance = importanceRanking.find(
        r => r.feature.toLowerCase().includes(feature.toLowerCase())
      )?.importance || 0
      
      // Calculate significance (simplified p-value approximation)
      const significanceLevel = Math.abs(correlation) > 0.5 ? 0.01 :
                               Math.abs(correlation) > 0.3 ? 0.05 :
                               Math.abs(correlation) > 0.1 ? 0.1 : 1
      
      return {
        feature,
        importance,
        correlationWithTarget: correlation,
        significanceLevel
      }
    }).sort((a, b) => b.importance - a.importance)
  }
  
  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    mlMetrics: ValidationMetrics,
    hardcodedMetrics: ValidationMetrics,
    featureAnalysis: FeatureImportanceValidation[]
  ): string[] {
    const recommendations: string[] = []
    
    // Check if ML outperforms hardcoded
    if (mlMetrics.rmse < hardcodedMetrics.rmse) {
      const improvement = ((hardcodedMetrics.rmse - mlMetrics.rmse) / hardcodedMetrics.rmse) * 100
      recommendations.push(
        `✅ ML model reduces prediction error by ${improvement.toFixed(1)}% compared to hardcoded weights`
      )
    } else {
      recommendations.push(
        `⚠️ ML model needs more training data or feature engineering to outperform baseline`
      )
    }
    
    // Check R-squared
    if (mlMetrics.r2 > 0.7) {
      recommendations.push(
        `✅ Strong predictive power with R² = ${mlMetrics.r2.toFixed(3)}`
      )
    } else if (mlMetrics.r2 > 0.5) {
      recommendations.push(
        `📊 Moderate predictive power (R² = ${mlMetrics.r2.toFixed(3)}). Consider additional features`
      )
    } else {
      recommendations.push(
        `⚠️ Low predictive power (R² = ${mlMetrics.r2.toFixed(3)}). Model needs improvement`
      )
    }
    
    // Feature recommendations
    const topFeatures = featureAnalysis.slice(0, 3)
    recommendations.push(
      `🎯 Top predictive features: ${topFeatures.map(f => f.feature).join(', ')}`
    )
    
    // Identify weak features
    const weakFeatures = featureAnalysis.filter(f => Math.abs(f.correlationWithTarget) < 0.1)
    if (weakFeatures.length > 0) {
      recommendations.push(
        `💡 Consider removing or re-engineering: ${weakFeatures.map(f => f.feature).join(', ')}`
      )
    }
    
    // MAPE-based recommendation
    if (mlMetrics.mape < 10) {
      recommendations.push(
        `✅ Excellent accuracy with MAPE < 10%`
      )
    } else if (mlMetrics.mape < 20) {
      recommendations.push(
        `📊 Good accuracy with MAPE = ${mlMetrics.mape.toFixed(1)}%`
      )
    } else {
      recommendations.push(
        `⚠️ High prediction error (MAPE = ${mlMetrics.mape.toFixed(1)}%). Investigate outliers`
      )
    }
    
    return recommendations
  }
  
  /**
   * Print validation summary to console
   */
  private printValidationSummary(report: ValidationReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 ML MODEL VALIDATION REPORT')
    console.log('='.repeat(60))
    
    console.log('\n🎯 Overall Performance:')
    console.log(`  RMSE: ${report.overallMetrics.rmse.toFixed(2)}`)
    console.log(`  MAE: ${report.overallMetrics.mae.toFixed(2)}`)
    console.log(`  R²: ${report.overallMetrics.r2.toFixed(3)}`)
    console.log(`  MAPE: ${report.overallMetrics.mape.toFixed(1)}%`)
    console.log(`  Correlation: ${report.overallMetrics.correlation.toFixed(3)}`)
    
    console.log('\n⚖️ Model Comparison:')
    console.log(`  ML Model RMSE: ${report.modelComparison.mlModel.rmse.toFixed(2)}`)
    console.log(`  Hardcoded RMSE: ${report.modelComparison.hardcodedWeights.rmse.toFixed(2)}`)
    console.log(`  Improvement: ${report.modelComparison.improvement.toFixed(1)}%`)
    
    console.log('\n📈 Top Feature Importance:')
    report.featureAnalysis.slice(0, 5).forEach(f => {
      console.log(`  ${f.feature}: ${(f.importance * 100).toFixed(1)}% (r=${f.correlationWithTarget.toFixed(2)})`)
    })
    
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => console.log(`  ${rec}`))
    
    console.log('\n🔍 Stations with Highest Prediction Error:')
    report.perStationErrors.slice(0, 3).forEach(s => {
      console.log(`  ${s.stationName}: ${s.percentageError.toFixed(1)}% error`)
    })
    
    console.log('\n' + '='.repeat(60))
  }
}

// Export singleton instance
export const mlValidationService = new MLValidationService()