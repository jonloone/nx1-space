/**
 * Citizens 360 - Operation Nightfall (CT-2024-8473)
 * Counter-terrorism investigation case file
 *
 * ⚠️ DISCLAIMER: All data is FICTIONAL for demonstration purposes only.
 * Real investigations require proper legal authorization.
 */

import type { SubjectProfileData } from '@/lib/types/chatArtifacts'

/**
 * Primary Subject: SUBJECT-2547
 */
export const SUBJECT_2547: SubjectProfileData = {
  subjectId: 'SUBJECT-2547',
  caseNumber: 'CT-2024-8473',
  classification: 'Person of Interest',
  status: 'Under Surveillance',

  // Biographical Information
  name: {
    full: 'Marcus J. Rahman',
    aliases: ['Mark Johnson', 'M. Rahman', 'Abu Khaled']
  },

  demographics: {
    dateOfBirth: '1989-03-15',
    age: 35,
    nationality: ['United States', 'Bangladesh'],
    languages: ['English', 'Bengali', 'Arabic'],
    occupation: 'Software Engineer',
    employer: 'TechCore Solutions LLC'
  },

  // Identity Documents
  identifiers: {
    ssn: 'XXX-XX-2547',
    passports: ['US#543821067', 'BD#BN8472156'],
    driversLicense: 'NY#R2547824910',
    phoneNumbers: ['+1-917-555-0147', '+1-646-555-0892'],
    emailAddresses: ['m.rahman@techcoresolutions.com', 'markjohnson.dev@protonmail.com'],
    socialMedia: {
      twitter: '@mark_codes',
      linkedin: 'marcus-rahman-tech',
      instagram: 'private_acc_2547'
    }
  },

  // Physical Description
  physical: {
    height: '5\'10"',
    weight: '175 lbs',
    build: 'Medium',
    eyeColor: 'Brown',
    hairColor: 'Black',
    distinctiveFeatures: ['Scar on left forearm', 'Wears prescription glasses']
  },

  // Residential Information
  addresses: {
    current: {
      address: '515 W 52nd St, Apt 12B',
      city: 'New York',
      state: 'NY',
      zip: '10019',
      type: 'Apartment',
      since: '2022-06-01',
      ownership: 'Renter'
    },
    previous: [
      {
        address: '420 Kent Ave, Apt 5C',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11249',
        type: 'Apartment',
        duration: '2019-2022'
      }
    ]
  },

  // Employment History
  employment: {
    current: {
      employer: 'TechCore Solutions LLC',
      position: 'Senior Software Engineer',
      since: '2021-03-15',
      salary: '$145,000/year',
      location: '200 Liberty St, New York, NY'
    },
    previous: [
      {
        employer: 'DataSync Inc',
        position: 'Software Developer',
        duration: '2018-2021',
        location: 'Brooklyn, NY'
      },
      {
        employer: 'Freelance Development',
        position: 'Independent Contractor',
        duration: '2016-2018',
        location: 'Various'
      }
    ]
  },

  // Associates & Networks
  associates: [
    {
      id: 'SUBJECT-2548',
      name: 'Hassan Al-Masri',
      relationship: 'Frequent Contact',
      riskLevel: 'high',
      notes: 'Met 8 times in past 30 days. Suspected foreign intelligence connection.'
    },
    {
      id: 'SUBJECT-2549',
      name: 'Aisha Patel',
      relationship: 'Romantic Partner',
      riskLevel: 'medium',
      notes: 'Software engineer at different company. Known to share apartment.'
    },
    {
      id: 'PERSON-7432',
      name: 'David Chen',
      relationship: 'Coworker',
      riskLevel: 'low',
      notes: 'Works in same office. Regular lunch meetings.'
    }
  ],

  // Financial Profile
  financial: {
    bankAccounts: [
      {
        institution: 'Chase Bank',
        type: 'Checking',
        balance: '$12,450',
        activity: 'Normal spending patterns'
      },
      {
        institution: 'Ally Bank',
        type: 'Savings',
        balance: '$45,200',
        activity: 'Regular deposits'
      }
    ],
    creditCards: 3,
    creditScore: 720,
    unusualActivity: [
      'Large cash withdrawal ($8,000) on Oct 12, 2024',
      'Wire transfer to offshore account ($15,000) on Oct 15, 2024'
    ]
  },

  // Travel History
  travel: {
    recentTrips: [
      {
        destination: 'Istanbul, Turkey',
        dates: 'Sep 1-10, 2024',
        purpose: 'Family Visit',
        flagged: true,
        notes: 'Met with individuals of interest'
      },
      {
        destination: 'Dhaka, Bangladesh',
        dates: 'Jul 15-30, 2024',
        purpose: 'Family Visit',
        flagged: false
      }
    ],
    frequentDestinations: ['Bangladesh', 'Turkey', 'UAE']
  },

  // Behavioral Patterns
  behavior: {
    routines: [
      'Leaves residence 7:30-8:00 AM weekdays',
      'Gym visits 3-4x per week (6:00-7:00 PM)',
      'Weekend cafe meetings in Flatiron district',
      'Late night computer activity (11 PM - 2 AM frequent)'
    ],
    deviations: [
      'Unusual 2 AM departures on Oct 14, 16, 18',
      'Midday trips to industrial Brooklyn (not near residence/work)',
      'Use of secondary phone during suspicious meetings'
    ],
    riskIndicators: [
      'Use of encrypted messaging (Signal, Telegram)',
      'Counter-surveillance aware behavior',
      'Meetings at unusual locations/times',
      'Inconsistent statements about activities'
    ]
  },

  // Intelligence Assessment
  intelligence: {
    threatLevel: 'MEDIUM-HIGH',
    confidence: 'MODERATE',
    assessmentDate: new Date(),
    keyFindings: [
      'Subject demonstrates pattern of contact with individuals linked to extremist ideology',
      'Recent foreign travel to high-risk regions coincides with concerning financial transactions',
      'Technical skills (software engineering, encryption) could facilitate operational planning',
      'Behavioral anomalies suggest possible coordination with external actors'
    ],
    recommendations: [
      'Continue 24/7 surveillance for 72 hours',
      'FISA warrant for electronic communications',
      'Coordinate with CT Division for associate surveillance',
      'Monitor all financial transactions in real-time'
    ]
  },

  // Legal Authorization
  legalAuth: {
    warrant: 'Federal Warrant #2024-CT-8473',
    issuedBy: 'USDC SDNY',
    issuedDate: new Date('2024-10-01'),
    expirationDate: new Date('2024-12-01'),
    scope: 'Electronic surveillance, physical surveillance, financial records access',
    leadInvestigator: 'SA Jennifer Martinez, FBI JTTF'
  },

  timeline: {
    totalEvents: 247,
    dateRange: {
      start: new Date(Date.now() - 72 * 60 * 60 * 1000),
      end: new Date()
    },
    keyEvents: [
      {
        timestamp: new Date(Date.now() - 68 * 60 * 60 * 1000),
        type: 'meeting',
        description: 'Meeting with SUBJECT-2548 at warehouse location'
      },
      {
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        type: 'financial',
        description: 'Large cash withdrawal from ATM'
      },
      {
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'communication',
        description: 'Encrypted communication session detected'
      }
    ]
  }
}

/**
 * Associate Subject: SUBJECT-2548
 */
export const SUBJECT_2548: SubjectProfileData = {
  subjectId: 'SUBJECT-2548',
  caseNumber: 'CT-2024-8473',
  classification: 'Associate - High Risk',
  status: 'Under Surveillance',

  name: {
    full: 'Hassan Al-Masri',
    aliases: ['H. Masri', 'Abu Mohammed']
  },

  demographics: {
    dateOfBirth: '1985-07-22',
    age: 39,
    nationality: ['Syria', 'Germany'],
    languages: ['Arabic', 'English', 'German'],
    occupation: 'Import/Export Consultant',
    employer: 'Global Trade Solutions'
  },

  identifiers: {
    ssn: 'XXX-XX-2548',
    passports: ['DE#C7829415', 'SY#S2847156'],
    driversLicense: 'NY#M8521473695',
    phoneNumbers: ['+1-718-555-0293', '+49-30-5550178'],
    emailAddresses: ['h.almasri@globaltrade.com', 'contact@hmasri.net']
  },

  physical: {
    height: '6\'1"',
    weight: '190 lbs',
    build: 'Athletic',
    eyeColor: 'Brown',
    hairColor: 'Black',
    distinctiveFeatures: ['Full beard', 'Tattoo on right shoulder']
  },

  addresses: {
    current: {
      address: '1847 E 18th St',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11229',
      type: 'House',
      since: '2020-01-15',
      ownership: 'Owner'
    },
    previous: []
  },

  associates: [
    {
      id: 'SUBJECT-2547',
      name: 'Marcus J. Rahman',
      relationship: 'Frequent Contact',
      riskLevel: 'high',
      notes: 'Primary subject. Multiple suspicious meetings documented.'
    }
  ],

  behavior: {
    routines: [
      'Irregular schedule - no fixed work hours',
      'Frequent international calls',
      'Weekly mosque attendance'
    ],
    deviations: [
      'Late night meetings at industrial locations',
      'Use of multiple phones',
      'Counter-surveillance techniques observed'
    ],
    riskIndicators: [
      'Prior travel to conflict zones',
      'Known contacts with designated terrorist organizations',
      'Sophisticated operational security practices'
    ]
  },

  intelligence: {
    threatLevel: 'HIGH',
    confidence: 'HIGH',
    assessmentDate: new Date(),
    keyFindings: [
      'Subject has documented ties to foreign intelligence services',
      'Prior travel to Syria during ISIS territorial control (2015-2016)',
      'Suspected role as handler/coordinator for domestic operatives',
      'Intercepted communications suggest planning of significant operation'
    ],
    recommendations: [
      'Immediate escalation to FBI CT Division leadership',
      'Consider detention if probable cause develops',
      'Coordinate with international partners (BND, MI6)',
      'Full electronic surveillance package'
    ]
  },

  legalAuth: {
    warrant: 'Federal Warrant #2024-CT-8473-A',
    issuedBy: 'USDC SDNY',
    issuedDate: new Date('2024-10-01'),
    expirationDate: new Date('2024-12-01'),
    scope: 'Full surveillance authority',
    leadInvestigator: 'SA Jennifer Martinez, FBI JTTF'
  },

  timeline: {
    totalEvents: 189,
    dateRange: {
      start: new Date(Date.now() - 72 * 60 * 60 * 1000),
      end: new Date()
    },
    keyEvents: []
  }
}

/**
 * Associate Subject: SUBJECT-2549
 */
export const SUBJECT_2549: SubjectProfileData = {
  subjectId: 'SUBJECT-2549',
  caseNumber: 'CT-2024-8473',
  classification: 'Associate - Low Risk',
  status: 'Monitoring',

  name: {
    full: 'Aisha Patel',
    aliases: []
  },

  demographics: {
    dateOfBirth: '1991-11-08',
    age: 32,
    nationality: ['United States'],
    languages: ['English', 'Hindi'],
    occupation: 'Software Engineer',
    employer: 'DataFlow Technologies'
  },

  identifiers: {
    ssn: 'XXX-XX-2549',
    passports: ['US#729156842'],
    driversLicense: 'NY#P5642981730',
    phoneNumbers: ['+1-917-555-0621'],
    emailAddresses: ['aisha.patel@dataflow.com', 'aisha.codes@gmail.com']
  },

  physical: {
    height: '5\'6"',
    weight: '130 lbs',
    build: 'Slim',
    eyeColor: 'Brown',
    hairColor: 'Black',
    distinctiveFeatures: ['Wears glasses']
  },

  addresses: {
    current: {
      address: '515 W 52nd St, Apt 12B',
      city: 'New York',
      state: 'NY',
      zip: '10019',
      type: 'Apartment',
      since: '2023-03-01',
      ownership: 'Renter (shares with SUBJECT-2547)'
    },
    previous: []
  },

  associates: [
    {
      id: 'SUBJECT-2547',
      name: 'Marcus J. Rahman',
      relationship: 'Romantic Partner',
      riskLevel: 'unknown',
      notes: 'Lives together. Appears unaware of subject\'s suspicious activities.'
    }
  ],

  behavior: {
    routines: [
      'Regular 9-5 work schedule',
      'Yoga classes 3x per week',
      'Weekend social activities with tech industry friends'
    ],
    deviations: [],
    riskIndicators: [
      'No concerning indicators observed',
      'Appears to be unwitting associate'
    ]
  },

  intelligence: {
    threatLevel: 'LOW',
    confidence: 'HIGH',
    assessmentDate: new Date(),
    keyFindings: [
      'Subject appears to have no knowledge of SUBJECT-2547\'s activities',
      'Normal behavioral patterns consistent with career professional',
      'No suspicious contacts or communications detected',
      'Recommend continued monitoring but no active targeting'
    ],
    recommendations: [
      'Passive monitoring only',
      'May be valuable for intelligence on SUBJECT-2547 routines',
      'Consider for interview if case escalates'
    ]
  },

  legalAuth: {
    warrant: 'Covered under Federal Warrant #2024-CT-8473',
    issuedBy: 'USDC SDNY',
    issuedDate: new Date('2024-10-01'),
    expirationDate: new Date('2024-12-01'),
    scope: 'Incidental collection only',
    leadInvestigator: 'SA Jennifer Martinez, FBI JTTF'
  },

  timeline: {
    totalEvents: 45,
    dateRange: {
      start: new Date(Date.now() - 72 * 60 * 60 * 1000),
      end: new Date()
    },
    keyEvents: []
  }
}

/**
 * Get all subjects for this case
 */
export function getAllSubjects(): SubjectProfileData[] {
  return [SUBJECT_2547, SUBJECT_2548, SUBJECT_2549]
}

/**
 * Get subject by ID
 */
export function getSubjectById(subjectId: string): SubjectProfileData | null {
  const subjects = getAllSubjects()
  return subjects.find(s => s.subjectId === subjectId) || null
}

/**
 * Get primary subject
 */
export function getPrimarySubject(): SubjectProfileData {
  return SUBJECT_2547
}
