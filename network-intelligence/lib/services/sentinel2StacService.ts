/**
 * Sentinel-2 STAC Service
 *
 * Connects to AWS Element84 STAC API for real Sentinel-2 imagery
 * STAC = SpatioTemporal Asset Catalog
 *
 * Free API, no authentication required
 * API Docs: https://earth-search.aws.element84.com/v1/docs
 */

import type { SatelliteImage } from './satelliteImageryService'

interface StacSearchParams {
  bbox: [number, number, number, number] // [west, south, east, north]
  datetime: string // ISO 8601 range: "2024-01-01T00:00:00Z/2024-12-31T23:59:59Z"
  collections: string[]
  limit?: number
  query?: {
    'eo:cloud_cover'?: { lt?: number; gt?: number }
    [key: string]: any
  }
}

interface StacFeature {
  id: string
  type: 'Feature'
  bbox: [number, number, number, number]
  geometry: any
  properties: {
    datetime: string
    'eo:cloud_cover': number
    'sentinel:product_id': string
    'sentinel:utm_zone': number
    'sentinel:latitude_band': string
    'sentinel:grid_square': string
    'proj:epsg': number
    constellation: string
    platform: string
    instruments: string[]
    'gsd': number // Ground sample distance (resolution)
  }
  assets: {
    [key: string]: {
      href: string
      type: string
      title?: string
      'eo:bands'?: Array<{
        name: string
        common_name?: string
      }>
    }
  }
  links: Array<{
    rel: string
    href: string
    type?: string
  }>
}

interface StacSearchResponse {
  type: 'FeatureCollection'
  features: StacFeature[]
  links: Array<{
    rel: string
    href: string
    type?: string
  }>
  context?: {
    matched: number
    returned: number
    limit: number
  }
}

export class Sentinel2StacService {
  private stacApiUrl = 'https://earth-search.aws.element84.com/v1'

  /**
   * Search for Sentinel-2 imagery
   */
  async search(params: StacSearchParams): Promise<StacSearchResponse> {
    console.log(`🛰️ Searching Sentinel-2 STAC API:`, {
      bbox: params.bbox,
      datetime: params.datetime,
      cloudCover: params.query?.['eo:cloud_cover']
    })

    try {
      const response = await fetch(`${this.stacApiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`STAC API error: ${response.status} ${response.statusText}`)
      }

      const data: StacSearchResponse = await response.json()
      console.log(`✓ Found ${data.features.length} Sentinel-2 scenes (matched: ${data.context?.matched || 0})`)

      return data
    } catch (error) {
      console.error('❌ Failed to search STAC API:', error)
      throw error
    }
  }

  /**
   * Search for time-series imagery
   */
  async searchTimeSeries(
    center: [number, number], // [lng, lat]
    startDate: Date,
    endDate: Date,
    options: {
      maxCloudCover?: number
      limit?: number
      bufferKm?: number
    } = {}
  ): Promise<SatelliteImage[]> {
    const {
      maxCloudCover = 20,
      limit = 100,
      bufferKm = 10
    } = options

    // Create bounding box around center point (approximate)
    const kmToDegrees = 1 / 111 // rough conversion at equator
    const buffer = bufferKm * kmToDegrees
    const bbox: [number, number, number, number] = [
      center[0] - buffer, // west
      center[1] - buffer, // south
      center[0] + buffer, // east
      center[1] + buffer  // north
    ]

    // Format datetime range
    const datetime = `${startDate.toISOString()}/${endDate.toISOString()}`

    const searchParams: StacSearchParams = {
      bbox,
      datetime,
      collections: ['sentinel-2-l2a'], // Level 2A (atmospherically corrected)
      limit,
      query: {
        'eo:cloud_cover': {
          lt: maxCloudCover
        }
      }
    }

    const response = await this.search(searchParams)
    return this.transformStacFeaturesToSatelliteImages(response.features)
  }

  /**
   * Transform STAC features to SatelliteImage format
   */
  private transformStacFeaturesToSatelliteImages(features: StacFeature[]): SatelliteImage[] {
    return features.map(feature => {
      // Get tile URL for RGB visualization
      const tileUrl = this.getTileUrl(feature)

      return {
        id: feature.id,
        source: 'sentinel-2' as const,
        acquisitionDate: new Date(feature.properties.datetime),
        cloudCover: feature.properties['eo:cloud_cover'] || 0,
        resolution: feature.properties.gsd || 10, // 10m for RGB bands
        bounds: {
          west: feature.bbox[0],
          south: feature.bbox[1],
          east: feature.bbox[2],
          north: feature.bbox[3]
        },
        bands: this.extractBands(feature),
        url: tileUrl,
        metadata: {
          productId: feature.properties['sentinel:product_id'],
          utmZone: feature.properties['sentinel:utm_zone'],
          latitudeBand: feature.properties['sentinel:latitude_band'],
          gridSquare: feature.properties['sentinel:grid_square'],
          epsg: feature.properties['proj:epsg'],
          platform: feature.properties.platform,
          constellation: feature.properties.constellation,
          stacFeature: feature // Keep full STAC feature for advanced use
        }
      }
    })
  }

  /**
   * Extract available bands from STAC feature
   */
  private extractBands(feature: StacFeature): string[] {
    const bands: string[] = []

    // Check assets for band information
    Object.entries(feature.assets).forEach(([key, asset]) => {
      if (asset['eo:bands']) {
        asset['eo:bands'].forEach(band => {
          if (band.common_name) {
            bands.push(band.common_name)
          } else if (band.name) {
            bands.push(band.name)
          }
        })
      }
    })

    // If no bands found, return common Sentinel-2 bands
    return bands.length > 0 ? [...new Set(bands)] : ['B2', 'B3', 'B4', 'B8'] // Blue, Green, Red, NIR
  }

  /**
   * Get tile URL for visualization
   *
   * Options:
   * 1. Sentinel Hub (requires account)
   * 2. Titiler (free COG tile server)
   * 3. Direct S3 access (for full resolution)
   */
  private getTileUrl(feature: StacFeature): string {
    // Option 1: Use Titiler for free tile serving
    // Titiler can serve Cloud-Optimized GeoTIFFs (COG) as tiles
    const visualAsset = feature.assets.visual || feature.assets.thumbnail

    if (visualAsset) {
      // Use titiler.xyz (free service)
      const cogUrl = encodeURIComponent(visualAsset.href)
      return `https://titiler.xyz/cog/tiles/{z}/{x}/{y}?url=${cogUrl}`
    }

    // Option 2: Construct Sentinel Hub URL (requires instance ID)
    // For now, return placeholder that will be replaced by mapbox satellite
    return ''
  }

  /**
   * Get thumbnail URL for timeline preview
   */
  getThumbnailUrl(image: SatelliteImage, size: number = 256): string {
    const feature = image.metadata.stacFeature as StacFeature

    // Use thumbnail asset if available
    if (feature?.assets?.thumbnail) {
      return feature.assets.thumbnail.href
    }

    // Use visual asset with titiler
    const visualAsset = feature?.assets?.visual
    if (visualAsset) {
      const cogUrl = encodeURIComponent(visualAsset.href)
      return `https://titiler.xyz/cog/preview.png?url=${cogUrl}&max_size=${size}`
    }

    // Fallback: generate static mapbox snapshot
    const { west, south, east, north } = image.bounds
    const centerLng = (west + east) / 2
    const centerLat = (south + north) / 2
    const zoom = this.calculateZoomLevel(image.bounds)

    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${centerLng},${centerLat},${zoom}/${size}x${size}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
  }

  /**
   * Calculate appropriate zoom level for bounds
   */
  private calculateZoomLevel(bounds: { west: number; south: number; east: number; north: number }): number {
    const latDiff = bounds.north - bounds.south
    const lngDiff = bounds.east - bounds.west
    const maxDiff = Math.max(latDiff, lngDiff)

    // Rough zoom calculation
    if (maxDiff > 10) return 6
    if (maxDiff > 5) return 7
    if (maxDiff > 2) return 8
    if (maxDiff > 1) return 9
    if (maxDiff > 0.5) return 10
    if (maxDiff > 0.25) return 11
    return 12
  }

  /**
   * Get full-resolution download URL
   */
  getDownloadUrl(image: SatelliteImage, band: string = 'visual'): string | null {
    const feature = image.metadata.stacFeature as StacFeature

    if (!feature) return null

    // Return asset URL for direct download
    const asset = feature.assets[band] || feature.assets.visual
    return asset?.href || null
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.stacApiUrl}/conformance`)
      return response.ok
    } catch (error) {
      console.error('STAC API health check failed:', error)
      return false
    }
  }
}

// Singleton instance
let sentinel2StacService: Sentinel2StacService | null = null

export function getSentinel2StacService(): Sentinel2StacService {
  if (!sentinel2StacService) {
    sentinel2StacService = new Sentinel2StacService()
  }
  return sentinel2StacService
}
