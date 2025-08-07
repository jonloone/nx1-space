'use client';

import React, { useMemo } from 'react';
import { X, BarChart3, TrendingUp, DollarSign, Zap, Globe, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stationData: PrecomputedStationScore[];
  selectedStation: PrecomputedStationScore | null;
}

export function BottomPanel({ isOpen, onClose, stationData, selectedStation }: BottomPanelProps) {
  
  // Calculate aggregate KPIs
  const kpis = useMemo(() => {
    if (!stationData.length) return null;

    const totalStations = stationData.length;
    const totalRevenue = stationData.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const totalOptimizedRevenue = stationData.reduce((sum, s) => sum + (s.optimizedMonthlyRevenue ?? s.monthlyRevenue), 0);
    const totalCapacity = stationData.reduce((sum, s) => sum + s.capacityGbps, 0);
    const avgUtilization = stationData.reduce((sum, s) => sum + (s.actualUtilization ?? s.utilization), 0) / totalStations;
    const avgScore = stationData.reduce((sum, s) => sum + s.overallScore, 0) / totalStations;
    const avgROI = stationData.reduce((sum, s) => sum + s.annualROI, 0) / totalStations;
    const avgProfitMargin = stationData.reduce((sum, s) => sum + s.profitMargin, 0) / totalStations;

    // Priority distribution
    const priorityCount = {
      critical: stationData.filter(s => s.priority === 'critical').length,
      high: stationData.filter(s => s.priority === 'high').length,
      medium: stationData.filter(s => s.priority === 'medium').length,
      low: stationData.filter(s => s.priority === 'low').length,
    };

    // Operator breakdown
    const operatorStats = {
      SES: stationData.filter(s => s.operator === 'SES'),
      Intelsat: stationData.filter(s => s.operator === 'Intelsat')
    };

    // Top performers
    const topByScore = [...stationData].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
    const topByRevenue = [...stationData].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 3);
    const topByUtilization = [...stationData].sort((a, b) => (b.actualUtilization ?? b.utilization) - (a.actualUtilization ?? a.utilization)).slice(0, 3);

    // Calculate opportunity potential
    const revenueUpside = totalOptimizedRevenue - totalRevenue;
    const utilisationUpside = stationData.reduce((sum, s) => sum + Math.max(0, 85 - (s.actualUtilization ?? s.utilization)), 0) / totalStations;
    const capacityLosses = stationData.reduce((sum, s) => sum + (s.capacityLossPercent ?? 15), 0) / totalStations;

    return {
      totalStations,
      totalRevenue,
      totalOptimizedRevenue,
      revenueUpside,
      totalCapacity,
      avgUtilization,
      avgScore,
      avgROI,
      avgProfitMargin,
      priorityCount,
      operatorStats,
      topByScore,
      topByRevenue,
      topByUtilization,
      utilisationUpside,
      capacityLosses
    };
  }, [stationData]);

  if (!isOpen || !kpis) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 z-40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <BarChart3 size={20} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Network KPIs</h2>
          {selectedStation && (
            <Badge variant="outline" className="text-xs">
              {selectedStation.name} Selected
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-6 gap-4">
          {/* Network Overview */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <Globe size={16} className="mr-2 text-blue-400" />
                Network Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{kpis.totalStations}</div>
                  <div className="text-xs text-gray-400">Total Stations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{kpis.totalCapacity}</div>
                  <div className="text-xs text-gray-400">Total Gbps</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">SES Stations</span>
                  <span className="text-blue-400">{kpis.operatorStats.SES.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Intelsat Stations</span>
                  <span className="text-purple-400">{kpis.operatorStats.Intelsat.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial KPIs */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <DollarSign size={16} className="mr-2 text-green-400" />
                Financial Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-400">{formatCurrency(kpis.totalRevenue)}</div>
                  <div className="text-xs text-gray-400">Monthly Revenue</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">{kpis.avgROI.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Avg ROI</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Revenue Upside</span>
                  <span className="text-green-400">+{formatCurrency(kpis.revenueUpside)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Avg Profit Margin</span>
                  <span className="text-white">{kpis.avgProfitMargin.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational KPIs */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <Zap size={16} className="mr-2 text-orange-400" />
                Operational Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">Avg Utilization</span>
                  <span className="text-white font-medium">{kpis.avgUtilization.toFixed(1)}%</span>
                </div>
                <Progress value={kpis.avgUtilization} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Network Score</span>
                  <span className={`font-medium ${getScoreColor(kpis.avgScore)}`}>
                    {kpis.avgScore.toFixed(1)}/100
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Capacity Loss</span>
                  <span className="text-red-400">{kpis.capacityLosses.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Util. Upside</span>
                  <span className="text-yellow-400">+{kpis.utilisationUpside.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Detailed Breakdowns */}
        <div className="grid grid-cols-6 gap-4 mt-4">
          {/* Priority Distribution */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <AlertCircle size={16} className="mr-2 text-red-400" />
                Priority Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-pink-600 rounded-full"></div>
                  <span className="text-xs text-gray-300">Critical</span>
                  <span className="text-xs text-white font-medium ml-auto">{kpis.priorityCount.critical}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-300">High</span>
                  <span className="text-xs text-white font-medium ml-auto">{kpis.priorityCount.high}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-300">Medium</span>
                  <span className="text-xs text-white font-medium ml-auto">{kpis.priorityCount.medium}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-xs text-gray-300">Low</span>
                  <span className="text-xs text-white font-medium ml-auto">{kpis.priorityCount.low}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers - Score */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <TrendingUp size={16} className="mr-2 text-green-400" />
                Top by Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kpis.topByScore.map((station, index) => (
                  <div key={station.stationId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-xs text-gray-300">{station.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${getScoreColor(station.overallScore)}`}>
                      {station.overallScore}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers - Revenue */}
          <Card className="bg-gray-800 border-gray-600 col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center">
                <Building2 size={16} className="mr-2 text-blue-400" />
                Top by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kpis.topByRevenue.map((station, index) => (
                  <div key={station.stationId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-xs text-gray-300">{station.name}</span>
                    </div>
                    <span className="text-xs font-medium text-green-400">
                      {formatCurrency(station.monthlyRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}