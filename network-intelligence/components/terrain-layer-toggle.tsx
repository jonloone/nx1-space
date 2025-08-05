"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mountain, Waves, AlertTriangle, TrendingUp } from 'lucide-react';

interface TerrainLayerToggleProps {
  onToggle: (enabled: boolean) => void;
  terrainStats?: {
    avgElevation: number;
    highRiskAreas: number;
    optimalSites: number;
  };
}

export function TerrainLayerToggle({ onToggle, terrainStats }: TerrainLayerToggleProps) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onToggle(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Terrain Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable Terrain Layer</label>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>

        {enabled && terrainStats && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Elevation</span>
              <Badge variant="secondary">{terrainStats.avgElevation}m</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Risk Areas</span>
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {terrainStats.highRiskAreas}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Optimal Sites</span>
              <Badge variant="default">
                <TrendingUp className="h-3 w-3 mr-1" />
                {terrainStats.optimalSites}
              </Badge>
            </div>
          </div>
        )}

        {enabled && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Red: High risk (steep slopes, flood zones)</p>
            <p>• Yellow: Moderate terrain challenges</p>
            <p>• Green: Optimal terrain conditions</p>
            <p>• Blue: Higher elevation advantage</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}