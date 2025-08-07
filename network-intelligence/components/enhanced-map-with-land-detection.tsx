'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, ColumnLayer } from '@deck.gl/layers';
import { ScreenGridLayer } from '@deck.gl/aggregation-layers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  MapPin,
  Waves,
  Mountain,
  Info,
  Filter,
  Globe
} from 'lucide-react';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES, PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';
import { 
  isLandSimple, 
  isLandPolygon, 
  isLandGrid,
  landDetector,
  generateOpportunityGridWithLandDetection,
  getLandCoverageStats,
  HybridLandDetector
} from '@/lib/land-water-detection';

// MapLibre style
const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

// Initial view state
const INITIAL_VIEW_STATE = {
  longitude: -98,
  latitude: 39,
  zoom: 4,
  pitch: 0,
  bearing: 0,
  maxPitch: 85,
  minZoom: 2,
  maxZoom: 16
};

// Land detection methods for user selection
type LandDetectionMethod = 'simple' | 'polygon' | 'grid' | 'hybrid' | 'none';

export function EnhancedMapWithLandDetection() {
  const mapRef = useRef<any>(null);
  
  // Core state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<any>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [landDetectionMethod, setLandDetectionMethod] = useState<LandDetectionMethod>('hybrid');
  const [showOceanCells, setShowOceanCells] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [minLandCoverage, setMinLandCoverage] = useState(50);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Statistics state
  const [regionStats, setRegionStats] = useState<any>(null);
  
  // Initialize hybrid detector with high accuracy if needed
  const [detector] = useState(() => new HybridLandDetector({ 
    enableHighAccuracy: landDetectionMethod === 'hybrid',
    cacheSize: 5000 
  }));
  
  useEffect(() => {
    if (landDetectionMethod === 'hybrid') {
      detector.initialize().catch(console.error);
    }
  }, [landDetectionMethod, detector]);
  
  // Combine all station scores
  const allScores = useMemo(() => {
    return [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
  }, []);
  
  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!searchTerm) return allScores;
    
    const term = searchTerm.toLowerCase();
    return allScores.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.country.toLowerCase().includes(term)
    );
  }, [allScores, searchTerm]);
  
  // Generate opportunity grid with land detection
  const opportunityGrid = useMemo(() => {
    console.log(`Generating grid with method: ${landDetectionMethod}`);
    
    if (landDetectionMethod === 'none') {
      // Original implementation without land detection
      const gridData = [];
      for (let lat = -60; lat <= 70; lat += gridSize) {
        for (let lon = -180; lon <= 180; lon += gridSize) {
          if (lat < -60 || lat > 70) continue;
          
          const nearestStation = allScores.reduce((min, station) => {
            const dist = Math.sqrt(
              Math.pow(station.coordinates[0] - lat, 2) + 
              Math.pow(station.coordinates[1] - lon, 2)
            );
            return dist < min.dist ? { dist, station } : min;
          }, { dist: Infinity, station: null as any });
          
          const distanceScore = Math.min(nearestStation.dist / 10, 1) * 50;
          const gdpScore = Math.random() * 30;
          const populationScore = Math.random() * 20;
          const totalScore = distanceScore + gdpScore + populationScore;
          
          if (totalScore > 30) {
            gridData.push({
              position: [lon, lat],
              weight: totalScore,
              distanceToNearest: nearestStation.dist,
              isLand: null,
              factors: {
                distance: distanceScore,
                gdp: gdpScore,
                population: populationScore
              }
            });
          }
        }
      }
      return gridData;
    }
    
    // Use the enhanced function with land detection
    return generateOpportunityGridWithLandDetection(allScores, {
      gridSize,
      landDetectionMethod,
      includeOceanStations: showOceanCells,
      minLandCoverage
    });
  }, [allScores, landDetectionMethod, showOceanCells, gridSize, minLandCoverage]);
  
  // Calculate region statistics when view changes
  useEffect(() => {
    if (!showDebugInfo) return;
    
    const bounds = mapRef.current?.getMap()?.getBounds();
    if (!bounds) return;
    
    const stats = getLandCoverageStats(
      bounds.getSouth(),
      bounds.getNorth(),
      bounds.getWest(),
      bounds.getEast(),
      100
    );
    setRegionStats(stats);
  }, [viewState, showDebugInfo]);
  
  // Create layers
  const layers = useMemo(() => {
    const baseLayers = [];
    
    // Opportunity grid layer
    baseLayers.push(
      new ScreenGridLayer({
        id: 'opportunity-grid',
        data: opportunityGrid,
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => d.weight,
        cellSizePixels: 40,
        colorRange: [
          [65, 182, 196, 100],
          [127, 205, 187, 150],
          [199, 233, 180, 200],
          [237, 248, 177, 250],
          [255, 237, 160, 250],
          [255, 179, 71, 250]
        ],
        opacity: 0.6,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) {
            setSelectedGridCell(info.object);
          }
        }
      })
    );
    
    // Debug layer showing land/water classification
    if (showDebugInfo) {
      const debugPoints = [];
      for (let lat = -60; lat <= 70; lat += 5) {
        for (let lon = -180; lon <= 180; lon += 5) {
          let isLand = false;
          switch (landDetectionMethod) {
            case 'simple':
              isLand = isLandSimple(lat, lon);
              break;
            case 'polygon':
              isLand = isLandPolygon(lat, lon);
              break;
            case 'grid':
              isLand = isLandGrid(lat, lon);
              break;
            case 'hybrid':
              isLand = detector.isLand(lat, lon);
              break;
          }
          
          debugPoints.push({
            position: [lon, lat],
            isLand
          });
        }
      }
      
      baseLayers.push(
        new ScatterplotLayer({
          id: 'debug-land-water',
          data: debugPoints,
          getPosition: (d: any) => d.position,
          getRadius: 50000,
          getFillColor: (d: any) => d.isLand ? [34, 139, 34, 100] : [30, 144, 255, 100],
          radiusMinPixels: 2,
          radiusMaxPixels: 5
        })
      );
    }
    
    // Station columns
    baseLayers.push(
      new ColumnLayer({
        id: 'station-columns',
        data: filteredStations,
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        diskResolution: 12,
        radius: 30000,
        extruded: true,
        getElevation: (d: PrecomputedStationScore) => d.overallScore * 5000,
        getFillColor: (d: PrecomputedStationScore) => {
          if (d.overallScore > 80) return [147, 51, 234, 220];
          if (d.overallScore > 60) return [59, 130, 246, 220];
          if (d.overallScore > 40) return [34, 197, 94, 220];
          return [156, 163, 175, 220];
        },
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 2,
        pickable: true,
        onClick: (info: any) => setSelectedStation(info.object)
      })
    );
    
    // Station labels
    baseLayers.push(
      new TextLayer({
        id: 'station-labels',
        data: filteredStations.slice(0, 20), // Limit labels for performance
        getPosition: (d: PrecomputedStationScore) => [...d.coordinates].reverse(),
        getText: (d: PrecomputedStationScore) => d.name,
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
        outlineColor: [0, 0, 0, 255]
      })
    );
    
    return baseLayers;
  }, [filteredStations, opportunityGrid, showDebugInfo, landDetectionMethod, detector]);
  
  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);
  
  return (
    <div className="relative w-full h-full bg-black">
      {/* Map Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        views={new MapView()}
      >
        <Map 
          ref={mapRef}
          mapStyle={MAP_STYLE}
          mapLib={import('maplibre-gl')}
        />
      </DeckGL>
      
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
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
        
        {/* Land Detection Controls */}
        <div className="pointer-events-auto">
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm p-4 w-96">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Land/Water Detection Settings
            </h3>
            
            <div className="space-y-3">
              {/* Detection Method */}
              <div>
                <Label className="text-xs text-gray-400">Detection Method</Label>
                <Select value={landDetectionMethod} onValueChange={(v: LandDetectionMethod) => setLandDetectionMethod(v)}>
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Detection (Original)</SelectItem>
                    <SelectItem value="simple">Simple Bounds (Fastest)</SelectItem>
                    <SelectItem value="polygon">Polygon Check (Balanced)</SelectItem>
                    <SelectItem value="grid">Grid Lookup (Fast)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Most Accurate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Grid Size */}
              <div>
                <Label className="text-xs text-gray-400">Grid Size: {gridSize}°</Label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={gridSize}
                  onChange={(e) => setGridSize(parseFloat(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              
              {/* Minimum Land Coverage */}
              <div>
                <Label className="text-xs text-gray-400">Min Land Coverage: {minLandCoverage}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={minLandCoverage}
                  onChange={(e) => setMinLandCoverage(parseInt(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              
              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={showOceanCells}
                    onChange={(e) => setShowOceanCells(e.target.checked)}
                    className="rounded"
                  />
                  Show Ocean Cells
                </label>
                
                <label className="flex items-center gap-2 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={showDebugInfo}
                    onChange={(e) => setShowDebugInfo(e.target.checked)}
                    className="rounded"
                  />
                  Debug View
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm p-4 w-64">
          <h3 className="text-sm font-semibold text-white mb-3">Legend</h3>
          
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Opportunity Heat Map</div>
            <div className="h-4 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low</span>
              <span>High</span>
            </div>
            
            {showDebugInfo && (
              <>
                <div className="text-xs text-gray-400 mt-3">Land/Water Classification</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-xs text-gray-300">Land</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-300">Water</span>
                </div>
              </>
            )}
            
            <div className="text-xs text-gray-400 mt-3">Station Score</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-xs text-gray-300">Excellent (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs text-gray-300">Good (60-80)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-xs text-gray-300">Fair (40-60)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Selected Grid Cell Details */}
      {selectedGridCell && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4 w-80">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Grid Cell Details</h3>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedGridCell.position[1].toFixed(2)}°, {selectedGridCell.position[0].toFixed(2)}°
                </p>
              </div>
              <Badge variant={selectedGridCell.isLand ? 'default' : 'secondary'}>
                {selectedGridCell.isLand ? (
                  <><Mountain className="w-3 h-3 mr-1" /> Land</>
                ) : selectedGridCell.isLand === false ? (
                  <><Waves className="w-3 h-3 mr-1" /> Water</>
                ) : (
                  'Unknown'
                )}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-xs text-gray-400">Opportunity Score</div>
                <div className="text-xl font-bold text-white">{selectedGridCell.weight.toFixed(0)}/100</div>
              </div>
              
              {selectedGridCell.landCoverage !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Land Coverage:</span>
                  <span className="text-white">{selectedGridCell.landCoverage.toFixed(0)}%</span>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2">Score Components</div>
              {selectedGridCell.factors && Object.entries(selectedGridCell.factors).map(([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-300 capitalize">{key}:</span>
                  <span className="text-white">{value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* Statistics Panel */}
      {showDebugInfo && regionStats && (
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4 w-64">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Region Statistics
            </h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Land Coverage:</span>
                <span className="text-white">{regionStats.landPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Land Cells:</span>
                <span className="text-white">{regionStats.landCells}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Water Cells:</span>
                <span className="text-white">{regionStats.waterCells}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Grid Points:</span>
                <span className="text-white">{opportunityGrid.length}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}