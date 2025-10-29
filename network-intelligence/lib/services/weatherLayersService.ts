/**
 * Weather Layers Service
 * Manages real-time weather data overlays
 *
 * Data Sources:
 * - RainViewer: Free precipitation radar (no API key needed)
 * - OpenWeather: Temperature, wind, clouds (free tier with API key)
 */

import { useMapStore } from '../stores/mapStore'

export type WeatherLayerType = 'precipitation' | 'temperature' | 'wind' | 'clouds' | 'pressure'

export interface WeatherLayerConfig {
  id: string
  name: string
  type: WeatherLayerType
  source: 'rainviewer' | 'openweather'
  icon: string
  description: string
  opacity: number
  requiresApiKey: boolean
}

/**
 * Weather layer configurations
 */
export const WEATHER_LAYERS: Record<WeatherLayerType, WeatherLayerConfig> = {
  precipitation: {
    id: 'weather-precipitation',
    name: 'Precipitation Radar',
    type: 'precipitation',
    source: 'rainviewer',
    icon: '🌧️',
    description: 'Real-time precipitation radar (5-min updates)',
    opacity: 0.7,
    requiresApiKey: false
  },
  temperature: {
    id: 'weather-temperature',
    name: 'Temperature',
    type: 'temperature',
    source: 'openweather',
    icon: '🌡️',
    description: 'Current air temperature',
    opacity: 0.6,
    requiresApiKey: true
  },
  wind: {
    id: 'weather-wind',
    name: 'Wind Speed',
    type: 'wind',
    source: 'openweather',
    icon: '💨',
    description: 'Wind speed and direction',
    opacity: 0.6,
    requiresApiKey: true
  },
  clouds: {
    id: 'weather-clouds',
    name: 'Cloud Cover',
    type: 'clouds',
    source: 'openweather',
    icon: '☁️',
    description: 'Current cloud coverage',
    opacity: 0.5,
    requiresApiKey: true
  },
  pressure: {
    id: 'weather-pressure',
    name: 'Pressure',
    type: 'pressure',
    source: 'openweather',
    icon: '🌀',
    description: 'Atmospheric pressure',
    opacity: 0.6,
    requiresApiKey: true
  }
}

/**
 * RainViewer API integration
 * Free precipitation radar with 5-minute updates
 */
class RainViewerAPI {
  private baseUrl = 'https://api.rainviewer.com/public/weather-maps.json'
  private tileUrl = 'https://tilecache.rainviewer.com'

  /**
   * Get latest radar timestamp
   */
  async getLatestTimestamp(): Promise<number | null> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) return null

      const data = await response.json()
      const radarFrames = data.radar?.past || []

      if (radarFrames.length === 0) return null

      // Get the most recent frame
      return radarFrames[radarFrames.length - 1].time
    } catch (error) {
      console.error('Failed to fetch RainViewer data:', error)
      return null
    }
  }

  /**
   * Get tile URL for a given timestamp
   * Format: https://tilecache.rainviewer.com/v2/radar/{timestamp}/256/{z}/{x}/{y}/2/1_1.png
   */
  getTileUrl(timestamp: number): string {
    return `${this.tileUrl}/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`
  }
}

/**
 * OpenWeather Map Tiles API
 * Free tier: 60 calls/minute, 1,000,000 calls/month
 */
class OpenWeatherAPI {
  private apiKey: string | null
  private baseUrl = 'https://tile.openweathermap.org/map'

  constructor() {
    // Get API key from environment (optional for MVP - will use placeholder)
    this.apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || null
  }

  /**
   * Get tile URL for a weather layer
   * Format: https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={api_key}
   */
  getTileUrl(layerType: WeatherLayerType): string | null {
    if (!this.apiKey) {
      console.warn(`OpenWeather API key not configured for ${layerType}`)
      return null
    }

    // Map our layer types to OpenWeather layer names
    const layerMap: Record<string, string> = {
      precipitation: 'precipitation_new',
      temperature: 'temp_new',
      wind: 'wind_new',
      clouds: 'clouds_new',
      pressure: 'pressure_new'
    }

    const owmLayer = layerMap[layerType]
    if (!owmLayer) return null

    return `${this.baseUrl}/${owmLayer}/{z}/{x}/{y}.png?appid=${this.apiKey}`
  }

  hasApiKey(): boolean {
    return this.apiKey !== null
  }
}

/**
 * Weather Layers Manager
 * Handles adding/removing weather layers on the map
 */
export class WeatherLayersService {
  private rainViewer = new RainViewerAPI()
  private openWeather = new OpenWeatherAPI()
  private activeWeatherLayers = new Set<WeatherLayerType>()

  /**
   * Show a weather layer on the map
   */
  async showWeatherLayer(
    layerType: WeatherLayerType,
    mapInstance: mapboxgl.Map
  ): Promise<{ success: boolean; message: string }> {
    console.log(`🌤️ showWeatherLayer called with layerType: "${layerType}"`)
    const config = WEATHER_LAYERS[layerType]

    if (!config) {
      console.error(`❌ Unknown weather layer: ${layerType}`)
      return {
        success: false,
        message: `Unknown weather layer: ${layerType}`
      }
    }

    console.log(`✅ Config found: ${config.name} (id: ${config.id})`)

    // Check if API key is required but not available
    if (config.requiresApiKey && !this.openWeather.hasApiKey()) {
      console.warn(`⚠️ ${config.name} requires API key but none found`)
      return {
        success: false,
        message: `${config.name} requires OpenWeather API key. Please configure NEXT_PUBLIC_OPENWEATHER_API_KEY.`
      }
    }

    try {
      // Remove existing weather layer if present
      if (this.activeWeatherLayers.has(layerType)) {
        await this.hideWeatherLayer(layerType, mapInstance)
      }

      let tileUrl: string | null = null

      // Get appropriate tile URL based on source
      if (config.source === 'rainviewer') {
        const timestamp = await this.rainViewer.getLatestTimestamp()
        if (!timestamp) {
          return {
            success: false,
            message: 'Failed to fetch precipitation data. Please try again.'
          }
        }
        tileUrl = this.rainViewer.getTileUrl(timestamp)
      } else if (config.source === 'openweather') {
        tileUrl = this.openWeather.getTileUrl(layerType)
      }

      if (!tileUrl) {
        return {
          success: false,
          message: `Unable to generate tile URL for ${config.name}`
        }
      }

      // Add source if it doesn't exist
      const sourceId = `weather-${layerType}-source`
      if (!mapInstance.getSource(sourceId)) {
        mapInstance.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution: config.source === 'rainviewer'
            ? '© RainViewer'
            : '© OpenWeather'
        })
      }

      // Add layer if it doesn't exist
      const layerId = config.id
      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': config.opacity,
            'raster-fade-duration': 300
          }
        })
      } else {
        // Just make it visible
        mapInstance.setLayoutProperty(layerId, 'visibility', 'visible')
      }

      this.activeWeatherLayers.add(layerType)

      const successMessage = `${config.name} layer enabled.`
      console.log(`✅ Returning success message: "${successMessage}"`)

      return {
        success: true,
        message: successMessage
      }
    } catch (error) {
      console.error(`Error showing weather layer ${layerType}:`, error)
      return {
        success: false,
        message: `Failed to load ${config.name}. Please try again.`
      }
    }
  }

  /**
   * Hide a weather layer from the map
   */
  async hideWeatherLayer(
    layerType: WeatherLayerType,
    mapInstance: mapboxgl.Map
  ): Promise<{ success: boolean; message: string }> {
    const config = WEATHER_LAYERS[layerType]

    if (!config) {
      return {
        success: false,
        message: `Unknown weather layer: ${layerType}`
      }
    }

    try {
      const layerId = config.id

      if (mapInstance.getLayer(layerId)) {
        mapInstance.setLayoutProperty(layerId, 'visibility', 'none')
      }

      this.activeWeatherLayers.delete(layerType)

      return {
        success: true,
        message: `${config.name} layer disabled.`
      }
    } catch (error) {
      console.error(`Error hiding weather layer ${layerType}:`, error)
      return {
        success: false,
        message: `Failed to hide ${config.name}.`
      }
    }
  }

  /**
   * Toggle a weather layer
   */
  async toggleWeatherLayer(
    layerType: WeatherLayerType,
    mapInstance: mapboxgl.Map
  ): Promise<{ success: boolean; message: string }> {
    if (this.activeWeatherLayers.has(layerType)) {
      return this.hideWeatherLayer(layerType, mapInstance)
    } else {
      return this.showWeatherLayer(layerType, mapInstance)
    }
  }

  /**
   * Get list of active weather layers
   */
  getActiveWeatherLayers(): WeatherLayerType[] {
    return Array.from(this.activeWeatherLayers)
  }

  /**
   * Clear all weather layers
   */
  async clearAllWeatherLayers(mapInstance: mapboxgl.Map): Promise<void> {
    for (const layerType of this.activeWeatherLayers) {
      await this.hideWeatherLayer(layerType, mapInstance)
    }
  }
}

// Singleton instance
let serviceInstance: WeatherLayersService | null = null

export function getWeatherLayersService(): WeatherLayersService {
  if (!serviceInstance) {
    serviceInstance = new WeatherLayersService()
  }
  return serviceInstance
}
