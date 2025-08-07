/**
 * Weather Impact Modeling for Satellite Ground Stations
 * 
 * Implements ITU-R P.618 rain attenuation models and 
 * availability calculations as specified in methodology paper
 */

export interface WeatherConditions {
  location: {
    latitude: number;
    longitude: number;
    elevation: number; // meters above sea level
  };
  climaticData: {
    rainRate01: number;    // mm/h exceeded 0.01% of time
    rainRate1: number;     // mm/h exceeded 0.1% of time  
    annualRainfallMm: number;
    temperatureRange: [number, number]; // Min/max in Celsius
    humidityPercent: number;
  };
  seasonalFactors: {
    wetSeasonMonths: number[];
    drySeasonMonths: number[];
    cycloneRisk: 'low' | 'medium' | 'high';
  };
}

export interface LinkAvailability {
  frequency: number;          // GHz
  elevationAngle: number;     // degrees
  rainAttenuation: number;    // dB
  gasAttenuation: number;     // dB
  cloudAttenuation: number;   // dB
  totalAttenuation: number;   // dB
  availabilityPercent: number; // 99.9% etc
  outageDurationHours: number; // hours per year
}

export interface WeatherImpactAssessment {
  stationId: string;
  overallAvailability: number;      // Weighted average across services
  serviceLevelAvailability: {
    cBandUplink: LinkAvailability;
    cBandDownlink: LinkAvailability;  
    kuBandUplink?: LinkAvailability;
    kuBandDownlink?: LinkAvailability;
    kaBandUplink?: LinkAvailability;
    kaBandDownlink?: LinkAvailability;
  };
  capacityReduction: {
    annual: number;        // Annual percentage capacity loss
    seasonal: number;      // Peak season capacity loss
    contingency: number;   // Recommended backup capacity
  };
  mitigationStrategies: string[];
  slaRisk: 'low' | 'medium' | 'high' | 'critical';
}

export class WeatherImpactCalculator {
  
  // ITU-R P.838 coefficients for specific attenuation
  private readonly RAIN_COEFFICIENTS = {
    // Frequency-dependent coefficients [aH, aV, bH, bV] for horizontal/vertical polarization
    14: { aH: 0.00387, aV: 0.00352, bH: 0.8592, bV: 0.8957 }, // 14 GHz (Ku-band)
    12: { aH: 0.00175, aV: 0.00155, bH: 0.9490, bV: 0.9625 }, // 12 GHz (Ku-band)
    6:  { aH: 0.000259, aV: 0.000236, bH: 1.0664, bV: 1.0750 }, // 6 GHz (C-band)
    4:  { aH: 0.0000847, aV: 0.0000784, bH: 1.1688, bV: 1.1825 }, // 4 GHz (C-band)
    20: { aH: 0.0168, aV: 0.0168, bH: 0.7986, bV: 0.7986 }, // 20 GHz (Ka-band)
    30: { aH: 0.0691, aV: 0.0691, bH: 0.6932, bV: 0.6932 }  // 30 GHz (Ka-band)
  };

  /**
   * Calculate rain attenuation using ITU-R P.618 model
   */
  calculateRainAttenuation(
    frequency: number,        // GHz
    elevationAngle: number,   // degrees
    rainRate: number,         // mm/h
    polarization: 'horizontal' | 'vertical' = 'vertical'
  ): number {
    // Find closest frequency coefficients
    const freqKey = this.findClosestFrequency(frequency);
    const coeffs = this.RAIN_COEFFICIENTS[freqKey as keyof typeof this.RAIN_COEFFICIENTS];
    
    // Get specific attenuation
    const a = polarization === 'horizontal' ? coeffs.aH : coeffs.aV;
    const b = polarization === 'horizontal' ? coeffs.bH : coeffs.bV;
    const specificAttenuation = a * Math.pow(rainRate, b); // dB/km
    
    // Calculate effective path length through rain
    const pathLength = this.calculateRainPathLength(elevationAngle); // km
    
    // Apply path reduction factor for spatial variability
    const pathReductionFactor = this.calculatePathReductionFactor(
      specificAttenuation * pathLength,
      frequency,
      pathLength
    );
    
    return specificAttenuation * pathLength * pathReductionFactor;
  }

  /**
   * Calculate link availability for given weather conditions
   */
  calculateLinkAvailability(
    frequency: number,
    elevationAngle: number,
    weatherConditions: WeatherConditions,
    linkMargin: number = 3 // dB
  ): LinkAvailability {
    // Rain attenuation for 0.01% and 0.1% exceedance
    const rainAtten001 = this.calculateRainAttenuation(
      frequency, 
      elevationAngle, 
      weatherConditions.climaticData.rainRate01
    );
    
    const rainAtten01 = this.calculateRainAttenuation(
      frequency,
      elevationAngle,
      weatherConditions.climaticData.rainRate1
    );

    // Gas attenuation (simplified model)
    const gasAttenuation = this.calculateGasAttenuation(
      frequency,
      elevationAngle,
      weatherConditions.climaticData.temperatureRange[1],
      weatherConditions.climaticData.humidityPercent
    );

    // Cloud attenuation (simplified)
    const cloudAttenuation = frequency > 10 ? 0.5 : 0.2; // dB

    // Total attenuation
    const totalAttenuation = rainAtten001 + gasAttenuation + cloudAttenuation;

    // Calculate availability based on link margin
    let availabilityPercent: number;
    if (totalAttenuation <= linkMargin) {
      availabilityPercent = 99.99;
    } else if (totalAttenuation <= linkMargin + 5) {
      availabilityPercent = 99.9;
    } else if (totalAttenuation <= linkMargin + 10) {
      availabilityPercent = 99.5;
    } else if (totalAttenuation <= linkMargin + 15) {
      availabilityPercent = 99.0;
    } else {
      availabilityPercent = 98.0;
    }

    // Calculate outage duration
    const outageDurationHours = (8760 * (100 - availabilityPercent)) / 100;

    return {
      frequency,
      elevationAngle,
      rainAttenuation: rainAtten001,
      gasAttenuation,
      cloudAttenuation,
      totalAttenuation,
      availabilityPercent,
      outageDurationHours
    };
  }

  /**
   * Comprehensive weather impact assessment for a ground station
   */
  assessStationWeatherImpact(
    stationId: string,
    location: { latitude: number; longitude: number; elevation?: number },
    operatingFrequencies: Array<{ band: string; frequency: number; usage: string }>,
    elevationAngles: { minimum: number; typical: number },
    targetAvailability: number = 99.5
  ): WeatherImpactAssessment {
    
    // Get weather conditions for location
    const weatherConditions = this.getWeatherConditions(location);

    // Calculate availability for each frequency
    const serviceLevelAvailability: any = {};
    let totalWeightedAvailability = 0;
    let totalWeight = 0;

    operatingFrequencies.forEach(freq => {
      const availability = this.calculateLinkAvailability(
        freq.frequency,
        elevationAngles.typical,
        weatherConditions,
        6 // 6dB link margin typical
      );

      // Weight by frequency usage importance
      const weight = freq.usage.includes('primary') ? 2 : 1;
      totalWeightedAvailability += availability.availabilityPercent * weight;
      totalWeight += weight;

      // Map to service categories
      if (freq.band === 'C-band') {
        if (freq.frequency < 6) {
          serviceLevelAvailability.cBandUplink = availability;
        } else {
          serviceLevelAvailability.cBandDownlink = availability;
        }
      } else if (freq.band === 'Ku-band') {
        if (freq.frequency < 13) {
          serviceLevelAvailability.kuBandUplink = availability;
        } else {
          serviceLevelAvailability.kuBandDownlink = availability;
        }
      } else if (freq.band === 'Ka-band') {
        if (freq.frequency < 25) {
          serviceLevelAvailability.kaBandUplink = availability;
        } else {
          serviceLevelAvailability.kaBandDownlink = availability;
        }
      }
    });

    const overallAvailability = totalWeightedAvailability / totalWeight;

    // Calculate capacity impact
    const annualCapacityLoss = (100 - overallAvailability) * 2; // 2x multiplier for redundancy needs
    const seasonalCapacityLoss = this.calculateSeasonalImpact(weatherConditions, annualCapacityLoss);
    const recommendedBackup = Math.max(10, annualCapacityLoss * 1.5);

    // Generate mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(
      overallAvailability,
      weatherConditions,
      operatingFrequencies
    );

    // Assess SLA risk
    let slaRisk: 'low' | 'medium' | 'high' | 'critical';
    if (overallAvailability >= targetAvailability) {
      slaRisk = 'low';
    } else if (overallAvailability >= targetAvailability - 0.5) {
      slaRisk = 'medium';
    } else if (overallAvailability >= targetAvailability - 1.0) {
      slaRisk = 'high';
    } else {
      slaRisk = 'critical';
    }

    return {
      stationId,
      overallAvailability,
      serviceLevelAvailability,
      capacityReduction: {
        annual: annualCapacityLoss,
        seasonal: seasonalCapacityLoss,
        contingency: recommendedBackup
      },
      mitigationStrategies,
      slaRisk
    };
  }

  /**
   * Get typical weather conditions for a location (simplified model)
   */
  private getWeatherConditions(location: { latitude: number; longitude: number; elevation?: number }): WeatherConditions {
    const lat = Math.abs(location.latitude);
    const isEquatorial = lat < 10;
    const isTemperate = lat >= 10 && lat < 45;
    const elevation = location.elevation || 100;

    // Simplified climatic zones
    let rainRate01: number, rainRate1: number, annualRainfall: number;
    
    if (isEquatorial) {
      // Tropical climate
      rainRate01 = 145; // mm/h
      rainRate1 = 42;
      annualRainfall = 2500;
    } else if (isTemperate) {
      // Temperate climate  
      rainRate01 = 42;
      rainRate1 = 12;
      annualRainfall = 800;
    } else {
      // Polar/dry climate
      rainRate01 = 8;
      rainRate1 = 2;
      annualRainfall = 200;
    }

    return {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        elevation
      },
      climaticData: {
        rainRate01,
        rainRate1,
        annualRainfallMm: annualRainfall,
        temperatureRange: isEquatorial ? [22, 32] : isTemperate ? [0, 25] : [-10, 10],
        humidityPercent: isEquatorial ? 80 : isTemperate ? 65 : 45
      },
      seasonalFactors: {
        wetSeasonMonths: isEquatorial ? [5, 6, 7, 8, 9, 10] : [3, 4, 5, 9, 10, 11],
        drySeasonMonths: isEquatorial ? [11, 12, 1, 2, 3, 4] : [6, 7, 8],
        cycloneRisk: (lat < 30 && Math.abs(location.longitude) < 180) ? 'medium' : 'low'
      }
    };
  }

  private findClosestFrequency(frequency: number): number {
    const frequencies = Object.keys(this.RAIN_COEFFICIENTS).map(Number);
    return frequencies.reduce((closest, freq) => 
      Math.abs(freq - frequency) < Math.abs(closest - frequency) ? freq : closest
    );
  }

  private calculateRainPathLength(elevationAngle: number): number {
    // Simplified path length through rain layer (typically 2-4 km thick)
    const rainLayerHeight = 3; // km
    const pathLength = rainLayerHeight / Math.sin(elevationAngle * Math.PI / 180);
    return Math.min(pathLength, 10); // Cap at 10 km for low elevation angles
  }

  private calculatePathReductionFactor(attenuation: number, frequency: number, pathLength: number): number {
    // ITU-R P.618 path reduction factor for spatial rain variability
    if (attenuation <= 1) return 1.0;
    
    const r001 = 1 / (1 + 0.045 * pathLength); // Simplified model
    return Math.max(0.1, r001);
  }

  private calculateGasAttenuation(frequency: number, elevation: number, temperature: number, humidity: number): number {
    // Simplified gas attenuation - mainly water vapor and oxygen
    const waterVaporDensity = humidity * 0.2; // Simplified conversion
    const oxygenAtten = frequency < 20 ? 0.1 : 0.2;
    const waterVaporAtten = waterVaporDensity * 0.05;
    
    const pathLength = 1 / Math.sin(elevation * Math.PI / 180);
    return (oxygenAtten + waterVaporAtten) * Math.min(pathLength, 5);
  }

  private calculateSeasonalImpact(weather: WeatherConditions, annualLoss: number): number {
    // Higher impact during wet season
    const wetSeasonMonths = weather.seasonalFactors.wetSeasonMonths.length;
    const seasonalMultiplier = wetSeasonMonths > 6 ? 2.5 : 1.8;
    return Math.min(annualLoss * seasonalMultiplier, 95);
  }

  private generateMitigationStrategies(
    availability: number,
    weather: WeatherConditions,
    frequencies: Array<{ band: string; frequency: number; usage: string }>
  ): string[] {
    const strategies: string[] = [];

    if (availability < 99.5) {
      strategies.push('Install site diversity or backup earth station');
      strategies.push('Implement adaptive coding and modulation (ACM)');
    }

    if (availability < 99.0) {
      strategies.push('Deploy uplink power control (ULPC) system');
      strategies.push('Consider frequency diversity across C/Ku/Ka bands');
    }

    if (weather.climaticData.rainRate01 > 100) {
      strategies.push('Install weather radar integration for proactive fade mitigation');
      strategies.push('Implement fade prediction algorithms');
    }

    // High frequency specific strategies
    if (frequencies.some(f => f.frequency > 18)) {
      strategies.push('Deploy Ka-band specific fade mitigation equipment');
      strategies.push('Consider hybrid C/Ka-band service provisioning');
    }

    return strategies;
  }
}

// Export singleton instance
export const weatherImpactCalculator = new WeatherImpactCalculator();