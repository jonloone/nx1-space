import { TLEData, SatelliteTrackingData } from './types/ground-station';

/**
 * TLE (Two-Line Element) data loader and satellite tracking utilities
 */

export interface TLESource {
  name: string;
  url: string;
  description: string;
  update_frequency: string;
}

/**
 * Common TLE data sources
 */
export const TLE_SOURCES: TLESource[] = [
  {
    name: 'CelesTrak Active Satellites',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    description: 'Active satellites from CelesTrak',
    update_frequency: 'Daily'
  },
  {
    name: 'CelesTrak Geostationary',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle',
    description: 'Geostationary satellites',
    update_frequency: 'Daily'
  },
  {
    name: 'CelesTrak GPS',
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
    description: 'GPS operational satellites',
    update_frequency: 'Daily'
  },
  {
    name: 'Space-Track.org',
    url: 'https://www.space-track.org/basicspacedata/query/class/gp/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/format/tle',
    description: 'Official US Space Force tracking data',
    update_frequency: 'Multiple times daily'
  }
];

/**
 * Parses TLE data from a string format
 */
export function parseTLEData(tleString: string): TLEData[] {
  const lines = tleString.trim().split('\n');
  const tleData: TLEData[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;

    const satelliteName = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();

    // Validate TLE format
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      console.warn(`Invalid TLE format for satellite: ${satelliteName}`);
      continue;
    }

    try {
      const tle = parseSingleTLE(satelliteName, line1, line2);
      tleData.push(tle);
    } catch (error) {
      console.warn(`Error parsing TLE for ${satelliteName}:`, error);
    }
  }

  return tleData;
}

/**
 * Parses a single TLE entry
 */
function parseSingleTLE(satelliteName: string, line1: string, line2: string): TLEData {
  // Parse Line 1
  const epochYear = parseInt(line1.substring(18, 20));
  const epochDay = parseFloat(line1.substring(20, 32));
  const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
  
  // Parse Line 2
  const inclination = parseFloat(line2.substring(8, 16));
  const raan = parseFloat(line2.substring(17, 25)); // Right Ascension of the Ascending Node
  const eccentricity = parseFloat('0.' + line2.substring(26, 33));
  const argumentOfPerigee = parseFloat(line2.substring(34, 42));
  const meanAnomaly = parseFloat(line2.substring(43, 51));
  const meanMotion = parseFloat(line2.substring(52, 63));
  const revolutionNumber = parseInt(line2.substring(63, 68));

  // Calculate epoch date
  const epochDate = new Date(fullYear, 0, 1);
  epochDate.setDate(epochDay);

  return {
    satellite_name: satelliteName,
    line1,
    line2,
    epoch: epochDate.toISOString(),
    inclination,
    raan,
    eccentricity,
    argument_of_perigee: argumentOfPerigee,
    mean_anomaly: meanAnomaly,
    mean_motion: meanMotion,
    revolution_number: revolutionNumber,
    last_updated: new Date().toISOString()
  };
}

/**
 * Fetches TLE data from a given source
 */
export async function fetchTLEData(source: TLESource): Promise<TLEData[]> {
  try {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tleString = await response.text();
    return parseTLEData(tleString);
  } catch (error) {
    console.error(`Error fetching TLE data from ${source.name}:`, error);
    return [];
  }
}

/**
 * Calculates satellite position from TLE data at a given time
 */
export function calculateSatellitePosition(tle: TLEData, date?: Date): {
  latitude: number;
  longitude: number;
  altitude_km: number;
} {
  const targetDate = date || new Date();
  const epochDate = new Date(tle.epoch);
  const minutesSinceEpoch = (targetDate.getTime() - epochDate.getTime()) / (1000 * 60);

  // Simplified orbital mechanics calculation
  // In production, use a proper SGP4/SDP4 implementation like satellite.js
  
  // Calculate mean anomaly at target time
  const meanAnomalyAtTime = (tle.mean_anomaly + tle.mean_motion * minutesSinceEpoch) % 360;
  
  // Simplified position calculation (this is a basic approximation)
  const semiMajorAxis = Math.pow((1440 / (2 * Math.PI * tle.mean_motion)), 2/3) * 398600.4418; // km
  const eccentricAnomaly = solveKeplersEquation(meanAnomalyAtTime * Math.PI / 180, tle.eccentricity);
  
  // Position in orbital plane
  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);
  const r = semiMajorAxis * (1 - tle.eccentricity * cosE);
  
  // Convert to ECI coordinates (simplified)
  const longitude = (tle.raan + tle.argument_of_perigee + meanAnomalyAtTime) % 360;
  const latitude = Math.asin(Math.sin(tle.inclination * Math.PI / 180) * Math.sin((tle.argument_of_perigee + meanAnomalyAtTime) * Math.PI / 180)) * 180 / Math.PI;
  
  return {
    latitude: Math.max(-90, Math.min(90, latitude)),
    longitude: longitude > 180 ? longitude - 360 : longitude,
    altitude_km: r - 6371 // Subtract Earth radius
  };
}

/**
 * Solves Kepler's equation using Newton-Raphson method
 */
function solveKeplersEquation(meanAnomaly: number, eccentricity: number, tolerance = 1e-6): number {
  let eccentricAnomaly = meanAnomaly;
  let delta = 1;
  let iterations = 0;
  const maxIterations = 20;

  while (Math.abs(delta) > tolerance && iterations < maxIterations) {
    delta = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
            (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    iterations++;
  }

  return eccentricAnomaly;
}

/**
 * Calculates visibility windows for a satellite from a ground station
 */
export function calculateVisibilityWindows(
  tle: TLEData,
  stationLat: number,
  stationLng: number,
  minElevation = 10,
  durationHours = 24
): Array<{
  aos: string;
  los: string;
  max_elevation: number;
  duration_minutes: number;
}> {
  const windows = [];
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  
  let currentTime = new Date(startTime);
  let inPass = false;
  let passStart: Date | null = null;
  let maxElevation = 0;

  // Check every minute for visibility
  while (currentTime < endTime) {
    const satPos = calculateSatellitePosition(tle, currentTime);
    const elevation = calculateElevation(stationLat, stationLng, satPos.latitude, satPos.longitude, satPos.altitude_km);
    
    if (elevation >= minElevation && !inPass) {
      // Start of pass
      inPass = true;
      passStart = new Date(currentTime);
      maxElevation = elevation;
    } else if (elevation < minElevation && inPass) {
      // End of pass
      inPass = false;
      if (passStart) {
        const duration = (currentTime.getTime() - passStart.getTime()) / (1000 * 60);
        windows.push({
          aos: passStart.toISOString(),
          los: currentTime.toISOString(),
          max_elevation: maxElevation,
          duration_minutes: duration
        });
      }
      maxElevation = 0;
    } else if (inPass) {
      // Update max elevation during pass
      maxElevation = Math.max(maxElevation, elevation);
    }

    currentTime = new Date(currentTime.getTime() + 60 * 1000); // Advance by 1 minute
  }

  return windows;
}

/**
 * Calculates elevation angle from ground station to satellite
 */
function calculateElevation(
  stationLat: number,
  stationLng: number,
  satLat: number,
  satLng: number,
  satAltKm: number
): number {
  // Convert to radians
  const stationLatRad = stationLat * Math.PI / 180;
  const stationLngRad = stationLng * Math.PI / 180;
  const satLatRad = satLat * Math.PI / 180;
  const satLngRad = satLng * Math.PI / 180;

  // Calculate distance using haversine formula
  const dLat = satLatRad - stationLatRad;
  const dLng = satLngRad - stationLngRad;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(stationLatRad) * Math.cos(satLatRad) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = 6371 * c; // Distance in km

  // Calculate elevation angle
  const elevation = Math.atan2(satAltKm, distance) * 180 / Math.PI;
  return Math.max(0, elevation);
}

/**
 * Generates ground track for a satellite
 */
export function generateGroundTrack(
  tle: TLEData,
  durationMinutes = 90,
  intervalMinutes = 1
): Array<{
  latitude: number;
  longitude: number;
  timestamp: string;
}> {
  const track = [];
  const startTime = new Date();
  
  for (let i = 0; i <= durationMinutes; i += intervalMinutes) {
    const time = new Date(startTime.getTime() + i * 60 * 1000);
    const position = calculateSatellitePosition(tle, time);
    
    track.push({
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: time.toISOString()
    });
  }
  
  return track;
}

/**
 * Filters TLE data by satellite names or NORAD IDs
 */
export function filterTLEData(
  tleData: TLEData[],
  filters: {
    names?: string[];
    noradIds?: string[];
    operators?: string[];
  }
): TLEData[] {
  return tleData.filter(tle => {
    if (filters.names && filters.names.length > 0) {
      const matchesName = filters.names.some(name => 
        tle.satellite_name.toLowerCase().includes(name.toLowerCase())
      );
      if (!matchesName) return false;
    }

    if (filters.operators && filters.operators.length > 0) {
      const matchesOperator = filters.operators.some(operator => 
        tle.satellite_name.toLowerCase().includes(operator.toLowerCase())
      );
      if (!matchesOperator) return false;
    }

    return true;
  });
}

/**
 * Creates satellite tracking data from TLE
 */
export function createSatelliteTrackingData(
  tle: TLEData,
  groundStations: Array<{ id: string; lat: number; lng: number }>
): SatelliteTrackingData {
  const currentPosition = calculateSatellitePosition(tle);
  const groundTrack = generateGroundTrack(tle);
  
  const visibilityWindows = groundStations.map(station => {
    const windows = calculateVisibilityWindows(tle, station.lat, station.lng);
    return windows.map(window => ({
      station_id: station.id,
      ...window
    }));
  }).flat();

  return {
    satellite_id: tle.satellite_name,
    tle,
    current_position: currentPosition,
    ground_track: groundTrack,
    visibility_windows: visibilityWindows
  };
}

/**
 * Mock TLE data for development/testing
 */
export const MOCK_TLE_DATA: TLEData[] = [
  {
    satellite_name: "INTELSAT 901",
    line1: "1 26038U 00001A   24308.50000000  .00000000  00000-0  00000-0 0  9999",
    line2: "2 26038 000.0000 000.0000 0000000 000.0000 000.0000 01.00270000    09",
    epoch: "2024-11-03T12:00:00.000Z",
    inclination: 0.0,
    raan: 0.0,
    eccentricity: 0.0,
    argument_of_perigee: 0.0,
    mean_anomaly: 0.0,
    mean_motion: 1.00270,
    revolution_number: 9,
    last_updated: new Date().toISOString()
  },
  {
    satellite_name: "SES-1",
    line1: "1 37571U 11013A   24308.50000000  .00000000  00000-0  00000-0 0  9999",
    line2: "2 37571 000.0000 000.0000 0000000 000.0000 000.0000 01.00270000    09",
    epoch: "2024-11-03T12:00:00.000Z",
    inclination: 0.0,
    raan: 0.0,
    eccentricity: 0.0,
    argument_of_perigee: 0.0,
    mean_anomaly: 0.0,
    mean_motion: 1.00270,
    revolution_number: 9,
    last_updated: new Date().toISOString()
  }
];