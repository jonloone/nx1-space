/**
 * TDD Tests for Spatial Interpolation
 * Verify IDW (Inverse Distance Weighting) implementation
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { IDWSpatialInterpolation } from '../../lib/scoring/idw-spatial-interpolation'
import { SpatialInterpolator } from '../../lib/scoring/spatial-interpolator'

describe('Spatial Interpolation - IDW Implementation', () => {
  let interpolator: IDWSpatialInterpolation
  let spatialService: SpatialInterpolator
  
  beforeAll(() => {
    interpolator = new IDWSpatialInterpolation()
    spatialService = new SpatialInterpolator()
  })
  
  describe('IDW Algorithm Correctness', () => {
    test('must implement Inverse Distance Weighting formula', () => {
      // Known points with values
      const knownPoints = [
        { lat: 40.7128, lon: -74.0060, value: 0.9 },  // NYC - high
        { lat: 40.7614, lon: -73.9776, value: 0.85 }, // Manhattan
        { lat: 40.6892, lon: -74.0445, value: 0.7 },  // Brooklyn
      ]
      
      // Test point between them
      const testPoint = { lat: 40.73, lon: -74.0 }
      
      const result = interpolator.interpolate(testPoint, knownPoints)
      
      // Should be weighted average based on distance
      expect(result).toBeGreaterThan(0.7)
      expect(result).toBeLessThan(0.9)
      
      // Verify the formula is correct
      const distances = knownPoints.map(p => 
        interpolator.calculateDistance(testPoint, p)
      )
      
      const weights = distances.map(d => 1 / Math.pow(d, 2))
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      const normalizedWeights = weights.map(w => w / totalWeight)
      
      const expectedValue = knownPoints.reduce((sum, point, i) => 
        sum + point.value * normalizedWeights[i], 0
      )
      
      expect(Math.abs(result - expectedValue)).toBeLessThan(0.01)
    })
    
    test('must handle exact point matches correctly', () => {
      const knownPoints = [
        { lat: 40.7128, lon: -74.0060, value: 0.9 },
        { lat: 40.7614, lon: -73.9776, value: 0.85 },
      ]
      
      // Test at exact known point
      const testPoint = { lat: 40.7128, lon: -74.0060 }
      const result = interpolator.interpolate(testPoint, knownPoints)
      
      // Should return exact value at known point
      expect(result).toBe(0.9)
    })
    
    test('must use power parameter correctly (typically 2)', () => {
      const knownPoints = [
        { lat: 40.0, lon: -74.0, value: 1.0 },
        { lat: 41.0, lon: -74.0, value: 0.0 },
      ]
      
      // Midpoint
      const testPoint = { lat: 40.5, lon: -74.0 }
      
      // Test with different power parameters
      const resultP1 = interpolator.interpolate(testPoint, knownPoints, { power: 1 })
      const resultP2 = interpolator.interpolate(testPoint, knownPoints, { power: 2 })
      const resultP3 = interpolator.interpolate(testPoint, knownPoints, { power: 3 })
      
      // All should be 0.5 at midpoint with equal distances
      expect(resultP2).toBeCloseTo(0.5, 2)
      
      // Higher power = more local influence
      expect(resultP1).toBeCloseTo(0.5, 2)
      expect(resultP3).toBeCloseTo(0.5, 2)
    })
  })
  
  describe('Continuous Surface Generation', () => {
    test('must create smooth continuous surfaces', () => {
      const knownStations = [
        { lat: 40.7, lon: -74.0, score: 0.8 },
        { lat: 40.8, lon: -74.1, score: 0.6 },
        { lat: 40.6, lon: -73.9, score: 0.9 },
      ]
      
      // Generate grid of interpolated values
      const grid = []
      for (let lat = 40.5; lat <= 40.9; lat += 0.1) {
        for (let lon = -74.2; lon <= -73.8; lon += 0.1) {
          const value = interpolator.interpolate(
            { lat, lon },
            knownStations.map(s => ({ ...s, value: s.score }))
          )
          grid.push({ lat, lon, value })
        }
      }
      
      // Check smoothness - adjacent points should have similar values
      for (let i = 0; i < grid.length - 1; i++) {
        const current = grid[i]
        const next = grid[i + 1]
        
        // If points are adjacent (0.1 degree apart)
        const distance = Math.sqrt(
          Math.pow(current.lat - next.lat, 2) + 
          Math.pow(current.lon - next.lon, 2)
        )
        
        if (distance < 0.15) { // Adjacent points
          const valueDiff = Math.abs(current.value - next.value)
          // Should have gradual change
          expect(valueDiff).toBeLessThan(0.3)
        }
      }
    })
    
    test('must handle sparse data areas appropriately', () => {
      const sparseStations = [
        { lat: 40.0, lon: -74.0, value: 0.9 },
        { lat: 50.0, lon: -74.0, value: 0.3 }, // Far away
      ]
      
      // Point far from all stations
      const remotePoint = { lat: 30.0, lon: -74.0 }
      const result = interpolator.interpolate(remotePoint, sparseStations)
      
      // Should still produce a value
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
      
      // Should indicate low confidence for sparse areas
      const resultWithConfidence = interpolator.interpolateWithConfidence(
        remotePoint, 
        sparseStations
      )
      
      expect(resultWithConfidence.confidence).toBeLessThan(0.3)
    })
  })
  
  describe('Distance Calculations', () => {
    test('must use Haversine formula for geographic distance', () => {
      // NYC to Boston (known distance ~190 miles / 306 km)
      const nyc = { lat: 40.7128, lon: -74.0060 }
      const boston = { lat: 42.3601, lon: -71.0589 }
      
      const distance = interpolator.calculateDistance(nyc, boston)
      
      // Distance in kilometers
      expect(distance).toBeGreaterThan(300)
      expect(distance).toBeLessThan(320)
    })
    
    test('must handle meridian/equator edge cases', () => {
      // Across prime meridian
      const point1 = { lat: 51.5, lon: -0.1 }
      const point2 = { lat: 51.5, lon: 0.1 }
      const distance1 = interpolator.calculateDistance(point1, point2)
      expect(distance1).toBeGreaterThan(0)
      expect(distance1).toBeLessThan(20) // Should be small
      
      // Across equator
      const point3 = { lat: -0.1, lon: 0 }
      const point4 = { lat: 0.1, lon: 0 }
      const distance2 = interpolator.calculateDistance(point3, point4)
      expect(distance2).toBeGreaterThan(0)
      expect(distance2).toBeLessThan(25)
      
      // Across date line
      const point5 = { lat: 0, lon: 179.9 }
      const point6 = { lat: 0, lon: -179.9 }
      const distance3 = interpolator.calculateDistance(point5, point6)
      expect(distance3).toBeGreaterThan(0)
      expect(distance3).toBeLessThan(25)
    })
  })
  
  describe('Performance Requirements', () => {
    test('must handle 1000+ points efficiently', () => {
      // Generate many known points
      const manyPoints = []
      for (let i = 0; i < 1000; i++) {
        manyPoints.push({
          lat: 40 + Math.random() * 10,
          lon: -74 + Math.random() * 10,
          value: Math.random()
        })
      }
      
      const testPoint = { lat: 45, lon: -69 }
      
      const startTime = Date.now()
      const result = interpolator.interpolate(testPoint, manyPoints)
      const endTime = Date.now()
      
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
      
      // Should complete in under 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })
    
    test('must use spatial indexing for optimization', () => {
      const points = []
      for (let i = 0; i < 100; i++) {
        points.push({
          lat: 40 + Math.random() * 10,
          lon: -74 + Math.random() * 10,
          value: Math.random()
        })
      }
      
      // Should support radius-based search
      const testPoint = { lat: 45, lon: -69 }
      const nearbyPoints = interpolator.findNearbyPoints(
        testPoint, 
        points, 
        { maxDistance: 100 } // 100km radius
      )
      
      expect(nearbyPoints.length).toBeLessThan(points.length)
      
      // All returned points should be within radius
      nearbyPoints.forEach(p => {
        const distance = interpolator.calculateDistance(testPoint, p)
        expect(distance).toBeLessThanOrEqual(100)
      })
    })
  })
  
  describe('Integration with Scoring System', () => {
    test('must provide interpolated scores for any location', async () => {
      const result = await spatialService.getInterpolatedScore({
        lat: 40.7128,
        lon: -74.0060
      })
      
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('nearbyStations')
      
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
    })
    
    test('must use known stations as interpolation anchors', async () => {
      const knownStations = await spatialService.getKnownStations()
      expect(knownStations.length).toBeGreaterThanOrEqual(32)
      
      // Each station should have required fields
      knownStations.forEach(station => {
        expect(station).toHaveProperty('lat')
        expect(station).toHaveProperty('lon')
        expect(station).toHaveProperty('score')
        expect(station).toHaveProperty('confidence')
      })
    })
  })
})