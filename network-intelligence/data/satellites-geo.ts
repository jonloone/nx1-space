// Properly distributed GEO satellites for network intelligence visualization

export interface GeoSatellite {
  id: string;
  name: string;
  operator: string;
  operator_type: 'SES' | 'Intelsat';
  longitude: number;
  latitude: number; // Always 0 for GEO
  altitude: number; // km above Earth
  coverage_radius: number; // km
  color: [number, number, number];
  capacity_gbps: number;
  utilization: number;
  launched: string;
  services: string[];
}

// Generate properly distributed coverage circles
export function createSatelliteCoverage(satellite: GeoSatellite) {
  const earthRadius = 6371; // km
  const satHeight = satellite.altitude; // km above Earth
  const coverageRadius = satellite.coverage_radius; // km on Earth surface
  
  // Calculate angular radius for coverage area
  const angularRadius = Math.atan(coverageRadius / earthRadius) * (180 / Math.PI);
  
  // Generate circle points
  const points: [number, number][] = [];
  const numPoints = 64;
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lat = satellite.latitude + angularRadius * Math.sin(angle);
    const lng = satellite.longitude + (angularRadius * Math.cos(angle)) / Math.cos(lat * Math.PI / 180);
    
    // Ensure longitude wraps correctly
    const normalizedLng = ((lng + 180) % 360) - 180;
    points.push([normalizedLng, Math.max(-85, Math.min(85, lat))]);
  }
  
  return {
    polygon: points,
    center: [satellite.longitude, satellite.latitude],
    radius: angularRadius
  };
}

// Distributed GEO satellite constellation
export const geoSatellites: GeoSatellite[] = [
  // SES Fleet - Atlantic & Americas
  {
    id: 'ses-1',
    name: 'SES-1',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: -101.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 45,
    utilization: 82,
    launched: '2010-04-24',
    services: ['DTH', 'Enterprise', 'Government']
  },
  {
    id: 'ses-2',
    name: 'SES-2',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: -87.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 50,
    utilization: 78,
    launched: '2011-09-21',
    services: ['DTH', 'Broadcast', 'Enterprise']
  },
  {
    id: 'ses-3',
    name: 'SES-3',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: -103.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 48,
    utilization: 85,
    launched: '2011-07-15',
    services: ['DTH', 'HDTV', 'Government']
  },
  {
    id: 'ses-4',
    name: 'SES-4',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: -22.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 52,
    utilization: 90,
    launched: '2012-02-14',
    services: ['Enterprise', 'Maritime', 'Cellular']
  },
  {
    id: 'ses-5',
    name: 'SES-5',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 5.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 44,
    utilization: 73,
    launched: '2012-07-09',
    services: ['DTH', 'Broadcast', 'Enterprise']
  },
  {
    id: 'ses-6',
    name: 'SES-6',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: -40.5,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 46,
    utilization: 88,
    launched: '2013-06-03',
    services: ['DTH', 'HDTV', 'Enterprise']
  },
  
  // SES Fleet - Europe & Middle East
  {
    id: 'astra-1n',
    name: 'ASTRA 1N',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 19.2,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 40,
    utilization: 95,
    launched: '2011-08-06',
    services: ['DTH', 'HDTV', 'Radio']
  },
  {
    id: 'astra-2e',
    name: 'ASTRA 2E',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 28.2,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 42,
    utilization: 92,
    launched: '2013-09-29',
    services: ['DTH', 'Broadcast', 'Enterprise']
  },
  {
    id: 'astra-2f',
    name: 'ASTRA 2F',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 28.2,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 38,
    utilization: 87,
    launched: '2012-09-28',
    services: ['DTH', 'HDTV', 'Internet']
  },
  
  // SES Fleet - Asia-Pacific
  {
    id: 'ses-7',
    name: 'SES-7',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 108.2,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 49,
    utilization: 81,
    launched: '2009-05-16',
    services: ['DTH', 'Enterprise', 'Government']
  },
  {
    id: 'ses-8',
    name: 'SES-8',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 95.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 47,
    utilization: 89,
    launched: '2013-12-03',
    services: ['DTH', 'Enterprise', 'Maritime']
  },
  {
    id: 'ses-9',
    name: 'SES-9',
    operator: 'SES S.A.',
    operator_type: 'SES',
    longitude: 108.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [0, 170, 255],
    capacity_gbps: 51,
    utilization: 86,
    launched: '2016-03-04',
    services: ['DTH', 'HDTV', 'Enterprise']
  },
  
  // Intelsat Fleet - Americas
  {
    id: 'intelsat-1',
    name: 'Intelsat 1',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -97.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 54,
    utilization: 84,
    launched: '2008-09-24',
    services: ['Enterprise', 'Government', 'Broadcast']
  },
  {
    id: 'intelsat-2',
    name: 'Intelsat 2',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -91.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 52,
    utilization: 79,
    launched: '2007-05-04',
    services: ['Enterprise', 'Cellular', 'Government']
  },
  {
    id: 'intelsat-3',
    name: 'Intelsat 3',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -125.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 48,
    utilization: 77,
    launched: '2020-08-15',
    services: ['Enterprise', 'Maritime', 'Aeronautical']
  },
  {
    id: 'intelsat-4',
    name: 'Intelsat 4',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -45.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 46,
    utilization: 91,
    launched: '2009-11-23',
    services: ['DTH', 'Enterprise', 'Cellular']
  },
  {
    id: 'intelsat-5',
    name: 'Intelsat 5',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -58.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 50,
    utilization: 83,
    launched: '2012-08-19',
    services: ['DTH', 'Broadcast', 'Enterprise']
  },
  
  // Intelsat Fleet - Atlantic & Europe
  {
    id: 'intelsat-6',
    name: 'Intelsat 6',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -34.5,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 55,
    utilization: 88,
    launched: '2017-07-05',
    services: ['Enterprise', 'Government', 'Maritime']
  },
  {
    id: 'intelsat-7',
    name: 'Intelsat 7',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -18.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 53,
    utilization: 75,
    launched: '2017-09-29',
    services: ['Enterprise', 'Cellular', 'Government']
  },
  {
    id: 'intelsat-8',
    name: 'Intelsat 8',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: -10.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 49,
    utilization: 82,
    launched: '2004-06-16',
    services: ['DTH', 'Enterprise', 'Broadcast']
  },
  
  // Intelsat Fleet - Asia-Pacific
  {
    id: 'intelsat-9',
    name: 'Intelsat 9',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: 85.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 47,
    utilization: 86,
    launched: '2007-12-21',
    services: ['Enterprise', 'Government', 'Broadcast']
  },
  {
    id: 'intelsat-10',
    name: 'Intelsat 10',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: 68.5,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 51,
    utilization: 80,
    launched: '2012-08-02',
    services: ['DTH', 'Enterprise', 'Cellular']
  },
  {
    id: 'intelsat-11',
    name: 'Intelsat 11',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: 166.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 45,
    utilization: 74,
    launched: '2012-06-01',
    services: ['Enterprise', 'Government', 'Maritime']
  },
  {
    id: 'intelsat-12',
    name: 'Intelsat 12',
    operator: 'Intelsat S.A.',
    operator_type: 'Intelsat',
    longitude: 180.0,
    latitude: 0,
    altitude: 35786,
    coverage_radius: 8000,
    color: [255, 119, 0],
    capacity_gbps: 43,
    utilization: 78,
    launched: '2011-10-05',
    services: ['Enterprise', 'Maritime', 'Aeronautical']
  }
];

// Calculate network statistics
export function getNetworkStats() {
  const totalSatellites = geoSatellites.length;
  const totalCapacity = geoSatellites.reduce((sum, sat) => sum + sat.capacity_gbps, 0);
  const avgUtilization = geoSatellites.reduce((sum, sat) => sum + sat.utilization, 0) / totalSatellites;
  
  const sesSatellites = geoSatellites.filter(sat => sat.operator_type === 'SES');
  const intelsatSatellites = geoSatellites.filter(sat => sat.operator_type === 'Intelsat');
  
  return {
    totalSatellites,
    totalCapacity,
    avgUtilization: Math.round(avgUtilization),
    sesSatellites: sesSatellites.length,
    intelsatSatellites: intelsatSatellites.length,
    highUtilization: geoSatellites.filter(sat => sat.utilization >= 90).length,
    underutilized: geoSatellites.filter(sat => sat.utilization < 70).length,
    stations: [] // Placeholder for station data
  };
}