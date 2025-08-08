/**
 * Domain Expertise Integration for Satellite Ground Station Opportunity Scoring
 * 
 * This module integrates deep satellite communications domain knowledge into the scoring system:
 * - Satellite communication propagation models and link budget analysis
 * - ITU frequency coordination and regulatory compliance modeling
 * - Ground station operational constraints and performance optimization
 * - Antenna design and RF interference considerations
 * - Orbital mechanics and coverage pattern analysis
 * - Industry best practices and operational excellence frameworks
 */

export interface SatelliteCommDomainModel {
  linkBudgetAnalysis: LinkBudgetAnalysis;
  frequencyCoordination: FrequencyCoordinationAnalysis;
  coverageModeling: CoverageModelingResult;
  operationalConstraints: OperationalConstraintsModel;
  rfInterference: RFInterferenceModel;
  regulatoryCompliance: RegulatoryComplianceModel;
}

export interface LinkBudgetAnalysis {
  uplink: {
    frequency: number; // MHz
    eirp: number; // dBW - Effective Isotropic Radiated Power
    pathLoss: number; // dB
    atmosphericLoss: number; // dB
    rainFade: number; // dB
    receivedPower: number; // dBW
    cnr: number; // dB - Carrier-to-Noise Ratio
  };
  downlink: {
    frequency: number; // MHz
    satelliteEirp: number; // dBW
    pathLoss: number; // dB
    atmosphericLoss: number; // dB
    rainFade: number; // dB
    receivedPower: number; // dBW
    cnr: number; // dB
  };
  linkMargin: number; // dB
  availability: number; // %
  dataRate: number; // Mbps
  spectralEfficiency: number; // bits/s/Hz
}

export interface FrequencyCoordinationAnalysis {
  ituRegion: 1 | 2 | 3;
  primaryAllocation: boolean;
  coordinationRequired: boolean;
  protectionCriteria: {
    powerFluxDensity: number; // dBW/m2
    interferenceThreshold: number; // dB
    coordinationArc: number; // degrees
    coordinationDistance: number; // km
  };
  adjacentSatelliteInterference: {
    eastSatellite: { orbital: number; interference: number };
    westSatellite: { orbital: number; interference: number };
  };
  terrestrialInterference: {
    fixedService: number; // dB interference level
    mobileService: number; // dB interference level
    broadcasting: number; // dB interference level
  };
}

export interface CoverageModelingResult {
  geoStationary: {
    orbitalSlot: number; // degrees East/West
    elevation: number; // degrees at ground station
    azimuth: number; // degrees
    lookAngle: number; // degrees
    slantRange: number; // km
    coverageFootprint: Array<[number, number]>; // lat/lon points
  };
  leo: {
    passesPerDay: number;
    averagePassDuration: number; // minutes
    maxElevation: number; // degrees
    contactTime: number; // minutes per day
    dopplerShift: number; // Hz maximum
  };
  meo: {
    passesPerDay: number;
    averagePassDuration: number; // minutes
    elevationProfile: Array<{ time: number; elevation: number }>;
    handoverFrequency: number; // per hour
  };
}

export interface OperationalConstraintsModel {
  antennaPointing: {
    pointingAccuracy: number; // degrees
    trackingSpeed: number; // degrees/second
    slewRate: number; // degrees/second
    settlTime: number; // seconds
  };
  acquisitionTime: {
    initialAcquisition: number; // seconds
    reacquisition: number; // seconds
    blindTime: number; // seconds between satellites
  };
  weatherConstraints: {
    windSpeedLimit: number; // m/s
    rainFadeMargin: number; // dB
    atmosphericScintillation: number; // dB
    snowLoadLimit: number; // kg/m2
  };
  maintenanceRequirements: {
    scheduledDowntime: number; // hours per month
    mtbf: number; // hours Mean Time Between Failures
    mttr: number; // hours Mean Time To Repair
    sparePartsInventory: number; // months of coverage
  };
}

export interface RFInterferenceModel {
  adjacentChannelInterference: {
    level: number; // dB
    source: string;
    mitigation: string[];
  };
  intermodulation: {
    thirdOrder: number; // dB
    fifthOrder: number; // dB
    spuriousEmissions: number; // dB
  };
  externalSources: {
    radar: { level: number; frequency: number; mitigation: string[] };
    cellular: { level: number; frequency: number; mitigation: string[] };
    broadcast: { level: number; frequency: number; mitigation: string[] };
    amateur: { level: number; frequency: number; mitigation: string[] };
  };
  emiCompliance: {
    conducted: number; // dBμV
    radiated: number; // dBμV/m
    spurious: number; // dBW
    harmonics: number; // dB below fundamental
  };
}

export interface RegulatoryComplianceModel {
  ituCompliance: {
    radiationPattern: boolean;
    powerLimits: boolean;
    spuriousEmissions: boolean;
    coordinationComplete: boolean;
  };
  nationalRegulation: {
    licenseType: string;
    licenseValidity: number; // years
    renewalRequired: boolean;
    operatingConditions: string[];
  };
  environmentalCompliance: {
    nepaRequired: boolean; // US specific
    environmentalImpactAssessment: boolean;
    wildlifeMitigation: boolean;
    aviationNotification: boolean;
  };
  safetyStandards: {
    rfExposure: boolean; // MPE compliance
    structuralSafety: boolean;
    electricalSafety: boolean;
    fireProtection: boolean;
  };
}

/**
 * Satellite Communications Domain Expert System
 */
export class SatCommDomainExpert {
  /**
   * Analyze satellite communication requirements and constraints for a location
   */
  analyzeSatelliteCommRequirements(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V',
    serviceType: 'BROADCAST' | 'DATA' | 'MOBILITY' | 'GOVERNMENT' | 'IOT'
  ): SatelliteCommDomainModel {
    // Link budget analysis
    const linkBudgetAnalysis = this.performLinkBudgetAnalysis(lat, lon, frequencyBand);
    
    // Frequency coordination analysis
    const frequencyCoordination = this.analyzeFrequencyCoordination(lat, lon, frequencyBand);
    
    // Coverage modeling
    const coverageModeling = this.performCoverageModeling(lat, lon);
    
    // Operational constraints
    const operationalConstraints = this.analyzeOperationalConstraints(lat, lon, frequencyBand);
    
    // RF interference analysis
    const rfInterference = this.analyzeRFInterference(lat, lon, frequencyBand);
    
    // Regulatory compliance
    const regulatoryCompliance = this.assessRegulatoryCompliance(lat, lon, frequencyBand, serviceType);
    
    return {
      linkBudgetAnalysis,
      frequencyCoordination,
      coverageModeling,
      operationalConstraints,
      rfInterference,
      regulatoryCompliance
    };
  }
  
  /**
   * Calculate operational efficiency based on domain expertise
   */
  calculateOperationalEfficiency(
    domainModel: SatelliteCommDomainModel,
    stationSpecifications: {
      antennaSize: number; // meters
      frequencyBands: string[];
      services: string[];
    }
  ): {
    overallEfficiency: number; // 0-100
    limitingFactors: string[];
    recommendations: string[];
    performanceScore: number; // 0-100
  } {
    let efficiency = 100;
    const limitingFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Link budget performance
    if (domainModel.linkBudgetAnalysis.linkMargin < 3) {
      efficiency -= 20;
      limitingFactors.push('Insufficient link margin');
      recommendations.push('Increase antenna size or transmit power');
    }
    
    if (domainModel.linkBudgetAnalysis.availability < 99.5) {
      efficiency -= 15;
      limitingFactors.push('Low availability due to rain fade');
      recommendations.push('Implement uplink power control');
    }
    
    // Interference limitations
    const totalInterference = this.calculateTotalInterference(domainModel.rfInterference);
    if (totalInterference > -10) { // dB C/I
      efficiency -= 25;
      limitingFactors.push('High interference environment');
      recommendations.push('Install interference mitigation equipment');
    }
    
    // Operational constraints
    if (domainModel.operationalConstraints.antennaPointing.pointingAccuracy > 0.1) {
      efficiency -= 10;
      limitingFactors.push('Poor antenna pointing accuracy');
      recommendations.push('Upgrade antenna control system');
    }
    
    // Weather constraints
    if (domainModel.operationalConstraints.weatherConstraints.windSpeedLimit < 15) {
      efficiency -= 10;
      limitingFactors.push('Low wind speed operational limit');
      recommendations.push('Improve antenna structural design');
    }
    
    // Regulatory compliance
    if (!domainModel.regulatoryCompliance.ituCompliance.coordinationComplete) {
      efficiency -= 30;
      limitingFactors.push('Incomplete frequency coordination');
      recommendations.push('Complete ITU coordination process');
    }
    
    const performanceScore = this.calculatePerformanceScore(domainModel, stationSpecifications);
    
    return {
      overallEfficiency: Math.max(0, efficiency),
      limitingFactors,
      recommendations,
      performanceScore
    };
  }
  
  /**
   * Assess technical feasibility and optimization opportunities
   */
  assessTechnicalFeasibility(
    lat: number,
    lon: number,
    requirements: {
      dataRate: number; // Mbps
      availability: number; // %
      latency: number; // ms
      coverage: 'REGIONAL' | 'GLOBAL' | 'SPOT';
    }
  ): {
    feasibilityScore: number; // 0-100
    recommendedSolution: {
      constellation: 'GEO' | 'MEO' | 'LEO' | 'HYBRID';
      frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V';
      antennaSize: number; // meters
      redundancy: 'NONE' | 'HOT_STANDBY' | 'LOAD_SHARING';
    };
    technicalChallenges: string[];
    mitigationStrategies: string[];
    estimatedPerformance: {
      achievableDataRate: number; // Mbps
      expectedAvailability: number; // %
      expectedLatency: number; // ms
    };
  } {
    let feasibilityScore = 100;
    const technicalChallenges: string[] = [];
    const mitigationStrategies: string[] = [];
    
    // Coverage analysis
    const geoVisibility = this.calculateGeoVisibility(lat, lon);
    if (geoVisibility.elevation < 10 && requirements.coverage === 'GLOBAL') {
      feasibilityScore -= 30;
      technicalChallenges.push('Low GEO elevation angle');
      mitigationStrategies.push('Consider MEO/LEO constellation');
    }
    
    // Data rate feasibility
    const maxDataRate = this.calculateMaxDataRate(lat, lon, 'Ka'); // Assume Ka-band
    if (requirements.dataRate > maxDataRate) {
      feasibilityScore -= 40;
      technicalChallenges.push('Data rate exceeds link capacity');
      mitigationStrategies.push('Multiple carriers or larger antenna required');
    }
    
    // Latency requirements
    if (requirements.latency < 250 && requirements.coverage === 'GLOBAL') {
      feasibilityScore -= 20;
      technicalChallenges.push('GEO latency too high for requirements');
      mitigationStrategies.push('LEO constellation required for low latency');
    }
    
    // Availability in high-rain regions
    const rainZone = this.determineRainZone(lat);
    if (rainZone === 'P' && requirements.availability > 99.9) {
      feasibilityScore -= 25;
      technicalChallenges.push('High rain rate affects availability');
      mitigationStrategies.push('Site diversity or adaptive power control');
    }
    
    // Recommended solution
    const recommendedSolution = this.determineOptimalSolution(lat, lon, requirements);
    
    // Performance estimation
    const estimatedPerformance = this.estimateSystemPerformance(
      lat, lon, recommendedSolution, requirements
    );
    
    return {
      feasibilityScore: Math.max(0, feasibilityScore),
      recommendedSolution,
      technicalChallenges,
      mitigationStrategies,
      estimatedPerformance
    };
  }
  
  // Private implementation methods
  
  private performLinkBudgetAnalysis(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V'
  ): LinkBudgetAnalysis {
    const frequencies = {
      'C': { uplink: 6000, downlink: 4000 },
      'X': { uplink: 8000, downlink: 7000 },
      'Ku': { uplink: 14000, downlink: 11000 },
      'Ka': { uplink: 30000, downlink: 20000 },
      'Q/V': { uplink: 50000, downlink: 40000 }
    };
    
    const freq = frequencies[frequencyBand];
    const elevation = this.calculateElevationAngle(lat, lon);
    
    // Simplified link budget calculations
    const pathLoss = this.calculatePathLoss(freq.downlink, elevation);
    const rainFade = this.calculateRainFade(freq.downlink, lat);
    const atmosphericLoss = this.calculateAtmosphericLoss(freq.downlink, elevation);
    
    const uplinkPathLoss = this.calculatePathLoss(freq.uplink, elevation);
    const uplinkRainFade = this.calculateRainFade(freq.uplink, lat);
    
    return {
      uplink: {
        frequency: freq.uplink,
        eirp: 65, // dBW typical
        pathLoss: uplinkPathLoss,
        atmosphericLoss: this.calculateAtmosphericLoss(freq.uplink, elevation),
        rainFade: uplinkRainFade,
        receivedPower: 65 - uplinkPathLoss - uplinkRainFade - 0.5,
        cnr: 20 // Simplified
      },
      downlink: {
        frequency: freq.downlink,
        satelliteEirp: 50, // dBW typical
        pathLoss,
        atmosphericLoss,
        rainFade,
        receivedPower: 50 - pathLoss - rainFade - atmosphericLoss,
        cnr: 18 // Simplified
      },
      linkMargin: 5, // dB
      availability: this.calculateAvailability(rainFade),
      dataRate: 155, // Mbps
      spectralEfficiency: 3.5 // bits/s/Hz
    };
  }
  
  private analyzeFrequencyCoordination(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V'
  ): FrequencyCoordinationAnalysis {
    const ituRegion = this.determineITURegion(lat, lon);
    const primaryAllocation = this.isPrimaryAllocation(frequencyBand, ituRegion);
    
    return {
      ituRegion,
      primaryAllocation,
      coordinationRequired: frequencyBand === 'C' || frequencyBand === 'Ku',
      protectionCriteria: {
        powerFluxDensity: -152, // dBW/m2
        interferenceThreshold: 6, // dB
        coordinationArc: 8, // degrees
        coordinationDistance: 1000 // km
      },
      adjacentSatelliteInterference: {
        eastSatellite: { orbital: -3, interference: -15 },
        westSatellite: { orbital: 3, interference: -18 }
      },
      terrestrialInterference: {
        fixedService: frequencyBand === 'C' ? -10 : -20, // dB
        mobileService: frequencyBand === 'C' ? -8 : -25, // dB
        broadcasting: -30 // dB
      }
    };
  }
  
  private performCoverageModeling(lat: number, lon: number): CoverageModelingResult {
    const geoElevation = this.calculateElevationAngle(lat, lon);
    const geoAzimuth = this.calculateAzimuthAngle(lat, lon);
    
    return {
      geoStationary: {
        orbitalSlot: 0, // Degrees East (placeholder)
        elevation: geoElevation,
        azimuth: geoAzimuth,
        lookAngle: geoElevation,
        slantRange: this.calculateSlantRange(geoElevation),
        coverageFootprint: this.generateCoverageFootprint(lat, lon)
      },
      leo: {
        passesPerDay: 15, // Typical for LEO constellation
        averagePassDuration: 10, // minutes
        maxElevation: 80, // degrees
        contactTime: 150, // minutes per day
        dopplerShift: 40000 // Hz
      },
      meo: {
        passesPerDay: 8, // Typical for MEO
        averagePassDuration: 4 * 60, // minutes
        elevationProfile: [], // Would be calculated based on orbital mechanics
        handoverFrequency: 2 // per hour
      }
    };
  }
  
  private analyzeOperationalConstraints(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V'
  ): OperationalConstraintsModel {
    const windSpeed = this.getTypicalWindSpeed(lat);
    const rainRate = this.getTypicalRainRate(lat);
    
    return {
      antennaPointing: {
        pointingAccuracy: 0.05, // degrees (typical for large antennas)
        trackingSpeed: 2, // degrees/second
        slewRate: 5, // degrees/second
        settlTime: 30 // seconds
      },
      acquisitionTime: {
        initialAcquisition: 60, // seconds
        reacquisition: 30, // seconds
        blindTime: 5 // seconds
      },
      weatherConstraints: {
        windSpeedLimit: Math.max(12, 20 - Math.abs(lat) / 3), // m/s
        rainFadeMargin: this.calculateRainFadeMargin(frequencyBand, rainRate),
        atmosphericScintillation: 0.5, // dB
        snowLoadLimit: Math.abs(lat) > 40 ? 100 : 0 // kg/m2
      },
      maintenanceRequirements: {
        scheduledDowntime: 8, // hours per month
        mtbf: 8760, // hours (1 year)
        mttr: 4, // hours
        sparePartsInventory: 6 // months
      }
    };
  }
  
  private analyzeRFInterference(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V'
  ): RFInterferenceModel {
    return {
      adjacentChannelInterference: {
        level: -20, // dB
        source: 'Adjacent satellite operator',
        mitigation: ['Improved filtering', 'Coordination with operator']
      },
      intermodulation: {
        thirdOrder: -30, // dB
        fifthOrder: -40, // dB
        spuriousEmissions: -60 // dB
      },
      externalSources: {
        radar: {
          level: frequencyBand === 'C' ? -15 : -30,
          frequency: 5600, // MHz
          mitigation: ['Site shielding', 'Temporal coordination']
        },
        cellular: {
          level: this.isUrbanArea(lat, lon) ? -10 : -25,
          frequency: 3500, // MHz 5G
          mitigation: ['Frequency filtering', 'Site selection']
        },
        broadcast: {
          level: -25,
          frequency: 2000,
          mitigation: ['Geographic separation', 'Filtering']
        },
        amateur: {
          level: -30,
          frequency: 10000,
          mitigation: ['Coordination', 'Time-sharing']
        }
      },
      emiCompliance: {
        conducted: 60, // dBμV
        radiated: 40, // dBμV/m
        spurious: -43, // dBW
        harmonics: -40 // dB below fundamental
      }
    };
  }
  
  private assessRegulatoryCompliance(
    lat: number,
    lon: number,
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V',
    serviceType: 'BROADCAST' | 'DATA' | 'MOBILITY' | 'GOVERNMENT' | 'IOT'
  ): RegulatoryComplianceModel {
    const country = this.determineCountry(lat, lon);
    
    return {
      ituCompliance: {
        radiationPattern: true,
        powerLimits: true,
        spuriousEmissions: true,
        coordinationComplete: frequencyBand !== 'C' // C-band requires more coordination
      },
      nationalRegulation: {
        licenseType: serviceType === 'GOVERNMENT' ? 'Government' : 'Commercial',
        licenseValidity: 10, // years
        renewalRequired: true,
        operatingConditions: [
          'Coordinate with other operators',
          'Maintain technical standards',
          'Submit annual reports'
        ]
      },
      environmentalCompliance: {
        nepaRequired: country === 'USA',
        environmentalImpactAssessment: true,
        wildlifeMitigation: this.isWildlifeArea(lat, lon),
        aviationNotification: true
      },
      safetyStandards: {
        rfExposure: true,
        structuralSafety: true,
        electricalSafety: true,
        fireProtection: true
      }
    };
  }
  
  // Helper calculation methods
  
  private calculateElevationAngle(lat: number, lon: number): number {
    // Simplified calculation for elevation to GEO satellite at 0° longitude
    const satelliteLon = 0; // degrees
    const deltaLon = lon - satelliteLon;
    const a = Math.cos(lat * Math.PI / 180) * Math.cos(deltaLon * Math.PI / 180);
    return Math.atan2(a - 0.151, Math.sqrt(1 - a * a)) * 180 / Math.PI;
  }
  
  private calculateAzimuthAngle(lat: number, lon: number): number {
    // Simplified azimuth calculation
    const satelliteLon = 0; // degrees
    const deltaLon = lon - satelliteLon;
    if (lat >= 0) {
      return deltaLon > 0 ? 90 + Math.abs(deltaLon) : 270 - Math.abs(deltaLon);
    } else {
      return deltaLon > 0 ? 90 - Math.abs(deltaLon) : 270 + Math.abs(deltaLon);
    }
  }
  
  private calculatePathLoss(frequency: number, elevation: number): number {
    // Free space path loss to geostationary orbit
    const distance = 35786 / Math.sin(elevation * Math.PI / 180); // km
    return 92.4 + 20 * Math.log10(distance) + 20 * Math.log10(frequency / 1000);
  }
  
  private calculateRainFade(frequency: number, lat: number): number {
    // Simplified rain fade calculation
    const rainRate = this.getTypicalRainRate(lat);
    const k = frequency > 10000 ? 0.01 : 0.003; // Rain attenuation coefficient
    return k * rainRate * Math.pow(frequency / 1000, 1.2);
  }
  
  private calculateAtmosphericLoss(frequency: number, elevation: number): number {
    // Atmospheric absorption
    return frequency > 20000 ? 1.0 / Math.sin(elevation * Math.PI / 180) : 0.5;
  }
  
  private calculateAvailability(rainFade: number): number {
    // Simplified availability calculation based on rain fade
    return Math.max(99.0, 100 - rainFade * 0.1);
  }
  
  private calculateSlantRange(elevation: number): number {
    // Distance to geostationary satellite
    return 35786 / Math.sin(elevation * Math.PI / 180);
  }
  
  private generateCoverageFootprint(lat: number, lon: number): Array<[number, number]> {
    // Simplified coverage footprint (would be more complex in reality)
    const points: Array<[number, number]> = [];
    const radius = 10; // degrees
    
    for (let i = 0; i < 360; i += 30) {
      const pointLat = lat + radius * Math.sin(i * Math.PI / 180);
      const pointLon = lon + radius * Math.cos(i * Math.PI / 180);
      points.push([pointLat, pointLon]);
    }
    
    return points;
  }
  
  private calculateTotalInterference(rfModel: RFInterferenceModel): number {
    // Calculate total C/I ratio
    let totalInterference = 0;
    
    // Adjacent channel interference
    totalInterference += Math.pow(10, rfModel.adjacentChannelInterference.level / 10);
    
    // External sources
    totalInterference += Math.pow(10, rfModel.externalSources.radar.level / 10);
    totalInterference += Math.pow(10, rfModel.externalSources.cellular.level / 10);
    
    return 10 * Math.log10(totalInterference);
  }
  
  private calculatePerformanceScore(
    domainModel: SatelliteCommDomainModel,
    specs: { antennaSize: number; frequencyBands: string[]; services: string[] }
  ): number {
    let score = 100;
    
    // Link budget performance
    score -= Math.max(0, (3 - domainModel.linkBudgetAnalysis.linkMargin) * 10);
    
    // Availability penalty
    score -= Math.max(0, (99.5 - domainModel.linkBudgetAnalysis.availability) * 20);
    
    // Interference penalty
    const totalInterference = this.calculateTotalInterference(domainModel.rfInterference);
    score -= Math.max(0, (totalInterference + 10) * 2);
    
    // Antenna size bonus
    score += Math.min(20, specs.antennaSize * 2);
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateGeoVisibility(lat: number, lon: number): { elevation: number; azimuth: number } {
    return {
      elevation: this.calculateElevationAngle(lat, lon),
      azimuth: this.calculateAzimuthAngle(lat, lon)
    };
  }
  
  private calculateMaxDataRate(lat: number, lon: number, band: string): number {
    // Simplified data rate calculation based on link budget
    const elevation = this.calculateElevationAngle(lat, lon);
    const baseRate = { 'C': 100, 'Ku': 300, 'Ka': 1000 }[band] || 155;
    return baseRate * Math.sin(elevation * Math.PI / 180);
  }
  
  private determineRainZone(lat: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'M' | 'N' | 'P' {
    // ITU-R rain zones
    const absLat = Math.abs(lat);
    if (absLat < 15) return 'P'; // Tropical
    if (absLat < 30) return 'M'; // Subtropical
    if (absLat < 45) return 'H'; // Temperate
    return 'E'; // Cold
  }
  
  private determineOptimalSolution(
    lat: number,
    lon: number,
    requirements: any
  ): {
    constellation: 'GEO' | 'MEO' | 'LEO' | 'HYBRID';
    frequencyBand: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V';
    antennaSize: number;
    redundancy: 'NONE' | 'HOT_STANDBY' | 'LOAD_SHARING';
  } {
    const elevation = this.calculateElevationAngle(lat, lon);
    
    return {
      constellation: requirements.latency < 100 ? 'LEO' : elevation > 20 ? 'GEO' : 'MEO',
      frequencyBand: requirements.dataRate > 500 ? 'Ka' : 'Ku',
      antennaSize: Math.max(3.7, requirements.dataRate / 100),
      redundancy: requirements.availability > 99.9 ? 'HOT_STANDBY' : 'NONE'
    };
  }
  
  private estimateSystemPerformance(
    lat: number,
    lon: number,
    solution: any,
    requirements: any
  ): { achievableDataRate: number; expectedAvailability: number; expectedLatency: number } {
    const elevation = this.calculateElevationAngle(lat, lon);
    const rainFade = this.calculateRainFade(solution.frequencyBand === 'Ka' ? 20000 : 11000, lat);
    
    return {
      achievableDataRate: Math.min(requirements.dataRate, this.calculateMaxDataRate(lat, lon, solution.frequencyBand)),
      expectedAvailability: this.calculateAvailability(rainFade),
      expectedLatency: solution.constellation === 'LEO' ? 25 : solution.constellation === 'MEO' ? 125 : 250
    };
  }
  
  // Geographic and environmental helper methods
  
  private determineITURegion(lat: number, lon: number): 1 | 2 | 3 {
    if (lon >= -20 && lon <= 170) return 3; // Europe, Africa, Asia, Oceania
    if (lon >= -170 && lon <= -20) return 2; // Americas
    return 1; // Rest of the world
  }
  
  private isPrimaryAllocation(band: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V', region: 1 | 2 | 3): boolean {
    // Simplified primary allocation check
    return band !== 'C' || region === 3; // C-band is secondary in some regions
  }
  
  private getTypicalWindSpeed(lat: number): number {
    const absLat = Math.abs(lat);
    if (absLat < 30) return 5; // Tropical - lower average wind
    if (absLat < 60) return 7; // Temperate - moderate wind
    return 10; // Arctic - higher wind
  }
  
  private getTypicalRainRate(lat: number): number {
    // Typical rain rate for 0.01% of time (mm/h)
    const absLat = Math.abs(lat);
    if (absLat < 15) return 120; // Tropical
    if (absLat < 30) return 80;  // Subtropical
    if (absLat < 45) return 40;  // Temperate
    return 20; // Cold regions
  }
  
  private calculateRainFadeMargin(band: 'C' | 'X' | 'Ku' | 'Ka' | 'Q/V', rainRate: number): number {
    const frequencies = { 'C': 4, 'X': 7, 'Ku': 11, 'Ka': 20, 'Q/V': 40 };
    const freq = frequencies[band];
    return Math.pow(freq / 10, 1.2) * rainRate / 10; // Simplified rain fade margin
  }
  
  private isUrbanArea(lat: number, lon: number): boolean {
    // Simplified urban detection
    const urbanCenters = [
      { lat: 40.7, lon: -74, radius: 50 }, // NYC
      { lat: 51.5, lon: 0, radius: 40 }, // London
      { lat: 35.7, lon: 139.7, radius: 40 }, // Tokyo
    ];
    
    return urbanCenters.some(center => {
      const distance = this.calculateDistance(lat, lon, center.lat, center.lon);
      return distance < center.radius;
    });
  }
  
  private isWildlifeArea(lat: number, lon: number): boolean {
    // Simplified wildlife area detection
    return Math.abs(lat) > 60 || (Math.abs(lat) < 10 && Math.abs(lon) > 150);
  }
  
  private determineCountry(lat: number, lon: number): string {
    // Simplified country determination
    if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66) return 'USA';
    if (lat >= 47 && lat <= 55 && lon >= 6 && lon <= 15) return 'Germany';
    return 'Other';
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
}

// Export singleton instance
export const satCommDomainExpert = new SatCommDomainExpert();