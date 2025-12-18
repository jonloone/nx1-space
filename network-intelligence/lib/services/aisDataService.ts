/**
 * AIS Data Service
 *
 * Service for loading, parsing, and managing AIS data from Kaggle CSV files.
 * Handles the Kattegat Strait dataset structure and provides indexed access
 * to vessel positions and tracks.
 *
 * Data source: https://www.kaggle.com/datasets/eminserkanerdonmez/ais-dataset
 */

import {
  AISRecord,
  VesselMetadata,
  VesselTrack,
  TrackPoint,
  NavigationStatus,
  VesselType,
  DeviceClass,
  KATTEGAT_BOUNDS
} from '@/lib/types/ais-anomaly'

// ============================================================================
// CSV Parsing Types
// ============================================================================

/**
 * Raw CSV row from Kaggle dataset
 */
interface KaggleCSVRow {
  // Static fields
  'IMO'?: string
  'MMSI': string
  'Call Sign'?: string
  'Ship name'?: string
  'Ship type'?: string
  'Device class'?: string
  'Ship width'?: string
  'Ship length'?: string
  'Ship draft'?: string
  'GPS device type'?: string
  'Length from GPS to bow (A)'?: string
  'Length from GPS to stern (B)'?: string
  'Length from GPS to starboard (C)'?: string
  'Length from GPS to port (D)'?: string

  // Dynamic fields
  'Timestamp': string
  'Latitude': string
  'Longitude': string
  'Navigational status'?: string
  'Rate of Turn (ROT)'?: string
  'Speed Over Ground (SOG)': string
  'Course Over Ground (COG)': string
  'Heading': string
  'Cargo type'?: string
  'Port of destination'?: string
  'Estimated Time of Arrival (ETA)'?: string
  'Data source type'?: string
}

// ============================================================================
// Parsing Utilities
// ============================================================================

/**
 * Parse navigation status from string
 */
function parseNavStatus(status?: string): NavigationStatus {
  if (!status) return 'undefined'

  const statusLower = status.toLowerCase().trim()

  const statusMap: Record<string, NavigationStatus> = {
    'under way using engine': 'under_way_using_engine',
    'at anchor': 'at_anchor',
    'not under command': 'not_under_command',
    'restricted manoeuvrability': 'restricted_manoeuvrability',
    'constrained by draught': 'constrained_by_draught',
    'moored': 'moored',
    'aground': 'aground',
    'engaged in fishing': 'engaged_in_fishing',
    'under way sailing': 'under_way_sailing',
    'fishing': 'engaged_in_fishing',
    'anchored': 'at_anchor'
  }

  return statusMap[statusLower] || 'undefined'
}

/**
 * Parse vessel type from string
 */
function parseVesselType(type?: string): VesselType {
  if (!type) return 'unknown'

  const typeLower = type.toLowerCase().trim()

  if (typeLower.includes('cargo')) return 'cargo'
  if (typeLower.includes('tanker')) return 'tanker'
  if (typeLower.includes('passenger')) return 'passenger'
  if (typeLower.includes('fishing')) return 'fishing'
  if (typeLower.includes('tug')) return 'tug'
  if (typeLower.includes('pilot')) return 'pilot'
  if (typeLower.includes('pleasure') || typeLower.includes('yacht')) return 'pleasure'
  if (typeLower.includes('high speed') || typeLower.includes('hsc')) return 'high_speed_craft'
  if (typeLower.includes('military') || typeLower.includes('naval')) return 'military'
  if (typeLower.includes('law enforcement')) return 'law_enforcement'
  if (typeLower.includes('medical')) return 'medical'
  if (typeLower.includes('sar') || typeLower.includes('search and rescue')) return 'sar'

  return 'other'
}

/**
 * Parse timestamp from various formats
 */
function parseTimestamp(timestamp: string): Date {
  // Handle DD/MM/YYYY HH:MM:SS format (Kaggle dataset format)
  const ddmmyyyyMatch = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (ddmmyyyyMatch) {
    const [, day, month, year, hour, minute, second] = ddmmyyyyMatch
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
  }

  // Handle ISO format
  const isoDate = new Date(timestamp)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }

  // Fallback
  return new Date()
}

/**
 * Parse a single CSV row into AISRecord
 */
function parseCSVRow(row: KaggleCSVRow): AISRecord | null {
  try {
    const mmsi = row['MMSI']?.trim()
    if (!mmsi || mmsi.length < 9) return null

    const latitude = parseFloat(row['Latitude'])
    const longitude = parseFloat(row['Longitude'])

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) return null
    if (latitude < -90 || latitude > 90) return null
    if (longitude < -180 || longitude > 180) return null

    const sog = parseFloat(row['Speed Over Ground (SOG)']) || 0
    const cog = parseFloat(row['Course Over Ground (COG)']) || 0
    const heading = parseFloat(row['Heading']) || 0

    return {
      mmsi,
      imo: row['IMO']?.trim() || undefined,
      callSign: row['Call Sign']?.trim() || undefined,
      shipName: row['Ship name']?.trim() || undefined,
      shipType: parseVesselType(row['Ship type']),
      deviceClass: (row['Device class']?.trim()?.toUpperCase() === 'B' ? 'B' : 'A') as DeviceClass,
      length: parseFloat(row['Ship length']) || undefined,
      width: parseFloat(row['Ship width']) || undefined,
      draught: parseFloat(row['Ship draft']) || undefined,
      gpsType: row['GPS device type']?.trim() || undefined,
      lengthToBow: parseFloat(row['Length from GPS to bow (A)']) || undefined,
      lengthToStern: parseFloat(row['Length from GPS to stern (B)']) || undefined,
      lengthToStarboard: parseFloat(row['Length from GPS to starboard (C)']) || undefined,
      lengthToPort: parseFloat(row['Length from GPS to port (D)']) || undefined,
      timestamp: parseTimestamp(row['Timestamp']),
      latitude,
      longitude,
      sog,
      cog,
      heading: heading === 511 ? cog : heading, // 511 means "not available", use COG instead
      rot: parseFloat(row['Rate of Turn (ROT)']) || undefined,
      navStatus: parseNavStatus(row['Navigational status']),
      destination: row['Port of destination']?.trim() || undefined,
      eta: row['Estimated Time of Arrival (ETA)']
        ? parseTimestamp(row['Estimated Time of Arrival (ETA)'])
        : undefined,
      cargoType: row['Cargo type']?.trim() || undefined
    }
  } catch {
    return null
  }
}

// ============================================================================
// AIS Data Service Class
// ============================================================================

export class AISDataService {
  private records: AISRecord[] = []
  private vesselIndex: Map<string, AISRecord[]> = new Map()
  private vesselMetadata: Map<string, VesselMetadata> = new Map()
  private timeRange: { start: Date; end: Date } | null = null
  private isLoaded = false

  /**
   * Load AIS data from CSV string
   */
  async loadFromCSV(csvContent: string): Promise<void> {
    const lines = csvContent.split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows')
    }

    // Parse header
    const headerLine = lines[0]
    const headers = this.parseCSVLine(headerLine)

    // Parse data rows
    const records: AISRecord[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = this.parseCSVLine(line)
      if (values.length !== headers.length) continue

      // Create row object
      const row: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j]
      }

      const record = parseCSVRow(row as unknown as KaggleCSVRow)
      if (record) {
        records.push(record)
      }
    }

    this.records = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    this.buildIndices()
    this.isLoaded = true

    console.log(`Loaded ${this.records.length} AIS records from ${this.vesselIndex.size} vessels`)
  }

  /**
   * Parse a CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  /**
   * Build vessel indices for fast lookup
   */
  private buildIndices(): void {
    this.vesselIndex.clear()
    this.vesselMetadata.clear()

    let minTime: Date | null = null
    let maxTime: Date | null = null

    for (const record of this.records) {
      // Update time range
      if (!minTime || record.timestamp < minTime) minTime = record.timestamp
      if (!maxTime || record.timestamp > maxTime) maxTime = record.timestamp

      // Index by MMSI
      const existing = this.vesselIndex.get(record.mmsi) || []
      existing.push(record)
      this.vesselIndex.set(record.mmsi, existing)

      // Build vessel metadata (use first record with complete info)
      if (!this.vesselMetadata.has(record.mmsi)) {
        this.vesselMetadata.set(record.mmsi, {
          mmsi: record.mmsi,
          imo: record.imo,
          callSign: record.callSign,
          name: record.shipName,
          type: record.shipType,
          deviceClass: record.deviceClass,
          dimensions: {
            length: record.length,
            width: record.width,
            draught: record.draught
          },
          flag: this.deriveFlag(record.mmsi)
        })
      } else if (record.shipName) {
        // Update metadata if we find a name
        const meta = this.vesselMetadata.get(record.mmsi)!
        if (!meta.name) meta.name = record.shipName
        if (!meta.imo && record.imo) meta.imo = record.imo
      }
    }

    if (minTime && maxTime) {
      this.timeRange = { start: minTime, end: maxTime }
    }

    // Sort each vessel's records by timestamp
    for (const [mmsi, records] of this.vesselIndex) {
      this.vesselIndex.set(
        mmsi,
        records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      )
    }
  }

  /**
   * Derive flag country from MMSI MID (Maritime Identification Digits)
   */
  private deriveFlag(mmsi: string): string | undefined {
    if (mmsi.length < 3) return undefined

    const mid = mmsi.substring(0, 3)

    // Common MIDs in Kattegat region
    const midMap: Record<string, string> = {
      '219': 'Denmark',
      '220': 'Denmark',
      '265': 'Sweden',
      '266': 'Sweden',
      '211': 'Germany',
      '230': 'Finland',
      '231': 'Finland',
      '257': 'Norway',
      '258': 'Norway',
      '259': 'Norway',
      '244': 'Netherlands',
      '245': 'Netherlands',
      '246': 'Netherlands',
      '227': 'France',
      '235': 'United Kingdom',
      '236': 'United Kingdom',
      '338': 'United States'
    }

    return midMap[mid]
  }

  // ============================================================================
  // Data Access Methods
  // ============================================================================

  /**
   * Get all records for a vessel
   */
  getVesselRecords(mmsi: string): AISRecord[] {
    return this.vesselIndex.get(mmsi) || []
  }

  /**
   * Get vessel metadata
   */
  getVesselMetadata(mmsi: string): VesselMetadata | undefined {
    return this.vesselMetadata.get(mmsi)
  }

  /**
   * Get all vessel MMSIs
   */
  getAllVesselMMSIs(): string[] {
    return Array.from(this.vesselIndex.keys())
  }

  /**
   * Get vessel records within time range
   */
  getVesselRecordsInTimeRange(
    mmsi: string,
    start: Date,
    end: Date
  ): AISRecord[] {
    const records = this.vesselIndex.get(mmsi) || []
    return records.filter(r => r.timestamp >= start && r.timestamp <= end)
  }

  /**
   * Get all records within spatial bounds
   */
  getRecordsInBounds(
    bounds: { north: number; south: number; east: number; west: number }
  ): AISRecord[] {
    return this.records.filter(r =>
      r.latitude >= bounds.south &&
      r.latitude <= bounds.north &&
      r.longitude >= bounds.west &&
      r.longitude <= bounds.east
    )
  }

  /**
   * Get records within Kattegat Strait bounds
   */
  getKattegatRecords(): AISRecord[] {
    return this.getRecordsInBounds(KATTEGAT_BOUNDS)
  }

  /**
   * Get the time range of loaded data
   */
  getTimeRange(): { start: Date; end: Date } | null {
    return this.timeRange
  }

  /**
   * Get statistics about loaded data
   */
  getStatistics(): {
    totalRecords: number
    totalVessels: number
    timeRange: { start: Date; end: Date } | null
    vesselTypes: Record<VesselType, number>
    averageRecordsPerVessel: number
  } {
    const vesselTypes: Record<VesselType, number> = {
      cargo: 0,
      tanker: 0,
      passenger: 0,
      fishing: 0,
      tug: 0,
      pilot: 0,
      pleasure: 0,
      high_speed_craft: 0,
      military: 0,
      law_enforcement: 0,
      medical: 0,
      sar: 0,
      other: 0,
      unknown: 0
    }

    for (const meta of this.vesselMetadata.values()) {
      vesselTypes[meta.type]++
    }

    return {
      totalRecords: this.records.length,
      totalVessels: this.vesselIndex.size,
      timeRange: this.timeRange,
      vesselTypes,
      averageRecordsPerVessel:
        this.vesselIndex.size > 0
          ? Math.round(this.records.length / this.vesselIndex.size)
          : 0
    }
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded
  }

  /**
   * Get all records
   */
  getAllRecords(): AISRecord[] {
    return this.records
  }

  /**
   * Get all vessel metadata
   */
  getAllVesselMetadata(): VesselMetadata[] {
    return Array.from(this.vesselMetadata.values())
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let aisDataServiceInstance: AISDataService | null = null

export function getAISDataService(): AISDataService {
  if (!aisDataServiceInstance) {
    aisDataServiceInstance = new AISDataService()
  }
  return aisDataServiceInstance
}

/**
 * Reset the singleton (for testing)
 */
export function resetAISDataService(): void {
  aisDataServiceInstance = null
}
