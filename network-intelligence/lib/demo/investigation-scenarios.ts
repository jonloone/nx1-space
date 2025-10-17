/**
 * Pre-Generated Investigation Scenarios
 *
 * Multiple realistic, story-driven investigation scenarios
 * Each with coherent narrative, real NYC locations, and plausible suspicious activity
 */

export interface InvestigationScenario {
  id: string
  title: string
  description: string
  narrative: string
  subject: {
    profile: string
    occupation: string
    ageRange: string
    homeNeighborhood: string
    workLocation: string
  }
  keyFindings: string[]
  locations: ScenarioLocation[]
}

export interface ScenarioLocation {
  name: string
  address: string
  lat: number
  lng: number
  type: 'residence' | 'workplace' | 'commercial' | 'meeting' | 'transport' | 'unknown'
  day: number
  time: string
  dwellMinutes: number
  significance: 'routine' | 'suspicious' | 'anomaly'
  notes: string
}

/**
 * Scenario 1: Operation Digital Shadow
 * Tech worker with suspicious cryptocurrency-related activity
 */
export const SCENARIO_DIGITAL_SHADOW: InvestigationScenario = {
  id: 'digital-shadow',
  title: 'Operation Digital Shadow',
  description: 'Software engineer exhibiting suspicious cryptocurrency trading patterns and unusual meeting locations',

  narrative: `Subject is a 32-year-old software engineer employed at a FinTech startup in Chelsea. Investigation began after financial transaction monitoring flagged unusual cryptocurrency transfers totaling $2.3M over three weeks.

Surveillance revealed established routine during Day 1: residence in Hell's Kitchen, daily commute to Chelsea office, regular fitness and dining patterns. Day 2 showed significant deviation with visits to industrial storage facility and extended parking garage meetings. Critical anomaly occurred at 2:47 AM on Day 3 with meeting at Brooklyn Navy Yard industrial warehouse involving multiple unidentified associates.

Subject's technical background, combined with late-night industrial site meetings and established cryptocurrency activity, suggests possible involvement in crypto mining operation or digital asset laundering. Recommend immediate warrant for warehouse facility, financial records subpoena, and communications intercept.`,

  subject: {
    profile: 'Technical professional with cryptocurrency expertise, no prior criminal record, sudden wealth indicators',
    occupation: 'Senior Software Engineer, FinTech Startup',
    ageRange: '30-35',
    homeNeighborhood: 'Hell\'s Kitchen, Manhattan',
    workLocation: 'Chelsea, Manhattan'
  },

  keyFindings: [
    '🚨 CRITICAL: 2:47 AM meeting at industrial warehouse with 3-4 unidentified associates',
    '⚠️  Unusual storage facility access during work hours (45-minute dwell time)',
    '⚠️  Multiple parking garage meetings suggestive of drop-offs or exchanges',
    '📊 Deviation from established routine on Days 2-3',
    '🔍 No flight booking despite 90-minute LaGuardia Terminal B presence',
    '🏨 Hotel visit without guest registration (possible safe house)'
  ],

  locations: [
    {
      name: 'Apartment Building, 515 W 52nd St',
      address: '515 W 52nd St, New York, NY 10019',
      lat: 40.7661,
      lng: -73.9912,
      type: 'residence',
      day: 1,
      time: '07:00',
      dwellMinutes: 480,
      significance: 'routine',
      notes: 'Subject\'s primary residence. Luxury apartment building, rent $4,500/month. Established residency 2 years.'
    },
    {
      name: 'Tech Office, 200 Liberty St',
      address: 'Brookfield Place, 200 Liberty St',
      lat: 40.7119,
      lng: -74.0143,
      type: 'workplace',
      day: 1,
      time: '08:30',
      dwellMinutes: 240,
      significance: 'routine',
      notes: 'Confirmed employment at FinTech startup. Badge swipe records confirm regular attendance. Senior engineer role, $180K salary.'
    },
    {
      name: 'Blue Bottle Coffee, Rockefeller Plaza',
      address: '1 Rockefeller Plaza',
      lat: 40.7588,
      lng: -73.9787,
      type: 'commercial',
      day: 1,
      time: '12:30',
      dwellMinutes: 45,
      significance: 'routine',
      notes: 'Regular lunch location (credit card records show 3x/week visits). Meetings with coworkers observed.'
    },
    {
      name: 'Equinox Fitness, Midtown',
      address: '140 E 54th St',
      lat: 40.7586,
      lng: -73.9718,
      type: 'commercial',
      day: 1,
      time: '18:00',
      dwellMinutes: 60,
      significance: 'routine',
      notes: 'Active gym membership, regular evening visits. Pattern consistent with fitness routine.'
    },
    {
      name: 'Eleven Madison Park Restaurant',
      address: '11 Madison Avenue',
      lat: 40.7425,
      lng: -73.9871,
      type: 'commercial',
      day: 1,
      time: '19:00',
      dwellMinutes: 90,
      significance: 'routine',
      notes: 'Upscale dining ($400+ bill). Meeting with known associate (verified non-criminal). Regular social activity.'
    },
    {
      name: 'Icon Parking Garage',
      address: '200 W 54th St',
      lat: 40.7644,
      lng: -73.9827,
      type: 'unknown',
      day: 2,
      time: '12:00',
      dwellMinutes: 15,
      significance: 'suspicious',
      notes: '⚠️  Brief 15-minute stop. Vehicle-to-vehicle exchange suspected. No legitimate business reason for location.'
    },
    {
      name: 'Manhattan Mini Storage',
      address: '500 W 21st St, Chelsea',
      lat: 40.7473,
      lng: -74.0069,
      type: 'meeting',
      day: 2,
      time: '12:15',
      dwellMinutes: 45,
      significance: 'suspicious',
      notes: '⚠️  Extended dwell time at storage facility. Unit rental investigation pending. Possible equipment or currency storage.'
    },
    {
      name: 'Brooklyn Navy Yard Warehouse',
      address: '2 52nd Ave, Brooklyn, NY 11232',
      lat: 40.7007,
      lng: -73.9721,
      type: 'meeting',
      day: 3,
      time: '02:47',
      dwellMinutes: 42,
      significance: 'anomaly',
      notes: '🚨 CRITICAL ANOMALY: Late-night industrial site meeting. 3-4 associates detected via thermal imaging. Heavy equipment observed (possible crypto mining rigs). Recommend immediate warrant.'
    },
    {
      name: 'LaGuardia Airport, Terminal B',
      address: 'LaGuardia Airport, Terminal B',
      lat: 40.7769,
      lng: -73.8740,
      type: 'transport',
      day: 3,
      time: '09:30',
      dwellMinutes: 90,
      significance: 'suspicious',
      notes: '⚠️  No flight booking despite 90-minute presence. Meeting in terminal suspected (courier exchange or contact with arriving associate).'
    },
    {
      name: 'Marriott Marquis Hotel',
      address: '1535 Broadway, Times Square',
      lat: 40.7589,
      lng: -73.9853,
      type: 'meeting',
      day: 3,
      time: '12:00',
      dwellMinutes: 180,
      significance: 'suspicious',
      notes: '⚠️  3-hour hotel visit. Not registered as guest. Room 2847 rented by unknown third party. Surveillance footage shows 2 additional individuals entering room.'
    },
    {
      name: 'Pier 66 Maritime, Hudson River',
      address: 'West 26th St & Hudson River',
      lat: 40.7616,
      lng: -74.0053,
      type: 'meeting',
      day: 3,
      time: '15:00',
      dwellMinutes: 30,
      significance: 'anomaly',
      notes: '🚨 Waterfront meeting location. Isolated area, limited surveillance. Possible exchange or handoff. Recommend harbor patrol alert.'
    }
  ]
}

/**
 * Scenario 2: Operation Night Market
 * Retail employee with suspicious import/export connections
 */
export const SCENARIO_NIGHT_MARKET: InvestigationScenario = {
  id: 'night-market',
  title: 'Operation Night Market',
  description: 'Retail store manager linked to potential smuggling operation via port facilities',

  narrative: `Subject is a 38-year-old retail store manager in Chinatown. Investigation initiated after CBP flagged suspicious import declarations from subject's family business. Pattern analysis reveals regular contact with Brooklyn Red Hook port facilities outside business hours.

Surveillance established baseline routine with residence in Flushing, Queens, and retail management position in Manhattan Chinatown. Anomalous behavior includes late-night warehouse meetings in Sunset Park and regular contact with shipping containers at Red Hook port facility.

Subject's access to import/export channels combined with unexplained wealth (recent $800K real estate purchase) and late-night industrial area activity suggests involvement in smuggling operation. Recommend CBP coordination and warrant for warehouse facility.`,

  subject: {
    profile: 'Small business owner with import/export access, family ties to international shipping, sudden wealth indicators',
    occupation: 'Retail Store Manager, Import Business',
    ageRange: '35-40',
    homeNeighborhood: 'Flushing, Queens',
    workLocation: 'Chinatown, Manhattan'
  },

  keyFindings: [
    '🚨 CRITICAL: Regular late-night access to Red Hook port container facility',
    '⚠️  Sunset Park warehouse meetings with known smuggling associates',
    '⚠️  Pattern of activity correlates with shipping manifests',
    '💰 Unexplained wealth: $800K cash real estate purchase',
    '🔍 International wire transfers to high-risk jurisdictions',
    '📦 Custom declarations inconsistent with observed cargo'
  ],

  locations: [] // Would include Queens, Chinatown, Red Hook, Sunset Park locations
}

/**
 * Get all available scenarios
 */
export function getAllScenarios(): InvestigationScenario[] {
  return [
    SCENARIO_DIGITAL_SHADOW,
    SCENARIO_NIGHT_MARKET
    // More scenarios can be added here
  ]
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): InvestigationScenario | null {
  const scenarios = getAllScenarios()
  return scenarios.find(s => s.id === id) || null
}

/**
 * Get random scenario
 */
export function getRandomScenario(): InvestigationScenario {
  const scenarios = getAllScenarios()
  return scenarios[Math.floor(Math.random() * scenarios.length)]
}
