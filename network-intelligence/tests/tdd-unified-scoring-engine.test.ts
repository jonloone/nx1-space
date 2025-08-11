/**
 * TDD Tests for Unified Scoring Engine
 * Tests all scoring components with real-world validation scenarios
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { unifiedDataServiceClient } from '../lib/data/unified-data-service-client'
import { celestrakService } from '../lib/data/celestrak-service'
import { marineCadastreService } from '../lib/data/marine-cadastre-service'
import { naturalEarthService } from '../lib/data/natural-earth-service'

describe('Unified Scoring Engine TDD', () => {
  describe('Satellite Scoring Component', () => {
    test('should score high-satellite-count locations higher', async () => {
      // Test locations with known satellite coverage
      const highCoverageLocation = await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300) // NYC
      const lowCoverageLocation = await unifiedDataServiceClient.fetchLocationData(0, 0, 300) // Middle of ocean
      
      expect(highCoverageLocation.scores.satellite).toBeGreaterThan(lowCoverageLocation.scores.satellite)
      expect(highCoverageLocation.scores.satellite).toBeGreaterThanOrEqual(60)
    })

    test('should penalize locations with poor satellite visibility', async () => {
      const polarLocation = await unifiedDataServiceClient.fetchLocationData(85, 0, 300) // Near North Pole
      const equatorialLocation = await unifiedDataServiceClient.fetchLocationData(0, -75, 300) // Equator
      
      // Equatorial locations typically have better satellite coverage
      expect(equatorialLocation.scores.satellite).toBeGreaterThan(polarLocation.scores.satellite)
    })

    test('should validate satellite count accuracy with real TLE data', async () => {
      const satellites = await celestrakService.fetchHighValueSatellites()
      expect(satellites.length).toBeGreaterThan(9000) // Should match real satellite count
      expect(satellites.length).toBeLessThan(15000) // Reasonable upper bound
      
      // Validate TLE data structure
      satellites.slice(0, 10).forEach(sat => {
        expect(sat).toHaveProperty('satellite_name') // Actual property name
        expect(sat).toHaveProperty('line1')
        expect(sat).toHaveProperty('line2')
        expect(sat.line1).toMatch(/^1 \d{5}[A-Z] \d{2}\d{3}/)
      })
    })
  })

  describe('Maritime Scoring Component', () => {
    test('should score high maritime traffic locations higher', async () => {
      const busyPort = await unifiedDataServiceClient.fetchLocationData(40.6892, -74.0445, 100) // NY Harbor
      const landLocation = await unifiedDataServiceClient.fetchLocationData(40.7589, -73.9851, 100) // Central Park
      
      expect(busyPort.scores.maritime).toBeGreaterThan(landLocation.scores.maritime)
      expect(busyPort.scores.maritime).toBeGreaterThanOrEqual(70)
    })

    test('should validate AIS vessel data quality', async () => {
      const vessels = await marineCadastreService.fetchAISData()
      expect(vessels.length).toBeGreaterThan(500) // North Atlantic should have good coverage
      
      // Validate vessel data structure
      vessels.slice(0, 10).forEach(vessel => {
        expect(vessel).toHaveProperty('mmsi')
        expect(vessel).toHaveProperty('position')
        expect(vessel.position).toHaveProperty('latitude')
        expect(vessel.position).toHaveProperty('longitude')
        expect(vessel.position.latitude).toBeGreaterThanOrEqual(-90)
        expect(vessel.position.latitude).toBeLessThanOrEqual(90)
        expect(vessel.position.longitude).toBeGreaterThanOrEqual(-180)
        expect(vessel.position.longitude).toBeLessThanOrEqual(180)
      })
    })

    test('should calculate vessel density accurately', async () => {
      const denseArea = await marineCadastreService.getVesselDensity(40.7, -74.0, 50) // NYC area
      const sparseArea = await marineCadastreService.getVesselDensity(20, -40, 50) // Open ocean
      
      expect(denseArea.vesselCount).toBeGreaterThan(sparseArea.vesselCount)
      expect(denseArea.density).toBeGreaterThan(0)
    })
  })

  describe('Economic Scoring Component', () => {
    test('should score major ports higher than minor ports', () => {
      const ports = naturalEarthService.getPortsWithMetrics()
      const majorPorts = ports.filter(p => p.rank === 1)
      const minorPorts = ports.filter(p => p.rank === 3)
      
      expect(majorPorts.length).toBeGreaterThan(0)
      expect(minorPorts.length).toBeGreaterThan(0)
      
      const avgMajorCapacity = majorPorts.reduce((sum, p) => sum + p.vesselCapacity, 0) / majorPorts.length
      const avgMinorCapacity = minorPorts.reduce((sum, p) => sum + p.vesselCapacity, 0) / minorPorts.length
      
      expect(avgMajorCapacity).toBeGreaterThan(avgMinorCapacity)
    })

    test('should validate port data completeness', () => {
      const ports = naturalEarthService.getPortsWithMetrics()
      expect(ports.length).toBe(101) // Should have exactly 101 ports
      
      ports.forEach(port => {
        expect(port).toHaveProperty('name')
        expect(port).toHaveProperty('coordinates')
        expect(port.coordinates).toHaveLength(2)
        expect(port).toHaveProperty('rank')
        expect(port.rank).toBeGreaterThanOrEqual(1)
        expect(port.rank).toBeLessThanOrEqual(3)
      })
    })
  })

  describe('Overall Scoring Integration', () => {
    test('should produce consistent scores for same location', async () => {
      const location1 = await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300)
      const location2 = await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300)
      
      expect(location1.scores.overall).toBe(location2.scores.overall)
      expect(location1.scores.satellite).toBe(location2.scores.satellite)
      expect(location1.scores.maritime).toBe(location2.scores.maritime)
    })

    test('should have scores within valid range (0-100)', async () => {
      const testLocations = [
        { lat: 40.7128, lon: -74.0060 }, // NYC
        { lat: 51.5074, lon: -0.1278 },  // London
        { lat: 35.6762, lon: 139.6503 }, // Tokyo
        { lat: -33.8688, lon: 151.2093 } // Sydney
      ]
      
      for (const loc of testLocations) {
        const analysis = await unifiedDataServiceClient.fetchLocationData(loc.lat, loc.lon, 300)
        
        expect(analysis.scores.overall).toBeGreaterThanOrEqual(0)
        expect(analysis.scores.overall).toBeLessThanOrEqual(100)
        expect(analysis.scores.satellite).toBeGreaterThanOrEqual(0)
        expect(analysis.scores.satellite).toBeLessThanOrEqual(100)
        expect(analysis.scores.maritime).toBeGreaterThanOrEqual(0)
        expect(analysis.scores.maritime).toBeLessThanOrEqual(100)
        expect(analysis.scores.economic).toBeGreaterThanOrEqual(0)
        expect(analysis.scores.economic).toBeLessThanOrEqual(100)
      }
    })

    test('should achieve 70% accuracy on known good locations', async () => {
      // Test known high-value locations
      const knownGoodLocations = [
        { lat: 40.7128, lon: -74.0060, expectedMin: 70 }, // NYC
        { lat: 51.5074, lon: -0.1278, expectedMin: 65 },  // London
        { lat: 37.7749, lon: -122.4194, expectedMin: 65 } // San Francisco
      ]
      
      let accurateScores = 0
      
      for (const loc of knownGoodLocations) {
        const analysis = await unifiedDataServiceClient.fetchLocationData(loc.lat, loc.lon, 300)
        if (analysis.scores.overall >= loc.expectedMin) {
          accurateScores++
        }
      }
      
      const accuracy = accurateScores / knownGoodLocations.length
      expect(accuracy).toBeGreaterThanOrEqual(0.7) // 70% accuracy requirement
    })

    test('should have high confidence for data-rich areas', async () => {
      const dataRichArea = await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300) // NYC
      const dataSparseArea = await unifiedDataServiceClient.fetchLocationData(0, 0, 300) // Ocean
      
      expect(dataRichArea.confidence).toBeGreaterThan(dataSparseArea.confidence)
      expect(dataRichArea.confidence).toBeGreaterThanOrEqual(0.8) // High confidence threshold
    })

    test('should generate realistic revenue projections', async () => {
      const analysis = await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300)
      
      expect(analysis.revenue.monthly).toBeGreaterThan(0)
      expect(Math.round(analysis.revenue.annual)).toBe(Math.round(analysis.revenue.monthly * 12))
      expect(analysis.revenue.annual).toBeLessThan(50000000) // Reasonable upper bound
      expect(analysis.revenue.annual).toBeGreaterThan(100000) // Reasonable lower bound
    })
  })

  describe('Performance and Reliability', () => {
    test('should complete scoring within reasonable time', async () => {
      const startTime = Date.now()
      await unifiedDataServiceClient.fetchLocationData(40.7128, -74.0060, 300)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    test('should handle edge case coordinates gracefully', async () => {
      const edgeCases = [
        { lat: 90, lon: 0 },    // North Pole
        { lat: -90, lon: 0 },   // South Pole  
        { lat: 0, lon: 180 },   // Date line
        { lat: 0, lon: -180 }   // Date line (negative)
      ]
      
      for (const coords of edgeCases) {
        const analysis = await unifiedDataServiceClient.fetchLocationData(coords.lat, coords.lon, 300)
        expect(analysis).toBeDefined()
        expect(analysis.scores.overall).toBeGreaterThanOrEqual(0)
        expect(analysis.scores.overall).toBeLessThanOrEqual(100)
      }
    })

    test('should handle invalid coordinates appropriately', async () => {
      // Test coordinates outside valid range
      await expect(unifiedDataServiceClient.fetchLocationData(91, 0, 300)).rejects.toThrow()
      await expect(unifiedDataServiceClient.fetchLocationData(0, 181, 300)).rejects.toThrow()
    })
  })
})