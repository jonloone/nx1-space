/**
 * Opportunity Dashboard Component
 * 
 * Displays comprehensive real-world ground station opportunity analysis
 * Integrates multi-agent insights with interactive visualizations
 */

"use client";

import React, { useState, useEffect } from 'react';
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
  BarChart3
} from 'lucide-react';

import { 
  RealWorldOpportunityScorer,
  OpportunityScore,
  OpportunityDashboard as OpportunityDashboardType 
} from '@/lib/scoring/real-world-opportunity-scorer';

interface OpportunityDashboardProps {
  className?: string;
}

export function OpportunityDashboard({ className = '' }: OpportunityDashboardProps) {
  const [dashboard, setDashboard] = useState<OpportunityDashboardType | null>(null);
  const [selectedStation, setSelectedStation] = useState<OpportunityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOpportunityData();
  }, []);

  const loadOpportunityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const scorer = new RealWorldOpportunityScorer();
      const dashboardData = await scorer.analyzeAllStations();
      
      setDashboard(dashboardData);
    } catch (err) {
      console.error('Error loading opportunity data:', err);
      setError('Failed to load opportunity analysis');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center space-y-4">
          <Satellite className="h-12 w-12 mx-auto animate-spin text-blue-500" />
          <div className="text-white">Analyzing ground stations with multi-agent system...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          <div className="text-white">{error}</div>
          <Button onClick={loadOpportunityData} variant="outline">
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{dashboard.totalStationsAnalyzed}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(dashboard.averageOpportunityScore)}`}>
              {dashboard.averageOpportunityScore.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">High Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {dashboard.highOpportunityStations.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Low Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {dashboard.lowOpportunityStations.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stations" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="stations">Station Analysis</TabsTrigger>
          <TabsTrigger value="operators">Operator Comparison</TabsTrigger>
          <TabsTrigger value="regional">Regional Insights</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="stations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* High Opportunity Stations */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  High Opportunity Stations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.highOpportunityStations.slice(0, 5).map((station) => (
                  <div 
                    key={station.stationId}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white">{station.stationName}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {station.location.country}
                        <Badge variant="outline" className={`${getPriorityColor(station.investmentPriority)} text-xs`}>
                          {station.operator}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-lg font-bold ${getScoreColor(station.overallOpportunityScore)}`}>
                        {station.overallOpportunityScore.toFixed(0)}
                      </div>
                      <Progress 
                        value={station.overallOpportunityScore} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Underperforming Stations */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Optimization Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.lowOpportunityStations.slice(0, 5).map((station) => (
                  <div 
                    key={station.stationId}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white">{station.stationName}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {station.location.country}
                        <Badge variant="outline" className={`${getPriorityColor(station.investmentPriority)} text-xs`}>
                          {station.operator}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-lg font-bold ${getScoreColor(station.overallOpportunityScore)}`}>
                        {station.overallOpportunityScore.toFixed(0)}
                      </div>
                      <Progress 
                        value={station.overallOpportunityScore} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Selected Station Detail */}
          {selectedStation && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Station Analysis: {selectedStation.stationName}</span>
                  <Badge className={getPriorityColor(selectedStation.investmentPriority)}>
                    {selectedStation.investmentPriority} Priority
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Utilization</div>
                    <div className={`text-xl font-bold ${getScoreColor(selectedStation.utilizationScore)}`}>
                      {selectedStation.utilizationScore.toFixed(0)}
                    </div>
                    <Progress value={selectedStation.utilizationScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Profitability</div>
                    <div className={`text-xl font-bold ${getScoreColor(selectedStation.profitabilityScore)}`}>
                      {selectedStation.profitabilityScore.toFixed(0)}
                    </div>
                    <Progress value={selectedStation.profitabilityScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Market Opportunity</div>
                    <div className={`text-xl font-bold ${getScoreColor(selectedStation.marketOpportunityScore)}`}>
                      {selectedStation.marketOpportunityScore.toFixed(0)}
                    </div>
                    <Progress value={selectedStation.marketOpportunityScore} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Technical Capability</div>
                    <div className={`text-xl font-bold ${getScoreColor(selectedStation.technicalCapabilityScore)}`}>
                      {selectedStation.technicalCapabilityScore.toFixed(0)}
                    </div>
                    <Progress value={selectedStation.technicalCapabilityScore} className="h-2" />
                  </div>
                </div>

                {/* Opportunity Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-white font-medium">Opportunity Categories</div>
                    {Object.entries(selectedStation.opportunityTypes).map(([type, data]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400 capitalize">{type}</span>
                          <span className={`text-sm font-bold ${getScoreColor(data.score)}`}>
                            {data.score.toFixed(0)}
                          </span>
                        </div>
                        <Progress value={data.score} className="h-1" />
                        <div className="text-xs text-gray-500">{data.reasoning}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="text-white font-medium">Recommended Actions</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-red-400">Immediate (&lt;3 months)</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-6">
                        {selectedStation.recommendedActions.immediate.map((action, i) => (
                          <li key={i}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-400">Short-term (3-12 months)</span>
                      </div>
                      <ul className="text-xs text-gray-400 space-y-1 ml-6">
                        {selectedStation.recommendedActions.shortTerm.slice(0, 3).map((action, i) => (
                          <li key={i}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SES Performance */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  SES Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(dashboard.sesPerformance.averageScore)}`}>
                    {dashboard.sesPerformance.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Average Opportunity Score</div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white">Top Performing Stations</div>
                  {dashboard.sesPerformance.topStations.map((station) => (
                    <div key={station.stationId} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{station.stationName}</span>
                      <span className={`text-sm font-bold ${getScoreColor(station.overallOpportunityScore)}`}>
                        {station.overallOpportunityScore.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Key Opportunities</div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {dashboard.sesPerformance.keyOpportunities.slice(0, 3).map((opp, i) => (
                      <li key={i}>• {opp}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Intelsat Performance */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  Intelsat Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(dashboard.intelsatPerformance.averageScore)}`}>
                    {dashboard.intelsatPerformance.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Average Opportunity Score</div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white">Top Performing Stations</div>
                  {dashboard.intelsatPerformance.topStations.map((station) => (
                    <div key={station.stationId} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{station.stationName}</span>
                      <span className={`text-sm font-bold ${getScoreColor(station.overallOpportunityScore)}`}>
                        {station.overallOpportunityScore.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Key Opportunities</div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {dashboard.intelsatPerformance.keyOpportunities.slice(0, 3).map((opp, i) => (
                      <li key={i}>• {opp}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Regional Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.regionalInsights.map((region) => (
                  <Card key={region.region} className="bg-gray-800/50 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-white">{region.region}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Stations</span>
                        <span className="text-xs text-white">{region.stationCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Avg Score</span>
                        <span className={`text-xs font-bold ${getScoreColor(region.averageScore)}`}>
                          {region.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={region.averageScore} className="h-2" />
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400">Top Opportunities</div>
                        {region.topOpportunities.map((opp, i) => (
                          <div key={i} className="text-xs text-gray-300 truncate">• {opp}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Expand Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.portfolioOptimization.expandCapacity.slice(0, 3).map((station) => (
                    <div key={station.stationId} className="flex justify-between items-center py-2">
                      <div>
                        <div className="text-sm text-white">{station.stationName}</div>
                        <div className="text-xs text-gray-400">{station.location.country}</div>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        {station.opportunityTypes.expansion.score.toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Optimize Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.portfolioOptimization.optimizeOperations.slice(0, 3).map((station) => (
                    <div key={station.stationId} className="flex justify-between items-center py-2">
                      <div>
                        <div className="text-sm text-white">{station.stationName}</div>
                        <div className="text-xs text-gray-400">{station.location.country}</div>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {station.opportunityTypes.optimization.score.toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}