'use client';

/**
 * Global H3 Coverage Demonstration Page
 * 
 * Showcases complete global hexagon coverage using H3 spatial indexing with conditional
 * visualization modes (base gray vs opportunities scoring).
 */

import React, { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  Map as MapIcon, 
  BarChart3, 
  Settings, 
  TrendingUp, 
  Shield,
  Target,
  Layers,
  Eye,
  EyeOff,
  Zap,
  RefreshCw
} from 'lucide-react';

import { createGlobalH3Layer, GlobalH3Layer, useGlobalCoverageStats, clearGlobalCoverageCache, logGlobalCoverageInfo } from '@/components/map-layers/GlobalH3Layer';
import { createH3OpportunityLayer } from '@/components/map-layers/H3OpportunityLayer';
import { GlobalHexagon } from '@/lib/services/globalHexVerification';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
  maxZoom: 12,
  minZoom: 1
};

const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  satellite: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
};

export default function GlobalCoveragePage() {
  // View state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [selectedHexagon, setSelectedHexagon] = useState<GlobalHexagon | null>(null);
  
  // Layer controls
  const [globalLayerVisible, setGlobalLayerVisible] = useState(true);
  const [opportunityLayerVisible, setOpportunityLayerVisible] = useState(false);
  const [globalLayerMode, setGlobalLayerMode] = useState<'base' | 'opportunities'>('base');
  
  // Configuration
  const [resolutions, setResolutions] = useState<number[]>([4, 5]);
  const [includeOcean, setIncludeOcean] = useState(false);
  const [maxHexagons, setMaxHexagons] = useState(12000);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('dark');
  const [verifyCompleteness, setVerifyCompleteness] = useState(false);
  
  // Performance monitoring
  const { stats, loading, error, isComplete, totalGaps } = useGlobalCoverageStats(
    resolutions,
    includeOcean,
    maxHexagons,
    verifyCompleteness
  );

  // Create layers
  const layers = useMemo(() => {
    const layerList = [];
    
    // Global H3 coverage layer
    if (globalLayerVisible) {
      const globalLayer = createGlobalH3Layer({
        visible: true,
        mode: globalLayerMode,
        resolutions,
        includeOcean,
        maxHexagons,
        verifyCompleteness,
        onHexagonClick: setSelectedHexagon,
        onHexagonHover: (hexagon) => {
          // Could add hover effects here
        }
      });
      
      if (globalLayer) layerList.push(globalLayer);
    }
    
    // Legacy opportunity layer for comparison
    if (opportunityLayerVisible) {
      const opportunityLayer = createH3OpportunityLayer({
        visible: true,
        mode: 'opportunities',
        resolutions: [5, 6],
        maxOpportunities: 5000,
        onHexagonClick: (opp) => {
          // Convert to GlobalHexagon format for consistency
          const globalHex: GlobalHexagon = {
            hexagon: opp.hexagon,
            h3Index: opp.h3Index,
            resolution: opp.resolution,
            coordinates: opp.coordinates,
            boundary: opp.boundary,
            areaKm2: opp.areaKm2,
            landCoverage: opp.landCoverage,
            isLand: opp.landCoverage > 50,
            isCoastal: opp.isCoastal,
            landType: 'continental',
            region: opp.country || 'Unknown',
            hasGaps: false,
            neighbors: [],
            verified: true,
            baseColor: [107, 114, 128, 140],
            opportunityColor: opp.overallScore >= 80 ? [34, 197, 94, 180] : 
                             opp.overallScore >= 70 ? [234, 179, 8, 160] :
                             opp.overallScore >= 60 ? [249, 115, 22, 140] : [239, 68, 68, 120],
            opportunityScore: opp.overallScore,
            generatedAt: Date.now(),
            lastVerified: Date.now()
          };
          setSelectedHexagon(globalHex);
        }
      });
      
      if (opportunityLayer) layerList.push(opportunityLayer);
    }
    
    return layerList;
  }, [
    globalLayerVisible,
    opportunityLayerVisible,
    globalLayerMode,
    resolutions,
    includeOcean,
    maxHexagons,
    verifyCompleteness
  ]);

  const handleViewStateChange = useCallback(({ viewState }: any) => {
    setViewState(viewState);
  }, []);

  const handleClearCache = useCallback(() => {
    clearGlobalCoverageCache();
    window.location.reload(); // Force refresh to regenerate
  }, []);

  const handleLogCoverage = useCallback(() => {
    logGlobalCoverageInfo(resolutions, includeOcean);
  }, [resolutions, includeOcean]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Map Container */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        views={new MapView()}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
      >
        <Map
          mapStyle={MAP_STYLES[mapStyle]}
          attributionControl={false}
        />
      </DeckGL>

      {/* Title Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Global H3 Coverage System</h1>
              <p className="text-sm text-gray-400">
                Complete Earth coverage with {stats?.totalHexagons || 0} hexagons
                {loading && " (Loading...)"}
                {error && ` (Error: ${error})`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isComplete ? 'default' : 'destructive'}>
                {isComplete ? 'Complete Coverage' : `${totalGaps} Gaps`}
              </Badge>
              {loading && (
                <div className="animate-spin">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Left Control Panel */}
      <div className="absolute top-24 left-4 z-10 w-80">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Coverage Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Layer Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Layer Visibility</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <Label className="text-sm text-gray-300">Global H3 Coverage</Label>
                  </div>
                  <Switch 
                    checked={globalLayerVisible} 
                    onCheckedChange={setGlobalLayerVisible}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <Label className="text-sm text-gray-300">Legacy Opportunities</Label>
                  </div>
                  <Switch 
                    checked={opportunityLayerVisible} 
                    onCheckedChange={setOpportunityLayerVisible}
                  />
                </div>
              </div>
            </div>

            {/* Global Layer Mode */}
            {globalLayerVisible && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-white">Visualization Mode</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={globalLayerMode === 'base' ? 'default' : 'outline'}
                    onClick={() => setGlobalLayerMode('base')}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Base
                  </Button>
                  <Button
                    size="sm"
                    variant={globalLayerMode === 'opportunities' ? 'default' : 'outline'}
                    onClick={() => setGlobalLayerMode('opportunities')}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Opportunities
                  </Button>
                </div>
              </div>
            )}

            {/* H3 Resolutions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">
                H3 Resolutions: {resolutions.join(', ')}
              </Label>
              <div className="grid grid-cols-5 gap-1">
                {[2, 3, 4, 5, 6].map(res => (
                  <Button
                    key={res}
                    size="sm"
                    variant={resolutions.includes(res) ? 'default' : 'outline'}
                    onClick={() => {
                      setResolutions(prev => 
                        prev.includes(res) 
                          ? prev.filter(r => r !== res)
                          : [...prev, res].sort()
                      );
                    }}
                    className="text-xs"
                  >
                    {res}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Lower = coarser coverage, Higher = finer detail
              </p>
            </div>

            {/* Max Hexagons */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">
                Max Hexagons: {maxHexagons.toLocaleString()}
              </Label>
              <Slider
                value={[maxHexagons]}
                onValueChange={([value]) => setMaxHexagons(value)}
                min={1000}
                max={50000}
                step={1000}
                className="w-full"
              />
            </div>

            {/* Include Ocean */}
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">Include Ocean Hexagons</Label>
              <Switch 
                checked={includeOcean} 
                onCheckedChange={setIncludeOcean}
              />
            </div>

            {/* Verify Completeness */}
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-300">Verify Coverage Completeness</Label>
              <Switch 
                checked={verifyCompleteness} 
                onCheckedChange={setVerifyCompleteness}
              />
            </div>

            {/* Map Style */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Map Style</Label>
              <div className="flex gap-1">
                {Object.keys(MAP_STYLES).map(style => (
                  <Button
                    key={style}
                    size="sm"
                    variant={mapStyle === style ? 'default' : 'outline'}
                    onClick={() => setMapStyle(style as keyof typeof MAP_STYLES)}
                    className="flex-1 text-xs capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <Button
                size="sm"
                onClick={handleClearCache}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache & Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleLogCoverage}
                className="w-full"
                variant="outline"
              >
                <Zap className="w-4 h-4 mr-2" />
                Log Coverage Analysis
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Coverage Statistics Panel */}
      {stats && (
        <div className="absolute top-24 right-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Coverage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stats.totalHexagons.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Total Hexagons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.landHexagons.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Land Coverage</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.oceanHexagons.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Ocean Hexagons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {stats.coastalHexagons.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Coastal Areas</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Coverage Status</span>
                  <Badge variant={isComplete ? 'default' : 'destructive'}>
                    {isComplete ? 'Complete' : `${totalGaps} Gaps`}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Land Coverage</span>
                  <span className="text-white">
                    {((stats.landHexagons / stats.totalHexagons) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Coastal Ratio</span>
                  <span className="text-white">
                    {((stats.coastalHexagons / stats.landHexagons) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {selectedHexagon && (
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm font-semibold text-white mb-2">Selected Hexagon</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">H3 Index</span>
                      <span className="text-white font-mono text-xs break-all">
                        {selectedHexagon.h3Index.slice(-8)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resolution</span>
                      <span className="text-white">{selectedHexagon.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Land Coverage</span>
                      <span className="text-white">{selectedHexagon.landCoverage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white capitalize">{selectedHexagon.landType}</span>
                    </div>
                    {selectedHexagon.opportunityScore !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Opportunity Score</span>
                        <span className="text-white">{selectedHexagon.opportunityScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Quick Actions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewState(INITIAL_VIEW_STATE)}
            className="bg-gray-900/90 border-gray-600 text-white hover:bg-gray-800"
          >
            <Globe className="w-4 h-4 mr-1" />
            Reset View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(1, prev.zoom - 1) }))}
            className="bg-gray-900/90 border-gray-600 text-white hover:bg-gray-800"
          >
            Zoom Out
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(12, prev.zoom + 1) }))}
            className="bg-gray-900/90 border-gray-600 text-white hover:bg-gray-800"
          >
            Zoom In
          </Button>
        </div>
      </div>
    </div>
  );
}