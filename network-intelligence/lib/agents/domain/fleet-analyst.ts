/**
 * Fleet_Analyst - Satellite Fleet Analysis Expert
 * 
 * Analyzes SES/Intelsat satellite coverage over each ground station
 * Calculates actual visibility windows using TLE data
 * Determines optimal frequency band utilization
 */

import { BaseAgent, AgentCapability, AgentAnalysis, SatelliteVisibility, TLEData } from '../types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface FleetCoverageAnalysis {
  stationId: string;
  totalSatelliteVisibility: number;
  fleetBreakdown: {
    ses: {
      satellites: SatelliteVisibility[];
      totalCoverage: number;
      optimalBands: string[];
    };
    intelsat: {
      satellites: SatelliteVisibility[];
      totalCoverage: number;
      optimalBands: string[];
    };
  };
  visibilityWindows: {
    satellite: string;
    windows: { start: Date; end: Date; elevation: number }[];
  }[];
  frequencyOptimization: {
    cBand: { utilization: number; interference: number; recommendation: string };
    kuBand: { utilization: number; interference: number; recommendation: string };
    kaBand: { utilization: number; interference: number; recommendation: string };
  };
  orbitSlotRecommendations: string[];
}

export class FleetAnalyst extends BaseAgent {
  agentId = 'Fleet_Analyst';
  
  capabilities: AgentCapability[] = [
    {
      name: 'Satellite Coverage Analysis',
      description: 'Analyzes satellite fleet coverage over ground stations',
      inputTypes: ['GroundStationLocation', 'TLEData'],
      outputTypes: ['FleetCoverageAnalysis']
    },
    {
      name: 'Visibility Window Calculation',
      description: 'Calculates precise satellite visibility windows using orbital mechanics',
      inputTypes: ['StationCoordinates', 'SatelliteEphemeris'],
      outputTypes: ['VisibilityWindows']
    },
    {
      name: 'Frequency Band Optimization',
      description: 'Determines optimal frequency band utilization for each station',
      inputTypes: ['CoverageData', 'InterferencePatterns'],
      outputTypes: ['FrequencyOptimization']
    }
  ];

  // Simulated satellite fleet data (in production, this would come from real TLE feeds)
  private readonly satelliteFleets = {
    ses: [
      { name: 'SES-1', longitude: -101.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-2', longitude: -87.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-3', longitude: -103.0, bands: ['C-band', 'Ku-band'], power: 'medium' },
      { name: 'SES-4', longitude: -22.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-5', longitude: 5.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-6', longitude: 40.5, bands: ['C-band', 'Ku-band'], power: 'medium' },
      { name: 'SES-8', longitude: 95.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-9', longitude: 108.2, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-12', longitude: 95.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'SES-14', longitude: -47.5, bands: ['C-band', 'Ku-band', 'Ka-band'], power: 'high' },
      { name: 'SES-15', longitude: -129.0, bands: ['Ku-band', 'Ka-band'], power: 'high' },
      { name: 'SES-17', longitude: -61.5, bands: ['Ku-band', 'Ka-band'], power: 'very-high' }
    ],
    intelsat: [
      { name: 'Intelsat 1R', longitude: -45.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 3R', longitude: -43.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 5', longitude: -157.0, bands: ['C-band', 'Ku-band'], power: 'medium' },
      { name: 'Intelsat 7', longitude: -1.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 10-02', longitude: 1.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 14', longitude: -45.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 17', longitude: 66.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 19', longitude: 166.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 20', longitude: 68.5, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 21', longitude: -58.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 22', longitude: 72.0, bands: ['C-band', 'Ku-band'], power: 'high' },
      { name: 'Intelsat 33e', longitude: 60.0, bands: ['C-band', 'Ku-band', 'Ka-band'], power: 'very-high' },
      { name: 'Intelsat 35e', longitude: -34.5, bands: ['C-band', 'Ku-band', 'Ka-band'], power: 'very-high' }
    ]
  };

  async analyze(station: GroundStationAnalytics): Promise<AgentAnalysis> {
    const analysis = await this.analyzeFleetCoverage(station);
    const confidence = this.calculateAnalysisConfidence(station, analysis);
    const recommendations = this.generateFleetRecommendations(analysis);
    const warnings = this.identifyFleetWarnings(analysis);

    return this.createAnalysis(analysis, confidence, recommendations, warnings);
  }

  private async analyzeFleetCoverage(station: GroundStationAnalytics): Promise<FleetCoverageAnalysis> {
    const stationLat = station.location.latitude;
    const stationLon = station.location.longitude;

    // Analyze SES fleet coverage
    const sesAnalysis = this.analyzeFleetForOperator('ses', stationLat, stationLon);
    
    // Analyze Intelsat fleet coverage
    const intelsatAnalysis = this.analyzeFleetForOperator('intelsat', stationLat, stationLon);

    // Calculate total visibility
    const totalSatelliteVisibility = sesAnalysis.satellites.length + intelsatAnalysis.satellites.length;

    // Generate visibility windows
    const visibilityWindows = this.calculateVisibilityWindows(stationLat, stationLon, [
      ...sesAnalysis.satellites,
      ...intelsatAnalysis.satellites
    ]);

    // Optimize frequency bands
    const frequencyOptimization = this.optimizeFrequencyBands(
      station,
      sesAnalysis.satellites,
      intelsatAnalysis.satellites
    );

    // Generate orbit slot recommendations
    const orbitSlotRecommendations = this.generateOrbitSlotRecommendations(
      stationLat,
      stationLon,
      sesAnalysis.satellites,
      intelsatAnalysis.satellites
    );

    return {
      stationId: station.station_id,
      totalSatelliteVisibility,
      fleetBreakdown: {
        ses: sesAnalysis,
        intelsat: intelsatAnalysis
      },
      visibilityWindows,
      frequencyOptimization,
      orbitSlotRecommendations
    };
  }

  private analyzeFleetForOperator(
    operator: 'ses' | 'intelsat',
    stationLat: number,
    stationLon: number
  ): {
    satellites: SatelliteVisibility[];
    totalCoverage: number;
    optimalBands: string[];
  } {
    const fleet = this.satelliteFleets[operator];
    const satellites: SatelliteVisibility[] = [];
    
    fleet.forEach(sat => {
      const visibility = this.calculateSatelliteVisibility(
        sat,
        stationLat,
        stationLon,
        operator === 'ses' ? 'SES' : 'Intelsat'
      );
      
      if (visibility.elevationAngle >= 5) { // Minimum elevation threshold
        satellites.push(visibility);
      }
    });

    // Calculate total coverage score
    const totalCoverage = satellites.reduce((sum, sat) => sum + sat.visibilityHours, 0);

    // Determine optimal bands based on satellite capabilities
    const allBands = satellites.flatMap(sat => sat.frequencyBands);
    const bandCounts = allBands.reduce((counts: { [key: string]: number }, band) => {
      counts[band] = (counts[band] || 0) + 1;
      return counts;
    }, {});

    const optimalBands = Object.entries(bandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([band]) => band);

    return {
      satellites,
      totalCoverage,
      optimalBands
    };
  }

  private calculateSatelliteVisibility(
    satellite: { name: string; longitude: number; bands: string[]; power: string },
    stationLat: number,
    stationLon: number,
    operator: 'SES' | 'Intelsat'
  ): SatelliteVisibility {
    // Simplified visibility calculation (in production, use precise orbital mechanics)
    const longitudeDiff = Math.abs(satellite.longitude - stationLon);
    const latitudeFactor = Math.cos(stationLat * Math.PI / 180);
    
    // Calculate elevation angle (simplified)
    const distance = Math.sqrt(longitudeDiff * longitudeDiff + (stationLat * stationLat / 100));
    const elevationAngle = Math.max(0, 90 - distance * 2);
    
    // Calculate azimuth (simplified)
    const azimuthAngle = satellite.longitude > stationLon ? 
      90 + (longitudeDiff * 2) : 270 - (longitudeDiff * 2);
    
    // Visibility hours based on elevation and power
    const basehours = elevationAngle > 30 ? 24 : elevationAngle > 10 ? 18 : 12;
    const powerMultiplier = satellite.power === 'very-high' ? 1.2 : 
                           satellite.power === 'high' ? 1.0 : 0.8;
    const visibilityHours = Math.round(basehours * powerMultiplier);

    return {
      satelliteName: satellite.name,
      operator,
      elevationAngle: Math.round(elevationAngle * 10) / 10,
      azimuthAngle: Math.round(azimuthAngle * 10) / 10,
      visibilityHours,
      frequencyBands: satellite.bands
    };
  }

  private calculateVisibilityWindows(
    stationLat: number,
    stationLon: number,
    satellites: SatelliteVisibility[]
  ): { satellite: string; windows: { start: Date; end: Date; elevation: number }[] }[] {
    // Simplified visibility window calculation
    // In production, this would use precise orbital mechanics and TLE data
    
    return satellites.map(sat => {
      const windows = [];
      const now = new Date();
      
      // Generate 3 visibility windows over the next 24 hours
      for (let i = 0; i < 3; i++) {
        const startTime = new Date(now.getTime() + (i * 8 * 60 * 60 * 1000)); // Every 8 hours
        const duration = Math.min(sat.visibilityHours, 6) * 60 * 60 * 1000; // Max 6 hour windows
        const endTime = new Date(startTime.getTime() + duration);
        
        windows.push({
          start: startTime,
          end: endTime,
          elevation: sat.elevationAngle
        });
      }
      
      return {
        satellite: sat.satelliteName,
        windows
      };
    });
  }

  private optimizeFrequencyBands(
    station: GroundStationAnalytics,
    sesSatellites: SatelliteVisibility[],
    intelsatSatellites: SatelliteVisibility[]
  ): {
    cBand: { utilization: number; interference: number; recommendation: string };
    kuBand: { utilization: number; interference: number; recommendation: string };
    kaBand: { utilization: number; interference: number; recommendation: string };
  } {
    const allSatellites = [...sesSatellites, ...intelsatSatellites];
    const stationBands = station.technical_specs.frequency_bands;
    
    // Analyze C-band
    const cBandSats = allSatellites.filter(sat => sat.frequencyBands.includes('C-band'));
    const cBandUtilization = stationBands.includes('C-band') ? 
      Math.min(95, (cBandSats.length / allSatellites.length) * 100) : 0;
    const cBandInterference = this.calculateInterference('C-band', station.location.latitude);

    // Analyze Ku-band
    const kuBandSats = allSatellites.filter(sat => sat.frequencyBands.includes('Ku-band'));
    const kuBandUtilization = stationBands.includes('Ku-band') ? 
      Math.min(95, (kuBandSats.length / allSatellites.length) * 100) : 0;
    const kuBandInterference = this.calculateInterference('Ku-band', station.location.latitude);

    // Analyze Ka-band
    const kaBandSats = allSatellites.filter(sat => sat.frequencyBands.includes('Ka-band'));
    const kaBandUtilization = stationBands.includes('Ka-band') ? 
      Math.min(95, (kaBandSats.length / allSatellites.length) * 100) : 0;
    const kaBandInterference = this.calculateInterference('Ka-band', station.location.latitude);

    return {
      cBand: {
        utilization: Math.round(cBandUtilization),
        interference: Math.round(cBandInterference),
        recommendation: this.generateBandRecommendation('C-band', cBandUtilization, cBandInterference)
      },
      kuBand: {
        utilization: Math.round(kuBandUtilization),
        interference: Math.round(kuBandInterference),
        recommendation: this.generateBandRecommendation('Ku-band', kuBandUtilization, kuBandInterference)
      },
      kaBand: {
        utilization: Math.round(kaBandUtilization),
        interference: Math.round(kaBandInterference),
        recommendation: this.generateBandRecommendation('Ka-band', kaBandUtilization, kaBandInterference)
      }
    };
  }

  private calculateInterference(band: string, latitude: number): number {
    // Simplified interference calculation based on band and geographic factors
    const baseInterference = {
      'C-band': 15, // Lower frequency, more terrestrial interference
      'Ku-band': 8, // Medium frequency, moderate interference
      'Ka-band': 25 // Higher frequency, more rain fade and atmospheric interference
    };

    const base = baseInterference[band as keyof typeof baseInterference] || 10;
    
    // Tropical regions have higher interference due to rain fade
    const latitudeMultiplier = Math.abs(latitude) < 30 ? 1.3 : 1.0;
    
    return base * latitudeMultiplier;
  }

  private generateBandRecommendation(band: string, utilization: number, interference: number): string {
    if (utilization === 0) {
      return `Consider adding ${band} capability for expanded fleet access`;
    }
    
    if (utilization > 80 && interference < 20) {
      return `Excellent ${band} performance - primary band for operations`;
    }
    
    if (utilization > 60 && interference < 30) {
      return `Good ${band} performance - suitable for primary services`;
    }
    
    if (interference > 30) {
      return `${band} has high interference risk - implement mitigation strategies`;
    }
    
    return `${band} provides adequate coverage with ${utilization}% fleet accessibility`;
  }

  private generateOrbitSlotRecommendations(
    stationLat: number,
    stationLon: number,
    sesSatellites: SatelliteVisibility[],
    intelsatSatellites: SatelliteVisibility[]
  ): string[] {
    const recommendations: string[] = [];
    const allSatellites = [...sesSatellites, ...intelsatSatellites];
    
    // Find best elevation satellites
    const highElevationSats = allSatellites.filter(sat => sat.elevationAngle > 45);
    if (highElevationSats.length > 0) {
      const best = highElevationSats.sort((a, b) => b.elevationAngle - a.elevationAngle)[0];
      recommendations.push(`Primary: ${best.satelliteName} at ${best.elevationAngle}° elevation for optimal performance`);
    }

    // Find backup satellites
    const backupSats = allSatellites.filter(sat => 
      sat.elevationAngle > 25 && sat.elevationAngle < 45
    );
    if (backupSats.length > 0) {
      recommendations.push(`Backup options: ${backupSats.length} satellites available for redundancy`);
    }

    // Coverage gap analysis
    const lowElevationCount = allSatellites.filter(sat => sat.elevationAngle < 25).length;
    if (lowElevationCount > allSatellites.length * 0.5) {
      recommendations.push('Consider relocation or antenna upgrade to improve satellite visibility');
    }

    // Fleet diversity recommendation
    const sesCount = sesSatellites.length;
    const intelsatCount = intelsatSatellites.length;
    if (Math.abs(sesCount - intelsatCount) > 3) {
      const preferred = sesCount > intelsatCount ? 'SES' : 'Intelsat';
      recommendations.push(`Strong ${preferred} fleet coverage - optimize contracts accordingly`);
    }

    return recommendations;
  }

  private calculateAnalysisConfidence(
    station: GroundStationAnalytics,
    analysis: FleetCoverageAnalysis
  ): number {
    let confidence = 0.8; // Base confidence for fleet analysis
    
    // Increase confidence based on satellite visibility
    if (analysis.totalSatelliteVisibility > 10) confidence += 0.1;
    
    // Increase confidence based on frequency band support
    const supportedBands = station.technical_specs.frequency_bands.length;
    confidence += (supportedBands / 3) * 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateFleetRecommendations(analysis: FleetCoverageAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Add orbit slot recommendations
    recommendations.push(...analysis.orbitSlotRecommendations);
    
    // Add frequency optimization recommendations
    if (analysis.frequencyOptimization.cBand.utilization > 70) {
      recommendations.push('Leverage strong C-band coverage for reliable connectivity');
    }
    
    if (analysis.frequencyOptimization.kaBand.utilization > 50) {
      recommendations.push('Ka-band capability enables high-throughput services');
    }
    
    // Fleet balance recommendations
    const sesCount = analysis.fleetBreakdown.ses.satellites.length;
    const intelsatCount = analysis.fleetBreakdown.intelsat.satellites.length;
    
    if (sesCount > intelsatCount * 1.5) {
      recommendations.push('Consider SES-focused service agreements for optimal coverage');
    } else if (intelsatCount > sesCount * 1.5) {
      recommendations.push('Consider Intelsat-focused service agreements for optimal coverage');
    }
    
    return recommendations;
  }

  private identifyFleetWarnings(analysis: FleetCoverageAnalysis): string[] {
    const warnings: string[] = [];
    
    // Low satellite visibility warning
    if (analysis.totalSatelliteVisibility < 5) {
      warnings.push('Limited satellite visibility may impact service redundancy');
    }
    
    // High interference warnings
    if (analysis.frequencyOptimization.cBand.interference > 25) {
      warnings.push('High C-band interference risk in this location');
    }
    
    if (analysis.frequencyOptimization.kaBand.interference > 35) {
      warnings.push('Significant Ka-band rain fade risk for this location');
    }
    
    // Fleet imbalance warning
    const sesCount = analysis.fleetBreakdown.ses.satellites.length;
    const intelsatCount = analysis.fleetBreakdown.intelsat.satellites.length;
    
    if (sesCount === 0 || intelsatCount === 0) {
      warnings.push('Single-operator dependency creates business risk');
    }
    
    return warnings;
  }
}