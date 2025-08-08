"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface StationDetailsProps {
  station: {
    id: string;
    name: string;
    operator: string;
    capacity: number;
    utilization: number;
    coordinates: [number, number];
    services: string[];
    connectedSatellites?: string[];
  } | null;
}

export function StationDetails({ station }: StationDetailsProps) {
  if (!station) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a station to view details</p>
        </CardContent>
      </Card>
    );
  }

  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 95) return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500' };
    if (utilization >= 90) return { label: 'High', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (utilization >= 70) return { label: 'Good', color: 'bg-green-500', textColor: 'text-green-500' };
    return { label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-500' };
  };

  const status = getUtilizationStatus(station.utilization);

  // Mock additional operational data
  const operationalData = {
    dataTransferred: Math.floor(station.capacity * station.utilization * 0.01 * 24 * 30), // GB/month estimate
    activeConnections: Math.floor(station.utilization * 0.5 + 10),
    uptimePercentage: 99.2 + (Math.random() * 0.8),
    signalQuality: 85 + (Math.random() * 10),
    regionalMarketGrowth: 12.5 + (Math.random() * 5),
    coverageOverlap: Math.floor(Math.random() * 3) + 1
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{station.name}</span>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Operator</span>
              <p className="font-medium">{station.operator}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Location</span>
              <p className="font-medium">{station.coordinates[1].toFixed(2)}°, {station.coordinates[0].toFixed(2)}°</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Utilization</span>
                <span className={`font-medium ${status.textColor}`}>{station.utilization}%</span>
              </div>
              <Progress value={station.utilization} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Capacity</span>
                <p className="font-medium">{station.capacity} Gbps</p>
              </div>
              <div>
                <span className="text-muted-foreground">Active Load</span>
                <p className="font-medium">{Math.round(station.capacity * station.utilization / 100)} Gbps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operational Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data/Month</span>
              <p className="font-medium">{operationalData.dataTransferred.toLocaleString()} GB</p>
            </div>
            <div>
              <span className="text-muted-foreground">Active Connections</span>
              <p className="font-medium">{operationalData.activeConnections}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uptime</span>
              <span className="font-medium text-green-400">{operationalData.uptimePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={operationalData.uptimePercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Signal Quality</span>
              <span className="font-medium">{operationalData.signalQuality.toFixed(1)} dB</span>
            </div>
            <Progress value={operationalData.signalQuality} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Satellites</CardTitle>
        </CardHeader>
        <CardContent>
          {station.connectedSatellites && station.connectedSatellites.length > 0 ? (
            <div className="space-y-2">
              {station.connectedSatellites.map((satId) => (
                <div key={satId} className="flex items-center justify-between text-sm">
                  <span>{satId.toUpperCase().replace('-', ' ')}</span>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No satellite connections available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(station.services || ['Data', 'Video', 'Voice']).map((service) => (
              <Badge key={service} variant="secondary" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regional Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Market Growth</span>
            <span className="font-medium text-green-400">+{operationalData.regionalMarketGrowth.toFixed(1)}%</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Coverage Overlap</span>
            <span className="font-medium">{operationalData.coverageOverlap} satellite{operationalData.coverageOverlap > 1 ? 's' : ''}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Regional demand trending upward with increased enterprise connectivity requirements and growing streaming services adoption.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}