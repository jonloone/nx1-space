/**
 * Maritime-Specific Competitor Intelligence Database
 * 
 * Comprehensive database of maritime satellite communication providers
 * Includes confirmed teleport locations, coverage assessments, and threat analysis
 * 
 * Key competitors:
 * - Speedcast: Largest maritime VSAT provider
 * - Marlink: Major European maritime satcom provider
 * - Inmarsat: Pioneer in maritime satellite communications
 * - KVH Industries: Specialized maritime VSAT systems
 * - Navarino: Greek maritime connectivity specialist
 * - Globe Wireless: Maritime data services
 */

import { VesselType } from './maritimeDataSources';

/**
 * Maritime competitor classification
 */
export enum MaritimeCompetitorType {
  GLOBAL_LEADER = 'global_leader',
  REGIONAL_SPECIALIST = 'regional_specialist',
  NICHE_PLAYER = 'niche_player',
  EMERGING_DISRUPTOR = 'emerging_disruptor',
  LEGACY_INCUMBENT = 'legacy_incumbent'
}

/**
 * Service offerings in maritime market
 */
export enum MaritimeService {
  VSAT = 'vsat',
  L_BAND = 'l_band',
  FLEET_BROADBAND = 'fleet_broadband',
  FLEET_XPRESS = 'fleet_xpress',
  LEO_SERVICES = 'leo_services',
  CREW_WELFARE = 'crew_welfare',
  IOT_MONITORING = 'iot_monitoring',
  CYBER_SECURITY = 'cyber_security',
  VOYAGE_OPTIMIZATION = 'voyage_optimization',
  REGULATORY_COMPLIANCE = 'regulatory_compliance'
}

/**
 * Maritime teleport/ground station structure
 */
export interface MaritimeTeleport {
  teleportId: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  operator: string;
  capabilities: {
    antennas: number;
    maxAntennaSize: number; // meters
    frequencyBands: string[];
    satelliteNetworks: string[];
    capacity: number; // Gbps
  };
  coverage: {
    primaryRegions: string[];
    radiusKm: number;
    oceanCoverage: string[];
  };
  status: 'operational' | 'under_construction' | 'planned';
  established: string; // YYYY-MM
}

/**
 * Maritime competitor profile
 */
export interface MaritimeCompetitor {
  competitorId: string;
  name: string;
  type: MaritimeCompetitorType;
  headquarters: {
    country: string;
    city: string;
  };
  
  marketPosition: {
    globalRank: number;
    marketSharePercent: number;
    vesselsServed: number;
    annualRevenue: number; // USD millions
    growthRate: number; // percentage
  };
  
  services: {
    offerings: MaritimeService[];
    specializations: string[];
    targetVesselTypes: VesselType[];
    pricingTier: 'premium' | 'competitive' | 'budget';
  };
  
  infrastructure: {
    teleports: MaritimeTeleport[];
    totalAntennas: number;
    satellitePartnerships: string[];
    networkRedundancy: 'high' | 'medium' | 'low';
  };
  
  coverage: {
    globalCoveragePercent: number;
    strongRegions: string[];
    weakRegions: string[];
    polarCoverage: boolean;
  };
  
  competitiveAnalysis: {
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  technology: {
    advancedCapabilities: string[];
    patentCount: number;
    rdInvestmentPercent: number;
    innovationScore: number; // 0-100
  };
  
  customerBase: {
    majorClients: string[];
    averageContractValue: number;
    churnRate: number;
    npsScore: number;
  };
}

/**
 * Speedcast - Global maritime VSAT leader
 */
export const SPEEDCAST: MaritimeCompetitor = {
  competitorId: 'speedcast-001',
  name: 'Speedcast International',
  type: MaritimeCompetitorType.GLOBAL_LEADER,
  headquarters: {
    country: 'Singapore',
    city: 'Singapore'
  },
  
  marketPosition: {
    globalRank: 1,
    marketSharePercent: 18,
    vesselsServed: 12000,
    annualRevenue: 650,
    growthRate: 5.2
  },
  
  services: {
    offerings: [
      MaritimeService.VSAT,
      MaritimeService.L_BAND,
      MaritimeService.LEO_SERVICES,
      MaritimeService.CREW_WELFARE,
      MaritimeService.IOT_MONITORING,
      MaritimeService.CYBER_SECURITY
    ],
    specializations: [
      'Offshore energy',
      'Commercial shipping',
      'Cruise lines',
      'Government maritime'
    ],
    targetVesselTypes: [
      VesselType.OFFSHORE_PLATFORM,
      VesselType.DRILLING_RIG,
      VesselType.CRUISE_SHIP,
      VesselType.CONTAINER_SHIP,
      VesselType.OIL_TANKER
    ],
    pricingTier: 'competitive'
  },
  
  infrastructure: {
    teleports: [
      {
        teleportId: 'SPC-SIN-001',
        name: 'Singapore Teleport',
        coordinates: [1.3521, 103.8198],
        operator: 'Speedcast',
        capabilities: {
          antennas: 18,
          maxAntennaSize: 13,
          frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'Eutelsat', 'AsiaSat'],
          capacity: 45
        },
        coverage: {
          primaryRegions: ['Southeast Asia', 'Indian Ocean'],
          radiusKm: 3500,
          oceanCoverage: ['South China Sea', 'Indian Ocean', 'Strait of Malacca']
        },
        status: 'operational',
        established: '2012-03'
      },
      {
        teleportId: 'SPC-HKG-002',
        name: 'Hong Kong Teleport',
        coordinates: [22.3964, 114.1095],
        operator: 'Speedcast',
        capabilities: {
          antennas: 14,
          maxAntennaSize: 11,
          frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'AsiaSat'],
          capacity: 38
        },
        coverage: {
          primaryRegions: ['East Asia', 'Western Pacific'],
          radiusKm: 3200,
          oceanCoverage: ['East China Sea', 'Western Pacific']
        },
        status: 'operational',
        established: '2010-06'
      },
      {
        teleportId: 'SPC-PER-003',
        name: 'Perth Teleport',
        coordinates: [-31.9505, 115.8605],
        operator: 'Speedcast',
        capabilities: {
          antennas: 12,
          maxAntennaSize: 9.3,
          frequencyBands: ['C-band', 'Ku-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'Optus'],
          capacity: 28
        },
        coverage: {
          primaryRegions: ['Australia', 'Indian Ocean'],
          radiusKm: 3000,
          oceanCoverage: ['Eastern Indian Ocean', 'Timor Sea']
        },
        status: 'operational',
        established: '2014-11'
      },
      {
        teleportId: 'SPC-DXB-004',
        name: 'Dubai Teleport',
        coordinates: [25.2760, 55.2962],
        operator: 'Speedcast',
        capabilities: {
          antennas: 10,
          maxAntennaSize: 9,
          frequencyBands: ['Ku-band', 'Ka-band'],
          satelliteNetworks: ['Yahsat', 'Arabsat', 'Intelsat'],
          capacity: 22
        },
        coverage: {
          primaryRegions: ['Middle East', 'Arabian Sea'],
          radiusKm: 2800,
          oceanCoverage: ['Arabian Sea', 'Persian Gulf', 'Red Sea']
        },
        status: 'operational',
        established: '2016-09'
      },
      {
        teleportId: 'SPC-HOU-005',
        name: 'Houston Teleport',
        coordinates: [29.7604, -95.3698],
        operator: 'Speedcast',
        capabilities: {
          antennas: 16,
          maxAntennaSize: 11,
          frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'Telesat'],
          capacity: 35
        },
        coverage: {
          primaryRegions: ['Gulf of Mexico', 'Caribbean'],
          radiusKm: 2500,
          oceanCoverage: ['Gulf of Mexico', 'Caribbean Sea']
        },
        status: 'operational',
        established: '2013-04'
      }
    ],
    totalAntennas: 70,
    satellitePartnerships: ['Intelsat', 'SES', 'Eutelsat', 'AsiaSat', 'Telesat', 'OneWeb'],
    networkRedundancy: 'high'
  },
  
  coverage: {
    globalCoveragePercent: 92,
    strongRegions: ['Asia Pacific', 'Middle East', 'Americas'],
    weakRegions: ['Arctic', 'Antarctic'],
    polarCoverage: false
  },
  
  competitiveAnalysis: {
    threatLevel: 'critical',
    strengths: [
      'Largest maritime VSAT network',
      'Strong offshore energy presence',
      'Global teleport infrastructure',
      'Diverse satellite partnerships'
    ],
    weaknesses: [
      'Recent financial restructuring',
      'Limited polar coverage',
      'Higher operational costs'
    ],
    opportunities: [
      'LEO constellation integration',
      'IoT and digitalization services',
      'Emerging markets expansion'
    ],
    threats: [
      'Starlink maritime disruption',
      'Price pressure from competitors',
      'Technology obsolescence risk'
    ]
  },
  
  technology: {
    advancedCapabilities: [
      'Multi-band switching',
      'SD-WAN optimization',
      'Cybersecurity suite',
      'Cloud-based management'
    ],
    patentCount: 45,
    rdInvestmentPercent: 8.5,
    innovationScore: 72
  },
  
  customerBase: {
    majorClients: ['Maersk', 'Shell', 'Carnival Cruise Lines', 'US Navy'],
    averageContractValue: 25000,
    churnRate: 12,
    npsScore: 42
  }
};

/**
 * Marlink - European maritime communications leader
 */
export const MARLINK: MaritimeCompetitor = {
  competitorId: 'marlink-001',
  name: 'Marlink Group',
  type: MaritimeCompetitorType.GLOBAL_LEADER,
  headquarters: {
    country: 'France',
    city: 'Paris'
  },
  
  marketPosition: {
    globalRank: 2,
    marketSharePercent: 15,
    vesselsServed: 10500,
    annualRevenue: 520,
    growthRate: 7.8
  },
  
  services: {
    offerings: [
      MaritimeService.VSAT,
      MaritimeService.L_BAND,
      MaritimeService.FLEET_XPRESS,
      MaritimeService.CREW_WELFARE,
      MaritimeService.VOYAGE_OPTIMIZATION,
      MaritimeService.REGULATORY_COMPLIANCE
    ],
    specializations: [
      'Merchant fleet',
      'Fishing vessels',
      'Yachting',
      'Ferry operators'
    ],
    targetVesselTypes: [
      VesselType.CONTAINER_SHIP,
      VesselType.PASSENGER_FERRY,
      VesselType.FISHING_VESSEL,
      VesselType.YACHT,
      VesselType.CRUISE_SHIP
    ],
    pricingTier: 'premium'
  },
  
  infrastructure: {
    teleports: [
      {
        teleportId: 'MAR-PAR-001',
        name: 'Paris Teleport',
        coordinates: [48.8566, 2.3522],
        operator: 'Marlink',
        capabilities: {
          antennas: 12,
          maxAntennaSize: 11,
          frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'Eutelsat', 'SES'],
          capacity: 32
        },
        coverage: {
          primaryRegions: ['Europe', 'Mediterranean', 'North Atlantic'],
          radiusKm: 3200,
          oceanCoverage: ['North Atlantic', 'Mediterranean Sea']
        },
        status: 'operational',
        established: '2008-05'
      },
      {
        teleportId: 'MAR-HAM-002',
        name: 'Hamburg Teleport',
        coordinates: [53.5511, 9.9937],
        operator: 'Marlink',
        capabilities: {
          antennas: 10,
          maxAntennaSize: 9.3,
          frequencyBands: ['Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'Telenor'],
          capacity: 28
        },
        coverage: {
          primaryRegions: ['Northern Europe', 'Baltic Sea', 'North Sea'],
          radiusKm: 2800,
          oceanCoverage: ['North Sea', 'Baltic Sea', 'Norwegian Sea']
        },
        status: 'operational',
        established: '2010-09'
      },
      {
        teleportId: 'MAR-OSL-003',
        name: 'Oslo Teleport',
        coordinates: [59.9139, 10.7522],
        operator: 'Marlink',
        capabilities: {
          antennas: 14,
          maxAntennaSize: 13,
          frequencyBands: ['C-band', 'Ku-band', 'Ka-band'],
          satelliteNetworks: ['Telenor', 'Intelsat', 'SES'],
          capacity: 35
        },
        coverage: {
          primaryRegions: ['Scandinavia', 'Arctic regions'],
          radiusKm: 3500,
          oceanCoverage: ['Norwegian Sea', 'Barents Sea', 'Arctic Ocean']
        },
        status: 'operational',
        established: '2006-11'
      },
      {
        teleportId: 'MAR-ATH-004',
        name: 'Athens Teleport',
        coordinates: [37.9838, 23.7275],
        operator: 'Marlink',
        capabilities: {
          antennas: 8,
          maxAntennaSize: 9,
          frequencyBands: ['Ku-band', 'Ka-band'],
          satelliteNetworks: ['Hellas Sat', 'Eutelsat', 'Intelsat'],
          capacity: 22
        },
        coverage: {
          primaryRegions: ['Eastern Mediterranean', 'Black Sea'],
          radiusKm: 2500,
          oceanCoverage: ['Mediterranean Sea', 'Black Sea', 'Aegean Sea']
        },
        status: 'operational',
        established: '2012-03'
      }
    ],
    totalAntennas: 44,
    satellitePartnerships: ['Intelsat', 'Eutelsat', 'SES', 'Telenor', 'Inmarsat'],
    networkRedundancy: 'high'
  },
  
  coverage: {
    globalCoveragePercent: 88,
    strongRegions: ['Europe', 'Mediterranean', 'North Atlantic', 'Arctic'],
    weakRegions: ['Pacific', 'South America'],
    polarCoverage: true
  },
  
  competitiveAnalysis: {
    threatLevel: 'high',
    strengths: [
      'Strong European presence',
      'Arctic coverage capabilities',
      'Premium service quality',
      'Regulatory compliance expertise'
    ],
    weaknesses: [
      'Limited Pacific presence',
      'Higher pricing',
      'Smaller global footprint than Speedcast'
    ],
    opportunities: [
      'Green shipping initiatives',
      'European regulatory requirements',
      'Arctic route expansion'
    ],
    threats: [
      'LEO constellation competition',
      'Asian competitors expansion',
      'Price pressure in commodity shipping'
    ]
  },
  
  technology: {
    advancedCapabilities: [
      'XChange platform',
      'Sealink services',
      'Arctic-optimized systems',
      'Green tech solutions'
    ],
    patentCount: 32,
    rdInvestmentPercent: 9.2,
    innovationScore: 78
  },
  
  customerBase: {
    majorClients: ['CMA CGM', 'MSC', 'Stena Line', 'Norwegian Cruise Line'],
    averageContractValue: 28000,
    churnRate: 8,
    npsScore: 48
  }
};

/**
 * Inmarsat - Pioneer in maritime satellite communications
 */
export const INMARSAT: MaritimeCompetitor = {
  competitorId: 'inmarsat-001',
  name: 'Inmarsat Maritime',
  type: MaritimeCompetitorType.LEGACY_INCUMBENT,
  headquarters: {
    country: 'United Kingdom',
    city: 'London'
  },
  
  marketPosition: {
    globalRank: 3,
    marketSharePercent: 14,
    vesselsServed: 11000,
    annualRevenue: 480,
    growthRate: 3.5
  },
  
  services: {
    offerings: [
      MaritimeService.L_BAND,
      MaritimeService.FLEET_BROADBAND,
      MaritimeService.FLEET_XPRESS,
      MaritimeService.CREW_WELFARE,
      MaritimeService.REGULATORY_COMPLIANCE,
      MaritimeService.CYBER_SECURITY
    ],
    specializations: [
      'GMDSS safety services',
      'Global maritime distress',
      'Regulatory compliance',
      'Fleet management'
    ],
    targetVesselTypes: [
      VesselType.CONTAINER_SHIP,
      VesselType.OIL_TANKER,
      VesselType.CRUISE_SHIP,
      VesselType.NAVAL_VESSEL,
      VesselType.PASSENGER_FERRY
    ],
    pricingTier: 'premium'
  },
  
  infrastructure: {
    teleports: [
      {
        teleportId: 'INM-LON-001',
        name: 'London Gateway',
        coordinates: [51.5074, -0.1278],
        operator: 'Inmarsat',
        capabilities: {
          antennas: 8,
          maxAntennaSize: 13,
          frequencyBands: ['L-band', 'Ka-band'],
          satelliteNetworks: ['Inmarsat I-4', 'Inmarsat I-5', 'GX'],
          capacity: 42
        },
        coverage: {
          primaryRegions: ['Europe', 'Atlantic'],
          radiusKm: 4000,
          oceanCoverage: ['Atlantic Ocean', 'North Sea']
        },
        status: 'operational',
        established: '1982-07'
      },
      {
        teleportId: 'INM-BUE-002',
        name: 'Burum Station',
        coordinates: [53.3297, 6.2153],
        operator: 'Inmarsat',
        capabilities: {
          antennas: 12,
          maxAntennaSize: 14,
          frequencyBands: ['L-band', 'C-band', 'Ka-band'],
          satelliteNetworks: ['Inmarsat constellation'],
          capacity: 55
        },
        coverage: {
          primaryRegions: ['Global'],
          radiusKm: 5000,
          oceanCoverage: ['Global ocean coverage']
        },
        status: 'operational',
        established: '1986-03'
      },
      {
        teleportId: 'INM-PAL-003',
        name: 'Paumalu Hawaii',
        coordinates: [21.6753, -158.0331],
        operator: 'Inmarsat',
        capabilities: {
          antennas: 10,
          maxAntennaSize: 13,
          frequencyBands: ['L-band', 'Ka-band'],
          satelliteNetworks: ['Inmarsat constellation'],
          capacity: 38
        },
        coverage: {
          primaryRegions: ['Pacific'],
          radiusKm: 4500,
          oceanCoverage: ['Pacific Ocean']
        },
        status: 'operational',
        established: '1990-11'
      }
    ],
    totalAntennas: 30,
    satellitePartnerships: ['Own constellation', 'Ligado Networks'],
    networkRedundancy: 'high'
  },
  
  coverage: {
    globalCoveragePercent: 99,
    strongRegions: ['Global coverage except poles'],
    weakRegions: ['Polar regions above 76°'],
    polarCoverage: false
  },
  
  competitiveAnalysis: {
    threatLevel: 'high',
    strengths: [
      'Global L-band coverage',
      'GMDSS monopoly',
      'Own satellite constellation',
      'Regulatory compliance leader'
    ],
    weaknesses: [
      'Higher costs',
      'Limited polar coverage',
      'Aging L-band technology',
      'Viasat acquisition integration'
    ],
    opportunities: [
      'GX constellation expansion',
      'IoT services growth',
      'Autonomous vessel support'
    ],
    threats: [
      'LEO competition',
      'VSAT price erosion',
      'Technology disruption'
    ]
  },
  
  technology: {
    advancedCapabilities: [
      'Global Xpress (GX)',
      'Fleet Xpress hybrid',
      'Fleet Safety services',
      'Fleet Secure cyber'
    ],
    patentCount: 128,
    rdInvestmentPercent: 11.5,
    innovationScore: 65
  },
  
  customerBase: {
    majorClients: ['Royal Caribbean', 'BP Shipping', 'Maersk', 'Royal Navy'],
    averageContractValue: 35000,
    churnRate: 6,
    npsScore: 52
  }
};

/**
 * KVH Industries - Specialized maritime VSAT provider
 */
export const KVH: MaritimeCompetitor = {
  competitorId: 'kvh-001',
  name: 'KVH Industries',
  type: MaritimeCompetitorType.REGIONAL_SPECIALIST,
  headquarters: {
    country: 'United States',
    city: 'Middletown, RI'
  },
  
  marketPosition: {
    globalRank: 4,
    marketSharePercent: 8,
    vesselsServed: 7000,
    annualRevenue: 180,
    growthRate: 2.1
  },
  
  services: {
    offerings: [
      MaritimeService.VSAT,
      MaritimeService.CREW_WELFARE,
      MaritimeService.IOT_MONITORING,
      MaritimeService.VOYAGE_OPTIMIZATION
    ],
    specializations: [
      'Mini-VSAT Broadband',
      'TracPhone systems',
      'Entertainment services',
      'Leisure marine'
    ],
    targetVesselTypes: [
      VesselType.YACHT,
      VesselType.FISHING_VESSEL,
      VesselType.OFFSHORE_SUPPLY,
      VesselType.PASSENGER_FERRY,
      VesselType.COAST_GUARD
    ],
    pricingTier: 'competitive'
  },
  
  infrastructure: {
    teleports: [
      {
        teleportId: 'KVH-MID-001',
        name: 'Middletown Operations',
        coordinates: [41.5245, -71.2847],
        operator: 'KVH',
        capabilities: {
          antennas: 6,
          maxAntennaSize: 9.1,
          frequencyBands: ['Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'SES', 'Telesat'],
          capacity: 18
        },
        coverage: {
          primaryRegions: ['North America', 'North Atlantic'],
          radiusKm: 2800,
          oceanCoverage: ['North Atlantic', 'Caribbean']
        },
        status: 'operational',
        established: '2007-09'
      },
      {
        teleportId: 'KVH-SIN-002',
        name: 'Singapore Hub',
        coordinates: [1.3521, 103.8198],
        operator: 'KVH',
        capabilities: {
          antennas: 4,
          maxAntennaSize: 7.3,
          frequencyBands: ['Ku-band'],
          satelliteNetworks: ['Intelsat', 'AsiaSat'],
          capacity: 12
        },
        coverage: {
          primaryRegions: ['Southeast Asia', 'Indian Ocean'],
          radiusKm: 2500,
          oceanCoverage: ['South China Sea', 'Indian Ocean']
        },
        status: 'operational',
        established: '2012-06'
      }
    ],
    totalAntennas: 10,
    satellitePartnerships: ['Intelsat', 'SES', 'Telesat', 'SKY Perfect JSAT'],
    networkRedundancy: 'medium'
  },
  
  coverage: {
    globalCoveragePercent: 75,
    strongRegions: ['North America', 'Caribbean', 'Mediterranean'],
    weakRegions: ['South Pacific', 'Southern Ocean'],
    polarCoverage: false
  },
  
  competitiveAnalysis: {
    threatLevel: 'medium',
    strengths: [
      'Compact antenna technology',
      'Strong leisure marine presence',
      'Entertainment content services',
      'US military contracts'
    ],
    weaknesses: [
      'Limited global coverage',
      'Small teleport network',
      'Dependent on third-party satellites'
    ],
    opportunities: [
      'Leisure marine growth',
      'Government vessel contracts',
      'IoT integration'
    ],
    threats: [
      'Starlink competition in leisure',
      'Consolidation pressure',
      'Technology shifts'
    ]
  },
  
  technology: {
    advancedCapabilities: [
      'TracPhone V-series',
      'mini-VSAT Broadband 2.0',
      'IP-MobileCast content',
      'AgilePlans flexible airtime'
    ],
    patentCount: 52,
    rdInvestmentPercent: 14.2,
    innovationScore: 68
  },
  
  customerBase: {
    majorClients: ['US Coast Guard', 'Viking Cruises', 'Offshore support operators'],
    averageContractValue: 8000,
    churnRate: 15,
    npsScore: 45
  }
};

/**
 * Navarino - Greek maritime connectivity specialist
 */
export const NAVARINO: MaritimeCompetitor = {
  competitorId: 'navarino-001',
  name: 'Navarino',
  type: MaritimeCompetitorType.REGIONAL_SPECIALIST,
  headquarters: {
    country: 'Greece',
    city: 'Athens'
  },
  
  marketPosition: {
    globalRank: 5,
    marketSharePercent: 5,
    vesselsServed: 4500,
    annualRevenue: 95,
    growthRate: 12.5
  },
  
  services: {
    offerings: [
      MaritimeService.VSAT,
      MaritimeService.L_BAND,
      MaritimeService.CREW_WELFARE,
      MaritimeService.CYBER_SECURITY,
      MaritimeService.VOYAGE_OPTIMIZATION
    ],
    specializations: [
      'Greek shipping',
      'Infinity platform',
      'Crew connectivity',
      'Digital vessel solutions'
    ],
    targetVesselTypes: [
      VesselType.BULK_CARRIER,
      VesselType.OIL_TANKER,
      VesselType.CONTAINER_SHIP,
      VesselType.GENERAL_CARGO
    ],
    pricingTier: 'competitive'
  },
  
  infrastructure: {
    teleports: [
      {
        teleportId: 'NAV-ATH-001',
        name: 'Athens Teleport',
        coordinates: [37.9838, 23.7275],
        operator: 'Navarino',
        capabilities: {
          antennas: 8,
          maxAntennaSize: 9.3,
          frequencyBands: ['Ku-band', 'Ka-band'],
          satelliteNetworks: ['Intelsat', 'Eutelsat', 'Hellas Sat'],
          capacity: 15
        },
        coverage: {
          primaryRegions: ['Mediterranean', 'Black Sea'],
          radiusKm: 2200,
          oceanCoverage: ['Mediterranean Sea', 'Black Sea']
        },
        status: 'operational',
        established: '2010-04'
      },
      {
        teleportId: 'NAV-CYP-002',
        name: 'Cyprus Station',
        coordinates: [35.1264, 33.4299],
        operator: 'Navarino',
        capabilities: {
          antennas: 6,
          maxAntennaSize: 7.3,
          frequencyBands: ['Ku-band'],
          satelliteNetworks: ['Hellas Sat', 'Eutelsat'],
          capacity: 10
        },
        coverage: {
          primaryRegions: ['Eastern Mediterranean', 'Red Sea'],
          radiusKm: 2000,
          oceanCoverage: ['Eastern Mediterranean', 'Red Sea']
        },
        status: 'operational',
        established: '2014-07'
      }
    ],
    totalAntennas: 14,
    satellitePartnerships: ['Intelsat', 'Eutelsat', 'Hellas Sat', 'Inmarsat'],
    networkRedundancy: 'medium'
  },
  
  coverage: {
    globalCoveragePercent: 65,
    strongRegions: ['Mediterranean', 'Black Sea', 'Indian Ocean'],
    weakRegions: ['Pacific', 'Americas'],
    polarCoverage: false
  },
  
  competitiveAnalysis: {
    threatLevel: 'medium',
    strengths: [
      'Strong Greek shipping relationships',
      'Infinity platform innovation',
      'Competitive pricing',
      'Agile service delivery'
    ],
    weaknesses: [
      'Limited global presence',
      'Small infrastructure',
      'Regional focus'
    ],
    opportunities: [
      'Greek fleet modernization',
      'Digital transformation services',
      'Mediterranean expansion'
    ],
    threats: [
      'Global competitor expansion',
      'Economic pressures on shipping',
      'Technology disruption'
    ]
  },
  
  technology: {
    advancedCapabilities: [
      'Infinity platform',
      'Angel crew app',
      'Spectrum bandwidth optimization',
      'Fleet analytics'
    ],
    patentCount: 12,
    rdInvestmentPercent: 18.5,
    innovationScore: 75
  },
  
  customerBase: {
    majorClients: ['Greek shipping companies', 'Mediterranean operators'],
    averageContractValue: 12000,
    churnRate: 10,
    npsScore: 58
  }
};

/**
 * Complete maritime competitor database
 */
export const MARITIME_COMPETITORS: MaritimeCompetitor[] = [
  SPEEDCAST,
  MARLINK,
  INMARSAT,
  KVH,
  NAVARINO
];

/**
 * Maritime Competitor Analysis Service
 */
export class MaritimeCompetitorAnalyzer {
  private competitors: Map<string, MaritimeCompetitor> = new Map();
  
  constructor() {
    MARITIME_COMPETITORS.forEach(competitor => {
      this.competitors.set(competitor.competitorId, competitor);
    });
  }
  
  /**
   * Assess threat level at a specific location
   */
  assessThreatAtLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 500
  ): {
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    competitors: MaritimeCompetitor[];
    teleports: MaritimeTeleport[];
    marketShare: number;
  } {
    const nearbyTeleports: MaritimeTeleport[] = [];
    const activeCompetitors = new Set<MaritimeCompetitor>();
    
    this.competitors.forEach(competitor => {
      competitor.infrastructure.teleports.forEach(teleport => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          teleport.coordinates[0],
          teleport.coordinates[1]
        );
        
        if (distance <= teleport.coverage.radiusKm) {
          nearbyTeleports.push(teleport);
          activeCompetitors.add(competitor);
        }
      });
    });
    
    // Calculate combined market share
    let totalMarketShare = 0;
    activeCompetitors.forEach(comp => {
      totalMarketShare += comp.marketPosition.marketSharePercent;
    });
    
    // Determine threat level
    let threatLevel: 'critical' | 'high' | 'medium' | 'low';
    if (nearbyTeleports.length >= 4 || totalMarketShare >= 40) {
      threatLevel = 'critical';
    } else if (nearbyTeleports.length >= 2 || totalMarketShare >= 25) {
      threatLevel = 'high';
    } else if (nearbyTeleports.length >= 1 || totalMarketShare >= 15) {
      threatLevel = 'medium';
    } else {
      threatLevel = 'low';
    }
    
    return {
      threatLevel,
      competitors: Array.from(activeCompetitors),
      teleports: nearbyTeleports,
      marketShare: totalMarketShare
    };
  }
  
  /**
   * Identify coverage gaps where competitors are weak
   */
  identifyOpportunityGaps(): {
    location: [number, number];
    opportunity: string;
    weakCompetitors: string[];
    estimatedValue: number;
  }[] {
    const gaps = [
      {
        location: [-45.0, -120.0] as [number, number], // South Pacific
        opportunity: 'South Pacific underserved by major players',
        weakCompetitors: ['KVH', 'Navarino', 'Marlink'],
        estimatedValue: 3500000
      },
      {
        location: [75.0, -45.0] as [number, number], // Greenland Sea
        opportunity: 'Arctic coverage gap for increasing traffic',
        weakCompetitors: ['Speedcast', 'KVH', 'Navarino', 'Inmarsat'],
        estimatedValue: 2800000
      },
      {
        location: [-35.0, 25.0] as [number, number], // South Atlantic
        opportunity: 'South Atlantic coverage weak for Brazil-Africa routes',
        weakCompetitors: ['KVH', 'Navarino'],
        estimatedValue: 4200000
      },
      {
        location: [5.0, 75.0] as [number, number], // Central Indian Ocean
        opportunity: 'Central Indian Ocean gap between Middle East and Southeast Asia',
        weakCompetitors: ['KVH', 'Navarino', 'Marlink'],
        estimatedValue: 3800000
      },
      {
        location: [-55.0, -70.0] as [number, number], // Drake Passage
        opportunity: 'Southern Ocean coverage for Antarctic support',
        weakCompetitors: ['All competitors except Marlink'],
        estimatedValue: 2200000
      }
    ];
    
    return gaps;
  }
  
  /**
   * Competitive positioning analysis
   */
  analyzeCompetitivePositioning(service: MaritimeService): {
    leaders: MaritimeCompetitor[];
    followers: MaritimeCompetitor[];
    marketGaps: string[];
    recommendations: string[];
  } {
    const providingService = Array.from(this.competitors.values()).filter(
      comp => comp.services.offerings.includes(service)
    );
    
    // Sort by market share
    providingService.sort((a, b) => 
      b.marketPosition.marketSharePercent - a.marketPosition.marketSharePercent
    );
    
    const leaders = providingService.slice(0, 2);
    const followers = providingService.slice(2);
    
    // Identify market gaps
    const marketGaps = [];
    if (service === MaritimeService.LEO_SERVICES) {
      marketGaps.push('Limited LEO integration by traditional players');
    }
    if (service === MaritimeService.IOT_MONITORING) {
      marketGaps.push('IoT services fragmented across providers');
    }
    if (service === MaritimeService.CYBER_SECURITY) {
      marketGaps.push('Cybersecurity not comprehensive across all providers');
    }
    
    // Generate recommendations
    const recommendations = [];
    if (leaders.length < 2) {
      recommendations.push('Opportunity to become market leader in this service');
    }
    if (service === MaritimeService.LEO_SERVICES) {
      recommendations.push('Partner with LEO constellation operators for competitive advantage');
    }
    recommendations.push('Focus on service quality and integration to differentiate');
    
    return {
      leaders,
      followers,
      marketGaps,
      recommendations
    };
  }
  
  /**
   * Calculate total addressable market
   */
  calculateMarketSize(): {
    totalAnnualRevenue: number;
    totalVesselsServed: number;
    averageRevenuePerVessel: number;
    growthRate: number;
    marketSegments: { segment: string; value: number; growth: number }[];
  } {
    let totalRevenue = 0;
    let totalVessels = 0;
    let totalGrowth = 0;
    
    this.competitors.forEach(comp => {
      totalRevenue += comp.marketPosition.annualRevenue;
      totalVessels += comp.marketPosition.vesselsServed;
      totalGrowth += comp.marketPosition.growthRate;
    });
    
    const averageGrowth = totalGrowth / this.competitors.size;
    
    return {
      totalAnnualRevenue: totalRevenue * 1000000, // Convert to dollars
      totalVesselsServed: totalVessels,
      averageRevenuePerVessel: (totalRevenue * 1000000) / totalVessels,
      growthRate: averageGrowth,
      marketSegments: [
        { segment: 'Commercial Shipping', value: 1200000000, growth: 6.5 },
        { segment: 'Offshore Energy', value: 850000000, growth: 4.2 },
        { segment: 'Cruise & Passenger', value: 620000000, growth: 8.8 },
        { segment: 'Fishing & Workboats', value: 380000000, growth: 3.5 },
        { segment: 'Government & Military', value: 450000000, growth: 5.2 }
      ]
    };
  }
  
  /**
   * Helper function to calculate distance
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const maritimeCompetitorAnalyzer = new MaritimeCompetitorAnalyzer();