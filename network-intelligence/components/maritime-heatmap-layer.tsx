'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { 
  HeatmapLayer, 
  TripsLayer, 
  PathLayer, 
  PolygonLayer,
  ScatterplotLayer,
  Layer
} from 'deck.gl';
import { interpolateColors } from '@math.gl/core';

// TypeScript interfaces for data structures
export interface VesselPosition {
  id: string;
  coordinates: [number, number];
  timestamp: number;
  vesselType: 'cruise' | 'container' | 'tanker' | 'bulk' | 'general';
  value: number; // Revenue/strategic value
  speed: number; // knots
  heading: number; // degrees
}

export interface VesselTrip {
  id: string;
  path: Array<[number, number, number]>; // [lon, lat, timestamp]
  vesselType: 'cruise' | 'container' | 'tanker' | 'bulk' | 'general';
  value: number;
  timestamps: number[];
}

export interface ShippingLane {
  id: string;
  path: Array<[number, number]>;
  traffic_density: number;
  importance: 'major' | 'secondary' | 'regional';
  region: string;
}

export interface GroundStationCoverage {
  id: string;
  name: string;
  operator: 'SES' | 'competitor';
  coordinates: [number, number];
  coverage_polygon: Array<[number, number]>;
  elevation_angle: number;
  power_dbw: number;
  frequency_bands: string[];
}

export interface OpportunityMarker {
  id: string;
  coordinates: [number, number];
  opportunity_score: number;
  vessel_count_24h: number;
  revenue_potential: number;
  competition_level: 'low' | 'medium' | 'high';
}

// Vessel type color mapping
const VESSEL_COLORS = {
  cruise: [255, 215, 0], // Gold
  container: [0, 100, 200], // Blue
  tanker: [255, 140, 0], // Orange
  bulk: [128, 0, 128], // Purple
  general: [128, 128, 128] // Gray
} as const;

// Ground station operator colors
const OPERATOR_COLORS = {
  SES: [0, 255, 0, 80], // Green with transparency
  competitor: [255, 0, 0, 80] // Red with transparency
} as const;

// Animation constants
const ANIMATION_SPEED = 1; // Speed multiplier for 24-hour cycle
const TRAIL_LENGTH = 1800; // 30 minutes in seconds
const LOOP_LENGTH = 86400; // 24 hours in seconds

interface MaritimeHeatmapLayerProps {
  vesselPositions: VesselPosition[];
  vesselTrips: VesselTrip[];
  shippingLanes: ShippingLane[];
  groundStationCoverages: GroundStationCoverage[];
  opportunityMarkers: OpportunityMarker[];
  currentTime?: number; // Unix timestamp
  animationEnabled?: boolean;
  heatmapIntensity?: number;
  showShippingLanes?: boolean;
  showCoverageAreas?: boolean;
  showOpportunityMarkers?: boolean;
  onVesselClick?: (vessel: VesselPosition) => void;
  onOpportunityClick?: (opportunity: OpportunityMarker) => void;
}

export const MaritimeHeatmapLayers: React.FC<MaritimeHeatmapLayerProps> = ({
  vesselPositions,
  vesselTrips,
  shippingLanes,
  groundStationCoverages,
  opportunityMarkers,
  currentTime,
  animationEnabled = true,
  heatmapIntensity = 1.0,
  showShippingLanes = true,
  showCoverageAreas = true,
  showOpportunityMarkers = true,
  onVesselClick,
  onOpportunityClick
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);

  // Time-based animation loop
  useEffect(() => {
    if (!animationEnabled) return;

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) * ANIMATION_SPEED;
      const frame = (elapsed / 1000) % LOOP_LENGTH;
      setAnimationFrame(frame);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animationEnabled]);

  // Dynamic weight calculation based on time of day
  const calculateTimeWeight = useCallback((hour: number): number => {
    // Peak maritime activity: 6 AM - 6 PM UTC (commercial hours)
    // Lower activity: 6 PM - 6 AM UTC (night hours)
    if (hour >= 6 && hour <= 18) {
      return 1.0; // Peak activity
    } else {
      return 0.4; // Reduced activity
    }
  }, []);

  // Process vessel positions for heatmap with time-based weighting
  const heatmapData = useMemo(() => {
    const currentHour = new Date(currentTime || Date.now()).getUTCHours();
    const timeWeight = calculateTimeWeight(currentHour);

    return vesselPositions.map(vessel => ({
      coordinates: vessel.coordinates,
      weight: vessel.value * timeWeight * heatmapIntensity
    }));
  }, [vesselPositions, currentTime, heatmapIntensity, calculateTimeWeight]);

  // Filter and process vessel trips for animation
  const animatedTrips = useMemo(() => {
    if (!animationEnabled) return vesselTrips;

    const currentTimestamp = (currentTime || Date.now()) / 1000;
    
    return vesselTrips.map(trip => {
      // Calculate animation progress
      const tripStartTime = Math.min(...trip.timestamps);
      const tripDuration = Math.max(...trip.timestamps) - tripStartTime;
      const animationTime = ((currentTimestamp + animationFrame) % LOOP_LENGTH);
      
      // Normalize animation time to trip duration
      const progress = (animationTime % tripDuration) / tripDuration;
      const currentIndex = Math.floor(progress * trip.path.length);
      
      // Create animated path up to current position
      const animatedPath = trip.path.slice(0, Math.max(1, currentIndex + 1));
      
      return {
        ...trip,
        path: animatedPath
      };
    });
  }, [vesselTrips, currentTime, animationFrame, animationEnabled]);

  // Heatmap Layer
  const heatmapLayer = useMemo(() => new HeatmapLayer({
    id: 'maritime-vessel-heatmap',
    data: heatmapData,
    getPosition: d => d.coordinates,
    getWeight: d => d.weight,
    radiusPixels: 50,
    intensity: 2,
    threshold: 0.05,
    colorRange: [
      [0, 0, 0, 0],
      [0, 0, 255, 100],
      [0, 255, 255, 150],
      [0, 255, 0, 200],
      [255, 255, 0, 255],
      [255, 0, 0, 255]
    ],
    updateTriggers: {
      getWeight: [currentTime, heatmapIntensity]
    }
  }), [heatmapData, currentTime, heatmapIntensity]);

  // Vessel Trips Layer (Animated)
  const tripsLayer = useMemo(() => new TripsLayer({
    id: 'vessel-trips-animated',
    data: animatedTrips,
    getPath: d => d.path,
    getTimestamps: d => d.timestamps || d.path.map((_, i) => i),
    getColor: d => {
      const baseColor = VESSEL_COLORS[d.vesselType] || VESSEL_COLORS.general;
      return [...baseColor, 180];
    },
    widthMinPixels: 2,
    widthMaxPixels: 8,
    trailLength: TRAIL_LENGTH,
    currentTime: animationFrame,
    shadowEnabled: false,
    updateTriggers: {
      getPath: [animationFrame],
      getTimestamps: [animationFrame],
      currentTime: [animationFrame]
    }
  }), [animatedTrips, animationFrame]);

  // Shipping Lanes Layer
  const shippingLanesLayer = useMemo(() => showShippingLanes ? new PathLayer({
    id: 'shipping-lanes',
    data: shippingLanes,
    getPath: d => d.path,
    getColor: d => {
      switch (d.importance) {
        case 'major': return [255, 255, 0, 200]; // Bright yellow
        case 'secondary': return [255, 165, 0, 150]; // Orange
        case 'regional': return [255, 255, 255, 100]; // White
        default: return [128, 128, 128, 80]; // Gray
      }
    },
    getWidth: d => {
      switch (d.importance) {
        case 'major': return 8;
        case 'secondary': return 5;
        case 'regional': return 3;
        default: return 2;
      }
    },
    widthScale: 1,
    widthMinPixels: 1,
    widthMaxPixels: 10,
    dashJustified: true,
    getDashArray: [3, 2]
  }) : null, [shippingLanes, showShippingLanes]);

  // Ground Station Coverage Areas Layer
  const coverageAreasLayer = useMemo(() => showCoverageAreas ? new PolygonLayer({
    id: 'ground-station-coverage',
    data: groundStationCoverages,
    getPolygon: d => d.coverage_polygon,
    getFillColor: d => OPERATOR_COLORS[d.operator],
    getLineColor: d => {
      const baseColor = OPERATOR_COLORS[d.operator];
      return [baseColor[0], baseColor[1], baseColor[2], 255];
    },
    getLineWidth: 2,
    lineWidthMinPixels: 1,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false
  }) : null, [groundStationCoverages, showCoverageAreas]);

  // Ground Station Points Layer
  const groundStationsLayer = useMemo(() => showCoverageAreas ? new ScatterplotLayer({
    id: 'ground-stations',
    data: groundStationCoverages,
    getPosition: d => d.coordinates,
    getRadius: 5000, // 5km radius
    getFillColor: d => {
      const baseColor = OPERATOR_COLORS[d.operator];
      return [baseColor[0], baseColor[1], baseColor[2], 255];
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 8,
    radiusMaxPixels: 20,
    pickable: true
  }) : null, [groundStationCoverages, showCoverageAreas]);

  // Opportunity Markers Layer
  const opportunityMarkersLayer = useMemo(() => showOpportunityMarkers ? new ScatterplotLayer({
    id: 'opportunity-markers',
    data: opportunityMarkers,
    getPosition: d => d.coordinates,
    getRadius: d => Math.sqrt(d.opportunity_score) * 2000, // Scale by opportunity score
    getFillColor: d => {
      // Color by competition level
      switch (d.competition_level) {
        case 'low': return [0, 255, 0, 200]; // Green - high opportunity
        case 'medium': return [255, 255, 0, 200]; // Yellow - moderate opportunity
        case 'high': return [255, 100, 0, 200]; // Orange - low opportunity
        default: return [128, 128, 128, 200]; // Gray
      }
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 6,
    radiusMaxPixels: 30,
    pickable: true,
    onClick: (info) => {
      if (info.object && onOpportunityClick) {
        onOpportunityClick(info.object);
      }
    }
  }) : null, [opportunityMarkers, showOpportunityMarkers, onOpportunityClick]);

  // Vessel Points Layer (for individual vessel visualization)
  const vesselPointsLayer = useMemo(() => new ScatterplotLayer({
    id: 'vessel-points',
    data: vesselPositions,
    getPosition: d => d.coordinates,
    getRadius: d => Math.log(d.value + 1) * 500, // Scale by vessel value
    getFillColor: d => {
      const baseColor = VESSEL_COLORS[d.vesselType] || VESSEL_COLORS.general;
      return [...baseColor, 200];
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 1,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 3,
    radiusMaxPixels: 12,
    pickable: true,
    onClick: (info) => {
      if (info.object && onVesselClick) {
        onVesselClick(info.object);
      }
    }
  }), [vesselPositions, onVesselClick]);

  // Return all layers as an array
  const layers: Layer[] = [
    heatmapLayer,
    ...(shippingLanesLayer ? [shippingLanesLayer] : []),
    ...(coverageAreasLayer ? [coverageAreasLayer] : []),
    ...(groundStationsLayer ? [groundStationsLayer] : []),
    tripsLayer,
    vesselPointsLayer,
    ...(opportunityMarkersLayer ? [opportunityMarkersLayer] : [])
  ];

  return layers;
};

// Hook for generating sample maritime data (for testing/demo purposes)
export const useSampleMaritimeData = () => {
  return useMemo(() => {
    // Sample vessel positions
    const vesselPositions: VesselPosition[] = [
      // North Atlantic shipping lanes
      { id: 'v1', coordinates: [-40.0, 50.0], timestamp: Date.now(), vesselType: 'container', value: 10000, speed: 18, heading: 90 },
      { id: 'v2', coordinates: [-35.0, 48.0], timestamp: Date.now(), vesselType: 'cruise', value: 25000, speed: 22, heading: 270 },
      { id: 'v3', coordinates: [-30.0, 45.0], timestamp: Date.now(), vesselType: 'tanker', value: 15000, speed: 14, heading: 45 },
      
      // Mediterranean routes
      { id: 'v4', coordinates: [15.0, 40.0], timestamp: Date.now(), vesselType: 'container', value: 12000, speed: 20, heading: 180 },
      { id: 'v5', coordinates: [10.0, 38.0], timestamp: Date.now(), vesselType: 'cruise', value: 30000, speed: 25, heading: 90 },
      
      // Suez Canal area
      { id: 'v6', coordinates: [32.3, 30.0], timestamp: Date.now(), vesselType: 'bulk', value: 8000, speed: 12, heading: 0 },
      
      // Pacific routes
      { id: 'v7', coordinates: [-120.0, 35.0], timestamp: Date.now(), vesselType: 'container', value: 18000, speed: 22, heading: 270 },
      { id: 'v8', coordinates: [-130.0, 40.0], timestamp: Date.now(), vesselType: 'tanker', value: 20000, speed: 16, heading: 45 }
    ];

    // Sample vessel trips
    const vesselTrips: VesselTrip[] = [
      {
        id: 't1',
        path: [
          [-50.0, 45.0, 0],
          [-45.0, 47.0, 3600],
          [-40.0, 48.0, 7200],
          [-35.0, 49.0, 10800]
        ],
        vesselType: 'container',
        value: 15000,
        timestamps: [0, 3600, 7200, 10800]
      }
    ];

    // Sample shipping lanes
    const shippingLanes: ShippingLane[] = [
      {
        id: 'lane1',
        path: [[-50.0, 45.0], [-30.0, 50.0], [-10.0, 55.0], [5.0, 58.0]],
        traffic_density: 0.9,
        importance: 'major',
        region: 'North Atlantic'
      },
      {
        id: 'lane2',
        path: [[5.0, 35.0], [15.0, 38.0], [25.0, 40.0], [32.0, 30.0]],
        traffic_density: 0.7,
        importance: 'secondary',
        region: 'Mediterranean'
      }
    ];

    // Sample ground station coverage
    const groundStationCoverages: GroundStationCoverage[] = [
      {
        id: 'gs1',
        name: 'SES North Atlantic',
        operator: 'SES',
        coordinates: [-25.0, 45.0],
        coverage_polygon: [
          [-35.0, 35.0], [-15.0, 35.0], [-15.0, 55.0], [-35.0, 55.0]
        ],
        elevation_angle: 10,
        power_dbw: 45,
        frequency_bands: ['Ka', 'Ku']
      },
      {
        id: 'gs2',
        name: 'Competitor Mediterranean',
        operator: 'competitor',
        coordinates: [15.0, 40.0],
        coverage_polygon: [
          [5.0, 30.0], [25.0, 30.0], [25.0, 50.0], [5.0, 50.0]
        ],
        elevation_angle: 15,
        power_dbw: 40,
        frequency_bands: ['Ku', 'C']
      }
    ];

    // Sample opportunity markers
    const opportunityMarkers: OpportunityMarker[] = [
      {
        id: 'opp1',
        coordinates: [-45.0, 40.0],
        opportunity_score: 8.5,
        vessel_count_24h: 120,
        revenue_potential: 50000,
        competition_level: 'low'
      },
      {
        id: 'opp2',
        coordinates: [20.0, 45.0],
        opportunity_score: 6.8,
        vessel_count_24h: 85,
        revenue_potential: 35000,
        competition_level: 'medium'
      }
    ];

    return {
      vesselPositions,
      vesselTrips,
      shippingLanes,
      groundStationCoverages,
      opportunityMarkers
    };
  }, []);
};

export default MaritimeHeatmapLayers;