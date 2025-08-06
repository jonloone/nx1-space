"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ColumnLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadGroundStationAnalytics } from '@/lib/data-loader';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { 
  HeatmapAnalysisEngine, 
  AnalysisMode, 
  HeatmapDataPoint
} from '@/lib/visualization/heatmap-analysis';
import { OpportunityFilters } from '@/components/opportunity-controls';

interface FullScreenHeatmapViewProps {
  onSelectAsset: (asset: any) => void;
  filters: OpportunityFilters;
  selectedAsset: any;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Store deck overlay instance outside component to prevent recreation
let deckOverlayInstance: MapboxOverlay | null = null;

export function FullScreenHeatmapView({ 
  onSelectAsset, 
  filters,
  selectedAsset
}: FullScreenHeatmapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stationAnalytics, setStationAnalytics] = useState<GroundStationAnalytics[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.UTILIZATION);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 2,
    pitch: 0,
    bearing: 0
  });
  const [heatmapEngine, setHeatmapEngine] = useState<HeatmapAnalysisEngine | null>(null);

  // Load analytics data
  useEffect(() => {
    console.log('Loading ground station analytics...');
    const loadData = async () => {
      try {
        const data = await loadGroundStationAnalytics();
        console.log('Loaded', data.length, 'ground stations');
        setStationAnalytics(data);
        const engine = new HeatmapAnalysisEngine(data, filters, analysisMode);
        setHeatmapEngine(engine);
      } catch (error) {
        console.error('Failed to load station analytics:', error);
        // Fallback to direct data loading
        const { getFallbackAnalyticsData } = await import('@/lib/data-loader');
        const data = getFallbackAnalyticsData();
        console.log('Using fallback data:', data.length, 'stations');
        setStationAnalytics(data);
        const engine = new HeatmapAnalysisEngine(data, filters, analysisMode);
        setHeatmapEngine(engine);
      }
    };
    loadData();
  }, []);

  // Update analysis engine when filters or mode changes
  useEffect(() => {
    if (heatmapEngine && stationAnalytics.length > 0) {
      console.log('Updating heatmap engine with', stationAnalytics.length, 'stations');
      heatmapEngine.setFilters(filters);
      heatmapEngine.setAnalysisMode(analysisMode);
      
      // Re-render layers
      if (isInitialized && deckOverlayInstance) {
        const layers = createLayers();
        console.log('Created layers:', layers.length);
        deckOverlayInstance.setProps({ layers });
      }
    }
  }, [filters, analysisMode, heatmapEngine, isInitialized, stationAnalytics]);

  // Create heatmap layer
  const createHeatmapLayer = useCallback(() => {
    if (!heatmapEngine) return null;

    const heatmapData = heatmapEngine.generateHeatmapData();
    console.log('Generated heatmap data points:', heatmapData.length);
    
    if (heatmapData.length === 0) return null;

    const config = heatmapEngine.getHeatmapConfig(viewState.zoom);

    return new HeatmapLayer({
      id: 'business-heatmap',
      data: heatmapData,
      getPosition: (d: HeatmapDataPoint) => d.position,
      getWeight: (d: HeatmapDataPoint) => d.weight,
      radiusPixels: config.radiusPixels,
      intensity: config.intensity,
      threshold: config.threshold,
      colorRange: config.colorRange,
      colorDomain: config.colorDomain,
      aggregation: config.aggregation,
      pickable: false
    });
  }, [heatmapEngine, viewState.zoom]);

  // Create station layer with business metrics
  const createStationLayer = useCallback(() => {
    if (!heatmapEngine) return null;

    const heatmapData = heatmapEngine.generateHeatmapData();
    console.log('Creating station layer with', heatmapData.length, 'stations');
    
    if (heatmapData.length === 0) return null;
    
    // Different visualization based on zoom
    if (viewState.zoom < 6) {
      // Simple dots for overview
      return new ScatterplotLayer({
        id: 'ground-stations',
        data: heatmapData,
        getPosition: (d: HeatmapDataPoint) => d.position,
        getRadius: (d: HeatmapDataPoint) => {
          const baseSize = 50000; // 50km base radius
          return baseSize * Math.sqrt(d.metadata.capacityGbps / 100);
        },
        getFillColor: (d: HeatmapDataPoint) => {
          return getColorForMode(d, analysisMode);
        },
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        onClick: ({ object }: any) => handleStationClick(object),
        radiusUnits: 'meters',
        radiusMinPixels: 8,
        radiusMaxPixels: 40
      });
    } else {
      // 3D columns for detailed view
      return new ColumnLayer({
        id: 'station-columns',
        data: heatmapData,
        getPosition: (d: HeatmapDataPoint) => d.position,
        getElevation: (d: HeatmapDataPoint) => {
          // Height based on analysis mode
          if (analysisMode === AnalysisMode.PROFIT) {
            return d.metadata.profitMargin * 1000;
          } else if (analysisMode === AnalysisMode.GROWTH_OPPORTUNITY) {
            return d.metadata.opportunityScore * 800;
          } else {
            return d.metadata.utilization * 1000;
          }
        },
        getFillColor: (d: HeatmapDataPoint) => {
          return getColorForMode(d, analysisMode);
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radius: 20000,
        elevationScale: 1,
        filled: true,
        stroked: true,
        extruded: true,
        wireframe: false,
        radiusUnits: 'meters',
        pickable: true,
        onClick: ({ object }: any) => handleStationClick(object)
      });
    }
  }, [heatmapEngine, viewState.zoom, analysisMode]);

  // Create labels layer for high zoom levels
  const createLabelsLayer = useCallback(() => {
    if (!heatmapEngine || viewState.zoom < 5) return null;

    const heatmapData = heatmapEngine.generateHeatmapData();
    if (heatmapData.length === 0) return null;

    return new TextLayer({
      id: 'station-labels',
      data: heatmapData,
      getPosition: (d: HeatmapDataPoint) => d.position,
      getText: (d: HeatmapDataPoint) => d.metadata.name,
      getSize: 16,
      getColor: [255, 255, 255, 255],
      getBackgroundColor: [0, 0, 0, 180],
      background: true,
      backgroundPadding: [4, 2],
      getPixelOffset: [0, -40],
      pickable: false
    });
  }, [heatmapEngine, viewState.zoom]);

  // Handle station click
  const handleStationClick = useCallback((stationData: HeatmapDataPoint) => {
    console.log('Station clicked:', stationData.metadata.name);
    onSelectAsset({
      id: stationData.metadata.stationId,
      name: stationData.metadata.name,
      coordinates: stationData.position,
      utilization: stationData.metadata.utilization,
      revenue: stationData.metadata.revenue,
      profitMargin: stationData.metadata.profitMargin,
      opportunityScore: stationData.metadata.opportunityScore,
      type: 'ground_station'
    });
  }, [onSelectAsset]);

  // Get color based on analysis mode
  const getColorForMode = (d: HeatmapDataPoint, mode: AnalysisMode): [number, number, number, number] => {
    if (mode === AnalysisMode.PROFIT) {
      const margin = d.metadata.profitMargin;
      if (margin < 10) return [239, 68, 68, 200]; // Red - low margin
      if (margin < 20) return [234, 179, 8, 200]; // Yellow - moderate
      if (margin < 30) return [34, 197, 94, 200]; // Green - good
      return [59, 130, 246, 200]; // Blue - excellent
    } else if (mode === AnalysisMode.GROWTH_OPPORTUNITY) {
      const score = d.metadata.opportunityScore;
      if (score > 70) return [239, 68, 68, 200]; // Red - high opportunity
      if (score > 50) return [234, 179, 8, 200]; // Yellow - medium
      return [94, 234, 212, 200]; // Teal - low
    } else {
      // Utilization mode
      const util = d.metadata.utilization;
      if (util > 85) return [239, 68, 68, 200]; // Red - critical
      if (util > 70) return [234, 179, 8, 200]; // Yellow - high
      if (util > 40) return [34, 197, 94, 200]; // Green - good
      return [59, 130, 246, 200]; // Blue - low
    }
  };

  // Create all layers
  const createLayers = useCallback(() => {
    const deckLayers = [];

    // Heatmap layer (always show)
    const heatmap = createHeatmapLayer();
    if (heatmap) deckLayers.push(heatmap);

    // Station layer
    const stations = createStationLayer();
    if (stations) deckLayers.push(stations);

    // Labels layer
    const labels = createLabelsLayer();
    if (labels) deckLayers.push(labels);

    return deckLayers;
  }, [createHeatmapLayer, createStationLayer, createLabelsLayer]);

  // Update layers when dependencies change
  useEffect(() => {
    if (!isInitialized || !deckOverlayInstance) return;

    const layers = createLayers();
    deckOverlayInstance.setProps({ layers });
  }, [isInitialized, createLayers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    console.log('Initializing map...');

    // Initialize MapLibre
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#0a0a0a'
            }
          },
          {
            id: 'carto-base-layer',
            type: 'raster',
            source: 'carto-dark',
            paint: {
              'raster-opacity': 0.6
            }
          }
        ]
      },
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      pitch: viewState.pitch,
      bearing: viewState.bearing,
      maxZoom: 20,
      minZoom: 1,
      maxPitch: 60,
      minPitch: 0
    });

    mapRef.current = map;

    // Handle view state changes
    map.on('move', () => {
      setViewState({
        longitude: map.getCenter().lng,
        latitude: map.getCenter().lat,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing()
      });
    });

    // Disable rotation for better UX
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Initialize deck.gl overlay
    map.on('load', () => {
      console.log('Map loaded, initializing deck.gl...');
      
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
        mapRef.current.removeControl(deckOverlayInstance);
      }
      mapRef.current?.remove();
      mapRef.current = null;
      setIsInitialized(false);
    };
  }, []);

  // Exposed method to change analysis mode
  useEffect(() => {
    // Listen for analysis mode changes from parent
    (window as any).setAnalysisMode = (mode: AnalysisMode) => {
      console.log('Changing analysis mode to:', mode);
      setAnalysisMode(mode);
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Station count indicator */}
      {stationAnalytics.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
          {stationAnalytics.length} Ground Stations
        </div>
      )}
      
      {/* Analysis mode indicator */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
        Mode: {analysisMode === AnalysisMode.UTILIZATION ? 'Utilization' : 
               analysisMode === AnalysisMode.PROFIT ? 'Profit' : 'Growth Opportunity'}
      </div>

      {/* Selected station info */}
      {selectedAsset && (
        <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">{selectedAsset.name}</h3>
          <div className="space-y-1 text-sm">
            <p>Utilization: {selectedAsset.utilization.toFixed(1)}%</p>
            <p>Profit Margin: {selectedAsset.profitMargin.toFixed(1)}%</p>
            <p>Revenue: ${(selectedAsset.revenue / 1000).toFixed(0)}K/month</p>
            <p>Opportunity Score: {selectedAsset.opportunityScore.toFixed(0)}/100</p>
          </div>
          <button 
            onClick={() => onSelectAsset(null)}
            className="mt-2 text-xs opacity-75 hover:opacity-100"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}