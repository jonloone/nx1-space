/**
 * Investigation Intelligence Demo Data
 *
 * Generates realistic but FICTIONAL 72-hour tracking data for Pattern-of-Life analysis demo
 *
 * ⚠️ LEGAL DISCLAIMER:
 * This data is for demonstration purposes only.
 * Real pattern-of-life tracking requires proper legal authorization (warrant/court order).
 * For authorized law enforcement use only.
 */

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
 * Operation Nightfall Demo Scenario
 * 72-hour surveillance of fictional suspect in NYC counter-terrorism investigation
 */
export function generateOperationNightfallData(): InvestigationDemoData {
  // Start time: 72 hours ago
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 72 * 60 * 60 * 1000)

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

  // Key locations in NYC (FICTIONAL)
  const locations = {
    // Day 1 - Routine
    residence: { lat: 40.7589, lng: -73.9851, name: 'Residence (Hell\'s Kitchen)', type: 'residence' as const },
    workplace: { lat: 40.7128, lng: -74.0060, name: 'Office Building (Financial District)', type: 'workplace' as const },
    cafe: { lat: 40.7425, lng: -73.9892, name: 'Cafe (Flatiron)', type: 'commercial' as const },
    gym: { lat: 40.7614, lng: -73.9776, name: 'Fitness Center (Midtown East)', type: 'commercial' as const },
    restaurant: { lat: 40.7484, lng: -73.9857, name: 'Restaurant (NoMad)', type: 'commercial' as const },

    // Day 2 - Suspicious
    warehouse: { lat: 40.6782, lng: -73.9442, name: 'Industrial Warehouse (Brooklyn)', type: 'meeting' as const },
    parkingLot: { lat: 40.7549, lng: -73.9840, name: 'Parking Structure (Midtown West)', type: 'unknown' as const },
    storage: { lat: 40.7453, lng: -74.0049, name: 'Storage Facility (Chelsea)', type: 'meeting' as const },

    // Day 3 - Anomaly
    airportMeeting: { lat: 40.7769, lng: -73.8740, name: 'LaGuardia Airport (Terminal B)', type: 'transport' as const },
    hotel: { lat: 40.7580, lng: -73.9855, name: 'Hotel (Times Square)', type: 'meeting' as const },
    pier: { lat: 40.7462, lng: -74.0095, name: 'Pier 66 (Hudson River)', type: 'meeting' as const }
  }

  const locationStops: LocationStop[] = []
  const trackingPoints: TrackingPoint[] = []
  const routeSegments: InvestigationDemoData['routeSegments'] = []

  let currentTime = new Date(startTime)
  let segmentId = 1

  // Helper to add tracking points between locations
  function addRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    startT: Date,
    durationMinutes: number,
    mode: 'walking' | 'driving' | 'transit',
    includePoints: boolean = true
  ) {
    const points: [number, number][] = []
    const numPoints = Math.ceil(durationMinutes / 5) // Point every 5 minutes
    const latStep = (to.lat - from.lat) / numPoints
    const lngStep = (to.lng - from.lng) / numPoints
    const timeStep = (durationMinutes * 60 * 1000) / numPoints

    let speed = mode === 'driving' ? 30 : mode === 'transit' ? 25 : 5 // km/h

    for (let i = 0; i <= numPoints; i++) {
      const pointTime = new Date(startT.getTime() + i * timeStep)
      const lat = from.lat + latStep * i + (Math.random() - 0.5) * 0.0005 // Add jitter
      const lng = from.lng + lngStep * i + (Math.random() - 0.5) * 0.0005

      points.push([lng, lat])

      if (includePoints) {
        trackingPoints.push({
          timestamp: pointTime,
          lat,
          lng,
          speed: speed + (Math.random() - 0.5) * 10,
          heading: Math.atan2(lngStep, latStep) * (180 / Math.PI),
          accuracy: Math.random() < 0.8 ? 10 : 50, // Mostly accurate
          source: Math.random() < 0.9 ? 'gps' : 'cell-tower'
        })
      }
    }

    const distance = Math.sqrt(Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)) * 111 // Rough km

    routeSegments.push({
      id: `segment-${segmentId++}`,
      startTime: startT,
      endTime: new Date(startT.getTime() + durationMinutes * 60 * 1000),
      path: points,
      transportMode: mode,
      distance
    })

    return new Date(startT.getTime() + durationMinutes * 60 * 1000)
  }

  // Helper to add a location stop
  function addStop(
    location: { lat: number; lng: number; name: string; type: any },
    arrivalT: Date,
    dwellMinutes: number,
    significance: 'routine' | 'suspicious' | 'anomaly',
    visitNum: number = 1,
    notes?: string
  ) {
    const stopId = `stop-${locationStops.length + 1}`
    const departureT = new Date(arrivalT.getTime() + dwellMinutes * 60 * 1000)

    locationStops.push({
      id: stopId,
      name: location.name,
      type: location.type,
      lat: location.lat,
      lng: location.lng,
      arrivalTime: arrivalT,
      departureTime: departureT,
      dwellTimeMinutes: dwellMinutes,
      visitCount: visitNum,
      significance,
      notes
    })

    return departureT
  }

  // =======================
  // DAY 1: Normal Pattern
  // =======================

  // 07:00 - Wake up at residence
  currentTime = addStop(locations.residence, new Date(startTime.getTime() + 7 * 60 * 60 * 1000), 60, 'routine', 1)

  // 08:00 - Commute to work (driving)
  currentTime = addRoute(locations.residence, locations.workplace, currentTime, 30, 'driving')

  // 08:30 - At office
  currentTime = addStop(locations.workplace, currentTime, 240, 'routine', 1, 'Regular work hours')

  // 12:30 - Lunch at cafe
  currentTime = addRoute(locations.workplace, locations.cafe, currentTime, 15, 'walking')
  currentTime = addStop(locations.cafe, currentTime, 45, 'routine', 1)
  currentTime = addRoute(locations.cafe, locations.workplace, currentTime, 15, 'walking')

  // 13:30 - Return to office
  currentTime = addStop(locations.workplace, currentTime, 270, 'routine', 2)

  // 18:00 - Gym
  currentTime = addRoute(locations.workplace, locations.gym, currentTime, 20, 'driving')
  currentTime = addStop(locations.gym, currentTime, 60, 'routine', 1)

  // 19:00 - Dinner
  currentTime = addRoute(locations.gym, locations.restaurant, currentTime, 15, 'walking')
  currentTime = addStop(locations.restaurant, currentTime, 90, 'routine', 1)

  // 20:30 - Return home
  currentTime = addRoute(locations.restaurant, locations.residence, currentTime, 25, 'driving')
  currentTime = addStop(locations.residence, currentTime, 630, 'routine', 2) // Stay until next morning

  // =======================
  // DAY 2: Suspicious Activity
  // =======================

  // 07:00 - Leave residence
  currentTime = new Date(startTime.getTime() + 31 * 60 * 60 * 1000)
  currentTime = addRoute(locations.residence, locations.workplace, currentTime, 30, 'driving')
  currentTime = addStop(locations.workplace, currentTime, 180, 'routine', 3, 'Left office early')

  // 12:00 - Unusual parking lot visit
  currentTime = addRoute(locations.workplace, locations.parkingLot, currentTime, 20, 'driving')
  currentTime = addStop(locations.parkingLot, currentTime, 15, 'suspicious', 1, 'Brief stop, possible exchange')

  // 12:15 - Storage facility
  currentTime = addRoute(locations.parkingLot, locations.storage, currentTime, 15, 'driving')
  currentTime = addStop(locations.storage, currentTime, 45, 'suspicious', 1, 'Extended dwell at storage unit')

  // 13:00 - Return to work briefly
  currentTime = addRoute(locations.storage, locations.workplace, currentTime, 20, 'driving')
  currentTime = addStop(locations.workplace, currentTime, 120, 'routine', 4)

  // 15:00 - Leave early
  currentTime = addRoute(locations.workplace, locations.residence, currentTime, 35, 'driving')
  currentTime = addStop(locations.residence, currentTime, 480, 'routine', 3)

  // 23:00 - ANOMALY: Late night warehouse visit
  currentTime = new Date(startTime.getTime() + 47 * 60 * 60 * 1000) // 11 PM Day 2
  currentTime = addRoute(locations.residence, locations.warehouse, currentTime, 35, 'driving', false) // Fewer GPS points (suspicious)
  currentTime = addStop(locations.warehouse, currentTime, 42, 'anomaly', 1, '⚠️ 2:47 AM meeting at industrial site - Multiple associates detected')

  // 00:30 - Return home
  currentTime = addRoute(locations.warehouse, locations.residence, currentTime, 35, 'driving', false)
  currentTime = addStop(locations.residence, currentTime, 420, 'routine', 4)

  // =======================
  // DAY 3: Airport Meeting
  // =======================

  // 07:30 - Skip work, go to airport
  currentTime = new Date(startTime.getTime() + 55.5 * 60 * 60 * 1000)
  currentTime = addRoute(locations.residence, locations.airportMeeting, currentTime, 40, 'driving')
  currentTime = addStop(locations.airportMeeting, currentTime, 90, 'suspicious', 1, 'Terminal B meeting, no flight booked')

  // 10:00 - Hotel visit
  currentTime = addRoute(locations.airportMeeting, locations.hotel, currentTime, 45, 'driving')
  currentTime = addStop(locations.hotel, currentTime, 180, 'suspicious', 1, 'Hotel room meeting, not registered as guest')

  // 13:00 - Pier meeting
  currentTime = addRoute(locations.hotel, locations.pier, currentTime, 20, 'walking')
  currentTime = addStop(locations.pier, currentTime, 30, 'anomaly', 1, '⚠️ Waterfront meeting location')

  // 13:30 - Return home
  currentTime = addRoute(locations.pier, locations.residence, currentTime, 25, 'walking')
  currentTime = addStop(locations.residence, currentTime, 360, 'routine', 5)

  // Sort tracking points by timestamp
  trackingPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  return {
    subject,
    trackingPoints,
    locationStops,
    routeSegments
  }
}

/**
 * Get heatmap data (frequency of visits per location)
 */
export function generateHeatmapData(locationStops: LocationStop[]): {
  position: [number, number]
  weight: number
  metadata: {
    name: string
    visits: number
    totalDwellMinutes: number
  }
}[] {
  // Group by location (approximate)
  const locationGroups = new Map<string, LocationStop[]>()

  locationStops.forEach(stop => {
    const key = `${stop.lat.toFixed(4)},${stop.lng.toFixed(4)}`
    if (!locationGroups.has(key)) {
      locationGroups.set(key, [])
    }
    locationGroups.get(key)!.push(stop)
  })

  return Array.from(locationGroups.entries()).map(([key, stops]) => {
    const totalDwell = stops.reduce((sum, s) => sum + s.dwellTimeMinutes, 0)
    const visits = stops.reduce((sum, s) => sum + s.visitCount, 0)

    return {
      position: [stops[0].lng, stops[0].lat],
      weight: Math.min(100, visits * 10 + totalDwell / 10),
      metadata: {
        name: stops[0].name,
        visits,
        totalDwellMinutes: totalDwell
      }
    }
  })
}

/**
 * Pattern Analysis: Identify routine vs anomaly
 */
export function analyzePatterns(locationStops: LocationStop[]): {
  routineLocations: string[]
  suspiciousLocations: string[]
  anomalyLocations: string[]
  keyFindings: string[]
} {
  const routineLocations = locationStops.filter(s => s.significance === 'routine').map(s => s.name)
  const suspiciousLocations = locationStops.filter(s => s.significance === 'suspicious').map(s => s.name)
  const anomalyLocations = locationStops.filter(s => s.significance === 'anomaly').map(s => s.name)

  const keyFindings = [
    '📍 Subject maintains regular daily pattern: Residence → Office → Gym → Residence',
    '⚠️ Day 2: Unusual mid-day activities at storage facility and parking structure',
    '🚨 CRITICAL: 2:47 AM warehouse meeting with multiple associates (Day 2/3 overnight)',
    '✈️ Day 3: Airport meeting with no flight booking indicates possible courier exchange',
    '🏨 Hotel visit without guest registration suggests clandestine meeting',
    '🌊 Waterfront pier meeting at unusual location',
    '📊 Pattern deviation detected: Work schedule disrupted on Days 2-3',
    '🔍 Recommend: Warrant for warehouse facility, associate identification, communications intercept'
  ]

  return {
    routineLocations: [...new Set(routineLocations)],
    suspiciousLocations: [...new Set(suspiciousLocations)],
    anomalyLocations: [...new Set(anomalyLocations)],
    keyFindings
  }
}
