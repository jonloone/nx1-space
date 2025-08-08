'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import type { ViewState } from 'react-map-gl/maplibre';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Layers, 
  Activity, 
  BarChart3,
  Gauge,
  MapPin,
  Zap,
  Ship,
  Target,
  RefreshCw
} from 'lucide-react';

import { 
  H3GlobalCoverageSystem, 
  H3Cell, 
  ANALYSIS_MODES,
  AnalysisMode 
} from '@/lib/map/h3-coverage-system';

// Abstract dark map style for professional presentation
const ABSTRACT_MAP_STYLE = {
  "version": 8,
  "name": "Abstract Dark",
  "sources": {
    "simple-tiles": {
      "type": "raster",
      "tiles": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="],
      "tileSize": 256
    }
  },
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#0a0a0a"
      }
    }
  ]
} as any;

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 20,
  latitude: 40,
  zoom: 2,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

interface HexagonAnalysisData extends H3Cell {
  opportunityScore?: number;
  utilizationLevel?: number;
  maritimeActivity?: number;
  stationInfluence?: number;
  populationDensity?: number;
  economicValue?: number;
}

interface AbstractWorldHexMapProps {
  analysisMode?: keyof typeof ANALYSIS_MODES;
  onCellClick?: (cell: HexagonAnalysisData) => void;
  onViewportChange?: (viewport: ViewState) => void;
  showDebugInfo?: boolean;
  initialData?: HexagonAnalysisData[];
}

export function AbstractWorldHexMap({
  analysisMode = 'base',
  onCellClick,
  onViewportChange,
  showDebugInfo = false,
  initialData = []
}: AbstractWorldHexMapProps) {
  // Core state
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [currentMode, setCurrentMode] = useState<keyof typeof ANALYSIS_MODES>(analysisMode);
  const [isLoading, setIsLoading] = useState(false);
  const [hexData, setHexData] = useState<HexagonAnalysisData[]>([]);
  const [selectedCell, setSelectedCell] = useState<HexagonAnalysisData | null>(null);
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    cellCount: 0,
    landCellCount: 0,
    oceanCellCount: 0,
    cacheHitRate: 0
  });
  
  // H3 coverage system instance
  const h3SystemRef = useRef<H3GlobalCoverageSystem | null>(null);
  
  // Initialize H3 system
  useEffect(() => {
    h3SystemRef.current = new H3GlobalCoverageSystem({
      minResolution: 1,
      maxResolution: 4,
      includeOceans: currentMode === 'maritime',
      cachingEnabled: true
    });
  }, [currentMode]);

  // Generate hexagon coverage based on viewport
  const generateHexagonCoverage = useCallback(async (viewport: ViewState) => {
    if (!h3SystemRef.current) return;
    
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const coverage = h3SystemRef.current.generateCoverage({
        longitude: viewport.longitude,
        latitude: viewport.latitude,
        zoom: viewport.zoom
      });
      
      // Enhance with analysis data
      const enhancedCoverage = coverage.map(cell => ({
        ...cell,
        ...generateAnalysisData(cell)
      }));
      
      setHexData(enhancedCoverage);
      
      // Update performance metrics
      const metrics = h3SystemRef.current.getPerformanceMetrics();
      const renderTime = performance.now() - startTime;
      
      setPerformanceMetrics({
        renderTime,
        cellCount: enhancedCoverage.length,
        landCellCount: enhancedCoverage.filter(c => c.isLand).length,
        oceanCellCount: enhancedCoverage.filter(c => !c.isLand).length,
        cacheHitRate: metrics.hitRatio * 100
      });
      
    } catch (error) {
      console.error('Error generating hexagon coverage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate synthetic analysis data for demonstration
  const generateAnalysisData = useCallback((cell: H3Cell): Partial<HexagonAnalysisData> => {
    if (!cell.isLand && currentMode !== 'maritime') {
      return {};
    }
    
    const lat = cell.center[1];
    const lng = cell.center[0];
    
    // Create realistic patterns based on geography
    const baseScore = Math.random() * 100;
    const populationFactor = getPopulationDensityFactor(lat, lng);
    const economicFactor = getEconomicValueFactor(lat, lng);
    const coastalFactor = getCoastalProximityFactor(lat, lng);
    
    return {
      opportunityScore: Math.min(100, baseScore * populationFactor),
      utilizationLevel: Math.random() * 100,
      maritimeActivity: coastalFactor * 100,
      stationInfluence: Math.random() * populationFactor * 100,
      populationDensity: populationFactor * 1000,
      economicValue: economicFactor * 10000
    };
  }, [currentMode]);

  // Geographic factors for realistic data generation
  const getPopulationDensityFactor = (lat: number, lng: number): number => {
    // Higher density in major population centers
    const centers = [
      { lat: 40.7, lng: -74.0, density: 2.0 }, // NYC
      { lat: 51.5, lng: -0.1, density: 1.8 },  // London
      { lat: 35.7, lng: 139.7, density: 2.2 }, // Tokyo
      { lat: 55.8, lng: 37.6, density: 1.6 },  // Moscow
      { lat: 39.9, lng: 116.4, density: 2.0 }, // Beijing
      { lat: 19.4, lng: -99.1, density: 1.7 }, // Mexico City
      { lat: -33.9, lng: 151.2, density: 1.5 }, // Sydney
      { lat: -23.5, lng: -46.6, density: 1.8 }  // São Paulo
    ];
    
    let maxFactor = 0.3; // Base factor for rural areas
    centers.forEach(center => {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
      );
      if (distance < 10) { // Within ~1000km
        const factor = center.density * (1 - distance / 10);
        maxFactor = Math.max(maxFactor, factor);
      }
    });
    
    return maxFactor;
  };

  const getEconomicValueFactor = (lat: number, lng: number): number => {
    // Higher values in developed regions
    if ((lng >= -130 && lng <= -60 && lat >= 25 && lat <= 50) || // North America
        (lng >= -15 && lng <= 45 && lat >= 35 && lat <= 65) ||    // Europe
        (lng >= 100 && lng <= 145 && lat >= 20 && lat <= 45)) {   // East Asia
      return 1.5 + Math.random() * 0.5;
    }
    return 0.5 + Math.random() * 0.5;
  };

  const getCoastalProximityFactor = (lat: number, lng: number): number => {
    // Simplified coastal proximity - in reality you'd use actual coastline data
    // This is a rough approximation for demo purposes
    return 0.3 + Math.random() * 0.7;
  };

  // Handle viewport changes
  const handleViewStateChange = useCallback((params: any) => {
    const newViewState = params.viewState;
    setViewState(newViewState);
    onViewportChange?.(newViewState);
    
    // Regenerate coverage if zoom level changed significantly
    const zoomDiff = Math.abs(newViewState.zoom - viewState.zoom);
    if (zoomDiff > 0.5) {
      generateHexagonCoverage(newViewState);
    }
  }, [viewState, generateHexagonCoverage, onViewportChange]);

  // Handle analysis mode changes
  const handleModeChange = useCallback((newMode: keyof typeof ANALYSIS_MODES) => {
    setCurrentMode(newMode);
    generateHexagonCoverage(viewState);
  }, [viewState, generateHexagonCoverage]);

  // Initial data load
  useEffect(() => {
    if (initialData.length > 0) {
      setHexData(initialData);
    } else {
      generateHexagonCoverage(viewState);
    }
  }, [initialData, generateHexagonCoverage, viewState]);

  // Get color for hexagon based on analysis mode and data
  const getHexagonColor = useCallback((cell: HexagonAnalysisData) => {
    const mode = ANALYSIS_MODES[currentMode];
    
    if (!cell.isLand && currentMode !== 'maritime') {
      return mode.colorScheme.ocean;
    }
    
    switch (currentMode) {
      case 'opportunities':
        const score = cell.opportunityScore || 0;
        if (score < 25) return mode.colorScheme.opportunities.low;
        if (score < 50) return mode.colorScheme.opportunities.medium;
        if (score < 75) return mode.colorScheme.opportunities.high;
        return mode.colorScheme.opportunities.critical;
        
      case 'maritime':
        if (!cell.isLand) {
          const activity = cell.maritimeActivity || 0;
          if (activity > 70) return mode.colorScheme.maritime.shipping;
          if (activity > 40) return mode.colorScheme.maritime.route;
          return mode.colorScheme.ocean;
        }
        return mode.colorScheme.maritime.port;
        
      case 'utilization':
        const utilization = cell.utilizationLevel || 0;
        if (utilization < 25) return mode.colorScheme.utilization.unused;
        if (utilization < 50) return mode.colorScheme.utilization.low;
        if (utilization < 75) return mode.colorScheme.utilization.moderate;
        return mode.colorScheme.utilization.high;
        
      default:
        return cell.isLand ? mode.colorScheme.land : mode.colorScheme.ocean;
    }
  }, [currentMode]);

  // Get elevation for hexagon based on analysis mode
  const getHexagonElevation = useCallback((cell: HexagonAnalysisData) => {
    const mode = ANALYSIS_MODES[currentMode];
    
    if (mode.elevationScale === 0) return 0;
    
    let value = 0;
    switch (currentMode) {
      case 'opportunities':
        value = cell.opportunityScore || 0;
        break;
      case 'maritime':
        value = cell.maritimeActivity || 0;
        break;
      case 'utilization':
        value = cell.utilizationLevel || 0;
        break;
      default:
        return 0;
    }
    
    return (value / 100) * mode.elevationScale;
  }, [currentMode]);

  // Create deck.gl layers
  const layers = useMemo(() => {
    const layerList: any[] = [];
    
    // Main hexagon layer
    layerList.push(
      new H3HexagonLayer({
        id: 'hex-layer',
        data: hexData,
        getHexagon: (d: HexagonAnalysisData) => d.id,
        getFillColor: getHexagonColor,
        getElevation: getHexagonElevation,
        elevationScale: 1,
        stroked: false,
        filled: true,
        extruded: ANALYSIS_MODES[currentMode].elevationScale > 0,
        wireframe: false,
        opacity: ANALYSIS_MODES[currentMode].opacity,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) {
            setSelectedCell(info.object);
            onCellClick?.(info.object);
          }
        },
        updateTriggers: {
          getFillColor: [currentMode],
          getElevation: [currentMode]
        }
      })
    );
    
    // Selected cell highlight
    if (selectedCell) {
      layerList.push(
        new H3HexagonLayer({
          id: 'selected-hex',
          data: [selectedCell],
          getHexagon: (d: HexagonAnalysisData) => d.id,
          getFillColor: [255, 255, 255, 100],
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 3,
          stroked: true,
          filled: false,
          pickable: false
        })
      );
    }
    
    return layerList;
  }, [hexData, currentMode, selectedCell, getHexagonColor, getHexagonElevation, onCellClick]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Main map */}
      <div className="absolute inset-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          getTooltip={({ object }) => {
            if (!object) return null;
            
            const cell = object as HexagonAnalysisData;
            const mode = ANALYSIS_MODES[currentMode];
            
            return {
              html: `
                <div class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm max-w-64">
                  <div class="font-semibold text-blue-400">Hexagon ${cell.id.slice(0, 8)}...</div>
                  <div class="text-gray-300">Resolution: ${cell.resolution} • ${cell.isLand ? 'Land' : 'Ocean'}</div>
                  <div class="mt-2 space-y-1">
                    ${currentMode === 'opportunities' ? `
                      <div class="text-xs">
                        <span class="text-gray-400">Opportunity Score:</span>
                        <span class="text-white ml-1">${(cell.opportunityScore || 0).toFixed(1)}</span>
                      </div>
                    ` : ''}
                    ${currentMode === 'maritime' ? `
                      <div class="text-xs">
                        <span class="text-gray-400">Maritime Activity:</span>
                        <span class="text-white ml-1">${(cell.maritimeActivity || 0).toFixed(1)}%</span>
                      </div>
                    ` : ''}
                    ${currentMode === 'utilization' ? `
                      <div class="text-xs">
                        <span class="text-gray-400">Utilization:</span>
                        <span class="text-white ml-1">${(cell.utilizationLevel || 0).toFixed(1)}%</span>
                      </div>
                    ` : ''}
                    <div class="text-xs text-gray-400">
                      Center: ${cell.center[1].toFixed(2)}°, ${cell.center[0].toFixed(2)}°
                    </div>
                    <div class="text-xs text-gray-400">
                      Area: ${cell.area.toFixed(0)} km²
                    </div>
                  </div>
                </div>
              `,
              style: { zIndex: '1000' }
            };
          }}
        >
          <Map
            mapStyle={ABSTRACT_MAP_STYLE}
            attributionControl={false}
            reuseMaps
          />
        </DeckGL>
      </div>

      {/* Control panel */}
      <div className="absolute top-4 left-4 z-20 w-80">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Global Hexagon Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Analysis mode selector */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Analysis Mode</label>
              <Select value={currentMode} onValueChange={handleModeChange}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="base">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      {ANALYSIS_MODES.base.name}
                    </div>
                  </SelectItem>
                  <SelectItem value="opportunities">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {ANALYSIS_MODES.opportunities.name}
                    </div>
                  </SelectItem>
                  <SelectItem value="maritime">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {ANALYSIS_MODES.maritime.name}
                    </div>
                  </SelectItem>
                  <SelectItem value="utilization">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      {ANALYSIS_MODES.utilization.name}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Performance metrics */}
            {showDebugInfo && (
              <div className="border border-gray-700 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-300 mb-2">Performance</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Cells:</span>
                    <span className="text-white ml-1">{performanceMetrics.cellCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Render:</span>
                    <span className="text-white ml-1">{performanceMetrics.renderTime.toFixed(0)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Land:</span>
                    <span className="text-white ml-1">{performanceMetrics.landCellCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cache Hit:</span>
                    <span className="text-white ml-1">{performanceMetrics.cacheHitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateHexagonCoverage(viewState)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewState(INITIAL_VIEW_STATE)}
                className="flex-1"
              >
                <Globe className="w-4 h-4 mr-1" />
                Reset View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected cell details */}
      {selectedCell && (
        <div className="absolute top-4 right-4 z-20 w-72">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">Cell Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Badge className={selectedCell.isLand ? "bg-green-600" : "bg-blue-600"}>
                  {selectedCell.isLand ? "LAND" : "OCEAN"}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolution:</span>
                  <span className="text-white">{selectedCell.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="text-white">{selectedCell.area.toFixed(0)} km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Coordinates:</span>
                  <span className="text-white text-xs">
                    {selectedCell.center[1].toFixed(3)}, {selectedCell.center[0].toFixed(3)}
                  </span>
                </div>
              </div>

              {currentMode !== 'base' && selectedCell.isLand && (
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  {currentMode === 'opportunities' && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Opportunity Score</div>
                      <Progress value={selectedCell.opportunityScore || 0} className="w-full" />
                      <div className="text-xs text-gray-400 text-right">{(selectedCell.opportunityScore || 0).toFixed(1)}%</div>
                    </div>
                  )}
                  
                  {currentMode === 'maritime' && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Maritime Activity</div>
                      <Progress value={selectedCell.maritimeActivity || 0} className="w-full" />
                      <div className="text-xs text-gray-400 text-right">{(selectedCell.maritimeActivity || 0).toFixed(1)}%</div>
                    </div>
                  )}
                  
                  {currentMode === 'utilization' && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Utilization Level</div>
                      <Progress value={selectedCell.utilizationLevel || 0} className="w-full" />
                      <div className="text-xs text-gray-400 text-right">{(selectedCell.utilizationLevel || 0).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCell(null)}
                className="w-full text-xs"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 z-20">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-white text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating hexagon coverage...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}