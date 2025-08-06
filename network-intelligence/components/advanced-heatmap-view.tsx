"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PolygonLayer, ColumnLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TerrainLayer } from '@deck.gl/geo-layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadGroundStationAnalytics } from '@/lib/data-loader';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { EnhancedTerrainPortal } from '@/lib/terrain/enhanced-terrain-portal';
import { 
  HeatmapAnalysisEngine, 
  AnalysisMode, 
  HeatmapDataPoint,
  BusinessIntelligenceColors 
} from '@/lib/visualization/heatmap-analysis';
import { OpportunityFilters } from '@/components/opportunity-controls';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, DollarSign, Map, Loader2 } from 'lucide-react';

interface AdvancedHeatmapViewProps {
  onSelectAsset: (asset: any) => void;
  filters: OpportunityFilters;
  onStatsUpdate?: (stats: any) => void;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Store deck overlay instance outside component
let deckOverlayInstance: MapboxOverlay | null = null;

export function AdvancedHeatmapView({ 
  onSelectAsset, 
  filters,
  onStatsUpdate
}: AdvancedHeatmapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [stationAnalytics, setStationAnalytics] = useState<GroundStationAnalytics[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.UTILIZATION);
  const [terrainPortal, setTerrainPortal] = useState<EnhancedTerrainPortal | null>(null);
  const [activePortalId, setActivePortalId] = useState<string | null>(null);
  const [isLoadingTerrain, setIsLoadingTerrain] = useState(false);
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
    loadGroundStationAnalytics().then(data => {
      setStationAnalytics(data);
      const engine = new HeatmapAnalysisEngine(data, filters, analysisMode);
      setHeatmapEngine(engine);
    }).catch(error => {
      console.error('Failed to load station analytics:', error);
    });
  }, []);

  // Update analysis engine when filters or mode changes
  useEffect(() => {
    if (heatmapEngine && stationAnalytics.length > 0) {
      heatmapEngine.setFilters(filters);
      heatmapEngine.setAnalysisMode(analysisMode);
      
      // Update stats
      const stats = heatmapEngine.getStatistics();
      if (onStatsUpdate) {
        onStatsUpdate(stats);
      }
      
      // Re-render layers
      if (isInitialized && deckOverlayInstance) {
        const layers = createLayers();
        deckOverlayInstance.setProps({ layers });
      }
    }
  }, [filters, analysisMode, heatmapEngine, isInitialized]);

  // Create heatmap layer
  const createHeatmapLayer = useCallback(() => {
    if (!heatmapEngine) return null;

    const heatmapData = heatmapEngine.generateHeatmapData();
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
    
    // Different visualization based on zoom
    if (viewState.zoom < 10) {
      // Simple dots for overview
      return new ScatterplotLayer({
        id: 'ground-stations',
        data: heatmapData,
        getPosition: (d: HeatmapDataPoint) => d.position,
        getRadius: (d: HeatmapDataPoint) => {
          // Size based on capacity
          const baseSize = viewState.zoom < 6 ? 5000 : 3000;
          return baseSize * Math.sqrt(d.metadata.capacityGbps / 10);
        },
        getFillColor: (d: HeatmapDataPoint): [number, number, number, number] => {
          // Color based on analysis mode
          if (analysisMode === AnalysisMode.PROFIT) {
            const margin = d.metadata.profitMargin;
            if (margin < 10) return [...BusinessIntelligenceColors.critical, 200] as [number, number, number, number];
            if (margin < 20) return [...BusinessIntelligenceColors.warning, 200] as [number, number, number, number];
            if (margin < 30) return [...BusinessIntelligenceColors.good, 200] as [number, number, number, number];
            return [...BusinessIntelligenceColors.excellent, 200] as [number, number, number, number];
          } else if (analysisMode === AnalysisMode.GROWTH_OPPORTUNITY) {
            const score = d.metadata.opportunityScore;
            if (score > 70) return [...BusinessIntelligenceColors.highOpportunity, 200] as [number, number, number, number];
            if (score > 50) return [...BusinessIntelligenceColors.mediumOpportunity, 200] as [number, number, number, number];
            return [...BusinessIntelligenceColors.lowOpportunity, 200] as [number, number, number, number];
          } else {
            // Utilization mode
            const util = d.metadata.utilization;
            if (util > 85) return [...BusinessIntelligenceColors.critical, 200] as [number, number, number, number];
            if (util > 70) return [...BusinessIntelligenceColors.warning, 200] as [number, number, number, number];
            if (util > 40) return [...BusinessIntelligenceColors.good, 200] as [number, number, number, number];
            return [...BusinessIntelligenceColors.excellent, 200] as [number, number, number, number];
          }
        },
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        onClick: ({ object }: any) => {
          if (object) {
            handleStationClick(object);
          }
        },
        radiusUnits: 'meters',
        radiusMinPixels: viewState.zoom < 6 ? 8 : 12,
        radiusMaxPixels: viewState.zoom < 6 ? 20 : 40
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
            return d.metadata.profitMargin * 100;
          } else if (analysisMode === AnalysisMode.GROWTH_OPPORTUNITY) {
            return d.metadata.opportunityScore * 50;
          } else {
            return d.metadata.utilization * 80;
          }
        },
        getFillColor: (d: HeatmapDataPoint): [number, number, number, number] => {
          if (analysisMode === AnalysisMode.PROFIT) {
            const margin = d.metadata.profitMargin;
            if (margin < 10) return [...BusinessIntelligenceColors.negativeProfit, 200] as [number, number, number, number];
            if (margin < 20) return [...BusinessIntelligenceColors.lowProfit, 200] as [number, number, number, number];
            if (margin < 30) return [...BusinessIntelligenceColors.moderateProfit, 200] as [number, number, number, number];
            if (margin < 40) return [...BusinessIntelligenceColors.goodProfit, 200] as [number, number, number, number];
            return [...BusinessIntelligenceColors.highProfit, 200] as [number, number, number, number];
          } else {
            return getFillColorForMode(d);
          }
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radius: 30000,
        elevationScale: 10,
        filled: true,
        stroked: true,
        extruded: true,
        wireframe: false,
        radiusUnits: 'meters',
        pickable: true,
        onClick: ({ object }: any) => {
          if (object) {
            handleStationClick(object);
          }
        }
      });
    }
  }, [heatmapEngine, viewState.zoom, analysisMode]);

  // Create labels layer for high zoom levels
  const createLabelsLayer = useCallback(() => {
    if (!heatmapEngine || viewState.zoom < 8) return null;

    const heatmapData = heatmapEngine.generateHeatmapData();

    return new TextLayer({
      id: 'station-labels',
      data: heatmapData,
      getPosition: (d: HeatmapDataPoint) => d.position,
      getText: (d: HeatmapDataPoint) => d.metadata.name,
      getSize: 14,
      getColor: [0, 0, 0, 255],
      getBackgroundColor: [255, 255, 255, 200],
      background: true,
      backgroundPadding: [4, 2],
      getPixelOffset: [0, -30],
      pickable: false
    });
  }, [heatmapEngine, viewState.zoom]);

  // Create terrain layer
  const createTerrainLayer = useCallback(() => {
    if (!terrainPortal || !activePortalId || viewState.zoom < 12) return null;

    const terrainLayer = terrainPortal.getTerrainLayer(activePortalId);
    return terrainLayer;
  }, [terrainPortal, activePortalId, viewState.zoom]);

  // Handle station click
  const handleStationClick = useCallback(async (stationData: HeatmapDataPoint) => {
    onSelectAsset({
      id: stationData.metadata.stationId,
      name: stationData.metadata.name,
      coordinates: stationData.position,
      utilization: stationData.metadata.utilization,
      revenue: stationData.metadata.revenue,
      profitMargin: stationData.metadata.profitMargin,
      type: 'ground_station'
    });

    // Create terrain portal if zoomed in enough
    if (viewState.zoom >= 12 && terrainPortal) {
      setIsLoadingTerrain(true);
      try {
        const portalId = await terrainPortal.createPortal(
          stationData.position[0],
          stationData.position[1],
          30 // 30km radius
        );
        setActivePortalId(portalId);
        
        // Wait for terrain to load
        let attempts = 0;
        while (!terrainPortal.isPortalReady(portalId) && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        // Re-render with terrain
        if (isInitialized && deckOverlayInstance) {
          const layers = createLayers();
          deckOverlayInstance.setProps({ layers });
        }
      } catch (error) {
        console.error('Failed to create terrain portal:', error);
      } finally {
        setIsLoadingTerrain(false);
      }
    }
  }, [viewState.zoom, terrainPortal, onSelectAsset, isInitialized]);

  // Get fill color based on mode
  const getFillColorForMode = (d: HeatmapDataPoint): [number, number, number, number] => {
    if (analysisMode === AnalysisMode.GROWTH_OPPORTUNITY) {
      const score = d.metadata.opportunityScore;
      if (score > 70) return [...BusinessIntelligenceColors.highOpportunity, 200] as [number, number, number, number];
      if (score > 50) return [...BusinessIntelligenceColors.mediumOpportunity, 200] as [number, number, number, number];
      return [...BusinessIntelligenceColors.lowOpportunity, 200] as [number, number, number, number];
    } else {
      const util = d.metadata.utilization;
      if (util > 85) return [...BusinessIntelligenceColors.critical, 200] as [number, number, number, number];
      if (util > 70) return [...BusinessIntelligenceColors.warning, 200] as [number, number, number, number];
      if (util > 40) return [...BusinessIntelligenceColors.good, 200] as [number, number, number, number];
      return [...BusinessIntelligenceColors.excellent, 200] as [number, number, number, number];
    }
  };

  // Create all layers
  const createLayers = useCallback(() => {
    const deckLayers = [];

    // Heatmap layer
    const heatmap = createHeatmapLayer();
    if (heatmap) deckLayers.push(heatmap);

    // Station layer
    const stations = createStationLayer();
    if (stations) deckLayers.push(stations);

    // Labels layer
    const labels = createLabelsLayer();
    if (labels) deckLayers.push(labels);

    // Terrain layer
    const terrain = createTerrainLayer();
    if (terrain) deckLayers.push(terrain);

    return deckLayers;
  }, [createHeatmapLayer, createStationLayer, createLabelsLayer, createTerrainLayer]);

  // Update layers when dependencies change
  useEffect(() => {
    if (!isInitialized || !deckOverlayInstance) return;

    const layers = createLayers();
    deckOverlayInstance.setProps({ layers });
  }, [isInitialized, createLayers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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
              'background-color': '#1a1a1a'
            }
          },
          {
            id: 'carto-base-layer',
            type: 'raster',
            source: 'carto-dark',
            paint: {
              'raster-opacity': 0.8
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

    // Adjust pitch based on zoom
    map.on('zoom', () => {
      const zoom = map.getZoom();
      if (zoom >= 14) {
        map.setPitch(45); // 3D view
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
      const portal = new EnhancedTerrainPortal();
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
  }, []);

  // Get analysis mode icon
  const getAnalysisModeIcon = () => {
    switch (analysisMode) {
      case AnalysisMode.UTILIZATION:
        return <Activity className="h-4 w-4" />;
      case AnalysisMode.PROFIT:
        return <DollarSign className="h-4 w-4" />;
      case AnalysisMode.GROWTH_OPPORTUNITY:
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Map className="h-4 w-4" />;
    }
  };

  // Get terrain metrics display
  const getTerrainMetrics = () => {
    if (!terrainPortal || !activePortalId) return null;
    
    const portal = terrainPortal.getPortal(activePortalId);
    if (!portal || !portal.metrics) return null;

    return portal.metrics;
  };

  return (
    <div className="w-full h-full relative bg-gray-900">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Analysis Mode Selector */}
      <Card className="absolute top-4 left-4 p-4 bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getAnalysisModeIcon()}
            <span className="font-medium">Analysis Mode</span>
          </div>
          <Select value={analysisMode} onValueChange={(value) => setAnalysisMode(value as AnalysisMode)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AnalysisMode.UTILIZATION}>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Utilization Analysis</span>
                </div>
              </SelectItem>
              <SelectItem value={AnalysisMode.PROFIT}>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Profit Analysis</span>
                </div>
              </SelectItem>
              <SelectItem value={AnalysisMode.GROWTH_OPPORTUNITY}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Growth Opportunities</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* View Information */}
      <Card className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Zoom:</span>
            <Badge variant="secondary">{viewState.zoom.toFixed(1)}</Badge>
          </div>
          {viewState.zoom >= 12 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">3D View:</span>
              <Badge variant="default">Active</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Terrain Loading Indicator */}
      {isLoadingTerrain && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading terrain data...</span>
        </div>
      )}

      {/* Terrain Metrics Display */}
      {getTerrainMetrics() && viewState.zoom >= 12 && (
        <Card className="absolute bottom-4 left-4 p-4 bg-white/90 backdrop-blur-sm shadow-lg max-w-xs">
          <h3 className="font-medium mb-2 text-sm">Terrain Analysis</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Suitability:</span>
              <Badge variant={getTerrainMetrics()!.suitabilityScore > 70 ? "default" : "secondary"}>
                {getTerrainMetrics()!.suitabilityScore.toFixed(0)}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accessibility:</span>
              <span>{getTerrainMetrics()!.accessibilityScore.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Elevation:</span>
              <span>{getTerrainMetrics()!.avgElevation.toFixed(0)}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Slope:</span>
              <span>{getTerrainMetrics()!.avgSlope.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Construction Cost:</span>
              <span>{getTerrainMetrics()!.constructionCost.toFixed(1)}x</span>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm shadow-lg">
        <h3 className="font-medium mb-2 text-sm">Heatmap Legend</h3>
        <div className="space-y-1 text-xs">
          {analysisMode === AnalysisMode.UTILIZATION && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(59, 130, 246)' }}></div>
                <span>Low Utilization (0-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                <span>Optimal (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(234, 179, 8)' }}></div>
                <span>High (70-85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                <span>Critical (&gt;85%)</span>
              </div>
            </>
          )}
          {analysisMode === AnalysisMode.PROFIT && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                <span>Low Margin (&lt;10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(234, 179, 8)' }}></div>
                <span>Moderate (10-20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                <span>Good (20-30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(59, 130, 246)' }}></div>
                <span>Excellent (&gt;30%)</span>
              </div>
            </>
          )}
          {analysisMode === AnalysisMode.GROWTH_OPPORTUNITY && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(94, 234, 212)' }}></div>
                <span>Low Opportunity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(234, 179, 8)' }}></div>
                <span>Medium Opportunity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(251, 146, 60)' }}></div>
                <span>High Opportunity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                <span>Critical Opportunity</span>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}