/**
 * Citizens 360 - Timeline Events for Operation Nightfall
 * 72-hour surveillance timeline with detailed events
 */

import type { TimelineEvent } from '@/lib/types/chatArtifacts'

/**
 * Generate 72-hour timeline for SUBJECT-2547 (Marcus Rahman)
 */
export function generateSubject2547Timeline(): TimelineEvent[] {
  const now = new Date()
  const events: TimelineEvent[] = []

  // Helper to create timestamps relative to now
  const hoursAgo = (hours: number, minutes: number = 0) =>
    new Date(now.getTime() - (hours * 60 + minutes) * 60 * 1000)

  // ===== DAY 1: Routine Activities (72-48 hours ago) =====

  events.push({
    id: 'evt-001',
    timestamp: hoursAgo(72, 0),
    type: 'movement',
    title: 'Departed Residence',
    description: 'Subject departed 515 W 52nd St at 07:32 AM. Observed entering 2018 Honda Accord (NY plate: KLM-5847).',
    location: {
      name: 'Residence - Hell\'s Kitchen',
      coordinates: [-73.9912, 40.7661],
      address: '515 W 52nd St, New York, NY 10019'
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Physical Surveillance Team Alpha',
    mediaAttached: false
  })

  events.push({
    id: 'evt-002',
    timestamp: hoursAgo(71, 45),
    type: 'communication',
    title: 'Phone Call - SUBJECT-2548',
    description: '8-minute phone call to SUBJECT-2548 (Hassan Al-Masri). Content: Discussed meeting later today, mentioned "package" and "warehouse location".',
    location: {
      name: 'In Transit to Office',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'suspicious',
    confidence: 'high',
    source: 'FISA Electronic Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-003',
    timestamp: hoursAgo(71, 15),
    type: 'location',
    title: 'Arrived at Workplace',
    description: 'Subject arrived at TechCore Solutions office building. Swiped access card at 08:17 AM. Normal commute time.',
    location: {
      name: 'TechCore Solutions - Financial District',
      coordinates: [-74.0143, 40.7119],
      address: '200 Liberty St, New York, NY'
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Building Security Logs + GPS',
    mediaAttached: false
  })

  events.push({
    id: 'evt-004',
    timestamp: hoursAgo(67, 30),
    type: 'meeting',
    title: 'Lunch with Coworker',
    description: 'Subject had lunch with David Chen (PERSON-7432) at nearby cafe. Conversation appeared casual, discussed work projects.',
    location: {
      name: 'Blue Bottle Coffee - Rockefeller Plaza',
      coordinates: [-73.9787, 40.7588],
      address: '1 Rockefeller Plaza'
    },
    significance: 'routine',
    confidence: 'high',
    source: 'Physical Surveillance Team Bravo',
    mediaAttached: true
  })

  events.push({
    id: 'evt-005',
    timestamp: hoursAgo(64, 45),
    type: 'movement',
    title: 'Departed Office',
    description: 'Subject left office at 3:47 PM (early departure, unusual). Security logs show card swipe exit.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'anomaly',
    confidence: 'confirmed',
    source: 'Building Security + Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-006',
    timestamp: hoursAgo(64, 10),
    type: 'meeting',
    title: 'Meeting with SUBJECT-2548 - Warehouse',
    description: 'Subject met SUBJECT-2548 at industrial warehouse in Brooklyn. Meeting lasted 47 minutes. Both subjects appeared to survey surroundings before entering. Counter-surveillance behavior observed.',
    location: {
      name: 'Industrial Warehouse - Brooklyn',
      coordinates: [-73.9442, 40.6782],
      address: 'Kent Ave & S 9th St, Brooklyn'
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance Team Alpha + Aerial Unit',
    mediaAttached: true
  })

  events.push({
    id: 'evt-007',
    timestamp: hoursAgo(63, 0),
    type: 'financial',
    title: 'Cash Withdrawal',
    description: 'Subject withdrew $3,000 cash from Chase ATM in Brooklyn. This follows pattern of large cash withdrawals over past 2 weeks.',
    location: {
      name: 'Chase Bank ATM - Williamsburg',
      coordinates: [-73.9567, 40.7081],
      address: '184 Bedford Ave'
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Financial Records Subpoena',
    mediaAttached: false
  })

  events.push({
    id: 'evt-008',
    timestamp: hoursAgo(61, 30),
    type: 'location',
    title: 'Gym Visit',
    description: 'Subject arrived at Equinox Fitness for regular workout. Typical routine, stayed 1 hour 15 minutes.',
    location: {
      name: 'Equinox Fitness - Midtown',
      coordinates: [-73.9718, 40.7586],
      address: '140 E 54th St'
    },
    significance: 'routine',
    confidence: 'high',
    source: 'GPS Tracking + Membership Records',
    mediaAttached: false
  })

  events.push({
    id: 'evt-009',
    timestamp: hoursAgo(58, 45),
    type: 'location',
    title: 'Returned to Residence',
    description: 'Subject returned home at 7:47 PM. Observed SUBJECT-2549 (Aisha Patel) arriving shortly after.',
    location: {
      name: 'Residence - Hell\'s Kitchen',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-010',
    timestamp: hoursAgo(55, 0),
    type: 'digital',
    title: 'Encrypted Messaging Session',
    description: 'Subject engaged in 2-hour encrypted messaging session using Signal app. Unable to decrypt content. Metadata shows 47 messages exchanged with unknown foreign number (+90-XXX-XXX-XX).',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'suspicious',
    confidence: 'high',
    source: 'Network Traffic Analysis',
    mediaAttached: false
  })

  // ===== DAY 2: Escalating Suspicious Activity (48-24 hours ago) =====

  events.push({
    id: 'evt-011',
    timestamp: hoursAgo(48, 30),
    type: 'movement',
    title: 'Unusual Early Departure',
    description: 'Subject left residence at 5:58 AM (3 hours earlier than normal). SUBJECT-2549 still inside, appears unaware.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'anomaly',
    confidence: 'confirmed',
    source: 'Physical Surveillance Team Charlie',
    mediaAttached: false
  })

  events.push({
    id: 'evt-012',
    timestamp: hoursAgo(48, 0),
    type: 'meeting',
    title: 'Pre-Dawn Meeting - Storage Facility',
    description: 'Subject met unidentified male (UNKNOWN-47) at Chelsea storage facility. Both entered Unit #342 for 22 minutes. Subject emerged carrying large duffel bag.',
    location: {
      name: 'Public Storage - Chelsea',
      coordinates: [-74.0049, 40.7453],
      address: '540 W 21st St'
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance + Facility CCTV',
    mediaAttached: true
  })

  events.push({
    id: 'evt-013',
    timestamp: hoursAgo(47, 15),
    type: 'communication',
    title: 'Brief Phone Call - Foreign Number',
    description: '90-second call to Turkish number (+90-212-XXX-XXXX). This number has been flagged by CT Division as associated with known extremist facilitator.',
    location: {
      name: 'In Transit - FDR Drive',
      coordinates: [-73.9735, 40.7282]
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'FISA Intercept',
    mediaAttached: false
  })

  events.push({
    id: 'evt-014',
    timestamp: hoursAgo(46, 30),
    type: 'location',
    title: 'Arrived at Office',
    description: 'Subject arrived at office but did not swipe access card. Observed entering building with employee group. Possible avoidance of electronic trail.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'suspicious',
    confidence: 'high',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-015',
    timestamp: hoursAgo(42, 0),
    type: 'digital',
    title: 'Large File Upload Detected',
    description: 'Network monitoring detected 2.4 GB encrypted file upload to offshore server (IP traced to Netherlands). Upload occurred during lunch hour.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'suspicious',
    confidence: 'high',
    source: 'Network Traffic Analysis',
    mediaAttached: false
  })

  events.push({
    id: 'evt-016',
    timestamp: hoursAgo(38, 30),
    type: 'movement',
    title: 'Departed Office - Normal Time',
    description: 'Subject left office at 5:02 PM via normal exit. Appeared to make multiple phone checks, counter-surveillance behavior noted.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-017',
    timestamp: hoursAgo(37, 45),
    type: 'meeting',
    title: 'Meeting with SUBJECT-2548 - Parking Structure',
    description: 'Brief 8-minute meeting with SUBJECT-2548 in parking structure. Subjects conversed in vehicle, hand gestures suggest animated discussion. Subject handed envelope to SUBJECT-2548.',
    location: {
      name: 'Parking Structure - Midtown West',
      coordinates: [-73.9840, 40.7549],
      address: '606 W 48th St'
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance Team Alpha',
    mediaAttached: true
  })

  events.push({
    id: 'evt-018',
    timestamp: hoursAgo(36, 0),
    type: 'location',
    title: 'Dinner - Restaurant',
    description: 'Subject had dinner with SUBJECT-2549 at restaurant in NoMad. Behavior appeared normal, romantic dinner setting. SUBJECT-2549 appears unaware of activities.',
    location: {
      name: 'Upland Restaurant - NoMad',
      coordinates: [-73.9857, 40.7484],
      address: '345 Park Ave S'
    },
    significance: 'routine',
    confidence: 'high',
    source: 'Physical Surveillance Team Bravo',
    mediaAttached: false
  })

  events.push({
    id: 'evt-019',
    timestamp: hoursAgo(33, 30),
    type: 'location',
    title: 'Returned Home',
    description: 'Both subjects returned to residence together. Lights observed on until 11:47 PM.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-020',
    timestamp: hoursAgo(30, 15),
    type: 'movement',
    title: 'Late Night Departure - CRITICAL',
    description: 'Subject departed residence alone at 1:17 AM. Extremely unusual timing. Used different vehicle (rental). Counter-surveillance driving observed.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'Physical Surveillance Team Charlie (Night Shift)',
    mediaAttached: false
  })

  events.push({
    id: 'evt-021',
    timestamp: hoursAgo(29, 45),
    type: 'meeting',
    title: 'Late Night Meeting - Pier 66',
    description: 'Subject met two unidentified males at Pier 66 on Hudson River. Meeting lasted 18 minutes. Subjects appeared to exchange items. All parties departed separately.',
    location: {
      name: 'Pier 66 Maritime - Hudson River',
      coordinates: [-74.0095, 40.7462],
      address: 'Hudson River Greenway at W 26th St'
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'Physical Surveillance + Infrared Aerial',
    mediaAttached: true
  })

  events.push({
    id: 'evt-022',
    timestamp: hoursAgo(28, 30),
    type: 'location',
    title: 'Returned to Residence',
    description: 'Subject returned home at 3:02 AM. Lights off immediately. SUBJECT-2549 appears to have been asleep entire time.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  // ===== DAY 3: Critical Timeline (24-0 hours ago) =====

  events.push({
    id: 'evt-023',
    timestamp: hoursAgo(24, 0),
    type: 'movement',
    title: 'Normal Morning Departure',
    description: 'Subject left for work at 7:45 AM. Appeared relaxed, no apparent counter-surveillance. SUBJECT-2549 left separately for her workplace.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-024',
    timestamp: hoursAgo(23, 15),
    type: 'location',
    title: 'Arrived at Office',
    description: 'Subject arrived at office, swiped access card at 8:17 AM.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Building Security',
    mediaAttached: false
  })

  events.push({
    id: 'evt-025',
    timestamp: hoursAgo(20, 30),
    type: 'communication',
    title: 'Conference Call - International',
    description: 'Subject participated in 45-minute conference call with overseas clients (legitimate business call). Call content reviewed, no concerns.',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'routine',
    confidence: 'high',
    source: 'Business Communications Monitoring',
    mediaAttached: false
  })

  events.push({
    id: 'evt-026',
    timestamp: hoursAgo(18, 0),
    type: 'financial',
    title: 'Wire Transfer - Offshore Account',
    description: 'Subject initiated $15,000 wire transfer from Ally Bank savings to offshore account in Cayman Islands. Transaction flagged by FinCEN.',
    location: {
      name: 'TechCore Solutions (Online Banking)',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'Financial Institution Reports',
    mediaAttached: false
  })

  events.push({
    id: 'evt-027',
    timestamp: hoursAgo(16, 45),
    type: 'movement',
    title: 'Left Office Early',
    description: 'Subject departed office at 2:47 PM, claiming family emergency (per intercept of text to supervisor).',
    location: {
      name: 'TechCore Solutions',
      coordinates: [-74.0143, 40.7119]
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance + Text Message Intercept',
    mediaAttached: false
  })

  events.push({
    id: 'evt-028',
    timestamp: hoursAgo(15, 30),
    type: 'location',
    title: 'LaGuardia Airport - Terminal B',
    description: 'Subject proceeded directly to LaGuardia Airport. Met unidentified male (UNKNOWN-52) in Terminal B. Brief 12-minute conversation, then subject departed WITHOUT boarding any flight.',
    location: {
      name: 'LaGuardia Airport - Terminal B',
      coordinates: [-73.8740, 40.7769],
      address: 'LaGuardia Airport, Queens, NY'
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'Physical Surveillance + Airport Security',
    mediaAttached: true
  })

  events.push({
    id: 'evt-029',
    timestamp: hoursAgo(14, 0),
    type: 'meeting',
    title: 'Hotel Meeting - Times Square',
    description: 'Subject proceeded to hotel in Times Square, met SUBJECT-2548 in lobby. Both entered hotel room #1847 for 38 minutes. Third unidentified person (UNKNOWN-53) also present.',
    location: {
      name: 'Marriott Marquis - Times Square',
      coordinates: [-73.9855, 40.7580],
      address: '1535 Broadway'
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'Physical Surveillance + Hotel Records Subpoena',
    mediaAttached: true
  })

  events.push({
    id: 'evt-030',
    timestamp: hoursAgo(12, 30),
    type: 'communication',
    title: 'Encrypted Communication Spike',
    description: 'Massive spike in encrypted communications detected from hotel location. 127 messages over 45 minutes to multiple foreign numbers. Pattern suggests group coordination.',
    location: {
      name: 'Marriott Marquis',
      coordinates: [-73.9855, 40.7580]
    },
    significance: 'critical',
    confidence: 'high',
    source: 'Network Traffic Analysis + Cell Tower Data',
    mediaAttached: false
  })

  events.push({
    id: 'evt-031',
    timestamp: hoursAgo(11, 45),
    type: 'movement',
    title: 'Separated from Associates',
    description: 'Subject departed hotel alone. SUBJECT-2548 and UNKNOWN-53 remained inside. Subject appeared agitated, checking phone frequently.',
    location: {
      name: 'Marriott Marquis',
      coordinates: [-73.9855, 40.7580]
    },
    significance: 'suspicious',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-032',
    timestamp: hoursAgo(10, 30),
    type: 'location',
    title: 'Returned to Residence',
    description: 'Subject returned home. SUBJECT-2549 already present, cooking dinner. Subject behavior appeared normal in presence of SUBJECT-2549.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'routine',
    confidence: 'confirmed',
    source: 'Physical Surveillance',
    mediaAttached: false
  })

  events.push({
    id: 'evt-033',
    timestamp: hoursAgo(6, 0),
    type: 'digital',
    title: 'Social Media Activity',
    description: 'Subject posted vacation photos on Instagram from previous Bangladesh trip. Unusual timing for nostalgic post. Possible signaling?',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'suspicious',
    confidence: 'medium',
    source: 'Social Media Monitoring',
    mediaAttached: false
  })

  events.push({
    id: 'evt-034',
    timestamp: hoursAgo(3, 15),
    type: 'communication',
    title: 'Late Night Phone Call',
    description: '18-minute phone call with SUBJECT-2548 at 11:47 PM. Animated conversation, subject pacing apartment. Unable to decrypt Signal call content.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'suspicious',
    confidence: 'high',
    source: 'FISA Surveillance + Physical Observation',
    mediaAttached: false
  })

  events.push({
    id: 'evt-035',
    timestamp: hoursAgo(1, 30),
    type: 'digital',
    title: 'VPN Connection to Overseas Server',
    description: 'Subject established VPN connection to server in Turkey, followed by 90-minute encrypted session. Activity suggests coordination or planning.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'critical',
    confidence: 'high',
    source: 'Network Traffic Analysis',
    mediaAttached: false
  })

  events.push({
    id: 'evt-036',
    timestamp: hoursAgo(0, 15),
    type: 'status',
    title: 'Current Status - Under Active Surveillance',
    description: 'Subject currently at residence. All lights off as of 2:17 AM. Surveillance teams maintaining 24/7 coverage. Preparing for potential tactical intervention if imminent threat develops.',
    location: {
      name: 'Residence',
      coordinates: [-73.9912, 40.7661]
    },
    significance: 'critical',
    confidence: 'confirmed',
    source: 'FBI JTTF Command Center',
    mediaAttached: false
  })

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get timeline summary statistics
 */
export function getTimelineStats() {
  const events = generateSubject2547Timeline()

  const bySignificance = {
    routine: events.filter(e => e.significance === 'routine').length,
    suspicious: events.filter(e => e.significance === 'suspicious').length,
    anomaly: events.filter(e => e.significance === 'anomaly').length,
    critical: events.filter(e => e.significance === 'critical').length
  }

  const byType = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalEvents: events.length,
    bySignificance,
    byType,
    timeRange: {
      start: events[events.length - 1].timestamp,
      end: events[0].timestamp
    }
  }
}

/**
 * Get critical events only
 */
export function getCriticalEvents(): TimelineEvent[] {
  return generateSubject2547Timeline().filter(e =>
    e.significance === 'critical' || e.significance === 'anomaly'
  )
}

/**
 * Get events by location
 */
export function getEventsByLocation(locationName: string): TimelineEvent[] {
  return generateSubject2547Timeline().filter(e =>
    e.location.name.toLowerCase().includes(locationName.toLowerCase())
  )
}
