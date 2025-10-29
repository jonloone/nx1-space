/**
 * Citizens 360 - Investigation Cases Index
 * Central registry of all available investigation cases
 */

export interface CaseMetadata {
  caseNumber: string
  codename: string
  classification: 'counter-terrorism' | 'organized-crime' | 'corruption' | 'missing-person' | 'financial-crime'
  jurisdiction: string
  leadAgency: string
  status: 'active' | 'monitoring' | 'closed' | 'archived'
  priority: 'critical' | 'high' | 'medium' | 'low'
  startDate: Date
  lastUpdated: Date
  subjectCount: number
  city: string
  briefing: string
  tags: string[]
}

/**
 * Available investigation cases in Citizens 360
 *
 * NOTE: Currently only CT-2024-8473 has full data implementation.
 * Other cases are commented out to avoid runtime errors.
 */
export const INVESTIGATION_CASES: Record<string, CaseMetadata> = {
  'CT-2024-8473': {
    caseNumber: 'CT-2024-8473',
    codename: 'Operation Nightfall',
    classification: 'counter-terrorism',
    jurisdiction: 'Federal (SDNY)',
    leadAgency: 'FBI Joint Terrorism Task Force',
    status: 'active',
    priority: 'critical',
    startDate: new Date('2024-09-15'),
    lastUpdated: new Date(),
    subjectCount: 3,
    city: 'New York, NY',
    briefing: 'Counter-terrorism investigation tracking suspected coordination between domestic and foreign actors. 72-hour surveillance operation in NYC metro area.',
    tags: ['terrorism', 'surveillance', 'nyc', 'multi-subject']
  }

  // TODO: Implement data for these cases
  /*
  'OC-2024-3721': {
    caseNumber: 'OC-2024-3721',
    codename: 'Operation Golden Gate',
    classification: 'organized-crime',
    jurisdiction: 'Federal (ND Cal)',
    leadAgency: 'DEA San Francisco Division',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-08-01'),
    lastUpdated: new Date(),
    subjectCount: 5,
    city: 'San Francisco, CA',
    briefing: 'Multi-agency investigation into transnational drug trafficking organization operating in SF Bay Area. Focus on distribution network and money laundering operations.',
    tags: ['narcotics', 'organized-crime', 'money-laundering', 'san-francisco']
  },

  'CR-2024-5512': {
    caseNumber: 'CR-2024-5512',
    codename: 'Operation Steel City',
    classification: 'corruption',
    jurisdiction: 'State (Pennsylvania AG)',
    leadAgency: 'Pennsylvania State Police',
    status: 'monitoring',
    priority: 'high',
    startDate: new Date('2024-07-10'),
    lastUpdated: new Date(),
    subjectCount: 4,
    city: 'Pittsburgh, PA',
    briefing: 'Public corruption investigation involving city officials and contractors. Pattern-of-life analysis on key subjects during bid rigging investigation.',
    tags: ['corruption', 'public-officials', 'pittsburgh', 'financial']
  },

  'MP-2024-7834': {
    caseNumber: 'MP-2024-7834',
    codename: 'Operation Aurora',
    classification: 'missing-person',
    jurisdiction: 'Federal (FBI)',
    leadAgency: 'FBI Violent Crimes Division',
    status: 'active',
    priority: 'critical',
    startDate: new Date('2024-10-01'),
    lastUpdated: new Date(),
    subjectCount: 2,
    city: 'Seattle, WA',
    briefing: 'Missing persons case involving suspected human trafficking. Tracking vehicles and known associates. Timeline reconstruction from cell tower data.',
    tags: ['missing-person', 'trafficking', 'seattle', 'time-critical']
  },

  'FC-2024-6249': {
    caseNumber: 'FC-2024-6249',
    codename: 'Operation Silk Road 2.0',
    classification: 'financial-crime',
    jurisdiction: 'Federal (SDNY)',
    leadAgency: 'Secret Service',
    status: 'active',
    priority: 'medium',
    startDate: new Date('2024-06-15'),
    lastUpdated: new Date(),
    subjectCount: 6,
    city: 'Miami, FL',
    briefing: 'Cryptocurrency fraud and money laundering investigation. Tracking movement of key individuals between Miami, NYC, and offshore locations.',
    tags: ['financial-crime', 'cryptocurrency', 'money-laundering', 'miami']
  }
  */
}

/**
 * Get all available cases
 */
export function getAllCases(): CaseMetadata[] {
  return Object.values(INVESTIGATION_CASES).sort((a, b) =>
    b.lastUpdated.getTime() - a.lastUpdated.getTime()
  )
}

/**
 * Get cases by status
 */
export function getCasesByStatus(status: CaseMetadata['status']): CaseMetadata[] {
  return getAllCases().filter(c => c.status === status)
}

/**
 * Get cases by priority
 */
export function getCasesByPriority(priority: CaseMetadata['priority']): CaseMetadata[] {
  return getAllCases().filter(c => c.priority === priority)
}

/**
 * Get case by number
 */
export function getCaseByNumber(caseNumber: string): CaseMetadata | null {
  return INVESTIGATION_CASES[caseNumber] || null
}

/**
 * Search cases by tags or briefing
 */
export function searchCases(query: string): CaseMetadata[] {
  const lowerQuery = query.toLowerCase()
  return getAllCases().filter(c =>
    c.tags.some(tag => tag.includes(lowerQuery)) ||
    c.briefing.toLowerCase().includes(lowerQuery) ||
    c.codename.toLowerCase().includes(lowerQuery) ||
    c.city.toLowerCase().includes(lowerQuery)
  )
}
