'use client';

import React, { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, LineLayer, ArcLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Map as MapIcon, BarChart3, Activity, Filter, Search, X, ChevronLeft, ChevronRight, Target, TrendingUp, DollarSign } from 'lucide-react';
import { ALL_REAL_STATIONS } from '@/lib/data/real-ground-stations';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

const INITIAL_VIEW_STATE = {
  longitude: -98,
  latitude: 39,
  zoom: 3.5,
  pitch: 0,
  bearing: 0,
  maxZoom: 20,
  minZoom: 2
};

export function EnhancedMapDeck() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFlows, setShowFlows] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // Combine all scores
  const allScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!searchTerm) return allScores;
    const term = searchTerm.toLowerCase();
    return allScores.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.country.toLowerCase().includes(term) ||
      s.operator.toLowerCase().includes(term)
    );
  }, [allScores, searchTerm]);

  // Create connections between stations for flow visualization
  const stationFlows = useMemo(() => {
    const flows = [];
    // Create strategic connections between major hubs
    const majorHubs = allScores.filter(s => s.type?.includes('Primary'));
    for (let i = 0; i < majorHubs.length; i++) {
      for (let j = i + 1; j < majorHubs.length; j++) {
        if (majorHubs[i].operator === majorHubs[j].operator) {
          flows.push({
            source: majorHubs[i].coordinates,
            target: majorHubs[j].coordinates,
            value: (majorHubs[i].overallScore + majorHubs[j].overallScore) / 2,
            operator: majorHubs[i].operator
          });
        }
      }
    }
    return flows;
  }, [allScores]);

  // Station markers layer
  const stationLayer = new ScatterplotLayer({
    id: 'stations',
    data: filteredStations,
    getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d: PrecomputedStationScore) => {
      const baseRadius = d.type?.includes('Primary') ? 100000 : 60000;
      return baseRadius * Math.max(0.5, d.overallScore / 100);
    },
    getFillColor: (d: PrecomputedStationScore) => {
      // Color based on opportunity score
      if (d.overallScore > 80) return [34, 197, 94, 200]; // green
      if (d.overallScore > 60) return [250, 204, 21, 200]; // yellow
      if (d.overallScore > 40) return [251, 146, 60, 200]; // orange
      return [239, 68, 68, 200]; // red
    },
    getLineColor: [255, 255, 255, 255],
    lineWidthMinPixels: 2,
    stroked: true,
    pickable: true,
    onClick: (info: any) => {
      if (info.object) {
        setSelectedStation(info.object);
      }
    },
    radiusScale: 1,
    radiusMinPixels: 5,
    radiusMaxPixels: 40,
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  });

  // Station labels
  const labelLayer = new TextLayer({
    id: 'station-labels',
    data: filteredStations,
    getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]],
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
    outlineColor: [0, 0, 0, 255],
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  });

  // Heatmap layer
  const heatmapLayer = showHeatmap ? new HeatmapLayer({
    id: 'heatmap',
    data: allScores,
    getPosition: (d: PrecomputedStationScore) => [d.coordinates[1], d.coordinates[0]],
    getWeight: (d: PrecomputedStationScore) => d.overallScore / 100,
    radiusPixels: 80,
    intensity: 1,
    threshold: 0.05,
    colorRange: [
      [255, 0, 0, 0],
      [255, 0, 0, 128],
      [255, 255, 0, 128],
      [0, 255, 0, 128],
      [0, 255, 0, 255]
    ],
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  }) : null;

  // Flow connections layer
  const flowLayer = showFlows ? new ArcLayer({
    id: 'flows',
    data: stationFlows,
    getSourcePosition: (d: any) => [d.source[1], d.source[0]],
    getTargetPosition: (d: any) => [d.target[1], d.target[0]],
    getSourceColor: (d: any) => d.operator === 'SES' ? [59, 130, 246, 100] : [147, 51, 234, 100],
    getTargetColor: (d: any) => d.operator === 'SES' ? [59, 130, 246, 100] : [147, 51, 234, 100],
    getWidth: (d: any) => Math.max(2, d.value / 20),
    getHeight: 0.5,
    pickable: false,
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  }) : null;

  const layers = [
    heatmapLayer,
    flowLayer,
    stationLayer,
    labelLayer
  ].filter(Boolean);

  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);

  const toggleViewMode = () => {
    setViewMode(mode => {
      const newMode = mode === 'map' ? 'globe' : 'map';
      if (newMode === 'globe') {
        setViewState(prev => ({
          ...prev,
          zoom: 0,
          pitch: 0,
          bearing: 0
        }));
      } else {
        setViewState(INITIAL_VIEW_STATE);
      }
      return newMode;
    });
  };

  // Calculate network stats
  const networkStats = useMemo(() => {
    const criticalCount = allScores.filter(s => s.priority === 'critical').length;
    const highCount = allScores.filter(s => s.priority === 'high').length;
    const avgScore = allScores.reduce((sum, s) => sum + s.overallScore, 0) / allScores.length;
    const totalRevenue = allScores.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const avgUtilization = allScores.reduce((sum, s) => sum + s.utilization, 0) / allScores.length;
    
    return {
      total: allScores.length,
      critical: criticalCount,
      high: highCount,
      avgScore: avgScore.toFixed(1),
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
      avgUtilization: avgUtilization.toFixed(1)
    };
  }, [allScores]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Map Container */}
      {viewMode === 'globe' ? (
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          views={new GlobeView()}
        />
      ) : (
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          views={new MapView()}
        >
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
          />
        </DeckGL>
      )}

      {/* Top Control Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 p-2">
            <Button
              size="sm"
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={toggleViewMode}
              className="text-xs"
            >
              {viewMode === 'map' ? <MapIcon className="w-4 h-4 mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
              {viewMode === 'map' ? '2D Map' : '3D Globe'}
            </Button>
            <Button
              size="sm"
              variant={showHeatmap ? 'default' : 'outline'}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-xs"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
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
              onClick={() => setViewState(INITIAL_VIEW_STATE)}
              className="text-xs"
            >
              Reset View
            </Button>
          </div>
        </Card>
      </div>

      {/* Left Panel - Filters and Station List */}
      <div className={`absolute top-20 left-4 z-10 transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-12'}`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm h-[calc(100vh-200px)] overflow-hidden">
          {leftPanelOpen ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Stations</h3>
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search stations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredStations.map(station => (
                  <div
                    key={station.stationId}
                    onClick={() => setSelectedStation(station)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStation?.stationId === station.stationId
                        ? 'bg-blue-900/50 border border-blue-500'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">{station.name}</div>
                        <div className="text-xs text-gray-400">{station.operator} • {station.country}</div>
                      </div>
                      <Badge variant={
                        station.priority === 'critical' ? 'destructive' :
                        station.priority === 'high' ? 'default' :
                        'secondary'
                      } className="text-xs">
                        {station.overallScore.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                ))}
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
      {selectedStation && (
        <div className="absolute top-20 right-4 z-10 w-96">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm max-h-[calc(100vh-200px)] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-white">{selectedStation.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedStation.operator} • {selectedStation.country} • {selectedStation.type}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
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
                    <TrendingUp className="w-3 h-3" />
                    Priority
                  </div>
                  <div className={`text-lg font-bold ${
                    selectedStation.priority === 'critical' ? 'text-red-500' :
                    selectedStation.priority === 'high' ? 'text-orange-500' :
                    selectedStation.priority === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {selectedStation.priority.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Financial Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Revenue:</span>
                    <span className="text-white font-medium">
                      ${(selectedStation.monthlyRevenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Optimized Revenue:</span>
                    <span className="text-green-400 font-medium">
                      ${(selectedStation.optimizedMonthlyRevenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit Margin:</span>
                    <span className="text-white">{selectedStation.profitMargin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual ROI:</span>
                    <span className="text-white">{selectedStation.annualROI}%</span>
                  </div>
                </div>
              </div>

              {/* Operational Metrics */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Operational Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Utilization:</span>
                    <span className="text-white">{selectedStation.utilization}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{selectedStation.capacityGbps} Gbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Efficiency:</span>
                    <span className="text-white">
                      {(selectedStation.operationalConstraints?.utilizationEfficiency * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">C/I Ratio:</span>
                    <span className="text-white">
                      {selectedStation.interferenceImpact?.cToIRatio.toFixed(1)} dB
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Recommendation */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Investment Recommendation</div>
                <div className={`text-lg font-bold ${
                  selectedStation.investmentRecommendation === 'excellent' ? 'text-green-500' :
                  selectedStation.investmentRecommendation === 'good' ? 'text-blue-500' :
                  selectedStation.investmentRecommendation === 'moderate' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {selectedStation.investmentRecommendation.toUpperCase()}
                </div>
              </div>

              {/* Opportunities */}
              {selectedStation.opportunities && selectedStation.opportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Opportunities</h4>
                  <div className="space-y-1">
                    {selectedStation.opportunities.slice(0, 3).map((opp, idx) => (
                      <div key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                        <span className="text-green-400">•</span>
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Panel - Network KPIs */}
      <div className={`absolute bottom-4 left-4 right-4 z-10 transition-all duration-300`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="p-3">
            {bottomPanelOpen ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-white">Network Performance</h3>
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
                    <div className="text-red-500 font-bold text-lg">{networkStats.critical}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">High Priority</div>
                    <div className="text-orange-500 font-bold text-lg">{networkStats.high}</div>
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
              </div>
            ) : (
              <button
                onClick={() => setBottomPanelOpen(true)}
                className="w-full text-center text-gray-400 hover:text-white text-sm py-1"
              >
                Show Network Stats
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}