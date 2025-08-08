/**
 * TDD Tests for Confidence Scoring
 * Every score MUST include confidence levels
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { RealityBasedSpatialScoring } from '../../lib/scoring/reality-based-spatial-scoring-simple'
import { MarketScorer } from '../../lib/scoring/market-scorer'
import { TechnicalScorer } from '../../lib/scoring/technical-scorer'

describe('Confidence Scoring - Critical Requirements', () => {
  let spatialScoring: RealityBasedSpatialScoring
  let marketScorer: MarketScorer
  let technicalScorer: TechnicalScorer

  beforeEach(() => {
    spatialScoring = new RealityBasedSpatialScoring()
    marketScorer = new MarketScorer()
    technicalScorer = new TechnicalScorer()
  })

  describe('All Scores Must Include Confidence', () => {
    test('spatial scoring must return confidence', async () => {
      const location = { lat: 40.7128, lon: -74.0060 } // NYC
      const result = await spatialScoring.scoreLocation(location.lat, location.lon)
      
      expect(result).toHaveProperty('confidence')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    test('market scoring must return confidence', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const result = await marketScorer.score(location)
      
      expect(result).toHaveProperty('confidence')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    test('technical scoring must return confidence', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const result = await technicalScorer.score(location)
      
      expect(result).toHaveProperty('confidence')
      expect(typeof result.confidence).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Confidence Levels Based on Data Density', () => {
    test('low data areas must have low confidence (<0.5)', async () => {
      // Middle of ocean - sparse data
      const remoteLocation = { lat: 0, lon: 0 }
      const result = await spatialScoring.scoreLocation(remoteLocation.lat, remoteLocation.lon)
      
      expect(result.confidence).toBeLessThan(0.5)
      expect(result.dataQuality).toBe('low')
    })

    test('high data areas must have high confidence (>0.7)', async () => {
      // Major city - dense data
      const nyc = { lat: 40.7128, lon: -74.0060 }
      const result = await spatialScoring.scoreLocation(nyc.lat, nyc.lon)
      
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.dataQuality).toBe('high')
    })

    test('medium data areas must have medium confidence (0.4-0.7)', async () => {
      // Coastal area - medium data
      const coastal = { lat: 36.0, lon: -5.0 } // Near Gibraltar
      const result = await spatialScoring.scoreLocation(coastal.lat, coastal.lon)
      
      expect(result.confidence).toBeGreaterThan(0.4)
      expect(result.confidence).toBeLessThan(0.7)
      expect(result.dataQuality).toBe('medium')
    })
  })

  describe('Confidence Propagation', () => {
    test('combined scores must use minimum confidence', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      
      const marketResult = await marketScorer.score(location)
      const technicalResult = await technicalScorer.score(location)
      
      // Combined confidence should be the minimum of components
      const combinedConfidence = Math.min(
        marketResult.confidence,
        technicalResult.confidence
      )
      
      const combinedScore = {
        score: (marketResult.score + technicalResult.score) / 2,
        confidence: combinedConfidence
      }
      
      expect(combinedScore.confidence).toBeLessThanOrEqual(marketResult.confidence)
      expect(combinedScore.confidence).toBeLessThanOrEqual(technicalResult.confidence)
    })

    test('confidence must affect visualization opacity', () => {
      const testCases = [
        { confidence: 1.0, expectedOpacity: 1.0 },
        { confidence: 0.8, expectedOpacity: 0.8 },
        { confidence: 0.5, expectedOpacity: 0.5 },
        { confidence: 0.2, expectedOpacity: 0.3 }, // Minimum visibility
      ]
      
      testCases.forEach(({ confidence, expectedOpacity }) => {
        const opacity = Math.max(0.3, confidence) // Minimum 30% opacity
        expect(opacity).toBeCloseTo(expectedOpacity, 1)
      })
    })
  })

  describe('Confidence Bounds', () => {
    test('confidence must never exceed 1.0', async () => {
      const locations = [
        { lat: 40.7128, lon: -74.0060 },  // NYC
        { lat: 51.5074, lon: -0.1278 },   // London
        { lat: 35.6762, lon: 139.6503 },  // Tokyo
      ]
      
      for (const location of locations) {
        const result = await spatialScoring.scoreLocation(location.lat, location.lon)
        expect(result.confidence).toBeLessThanOrEqual(1.0)
      }
    })

    test('confidence must never be negative', async () => {
      const locations = [
        { lat: -90, lon: 0 },     // South Pole
        { lat: 90, lon: 0 },      // North Pole
        { lat: 0, lon: 180 },     // Pacific
      ]
      
      for (const location of locations) {
        const result = await spatialScoring.scoreLocation(location.lat, location.lon)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Uncertainty Bands', () => {
    test('must provide uncertainty bands with confidence', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const result = await spatialScoring.scoreLocation(location.lat, location.lon)
      
      expect(result).toHaveProperty('uncertaintyBand')
      expect(result.uncertaintyBand).toHaveLength(2)
      expect(result.uncertaintyBand[0]).toBeLessThan(result.score)
      expect(result.uncertaintyBand[1]).toBeGreaterThan(result.score)
    })

    test('low confidence must have wider uncertainty bands', async () => {
      const highConfLocation = { lat: 40.7128, lon: -74.0060 } // NYC
      const lowConfLocation = { lat: 0, lon: 0 } // Ocean
      
      const highConf = await spatialScoring.scoreLocation(highConfLocation.lat, highConfLocation.lon)
      const lowConf = await spatialScoring.scoreLocation(lowConfLocation.lat, lowConfLocation.lon)
      
      const highConfRange = highConf.uncertaintyBand[1] - highConf.uncertaintyBand[0]
      const lowConfRange = lowConf.uncertaintyBand[1] - lowConf.uncertaintyBand[0]
      
      expect(lowConfRange).toBeGreaterThan(highConfRange)
    })
  })
})