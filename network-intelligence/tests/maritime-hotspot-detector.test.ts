/**
 * TDD Tests for Maritime Hotspot Detection
 * Testing the Getis-Ord Gi* statistical analysis implementation
 */

import { MaritimeHotSpotDetector } from '../lib/analysis/maritime-hotspot-detector'
import { sampleMaritimeData, generateAdditionalMaritimeData } from '../data/sampleMaritimeData'

describe('MaritimeHotSpotDetector', () => {
  let detector: MaritimeHotSpotDetector

  beforeEach(() => {
    detector = new MaritimeHotSpotDetector()
  })

  describe('Basic Functionality', () => {
    test('should create detector instance', () => {
      expect(detector).toBeInstanceOf(MaritimeHotSpotDetector)
    })

    test('should return empty array for insufficient data points', () => {
      const insufficientData = [
        { latitude: 1.0, longitude: 103.0, vesselCount: 10, avgSpeed: 12, avgSize: 50000 },
        { latitude: 2.0, longitude: 104.0, vesselCount: 15, avgSpeed: 13, avgSize: 55000 }
      ]
      
      const hotspots = detector.detectHotSpots(insufficientData)
      expect(hotspots).toEqual([])
    })

    test('should detect hotspots with sufficient data', () => {
      const testData = sampleMaritimeData.slice(0, 20) // Use first 20 points
      const hotspots = detector.detectHotSpots(testData)
      
      expect(hotspots).toBeDefined()
      expect(Array.isArray(hotspots)).toBe(true)
    })
  })

  describe('Singapore Strait Hotspot Detection', () => {
    test('should detect hot spot in Singapore Strait', () => {
      const singaporeData = [
        // High concentration in Singapore Strait
        { latitude: 1.2966, longitude: 103.8558, vesselCount: 45, avgSpeed: 12.5, avgSize: 85000 },
        { latitude: 1.3521, longitude: 103.8198, vesselCount: 38, avgSpeed: 11.8, avgSize: 92000 },
        { latitude: 1.2897, longitude: 103.8619, vesselCount: 42, avgSpeed: 13.2, avgSize: 78000 },
        { latitude: 1.3045, longitude: 103.8476, vesselCount: 41, avgSpeed: 12.1, avgSize: 89000 },
        { latitude: 1.2754, longitude: 103.8712, vesselCount: 37, avgSpeed: 12.8, avgSize: 81000 },
        
        // Lower activity areas for contrast
        { latitude: 10.0, longitude: 120.0, vesselCount: 5, avgSpeed: 15.0, avgSize: 50000 },
        { latitude: 15.0, longitude: 125.0, vesselCount: 3, avgSpeed: 18.0, avgSize: 60000 },
        { latitude: 20.0, longitude: 130.0, vesselCount: 4, avgSpeed: 16.0, avgSize: 55000 },
      ]
      
      const hotspots = detector.detectHotSpots(singaporeData)
      
      // Should detect at least one hotspot
      expect(hotspots.length).toBeGreaterThan(0)
      
      // Check if Singapore area is detected as hot spot
      const singaporeHotspots = hotspots.filter(h => 
        h.center[0] >= 103 && h.center[0] <= 104 && // Longitude range
        h.center[1] >= 1.2 && h.center[1] <= 1.4    // Latitude range
      )
      
      expect(singaporeHotspots.length).toBeGreaterThan(0)
      
      // Should be a hot spot (not cold)
      const hotSpot = singaporeHotspots[0]
      expect(hotSpot.type).toBe('hot')
      expect(hotSpot.zScore).toBeGreaterThan(1.96) // 95% confidence threshold
    })
  })

  describe('Statistical Properties', () => {
    test('hotspot should have valid statistical properties', () => {
      const testData = sampleMaritimeData.slice(0, 15)
      const hotspots = detector.detectHotSpots(testData)
      
      hotspots.forEach(hotspot => {
        // Basic properties
        expect(hotspot.center).toHaveLength(2)
        expect(hotspot.center[0]).toBeGreaterThan(-180)
        expect(hotspot.center[0]).toBeLessThan(180)
        expect(hotspot.center[1]).toBeGreaterThan(-90)
        expect(hotspot.center[1]).toBeLessThan(90)
        
        // Statistical properties
        expect(Math.abs(hotspot.zScore)).toBeGreaterThanOrEqual(1.96)
        expect(hotspot.pValue).toBeGreaterThan(0)
        expect(hotspot.pValue).toBeLessThanOrEqual(1)
        expect(hotspot.confidence).toBeGreaterThanOrEqual(0)
        expect(hotspot.confidence).toBeLessThanOrEqual(1)
        
        // Physical properties
        expect(hotspot.radius).toBeGreaterThan(0)
        expect(hotspot.vesselDensity).toBeGreaterThanOrEqual(0)
        
        // Categorical properties
        expect(['hot', 'cold', 'neutral']).toContain(hotspot.type)
        expect(['growing', 'stable', 'declining']).toContain(hotspot.temporalTrend)
      })
    })

    test('z-score and confidence should be mathematically consistent', () => {
      const testData = sampleMaritimeData.slice(0, 10)
      const hotspots = detector.detectHotSpots(testData)
      
      hotspots.forEach(hotspot => {
        // Higher absolute z-score should mean higher confidence
        expect(hotspot.confidence).toBe(1 - hotspot.pValue)
        
        // Z-score threshold should match statistical significance
        if (Math.abs(hotspot.zScore) >= 1.96) {
          expect(hotspot.confidence).toBeGreaterThanOrEqual(0.95)
        }
      })
    })
  })

  describe('Cold Spot Detection', () => {
    test('should detect cold spots in low-traffic areas', () => {
      const mixedData = [
        // High traffic cluster
        { latitude: 1.3, longitude: 103.8, vesselCount: 45, avgSpeed: 12, avgSize: 85000 },
        { latitude: 1.35, longitude: 103.85, vesselCount: 42, avgSpeed: 13, avgSize: 78000 },
        { latitude: 1.25, longitude: 103.75, vesselCount: 38, avgSpeed: 11, avgSize: 92000 },
        
        // Low traffic cluster
        { latitude: -30.0, longitude: 20.0, vesselCount: 1, avgSpeed: 15, avgSize: 50000 },
        { latitude: -30.5, longitude: 20.5, vesselCount: 2, avgSpeed: 16, avgSize: 52000 },
        { latitude: -29.5, longitude: 19.5, vesselCount: 1, avgSpeed: 14, avgSize: 48000 },
        
        // Medium traffic for contrast
        { latitude: 50.0, longitude: 0.0, vesselCount: 20, avgSpeed: 14, avgSize: 60000 },
        { latitude: 50.5, longitude: 0.5, vesselCount: 18, avgSpeed: 15, avgSize: 62000 },
      ]
      
      const hotspots = detector.detectHotSpots(mixedData)
      
      // Should detect both hot and cold spots
      const hotSpots = hotspots.filter(h => h.type === 'hot')
      const coldSpots = hotspots.filter(h => h.type === 'cold')
      
      expect(hotSpots.length).toBeGreaterThan(0)
      expect(coldSpots.length).toBeGreaterThan(0)
    })
  })

  describe('Temporal Trends', () => {
    test('should assign temporal trends based on density', () => {
      const testData = sampleMaritimeData.slice(0, 12)
      const hotspots = detector.detectHotSpots(testData)
      
      hotspots.forEach(hotspot => {
        if (hotspot.vesselDensity > 10) {
          expect(hotspot.temporalTrend).toBe('growing')
        } else if (hotspot.vesselDensity < 3) {
          expect(hotspot.temporalTrend).toBe('declining')
        }
        
        if (hotspot.type === 'cold') {
          expect(hotspot.temporalTrend).toBe('declining')
        }
      })
    })
  })

  describe('Sample Data Integration', () => {
    test('should work with provided sample maritime data', () => {
      expect(sampleMaritimeData).toBeDefined()
      expect(sampleMaritimeData.length).toBeGreaterThan(0)
      
      const hotspots = detector.detectHotSpots(sampleMaritimeData)
      expect(hotspots).toBeDefined()
    })

    test('should work with generated additional maritime data', () => {
      const additionalData = generateAdditionalMaritimeData()
      expect(additionalData.length).toBeGreaterThan(sampleMaritimeData.length)
      
      const hotspots = detector.detectHotSpots(additionalData)
      expect(hotspots).toBeDefined()
    })

    test('should detect major shipping routes as hotspots', () => {
      const allData = generateAdditionalMaritimeData()
      const hotspots = detector.detectHotSpots(allData)
      
      // Should detect hotspots in major shipping areas
      const singaporeHotspots = hotspots.filter(h => 
        h.center[0] >= 103 && h.center[0] <= 104 && // Singapore Strait
        h.center[1] >= 1 && h.center[1] <= 2
      )
      
      const suezHotspots = hotspots.filter(h => 
        h.center[0] >= 32 && h.center[0] <= 33 && // Suez Canal
        h.center[1] >= 30 && h.center[1] <= 31
      )
      
      // Should find major shipping hotspots
      expect(singaporeHotspots.length + suezHotspots.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    test('should handle identical coordinates gracefully', () => {
      const identicalData = [
        { latitude: 1.0, longitude: 103.0, vesselCount: 10, avgSpeed: 12, avgSize: 50000 },
        { latitude: 1.0, longitude: 103.0, vesselCount: 15, avgSpeed: 13, avgSize: 55000 },
        { latitude: 1.0, longitude: 103.0, vesselCount: 12, avgSpeed: 14, avgSize: 52000 },
        { latitude: 2.0, longitude: 104.0, vesselCount: 8, avgSpeed: 15, avgSize: 48000 },
        { latitude: 3.0, longitude: 105.0, vesselCount: 5, avgSpeed: 16, avgSize: 45000 },
      ]
      
      expect(() => {
        const hotspots = detector.detectHotSpots(identicalData)
      }).not.toThrow()
    })

    test('should handle extreme vessel counts', () => {
      const extremeData = [
        { latitude: 1.0, longitude: 103.0, vesselCount: 0, avgSpeed: 12, avgSize: 50000 },
        { latitude: 1.1, longitude: 103.1, vesselCount: 1000, avgSpeed: 13, avgSize: 55000 },
        { latitude: 1.2, longitude: 103.2, vesselCount: 5, avgSpeed: 14, avgSize: 52000 },
        { latitude: 2.0, longitude: 104.0, vesselCount: 10, avgSpeed: 15, avgSize: 48000 },
        { latitude: 3.0, longitude: 105.0, vesselCount: 8, avgSpeed: 16, avgSize: 45000 },
      ]
      
      expect(() => {
        const hotspots = detector.detectHotSpots(extremeData)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    test('should complete detection in reasonable time', () => {
      const startTime = Date.now()
      const hotspots = detector.detectHotSpots(sampleMaritimeData)
      const endTime = Date.now()
      
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})