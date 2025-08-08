'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import type { ViewState } from 'react-map-gl/maplibre';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer, ColumnLayer } from '@deck.gl/layers';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Import our comprehensive H3 system
import { 
  H3GlobalCoverageSystem, 
  H3Cell, 
  ANALYSIS_MODES,
  AnalysisMode 
} from '@/lib/map/h3-coverage-system';
import { OpportunityAnalysisSystem, OpportunityScore } from '@/lib/map/opportunity-analysis-system';
import { ViewportOptimizationSystem, PerformanceMetrics } from '@/lib/map/viewport-optimization-system';
import { InteractionSystem, InteractionState, TooltipData } from '@/lib/map/interaction-system';

// Import existing station data for integration
import { ALL_REAL_STATIONS } from '@/lib/data/real-ground-stations';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

// Abstract dark map style for professional presentation
const ABSTRACT_MAP_STYLE = {
  "version": 8,
  "name": "Abstract Dark Professional",
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
  zoom: 2.5,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

interface EnhancedHexData extends H3Cell {
  opportunityScore?: OpportunityScore;
  stationInfluence?: number;
  maritimeActivity?: number;
  utilizationLevel?: number;
  nearbyStations?: PrecomputedStationScore[];
}

interface SystemStats {
  totalHexagons: number;
  landHexagons: number;
  oceanHexagons: number;
  highOpportunities: number;
  averageScore: number;
  coverageCompleteness: number;
  performanceMetrics: PerformanceMetrics;
}

export function EnhancedHexIntelligenceMap() {
  // Core state
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [currentMode, setCurrentMode] = useState<keyof typeof ANALYSIS_MODES>('base');
  const [isLoading, setIsLoading] = useState(false);
  const [hexData, setHexData] = useState<EnhancedHexData[]>([]);
  const [selectedCell, setSelectedCell] = useState<EnhancedHexData | null>(null);
  const [showStations, setShowStations] = useState(true);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  
  // Panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  
  // System stats
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalHexagons: 0,
    landHexagons: 0,
    oceanHexagons: 0,
    highOpportunities: 0,
    averageScore: 0,
    coverageCompleteness: 0,
    performanceMetrics: {} as PerformanceMetrics
  });
  
  // System instances
  const h3SystemRef = useRef<H3GlobalCoverageSystem | null>(null);
  const opportunitySystemRef = useRef<OpportunityAnalysisSystem | null>(null);
  const optimizationSystemRef = useRef<ViewportOptimizationSystem | null>(null);
  const interactionSystemRef = useRef<InteractionSystem | null>(null);
  
  // Frame timing for performance monitoring
  const frameTimingRef = useRef<number>(0);
  
  // Initialize systems
  useEffect(() => {
    h3SystemRef.current = new H3GlobalCoverageSystem({
      minResolution: 1,
      maxResolution: 4,
      includeOceans: currentMode === 'maritime',
      cachingEnabled: true
    });
    
    opportunitySystemRef.current = new OpportunityAnalysisSystem();
    
    optimizationSystemRef.current = new ViewportOptimizationSystem({
      enableCulling: true,
      enableLOD: true,
      enableAdaptiveUpdate: true,
      targetFrameRate: 60,
      maxCells: 25000,
      memoryLimit: 256,
      updateInterval: 150,
      preloadRadius: 1.2
    });
    
    interactionSystemRef.current = new InteractionSystem({
      enableHover: true,
      enableSelection: true,
      enableContextMenu: true,
      enableTooltips: true,
      enableRegionSelection: true,
      hoverDelay: 100,
      tooltipDelay: 200,
      maxSelections: 25,
      animationDuration: 200
    });
  }, [currentMode]);

  // Station data processing
  const allStationScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);

  // Generate comprehensive hexagon coverage
  const generateHexagonCoverage = useCallback(async (viewport: ViewState) => {
    if (!h3SystemRef.current || !opportunitySystemRef.current || !optimizationSystemRef.current) return;
    
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Generate base coverage
      const baseCoverage = h3SystemRef.current.generateCoverage({
        longitude: viewport.longitude,
        latitude: viewport.latitude,
        zoom: viewport.zoom
      });
      
      // Apply viewport optimization
      const frameTime = frameTimingRef.current;
      const cullResult = optimizationSystemRef.current.optimizeViewport(
        baseCoverage, 
        viewport, 
        frameTime
      );
      
      // Enhance with opportunity analysis
      const enhancedCoverage: EnhancedHexData[] = cullResult.visibleCells.map(cell => {
        const enhanced: EnhancedHexData = { ...cell };
        
        if (cell.isLand) {
          // Calculate opportunity score
          enhanced.opportunityScore = opportunitySystemRef.current!.calculateOpportunityScore(cell);
          
          // Calculate station influence
          enhanced.stationInfluence = calculateStationInfluence(cell, allStationScores);
          
          // Calculate utilization based on nearby stations
          enhanced.utilizationLevel = calculateUtilizationLevel(cell, allStationScores);
          
          // Find nearby stations
          enhanced.nearbyStations = findNearbyStations(cell, allStationScores);
        }
        
        if (currentMode === 'maritime') {
          enhanced.maritimeActivity = calculateMaritimeActivity(cell);
        }
        
        return enhanced;
      });
      
      setHexData(enhancedCoverage);
      
      // Update system statistics
      updateSystemStats(enhancedCoverage, cullResult, startTime);
      
    } catch (error) {
      console.error('Error generating hexagon coverage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [allStationScores, currentMode]);

  // Calculate station influence on hexagon
  const calculateStationInfluence = useCallback((cell: H3Cell, stations: PrecomputedStationScore[]): number => {
    let totalInfluence = 0;
    const cellLat = cell.center[1];
    const cellLng = cell.center[0];
    
    stations.forEach(station => {
      const stationLat = station.coordinates[0];
      const stationLng = station.coordinates[1];
      
      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(cellLat - stationLat, 2) + Math.pow(cellLng - stationLng, 2)
      );
      
      // Influence decreases with distance (simplified model)
      if (distance < 20) { // Within ~2000km
        const influence = (station.overallScore / 100) * (1 - distance / 20);
        totalInfluence += influence;
      }
    });
    
    return Math.min(100, totalInfluence * 100);
  }, []);

  // Calculate utilization level based on station coverage
  const calculateUtilizationLevel = useCallback((cell: H3Cell, stations: PrecomputedStationScore[]): number => {
    const nearbyStations = findNearbyStations(cell, stations);
    
    if (nearbyStations.length === 0) return 0;
    
    const avgUtilization = nearbyStations.reduce((sum, station) => 
      sum + (station.actualUtilization ?? station.utilization), 0) / nearbyStations.length;
    
    return avgUtilization;
  }, []);

  // Find nearby stations within influence range
  const findNearbyStations = useCallback((cell: H3Cell, stations: PrecomputedStationScore[]): PrecomputedStationScore[] => {
    const cellLat = cell.center[1];
    const cellLng = cell.center[0];
    
    return stations.filter(station => {
      const stationLat = station.coordinates[0];
      const stationLng = station.coordinates[1];
      
      const distance = Math.sqrt(
        Math.pow(cellLat - stationLat, 2) + Math.pow(cellLng - stationLng, 2)
      );
      
      return distance < 15; // Within ~1500km
    });
  }, []);

  // Calculate maritime activity (simplified)
  const calculateMaritimeActivity = useCallback((cell: H3Cell): number => {
    const lat = cell.center[1];
    const lng = cell.center[0];
    
    // Higher activity near major shipping lanes and ports
    const shippingLanes = [
      { lat: 30, lng: 0, activity: 90 },    // Mediterranean
      { lat: 25, lng: 55, activity: 85 },   // Persian Gulf
      { lat: 1, lng: 103, activity: 95 },   // Singapore Strait
      { lat: 40, lng: -70, activity: 80 },  // North Atlantic
      { lat: 48, lng: -4, activity: 75 },   // English Channel
    ];
    
    let maxActivity = cell.isLand ? 0 : 20; // Base ocean activity
    
    shippingLanes.forEach(lane => {
      const distance = Math.sqrt(
        Math.pow(lat - lane.lat, 2) + Math.pow(lng - lane.lng, 2)
      );
      if (distance < 10) {
        const activity = lane.activity * (1 - distance / 10);
        maxActivity = Math.max(maxActivity, activity);
      }
    });
    
    return maxActivity;
  }, []);

  // Update system statistics
  const updateSystemStats = useCallback((
    coverage: EnhancedHexData[], 
    cullResult: any, 
    startTime: number
  ) => {
    const landHexagons = coverage.filter(c => c.isLand).length;
    const oceanHexagons = coverage.length - landHexagons;
    const highOpportunities = coverage.filter(c => 
      c.opportunityScore && c.opportunityScore.overall >= 70).length;
    
    const totalScore = coverage.reduce((sum, c) => 
      sum + (c.opportunityScore?.overall || 0), 0);
    const averageScore = coverage.length > 0 ? totalScore / coverage.length : 0;
    
    const renderTime = performance.now() - startTime;
    frameTimingRef.current = renderTime;
    
    const performanceMetrics: PerformanceMetrics = {
      totalCells: coverage.length + cullResult.culledCells?.length || 0,
      visibleCells: coverage.length,
      culledCells: cullResult.culledCells?.length || 0,
      renderTime,
      updateTime: Date.now(),
      memoryUsage: 0, // Would be calculated by optimization system
      frameRate: 1000 / Math.max(1, renderTime),
      lodLevel: cullResult.lodLevel || 2,
      cacheHitRate: 85 // Simplified
    };
    
    setSystemStats({
      totalHexagons: coverage.length,
      landHexagons,
      oceanHexagons,
      highOpportunities,
      averageScore,
      coverageCompleteness: Math.min(100, (coverage.length / 10000) * 100),
      performanceMetrics
    });
  }, []);

  // Handle viewport changes
  const handleViewStateChange = useCallback((params: any) => {
    const newViewState = params.viewState;
    setViewState(newViewState);
    
    // Regenerate coverage if significant change
    const zoomDiff = Math.abs(newViewState.zoom - viewState.zoom);
    const latDiff = Math.abs(newViewState.latitude - viewState.latitude);
    const lngDiff = Math.abs(newViewState.longitude - viewState.longitude);
    
    if (zoomDiff > 0.5 || latDiff > 2 || lngDiff > 2) {
      generateHexagonCoverage(newViewState);
    }
  }, [viewState, generateHexagonCoverage]);

  // Handle analysis mode changes
  const handleModeChange = useCallback((newMode: keyof typeof ANALYSIS_MODES) => {
    setCurrentMode(newMode);
    generateHexagonCoverage(viewState);
  }, [viewState, generateHexagonCoverage]);

  // Handle cell selection
  const handleCellClick = useCallback((cell: EnhancedHexData) => {
    setSelectedCell(cell);
    setRightPanelOpen(true);
    
    if (interactionSystemRef.current) {
      interactionSystemRef.current.handleCellSelection(cell);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    generateHexagonCoverage(viewState);
  }, [generateHexagonCoverage, viewState]);

  // Get color for hexagon based on analysis mode
  const getHexagonColor = useCallback((cell: EnhancedHexData) => {
    const mode = ANALYSIS_MODES[currentMode];
    
    if (!cell.isLand && currentMode !== 'maritime') {
      return mode.colorScheme.ocean;
    }
    
    switch (currentMode) {
      case 'opportunities':
        const score = cell.opportunityScore?.overall || 0;
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

  // Get elevation for hexagon
  const getHexagonElevation = useCallback((cell: EnhancedHexData) => {
    const mode = ANALYSIS_MODES[currentMode];
    if (mode.elevationScale === 0) return 0;
    
    let value = 0;
    switch (currentMode) {
      case 'opportunities':
        value = cell.opportunityScore?.overall || 0;
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
        id: 'enhanced-hex-layer',
        data: hexData,
        getHexagon: (d: EnhancedHexData) => d.id,
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
            handleCellClick(info.object);
          }
        },
        updateTriggers: {
          getFillColor: [currentMode],
          getElevation: [currentMode]
        }
      })
    );
    
    // Station layer overlay
    if (showStations && allStationScores.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: 'station-overlay',
          data: allStationScores,
          getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]],
          getRadius: (d: PrecomputedStationScore) => {
            const baseRadius = Math.max(15000, viewState.zoom * 8000);
            return baseRadius * Math.max(0.5, d.overallScore / 100);
          },
          getFillColor: (d: PrecomputedStationScore) => {
            if (d.priority === 'critical') return [239, 68, 68, 200];
            if (d.priority === 'high') return [249, 115, 22, 180];
            if (d.priority === 'medium') return [34, 197, 94, 160];
            return [156, 163, 175, 140];
          },
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 1500,
          stroked: true,
          filled: true,
          radiusMinPixels: 3,
          radiusMaxPixels: 15,
          pickable: false
        })
      );
    }
    
    // Selected cell highlight
    if (selectedCell) {
      layerList.push(
        new H3HexagonLayer({
          id: 'selected-hex-highlight',
          data: [selectedCell],
          getHexagon: (d: EnhancedHexData) => d.id,
          getFillColor: [255, 255, 255, 0],
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 3,
          stroked: true,
          filled: false,
          pickable: false
        })
      );
    }
    
    return layerList;
  }, [hexData, currentMode, showStations, selectedCell, allStationScores, viewState.zoom, getHexagonColor, getHexagonElevation, handleCellClick]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Main map */}
      <div className="absolute inset-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          getTooltip={({ object }) => {
            if (!object || !interactionSystemRef.current) return null;
            
            const tooltipData = interactionSystemRef.current.generateTooltipData(object);
            
            return {
              html: `
                <div class="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm max-w-80">
                  <div class="font-semibold text-blue-400">${tooltipData.primary}</div>
                  <div class="text-gray-300 text-xs">${tooltipData.secondary}</div>
                  <div class="mt-2 space-y-1">
                    ${tooltipData.metrics.slice(0, 5).map(metric => `
                      <div class="flex justify-between text-xs">
                        <span class="text-gray-400">${metric.label}:</span>
                        <span class="text-white" style="color: ${metric.color || '#ffffff'}">${metric.value}${metric.format === 'percentage' ? '%' : metric.format === 'currency' ? 'M' : ''}</span>
                      </div>
                    `).join('')}
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

      {/* Top control bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-2 p-2">
            <Button
              size="sm"
              variant={currentMode === 'base' ? 'default' : 'outline'}
              onClick={() => handleModeChange('base')}
              className="text-xs"
            >
              <Layers className="w-4 h-4 mr-1" />
              Base
            </Button>
            <Button
              size="sm"
              variant={currentMode === 'opportunities' ? 'default' : 'outline'}
              onClick={() => handleModeChange('opportunities')}
              className="text-xs"
            >
              <Target className="w-4 h-4 mr-1" />
              Opportunities
            </Button>
            <Button
              size="sm"
              variant={currentMode === 'maritime' ? 'default' : 'outline'}
              onClick={() => handleModeChange('maritime')}
              className="text-xs"
            >
              <Ship className="w-4 h-4 mr-1" />
              Maritime
            </Button>
            <Button
              size="sm"
              variant={currentMode === 'utilization' ? 'default' : 'outline'}
              onClick={() => handleModeChange('utilization')}
              className="text-xs"
            >
              <Gauge className="w-4 h-4 mr-1" />
              Utilization
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button
              size="sm"
              variant={showStations ? 'default' : 'outline'}
              onClick={() => setShowStations(!showStations)}
              className="text-xs"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Stations
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateHexagonCoverage(viewState)}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Refresh
            </Button>
          </div>
        </Card>
      </div>

      {/* Left Panel - System Control */}
      <div className={`absolute top-16 left-4 z-20 transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-12'}`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm h-[calc(100vh-180px)] overflow-hidden">
          {leftPanelOpen ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Global Coverage System</h3>
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Total Hexagons</div>
                      <div className="text-xl font-bold text-white">{systemStats.totalHexagons.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Land Coverage</div>
                      <div className="text-xl font-bold text-green-400">{systemStats.landHexagons.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Ocean Coverage</div>
                      <div className="text-xl font-bold text-blue-400">{systemStats.oceanHexagons.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">High Opportunities</div>
                      <div className="text-xl font-bold text-orange-400">{systemStats.highOpportunities}</div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Coverage Completeness</div>
                    <Progress value={systemStats.coverageCompleteness} className="w-full" />
                    <div className="text-xs text-gray-400 text-right mt-1">
                      {systemStats.coverageCompleteness.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Average Opportunity Score</div>
                    <div className="text-lg font-bold text-white">
                      {systemStats.averageScore.toFixed(1)}/100
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Analysis Mode</div>
                    <Badge className={
                      currentMode === 'opportunities' ? 'bg-orange-600' :
                      currentMode === 'maritime' ? 'bg-blue-600' :
                      currentMode === 'utilization' ? 'bg-green-600' :
                      'bg-gray-600'
                    }>
                      {ANALYSIS_MODES[currentMode].name.toUpperCase()}
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Render Time</div>
                      <div className="text-lg font-bold text-white">
                        {systemStats.performanceMetrics.renderTime?.toFixed(0) || 0}ms
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Frame Rate</div>
                      <div className="text-lg font-bold text-white">
                        {systemStats.performanceMetrics.frameRate?.toFixed(0) || 60}fps
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Visible Cells</div>
                      <div className="text-lg font-bold text-green-400">
                        {systemStats.performanceMetrics.visibleCells?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Culled Cells</div>
                      <div className="text-lg font-bold text-gray-400">
                        {systemStats.performanceMetrics.culledCells?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Cache Hit Rate</div>
                    <Progress value={systemStats.performanceMetrics.cacheHitRate} className="w-full" />
                    <div className="text-xs text-gray-400 text-right mt-1">
                      {systemStats.performanceMetrics.cacheHitRate?.toFixed(1) || 0}%
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">LOD Level</div>
                    <div className="text-lg font-bold text-white">
                      {systemStats.performanceMetrics.lodLevel || 2}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="w-full h-full flex items-center justify-center text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </Card>
      </div>

      {/* Right Panel - Cell Details */}
      {rightPanelOpen && selectedCell && (
        <div className="absolute top-16 right-4 z-20 w-96">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm max-h-[calc(100vh-180px)] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-white">Hexagon Analysis</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedCell.id.slice(0, 12)}... • Resolution {selectedCell.resolution}
                  </p>
                </div>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="overflow-y-auto">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
                  <TabsTrigger value="stations">Stations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div>
                    <Badge className={selectedCell.isLand ? "bg-green-600" : "bg-blue-600"}>
                      {selectedCell.isLand ? "LAND" : "OCEAN"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Area:</span>
                      <span className="text-white">{selectedCell.area.toFixed(0)} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Center:</span>
                      <span className="text-white text-xs">
                        {selectedCell.center[1].toFixed(3)}°, {selectedCell.center[0].toFixed(3)}°
                      </span>
                    </div>
                    {selectedCell.stationInfluence !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Station Influence:</span>
                        <span className="text-white">{selectedCell.stationInfluence.toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedCell.utilizationLevel !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Utilization:</span>
                        <span className="text-white">{selectedCell.utilizationLevel.toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedCell.maritimeActivity !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maritime Activity:</span>
                        <span className="text-white">{selectedCell.maritimeActivity.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="opportunity" className="space-y-4 mt-4">
                  {selectedCell.opportunityScore ? (
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="text-xs text-gray-400">Overall Score</div>
                          <div className="text-2xl font-bold text-white">
                            {selectedCell.opportunityScore.overall}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <div className="text-xs text-gray-400">Category</div>
                          <Badge className={
                            selectedCell.opportunityScore.category === 'critical' ? 'bg-red-600' :
                            selectedCell.opportunityScore.category === 'high' ? 'bg-orange-600' :
                            selectedCell.opportunityScore.category === 'medium' ? 'bg-yellow-600' :
                            'bg-green-600'
                          }>
                            {selectedCell.opportunityScore.category.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Potential:</span>
                          <span className="text-white">${selectedCell.opportunityScore.marketPotential.toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Investment Required:</span>
                          <span className="text-white">${selectedCell.opportunityScore.investmentRequired.toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Expected ROI:</span>
                          <span className="text-white">{selectedCell.opportunityScore.roi.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time to Market:</span>
                          <span className="text-white">{selectedCell.opportunityScore.timeToMarket} months</span>
                        </div>
                      </div>

                      {selectedCell.opportunityScore.recommendations.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-300 mb-2">Recommendations</div>
                          <div className="space-y-1">
                            {selectedCell.opportunityScore.recommendations.slice(0, 3).map((rec, idx) => (
                              <div key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p>No opportunity data available</p>
                      <p className="text-xs">Land-based analysis only</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stations" className="space-y-4 mt-4">
                  {selectedCell.nearbyStations && selectedCell.nearbyStations.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium text-gray-300 mb-3">
                        Nearby Stations ({selectedCell.nearbyStations.length})
                      </div>
                      <div className="space-y-2">
                        {selectedCell.nearbyStations.slice(0, 5).map((station, idx) => (
                          <div key={idx} className="bg-gray-800/50 rounded-lg p-2">
                            <div className="text-sm font-medium text-white">{station.name}</div>
                            <div className="text-xs text-gray-400">
                              {station.country} • {station.operator}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Score: {station.overallScore} • 
                              Utilization: {station.actualUtilization ?? station.utilization}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p>No nearby stations</p>
                      <p className="text-xs">Extend search radius for more results</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
                Generating global coverage...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}