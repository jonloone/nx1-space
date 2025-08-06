/**
 * Opportunity Dashboard with Pre-computed Scores
 * 
 * Uses pre-calculated scores for instant loading and reliable performance
 * Perfect for POC demonstrations
 */

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Globe, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Satellite,
  BarChart3,
  Info,
  ChevronRight,
  Activity
} from 'lucide-react';

import { 
  ALL_PRECOMPUTED_SCORES,
  OPPORTUNITY_SUMMARY,
  PrecomputedStationScore,
  getHighOpportunityStations,
  getStationsByPriority
} from '@/lib/data/precomputed-opportunity-scores';

interface OpportunityDashboardPrecomputedProps {
  className?: string;
}

export function OpportunityDashboardPrecomputed({ className = '' }: OpportunityDashboardPrecomputedProps) {
  const [selectedStation, setSelectedStation] = useState<PrecomputedStationScore | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterOperator, setFilterOperator] = useState<string>('all');

  // Filter stations based on selected criteria
  const filteredStations = ALL_PRECOMPUTED_SCORES.filter(station => {
    if (filterPriority !== 'all' && station.priority !== filterPriority) return false;
    if (filterOperator !== 'all' && station.operator !== filterOperator) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const criticalStations = getStationsByPriority('critical');
  const highOpportunityStations = getHighOpportunityStations(80);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{OPPORTUNITY_SUMMARY.totalStations}</div>
            <div className="text-xs text-gray-500 mt-1">
              SES: 15 | Intelsat: 17
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(OPPORTUNITY_SUMMARY.averageScore)}`}>
              {OPPORTUNITY_SUMMARY.averageScore.toFixed(1)}
            </div>
            <Progress value={OPPORTUNITY_SUMMARY.averageScore} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Critical Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {OPPORTUNITY_SUMMARY.criticalPriority}
            </div>
            <div className="text-xs text-gray-500 mt-1">Immediate action</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">SES Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(OPPORTUNITY_SUMMARY.sesAverage)}`}>
              {OPPORTUNITY_SUMMARY.sesAverage.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">15 stations</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Intelsat Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(OPPORTUNITY_SUMMARY.intelsatAverage)}`}>
              {OPPORTUNITY_SUMMARY.intelsatAverage.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">17 stations</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Priority:</span>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Operator:</span>
              <select 
                value={filterOperator} 
                onChange={(e) => setFilterOperator(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="all">All</option>
                <option value="SES">SES</option>
                <option value="Intelsat">Intelsat</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-400">Showing:</span>
              <span className="text-sm text-white font-medium">{filteredStations.length} stations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stations" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="stations">Station Analysis</TabsTrigger>
          <TabsTrigger value="opportunities">Top Opportunities</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
        </TabsList>

        <TabsContent value="stations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Station List */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Ground Stations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredStations
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .map((station) => (
                    <div 
                      key={station.stationId}
                      className={`flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors ${
                        selectedStation?.stationId === station.stationId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedStation(station)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-white">{station.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {station.country}
                          <Badge variant="outline" className="text-xs">
                            {station.operator}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`text-lg font-bold ${getScoreColor(station.overallScore)}`}>
                          {station.overallScore.toFixed(0)}
                        </div>
                        <Badge className={`${getPriorityColor(station.priority)} text-xs`}>
                          {station.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Station Detail */}
            {selectedStation ? (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{selectedStation.name}</span>
                    <Badge className={`${getPriorityColor(selectedStation.priority)}`}>
                      {selectedStation.priority} Priority
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Utilization</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.utilizationScore)}`}>
                        {selectedStation.utilizationScore}
                      </div>
                      <Progress value={selectedStation.utilizationScore} className="h-2" />
                      <div className="text-xs text-gray-500">{selectedStation.utilization}% current</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Profitability</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.profitabilityScore)}`}>
                        {selectedStation.profitabilityScore}
                      </div>
                      <Progress value={selectedStation.profitabilityScore} className="h-2" />
                      <div className="text-xs text-gray-500">{selectedStation.profitMargin}% margin</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Market Opportunity</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.marketOpportunityScore)}`}>
                        {selectedStation.marketOpportunityScore}
                      </div>
                      <Progress value={selectedStation.marketOpportunityScore} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Technical Capability</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.technicalCapabilityScore)}`}>
                        {selectedStation.technicalCapabilityScore}
                      </div>
                      <Progress value={selectedStation.technicalCapabilityScore} className="h-2" />
                      <div className="text-xs text-gray-500">{selectedStation.capacityGbps} Gbps</div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue</span>
                      <span className="text-white">${(selectedStation.monthlyRevenue / 1000000).toFixed(1)}M/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROI</span>
                      <span className="text-white">{selectedStation.annualROI}%</span>
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-sm font-medium text-white mb-2">Opportunities</div>
                    <div className="space-y-1">
                      {selectedStation.opportunities.map((opp, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <ChevronRight className="h-3 w-3 text-green-500 mt-0.5" />
                          <span>{opp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-sm font-medium text-white mb-2">Risks</div>
                    <div className="space-y-1">
                      {selectedStation.risks.map((risk, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-sm font-medium text-white mb-2">Recommended Actions</div>
                    <div className="space-y-1">
                      {selectedStation.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <Target className="h-3 w-3 text-blue-500 mt-0.5" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center text-gray-500">
                    <Satellite className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a station to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Critical Priority Stations */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalStations.slice(0, 5).map((station) => (
                    <div 
                      key={station.stationId} 
                      className="p-2 bg-gray-800/50 rounded cursor-pointer hover:bg-gray-700/50"
                      onClick={() => setSelectedStation(station)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-white font-medium">{station.name}</div>
                          <div className="text-xs text-gray-400">{station.operator} • {station.country}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-500">{station.overallScore.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* High ROI Stations */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Highest ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...ALL_PRECOMPUTED_SCORES]
                    .sort((a, b) => b.annualROI - a.annualROI)
                    .slice(0, 5)
                    .map((station) => (
                      <div 
                        key={station.stationId} 
                        className="p-2 bg-gray-800/50 rounded cursor-pointer hover:bg-gray-700/50"
                        onClick={() => setSelectedStation(station)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-white font-medium">{station.name}</div>
                            <div className="text-xs text-gray-400">{station.operator} • {station.country}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-500">{station.annualROI}%</div>
                            <div className="text-xs text-gray-500">ROI</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Expansion Opportunities */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Expansion Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ALL_PRECOMPUTED_SCORES
                    .filter(s => s.utilization > 75)
                    .sort((a, b) => b.marketOpportunityScore - a.marketOpportunityScore)
                    .slice(0, 5)
                    .map((station) => (
                      <div 
                        key={station.stationId} 
                        className="p-2 bg-gray-800/50 rounded cursor-pointer hover:bg-gray-700/50"
                        onClick={() => setSelectedStation(station)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-white font-medium">{station.name}</div>
                            <div className="text-xs text-gray-400">{station.utilization}% utilized</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-orange-500">{station.capacityGbps}</div>
                            <div className="text-xs text-gray-500">Gbps</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Market Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-900/20 border border-green-700 rounded">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-green-400">High Growth Markets</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Asia-Pacific stations show 90+ market opportunity scores, driven by enterprise demand and maritime corridors
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                  <div className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-400">Capacity Constraints</div>
                      <div className="text-xs text-gray-400 mt-1">
                        8 stations operating above 75% utilization require immediate capacity expansion planning
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-900/20 border border-blue-700 rounded">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-400">MEO Gateway Opportunities</div>
                      <div className="text-xs text-gray-400 mt-1">
                        O3b gateways showing highest ROI (25%+) with strong demand for high-throughput services
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Investment Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-900/20 border border-red-700 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-400">Immediate Actions</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Focus on {OPPORTUNITY_SUMMARY.criticalPriority} critical priority stations requiring capacity expansion and technology refresh
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-900/20 border border-purple-700 rounded">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-purple-400">Profit Optimization</div>
                      <div className="text-xs text-gray-400 mt-1">
                        12 stations with margins below 25% present cost reduction and efficiency improvement opportunities
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-cyan-900/20 border border-cyan-700 rounded">
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-cyan-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-cyan-400">Regional Expansion</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Southeast Asia and Africa regions show strongest growth potential with underserved markets
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* By Priority */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400">Critical</span>
                      <span className="text-white">{OPPORTUNITY_SUMMARY.criticalPriority}</span>
                    </div>
                    <Progress value={(OPPORTUNITY_SUMMARY.criticalPriority / 32) * 100} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-orange-400">High</span>
                      <span className="text-white">{OPPORTUNITY_SUMMARY.highPriority}</span>
                    </div>
                    <Progress value={(OPPORTUNITY_SUMMARY.highPriority / 32) * 100} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-yellow-400">Medium</span>
                      <span className="text-white">{OPPORTUNITY_SUMMARY.mediumPriority}</span>
                    </div>
                    <Progress value={(OPPORTUNITY_SUMMARY.mediumPriority / 32) * 100} className="h-2 bg-gray-700" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Low</span>
                      <span className="text-white">{OPPORTUNITY_SUMMARY.lowPriority}</span>
                    </div>
                    <Progress value={(OPPORTUNITY_SUMMARY.lowPriority / 32) * 100} className="h-2 bg-gray-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {highOpportunityStations.slice(0, 4).map((station, i) => (
                    <div key={station.stationId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-gray-500">#{i + 1}</div>
                        <div className="text-xs text-white truncate max-w-[100px]">{station.name}</div>
                      </div>
                      <Badge className="text-xs" variant="outline">
                        {station.overallScore.toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Leaders */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Revenue Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...ALL_PRECOMPUTED_SCORES]
                    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
                    .slice(0, 4)
                    .map((station, i) => (
                      <div key={station.stationId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-gray-500">#{i + 1}</div>
                          <div className="text-xs text-white truncate max-w-[100px]">{station.name}</div>
                        </div>
                        <Badge className="text-xs" variant="outline">
                          ${(station.monthlyRevenue / 1000000).toFixed(1)}M
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Investment Summary */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Investment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Excellent</span>
                    <span className="text-xs font-bold text-green-500">
                      {ALL_PRECOMPUTED_SCORES.filter(s => s.investmentRecommendation === 'excellent').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Good</span>
                    <span className="text-xs font-bold text-blue-500">
                      {ALL_PRECOMPUTED_SCORES.filter(s => s.investmentRecommendation === 'good').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Moderate</span>
                    <span className="text-xs font-bold text-yellow-500">
                      {ALL_PRECOMPUTED_SCORES.filter(s => s.investmentRecommendation === 'moderate').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Poor</span>
                    <span className="text-xs font-bold text-red-500">
                      {ALL_PRECOMPUTED_SCORES.filter(s => s.investmentRecommendation === 'poor').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}