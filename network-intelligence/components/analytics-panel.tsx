"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export function AnalyticsPanel({ selectedAsset }: { selectedAsset: any }) {
  if (!selectedAsset) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Select an Asset</CardTitle>
          <CardDescription>
            Click on a ground station or network node to view details
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle>{selectedAsset.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline">{selectedAsset.type?.replace('_', ' ').toUpperCase()}</Badge>
            {selectedAsset.operator && (
              <Badge variant="secondary" className="ml-2">{selectedAsset.operator}</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Capacity Utilization */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Capacity Utilization</span>
              <span className="text-sm text-muted-foreground">
                {selectedAsset.utilization || 0}%
              </span>
            </div>
            <Progress value={selectedAsset.utilization || 0} className="h-2" />
          </div>

          <Separator />

          {/* Network Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Network Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Capacity</span>
                <p className="font-medium">{selectedAsset.capacity || 'N/A'} Gbps</p>
              </div>
              <div>
                <span className="text-muted-foreground">Investment Score</span>
                <p className="font-medium">{selectedAsset.investmentScore || 'N/A'}/100</p>
              </div>
              {selectedAsset.services && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Services</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedAsset.services.map((service: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Investment Analysis */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Investment Analysis</h4>
            <div className="space-y-2">
              <InvestmentMetric 
                label="Market Opportunity" 
                value={getMarketOpportunity(selectedAsset.investmentScore)}
                type={getOpportunityType(selectedAsset.investmentScore)}
              />
              <InvestmentMetric 
                label="Risk Level" 
                value={getRiskLevel(selectedAsset)}
                type={getRiskType(selectedAsset)}
              />
              <InvestmentMetric 
                label="ROI Potential" 
                value={getROIPotential(selectedAsset)}
                type="info"
              />
            </div>
          </div>

          {/* Location Info for Ground Stations */}
          {selectedAsset.coordinates && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Location</h4>
                <div className="text-sm text-muted-foreground">
                  Lat: {selectedAsset.coordinates[1].toFixed(4)}°, 
                  Lng: {selectedAsset.coordinates[0].toFixed(4)}°
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvestmentMetric({ label, value, type }: { label: string; value: string; type: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    excellent: "default",
    good: "secondary",
    moderate: "outline",
    poor: "destructive",
    info: "secondary"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Badge variant={variants[type] || "outline"}>
        {value}
      </Badge>
    </div>
  );
}

function getMarketOpportunity(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Moderate";
  return "Limited";
}

function getOpportunityType(score: number): string {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 70) return "moderate";
  return "poor";
}

function getRiskLevel(asset: any): string {
  // Simple risk calculation based on utilization and score
  const utilization = asset.utilization || 0;
  const score = asset.investmentScore || 0;
  
  if (utilization > 85) return "High";
  if (score < 70) return "High";
  if (utilization > 70 && score > 80) return "Low";
  return "Medium";
}

function getRiskType(asset: any): string {
  const risk = getRiskLevel(asset);
  if (risk === "Low") return "excellent";
  if (risk === "Medium") return "moderate";
  return "poor";
}

function getROIPotential(asset: any): string {
  const score = asset.investmentScore || 0;
  const utilization = asset.utilization || 0;
  
  if (score >= 85 && utilization < 80) return "15-20% annually";
  if (score >= 75) return "10-15% annually";
  if (score >= 65) return "5-10% annually";
  return "< 5% annually";
}