"use client";

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

interface GroundStationPopupProps {
  station: GroundStationAnalytics | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroundStationPopup({ station, isOpen, onClose }: GroundStationPopupProps) {
  const revenueChartData = useMemo(() => {
    if (!station) return [];
    
    // Generate historical revenue data from utilization history
    return station.utilization_metrics.monthly_utilization_history.map(item => ({
      month: item.month,
      revenue: Math.round((station.business_metrics.monthly_revenue * item.utilization) / station.utilization_metrics.current_utilization),
      utilization: item.utilization
    }));
  }, [station]);

  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent':
        return <Badge className="bg-green-600 text-white">Excellent Investment</Badge>;
      case 'good':
        return <Badge className="bg-blue-600 text-white">Good Investment</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-600 text-black">Moderate Investment</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Under Review</Badge>;
    }
  };

  if (!station) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{station.name}</h2>
              <p className="text-sm text-gray-400">{station.operator} • {station.location.country}</p>
            </div>
            {getRecommendationBadge(station.investment_recommendation)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-green-400">
                  ${(station.business_metrics.monthly_revenue / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-gray-400">Monthly Revenue</div>
              </Card>
              
              <Card className="p-4 bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-blue-400">
                  {station.business_metrics.profit_margin.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Profit Margin</div>
              </Card>
              
              <Card className="p-4 bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-yellow-400">
                  {station.utilization_metrics.current_utilization}%
                </div>
                <div className="text-sm text-gray-400">Utilization</div>
              </Card>
              
              <Card className="p-4 bg-gray-800 border-gray-700">
                <div className={`text-2xl font-bold ${getHealthColor(station.health_score)}`}>
                  {station.health_score}
                </div>
                <div className="text-sm text-gray-400">Health Score</div>
              </Card>
            </div>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Revenue Trend (Last 5 Months)</h3>
              <div className="space-y-2">
                {revenueChartData.map((item, index) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <Progress 
                          value={(item.revenue / station.business_metrics.monthly_revenue) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        ${(item.revenue / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Revenue Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Revenue:</span>
                    <span className="font-medium">${station.business_metrics.monthly_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue per Gbps:</span>
                    <span className="font-medium">${station.business_metrics.revenue_per_gbps.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue Growth:</span>
                    <span className="font-medium text-green-400">+{station.business_metrics.revenue_growth_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer Count:</span>
                    <span className="font-medium">{station.business_metrics.customer_count.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Cost Structure</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Operational Cost:</span>
                    <span className="font-medium">${station.business_metrics.operational_cost_monthly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maintenance Cost:</span>
                    <span className="font-medium">${station.business_metrics.maintenance_cost_monthly.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost per GB:</span>
                    <span className="font-medium">${station.business_metrics.cost_per_gb_transferred.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Churn Rate:</span>
                    <span className="font-medium text-red-400">{station.business_metrics.churn_rate}%</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-3">ROI Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Annual ROI</div>
                  <div className="text-xl font-bold text-green-400">
                    {station.roi_metrics.annual_roi_percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Payback Period</div>
                  <div className="text-xl font-bold">
                    {Math.round(station.roi_metrics.payback_period_months / 12)}y {station.roi_metrics.payback_period_months % 12}m
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">NPV</div>
                  <div className="text-xl font-bold text-blue-400">
                    ${(station.roi_metrics.net_present_value / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">IRR</div>
                  <div className="text-xl font-bold text-purple-400">
                    {station.roi_metrics.internal_rate_of_return.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Capacity Utilization</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Utilization</span>
                      <span>{station.utilization_metrics.current_utilization}%</span>
                    </div>
                    <Progress value={station.utilization_metrics.current_utilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Peak Utilization</span>
                      <span>{station.utilization_metrics.peak_utilization}%</span>
                    </div>
                    <Progress value={station.utilization_metrics.peak_utilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Utilization</span>
                      <span>{station.utilization_metrics.average_utilization}%</span>
                    </div>
                    <Progress value={station.utilization_metrics.average_utilization} className="h-2" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Service Breakdown</h3>
                <div className="space-y-2">
                  {station.capacity_metrics.bandwidth_by_service.map((service, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{service.service}</span>
                        <span>{service.allocated_gbps} Gbps ({service.utilization_percentage}%)</span>
                      </div>
                      <Progress value={service.utilization_percentage} className="h-1" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Operational Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Capacity</div>
                  <div className="text-lg font-bold">{station.capacity_metrics.total_capacity_gbps} Gbps</div>
                </div>
                <div>
                  <div className="text-gray-400">Available Capacity</div>
                  <div className="text-lg font-bold text-green-400">{station.capacity_metrics.available_capacity_gbps} Gbps</div>
                </div>
                <div>
                  <div className="text-gray-400">SLA Compliance</div>
                  <div className="text-lg font-bold text-blue-400">{station.business_metrics.sla_compliance_rate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Weather Impact</div>
                  <div className="text-lg font-bold">{station.coverage_metrics.weather_impact_days_per_year} days/year</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Antenna Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Primary Antenna:</span>
                    <span className="font-medium">{station.technical_specs.primary_antenna_size_m}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Secondary Antennas:</span>
                    <span className="font-medium">{station.technical_specs.secondary_antennas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">G/T Ratio:</span>
                    <span className="font-medium">{station.technical_specs.g_t_ratio_db} dB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">EIRP:</span>
                    <span className="font-medium">{station.technical_specs.eirp_dbw} dBW</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Coverage & Visibility</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coverage Area:</span>
                    <span className="font-medium">{(station.coverage_metrics.coverage_area_km2 / 1000000).toFixed(1)}M km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Satellite Visibility:</span>
                    <span className="font-medium">{station.coverage_metrics.satellite_visibility_count} satellites</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Elevation Range:</span>
                    <span className="font-medium">{station.coverage_metrics.elevation_angles.min}° - {station.coverage_metrics.elevation_angles.max}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Redundancy Level:</span>
                    <span className="font-medium text-green-400">{station.capacity_metrics.redundancy_level}%</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Frequency Bands & Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-gray-300">Supported Bands</h4>
                  <div className="flex flex-wrap gap-2">
                    {station.technical_specs.frequency_bands.map((band, index) => (
                      <Badge key={index} variant="outline" className="border-blue-500 text-blue-400">
                        {band}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-300">Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {station.technical_specs.services_supported.map((service, index) => (
                      <Badge key={index} variant="outline" className="border-green-500 text-green-400">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}