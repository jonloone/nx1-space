'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { DirectionalLight, AmbientLight, LightingEffect } from '@deck.gl/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Activity,
  TrendingUp,
  DollarSign,
  Target,
  X,
  AlertCircle,
  CheckCircle,
  Building2,
  Radar,
  Eye,
  EyeOff
} from 'lucide-react';

// Data imports
import { 
  ALL_PRECOMPUTED_SCORES, 
  PrecomputedStationScore 
} from '@/lib/data/precomputed-opportunity-scores';
import { 
  ALL_COMPETITOR_STATIONS, 
  CompetitorStation 
} from '@/lib/data/competitorStations';
import { 
  generateGroundStationOpportunities, 
  H3HexagonOpportunity 
} from '@/lib/services/h3GridService';

// Map style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Initial view state
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

// Opportunity types for color coding
type OpportunityType = 'EXPANSION' | 'OPTIMIZATION' | 'MARKETING' | 'RISK';

interface EnhancedCompetitiveMapProps {
  className?: string;
}

export function EnhancedCompetitiveMap({ className }: EnhancedCompetitiveMapProps) {
  // Core state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('opportunities');
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | CompetitorStation | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<H3HexagonOpportunity | null>(null);
  
  // Layer visibility
  const [showSESStations, setShowSESStations] = useState(true);
  const [showCompetitorStations, setShowCompetitorStations] = useState(true);
  const [showOpportunityHexagons, setShowOpportunityHexagons] = useState(true);
  const [showStationLabels, setShowStationLabels] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>([
    'SES', 'Intelsat', 'AWS Ground Station', 'SpaceX Starlink', 'Telesat', 'KSAT'
  ]);
  const [minOpportunityScore, setMinOpportunityScore] = useState(50);
  
  // Generate H3 opportunity data
  const opportunityData = useMemo(() => {
    const result = generateGroundStationOpportunities({
      resolutions: [5, 6], // Medium detail for good performance
      globalAnalysis: true,
      maxOpportunities: 500
    });
    
    return result.opportunityGrid.get(6) || []; // Use resolution 6 for display
  }, []);
  
  // Filter SES/Intelsat stations
  const filteredSESStations = useMemo(() => {
    let stations = ALL_PRECOMPUTED_SCORES;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      stations = stations.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.country.toLowerCase().includes(term) ||
        s.operator.toLowerCase().includes(term)
      );
    }
    
    if (selectedOperators.length > 0) {
      stations = stations.filter(s => selectedOperators.includes(s.operator));
    }
    
    return stations;
  }, [searchTerm, selectedOperators]);
  
  // Filter competitor stations
  const filteredCompetitorStations = useMemo(() => {
    let stations = ALL_COMPETITOR_STATIONS;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      stations = stations.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.country.toLowerCase().includes(term) ||
        s.operator.toLowerCase().includes(term)
      );
    }
    
    if (selectedOperators.length > 0) {
      stations = stations.filter(s => selectedOperators.includes(s.operator));
    }
    
    return stations;
  }, [searchTerm, selectedOperators]);
  
  // Filter opportunity hexagons
  const filteredOpportunities = useMemo(() => {
    return opportunityData.filter(opp => opp.overallScore >= minOpportunityScore);
  }, [opportunityData, minOpportunityScore]);
  
  // Create lighting effect
  const lightingEffect = useMemo(() => {
    return new LightingEffect({
      lights: [
        new DirectionalLight({
          color: [255, 255, 255],
          intensity: 0.8,
          direction: [-0.5, -0.5, 1]
        }),
        new AmbientLight({
          color: [255, 255, 255],
          intensity: 0.4
        })
      ]
    });
  }, []);
  
  // Get station color based on analysis mode and performance
  const getSESStationColor = useCallback((station: PrecomputedStationScore) => {
    // Add red border for critical stations
    const isCritical = station.priority === 'critical';
    
    switch (analysisMode) {
      case 'utilization':
        if (station.utilization > 80) return isCritical ? [255, 0, 0, 255] : [34, 197, 94, 220];
        if (station.utilization > 60) return isCritical ? [255, 100, 100, 255] : [250, 204, 21, 220];
        if (station.utilization > 40) return isCritical ? [255, 150, 150, 255] : [251, 146, 60, 220];
        return isCritical ? [255, 200, 200, 255] : [239, 68, 68, 220];
      
      case 'profit':
        if (station.profitMargin > 30) return isCritical ? [255, 0, 0, 255] : [34, 197, 94, 220];
        if (station.profitMargin > 15) return isCritical ? [255, 100, 100, 255] : [250, 204, 21, 220];
        if (station.profitMargin > 0) return isCritical ? [255, 150, 150, 255] : [251, 146, 60, 220];
        return isCritical ? [255, 200, 200, 255] : [239, 68, 68, 220];
      
      case 'revenue':
        const maxRevenue = 10000000;
        const intensity = Math.min(station.monthlyRevenue / maxRevenue, 1);
        const baseColor = [
          Math.floor(100 + 155 * intensity),
          Math.floor(100 + 100 * intensity),
          Math.floor(255 - 155 * intensity),
          220
        ];
        return isCritical ? [255, 0, 0, 255] : baseColor;
      
      case 'opportunities':
      default:
        if (station.overallScore > 80) return isCritical ? [255, 0, 0, 255] : [147, 51, 234, 220];
        if (station.overallScore > 60) return isCritical ? [255, 100, 100, 255] : [59, 130, 246, 220];
        if (station.overallScore > 40) return isCritical ? [255, 150, 150, 255] : [34, 197, 94, 220];
        return isCritical ? [255, 200, 200, 255] : [156, 163, 175, 220];
    }
  }, [analysisMode]);
  
  // Get competitor station color
  const getCompetitorStationColor = useCallback((station: CompetitorStation) => {
    // Color by operator with threat level intensity
    const threatIntensity = {
      'Critical': 255,
      'High': 200,
      'Medium': 150,
      'Low': 100
    }[station.marketPosition.threatLevel];
    
    switch (station.operator) {
      case 'AWS Ground Station':
        return [255, threatIntensity, 0, 220]; // Orange
      case 'SpaceX Starlink':
        return [threatIntensity, 255, threatIntensity, 220]; // Green
      case 'Telesat':
        return [0, threatIntensity, 255, 220]; // Blue
      case 'KSAT':
        return [255, 0, threatIntensity, 220]; // Red/Pink
      default:
        return [threatIntensity, threatIntensity, threatIntensity, 220]; // Gray
    }
  }, []);
  
  // Get station size based on analysis mode
  const getStationSize = useCallback((station: PrecomputedStationScore | CompetitorStation) => {
    if ('monthlyRevenue' in station) {
      // SES/Intelsat station
      switch (analysisMode) {
        case 'revenue':
          return Math.sqrt(station.monthlyRevenue / 1000) * 150;
        case 'utilization':
          return station.utilization * 800;
        case 'profit':
          return (station.profitMargin + 50) * 400;
        case 'opportunities':
        default:
          return station.overallScore * 600;
      }
    } else {
      // Competitor station
      const capacitySize = Math.sqrt(station.capabilities.estimatedCapacityGbps) * 2000;
      const threatMultiplier = {
        'Critical': 1.5,
        'High': 1.2,
        'Medium': 1.0,
        'Low': 0.8
      }[station.marketPosition.threatLevel];
      
      return capacitySize * threatMultiplier;
    }
  }, [analysisMode]);
  
  // Get opportunity hexagon color based on type and score
  const getOpportunityColor = useCallback((opportunity: H3HexagonOpportunity) => {
    // Determine opportunity type based on characteristics
    let opportunityType: OpportunityType = 'EXPANSION';
    
    if (opportunity.competitorCount25km > 2) {
      opportunityType = 'OPTIMIZATION'; // High competition area
    } else if (opportunity.competitorCount100km === 0) {
      opportunityType = 'EXPANSION'; // New market
    } else if (opportunity.riskLevel === 'high' || opportunity.riskLevel === 'very_high') {
      opportunityType = 'RISK'; // High risk
    } else if (opportunity.overallScore > 75) {
      opportunityType = 'MARKETING'; // High opportunity
    }
    
    // Base colors by type
    const baseColors = {
      EXPANSION: [34, 197, 94], // Green
      OPTIMIZATION: [250, 204, 21], // Yellow
      MARKETING: [59, 130, 246], // Blue
      RISK: [239, 68, 68] // Red
    };
    
    const baseColor = baseColors[opportunityType];
    const alpha = Math.floor(100 + (opportunity.overallScore / 100) * 155); // 100-255 based on score
    
    return [...baseColor, alpha];
  }, []);
  
  // Get opportunity hexagon height (3D effect)
  const getOpportunityHeight = useCallback((opportunity: H3HexagonOpportunity) => {
    return opportunity.overallScore * 1000; // Height based on score
  }, []);
  
  // Create layers
  const layers = useMemo(() => {
    const layerList = [];
    
    // H3 Hexagon layer for opportunities
    if (showOpportunityHexagons && filteredOpportunities.length > 0) {
      layerList.push(
        new H3HexagonLayer({
          id: 'opportunity-hexagons',
          data: filteredOpportunities,
          getHexagon: (d: H3HexagonOpportunity) => d.h3Index,
          getFillColor: getOpportunityColor,
          getElevation: getOpportunityHeight,
          elevationScale: 1,
          extruded: true,
          filled: true,
          stroked: true,
          getLineColor: [255, 255, 255, 100],
          lineWidthMinPixels: 1,
          opacity: 0.7,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedOpportunity(info.object);
              setSelectedStation(null);
            }
          },
          material: {
            ambient: 0.4,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [255, 255, 255]
          }
        })
      );
    }
    
    // SES/Intelsat stations as scatter plot
    if (showSESStations && filteredSESStations.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: 'ses-intelsat-stations',
          data: filteredSESStations,
          getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
          getRadius: getStationSize,
          getFillColor: getSESStationColor,
          getLineColor: (d: PrecomputedStationScore) => 
            d.priority === 'critical' ? [255, 0, 0, 255] : [255, 255, 255, 200],
          lineWidthMinPixels: (d: PrecomputedStationScore) => d.priority === 'critical' ? 3 : 2,
          stroked: true,
          filled: true,
          pickable: true,
          radiusMinPixels: 8,
          radiusMaxPixels: 60,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedStation(info.object);
              setSelectedOpportunity(null);
            }
          }
        })
      );
    }
    
    // Competitor stations as scatter plot
    if (showCompetitorStations && filteredCompetitorStations.length > 0) {
      layerList.push(
        new ScatterplotLayer({
          id: 'competitor-stations',
          data: filteredCompetitorStations,
          getPosition: (d: CompetitorStation) => [...d.coordinates].reverse(),
          getRadius: getStationSize,
          getFillColor: getCompetitorStationColor,
          getLineColor: [255, 255, 255, 200],
          lineWidthMinPixels: 2,
          stroked: true,
          filled: true,
          pickable: true,
          radiusMinPixels: 6,
          radiusMaxPixels: 50,
          onClick: (info: any) => {
            if (info.object) {
              setSelectedStation(info.object);
              setSelectedOpportunity(null);
            }
          }
        })
      );
    }
    
    // Station labels
    if (showStationLabels) {
      const allVisibleStations = [
        ...(showSESStations ? filteredSESStations : []),
        ...(showCompetitorStations ? filteredCompetitorStations : [])
      ];
      
      layerList.push(
        new TextLayer({
          id: 'station-labels',
          data: allVisibleStations,
          getPosition: (d: any) => [...d.coordinates].reverse(),
          getText: (d: any) => d.name,
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          billboard: true,
          fontSettings: {
            sdf: true,
            fontSize: 64,
            buffer: 4
          },
          outlineWidth: 2,
          outlineColor: [0, 0, 0, 255]
        })
      );
    }
    
    return layerList;
  }, [
    showOpportunityHexagons,
    showSESStations,
    showCompetitorStations,
    showStationLabels,
    filteredOpportunities,
    filteredSESStations,
    filteredCompetitorStations,
    getOpportunityColor,
    getOpportunityHeight,
    getSESStationColor,
    getCompetitorStationColor,
    getStationSize
  ]);
  
  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);
  
  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Map Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        views={new MapView()}
      >
        <Map 
          mapStyle={MAP_STYLE}
          mapLib={import('maplibre-gl')}
        />
      </DeckGL>
      
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
        {/* Search and Filters */}
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4 max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            {/* Analysis Mode */}
            <div className="flex gap-2">
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
                variant={analysisMode === 'opportunities' ? 'default' : 'outline'}
                onClick={() => setAnalysisMode('opportunities')}
                className="text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Opportunities
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Layer Visibility Controls */}
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Layer Visibility</h3>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showSESStations}
                onCheckedChange={setShowSESStations}
                id="ses-stations"
              />
              <Label htmlFor="ses-stations" className="text-xs text-white">
                SES/Intelsat Stations
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showCompetitorStations}
                onCheckedChange={setShowCompetitorStations}
                id="competitor-stations"
              />
              <Label htmlFor="competitor-stations" className="text-xs text-white">
                Competitor Stations
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showOpportunityHexagons}
                onCheckedChange={setShowOpportunityHexagons}
                id="opportunity-hexagons"
              />
              <Label htmlFor="opportunity-hexagons" className="text-xs text-white">
                Market Opportunities
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showStationLabels}
                onCheckedChange={setShowStationLabels}
                id="station-labels"
              />
              <Label htmlFor="station-labels" className="text-xs text-white">
                Station Labels
              </Label>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-white mb-3">Legend</h3>
          
          <Tabs defaultValue="stations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="stations" className="text-xs">Stations</TabsTrigger>
              <TabsTrigger value="opportunities" className="text-xs">Opportunities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stations" className="space-y-2 mt-3">
              <div className="space-y-2">
                <div className="text-xs text-gray-300 font-medium">SES/Intelsat</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-400">High Performance</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-400">Good Performance</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-400" />
                  <span className="text-gray-400">Critical Priority</span>
                </div>
                
                <div className="text-xs text-gray-300 font-medium mt-3">Competitors</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-400">AWS Ground Station</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-400">SpaceX Starlink</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-400">Telesat</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-gray-400">KSAT</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="opportunities" className="space-y-2 mt-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500" />
                  <span className="text-gray-400">Expansion Opportunity</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-500" />
                  <span className="text-gray-400">Optimization Opportunity</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500" />
                  <span className="text-gray-400">Marketing Opportunity</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-500" />
                  <span className="text-gray-400">Risk Area</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Height indicates opportunity score
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Station Details Panel */}
      {selectedStation && (
        <div className="absolute top-4 right-4 z-20 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedStation.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedStation.operator} • {selectedStation.country}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {'monthlyRevenue' in selectedStation ? (
                // SES/Intelsat station details
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Revenue</div>
                      <div className="text-lg font-bold text-white">
                        ${(selectedStation.monthlyRevenue / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Utilization</div>
                      <div className="text-lg font-bold text-white">
                        {selectedStation.utilization}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Priority:</span>
                      <Badge variant={
                        selectedStation.priority === 'critical' ? 'destructive' :
                        selectedStation.priority === 'high' ? 'default' :
                        'secondary'
                      }>
                        {selectedStation.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Overall Score:</span>
                      <span className="text-white font-medium">{selectedStation.overallScore}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Competitor station details
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Capacity</div>
                      <div className="text-lg font-bold text-white">
                        {selectedStation.capabilities.estimatedCapacityGbps} Gbps
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-xs text-gray-400">Threat Level</div>
                      <div className="text-lg font-bold text-white">
                        {selectedStation.marketPosition.threatLevel}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Market Share:</span>
                      <span className="text-white font-medium">
                        {selectedStation.marketPosition.marketShare}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Antennas:</span>
                      <span className="text-white font-medium">
                        {selectedStation.capabilities.antennaCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* Opportunity Details Panel */}
      {selectedOpportunity && (
        <div className="absolute top-4 right-4 z-20 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Market Opportunity</h3>
                  <p className="text-sm text-gray-400">
                    {selectedOpportunity.centerLat.toFixed(2)}°, {selectedOpportunity.centerLon.toFixed(2)}°
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOpportunity(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Opportunity Score</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedOpportunity.overallScore}/100
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Investment:</span>
                    <span className="text-white font-medium">
                      ${(selectedOpportunity.estimatedInvestment / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">ROI:</span>
                    <span className="text-white font-medium">
                      {selectedOpportunity.estimatedROI}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Risk Level:</span>
                    <Badge variant={
                      selectedOpportunity.riskLevel === 'low' ? 'default' :
                      selectedOpportunity.riskLevel === 'medium' ? 'secondary' :
                      'destructive'
                    }>
                      {selectedOpportunity.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Nearby Competitors:</span>
                    <span className="text-white font-medium">
                      {selectedOpportunity.competitorCount25km}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}