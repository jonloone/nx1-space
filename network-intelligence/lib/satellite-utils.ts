import { Satellite, SatellitePosition, CoverageFootprint, OperatorConfig } from './types/satellite';

/**
 * Calculate the 3D position of a GEO satellite based on its longitude
 */
export function calculateSatellitePosition(satellite: Satellite): SatellitePosition {
  return {
    longitude: satellite.longitude,
    latitude: 0, // GEO satellites are at equator
    altitude: satellite.altitude
  };
}

/**
 * Calculate coverage footprint for a GEO satellite
 * GEO satellites at 35,786 km have approximately 18-degree half-angle coverage
 */
export function calculateCoverageFootprint(satellite: Satellite): CoverageFootprint {
  const position = calculateSatellitePosition(satellite);
  const earthRadius = 6371; // Earth radius in km
  const satelliteAltitude = satellite.altitude;
  
  // Calculate coverage angle (half-angle from satellite to edge of coverage)
  // For GEO satellites, this is typically around 8.5-9 degrees for useful coverage
  const coverageHalfAngle = 8.5; // degrees
  
  // Convert to radians
  const angleRad = (coverageHalfAngle * Math.PI) / 180;
  
  // Calculate ground coverage radius
  const groundRadius = earthRadius * Math.tan(angleRad);
  
  // Convert to degrees for coverage circle
  const radiusDegrees = (groundRadius / earthRadius) * (180 / Math.PI);
  
  // Generate coverage polygon (circle approximation)
  const polygon: [number, number][] = [];
  const numPoints = 64;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lat = Math.sin(angle) * radiusDegrees;
    const lng = position.longitude + (Math.cos(angle) * radiusDegrees / Math.cos(lat * Math.PI / 180));
    
    // Clamp latitude to valid range
    const clampedLat = Math.max(-85, Math.min(85, lat));
    polygon.push([lng, clampedLat]);
  }
  
  return {
    center: [position.longitude, position.latitude],
    radius: radiusDegrees,
    polygon
  };
}

/**
 * Group satellites by operator
 */
export function groupSatellitesByOperator(satellites: Satellite[]): OperatorConfig[] {
  const operators = new Map<string, Satellite[]>();
  
  satellites.forEach(satellite => {
    const operatorType = satellite.operator_type;
    if (!operators.has(operatorType)) {
      operators.set(operatorType, []);
    }
    operators.get(operatorType)!.push(satellite);
  });
  
  return Array.from(operators.entries()).map(([name, sats]) => ({
    name,
    color: sats[0].color as [number, number, number],
    satellites: sats,
    count: sats.length,
    selected: true
  }));
}

/**
 * Calculate combined coverage area for multiple satellites
 */
export function calculateCombinedCoverage(satellites: Satellite[]): CoverageFootprint[] {
  return satellites.map(satellite => calculateCoverageFootprint(satellite));
}

/**
 * Calculate coverage statistics for mission planning
 */
export function calculateCoverageStats(satellites: Satellite[]) {
  const footprints = calculateCombinedCoverage(satellites);
  
  // Simple approximation of global coverage percentage
  // Each GEO satellite covers roughly 42% of Earth's surface
  const singleSatCoverage = 0.42;
  const totalSatellites = satellites.length;
  
  // Account for overlap (rough approximation)
  let combinedCoverage = 1 - Math.pow(1 - singleSatCoverage, totalSatellites);
  combinedCoverage = Math.min(combinedCoverage, 1); // Cap at 100%
  
  // Calculate redundancy (average number of satellites covering any point)
  const redundancy = totalSatellites * singleSatCoverage;
  
  return {
    coveragePercentage: Math.round(combinedCoverage * 100),
    redundancy: Math.round(redundancy * 10) / 10,
    satelliteCount: totalSatellites,
    footprints
  };
}

/**
 * Filter satellites by operator selection
 */
export function filterSatellitesByOperators(
  satellites: Satellite[], 
  selectedOperators: string[]
): Satellite[] {
  return satellites.filter(satellite => 
    selectedOperators.includes(satellite.operator_type)
  );
}

/**
 * Get satellite by ID
 */
export function getSatelliteById(satellites: Satellite[], id: string): Satellite | undefined {
  return satellites.find(satellite => satellite.id === id);
}

/**
 * Format satellite information for display
 */
export function formatSatelliteInfo(satellite: Satellite) {
  return {
    name: satellite.name !== 'Unknown' ? satellite.name : `${satellite.operator_type} Satellite`,
    operator: satellite.operator,
    position: `${satellite.longitude.toFixed(1)}°${satellite.longitude >= 0 ? 'E' : 'W'}`,
    launchDate: satellite.launch_date,
    altitude: `${satellite.altitude.toLocaleString()} km`,
    inclination: `${satellite.inclination.toFixed(2)}°`
  };
}

/**
 * Convert longitude to display format
 */
export function formatLongitude(longitude: number): string {
  const abs = Math.abs(longitude);
  const direction = longitude >= 0 ? 'E' : 'W';
  return `${abs.toFixed(1)}°${direction}`;
}

/**
 * Sort satellites by longitude for better organization
 */
export function sortSatellitesByLongitude(satellites: Satellite[]): Satellite[] {
  return [...satellites].sort((a, b) => a.longitude - b.longitude);
}