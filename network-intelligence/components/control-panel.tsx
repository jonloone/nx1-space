"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ControlPanel() {
  const [threshold, setThreshold] = useState([70]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showNetworkFlow, setShowNetworkFlow] = useState(false);
  const [showSatellites, setShowSatellites] = useState(true);

  const runAnalysis = () => {
    // Placeholder for analysis trigger
    console.log("Running analysis with:", {
      threshold: threshold[0],
      showHeatmap,
      showNetworkFlow,
      showSatellites
    });
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Analysis Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coverage Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Investment Score Threshold</Label>
            <span className="text-sm text-muted-foreground">{threshold[0]}%</span>
          </div>
          <Slider 
            defaultValue={threshold} 
            max={100} 
            step={5}
            onValueChange={setThreshold}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Show opportunities above this score
          </p>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Heatmap</Label>
              <p className="text-xs text-muted-foreground">Coverage intensity visualization</p>
            </div>
            <Switch 
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Network Flow</Label>
              <p className="text-xs text-muted-foreground">Active data connections</p>
            </div>
            <Switch 
              checked={showNetworkFlow}
              onCheckedChange={setShowNetworkFlow}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Satellites</Label>
              <p className="text-xs text-muted-foreground">GEO satellite positions</p>
            </div>
            <Switch 
              checked={showSatellites}
              onCheckedChange={setShowSatellites}
            />
          </div>
        </div>

        {/* Analysis Button */}
        <Button 
          className="w-full" 
          onClick={runAnalysis}
        >
          Run Investment Analysis
        </Button>

        {/* Quick Stats */}
        <div className="pt-4 space-y-2">
          <h4 className="text-sm font-medium">Quick Stats</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stations</span>
              <span className="font-medium">50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High Value Opportunities</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coverage Gaps</span>
              <span className="font-medium">7</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}