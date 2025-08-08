/**
 * Advanced Maritime Coverage Analysis and Shipping Lane Proximity Scoring
 * 
 * This module provides comprehensive maritime market analysis for satellite ground stations:
 * - Global shipping lane mapping and traffic density analysis
 * - Port proximity and accessibility scoring with size classifications
 * - Maritime service demand modeling across cargo, cruise, fishing, and offshore sectors
 * - Vessel tracking and communication requirements analysis
 * - Maritime regulatory compliance and flag state considerations
 * - Offshore infrastructure and energy sector analysis
 * - Search and rescue (SAR) coverage requirements
 * - Weather routing and operational efficiency opportunities
 */

import { MaritimeAnalysisResult } from './conditional-opportunity-scorer';

export interface ShippingLane {
  name: string;
  type: 'MAJOR_TRUNK' | 'REGIONAL' | 'FEEDER' | 'COASTAL';
  route: Array<[number, number]>; // [lat, lon] waypoints
  annualTransits: number;
  averageVesselSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ULTRA_LARGE';
  cargoTypes: Array<'CONTAINER' | 'BULK' | 'TANKER' | 'PASSENGER' | 'RO_RO'>;
  seasonalVariation: {
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  };
  communicationRequirements: {
    dataIntensity: 'LOW' | 'MEDIUM' | 'HIGH';
    latencyRequirements: 'TOLERANT' | 'MODERATE' | 'CRITICAL';
    reliability: 'STANDARD' | 'HIGH' | 'MISSION_CRITICAL';
  };
  regulatoryZone: 'INTERNATIONAL' | 'EEZ' | 'TERRITORIAL';
}

export interface Port {
  name: string;
  coordinates: [number, number];
  size: 'MAJOR' | 'REGIONAL' | 'LOCAL';
  type: 'CONTAINER' | 'BULK' | 'CRUISE' | 'FISHING' | 'ENERGY' | 'MIXED';
  annualTEU?: number; // For container ports
  vesselCalls: number;
  hinterland: {
    populationServed: number;
    economicValue: number; // USD
    industrialComplexity: number; // 0-1
  };
  digitalServices: {
    portCommunitySystem: boolean;
    vesselTrafficManagement: boolean;
    cargoTracking: boolean;
    customsIntegration: boolean;
  };
  futureExpansion: {
    planned: boolean;
    investmentValue: number;
    timeframe: number; // years
  };
}

export interface MaritimeMarketSegment {
  segment: 'COMMERCIAL_SHIPPING' | 'CRUISE' | 'FISHING' | 'OFFSHORE_ENERGY' | 'NAVAL' | 'RESEARCH';
  currentMarketSize: number; // USD
  growthRate: number; // annual %
  communicationSpending: number; // USD per vessel per year
  technologyAdoption: 'EARLY' | 'MAINSTREAM' | 'CONSERVATIVE';
  serviceRequirements: {
    voiceServices: boolean;
    dataServices: boolean;
    iotTelemetry: boolean;
    videoServices: boolean;
    emergencyServices: boolean;
  };
  priceSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  contractDuration: number; // typical months
  seasonality: Record<string, number>;
}

export interface OffshoreInfrastructure {
  type: 'OIL_RIG' | 'WIND_FARM' | 'SUBSEA_CABLE' | 'RESEARCH_STATION';
  coordinates: [number, number];
  operationalStaff: number;
  communicationBudget: number; // USD per year
  criticalityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  remoteLocation: boolean; // Beyond terrestrial coverage
  emergencyRequirements: boolean;
}

export interface MaritimeRegulation {
  imoCompliance: boolean;
  gmdssRequirements: boolean;
  flagStateRules: string[];
  environmentalRestrictions: string[];
  emergencyResponseRequirements: boolean;
  dataRetentionRequirements: boolean;
}

export interface WeatherRouting {
  routeOptimization: 'FUEL' | 'TIME' | 'SAFETY' | 'EMISSIONS';
  weatherDataRequirements: 'BASIC' | 'ADVANCED' | 'PREMIUM';
  forecastHorizon: number; // hours
  updateFrequency: number; // minutes
  dataVolume: number; // MB per update
}

/**
 * Advanced Maritime Analysis Engine
 */
export class MaritimeAnalyzer {
  private shippingLanes: ShippingLane[] = [];
  private ports: Port[] = [];
  private offshoreAssets: OffshoreInfrastructure[] = [];
  private maritimeCache: Map<string, MaritimeAnalysisResult> = new Map();
  
  constructor() {
    this.initializeMaritimeData();
  }
  
  /**
   * Perform comprehensive maritime analysis for a location
   */
  async analyzeMaritimeCoverage(lat: number, lon: number): Promise<MaritimeAnalysisResult> {
    const cacheKey = `${Math.round(lat * 10)},${Math.round(lon * 10)}`;
    const cached = this.maritimeCache.get(cacheKey);
    if (cached) return cached;
    
    // Shipping lane proximity analysis
    const shippingLaneProximity = this.analyzeShippingLaneProximity(lat, lon);
    
    // Port accessibility analysis
    const portAccessibility = this.analyzePortAccessibility(lat, lon);
    
    // Maritime services potential
    const maritimeServices = this.analyzeMaritimeServicesPotential(lat, lon);
    
    const result: MaritimeAnalysisResult = {
      shippingLaneProximity,
      portAccessibility,
      maritimeServices
    };
    
    this.maritimeCache.set(cacheKey, result);
    return result;
  }
  
  /**
   * Analyze proximity to major shipping lanes
   */
  private analyzeShippingLaneProximity(lat: number, lon: number): MaritimeAnalysisResult['shippingLaneProximity'] {
    let nearestLane = { distance: Infinity, traffic: 0 };
    let corridorCount = 0;
    let totalTraffic = 0;
    
    // Check distance to each shipping lane
    for (const lane of this.shippingLanes) {
      const distanceToLane = this.calculateDistanceToLane(lat, lon, lane);
      
      if (distanceToLane <= 500) { // Within 500km
        corridorCount++;
        totalTraffic += lane.annualTransits;
        
        if (distanceToLane < nearestLane.distance) {
          nearestLane = {
            distance: distanceToLane,
            traffic: lane.annualTransits
          };
        }
      }
    }
    
    return {
      nearestLane,
      corridorCount,
      totalTraffic
    };
  }
  
  /**
   * Analyze port accessibility and connectivity
   */
  private analyzePortAccessibility(lat: number, lon: number): MaritimeAnalysisResult['portAccessibility'] {
    const nearbyPorts = this.ports
      .map(port => ({
        port,
        distance: this.calculateDistance(lat, lon, port.coordinates[0], port.coordinates[1])
      }))
      .filter(item => item.distance <= 1000) // Within 1000km
      .sort((a, b) => a.distance - b.distance);
    
    const nearestPort = nearbyPorts[0];
    
    if (!nearestPort) {
      return {
        nearestPort: { distance: Infinity, size: 'LOCAL' },
        connectivity: 0,
        logistics: 0
      };
    }
    
    // Calculate connectivity score based on port characteristics
    const connectivity = this.calculatePortConnectivity(nearestPort.port, nearestPort.distance);
    
    // Calculate logistics score
    const logistics = this.calculateLogisticsScore(nearbyPorts);
    
    return {
      nearestPort: {
        distance: nearestPort.distance,
        size: nearestPort.port.size
      },
      connectivity,
      logistics
    };
  }
  
  /**
   * Analyze maritime services potential
   */
  private analyzeMaritimeServicesPotential(lat: number, lon: number): MaritimeAnalysisResult['maritimeServices'] {
    // Analyze market segments
    const segments = this.analyzeMaritimeMarketSegments(lat, lon);
    
    // Calculate potential based on traffic and infrastructure
    const shippingTraffic = this.calculateLocalShippingTraffic(lat, lon);
    const offshoreActivity = this.calculateOffshoreActivity(lat, lon);
    const fishingActivity = this.calculateFishingActivity(lat, lon);
    
    const potential = Math.min(100,
      shippingTraffic * 0.4 +
      offshoreActivity * 0.3 +
      fishingActivity * 0.3
    );
    
    // Assess competition from existing maritime communication providers
    const competition = this.assessMaritimeCompetition(lat, lon);
    
    // Identify specialization opportunities
    const specialization = this.identifyMaritimeSpecialization(lat, lon, segments);
    
    return {
      potential,
      competition,
      specialization
    };
  }
  
  /**
   * Calculate distance to shipping lane (minimum distance to any point on the lane)
   */
  private calculateDistanceToLane(lat: number, lon: number, lane: ShippingLane): number {
    let minDistance = Infinity;
    
    // Check distance to each segment of the lane
    for (let i = 0; i < lane.route.length - 1; i++) {
      const segmentStart = lane.route[i];
      const segmentEnd = lane.route[i + 1];
      
      const distanceToSegment = this.calculateDistanceToLineSegment(
        lat, lon,
        segmentStart[0], segmentStart[1],
        segmentEnd[0], segmentEnd[1]
      );
      
      minDistance = Math.min(minDistance, distanceToSegment);
    }
    
    return minDistance;
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private calculateDistanceToLineSegment(
    px: number, py: number, // Point
    x1: number, y1: number, // Line start
    x2: number, y2: number  // Line end
  ): number {
    // Convert to radians for spherical calculations
    const toRad = (deg: number) => deg * Math.PI / 180;
    
    const lat1 = toRad(y1), lon1 = toRad(x1);
    const lat2 = toRad(y2), lon2 = toRad(x2);
    const latP = toRad(py), lonP = toRad(px);
    
    // Use great circle calculations for accuracy
    const R = 6371; // Earth radius in km
    
    // Distance to endpoints
    const d1 = this.calculateDistance(py, px, y1, x1);
    const d2 = this.calculateDistance(py, px, y2, x2);
    
    // Calculate cross-track distance (simplified)
    const bearing1 = Math.atan2(
      Math.sin(lon2 - lon1) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
    );
    
    const bearingP = Math.atan2(
      Math.sin(lonP - lon1) * Math.cos(latP),
      Math.cos(lat1) * Math.sin(latP) - Math.sin(lat1) * Math.cos(latP) * Math.cos(lonP - lon1)
    );
    
    const crossTrack = Math.asin(Math.sin(d1/R) * Math.sin(bearingP - bearing1)) * R;
    
    return Math.min(d1, d2, Math.abs(crossTrack));
  }
  
  /**
   * Calculate port connectivity score
   */
  private calculatePortConnectivity(port: Port, distance: number): number {
    let score = 0;
    
    // Size factor
    const sizeScore = { MAJOR: 30, REGIONAL: 20, LOCAL: 10 }[port.size];
    score += sizeScore;
    
    // Distance factor (closer is better)
    const distanceScore = Math.max(0, 30 - distance / 20); // Penalty for distance
    score += distanceScore;
    
    // Digital services factor
    const digitalScore = Object.values(port.digitalServices).filter(Boolean).length * 5;
    score += digitalScore;
    
    // Economic importance
    const economicScore = Math.min(20, port.hinterland.economicValue / 10000000);
    score += economicScore;
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate logistics score based on multiple nearby ports
   */
  private calculateLogisticsScore(nearbyPorts: Array<{ port: Port, distance: number }>): number {
    let score = 0;
    
    // Multiple port options increase logistics flexibility
    score += Math.min(30, nearbyPorts.length * 10);
    
    // Port diversity (different types)
    const portTypes = new Set(nearbyPorts.map(p => p.port.type));
    score += portTypes.size * 5;
    
    // Major port accessibility
    const majorPorts = nearbyPorts.filter(p => p.port.size === 'MAJOR');
    score += Math.min(25, majorPorts.length * 15);
    
    // Average distance factor
    if (nearbyPorts.length > 0) {
      const avgDistance = nearbyPorts.reduce((sum, p) => sum + p.distance, 0) / nearbyPorts.length;
      score += Math.max(0, 20 - avgDistance / 25);
    }
    
    return Math.min(100, score);
  }
  
  /**
   * Analyze maritime market segments for the location
   */
  private analyzeMaritimeMarketSegments(lat: number, lon: number): MaritimeMarketSegment[] {
    const segments: MaritimeMarketSegment[] = [];
    
    // Commercial shipping segment
    const shippingTraffic = this.calculateLocalShippingTraffic(lat, lon);
    if (shippingTraffic > 10) {
      segments.push({
        segment: 'COMMERCIAL_SHIPPING',
        currentMarketSize: shippingTraffic * 50000, // $50k per vessel per year
        growthRate: 3.5,
        communicationSpending: 50000,
        technologyAdoption: 'MAINSTREAM',
        serviceRequirements: {
          voiceServices: true,
          dataServices: true,
          iotTelemetry: true,
          videoServices: false,
          emergencyServices: true
        },
        priceSensitivity: 'MEDIUM',
        contractDuration: 24,
        seasonality: { Q1: 0.9, Q2: 1.1, Q3: 1.2, Q4: 0.8 }
      });
    }
    
    // Cruise segment (if in cruise corridors)
    const cruiseActivity = this.calculateCruiseActivity(lat, lon);
    if (cruiseActivity > 5) {
      segments.push({
        segment: 'CRUISE',
        currentMarketSize: cruiseActivity * 200000, // $200k per vessel per year
        growthRate: 5.0,
        communicationSpending: 200000,
        technologyAdoption: 'EARLY',
        serviceRequirements: {
          voiceServices: true,
          dataServices: true,
          iotTelemetry: false,
          videoServices: true,
          emergencyServices: true
        },
        priceSensitivity: 'LOW',
        contractDuration: 36,
        seasonality: { Q1: 0.7, Q2: 1.3, Q3: 1.4, Q4: 0.6 }
      });
    }
    
    // Fishing segment
    const fishingActivity = this.calculateFishingActivity(lat, lon);
    if (fishingActivity > 20) {
      segments.push({
        segment: 'FISHING',
        currentMarketSize: fishingActivity * 15000, // $15k per vessel per year
        growthRate: 2.0,
        communicationSpending: 15000,
        technologyAdoption: 'CONSERVATIVE',
        serviceRequirements: {
          voiceServices: true,
          dataServices: false,
          iotTelemetry: true,
          videoServices: false,
          emergencyServices: true
        },
        priceSensitivity: 'HIGH',
        contractDuration: 12,
        seasonality: { Q1: 1.2, Q2: 1.1, Q3: 0.8, Q4: 0.9 }
      });
    }
    
    // Offshore energy segment
    const offshoreActivity = this.calculateOffshoreActivity(lat, lon);
    if (offshoreActivity > 15) {
      segments.push({
        segment: 'OFFSHORE_ENERGY',
        currentMarketSize: offshoreActivity * 100000, // $100k per installation per year
        growthRate: 7.0,
        communicationSpending: 100000,
        technologyAdoption: 'MAINSTREAM',
        serviceRequirements: {
          voiceServices: true,
          dataServices: true,
          iotTelemetry: true,
          videoServices: true,
          emergencyServices: true
        },
        priceSensitivity: 'LOW',
        contractDuration: 60,
        seasonality: { Q1: 1.0, Q2: 1.0, Q3: 1.0, Q4: 1.0 }
      });
    }
    
    return segments;
  }
  
  /**
   * Calculate local shipping traffic density
   */
  private calculateLocalShippingTraffic(lat: number, lon: number): number {
    let traffic = 0;
    
    // Sum traffic from nearby shipping lanes
    for (const lane of this.shippingLanes) {
      const distance = this.calculateDistanceToLane(lat, lon, lane);
      if (distance <= 200) { // Within 200km
        const influence = Math.exp(-distance / 100); // Decay with distance
        traffic += lane.annualTransits * influence;
      }
    }
    
    return Math.min(100, traffic / 100); // Scale to 0-100
  }
  
  /**
   * Calculate offshore energy activity
   */
  private calculateOffshoreActivity(lat: number, lon: number): number {
    let activity = 0;
    
    // Check for offshore assets within range
    for (const asset of this.offshoreAssets) {
      const distance = this.calculateDistance(lat, lon, asset.coordinates[0], asset.coordinates[1]);
      if (distance <= 300) { // Within 300km
        const influence = Math.exp(-distance / 150);
        const importance = { HIGH: 3, MEDIUM: 2, LOW: 1 }[asset.criticalityLevel];
        activity += importance * influence;
      }
    }
    
    // Add regional offshore potential based on location
    if (this.isOffshoreEnergyRegion(lat, lon)) {
      activity += 20;
    }
    
    return Math.min(100, activity * 5);
  }
  
  /**
   * Calculate fishing activity level
   */
  private calculateFishingActivity(lat: number, lon: number): number {
    let activity = 30; // Base fishing activity
    
    // Coastal areas have higher fishing activity
    if (this.isCoastalRegion(lat, lon)) {
      activity += 30;
    }
    
    // Major fishing grounds
    const fishingGrounds = [
      { lat: 42, lon: -67, radius: 500, intensity: 40 }, // Grand Banks
      { lat: 54, lon: -3, radius: 300, intensity: 35 }, // North Sea
      { lat: -40, lon: -58, radius: 400, intensity: 30 }, // Patagonian Shelf
      { lat: 36, lon: 140, radius: 200, intensity: 45 }, // Japan fishing grounds
    ];
    
    for (const ground of fishingGrounds) {
      const distance = this.calculateDistance(lat, lon, ground.lat, ground.lon);
      if (distance <= ground.radius) {
        const influence = Math.exp(-distance / (ground.radius / 3));
        activity += ground.intensity * influence;
      }
    }
    
    return Math.min(100, activity);
  }
  
  /**
   * Calculate cruise activity level
   */
  private calculateCruiseActivity(lat: number, lon: number): number {
    let activity = 0;
    
    // Popular cruise regions
    const cruiseRegions = [
      { lat: 26, lon: -80, radius: 500, intensity: 50 }, // Caribbean
      { lat: 60, lon: 5, radius: 800, intensity: 40 }, // Norwegian fjords
      { lat: 42, lon: 12, radius: 400, intensity: 35 }, // Mediterranean
      { lat: -55, lon: -67, radius: 200, intensity: 30 }, // Antarctica
    ];
    
    for (const region of cruiseRegions) {
      const distance = this.calculateDistance(lat, lon, region.lat, region.lon);
      if (distance <= region.radius) {
        const influence = Math.exp(-distance / (region.radius / 2));
        activity += region.intensity * influence;
      }
    }
    
    return Math.min(100, activity);
  }
  
  /**
   * Assess maritime competition level
   */
  private assessMaritimeCompetition(lat: number, lon: number): number {
    let competition = 20; // Base competition level
    
    // Higher competition near major ports
    const nearbyPorts = this.ports.filter(port => {
      const distance = this.calculateDistance(lat, lon, port.coordinates[0], port.coordinates[1]);
      return distance <= 500 && port.size === 'MAJOR';
    });
    
    competition += nearbyPorts.length * 15;
    
    // Higher competition in major shipping lanes
    const shippingIntensity = this.calculateLocalShippingTraffic(lat, lon);
    competition += shippingIntensity * 0.3;
    
    // Regional factors
    if (this.isDevelopedMaritimeRegion(lat, lon)) {
      competition += 20;
    }
    
    return Math.min(100, competition);
  }
  
  /**
   * Identify maritime specialization opportunities
   */
  private identifyMaritimeSpecialization(lat: number, lon: number, segments: MaritimeMarketSegment[]): string[] {
    const specializations = [];
    
    // High-value segments
    const hasOffshore = segments.some(s => s.segment === 'OFFSHORE_ENERGY');
    if (hasOffshore) {
      specializations.push('Offshore energy communications');
    }
    
    const hasCruise = segments.some(s => s.segment === 'CRUISE');
    if (hasCruise) {
      specializations.push('Passenger vessel connectivity');
    }
    
    // Geographic specializations
    if (Math.abs(lat) > 60) {
      specializations.push('Polar operations support');
    }
    
    if (this.isRemoteOceanRegion(lat, lon)) {
      specializations.push('Deep sea communications');
    }
    
    // Traffic-based specializations
    const shippingTraffic = this.calculateLocalShippingTraffic(lat, lon);
    if (shippingTraffic > 50) {
      specializations.push('Fleet management services');
      specializations.push('Weather routing optimization');
    }
    
    return specializations;
  }
  
  /**
   * Initialize maritime reference data
   */
  private initializeMaritimeData(): void {
    // Major shipping lanes
    this.shippingLanes = [
      {
        name: 'Trans-Pacific',
        type: 'MAJOR_TRUNK',
        route: [
          [37, -122], [35, 140], [1, 103] // San Francisco to Tokyo to Singapore
        ],
        annualTransits: 15000,
        averageVesselSize: 'ULTRA_LARGE',
        cargoTypes: ['CONTAINER'],
        seasonalVariation: { Q1: 0.9, Q2: 1.1, Q3: 1.2, Q4: 0.8 },
        communicationRequirements: {
          dataIntensity: 'HIGH',
          latencyRequirements: 'MODERATE',
          reliability: 'HIGH'
        },
        regulatoryZone: 'INTERNATIONAL'
      },
      {
        name: 'North Atlantic',
        type: 'MAJOR_TRUNK',
        route: [
          [40, -74], [51, -0.1], [53, 10] // New York to London to Hamburg
        ],
        annualTransits: 12000,
        averageVesselSize: 'LARGE',
        cargoTypes: ['CONTAINER', 'RO_RO'],
        seasonalVariation: { Q1: 1.0, Q2: 1.1, Q3: 1.0, Q4: 0.9 },
        communicationRequirements: {
          dataIntensity: 'HIGH',
          latencyRequirements: 'MODERATE',
          reliability: 'HIGH'
        },
        regulatoryZone: 'INTERNATIONAL'
      },
      {
        name: 'Suez-Asia',
        type: 'MAJOR_TRUNK',
        route: [
          [30, 32], [26, 56], [1, 103] // Suez to Dubai to Singapore
        ],
        annualTransits: 18000,
        averageVesselSize: 'ULTRA_LARGE',
        cargoTypes: ['CONTAINER', 'TANKER'],
        seasonalVariation: { Q1: 1.0, Q2: 1.0, Q3: 1.0, Q4: 1.0 },
        communicationRequirements: {
          dataIntensity: 'HIGH',
          latencyRequirements: 'MODERATE',
          reliability: 'MISSION_CRITICAL'
        },
        regulatoryZone: 'INTERNATIONAL'
      }
    ];
    
    // Major ports
    this.ports = [
      {
        name: 'Singapore',
        coordinates: [1.3, 103.8],
        size: 'MAJOR',
        type: 'MIXED',
        annualTEU: 37000000,
        vesselCalls: 130000,
        hinterland: {
          populationServed: 50000000,
          economicValue: 500000000000,
          industrialComplexity: 0.9
        },
        digitalServices: {
          portCommunitySystem: true,
          vesselTrafficManagement: true,
          cargoTracking: true,
          customsIntegration: true
        },
        futureExpansion: {
          planned: true,
          investmentValue: 5000000000,
          timeframe: 10
        }
      },
      {
        name: 'Rotterdam',
        coordinates: [51.9, 4.5],
        size: 'MAJOR',
        type: 'MIXED',
        annualTEU: 15000000,
        vesselCalls: 30000,
        hinterland: {
          populationServed: 200000000,
          economicValue: 800000000000,
          industrialComplexity: 0.85
        },
        digitalServices: {
          portCommunitySystem: true,
          vesselTrafficManagement: true,
          cargoTracking: true,
          customsIntegration: true
        },
        futureExpansion: {
          planned: true,
          investmentValue: 3000000000,
          timeframe: 8
        }
      }
    ];
    
    // Offshore infrastructure
    this.offshoreAssets = [
      {
        type: 'WIND_FARM',
        coordinates: [54.5, 1.5], // Dogger Bank
        operationalStaff: 50,
        communicationBudget: 500000,
        criticalityLevel: 'HIGH',
        remoteLocation: true,
        emergencyRequirements: true
      },
      {
        type: 'OIL_RIG',
        coordinates: [60, 2], // North Sea
        operationalStaff: 200,
        communicationBudget: 1000000,
        criticalityLevel: 'HIGH',
        remoteLocation: true,
        emergencyRequirements: true
      }
    ];
  }
  
  // Helper methods
  
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
  
  private isOffshoreEnergyRegion(lat: number, lon: number): boolean {
    // Major offshore energy regions
    const regions = [
      { lat: 55, lon: 2, radius: 500 }, // North Sea
      { lat: 40, lon: -70, radius: 300 }, // US East Coast
      { lat: 35, lon: 140, radius: 200 }, // Japan offshore
    ];
    
    return regions.some(region => {
      const distance = this.calculateDistance(lat, lon, region.lat, region.lon);
      return distance <= region.radius;
    });
  }
  
  private isCoastalRegion(lat: number, lon: number): boolean {
    // Simplified coastal detection - in reality would use coastline database
    // This is a placeholder that identifies likely coastal areas
    return true; // Most maritime activities are coastal
  }
  
  private isDevelopedMaritimeRegion(lat: number, lon: number): boolean {
    // Developed maritime regions with high competition
    const developedRegions = [
      { lat: 52, lon: 5, radius: 800 }, // North Sea / European waters
      { lat: 37, lon: -122, radius: 500 }, // US West Coast
      { lat: 35, lon: 140, radius: 400 }, // Japan waters
      { lat: 1, lon: 103, radius: 600 }, // Southeast Asia
    ];
    
    return developedRegions.some(region => {
      const distance = this.calculateDistance(lat, lon, region.lat, region.lon);
      return distance <= region.radius;
    });
  }
  
  private isRemoteOceanRegion(lat: number, lon: number): boolean {
    // Remote ocean areas far from major ports
    const majorPorts = this.ports.filter(p => p.size === 'MAJOR');
    const minDistanceToPort = Math.min(...majorPorts.map(port => 
      this.calculateDistance(lat, lon, port.coordinates[0], port.coordinates[1])
    ));
    
    return minDistanceToPort > 1000; // More than 1000km from major port
  }
  
  /**
   * Get comprehensive maritime market report for a region
   */
  async getMaritimeMarketReport(lat: number, lon: number, radius: number = 500): Promise<{
    totalMarketSize: number;
    segments: MaritimeMarketSegment[];
    shippingLanes: ShippingLane[];
    ports: Port[];
    competitionLevel: number;
    growthForecast: number;
    opportunities: string[];
    challenges: string[];
  }> {
    const analysis = await this.analyzeMaritimeCoverage(lat, lon);
    const segments = this.analyzeMaritimeMarketSegments(lat, lon);
    
    const nearbyLanes = this.shippingLanes.filter(lane => 
      this.calculateDistanceToLane(lat, lon, lane) <= radius
    );
    
    const nearbyPorts = this.ports.filter(port => 
      this.calculateDistance(lat, lon, port.coordinates[0], port.coordinates[1]) <= radius
    );
    
    const totalMarketSize = segments.reduce((sum, segment) => sum + segment.currentMarketSize, 0);
    const weightedGrowthRate = segments.reduce((rate, segment) => 
      rate + segment.growthRate * (segment.currentMarketSize / totalMarketSize), 0);
    
    const opportunities = [
      ...analysis.maritimeServices.specialization,
      'Digital transformation services',
      'Weather routing optimization',
      'Fleet management solutions'
    ];
    
    const challenges = [
      'LEO constellation competition',
      'Regulatory complexity',
      'Cybersecurity requirements',
      'Environmental compliance'
    ];
    
    return {
      totalMarketSize,
      segments,
      shippingLanes: nearbyLanes,
      ports: nearbyPorts,
      competitionLevel: analysis.maritimeServices.competition,
      growthForecast: weightedGrowthRate,
      opportunities,
      challenges
    };
  }
}

// Export singleton instance
export const maritimeAnalyzer = new MaritimeAnalyzer();