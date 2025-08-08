/**
 * TDD Tests for Real Data Connections
 * Verify all data sources are properly connected
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { GoogleEarthEngineRESTService } from '../../lib/services/googleEarthEngineRESTService'
import { stationDataService } from '../../lib/services/stationDataService'
import { MaritimeDataService } from '../../lib/services/maritimeDataService'
import { WeatherDataService } from '../../lib/services/weatherDataService'

describe('Real Data Connections - Critical Requirements', () => {
  let geeService: GoogleEarthEngineRESTService
  let maritimeService: MaritimeDataService
  let weatherService: WeatherDataService
  
  beforeAll(() => {
    geeService = new GoogleEarthEngineRESTService()
    maritimeService = new MaritimeDataService()
    weatherService = new WeatherDataService()
  })
  
  describe('Google Earth Engine Connection', () => {
    test('must have valid GEE credentials configured', () => {
      const hasCredentials = process.env.GEE_PROJECT_ID && 
                            process.env.GEE_SERVICE_ACCOUNT_EMAIL &&
                            process.env.GEE_PRIVATE_KEY
      
      expect(hasCredentials).toBeTruthy()
      expect(process.env.GEE_PROJECT_ID).toContain('ultra-envoy')
    })
    
    test('must successfully obtain access token', async () => {
      const token = await geeService.getAccessToken()
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(100) // JWT tokens are long
    }, 10000) // Allow 10 seconds for auth
    
    test('must retrieve nighttime lights data', async () => {
      const location = { lat: 40.7128, lon: -74.0060 } // NYC
      const result = await geeService.getNighttimeLights(location)
      
      expect(result).toBeTruthy()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      
      // Check data structure
      result.forEach(dataPoint => {
        expect(dataPoint).toHaveProperty('value')
        expect(dataPoint).toHaveProperty('date')
        expect(dataPoint).toHaveProperty('confidence')
        expect(dataPoint.value).toBeGreaterThanOrEqual(0)
      })
    }, 15000)
    
    test('must retrieve population density data', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const result = await geeService.getPopulationDensity(location)
      
      expect(result).toBeTruthy()
      expect(Array.isArray(result)).toBe(true)
      
      result.forEach(dataPoint => {
        expect(dataPoint).toHaveProperty('value')
        expect(dataPoint.value).toBeGreaterThan(0) // NYC has high population
      })
    }, 15000)
    
    test('must handle API errors gracefully', async () => {
      // Invalid location (middle of ocean)
      const location = { lat: 0, lon: 0 }
      const result = await geeService.getNighttimeLights(location)
      
      // Should return data or empty array, not throw
      expect(Array.isArray(result)).toBe(true)
      
      if (result.length > 0) {
        // If data exists, confidence should be low
        expect(result[0].confidence).toBeLessThan(0.5)
      }
    })
  })
  
  describe('Maritime Data Connection', () => {
    test('must retrieve AIS vessel data', async () => {
      const bounds = {
        north: 41,
        south: 40,
        east: -73,
        west: -75
      }
      
      const vessels = await maritimeService.getVesselsInArea(bounds)
      
      expect(Array.isArray(vessels)).toBe(true)
      
      if (vessels.length > 0) {
        vessels.forEach(vessel => {
          expect(vessel).toHaveProperty('mmsi')
          expect(vessel).toHaveProperty('lat')
          expect(vessel).toHaveProperty('lon')
          expect(vessel).toHaveProperty('timestamp')
        })
      }
    })
    
    test('must calculate shipping density', async () => {
      const location = { lat: 40.7, lon: -74.0 }
      const density = await maritimeService.getShippingDensity(location)
      
      expect(typeof density).toBe('number')
      expect(density).toBeGreaterThanOrEqual(0)
      expect(density).toBeLessThanOrEqual(1)
    })
    
    test('must identify shipping lanes', async () => {
      const lanes = await maritimeService.getMajorShippingLanes()
      
      expect(Array.isArray(lanes)).toBe(true)
      
      if (lanes.length > 0) {
        lanes.forEach(lane => {
          expect(lane).toHaveProperty('id')
          expect(lane).toHaveProperty('coordinates')
          expect(lane).toHaveProperty('trafficVolume')
          expect(Array.isArray(lane.coordinates)).toBe(true)
        })
      }
    })
  })
  
  describe('Weather Data Connection', () => {
    test('must retrieve current weather conditions', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const weather = await weatherService.getCurrentWeather(location)
      
      expect(weather).toBeTruthy()
      expect(weather).toHaveProperty('cloudCover')
      expect(weather).toHaveProperty('precipitation')
      expect(weather).toHaveProperty('visibility')
      
      expect(weather.cloudCover).toBeGreaterThanOrEqual(0)
      expect(weather.cloudCover).toBeLessThanOrEqual(100)
    })
    
    test('must retrieve historical weather patterns', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const historical = await weatherService.getHistoricalPatterns(location)
      
      expect(historical).toBeTruthy()
      expect(historical).toHaveProperty('avgCloudCover')
      expect(historical).toHaveProperty('avgPrecipitation')
      expect(historical).toHaveProperty('clearDaysPerYear')
      
      expect(historical.clearDaysPerYear).toBeGreaterThan(0)
      expect(historical.clearDaysPerYear).toBeLessThan(365)
    })
    
    test('must calculate weather impact score', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const impact = await weatherService.getWeatherImpactScore(location)
      
      expect(typeof impact).toBe('number')
      expect(impact).toBeGreaterThanOrEqual(0)
      expect(impact).toBeLessThanOrEqual(1)
    })
  })
  
  describe('Station Data Connection', () => {
    test('must load 32+ known stations', async () => {
      const stations = await stationDataService.loadAllStations()
      
      expect(Array.isArray(stations)).toBe(true)
      expect(stations.length).toBeGreaterThanOrEqual(32)
      
      stations.forEach(station => {
        expect(station).toHaveProperty('id')
        expect(station).toHaveProperty('name')
        expect(station).toHaveProperty('lat')
        expect(station).toHaveProperty('lon')
        expect(station).toHaveProperty('operational')
        expect(station).toHaveProperty('profitable')
      })
    })
    
    test('must have accurate profitability labels', async () => {
      const stations = await stationDataService.loadAllStations()
      
      const profitable = stations.filter(s => s.profitable === true)
      const unprofitable = stations.filter(s => s.profitable === false)
      
      // Should have both types for training
      expect(profitable.length).toBeGreaterThan(0)
      expect(unprofitable.length).toBeGreaterThan(0)
      
      // Should be reasonably balanced (not all one type)
      const ratio = profitable.length / stations.length
      expect(ratio).toBeGreaterThan(0.2)
      expect(ratio).toBeLessThan(0.8)
    })
    
    test('must provide station metadata', async () => {
      const stations = await stationDataService.loadAllStations()
      const firstStation = stations[0]
      
      expect(firstStation).toHaveProperty('antennaSize')
      expect(firstStation).toHaveProperty('frequency')
      expect(firstStation).toHaveProperty('capabilities')
      expect(Array.isArray(firstStation.capabilities)).toBe(true)
    })
  })
  
  describe('Data Integration', () => {
    test('all data sources must return consistent location formats', async () => {
      const testLocation = { lat: 40.7128, lon: -74.0060 }
      
      // All services should accept same format
      const geeData = await geeService.getNighttimeLights(testLocation)
      const weatherData = await weatherService.getCurrentWeather(testLocation)
      const shippingDensity = await maritimeService.getShippingDensity(testLocation)
      
      // All should return valid data
      expect(geeData).toBeTruthy()
      expect(weatherData).toBeTruthy()
      expect(typeof shippingDensity).toBe('number')
    })
    
    test('must combine multiple data sources for scoring', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      
      // Mock combined scorer that uses all data sources
      const combinedData = {
        nighttimeLights: await geeService.getNighttimeLights(location),
        population: await geeService.getPopulationDensity(location),
        shipping: await maritimeService.getShippingDensity(location),
        weather: await weatherService.getWeatherImpactScore(location)
      }
      
      // All data should be present
      expect(combinedData.nighttimeLights).toBeTruthy()
      expect(combinedData.population).toBeTruthy()
      expect(typeof combinedData.shipping).toBe('number')
      expect(typeof combinedData.weather).toBe('number')
    })
    
    test('must handle partial data availability', async () => {
      // Remote ocean location - some data might not be available
      const remoteLocation = { lat: 0, lon: 0 }
      
      const combinedData = {
        nighttimeLights: await geeService.getNighttimeLights(remoteLocation),
        population: await geeService.getPopulationDensity(remoteLocation),
        shipping: await maritimeService.getShippingDensity(remoteLocation),
        weather: await weatherService.getWeatherImpactScore(remoteLocation)
      }
      
      // Should handle gracefully even if some data is missing/zero
      expect(combinedData).toBeTruthy()
      
      // Should still produce valid scores
      const hasValidData = Object.values(combinedData).some(v => 
        v !== null && v !== undefined
      )
      expect(hasValidData).toBe(true)
    })
  })
  
  describe('Data Quality Checks', () => {
    test('must validate data freshness', async () => {
      const location = { lat: 40.7128, lon: -74.0060 }
      const nighttimeLights = await geeService.getNighttimeLights(location)
      
      if (nighttimeLights.length > 0) {
        const latestData = nighttimeLights[nighttimeLights.length - 1]
        const dataDate = new Date(latestData.date)
        const now = new Date()
        
        // Data should be less than 6 months old
        const monthsDiff = (now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        expect(monthsDiff).toBeLessThan(6)
      }
    })
    
    test('must flag low confidence data', async () => {
      // Sparse data location
      const remoteLocation = { lat: -45, lon: 170 } // New Zealand waters
      const result = await geeService.getNighttimeLights(remoteLocation)
      
      if (result.length > 0) {
        // Remote areas should have lower confidence
        expect(result[0].confidence).toBeLessThan(0.7)
      }
    })
  })
})