/**
 * Ground Station Telemetry Generator
 * Generates realistic synthetic telemetry data for ground stations
 * Based on actual satellite communication metrics
 */

export interface SignalMetrics {
  timestamp: Date;
  cnr: number;              // Carrier-to-Noise Ratio (dB)
  ebno: number;             // Energy per bit to noise power spectral density (dB)
  ber: number;              // Bit Error Rate (10^-x)
  rssi: number;             // Received Signal Strength Indicator (dBm)
  snr: number;              // Signal-to-Noise Ratio (dB)
  frequency: number;        // Center frequency (MHz)
  symbolRate: number;       // Symbol rate (Msps)
  modulation: string;       // Modulation scheme (QPSK, 8PSK, 16QAM, etc.)
}

export interface LinkBudgetMetrics {
  timestamp: Date;
  eirp: number;             // Effective Isotropic Radiated Power (dBW)
  pathLoss: number;         // Free space path loss (dB)
  atmosphericLoss: number;  // Atmospheric attenuation (dB)
  rainFade: number;         // Rain fade margin (dB)
  gt: number;               // G/T figure of merit (dB/K)
  systemTemp: number;       // System noise temperature (K)
  antennaGain: number;      // Antenna gain (dBi)
  pointingLoss: number;     // Pointing error loss (dB)
  linkMargin: number;       // Available link margin (dB)
}

export interface OperationalMetrics {
  timestamp: Date;
  elevation: number;        // Satellite elevation angle (degrees)
  azimuth: number;          // Satellite azimuth angle (degrees)
  range: number;            // Slant range to satellite (km)
  passDuration: number;     // Pass duration (seconds)
  doppler: number;          // Doppler shift (kHz)
  trackingError: number;    // Tracking error (degrees)
  antennaStatus: 'idle' | 'tracking' | 'slewing' | 'maintenance';
  passesPerDay: number;     // Number of satellite passes per day
  dataVolume: number;       // Data volume transferred (GB)
}

export interface EnvironmentalMetrics {
  timestamp: Date;
  temperature: number;      // Ambient temperature (°C)
  humidity: number;         // Relative humidity (%)
  pressure: number;         // Atmospheric pressure (hPa)
  windSpeed: number;        // Wind speed (m/s)
  precipitation: number;    // Precipitation rate (mm/hr)
  solarRadiation: number;   // Solar radiation (W/m²)
  visibility: number;       // Visibility (km)
}

export interface NetworkMetrics {
  timestamp: Date;
  throughput: number;       // Data throughput (Mbps)
  latency: number;          // Network latency (ms)
  packetLoss: number;       // Packet loss rate (%)
  jitter: number;           // Jitter (ms)
  availability: number;     // Service availability (%)
  utilization: number;      // Resource utilization (%)
  activeConnections: number; // Number of active connections
}

export class TelemetryGenerator {
  private stationId: string;
  private baseMetrics: any;
  private timeOfDay: number = 0;
  private dayOfYear: number = 0;
  
  constructor(stationId: string, stationData: any) {
    this.stationId = stationId;
    this.baseMetrics = this.calculateBaseMetrics(stationData);
    
    const now = new Date();
    this.timeOfDay = now.getHours() + now.getMinutes() / 60;
    this.dayOfYear = this.getDayOfYear(now);
  }
  
  /**
   * Calculate base metrics from station characteristics
   */
  private calculateBaseMetrics(stationData: any) {
    return {
      baseEirp: 50 + (stationData.antenna_count || 1) * 3,
      baseGt: 25 + Math.log10(stationData.antenna_count || 1) * 10,
      baseUtilization: stationData.utilization || 0.7,
      latitude: stationData.latitude || 0,
      longitude: stationData.longitude || 0,
      antennaCount: stationData.antenna_count || 1,
      frequencyBands: stationData.frequency_bands || ['Ku-band'],
      capacity: stationData.capacity_gbps || 10
    };
  }
  
  /**
   * Generate signal quality metrics with realistic variations
   */
  generateSignalMetrics(timestamp: Date = new Date()): SignalMetrics {
    // Add diurnal variation (ionospheric effects)
    const diurnalFactor = this.getDiurnalFactor(timestamp);
    
    // Add weather impact
    const weatherFactor = this.getWeatherFactor(timestamp);
    
    // Base signal quality
    const baseCnr = 15 + Math.random() * 5;
    const cnr = baseCnr * diurnalFactor * weatherFactor;
    
    return {
      timestamp,
      cnr: this.addNoise(cnr, 0.5),
      ebno: this.addNoise(cnr - 3, 0.3),
      ber: Math.pow(10, -Math.min(9, Math.max(3, cnr / 2))),
      rssi: this.addNoise(-70 + cnr, 2),
      snr: this.addNoise(cnr + 2, 0.5),
      frequency: this.baseMetrics.frequencyBands.includes('Ka-band') ? 20000 : 12000,
      symbolRate: 30,
      modulation: cnr > 12 ? '16QAM' : cnr > 8 ? '8PSK' : 'QPSK'
    };
  }
  
  /**
   * Generate link budget metrics
   */
  generateLinkBudgetMetrics(timestamp: Date = new Date()): LinkBudgetMetrics {
    const elevation = this.getCurrentElevation(timestamp);
    const weather = this.getWeatherFactor(timestamp);
    
    // Calculate path loss based on frequency and range
    const frequency = this.baseMetrics.frequencyBands.includes('Ka-band') ? 20 : 12; // GHz
    const range = 36000 / Math.sin(elevation * Math.PI / 180); // km to GEO satellite
    const pathLoss = 20 * Math.log10(range) + 20 * Math.log10(frequency) + 92.45;
    
    // Rain fade increases with frequency
    const rainFade = frequency > 15 ? (1 - weather) * 10 : (1 - weather) * 3;
    
    return {
      timestamp,
      eirp: this.addNoise(this.baseMetrics.baseEirp, 1),
      pathLoss: this.addNoise(pathLoss, 0.5),
      atmosphericLoss: this.addNoise(0.5 + rainFade, 0.2),
      rainFade: this.addNoise(rainFade, 0.5),
      gt: this.addNoise(this.baseMetrics.baseGt, 0.3),
      systemTemp: this.addNoise(150 + (1 - weather) * 50, 10),
      antennaGain: this.addNoise(45 + Math.log10(this.baseMetrics.antennaCount) * 3, 0.5),
      pointingLoss: this.addNoise(0.3 + Math.random() * 0.2, 0.1),
      linkMargin: this.addNoise(3 + weather * 2, 0.5)
    };
  }
  
  /**
   * Generate operational metrics
   */
  generateOperationalMetrics(timestamp: Date = new Date()): OperationalMetrics {
    // Simulate satellite pass
    const passInfo = this.simulateSatellitePass(timestamp);
    
    return {
      timestamp,
      elevation: passInfo.elevation,
      azimuth: passInfo.azimuth,
      range: passInfo.range,
      passDuration: passInfo.duration,
      doppler: passInfo.doppler,
      trackingError: this.addNoise(0.1, 0.05),
      antennaStatus: passInfo.elevation > 0 ? 'tracking' : 'idle',
      passesPerDay: 8 + Math.floor(Math.random() * 4),
      dataVolume: this.addNoise(this.baseMetrics.capacity * this.baseMetrics.baseUtilization * 86.4, 10)
    };
  }
  
  /**
   * Generate environmental metrics
   */
  generateEnvironmentalMetrics(timestamp: Date = new Date()): EnvironmentalMetrics {
    const season = this.getSeasonFactor(timestamp);
    const timeOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
    
    // Temperature varies with time of day and season
    const baseTemp = 20 + season * 10;
    const temperature = baseTemp + Math.sin((timeOfDay - 6) * Math.PI / 12) * 5;
    
    return {
      timestamp,
      temperature: this.addNoise(temperature, 1),
      humidity: this.addNoise(50 + season * 20, 5),
      pressure: this.addNoise(1013 + Math.sin(timeOfDay * Math.PI / 12) * 5, 2),
      windSpeed: this.addNoise(5 + Math.random() * 10, 2),
      precipitation: Math.random() > 0.8 ? this.addNoise(2, 1) : 0,
      solarRadiation: Math.max(0, Math.sin((timeOfDay - 6) * Math.PI / 12) * 800),
      visibility: this.addNoise(10 - Math.random() * 3, 1)
    };
  }
  
  /**
   * Generate network performance metrics
   */
  generateNetworkMetrics(timestamp: Date = new Date()): NetworkMetrics {
    const utilization = this.getUtilizationPattern(timestamp);
    const congestion = utilization > 0.8 ? (utilization - 0.8) * 5 : 0;
    
    return {
      timestamp,
      throughput: this.addNoise(this.baseMetrics.capacity * 1000 * utilization, 50),
      latency: this.addNoise(550 + congestion * 100, 10), // GEO satellite latency
      packetLoss: this.addNoise(0.01 + congestion * 0.05, 0.005),
      jitter: this.addNoise(5 + congestion * 10, 2),
      availability: this.addNoise(99.5 - congestion, 0.1),
      utilization: utilization * 100,
      activeConnections: Math.floor(utilization * this.baseMetrics.antennaCount * 10)
    };
  }
  
  /**
   * Generate complete telemetry dataset
   */
  generateCompleteTelemetry(timestamp: Date = new Date()) {
    return {
      stationId: this.stationId,
      timestamp,
      signal: this.generateSignalMetrics(timestamp),
      linkBudget: this.generateLinkBudgetMetrics(timestamp),
      operational: this.generateOperationalMetrics(timestamp),
      environmental: this.generateEnvironmentalMetrics(timestamp),
      network: this.generateNetworkMetrics(timestamp)
    };
  }
  
  /**
   * Generate time series data
   */
  generateTimeSeries(
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 5
  ): any[] {
    const data = [];
    const current = new Date(startTime);
    
    while (current <= endTime) {
      data.push(this.generateCompleteTelemetry(new Date(current)));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return data;
  }
  
  // Helper functions
  
  private getDiurnalFactor(timestamp: Date): number {
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;
    // Ionospheric scintillation is worse at night
    return 1 - Math.sin((hour - 6) * Math.PI / 12) * 0.1;
  }
  
  private getWeatherFactor(timestamp: Date): number {
    // Simplified weather model - varies slowly over hours
    const seed = Math.floor(timestamp.getTime() / (1000 * 60 * 60 * 3)); // 3-hour blocks
    const random = this.seededRandom(seed);
    return 0.7 + random * 0.3;
  }
  
  private getSeasonFactor(timestamp: Date): number {
    const day = this.getDayOfYear(timestamp);
    // Northern hemisphere seasons
    return Math.cos((day - 172) * 2 * Math.PI / 365);
  }
  
  private getUtilizationPattern(timestamp: Date): number {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Business hours pattern
    let utilization = this.baseMetrics.baseUtilization;
    
    // Weekday peak hours (9 AM - 5 PM)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hour >= 9 && hour <= 17) {
        utilization *= 1.3;
      } else if (hour >= 6 && hour <= 9) {
        utilization *= 1.1;
      } else if (hour >= 17 && hour <= 20) {
        utilization *= 1.2;
      } else {
        utilization *= 0.6;
      }
    } else {
      // Weekend pattern
      utilization *= 0.7;
    }
    
    return Math.min(0.95, utilization);
  }
  
  private getCurrentElevation(timestamp: Date): number {
    // Simulate a satellite pass
    const minute = timestamp.getMinutes();
    if (minute < 15 || minute > 45) {
      return 0; // No satellite in view
    }
    // Parabolic pass profile
    const t = (minute - 15) / 30;
    return 90 * (1 - Math.pow(2 * t - 1, 2));
  }
  
  private simulateSatellitePass(timestamp: Date) {
    const elevation = this.getCurrentElevation(timestamp);
    const minute = timestamp.getMinutes();
    
    if (elevation === 0) {
      return {
        elevation: 0,
        azimuth: 0,
        range: 0,
        duration: 0,
        doppler: 0
      };
    }
    
    // Simulate azimuth sweep
    const azimuth = 90 + (minute - 30) * 3;
    
    // Calculate range to GEO satellite
    const range = 36000 / Math.sin(Math.max(0.1, elevation) * Math.PI / 180);
    
    // Doppler shift calculation (simplified)
    const velocity = 3.07; // km/s for GEO
    const doppler = (velocity / 300000) * 12e9 * Math.cos(elevation * Math.PI / 180) / 1000; // kHz
    
    return {
      elevation,
      azimuth: (azimuth + 360) % 360,
      range,
      duration: 1800, // 30 minutes typical pass
      doppler
    };
  }
  
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  
  private addNoise(value: number, amplitude: number): number {
    return value + (Math.random() - 0.5) * 2 * amplitude;
  }
  
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}

// Export singleton instance
let generatorInstance: TelemetryGenerator | null = null;

export function getTelemetryGenerator(stationId: string, stationData: any): TelemetryGenerator {
  if (!generatorInstance || generatorInstance['stationId'] !== stationId) {
    generatorInstance = new TelemetryGenerator(stationId, stationData);
  }
  return generatorInstance;
}