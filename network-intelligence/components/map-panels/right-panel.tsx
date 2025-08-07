'use client';

import React, { useState } from 'react';
import { X, MapPin, Building2, TrendingUp, DollarSign, Zap, AlertTriangle, CheckCircle, ArrowUpRight, Users, Calendar, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PrecomputedStationScore } from '@/lib/data/precomputed-opportunity-scores';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStation: { 
    station: PrecomputedStationScore; 
    coordinates: [number, number] 
  } | null;
  onActionTaken: (action: string) => void;
}

export function RightPanel({ isOpen, onClose, selectedStation, onActionTaken }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !selectedStation) return null;

  const { station } = selectedStation;

  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: 'bg-pink-600', text: 'text-pink-100', border: 'border-pink-500' };
      case 'high': return { bg: 'bg-orange-500', text: 'text-orange-100', border: 'border-orange-400' };
      case 'medium': return { bg: 'bg-green-500', text: 'text-green-100', border: 'border-green-400' };
      case 'low': return { bg: 'bg-gray-500', text: 'text-gray-100', border: 'border-gray-400' };
      default: return { bg: 'bg-gray-400', text: 'text-gray-100', border: 'border-gray-300' };
    }
  };

  const priorityStyle = getPriorityStyle(station.priority);

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
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 z-40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Building2 size={20} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Station Details</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Station Header Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-white">{station.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-300">{station.country}</span>
                <Badge variant="outline" className="text-xs">
                  {station.operator}
                </Badge>
              </div>
            </div>
            <Badge className={`${priorityStyle.bg} ${priorityStyle.text} capitalize`}>
              {station.priority}
            </Badge>
          </div>

          {/* Key metrics row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(station.overallScore)}`}>
                {station.overallScore}
              </div>
              <div className="text-xs text-gray-400">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {station.actualUtilization}%
              </div>
              <div className="text-xs text-gray-400">Utilization</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 mx-4 mt-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Business Metrics */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center">
                    <DollarSign size={16} className="mr-2 text-green-400" />
                    Business Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Monthly Revenue</span>
                    <span className="text-white font-medium">{formatCurrency(station.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Optimized Revenue</span>
                    <span className="text-green-400 font-medium">{formatCurrency(station.optimizedMonthlyRevenue ?? station.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Profit Margin</span>
                    <span className="text-white font-medium">{station.profitMargin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Annual ROI</span>
                    <span className={`font-medium ${getScoreColor(station.annualROI)}`}>
                      {station.annualROI}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specs */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center">
                    <Zap size={16} className="mr-2 text-blue-400" />
                    Technical Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Station Type</span>
                    <span className="text-white font-medium">{station.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Capacity</span>
                    <span className="text-white font-medium">{station.capacityGbps} Gbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Coordinates</span>
                    <span className="text-gray-300 text-xs font-mono">
                      {station.coordinates[0].toFixed(4)}, {station.coordinates[1].toFixed(4)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Recommendation */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center">
                    <TrendingUp size={16} className="mr-2 text-purple-400" />
                    Investment Outlook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">Recommendation</span>
                    <Badge variant={station.investmentRecommendation === 'excellent' ? 'default' : 'secondary'} className="capitalize">
                      {station.investmentRecommendation}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Based on current performance metrics, market position, and growth potential.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-0">
              {/* Operational Performance */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center">
                    <Gauge size={16} className="mr-2 text-orange-400" />
                    Operational Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Theoretical Utilization</span>
                      <span className="text-gray-400">{station.theoreticalUtilization}%</span>
                    </div>
                    <Progress value={station.theoreticalUtilization} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Actual Utilization</span>
                      <span className="text-white font-medium">{station.actualUtilization}%</span>
                    </div>
                    <Progress value={station.actualUtilization} className="h-2" />
                  </div>

                  <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
                    <span className="text-red-300">Capacity Loss:</span> {station.capacityLossPercent}% due to operational constraints
                  </div>
                </CardContent>
              </Card>

              {/* Operational Constraints */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Operational Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Slew Time Overhead</span>
                    <span className="text-orange-400">{station.operationalConstraints?.slewTimeOverhead ?? 8}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Acquisition Overhead</span>
                    <span className="text-orange-400">{station.operationalConstraints?.acquisitionTimeOverhead ?? 5}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Efficiency Ratio</span>
                    <span className="text-blue-400">{((station.operationalConstraints?.utilizationEfficiency ?? 0.85) * 100).toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Interference Impact */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center">
                    <AlertTriangle size={16} className="mr-2 text-yellow-400" />
                    Interference Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">C/I Ratio</span>
                    <span className="text-white font-medium">{station.interferenceImpact?.cToIRatio ?? 25} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Capacity Reduction</span>
                    <span className="text-red-400">{station.interferenceImpact?.capacityReduction ?? 3}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Service Quality</span>
                    <Badge variant={(station.interferenceImpact?.serviceQualityImpact ?? 'minimal') === 'none' ? 'default' : 'secondary'}>
                      {station.interferenceImpact?.serviceQualityImpact ?? 'minimal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Dominant source: {station.interferenceImpact?.dominantInterference ?? 'Terrestrial interference'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 mt-0">
              {/* Score Breakdown */}
              <Card className="bg-gray-800 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Utilization</span>
                      <span className={getScoreColor(station.utilizationScore)}>{station.utilizationScore}/100</span>
                    </div>
                    <Progress value={station.utilizationScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Profitability</span>
                      <span className={getScoreColor(station.profitabilityScore)}>{station.profitabilityScore}/100</span>
                    </div>
                    <Progress value={station.profitabilityScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Market Opportunity</span>
                      <span className={getScoreColor(station.marketOpportunityScore)}>{station.marketOpportunityScore}/100</span>
                    </div>
                    <Progress value={station.marketOpportunityScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Technical Capability</span>
                      <span className={getScoreColor(station.technicalCapabilityScore)}>{station.technicalCapabilityScore}/100</span>
                    </div>
                    <Progress value={station.technicalCapabilityScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Opportunities */}
              {station.opportunities.length > 0 && (
                <Card className="bg-gray-800 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center">
                      <CheckCircle size={16} className="mr-2 text-green-400" />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {station.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <ArrowUpRight size={12} className="text-green-400 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risks */}
              {station.risks.length > 0 && (
                <Card className="bg-gray-800 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center">
                      <AlertTriangle size={16} className="mr-2 text-red-400" />
                      Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {station.risks.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertTriangle size={12} className="text-red-400 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Actions */}
              {station.actions.length > 0 && (
                <Card className="bg-gray-800 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {station.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs h-auto py-2 px-3"
                          onClick={() => onActionTaken(action)}
                        >
                          <CheckCircle size={12} className="mr-2 text-blue-400 flex-shrink-0" />
                          <span className="text-left">{action}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onActionTaken('view_terrain')}
          >
            View Terrain
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onActionTaken('export_report')}
          >
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}