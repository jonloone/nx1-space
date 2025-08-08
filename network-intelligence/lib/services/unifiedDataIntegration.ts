/**
 * Unified Data Integration Service
 * 
 * Central service that orchestrates data fetching from all API endpoints,
 * handles caching, error recovery, and provides a unified interface for
 * the frontend components.
 */

// Types
export interface Station {
  id: string
  name: string
  operator: string
  location: string
  coordinates: number[]
  elevation: number
  utilization?: number
  revenue?: number
  profit?: number
  margin?: number
  opportunityScore?: number
  status: string
  antennas?: any[]
  satelliteVisibility?: any
  maritimeCoverage?: any
  competitionIndex?: number
}

export interface Vessel {
  vessel_id: string
  vessel_name: string
  vessel_type: string
  mmsi?: string
  position: {
    longitude: number
    latitude: number
    timestamp: string
  }
  movement: {
    speed_knots: number
    course: number
    heading: number
    status: string
  }
  communication?: any
  cargo?: any
  alerts?: any[]
}

export interface Hexagon {
  hexagon: string
  center: number[]
  score: number
  color: number[]
  marketScore?: number
  technicalScore?: number
  competitionScore?: number
  vesselDensity?: number
  shippingLanes?: any[]
  opportunityType?: string
  confidence?: number
  monthlyRevenuePotential?: number
  isLand?: boolean
}

export interface MaritimeDensityPoint {
  position: number[]
  weight: number
  vesselTypes: Record<string, number>
  value: number
  vesselInfo?: any
}

export interface ShippingRoute {
  id: string
  name: string
  path: number[][]
  traffic: number
  value: number
  vesselTypes: string[]
  color: number[]
  distance?: number
  congestion?: string
  riskLevel?: string
}

export interface DataCache<T> {
  data: T
  timestamp: number
  expiry: number
}

export interface APIError {
  endpoint: string
  error: string
  timestamp: number
  retryCount: number
}

export interface DataMetadata {
  lastUpdated: string
  source: 'api' | 'cache' | 'fallback'
  confidence: number
  freshness: number // seconds since last update
}

// Configuration
const API_CONFIG = {
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 30000,
  retryAttempts: 3,
  cacheTimeout: {
    stations: 5 * 60 * 1000, // 5 minutes
    hexagons: 10 * 60 * 1000, // 10 minutes
    vessels: 30 * 1000, // 30 seconds
    routes: 60 * 60 * 1000, // 1 hour
    analysis: 5 * 60 * 1000, // 5 minutes
    realTime: 10 * 1000 // 10 seconds
  }
}

export class UnifiedDataIntegration {
  private cache = new Map<string, DataCache<any>>()
  private errors = new Map<string, APIError>()
  private abortControllers = new Map<string, AbortController>()
  private retryTimers = new Map<string, NodeJS.Timeout>()

  constructor() {
    // Cleanup old cache entries every minute
    setInterval(() => this.cleanupCache(), 60000)
  }

  /**
   * Get all stations data with caching and error handling
   */
  async getStations(forceRefresh = false): Promise<{ data: Station[]; metadata: DataMetadata }> {
    const cacheKey = 'stations'
    
    if (!forceRefresh) {
      const cached = this.getFromCache<Station[]>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.9,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const response = await this.fetchWithRetry('/api/stations', cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const stations = result.stations as Station[]

      this.setCache(cacheKey, stations, API_CONFIG.cacheTimeout.stations)

      return {
        data: stations,
        metadata: {
          lastUpdated: result.metadata?.lastUpdated || new Date().toISOString(),
          source: 'api',
          confidence: 0.95,
          freshness: 0
        }
      }
    } catch (error) {
      console.error('Error fetching stations:', error)
      return this.handleDataError<Station[]>(cacheKey, error, 'stations')
    }
  }

  /**
   * Get hexagon opportunity data
   */
  async getHexagons(
    resolution = 4,
    bounds?: [number, number, number, number],
    forceRefresh = false
  ): Promise<{ data: Hexagon[]; metadata: DataMetadata }> {
    const cacheKey = `hexagons_${resolution}_${bounds?.join(',') || 'global'}`
    
    if (!forceRefresh) {
      const cached = this.getFromCache<Hexagon[]>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.9,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const params = new URLSearchParams({
        resolution: resolution.toString()
      })
      if (bounds) {
        params.append('bounds', JSON.stringify(bounds))
      }

      const response = await this.fetchWithRetry(`/api/opportunities/hexagons?${params}`, cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const hexagons = result.hexagons as Hexagon[]

      this.setCache(cacheKey, hexagons, API_CONFIG.cacheTimeout.hexagons)

      return {
        data: hexagons,
        metadata: {
          lastUpdated: result.metadata?.lastUpdated || new Date().toISOString(),
          source: 'api',
          confidence: 0.9,
          freshness: 0
        }
      }
    } catch (error) {
      console.error('Error fetching hexagons:', error)
      return this.handleDataError<Hexagon[]>(cacheKey, error, 'hexagons')
    }
  }

  /**
   * Get maritime density data
   */
  async getMaritimeDensity(
    bounds?: [number, number, number, number],
    zoom = 5,
    forceRefresh = false
  ): Promise<{ data: MaritimeDensityPoint[]; metadata: DataMetadata }> {
    const cacheKey = `maritime_density_${zoom}_${bounds?.join(',') || 'global'}`
    
    if (!forceRefresh) {
      const cached = this.getFromCache<MaritimeDensityPoint[]>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.85,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const params = new URLSearchParams({
        zoom: zoom.toString()
      })
      if (bounds) {
        params.append('bounds', JSON.stringify(bounds))
      }

      const response = await this.fetchWithRetry(`/api/maritime/density?${params}`, cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const points = result.points as MaritimeDensityPoint[]

      this.setCache(cacheKey, points, API_CONFIG.cacheTimeout.vessels)

      return {
        data: points,
        metadata: {
          lastUpdated: result.metadata?.lastUpdated || new Date().toISOString(),
          source: 'api',
          confidence: result.metadata?.confidence || 0.85,
          freshness: 0
        }
      }
    } catch (error) {
      console.error('Error fetching maritime density:', error)
      return this.handleDataError<MaritimeDensityPoint[]>(cacheKey, error, 'maritime-density')
    }
  }

  /**
   * Get shipping routes
   */
  async getShippingRoutes(forceRefresh = false): Promise<{ data: ShippingRoute[]; metadata: DataMetadata }> {
    const cacheKey = 'shipping_routes'
    
    if (!forceRefresh) {
      const cached = this.getFromCache<ShippingRoute[]>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.9,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const response = await this.fetchWithRetry('/api/maritime/routes', cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      const routes = result.routes as ShippingRoute[]

      this.setCache(cacheKey, routes, API_CONFIG.cacheTimeout.routes)

      return {
        data: routes,
        metadata: {
          lastUpdated: result.metadata?.lastUpdated || new Date().toISOString(),
          source: 'api',
          confidence: 0.9,
          freshness: 0
        }
      }
    } catch (error) {
      console.error('Error fetching shipping routes:', error)
      return this.handleDataError<ShippingRoute[]>(cacheKey, error, 'shipping-routes')
    }
  }

  /**
   * Get analysis data
   */
  async getAnalysis(
    type: 'opportunity' | 'station' | 'competitive' | 'market',
    options: {
      bounds?: [number, number, number, number]
      stationId?: string
    } = {},
    forceRefresh = false
  ): Promise<{ data: any; metadata: DataMetadata }> {
    const cacheKey = `analysis_${type}_${JSON.stringify(options)}`
    
    if (!forceRefresh) {
      const cached = this.getFromCache<any>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.9,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const params = new URLSearchParams({ type })
      if (options.bounds) {
        params.append('bounds', JSON.stringify(options.bounds))
      }
      if (options.stationId) {
        params.append('stationId', options.stationId)
      }

      const response = await this.fetchWithRetry(`/api/analysis?${params}`, cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      this.setCache(cacheKey, result.analysis, API_CONFIG.cacheTimeout.analysis)

      return {
        data: result.analysis,
        metadata: {
          lastUpdated: result.metadata?.generatedAt || new Date().toISOString(),
          source: 'api',
          confidence: 0.9,
          freshness: 0
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} analysis:`, error)
      return this.handleDataError<any>(cacheKey, error, `${type}-analysis`)
    }
  }

  /**
   * Get real-time data
   */
  async getRealTimeData(
    type: 'vessels' | 'stations' | 'traffic' | 'alerts' | 'metrics',
    options: {
      bounds?: [number, number, number, number]
      interval?: number
      count?: number
    } = {}
  ): Promise<{ data: any; metadata: DataMetadata }> {
    const cacheKey = `realtime_${type}_${JSON.stringify(options)}`
    
    // Real-time data has very short cache
    const cached = this.getFromCache<any>(cacheKey)
    if (cached && this.getCacheAge(cacheKey) < API_CONFIG.cacheTimeout.realTime) {
      return {
        data: cached,
        metadata: {
          lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
          source: 'cache',
          confidence: 0.95,
          freshness: this.getCacheAge(cacheKey) / 1000
        }
      }
    }

    try {
      const params = new URLSearchParams({ type })
      if (options.bounds) {
        params.append('bounds', JSON.stringify(options.bounds))
      }
      if (options.interval) {
        params.append('interval', options.interval.toString())
      }
      if (options.count) {
        params.append('count', options.count.toString())
      }

      const response = await this.fetchWithRetry(`/api/real-time?${params}`, cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      // Cache for very short time
      this.setCache(cacheKey, result, API_CONFIG.cacheTimeout.realTime)

      return {
        data: result,
        metadata: {
          lastUpdated: result.timestamp || new Date().toISOString(),
          source: 'api',
          confidence: result.metadata?.confidence || 0.9,
          freshness: 0
        }
      }
    } catch (error) {
      console.error(`Error fetching real-time ${type} data:`, error)
      return this.handleDataError<any>(cacheKey, error, `realtime-${type}`)
    }
  }

  /**
   * Get maritime intelligence data
   */
  async getMaritimeIntelligence(
    bounds: [number, number, number, number],
    options: {
      temporalHours?: number
      qualityThreshold?: number
      h3Resolution?: number
      includeSynthetic?: boolean
      vesselTypes?: string[]
      demoMode?: boolean
    } = {},
    forceRefresh = false
  ): Promise<{ data: any; metadata: DataMetadata }> {
    const cacheKey = `maritime_intelligence_${bounds.join(',')}_${JSON.stringify(options)}`
    
    if (!forceRefresh) {
      const cached = this.getFromCache<any>(cacheKey)
      if (cached) {
        return {
          data: cached,
          metadata: {
            lastUpdated: new Date(Date.now() - this.getCacheAge(cacheKey)).toISOString(),
            source: 'cache',
            confidence: 0.9,
            freshness: this.getCacheAge(cacheKey) / 1000
          }
        }
      }
    }

    try {
      const params = new URLSearchParams({
        north: bounds[3].toString(),
        south: bounds[1].toString(),
        east: bounds[2].toString(),
        west: bounds[0].toString(),
        temporal_hours: (options.temporalHours || 24).toString(),
        quality_threshold: (options.qualityThreshold || 70).toString(),
        h3_resolution: (options.h3Resolution || 6).toString(),
        include_synthetic: (options.includeSynthetic !== false).toString(),
        demo_mode: (options.demoMode || false).toString()
      })

      if (options.vesselTypes?.length) {
        params.append('vessel_types', options.vesselTypes.join(','))
      }

      const response = await this.fetchWithRetry(`/api/maritime-intelligence?${params}`, cacheKey)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      this.setCache(cacheKey, result, API_CONFIG.cacheTimeout.analysis)

      return {
        data: result,
        metadata: {
          lastUpdated: result.performance?.processing_time_ms ? new Date().toISOString() : new Date().toISOString(),
          source: 'api',
          confidence: result.maritime_intelligence?.confidence_level || 0.9,
          freshness: 0
        }
      }
    } catch (error) {
      console.error('Error fetching maritime intelligence:', error)
      return this.handleDataError<any>(cacheKey, error, 'maritime-intelligence')
    }
  }

  /**
   * Batch fetch multiple data types
   */
  async batchFetch(requests: Array<{
    type: 'stations' | 'hexagons' | 'maritime' | 'routes' | 'analysis' | 'realtime'
    options?: any
  }>): Promise<Record<string, { data: any; metadata: DataMetadata }>> {
    const results: Record<string, { data: any; metadata: DataMetadata }> = {}

    const promises = requests.map(async (request, index) => {
      const key = `${request.type}_${index}`
      
      try {
        switch (request.type) {
          case 'stations':
            results[key] = await this.getStations()
            break
          case 'hexagons':
            results[key] = await this.getHexagons(
              request.options?.resolution,
              request.options?.bounds
            )
            break
          case 'maritime':
            results[key] = await this.getMaritimeDensity(
              request.options?.bounds,
              request.options?.zoom
            )
            break
          case 'routes':
            results[key] = await this.getShippingRoutes()
            break
          case 'analysis':
            results[key] = await this.getAnalysis(
              request.options?.type,
              request.options?.options
            )
            break
          case 'realtime':
            results[key] = await this.getRealTimeData(
              request.options?.type,
              request.options?.options
            )
            break
        }
      } catch (error) {
        console.error(`Error in batch fetch for ${request.type}:`, error)
        results[key] = {
          data: null,
          metadata: {
            lastUpdated: new Date().toISOString(),
            source: 'fallback',
            confidence: 0,
            freshness: 0
          }
        }
      }
    })

    await Promise.all(promises)
    return results
  }

  /**
   * Clear cache for specific key or all
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get current cache status
   */
  getCacheStatus() {
    return {
      entries: this.cache.size,
      errors: this.errors.size,
      activeRequests: this.abortControllers.size,
      retryTimers: this.retryTimers.size
    }
  }

  /**
   * Get error history
   */
  getErrorHistory() {
    return Array.from(this.errors.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Private methods

  private async fetchWithRetry(url: string, cacheKey: string): Promise<Response> {
    // Cancel any existing request for this cache key
    const existingController = this.abortControllers.get(cacheKey)
    if (existingController) {
      existingController.abort()
    }

    const controller = new AbortController()
    this.abortControllers.set(cacheKey, controller)

    try {
      const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.timeout,
      } as RequestInit)

      this.abortControllers.delete(cacheKey)
      this.errors.delete(cacheKey) // Clear any previous errors

      return response
    } catch (error) {
      this.abortControllers.delete(cacheKey)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request aborted')
      }

      // Record error for retry logic
      const errorRecord = this.errors.get(cacheKey) || { endpoint: url, error: '', timestamp: 0, retryCount: 0 }
      errorRecord.error = error instanceof Error ? error.message : 'Unknown error'
      errorRecord.timestamp = Date.now()
      errorRecord.retryCount += 1
      this.errors.set(cacheKey, errorRecord)

      // Implement exponential backoff retry
      if (errorRecord.retryCount < API_CONFIG.retryAttempts) {
        const delay = Math.pow(2, errorRecord.retryCount) * 1000 // 2s, 4s, 8s
        
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            this.retryTimers.delete(cacheKey)
            this.fetchWithRetry(url, cacheKey).then(resolve).catch(reject)
          }, delay)
          this.retryTimers.set(cacheKey, timer)
        })
      }

      throw error
    }
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCache<T>(key: string, data: T, timeout: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + timeout
    })
  }

  private getCacheAge(key: string): number {
    const cached = this.cache.get(key)
    return cached ? Date.now() - cached.timestamp : 0
  }

  private cleanupCache() {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key)
      }
    }
  }

  private handleDataError<T>(
    cacheKey: string,
    error: any,
    fallbackType: string
  ): { data: T; metadata: DataMetadata } {
    console.warn(`Data fetch failed for ${cacheKey}, attempting fallback:`, error)

    // Try to get stale cache data
    const staleCache = this.cache.get(cacheKey)
    if (staleCache) {
      console.log(`Using stale cache data for ${cacheKey}`)
      return {
        data: staleCache.data,
        metadata: {
          lastUpdated: new Date(staleCache.timestamp).toISOString(),
          source: 'cache',
          confidence: 0.5, // Lower confidence for stale data
          freshness: (Date.now() - staleCache.timestamp) / 1000
        }
      }
    }

    // Return fallback data based on type
    const fallbackData = this.generateFallbackData(fallbackType)
    return {
      data: fallbackData as T,
      metadata: {
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        confidence: 0.3,
        freshness: 0
      }
    }
  }

  private generateFallbackData(type: string): any {
    switch (type) {
      case 'stations':
        return this.generateFallbackStations()
      case 'hexagons':
        return this.generateFallbackHexagons()
      case 'maritime-density':
        return this.generateFallbackMaritimeDensity()
      case 'shipping-routes':
        return this.generateFallbackShippingRoutes()
      case 'analysis':
        return this.generateFallbackAnalysis()
      case 'realtime-vessels':
        return this.generateFallbackVessels()
      case 'maritime-intelligence':
        return this.generateFallbackMaritimeIntelligence()
      default:
        return {}
    }
  }

  private generateFallbackStations(): Station[] {
    // Generate minimal station data for fallback
    return [
      {
        id: 'fallback-1',
        name: 'Emergency Station Alpha',
        operator: 'SES',
        location: 'Atlantic Ocean',
        coordinates: [-30, 40],
        elevation: 0,
        utilization: 75,
        status: 'operational',
        competitionIndex: 0
      },
      {
        id: 'fallback-2', 
        name: 'Emergency Station Beta',
        operator: 'SES',
        location: 'Pacific Ocean',
        coordinates: [-150, 30],
        elevation: 0,
        utilization: 60,
        status: 'operational',
        competitionIndex: 0
      }
    ]
  }

  private generateFallbackHexagons(): Hexagon[] {
    // Generate minimal hexagon data for fallback
    const fallbackHexagons: Hexagon[] = []
    
    for (let i = 0; i < 50; i++) {
      const lat = -60 + Math.random() * 120 // Random latitude
      const lng = -180 + Math.random() * 360 // Random longitude
      
      fallbackHexagons.push({
        hexagon: `fallback-${i}`,
        center: [lng, lat],
        score: Math.random() * 0.5, // Low scores for fallback
        color: [100, 100, 100, 150], // Gray color
        opportunityType: 'fallback',
        confidence: 0.1,
        monthlyRevenuePotential: 0,
        isLand: Math.random() > 0.7
      })
    }
    
    return fallbackHexagons
  }

  private generateFallbackMaritimeDensity(): MaritimeDensityPoint[] {
    // Generate minimal maritime density data
    const points: MaritimeDensityPoint[] = []
    
    const majorPorts = [
      [103.8, 1.3], // Singapore
      [4.0, 51.9],  // Rotterdam
      [-74.0, 40.7], // New York
      [121.5, 31.2], // Shanghai
      [55.3, 25.3]   // Dubai
    ]

    majorPorts.forEach(([lng, lat], i) => {
      points.push({
        position: [lng, lat],
        weight: 10 + i * 2,
        vesselTypes: { container: 5, tanker: 3, bulk: 2 },
        value: 25000,
        vesselInfo: null
      })
    })

    return points
  }

  private generateFallbackShippingRoutes(): ShippingRoute[] {
    return [
      {
        id: 'fallback-transatlantic',
        name: 'Emergency Trans-Atlantic Route',
        path: [[-74, 40], [-30, 45], [0, 50], [4, 52]],
        traffic: 50,
        value: 1000000,
        vesselTypes: ['container', 'tanker'],
        color: [150, 150, 150, 200]
      },
      {
        id: 'fallback-pacific',
        name: 'Emergency Pacific Route',
        path: [[-122, 37], [-140, 35], [140, 35], [121, 31]],
        traffic: 30,
        value: 800000,
        vesselTypes: ['container', 'bulk'],
        color: [150, 150, 150, 200]
      }
    ]
  }

  private generateFallbackAnalysis(): any {
    return {
      type: 'fallback',
      timestamp: new Date().toISOString(),
      opportunities: [],
      summary: {
        totalOpportunities: 0,
        highPotential: 0,
        mediumPotential: 0,
        lowPotential: 0,
        averageScore: 0
      },
      message: 'Using fallback analysis data. Limited functionality available.'
    }
  }

  private generateFallbackVessels(): any {
    return {
      vessels: [],
      summary: {
        total_vessels: 0,
        active_connections: 0,
        average_speed: 0,
        data_consumption_mb_hour: 0
      },
      message: 'Real-time vessel data unavailable. Using fallback mode.'
    }
  }

  private generateFallbackMaritimeIntelligence(): any {
    return {
      success: false,
      maritime_intelligence: {
        data_source: 'fallback',
        vessel_count: 0,
        h3_grid_cells: 0,
        confidence_level: 0,
        coverage_percentage: 0,
        data_freshness_hours: 999
      },
      data_quality: {
        overall_score: 0,
        confidence_interval: [0, 0],
        metrics: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          timeliness: 0,
          validity: 0,
          uniqueness: 0
        }
      },
      message: 'Maritime intelligence service unavailable. Using fallback data.'
    }
  }
}

// Export singleton instance
export const unifiedDataIntegration = new UnifiedDataIntegration()
export default unifiedDataIntegration