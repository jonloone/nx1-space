'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { MapView, _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, ArcLayer, ColumnLayer, IconLayer } from '@deck.gl/layers';
import { ScreenGridLayer, HeatmapLayer, GridLayer } from '@deck.gl/aggregation-layers';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Activity,
  TrendingUp,
  DollarSign,
  Target,
  Satellite,
  X,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  MapPin
} from 'lucide-react';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';
import { isLandSimple, isCoastalArea, getLandCoverageForBounds } from '@/lib/land-water-detection';

// MapLibre style with proper terrain support
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Alternative map styles
const ALTERNATIVE_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Initial view state centered on US
const INITIAL_VIEW_STATE = {
  longitude: -98,
  latitude: 39,
  zoom: 4,
  pitch: 45,
  bearing: 0,
  maxPitch: 85,
  minZoom: 2,
  maxZoom: 16
};

// Analysis modes
type AnalysisMode = 'utilization' | 'profit' | 'revenue' | 'opportunities';

// View modes
type ViewMode = 'isometric' | 'terrain' | 'globe';

// Generate opportunity grid data with land detection
function generateOpportunityGrid(existingStations: PrecomputedStationScore[]) {
  const gridData = [];
  const gridSize = 1; // 1 degree grid
  
  // Create grid covering main regions
  for (let lat = -60; lat <= 70; lat += gridSize) {
    for (let lon = -180; lon <= 180; lon += gridSize) {
      // Skip extreme latitudes
      if ((lat < -60) || (lat > 70)) continue;
      
      // Only process land areas where ground stations can be built
      if (!isLandSimple(lat, lon)) {
        continue; // Skip water areas
      }
      
      // Calculate opportunity score based on various factors
      const nearestStation = existingStations.reduce((min, station) => {
        const dist = Math.sqrt(
          Math.pow(station.coordinates[0] - lat, 2) + 
          Math.pow(station.coordinates[1] - lon, 2)
        );
        return dist < min.dist ? { dist, station } : min;
      }, { dist: Infinity, station: null as any });
      
      // Score based on distance from existing stations (higher score for farther locations)
      const distanceScore = Math.min(nearestStation.dist / 10, 1) * 40;
      
      // Coastal bonus (coastal areas are often good for satellite ground stations)
      const coastalBonus = isCoastalArea(lat, lon) ? 15 : 0;
      
      // Latitude factor (mid-latitudes are generally better for GEO coverage)
      const latitudeFactor = (1 - Math.abs(lat) / 90) * 20;
      
      // Simulate other factors (in real scenario, these would be actual data)
      const gdpScore = (Math.random() * 0.7 + 0.3) * 20; // Weighted towards higher values
      const populationScore = (Math.random() * 0.6 + 0.2) * 15;
      const infrastructureScore = (Math.random() * 0.5 + 0.3) * 10;
      
      const totalScore = distanceScore + coastalBonus + latitudeFactor + 
                        gdpScore + populationScore + infrastructureScore;
      
      // Only show locations with significant opportunity
      if (totalScore > 35) {
        gridData.push({
          position: [lon, lat],
          weight: Math.min(totalScore, 100),
          distanceToNearest: nearestStation.dist,
          isCoastal: coastalBonus > 0,
          factors: {
            distance: distanceScore,
            coastal: coastalBonus,
            latitude: latitudeFactor,
            gdp: gdpScore,
            population: populationScore,
            infrastructure: infrastructureScore
          }
        });
      }
    }
  }
  
  return gridData;
}

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

export function EnhancedMapFinal() {
  const mapRef = useRef<any>(null);
  
  // Core state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('opportunities');
  const [viewMode, setViewMode] = useState<ViewMode>('isometric');
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<any>(null);
  
  // UI state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>(['SES', 'Intelsat']);
  const [satelliteViewEnabled, setSatelliteViewEnabled] = useState(false);
  
  // Settings state
  const [lightingPreset, setLightingPreset] = useState<keyof typeof LIGHTING_PRESETS>('day');
  const [terrainExaggeration, setTerrainExaggeration] = useState(1.5);
  const [labelDensity, setLabelDensity] = useState(50);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [qualityMode, setQualityMode] = useState<'performance' | 'quality'>('quality');
  
  // Combine all scores
  const allScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);
  
  // Generate opportunity grid
  const opportunityGrid = useMemo(() => {
    return generateOpportunityGrid(allScores);
  }, [allScores]);
  
  // Filter stations
  const filteredStations = useMemo(() => {
    let filtered = allScores;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.country.toLowerCase().includes(term)
      );
    }
    
    if (selectedOperators.length > 0 && selectedOperators.length < 2) {
      filtered = filtered.filter(s => selectedOperators.includes(s.operator));
    }
    
    return filtered;
  }, [allScores, searchTerm, selectedOperators]);
  
  // Auto-select view mode based on analysis mode
  useEffect(() => {
    if (satelliteViewEnabled) {
      setViewMode('globe');
      return;
    }
    
    switch (analysisMode) {
      case 'utilization':
      case 'profit':
        setViewMode('isometric');
        setViewState(prev => ({ ...prev, pitch: 45, bearing: -30 }));
        break;
      case 'revenue':
        setViewMode('isometric');
        setViewState(prev => ({ ...prev, pitch: 30, bearing: 0 }));
        break;
      case 'opportunities':
        setViewMode('terrain');
        setViewState(prev => ({ ...prev, pitch: 60, bearing: 0 }));
        break;
    }
  }, [analysisMode, satelliteViewEnabled]);
  
  // Setup 3D terrain when map loads
  useEffect(() => {
    if (mapRef.current && viewMode === 'terrain') {
      const map = mapRef.current.getMap();
      
      // Add proper terrain source with Terrarium RGB encoding
      if (!map.getSource('terrain')) {
        map.addSource('terrain', {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          tileSize: 256,
          encoding: 'terrarium',
          maxzoom: 14
        });
        
        // Add hillshade layer for better terrain visualization
        if (!map.getLayer('hillshade')) {
          map.addLayer({
            id: 'hillshade',
            type: 'hillshade',
            source: 'terrain',
            paint: {
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#000000',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#8B7355' // Brown earth tone
            }
          }, 'waterway'); // Add before waterway layer if it exists
        }
      }
      
      // Set the terrain with proper exaggeration
      map.setTerrain({
        source: 'terrain',
        exaggeration: terrainExaggeration
      });
      
      // Add sky layer for atmosphere
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      }
    }
  }, [viewMode, terrainExaggeration]);
  
  // Create lighting effect
  const lightingEffect = useMemo(() => {
    const preset = LIGHTING_PRESETS[lightingPreset];
    const lights = [
      new DirectionalLight({
        ...preset.sun,
        direction: preset.sun.position
      }),
      new AmbientLight(preset.ambient)
    ];
    
    if (qualityMode === 'quality') {
      lights.push(new CameraLight({
        color: [255, 255, 255],
        intensity: 0.2
      }));
    }
    
    return new LightingEffect({ lights });
  }, [lightingPreset, qualityMode]);
  
  // Get station color based on analysis mode
  const getStationColor = useCallback((station: PrecomputedStationScore) => {
    switch (analysisMode) {
      case 'utilization':
        if (station.utilization > 80) return [34, 197, 94, 220];
        if (station.utilization > 60) return [250, 204, 21, 220];
        if (station.utilization > 40) return [251, 146, 60, 220];
        return [239, 68, 68, 220];
      
      case 'profit':
        if (station.profitMargin > 30) return [34, 197, 94, 220];
        if (station.profitMargin > 15) return [250, 204, 21, 220];
        if (station.profitMargin > 0) return [251, 146, 60, 220];
        return [239, 68, 68, 220];
      
      case 'revenue':
        const maxRevenue = 10000000;
        const intensity = Math.min(station.monthlyRevenue / maxRevenue, 1);
        return [
          Math.floor(100 + 155 * intensity),
          Math.floor(100 + 100 * intensity),
          Math.floor(255 - 155 * intensity),
          220
        ];
      
      case 'opportunities':
        if (station.overallScore > 80) return [147, 51, 234, 220];
        if (station.overallScore > 60) return [59, 130, 246, 220];
        if (station.overallScore > 40) return [34, 197, 94, 220];
        return [156, 163, 175, 220];
      
      default:
        return [100, 100, 100, 220];
    }
  }, [analysisMode]);
  
  // Get station height for 3D columns
  const getStationHeight = useCallback((station: PrecomputedStationScore) => {
    const multiplier = viewMode === 'isometric' ? 8000 : 5000;
    
    switch (analysisMode) {
      case 'utilization':
        return Math.max(station.utilization * multiplier, multiplier * 0.1);
      case 'profit':
        return Math.max((station.profitMargin + 50) * multiplier * 0.02, multiplier * 0.1);
      case 'revenue':
        return Math.max((station.monthlyRevenue / 100000) * multiplier * 0.1, multiplier * 0.1);
      case 'opportunities':
        return Math.max(station.overallScore * multiplier * 0.01, multiplier * 0.1);
      default:
        return multiplier * 0.5;
    }
  }, [analysisMode, viewMode]);
  
  // Get station label
  const getStationLabel = useCallback((station: PrecomputedStationScore) => {
    switch (analysisMode) {
      case 'utilization':
        return `${station.name} - ${station.utilization}%`;
      case 'profit':
        return `${station.name} - ${station.profitMargin}%`;
      case 'revenue':
        return `${station.name} - $${(station.monthlyRevenue / 1000000).toFixed(1)}M`;
      case 'opportunities':
        return `${station.name} - ${station.priority}`;
      default:
        return station.name;
    }
  }, [analysisMode]);
  
  // Determine which stations should show labels
  const stationsWithLabels = useMemo(() => {
    const sorted = [...filteredStations].sort((a, b) => {
      switch (analysisMode) {
        case 'utilization':
          return b.utilization - a.utilization;
        case 'profit':
          return b.profitMargin - a.profitMargin;
        case 'revenue':
          return b.monthlyRevenue - a.monthlyRevenue;
        case 'opportunities':
          return b.overallScore - a.overallScore;
        default:
          return 0;
      }
    });
    
    const numLabels = Math.floor((labelDensity / 100) * sorted.length);
    return new Set(sorted.slice(0, Math.max(numLabels, 5)).map(s => s.stationId));
  }, [filteredStations, analysisMode, labelDensity]);
  
  // Create layers
  const layers = useMemo(() => {
    const baseLayers = [];
    
    // Screen grid layer for opportunities mode - only over land
    if (analysisMode === 'opportunities' && viewMode !== 'globe') {
      baseLayers.push(
        new ScreenGridLayer({
          id: 'opportunity-grid',
          data: opportunityGrid,
          getPosition: (d: any) => d.position,
          getWeight: (d: any) => d.weight,
          cellSizePixels: qualityMode === 'quality' ? 25 : 40,
          colorRange: [
            [26, 152, 80, 100],   // Green (low opportunity)
            [102, 189, 99, 140],  // Light green
            [166, 217, 106, 180], // Yellow-green
            [217, 239, 139, 220], // Light yellow
            [254, 224, 139, 240], // Yellow
            [253, 174, 97, 250],  // Orange
            [244, 109, 67, 250],  // Red-orange
            [215, 48, 39, 250]    // Red (high opportunity)
          ],
          opacity: 0.7,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedGridCell(info.object);
            }
          }
        })
      );
    }
    
    // 3D Columns for isometric view
    if ((analysisMode === 'utilization' || analysisMode === 'profit') && viewMode === 'isometric') {
      baseLayers.push(
        new ColumnLayer({
          id: 'station-columns',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
          diskResolution: qualityMode === 'quality' ? 12 : 6,
          radius: 30000,
          extruded: true,
          getElevation: getStationHeight,
          getFillColor: getStationColor,
          getLineColor: [255, 255, 255, 100],
          lineWidthMinPixels: 2,
          pickable: true,
          onClick: (info: any) => setSelectedStation(info.object),
          material: {
            ambient: 0.35,
            diffuse: 0.6,
            shininess: 40,
            specularColor: [255, 255, 255]
          },
          transitions: animationsEnabled ? {
            getElevation: { duration: 500, type: 'spring' },
            getFillColor: { duration: 300 }
          } : undefined
        })
      );
      
      // Performance rings
      baseLayers.push(
        new ScatterplotLayer({
          id: 'performance-rings',
          data: filteredStations,
          getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
          getRadius: 40000,
          getFillColor: [0, 0, 0, 0],
          getLineColor: (d: PrecomputedStationScore) => {
            const metric = analysisMode === 'utilization' ? d.utilization : d.profitMargin;
            if (metric > 70) return [34, 197, 94, 150];
            if (metric > 40) return [250, 204, 21, 150];
            return [239, 68, 68, 150];
          },
          lineWidthMinPixels: 3,
          stroked: true,
          filled: false
        })
      );
    }
    
    // Station points (all modes)
    baseLayers.push(
      new ScatterplotLayer({
        id: 'stations',
        data: filteredStations,
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        getRadius: (d: PrecomputedStationScore) => {
          if (analysisMode === 'revenue') {
            return Math.sqrt(d.monthlyRevenue / 1000) * 100;
          }
          return d.type?.includes('Primary') ? 60000 : 40000;
        },
        getFillColor: getStationColor,
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        pickable: true,
        onClick: (info: any) => setSelectedStation(info.object),
        radiusMinPixels: 5,
        radiusMaxPixels: analysisMode === 'revenue' ? 50 : 30,
        transitions: animationsEnabled ? {
          getRadius: { duration: 300 },
          getFillColor: { duration: 300 }
        } : undefined
      })
    );
    
    // Station status icons
    if (viewMode !== 'globe' && qualityMode === 'quality') {
      baseLayers.push(
        new IconLayer({
          id: 'station-icons',
          data: filteredStations.filter(s => s.priority === 'critical' || s.priority === 'high'),
          getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
          getIcon: (d: PrecomputedStationScore) => {
            if (d.priority === 'critical') return 'marker-warning';
            if (d.priority === 'high') return 'marker-alert';
            return 'marker';
          },
          getSize: 20,
          iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
          iconMapping: {
            'marker': { x: 0, y: 0, width: 128, height: 128 },
            'marker-warning': { x: 128, y: 0, width: 128, height: 128 },
            'marker-alert': { x: 0, y: 128, width: 128, height: 128 }
          },
          sizeScale: 1,
          pickable: false
        })
      );
    }
    
    // Station labels
    baseLayers.push(
      new TextLayer({
        id: 'station-labels',
        data: filteredStations.filter(s => stationsWithLabels.has(s.stationId)),
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        getText: getStationLabel,
        getSize: 14,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        billboard: true,
        fontSettings: {
          sdf: true,
          fontSize: 128,
          buffer: 4
        },
        outlineWidth: 2,
        outlineColor: [0, 0, 0, 255],
        transitions: animationsEnabled ? {
          getColor: { duration: 300 }
        } : undefined
      })
    );
    
    return baseLayers;
  }, [
    filteredStations,
    analysisMode,
    viewMode,
    qualityMode,
    animationsEnabled,
    stationsWithLabels,
    getStationColor,
    getStationHeight,
    getStationLabel,
    opportunityGrid
  ]);
  
  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);
  
  // Calculate network stats
  const networkStats = useMemo(() => {
    const criticalCount = filteredStations.filter(s => s.priority === 'critical').length;
    const highCount = filteredStations.filter(s => s.priority === 'high').length;
    const avgScore = filteredStations.reduce((sum, s) => sum + s.overallScore, 0) / filteredStations.length || 0;
    const totalRevenue = filteredStations.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const avgUtilization = filteredStations.reduce((sum, s) => sum + s.utilization, 0) / filteredStations.length || 0;
    const revenueUpside = filteredStations.reduce((sum, s) => sum + (s.optimizedMonthlyRevenue - s.monthlyRevenue), 0);
    
    return {
      total: filteredStations.length,
      critical: criticalCount,
      high: highCount,
      avgScore: avgScore.toFixed(1),
      totalRevenue: (totalRevenue / 1000000).toFixed(1),
      avgUtilization: avgUtilization.toFixed(1),
      revenueUpside: (revenueUpside / 1000000).toFixed(1)
    };
  }, [filteredStations]);
  
  return (
    <div className="relative w-full h-full bg-black">
      {/* Map Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        views={viewMode === 'globe' ? new GlobeView() : new MapView()}
      >
        {viewMode !== 'globe' && (
          <Map 
            ref={mapRef}
            mapStyle={MAP_STYLE}
            mapLib={import('maplibre-gl')}
            terrain={viewMode === 'terrain' ? { exaggeration: terrainExaggeration } : undefined}
          />
        )}
      </DeckGL>
      
      {/* Top Bar - Minimal Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Search Bar */}
        <div className="pointer-events-auto">
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm p-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 h-8 bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
              />
            </div>
          </Card>
        </div>
        
        {/* Settings Button */}
        <div className="pointer-events-auto">
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button 
                size="sm"
                variant="ghost"
                className="bg-gray-900/90 border border-gray-700 backdrop-blur-sm hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-gray-900 border-gray-700 text-white w-96">
              <SheetHeader>
                <SheetTitle className="text-white">Settings</SheetTitle>
              </SheetHeader>
              
              <Tabs defaultValue="view" className="mt-6">
                <TabsList className="bg-gray-800">
                  <TabsTrigger value="view">View</TabsTrigger>
                  <TabsTrigger value="lighting">Lighting</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="view" className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-400">Terrain Exaggeration</Label>
                    <Slider
                      value={[terrainExaggeration]}
                      onValueChange={([v]) => setTerrainExaggeration(v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-400">Label Density: {labelDensity}%</Label>
                    <Slider
                      value={[labelDensity]}
                      onValueChange={([v]) => setLabelDensity(v)}
                      max={100}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations" className="text-xs text-gray-400">Animations</Label>
                    <Switch
                      id="animations"
                      checked={animationsEnabled}
                      onCheckedChange={setAnimationsEnabled}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="lighting" className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-400">Lighting Preset</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {Object.keys(LIGHTING_PRESETS).map((preset) => (
                        <Button
                          key={preset}
                          size="sm"
                          variant={lightingPreset === preset ? 'default' : 'outline'}
                          onClick={() => setLightingPreset(preset as keyof typeof LIGHTING_PRESETS)}
                          className="text-xs"
                        >
                          {preset === 'dawn' && <Sunrise className="w-3 h-3" />}
                          {preset === 'day' && <Sun className="w-3 h-3" />}
                          {preset === 'dusk' && <Sunset className="w-3 h-3" />}
                          {preset === 'night' && <Moon className="w-3 h-3" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="performance" className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-400">Quality Mode</Label>
                    <Select value={qualityMode} onValueChange={(v: any) => setQualityMode(v)}>
                      <SelectTrigger className="mt-2 bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Left Panel - Analysis Controls */}
      <div className={`absolute top-20 left-4 z-10 transition-all duration-300 ${leftPanelOpen ? 'w-72' : 'w-12'}`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm h-[calc(100vh-200px)] overflow-hidden">
          {leftPanelOpen ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white">Analysis</h3>
                <button onClick={() => setLeftPanelOpen(false)} className="text-gray-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              
              {/* Analysis Mode Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  size="sm"
                  variant={analysisMode === 'utilization' ? 'default' : 'outline'}
                  onClick={() => setAnalysisMode('utilization')}
                  className="text-xs h-8"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Utilization
                </Button>
                <Button
                  size="sm"
                  variant={analysisMode === 'profit' ? 'default' : 'outline'}
                  onClick={() => setAnalysisMode('profit')}
                  className="text-xs h-8"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Profit
                </Button>
                <Button
                  size="sm"
                  variant={analysisMode === 'revenue' ? 'default' : 'outline'}
                  onClick={() => setAnalysisMode('revenue')}
                  className="text-xs h-8"
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Revenue
                </Button>
                <Button
                  size="sm"
                  variant={analysisMode === 'opportunities' ? 'default' : 'outline'}
                  onClick={() => setAnalysisMode('opportunities')}
                  className="text-xs h-8"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Opportunities
                </Button>
              </div>
              
              {/* Filters */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs text-gray-400">Operators</Label>
                  <div className="flex gap-2 mt-1">
                    {['SES', 'Intelsat'].map(op => (
                      <div key={op} className="flex items-center space-x-1">
                        <Checkbox 
                          id={op}
                          checked={selectedOperators.includes(op)}
                          onCheckedChange={(checked) => {
                            setSelectedOperators(checked 
                              ? [...selectedOperators, op]
                              : selectedOperators.filter(o => o !== op)
                            );
                          }}
                        />
                        <label htmlFor={op} className="text-xs text-white">{op}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="satellite" className="text-xs text-gray-400">Satellite View</Label>
                  <Switch
                    id="satellite"
                    checked={satelliteViewEnabled}
                    onCheckedChange={setSatelliteViewEnabled}
                  />
                </div>
              </div>
              
              {/* Enhanced Legend */}
              <div className="mt-auto pt-4 border-t border-gray-700">
                <h4 className="text-xs text-gray-400 mb-2">
                  Legend - {analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)}
                </h4>
                
                {analysisMode === 'opportunities' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-300">Existing Stations</div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-xs text-gray-400">Excellent (80+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs text-gray-400">Good (60-80)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-400">Moderate (40-60)</span>
                    </div>
                    <div className="text-xs text-gray-300 mt-2">Opportunity Heat Map</div>
                    <div className="h-4 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                )}
                
                {(analysisMode === 'utilization' || analysisMode === 'profit') && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-xs text-gray-300">Excellent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      <span className="text-xs text-gray-300">Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded" />
                      <span className="text-xs text-gray-300">Fair</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded" />
                      <span className="text-xs text-gray-300">Poor</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Height = {analysisMode === 'utilization' ? 'Utilization %' : 'Profit Margin'}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Stations:</span>
                    <span className="text-white">{networkStats.total}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg Score:</span>
                    <span className="text-white">{networkStats.avgScore}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Critical:</span>
                    <span className="text-red-500">{networkStats.critical}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="w-full h-full flex items-center justify-center text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </Card>
      </div>
      
      {/* Station Details Panel */}
      {selectedStation && (
        <div className="absolute top-20 right-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedStation.name}</h3>
                  <p className="text-sm text-gray-400">{selectedStation.operator} • {selectedStation.country}</p>
                </div>
                <button onClick={() => setSelectedStation(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400">Utilization</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    {selectedStation.utilization}%
                    {selectedStation.utilization > 70 && <ArrowUp className="w-3 h-3 text-green-500" />}
                    {selectedStation.utilization < 40 && <ArrowDown className="w-3 h-3 text-red-500" />}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400">Profit Margin</div>
                  <div className="text-lg font-bold text-white flex items-center gap-1">
                    {selectedStation.profitMargin}%
                    {selectedStation.profitMargin > 20 && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {selectedStation.profitMargin < 10 && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Revenue:</span>
                  <span className="text-white font-medium">${(selectedStation.monthlyRevenue / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Optimization Potential:</span>
                  <span className="text-green-400 font-medium">
                    +${((selectedStation.optimizedMonthlyRevenue - selectedStation.monthlyRevenue) / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority:</span>
                  <Badge variant={
                    selectedStation.priority === 'critical' ? 'destructive' :
                    selectedStation.priority === 'high' ? 'default' :
                    'secondary'
                  }>
                    {selectedStation.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {selectedStation.opportunities && selectedStation.opportunities.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Opportunities</div>
                  {selectedStation.opportunities.slice(0, 2).map((opp, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-start gap-1 mb-1">
                      <Zap className="w-3 h-3 text-yellow-500 mt-0.5" />
                      <span>{opp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* Opportunity Grid Cell Details */}
      {selectedGridCell && analysisMode === 'opportunities' && (
        <div className="absolute top-20 right-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Opportunity Location</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedGridCell.position[1].toFixed(2)}°, {selectedGridCell.position[0].toFixed(2)}°
                    {selectedGridCell.isCoastal && <span className="text-xs text-blue-400 ml-1">• Coastal</span>}
                  </p>
                </div>
                <button onClick={() => setSelectedGridCell(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-gray-800/50 rounded p-3 mb-3">
                <div className="text-xs text-gray-400 mb-1">Opportunity Score</div>
                <div className="text-2xl font-bold text-white">{selectedGridCell.weight.toFixed(0)}/100</div>
                <div className="text-xs text-gray-400 mt-1">
                  {selectedGridCell.distanceToNearest.toFixed(0)}° from nearest station
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Location Analysis</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Coverage gap score:</span>
                    <span className="text-white">{selectedGridCell.factors.distance.toFixed(0)}</span>
                  </div>
                  {selectedGridCell.factors.coastal && selectedGridCell.factors.coastal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Coastal advantage:</span>
                      <span className="text-white">{selectedGridCell.factors.coastal.toFixed(0)}</span>
                    </div>
                  )}
                  {selectedGridCell.factors.latitude && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Latitude factor:</span>
                      <span className="text-white">{selectedGridCell.factors.latitude.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Economic potential:</span>
                    <span className="text-white">{selectedGridCell.factors.gdp.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Population density:</span>
                    <span className="text-white">{selectedGridCell.factors.population.toFixed(0)}</span>
                  </div>
                  {selectedGridCell.factors.infrastructure && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Infrastructure:</span>
                      <span className="text-white">{selectedGridCell.factors.infrastructure.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                <Button size="sm" className="w-full text-xs">
                  Add to Shortlist
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Bottom Panel - Network Intelligence */}
      <div className={`absolute bottom-4 left-4 right-4 z-10 transition-all duration-300`}>
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="p-3">
            {bottomPanelOpen ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-white">Network Intelligence</h3>
                  <button onClick={() => setBottomPanelOpen(false)} className="text-gray-400 hover:text-white text-xs">
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Stations</div>
                    <div className="text-white font-bold">{networkStats.total}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Avg Score</div>
                    <div className="text-white font-bold">{networkStats.avgScore}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Critical</div>
                    <div className="text-red-500 font-bold">{networkStats.critical}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">High Priority</div>
                    <div className="text-orange-500 font-bold">{networkStats.high}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Total Revenue</div>
                    <div className="text-green-400 font-bold">${networkStats.totalRevenue}M</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Revenue Upside</div>
                    <div className="text-blue-400 font-bold">+${networkStats.revenueUpside}M</div>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setBottomPanelOpen(true)} className="w-full text-center text-gray-400 hover:text-white text-sm">
                Show Network Intelligence
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}