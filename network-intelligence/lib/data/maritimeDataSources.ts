/**
 * Maritime Data Sources for Ground Station Intelligence Platform
 * 
 * Comprehensive AIS data integration and vessel tracking system
 * Designed to capture the $3.5B annual maritime satellite market opportunity
 * 
 * Key capabilities:
 * - Real-time AIS data ingestion from multiple sources
 * - Vessel density calculations and heat mapping
 * - Value scoring based on vessel types and cargo
 * - Maritime traffic pattern analysis
 * - Integration with ground station opportunity scoring
 */

import { GroundStationAnalytics } from '@/lib/types/ground-station';

/**
 * AIS Message Types as per ITU-R M.1371-5
 */
export enum AISMessageType {
  POSITION_REPORT_CLASS_A = 1,
  POSITION_REPORT_CLASS_A_ASSIGNED = 2,
  POSITION_REPORT_CLASS_A_RESPONSE = 3,
  BASE_STATION_REPORT = 4,
  STATIC_AND_VOYAGE_DATA = 5,
  BINARY_ADDRESSED_MESSAGE = 6,
  BINARY_BROADCAST_MESSAGE = 8,
  SAR_AIRCRAFT_POSITION = 9,
  STATIC_DATA_REPORT = 24
}

/**
 * Vessel type classifications with market value indicators
 */
export enum VesselType {
  // High-value vessels
  CRUISE_SHIP = 'cruise_ship',
  PASSENGER_FERRY = 'passenger_ferry',
  CONTAINER_SHIP = 'container_ship',
  OIL_TANKER = 'oil_tanker',
  LNG_CARRIER = 'lng_carrier',
  CHEMICAL_TANKER = 'chemical_tanker',
  
  // Medium-value vessels
  BULK_CARRIER = 'bulk_carrier',
  CAR_CARRIER = 'car_carrier',
  GENERAL_CARGO = 'general_cargo',
  REEFER_VESSEL = 'reefer_vessel',
  
  // Specialized high-value
  OFFSHORE_SUPPLY = 'offshore_supply',
  OFFSHORE_PLATFORM = 'offshore_platform',
  DRILLING_RIG = 'drilling_rig',
  FPSO = 'fpso', // Floating Production Storage and Offloading
  
  // Government/Military
  NAVAL_VESSEL = 'naval_vessel',
  COAST_GUARD = 'coast_guard',
  RESEARCH_VESSEL = 'research_vessel',
  
  // Other
  FISHING_VESSEL = 'fishing_vessel',
  YACHT = 'yacht',
  TUG_BOAT = 'tug_boat',
  PILOT_VESSEL = 'pilot_vessel',
  UNKNOWN = 'unknown'
}

/**
 * AIS data source configuration
 */
export interface AISDataSource {
  sourceId: string;
  name: string;
  type: 'terrestrial' | 'satellite' | 'hybrid';
  coverage: {
    regions: string[];
    rangeNm: number; // Nautical miles
    updateFrequency: number; // seconds
  };
  reliability: number; // 0-100%
  latency: number; // milliseconds
  cost: {
    monthly: number;
    perMessage: number;
  };
  capabilities: {
    realTime: boolean;
    historical: boolean;
    predictive: boolean;
  };
}

/**
 * Vessel AIS data structure
 */
export interface VesselAISData {
  // Identification
  mmsi: string; // Maritime Mobile Service Identity
  imo?: string; // International Maritime Organization number
  callSign?: string;
  name?: string;
  flag?: string; // Country flag
  
  // Position and movement
  position: {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
    timestamp: Date;
  };
  movement: {
    speedKnots: number;
    course: number; // degrees
    heading: number; // degrees
    rateOfTurn?: number; // degrees/minute
    navigationStatus: NavigationStatus;
  };
  
  // Vessel characteristics
  vessel: {
    type: VesselType;
    length?: number; // meters
    beam?: number; // meters
    draft?: number; // meters
    grossTonnage?: number;
    deadweight?: number;
  };
  
  // Voyage information
  voyage?: {
    destination?: string;
    eta?: Date;
    cargo?: string;
    hazardous?: boolean;
    personCount?: number;
  };
  
  // Communication needs
  communication: {
    satelliteEquipped: boolean;
    vsat?: boolean;
    fleetBroadband?: boolean;
    iridium?: boolean;
    dataRequirementGbPerMonth?: number;
  };
  
  // Value scoring
  value: {
    score: number; // 0-100
    tier: 'premium' | 'standard' | 'basic';
    monthlyRevenuePotential: number;
  };
}

/**
 * Navigation status as per AIS specification
 */
export enum NavigationStatus {
  UNDER_WAY_USING_ENGINE = 0,
  AT_ANCHOR = 1,
  NOT_UNDER_COMMAND = 2,
  RESTRICTED_MANEUVERABILITY = 3,
  CONSTRAINED_BY_DRAUGHT = 4,
  MOORED = 5,
  AGROUND = 6,
  ENGAGED_IN_FISHING = 7,
  UNDER_WAY_SAILING = 8,
  HSC = 11, // High Speed Craft
  WIG = 12, // Wing In Ground
  RESERVED = 13,
  AIS_SART = 14,
  UNDEFINED = 15
}

/**
 * Vessel density calculation result
 */
export interface VesselDensity {
  gridCell: {
    latitude: number;
    longitude: number;
    sizeKm: number;
  };
  metrics: {
    vesselCount: number;
    averageSpeed: number;
    dominantType: VesselType;
    totalValue: number;
    communicationDemandGbps: number;
  };
  temporal: {
    hour: number;
    dayOfWeek: number;
    seasonal: 'peak' | 'normal' | 'low';
  };
}

/**
 * Maritime value scoring configuration
 */
export const VESSEL_VALUE_SCORING = {
  // Base scores by vessel type (0-100)
  typeScores: {
    [VesselType.CRUISE_SHIP]: 100,
    [VesselType.OFFSHORE_PLATFORM]: 95,
    [VesselType.DRILLING_RIG]: 92,
    [VesselType.FPSO]: 90,
    [VesselType.LNG_CARRIER]: 88,
    [VesselType.CONTAINER_SHIP]: 85,
    [VesselType.OIL_TANKER]: 83,
    [VesselType.PASSENGER_FERRY]: 80,
    [VesselType.CHEMICAL_TANKER]: 78,
    [VesselType.CAR_CARRIER]: 75,
    [VesselType.OFFSHORE_SUPPLY]: 73,
    [VesselType.NAVAL_VESSEL]: 70,
    [VesselType.BULK_CARRIER]: 65,
    [VesselType.GENERAL_CARGO]: 60,
    [VesselType.REEFER_VESSEL]: 58,
    [VesselType.RESEARCH_VESSEL]: 55,
    [VesselType.COAST_GUARD]: 50,
    [VesselType.YACHT]: 45,
    [VesselType.FISHING_VESSEL]: 30,
    [VesselType.TUG_BOAT]: 25,
    [VesselType.PILOT_VESSEL]: 20,
    [VesselType.UNKNOWN]: 10
  },
  
  // Monthly revenue potential per vessel type (USD)
  revenueByType: {
    [VesselType.CRUISE_SHIP]: 45000,
    [VesselType.OFFSHORE_PLATFORM]: 85000,
    [VesselType.DRILLING_RIG]: 75000,
    [VesselType.FPSO]: 70000,
    [VesselType.LNG_CARRIER]: 35000,
    [VesselType.CONTAINER_SHIP]: 28000,
    [VesselType.OIL_TANKER]: 30000,
    [VesselType.PASSENGER_FERRY]: 22000,
    [VesselType.CHEMICAL_TANKER]: 26000,
    [VesselType.CAR_CARRIER]: 24000,
    [VesselType.OFFSHORE_SUPPLY]: 32000,
    [VesselType.NAVAL_VESSEL]: 40000,
    [VesselType.BULK_CARRIER]: 18000,
    [VesselType.GENERAL_CARGO]: 15000,
    [VesselType.REEFER_VESSEL]: 20000,
    [VesselType.RESEARCH_VESSEL]: 25000,
    [VesselType.COAST_GUARD]: 30000,
    [VesselType.YACHT]: 12000,
    [VesselType.FISHING_VESSEL]: 5000,
    [VesselType.TUG_BOAT]: 8000,
    [VesselType.PILOT_VESSEL]: 6000,
    [VesselType.UNKNOWN]: 3000
  },
  
  // Data requirements GB/month by vessel type
  dataRequirements: {
    [VesselType.CRUISE_SHIP]: 500,
    [VesselType.OFFSHORE_PLATFORM]: 1200,
    [VesselType.DRILLING_RIG]: 800,
    [VesselType.FPSO]: 900,
    [VesselType.LNG_CARRIER]: 250,
    [VesselType.CONTAINER_SHIP]: 300,
    [VesselType.OIL_TANKER]: 280,
    [VesselType.PASSENGER_FERRY]: 400,
    [VesselType.CHEMICAL_TANKER]: 240,
    [VesselType.CAR_CARRIER]: 220,
    [VesselType.OFFSHORE_SUPPLY]: 350,
    [VesselType.NAVAL_VESSEL]: 600,
    [VesselType.BULK_CARRIER]: 180,
    [VesselType.GENERAL_CARGO]: 150,
    [VesselType.REEFER_VESSEL]: 200,
    [VesselType.RESEARCH_VESSEL]: 450,
    [VesselType.COAST_GUARD]: 380,
    [VesselType.YACHT]: 120,
    [VesselType.FISHING_VESSEL]: 50,
    [VesselType.TUG_BOAT]: 60,
    [VesselType.PILOT_VESSEL]: 40,
    [VesselType.UNKNOWN]: 30
  }
};

/**
 * Maritime Data Ingestion and Processing Service
 */
export class MaritimeDataIngestionService {
  private dataSources: AISDataSource[] = [];
  private vesselCache: Map<string, VesselAISData> = new Map();
  private densityGrid: Map<string, VesselDensity> = new Map();
  private lastUpdate: Date = new Date();
  
  constructor() {
    this.initializeDataSources();
  }
  
  /**
   * Initialize AIS data sources
   */
  private initializeDataSources(): void {
    this.dataSources = [
      {
        sourceId: 'sat-ais-global',
        name: 'Satellite AIS Global Feed',
        type: 'satellite',
        coverage: {
          regions: ['Global'],
          rangeNm: 99999,
          updateFrequency: 300 // 5 minutes
        },
        reliability: 95,
        latency: 5000,
        cost: {
          monthly: 25000,
          perMessage: 0.001
        },
        capabilities: {
          realTime: true,
          historical: true,
          predictive: false
        }
      },
      {
        sourceId: 'coastal-ais-network',
        name: 'Coastal AIS Network',
        type: 'terrestrial',
        coverage: {
          regions: ['North America', 'Europe', 'Asia Pacific'],
          rangeNm: 40,
          updateFrequency: 10
        },
        reliability: 99,
        latency: 100,
        cost: {
          monthly: 5000,
          perMessage: 0.0001
        },
        capabilities: {
          realTime: true,
          historical: true,
          predictive: false
        }
      },
      {
        sourceId: 'hybrid-maritime-intel',
        name: 'Hybrid Maritime Intelligence',
        type: 'hybrid',
        coverage: {
          regions: ['Global'],
          rangeNm: 99999,
          updateFrequency: 60
        },
        reliability: 98,
        latency: 1000,
        cost: {
          monthly: 35000,
          perMessage: 0.0005
        },
        capabilities: {
          realTime: true,
          historical: true,
          predictive: true
        }
      }
    ];
  }
  
  /**
   * Ingest AIS data from configured sources
   */
  async ingestAISData(region?: string): Promise<VesselAISData[]> {
    const vessels: VesselAISData[] = [];
    
    // Simulate data ingestion from multiple sources
    for (const source of this.dataSources) {
      if (!region || source.coverage.regions.includes(region) || source.coverage.regions.includes('Global')) {
        const sourceVessels = await this.fetchFromSource(source);
        vessels.push(...sourceVessels);
      }
    }
    
    // Update cache
    vessels.forEach(vessel => {
      this.vesselCache.set(vessel.mmsi, vessel);
    });
    
    this.lastUpdate = new Date();
    return vessels;
  }
  
  /**
   * Fetch data from a specific AIS source (simulated)
   */
  private async fetchFromSource(source: AISDataSource): Promise<VesselAISData[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, source.latency));
    
    // Generate realistic vessel data based on source coverage
    const vesselCount = Math.floor(Math.random() * 100) + 50;
    const vessels: VesselAISData[] = [];
    
    for (let i = 0; i < vesselCount; i++) {
      vessels.push(this.generateRealisticVessel(source));
    }
    
    return vessels;
  }
  
  /**
   * Generate realistic vessel data
   */
  private generateRealisticVessel(source: AISDataSource): VesselAISData {
    const vesselTypes = Object.values(VesselType);
    const type = this.weightedVesselTypeSelection();
    const mmsi = this.generateMMSI();
    
    const vessel: VesselAISData = {
      mmsi,
      imo: Math.random() > 0.3 ? `IMO${Math.floor(Math.random() * 9000000) + 1000000}` : undefined,
      callSign: this.generateCallSign(),
      name: this.generateVesselName(type),
      flag: this.selectFlag(),
      
      position: {
        latitude: (Math.random() * 180) - 90,
        longitude: (Math.random() * 360) - 180,
        accuracy: Math.random() * 10,
        timestamp: new Date()
      },
      
      movement: {
        speedKnots: this.generateSpeed(type),
        course: Math.random() * 360,
        heading: Math.random() * 360,
        rateOfTurn: Math.random() * 20 - 10,
        navigationStatus: this.selectNavigationStatus(type)
      },
      
      vessel: {
        type,
        length: this.generateLength(type),
        beam: this.generateBeam(type),
        draft: this.generateDraft(type),
        grossTonnage: this.generateTonnage(type),
        deadweight: this.generateDeadweight(type)
      },
      
      voyage: {
        destination: this.generateDestination(),
        eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        cargo: this.generateCargo(type),
        hazardous: Math.random() > 0.8,
        personCount: this.generatePersonCount(type)
      },
      
      communication: {
        satelliteEquipped: Math.random() > 0.3,
        vsat: Math.random() > 0.5,
        fleetBroadband: Math.random() > 0.6,
        iridium: Math.random() > 0.7,
        dataRequirementGbPerMonth: VESSEL_VALUE_SCORING.dataRequirements[type] || 100
      },
      
      value: this.calculateVesselValue(type)
    };
    
    return vessel;
  }
  
  /**
   * Weighted vessel type selection (realistic distribution)
   */
  private weightedVesselTypeSelection(): VesselType {
    const weights = {
      [VesselType.CONTAINER_SHIP]: 20,
      [VesselType.BULK_CARRIER]: 18,
      [VesselType.OIL_TANKER]: 15,
      [VesselType.GENERAL_CARGO]: 12,
      [VesselType.FISHING_VESSEL]: 10,
      [VesselType.CHEMICAL_TANKER]: 5,
      [VesselType.CAR_CARRIER]: 4,
      [VesselType.LNG_CARRIER]: 3,
      [VesselType.CRUISE_SHIP]: 2,
      [VesselType.PASSENGER_FERRY]: 2,
      [VesselType.OFFSHORE_SUPPLY]: 2,
      [VesselType.TUG_BOAT]: 2,
      [VesselType.YACHT]: 1,
      [VesselType.DRILLING_RIG]: 1,
      [VesselType.OFFSHORE_PLATFORM]: 1,
      [VesselType.FPSO]: 0.5,
      [VesselType.NAVAL_VESSEL]: 0.5,
      [VesselType.RESEARCH_VESSEL]: 0.5,
      [VesselType.COAST_GUARD]: 0.3,
      [VesselType.PILOT_VESSEL]: 0.2,
      [VesselType.REEFER_VESSEL]: 1,
      [VesselType.UNKNOWN]: 1
    };
    
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type as VesselType;
      }
    }
    
    return VesselType.UNKNOWN;
  }
  
  /**
   * Calculate vessel density in a grid
   */
  calculateVesselDensity(
    centerLat: number,
    centerLon: number,
    gridSizeKm: number = 50
  ): VesselDensity[] {
    const densities: VesselDensity[] = [];
    const gridSteps = 10; // 10x10 grid
    
    for (let i = -gridSteps / 2; i < gridSteps / 2; i++) {
      for (let j = -gridSteps / 2; j < gridSteps / 2; j++) {
        const lat = centerLat + (i * gridSizeKm / 111); // ~111km per degree latitude
        const lon = centerLon + (j * gridSizeKm / (111 * Math.cos(centerLat * Math.PI / 180)));
        
        const vesselsInCell = this.getVesselsInArea(lat, lon, gridSizeKm);
        
        if (vesselsInCell.length > 0) {
          const density = this.calculateCellDensity(lat, lon, gridSizeKm, vesselsInCell);
          densities.push(density);
          
          // Cache density
          const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
          this.densityGrid.set(key, density);
        }
      }
    }
    
    return densities;
  }
  
  /**
   * Get vessels in a specific area
   */
  private getVesselsInArea(
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): VesselAISData[] {
    const vessels: VesselAISData[] = [];
    
    this.vesselCache.forEach(vessel => {
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        vessel.position.latitude,
        vessel.position.longitude
      );
      
      if (distance <= radiusKm) {
        vessels.push(vessel);
      }
    });
    
    return vessels;
  }
  
  /**
   * Calculate density metrics for a grid cell
   */
  private calculateCellDensity(
    lat: number,
    lon: number,
    sizeKm: number,
    vessels: VesselAISData[]
  ): VesselDensity {
    const typeCount = new Map<VesselType, number>();
    let totalSpeed = 0;
    let totalValue = 0;
    let totalDataDemand = 0;
    
    vessels.forEach(vessel => {
      const count = typeCount.get(vessel.vessel.type) || 0;
      typeCount.set(vessel.vessel.type, count + 1);
      
      totalSpeed += vessel.movement.speedKnots;
      totalValue += vessel.value.monthlyRevenuePotential;
      totalDataDemand += vessel.communication.dataRequirementGbPerMonth || 0;
    });
    
    // Find dominant vessel type
    let dominantType = VesselType.UNKNOWN;
    let maxCount = 0;
    typeCount.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    return {
      gridCell: {
        latitude: lat,
        longitude: lon,
        sizeKm
      },
      metrics: {
        vesselCount: vessels.length,
        averageSpeed: vessels.length > 0 ? totalSpeed / vessels.length : 0,
        dominantType,
        totalValue,
        communicationDemandGbps: totalDataDemand / (30 * 24 * 3600) // Convert monthly GB to Gbps
      },
      temporal: {
        hour,
        dayOfWeek,
        seasonal: this.determineSeasonal()
      }
    };
  }
  
  /**
   * Calculate value score for a vessel
   */
  private calculateVesselValue(type: VesselType): {
    score: number;
    tier: 'premium' | 'standard' | 'basic';
    monthlyRevenuePotential: number;
  } {
    const baseScore = VESSEL_VALUE_SCORING.typeScores[type] || 10;
    const revenue = VESSEL_VALUE_SCORING.revenueByType[type] || 1000;
    
    // Add random variation
    const variation = (Math.random() - 0.5) * 0.2; // ±10%
    const score = Math.max(0, Math.min(100, baseScore * (1 + variation)));
    
    let tier: 'premium' | 'standard' | 'basic';
    if (score >= 70) tier = 'premium';
    else if (score >= 40) tier = 'standard';
    else tier = 'basic';
    
    return {
      score,
      tier,
      monthlyRevenuePotential: Math.round(revenue * (1 + variation))
    };
  }
  
  /**
   * Score maritime opportunity for a ground station
   */
  scoreMaritimeOpportunity(station: GroundStationAnalytics): number {
    const nearbyDensities = this.calculateVesselDensity(
      station.location.latitude,
      station.location.longitude,
      500 // 500km radius
    );
    
    if (nearbyDensities.length === 0) return 0;
    
    // Calculate total opportunity score
    let totalScore = 0;
    let totalValue = 0;
    let totalDemand = 0;
    
    nearbyDensities.forEach(density => {
      totalValue += density.metrics.totalValue;
      totalDemand += density.metrics.communicationDemandGbps;
      
      // Weight by vessel count and value
      const cellScore = (density.metrics.vesselCount * 0.3) +
                       (density.metrics.totalValue / 10000 * 0.5) +
                       (density.metrics.communicationDemandGbps * 100 * 0.2);
      
      totalScore += cellScore;
    });
    
    // Normalize score to 0-100
    const normalizedScore = Math.min(100, totalScore / nearbyDensities.length);
    
    return normalizedScore;
  }
  
  /**
   * Get maritime market insights
   */
  getMaritimeInsights(): {
    totalVessels: number;
    totalMarketValue: number;
    topRoutes: string[];
    peakHours: number[];
    growthTrend: number;
  } {
    let totalValue = 0;
    const routeCount = new Map<string, number>();
    const hourActivity = new Array(24).fill(0);
    
    this.vesselCache.forEach(vessel => {
      totalValue += vessel.value.monthlyRevenuePotential;
      
      if (vessel.voyage?.destination) {
        const route = `${vessel.flag || 'Unknown'} -> ${vessel.voyage.destination}`;
        routeCount.set(route, (routeCount.get(route) || 0) + 1);
      }
      
      const hour = vessel.position.timestamp.getHours();
      hourActivity[hour]++;
    });
    
    // Get top routes
    const topRoutes = Array.from(routeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route]) => route);
    
    // Get peak hours
    const peakHours = hourActivity
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
    
    return {
      totalVessels: this.vesselCache.size,
      totalMarketValue: totalValue,
      topRoutes,
      peakHours,
      growthTrend: 8.5 // Annual growth percentage
    };
  }
  
  // Helper methods
  
  private generateMMSI(): string {
    return Math.floor(Math.random() * 900000000 + 100000000).toString();
  }
  
  private generateCallSign(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)] +
           numbers[Math.floor(Math.random() * 10)] +
           letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)];
  }
  
  private generateVesselName(type: VesselType): string {
    const prefixes = ['MV', 'MS', 'MT', 'SS', 'RV', 'FV'];
    const names = ['HORIZON', 'ATLANTIC', 'PACIFIC', 'SEABORNE', 'OCEAN', 'MARITIME',
                  'EXPLORER', 'NAVIGATOR', 'VOYAGER', 'TRADER', 'CARRIER', 'EXPRESS'];
    const suffixes = ['STAR', 'SPIRIT', 'DREAM', 'PRIDE', 'GLORY', 'FORTUNE'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const suffix = Math.random() > 0.5 ? ' ' + suffixes[Math.floor(Math.random() * suffixes.length)] : '';
    
    return `${prefix} ${name}${suffix}`;
  }
  
  private selectFlag(): string {
    const flags = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore',
                  'Malta', 'Bahamas', 'Greece', 'Cyprus', 'China', 'Japan', 'Norway',
                  'United Kingdom', 'United States', 'Denmark', 'Germany', 'Netherlands'];
    return flags[Math.floor(Math.random() * flags.length)];
  }
  
  private generateSpeed(type: VesselType): number {
    const speedRanges = {
      [VesselType.CONTAINER_SHIP]: [18, 25],
      [VesselType.OIL_TANKER]: [12, 16],
      [VesselType.BULK_CARRIER]: [12, 15],
      [VesselType.CRUISE_SHIP]: [20, 24],
      [VesselType.LNG_CARRIER]: [18, 20],
      [VesselType.PASSENGER_FERRY]: [25, 40],
      [VesselType.OFFSHORE_PLATFORM]: [0, 0],
      [VesselType.DRILLING_RIG]: [0, 4],
      [VesselType.FISHING_VESSEL]: [8, 12]
    };
    
    const range = speedRanges[type] || [10, 20];
    return range[0] + Math.random() * (range[1] - range[0]);
  }
  
  private selectNavigationStatus(type: VesselType): NavigationStatus {
    if (type === VesselType.OFFSHORE_PLATFORM) return NavigationStatus.MOORED;
    if (type === VesselType.DRILLING_RIG) return NavigationStatus.RESTRICTED_MANEUVERABILITY;
    if (type === VesselType.FISHING_VESSEL && Math.random() > 0.5) return NavigationStatus.ENGAGED_IN_FISHING;
    
    return Math.random() > 0.8 ? NavigationStatus.AT_ANCHOR : NavigationStatus.UNDER_WAY_USING_ENGINE;
  }
  
  private generateLength(type: VesselType): number {
    const lengths = {
      [VesselType.CONTAINER_SHIP]: [200, 400],
      [VesselType.OIL_TANKER]: [250, 380],
      [VesselType.BULK_CARRIER]: [180, 300],
      [VesselType.CRUISE_SHIP]: [250, 360],
      [VesselType.LNG_CARRIER]: [280, 345],
      [VesselType.PASSENGER_FERRY]: [100, 200],
      [VesselType.OFFSHORE_PLATFORM]: [100, 150],
      [VesselType.DRILLING_RIG]: [100, 200],
      [VesselType.FISHING_VESSEL]: [20, 80]
    };
    
    const range = lengths[type] || [50, 150];
    return range[0] + Math.random() * (range[1] - range[0]);
  }
  
  private generateBeam(type: VesselType): number {
    const length = this.generateLength(type);
    return length / (5 + Math.random() * 3); // Typical length/beam ratio
  }
  
  private generateDraft(type: VesselType): number {
    const drafts = {
      [VesselType.CONTAINER_SHIP]: [12, 16],
      [VesselType.OIL_TANKER]: [15, 22],
      [VesselType.BULK_CARRIER]: [10, 18],
      [VesselType.CRUISE_SHIP]: [8, 10],
      [VesselType.LNG_CARRIER]: [11, 12],
      [VesselType.OFFSHORE_PLATFORM]: [20, 30]
    };
    
    const range = drafts[type] || [5, 10];
    return range[0] + Math.random() * (range[1] - range[0]);
  }
  
  private generateTonnage(type: VesselType): number {
    const tonnages = {
      [VesselType.CONTAINER_SHIP]: [50000, 220000],
      [VesselType.OIL_TANKER]: [80000, 320000],
      [VesselType.BULK_CARRIER]: [40000, 200000],
      [VesselType.CRUISE_SHIP]: [70000, 230000],
      [VesselType.LNG_CARRIER]: [60000, 170000]
    };
    
    const range = tonnages[type] || [5000, 50000];
    return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
  }
  
  private generateDeadweight(type: VesselType): number {
    const tonnage = this.generateTonnage(type);
    return Math.floor(tonnage * (1.2 + Math.random() * 0.4));
  }
  
  private generateDestination(): string {
    const ports = ['Singapore', 'Shanghai', 'Rotterdam', 'Antwerp', 'Hamburg',
                  'Los Angeles', 'Long Beach', 'New York', 'Hong Kong', 'Busan',
                  'Dubai', 'Port Said', 'Santos', 'Mumbai', 'Tokyo'];
    return ports[Math.floor(Math.random() * ports.length)];
  }
  
  private generateCargo(type: VesselType): string {
    const cargoTypes = {
      [VesselType.CONTAINER_SHIP]: ['General Cargo', 'Mixed Containers', 'Electronics', 'Machinery'],
      [VesselType.OIL_TANKER]: ['Crude Oil', 'Refined Products', 'Petroleum', 'Fuel Oil'],
      [VesselType.BULK_CARRIER]: ['Iron Ore', 'Coal', 'Grain', 'Bauxite', 'Phosphate'],
      [VesselType.LNG_CARRIER]: ['LNG', 'LPG', 'Natural Gas'],
      [VesselType.CHEMICAL_TANKER]: ['Chemicals', 'Acids', 'Methanol', 'Ethanol'],
      [VesselType.CAR_CARRIER]: ['Vehicles', 'Cars', 'Trucks', 'Heavy Machinery']
    };
    
    const options = cargoTypes[type] || ['General Cargo'];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  private generatePersonCount(type: VesselType): number {
    const counts = {
      [VesselType.CRUISE_SHIP]: [2000, 6000],
      [VesselType.PASSENGER_FERRY]: [200, 2000],
      [VesselType.CONTAINER_SHIP]: [15, 25],
      [VesselType.OIL_TANKER]: [20, 30],
      [VesselType.OFFSHORE_PLATFORM]: [100, 300],
      [VesselType.DRILLING_RIG]: [80, 200]
    };
    
    const range = counts[type] || [10, 30];
    return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
  }
  
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
  
  private determineSeasonal(): 'peak' | 'normal' | 'low' {
    const month = new Date().getMonth();
    // Northern hemisphere summer is peak shipping season
    if (month >= 5 && month <= 9) return 'peak';
    if (month === 11 || month === 0 || month === 1) return 'low';
    return 'normal';
  }

  /**
   * Get grid cell data for maritime opportunity scoring
   */
  getGridCell(lat: number, lon: number): { metrics: { avg_daily_vessels: number } } | null {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.densityGrid.get(key);
    
    if (cached) {
      return {
        metrics: {
          avg_daily_vessels: cached.metrics.vesselCount
        }
      };
    }
    
    // Calculate on demand if not cached
    const vesselsInArea = this.getVesselsInArea(lat, lon, 25); // 25km radius
    return {
      metrics: {
        avg_daily_vessels: vesselsInArea.length
      }
    };
  }
}

// Export singleton instance
export const maritimeDataService = new MaritimeDataIngestionService();