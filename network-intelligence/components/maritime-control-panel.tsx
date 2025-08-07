'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ship,
  Anchor,
  Navigation,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Play,
  Pause,
  SkipForward,
  Settings,
  Map,
  Layers,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface MaritimeMetrics {
  vesselsInRange: number;
  laneCoverage: number;
  revenuePotential: number;
  uncoveredShips: number;
  competitorCoverage: number;
  o3bOpportunities: number;
}

interface MaritimeControlPanelProps {
  onViewModeChange?: (mode: 'density' | 'lanes' | 'coverage' | 'opportunities') => void;
  onTimeChange?: (hour: number) => void;
  onAnimationToggle?: (enabled: boolean) => void;
  onLayerToggle?: (layer: string, visible: boolean) => void;
  metrics?: MaritimeMetrics;
}

export function MaritimeControlPanel({
  onViewModeChange,
  onTimeChange,
  onAnimationToggle,
  onLayerToggle,
  metrics = {
    vesselsInRange: 2847,
    laneCoverage: 67,
    revenuePotential: 42000000,
    uncoveredShips: 892,
    competitorCoverage: 45,
    o3bOpportunities: 12
  }
}: MaritimeControlPanelProps) {
  const [viewMode, setViewMode] = useState<'density' | 'lanes' | 'coverage' | 'opportunities'>('density');
  const [timeOfDay, setTimeOfDay] = useState(12); // UTC
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Layer visibility states
  const [layers, setLayers] = useState({
    heatmap: true,
    vessels: true,
    lanes: true,
    coverage: false,
    competitors: false,
    opportunities: true
  });
  
  // Animation control
  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setTimeOfDay(prev => {
        const next = (prev + animationSpeed) % 24;
        onTimeChange?.(next);
        return next;
      });
    }, 1000 / animationSpeed);
    
    return () => clearInterval(interval);
  }, [isAnimating, animationSpeed, onTimeChange]);
  
  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };
  
  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers(prev => {
      const newState = { ...prev, [layer]: !prev[layer] };
      onLayerToggle?.(layer, newState[layer]);
      return newState;
    });
  };
  
  const toggleAnimation = () => {
    const newState = !isAnimating;
    setIsAnimating(newState);
    onAnimationToggle?.(newState);
  };
  
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };
  
  const getTimeLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00 UTC`;
  };

  return (
    <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-400" />
            <h3 className="text-white text-lg font-semibold">Maritime Analysis</h3>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {metrics.vesselsInRange.toLocaleString()} vessels tracked
          </Badge>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="bg-gray-800 w-full">
            <TabsTrigger value="visualization" className="flex-1">
              <Map className="w-4 h-4 mr-1" />
              View
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex-1">
              <Activity className="w-4 h-4 mr-1" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="layers" className="flex-1">
              <Layers className="w-4 h-4 mr-1" />
              Layers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="space-y-4 mt-4">
            {/* View Mode Selection */}
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">Visualization Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'density' ? 'default' : 'outline'}
                  onClick={() => handleViewModeChange('density')}
                  className="justify-start"
                >
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-yellow-500 rounded mr-2" />
                  Vessel Density
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'lanes' ? 'default' : 'outline'}
                  onClick={() => handleViewModeChange('lanes')}
                  className="justify-start"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Shipping Lanes
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'coverage' ? 'default' : 'outline'}
                  onClick={() => handleViewModeChange('coverage')}
                  className="justify-start"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Coverage Gaps
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'opportunities' ? 'default' : 'outline'}
                  onClick={() => handleViewModeChange('opportunities')}
                  className="justify-start"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Opportunities
                </Button>
              </div>
            </div>
            
            {/* Time Animation Control */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-gray-300 text-sm">
                  Time: {getTimeLabel(timeOfDay)}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleAnimation}
                    className="w-8 h-8 p-0"
                  >
                    {isAnimating ? 
                      <Pause className="w-4 h-4" /> : 
                      <Play className="w-4 h-4" />
                    }
                  </Button>
                  <Select 
                    value={animationSpeed.toString()} 
                    onValueChange={(v) => setAnimationSpeed(parseFloat(v))}
                  >
                    <SelectTrigger className="w-20 h-8 bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Slider
                value={[timeOfDay]}
                onValueChange={([v]) => {
                  setTimeOfDay(v);
                  onTimeChange?.(v);
                }}
                min={0}
                max={23}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-3 mt-4">
            {/* Coverage Metrics */}
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-2">
              <h4 className="text-gray-300 text-sm font-medium mb-2">Coverage Performance</h4>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Lane Coverage</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${metrics.laneCoverage}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-semibold">
                    {metrics.laneCoverage}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Competitor Coverage</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${metrics.competitorCoverage}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-semibold">
                    {metrics.competitorCoverage}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Opportunity Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-400 mb-1" />
                <div className="text-xs text-gray-400">Revenue Potential</div>
                <div className="text-lg font-bold text-green-400">
                  {formatRevenue(metrics.revenuePotential)}/yr
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                <div className="text-xs text-gray-400">Uncovered Ships</div>
                <div className="text-lg font-bold text-red-400">
                  {metrics.uncoveredShips.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* O3b Opportunities */}
            <div className="bg-blue-900/20 border border-blue-700/50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">O3b MEO Opportunities</span>
                </div>
                <Badge className="bg-blue-600">
                  {metrics.o3bOpportunities}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Low-latency premium service locations
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="layers" className="space-y-3 mt-4">
            {/* Layer Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="heatmap" className="text-sm text-gray-300 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-yellow-500 rounded" />
                  Density Heatmap
                </Label>
                <Switch
                  id="heatmap"
                  checked={layers.heatmap}
                  onCheckedChange={() => handleLayerToggle('heatmap')}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="vessels" className="text-sm text-gray-300 flex items-center gap-2">
                  <Ship className="w-4 h-4 text-blue-400" />
                  Vessel Tracks
                </Label>
                <Switch
                  id="vessels"
                  checked={layers.vessels}
                  onCheckedChange={() => handleLayerToggle('vessels')}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="lanes" className="text-sm text-gray-300 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  Shipping Lanes
                </Label>
                <Switch
                  id="lanes"
                  checked={layers.lanes}
                  onCheckedChange={() => handleLayerToggle('lanes')}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="coverage" className="text-sm text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  Station Coverage
                </Label>
                <Switch
                  id="coverage"
                  checked={layers.coverage}
                  onCheckedChange={() => handleLayerToggle('coverage')}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="competitors" className="text-sm text-gray-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  Competitors
                </Label>
                <Switch
                  id="competitors"
                  checked={layers.competitors}
                  onCheckedChange={() => handleLayerToggle('competitors')}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="opportunities" className="text-sm text-gray-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  Opportunities
                </Label>
                <Switch
                  id="opportunities"
                  checked={layers.opportunities}
                  onCheckedChange={() => handleLayerToggle('opportunities')}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Quick Stats Footer */}
        <div className="pt-3 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Active Routes</div>
              <div className="text-white font-semibold">10</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Daily Traffic</div>
              <div className="text-white font-semibold">847</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Coverage Gap</div>
              <div className="text-yellow-400 font-semibold">33%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}