/**
 * TDD Validation Tests for Known Stations
 * CRITICAL: Must achieve >70% accuracy on 32 known stations
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { StationValidator } from '../../lib/validation/station-validator'
import { EmpiricalWeightCalibration } from '../../lib/scoring/empirical-weight-calibration'
import { RealityBasedSpatialScoring } from '../../lib/scoring/reality-based-spatial-scoring'
import { stationDataService } from '../../lib/services/stationDataService'

describe('Known Station Validation - 70% Accuracy Requirement', () => {
  let validator: StationValidator
  let calibration: EmpiricalWeightCalibration
  let spatialScoring: RealityBasedSpatialScoring
  let knownStations: any[]
  let trainStations: any[]
  let testStations: any[]
  
  beforeAll(async () => {
    validator = new StationValidator()
    calibration = new EmpiricalWeightCalibration()
    spatialScoring = new RealityBasedSpatialScoring()
    
    // Load all 32+ known stations
    knownStations = await stationDataService.loadAllStations()
    
    // Split into training (70%) and test (30%) sets
    const splitIndex = Math.floor(knownStations.length * 0.7)
    trainStations = knownStations.slice(0, splitIndex)
    testStations = knownStations.slice(splitIndex)
  })
  
  describe('Training Data Validation', () => {
    test('must have at least 32 known stations', () => {
      expect(knownStations.length).toBeGreaterThanOrEqual(32)
    })
    
    test('must have balanced profitable/unprofitable examples', () => {
      const profitable = knownStations.filter(s => s.profitable === true)
      const unprofitable = knownStations.filter(s => s.profitable === false)
      
      expect(profitable.length).toBeGreaterThan(5)
      expect(unprofitable.length).toBeGreaterThan(5)
      
      // Ratio should be reasonable (20-80% range)
      const ratio = profitable.length / knownStations.length
      expect(ratio).toBeGreaterThan(0.2)
      expect(ratio).toBeLessThan(0.8)
    })
    
    test('all stations must have complete data', () => {
      knownStations.forEach(station => {
        // Required fields
        expect(station).toHaveProperty('id')
        expect(station).toHaveProperty('name')
        expect(station).toHaveProperty('lat')
        expect(station).toHaveProperty('lon')
        expect(station).toHaveProperty('profitable')
        expect(station).toHaveProperty('operational')
        
        // Location validation
        expect(station.lat).toBeGreaterThanOrEqual(-90)
        expect(station.lat).toBeLessThanOrEqual(90)
        expect(station.lon).toBeGreaterThanOrEqual(-180)
        expect(station.lon).toBeLessThanOrEqual(180)
        
        // Binary classification
        expect(typeof station.profitable).toBe('boolean')
        expect(typeof station.operational).toBe('boolean')
      })
    })
  })
  
  describe('Model Training', () => {
    test('must calibrate weights from training data', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      expect(weights).toHaveProperty('weights')
      expect(weights).toHaveProperty('trainingSamples')
      expect(weights).toHaveProperty('crossValidation')
      
      // Must use enough training samples
      expect(weights.trainingSamples).toBeGreaterThanOrEqual(20)
      
      // Weights must be normalized
      const sum = Object.values(weights.weights).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.01)
    })
    
    test('must achieve good fit on training data', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      // R² should indicate reasonable fit
      expect(weights.crossValidation.r2).toBeGreaterThan(0.5)
      
      // Training accuracy should be high
      let correct = 0
      for (const station of trainStations) {
        const score = await calibration.scoreWithWeights(station, weights.weights)
        const predicted = score > 0.5
        if (predicted === station.profitable) correct++
      }
      
      const trainAccuracy = correct / trainStations.length
      expect(trainAccuracy).toBeGreaterThan(0.75) // Higher on training set
    })
  })
  
  describe('Test Set Validation - CRITICAL', () => {
    test('MUST achieve >70% accuracy on test set', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      let correctPredictions = 0
      const predictions = []
      
      for (const station of testStations) {
        const score = await calibration.scoreWithWeights(station, weights.weights)
        const predicted = score > 0.5
        const actual = station.profitable
        
        predictions.push({
          station: station.name,
          score,
          predicted,
          actual,
          correct: predicted === actual
        })
        
        if (predicted === actual) correctPredictions++
      }
      
      const accuracy = correctPredictions / testStations.length
      
      console.log('\n=== Test Set Validation Results ===')
      console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`)
      console.log(`Correct: ${correctPredictions}/${testStations.length}`)
      
      // CRITICAL REQUIREMENT
      expect(accuracy).toBeGreaterThan(0.70)
    })
    
    test('must have balanced precision and recall', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      let truePositives = 0
      let falsePositives = 0
      let trueNegatives = 0
      let falseNegatives = 0
      
      for (const station of testStations) {
        const score = await calibration.scoreWithWeights(station, weights.weights)
        const predicted = score > 0.5
        const actual = station.profitable
        
        if (predicted && actual) truePositives++
        else if (predicted && !actual) falsePositives++
        else if (!predicted && !actual) trueNegatives++
        else if (!predicted && actual) falseNegatives++
      }
      
      const precision = truePositives / (truePositives + falsePositives)
      const recall = truePositives / (truePositives + falseNegatives)
      const f1 = 2 * (precision * recall) / (precision + recall)
      
      console.log(`Precision: ${(precision * 100).toFixed(1)}%`)
      console.log(`Recall: ${(recall * 100).toFixed(1)}%`)
      console.log(`F1 Score: ${f1.toFixed(3)}`)
      
      // All metrics should be reasonable
      expect(precision).toBeGreaterThan(0.60)
      expect(recall).toBeGreaterThan(0.60)
      expect(f1).toBeGreaterThan(0.65)
    })
  })
  
  describe('Cross-Validation', () => {
    test('must perform k-fold cross-validation', async () => {
      const k = 5 // 5-fold cross-validation
      const foldSize = Math.floor(knownStations.length / k)
      const accuracies = []
      
      for (let fold = 0; fold < k; fold++) {
        const testStart = fold * foldSize
        const testEnd = testStart + foldSize
        
        const foldTest = knownStations.slice(testStart, testEnd)
        const foldTrain = [
          ...knownStations.slice(0, testStart),
          ...knownStations.slice(testEnd)
        ]
        
        const weights = await calibration.calibrateWeights(foldTrain)
        
        let correct = 0
        for (const station of foldTest) {
          const score = await calibration.scoreWithWeights(station, weights.weights)
          const predicted = score > 0.5
          if (predicted === station.profitable) correct++
        }
        
        const accuracy = correct / foldTest.length
        accuracies.push(accuracy)
      }
      
      const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / k
      const stdDev = Math.sqrt(
        accuracies.reduce((sum, acc) => sum + Math.pow(acc - avgAccuracy, 2), 0) / k
      )
      
      console.log(`\n=== Cross-Validation Results ===`)
      console.log(`Average Accuracy: ${(avgAccuracy * 100).toFixed(1)}%`)
      console.log(`Std Dev: ${(stdDev * 100).toFixed(1)}%`)
      
      // Average across folds must exceed 70%
      expect(avgAccuracy).toBeGreaterThan(0.70)
      
      // Should be consistent across folds
      expect(stdDev).toBeLessThan(0.15)
    })
  })
  
  describe('Confidence Calibration', () => {
    test('high confidence predictions should be more accurate', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      const highConfPredictions = []
      const lowConfPredictions = []
      
      for (const station of testStations) {
        const result = await calibration.scoreWithConfidence(station, weights.weights)
        const predicted = result.score > 0.5
        const correct = predicted === station.profitable
        
        if (result.confidence > 0.7) {
          highConfPredictions.push(correct)
        } else if (result.confidence < 0.5) {
          lowConfPredictions.push(correct)
        }
      }
      
      const highConfAccuracy = highConfPredictions.filter(c => c).length / 
                               highConfPredictions.length
      const lowConfAccuracy = lowConfPredictions.filter(c => c).length / 
                              lowConfPredictions.length
      
      // High confidence should mean higher accuracy
      expect(highConfAccuracy).toBeGreaterThan(lowConfAccuracy)
      expect(highConfAccuracy).toBeGreaterThan(0.80)
    })
    
    test('confidence should correlate with prediction margin', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      for (const station of testStations) {
        const result = await calibration.scoreWithConfidence(station, weights.weights)
        
        // Distance from decision boundary (0.5)
        const margin = Math.abs(result.score - 0.5)
        
        // Higher margin should mean higher confidence
        if (margin > 0.3) {
          expect(result.confidence).toBeGreaterThan(0.6)
        }
        if (margin < 0.1) {
          expect(result.confidence).toBeLessThan(0.7)
        }
      }
    })
  })
  
  describe('Error Analysis', () => {
    test('must identify systematic errors', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      const errors = []
      
      for (const station of testStations) {
        const score = await calibration.scoreWithWeights(station, weights.weights)
        const predicted = score > 0.5
        
        if (predicted !== station.profitable) {
          errors.push({
            station: station.name,
            location: { lat: station.lat, lon: station.lon },
            score,
            predicted,
            actual: station.profitable,
            type: predicted ? 'false_positive' : 'false_negative'
          })
        }
      }
      
      // Analyze error patterns
      const falsePositives = errors.filter(e => e.type === 'false_positive')
      const falseNegatives = errors.filter(e => e.type === 'false_negative')
      
      console.log(`\n=== Error Analysis ===`)
      console.log(`False Positives: ${falsePositives.length}`)
      console.log(`False Negatives: ${falseNegatives.length}`)
      
      // Errors should be balanced (not all one type)
      if (errors.length > 0) {
        const fpRatio = falsePositives.length / errors.length
        expect(fpRatio).toBeGreaterThan(0.2)
        expect(fpRatio).toBeLessThan(0.8)
      }
    })
    
    test('must provide error explanations', async () => {
      const weights = await calibration.calibrateWeights(trainStations)
      
      for (const station of testStations) {
        const result = await validator.validateWithExplanation(station, weights.weights)
        
        expect(result).toHaveProperty('score')
        expect(result).toHaveProperty('predicted')
        expect(result).toHaveProperty('confidence')
        expect(result).toHaveProperty('factors')
        
        // Should explain what factors contributed
        expect(result.factors).toHaveProperty('market')
        expect(result.factors).toHaveProperty('technical')
        expect(result.factors).toHaveProperty('competition')
        expect(result.factors).toHaveProperty('regulatory')
      }
    })
  })
  
  describe('Performance Metrics', () => {
    test('must complete validation in reasonable time', async () => {
      const startTime = Date.now()
      
      const weights = await calibration.calibrateWeights(trainStations)
      
      for (const station of testStations) {
        await calibration.scoreWithWeights(station, weights.weights)
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTime = totalTime / testStations.length
      
      // Should be fast enough for real-time scoring
      expect(avgTime).toBeLessThan(100) // < 100ms per station
      expect(totalTime).toBeLessThan(5000) // < 5 seconds total
    })
  })
})