/**
 * Competitor Ground Station Database for Intelligence Platform
 * 
 * Comprehensive database of major satellite operator ground stations including:
 * - AWS Ground Station locations
 * - Telesat ground infrastructure  
 * - SpaceX Starlink Gateway sites
 * - KSAT polar specialist stations
 * 
 * Each station includes technical capabilities, threat assessment, and market impact analysis
 */

export interface CompetitorStation {
  // Station Identity
  stationId: string;
  name: string;
  operator: 'AWS Ground Station' | 'Telesat' | 'SpaceX Starlink' | 'KSAT' | 'Other';
  country: string;
  region: string;
  coordinates: [number, number]; // [lat, lon]
  
  // Technical Capabilities
  capabilities: {
    frequencyBands: Array<'L-band' | 'S-band' | 'C-band' | 'X-band' | 'Ku-band' | 'Ka-band' | 'V-band'>;
    services: Array<'LEO' | 'MEO' | 'GEO' | 'Data Downlink' | 'TT&C' | 'Internet Backhaul' | 'Cloud Services' | 'Government' | 'Commercial'>;
    estimatedCapacityGbps: number;
    antennaCount: number;
    maxAntennaSize: number; // meters
    specializations: string[];
  };
  
  // Market Intelligence
  marketPosition: {
    threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
    marketShare: number; // percentage in region
    competitiveAdvantages: string[];
    weaknesses: string[];
    targetMarkets: string[];
    estimatedRevenue: number; // monthly USD
  };
  
  // Operational Status
  operational: {
    status: 'Operational' | 'Under Construction' | 'Planned' | 'Decommissioned';
    operationalSince: string; // YYYY-MM format
    availabilityPercent: number;
    maintenanceWindows: string;
    weatherConstraints: string[];
  };
  
  // Strategic Assessment
  intelligence: {
    expansionPlans: string[];
    recentUpgrades: string[];
    partnerships: string[];
    regulatoryStatus: 'Licensed' | 'Pending' | 'Restricted';
    geopoliticalFactors: string[];
  };
}

export interface CompetitorAnalysis {
  totalStations: number;
  operatorBreakdown: Record<string, number>;
  regionBreakdown: Record<string, number>;
  threatMatrix: {
    critical: CompetitorStation[];
    high: CompetitorStation[];
    medium: CompetitorStation[];
    low: CompetitorStation[];
  };
  competitiveGaps: {
    location: [number, number];
    gapType: 'Coverage' | 'Capacity' | 'Technology' | 'Market Access';
    severity: 'High' | 'Medium' | 'Low';
    opportunity: string;
    investment: number;
  }[];
}

/**
 * AWS Ground Station Locations - Cloud-integrated satellite communications
 */
export const AWS_GROUND_STATIONS: CompetitorStation[] = [
  {
    stationId: 'AWS-ORE-001',
    name: 'Oregon Ground Station',
    operator: 'AWS Ground Station',
    country: 'USA',
    region: 'North America',
    coordinates: [45.5152, -122.6784],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 50,
      antennaCount: 12,
      maxAntennaSize: 7.3,
      specializations: ['Real-time data processing', 'AWS cloud integration', 'Machine learning analytics']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 25,
      competitiveAdvantages: ['Seamless cloud integration', 'Pay-as-you-go pricing', 'Global AWS infrastructure'],
      weaknesses: ['Limited GEO support', 'Newer market entrant'],
      targetMarkets: ['Earth observation', 'IoT', 'Weather services'],
      estimatedRevenue: 2800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2019-05',
      availabilityPercent: 98.5,
      maintenanceWindows: 'Sunday 02:00-06:00 PST',
      weatherConstraints: ['Rain fade', 'Snow accumulation']
    },
    intelligence: {
      expansionPlans: ['Additional dish installations planned', 'Ka-band capability upgrade'],
      recentUpgrades: ['Added machine learning data processing (2024)', 'Increased automation (2023)'],
      partnerships: ['NASA', 'NOAA', 'Major EO satellite operators'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['US export control restrictions', 'ITAR compliance requirements']
    }
  },
  {
    stationId: 'AWS-OHI-002',
    name: 'Ohio Ground Station',
    operator: 'AWS Ground Station',
    country: 'USA',
    region: 'North America',
    coordinates: [39.9612, -82.9988],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'Data Downlink', 'Cloud Services', 'Government'],
      estimatedCapacityGbps: 45,
      antennaCount: 10,
      maxAntennaSize: 7.3,
      specializations: ['Government services', 'Secure data processing', 'Real-time analytics']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 20,
      competitiveAdvantages: ['Central US location', 'Government contracts', 'Security clearances'],
      weaknesses: ['Weather sensitivity', 'Limited international reach'],
      targetMarkets: ['US Government', 'Defense contractors', 'Agricultural monitoring'],
      estimatedRevenue: 2200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2020-03',
      availabilityPercent: 97.8,
      maintenanceWindows: 'Tuesday 01:00-05:00 EST',
      weatherConstraints: ['Thunderstorms', 'Ice storms', 'Tornadoes']
    },
    intelligence: {
      expansionPlans: ['Security facility upgrades', 'Redundant system installation'],
      recentUpgrades: ['Enhanced encryption systems (2024)', 'Automated anomaly detection (2023)'],
      partnerships: ['US Space Force', 'DoD contractors', 'Intelligence agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['National security priority', 'Restricted foreign access']
    }
  },
  {
    stationId: 'AWS-IRE-003',
    name: 'Ireland Ground Station',
    operator: 'AWS Ground Station',
    country: 'Ireland',
    region: 'Europe',
    coordinates: [53.3498, -6.2603],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 55,
      antennaCount: 14,
      maxAntennaSize: 9.1,
      specializations: ['European coverage', 'GDPR compliance', 'Multi-language support']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 30,
      competitiveAdvantages: ['EU data sovereignty', 'Strategic Atlantic location', 'English-speaking'],
      weaknesses: ['Weather challenges', 'Limited polar coverage'],
      targetMarkets: ['European enterprises', 'Climate monitoring', 'Maritime services'],
      estimatedRevenue: 3200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2020-11',
      availabilityPercent: 96.5,
      maintenanceWindows: 'Wednesday 02:00-06:00 GMT',
      weatherConstraints: ['Atlantic storms', 'High winds', 'Rain fade']
    },
    intelligence: {
      expansionPlans: ['Additional European sites under consideration', 'Arctic coverage expansion'],
      recentUpgrades: ['GDPR compliance systems (2024)', 'Enhanced storm tracking (2023)'],
      partnerships: ['ESA', 'European satellite operators', 'Climate research institutions'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Brexit implications', 'EU digital sovereignty', 'NATO considerations']
    }
  },
  {
    stationId: 'AWS-STO-004',
    name: 'Stockholm Ground Station',
    operator: 'AWS Ground Station',
    country: 'Sweden',
    region: 'Europe',
    coordinates: [59.3293, 18.0686],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band', 'Ka-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services'],
      estimatedCapacityGbps: 40,
      antennaCount: 8,
      maxAntennaSize: 7.3,
      specializations: ['Arctic coverage', 'Polar orbiting satellites', 'Climate monitoring']
    },
    marketPosition: {
      threatLevel: 'Medium',
      marketShare: 15,
      competitiveAdvantages: ['Polar coverage', 'Neutral country status', 'Advanced technology'],
      weaknesses: ['Small market size', 'Seasonal weather variations'],
      targetMarkets: ['Arctic research', 'Climate monitoring', 'Nordic enterprises'],
      estimatedRevenue: 1800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-06',
      availabilityPercent: 97.2,
      maintenanceWindows: 'Thursday 01:00-05:00 CET',
      weatherConstraints: ['Snow loading', 'Ice storms', 'Aurora interference']
    },
    intelligence: {
      expansionPlans: ['Enhanced polar coverage capabilities', 'Research partnerships expansion'],
      recentUpgrades: ['Ka-band capability added (2024)', 'Cold weather hardening (2023)'],
      partnerships: ['Swedish Space Corporation', 'Arctic research institutions', 'Climate agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['NATO membership', 'Arctic sovereignty', 'Neutral foreign policy']
    }
  },
  {
    stationId: 'AWS-FRA-005',
    name: 'Frankfurt Ground Station',
    operator: 'AWS Ground Station',
    country: 'Germany',
    region: 'Europe',
    coordinates: [50.1109, 8.6821],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 60,
      antennaCount: 16,
      maxAntennaSize: 9.1,
      specializations: ['Central European hub', 'Industrial IoT', 'Automotive applications']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 35,
      competitiveAdvantages: ['Central European location', 'Industrial partnerships', 'Strong economy'],
      weaknesses: ['Regulatory complexity', 'High operational costs'],
      targetMarkets: ['German industry', 'European automotive', 'Manufacturing IoT'],
      estimatedRevenue: 3800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-03',
      availabilityPercent: 98.8,
      maintenanceWindows: 'Monday 02:00-06:00 CET',
      weatherConstraints: ['Rain attenuation', 'Snow interference']
    },
    intelligence: {
      expansionPlans: ['Industrial IoT expansion', 'Automotive partnership growth'],
      recentUpgrades: ['Enhanced processing capacity (2024)', 'Industrial protocol support (2023)'],
      partnerships: ['German aerospace companies', 'Automotive manufacturers', 'Industrial IoT providers'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['EU leadership role', 'Strong data protection laws', 'Industrial policy alignment']
    }
  },
  {
    stationId: 'AWS-SYD-006',
    name: 'Sydney Ground Station',
    operator: 'AWS Ground Station',
    country: 'Australia',
    region: 'Asia-Pacific',
    coordinates: [-33.8688, 151.2093],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services'],
      estimatedCapacityGbps: 45,
      antennaCount: 12,
      maxAntennaSize: 7.3,
      specializations: ['Asia-Pacific coverage', 'Mining applications', 'Disaster response']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 25,
      competitiveAdvantages: ['Pacific coverage', 'Mining industry ties', 'Stable regulatory environment'],
      weaknesses: ['Distance from major markets', 'Limited population base'],
      targetMarkets: ['Mining operations', 'Pacific maritime', 'Disaster management'],
      estimatedRevenue: 2400000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2020-09',
      availabilityPercent: 97.5,
      maintenanceWindows: 'Sunday 02:00-06:00 AEST',
      weatherConstraints: ['Bushfire smoke', 'Cyclone season', 'Rain fade']
    },
    intelligence: {
      expansionPlans: ['Pacific island coverage extension', 'Mining sector partnerships'],
      recentUpgrades: ['Disaster response capabilities (2024)', 'Mining data analytics (2023)'],
      partnerships: ['Australian mining companies', 'Pacific governments', 'Disaster response agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Pacific strategic importance', 'Five Eyes alliance', 'China tensions']
    }
  },
  {
    stationId: 'AWS-SIN-007',
    name: 'Singapore Ground Station',
    operator: 'AWS Ground Station',
    country: 'Singapore',
    region: 'Asia-Pacific',
    coordinates: [1.3521, 103.8198],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band', 'Ka-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 70,
      antennaCount: 18,
      maxAntennaSize: 9.1,
      specializations: ['Southeast Asian hub', 'Maritime tracking', 'Financial services']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 40,
      competitiveAdvantages: ['Strategic location', 'Financial center', 'Advanced infrastructure'],
      weaknesses: ['Limited space for expansion', 'High costs'],
      targetMarkets: ['Financial services', 'Maritime shipping', 'Regional governments'],
      estimatedRevenue: 4200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-01',
      availabilityPercent: 99.2,
      maintenanceWindows: 'Tuesday 02:00-06:00 SGT',
      weatherConstraints: ['Monsoon rains', 'High humidity']
    },
    intelligence: {
      expansionPlans: ['Regional hub expansion', 'Maritime service enhancement'],
      recentUpgrades: ['Ka-band addition (2024)', 'Financial data security (2023)'],
      partnerships: ['ASEAN governments', 'Shipping companies', 'Financial institutions'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Neutral stance', 'Regional stability', 'US-China balance']
    }
  },
  {
    stationId: 'AWS-SEO-008',
    name: 'Seoul Ground Station',
    operator: 'AWS Ground Station',
    country: 'South Korea',
    region: 'Asia-Pacific',
    coordinates: [37.5665, 126.9780],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services'],
      estimatedCapacityGbps: 50,
      antennaCount: 14,
      maxAntennaSize: 7.3,
      specializations: ['5G integration', 'Gaming applications', 'Smart city services']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 30,
      competitiveAdvantages: ['5G leadership', 'Technology innovation', 'Government support'],
      weaknesses: ['Regional tensions', 'Limited geographic reach'],
      targetMarkets: ['5G services', 'Gaming', 'Smart city applications'],
      estimatedRevenue: 2800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-08',
      availabilityPercent: 98.1,
      maintenanceWindows: 'Wednesday 01:00-05:00 KST',
      weatherConstraints: ['Monsoon season', 'Snow storms']
    },
    intelligence: {
      expansionPlans: ['5G satellite integration', 'Smart city partnerships'],
      recentUpgrades: ['5G integration systems (2024)', 'Gaming optimization (2023)'],
      partnerships: ['Korean telecom companies', 'Gaming companies', 'Government agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['North Korea proximity', 'US alliance', 'China economic ties']
    }
  },
  {
    stationId: 'AWS-BAH-009',
    name: 'Bahrain Ground Station',
    operator: 'AWS Ground Station',
    country: 'Bahrain',
    region: 'Middle East',
    coordinates: [26.2285, 50.5860],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Government'],
      estimatedCapacityGbps: 35,
      antennaCount: 8,
      maxAntennaSize: 7.3,
      specializations: ['Middle East coverage', 'Oil & gas monitoring', 'Regional connectivity']
    },
    marketPosition: {
      threatLevel: 'Medium',
      marketShare: 20,
      competitiveAdvantages: ['Strategic Gulf location', 'Regional financial hub', 'Stable government'],
      weaknesses: ['Small domestic market', 'Regional instability'],
      targetMarkets: ['Oil & gas', 'Financial services', 'Regional governments'],
      estimatedRevenue: 1900000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2022-02',
      availabilityPercent: 97.8,
      maintenanceWindows: 'Friday 02:00-06:00 AST',
      weatherConstraints: ['Sandstorms', 'Extreme heat']
    },
    intelligence: {
      expansionPlans: ['Regional coverage expansion', 'Energy sector focus'],
      recentUpgrades: ['Enhanced heat resistance (2024)', 'Energy monitoring systems (2023)'],
      partnerships: ['Gulf energy companies', 'Regional banks', 'Government agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Gulf stability', 'Iran proximity', 'US partnership']
    }
  },
  {
    stationId: 'AWS-CAP-010',
    name: 'Cape Town Ground Station',
    operator: 'AWS Ground Station',
    country: 'South Africa',
    region: 'Africa',
    coordinates: [-33.9249, 18.4241],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services'],
      estimatedCapacityGbps: 40,
      antennaCount: 10,
      maxAntennaSize: 7.3,
      specializations: ['African coverage', 'Mining applications', 'Maritime services']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 35,
      competitiveAdvantages: ['African gateway', 'Mining industry ties', 'Developed infrastructure'],
      weaknesses: ['Power grid instability', 'Economic challenges'],
      targetMarkets: ['African mining', 'Maritime tracking', 'Regional connectivity'],
      estimatedRevenue: 2100000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-11',
      availabilityPercent: 96.2,
      maintenanceWindows: 'Saturday 02:00-06:00 SAST',
      weatherConstraints: ['Cape storms', 'Power outages']
    },
    intelligence: {
      expansionPlans: ['Continental Africa expansion', 'Mining partnership growth'],
      recentUpgrades: ['Backup power systems (2024)', 'Mining data processing (2023)'],
      partnerships: ['South African mining companies', 'Maritime authorities', 'Regional governments'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Regional leadership', 'BRICS membership', 'Infrastructure challenges']
    }
  },
  {
    stationId: 'AWS-SAO-011',
    name: 'São Paulo Ground Station',
    operator: 'AWS Ground Station',
    country: 'Brazil',
    region: 'South America',
    coordinates: [-23.5505, -46.6333],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 55,
      antennaCount: 14,
      maxAntennaSize: 9.1,
      specializations: ['South American hub', 'Agriculture monitoring', 'Rainforest tracking']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 30,
      competitiveAdvantages: ['Largest South American market', 'Agricultural applications', 'Regional coverage'],
      weaknesses: ['Economic volatility', 'Regulatory complexity'],
      targetMarkets: ['Brazilian agriculture', 'Environmental monitoring', 'Regional connectivity'],
      estimatedRevenue: 2600000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2022-04',
      availabilityPercent: 97.1,
      maintenanceWindows: 'Sunday 02:00-06:00 BRT',
      weatherConstraints: ['Thunderstorms', 'Rain fade']
    },
    intelligence: {
      expansionPlans: ['Amazon monitoring expansion', 'Agricultural IoT growth'],
      recentUpgrades: ['Environmental monitoring systems (2024)', 'Agricultural analytics (2023)'],
      partnerships: ['Brazilian agribusiness', 'Environmental agencies', 'Research institutions'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Regional power', 'Amazon sovereignty', 'US relations']
    }
  },
  {
    stationId: 'AWS-MUM-012',
    name: 'Mumbai Ground Station',
    operator: 'AWS Ground Station',
    country: 'India',
    region: 'Asia-Pacific',
    coordinates: [19.0760, 72.8777],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'Cloud Services', 'Commercial'],
      estimatedCapacityGbps: 65,
      antennaCount: 16,
      maxAntennaSize: 9.1,
      specializations: ['Indian market access', 'IT services', 'Rural connectivity']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 25,
      competitiveAdvantages: ['Massive market potential', 'IT expertise', 'Government partnerships'],
      weaknesses: ['Regulatory challenges', 'Infrastructure gaps'],
      targetMarkets: ['Indian enterprises', 'Rural broadband', 'Government services'],
      estimatedRevenue: 3100000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2022-07',
      availabilityPercent: 96.8,
      maintenanceWindows: 'Monday 02:00-06:00 IST',
      weatherConstraints: ['Monsoon rains', 'Cyclone season']
    },
    intelligence: {
      expansionPlans: ['Rural connectivity expansion', 'Government service growth'],
      recentUpgrades: ['Rural broadband capabilities (2024)', 'Government security systems (2023)'],
      partnerships: ['Indian IT companies', 'Government agencies', 'Rural ISPs'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Strategic autonomy', 'China tensions', 'Space program integration']
    }
  }
];

/**
 * Telesat Ground Station Network - Traditional satellite operator with modern MEO constellation
 */
export const TELESAT_GROUND_STATIONS: CompetitorStation[] = [
  {
    stationId: 'TEL-ALL-001',
    name: 'Allan Park',
    operator: 'Telesat',
    country: 'Canada',
    region: 'North America',
    coordinates: [43.8563, -80.3816],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Commercial', 'Government'],
      estimatedCapacityGbps: 180,
      antennaCount: 24,
      maxAntennaSize: 15.0,
      specializations: ['Primary control center', 'Telesat Lightspeed LEO constellation', 'Broadcast services']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 45,
      competitiveAdvantages: ['Established operator', 'Lightspeed constellation', 'Government relationships'],
      weaknesses: ['Legacy infrastructure', 'High capital requirements'],
      targetMarkets: ['North American enterprises', 'Government', 'Broadcast networks'],
      estimatedRevenue: 8500000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1975-01',
      availabilityPercent: 99.5,
      maintenanceWindows: 'Sunday 02:00-06:00 EST',
      weatherConstraints: ['Ice storms', 'Snow loading']
    },
    intelligence: {
      expansionPlans: ['Lightspeed constellation deployment', 'Ka-band expansion', 'Arctic coverage enhancement'],
      recentUpgrades: ['LEO constellation ground infrastructure (2024)', 'Ka-band capability expansion (2023)'],
      partnerships: ['Canadian government', 'US DoD', 'Major broadcasters'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Canadian sovereignty', 'Arctic coverage priority', 'NORAD integration']
    }
  },
  {
    stationId: 'TEL-MOU-002',
    name: 'Mount Jackson',
    operator: 'Telesat',
    country: 'USA',
    region: 'North America',
    coordinates: [38.7609, -78.6389],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Government', 'Commercial'],
      estimatedCapacityGbps: 160,
      antennaCount: 18,
      maxAntennaSize: 13.0,
      specializations: ['US government services', 'Secure communications', 'Backup control center']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 35,
      competitiveAdvantages: ['Government clearances', 'Secure facility', 'Established relationships'],
      weaknesses: ['Aging infrastructure', 'Competition from newer players'],
      targetMarkets: ['US Government', 'Defense contractors', 'Secure communications'],
      estimatedRevenue: 6200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1985-03',
      availabilityPercent: 99.2,
      maintenanceWindows: 'Tuesday 01:00-05:00 EST',
      weatherConstraints: ['Thunderstorms', 'Ice storms']
    },
    intelligence: {
      expansionPlans: ['Security infrastructure upgrades', 'Government contract expansion'],
      recentUpgrades: ['Enhanced security systems (2024)', 'Backup power improvements (2023)'],
      partnerships: ['US Government agencies', 'Defense contractors', 'Intelligence services'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['National security facility', 'Export control compliance', 'Government priority']
    }
  },
  {
    stationId: 'TEL-SAS-003',
    name: 'Saskatoon',
    operator: 'Telesat',
    country: 'Canada',
    region: 'North America',
    coordinates: [52.1579, -106.6702],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 120,
      antennaCount: 14,
      maxAntennaSize: 11.0,
      specializations: ['Rural connectivity', 'Agricultural services', 'Resource monitoring']
    },
    marketPosition: {
      threatLevel: 'Medium',
      marketShare: 25,
      competitiveAdvantages: ['Rural coverage specialist', 'Agricultural expertise', 'Resource sector ties'],
      weaknesses: ['Limited market size', 'Seasonal demand variations'],
      targetMarkets: ['Agricultural operations', 'Resource extraction', 'Rural communities'],
      estimatedRevenue: 3800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1992-06',
      availabilityPercent: 98.8,
      maintenanceWindows: 'Wednesday 02:00-06:00 CST',
      weatherConstraints: ['Blizzards', 'Extreme cold', 'Ice loading']
    },
    intelligence: {
      expansionPlans: ['Agricultural IoT expansion', 'Resource monitoring enhancement'],
      recentUpgrades: ['Agricultural monitoring systems (2024)', 'Cold weather hardening (2023)'],
      partnerships: ['Canadian agricultural companies', 'Resource extraction firms', 'Rural ISPs'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Rural connectivity mandate', 'Resource sovereignty', 'Indigenous partnerships']
    }
  },
  {
    stationId: 'TEL-AUS-004',
    name: 'Aussaguel',
    operator: 'Telesat',
    country: 'France',
    region: 'Europe',
    coordinates: [43.5963, 1.4954],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 140,
      antennaCount: 16,
      maxAntennaSize: 12.0,
      specializations: ['European operations center', 'Broadcast services', 'Maritime coverage']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 30,
      competitiveAdvantages: ['European presence', 'Broadcast expertise', 'Maritime coverage'],
      weaknesses: ['EU regulatory complexity', 'Competition from local operators'],
      targetMarkets: ['European broadcasters', 'Maritime services', 'Government agencies'],
      estimatedRevenue: 5400000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1988-11',
      availabilityPercent: 99.1,
      maintenanceWindows: 'Thursday 02:00-06:00 CET',
      weatherConstraints: ['Mediterranean storms', 'Mistral winds']
    },
    intelligence: {
      expansionPlans: ['Mediterranean coverage expansion', 'Broadcast technology upgrades'],
      recentUpgrades: ['Broadcast infrastructure modernization (2024)', 'Maritime service enhancement (2023)'],
      partnerships: ['European broadcasters', 'Maritime authorities', 'Government agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['EU sovereignty', 'Mediterranean security', 'Brexit implications']
    }
  },
  {
    stationId: 'TEL-HAG-005',
    name: 'Hagerstown',
    operator: 'Telesat',
    country: 'USA',
    region: 'North America',
    coordinates: [39.6417, -77.7200],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band'],
      services: ['GEO', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 90,
      antennaCount: 8,
      maxAntennaSize: 9.0,
      specializations: ['Regional coverage', 'Broadcast distribution', 'Enterprise services']
    },
    marketPosition: {
      threatLevel: 'Medium',
      marketShare: 20,
      competitiveAdvantages: ['East Coast coverage', 'Established customer base', 'Broadcast expertise'],
      weaknesses: ['Limited capacity', 'Aging equipment'],
      targetMarkets: ['Regional broadcasters', 'Enterprise customers', 'Backup services'],
      estimatedRevenue: 2800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1995-08',
      availabilityPercent: 98.5,
      maintenanceWindows: 'Friday 01:00-05:00 EST',
      weatherConstraints: ['Thunderstorms', 'Snow storms']
    },
    intelligence: {
      expansionPlans: ['Capacity upgrade evaluation', 'Service modernization'],
      recentUpgrades: ['Equipment refresh (2023)', 'Network optimization (2022)'],
      partnerships: ['Regional broadcasters', 'Enterprise customers', 'Telecom providers'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Domestic US operations', 'Regional importance']
    }
  },
  {
    stationId: 'TEL-VER-006',
    name: 'Vernon',
    operator: 'Telesat',
    country: 'Canada',
    region: 'North America',
    coordinates: [50.2671, -119.2720],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 110,
      antennaCount: 12,
      maxAntennaSize: 10.0,
      specializations: ['Pacific coverage', 'Resource sector services', 'Mountain communications']
    },
    marketPosition: {
      threatLevel: 'Medium',
      marketShare: 22,
      competitiveAdvantages: ['Pacific gateway', 'Mountain expertise', 'Resource sector ties'],
      weaknesses: ['Remote location', 'Seasonal access challenges'],
      targetMarkets: ['Resource extraction', 'Pacific services', 'Remote communities'],
      estimatedRevenue: 3200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1998-04',
      availabilityPercent: 97.9,
      maintenanceWindows: 'Saturday 02:00-06:00 PST',
      weatherConstraints: ['Mountain weather', 'Snow loading', 'Forest fire smoke']
    },
    intelligence: {
      expansionPlans: ['Pacific coverage enhancement', 'Resource monitoring expansion'],
      recentUpgrades: ['Mountain weather systems (2024)', 'Forest fire monitoring (2023)'],
      partnerships: ['Resource companies', 'Pacific authorities', 'Emergency services'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Pacific sovereignty', 'Resource security', 'Emergency preparedness']
    }
  },
  {
    stationId: 'TEL-RAI-007',
    name: 'Raisting',
    operator: 'Telesat',
    country: 'Germany',
    region: 'Europe',
    coordinates: [47.9020, 11.1105],
    capabilities: {
      frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
      services: ['GEO', 'MEO', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 130,
      antennaCount: 15,
      maxAntennaSize: 11.5,
      specializations: ['Central European operations', 'Industrial services', 'Research partnerships']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 28,
      competitiveAdvantages: ['Central European location', 'Industrial partnerships', 'Technical expertise'],
      weaknesses: ['High operational costs', 'Regulatory complexity'],
      targetMarkets: ['German industry', 'Research institutions', 'European enterprises'],
      estimatedRevenue: 4600000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1986-02',
      availabilityPercent: 99.3,
      maintenanceWindows: 'Sunday 01:00-05:00 CET',
      weatherConstraints: ['Alpine weather', 'Snow loading']
    },
    intelligence: {
      expansionPlans: ['Industrial IoT expansion', 'Research collaboration growth'],
      recentUpgrades: ['Industrial protocol support (2024)', 'Research facility enhancements (2023)'],
      partnerships: ['German industrial companies', 'Research institutions', 'European operators'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['EU industrial policy', 'Research collaboration', 'Alpine communications']
    }
  }
];

/**
 * SpaceX Starlink Gateway Stations - Next-generation LEO constellation ground infrastructure
 */
export const STARLINK_GROUND_STATIONS: CompetitorStation[] = [
  {
    stationId: 'STL-FAI-001',
    name: 'Fairbanks Gateway',
    operator: 'SpaceX Starlink',
    country: 'USA',
    region: 'North America',
    coordinates: [64.8378, -147.7164],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 200,
      antennaCount: 32,
      maxAntennaSize: 6.0,
      specializations: ['Arctic coverage', 'Polar routes', 'High-latitude optimization']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 60,
      competitiveAdvantages: ['Revolutionary constellation', 'Low latency', 'Mass production approach'],
      weaknesses: ['Regulatory challenges', 'Space debris concerns'],
      targetMarkets: ['Rural broadband', 'Aviation', 'Maritime', 'Emergency services'],
      estimatedRevenue: 15000000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2020-08',
      availabilityPercent: 99.8,
      maintenanceWindows: 'Continuous operation with redundancy',
      weatherConstraints: ['Extreme cold', 'Aurora interference', 'Ice formation']
    },
    intelligence: {
      expansionPlans: ['Gateway capacity increases', 'Polar coverage enhancement', 'Military service development'],
      recentUpgrades: ['Military encryption capabilities (2024)', 'Enhanced polar tracking (2023)'],
      partnerships: ['US Military', 'Airlines', 'Emergency services', 'Rural ISPs'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Arctic sovereignty', 'Military applications', 'Space debris mitigation']
    }
  },
  {
    stationId: 'STL-RED-002',
    name: 'Redmond Gateway',
    operator: 'SpaceX Starlink',
    country: 'USA',
    region: 'North America',
    coordinates: [47.6740, -122.1215],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 250,
      antennaCount: 40,
      maxAntennaSize: 6.0,
      specializations: ['West Coast coverage', 'Pacific routes', 'Tech industry services']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 55,
      competitiveAdvantages: ['Tech industry proximity', 'Innovation center', 'High-value market'],
      weaknesses: ['High competition', 'Regulatory scrutiny'],
      targetMarkets: ['Tech companies', 'Pacific aviation', 'Maritime Pacific', 'Rural west coast'],
      estimatedRevenue: 18000000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2019-11',
      availabilityPercent: 99.9,
      maintenanceWindows: 'Redundant operation - no scheduled downtime',
      weatherConstraints: ['Rain fade', 'Pacific storms']
    },
    intelligence: {
      expansionPlans: ['Pacific coverage enhancement', 'Enterprise service development', 'International expansion'],
      recentUpgrades: ['Enterprise service capabilities (2024)', 'Pacific route optimization (2023)'],
      partnerships: ['Tech companies', 'Airlines', 'Maritime companies', 'Government agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Tech industry relations', 'Pacific strategy', 'Innovation leadership']
    }
  },
  {
    stationId: 'STL-ROL-003',
    name: 'Rolleston Gateway',
    operator: 'SpaceX Starlink',
    country: 'New Zealand',
    region: 'Oceania',
    coordinates: [-43.6031, 172.3886],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 180,
      antennaCount: 28,
      maxAntennaSize: 6.0,
      specializations: ['Southern Pacific coverage', 'Antarctic support', 'Rural New Zealand']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 45,
      competitiveAdvantages: ['Southern hemisphere coverage', 'Antarctic proximity', 'Advanced infrastructure'],
      weaknesses: ['Small local market', 'Distance from major populations'],
      targetMarkets: ['New Zealand rural', 'Antarctic research', 'Pacific islands', 'Maritime'],
      estimatedRevenue: 8500000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-03',
      availabilityPercent: 99.6,
      maintenanceWindows: 'Redundant systems - minimal downtime',
      weatherConstraints: ['Southern ocean storms', 'High winds']
    },
    intelligence: {
      expansionPlans: ['Antarctic coverage enhancement', 'Pacific island connectivity', 'Research partnerships'],
      recentUpgrades: ['Antarctic communication systems (2024)', 'Storm hardening (2023)'],
      partnerships: ['New Zealand government', 'Antarctic research organizations', 'Pacific governments'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Antarctic Treaty compliance', 'Pacific island relations', 'Five Eyes alliance']
    }
  },
  {
    stationId: 'STL-BUD-004',
    name: 'Bude Gateway',
    operator: 'SpaceX Starlink',
    country: 'United Kingdom',
    region: 'Europe',
    coordinates: [50.8264, -4.5427],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 220,
      antennaCount: 35,
      maxAntennaSize: 6.0,
      specializations: ['UK coverage', 'North Atlantic routes', 'European connectivity']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 40,
      competitiveAdvantages: ['European market entry', 'Atlantic coverage', 'Advanced technology'],
      weaknesses: ['Brexit complications', 'EU regulatory challenges'],
      targetMarkets: ['UK rural broadband', 'North Atlantic aviation', 'European enterprises'],
      estimatedRevenue: 12500000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-07',
      availabilityPercent: 99.5,
      maintenanceWindows: 'Redundant operation model',
      weatherConstraints: ['Atlantic storms', 'Coastal weather']
    },
    intelligence: {
      expansionPlans: ['European market expansion', 'Atlantic route optimization', 'Enterprise services'],
      recentUpgrades: ['European service optimization (2024)', 'Atlantic route enhancements (2023)'],
      partnerships: ['UK government', 'Airlines', 'European connectivity providers'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Brexit implications', 'European competition', 'Atlantic alliance']
    }
  },
  {
    stationId: 'STL-PUN-005',
    name: 'Punta Arenas Gateway',
    operator: 'SpaceX Starlink',
    country: 'Chile',
    region: 'South America',
    coordinates: [-53.1638, -70.9171],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 160,
      antennaCount: 25,
      maxAntennaSize: 6.0,
      specializations: ['Southern cone coverage', 'Antarctic support', 'Extreme latitude operations']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 35,
      competitiveAdvantages: ['Southernmost gateway', 'Antarctic proximity', 'Unique coverage'],
      weaknesses: ['Remote location', 'Limited local market'],
      targetMarkets: ['Patagonian operations', 'Antarctic research', 'Southern maritime', 'Remote mining'],
      estimatedRevenue: 6200000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2021-12',
      availabilityPercent: 99.1,
      maintenanceWindows: 'Seasonal maintenance windows',
      weatherConstraints: ['Patagonian winds', 'Extreme weather', 'Seasonal variations']
    },
    intelligence: {
      expansionPlans: ['Antarctic service enhancement', 'Patagonian coverage expansion', 'Maritime services'],
      recentUpgrades: ['Extreme weather hardening (2024)', 'Antarctic optimization (2023)'],
      partnerships: ['Chilean government', 'Antarctic research', 'Mining companies', 'Maritime authorities'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Antarctic Treaty', 'Regional cooperation', 'Resource extraction support']
    }
  },
  {
    stationId: 'STL-BRO-006',
    name: 'Broken Hill Gateway',
    operator: 'SpaceX Starlink',
    country: 'Australia',
    region: 'Oceania',
    coordinates: [-31.9590, 141.4650],
    capabilities: {
      frequencyBands: ['Ku-band', 'Ka-band'],
      services: ['LEO', 'Internet Backhaul', 'Commercial'],
      estimatedCapacityGbps: 190,
      antennaCount: 30,
      maxAntennaSize: 6.0,
      specializations: ['Australian outback coverage', 'Mining operations', 'Remote area connectivity']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 50,
      competitiveAdvantages: ['Outback coverage specialist', 'Mining industry ties', 'Remote area expertise'],
      weaknesses: ['Harsh environment', 'Maintenance challenges'],
      targetMarkets: ['Mining operations', 'Remote communities', 'Australian rural', 'Emergency services'],
      estimatedRevenue: 9800000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2022-01',
      availabilityPercent: 98.9,
      maintenanceWindows: 'Remote maintenance challenges',
      weatherConstraints: ['Dust storms', 'Extreme heat', 'Flash flooding']
    },
    intelligence: {
      expansionPlans: ['Outback coverage enhancement', 'Mining service expansion', 'Emergency service development'],
      recentUpgrades: ['Mining operation optimization (2024)', 'Dust storm mitigation (2023)'],
      partnerships: ['Australian mining companies', 'Emergency services', 'Remote communities'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['National infrastructure priority', 'Emergency preparedness', 'Mining sector support']
    }
  }
];

/**
 * KSAT Polar Specialist Stations - Arctic and Antarctic communication specialists
 */
export const KSAT_GROUND_STATIONS: CompetitorStation[] = [
  {
    stationId: 'KSA-SVA-001',
    name: 'Svalbard Satellite Station',
    operator: 'KSAT',
    country: 'Norway',
    region: 'Arctic',
    coordinates: [78.9230, 11.9606],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band', 'Ka-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'TT&C', 'Commercial', 'Government'],
      estimatedCapacityGbps: 120,
      antennaCount: 20,
      maxAntennaSize: 13.0,
      specializations: ['Polar orbiting satellites', 'Arctic research', 'Climate monitoring', 'Defense applications']
    },
    marketPosition: {
      threatLevel: 'Critical',
      marketShare: 85,
      competitiveAdvantages: ['Unique polar location', 'Monopoly on high-latitude passes', 'Climate research expertise'],
      weaknesses: ['Extreme environment challenges', 'Limited accessibility'],
      targetMarkets: ['Polar research', 'Climate monitoring', 'Defense surveillance', 'Earth observation'],
      estimatedRevenue: 18000000
    },
    operational: {
      status: 'Operational',
      operationalSince: '1997-05',
      availabilityPercent: 99.2,
      maintenanceWindows: 'Summer accessibility periods',
      weatherConstraints: ['Polar night', 'Extreme cold', 'Blizzards', 'Aurora interference']
    },
    intelligence: {
      expansionPlans: ['Capacity expansion', 'Arctic coverage enhancement', 'New frequency band additions'],
      recentUpgrades: ['Ka-band addition (2024)', 'Enhanced polar tracking (2023)', 'Climate monitoring systems (2022)'],
      partnerships: ['NASA', 'ESA', 'Arctic research institutions', 'Defense agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Arctic sovereignty', 'Climate research priority', 'Military surveillance', 'International cooperation']
    }
  },
  {
    stationId: 'KSA-TRO-002',
    name: 'Troll Antarctica',
    operator: 'KSAT',
    country: 'Antarctica',
    region: 'Antarctic',
    coordinates: [-72.0117, 2.5350],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'Data Downlink', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 80,
      antennaCount: 12,
      maxAntennaSize: 11.0,
      specializations: ['Antarctic operations', 'Polar research support', 'Extreme environment operations']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 95,
      competitiveAdvantages: ['Unique Antarctic location', 'Monopoly on southern polar passes', 'Research expertise'],
      weaknesses: ['Extreme logistical challenges', 'Seasonal accessibility', 'High operational costs'],
      targetMarkets: ['Antarctic research', 'Climate studies', 'Polar satellite operations', 'International research'],
      estimatedRevenue: 12000000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2005-12',
      availabilityPercent: 97.8,
      maintenanceWindows: 'Summer season only',
      weatherConstraints: ['Polar winter darkness', 'Katabatic winds', 'Extreme cold', 'Isolation periods']
    },
    intelligence: {
      expansionPlans: ['Research collaboration expansion', 'Technology upgrades during summer seasons'],
      recentUpgrades: ['Environmental hardening (2024)', 'Research data systems (2023)'],
      partnerships: ['International Antarctic research programs', 'Climate research institutions', 'Polar agencies'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Antarctic Treaty obligations', 'International research cooperation', 'Climate monitoring priority']
    }
  },
  {
    stationId: 'KSA-PUN-003',
    name: 'Punta Arenas',
    operator: 'KSAT',
    country: 'Chile',
    region: 'South America',
    coordinates: [-53.1638, -70.9171],
    capabilities: {
      frequencyBands: ['S-band', 'X-band', 'Ku-band'],
      services: ['LEO', 'MEO', 'Data Downlink', 'TT&C', 'Commercial'],
      estimatedCapacityGbps: 100,
      antennaCount: 16,
      maxAntennaSize: 12.0,
      specializations: ['Southern hemisphere operations', 'Antarctic support', 'Polar research coordination']
    },
    marketPosition: {
      threatLevel: 'High',
      marketShare: 40,
      competitiveAdvantages: ['Southern cone coverage', 'Antarctic gateway', 'Research partnerships'],
      weaknesses: ['Competition from Starlink', 'Remote location challenges'],
      targetMarkets: ['Antarctic logistics', 'Southern research', 'Polar operations', 'Regional connectivity'],
      estimatedRevenue: 8500000
    },
    operational: {
      status: 'Operational',
      operationalSince: '2008-03',
      availabilityPercent: 98.5,
      maintenanceWindows: 'Seasonal optimization',
      weatherConstraints: ['Patagonian winds', 'Seasonal storms', 'Antarctic weather patterns']
    },
    intelligence: {
      expansionPlans: ['Antarctic support enhancement', 'Regional coverage expansion', 'Research partnerships'],
      recentUpgrades: ['Antarctic communication systems (2024)', 'Weather hardening (2023)'],
      partnerships: ['Antarctic research programs', 'Chilean government', 'Regional research institutions'],
      regulatoryStatus: 'Licensed',
      geopoliticalFactors: ['Antarctic Treaty support', 'Regional cooperation', 'Research facilitation']
    }
  }
];

/**
 * Combined competitor station database
 */
export const ALL_COMPETITOR_STATIONS: CompetitorStation[] = [
  ...AWS_GROUND_STATIONS,
  ...TELESAT_GROUND_STATIONS,
  ...STARLINK_GROUND_STATIONS,
  ...KSAT_GROUND_STATIONS
];

/**
 * Comprehensive competitor analysis functions
 */
export function analyzeCompetitorLandscape(): CompetitorAnalysis {
  const totalStations = ALL_COMPETITOR_STATIONS.length;
  
  // Operator breakdown
  const operatorBreakdown = ALL_COMPETITOR_STATIONS.reduce((acc, station) => {
    acc[station.operator] = (acc[station.operator] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Region breakdown
  const regionBreakdown = ALL_COMPETITOR_STATIONS.reduce((acc, station) => {
    acc[station.region] = (acc[station.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Threat matrix
  const threatMatrix = {
    critical: ALL_COMPETITOR_STATIONS.filter(s => s.marketPosition.threatLevel === 'Critical'),
    high: ALL_COMPETITOR_STATIONS.filter(s => s.marketPosition.threatLevel === 'High'),
    medium: ALL_COMPETITOR_STATIONS.filter(s => s.marketPosition.threatLevel === 'Medium'),
    low: ALL_COMPETITOR_STATIONS.filter(s => s.marketPosition.threatLevel === 'Low')
  };
  
  // Identify competitive gaps (simplified analysis)
  const competitiveGaps = [
    {
      location: [19.076, 72.8777] as [number, number],
      gapType: 'Market Access' as const,
      severity: 'High' as const,
      opportunity: 'Indian market penetration - AWS dominates but room for competition in government sector',
      investment: 25000000
    },
    {
      location: [-23.5505, -46.6333] as [number, number],
      gapType: 'Capacity' as const,
      severity: 'Medium' as const,
      opportunity: 'South American capacity expansion - growing demand for agricultural monitoring',
      investment: 18000000
    },
    {
      location: [6.5244, 3.3792] as [number, number],
      gapType: 'Coverage' as const,
      severity: 'High' as const,
      opportunity: 'West African coverage gap - significant underserved market',
      investment: 22000000
    }
  ];
  
  return {
    totalStations,
    operatorBreakdown,
    regionBreakdown,
    threatMatrix,
    competitiveGaps
  };
}

/**
 * Get competitor stations by threat level
 */
export function getCompetitorsByThreatLevel(threatLevel: 'Critical' | 'High' | 'Medium' | 'Low'): CompetitorStation[] {
  return ALL_COMPETITOR_STATIONS.filter(station => station.marketPosition.threatLevel === threatLevel);
}

/**
 * Get competitor stations by operator
 */
export function getCompetitorsByOperator(operator: string): CompetitorStation[] {
  return ALL_COMPETITOR_STATIONS.filter(station => station.operator === operator);
}

/**
 * Get competitor stations within radius of coordinates
 */
export function getCompetitorsInRadius(
  centerLat: number, 
  centerLon: number, 
  radiusKm: number
): CompetitorStation[] {
  return ALL_COMPETITOR_STATIONS.filter(station => {
    const distance = calculateDistance(centerLat, centerLon, station.coordinates[0], station.coordinates[1]);
    return distance <= radiusKm;
  });
}

/**
 * Helper function to calculate distance between coordinates
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Market intelligence summary
 */
export const COMPETITOR_INTELLIGENCE_SUMMARY = {
  totalCompetitorStations: ALL_COMPETITOR_STATIONS.length,
  criticalThreats: ALL_COMPETITOR_STATIONS.filter(s => s.marketPosition.threatLevel === 'Critical').length,
  dominantOperators: {
    aws: AWS_GROUND_STATIONS.length,
    telesat: TELESAT_GROUND_STATIONS.length,
    starlink: STARLINK_GROUND_STATIONS.length,
    ksat: KSAT_GROUND_STATIONS.length
  },
  estimatedTotalCompetitorRevenue: ALL_COMPETITOR_STATIONS.reduce((sum, s) => sum + s.marketPosition.estimatedRevenue, 0),
  keyTrends: [
    'AWS Ground Station disrupting traditional model with cloud integration',
    'SpaceX Starlink revolutionizing LEO constellation services',
    'Telesat modernizing with Lightspeed LEO constellation',
    'KSAT maintaining monopoly on polar specialist services',
    'Increasing focus on government and defense applications',
    'Growing demand for real-time data processing capabilities'
  ],
  strategicRecommendations: [
    'Develop cloud-native service offerings to compete with AWS',
    'Invest in LEO constellation ground infrastructure',
    'Strengthen government and defense relationships',
    'Focus on specialized services where established players have advantages',
    'Consider partnerships rather than head-to-head competition in certain markets',
    'Prioritize polar and remote area coverage as differentiator'
  ]
};