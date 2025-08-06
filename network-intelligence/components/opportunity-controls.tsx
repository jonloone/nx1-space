"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, Activity, DollarSign, MapPin, Zap } from 'lucide-react';

export interface OpportunityFilters {
  utilizationRange: [number, number];
  profitMarginRange: [number, number];
  revenueRange: [number, number];
  showCurrentPerformance: boolean;
  showFutureOpportunities: boolean;
  opportunityWeight: number;
}

interface OpportunityControlsProps {
  onFiltersChange: (filters: OpportunityFilters) => void;
  stationStats?: {
    totalStations: number;
    avgUtilization: number;
    avgProfitMargin: number;
    totalRevenue: number;
  };
}

export function OpportunityControls({ onFiltersChange, stationStats }: OpportunityControlsProps) {
  const [filters, setFilters] = useState<OpportunityFilters>({
    utilizationRange: [0, 100],
    profitMarginRange: [0, 50],
    revenueRange: [0, 1000000],
    showCurrentPerformance: true,
    showFutureOpportunities: true,
    opportunityWeight: 50
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleUtilizationChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, utilizationRange: [value[0], value[1]] as [number, number] }));
  };

  const handleProfitMarginChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, profitMarginRange: [value[0], value[1]] as [number, number] }));
  };

  const handleRevenueChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, revenueRange: [value[0], value[1]] as [number, number] }));
  };

  const handleOpportunityWeightChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, opportunityWeight: value[0] }));
  };

  // Calculate opportunity indicators
  const calculateOpportunities = () => {
    if (!stationStats) return { high: 0, medium: 0, low: 0 };
    
    // Simplified opportunity scoring
    const underutilized = filters.utilizationRange[1] < 50;
    const highMargin = filters.profitMarginRange[0] > 30;
    const lowRevenue = filters.revenueRange[1] < 500000;
    
    return {
      high: underutilized && highMargin ? 5 : 0,
      medium: underutilized || highMargin ? 3 : 0,
      low: lowRevenue ? 2 : 0
    };
  };

  const opportunities = calculateOpportunities();

  return (
    <div className="space-y-4 p-4">
      {/* Performance Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Utilization Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Utilization Range</Label>
              <span className="text-xs text-muted-foreground">
                {filters.utilizationRange[0]}% - {filters.utilizationRange[1]}%
              </span>
            </div>
            <Slider
              value={filters.utilizationRange}
              onValueChange={handleUtilizationChange}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Empty</span>
              <span>Full Capacity</span>
            </div>
          </div>

          {/* Profit Margin Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Profit Margin Range</Label>
              <span className="text-xs text-muted-foreground">
                {filters.profitMarginRange[0]}% - {filters.profitMarginRange[1]}%
              </span>
            </div>
            <Slider
              value={filters.profitMarginRange}
              onValueChange={handleProfitMarginChange}
              min={0}
              max={50}
              step={2}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Loss/Break-even</span>
              <span>High Profit</span>
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Monthly Revenue Range</Label>
              <span className="text-xs text-muted-foreground">
                ${(filters.revenueRange[0] / 1000).toFixed(0)}K - ${(filters.revenueRange[1] / 1000).toFixed(0)}K
              </span>
            </div>
            <Slider
              value={filters.revenueRange}
              onValueChange={handleRevenueChange}
              min={0}
              max={1000000}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>$1M+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Opportunity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current vs Future Balance */}
          <div className="space-y-2">
            <Label className="text-sm">Analysis Focus</Label>
            <div className="flex items-center gap-4">
              <span className="text-xs">Current State</span>
              <Slider
                value={[filters.opportunityWeight]}
                onValueChange={handleOpportunityWeightChange}
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-xs">Future Potential</span>
            </div>
          </div>

          <Separator />

          {/* Opportunity Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Zap className="h-3 w-3 text-red-500" />
                High Priority
              </span>
              <Badge variant="destructive">{opportunities.high}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-yellow-500" />
                Medium Priority
              </span>
              <Badge variant="secondary" className="bg-yellow-500">{opportunities.medium}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Activity className="h-3 w-3 text-blue-500" />
                Low Priority
              </span>
              <Badge variant="outline" className="border-blue-500 text-blue-500">{opportunities.low}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Opportunity Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-0.5"></div>
              <div>
                <div className="font-medium">High Opportunity (Red)</div>
                <div className="text-muted-foreground">Low utilization + High profit margin = Expansion potential</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mt-0.5"></div>
              <div>
                <div className="font-medium">Medium Opportunity (Yellow)</div>
                <div className="text-muted-foreground">Moderate performance with improvement potential</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-0.5"></div>
              <div>
                <div className="font-medium">Optimized (Green)</div>
                <div className="text-muted-foreground">High utilization + Good margins = Well-performing</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-0.5"></div>
              <div>
                <div className="font-medium">Low Priority (Blue)</div>
                <div className="text-muted-foreground">High utilization + Low margins = Pricing review needed</div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">Interactive Exploration:</div>
            <ul className="space-y-1">
              <li>• Adjust sliders to filter stations by performance</li>
              <li>• Heatmap updates in real-time</li>
              <li>• Click stations for detailed analysis</li>
              <li>• Zoom in for terrain suitability overlay</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      {stationStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Stations</span>
              <span className="font-medium">{stationStats.totalStations}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Utilization</span>
              <span className="font-medium">{stationStats.avgUtilization.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Profit Margin</span>
              <span className="font-medium">{stationStats.avgProfitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Monthly Revenue</span>
              <span className="font-medium">${(stationStats.totalRevenue / 1000000).toFixed(1)}M</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}