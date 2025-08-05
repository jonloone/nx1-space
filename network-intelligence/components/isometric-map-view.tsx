"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PolygonLayer, ColumnLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TerrainLayer } from '@deck.gl/geo-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoSatellite, createSatelliteCoverage, geoSatellites } from '@/data/satellites-geo';
import { loadGroundStationAnalytics } from '@/lib/data-loader';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { TerrainPortal } from '@/lib/terrain/terrain-portal';

interface LayerControls {
  showStations: boolean;
  showHeatmap: boolean;
  showCoverage: boolean;
  showSatellites: boolean;
  showConnections: boolean;
  showTerrain?: boolean;
}

interface IsometricMapViewProps {
  onSelectAsset: (asset: any) => void;
  layers?: LayerControls;
}

// View modes based on zoom level
enum ViewMode {
  GLOBAL = 'global',       // z0-6: Business overview
  LOCAL = 'local',         // z6-10: Regional analysis
  REGIONAL = 'regional',   // z10-14: Site selection
  ISOMETRIC = 'isometric'  // z14+: Terrain detail
}

// Store deck overlay instance outside component
let deckOverlayInstance: MapboxOverlay | null = null;

export function IsometricMapView({ 
  onSelectAsset, 
  layers = {
    showStations: true,
    showHeatmap: true,
    showCoverage: true,
    showSatellites: true,
    showConnections: false,
    showTerrain: false
  }
}: IsometricMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stationAnalytics, setStationAnalytics] = useState<GroundStationAnalytics[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GLOBAL);
  const [terrainPortal, setTerrainPortal] = useState<TerrainPortal | null>(null);
  const [activePortalId, setActivePortalId] = useState<string | null>(null);

  const satellites = geoSatellites;

  // Load analytics data
  useEffect(() => {
    loadGroundStationAnalytics().then(data => {
      setStationAnalytics(data);
    }).catch(error => {
      console.error('Failed to load station analytics:', error);
    });
  }, []);

  // Determine view mode based on zoom
  const getViewMode = useCallback((zoom: number): ViewMode => {
    if (zoom >= 14) return ViewMode.ISOMETRIC;
    if (zoom >= 10) return ViewMode.REGIONAL;
    if (zoom >= 6) return ViewMode.LOCAL;
    return ViewMode.GLOBAL;
  }, []);

  // Create business intelligence layers
  const createProfitHeatmapLayer = useCallback(() => {
    // Generate profit opportunity data
    const profitData = stationAnalytics.map(station => {
      const utilization = station.utilization_metrics.current_utilization;
      const revenue = station.business_metrics.monthly_revenue;
      const profitMargin = station.business_metrics.profit_margin;
      
      // Calculate opportunity score (inverse of utilization for underutilized stations)
      let weight = 50;
      if (utilization < 40 && profitMargin > 30) {
        weight = 90; // High opportunity - profitable but underutilized
      } else if (utilization > 85 && profitMargin < 20) {
        weight = 20; // Low opportunity - busy but low margin
      }
      
      return {
        position: [station.location.longitude, station.location.latitude],
        weight,
        profitMargin,
        utilization
      };
    });

    return new HeatmapLayer({
      id: 'profit-heatmap',
      data: profitData,
      getPosition: (d: any) => d.position,
      getWeight: (d: any) => d.weight,
      radiusPixels: viewMode === ViewMode.GLOBAL ? 100 : 60,
      intensity: viewMode === ViewMode.GLOBAL ? 2 : 1.5,
      threshold: 0.05,
      colorRange: [
        [59, 130, 246, 100],   // Blue - low opportunity
        [34, 197, 94, 120],    // Green - balanced
        [234, 179, 8, 140],    // Yellow - moderate opportunity
        [239, 68, 68, 160],    // Red - high opportunity
        [220, 38, 127, 180]    // Pink - critical opportunity
      ]
    });
  }, [stationAnalytics, viewMode]);

  // Create ground station layer with business metrics
  const createStationLayer = useCallback(() => {
    const stationData = stationAnalytics.map(station => ({
      id: station.station_id,
      name: station.name,
      coordinates: [station.location.longitude, station.location.latitude],
      utilization: station.utilization_metrics.current_utilization,
      revenue: station.business_metrics.monthly_revenue,
      profitMargin: station.business_metrics.profit_margin,
      capacity: station.capacity_metrics.total_capacity_gbps,
      type: 'ground_station'
    }));

    // Different visualization based on view mode
    if (viewMode === ViewMode.GLOBAL || viewMode === ViewMode.LOCAL) {
      // Simple dots for overview
      return new ScatterplotLayer({
        id: 'ground-stations',
        data: stationData,
        getPosition: (d: any) => d.coordinates,
        getRadius: (d: any) => {
          // Size based on revenue
          const baseSize = viewMode === ViewMode.GLOBAL ? 5000 : 3000;
          return baseSize * Math.sqrt(d.revenue / 100000);
        },
        getFillColor: (d: any) => {
          // Color based on profit margin
          if (d.profitMargin < 10) return [239, 68, 68, 200];   // Red - unprofitable
          if (d.profitMargin < 20) return [234, 179, 8, 200];   // Yellow - low margin
          if (d.profitMargin < 30) return [34, 197, 94, 200];   // Green - healthy
          return [59, 130, 246, 200];                            // Blue - excellent
        },
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        onClick: ({ object }: any) => {
          onSelectAsset(object);
          // Create terrain portal for detailed view
          if (viewMode === ViewMode.REGIONAL && terrainPortal) {
            const portalId = terrainPortal.createPortal(
              object.coordinates[1], 
              object.coordinates[0]
            );
            setActivePortalId(portalId);
          }
        },
        radiusUnits: 'meters',
        radiusMinPixels: viewMode === ViewMode.GLOBAL ? 8 : 12,
        radiusMaxPixels: viewMode === ViewMode.GLOBAL ? 20 : 40
      });
    } else {
      // 3D columns for detailed view
      return new ColumnLayer({
        id: 'station-columns',
        data: stationData,
        getPosition: (d: any) => d.coordinates,
        getElevation: (d: any) => d.utilization * 1000,
        getFillColor: (d: any) => {
          if (d.profitMargin < 10) return [239, 68, 68, 200];
          if (d.profitMargin < 20) return [234, 179, 8, 200];
          if (d.profitMargin < 30) return [34, 197, 94, 200];
          return [59, 130, 246, 200];
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radius: 30000,
        elevationScale: 1,
        filled: true,
        stroked: true,
        extruded: true,
        wireframe: false,
        radiusUnits: 'meters',
        pickable: true,
        onClick: ({ object }: any) => {
          onSelectAsset(object);
          if (terrainPortal) {
            const portalId = terrainPortal.createPortal(
              object.coordinates[1], 
              object.coordinates[0]
            );
            setActivePortalId(portalId);
          }
        }
      });
    }
  }, [stationAnalytics, viewMode, onSelectAsset, terrainPortal]);

  // Create terrain layer for portals
  const createTerrainLayer = useCallback(() => {
    if (!activePortalId || !terrainPortal || viewMode !== ViewMode.ISOMETRIC) {
      return null;
    }

    const portal = terrainPortal.getPortal(activePortalId);
    if (!portal || portal.status !== 'ready') {
      return null;
    }

    return new TerrainLayer({
      id: 'terrain-3d',
      minZoom: 0,
      maxZoom: 23,
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      elevationData: `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      texture: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      bounds: portal.bounds,
      material: {
        ambient: 0.5,
        diffuse: 1
      },
      operation: 'terrain+draw'
    });
  }, [activePortalId, terrainPortal, viewMode]);

  // Create all layers
  const createLayers = useCallback(() => {
    const deckLayers = [];

    // Business intelligence layers
    if (layers.showHeatmap) {
      const heatmap = createProfitHeatmapLayer();
      if (heatmap) deckLayers.push(heatmap);
    }

    // Station layers
    if (layers.showStations) {
      const stations = createStationLayer();
      if (stations) deckLayers.push(stations);
    }

    // Satellite coverage (only in regional views)
    if (layers.showCoverage && (viewMode === ViewMode.LOCAL || viewMode === ViewMode.REGIONAL)) {
      const coverageLayers = createSatelliteCoverageLayers();
      deckLayers.push(...coverageLayers);
    }

    // Terrain layer for active portal
    if (layers.showTerrain) {
      const terrain = createTerrainLayer();
      if (terrain) deckLayers.push(terrain);
    }

    return deckLayers;
  }, [layers, createProfitHeatmapLayer, createStationLayer, createTerrainLayer, viewMode]);

  // Create satellite coverage layers
  const createSatelliteCoverageLayers = useCallback(() => {
    const coverageData = satellites.map(satellite => {
      const coverage = createSatelliteCoverage(satellite);
      return {
        satellite,
        polygon: [coverage.polygon],
        color: [...satellite.color, 40] // More transparent
      };
    });

    return [
      new PolygonLayer({
        id: 'satellite-coverage',
        data: coverageData,
        getPolygon: (d: any) => d.polygon[0],
        getFillColor: (d: any) => d.color,
        getLineColor: (d: any) => [...d.satellite.color, 80],
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true,
        pickable: false
      })
    ];
  }, [satellites]);

  // Update layers when dependencies change
  useEffect(() => {
    if (!isInitialized || !deckOverlayInstance) return;

    const layers = createLayers();
    deckOverlayInstance.setProps({ layers });
  }, [isInitialized, createLayers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize MapLibre with Web Mercator projection (no globe)
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f8f9fa'
            }
          },
          {
            id: 'carto-base-layer',
            type: 'raster',
            source: 'carto-light',
            paint: {
              'raster-opacity': 0.9
            }
          }
        ]
      },
      center: [0, 20],
      zoom: 2,
      pitch: 0, // Start flat
      bearing: 0,
      maxZoom: 20,
      minZoom: 1,
      maxPitch: 60,
      minPitch: 0
    });

    mapRef.current = map;

    // Handle zoom changes
    map.on('zoom', () => {
      const zoom = map.getZoom();
      const newMode = getViewMode(zoom);
      setViewMode(newMode);

      // Adjust pitch based on zoom
      if (zoom >= 14) {
        map.setPitch(45); // Isometric view
      } else if (zoom >= 10) {
        map.setPitch(30); // Slight tilt
      } else if (zoom >= 6) {
        map.setPitch(15); // Minor tilt
      } else {
        map.setPitch(0); // Flat
      }
    });

    // Initialize deck.gl overlay
    map.on('load', () => {
      if (!deckOverlayInstance) {
        deckOverlayInstance = new MapboxOverlay({
          interleaved: true,
          layers: []
        });
      }

      map.addControl(deckOverlayInstance);
      
      // Initialize terrain portal manager
      const portal = new TerrainPortal();
      setTerrainPortal(portal);
      
      setIsInitialized(true);
    });

    // Cleanup
    return () => {
      if (deckOverlayInstance && mapRef.current) {
        mapRef.current.removeControl(deckOverlayInstance);
      }
      mapRef.current?.remove();
      mapRef.current = null;
      setIsInitialized(false);
    };
  }, [getViewMode]);

  return (
    <div className="w-full h-full relative bg-gray-100">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* View mode indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <div className="text-sm font-medium text-gray-700">
          View: <span className="text-blue-600">{viewMode}</span>
        </div>
        {activePortalId && (
          <div className="text-xs text-gray-500 mt-1">
            Portal Active
          </div>
        )}
      </div>
    </div>
  );
}