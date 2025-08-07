/**
 * Global Shipping Lanes Database for Maritime Intelligence
 * 
 * Comprehensive database of major shipping routes with:
 * - Precise waypoint coordinates for navigation
 * - Daily vessel traffic statistics
 * - Economic value assessments
 * - Seasonal variations and patterns
 * - Integration with ground station coverage analysis
 * 
 * Based on real-world shipping data from major maritime routes
 */

import { VesselType } from './maritimeDataSources';

/**
 * Shipping lane waypoint structure
 */
export interface ShippingWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
  type: 'origin' | 'destination' | 'waypoint' | 'chokepoint' | 'canal';
  significance?: string;
}

/**
 * Shipping lane traffic statistics
 */
export interface LaneTrafficStats {
  dailyVesselCount: {
    average: number;
    peak: number;
    minimum: number;
  };
  vesselTypeDistribution: Partial<Record<VesselType, number>>; // Percentage
  averageTransitTime: number; // hours
  peakSeasons: string[];
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
}

/**
 * Economic value metrics for shipping lanes
 */
export interface LaneValueMetrics {
  annualCargoValue: number; // USD billions
  strategicImportance: 'critical' | 'major' | 'important' | 'secondary';
  valueTier: 'premium' | 'high' | 'medium' | 'standard';
  monthlyRevenueOpportunity: number; // USD for satellite services
  dataRequirementGbpsAverage: number;
}

/**
 * Complete shipping lane definition
 */
export interface ShippingLane {
  laneId: string;
  name: string;
  category: 'transoceanic' | 'regional' | 'coastal' | 'arctic';
  waypoints: ShippingWaypoint[];
  distanceNm: number; // Nautical miles
  traffic: LaneTrafficStats;
  value: LaneValueMetrics;
  hazards: string[];
  alternativeRoutes?: string[]; // IDs of alternative lanes
  satelliteCoverageQuality: 'excellent' | 'good' | 'fair' | 'poor';
  groundStationCoverage: {
    percentage: number;
    criticalGaps: { start: ShippingWaypoint; end: ShippingWaypoint }[];
  };
}

/**
 * Major global shipping lanes database
 */
export const GLOBAL_SHIPPING_LANES: ShippingLane[] = [
  // TRANS-PACIFIC ROUTES
  {
    laneId: 'trans-pac-asia-west-coast',
    name: 'Trans-Pacific Asia to US West Coast',
    category: 'transoceanic',
    waypoints: [
      { latitude: 31.2304, longitude: 121.4737, name: 'Shanghai', type: 'origin' },
      { latitude: 29.8683, longitude: 122.0933, type: 'waypoint' },
      { latitude: 28.1823, longitude: 127.6745, type: 'waypoint' },
      { latitude: 26.2147, longitude: 133.5946, type: 'waypoint' },
      { latitude: 24.4667, longitude: 141.8167, type: 'waypoint' },
      { latitude: 30.2672, longitude: 158.2053, type: 'waypoint' },
      { latitude: 35.6895, longitude: 171.3921, type: 'waypoint' },
      { latitude: 38.9072, longitude: -156.4305, type: 'waypoint' },
      { latitude: 36.8219, longitude: -140.7471, type: 'waypoint' },
      { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles', type: 'destination' }
    ],
    distanceNm: 5840,
    traffic: {
      dailyVesselCount: {
        average: 45,
        peak: 72,
        minimum: 28
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 65,
        [VesselType.CAR_CARRIER]: 15,
        [VesselType.BULK_CARRIER]: 10,
        [VesselType.OIL_TANKER]: 5,
        [VesselType.GENERAL_CARGO]: 5
      },
      averageTransitTime: 336, // 14 days
      peakSeasons: ['September', 'October', 'November'],
      congestionLevel: 'high'
    },
    value: {
      annualCargoValue: 450,
      strategicImportance: 'critical',
      valueTier: 'premium',
      monthlyRevenueOpportunity: 8500000,
      dataRequirementGbpsAverage: 2.5
    },
    hazards: ['Typhoons', 'North Pacific storms', 'Rogue waves'],
    alternativeRoutes: ['trans-pac-great-circle'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 85,
      criticalGaps: [
        {
          start: { latitude: 30.2672, longitude: 158.2053, type: 'waypoint' },
          end: { latitude: 35.6895, longitude: 171.3921, type: 'waypoint' }
        }
      ]
    }
  },
  
  {
    laneId: 'trans-pac-great-circle',
    name: 'Trans-Pacific Great Circle Route',
    category: 'transoceanic',
    waypoints: [
      { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo', type: 'origin' },
      { latitude: 38.7223, longitude: 141.0347, type: 'waypoint' },
      { latitude: 42.3601, longitude: 145.7849, type: 'waypoint' },
      { latitude: 46.1912, longitude: 153.9862, type: 'waypoint' },
      { latitude: 49.8397, longitude: 165.3759, type: 'waypoint' },
      { latitude: 51.8797, longitude: 178.7361, name: 'Aleutian Crossing', type: 'waypoint' },
      { latitude: 51.5053, longitude: -165.4064, type: 'waypoint' },
      { latitude: 49.2827, longitude: -148.8159, type: 'waypoint' },
      { latitude: 47.6062, longitude: -122.3321, name: 'Seattle', type: 'destination' }
    ],
    distanceNm: 4750,
    traffic: {
      dailyVesselCount: {
        average: 32,
        peak: 48,
        minimum: 18
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 70,
        [VesselType.CAR_CARRIER]: 12,
        [VesselType.BULK_CARRIER]: 8,
        [VesselType.LNG_CARRIER]: 5,
        [VesselType.GENERAL_CARGO]: 5
      },
      averageTransitTime: 264, // 11 days
      peakSeasons: ['May', 'June', 'July', 'August'],
      congestionLevel: 'moderate'
    },
    value: {
      annualCargoValue: 320,
      strategicImportance: 'major',
      valueTier: 'high',
      monthlyRevenueOpportunity: 6200000,
      dataRequirementGbpsAverage: 1.8
    },
    hazards: ['Aleutian storms', 'Ice (winter)', 'Fog', 'Volcanic ash'],
    alternativeRoutes: ['trans-pac-asia-west-coast'],
    satelliteCoverageQuality: 'good',
    groundStationCoverage: {
      percentage: 75,
      criticalGaps: [
        {
          start: { latitude: 49.8397, longitude: 165.3759, type: 'waypoint' },
          end: { latitude: 51.5053, longitude: -165.4064, type: 'waypoint' }
        }
      ]
    }
  },
  
  // ASIA-EUROPE VIA SUEZ
  {
    laneId: 'asia-europe-suez',
    name: 'Asia to Europe via Suez Canal',
    category: 'transoceanic',
    waypoints: [
      { latitude: 1.2897, longitude: 103.8501, name: 'Singapore', type: 'origin' },
      { latitude: 2.7833, longitude: 101.2833, name: 'Strait of Malacca', type: 'chokepoint' },
      { latitude: 5.5500, longitude: 95.3167, type: 'waypoint' },
      { latitude: 8.7833, longitude: 81.7833, type: 'waypoint' },
      { latitude: 12.6500, longitude: 69.1167, type: 'waypoint' },
      { latitude: 15.3500, longitude: 59.9667, type: 'waypoint' },
      { latitude: 12.5833, longitude: 43.4500, name: 'Bab el-Mandeb', type: 'chokepoint' },
      { latitude: 13.2000, longitude: 43.2500, type: 'waypoint' },
      { latitude: 20.0167, longitude: 38.8833, type: 'waypoint' },
      { latitude: 27.2500, longitude: 33.8333, type: 'waypoint' },
      { latitude: 30.0167, longitude: 32.5500, name: 'Suez Canal South', type: 'canal' },
      { latitude: 31.2500, longitude: 32.3000, name: 'Suez Canal North', type: 'canal' },
      { latitude: 31.5000, longitude: 31.8333, type: 'waypoint' },
      { latitude: 33.8667, longitude: 28.9167, type: 'waypoint' },
      { latitude: 35.1667, longitude: 25.7333, type: 'waypoint' },
      { latitude: 35.8500, longitude: 14.5333, type: 'waypoint' },
      { latitude: 36.1333, longitude: 5.3500, name: 'Strait of Gibraltar', type: 'chokepoint' },
      { latitude: 37.0833, longitude: -2.4667, type: 'waypoint' },
      { latitude: 43.3667, longitude: 7.2167, type: 'waypoint' },
      { latitude: 51.8959, longitude: 4.4795, name: 'Rotterdam', type: 'destination' }
    ],
    distanceNm: 10200,
    traffic: {
      dailyVesselCount: {
        average: 85,
        peak: 120,
        minimum: 60
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 55,
        [VesselType.OIL_TANKER]: 20,
        [VesselType.LNG_CARRIER]: 8,
        [VesselType.CAR_CARRIER]: 7,
        [VesselType.BULK_CARRIER]: 5,
        [VesselType.GENERAL_CARGO]: 5
      },
      averageTransitTime: 480, // 20 days
      peakSeasons: ['March', 'April', 'September', 'October'],
      congestionLevel: 'severe'
    },
    value: {
      annualCargoValue: 680,
      strategicImportance: 'critical',
      valueTier: 'premium',
      monthlyRevenueOpportunity: 12500000,
      dataRequirementGbpsAverage: 3.8
    },
    hazards: ['Piracy (historical)', 'Suez blockage risk', 'Monsoons', 'Political instability'],
    alternativeRoutes: ['asia-europe-cape'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 92,
      criticalGaps: [
        {
          start: { latitude: 12.5833, longitude: 43.4500, type: 'chokepoint' },
          end: { latitude: 13.2000, longitude: 43.2500, type: 'waypoint' }
        }
      ]
    }
  },
  
  // NORTH ATLANTIC
  {
    laneId: 'north-atlantic-primary',
    name: 'North Atlantic Primary Route',
    category: 'transoceanic',
    waypoints: [
      { latitude: 40.7128, longitude: -74.0060, name: 'New York', type: 'origin' },
      { latitude: 40.4667, longitude: -69.9667, type: 'waypoint' },
      { latitude: 41.2500, longitude: -60.0000, type: 'waypoint' },
      { latitude: 43.0000, longitude: -50.0000, type: 'waypoint' },
      { latitude: 45.5000, longitude: -40.0000, type: 'waypoint' },
      { latitude: 48.0000, longitude: -30.0000, type: 'waypoint' },
      { latitude: 49.5000, longitude: -20.0000, type: 'waypoint' },
      { latitude: 50.5000, longitude: -10.0000, type: 'waypoint' },
      { latitude: 50.0549, longitude: -5.0000, name: 'English Channel', type: 'chokepoint' },
      { latitude: 53.4084, longitude: 8.8017, name: 'Hamburg', type: 'destination' }
    ],
    distanceNm: 3850,
    traffic: {
      dailyVesselCount: {
        average: 62,
        peak: 88,
        minimum: 45
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 45,
        [VesselType.OIL_TANKER]: 15,
        [VesselType.CAR_CARRIER]: 10,
        [VesselType.CRUISE_SHIP]: 8,
        [VesselType.BULK_CARRIER]: 12,
        [VesselType.GENERAL_CARGO]: 10
      },
      averageTransitTime: 168, // 7 days
      peakSeasons: ['May', 'June', 'July', 'August', 'September'],
      congestionLevel: 'high'
    },
    value: {
      annualCargoValue: 380,
      strategicImportance: 'critical',
      valueTier: 'premium',
      monthlyRevenueOpportunity: 7800000,
      dataRequirementGbpsAverage: 2.2
    },
    hazards: ['North Atlantic storms', 'Icebergs (seasonal)', 'Fog', 'Hurricane season'],
    alternativeRoutes: ['north-atlantic-southern'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 95,
      criticalGaps: []
    }
  },
  
  // SOUTH AMERICA - ASIA
  {
    laneId: 'south-america-asia-pacific',
    name: 'South America to Asia Pacific Route',
    category: 'transoceanic',
    waypoints: [
      { latitude: -23.5505, longitude: -46.6333, name: 'Santos', type: 'origin' },
      { latitude: -26.2420, longitude: -42.1844, type: 'waypoint' },
      { latitude: -30.0331, longitude: -35.2081, type: 'waypoint' },
      { latitude: -34.9033, longitude: -25.0722, type: 'waypoint' },
      { latitude: -35.1264, longitude: -10.3208, type: 'waypoint' },
      { latitude: -34.8335, longitude: 3.4162, type: 'waypoint' },
      { latitude: -34.3568, longitude: 18.4241, name: 'Cape of Good Hope', type: 'chokepoint' },
      { latitude: -32.0536, longitude: 28.2472, type: 'waypoint' },
      { latitude: -26.2041, longitude: 38.0473, type: 'waypoint' },
      { latitude: -18.1416, longitude: 49.3956, type: 'waypoint' },
      { latitude: -8.7832, longitude: 65.2738, type: 'waypoint' },
      { latitude: -2.1955, longitude: 81.1542, type: 'waypoint' },
      { latitude: 1.2897, longitude: 103.8501, name: 'Singapore', type: 'destination' }
    ],
    distanceNm: 9650,
    traffic: {
      dailyVesselCount: {
        average: 28,
        peak: 42,
        minimum: 18
      },
      vesselTypeDistribution: {
        [VesselType.BULK_CARRIER]: 35,
        [VesselType.CONTAINER_SHIP]: 25,
        [VesselType.OIL_TANKER]: 15,
        [VesselType.CHEMICAL_TANKER]: 10,
        [VesselType.GENERAL_CARGO]: 15
      },
      averageTransitTime: 528, // 22 days
      peakSeasons: ['February', 'March', 'April', 'October', 'November'],
      congestionLevel: 'moderate'
    },
    value: {
      annualCargoValue: 185,
      strategicImportance: 'major',
      valueTier: 'high',
      monthlyRevenueOpportunity: 4200000,
      dataRequirementGbpsAverage: 1.2
    },
    hazards: ['Cape storms', 'South Atlantic anomaly', 'Indian Ocean cyclones'],
    alternativeRoutes: ['south-america-asia-magellan'],
    satelliteCoverageQuality: 'good',
    groundStationCoverage: {
      percentage: 78,
      criticalGaps: [
        {
          start: { latitude: -35.1264, longitude: -10.3208, type: 'waypoint' },
          end: { latitude: -34.3568, longitude: 18.4241, type: 'chokepoint' }
        }
      ]
    }
  },
  
  // ARCTIC ROUTES (NORTHERN SEA ROUTE)
  {
    laneId: 'northern-sea-route',
    name: 'Northern Sea Route (Arctic)',
    category: 'arctic',
    waypoints: [
      { latitude: 69.3455, longitude: 88.2606, name: 'Murmansk', type: 'origin' },
      { latitude: 69.6828, longitude: 33.0367, type: 'waypoint' },
      { latitude: 71.3875, longitude: 51.6919, type: 'waypoint' },
      { latitude: 73.5003, longitude: 80.5463, type: 'waypoint' },
      { latitude: 75.4509, longitude: 95.7834, type: 'waypoint' },
      { latitude: 76.2518, longitude: 113.4863, type: 'waypoint' },
      { latitude: 74.4949, longitude: 135.0859, type: 'waypoint' },
      { latitude: 71.5724, longitude: 156.7944, type: 'waypoint' },
      { latitude: 68.7133, longitude: 164.5889, name: 'Bering Strait', type: 'chokepoint' },
      { latitude: 60.1282, longitude: 149.4189, type: 'waypoint' },
      { latitude: 51.8456, longitude: 143.2094, type: 'waypoint' },
      { latitude: 42.8750, longitude: 132.8750, type: 'waypoint' },
      { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo', type: 'destination' }
    ],
    distanceNm: 6500,
    traffic: {
      dailyVesselCount: {
        average: 8,
        peak: 18,
        minimum: 0 // Winter closure
      },
      vesselTypeDistribution: {
        [VesselType.LNG_CARRIER]: 40,
        [VesselType.OIL_TANKER]: 25,
        [VesselType.CONTAINER_SHIP]: 15,
        [VesselType.BULK_CARRIER]: 10,
        [VesselType.RESEARCH_VESSEL]: 10
      },
      averageTransitTime: 360, // 15 days (summer only)
      peakSeasons: ['July', 'August', 'September'],
      congestionLevel: 'low'
    },
    value: {
      annualCargoValue: 45,
      strategicImportance: 'important',
      valueTier: 'high',
      monthlyRevenueOpportunity: 2800000,
      dataRequirementGbpsAverage: 0.8
    },
    hazards: ['Sea ice', 'Extreme cold', 'Limited SAR', 'Polar night', 'Environmental restrictions'],
    alternativeRoutes: ['asia-europe-suez'],
    satelliteCoverageQuality: 'poor',
    groundStationCoverage: {
      percentage: 45,
      criticalGaps: [
        {
          start: { latitude: 75.4509, longitude: 95.7834, type: 'waypoint' },
          end: { latitude: 74.4949, longitude: 135.0859, type: 'waypoint' }
        }
      ]
    }
  },
  
  // MEDITERRANEAN ROUTES
  {
    laneId: 'mediterranean-main',
    name: 'Mediterranean Main Route',
    category: 'regional',
    waypoints: [
      { latitude: 36.1408, longitude: -5.3536, name: 'Gibraltar', type: 'origin' },
      { latitude: 36.8065, longitude: -2.4192, type: 'waypoint' },
      { latitude: 37.9838, longitude: 1.2885, type: 'waypoint' },
      { latitude: 39.4699, longitude: 6.0785, type: 'waypoint' },
      { latitude: 40.8518, longitude: 9.7320, type: 'waypoint' },
      { latitude: 41.3275, longitude: 13.3692, type: 'waypoint' },
      { latitude: 38.1157, longitude: 15.6500, name: 'Strait of Messina', type: 'chokepoint' },
      { latitude: 35.8989, longitude: 18.5206, type: 'waypoint' },
      { latitude: 33.8894, longitude: 22.9277, type: 'waypoint' },
      { latitude: 31.5497, longitude: 27.9247, type: 'waypoint' },
      { latitude: 31.2000, longitude: 29.9187, name: 'Alexandria', type: 'destination' }
    ],
    distanceNm: 2100,
    traffic: {
      dailyVesselCount: {
        average: 125,
        peak: 180,
        minimum: 90
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 30,
        [VesselType.PASSENGER_FERRY]: 20,
        [VesselType.CRUISE_SHIP]: 15,
        [VesselType.OIL_TANKER]: 15,
        [VesselType.GENERAL_CARGO]: 20
      },
      averageTransitTime: 96, // 4 days
      peakSeasons: ['April', 'May', 'June', 'July', 'August', 'September'],
      congestionLevel: 'high'
    },
    value: {
      annualCargoValue: 220,
      strategicImportance: 'major',
      valueTier: 'high',
      monthlyRevenueOpportunity: 5500000,
      dataRequirementGbpsAverage: 1.6
    },
    hazards: ['Mediterranean storms', 'Congestion', 'Regulatory complexity'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 98,
      criticalGaps: []
    }
  },
  
  // PERSIAN GULF - ASIA
  {
    laneId: 'persian-gulf-asia',
    name: 'Persian Gulf to Asia Energy Route',
    category: 'transoceanic',
    waypoints: [
      { latitude: 29.1061, longitude: 48.1688, name: 'Kuwait', type: 'origin' },
      { latitude: 27.2833, longitude: 49.6500, type: 'waypoint' },
      { latitude: 26.5667, longitude: 52.0000, type: 'waypoint' },
      { latitude: 26.2167, longitude: 56.2667, name: 'Strait of Hormuz', type: 'chokepoint' },
      { latitude: 24.8607, longitude: 58.3334, type: 'waypoint' },
      { latitude: 21.5217, longitude: 62.5324, type: 'waypoint' },
      { latitude: 17.0167, longitude: 67.1333, type: 'waypoint' },
      { latitude: 12.6500, longitude: 71.4833, type: 'waypoint' },
      { latitude: 8.4667, longitude: 76.9500, type: 'waypoint' },
      { latitude: 6.0367, longitude: 80.2170, type: 'waypoint' },
      { latitude: 5.9471, longitude: 85.7664, type: 'waypoint' },
      { latitude: 5.5500, longitude: 95.3167, type: 'waypoint' },
      { latitude: 2.7833, longitude: 101.2833, name: 'Strait of Malacca', type: 'chokepoint' },
      { latitude: 1.2897, longitude: 103.8501, name: 'Singapore', type: 'waypoint' },
      { latitude: 22.3964, longitude: 114.1095, name: 'Hong Kong', type: 'destination' }
    ],
    distanceNm: 5880,
    traffic: {
      dailyVesselCount: {
        average: 68,
        peak: 95,
        minimum: 48
      },
      vesselTypeDistribution: {
        [VesselType.OIL_TANKER]: 45,
        [VesselType.LNG_CARRIER]: 25,
        [VesselType.CHEMICAL_TANKER]: 10,
        [VesselType.CONTAINER_SHIP]: 10,
        [VesselType.BULK_CARRIER]: 10
      },
      averageTransitTime: 288, // 12 days
      peakSeasons: ['January', 'February', 'November', 'December'],
      congestionLevel: 'severe'
    },
    value: {
      annualCargoValue: 520,
      strategicImportance: 'critical',
      valueTier: 'premium',
      monthlyRevenueOpportunity: 9200000,
      dataRequirementGbpsAverage: 2.8
    },
    hazards: ['Geopolitical tensions', 'Piracy risk', 'Strait congestion', 'Monsoons'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 88,
      criticalGaps: [
        {
          start: { latitude: 26.2167, longitude: 56.2667, type: 'chokepoint' },
          end: { latitude: 24.8607, longitude: 58.3334, type: 'waypoint' }
        }
      ]
    }
  },
  
  // AUSTRALIA - ASIA
  {
    laneId: 'australia-asia-resources',
    name: 'Australia to Asia Resources Route',
    category: 'regional',
    waypoints: [
      { latitude: -20.3080, longitude: 118.6011, name: 'Port Hedland', type: 'origin' },
      { latitude: -18.2871, longitude: 116.0239, type: 'waypoint' },
      { latitude: -14.5994, longitude: 112.5747, type: 'waypoint' },
      { latitude: -10.8772, longitude: 109.3658, type: 'waypoint' },
      { latitude: -8.5069, longitude: 108.1720, name: 'Sunda Strait', type: 'chokepoint' },
      { latitude: -6.2088, longitude: 106.8456, type: 'waypoint' },
      { latitude: -2.5489, longitude: 105.2625, type: 'waypoint' },
      { latitude: 1.2897, longitude: 103.8501, name: 'Singapore', type: 'waypoint' },
      { latitude: 13.7563, longitude: 109.2163, type: 'waypoint' },
      { latitude: 22.3964, longitude: 114.1095, name: 'Hong Kong', type: 'waypoint' },
      { latitude: 29.8683, longitude: 122.0933, name: 'Ningbo-Zhoushan', type: 'destination' }
    ],
    distanceNm: 3420,
    traffic: {
      dailyVesselCount: {
        average: 42,
        peak: 58,
        minimum: 28
      },
      vesselTypeDistribution: {
        [VesselType.BULK_CARRIER]: 60,
        [VesselType.LNG_CARRIER]: 15,
        [VesselType.CONTAINER_SHIP]: 10,
        [VesselType.OIL_TANKER]: 10,
        [VesselType.GENERAL_CARGO]: 5
      },
      averageTransitTime: 168, // 7 days
      peakSeasons: ['March', 'April', 'May', 'September', 'October'],
      congestionLevel: 'moderate'
    },
    value: {
      annualCargoValue: 285,
      strategicImportance: 'major',
      valueTier: 'high',
      monthlyRevenueOpportunity: 4800000,
      dataRequirementGbpsAverage: 1.4
    },
    hazards: ['Tropical cyclones', 'Reef navigation', 'Strait congestion'],
    satelliteCoverageQuality: 'good',
    groundStationCoverage: {
      percentage: 82,
      criticalGaps: []
    }
  },
  
  // BALTIC SEA ROUTES
  {
    laneId: 'baltic-sea-main',
    name: 'Baltic Sea Main Route',
    category: 'regional',
    waypoints: [
      { latitude: 54.5189, longitude: 10.1394, name: 'Kiel Canal', type: 'canal' },
      { latitude: 54.9285, longitude: 11.3153, type: 'waypoint' },
      { latitude: 55.4038, longitude: 12.8438, name: 'Oresund', type: 'chokepoint' },
      { latitude: 56.0421, longitude: 14.6664, type: 'waypoint' },
      { latitude: 57.7089, longitude: 17.9409, type: 'waypoint' },
      { latitude: 59.3293, longitude: 18.0686, name: 'Stockholm', type: 'waypoint' },
      { latitude: 59.9139, longitude: 23.5064, type: 'waypoint' },
      { latitude: 59.9375, longitude: 30.3086, name: 'St. Petersburg', type: 'destination' }
    ],
    distanceNm: 850,
    traffic: {
      dailyVesselCount: {
        average: 95,
        peak: 130,
        minimum: 65
      },
      vesselTypeDistribution: {
        [VesselType.CONTAINER_SHIP]: 25,
        [VesselType.PASSENGER_FERRY]: 30,
        [VesselType.OIL_TANKER]: 15,
        [VesselType.BULK_CARRIER]: 15,
        [VesselType.GENERAL_CARGO]: 15
      },
      averageTransitTime: 48, // 2 days
      peakSeasons: ['May', 'June', 'July', 'August', 'September'],
      congestionLevel: 'moderate'
    },
    value: {
      annualCargoValue: 145,
      strategicImportance: 'important',
      valueTier: 'medium',
      monthlyRevenueOpportunity: 3200000,
      dataRequirementGbpsAverage: 0.9
    },
    hazards: ['Ice (winter)', 'Shallow waters', 'Dense traffic', 'Environmental restrictions'],
    satelliteCoverageQuality: 'excellent',
    groundStationCoverage: {
      percentage: 100,
      criticalGaps: []
    }
  }
];

/**
 * Shipping Lane Detection and Analysis Service
 */
export class ShippingLaneAnalyzer {
  private lanes: Map<string, ShippingLane> = new Map();
  private vesselTracks: Map<string, ShippingWaypoint[]> = new Map();
  
  constructor() {
    // Initialize with global shipping lanes
    GLOBAL_SHIPPING_LANES.forEach(lane => {
      this.lanes.set(lane.laneId, lane);
    });
  }
  
  /**
   * Detect which shipping lane a vessel is likely on
   */
  detectLane(vesselPosition: { latitude: number; longitude: number }): ShippingLane | null {
    let closestLane: ShippingLane | null = null;
    let minDistance = Infinity;
    
    this.lanes.forEach(lane => {
      const distance = this.distanceToLane(vesselPosition, lane);
      if (distance < minDistance && distance < 50) { // Within 50 nautical miles
        minDistance = distance;
        closestLane = lane;
      }
    });
    
    return closestLane;
  }
  
  /**
   * Calculate distance from a point to a shipping lane
   */
  private distanceToLane(
    point: { latitude: number; longitude: number },
    lane: ShippingLane
  ): number {
    let minDistance = Infinity;
    
    for (let i = 0; i < lane.waypoints.length - 1; i++) {
      const distance = this.distanceToSegment(
        point,
        lane.waypoints[i],
        lane.waypoints[i + 1]
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private distanceToSegment(
    point: { latitude: number; longitude: number },
    start: ShippingWaypoint,
    end: ShippingWaypoint
  ): number {
    const A = point.latitude - start.latitude;
    const B = point.longitude - start.longitude;
    const C = end.latitude - start.latitude;
    const D = end.longitude - start.longitude;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = start.latitude;
      yy = start.longitude;
    } else if (param > 1) {
      xx = end.latitude;
      yy = end.longitude;
    } else {
      xx = start.latitude + param * C;
      yy = start.longitude + param * D;
    }
    
    const dx = point.latitude - xx;
    const dy = point.longitude - yy;
    
    // Convert to nautical miles (approximate)
    return Math.sqrt(dx * dx + dy * dy) * 60;
  }
  
  /**
   * Analyze lane utilization patterns
   */
  analyzeLaneUtilization(laneId: string, timeWindow: number = 24): {
    utilizationRate: number;
    congestionScore: number;
    predictedGrowth: number;
    bottlenecks: ShippingWaypoint[];
  } {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      throw new Error(`Lane ${laneId} not found`);
    }
    
    // Calculate utilization based on traffic stats
    const maxCapacity = lane.traffic.dailyVesselCount.peak * 1.5;
    const utilizationRate = lane.traffic.dailyVesselCount.average / maxCapacity;
    
    // Calculate congestion score
    let congestionScore = 0;
    switch (lane.traffic.congestionLevel) {
      case 'severe': congestionScore = 90; break;
      case 'high': congestionScore = 70; break;
      case 'moderate': congestionScore = 50; break;
      case 'low': congestionScore = 20; break;
    }
    
    // Predict growth based on historical trends and economic factors
    const economicGrowth = 3.5; // Global trade growth %
    const routeSpecificFactor = lane.value.strategicImportance === 'critical' ? 1.5 : 1.0;
    const predictedGrowth = economicGrowth * routeSpecificFactor;
    
    // Identify bottlenecks (chokepoints and canals)
    const bottlenecks = lane.waypoints.filter(wp => 
      wp.type === 'chokepoint' || wp.type === 'canal'
    );
    
    return {
      utilizationRate,
      congestionScore,
      predictedGrowth,
      bottlenecks
    };
  }
  
  /**
   * Calculate optimal ground station placement for lane coverage
   */
  calculateOptimalCoverage(laneId: string): {
    coverageGaps: { location: ShippingWaypoint; severity: 'critical' | 'major' | 'minor' }[];
    recommendedStations: { latitude: number; longitude: number; priority: number }[];
    investmentRequired: number;
  } {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      throw new Error(`Lane ${laneId} not found`);
    }
    
    // Identify coverage gaps
    const coverageGaps = lane.groundStationCoverage.criticalGaps.map(gap => ({
      location: gap.start,
      severity: 'critical' as const
    }));
    
    // Calculate recommended station locations
    const recommendedStations: { latitude: number; longitude: number; priority: number }[] = [];
    
    lane.groundStationCoverage.criticalGaps.forEach(gap => {
      // Place station at midpoint of gap
      const midLat = (gap.start.latitude + gap.end.latitude) / 2;
      const midLon = (gap.start.longitude + gap.end.longitude) / 2;
      
      recommendedStations.push({
        latitude: midLat,
        longitude: midLon,
        priority: lane.value.strategicImportance === 'critical' ? 100 : 75
      });
    });
    
    // Estimate investment based on location and requirements
    const baseInvestment = 15000000; // Base cost for maritime ground station
    const locationMultiplier = recommendedStations.length;
    const investmentRequired = baseInvestment * locationMultiplier;
    
    return {
      coverageGaps,
      recommendedStations,
      investmentRequired
    };
  }
  
  /**
   * Get lane value assessment
   */
  assessLaneValue(laneId: string): {
    currentValue: number;
    potentialValue: number;
    marketShare: number;
    competitorPresence: string[];
    opportunities: string[];
  } {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      throw new Error(`Lane ${laneId} not found`);
    }
    
    // Calculate current value based on traffic and cargo
    const currentValue = lane.value.monthlyRevenueOpportunity;
    
    // Calculate potential value with improved coverage
    const coverageImprovement = (100 - lane.groundStationCoverage.percentage) / 100;
    const potentialValue = currentValue * (1 + coverageImprovement * 0.5);
    
    // Estimate market share (simplified)
    const marketShare = lane.groundStationCoverage.percentage * 0.3; // Assume 30% conversion at full coverage
    
    // Identify competitors (simplified)
    const competitorPresence = ['Inmarsat', 'KVH', 'Speedcast'];
    if (lane.satelliteCoverageQuality === 'excellent') {
      competitorPresence.push('SES', 'Intelsat');
    }
    
    // Identify opportunities
    const opportunities = [];
    if (lane.groundStationCoverage.percentage < 80) {
      opportunities.push('Improve coverage in critical gaps');
    }
    if (lane.traffic.congestionLevel === 'severe' || lane.traffic.congestionLevel === 'high') {
      opportunities.push('Target congestion management services');
    }
    if (lane.value.strategicImportance === 'critical') {
      opportunities.push('Develop premium service tier');
    }
    if (lane.category === 'arctic') {
      opportunities.push('Specialized polar coverage solutions');
    }
    
    return {
      currentValue,
      potentialValue,
      marketShare,
      competitorPresence,
      opportunities
    };
  }
  
  /**
   * Get all lanes by category
   */
  getLanesByCategory(category: 'transoceanic' | 'regional' | 'coastal' | 'arctic'): ShippingLane[] {
    return Array.from(this.lanes.values()).filter(lane => lane.category === category);
  }
  
  /**
   * Get lanes by value tier
   */
  getLanesByValueTier(tier: 'premium' | 'high' | 'medium' | 'standard'): ShippingLane[] {
    return Array.from(this.lanes.values()).filter(lane => lane.value.valueTier === tier);
  }
  
  /**
   * Calculate total market opportunity
   */
  calculateTotalMarketOpportunity(): {
    totalMonthlyRevenue: number;
    totalAnnualCargoValue: number;
    averageDataRequirement: number;
    topOpportunities: { laneId: string; value: number }[];
  } {
    let totalMonthlyRevenue = 0;
    let totalAnnualCargoValue = 0;
    let totalDataRequirement = 0;
    const opportunities: { laneId: string; value: number }[] = [];
    
    this.lanes.forEach(lane => {
      totalMonthlyRevenue += lane.value.monthlyRevenueOpportunity;
      totalAnnualCargoValue += lane.value.annualCargoValue;
      totalDataRequirement += lane.value.dataRequirementGbpsAverage;
      
      opportunities.push({
        laneId: lane.laneId,
        value: lane.value.monthlyRevenueOpportunity
      });
    });
    
    // Sort opportunities by value
    opportunities.sort((a, b) => b.value - a.value);
    
    return {
      totalMonthlyRevenue,
      totalAnnualCargoValue,
      averageDataRequirement: totalDataRequirement / this.lanes.size,
      topOpportunities: opportunities.slice(0, 5)
    };
  }
}

// Export singleton instance
export const shippingLaneAnalyzer = new ShippingLaneAnalyzer();