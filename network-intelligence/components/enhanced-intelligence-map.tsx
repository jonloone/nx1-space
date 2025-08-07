'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import { DeckGL } from '@deck.gl/react';
import type { ViewState } from 'react-map-gl/maplibre';
import { ScatterplotLayer, ColumnLayer, TextLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer } from '@deck.gl/layers';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Map as MapIcon, 
  BarChart3, 
  Activity, 
  Filter, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  TrendingUp, 
  DollarSign,
  Settings,
  Layers,
  MapPin,
  Building2,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Users,
  Calendar,
  Gauge
} from 'lucide-react';
import { ALL_REAL_STATIONS } from '@/lib/data/real-ground-stations';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

// MapLibre style for the base map
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: -98,
  latitude: 39,
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

const GLOBE_VIEW_STATE: ViewState = {
  longitude: 0,
  latitude: 20,
  zoom: 0,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

type AnalysisMode = 'utilization' | 'profit' | 'revenue' | 'opportunities';
type ViewMode = '2d' | '3d';

interface FilterState {
  searchQuery: string;
  operators: string[];
  priorities: string[];
  countries: string[];
  utilizationRange: [number, number];
  scoreRange: [number, number];
}

export function EnhancedIntelligenceMap() {
  // Core state
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('utilization');
  
  // Panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  
  // Layer visibility
  const [showHeightmap, setShowHeightmap] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFlows, setShowFlows] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    operators: [],
    priorities: [],
    countries: [],
    utilizationRange: [0, 100],
    scoreRange: [0, 100]
  });

  // Combine all station scores
  const allStationScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);

  // Filter options
  const filterOptions = useMemo(() => {
    const operators = Array.from(new Set(allStationScores.map(s => s.operator))).sort();
    const priorities = Array.from(new Set(allStationScores.map(s => s.priority))).sort();
    const countries = Array.from(new Set(allStationScores.map(s => s.country))).sort();
    
    return { operators, priorities, countries };
  }, [allStationScores]);

  // Filtered stations
  const filteredStations = useMemo(() => {
    return allStationScores.filter(station => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches = 
          station.name.toLowerCase().includes(query) ||
          station.country.toLowerCase().includes(query) ||
          station.operator.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Operator filter
      if (filters.operators.length > 0 && !filters.operators.includes(station.operator)) {
        return false;
      }

      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(station.priority)) {
        return false;
      }

      // Country filter
      if (filters.countries.length > 0 && !filters.countries.includes(station.country)) {
        return false;
      }

      // Utilization range
      const utilization = station.actualUtilization ?? station.utilization;
      if (utilization < filters.utilizationRange[0] || 
          utilization > filters.utilizationRange[1]) {
        return false;
      }

      // Score range
      if (station.overallScore < filters.scoreRange[0] || 
          station.overallScore > filters.scoreRange[1]) {
        return false;
      }

      return true;
    });
  }, [allStationScores, filters]);

  // Get value for analysis mode
  const getAnalysisValue = useCallback((station: PrecomputedStationScore) => {
    switch (analysisMode) {
      case 'utilization': return station.actualUtilization ?? station.utilization;
      case 'profit': return station.profitMargin;
      case 'revenue': return station.monthlyRevenue / 1000000; // Convert to millions
      case 'opportunities': return station.overallScore;
      default: return station.actualUtilization ?? station.utilization;
    }
  }, [analysisMode]);

  // Get color for analysis mode
  const getAnalysisColor = useCallback((station: PrecomputedStationScore) => {
    const value = getAnalysisValue(station);
    const normalized = analysisMode === 'revenue' ? 
      Math.min(value / 10, 1) : // Revenue cap at 10M for color scaling
      value / 100; // Other metrics are percentages or scores

    // Priority-based base color
    let baseColor: [number, number, number] = [156, 163, 175]; // gray
    if (station.priority === 'critical') baseColor = [220, 38, 127]; // pink
    else if (station.priority === 'high') baseColor = [251, 146, 60]; // orange
    else if (station.priority === 'medium') baseColor = [34, 197, 94]; // green

    // Intensity based on analysis value
    const intensity = Math.max(0.4, normalized);
    return [
      Math.floor(baseColor[0] * intensity),
      Math.floor(baseColor[1] * intensity),
      Math.floor(baseColor[2] * intensity),
      200
    ] as [number, number, number, number];
  }, [getAnalysisValue, analysisMode]);

  // Create deck.gl layers
  const layers = useMemo(() => {
    const layerList: any[] = [];

    // 3D Column layer for heightmap visualization
    if (showHeightmap && viewMode === '2d') {
      layerList.push(
        new ColumnLayer({
          id: 'station-heights',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
          getElevation: (d: PrecomputedStationScore) => {
            const value = getAnalysisValue(d);
            const baseHeight = analysisMode === 'revenue' ? value * 100000 : value * 10000;
            return Math.max(50000, baseHeight);
          },
          getFillColor: getAnalysisColor,
          getLineColor: [255, 255, 255, 100],
          elevationScale: 1,
          radius: 25000,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedStation(info.object);
              setRightPanelOpen(true);
            }
          }
        })
      );
    }

    // Standard scatter plot for 3D globe mode or when heightmap is disabled
    if (viewMode === '3d' || !showHeightmap) {
      layerList.push(
        new ScatterplotLayer({
          id: 'stations-scatter',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
          getRadius: (d: PrecomputedStationScore) => {
            const baseRadius = viewState.zoom * 20000;
            const valueMultiplier = Math.max(0.5, getAnalysisValue(d) / 100);
            return baseRadius * valueMultiplier;
          },
          getFillColor: getAnalysisColor,
          getLineColor: [255, 255, 255, 200],
          getLineWidth: 2000,
          stroked: true,
          filled: true,
          radiusMinPixels: 8,
          radiusMaxPixels: 40,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedStation(info.object);
              setRightPanelOpen(true);
            }
          }
        })
      );
    }

    // Station labels
    if (showLabels && viewState.zoom > 4) {
      layerList.push(
        new TextLayer({
          id: 'station-labels',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
          getText: (d: PrecomputedStationScore) => d.name,
          getSize: 14,
          getColor: [255, 255, 255, 255],
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'top',
          billboard: true,
          pickable: false,
          fontSettings: {
            sdf: true,
            fontSize: 128,
            buffer: 4
          },
          outlineWidth: 2,
          outlineColor: [0, 0, 0, 255]
        })
      );
    }

    // Heatmap layer
    if (showHeatmap) {
      layerList.push(
        new HeatmapLayer({
          id: 'opportunity-heatmap',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
          getWeight: (d: PrecomputedStationScore) => getAnalysisValue(d) / 100,
          radiusPixels: 100,
          intensity: 2,
          threshold: 0.05,
          colorRange: [
            [178, 34, 34, 0],     // Dark red, transparent
            [255, 69, 0, 128],    // Orange red
            [255, 140, 0, 180],   // Dark orange
            [255, 215, 0, 220],   // Gold
            [255, 255, 255, 255]  // White
          ]
        })
      );
    }

    // Flow connections between stations
    if (showFlows) {
      const flows = [];
      const majorStations = filteredStations
        .filter(s => s.priority === 'critical' || s.priority === 'high')
        .slice(0, 20); // Limit flows for performance
      
      for (let i = 0; i < majorStations.length; i++) {
        for (let j = i + 1; j < majorStations.length; j++) {
          if (majorStations[i].operator === majorStations[j].operator) {
            flows.push({
              source: [majorStations[i].coordinates[1], majorStations[i].coordinates[0]],
              target: [majorStations[j].coordinates[1], majorStations[j].coordinates[0]],
              value: (majorStations[i].overallScore + majorStations[j].overallScore) / 2,
              operator: majorStations[i].operator
            });
          }
        }
      }

      if (flows.length > 0) {
        layerList.push(
          new ArcLayer({
            id: 'station-flows',
            data: flows,
            getSourcePosition: (d: any) => d.source,
            getTargetPosition: (d: any) => d.target,
            getSourceColor: (d: any) => d.operator === 'SES' ? [59, 130, 246, 100] : [147, 51, 234, 100],
            getTargetColor: (d: any) => d.operator === 'SES' ? [59, 130, 246, 100] : [147, 51, 234, 100],
            getWidth: (d: any) => Math.max(2, d.value / 20),
            getHeight: 0.3,
            pickable: false
          })
        );
      }
    }

    return layerList;
  }, [filteredStations, viewState.zoom, viewMode, showHeightmap, showLabels, showHeatmap, showFlows, getAnalysisValue, getAnalysisColor]);

  // Handle view state changes
  const handleViewStateChange = useCallback((params: any) => {
    setViewState(params.viewState);
  }, []);

  // Handle view mode toggle
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === '2d' ? '3d' : '2d';
    setViewMode(newMode);
    
    if (newMode === '3d') {
      setViewState(GLOBE_VIEW_STATE);
      setShowHeightmap(false); // Disable heightmap in 3D mode
    } else {
      setViewState(INITIAL_VIEW_STATE);
      setShowHeightmap(true); // Enable heightmap in 2D mode
    }
  }, [viewMode]);

  // Network statistics
  const networkStats = useMemo(() => {
    const total = filteredStations.length;
    const criticalCount = filteredStations.filter(s => s.priority === 'critical').length;
    const highCount = filteredStations.filter(s => s.priority === 'high').length;
    const avgScore = filteredStations.reduce((sum, s) => sum + s.overallScore, 0) / total;
    const totalRevenue = filteredStations.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const avgUtilization = filteredStations.reduce((sum, s) => sum + (s.actualUtilization ?? s.utilization), 0) / total;
    const topOpportunities = [...filteredStations]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);
    
    return {
      total,
      critical: criticalCount,
      high: highCount,
      avgScore: avgScore.toFixed(1),
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
      avgUtilization: avgUtilization.toFixed(1),
      topOpportunities
    };
  }, [filteredStations]);

  // Update filters
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Main map container */}
      <div className="absolute inset-0">
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          views={viewMode === '3d' ? new GlobeView() : undefined}
          getTooltip={({ object }) => {
            if (!object) return null;
            return {
              html: `
                <div class="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm max-w-64">
                  <div class="font-semibold text-blue-400">${object.name}</div>
                  <div class="text-gray-300">${object.country} • ${object.operator}</div>
                  <div class="mt-2 space-y-1">
                    <div class="text-xs text-gray-400">
                      ${analysisMode === 'utilization' ? 'Utilization' : 
                        analysisMode === 'profit' ? 'Profit Margin' :
                        analysisMode === 'revenue' ? 'Monthly Revenue' : 'Opportunity Score'}: 
                      <span class="text-white ml-1">
                        ${analysisMode === 'revenue' ? 
                          '$' + (object.monthlyRevenue / 1000000).toFixed(1) + 'M' :
                          getAnalysisValue(object).toFixed(1) + '%'
                        }
                      </span>
                    </div>
                    <div class="text-xs text-gray-400">Priority: <span class="text-white capitalize">${object.priority}</span></div>
                  </div>
                </div>
              `,
              style: { zIndex: '1000' }
            };
          }}
        >
          {viewMode === '2d' && (
            <Map
              mapStyle={MAP_STYLE}
              attributionControl={false}
              reuseMaps
            />
          )}
        </DeckGL>
      </div>

      {/* Top control bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 p-2">
            <Button
              size="sm"
              variant={viewMode === '2d' ? 'default' : 'outline'}
              onClick={toggleViewMode}
              className="text-xs"
            >
              {viewMode === '2d' ? <MapIcon className="w-4 h-4 mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
              {viewMode === '2d' ? '2D Map' : '3D Globe'}
            </Button>
            <Button
              size="sm"
              variant={showHeightmap ? 'default' : 'outline'}
              onClick={() => setShowHeightmap(!showHeightmap)}
              className="text-xs"
              disabled={viewMode === '3d'}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Heights
            </Button>
            <Button
              size="sm"
              variant={showHeatmap ? 'default' : 'outline'}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-xs"
            >
              <Layers className="w-4 h-4 mr-1" />
              Heatmap
            </Button>
            <Button
              size="sm"
              variant={showFlows ? 'default' : 'outline'}
              onClick={() => setShowFlows(!showFlows)}
              className="text-xs"
            >
              <Activity className="w-4 h-4 mr-1" />
              Flows
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewState(viewMode === '3d' ? GLOBE_VIEW_STATE : INITIAL_VIEW_STATE)}
              className="text-xs"
            >
              Reset View
            </Button>
          </div>
        </Card>
      </div>

      {/* Left Panel - Analysis & Filters */}
      <div className={`absolute top-16 left-4 z-20 transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-12'}`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm h-[calc(100vh-180px)] overflow-hidden">
          {leftPanelOpen ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Analysis Control</h3>
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              
              {/* Analysis Mode Selector */}
              <div className="mb-4">
                <Label className="text-sm text-gray-300 mb-2">Analysis Mode</Label>
                <Select value={analysisMode} onValueChange={(value: AnalysisMode) => setAnalysisMode(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="utilization">Utilization Analysis</SelectItem>
                    <SelectItem value="profit">Profit Analysis</SelectItem>
                    <SelectItem value="revenue">Revenue Analysis</SelectItem>
                    <SelectItem value="opportunities">Opportunities Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-gray-700 mb-4" />

              {/* Search */}
              <div className="mb-4">
                <Label className="text-sm text-gray-300 mb-2">Search Stations</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search stations..."
                    value={filters.searchQuery}
                    onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Operator Filter */}
                <div>
                  <Label className="text-sm text-gray-300 mb-2">Operators</Label>
                  <div className="space-y-2">
                    {filterOptions.operators.map(operator => (
                      <div key={operator} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`operator-${operator}`}
                          checked={filters.operators.includes(operator)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFilters({ operators: [...filters.operators, operator] });
                            } else {
                              updateFilters({ operators: filters.operators.filter(o => o !== operator) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`operator-${operator}`} className="text-sm text-gray-300">{operator}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <Label className="text-sm text-gray-300 mb-2">Priority</Label>
                  <div className="space-y-2">
                    {filterOptions.priorities.map(priority => (
                      <div key={priority} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`priority-${priority}`}
                          checked={filters.priorities.includes(priority)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFilters({ priorities: [...filters.priorities, priority] });
                            } else {
                              updateFilters({ priorities: filters.priorities.filter(p => p !== priority) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`priority-${priority}`} className="text-sm text-gray-300 capitalize">{priority}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Utilization Range */}
                <div>
                  <Label className="text-sm text-gray-300 mb-2">
                    Utilization Range: {filters.utilizationRange[0]}% - {filters.utilizationRange[1]}%
                  </Label>
                  <Slider
                    value={filters.utilizationRange}
                    onValueChange={(value) => updateFilters({ utilizationRange: value as [number, number] })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Score Range */}
                <div>
                  <Label className="text-sm text-gray-300 mb-2">
                    Score Range: {filters.scoreRange[0]} - {filters.scoreRange[1]}
                  </Label>
                  <Slider
                    value={filters.scoreRange}
                    onValueChange={(value) => updateFilters({ scoreRange: value as [number, number] })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Legend</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-600"></div>
                    <span className="text-gray-400">Critical Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-400">High Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-400">Medium Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-gray-400">Low Priority</span>
                  </div>
                </div>
              </div>
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

      {/* Right Panel - Station Details */}
      {rightPanelOpen && selectedStation && (
        <div className="absolute top-16 right-4 z-20 w-96">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm max-h-[calc(100vh-180px)] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-white">{selectedStation.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedStation.operator} • {selectedStation.country} • {selectedStation.type}
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
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Target className="w-3 h-3" />
                        Overall Score
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {selectedStation.overallScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Gauge className="w-3 h-3" />
                        Utilization
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {selectedStation.actualUtilization ?? selectedStation.utilization}%
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div>
                    <Badge className={
                      selectedStation.priority === 'critical' ? 'bg-pink-600 text-pink-100' :
                      selectedStation.priority === 'high' ? 'bg-orange-500 text-orange-100' :
                      selectedStation.priority === 'medium' ? 'bg-green-500 text-green-100' :
                      'bg-gray-500 text-gray-100'
                    }>
                      {selectedStation.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Revenue:</span>
                      <span className="text-white font-medium">
                        ${(selectedStation.monthlyRevenue / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacity:</span>
                      <span className="text-white">{selectedStation.capacityGbps} Gbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual ROI:</span>
                      <span className="text-white">{selectedStation.annualROI}%</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Monthly Revenue</div>
                      <div className="text-xl font-bold text-green-400">
                        ${(selectedStation.monthlyRevenue / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Optimized: ${((selectedStation.optimizedMonthlyRevenue ?? selectedStation.monthlyRevenue) / 1000000).toFixed(2)}M
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Profit Margin</div>
                        <div className="text-lg font-bold text-white">
                          {selectedStation.profitMargin}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Annual ROI</div>
                        <div className="text-lg font-bold text-white">
                          {selectedStation.annualROI}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-2">Revenue Opportunity</div>
                      <Progress 
                        value={((selectedStation.optimizedMonthlyRevenue ?? selectedStation.monthlyRevenue) / selectedStation.monthlyRevenue - 1) * 100} 
                        className="w-full" 
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {(((selectedStation.optimizedMonthlyRevenue ?? selectedStation.monthlyRevenue) / selectedStation.monthlyRevenue - 1) * 100).toFixed(1)}% increase potential
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Capacity</div>
                        <div className="text-lg font-bold text-white">
                          {selectedStation.capacityGbps} Gbps
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                        <div className="text-lg font-bold text-white">
                          {((selectedStation.operationalConstraints?.utilizationEfficiency ?? 0.85) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Utilization Breakdown */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-2">Utilization Breakdown</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Theoretical:</span>
                          <span className="text-white">{selectedStation.theoreticalUtilization ?? selectedStation.utilization}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Actual:</span>
                          <span className="text-white">{selectedStation.actualUtilization ?? selectedStation.utilization}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Capacity Loss:</span>
                          <span className="text-red-400">{selectedStation.capacityLossPercent ?? 15}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Interference Impact */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-2">Interference Assessment</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">C/I Ratio:</span>
                          <span className="text-white">
                            {(selectedStation.interferenceImpact?.cToIRatio ?? 25).toFixed(1)} dB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Service Quality:</span>
                          <span className={
                            (selectedStation.interferenceImpact?.serviceQualityImpact ?? 'minimal') === 'none' ? 'text-green-400' :
                            (selectedStation.interferenceImpact?.serviceQualityImpact ?? 'minimal') === 'minimal' ? 'text-yellow-400' :
                            (selectedStation.interferenceImpact?.serviceQualityImpact ?? 'minimal') === 'moderate' ? 'text-orange-400' :
                            'text-red-400'
                          }>
                            {selectedStation.interferenceImpact?.serviceQualityImpact ?? 'minimal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Panel - Network KPIs */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="p-3">
            {bottomPanelOpen ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-white">Network Intelligence Dashboard</h3>
                  <button
                    onClick={() => setBottomPanelOpen(false)}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Total Stations</div>
                    <div className="text-white font-bold text-lg">{networkStats.total}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Critical Priority</div>
                    <div className="text-pink-400 font-bold text-lg">{networkStats.critical}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">High Priority</div>
                    <div className="text-orange-400 font-bold text-lg">{networkStats.high}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Avg Score</div>
                    <div className="text-white font-bold text-lg">{networkStats.avgScore}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Total Revenue</div>
                    <div className="text-green-400 font-bold text-lg">${networkStats.totalRevenue}M</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Avg Utilization</div>
                    <div className="text-blue-400 font-bold text-lg">{networkStats.avgUtilization}%</div>
                  </div>
                </div>
                
                {/* Top Opportunities */}
                <Separator className="bg-gray-700 my-3" />
                <div>
                  <div className="text-sm font-semibold text-white mb-2">Top Opportunities</div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {networkStats.topOpportunities.map((station, idx) => (
                      <button
                        key={station.stationId}
                        onClick={() => {
                          setSelectedStation(station);
                          setRightPanelOpen(true);
                        }}
                        className="bg-gray-800/50 hover:bg-gray-700/50 rounded p-2 text-left transition-colors"
                      >
                        <div className="text-white font-medium">{station.name}</div>
                        <div className="text-gray-400">{station.country}</div>
                        <div className="text-green-400">Score: {station.overallScore.toFixed(0)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setBottomPanelOpen(true)}
                className="w-full text-center text-gray-400 hover:text-white text-sm py-1"
              >
                Show Network Intelligence Dashboard
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}