"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Activity,
  Globe,
  Zap,
  Users,
  Building2,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  NetworkHealthMetrics,
  RegionalPerformance,
  GroundStationGrowthOpportunity,
  MarketExpansionOpportunity,
  GroundStationAnalytics
} from '@/lib/types/ground-station';
import {
  calculateNetworkHealth,
  analyzeRegionalPerformance,
  identifyExpansionOpportunities,
  identifyGeographicExpansionOpportunities,
  calculateBusinessMetrics,
  calculateROIMetrics
} from '@/lib/business-intelligence';
import { loadGroundStationAnalytics, generateGrowthOpportunities } from '@/lib/data-loader';

interface BIDashboardPanelProps {
  selectedAsset?: any;
}

export function BIDashboardPanel({ selectedAsset }: BIDashboardPanelProps) {
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthMetrics | null>(null);
  const [regionalPerformance, setRegionalPerformance] = useState<RegionalPerformance[]>([]);
  const [growthOpportunities, setGrowthOpportunities] = useState<GroundStationGrowthOpportunity[]>([]);
  const [expansionOpportunities, setExpansionOpportunities] = useState<MarketExpansionOpportunity[]>([]);
  const [stations, setStations] = useState<GroundStationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load ground station analytics data
        const analyticsData = await loadGroundStationAnalytics();
        const stationsWithOpportunities = generateGrowthOpportunities(analyticsData);
        
        setStations(stationsWithOpportunities);
        
        // Calculate metrics
        const health = calculateNetworkHealth(stationsWithOpportunities);
        const regional = analyzeRegionalPerformance(stationsWithOpportunities);
        const growth = identifyExpansionOpportunities(stationsWithOpportunities);
        const expansion = identifyGeographicExpansionOpportunities(stationsWithOpportunities, []);

        setNetworkHealth(health);
        setRegionalPerformance(regional);
        setGrowthOpportunities(growth);
        setExpansionOpportunities(expansion);
      } catch (error) {
        console.error('Failed to load BI data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading BI Dashboard...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Business Intelligence Dashboard</h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="expansion">Expansion</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <NetworkOverviewCards networkHealth={networkHealth} />
          <NetworkHealthChart networkHealth={networkHealth} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <GrowthOpportunitiesSection opportunities={growthOpportunities} />
          <ROIAnalysisSection stations={stations} />
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <RegionalPerformanceSection regional={regionalPerformance} />
        </TabsContent>

        <TabsContent value="expansion" className="space-y-4">
          <ExpansionOpportunitiesSection opportunities={expansionOpportunities} />
          <CoverageGapAnalysis networkHealth={networkHealth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NetworkOverviewCards({ networkHealth }: { networkHealth: NetworkHealthMetrics | null }) {
  if (!networkHealth) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <div className="text-xs font-medium text-muted-foreground">Network Utilization</div>
          </div>
          <div className="text-xl font-bold">
            {networkHealth.overall_network_utilization.toFixed(1)}%
          </div>
          <Progress value={networkHealth.overall_network_utilization} className="h-1 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div className="text-xs font-medium text-muted-foreground">Monthly Revenue</div>
          </div>
          <div className="text-xl font-bold">
            ${(networkHealth.total_monthly_revenue / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {networkHealth.active_stations} active stations
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-500" />
            <div className="text-xs font-medium text-muted-foreground">Total Capacity</div>
          </div>
          <div className="text-xl font-bold">
            {networkHealth.total_capacity_gbps} Gbps
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {networkHealth.network_efficiency_score.toFixed(1)}% efficiency
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <div className="text-xs font-medium text-muted-foreground">SLA Compliance</div>
          </div>
          <div className="text-xl font-bold">
            {networkHealth.average_sla_compliance.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {networkHealth.maintenance_required} need maintenance
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NetworkHealthChart({ networkHealth }: { networkHealth: NetworkHealthMetrics | null }) {
  if (!networkHealth) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Network Health Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Active Stations</span>
          <Badge variant="default">{networkHealth.active_stations}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Offline Stations</span>
          <Badge variant={networkHealth.offline_stations > 0 ? "destructive" : "secondary"}>
            {networkHealth.offline_stations}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Maintenance Required</span>
          <Badge variant={networkHealth.maintenance_required > 2 ? "outline" : "secondary"}>
            {networkHealth.maintenance_required}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Critical Coverage Gaps</span>
          <Badge variant={networkHealth.critical_gaps.length > 0 ? "destructive" : "default"}>
            {networkHealth.critical_gaps.length}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthOpportunitiesSection({ opportunities }: { opportunities: GroundStationGrowthOpportunity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Growth Opportunities
        </CardTitle>
        <CardDescription>Top investment opportunities ranked by priority</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.slice(0, 3).map((opp, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {opp.opportunity_type.replace('_', ' ').toUpperCase()}
              </Badge>
              <div className="text-sm font-medium">Priority: {opp.priority_score}/100</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Investment: ${(opp.investment_required / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-muted-foreground">
              Projected ROI: {opp.projected_roi.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Success Probability: {opp.success_probability}%
            </div>
            <Progress value={opp.priority_score} className="h-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ROIAnalysisSection({ stations }: { stations: GroundStationAnalytics[] }) {
  const avgROI = stations.reduce((sum, s) => sum + s.roi_metrics.annual_roi_percentage, 0) / stations.length;
  const totalRevenue = stations.reduce((sum, s) => sum + s.business_metrics.monthly_revenue * 12, 0);
  const totalInvestment = stations.reduce((sum, s) => sum + s.roi_metrics.initial_investment, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          ROI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Average ROI</div>
            <div className="text-lg font-bold text-green-600">{avgROI.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Annual Revenue</div>
            <div className="text-lg font-bold">${(totalRevenue / 1000000).toFixed(1)}M</div>
          </div>
        </div>
        <Separator />
        <div className="text-xs text-muted-foreground">
          Total Network Investment: ${(totalInvestment / 1000000).toFixed(1)}M
        </div>
        <div className="text-xs text-muted-foreground">
          Average Payback Period: {stations.reduce((sum, s) => sum + s.roi_metrics.payback_period_months, 0) / stations.length / 12}yrs
        </div>
      </CardContent>
    </Card>
  );
}

function RegionalPerformanceSection({ regional }: { regional: RegionalPerformance[] }) {
  return (
    <div className="space-y-3">
      {regional.map((region, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {region.region} Region
            </CardTitle>
            <CardDescription>
              <Badge variant="outline">{region.competitive_position}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Stations:</span>
                <span className="ml-2 font-medium">{region.total_stations}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Utilization:</span>
                <span className="ml-2 font-medium">{region.average_utilization.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue:</span>
                <span className="ml-2 font-medium">${(region.total_revenue / 1000000).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Growth Rate:</span>
                <span className={`ml-2 font-medium ${region.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {region.growth_rate > 0 ? '+' : ''}{region.growth_rate.toFixed(1)}%
                </span>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-xs font-medium mb-1">Key Opportunities:</div>
              <div className="flex flex-wrap gap-1">
                {region.key_opportunities.map((opp, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{opp}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExpansionOpportunitiesSection({ opportunities }: { opportunities: MarketExpansionOpportunity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Market Expansion Opportunities
        </CardTitle>
        <CardDescription>Strategic markets for new ground stations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.slice(0, 4).map((opp, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{opp.location.city}, {opp.location.country}</div>
              <Badge 
                variant={opp.strategic_importance > 80 ? "default" : 
                        opp.strategic_importance > 60 ? "secondary" : "outline"}
              >
                Score: {opp.strategic_importance}/100
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Market Size: ${(opp.market_size / 1000000).toFixed(0)}M</div>
              <div>Competition: {opp.competition_level}</div>
              <div>Investment: ${(opp.investment_required / 1000000).toFixed(1)}M</div>
              <div>ROI: {opp.roi_projection.toFixed(1)}%</div>
            </div>
            <Progress value={opp.strategic_importance} className="h-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CoverageGapAnalysis({ networkHealth }: { networkHealth: NetworkHealthMetrics | null }) {
  if (!networkHealth) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Coverage Gap Analysis
        </CardTitle>
        <CardDescription>Areas requiring network expansion attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {networkHealth.critical_gaps.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No critical coverage gaps identified
          </div>
        ) : (
          networkHealth.critical_gaps.map((gap, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Gap {index + 1}: {gap.location[0].toFixed(2)}°, {gap.location[1].toFixed(2)}°
                </div>
                <Badge 
                  variant={gap.priority === 'high' ? "destructive" : 
                          gap.priority === 'medium' ? "outline" : "secondary"}
                >
                  {gap.priority} priority
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Gap Size: {gap.gap_size_km.toFixed(0)} km radius
              </div>
              <div className="text-xs text-muted-foreground">
                Recommended Action: {gap.priority === 'high' ? 'Immediate expansion planning' :
                                   gap.priority === 'medium' ? 'Medium-term expansion consideration' :
                                   'Monitor for future expansion'}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}