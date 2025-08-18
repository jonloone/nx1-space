/**
 * Telemetry Type Definitions
 * Comprehensive type definitions for ground station telemetry
 */

// Frequency bands used in satellite communications
export type FrequencyBand = 'L-band' | 'S-band' | 'C-band' | 'X-band' | 'Ku-band' | 'Ka-band' | 'V-band';

// Modulation schemes
export type ModulationScheme = 'BPSK' | 'QPSK' | '8PSK' | '16QAM' | '32QAM' | '64QAM' | '128QAM' | '256QAM';

// Antenna types
export type AntennaType = 'parabolic' | 'cassegrain' | 'gregorian' | 'phased-array' | 'horn' | 'helical';

// Ground station status
export type StationStatus = 'operational' | 'maintenance' | 'degraded' | 'offline' | 'testing';

// Antenna operational status
export type AntennaStatus = 'idle' | 'tracking' | 'slewing' | 'maintenance' | 'error';

// Pass priority levels
export type PassPriority = 'critical' | 'high' | 'medium' | 'low' | 'routine';

/**
 * Ground Station Configuration
 */
export interface GroundStationConfig {
  stationId: string;
  name: string;
  operator: string;
  location: {
    latitude: number;
    longitude: number;
    altitude: number; // meters
    city: string;
    country: string;
    region: string;
    timezone: string;
  };
  capabilities: {
    frequencyBands: FrequencyBand[];
    uplinkCapable: boolean;
    downlinkCapable: boolean;
    maxDataRate: number; // Mbps
    maxEIRP: number; // dBW
    gtFigure: number; // dB/K
  };
  antennas: AntennaConfig[];
  network: {
    fiberConnected: boolean;
    backupLinks: number;
    latencyToCore: number; // ms
  };
}

/**
 * Antenna Configuration
 */
export interface AntennaConfig {
  antennaId: string;
  type: AntennaType;
  diameter: number; // meters
  frequencyBands: FrequencyBand[];
  gainTx: number; // dBi
  gainRx: number; // dBi
  beamwidth: number; // degrees
  polarization: 'linear' | 'circular' | 'dual';
  trackingCapability: {
    maxElevationRate: number; // degrees/second
    maxAzimuthRate: number; // degrees/second
    minElevation: number; // degrees
    maxElevation: number; // degrees
  };
}

/**
 * Satellite Pass Information
 */
export interface SatellitePass {
  satelliteId: string;
  satelliteName: string;
  passId: string;
  startTime: Date;
  endTime: Date;
  maxElevation: number; // degrees
  startAzimuth: number; // degrees
  endAzimuth: number; // degrees
  duration: number; // seconds
  priority: PassPriority;
  dataVolume: number; // MB
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  tle: {
    line1: string;
    line2: string;
  };
}

/**
 * Real-time Tracking Data
 */
export interface TrackingData {
  timestamp: Date;
  satelliteId: string;
  antennaId: string;
  position: {
    elevation: number; // degrees
    azimuth: number; // degrees
    range: number; // km
    rangeRate: number; // km/s
  };
  pointing: {
    commandedElevation: number;
    commandedAzimuth: number;
    actualElevation: number;
    actualAzimuth: number;
    trackingError: number; // degrees
  };
  doppler: {
    uplinkShift: number; // kHz
    downlinkShift: number; // kHz
    compensated: boolean;
  };
}

/**
 * Signal Quality Metrics
 */
export interface SignalQuality {
  timestamp: Date;
  metrics: {
    cnr: number; // Carrier-to-Noise Ratio (dB)
    snr: number; // Signal-to-Noise Ratio (dB)
    ebno: number; // Eb/N0 (dB)
    ber: number; // Bit Error Rate
    fer: number; // Frame Error Rate
    rssi: number; // Received Signal Strength (dBm)
    esno: number; // Es/N0 (dB)
  };
  spectrum: {
    centerFrequency: number; // MHz
    bandwidth: number; // MHz
    symbolRate: number; // Msps
    rollOff: number; // percentage
  };
  demodulation: {
    modulation: ModulationScheme;
    fec: string; // Forward Error Correction
    locked: boolean;
    lockTime: number; // seconds
  };
}

/**
 * Link Budget Calculation
 */
export interface LinkBudget {
  timestamp: Date;
  uplink: {
    eirp: number; // dBW
    pathLoss: number; // dB
    atmosphericLoss: number; // dB
    rainFade: number; // dB
    pointingLoss: number; // dB
    polarizationLoss: number; // dB
    receivedPower: number; // dBW
    systemNoiseTemp: number; // K
    cnr: number; // dB
    requiredCnr: number; // dB
    margin: number; // dB
  };
  downlink: {
    satelliteEirp: number; // dBW
    pathLoss: number; // dB
    atmosphericLoss: number; // dB
    rainFade: number; // dB
    pointingLoss: number; // dB
    polarizationLoss: number; // dB
    gt: number; // dB/K
    receivedCnr: number; // dB
    requiredCnr: number; // dB
    margin: number; // dB
  };
}

/**
 * Weather Impact Data
 */
export interface WeatherImpact {
  timestamp: Date;
  conditions: {
    temperature: number; // Celsius
    humidity: number; // percentage
    pressure: number; // hPa
    windSpeed: number; // m/s
    windDirection: number; // degrees
    precipitation: number; // mm/hr
    cloudCover: number; // percentage
    visibility: number; // km
  };
  impact: {
    rainFade: number; // dB
    atmosphericAttenuation: number; // dB
    scintillationIndex: number; // S4 index
    troposphericDelay: number; // meters
    refractiveIndex: number;
  };
  forecast: {
    duration: number; // hours
    severity: 'none' | 'minor' | 'moderate' | 'severe';
    recommendation: string;
  };
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  timestamp: Date;
  availability: {
    percentage: number;
    downtime: number; // minutes
    mtbf: number; // hours (Mean Time Between Failures)
    mttr: number; // hours (Mean Time To Repair)
  };
  throughput: {
    current: number; // Mbps
    average: number; // Mbps
    peak: number; // Mbps
    utilization: number; // percentage
  };
  quality: {
    successfulPasses: number;
    failedPasses: number;
    dataIntegrity: number; // percentage
    retransmissions: number;
  };
  efficiency: {
    powerConsumption: number; // kW
    dataPerWatt: number; // Mbps/W
    costPerBit: number; // $/Mbit
  };
}

/**
 * Alert and Event Data
 */
export interface TelemetryAlert {
  alertId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'signal' | 'hardware' | 'weather' | 'network' | 'operational';
  title: string;
  description: string;
  affectedSystems: string[];
  metrics: Record<string, number>;
  acknowledged: boolean;
  resolvedAt?: Date;
}

/**
 * Aggregated Station Metrics
 */
export interface StationMetrics {
  stationId: string;
  period: {
    start: Date;
    end: Date;
    duration: number; // hours
  };
  operational: {
    totalPasses: number;
    successfulPasses: number;
    totalDataVolume: number; // GB
    averagePassDuration: number; // minutes
    peakConcurrentPasses: number;
  };
  performance: {
    averageCnr: number; // dB
    averageThroughput: number; // Mbps
    availability: number; // percentage
    linkQuality: number; // percentage
  };
  utilization: {
    antennaUtilization: number; // percentage
    networkUtilization: number; // percentage
    powerUtilization: number; // percentage
    storageUtilization: number; // percentage
  };
  financial: {
    revenue: number; // USD
    operationalCost: number; // USD
    margin: number; // percentage
    revenuePerPass: number; // USD
  };
}

/**
 * Complete Telemetry Package
 */
export interface TelemetryPackage {
  stationId: string;
  timestamp: Date;
  signal: SignalQuality;
  tracking: TrackingData;
  linkBudget: LinkBudget;
  weather: WeatherImpact;
  performance: PerformanceMetrics;
  alerts: TelemetryAlert[];
  metadata: {
    version: string;
    source: string;
    processingTime: number; // ms
  };
}