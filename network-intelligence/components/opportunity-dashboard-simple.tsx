/**
 * Simplified Opportunity Dashboard Component
 * 
 * Displays pre-computed ground station opportunity analysis
 * without running full agent analysis on client-side
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
  BarChart3,
  Info
} from 'lucide-react';

import { SES_GROUND_STATIONS, INTELSAT_GROUND_STATIONS, GroundStationEnrichmentService } from '@/lib/data/real-ground-stations';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

interface OpportunityDashboardSimpleProps {
  className?: string;
}

interface StationScore {
  station: GroundStationAnalytics;
  utilizationScore: number;
  profitScore: number;
  opportunityScore: number;
  overallScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function OpportunityDashboardSimple({ className = '' }: OpportunityDashboardSimpleProps) {
  const [stationScores, setStationScores] = useState<StationScore[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      loadStationData();
    }
  }, []);

  const loadStationData = () => {
    try {
      setLoading(true);
      console.log('Starting to load station data...');
      const enrichmentService = new GroundStationEnrichmentService();
      
      // Get all real stations
      const allStations = [...SES_GROUND_STATIONS, ...INTELSAT_GROUND_STATIONS];
      console.log('Total stations to process:', allStations.length);
      
      // Enrich and score stations
      const scores: StationScore[] = allStations.map((realStation, index) => {
        console.log(`Processing station ${index + 1}/${allStations.length}: ${realStation.name}`);
        const station = enrichmentService.enrichGroundStation(realStation);
        
        // Simple scoring logic
        const utilizationScore = calculateUtilizationScore(station);
        const profitScore = calculateProfitScore(station);
        const opportunityScore = calculateOpportunityScore(station);
        const overallScore = (utilizationScore + profitScore + opportunityScore) / 3;
        
        return {
          station,
          utilizationScore,
          profitScore,
          opportunityScore,
          overallScore,
          priority: getPriority(overallScore)
        };
      });
      
      console.log('Successfully processed all stations');
      setStationScores(scores.sort((a, b) => b.overallScore - a.overallScore));
    } catch (err) {
      console.error('Error loading station data:', err);
      // Display error to user
      const errorMessage = err instanceof Error ? err.message : 'Failed to load station data';
      setError(errorMessage);
      setStationScores([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateUtilizationScore = (station: GroundStationAnalytics): number => {
    const utilization = station?.utilization_metrics?.current_utilization || 0;
    if (utilization < 40) return 30 + (utilization / 40) * 20;
    if (utilization <= 80) return 50 + ((utilization - 40) / 40) * 40;
    return 90 - ((utilization - 80) / 20) * 15;
  };

  const calculateProfitScore = (station: GroundStationAnalytics): number => {
    const profitMargin = station?.business_metrics?.profit_margin || 0;
    const revenueGrowth = station?.business_metrics?.revenue_growth_rate || 0;
    return Math.min(100, profitMargin * 2 + revenueGrowth);
  };

  const calculateOpportunityScore = (station: GroundStationAnalytics): number => {
    const utilization = station?.utilization_metrics?.current_utilization || 0;
    const profitMargin = station?.business_metrics?.profit_margin || 0;
    
    if (utilization < 50 && profitMargin > 20) return 90; // High opportunity
    if (utilization < 70 && profitMargin > 15) return 70; // Good opportunity
    if (utilization > 85 && profitMargin < 15) return 30; // Low opportunity
    return 50; // Moderate
  };

  const getPriority = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
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
          <div className="text-white">Loading ground station data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          <div className="text-white">Error loading station data</div>
          <div className="text-sm text-gray-400">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  const sesStations = stationScores.filter(s => s?.station?.operator === 'SES');
  const intelsatStations = stationScores.filter(s => s?.station?.operator === 'Intelsat');
  const highOpportunityStations = stationScores.filter(s => s?.overallScore >= 75);
  const averageScore = stationScores.length > 0 
    ? stationScores.reduce((sum, s) => sum + s.overallScore, 0) / stationScores.length
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Stations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stationScores.length}</div>
            <div className="text-xs text-gray-500 mt-1">SES: {sesStations.length} | Intelsat: {intelsatStations.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}
            </div>
            <Progress value={averageScore} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">High Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {highOpportunityStations.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Score &gt; 75</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Analysis Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-500 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Ready
            </div>
            <div className="text-xs text-gray-500 mt-1">Real-time data</div>
          </CardContent>
        </Card>
      </div>

      {/* Notice about simplified version */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <div className="font-medium mb-1">Simplified Analysis View</div>
            <div className="text-xs text-blue-400">
              This view shows pre-computed opportunity scores for all 32 real SES and Intelsat ground stations. 
              The full multi-agent analysis system provides deeper insights but requires server-side processing.
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stations" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="stations">Station Analysis</TabsTrigger>
          <TabsTrigger value="operators">Operator Comparison</TabsTrigger>
          <TabsTrigger value="opportunities">Top Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="stations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Station List */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Ground Stations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {stationScores.map((score) => (
                  <div 
                    key={score.station.station_id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => setSelectedStation(score)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white">{score.station.name}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {score.station.location.country}
                        <Badge variant="outline" className="text-xs">
                          {score.station.operator}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-lg font-bold ${getScoreColor(score.overallScore)}`}>
                        {score.overallScore.toFixed(0)}
                      </div>
                      <Badge className={`${getPriorityColor(score.priority)} text-xs`}>
                        {score.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Station Detail */}
            {selectedStation && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{selectedStation.station.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Utilization</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.utilizationScore)}`}>
                        {selectedStation.utilizationScore.toFixed(0)}
                      </div>
                      <Progress value={selectedStation.utilizationScore} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Profitability</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.profitScore)}`}>
                        {selectedStation.profitScore.toFixed(0)}
                      </div>
                      <Progress value={selectedStation.profitScore} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">Opportunity</div>
                      <div className={`text-xl font-bold ${getScoreColor(selectedStation.opportunityScore)}`}>
                        {selectedStation.opportunityScore.toFixed(0)}
                      </div>
                      <Progress value={selectedStation.opportunityScore} className="h-2" />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Current Utilization</span>
                      <span className="text-sm text-white">{selectedStation.station.utilization_metrics.current_utilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Profit Margin</span>
                      <span className="text-sm text-white">{selectedStation.station.business_metrics.profit_margin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Monthly Revenue</span>
                      <span className="text-sm text-white">${(selectedStation.station.business_metrics.monthly_revenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Capacity</span>
                      <span className="text-sm text-white">{selectedStation.station.capacity_metrics.total_capacity_gbps} Gbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">ROI</span>
                      <span className="text-sm text-white">{selectedStation.station.roi_metrics.annual_roi_percentage}%</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <div className="text-sm font-medium text-white">Quick Insights</div>
                    <div className="space-y-2 text-xs text-gray-400">
                      {selectedStation.utilizationScore < 50 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                          <span>Low utilization indicates potential for increased sales efforts</span>
                        </div>
                      )}
                      {selectedStation.profitScore > 70 && (
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500 mt-0.5" />
                          <span>Strong profitability - consider capacity expansion</span>
                        </div>
                      )}
                      {selectedStation.opportunityScore > 80 && (
                        <div className="flex items-start gap-2">
                          <Target className="h-3 w-3 text-blue-500 mt-0.5" />
                          <span>High opportunity location for investment</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
                  <div className={`text-3xl font-bold ${getScoreColor(sesStations.reduce((sum, s) => sum + s.overallScore, 0) / sesStations.length)}`}>
                    {(sesStations.reduce((sum, s) => sum + s.overallScore, 0) / sesStations.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Average Score</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Top Stations</div>
                  {sesStations.slice(0, 3).map((score) => (
                    <div key={score.station.station_id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{score.station.name}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score.overallScore)}`}>
                        {score.overallScore.toFixed(0)}
                      </span>
                    </div>
                  ))}
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
                  <div className={`text-3xl font-bold ${getScoreColor(intelsatStations.reduce((sum, s) => sum + s.overallScore, 0) / intelsatStations.length)}`}>
                    {(intelsatStations.reduce((sum, s) => sum + s.overallScore, 0) / intelsatStations.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">Average Score</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Top Stations</div>
                  {intelsatStations.slice(0, 3).map((score) => (
                    <div key={score.station.station_id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{score.station.name}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score.overallScore)}`}>
                        {score.overallScore.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Expansion Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stationScores
                    .filter(s => s.station.utilization_metrics.current_utilization > 75)
                    .slice(0, 5)
                    .map((score) => (
                      <div key={score.station.station_id} className="text-sm">
                        <div className="text-white">{score.station.name}</div>
                        <div className="text-xs text-gray-400">
                          {score.station.utilization_metrics.current_utilization}% utilized
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Optimization Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stationScores
                    .filter(s => s.station.business_metrics.profit_margin < 20)
                    .slice(0, 5)
                    .map((score) => (
                      <div key={score.station.station_id} className="text-sm">
                        <div className="text-white">{score.station.name}</div>
                        <div className="text-xs text-gray-400">
                          {score.station.business_metrics.profit_margin}% margin
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  High ROI Stations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stationScores
                    .sort((a, b) => b.station.roi_metrics.annual_roi_percentage - a.station.roi_metrics.annual_roi_percentage)
                    .slice(0, 5)
                    .map((score) => (
                      <div key={score.station.station_id} className="text-sm">
                        <div className="text-white">{score.station.name}</div>
                        <div className="text-xs text-gray-400">
                          {score.station.roi_metrics.annual_roi_percentage}% ROI
                        </div>
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