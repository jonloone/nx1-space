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

interface TLECacheEntry {
  data: TLE[]
  timestamp: Date
  ttl: number // milliseconds
}

export class TLEDataService {
  private baseUrlJson = 'https://celestrak.org/NORAD/elements/gp.php'
  private baseUrlTle = 'https://celestrak.org/NORAD/elements/gp.php'
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

      // Use TLE format instead of JSON to get actual TLE lines
      const url = `${this.baseUrlTle}?${queryType}=${encodeURIComponent(value)}&FORMAT=TLE`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`CelesTrak API error: ${response.status} ${response.statusText}`)
      }

      const tleText = await response.text()

      // Parse TLE format (3-line format: name, line1, line2)
      const tles = this.parseTLEText(tleText)

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
   * Parse TLE text format (3-line format: name, line1, line2)
   */
  private parseTLEText(tleText: string): TLE[] {
    const lines = tleText.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const tles: TLE[] = []

    // Process in groups of 3 lines (name, line1, line2)
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break

      const name = lines[i]
      const line1 = lines[i + 1]
      const line2 = lines[i + 2]

      // Validate TLE lines (must start with "1 " and "2 ")
      if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
        console.warn(`⚠️ Invalid TLE format for ${name}, skipping`)
        continue
      }

      try {
        // Extract catalog number from line 1 (columns 3-7)
        const catalogNumber = line1.substring(2, 7).trim()

        // Extract orbital elements from TLE lines
        // Line 1: inclination is at columns 9-16 of line 2
        // Line 2: Mean motion at columns 53-63
        const inclination = parseFloat(line2.substring(8, 16).trim())
        const rightAscension = parseFloat(line2.substring(17, 25).trim())
        const eccentricity = parseFloat('0.' + line2.substring(26, 33).trim())
        const argumentOfPerigee = parseFloat(line2.substring(34, 42).trim())
        const meanAnomaly = parseFloat(line2.substring(43, 51).trim())
        const meanMotion = parseFloat(line2.substring(52, 63).trim())

        // Extract epoch from line 1 (columns 19-32)
        const epochYear = parseInt(line1.substring(18, 20))
        const epochDay = parseFloat(line1.substring(20, 32))

        // Convert 2-digit year to 4-digit (00-56 = 2000-2056, 57-99 = 1957-1999)
        const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear

        // Convert day of year to Date
        const epoch = new Date(fullYear, 0, 1)
        epoch.setDate(epochDay)

        tles.push({
          name: name.trim(),
          catalogNumber,
          line1,
          line2,
          epoch,
          meanMotion,
          eccentricity,
          inclination,
          rightAscension,
          argumentOfPerigee,
          meanAnomaly
        })
      } catch (error) {
        console.warn(`⚠️ Failed to parse TLE for ${name}:`, error)
        continue
      }
    }

    return tles
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
