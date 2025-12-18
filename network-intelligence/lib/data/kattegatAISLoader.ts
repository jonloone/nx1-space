/**
 * Kattegat AIS Data Loader
 *
 * Loads AIS data from Kaggle CSV or generates realistic demo data
 * for the Kattegat Strait region (Denmark/Sweden).
 *
 * Demo data includes pre-injected anomalies for testing:
 * - AIS gaps (dark vessels)
 * - Loitering vessels
 * - Ship-to-ship rendezvous
 * - Speed anomalies
 */

import {
  AISRecord,
  VesselType,
  NavigationStatus,
  KATTEGAT_BOUNDS,
  KATTEGAT_PORTS
} from '@/lib/types/ais-anomaly'
import { getAISDataService, AISDataService } from '@/lib/services/aisDataService'
import { getTrackReconstructor, VesselTrackReconstructor } from '@/lib/services/vesselTrackReconstructor'

// ============================================================================
// Demo Vessel Definitions
// ============================================================================

interface DemoVessel {
  mmsi: string
  imo?: string
  name: string
  type: VesselType
  length: number
  width: number
  flag: string
  baseSpeed: number     // Average speed in knots
  route: Array<[number, number]>  // [lon, lat] waypoints
  anomaly?: {
    type: 'AIS_GAP' | 'LOITERING' | 'RENDEZVOUS' | 'SPEED_ANOMALY'
    startTimeOffset: number   // Hours from start
    duration?: number         // Hours
    partner?: string          // MMSI for rendezvous
  }
}

// Realistic vessels for Kattegat Strait demo
const DEMO_VESSELS: DemoVessel[] = [
  // Normal cargo vessels
  {
    mmsi: '219018763',
    imo: '9301542',
    name: 'NORDIC CARRIER',
    type: 'cargo',
    length: 169,
    width: 25,
    flag: 'Denmark',
    baseSpeed: 12,
    route: [
      [10.54, 57.44],   // Frederikshavn
      [11.20, 57.20],   // Mid Kattegat
      [11.97, 57.71],   // Gothenburg approach
    ]
  },
  {
    mmsi: '265547890',
    imo: '9445678',
    name: 'GOTHENBURG EXPRESS',
    type: 'cargo',
    length: 210,
    width: 32,
    flag: 'Sweden',
    baseSpeed: 14,
    route: [
      [11.97, 57.71],   // Gothenburg
      [11.50, 57.00],   // Mid Kattegat
      [10.21, 56.16],   // Aarhus
    ]
  },
  {
    mmsi: '219023456',
    imo: '9556789',
    name: 'AARHUS TRADER',
    type: 'cargo',
    length: 145,
    width: 22,
    flag: 'Denmark',
    baseSpeed: 11,
    route: [
      [10.21, 56.16],   // Aarhus
      [10.80, 56.80],
      [11.30, 57.30],
      [10.54, 57.44],   // Frederikshavn
    ]
  },

  // Tanker with AIS GAP (suspicious)
  {
    mmsi: '265890123',
    imo: '9334567',
    name: 'BALTIC TANKER',
    type: 'tanker',
    length: 183,
    width: 27,
    flag: 'Sweden',
    baseSpeed: 10,
    route: [
      [11.97, 57.71],   // Gothenburg
      [11.50, 57.30],
      [11.00, 56.80],
      [10.50, 56.40],
    ],
    anomaly: {
      type: 'AIS_GAP',
      startTimeOffset: 4,    // Gap starts 4 hours in
      duration: 2            // 2 hour gap
    }
  },

  // Fishing vessel with LOITERING
  {
    mmsi: '219567890',
    name: 'NORDSØ FISKER',
    type: 'fishing',
    length: 35,
    width: 8,
    flag: 'Denmark',
    baseSpeed: 6,
    route: [
      [10.54, 57.44],   // Frederikshavn
      [10.80, 57.20],   // Loitering area
    ],
    anomaly: {
      type: 'LOITERING',
      startTimeOffset: 2,
      duration: 5           // 5 hours loitering
    }
  },

  // Two vessels for RENDEZVOUS
  {
    mmsi: '211345678',
    imo: '9123456',
    name: 'HAMBURG FEEDER',
    type: 'cargo',
    length: 120,
    width: 18,
    flag: 'Germany',
    baseSpeed: 10,
    route: [
      [10.00, 56.50],   // Coming from south
      [10.80, 56.90],   // Rendezvous point
      [11.20, 57.30],   // Continuing north
    ],
    anomaly: {
      type: 'RENDEZVOUS',
      startTimeOffset: 3,
      duration: 0.5,         // 30 min meeting
      partner: '244567890'
    }
  },
  {
    mmsi: '244567890',
    imo: '9234567',
    name: 'DUTCH SPIRIT',
    type: 'tanker',
    length: 140,
    width: 20,
    flag: 'Netherlands',
    baseSpeed: 9,
    route: [
      [11.50, 57.40],   // Coming from north
      [10.80, 56.90],   // Rendezvous point
      [10.20, 56.30],   // Continuing south
    ],
    anomaly: {
      type: 'RENDEZVOUS',
      startTimeOffset: 3,
      duration: 0.5,
      partner: '211345678'
    }
  },

  // Vessel with SPEED ANOMALY
  {
    mmsi: '265234567',
    imo: '9445123',
    name: 'SWIFT COURIER',
    type: 'high_speed_craft',
    length: 85,
    width: 14,
    flag: 'Sweden',
    baseSpeed: 25,
    route: [
      [11.97, 57.71],   // Gothenburg
      [11.50, 57.40],
      [11.00, 57.10],
      [10.54, 57.44],   // Frederikshavn
    ],
    anomaly: {
      type: 'SPEED_ANOMALY',
      startTimeOffset: 2
    }
  },

  // Ferry - normal operations
  {
    mmsi: '219789012',
    name: 'KATTEGAT FERRY',
    type: 'passenger',
    length: 170,
    width: 28,
    flag: 'Denmark',
    baseSpeed: 18,
    route: [
      [10.54, 57.44],   // Frederikshavn
      [11.97, 57.71],   // Gothenburg
    ]
  },

  // Tug - normal operations
  {
    mmsi: '265456789',
    name: 'SVEA TUG',
    type: 'tug',
    length: 30,
    width: 10,
    flag: 'Sweden',
    baseSpeed: 8,
    route: [
      [11.85, 57.65],
      [11.97, 57.71],
      [12.05, 57.68],
    ]
  },

  // Pleasure craft
  {
    mmsi: '219111222',
    name: 'VINDSEILER',
    type: 'pleasure',
    length: 15,
    width: 4,
    flag: 'Denmark',
    baseSpeed: 5,
    route: [
      [10.50, 57.40],
      [10.70, 57.30],
      [10.90, 57.20],
    ]
  }
]

// ============================================================================
// Demo Data Generation
// ============================================================================

/**
 * Generate realistic AIS records for demo vessels
 */
function generateDemoRecords(
  startDate: Date,
  hoursOfData: number = 24,
  updateIntervalMinutes: number = 3
): AISRecord[] {
  const records: AISRecord[] = []
  const totalMinutes = hoursOfData * 60
  const numUpdates = Math.floor(totalMinutes / updateIntervalMinutes)

  for (const vessel of DEMO_VESSELS) {
    const vesselRecords = generateVesselRecords(
      vessel,
      startDate,
      numUpdates,
      updateIntervalMinutes
    )
    records.push(...vesselRecords)
  }

  // Sort by timestamp
  return records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Generate records for a single vessel
 */
function generateVesselRecords(
  vessel: DemoVessel,
  startDate: Date,
  numUpdates: number,
  intervalMinutes: number
): AISRecord[] {
  const records: AISRecord[] = []
  const route = vessel.route

  // Calculate total route distance for timing
  let totalDistance = 0
  for (let i = 1; i < route.length; i++) {
    totalDistance += haversineDistance(
      route[i - 1][1], route[i - 1][0],
      route[i][1], route[i][0]
    )
  }

  // Time to traverse route at base speed (hours)
  const routeDurationHours = totalDistance / (vessel.baseSpeed * 1.852) // knots to km/h

  for (let i = 0; i < numUpdates; i++) {
    const timestamp = new Date(startDate.getTime() + i * intervalMinutes * 60 * 1000)
    const hoursElapsed = (i * intervalMinutes) / 60

    // Check if in anomaly period
    let inAISGap = false
    let isLoitering = false
    let isRendezvous = false
    let speedMultiplier = 1

    if (vessel.anomaly) {
      const anomalyStart = vessel.anomaly.startTimeOffset
      const anomalyEnd = anomalyStart + (vessel.anomaly.duration || 0.5)

      if (hoursElapsed >= anomalyStart && hoursElapsed <= anomalyEnd) {
        switch (vessel.anomaly.type) {
          case 'AIS_GAP':
            inAISGap = true
            break
          case 'LOITERING':
            isLoitering = true
            break
          case 'RENDEZVOUS':
            isRendezvous = true
            break
          case 'SPEED_ANOMALY':
            // Sudden speed drop
            speedMultiplier = hoursElapsed < anomalyStart + 0.1 ? 0.1 : 1
            break
        }
      }
    }

    // Skip record if in AIS gap
    if (inAISGap) {
      continue
    }

    // Calculate position along route
    let position: [number, number]
    let speed = vessel.baseSpeed * speedMultiplier
    let navStatus: NavigationStatus = 'under_way_using_engine'

    if (isLoitering) {
      // Stay near last position with small random drift
      const lastWaypoint = route[Math.min(1, route.length - 1)]
      position = [
        lastWaypoint[0] + (Math.random() - 0.5) * 0.01,
        lastWaypoint[1] + (Math.random() - 0.5) * 0.01
      ]
      speed = Math.random() * 0.5 // Very slow
      navStatus = vessel.type === 'fishing' ? 'engaged_in_fishing' : 'at_anchor'
    } else if (isRendezvous) {
      // Move toward rendezvous point (middle waypoint)
      const rendezvousPoint = route[Math.floor(route.length / 2)]
      position = [
        rendezvousPoint[0] + (Math.random() - 0.5) * 0.005,
        rendezvousPoint[1] + (Math.random() - 0.5) * 0.005
      ]
      speed = 0.5 + Math.random() * 1 // Nearly stopped
    } else {
      // Normal navigation along route
      const progress = (hoursElapsed % routeDurationHours) / routeDurationHours
      position = interpolateRoute(route, progress)
    }

    // Calculate course
    const prevPosition = records.length > 0
      ? [records[records.length - 1].longitude, records[records.length - 1].latitude] as [number, number]
      : position
    const course = calculateBearing(prevPosition[1], prevPosition[0], position[1], position[0])

    records.push({
      mmsi: vessel.mmsi,
      imo: vessel.imo,
      shipName: vessel.name,
      shipType: vessel.type,
      deviceClass: 'A',
      length: vessel.length,
      width: vessel.width,
      timestamp,
      latitude: position[1],
      longitude: position[0],
      sog: speed + (Math.random() - 0.5) * 0.5, // Small variation
      cog: course,
      heading: course + (Math.random() - 0.5) * 5, // Small variation
      navStatus
    })
  }

  return records
}

/**
 * Interpolate position along route
 */
function interpolateRoute(
  route: Array<[number, number]>,
  progress: number
): [number, number] {
  if (route.length < 2) return route[0]

  // Clamp progress
  progress = Math.max(0, Math.min(1, progress))

  // Calculate total distance
  const distances: number[] = [0]
  for (let i = 1; i < route.length; i++) {
    const d = haversineDistance(
      route[i - 1][1], route[i - 1][0],
      route[i][1], route[i][0]
    )
    distances.push(distances[i - 1] + d)
  }
  const totalDistance = distances[distances.length - 1]

  // Find segment
  const targetDistance = progress * totalDistance
  let segmentIndex = 0
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      segmentIndex = i - 1
      break
    }
  }

  // Interpolate within segment
  const segmentStart = distances[segmentIndex]
  const segmentEnd = distances[segmentIndex + 1] || segmentStart
  const segmentLength = segmentEnd - segmentStart

  const segmentProgress = segmentLength > 0
    ? (targetDistance - segmentStart) / segmentLength
    : 0

  const p1 = route[segmentIndex]
  const p2 = route[segmentIndex + 1] || p1

  return [
    p1[0] + (p2[0] - p1[0]) * segmentProgress,
    p1[1] + (p2[1] - p1[1]) * segmentProgress
  ]
}

// ============================================================================
// Utility Functions
// ============================================================================

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
  let bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

// ============================================================================
// Data Loader Class
// ============================================================================

export class KattegatAISLoader {
  private aisService: AISDataService
  private trackReconstructor: VesselTrackReconstructor

  constructor() {
    this.aisService = getAISDataService()
    this.trackReconstructor = getTrackReconstructor()
  }

  /**
   * Load data from Kaggle CSV file (if available)
   */
  async loadFromFile(filePath: string): Promise<boolean> {
    try {
      // In browser environment, would need to use fetch
      // In Node.js, would use fs.readFile
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }
      const csvContent = await response.text()
      await this.aisService.loadFromCSV(csvContent)
      return true
    } catch (error) {
      console.warn('Failed to load CSV file, using demo data:', error)
      return false
    }
  }

  /**
   * Load demo data with injected anomalies
   */
  async loadDemoData(options: {
    startDate?: Date
    hoursOfData?: number
    updateIntervalMinutes?: number
  } = {}): Promise<void> {
    const {
      startDate = new Date('2022-01-15T00:00:00Z'), // Match Kaggle dataset period
      hoursOfData = 24,
      updateIntervalMinutes = 3
    } = options

    console.log(`Generating demo data for Kattegat Strait: ${hoursOfData} hours starting ${startDate.toISOString()}`)

    const records = generateDemoRecords(startDate, hoursOfData, updateIntervalMinutes)

    // Convert records to CSV format and load
    const csvContent = this.recordsToCSV(records)
    await this.aisService.loadFromCSV(csvContent)

    const stats = this.aisService.getStatistics()
    console.log(`Loaded ${stats.totalRecords} records from ${stats.totalVessels} vessels`)
  }

  /**
   * Convert AIS records to CSV format
   */
  private recordsToCSV(records: AISRecord[]): string {
    const headers = [
      'MMSI',
      'IMO',
      'Call Sign',
      'Ship name',
      'Ship type',
      'Device class',
      'Ship width',
      'Ship length',
      'Ship draft',
      'Timestamp',
      'Latitude',
      'Longitude',
      'Navigational status',
      'Rate of Turn (ROT)',
      'Speed Over Ground (SOG)',
      'Course Over Ground (COG)',
      'Heading'
    ]

    const lines = [headers.join(',')]

    for (const record of records) {
      const timestamp = `${record.timestamp.getDate().toString().padStart(2, '0')}/${(record.timestamp.getMonth() + 1).toString().padStart(2, '0')}/${record.timestamp.getFullYear()} ${record.timestamp.getHours().toString().padStart(2, '0')}:${record.timestamp.getMinutes().toString().padStart(2, '0')}:${record.timestamp.getSeconds().toString().padStart(2, '0')}`

      const values = [
        record.mmsi,
        record.imo || '',
        record.callSign || '',
        record.shipName || '',
        record.shipType,
        record.deviceClass,
        record.width?.toString() || '',
        record.length?.toString() || '',
        record.draught?.toString() || '',
        timestamp,
        record.latitude.toString(),
        record.longitude.toString(),
        record.navStatus,
        record.rot?.toString() || '',
        record.sog.toString(),
        record.cog.toString(),
        record.heading.toString()
      ]

      lines.push(values.map(v => v.includes(',') ? `"${v}"` : v).join(','))
    }

    return lines.join('\n')
  }

  /**
   * Get reconstructed vessel tracks
   */
  getVesselTracks() {
    return this.trackReconstructor.reconstructAllTracks()
  }

  /**
   * Get AIS data service
   */
  getAISService(): AISDataService {
    return this.aisService
  }

  /**
   * Get track reconstructor
   */
  getTrackReconstructor(): VesselTrackReconstructor {
    return this.trackReconstructor
  }

  /**
   * Get the list of demo vessels with their anomaly information
   */
  getDemoVesselInfo(): Array<{
    mmsi: string
    name: string
    type: VesselType
    flag: string
    anomaly?: string
  }> {
    return DEMO_VESSELS.map(v => ({
      mmsi: v.mmsi,
      name: v.name,
      type: v.type,
      flag: v.flag,
      anomaly: v.anomaly?.type
    }))
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let loaderInstance: KattegatAISLoader | null = null

export function getKattegatAISLoader(): KattegatAISLoader {
  if (!loaderInstance) {
    loaderInstance = new KattegatAISLoader()
  }
  return loaderInstance
}

/**
 * Initialize with demo data
 */
export async function initializeWithDemoData(options?: {
  startDate?: Date
  hoursOfData?: number
}): Promise<KattegatAISLoader> {
  const loader = getKattegatAISLoader()
  await loader.loadDemoData(options)
  return loader
}
