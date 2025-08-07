'use client';

import React, { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, ColumnLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Map as MapIcon, BarChart3, Activity, Search, X, ChevronLeft, ChevronRight, Target } from 'lucide-react';

// All 32 ground stations with sample data
const ALL_STATIONS = [
  // SES Stations
  { id: 'ses-betzdorf', name: 'Betzdorf', coordinates: [49.6847, 6.3501], country: 'Luxembourg', operator: 'SES', score: 92, revenue: 3500000, utilization: 85, type: 'Primary Teleport', capacity: 45 },
  { id: 'ses-manassas', name: 'Manassas VA', coordinates: [38.7509, -77.4753], country: 'USA', operator: 'SES', score: 89, revenue: 3200000, utilization: 82, type: 'Primary Teleport', capacity: 42 },
  { id: 'ses-woodbine', name: 'Woodbine MD', coordinates: [39.3365, -77.0647], country: 'USA', operator: 'SES', score: 87, revenue: 2800000, utilization: 78, type: 'Primary Teleport', capacity: 38 },
  { id: 'ses-vernon-valley', name: 'Vernon Valley NJ', coordinates: [41.2459, -74.4860], country: 'USA', operator: 'SES', score: 76, revenue: 2100000, utilization: 72, type: 'Teleport', capacity: 25 },
  { id: 'ses-hawley', name: 'Hawley PA', coordinates: [41.4764, -75.1807], country: 'USA', operator: 'SES', score: 74, revenue: 1950000, utilization: 69, type: 'Teleport', capacity: 22 },
  { id: 'ses-castle-rock', name: 'Castle Rock CO', coordinates: [39.3722, -104.8561], country: 'USA', operator: 'SES', score: 79, revenue: 2300000, utilization: 75, type: 'Teleport', capacity: 28 },
  { id: 'ses-brewster', name: 'Brewster WA', coordinates: [48.0976, -119.7806], country: 'USA', operator: 'SES', score: 72, revenue: 1800000, utilization: 67, type: 'Teleport', capacity: 20 },
  { id: 'ses-stockholm', name: 'Stockholm', coordinates: [59.3293, 18.0686], country: 'Sweden', operator: 'SES', score: 81, revenue: 2400000, utilization: 76, type: 'Regional', capacity: 30 },
  { id: 'ses-bucharest', name: 'Bucharest', coordinates: [44.4268, 26.1025], country: 'Romania', operator: 'SES', score: 77, revenue: 2000000, utilization: 71, type: 'Regional', capacity: 24 },
  { id: 'ses-munich', name: 'Munich', coordinates: [48.1351, 11.5820], country: 'Germany', operator: 'SES', score: 83, revenue: 2500000, utilization: 79, type: 'Regional', capacity: 32 },
  { id: 'ses-gibraltar', name: 'Gibraltar', coordinates: [36.1408, -5.3536], country: 'Gibraltar', operator: 'SES', score: 78, revenue: 2200000, utilization: 73, type: 'Regional', capacity: 26 },
  { id: 'ses-napa', name: 'Napa CA', coordinates: [38.2975, -122.2869], country: 'USA', operator: 'SES', score: 75, revenue: 1900000, utilization: 70, type: 'Regional', capacity: 23 },
  { id: 'ses-perth', name: 'Perth', coordinates: [-31.9505, 115.8605], country: 'Australia', operator: 'SES', score: 85, revenue: 2800000, utilization: 81, type: 'O3b Gateway', capacity: 35 },
  { id: 'ses-hawaii', name: 'Hawaii', coordinates: [21.3099, -157.8581], country: 'USA', operator: 'SES', score: 82, revenue: 2600000, utilization: 77, type: 'O3b Gateway', capacity: 33 },
  { id: 'ses-brazil', name: 'Brazil Teleport', coordinates: [-23.5505, -46.6333], country: 'Brazil', operator: 'SES', score: 80, revenue: 2400000, utilization: 74, type: 'O3b Gateway', capacity: 29 },
  
  // Intelsat Stations
  { id: 'intelsat-riverside', name: 'Riverside CA', coordinates: [33.9533, -117.3962], country: 'USA', operator: 'Intelsat', score: 86, revenue: 3000000, utilization: 80, type: 'Primary Teleport', capacity: 40 },
  { id: 'intelsat-mountainside', name: 'Mountainside MD', coordinates: [39.6837, -77.3644], country: 'USA', operator: 'Intelsat', score: 88, revenue: 3100000, utilization: 83, type: 'Primary Teleport', capacity: 41 },
  { id: 'intelsat-atlanta', name: 'Atlanta GA', coordinates: [33.7490, -84.3880], country: 'USA', operator: 'Intelsat', score: 84, revenue: 2700000, utilization: 78, type: 'Primary Teleport', capacity: 36 },
  { id: 'intelsat-fuchsstadt', name: 'Fuchsstadt', coordinates: [50.1069, 10.0339], country: 'Germany', operator: 'Intelsat', score: 81, revenue: 2500000, utilization: 76, type: 'Primary Teleport', capacity: 31 },
  { id: 'intelsat-kumsan', name: 'Kumsan', coordinates: [36.1036, 127.4897], country: 'South Korea', operator: 'Intelsat', score: 79, revenue: 2300000, utilization: 73, type: 'Primary Teleport', capacity: 28 },
  { id: 'intelsat-hagerstown', name: 'Hagerstown MD', coordinates: [39.6418, -77.7200], country: 'USA', operator: 'Intelsat', score: 76, revenue: 2000000, utilization: 71, type: 'Teleport', capacity: 25 },
  { id: 'intelsat-leitchfield', name: 'Leitchfield KY', coordinates: [37.4803, -86.2942], country: 'USA', operator: 'Intelsat', score: 74, revenue: 1850000, utilization: 68, type: 'Teleport', capacity: 22 },
  { id: 'intelsat-lakeland', name: 'Lakeland FL', coordinates: [28.0395, -81.9498], country: 'USA', operator: 'Intelsat', score: 72, revenue: 1750000, utilization: 66, type: 'Teleport', capacity: 20 },
  { id: 'intelsat-denver', name: 'Denver CO', coordinates: [39.7392, -104.9903], country: 'USA', operator: 'Intelsat', score: 77, revenue: 2100000, utilization: 72, type: 'Teleport', capacity: 26 },
  { id: 'intelsat-fucino', name: 'Fucino', coordinates: [41.9773, 13.6001], country: 'Italy', operator: 'Intelsat', score: 78, revenue: 2200000, utilization: 74, type: 'Regional', capacity: 27 },
  { id: 'intelsat-goonhilly', name: 'Goonhilly', coordinates: [50.0481, -5.1817], country: 'UK', operator: 'Intelsat', score: 80, revenue: 2400000, utilization: 75, type: 'Regional', capacity: 30 },
  { id: 'intelsat-raisting', name: 'Raisting', coordinates: [47.9019, 11.1104], country: 'Germany', operator: 'Intelsat', score: 82, revenue: 2600000, utilization: 77, type: 'Regional', capacity: 32 },
  { id: 'intelsat-madley', name: 'Madley', coordinates: [52.0244, -2.9158], country: 'UK', operator: 'Intelsat', score: 75, revenue: 1950000, utilization: 70, type: 'Regional', capacity: 24 },
  { id: 'intelsat-eik', name: 'Eik', coordinates: [58.9738, 5.7581], country: 'Norway', operator: 'Intelsat', score: 73, revenue: 1800000, utilization: 68, type: 'Regional', capacity: 21 },
  { id: 'intelsat-buitenpost', name: 'Buitenpost', coordinates: [53.2519, 6.1353], country: 'Netherlands', operator: 'Intelsat', score: 79, revenue: 2300000, utilization: 73, type: 'Regional', capacity: 29 },
  { id: 'intelsat-ndu', name: 'Ndu', coordinates: [11.2342, 8.9064], country: 'Nigeria', operator: 'Intelsat', score: 69, revenue: 1500000, utilization: 62, type: 'Regional', capacity: 18 },
  { id: 'intelsat-south-africa', name: 'South Africa Hub', coordinates: [-26.2041, 28.0473], country: 'South Africa', operator: 'Intelsat', score: 71, revenue: 1650000, utilization: 64, type: 'Regional', capacity: 19 }
];

const INITIAL_VIEW_STATE = {
  longitude: -98,
  latitude: 39,
  zoom: 3.5,
  pitch: 45,
  bearing: 0,
  maxZoom: 20,
  minZoom: 2
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function EnhancedMapSimple() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [show3D, setShow3D] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!searchTerm) return ALL_STATIONS;
    const term = searchTerm.toLowerCase();
    return ALL_STATIONS.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.country.toLowerCase().includes(term) ||
      s.operator.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Station markers layer
  const stationLayer = new ScatterplotLayer({
    id: 'stations',
    data: filteredStations,
    getPosition: (d: any) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
    getRadius: (d: any) => {
      const baseRadius = d.type?.includes('Primary') ? 80000 : 50000;
      return baseRadius * Math.max(0.5, d.score / 100);
    },
    getFillColor: (d: any) => {
      // Color based on opportunity score
      if (d.score > 85) return [34, 197, 94, 200]; // green
      if (d.score > 75) return [250, 204, 21, 200]; // yellow
      if (d.score > 65) return [251, 146, 60, 200]; // orange
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
    radiusMinPixels: 6,
    radiusMaxPixels: 30,
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  });

  // Station labels
  const labelLayer = new TextLayer({
    id: 'station-labels',
    data: filteredStations,
    getPosition: (d: any) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
    getText: (d: any) => d.name,
    getSize: 12,
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
    data: ALL_STATIONS,
    getPosition: (d: any) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
    getWeight: (d: any) => d.score / 100,
    radiusPixels: 60,
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

  // 3D Column layer for utilization
  const columnLayer = show3D ? new ColumnLayer({
    id: 'utilization-columns',
    data: filteredStations,
    getPosition: (d: any) => [d.coordinates[1], d.coordinates[0]], // [lng, lat]
    getElevation: (d: any) => d.utilization * 1000, // Scale utilization to height
    getFillColor: (d: any) => {
      // Color based on utilization
      if (d.utilization > 80) return [34, 197, 94, 180]; // green
      if (d.utilization > 70) return [250, 204, 21, 180]; // yellow
      if (d.utilization > 60) return [251, 146, 60, 180]; // orange
      return [239, 68, 68, 180]; // red
    },
    getLineColor: [255, 255, 255, 100],
    lineWidthMinPixels: 1,
    radius: 25000,
    pickable: true,
    stroked: true,
    extruded: true,
    wireframe: false,
    onClick: (info: any) => {
      if (info.object) {
        setSelectedStation(info.object);
      }
    },
    coordinateSystem: viewMode === 'globe' ? COORDINATE_SYSTEM.LNGLAT : COORDINATE_SYSTEM.DEFAULT
  }) : null;

  const layers = [
    heatmapLayer,
    show3D ? columnLayer : stationLayer,
    !show3D ? labelLayer : null
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
    const avgScore = ALL_STATIONS.reduce((sum, s) => sum + s.score, 0) / ALL_STATIONS.length;
    const totalRevenue = ALL_STATIONS.reduce((sum, s) => sum + s.revenue, 0);
    const avgUtilization = ALL_STATIONS.reduce((sum, s) => sum + s.utilization, 0) / ALL_STATIONS.length;
    const highScore = ALL_STATIONS.filter(s => s.score > 80).length;
    const totalCapacity = ALL_STATIONS.reduce((sum, s) => sum + s.capacity, 0);
    
    return {
      total: ALL_STATIONS.length,
      highScore,
      avgScore: avgScore.toFixed(1),
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
      avgUtilization: avgUtilization.toFixed(1),
      totalCapacity: totalCapacity.toFixed(0)
    };
  }, []);

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
            mapStyle={MAP_STYLE}
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
              variant={show3D ? 'default' : 'outline'}
              onClick={() => setShow3D(!show3D)}
              className="text-xs"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              3D Columns
            </Button>
            <Button
              size="sm"
              variant={showHeatmap ? 'default' : 'outline'}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-xs"
            >
              <Activity className="w-4 h-4 mr-1" />
              Heatmap
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
                <h3 className="text-lg font-semibold text-white">Stations ({filteredStations.length})</h3>
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
                    key={station.id}
                    onClick={() => setSelectedStation(station)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedStation?.id === station.id
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
                        station.score > 85 ? 'default' :
                        station.score > 75 ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {station.score}
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
        <div className="absolute top-20 right-4 z-10 w-80">
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
                    Score
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {selectedStation.score}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">
                    Utilization
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {selectedStation.utilization}%
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Revenue:</span>
                    <span className="text-white font-medium">
                      ${(selectedStation.revenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{selectedStation.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{selectedStation.capacity} Gbps</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Panel - Network KPIs */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="p-3">
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs">Total Stations</div>
                <div className="text-white font-bold text-lg">{networkStats.total}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">High Score (&gt;80)</div>
                <div className="text-green-500 font-bold text-lg">{networkStats.highScore}</div>
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
        </Card>
      </div>
    </div>
  );
}