/**
 * TLE Data Service
 * Fetches Two-Line Element (TLE) data from CelesTrak API
 *
 * Data source: https://celestrak.org/NORAD/elements/
 * Format: JSON (GP/OMM format)
 */

export interface TLE {
  /** Satellite name */
  name: string
  /** NORAD catalog number */
  catalogNumber: string
  /** First line of TLE */
  line1: string
  /** Second line of TLE */
  line2: string
  /** TLE epoch (reference time) */
  epoch: Date
  /** Mean motion (revs per day) */
  meanMotion: number
  /** Eccentricity */
  eccentricity: number
  /** Inclination (degrees) */
  inclination: number
  /** Right ascension of ascending node (degrees) */
  rightAscension: number
  /** Argument of perigee (degrees) */
  argumentOfPerigee: number
  /** Mean anomaly (degrees) */
  meanAnomaly: number
}

export interface TLEQueryOptions {
  /** Query type */
  queryType: 'CATNR' | 'NAME' | 'GROUP'
  /** Query value */
  value: string
  /** Force refresh (skip cache) */
  forceRefresh?: boolean
}

interface CelesTrakGPRecord {
  OBJECT_NAME: string
  OBJECT_ID: string
  EPOCH: string
  MEAN_MOTION: number
  ECCENTRICITY: number
  INCLINATION: number
  RA_OF_ASC_NODE: number
  ARG_OF_PERICENTER: number
  MEAN_ANOMALY: number
  EPHEMERIS_TYPE: number
  CLASSIFICATION_TYPE: string
  NORAD_CAT_ID: number
  ELEMENT_SET_NO: number
  REV_AT_EPOCH: number
  BSTAR: number
  MEAN_MOTION_DOT: number
  MEAN_MOTION_DDOT: number
  TLE_LINE1: string
  TLE_LINE2: string
}

interface TLECacheEntry {
  data: TLE[]
  timestamp: Date
  ttl: number // milliseconds
}

export class TLEDataService {
  private baseUrl = 'https://celestrak.org/NORAD/elements/gp.php'
  private cache: Map<string, TLECacheEntry> = new Map()
  private defaultTTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  /**
   * Fetch TLE data by catalog number
   */
  async getTLEByCatalogNumber(catalogNumber: string, forceRefresh = false): Promise<TLE | null> {
    const results = await this.queryTLE({
      queryType: 'CATNR',
      value: catalogNumber,
      forceRefresh
    })

    return results.length > 0 ? results[0] : null
  }

  /**
   * Fetch TLE data by satellite name (partial match)
   */
  async getTLEByName(name: string, forceRefresh = false): Promise<TLE[]> {
    return this.queryTLE({
      queryType: 'NAME',
      value: name,
      forceRefresh
    })
  }

  /**
   * Fetch TLE data by CelesTrak group
   *
   * Common groups:
   * - 'active' - All active satellites
   * - 'gps-ops' - GPS operational satellites
   * - 'weather' - Weather satellites
   * - 'noaa' - NOAA satellites
   * - 'goes' - GOES satellites
   * - 'stations' - Space stations
   * - 'starlink' - Starlink constellation
   */
  async getTLEByGroup(group: string, forceRefresh = false): Promise<TLE[]> {
    return this.queryTLE({
      queryType: 'GROUP',
      value: group,
      forceRefresh
    })
  }

  /**
   * Generic TLE query method
   */
  private async queryTLE(options: TLEQueryOptions): Promise<TLE[]> {
    const { queryType, value, forceRefresh = false } = options
    const cacheKey = `${queryType}:${value}`

    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
        console.log(`✓ TLE cache hit: ${cacheKey}`)
        return cached.data
      }
    }

    try {
      console.log(`🛰️ Fetching TLE data: ${queryType}=${value}`)

      const url = `${this.baseUrl}?${queryType}=${encodeURIComponent(value)}&FORMAT=JSON`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`CelesTrak API error: ${response.status} ${response.statusText}`)
      }

      const data: CelesTrakGPRecord[] = await response.json()

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from CelesTrak API')
      }

      // Transform to our TLE format
      const tles = data.map(record => this.transformCelesTrakRecord(record))

      // Cache the results
      this.cache.set(cacheKey, {
        data: tles,
        timestamp: new Date(),
        ttl: this.defaultTTL
      })

      console.log(`✓ Fetched ${tles.length} TLE records for ${cacheKey}`)
      return tles

    } catch (error) {
      console.error(`❌ Failed to fetch TLE data for ${cacheKey}:`, error)

      // Return cached data if available (even if expired)
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.warn(`⚠️ Returning stale cache for ${cacheKey}`)
        return cached.data
      }

      throw error
    }
  }

  /**
   * Transform CelesTrak GP record to our TLE format
   */
  private transformCelesTrakRecord(record: CelesTrakGPRecord): TLE {
    return {
      name: record.OBJECT_NAME.trim(),
      catalogNumber: record.NORAD_CAT_ID.toString(),
      line1: record.TLE_LINE1,
      line2: record.TLE_LINE2,
      epoch: new Date(record.EPOCH),
      meanMotion: record.MEAN_MOTION,
      eccentricity: record.ECCENTRICITY,
      inclination: record.INCLINATION,
      rightAscension: record.RA_OF_ASC_NODE,
      argumentOfPerigee: record.ARG_OF_PERICENTER,
      meanAnomaly: record.MEAN_ANOMALY
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ TLE cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Prefetch commonly used satellite groups
   */
  async prefetchCommonGroups(): Promise<void> {
    const commonGroups = [
      'weather',    // Weather satellites
      'noaa',       // NOAA satellites
      'stations',   // Space stations (ISS, etc.)
      'gps-ops'     // GPS satellites
    ]

    console.log('🚀 Prefetching common TLE groups...')

    await Promise.allSettled(
      commonGroups.map(group => this.getTLEByGroup(group))
    )

    console.log('✓ Prefetch complete')
  }
}

// Singleton instance
let tleDataService: TLEDataService | null = null

export function getTLEDataService(): TLEDataService {
  if (!tleDataService) {
    tleDataService = new TLEDataService()
  }
  return tleDataService
}

// Preset satellite configurations for quick access
export const PRESET_SATELLITES = {
  // Earth observation (ties to Phase 1 satellite imagery)
  SENTINEL_2A: {
    name: 'SENTINEL-2A',
    catalogNumber: '40697',
    description: 'ESA Earth observation satellite (10m resolution)'
  },
  SENTINEL_2B: {
    name: 'SENTINEL-2B',
    catalogNumber: '42063',
    description: 'ESA Earth observation satellite (10m resolution)'
  },
  LANDSAT_8: {
    name: 'LANDSAT 8',
    catalogNumber: '39084',
    description: 'NASA/USGS Earth observation satellite (30m resolution)'
  },
  LANDSAT_9: {
    name: 'LANDSAT 9',
    catalogNumber: '49260',
    description: 'NASA/USGS Earth observation satellite (30m resolution)'
  },

  // High visibility satellites
  ISS: {
    name: 'ISS (ZARYA)',
    catalogNumber: '25544',
    description: 'International Space Station'
  },
  HUBBLE: {
    name: 'HST',
    catalogNumber: '20580',
    description: 'Hubble Space Telescope'
  },

  // Weather
  NOAA_19: {
    name: 'NOAA 19',
    catalogNumber: '33591',
    description: 'NOAA weather satellite'
  },
  NOAA_20: {
    name: 'NOAA 20',
    catalogNumber: '43013',
    description: 'NOAA weather satellite (JPSS-1)'
  },

  // Communication
  VIASAT_3: {
    name: 'VIASAT-3 AMERICAS',
    catalogNumber: '56519',
    description: 'ViaSat-3 Americas communications satellite'
  }
} as const

export type PresetSatelliteKey = keyof typeof PRESET_SATELLITES
