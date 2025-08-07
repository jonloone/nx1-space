/**
 * Interference Coordination and C/I Ratio Calculator
 * 
 * Implements methodology paper Section 2.4: Interference Coordination
 * - C/I (Carrier-to-Interference) ratio calculations
 * - ASI (Adjacent Satellite Interference) modeling
 * - Terrestrial interference (5G C-band) assessment
 * - Cross-polarization interference
 * - Capacity reduction estimation
 */

export interface InterferenceSource {
  type: 'ASI' | 'terrestrial_5G' | 'cross_pol' | 'radar' | 'other';
  sourceName: string;
  frequency: number; // MHz
  power: number; // dBW
  location?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  polarization?: 'H' | 'V' | 'RHCP' | 'LHCP';
  bandwidth?: number; // MHz
}

export interface LinkBudget {
  frequency: number; // MHz
  uplinkPower: number; // dBW
  antennaGain: number; // dBi
  pathLoss: number; // dB
  atmosphericLoss: number; // dB
  rainFade: number; // dB
  receivedPower: number; // dBW
  polarization: 'H' | 'V' | 'RHCP' | 'LHCP';
  bandwidth?: number; // Hz - optional
}

export interface InterferenceAssessment {
  cToI: number; // dB
  cToN: number; // dB (Carrier-to-Noise)
  totalInterference: number; // dBW
  dominantInterferenceSource: string;
  capacityReduction: number; // percentage
  serviceQualityImpact: 'none' | 'minimal' | 'moderate' | 'severe';
  mitigationRequired: boolean;
  recommendations: string[];
}

export interface ASIParameters {
  satelliteSpacing: number; // degrees
  antennaBeamwidth: number; // degrees
  offAxisAngle: number; // degrees
  sidelobeLevel: number; // dB below main lobe
}

export interface CBandConflict {
  conflictType: '5G_downlink' | '5G_uplink';
  frequencyRange: [number, number]; // MHz
  geographicArea: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationOptions: string[];
}

export class InterferenceCalculator {
  private readonly NOISE_FLOOR = -228.6; // dBW/Hz at 290K
  private readonly C_BAND_5G_RANGES = {
    n77: [3300, 4200], // MHz - Main 5G band
    n78: [3300, 3800], // MHz - Sub-band
    n79: [4400, 5000], // MHz - Upper band
  };
  
  private readonly TYPICAL_XPD = { // Cross-Polarization Discrimination
    clear_sky: 30, // dB
    light_rain: 25, // dB
    heavy_rain: 20, // dB
    worst_case: 15 // dB
  };
  
  /**
   * Calculate Carrier-to-Interference ratio
   */
  calculateCtoI(
    desiredSignal: LinkBudget,
    interferenceSources: InterferenceSource[]
  ): number {
    const carrierPower = desiredSignal.receivedPower;
    const totalInterference = this.calculateTotalInterference(
      desiredSignal,
      interferenceSources
    );
    
    return carrierPower - totalInterference; // in dB
  }
  
  /**
   * Calculate total interference from all sources
   */
  private calculateTotalInterference(
    desiredSignal: LinkBudget,
    sources: InterferenceSource[]
  ): number {
    const interferenceLinear = sources.reduce((sum, source) => {
      const interference = this.calculateSingleSourceInterference(
        desiredSignal,
        source
      );
      return sum + Math.pow(10, interference / 10);
    }, 0);
    
    return 10 * Math.log10(interferenceLinear);
  }
  
  /**
   * Calculate interference from a single source
   */
  private calculateSingleSourceInterference(
    desiredSignal: LinkBudget,
    source: InterferenceSource
  ): number {
    let interference = source.power;
    
    // Apply frequency-dependent rejection
    const frequencyOffset = Math.abs(source.frequency - desiredSignal.frequency);
    if (frequencyOffset > 0) {
      // Simplified adjacent channel rejection
      const rejection = Math.min(40, frequencyOffset / 10); // dB
      interference -= rejection;
    }
    
    // Apply polarization isolation
    if (source.polarization && source.polarization !== desiredSignal.polarization) {
      const xpd = this.getCrossPolarizationDiscrimination(desiredSignal.rainFade);
      interference -= xpd;
    }
    
    // Apply spatial isolation for terrestrial sources
    if (source.type === 'terrestrial_5G' && source.location) {
      const spatialIsolation = this.calculateSpatialIsolation(source.location);
      interference -= spatialIsolation;
    }
    
    return interference;
  }
  
  /**
   * Calculate Adjacent Satellite Interference (ASI)
   */
  calculateASI(
    desiredSatellite: {
      longitude: number;
      eirp: number; // dBW
      frequency: number; // MHz
    },
    adjacentSatellites: Array<{
      longitude: number;
      eirp: number;
      frequency: number;
    }>,
    earthStation: {
      latitude: number;
      longitude: number;
      antennaGain: number; // dBi
      beamwidth: number; // degrees
    }
  ): {
    totalASI: number; // dBW
    worstCaseIntereferer: string;
    cToASI: number; // dB
  } {
    let totalASI = 0;
    let worstCase = { power: -999, name: '' };
    
    for (const adjacent of adjacentSatellites) {
      // Calculate off-axis angle
      const offAxisAngle = this.calculateOffAxisAngle(
        desiredSatellite.longitude,
        adjacent.longitude,
        earthStation.latitude,
        earthStation.longitude
      );
      
      // Calculate antenna discrimination
      const discrimination = this.calculateAntennaDiscrimination(
        offAxisAngle,
        earthStation.beamwidth
      );
      
      // Calculate interference power
      const asiPower = adjacent.eirp - discrimination;
      
      // Track worst interferer
      if (asiPower > worstCase.power) {
        worstCase = {
          power: asiPower,
          name: `Satellite at ${adjacent.longitude}°`
        };
      }
      
      // Sum interference (linear addition)
      totalASI += Math.pow(10, asiPower / 10);
    }
    
    totalASI = 10 * Math.log10(totalASI);
    const cToASI = desiredSatellite.eirp - totalASI;
    
    return {
      totalASI,
      worstCaseIntereferer: worstCase.name,
      cToASI
    };
  }
  
  /**
   * Assess C-band 5G interference potential
   */
  assess5GInterference(
    satelliteFrequency: number, // MHz
    earthStationLocation: {
      latitude: number;
      longitude: number;
      country: string;
    }
  ): CBandConflict | null {
    // Check if frequency falls within 5G bands
    for (const [band, range] of Object.entries(this.C_BAND_5G_RANGES)) {
      if (satelliteFrequency >= range[0] && satelliteFrequency <= range[1]) {
        const impactLevel = this.determine5GImpactLevel(
          satelliteFrequency,
          earthStationLocation.country
        );
        
        return {
          conflictType: satelliteFrequency < 3700 ? '5G_uplink' : '5G_downlink',
          frequencyRange: range as [number, number],
          geographicArea: earthStationLocation.country,
          impactLevel,
          mitigationOptions: this.generate5GMitigationOptions(impactLevel)
        };
      }
    }
    
    return null;
  }
  
  /**
   * Calculate cross-polarization interference
   */
  calculateCrossPolarizationInterference(
    desiredPolarization: 'H' | 'V' | 'RHCP' | 'LHCP',
    interferingPolarization: 'H' | 'V' | 'RHCP' | 'LHCP',
    rainFade: number // dB
  ): number {
    // Same polarization = full interference
    if (desiredPolarization === interferingPolarization) {
      return 0; // No isolation
    }
    
    // Orthogonal linear polarizations
    if ((desiredPolarization === 'H' && interferingPolarization === 'V') ||
        (desiredPolarization === 'V' && interferingPolarization === 'H')) {
      return this.getCrossPolarizationDiscrimination(rainFade);
    }
    
    // Orthogonal circular polarizations
    if ((desiredPolarization === 'RHCP' && interferingPolarization === 'LHCP') ||
        (desiredPolarization === 'LHCP' && interferingPolarization === 'RHCP')) {
      return this.getCrossPolarizationDiscrimination(rainFade);
    }
    
    // Linear to circular (partial isolation)
    return this.getCrossPolarizationDiscrimination(rainFade) / 2;
  }
  
  /**
   * Perform comprehensive interference assessment
   */
  performComprehensiveAssessment(
    link: LinkBudget,
    interferenceSources: InterferenceSource[],
    noiseTemperature: number = 290 // Kelvin
  ): InterferenceAssessment {
    // Calculate C/I
    const cToI = this.calculateCtoI(link, interferenceSources);
    
    // Calculate C/N
    const noisePower = this.NOISE_FLOOR + 10 * Math.log10(link.bandwidth || 36e6); // 36 MHz typical
    const cToN = link.receivedPower - noisePower;
    
    // Find dominant interference source
    let dominantSource = 'none';
    let maxInterference = -999;
    
    for (const source of interferenceSources) {
      const interference = this.calculateSingleSourceInterference(link, source);
      if (interference > maxInterference) {
        maxInterference = interference;
        dominantSource = source.sourceName;
      }
    }
    
    // Calculate capacity reduction
    const capacityReduction = this.estimateCapacityReduction(cToI, cToN);
    
    // Determine service quality impact
    const qualityImpact = this.determineQualityImpact(cToI);
    
    // Generate recommendations
    const recommendations = this.generateMitigationRecommendations(
      cToI,
      interferenceSources,
      qualityImpact
    );
    
    return {
      cToI,
      cToN,
      totalInterference: this.calculateTotalInterference(link, interferenceSources),
      dominantInterferenceSource: dominantSource,
      capacityReduction,
      serviceQualityImpact: qualityImpact,
      mitigationRequired: cToI < 15,
      recommendations
    };
  }
  
  /**
   * Estimate capacity reduction based on C/I and C/N
   */
  private estimateCapacityReduction(cToI: number, cToN: number): number {
    // Shannon capacity theorem approximation
    const effectiveSINR = this.calculateEffectiveSINR(cToI, cToN);
    
    // Reference capacity (no interference, good C/N)
    const referenceCapacity = Math.log2(1 + Math.pow(10, 25 / 10)); // 25 dB reference
    
    // Actual capacity with interference
    const actualCapacity = Math.log2(1 + Math.pow(10, effectiveSINR / 10));
    
    // Percentage reduction
    const reduction = ((referenceCapacity - actualCapacity) / referenceCapacity) * 100;
    
    return Math.max(0, Math.min(100, reduction));
  }
  
  /**
   * Calculate effective SINR from C/I and C/N
   */
  private calculateEffectiveSINR(cToI: number, cToN: number): number {
    // Convert to linear scale
    const cToI_linear = Math.pow(10, cToI / 10);
    const cToN_linear = Math.pow(10, cToN / 10);
    
    // Combined SINR
    const sinr = 1 / (1/cToI_linear + 1/cToN_linear);
    
    return 10 * Math.log10(sinr);
  }
  
  /**
   * Determine service quality impact level
   */
  private determineQualityImpact(cToI: number): 'none' | 'minimal' | 'moderate' | 'severe' {
    if (cToI >= 25) return 'none';
    if (cToI >= 20) return 'minimal';
    if (cToI >= 15) return 'moderate';
    return 'severe';
  }
  
  /**
   * Get cross-polarization discrimination based on weather
   */
  private getCrossPolarizationDiscrimination(rainFade: number): number {
    if (rainFade < 1) return this.TYPICAL_XPD.clear_sky;
    if (rainFade < 3) return this.TYPICAL_XPD.light_rain;
    if (rainFade < 6) return this.TYPICAL_XPD.heavy_rain;
    return this.TYPICAL_XPD.worst_case;
  }
  
  /**
   * Calculate off-axis angle for ASI
   */
  private calculateOffAxisAngle(
    desiredSatLon: number,
    interferingSatLon: number,
    earthLat: number,
    earthLon: number
  ): number {
    // Simplified calculation - should use full spherical geometry
    const angle1 = Math.abs(desiredSatLon - earthLon);
    const angle2 = Math.abs(interferingSatLon - earthLon);
    return Math.abs(angle1 - angle2);
  }
  
  /**
   * Calculate antenna discrimination pattern
   */
  private calculateAntennaDiscrimination(
    offAxisAngle: number,
    beamwidth: number
  ): number {
    // ITU-R S.465 reference pattern (simplified)
    const ratio = offAxisAngle / (beamwidth / 2);
    
    if (ratio <= 1) {
      // Main lobe
      return 3 * Math.pow(ratio, 2); // dB
    } else if (ratio <= 100) {
      // First sidelobe region
      return 25 * Math.log10(ratio) + 10;
    } else {
      // Far sidelobe region
      return 35; // Maximum discrimination
    }
  }
  
  /**
   * Calculate spatial isolation for terrestrial interference
   */
  private calculateSpatialIsolation(
    interferenceLocation: { latitude: number; longitude: number; elevation?: number }
  ): number {
    // Simplified model - should consider terrain shielding
    const elevationAngle = interferenceLocation.elevation || 0;
    
    if (elevationAngle < 0) {
      // Below horizon - significant isolation
      return 40 + Math.abs(elevationAngle) * 2;
    } else if (elevationAngle < 5) {
      // Near horizon - moderate isolation
      return 20 + (5 - elevationAngle) * 4;
    } else {
      // Above horizon - minimal isolation
      return Math.max(0, 20 - elevationAngle);
    }
  }
  
  /**
   * Determine 5G impact level by country/region
   */
  private determine5GImpactLevel(
    frequency: number,
    country: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Countries with aggressive 5G C-band deployment
    const high5GCountries = ['USA', 'China', 'South Korea', 'Japan', 'UK'];
    const medium5GCountries = ['Germany', 'France', 'Italy', 'Spain', 'Canada'];
    
    if (high5GCountries.includes(country)) {
      return frequency < 3700 ? 'critical' : 'high';
    } else if (medium5GCountries.includes(country)) {
      return frequency < 3700 ? 'high' : 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Generate 5G mitigation options
   */
  private generate5GMitigationOptions(impactLevel: string): string[] {
    const options = [
      'Install band-pass filters',
      'Increase antenna elevation angle',
      'Use frequency coordination with mobile operators'
    ];
    
    if (impactLevel === 'critical' || impactLevel === 'high') {
      options.push(
        'Consider frequency reallocation',
        'Install interference cancellation system',
        'Implement real-time monitoring'
      );
    }
    
    return options;
  }
  
  /**
   * Generate mitigation recommendations
   */
  private generateMitigationRecommendations(
    cToI: number,
    sources: InterferenceSource[],
    qualityImpact: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (cToI < 15) {
      recommendations.push('URGENT: Implement interference mitigation immediately');
    }
    
    // Check for ASI
    if (sources.some(s => s.type === 'ASI')) {
      recommendations.push('Optimize antenna pointing to minimize ASI');
      recommendations.push('Consider coordinated frequency planning with adjacent satellites');
    }
    
    // Check for 5G interference
    if (sources.some(s => s.type === 'terrestrial_5G')) {
      recommendations.push('Install C-band filters to reject 5G signals');
      recommendations.push('Coordinate with local mobile network operators');
    }
    
    // Check for cross-pol interference
    if (sources.some(s => s.type === 'cross_pol')) {
      recommendations.push('Verify antenna polarization alignment');
      recommendations.push('Consider upgrading to higher XPD antenna feed');
    }
    
    // General recommendations based on impact
    if (qualityImpact === 'severe') {
      recommendations.push('Consider site relocation or shielding');
      recommendations.push('Implement adaptive coding and modulation');
    } else if (qualityImpact === 'moderate') {
      recommendations.push('Monitor interference trends');
      recommendations.push('Plan for future mitigation upgrades');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const interferenceCalculator = new InterferenceCalculator();