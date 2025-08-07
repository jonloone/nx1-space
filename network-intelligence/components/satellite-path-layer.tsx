'use client';

import { PathLayer, ArcLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { Satellite } from './satellite-explorer';

interface SatellitePathLayerProps {
  satellite: Satellite;
  groundStations: any[];
  visible?: boolean;
  showGroundTrack?: boolean;
  showConnections?: boolean;
  showCoverage?: boolean;
}

// Calculate satellite ground track for one orbit
function calculateGroundTrack(satellite: Satellite): Array<[number, number]> {
  const track: Array<[number, number]> = [];
  const numPoints = 100;
  
  if (satellite.orbitType === 'GEO') {
    // GEO satellites stay at fixed position
    const lon = satellite.orbitalPosition || 0;
    // Draw a small circle around the position
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      track.push([
        lon + Math.cos(angle) * 0.5,
        Math.sin(angle) * 0.5
      ]);
    }
  } else if (satellite.orbitType === 'MEO' || satellite.orbitType === 'LEO') {
    // Calculate orbital period
    const earthRadius = 6371; // km
    const altitude = satellite.altitude;
    const semiMajorAxis = earthRadius + altitude;
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / 398600.44); // seconds
    
    // Earth rotation during one orbit
    const earthRotation = (orbitalPeriod / 86400) * 360; // degrees
    
    // Generate ground track
    for (let i = 0; i <= numPoints; i++) {
      const phase = (i / numPoints) * 2 * Math.PI;
      const lat = satellite.inclination * Math.sin(phase);
      const lon = (i / numPoints) * 360 - earthRotation * (i / numPoints);
      
      // Normalize longitude to -180 to 180
      const normalizedLon = ((lon + 180) % 360) - 180;
      
      track.push([normalizedLon, lat]);
    }
  }
  
  return track;
}

// Calculate coverage footprint for a satellite
function calculateCoverageFootprint(satellite: Satellite): Array<[number, number]> {
  const footprint: Array<[number, number]> = [];
  const numPoints = 64;
  
  // Calculate coverage radius based on altitude and minimum elevation angle
  const earthRadius = 6371; // km
  const altitude = satellite.altitude;
  const minElevation = 5; // degrees
  
  // Coverage radius on Earth surface
  const coverageAngle = Math.acos(
    earthRadius / (earthRadius + altitude) * 
    Math.cos(minElevation * Math.PI / 180)
  ) * 180 / Math.PI;
  
  const centerLat = satellite.currentPosition?.[0] || 0;
  const centerLon = satellite.currentPosition?.[1] || 0;
  
  // Generate circular footprint
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lat = centerLat + coverageAngle * Math.sin(angle);
    const lon = centerLon + coverageAngle * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
    
    // Clamp latitude to valid range
    const clampedLat = Math.max(-90, Math.min(90, lat));
    
    footprint.push([lon, clampedLat]);
  }
  
  return footprint;
}

export function createSatellitePathLayers({
  satellite,
  groundStations,
  visible = true,
  showGroundTrack = true,
  showConnections = true,
  showCoverage = false
}: SatellitePathLayerProps) {
  const layers = [];
  
  if (!visible || !satellite) return layers;
  
  // Ground track layer
  if (showGroundTrack) {
    const groundTrack = satellite.groundTrack || calculateGroundTrack(satellite);
    
    layers.push(new PathLayer({
      id: `satellite-track-${satellite.id}`,
      data: [{ path: groundTrack }],
      getPath: d => d.path,
      getColor: satellite.operator === 'SES' ? [0, 150, 255, 200] : [255, 150, 0, 200],
      getWidth: 2,
      widthMinPixels: 2,
      widthMaxPixels: 3,
      capRounded: true,
      jointRounded: true,
      getDashArray: satellite.orbitType === 'GEO' ? [0] : [10, 5], // Dashed for non-GEO
      pickable: true
    }));
  }
  
  // Coverage footprint layer
  if (showCoverage && satellite.currentPosition) {
    const footprint = calculateCoverageFootprint(satellite);
    
    layers.push(new PathLayer({
      id: `satellite-coverage-${satellite.id}`,
      data: [{ path: footprint }],
      getPath: d => d.path,
      getColor: [0, 255, 0, 50],
      getWidth: 1,
      widthMinPixels: 1,
      filled: true,
      getFillColor: [0, 255, 0, 30],
      pickable: false
    }));
  }
  
  // Current satellite position
  if (satellite.currentPosition) {
    layers.push(new ScatterplotLayer({
      id: `satellite-position-${satellite.id}`,
      data: [{
        position: [satellite.currentPosition[1], satellite.currentPosition[0]],
        satellite: satellite
      }],
      getPosition: d => d.position,
      getRadius: satellite.orbitType === 'GEO' ? 50000 : 30000,
      radiusMinPixels: 8,
      radiusMaxPixels: 20,
      getFillColor: satellite.operator === 'SES' ? [0, 150, 255, 255] : [255, 150, 0, 255],
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      pickable: true
    }));
    
    // Satellite label
    layers.push(new TextLayer({
      id: `satellite-label-${satellite.id}`,
      data: [{
        position: [satellite.currentPosition[1], satellite.currentPosition[0]],
        text: satellite.name
      }],
      getPosition: d => d.position,
      getText: d => d.text,
      getSize: 12,
      getColor: [255, 255, 255, 255],
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [0, -15],
      billboard: true,
      pickable: false
    }));
  }
  
  // Active connections to ground stations
  if (showConnections && satellite.visibleStations && satellite.currentPosition) {
    const activeConnections = groundStations
      .filter(gs => satellite.visibleStations.includes(gs.name))
      .map(gs => ({
        source: [...gs.coordinates].reverse(), // [lon, lat]
        target: [satellite.currentPosition![1], satellite.currentPosition![0]],
        station: gs,
        bandwidth: gs.utilization || 50
      }));
    
    if (activeConnections.length > 0) {
      layers.push(new ArcLayer({
        id: `satellite-links-${satellite.id}`,
        data: activeConnections,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: [0, 255, 0, 200],
        getTargetColor: [0, 255, 0, 100],
        getWidth: d => Math.max(1, Math.log(d.bandwidth / 10 + 1) * 2),
        getHeight: satellite.orbitType === 'GEO' ? 0.5 : 0.3,
        pickable: true
      }));
    }
  }
  
  return layers;
}

// Calculate all visible satellites from a ground station
export function calculateVisibleSatellites(
  station: any,
  satellites: Satellite[],
  minElevation: number = 5
): Satellite[] {
  const visible: Satellite[] = [];
  const stationLat = station.coordinates[0];
  const stationLon = station.coordinates[1];
  
  satellites.forEach(satellite => {
    if (!satellite.currentPosition) return;
    
    const satLat = satellite.currentPosition[0];
    const satLon = satellite.currentPosition[1];
    const satAlt = satellite.currentPosition[2];
    
    // Calculate distance and elevation angle
    const latDiff = satLat - stationLat;
    const lonDiff = satLon - stationLon;
    
    // Simplified visibility check
    if (satellite.orbitType === 'GEO') {
      // GEO satellites visible if within ±81 degrees longitude
      if (Math.abs(lonDiff) < 81) {
        visible.push(satellite);
      }
    } else {
      // LEO/MEO visibility based on coverage radius
      const earthRadius = 6371;
      const coverageAngle = Math.acos(
        earthRadius / (earthRadius + satAlt) * 
        Math.cos(minElevation * Math.PI / 180)
      ) * 180 / Math.PI;
      
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
      
      if (distance < coverageAngle) {
        visible.push(satellite);
      }
    }
  });
  
  return visible;
}

// Create constellation visualization for multiple satellites
export function createConstellationLayers(
  satellites: Satellite[],
  groundStations: any[],
  options: {
    showOrbits?: boolean;
    showConnections?: boolean;
    showCoverage?: boolean;
    highlightOperator?: string;
  } = {}
) {
  const layers: any[] = [];
  
  satellites.forEach(satellite => {
    // Filter by operator if specified
    if (options.highlightOperator && satellite.operator !== options.highlightOperator) {
      return;
    }
    
    const satLayers = createSatellitePathLayers({
      satellite,
      groundStations,
      visible: true,
      showGroundTrack: options.showOrbits !== false,
      showConnections: options.showConnections !== false,
      showCoverage: options.showCoverage === true
    });
    
    layers.push(...satLayers);
  });
  
  return layers;
}