"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpportunityFilters } from '@/components/opportunity-controls';
import { AnalysisMode } from '@/lib/visualization/heatmap-analysis';
import { Settings, X, Activity, DollarSign, TrendingUp } from 'lucide-react';

interface MinimalControlsProps {
  filters: OpportunityFilters;
  onFiltersChange: (filters: OpportunityFilters) => void;
  showControls: boolean;
  onToggleControls: (show: boolean) => void;
}

export function MinimalControls({ 
  filters, 
  onFiltersChange, 
  showControls, 
  onToggleControls 
}: MinimalControlsProps) {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(AnalysisMode.UTILIZATION);

  const handleModeChange = (mode: string) => {
    const newMode = mode as AnalysisMode;
    setAnalysisMode(newMode);
    
    // Call global function to update the map
    if (typeof window !== 'undefined' && (window as any).setAnalysisMode) {
      (window as any).setAnalysisMode(newMode);
    }
  };

  const handleUtilizationChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      utilizationRange: [values[0], values[1]]
    });
  };

  const handleProfitMarginChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      profitMarginRange: [values[0], values[1]]
    });
  };

  const handleRevenueChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      revenueRange: [values[0], values[1]]
    });
  };

  const handleOpportunityWeightChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      opportunityWeight: values[0]
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => onToggleControls(!showControls)}
        variant="outline"
        size="icon"
        className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
      >
        {showControls ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
      </Button>

      {/* Controls Panel */}
      {showControls && (
        <Card className="absolute top-4 left-16 z-40 bg-black/90 backdrop-blur-sm border-white/20 text-white max-w-sm">
          <div className="p-4 space-y-6">
            {/* Analysis Mode Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {analysisMode === AnalysisMode.UTILIZATION && <Activity className="h-4 w-4" />}
                {analysisMode === AnalysisMode.PROFIT && <DollarSign className="h-4 w-4" />}
                {analysisMode === AnalysisMode.GROWTH_OPPORTUNITY && <TrendingUp className="h-4 w-4" />}
                Analysis Mode
              </label>
              <Select value={analysisMode} onValueChange={handleModeChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value={AnalysisMode.UTILIZATION} className="text-white">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Utilization Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value={AnalysisMode.PROFIT} className="text-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Profit Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value={AnalysisMode.GROWTH_OPPORTUNITY} className="text-white">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Growth Opportunities
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Utilization Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Utilization</label>
                <span className="text-xs text-gray-400">
                  {filters.utilizationRange[0]}% - {filters.utilizationRange[1]}%
                </span>
              </div>
              <Slider
                value={filters.utilizationRange}
                onValueChange={handleUtilizationChange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Profit Margin Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Profit Margin</label>
                <span className="text-xs text-gray-400">
                  {filters.profitMarginRange[0]}% - {filters.profitMarginRange[1]}%
                </span>
              </div>
              <Slider
                value={filters.profitMarginRange}
                onValueChange={handleProfitMarginChange}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Revenue Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Monthly Revenue</label>
                <span className="text-xs text-gray-400">
                  ${Math.round(filters.revenueRange[0] / 1000)}K - ${Math.round(filters.revenueRange[1] / 1000)}K
                </span>
              </div>
              <Slider
                value={filters.revenueRange}
                onValueChange={handleRevenueChange}
                max={1000000}
                min={0}
                step={10000}
                className="w-full"
              />
            </div>

            {/* Opportunity Weight */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Opportunity Focus</label>
                <span className="text-xs text-gray-400">{filters.opportunityWeight}%</span>
              </div>
              <Slider
                value={[filters.opportunityWeight]}
                onValueChange={handleOpportunityWeightChange}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Current State</span>
                <span>Future Potential</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color Legend</label>
              <div className="space-y-1 text-xs">
                {analysisMode === AnalysisMode.UTILIZATION && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Low Utilization (0-40%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Optimal (40-70%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>High (70-85%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Critical (&gt;85%)</span>
                    </div>
                  </>
                )}
                {analysisMode === AnalysisMode.PROFIT && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Low Margin (&lt;10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Moderate (10-20%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Good (20-30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Excellent (&gt;30%)</span>
                    </div>
                  </>
                )}
                {analysisMode === AnalysisMode.GROWTH_OPPORTUNITY && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                      <span>Low Opportunity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Medium Opportunity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>High Opportunity</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}