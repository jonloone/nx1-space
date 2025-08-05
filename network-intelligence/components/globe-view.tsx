"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PolygonLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ColumnLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoSatellite, createSatelliteCoverage, geoSatellites } from '@/data/satellites-geo';
import { loadGroundStationAnalytics } from '@/lib/data-loader';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { StarfieldBackground } from '@/components/starfield-background';
import { createTerrainSuitabilityLayer } from '@/lib/terrain/terrain-layer';

interface LayerControls {
  showStations: boolean;
  showHeatmap: boolean;
  showCoverage: boolean;
  showSatellites: boolean;
  showConnections: boolean;
  showTerrain?: boolean;
}

interface GlobeViewProps {
  onSelectAsset: (asset: any) => void;
  layers?: LayerControls;
}

// Store deck overlay instance outside component to prevent recreation
let deckOverlayInstance: MapboxOverlay | null = null;

export function GlobeView({ 
  onSelectAsset, 
  layers = {
    showStations: true,
    showHeatmap: true,
    showCoverage: true,
    showSatellites: true,
    showConnections: false
  }
}: GlobeViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stationAnalytics, setStationAnalytics] = useState<GroundStationAnalytics[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use GEO satellite data
  const satellites = geoSatellites;

  // Load analytics data on mount
  useEffect(() => {
    loadGroundStationAnalytics().then(data => {
      setStationAnalytics(data);
    }).catch(error => {
      console.error('Failed to load station analytics:', error);
    });
  }, []);

  // Create layers callback
  const createLayers = useCallback(() => {
    try {
      const deckLayers = [];

      // Create heatmap layer if enabled
      if (layers.showHeatmap) {
        try {
          const heatmap = createBIHeatmapLayer(stationAnalytics);
          if (heatmap) deckLayers.push(heatmap);
        } catch (e) {
          console.error('Error creating heatmap layer:', e);
        }
      }

      // Create utilization columns layer if stations are shown
      if (layers.showStations) {
        try {
          const columns = createUtilizationColumnsLayer(stationAnalytics);
          if (columns) deckLayers.push(columns);
        } catch (e) {
          console.error('Error creating utilization columns layer:', e);
        }
      }

      // Create station layer if enabled
      if (layers.showStations) {
        try {
          const stations = createBIStationLayer(onSelectAsset);
          if (stations) deckLayers.push(stations);
        } catch (e) {
          console.error('Error creating station layer:', e);
        }
      }

      // Create satellite coverage layers if enabled
      if (layers.showCoverage) {
        try {
          const coverageLayers = createGeoSatelliteCoverageLayers(satellites);
          deckLayers.push(...coverageLayers);
        } catch (e) {
          console.error('Error creating satellite coverage layers:', e);
        }
      }

      // Create satellite positions if enabled
      if (layers.showSatellites) {
        try {
          const satelliteLayer = createGeoSatelliteLayer(satellites, onSelectAsset);
          if (satelliteLayer) deckLayers.push(satelliteLayer);
        } catch (e) {
          console.error('Error creating satellite layer:', e);
        }
      }

      // Create terrain layer if enabled
      if (layers.showTerrain && stationAnalytics.length > 0) {
        try {
          const terrainData = createTerrainSuitabilityLayer(stationAnalytics, true);
          if (terrainData) {
            const terrainHeatmap = new HeatmapLayer({
              id: 'terrain-suitability',
              data: terrainData.data,
              getPosition: (d: any) => d.position,
              getWeight: (d: any) => d.weight,
              radiusPixels: 60,
              intensity: 1.5,
              threshold: 0.05,
              colorRange: terrainData.colorRange,
              updateTriggers: {
                getPosition: stationAnalytics.length,
                getWeight: stationAnalytics.length
              }
            });
            deckLayers.push(terrainHeatmap);
          }
        } catch (e) {
          console.error('Error creating terrain layer:', e);
        }
      }

      return deckLayers;
    } catch (error) {
      console.error('Error creating layers:', error);
      return [];
    }
  }, [satellites, layers, onSelectAsset, stationAnalytics]);

  // Update layers when dependencies change
  useEffect(() => {
    if (!isInitialized || !deckOverlayInstance) return;

    try {
      const layers = createLayers();
      deckOverlayInstance.setProps({ layers });
    } catch (error) {
      console.error('Error updating deck.gl layers:', error);
    }
  }, [isInitialized, createLayers]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#000814'
            }
          },
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            paint: {
              'raster-opacity': 0.8
            }
          }
        ]
      },
      center: [0, 20],
      zoom: 2,
      maxZoom: 20,
      minZoom: 1,
      maxPitch: 85,
      minPitch: 0,
      // Disable right-click rotation to prevent breaking the globe view
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true
    });

    mapRef.current = map;

    // Wait for map to be fully loaded before initializing deck.gl
    map.on('load', () => {
      // Set globe projection
      try {
        if (map.isStyleLoaded()) {
          (map as any).setProjection({ type: 'globe' });
        }
      } catch (e) {
        console.warn('Globe projection not supported:', e);
      }

      // Initialize deck.gl overlay only once
      if (!deckOverlayInstance) {
        deckOverlayInstance = new MapboxOverlay({
          interleaved: true,
          layers: []
        });
      }

      map.addControl(deckOverlayInstance);
      setIsInitialized(true);
    });

    // Cleanup
    return () => {
      if (deckOverlayInstance && mapRef.current) {
        try {
          mapRef.current.removeControl(deckOverlayInstance);
        } catch (e) {
          console.error('Error removing deck overlay:', e);
        }
      }
      mapRef.current?.remove();
      mapRef.current = null;
      setIsInitialized(false);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <StarfieldBackground />
      <div ref={mapContainer} className="w-full h-full relative z-10" />
    </div>
  );
}

// BI-focused layer creation functions

function createUtilizationColumnsLayer(analytics: GroundStationAnalytics[]) {
  if (!analytics || analytics.length === 0) {
    return new ColumnLayer({
      id: 'utilization-columns',
      data: [],
      getPosition: () => [0, 0],
      getElevation: () => 0,
    });
  }

  const stationData = analytics.map(station => ({
    id: station.station_id,
    name: station.name,
    coordinates: [station.location.longitude, station.location.latitude],
    utilization: station.utilization_metrics.current_utilization,
    capacity: station.capacity_metrics.total_capacity_gbps,
    revenue: station.business_metrics.monthly_revenue,
    health: station.health_score
  }));

  return new ColumnLayer({
    id: 'utilization-columns',
    data: stationData,
    getPosition: (d: any) => d.coordinates,
    getElevation: (d: any) => d.utilization * 1000,
    getFillColor: (d: any) => {
      if (d.utilization >= 90) return [255, 59, 48, 200];
      if (d.utilization >= 80) return [255, 149, 0, 200];
      if (d.utilization >= 70) return [255, 204, 0, 200];
      return [52, 199, 89, 200];
    },
    getLineColor: [255, 255, 255, 100],
    lineWidthMinPixels: 1,
    radius: 50000,
    elevationScale: 1,
    filled: true,
    stroked: true,
    extruded: true,
    wireframe: false,
    radiusUnits: 'meters',
    updateTriggers: {
      getPosition: analytics.length,
      getElevation: analytics.length,
      getFillColor: analytics.length
    }
  });
}

function createBIHeatmapLayer(analytics: GroundStationAnalytics[]) {
  // Create opportunity heatmap based on utilization patterns
  const heatmapData = analytics.length > 0 
    ? analytics.map(station => {
        // Convert utilization to opportunity weight (inverse relationship)
        let weight;
        if (station.utilization_metrics.current_utilization >= 95) {
          weight = 100; // Critical - red
        } else if (station.utilization_metrics.current_utilization >= 90) {
          weight = 80; // High - yellow  
        } else if (station.utilization_metrics.current_utilization >= 70) {
          weight = 60; // Good - green
        } else {
          weight = 40; // Low - blue
        }
        
        return {
          position: [station.location.longitude, station.location.latitude],
          weight: weight
        };
      })
    : [
      // Default opportunity spots
      { position: [-3.7038, 40.4168], weight: 60 },
      { position: [8.6821, 50.1109], weight: 70 },
      { position: [-119.6828, 48.1067], weight: 50 },
      { position: [9.9333, 50.1167], weight: 65 },
      { position: [-117.3961, 33.9533], weight: 45 },
      { position: [103.8198, 1.3521], weight: 85 },
      { position: [151.2093, -33.8688], weight: 75 },
      { position: [-43.1729, -22.9068], weight: 55 },
      { position: [28.0473, -26.2041], weight: 60 },
    ];

  // Add underserved regions as opportunities
  const opportunityAreas = [
    { position: [78.0, 20.0], weight: 30 }, // India - underserved
    { position: [-60.0, -15.0], weight: 35 }, // Brazil interior
    { position: [25.0, -30.0], weight: 40 }, // Southern Africa
    { position: [140.0, -25.0], weight: 45 }, // Australia interior
  ];
  heatmapData.push(...opportunityAreas);

  return new HeatmapLayer({
    id: 'bi-opportunity-heatmap',
    data: heatmapData,
    getPosition: (d: any) => d.position,
    getWeight: (d: any) => d.weight,
    radiusPixels: 80,
    intensity: 2.0,
    threshold: 0.1,
    // BI color scheme: blue=low, green=good, yellow=high, red=critical
    colorRange: [
      [59, 130, 246, 120],   // Blue - low utilization
      [34, 197, 94, 140],    // Green - good utilization
      [234, 179, 8, 160],    // Yellow - high utilization
      [239, 68, 68, 200],    // Red - critical utilization
      [220, 38, 127, 220]    // Pink - extreme
    ],
    updateTriggers: {
      getPosition: analytics.length,
      getWeight: analytics.length
    }
  });
}

function createBIStationLayer(onSelect: Function) {
  const stationData = [
    { 
      id: 'madrid',
      name: 'Madrid Teleport',
      coordinates: [-3.7038, 40.4168],
      type: 'ground_station',
      operator: 'Intelsat',
      capacity: 100,
      utilization: 75,
      services: ['DTH', 'Enterprise', 'Government'],
      connectedSatellites: ['intelsat-6', 'intelsat-7']
    },
    {
      id: 'frankfurt',
      name: 'Frankfurt Teleport',
      coordinates: [8.6821, 50.1109],
      type: 'ground_station',
      operator: 'SES',
      capacity: 150,
      utilization: 82,
      services: ['Enterprise', 'CDN', 'Broadcast'],
      connectedSatellites: ['astra-1n', 'astra-2e']
    },
    {
      id: 'brewster',
      name: 'Brewster Teleport',
      coordinates: [-119.6828, 48.1067],
      type: 'ground_station',
      operator: 'Intelsat',
      capacity: 120,
      utilization: 68,
      services: ['Government', 'Enterprise'],
      connectedSatellites: ['intelsat-3']
    },
    {
      id: 'fuchsstadt',
      name: 'Fuchsstadt Teleport',
      coordinates: [9.9333, 50.1167],
      type: 'ground_station',
      operator: 'Intelsat',
      capacity: 130,
      utilization: 79,
      services: ['DTH', 'Broadcast', 'Enterprise'],
      connectedSatellites: ['intelsat-8']
    },
    {
      id: 'riverside',
      name: 'Riverside Teleport',
      coordinates: [-117.3961, 33.9533],
      type: 'ground_station',
      operator: 'Intelsat',
      capacity: 110,
      utilization: 71,
      services: ['Enterprise', 'Government'],
      connectedSatellites: ['intelsat-3']
    },
    {
      id: 'singapore',
      name: 'Singapore Teleport',
      coordinates: [103.8198, 1.3521],
      type: 'ground_station',
      operator: 'SES',
      capacity: 200,
      utilization: 95,
      services: ['Enterprise', 'Maritime', 'Cellular'],
      connectedSatellites: ['ses-7', 'ses-8']
    }
  ];

  return new ScatterplotLayer({
    id: 'bi-stations',
    data: stationData,
    getPosition: (d: any) => d.coordinates,
    getRadius: (d: any) => Math.sqrt(d.capacity) * 4000,
    getFillColor: (d: any) => {
      // BI color scheme based on utilization
      if (d.utilization >= 95) return [239, 68, 68, 220];   // Red - critical
      if (d.utilization >= 90) return [234, 179, 8, 220];   // Yellow - high
      if (d.utilization >= 70) return [34, 197, 94, 220];   // Green - good
      return [59, 130, 246, 220];                           // Blue - low
    },
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 2,
    stroked: true,
    filled: true,
    pickable: true,
    onClick: ({ object }: any) => onSelect(object),
    radiusUnits: 'meters',
    radiusMinPixels: 10,
    radiusMaxPixels: 50,
    updateTriggers: {
      getPosition: 1,
      getRadius: 1,
      getFillColor: 1
    }
  });
}

function createGeoSatelliteLayer(
  satellites: GeoSatellite[], 
  onSelect: Function
) {
  return new ScatterplotLayer({
    id: 'geo-satellites',
    data: satellites,
    getPosition: (d: GeoSatellite) => {
      // GEO satellites are positioned at their longitude, 0 latitude, at GEO altitude
      return [d.longitude, d.latitude, d.altitude * 1000];
    },
    getRadius: 60000,
    getFillColor: (d: GeoSatellite) => {
      // Color based on utilization
      if (d.utilization >= 95) return [239, 68, 68, 220];   // Red - critical
      if (d.utilization >= 90) return [234, 179, 8, 220];   // Yellow - high
      if (d.utilization >= 70) return [...d.color, 220];    // Original color - good
      return [59, 130, 246, 220];                           // Blue - low
    },
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 1,
    stroked: true,
    filled: true,
    pickable: true,
    onClick: ({ object }: any) => {
      if (object) {
        onSelect({
          ...object,
          type: 'satellite'
        });
      }
    },
    radiusUnits: 'meters',
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    updateTriggers: {
      getPosition: satellites.length,
      getFillColor: satellites.length
    }
  });
}

function createGeoSatelliteCoverageLayers(satellites: GeoSatellite[]) {
  const coverageData = satellites.map(satellite => {
    const coverage = createSatelliteCoverage(satellite);
    return {
      satellite,
      polygon: [coverage.polygon],
      color: [...satellite.color, 60] // More transparent for better visibility
    };
  });

  const sesData = coverageData.filter(d => d.satellite.operator_type === 'SES');
  const intelsatData = coverageData.filter(d => d.satellite.operator_type === 'Intelsat');

  const layers = [];

  if (sesData.length > 0) {
    layers.push(new PolygonLayer({
      id: 'geo-coverage-ses',
      data: sesData,
      getPolygon: (d: any) => d.polygon[0],
      getFillColor: (d: any) => d.color,
      getLineColor: [0, 170, 255, 80],
      lineWidthMinPixels: 1,
      filled: true,
      stroked: true,
      pickable: false,
      updateTriggers: {
        getPolygon: satellites.length,
        getFillColor: satellites.length
      }
    }));
  }

  if (intelsatData.length > 0) {
    layers.push(new PolygonLayer({
      id: 'geo-coverage-intelsat',
      data: intelsatData,
      getPolygon: (d: any) => d.polygon[0],
      getFillColor: (d: any) => d.color,
      getLineColor: [255, 119, 0, 80],
      lineWidthMinPixels: 1,
      filled: true,
      stroked: true,
      pickable: false,
      updateTriggers: {
        getPolygon: satellites.length,
        getFillColor: satellites.length
      }
    }));
  }

  return layers;
}

// Removed satellite label layer - not needed for BI view