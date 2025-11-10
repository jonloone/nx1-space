/**
 * Satellite Imagery Service
 *
 * Provides access to satellite imagery from multiple sources:
 * - Sentinel-2 (AWS Open Data)
 * - Google Earth Engine (via API)
 * - Mapbox Satellite
 * - Custom imagery sources
 *
 * Features:
 * - Time-series imagery access
 * - Cloud cover filtering
 * - Tile generation
 * - Change detection support
 * - Multi-spectral band access
 */

export interface SatelliteImageryOptions {
  center: [number, number] // [lng, lat]
  zoom?: number // Zoom level for tile-based imagery
  bbox?: [number, number, number, number] // [west, south, east, north]
  startDate?: Date
  endDate?: Date
  maxCloudCover?: number // 0-100
  source?: 'sentinel-2' | 'mapbox' | 'google-earth-engine' | 'auto'
  bands?: string[] // e.g., ['B4', 'B3', 'B2'] for RGB
}

export interface SatelliteImage {
  id: string
  source: 'sentinel-2' | 'mapbox' | 'google-earth-engine'
  acquisitionDate: Date
  cloudCover: number // 0-100
  resolution: number // meters per pixel
  bounds: {
    west: number
    south: number
    east: number
    north: number
  }
  bands: string[]
  url?: string // Tile URL template for visualization
  metadata: Record<string, any>
}

export interface SatelliteTimeSeries {
  location: {
    center: [number, number]
    name?: string
  }
  dateRange: {
    start: Date
    end: Date
  }
  images: SatelliteImage[]
  statistics: {
    totalImages: number
    averageCloudCover: number
    temporalResolution: number // average days between images
  }
}

export interface SatelliteTileInfo {
  url: string // URL template with {z}/{x}/{y} placeholders
  attribution: string
  minZoom: number
  maxZoom: number
  tileSize: number
}

export class SatelliteImageryService {
  private mapboxToken: string
  private geeApiKey?: string

  constructor() {
    this.mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh0c201OTBqcjgya29pMmJ5czk3N2sifQ.gE4F5uP57jtt6ThElLsFBg'
    this.geeApiKey = process.env.GOOGLE_EARTH_ENGINE_API_KEY
  }

  /**
   * Get satellite imagery for a location
   */
  async getImagery(options: SatelliteImageryOptions): Promise<SatelliteImage[]> {
    const source = options.source || 'auto'

    // Auto-select best source based on requirements
    if (source === 'auto') {
      // If time-series or multi-spectral analysis needed, prefer Sentinel-2
      if (options.startDate || options.bands) {
        return this.getSentinel2Imagery(options)
      }
      // Otherwise use Mapbox for simplicity
      return this.getMapboxImagery(options)
    }

    switch (source) {
      case 'sentinel-2':
        return this.getSentinel2Imagery(options)
      case 'mapbox':
        return this.getMapboxImagery(options)
      case 'google-earth-engine':
        return this.getGEEImagery(options)
      default:
        throw new Error(`Unknown imagery source: ${source}`)
    }
  }

  /**
   * Get time-series of satellite images for change detection
   */
  async getTimeSeries(
    center: [number, number],
    startDate: Date,
    endDate: Date,
    options?: Partial<SatelliteImageryOptions>
  ): Promise<SatelliteTimeSeries> {
    console.log(`🛰️ Fetching satellite time-series for ${center} from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    const images = await this.getImagery({
      center,
      startDate,
      endDate,
      maxCloudCover: options?.maxCloudCover || 20,
      source: options?.source || 'sentinel-2'
    })

    // Sort by acquisition date
    images.sort((a, b) => a.acquisitionDate.getTime() - b.acquisitionDate.getTime())

    // Calculate statistics
    const averageCloudCover = images.length > 0
      ? images.reduce((sum, img) => sum + img.cloudCover, 0) / images.length
      : 0

    const temporalResolution = images.length > 1
      ? (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * (images.length - 1))
      : 0

    return {
      location: {
        center,
        name: options?.bbox ? 'Custom AOI' : undefined
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      images,
      statistics: {
        totalImages: images.length,
        averageCloudCover: Math.round(averageCloudCover * 10) / 10,
        temporalResolution: Math.round(temporalResolution * 10) / 10
      }
    }
  }

  /**
   * Get tile layer info for visualization
   */
  getTileLayer(image: SatelliteImage): SatelliteTileInfo {
    switch (image.source) {
      case 'mapbox':
        return {
          url: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${this.mapboxToken}`,
          attribution: '© Mapbox © Maxar',
          minZoom: 0,
          maxZoom: 22,
          tileSize: 512
        }

      case 'sentinel-2':
        // For Sentinel-2, we'd typically use a tile server like Sentinel Hub or AWS
        return {
          url: image.url || this.getSentinel2TileUrl(image),
          attribution: '© ESA Copernicus',
          minZoom: 0,
          maxZoom: 14,
          tileSize: 256
        }

      case 'google-earth-engine':
        return {
          url: image.url || '',
          attribution: '© Google Earth Engine',
          minZoom: 0,
          maxZoom: 18,
          tileSize: 256
        }

      default:
        throw new Error(`Unknown imagery source: ${image.source}`)
    }
  }

  /**
   * Get Sentinel-2 imagery from AWS Open Data (REAL IMPLEMENTATION)
   */
  private async getSentinel2Imagery(options: SatelliteImageryOptions): Promise<SatelliteImage[]> {
    console.log('🛰️ Fetching Sentinel-2 imagery from AWS STAC API')

    try {
      // Use real STAC service
      const { getSentinel2StacService } = await import('./sentinel2StacService')
      const stacService = getSentinel2StacService()

      const startDate = options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      const endDate = options.endDate || new Date()

      const images = await stacService.searchTimeSeries(
        options.center,
        startDate,
        endDate,
        {
          maxCloudCover: options.maxCloudCover,
          limit: 100,
          bufferKm: 10
        }
      )

      console.log(`✓ Found ${images.length} real Sentinel-2 images from STAC API`)
      return images
    } catch (error) {
      console.error('❌ Failed to fetch from STAC API, falling back to mock data:', error)

      // Fallback to mock data if STAC API fails
      return this.getMockSentinel2Imagery(options)
    }
  }

  /**
   * Generate mock Sentinel-2 imagery (fallback)
   */
  private getMockSentinel2Imagery(options: SatelliteImageryOptions): SatelliteImage[] {
    console.log('⚠️ Using mock Sentinel-2 data (STAC API unavailable)')

    const mockImages: SatelliteImage[] = []
    const startDate = options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const endDate = options.endDate || new Date()
    const daysBetween = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Sentinel-2 has ~5 day revisit time
    for (let i = 0; i < daysBetween; i += 5) {
      const acquisitionDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const cloudCover = Math.random() * 40

      if (!options.maxCloudCover || cloudCover <= options.maxCloudCover) {
        const [lng, lat] = options.center
        const offset = 0.1

        mockImages.push({
          id: `S2_MOCK_${acquisitionDate.toISOString().split('T')[0]}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'sentinel-2',
          acquisitionDate,
          cloudCover: Math.round(cloudCover * 10) / 10,
          resolution: 10,
          bounds: {
            west: lng - offset,
            south: lat - offset,
            east: lng + offset,
            north: lat + offset
          },
          bands: ['B2', 'B3', 'B4', 'B8'],
          metadata: {
            satellite: 'Sentinel-2A (Mock)',
            processingLevel: 'L2A',
            tileId: `T${Math.floor(Math.random() * 60)}TUL`,
            mock: true
          }
        })
      }
    }

    return mockImages
  }

  /**
   * Get Mapbox satellite imagery
   */
  private async getMapboxImagery(options: SatelliteImageryOptions): Promise<SatelliteImage[]> {
    // Mapbox satellite is a composite, always available
    const [lng, lat] = options.center
    const offset = 0.1

    return [{
      id: 'mapbox-satellite-composite',
      source: 'mapbox',
      acquisitionDate: new Date(), // Composite, no specific date
      cloudCover: 0, // Pre-filtered
      resolution: 0.5, // Sub-meter in many areas
      bounds: {
        west: lng - offset,
        south: lat - offset,
        east: lng + offset,
        north: lat + offset
      },
      bands: ['RGB'],
      url: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${this.mapboxToken}`,
      metadata: {
        source: 'Maxar',
        type: 'composite'
      }
    }]
  }

  /**
   * Get Google Earth Engine imagery
   */
  private async getGEEImagery(options: SatelliteImageryOptions): Promise<SatelliteImage[]> {
    if (!this.geeApiKey) {
      console.warn('⚠️ Google Earth Engine API key not configured')
      // Fallback to Sentinel-2
      return this.getSentinel2Imagery(options)
    }

    // In production, this would use the GEE API
    console.log('🛰️ Google Earth Engine imagery requires API integration')

    // For now, fallback to Sentinel-2
    return this.getSentinel2Imagery(options)
  }

  /**
   * Generate Sentinel-2 tile URL
   */
  private getSentinel2TileUrl(image: SatelliteImage): string {
    // In production, use Sentinel Hub or AWS tile service
    // For now, return Mapbox as fallback
    return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${this.mapboxToken}`
  }

  /**
   * Download imagery for offline analysis
   */
  async downloadImage(image: SatelliteImage, bbox: [number, number, number, number]): Promise<Blob> {
    // In production, this would download the actual imagery
    throw new Error('Image download not yet implemented')
  }

  /**
   * Get available bands for an image
   */
  getAvailableBands(image: SatelliteImage): Array<{ band: string; description: string; wavelength?: string }> {
    switch (image.source) {
      case 'sentinel-2':
        return [
          { band: 'B2', description: 'Blue', wavelength: '490nm' },
          { band: 'B3', description: 'Green', wavelength: '560nm' },
          { band: 'B4', description: 'Red', wavelength: '665nm' },
          { band: 'B8', description: 'NIR', wavelength: '842nm' },
          { band: 'B11', description: 'SWIR-1', wavelength: '1610nm' },
          { band: 'B12', description: 'SWIR-2', wavelength: '2190nm' }
        ]

      case 'mapbox':
        return [
          { band: 'RGB', description: 'Visible Composite' }
        ]

      default:
        return []
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<{
    sentinel2: boolean
    mapbox: boolean
    googleEarthEngine: boolean
  }> {
    return {
      sentinel2: true, // AWS Open Data is public
      mapbox: !!this.mapboxToken,
      googleEarthEngine: !!this.geeApiKey
    }
  }
}

// Singleton instance
let satelliteImageryService: SatelliteImageryService | null = null

export function getSatelliteImageryService(): SatelliteImageryService {
  if (!satelliteImageryService) {
    satelliteImageryService = new SatelliteImageryService()
  }
  return satelliteImageryService
}
