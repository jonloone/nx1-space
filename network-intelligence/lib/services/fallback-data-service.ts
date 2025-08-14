/**
 * Fallback Data Service
 * 
 * Provides robust fallback mechanisms when external APIs are unavailable.
 * Ensures the ML training pipeline can continue operating with degraded but functional data.
 * 
 * Features:
 * - Intelligent fallback data generation
 * - Historical data caching and replay
 * - Graceful degradation with confidence scoring
 * - Emergency operational modes
 * - Data quality preservation
 */

import { GroundStation } from '../types/ground-station'
import { EnrichedGroundStation } from '../data/data-integration-service'

export interface FallbackConfig {
  // Fallback modes
  useHistoricalData: boolean
  useSyntheticData: boolean
  useStatisticalModels: boolean
  
  // Data quality preferences
  minConfidenceScore: number
  maxDataAge: number // milliseconds
  fallbackDataRetention: number // days
  
  // Emergency modes
  emergencyMode: boolean
  offlineMode: boolean
  
  // Synthetic data quality
  syntheticDataVariance: number
  geographicRealism: boolean
  temporalConsistency: boolean
}

export interface FallbackDataMetadata {
  source: 'historical' | 'synthetic' | 'statistical' | 'hybrid'
  confidence: number
  lastUpdated: Date
  dataAge: number
  quality: number
  warnings: string[]
}

export interface FallbackResult<T> {
  data: T
  metadata: FallbackDataMetadata
  fallbackReason: string
  originalError?: string
}

export class FallbackDataService {
  private config: FallbackConfig
  private historicalDataCache = new Map<string, { data: any; timestamp: number; metadata: any }>()
  private statisticalModels = new Map<string, any>()
  
  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      useHistoricalData: true,
      useSyntheticData: true,
      useStatisticalModels: true,
      
      minConfidenceScore: 0.3,
      maxDataAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      fallbackDataRetention: 30, // 30 days
      
      emergencyMode: false,
      offlineMode: false,
      
      syntheticDataVariance: 0.2,
      geographicRealism: true,
      temporalConsistency: true,
      
      ...config
    }
    
    // Initialize statistical models
    this.initializeStatisticalModels()
    
    // Cleanup old data periodically
    setInterval(() => this.cleanupHistoricalData(), 24 * 60 * 60 * 1000) // Daily
  }

  /**
   * Get maritime data with fallback
   */
  async getMaritimeDataWithFallback(
    lat: number, 
    lon: number, 
    originalError?: string
  ): Promise<FallbackResult<any>> {
    const cacheKey = `maritime_${lat}_${lon}`
    
    // Try historical data first
    if (this.config.useHistoricalData) {
      const historical = this.getHistoricalData(cacheKey)
      if (historical && this.isDataValid(historical)) {
        return {
          data: historical.data,
          metadata: {
            source: 'historical',
            confidence: 0.7,
            lastUpdated: new Date(historical.timestamp),
            dataAge: Date.now() - historical.timestamp,
            quality: 0.8,
            warnings: ['Using historical maritime data due to API unavailability']
          },
          fallbackReason: 'External maritime API unavailable',
          originalError
        }
      }
    }

    // Generate synthetic data
    const syntheticData = this.generateSyntheticMaritimeData(lat, lon)
    
    return {
      data: syntheticData,
      metadata: {
        source: 'synthetic',
        confidence: 0.4,
        lastUpdated: new Date(),
        dataAge: 0,
        quality: 0.6,
        warnings: ['Using synthetic maritime data - accuracy may be reduced']
      },
      fallbackReason: 'No historical data available, using synthetic generation',
      originalError
    }
  }

  /**
   * Get economic data with fallback
   */
  async getEconomicDataWithFallback(
    country: string,
    originalError?: string
  ): Promise<FallbackResult<any>> {
    const cacheKey = `economic_${country}`
    
    // Try historical data
    if (this.config.useHistoricalData) {
      const historical = this.getHistoricalData(cacheKey)
      if (historical && this.isDataValid(historical)) {
        return {
          data: historical.data,
          metadata: {
            source: 'historical',
            confidence: 0.8,
            lastUpdated: new Date(historical.timestamp),
            dataAge: Date.now() - historical.timestamp,
            quality: 0.9,
            warnings: []
          },
          fallbackReason: 'External economic API unavailable',
          originalError
        }
      }
    }

    // Use statistical model
    if (this.config.useStatisticalModels) {
      const modelData = this.getEconomicModelData(country)
      if (modelData) {
        return {
          data: modelData,
          metadata: {
            source: 'statistical',
            confidence: 0.6,
            lastUpdated: new Date(),
            dataAge: 0,
            quality: 0.7,
            warnings: ['Using statistical model for economic data']
          },
          fallbackReason: 'No historical data, using statistical model',
          originalError
        }
      }
    }

    // Generate synthetic data
    const syntheticData = this.generateSyntheticEconomicData(country)
    
    return {
      data: syntheticData,
      metadata: {
        source: 'synthetic',
        confidence: 0.3,
        lastUpdated: new Date(),
        dataAge: 0,
        quality: 0.5,
        warnings: ['Using synthetic economic data - may not reflect current conditions']
      },
      fallbackReason: 'All fallback sources exhausted, using synthetic generation',
      originalError
    }
  }

  /**
   * Get weather data with fallback
   */
  async getWeatherDataWithFallback(
    lat: number,
    lon: number,
    originalError?: string
  ): Promise<FallbackResult<any>> {
    const cacheKey = `weather_${lat}_${lon}`
    
    // Try historical seasonal data
    if (this.config.useHistoricalData) {
      const seasonalData = this.getSeasonalWeatherData(lat, lon)
      if (seasonalData) {
        return {
          data: seasonalData,
          metadata: {
            source: 'historical',
            confidence: 0.6,
            lastUpdated: new Date(),
            dataAge: 0,
            quality: 0.7,
            warnings: ['Using seasonal weather patterns']
          },
          fallbackReason: 'Weather API unavailable, using seasonal data',
          originalError
        }
      }
    }

    // Generate climate-based synthetic data
    const climateData = this.generateClimateBasedWeatherData(lat, lon)
    
    return {
      data: climateData,
      metadata: {
        source: 'synthetic',
        confidence: 0.4,
        lastUpdated: new Date(),
        dataAge: 0,
        quality: 0.6,
        warnings: ['Using climate-based weather estimation']
      },
      fallbackReason: 'No historical weather data, using climate estimation',
      originalError
    }
  }

  /**
   * Get infrastructure data with fallback
   */
  async getInfrastructureDataWithFallback(
    lat: number,
    lon: number,
    country?: string,
    originalError?: string
  ): Promise<FallbackResult<any>> {
    // Use statistical model based on country and coordinates
    if (this.config.useStatisticalModels && country) {
      const modelData = this.getInfrastructureModelData(lat, lon, country)
      return {
        data: modelData,
        metadata: {
          source: 'statistical',
          confidence: 0.7,
          lastUpdated: new Date(),
          dataAge: 0,
          quality: 0.8,
          warnings: ['Using infrastructure statistical model']
        },
        fallbackReason: 'Infrastructure API unavailable, using statistical model',
        originalError
      }
    }

    // Generate synthetic data based on development level
    const syntheticData = this.generateSyntheticInfrastructureData(lat, lon, country)
    
    return {
      data: syntheticData,
      metadata: {
        source: 'synthetic',
        confidence: 0.5,
        lastUpdated: new Date(),
        dataAge: 0,
        quality: 0.6,
        warnings: ['Using synthetic infrastructure data']
      },
      fallbackReason: 'No model data available, using synthetic generation',
      originalError
    }
  }

  /**
   * Get enriched station data with comprehensive fallbacks
   */
  async getEnrichedStationWithFallback(
    station: GroundStation,
    originalError?: string
  ): Promise<FallbackResult<EnrichedGroundStation>> {
    const warnings: string[] = []
    
    // Start with base station data
    const enriched: EnrichedGroundStation = {
      ...station,
      // Initialize with default values
      maritimeDensity: 0,
      vesselTrafficValue: 0,
      portProximity: 0,
      shippingLaneAccess: 0,
      gdpPerCapita: 30000,
      populationDensity: 100,
      economicGrowthRate: 2.5,
      digitalMaturity: 0.7,
      competitorCount: 0,
      competitorDensity: 0,
      marketSaturation: 0.5,
      marketGap: 0.5,
      infrastructureScore: 0.7,
      fiberConnectivity: 0.8,
      powerReliability: 0.9,
      regulatoryFriendliness: 0.8,
      weatherReliability: 0.85,
      clearSkyDays: 300,
      disasterRisk: 0.1,
      elevation: 0,
      satelliteVisibility: station.satellitesVisible || 15,
      passFrequency: 24,
      signalQuality: 0.9,
      interferenceLevel: 0.1,
      dataCompleteness: 0.5,
      confidenceScore: 0.5,
      lastUpdated: new Date().toISOString(),
      
      // Additional computed fields
      marketOpportunityScore: 0,
      technicalFeasibilityScore: 0,
      riskScore: 0,
      investmentScore: 0
    }

    try {
      // Get maritime data with fallback
      const maritimeResult = await this.getMaritimeDataWithFallback(
        station.latitude, 
        station.longitude
      )
      
      enriched.maritimeDensity = maritimeResult.data.vesselDensity || 0
      enriched.vesselTrafficValue = maritimeResult.data.trafficValue || 0
      warnings.push(...maritimeResult.metadata.warnings)

      // Get economic data with fallback
      const economicResult = await this.getEconomicDataWithFallback(
        station.country || 'Unknown'
      )
      
      enriched.gdpPerCapita = economicResult.data.gdpPerCapita || 30000
      enriched.populationDensity = economicResult.data.populationDensity || 100
      enriched.digitalMaturity = economicResult.data.digitalConnectivity || 0.7
      warnings.push(...economicResult.metadata.warnings)

      // Get weather data with fallback
      const weatherResult = await this.getWeatherDataWithFallback(
        station.latitude,
        station.longitude
      )
      
      enriched.weatherReliability = weatherResult.data.reliabilityScore || 0.85
      enriched.clearSkyDays = weatherResult.data.clearSkyPercentage * 365 / 100 || 300
      warnings.push(...weatherResult.metadata.warnings)

      // Get infrastructure data with fallback
      const infraResult = await this.getInfrastructureDataWithFallback(
        station.latitude,
        station.longitude,
        station.country
      )
      
      enriched.infrastructureScore = infraResult.data.totalScore || 0.7
      enriched.fiberConnectivity = infraResult.data.fiberConnectivity || 0.8
      enriched.powerReliability = infraResult.data.powerGridReliability || 0.9
      warnings.push(...infraResult.metadata.warnings)

      // Calculate derived metrics
      this.calculateDerivedMetrics(enriched)

      // Calculate overall confidence based on fallback sources used
      const overallConfidence = this.calculateOverallConfidence([
        maritimeResult.metadata.confidence,
        economicResult.metadata.confidence,
        weatherResult.metadata.confidence,
        infraResult.metadata.confidence
      ])

      return {
        data: enriched,
        metadata: {
          source: 'hybrid',
          confidence: overallConfidence,
          lastUpdated: new Date(),
          dataAge: 0,
          quality: overallConfidence * 0.8 + 0.2, // Quality is slightly higher than confidence
          warnings
        },
        fallbackReason: 'Using fallback data sources for station enrichment',
        originalError
      }

    } catch (error) {
      // Last resort - use minimal enrichment
      warnings.push('Failed to enrich station data, using minimal defaults')
      
      this.calculateDerivedMetrics(enriched)
      
      return {
        data: enriched,
        metadata: {
          source: 'synthetic',
          confidence: 0.2,
          lastUpdated: new Date(),
          dataAge: 0,
          quality: 0.3,
          warnings
        },
        fallbackReason: 'All data sources failed, using minimal defaults',
        originalError: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Private helper methods

  /**
   * Store data for historical fallback
   */
  storeHistoricalData(key: string, data: any, metadata?: any): void {
    this.historicalDataCache.set(key, {
      data,
      timestamp: Date.now(),
      metadata: metadata || {}
    })
  }

  /**
   * Get historical data if available and valid
   */
  private getHistoricalData(key: string): { data: any; timestamp: number; metadata: any } | null {
    const cached = this.historicalDataCache.get(key)
    if (!cached) return null
    
    // Check if data is too old
    if (Date.now() - cached.timestamp > this.config.maxDataAge) {
      this.historicalDataCache.delete(key)
      return null
    }
    
    return cached
  }

  /**
   * Check if historical data is valid for use
   */
  private isDataValid(historical: { data: any; timestamp: number; metadata: any }): boolean {
    const age = Date.now() - historical.timestamp
    const maxAge = this.config.maxDataAge
    
    // Data is valid if it's not too old and meets minimum quality
    return age < maxAge && (historical.metadata.quality || 0.5) >= this.config.minConfidenceScore
  }

  /**
   * Initialize statistical models for fallback data generation
   */
  private initializeStatisticalModels(): void {
    // Economic model by country
    this.statisticalModels.set('economic', {
      'United States': { gdpPerCapita: 65000, infraIndex: 0.85, digitalIndex: 0.9 },
      'Germany': { gdpPerCapita: 55000, infraIndex: 0.90, digitalIndex: 0.88 },
      'Singapore': { gdpPerCapita: 72000, infraIndex: 0.95, digitalIndex: 0.95 },
      'Japan': { gdpPerCapita: 40000, infraIndex: 0.88, digitalIndex: 0.85 },
      'Australia': { gdpPerCapita: 55000, infraIndex: 0.80, digitalIndex: 0.82 },
      'United Kingdom': { gdpPerCapita: 47000, infraIndex: 0.82, digitalIndex: 0.86 },
      'France': { gdpPerCapita: 45000, infraIndex: 0.85, digitalIndex: 0.84 },
      'South Korea': { gdpPerCapita: 35000, infraIndex: 0.83, digitalIndex: 0.90 },
      'default': { gdpPerCapita: 30000, infraIndex: 0.70, digitalIndex: 0.70 }
    })

    // Infrastructure model by development level
    this.statisticalModels.set('infrastructure', {
      developed: { fiber: 0.9, power: 0.95, transport: 0.9, regulatory: 0.85 },
      developing: { fiber: 0.6, power: 0.8, transport: 0.7, regulatory: 0.75 },
      emerging: { fiber: 0.4, power: 0.6, transport: 0.5, regulatory: 0.65 }
    })
  }

  /**
   * Generate synthetic maritime data based on geographic factors
   */
  private generateSyntheticMaritimeData(lat: number, lon: number): any {
    // Calculate distance to major shipping routes and ports
    const distanceToPort = this.calculateDistanceToNearestPort(lat, lon)
    const distanceToRoute = this.calculateDistanceToShippingRoute(lat, lon)
    
    // Base vessel density on proximity to shipping infrastructure
    let vesselDensity = Math.max(0, 100 - distanceToPort * 0.5)
    vesselDensity = Math.max(vesselDensity, 50 - distanceToRoute * 2)
    
    // Add geographic variance
    const variance = this.config.syntheticDataVariance
    vesselDensity *= (1 + (Math.random() - 0.5) * variance)
    
    return {
      latitude: lat,
      longitude: lon,
      vesselDensity: Math.max(0, vesselDensity),
      vesselTypes: {
        container: vesselDensity * 0.3,
        tanker: vesselDensity * 0.2,
        bulk: vesselDensity * 0.15,
        passenger: vesselDensity * 0.1,
        other: vesselDensity * 0.25
      },
      trafficValue: vesselDensity * 50000,
      confidence: 0.4
    }
  }

  /**
   * Get economic data from statistical model
   */
  private getEconomicModelData(country: string): any | null {
    const economicModel = this.statisticalModels.get('economic')
    if (!economicModel) return null
    
    const countryData = economicModel[country] || economicModel['default']
    
    // Add variance for realism
    const variance = this.config.syntheticDataVariance
    
    return {
      country,
      gdpPerCapita: countryData.gdpPerCapita * (1 + (Math.random() - 0.5) * variance),
      populationDensity: this.estimatePopulationDensity(country),
      infrastructureIndex: countryData.infraIndex * (1 + (Math.random() - 0.5) * variance * 0.5),
      digitalConnectivity: countryData.digitalIndex * (1 + (Math.random() - 0.5) * variance * 0.3),
      businessEnvironment: 0.7 + Math.random() * 0.25
    }
  }

  /**
   * Generate synthetic economic data
   */
  private generateSyntheticEconomicData(country: string): any {
    const modelData = this.getEconomicModelData(country)
    if (modelData) return modelData
    
    // Fallback to generic estimates
    return {
      country,
      gdpPerCapita: 25000 + Math.random() * 50000,
      populationDensity: 50 + Math.random() * 500,
      infrastructureIndex: 0.5 + Math.random() * 0.4,
      digitalConnectivity: 0.6 + Math.random() * 0.3,
      businessEnvironment: 0.6 + Math.random() * 0.3
    }
  }

  /**
   * Get seasonal weather data based on latitude and current date
   */
  private getSeasonalWeatherData(lat: number, lon: number): any | null {
    const month = new Date().getMonth() // 0-11
    const absLat = Math.abs(lat)
    
    // Seasonal patterns based on latitude and hemisphere
    let baseReliability = 0.8
    
    // Winter months in northern hemisphere (Dec, Jan, Feb)
    if ((lat > 0 && [11, 0, 1].includes(month)) || 
        (lat < 0 && [5, 6, 7].includes(month))) {
      baseReliability -= 0.2
    }
    
    // Tropical regions have seasonal rain patterns
    if (absLat < 23.5) {
      // Monsoon season adjustments
      if ([5, 6, 7, 8, 9].includes(month)) {
        baseReliability -= 0.3
      }
    }
    
    // High latitude regions
    if (absLat > 60) {
      baseReliability -= 0.15
    }
    
    const reliabilityScore = Math.max(0.3, Math.min(0.95, baseReliability))
    
    return {
      clearSkyPercentage: reliabilityScore * 85 + Math.random() * 15,
      precipitationDays: (1 - reliabilityScore) * 120 + Math.random() * 30,
      windSpeed: 10 + Math.random() * 20,
      cloudCover: (1 - reliabilityScore) * 60 + Math.random() * 20,
      reliabilityScore,
      seasonalVariation: 0.1 + Math.random() * 0.3,
      dataSource: 'seasonal_model'
    }
  }

  /**
   * Generate climate-based weather data
   */
  private generateClimateBasedWeatherData(lat: number, lon: number): any {
    const seasonal = this.getSeasonalWeatherData(lat, lon)
    if (seasonal) return seasonal
    
    // Basic climate estimation
    const absLat = Math.abs(lat)
    let reliabilityScore = 0.85
    
    if (absLat < 23.5) reliabilityScore -= 0.15 // Tropical
    if (absLat > 60) reliabilityScore -= 0.20 // Arctic/Antarctic
    
    // Coastal vs inland (simplified)
    const distanceToCoast = Math.min(Math.abs(lon), 180 - Math.abs(lon)) * 111
    if (distanceToCoast < 100) reliabilityScore -= 0.05 // More variable near coast
    
    return {
      clearSkyPercentage: reliabilityScore * 80 + Math.random() * 20,
      precipitationDays: (1 - reliabilityScore) * 100 + Math.random() * 50,
      windSpeed: 12 + Math.random() * 16,
      cloudCover: (1 - reliabilityScore) * 50 + Math.random() * 30,
      reliabilityScore: Math.max(0.4, reliabilityScore),
      seasonalVariation: 0.2 + Math.random() * 0.2,
      dataSource: 'climate_estimation'
    }
  }

  /**
   * Get infrastructure data from statistical model
   */
  private getInfrastructureModelData(lat: number, lon: number, country: string): any {
    const infraModel = this.statisticalModels.get('infrastructure')
    if (!infraModel) return null
    
    // Determine development level
    const developedCountries = ['United States', 'Germany', 'Singapore', 'Japan', 'Australia', 'United Kingdom', 'France']
    const emergingCountries = ['India', 'Brazil', 'South Africa', 'Indonesia']
    
    let level = 'developing'
    if (developedCountries.includes(country)) level = 'developed'
    else if (emergingCountries.includes(country)) level = 'emerging'
    
    const modelData = infraModel[level]
    
    // Distance to major city affects infrastructure quality
    const distanceToCity = this.estimateDistanceToMajorCity(lat, lon)
    const cityFactor = Math.max(0.5, 1 - distanceToCity / 1000) // Decreases with distance
    
    return {
      fiberConnectivity: modelData.fiber * cityFactor,
      powerGridReliability: modelData.power * (0.8 + cityFactor * 0.2),
      transportationAccess: modelData.transport * cityFactor,
      dataCenterProximity: Math.max(0.1, modelData.fiber * cityFactor * 0.8),
      regulatoryScore: modelData.regulatory,
      totalScore: (modelData.fiber + modelData.power + modelData.transport + modelData.regulatory) / 4 * cityFactor
    }
  }

  /**
   * Generate synthetic infrastructure data
   */
  private generateSyntheticInfrastructureData(lat: number, lon: number, country?: string): any {
    const modelData = this.getInfrastructureModelData(lat, lon, country || 'Unknown')
    if (modelData) return modelData
    
    // Fallback synthetic generation
    const distanceToCity = this.estimateDistanceToMajorCity(lat, lon)
    const baseScore = Math.max(0.3, 0.9 - distanceToCity / 1000)
    
    const variance = this.config.syntheticDataVariance
    
    return {
      fiberConnectivity: Math.max(0.2, baseScore * (1 + (Math.random() - 0.5) * variance)),
      powerGridReliability: Math.max(0.4, baseScore * (1 + (Math.random() - 0.5) * variance)),
      transportationAccess: Math.max(0.3, baseScore * (1 + (Math.random() - 0.5) * variance)),
      dataCenterProximity: Math.max(0.1, baseScore * 0.8),
      regulatoryScore: 0.7 + Math.random() * 0.25,
      totalScore: baseScore
    }
  }

  /**
   * Calculate derived metrics for enriched station
   */
  private calculateDerivedMetrics(station: EnrichedGroundStation): void {
    // Market opportunity composite score
    station.marketOpportunityScore = (
      (station.maritimeDensity / 100) * 0.3 +
      (station.gdpPerCapita / 100000) * 0.25 +
      (1 - station.marketSaturation) * 0.25 +
      station.infrastructureScore * 0.2
    )

    // Technical feasibility score
    station.technicalFeasibilityScore = (
      (station.satelliteVisibility / 25) * 0.3 +
      station.weatherReliability * 0.3 +
      station.signalQuality * 0.2 +
      (1 - station.interferenceLevel) * 0.2
    )

    // Risk assessment score
    station.riskScore = (
      station.disasterRisk * 0.3 +
      (1 - station.powerReliability) * 0.2 +
      (1 - station.regulatoryFriendliness) * 0.2 +
      station.competitorDensity / 10 * 0.2 +
      (1 - station.weatherReliability) * 0.1
    )

    // Investment attractiveness
    station.investmentScore = (
      station.marketOpportunityScore * 0.4 +
      station.technicalFeasibilityScore * 0.35 +
      (1 - station.riskScore) * 0.25
    )
  }

  /**
   * Calculate overall confidence from multiple sources
   */
  private calculateOverallConfidence(confidences: number[]): number {
    // Use weighted average with penalty for low confidence sources
    const weights = confidences.map(c => Math.max(0.1, c))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const weightedSum = confidences.reduce((sum, c, i) => sum + c * weights[i], 0)
    
    return Math.max(0.1, Math.min(1.0, weightedSum / totalWeight))
  }

  // Geographic utility methods

  private calculateDistanceToNearestPort(lat: number, lon: number): number {
    const majorPorts = [
      [1.3, 103.8],    // Singapore
      [51.9, 4.0],     // Rotterdam
      [40.7, -74.0],   // New York
      [31.2, 121.5],   // Shanghai
      [25.3, 55.3],    // Dubai
      [35.4, 139.4],   // Tokyo
      [-33.9, 18.4],   // Cape Town
      [36.8, -76.3],   // Norfolk
      [-37.8, 144.9]   // Melbourne
    ]

    let minDistance = Infinity
    for (const [portLat, portLon] of majorPorts) {
      const distance = this.calculateDistance(lat, lon, portLat, portLon)
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  private calculateDistanceToShippingRoute(lat: number, lon: number): number {
    // Major shipping lanes (simplified)
    const routes = [
      { start: [51.9, 4.0], end: [40.7, -74.0] },   // Rotterdam-NY
      { start: [1.3, 103.8], end: [31.2, 121.5] },  // Singapore-Shanghai
      { start: [25.3, 55.3], end: [1.3, 103.8] },   // Dubai-Singapore
      { start: [36.8, -76.3], end: [25.8, -80.2] }  // Norfolk-Miami
    ]

    let minDistance = Infinity
    for (const route of routes) {
      const distance = this.distanceToLine(lat, lon, route.start, route.end)
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  private estimatePopulationDensity(country: string): number {
    const densities: Record<string, number> = {
      'Singapore': 8000,
      'Germany': 240,
      'United Kingdom': 280,
      'Japan': 347,
      'South Korea': 520,
      'United States': 36,
      'Australia': 3,
      'France': 120,
      'Italy': 200
    }
    
    return densities[country] || 100 + Math.random() * 300
  }

  private estimateDistanceToMajorCity(lat: number, lon: number): number {
    const majorCities = [
      [40.7, -74.0],   // New York
      [51.5, -0.1],    // London
      [35.7, 139.7],   // Tokyo
      [1.3, 103.8],    // Singapore
      [52.5, 13.4],    // Berlin
      [-33.9, 151.2],  // Sydney
      [19.4, -99.1],   // Mexico City
      [55.8, 37.6],    // Moscow
      [28.6, 77.2],    // Delhi
      [-23.5, -46.6]   // São Paulo
    ]

    let minDistance = Infinity
    for (const [cityLat, cityLon] of majorCities) {
      const distance = this.calculateDistance(lat, lon, cityLat, cityLon)
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private distanceToLine(lat: number, lon: number, start: number[], end: number[]): number {
    const A = lat - start[0]
    const B = lon - start[1]
    const C = end[0] - start[0]
    const D = end[1] - start[1]

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) return this.calculateDistance(lat, lon, start[0], start[1])
    
    const param = dot / lenSq
    let xx, yy
    
    if (param < 0) {
      xx = start[0]
      yy = start[1]
    } else if (param > 1) {
      xx = end[0]
      yy = end[1]
    } else {
      xx = start[0] + param * C
      yy = start[1] + param * D
    }
    
    return this.calculateDistance(lat, lon, xx, yy)
  }

  /**
   * Clean up old historical data
   */
  private cleanupHistoricalData(): void {
    const cutoff = Date.now() - (this.config.fallbackDataRetention * 24 * 60 * 60 * 1000)
    
    for (const [key, cached] of this.historicalDataCache.entries()) {
      if (cached.timestamp < cutoff) {
        this.historicalDataCache.delete(key)
      }
    }
  }

  // Public interface methods

  /**
   * Get current fallback configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config }
  }

  /**
   * Update fallback configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Enable emergency mode (maximum fallback tolerance)
   */
  enableEmergencyMode(): void {
    this.config.emergencyMode = true
    this.config.minConfidenceScore = 0.1
    this.config.maxDataAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    console.log('Emergency mode enabled - using maximum fallback tolerance')
  }

  /**
   * Disable emergency mode
   */
  disableEmergencyMode(): void {
    this.config.emergencyMode = false
    this.config.minConfidenceScore = 0.3
    this.config.maxDataAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    console.log('Emergency mode disabled - restored normal fallback settings')
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats(): {
    historicalDataEntries: number
    oldestData: Date | null
    newestData: Date | null
    emergencyMode: boolean
    offlineMode: boolean
  } {
    const timestamps = Array.from(this.historicalDataCache.values()).map(cached => cached.timestamp)
    
    return {
      historicalDataEntries: this.historicalDataCache.size,
      oldestData: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestData: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
      emergencyMode: this.config.emergencyMode,
      offlineMode: this.config.offlineMode
    }
  }

  /**
   * Clear all historical data
   */
  clearHistoricalData(): void {
    this.historicalDataCache.clear()
    console.log('All historical fallback data cleared')
  }
}

// Export singleton instance
export const fallbackDataService = new FallbackDataService()
export default fallbackDataService