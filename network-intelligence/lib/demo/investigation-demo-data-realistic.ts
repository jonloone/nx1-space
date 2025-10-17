/**
 * Investigation Intelligence Demo Data - REALISTIC VERSION
 *
 * Generates realistic FICTIONAL 72-hour tracking data using:
 * - Real NYC location coordinates (verified addresses)
 * - Mapbox Directions API for actual street routes
 * - Realistic timing and movement patterns
 *
 * ⚠️ LEGAL DISCLAIMER:
 * This data is for demonstration purposes only.
 * Real pattern-of-life tracking requires proper legal authorization (warrant/court order).
 * For authorized law enforcement use only.
 */

import {
  generateRealisticRoute,
  type RealisticRoute,
  type TransportMode
} from '../services/realisticRouteGenerator'

export interface TrackingPoint {
  timestamp: Date
  lat: number
  lng: number
  speed: number // km/h
  heading: number // degrees
  accuracy: number // meters
  source: 'gps' | 'cell-tower' | 'wifi'
}

export interface LocationStop {
  id: string
  name: string
  type: 'residence' | 'workplace' | 'commercial' | 'meeting' | 'transport' | 'unknown'
  lat: number
  lng: number
  arrivalTime: Date
  departureTime: Date
  dwellTimeMinutes: number
  visitCount: number
  significance: 'routine' | 'suspicious' | 'anomaly'
  notes?: string
}

export interface InvestigationSubject {
  subjectId: string
  caseNumber: string
  classification: 'person-of-interest' | 'suspect' | 'associate' | 'witness'
  investigation: string
  startDate: Date
  endDate: Date
  legalAuthorization: string
}

export interface InvestigationDemoData {
  subject: InvestigationSubject
  trackingPoints: TrackingPoint[]
  locationStops: LocationStop[]
  routeSegments: {
    id: string
    startTime: Date
    endTime: Date
    path: [number, number][]
    transportMode: 'walking' | 'driving' | 'transit' | 'unknown'
    distance: number // km
  }[]
}

/**
 * Real NYC Locations (verified coordinates)
 */
const NYC_LOCATIONS = {
  // Day 1 - Routine locations
  residence: {
    name: 'Apartment Building, 515 W 52nd St (Hell\'s Kitchen)',
    lat: 40.7661,
    lng: -73.9912,
    type: 'residence' as const,
    address: '515 W 52nd St, New York, NY 10019'
  },
  workplace: {
    name: 'Office Building, 200 Liberty St (Financial District)',
    lat: 40.7119,
    lng: -74.0143,
    type: 'workplace' as const,
    address: 'Brookfield Place, 200 Liberty St'
  },
  cafe: {
    name: 'Blue Bottle Coffee, 1 Rockefeller Plaza',
    lat: 40.7588,
    lng: -73.9787,
    type: 'commercial' as const,
    address: '1 Rockefeller Plaza'
  },
  gym: {
    name: 'Equinox Fitness, 140 E 54th St (Midtown)',
    lat: 40.7586,
    lng: -73.9718,
    type: 'commercial' as const,
    address: '140 E 54th St'
  },
  restaurant: {
    name: 'Eleven Madison Park, 11 Madison Ave',
    lat: 40.7425,
    lng: -73.9871,
    type: 'commercial' as const,
    address: '11 Madison Avenue'
  },

  // Day 2 - Suspicious locations
  warehouse: {
    name: 'Industrial Warehouse, 2 52nd Ave (Brooklyn Navy Yard)',
    lat: 40.7007,
    lng: -73.9721,
    type: 'meeting' as const,
    address: '2 52nd Ave, Brooklyn, NY 11232'
  },
  parkingGarage: {
    name: 'Icon Parking, 200 W 54th St',
    lat: 40.7644,
    lng: -73.9827,
    type: 'unknown' as const,
    address: '200 W 54th St'
  },
  storage: {
    name: 'Manhattan Mini Storage, 500 W 21st St (Chelsea)',
    lat: 40.7473,
    lng: -74.0069,
    type: 'meeting' as const,
    address: '500 W 21st St'
  },

  // Day 3 - Anomaly locations
  airport: {
    name: 'LaGuardia Airport, Terminal B',
    lat: 40.7769,
    lng: -73.8740,
    type: 'transport' as const,
    address: 'LaGuardia Airport, Terminal B'
  },
  hotel: {
    name: 'Marriott Marquis, 1535 Broadway',
    lat: 40.7589,
    lng: -73.9853,
    type: 'meeting' as const,
    address: '1535 Broadway, Times Square'
  },
  pier: {
    name: 'Pier 66 Maritime, Hudson River Park',
    lat: 40.7616,
    lng: -74.0053,
    type: 'meeting' as const,
    address: 'West 26th St & Hudson River'
  }
}

/**
 * Generate Operation Nightfall Demo Data with Realistic Routes
 */
export async function generateOperationNightfallDataRealistic(): Promise<InvestigationDemoData> {
  console.log('🔍 Generating realistic investigation demo data...')

  // Time setup
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 72 * 60 * 60 * 1000) // 72 hours ago

  // Subject info (FICTIONAL)
  const subject: InvestigationSubject = {
    subjectId: 'SUBJECT-2547',
    caseNumber: 'CT-2024-5547',
    classification: 'person-of-interest',
    investigation: 'Operation Nightfall',
    startDate: startTime,
    endDate: endTime,
    legalAuthorization: 'Federal Warrant #2024-CT-5547 (SDNY)'
  }

  const locationStops: LocationStop[] = []
  const trackingPoints: TrackingPoint[] = []
  const routeSegments: InvestigationDemoData['routeSegments'] = []

  let segmentId = 1

  /**
   * Helper: Add location stop
   */
  function addStop(
    location: typeof NYC_LOCATIONS[keyof typeof NYC_LOCATIONS],
    arrivalTime: Date,
    dwellMinutes: number,
    significance: 'routine' | 'suspicious' | 'anomaly',
    visitNum: number = 1,
    notes?: string
  ): Date {
    const departureTime = new Date(arrivalTime.getTime() + dwellMinutes * 60 * 1000)

    locationStops.push({
      id: `stop-${locationStops.length + 1}`,
      name: location.name,
      type: location.type,
      lat: location.lat,
      lng: location.lng,
      arrivalTime,
      departureTime,
      dwellTimeMinutes: dwellMinutes,
      visitCount: visitNum,
      significance,
      notes
    })

    return departureTime
  }

  /**
   * Helper: Add realistic route using Mapbox Directions API
   */
  async function addRealisticRoute(
    from: typeof NYC_LOCATIONS[keyof typeof NYC_LOCATIONS],
    to: typeof NYC_LOCATIONS[keyof typeof NYC_LOCATIONS],
    startT: Date,
    mode: TransportMode,
    includePoints: boolean = true
  ): Promise<Date> {
    try {
      const route = await generateRealisticRoute(
        [from.lng, from.lat],
        [to.lng, to.lat],
        mode,
        startT
      )

      // Add route segment
      routeSegments.push({
        id: `segment-${segmentId++}`,
        startTime: startT,
        endTime: new Date(startT.getTime() + route.duration * 1000),
        path: route.path,
        transportMode: mode,
        distance: route.distance / 1000 // Convert to km
      })

      // Add tracking points from waypoints
      if (includePoints) {
        route.waypoints.forEach(wp => {
          // Calculate speed from distance/time
          const avgSpeed = (route.distance / 1000) / (route.duration / 3600) // km/h

          // Calculate heading (bearing between successive points)
          const heading = Math.atan2(
            to.lng - from.lng,
            to.lat - from.lat
          ) * (180 / Math.PI)

          trackingPoints.push({
            timestamp: wp.timestamp,
            lat: wp.lat,
            lng: wp.lng,
            speed: avgSpeed + (Math.random() - 0.5) * 10, // Add variance
            heading: (heading + 360) % 360,
            accuracy: Math.random() < 0.9 ? 10 : 50, // Mostly accurate GPS
            source: Math.random() < 0.9 ? 'gps' : 'cell-tower'
          })
        })
      }

      return new Date(startT.getTime() + route.duration * 1000)
    } catch (error) {
      console.error('Failed to generate route, using simple path:', error)
      // Fallback: simple straight line with estimated time
      const estimatedDuration = mode === 'driving' ? 15 * 60 : mode === 'walking' ? 30 * 60 : 20 * 60
      return new Date(startT.getTime() + estimatedDuration * 1000)
    }
  }

  console.log('📍 Generating Day 1 routes (Routine Pattern)...')

  // =======================
  // DAY 1: Normal Pattern
  // =======================

  // 07:00 - Wake up at residence
  let currentTime = new Date(startTime.getTime() + 7 * 60 * 60 * 1000)
  currentTime = addStop(NYC_LOCATIONS.residence, currentTime, 60, 'routine', 1)

  // 08:00 - Commute to work (driving via FDR Drive / West Side Highway)
  currentTime = await addRealisticRoute(NYC_LOCATIONS.residence, NYC_LOCATIONS.workplace, currentTime, 'driving')

  // ~08:30 - At office (work day)
  currentTime = addStop(NYC_LOCATIONS.workplace, currentTime, 240, 'routine', 1, 'Regular work hours')

  // 12:30 - Lunch at Rockefeller Center cafe
  currentTime = await addRealisticRoute(NYC_LOCATIONS.workplace, NYC_LOCATIONS.cafe, currentTime, 'walking')
  currentTime = addStop(NYC_LOCATIONS.cafe, currentTime, 45, 'routine', 1)
  currentTime = await addRealisticRoute(NYC_LOCATIONS.cafe, NYC_LOCATIONS.workplace, currentTime, 'walking')

  // 13:30 - Return to office
  currentTime = addStop(NYC_LOCATIONS.workplace, currentTime, 270, 'routine', 2)

  // 18:00 - Evening gym session
  currentTime = await addRealisticRoute(NYC_LOCATIONS.workplace, NYC_LOCATIONS.gym, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.gym, currentTime, 60, 'routine', 1)

  // 19:00 - Dinner at restaurant
  currentTime = await addRealisticRoute(NYC_LOCATIONS.gym, NYC_LOCATIONS.restaurant, currentTime, 'walking')
  currentTime = addStop(NYC_LOCATIONS.restaurant, currentTime, 90, 'routine', 1)

  // 20:30 - Return home
  currentTime = await addRealisticRoute(NYC_LOCATIONS.restaurant, NYC_LOCATIONS.residence, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.residence, currentTime, 630, 'routine', 2) // Sleep until next morning

  console.log('📍 Generating Day 2 routes (Suspicious Activity)...')

  // =======================
  // DAY 2: Suspicious Activity
  // =======================

  // 07:00 - Leave residence for work
  currentTime = new Date(startTime.getTime() + 31 * 60 * 60 * 1000)
  currentTime = await addRealisticRoute(NYC_LOCATIONS.residence, NYC_LOCATIONS.workplace, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.workplace, currentTime, 180, 'routine', 3, 'Left office early')

  // 12:00 - Unusual parking garage visit
  currentTime = await addRealisticRoute(NYC_LOCATIONS.workplace, NYC_LOCATIONS.parkingGarage, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.parkingGarage, currentTime, 15, 'suspicious', 1, 'Brief stop, possible exchange')

  // 12:15 - Chelsea storage facility
  currentTime = await addRealisticRoute(NYC_LOCATIONS.parkingGarage, NYC_LOCATIONS.storage, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.storage, currentTime, 45, 'suspicious', 1, 'Extended dwell at storage unit')

  // 13:00 - Return to work briefly
  currentTime = await addRealisticRoute(NYC_LOCATIONS.storage, NYC_LOCATIONS.workplace, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.workplace, currentTime, 120, 'routine', 4)

  // 15:00 - Leave early, return home
  currentTime = await addRealisticRoute(NYC_LOCATIONS.workplace, NYC_LOCATIONS.residence, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.residence, currentTime, 480, 'routine', 3)

  // 23:00 - CRITICAL ANOMALY: Late night warehouse visit (Brooklyn Navy Yard)
  console.log('🚨 Generating critical anomaly route (2:47 AM warehouse visit)...')
  currentTime = new Date(startTime.getTime() + 47 * 60 * 60 * 1000) // 11 PM Day 2
  currentTime = await addRealisticRoute(NYC_LOCATIONS.residence, NYC_LOCATIONS.warehouse, currentTime, 'driving', false) // Sparse GPS
  currentTime = addStop(NYC_LOCATIONS.warehouse, currentTime, 42, 'anomaly', 1, '⚠️ 2:47 AM meeting at industrial site - Multiple associates detected')

  // 00:30 - Return home (suspicious late-night activity)
  currentTime = await addRealisticRoute(NYC_LOCATIONS.warehouse, NYC_LOCATIONS.residence, currentTime, 'driving', false)
  currentTime = addStop(NYC_LOCATIONS.residence, currentTime, 420, 'routine', 4)

  console.log('📍 Generating Day 3 routes (Airport Anomaly)...')

  // =======================
  // DAY 3: Airport Meeting
  // =======================

  // 07:30 - Skip work, drive to LaGuardia
  currentTime = new Date(startTime.getTime() + 55.5 * 60 * 60 * 1000)
  currentTime = await addRealisticRoute(NYC_LOCATIONS.residence, NYC_LOCATIONS.airport, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.airport, currentTime, 90, 'suspicious', 1, 'Terminal B meeting, no flight booked')

  // 10:00 - Times Square hotel visit
  currentTime = await addRealisticRoute(NYC_LOCATIONS.airport, NYC_LOCATIONS.hotel, currentTime, 'driving')
  currentTime = addStop(NYC_LOCATIONS.hotel, currentTime, 180, 'suspicious', 1, 'Hotel room meeting, not registered as guest')

  // 13:00 - Hudson River pier meeting
  currentTime = await addRealisticRoute(NYC_LOCATIONS.hotel, NYC_LOCATIONS.pier, currentTime, 'walking')
  currentTime = addStop(NYC_LOCATIONS.pier, currentTime, 30, 'anomaly', 1, '⚠️ Waterfront meeting location')

  // 13:30 - Return home
  currentTime = await addRealisticRoute(NYC_LOCATIONS.pier, NYC_LOCATIONS.residence, currentTime, 'walking')
  currentTime = addStop(NYC_LOCATIONS.residence, currentTime, 360, 'routine', 5)

  // Sort tracking points by timestamp
  trackingPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  console.log(`✅ Generated ${trackingPoints.length} tracking points, ${locationStops.length} stops, ${routeSegments.length} route segments`)

  return {
    subject,
    trackingPoints,
    locationStops,
    routeSegments
  }
}

// Export same helper functions as original
export { generateHeatmapData, analyzePatterns } from './investigation-demo-data'
