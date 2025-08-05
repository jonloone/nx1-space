"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getNetworkStats } from '@/data/satellites-geo';
import { TerrainLayerToggle } from './terrain-layer-toggle';
import { calculateTerrainStats } from '@/lib/terrain/terrain-layer';

interface LayerControls {
  showStations: boolean;
  showHeatmap: boolean;
  showCoverage: boolean;
  showSatellites: boolean;
  showConnections: boolean;
  showTerrain: boolean;
}

interface BIControlsProps {
  onLayerChange?: (layers: LayerControls) => void;
}

export function BIControls({ onLayerChange }: BIControlsProps) {
  const [layers, setLayers] = useState<LayerControls>({
    showStations: true,
    showHeatmap: true,
    showCoverage: true,
    showSatellites: true,
    showConnections: false,
    showTerrain: false
  });

  const [networkStats, setNetworkStats] = useState(() => getNetworkStats());

  useEffect(() => {
    onLayerChange?.(layers);
  }, [layers, onLayerChange]);

  const handleLayerToggle = (layer: keyof LayerControls) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div className="space-y-4 p-4">
      {/* Network Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Network Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{networkStats.totalSatellites}</div>
              <div className="text-xs text-muted-foreground">Active Satellites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{networkStats.totalCapacity}</div>
              <div className="text-xs text-muted-foreground">Total Capacity (Gbps)</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Utilization</span>
              <span className="font-medium">{networkStats.avgUtilization}%</span>
            </div>
            <Progress value={networkStats.avgUtilization} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>SES: {networkStats.sesSatellites}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Intelsat: {networkStats.intelsatSatellites}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Visualization Layers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-400"></div>
                <span className="text-sm">Ground Stations</span>
              </div>
              <Switch
                checked={layers.showStations}
                onCheckedChange={() => handleLayerToggle('showStations')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500"></div>
                <span className="text-sm">Opportunity Heatmap</span>
              </div>
              <Switch
                checked={layers.showHeatmap}
                onCheckedChange={() => handleLayerToggle('showHeatmap')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-blue-400 bg-blue-400/20"></div>
                <span className="text-sm">Coverage Areas</span>
              </div>
              <Switch
                checked={layers.showCoverage}
                onCheckedChange={() => handleLayerToggle('showCoverage')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Satellites</span>
              </div>
              <Switch
                checked={layers.showSatellites}
                onCheckedChange={() => handleLayerToggle('showSatellites')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-cyan-400"></div>
                <span className="text-sm">Connections</span>
              </div>
              <Switch
                checked={layers.showConnections}
                onCheckedChange={() => handleLayerToggle('showConnections')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Opportunity Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">High Utilization</span>
            <Badge variant="destructive" className="bg-red-500">
              {networkStats.highUtilization}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Underutilized</span>
            <Badge variant="secondary" className="bg-blue-500">
              {networkStats.underutilized}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Coverage Gaps</span>
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              3
            </Badge>
          </div>

          <Separator />
          
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Low utilization (&lt;70%)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Good utilization (70-89%)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>High utilization (90-95%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Critical utilization (&gt;95%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terrain Analysis Factors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Terrain Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground mb-3">
            Ground station suitability factors including elevation, slope, and horizon clearance.
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Elevation Suitability</span>
              <span className="text-green-400">Good</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Terrain Slope</span>
              <span className="text-green-400">Favorable</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Horizon Clearance</span>
              <span className="text-yellow-400">Moderate</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Flood Risk</span>
              <span className="text-green-400">Low</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Regional Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Americas</span>
              <span className="text-green-400">Excellent</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Europe/Africa</span>
              <span className="text-green-400">Good</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Asia-Pacific</span>
              <span className="text-yellow-400">Moderate</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Indian Ocean</span>
              <span className="text-red-400">Limited</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terrain Layer Toggle */}
      <TerrainLayerToggle 
        onToggle={(enabled) => handleLayerToggle('showTerrain')}
        terrainStats={calculateTerrainStats(networkStats.stations)}
      />
    </div>
  );
}