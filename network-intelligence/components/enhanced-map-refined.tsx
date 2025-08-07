'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { MapView, _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, ArcLayer, ColumnLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { DirectionalLight, AmbientLight, _CameraLight as CameraLight, LightingEffect } from '@deck.gl/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map as MapIcon, 
  Globe, 
  Layers, 
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Settings,
  X,
  TrendingUp,
  DollarSign,
  Activity,
  Target,
  Satellite,
  Filter
} from 'lucide-react';
import { ALL_REAL_STATIONS } from '@/lib/data/real-ground-stations';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: -98,
  latitude: 39,
  zoom: 4,
  pitch: 0,
  bearing: 0
};

// Analysis modes
type AnalysisMode = 'utilization' | 'profit' | 'revenue' | 'opportunities';

// Lighting presets
const LIGHTING_PRESETS = {
  dawn: { 
    sun: { position: [-0.8, -0.2, 0.3], color: [255, 200, 150], intensity: 0.6 },
    ambient: { color: [180, 190, 255], intensity: 0.3 }
  },
  day: { 
    sun: { position: [-0.5, -0.5, 1], color: [255, 250, 240], intensity: 0.8 },
    ambient: { color: [255, 255, 255], intensity: 0.4 }
  },
  dusk: { 
    sun: { position: [-0.9, -0.1, 0.2], color: [255, 180, 120], intensity: 0.5 },
    ambient: { color: [150, 160, 200], intensity: 0.35 }
  },
  night: { 
    sun: { position: [-0.3, -0.3, 0.5], color: [200, 210, 255], intensity: 0.3 },
    ambient: { color: [100, 120, 180], intensity: 0.25 }
  }
};

export function EnhancedMapRefined() {
  // Core state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('utilization');
  const [isGlobeView, setIsGlobeView] = useState(false);
  const [show3DColumns, setShow3DColumns] = useState(false);
  
  // Panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [lightingControlsOpen, setLightingControlsOpen] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>(['SES', 'Intelsat']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [utilizationRange, setUtilizationRange] = useState([0, 100]);
  const [profitFilter, setProfitFilter] = useState('all');
  const [satelliteViewEnabled, setSatelliteViewEnabled] = useState(false);
  
  // Lighting state
  const [lightingPreset, setLightingPreset] = useState<keyof typeof LIGHTING_PRESETS>('day');
  const [sunAngle, setSunAngle] = useState(45);
  const [sunElevation, setSunElevation] = useState(45);
  const [ambientIntensity, setAmbientIntensity] = useState(0.4);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);

  // Combine all scores
  const allScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);

  // Filter stations
  const filteredStations = useMemo(() => {
    let filtered = allScores;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.country.toLowerCase().includes(term)
      );
    }
    
    // Operator filter
    if (selectedOperators.length > 0) {
      filtered = filtered.filter(s => selectedOperators.includes(s.operator));
    }
    
    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(s => selectedPriorities.includes(s.priority));
    }
    
    // Utilization range filter (only in utilization mode)
    if (analysisMode === 'utilization') {
      filtered = filtered.filter(s => 
        s.utilization >= utilizationRange[0] && 
        s.utilization <= utilizationRange[1]
      );
    }
    
    // Profit filter (only in profit mode)
    if (analysisMode === 'profit' && profitFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (profitFilter === 'positive') return s.profitMargin > 0;
        if (profitFilter === 'negative') return s.profitMargin <= 0;
        return true;
      });
    }
    
    return filtered;
  }, [allScores, searchTerm, selectedOperators, selectedPriorities, utilizationRange, profitFilter, analysisMode]);

  // Create lighting effect
  const lightingEffect = useMemo(() => {
    const preset = LIGHTING_PRESETS[lightingPreset];
    const sunLight = new DirectionalLight({
      ...preset.sun,
      direction: [
        Math.cos(sunAngle * Math.PI / 180) * Math.cos(sunElevation * Math.PI / 180),
        Math.sin(sunAngle * Math.PI / 180) * Math.cos(sunElevation * Math.PI / 180),
        Math.sin(sunElevation * Math.PI / 180)
      ]
    });
    
    const ambientLight = new AmbientLight({
      ...preset.ambient,
      intensity: ambientIntensity
    });
    
    const cameraLight = new CameraLight({
      color: [255, 255, 255],
      intensity: 0.2
    });
    
    return new LightingEffect({ sunLight, ambientLight, cameraLight });
  }, [lightingPreset, sunAngle, sunElevation, ambientIntensity]);

  // Get color based on analysis mode
  const getStationColor = useCallback((station: PrecomputedStationScore) => {
    switch (analysisMode) {
      case 'utilization':
        if (station.utilization > 80) return [34, 197, 94, 200];
        if (station.utilization > 60) return [250, 204, 21, 200];
        if (station.utilization > 40) return [251, 146, 60, 200];
        return [239, 68, 68, 200];
      
      case 'profit':
        if (station.profitMargin > 30) return [34, 197, 94, 200];
        if (station.profitMargin > 15) return [250, 204, 21, 200];
        if (station.profitMargin > 0) return [251, 146, 60, 200];
        return [239, 68, 68, 200];
      
      case 'revenue':
        const maxRevenue = 10000000; // 10M
        const intensity = Math.min(station.monthlyRevenue / maxRevenue, 1);
        return [
          Math.floor(255 * (1 - intensity)),
          Math.floor(255 * intensity),
          100,
          200
        ];
      
      case 'opportunities':
        if (station.overallScore > 80) return [34, 197, 94, 200];
        if (station.overallScore > 60) return [250, 204, 21, 200];
        if (station.overallScore > 40) return [251, 146, 60, 200];
        return [239, 68, 68, 200];
      
      default:
        return [100, 100, 100, 200];
    }
  }, [analysisMode]);

  // Get height based on analysis mode
  const getStationHeight = useCallback((station: PrecomputedStationScore) => {
    switch (analysisMode) {
      case 'utilization':
        return station.utilization * 5000;
      case 'profit':
        return Math.max(0, station.profitMargin) * 10000;
      case 'revenue':
        return (station.monthlyRevenue / 100000) * 1000;
      case 'opportunities':
        return station.overallScore * 3000;
      default:
        return 50000;
    }
  }, [analysisMode]);

  // Create layers
  const layers = useMemo(() => {
    const baseLayers = [];

    // 3D Columns layer (when enabled)
    if (show3DColumns && !isGlobeView) {
      baseLayers.push(
        new ColumnLayer({
          id: 'station-columns',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
          diskResolution: 12,
          radius: 30000,
          extruded: true,
          getElevation: getStationHeight,
          getFillColor: getStationColor,
          pickable: true,
          onClick: (info: any) => setSelectedStation(info.object),
          material: {
            ambient: 0.35,
            diffuse: 0.6,
            shininess: 40,
            specularColor: [255, 255, 255]
          },
          lightSettings: shadowsEnabled ? {
            lightsPosition: [-0.5, -0.5, 1],
            ambientRatio: 0.4,
            diffuseRatio: 0.6,
            specularRatio: 0.2,
            lightsStrength: [0.8, 0.0, 0.8, 0.0],
            numberOfLights: 2
          } : undefined
        })
      );
    }

    // Station points layer
    baseLayers.push(
      new ScatterplotLayer({
        id: 'stations',
        data: filteredStations,
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        getRadius: (d: PrecomputedStationScore) => {
          const baseRadius = d.type?.includes('Primary') ? 80000 : 50000;
          return baseRadius;
        },
        getFillColor: getStationColor,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        pickable: true,
        onClick: (info: any) => setSelectedStation(info.object),
        radiusMinPixels: 5,
        radiusMaxPixels: 30
      })
    );

    // Station labels
    baseLayers.push(
      new TextLayer({
        id: 'station-labels',
        data: filteredStations,
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        getText: (d: PrecomputedStationScore) => d.name,
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'top',
        billboard: true,
        fontSettings: {
          sdf: true,
          fontSize: 128,
          buffer: 4
        },
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 255]
      })
    );

    return baseLayers;
  }, [filteredStations, show3DColumns, isGlobeView, getStationColor, getStationHeight, shadowsEnabled]);

  // Handle satellite view toggle
  useEffect(() => {
    if (satelliteViewEnabled) {
      setIsGlobeView(true);
    }
  }, [satelliteViewEnabled]);

  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);

  // Toggle globe view
  const toggleGlobeView = useCallback(() => {
    setIsGlobeView(prev => {
      const newIsGlobe = !prev;
      if (newIsGlobe) {
        setViewState({
          ...INITIAL_VIEW_STATE,
          zoom: 0,
          pitch: 0,
          bearing: 0
        });
      } else {
        setViewState(INITIAL_VIEW_STATE);
      }
      return newIsGlobe;
    });
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Map Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        views={isGlobeView ? new GlobeView() : new MapView()}
      >
        {!isGlobeView && (
          <Map 
            mapStyle={MAP_STYLE}
            mapLib={import('maplibre-gl')}
          />
        )}
      </DeckGL>

      {/* Compact Control Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm px-2 py-1">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={!isGlobeView && !show3DColumns ? 'default' : 'ghost'}
              onClick={() => { setIsGlobeView(false); setShow3DColumns(false); }}
              className="h-7 px-2"
              title="2D Map"
            >
              <MapIcon className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={show3DColumns ? 'default' : 'ghost'}
              onClick={() => { setShow3DColumns(!show3DColumns); setIsGlobeView(false); }}
              className="h-7 px-2"
              title="3D Columns"
            >
              <Layers className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={isGlobeView ? 'default' : 'ghost'}
              onClick={toggleGlobeView}
              className="h-7 px-2"
              title="Globe View"
            >
              <Globe className="w-3 h-3" />
            </Button>
            <div className="w-px h-5 bg-gray-600 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewState(INITIAL_VIEW_STATE)}
              className="h-7 px-2"
              title="Reset View"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Left Panel - Analysis Controls */}
      <div className={`absolute top-20 left-4 z-10 transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-12'}`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm h-[calc(100vh-200px)] overflow-hidden">
          {leftPanelOpen ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Analysis Controls</h3>
                <button onClick={() => setLeftPanelOpen(false)} className="text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Analysis Mode Selector */}
              <div className="mb-4">
                <Label className="text-xs text-gray-400 mb-2">Analysis Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={analysisMode === 'utilization' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('utilization')}
                    className="text-xs"
                  >
                    <Activity className="w-3 h-3 mr-1" />
                    Utilization
                  </Button>
                  <Button
                    size="sm"
                    variant={analysisMode === 'profit' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('profit')}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Profit
                  </Button>
                  <Button
                    size="sm"
                    variant={analysisMode === 'revenue' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('revenue')}
                    className="text-xs"
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Revenue
                  </Button>
                  <Button
                    size="sm"
                    variant={analysisMode === 'opportunities' ? 'default' : 'outline'}
                    onClick={() => setAnalysisMode('opportunities')}
                    className="text-xs"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Opportunities
                  </Button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs text-gray-400">Operators</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ses"
                        checked={selectedOperators.includes('SES')}
                        onCheckedChange={(checked) => {
                          setSelectedOperators(checked 
                            ? [...selectedOperators, 'SES']
                            : selectedOperators.filter(o => o !== 'SES')
                          );
                        }}
                      />
                      <label htmlFor="ses" className="text-xs text-white">SES</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="intelsat"
                        checked={selectedOperators.includes('Intelsat')}
                        onCheckedChange={(checked) => {
                          setSelectedOperators(checked 
                            ? [...selectedOperators, 'Intelsat']
                            : selectedOperators.filter(o => o !== 'Intelsat')
                          );
                        }}
                      />
                      <label htmlFor="intelsat" className="text-xs text-white">Intelsat</label>
                    </div>
                  </div>
                </div>

                {/* Satellite View Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="satellite-view" className="text-xs text-gray-400">Satellite View</Label>
                  <Switch
                    id="satellite-view"
                    checked={satelliteViewEnabled}
                    onCheckedChange={setSatelliteViewEnabled}
                  />
                </div>

                {/* Mode-specific filters */}
                {analysisMode === 'utilization' && (
                  <div>
                    <Label className="text-xs text-gray-400">Utilization Range: {utilizationRange[0]}% - {utilizationRange[1]}%</Label>
                    <Slider
                      value={utilizationRange}
                      onValueChange={setUtilizationRange}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}

                {analysisMode === 'profit' && (
                  <div>
                    <Label className="text-xs text-gray-400">Profit Filter</Label>
                    <Select value={profitFilter} onValueChange={setProfitFilter}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="positive">Profitable</SelectItem>
                        <SelectItem value="negative">Loss-making</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search stations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-xs bg-gray-800 border-gray-700 text-white"
                />
              </div>

              {/* Dynamic Legend */}
              <div className="mt-auto pt-4 border-t border-gray-700">
                <h4 className="text-xs text-gray-400 mb-2">Legend - {analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)}</h4>
                <div className="space-y-1">
                  {analysisMode === 'utilization' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span className="text-xs text-gray-300">High (80-100%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span className="text-xs text-gray-300">Medium (60-80%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded" />
                        <span className="text-xs text-gray-300">Low (40-60%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-xs text-gray-300">Critical (0-40%)</span>
                      </div>
                    </>
                  )}
                  {analysisMode === 'profit' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span className="text-xs text-gray-300">High Margin (&gt;30%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span className="text-xs text-gray-300">Medium (15-30%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded" />
                        <span className="text-xs text-gray-300">Low (0-15%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-xs text-gray-300">Loss (&lt;0%)</span>
                      </div>
                    </>
                  )}
                  {analysisMode === 'revenue' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-green-500 rounded" />
                        <span className="text-xs text-gray-300">Revenue Scale</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-5">
                        Size = Revenue Amount
                      </div>
                    </>
                  )}
                  {analysisMode === 'opportunities' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span className="text-xs text-gray-300">Excellent (80-100)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span className="text-xs text-gray-300">Good (60-80)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded" />
                        <span className="text-xs text-gray-300">Moderate (40-60)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-xs text-gray-300">Poor (0-40)</span>
                      </div>
                    </>
                  )}
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

      {/* Lighting Controls */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          <div className="p-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLightingControlsOpen(!lightingControlsOpen)}
              className="h-7 px-2"
            >
              <Sun className="w-3 h-3 mr-1" />
              Lighting
            </Button>
          </div>
          {lightingControlsOpen && (
            <div className="p-3 border-t border-gray-700 space-y-3 w-64">
              <div>
                <Label className="text-xs text-gray-400">Preset</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <Button
                    size="sm"
                    variant={lightingPreset === 'dawn' ? 'default' : 'outline'}
                    onClick={() => setLightingPreset('dawn')}
                    className="h-6 px-1"
                    title="Dawn"
                  >
                    <Sunrise className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={lightingPreset === 'day' ? 'default' : 'outline'}
                    onClick={() => setLightingPreset('day')}
                    className="h-6 px-1"
                    title="Day"
                  >
                    <Sun className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={lightingPreset === 'dusk' ? 'default' : 'outline'}
                    onClick={() => setLightingPreset('dusk')}
                    className="h-6 px-1"
                    title="Dusk"
                  >
                    <Sunset className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={lightingPreset === 'night' ? 'default' : 'outline'}
                    onClick={() => setLightingPreset('night')}
                    className="h-6 px-1"
                    title="Night"
                  >
                    <Moon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-400">Sun Angle: {sunAngle}°</Label>
                <Slider
                  value={[sunAngle]}
                  onValueChange={([v]) => setSunAngle(v)}
                  max={360}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-400">Sun Elevation: {sunElevation}°</Label>
                <Slider
                  value={[sunElevation]}
                  onValueChange={([v]) => setSunElevation(v)}
                  max={90}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-400">Ambient: {(ambientIntensity * 100).toFixed(0)}%</Label>
                <Slider
                  value={[ambientIntensity * 100]}
                  onValueChange={([v]) => setAmbientIntensity(v / 100)}
                  max={100}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="shadows" className="text-xs text-gray-400">Shadows</Label>
                <Switch
                  id="shadows"
                  checked={shadowsEnabled}
                  onCheckedChange={setShadowsEnabled}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Station Details Panel (Right) */}
      {selectedStation && (
        <div className="absolute top-20 right-4 z-10 w-96">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedStation.name}</h3>
                  <p className="text-sm text-gray-400">{selectedStation.operator} • {selectedStation.country}</p>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">
                      {analysisMode === 'utilization' ? 'Utilization' :
                       analysisMode === 'profit' ? 'Profit Margin' :
                       analysisMode === 'revenue' ? 'Monthly Revenue' :
                       'Opportunity Score'}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {analysisMode === 'utilization' ? `${selectedStation.utilization}%` :
                       analysisMode === 'profit' ? `${selectedStation.profitMargin}%` :
                       analysisMode === 'revenue' ? `$${(selectedStation.monthlyRevenue / 1000000).toFixed(1)}M` :
                       selectedStation.overallScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Priority</div>
                    <Badge variant={
                      selectedStation.priority === 'critical' ? 'destructive' :
                      selectedStation.priority === 'high' ? 'default' :
                      'secondary'
                    }>
                      {selectedStation.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{selectedStation.capacityGbps} Gbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual ROI:</span>
                    <span className="text-white">{selectedStation.annualROI}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Efficiency:</span>
                    <span className="text-white">
                      {(selectedStation.operationalConstraints?.utilizationEfficiency * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Panel - Network KPIs */}
      <div className={`absolute bottom-4 left-4 right-4 z-10 transition-all duration-300`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="p-3">
            {bottomPanelOpen ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-white">Network Intelligence</h3>
                  <button
                    onClick={() => setBottomPanelOpen(false)}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Stations</div>
                    <div className="text-white font-bold">{filteredStations.length}/{allScores.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Avg {analysisMode}</div>
                    <div className="text-white font-bold">
                      {analysisMode === 'utilization' ? 
                        `${(filteredStations.reduce((sum, s) => sum + s.utilization, 0) / filteredStations.length).toFixed(0)}%` :
                       analysisMode === 'profit' ?
                        `${(filteredStations.reduce((sum, s) => sum + s.profitMargin, 0) / filteredStations.length).toFixed(0)}%` :
                       analysisMode === 'revenue' ?
                        `$${(filteredStations.reduce((sum, s) => sum + s.monthlyRevenue, 0) / filteredStations.length / 1000000).toFixed(1)}M` :
                        (filteredStations.reduce((sum, s) => sum + s.overallScore, 0) / filteredStations.length).toFixed(0)
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Critical</div>
                    <div className="text-red-500 font-bold">
                      {filteredStations.filter(s => s.priority === 'critical').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">High Priority</div>
                    <div className="text-orange-500 font-bold">
                      {filteredStations.filter(s => s.priority === 'high').length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Total Revenue</div>
                    <div className="text-green-400 font-bold">
                      ${(filteredStations.reduce((sum, s) => sum + s.monthlyRevenue, 0) / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Revenue Upside</div>
                    <div className="text-blue-400 font-bold">
                      ${(filteredStations.reduce((sum, s) => sum + (s.optimizedMonthlyRevenue - s.monthlyRevenue), 0) / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setBottomPanelOpen(true)}
                className="w-full text-center text-gray-400 hover:text-white text-sm"
              >
                Show Network Intelligence
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}