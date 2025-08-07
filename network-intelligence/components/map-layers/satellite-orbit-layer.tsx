'use client';

import React from 'react';
import { LineLayer, ScatterplotLayer } from '@deck.gl/layers';

interface SatelliteOrbitLayerProps {
  visible: boolean;
  animationTime?: number;
}

interface SatelliteData {
  id: string;
  name: string;
  position: [number, number, number]; // [lng, lat, altitude_km]
  orbitPath: [number, number, number][]; // Orbit positions
  type: 'GEO' | 'MEO' | 'LEO';
  operator: string;
}

// Generate sample satellite data
const generateSatelliteData = (animationTime: number = 0): SatelliteData[] => {
  const satellites: SatelliteData[] = [];
  
  // GEO satellites (geostationary)
  const geoSatellites = [
    { name: 'SES-1', longitude: 19.2, operator: 'SES' },
    { name: 'SES-4', longitude: 22.0, operator: 'SES' },
    { name: 'Intelsat 901', longitude: 27.5, operator: 'Intelsat' },
    { name: 'Intelsat 907', longitude: 332.5, operator: 'Intelsat' },
    { name: 'SES-9', longitude: 108.2, operator: 'SES' },
    { name: 'Intelsat 19', longitude: 166.0, operator: 'Intelsat' },
  ];
  
  geoSatellites.forEach((sat, index) => {
    const altitude = 35786; // GEO altitude in km
    
    satellites.push({
      id: `geo-${index}`,
      name: sat.name,
      position: [sat.longitude, 0, altitude],
      orbitPath: generateGEOOrbit(sat.longitude),
      type: 'GEO',
      operator: sat.operator
    });
  });
  
  // MEO satellites (O3b constellation example)
  const meoCount = 12;
  for (let i = 0; i < meoCount; i++) {
    const inclination = 0; // Equatorial orbit
    const altitude = 8063; // O3b altitude
    const longitudeShift = (360 / meoCount) * i;
    const timeOffset = animationTime + (i * 30); // Stagger satellites
    
    const position = calculateOrbitPosition(
      altitude,
      inclination,
      longitudeShift,
      timeOffset
    );
    
    satellites.push({
      id: `meo-${i}`,
      name: `O3b-${i + 1}`,
      position: [position.longitude, position.latitude, altitude],
      orbitPath: generateMEOOrbit(inclination, longitudeShift),
      type: 'MEO',
      operator: 'SES'
    });
  }
  
  // LEO satellites (example constellation)
  const leoCount = 8;
  for (let i = 0; i < leoCount; i++) {
    const inclination = 53; // Typical LEO inclination
    const altitude = 550; // Starlink-like altitude
    const longitudeShift = (360 / leoCount) * i;
    const timeOffset = animationTime * 2 + (i * 45); // Faster orbit
    
    const position = calculateOrbitPosition(
      altitude,
      inclination,
      longitudeShift,
      timeOffset
    );
    
    satellites.push({
      id: `leo-${i}`,
      name: `LEO-${i + 1}`,
      position: [position.longitude, position.latitude, altitude],
      orbitPath: generateLEOOrbit(inclination, longitudeShift),
      type: 'LEO',
      operator: 'Other'
    });
  }
  
  return satellites;
};

// Calculate satellite position based on orbital parameters
const calculateOrbitPosition = (
  altitude: number,
  inclination: number,
  longitudeShift: number,
  timeOffset: number
): { longitude: number; latitude: number } => {
  // Simplified orbital mechanics
  const period = Math.sqrt(Math.pow(6371 + altitude, 3) / 398600.4418) * 2 * Math.PI; // Orbital period in seconds
  const meanMotion = (2 * Math.PI) / period; // Radians per second
  const meanAnomaly = (meanMotion * timeOffset / 60) % (2 * Math.PI); // Convert time to radians
  
  // For simplified calculation, assume circular orbit
  const trueAnomaly = meanAnomaly;
  
  // Calculate position
  const longitude = ((longitudeShift + (trueAnomaly * 180 / Math.PI)) % 360 + 360) % 360;
  const adjustedLongitude = longitude > 180 ? longitude - 360 : longitude;
  
  const latitude = Math.sin(inclination * Math.PI / 180) * 
                   Math.sin(trueAnomaly) * 180 / Math.PI;
  
  return { longitude: adjustedLongitude, latitude };
};

// Generate GEO orbit path (appears stationary)
const generateGEOOrbit = (longitude: number): [number, number, number][] => {
  const path: [number, number, number][] = [];
  const altitude = 35786;
  
  // GEO satellites stay at the same longitude, just show a small circle for visualization
  for (let i = 0; i <= 360; i += 10) {
    const lat = Math.sin(i * Math.PI / 180) * 0.1; // Small oscillation for visibility
    path.push([longitude, lat, altitude]);
  }
  
  return path;
};

// Generate MEO orbit path
const generateMEOOrbit = (inclination: number, longitudeShift: number): [number, number, number][] => {
  const path: [number, number, number][] = [];
  const altitude = 8063;
  
  for (let i = 0; i <= 360; i += 5) {
    const trueAnomaly = i * Math.PI / 180;
    const longitude = ((longitudeShift + i) % 360 + 360) % 360;
    const adjustedLongitude = longitude > 180 ? longitude - 360 : longitude;
    const latitude = Math.sin(inclination * Math.PI / 180) * Math.sin(trueAnomaly) * 180 / Math.PI;
    
    path.push([adjustedLongitude, latitude, altitude]);
  }
  
  return path;
};

// Generate LEO orbit path
const generateLEOOrbit = (inclination: number, longitudeShift: number): [number, number, number][] => {
  const path: [number, number, number][] = [];
  const altitude = 550;
  
  for (let i = 0; i <= 360; i += 3) {
    const trueAnomaly = i * Math.PI / 180;
    const longitude = ((longitudeShift + i * 2) % 360 + 360) % 360; // LEO satellites move faster
    const adjustedLongitude = longitude > 180 ? longitude - 360 : longitude;
    const latitude = Math.sin(inclination * Math.PI / 180) * Math.sin(trueAnomaly) * 180 / Math.PI;
    
    path.push([adjustedLongitude, latitude, altitude]);
  }
  
  return path;
};

export function SatelliteOrbitLayer({ visible, animationTime = 0 }: SatelliteOrbitLayerProps) {
  if (!visible) return null;
  
  const satellites = generateSatelliteData(animationTime);
  
  // Create orbit path lines
  const orbitPaths = satellites.map(sat => ({
    path: sat.orbitPath,
    color: getSatelliteColor(sat.type, sat.operator),
    type: sat.type
  }));
  
  return [
    // Orbit paths
    new LineLayer({
      id: 'satellite-orbits',
      data: orbitPaths,
      getSourcePosition: (d: any) => d.path[0],
      getTargetPosition: (d: any) => d.path[d.path.length - 1],
      getColor: (d: any) => d.color,
      getWidth: 2,
      widthMinPixels: 1,
      widthMaxPixels: 3,
      pickable: false
    }),
    
    // Satellite positions
    new ScatterplotLayer({
      id: 'satellites',
      data: satellites,
      getPosition: (d: SatelliteData) => d.position,
      getRadius: (d: SatelliteData) => {
        switch (d.type) {
          case 'GEO': return 50000; // Larger for GEO
          case 'MEO': return 30000;
          case 'LEO': return 20000;
          default: return 25000;
        }
      },
      getFillColor: (d: SatelliteData) => getSatelliteColor(d.type, d.operator),
      getLineColor: [255, 255, 255],
      getLineWidth: 2,
      stroked: true,
      filled: true,
      radiusMinPixels: 3,
      radiusMaxPixels: 8,
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          console.log('Satellite clicked:', info.object);
        }
      },
      updateTriggers: {
        getPosition: [animationTime],
        getFillColor: [satellites]
      }
    })
  ];
}

// Get color based on satellite type and operator
const getSatelliteColor = (type: string, operator: string): [number, number, number, number] => {
  if (type === 'GEO') {
    return operator === 'SES' ? [59, 130, 246, 200] : [168, 85, 247, 200]; // Blue for SES, Purple for Intelsat
  } else if (type === 'MEO') {
    return [34, 197, 94, 200]; // Green for MEO
  } else if (type === 'LEO') {
    return [251, 191, 36, 200]; // Yellow for LEO
  }
  return [156, 163, 175, 200]; // Default gray
};

// Helper function to create satellite orbit layers
export function createSatelliteOrbitLayers(visible: boolean = true, animationTime: number = 0) {
  if (!visible) return [];
  
  const satellites = generateSatelliteData(animationTime);
  
  // Flatten orbit paths for LineLayer
  const orbitSegments: any[] = [];
  satellites.forEach((sat, satIndex) => {
    for (let i = 0; i < sat.orbitPath.length - 1; i++) {
      orbitSegments.push({
        sourcePosition: sat.orbitPath[i],
        targetPosition: sat.orbitPath[i + 1],
        color: getSatelliteColor(sat.type, sat.operator),
        type: sat.type,
        satelliteId: sat.id
      });
    }
  });
  
  return [
    // Orbit paths
    new LineLayer({
      id: 'satellite-orbit-paths',
      data: orbitSegments,
      getSourcePosition: (d: any) => d.sourcePosition,
      getTargetPosition: (d: any) => d.targetPosition,
      getColor: (d: any) => d.color,
      getWidth: 2,
      widthMinPixels: 1,
      widthMaxPixels: 3,
      pickable: false,
      visible
    }),
    
    // Satellite positions  
    new ScatterplotLayer({
      id: 'satellite-positions',
      data: satellites,
      getPosition: (d: SatelliteData) => d.position,
      getRadius: (d: SatelliteData) => {
        switch (d.type) {
          case 'GEO': return 100000;
          case 'MEO': return 60000;
          case 'LEO': return 40000;
          default: return 50000;
        }
      },
      getFillColor: (d: SatelliteData) => getSatelliteColor(d.type, d.operator),
      getLineColor: [255, 255, 255],
      getLineWidth: 3,
      stroked: true,
      filled: true,
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
      visible,
      onClick: (info: any) => {
        if (info.object) {
          console.log('Satellite clicked:', info.object);
        }
      },
      updateTriggers: {
        getPosition: [animationTime],
        getFillColor: [satellites],
        visible: [visible]
      }
    })
  ];
}