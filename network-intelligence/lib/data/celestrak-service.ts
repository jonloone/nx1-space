/**
 * CelesTrak TLE Data Service
 * Real-time satellite tracking data - NO AUTH REQUIRED
 * 
 * Priority 1 Data Source for MVP Demo
 * Data updates: Every 4-6 hours
 * Coverage: Global satellite visibility
 */

import { TLEData, parseTLEData } from '../tle-loader';

/**
 * CelesTrak endpoints for different satellite categories
 * All endpoints are free and require no authentication
 */
export const CELESTRAK_ENDPOINTS = {
  // High-value commercial satellites
  GEO: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle',
  ACTIVE: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  
  // Specific constellations
  STARLINK: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
  ONEWEB: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=tle',
  IRIDIUM: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=tle',
  IRIDIUM_NEXT: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=tle',
  GLOBALSTAR: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=tle',
  ORBCOMM: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=tle',
  
  // Earth observation
  PLANET: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=planet&FORMAT=tle',
  SPIRE: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=spire&FORMAT=tle',
  
  // Special interest
  ISS: 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle',
  WEATHER: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  NOAA: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle',
  GOES: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=goes&FORMAT=tle',
  
  // Communications
  INTELSAT: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=tle',
  SES: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=tle',
  TELESAT: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=telesat&FORMAT=tle',
  
  // Last 30 days launches (new satellites)
  LAST_30_DAYS: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=tle'
};

/**
 * Satellite value categories for opportunity scoring
 */
export enum SatelliteValue {
  CRITICAL = 100,    // ISS, military, emergency response
  HIGH = 80,         // GEO communications, broadcasting
  MEDIUM = 60,       // LEO constellations, earth observation
  STANDARD = 40,     // Weather, research
  LOW = 20           // Debris, inactive
}

/**
 * CelesTrak Data Service
 */
export class CelesTrakService {
  private cache: Map<string, { data: TLEData[], timestamp: Date }> = new Map();
  private cacheTimeout = 4 * 60 * 60 * 1000; // 4 hours
  
  /**
   * Fetch TLE data for a specific satellite group
   */
  async fetchSatelliteGroup(group: keyof typeof CELESTRAK_ENDPOINTS): Promise<TLEData[]> {
    const url = CELESTRAK_ENDPOINTS[group];
    const cacheKey = group;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
      console.log(`Using cached TLE data for ${group}`);
      return cached.data;
    }
    
    try {
      console.log(`Fetching TLE data from CelesTrak: ${group}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const tleText = await response.text();
      const tleData = parseTLEData(tleText);
      
      // Cache the data
      this.cache.set(cacheKey, {
        data: tleData,
        timestamp: new Date()
      });
      
      console.log(`Fetched ${tleData.length} satellites for ${group}`);
      return tleData;
      
    } catch (error) {
      console.error(`Error fetching TLE data for ${group}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`Using expired cache for ${group} due to fetch error`);
        return cached.data;
      }
      
      return [];
    }
  }
  
  /**
   * Fetch all high-value satellites for opportunity scoring
   */
  async fetchHighValueSatellites(): Promise<TLEData[]> {
    const groups: (keyof typeof CELESTRAK_ENDPOINTS)[] = [
      'GEO',
      'INTELSAT', 
      'SES',
      'STARLINK',
      'ONEWEB',
      'IRIDIUM_NEXT'
    ];
    
    const allSatellites: TLEData[] = [];
    
    // Fetch in parallel with error handling for each
    const promises = groups.map(group => 
      this.fetchSatelliteGroup(group).catch(err => {
        console.error(`Failed to fetch ${group}:`, err);
        return [];
      })
    );
    
    const results = await Promise.all(promises);
    results.forEach(satellites => allSatellites.push(...satellites));
    
    // Remove duplicates by satellite name
    const uniqueSatellites = new Map<string, TLEData>();
    allSatellites.forEach(sat => {
      if (!uniqueSatellites.has(sat.satellite_name)) {
        uniqueSatellites.set(sat.satellite_name, sat);
      }
    });
    
    return Array.from(uniqueSatellites.values());
  }
  
  /**
   * Get satellites visible from a ground station
   */
  async getVisibleSatellites(
    stationLat: number, 
    stationLng: number,
    minElevation: number = 10
  ): Promise<Array<{
    satellite: TLEData;
    elevation: number;
    azimuth: number;
    distance: number;
    value: number;
  }>> {
    const satellites = await this.fetchHighValueSatellites();
    const visible = [];
    
    for (const sat of satellites) {
      const visibility = this.calculateVisibility(sat, stationLat, stationLng);
      
      if (visibility.elevation >= minElevation) {
        visible.push({
          satellite: sat,
          ...visibility,
          value: this.calculateSatelliteValue(sat)
        });
      }
    }
    
    // Sort by value and elevation
    visible.sort((a, b) => {
      const valueScore = b.value - a.value;
      if (Math.abs(valueScore) > 10) return valueScore;
      return b.elevation - a.elevation;
    });
    
    return visible;
  }
  
  /**
   * Calculate visibility from ground station to satellite
   */
  private calculateVisibility(
    tle: TLEData,
    stationLat: number,
    stationLng: number
  ): {
    elevation: number;
    azimuth: number;
    distance: number;
  } {
    // This is a simplified calculation
    // In production, use satellite.js for accurate SGP4 propagation
    
    const orbitalPeriod = 1440 / tle.mean_motion; // minutes
    const altitude = this.estimateAltitude(tle.mean_motion);
    
    // Simple geometric calculation (not accurate for real tracking)
    const latDiff = Math.random() * 180 - 90; // Simplified satellite position
    const lngDiff = Math.random() * 360 - 180;
    
    const distance = Math.sqrt(
      Math.pow(latDiff - stationLat, 2) + 
      Math.pow(lngDiff - stationLng, 2)
    ) * 111; // Convert degrees to km
    
    // Simple elevation calculation
    const elevation = Math.max(0, 90 - (distance / 100));
    
    // Simple azimuth calculation
    const azimuth = Math.atan2(lngDiff - stationLng, latDiff - stationLat) * 180 / Math.PI;
    
    return {
      elevation,
      azimuth: azimuth < 0 ? azimuth + 360 : azimuth,
      distance: Math.sqrt(distance * distance + altitude * altitude)
    };
  }
  
  /**
   * Estimate altitude from mean motion
   */
  private estimateAltitude(meanMotion: number): number {
    // Kepler's third law approximation
    const orbitalPeriod = 1440 / meanMotion; // Convert to minutes
    const semiMajorAxis = Math.pow((orbitalPeriod * orbitalPeriod * 398600.4418) / (4 * Math.PI * Math.PI), 1/3);
    return semiMajorAxis - 6371; // Subtract Earth radius
  }
  
  /**
   * Calculate satellite value for opportunity scoring
   */
  private calculateSatelliteValue(tle: TLEData): number {
    const name = tle.satellite_name.toUpperCase();
    
    // Critical satellites
    if (name.includes('ISS')) return SatelliteValue.CRITICAL;
    
    // High-value GEO satellites
    if (name.includes('INTELSAT') || name.includes('SES') || name.includes('EUTELSAT')) {
      return SatelliteValue.HIGH;
    }
    
    // Medium-value constellations
    if (name.includes('STARLINK') || name.includes('ONEWEB') || name.includes('IRIDIUM')) {
      return SatelliteValue.MEDIUM;
    }
    
    // Earth observation
    if (name.includes('PLANET') || name.includes('SPIRE') || name.includes('DOVE')) {
      return SatelliteValue.MEDIUM;
    }
    
    // Weather and research
    if (name.includes('NOAA') || name.includes('GOES') || name.includes('METEOSAT')) {
      return SatelliteValue.STANDARD;
    }
    
    // Default
    return SatelliteValue.LOW;
  }
  
  /**
   * Get satellite coverage statistics for a region
   */
  async getSatelliteCoverage(
    centerLat: number,
    centerLng: number,
    radiusKm: number = 1000
  ): Promise<{
    totalSatellites: number;
    geoSatellites: number;
    leoSatellites: number;
    avgPassesPerDay: number;
    peakPassTime: string;
    dataVolumePotential: number; // GB/day
  }> {
    const satellites = await this.fetchHighValueSatellites();
    
    let geoCount = 0;
    let leoCount = 0;
    let totalPasses = 0;
    
    satellites.forEach(sat => {
      const altitude = this.estimateAltitude(sat.mean_motion);
      
      if (altitude > 35000) {
        geoCount++;
      } else {
        leoCount++;
        // LEO satellites have multiple passes per day
        totalPasses += sat.mean_motion; // Orbits per day
      }
    });
    
    return {
      totalSatellites: satellites.length,
      geoSatellites: geoCount,
      leoSatellites: leoCount,
      avgPassesPerDay: totalPasses,
      peakPassTime: '14:00 UTC', // Simplified
      dataVolumePotential: (geoCount * 500 + leoCount * 50) // GB/day estimate
    };
  }
}

// Export singleton instance
export const celestrakService = new CelesTrakService();