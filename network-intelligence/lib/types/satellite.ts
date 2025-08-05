export interface Satellite {
  id: string;
  name: string;
  operator: string;
  orbit_class: string;
  purpose: string;
  launch_date: string;
  longitude: number;
  apogee: number | null;
  perigee: number | null;
  inclination: number;
  is_geo: boolean;
  altitude: number;
  operator_type: 'SES' | 'Intelsat';
  color: [number, number, number];
}

export interface SatelliteData {
  type: string;
  version: string;
  satellites: Satellite[];
  count: number;
}

export interface SatellitePosition {
  longitude: number;
  latitude: number;
  altitude: number;
}

export interface CoverageFootprint {
  center: [number, number];
  radius: number;
  polygon: [number, number][];
}

export interface SatelliteVisualizationOptions {
  showPositions: boolean;
  showCoverage: boolean;
  showLabels: boolean;
  selectedOperators: string[];
  coverageOpacity: number;
}

export interface MissionPlanningData {
  selectedSatellites: string[];
  combinedCoverage: CoverageFootprint[];
  coveragePercentage: number;
  redundancy: number;
}

export interface OperatorConfig {
  name: string;
  color: [number, number, number];
  satellites: Satellite[];
  count: number;
  selected: boolean;
}