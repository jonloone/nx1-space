"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Satellite, Eye, EyeOff } from "lucide-react";
import { Satellite as SatelliteType, OperatorConfig } from "@/lib/types/satellite";
import { 
  groupSatellitesByOperator, 
  filterSatellitesByOperators,
  calculateCoverageStats,
  formatLongitude,
  sortSatellitesByLongitude
} from "@/lib/satellite-utils";

interface SatelliteControlPanelProps {
  satellites: SatelliteType[];
  onVisualizationChange: (options: {
    showPositions: boolean;
    showCoverage: boolean;
    showLabels: boolean;
    selectedOperators: string[];
    selectedSatellites: string[];
    coverageOpacity: number;
  }) => void;
}

export function SatelliteControlPanel({ satellites, onVisualizationChange }: SatelliteControlPanelProps) {
  const [showPositions, setShowPositions] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [coverageOpacity, setCoverageOpacity] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());
  
  // Group satellites by operator
  const operators = useMemo(() => groupSatellitesByOperator(satellites), [satellites]);
  const [operatorStates, setOperatorStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    operators.forEach(op => {
      initial[op.name] = true;
    });
    return initial;
  });

  // Filter satellites based on search and selection
  const filteredSatellites = useMemo(() => {
    const selectedOperators = Object.entries(operatorStates)
      .filter(([_, selected]) => selected)
      .map(([name]) => name);
    
    let filtered = filterSatellitesByOperators(satellites, selectedOperators);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sat => 
        sat.operator.toLowerCase().includes(term) ||
        sat.operator_type.toLowerCase().includes(term) ||
        formatLongitude(sat.longitude).includes(term)
      );
    }
    
    return sortSatellitesByLongitude(filtered);
  }, [satellites, operatorStates, searchTerm]);

  // Calculate coverage stats for selected satellites
  const selectedSatellitesList = useMemo(() => {
    if (selectedSatellites.size === 0) return filteredSatellites;
    return filteredSatellites.filter(sat => selectedSatellites.has(sat.id));
  }, [filteredSatellites, selectedSatellites]);

  const coverageStats = useMemo(() => 
    calculateCoverageStats(selectedSatellitesList), 
    [selectedSatellitesList]
  );

  // Update visualization when settings change
  useEffect(() => {
    const selectedOperators = Object.entries(operatorStates)
      .filter(([_, selected]) => selected)
      .map(([name]) => name);

    onVisualizationChange({
      showPositions,
      showCoverage,
      showLabels,
      selectedOperators,
      selectedSatellites: Array.from(selectedSatellites),
      coverageOpacity: coverageOpacity / 100
    });
  }, [showPositions, showCoverage, showLabels, operatorStates, selectedSatellites, coverageOpacity, onVisualizationChange]);

  const handleOperatorToggle = (operatorName: string, checked: boolean) => {
    setOperatorStates(prev => ({ ...prev, [operatorName]: checked }));
  };

  const handleSelectAllOperator = (operatorName: string) => {
    const operator = operators.find(op => op.name === operatorName);
    if (!operator) return;

    const newSelected = new Set(selectedSatellites);
    operator.satellites.forEach(sat => {
      newSelected.add(sat.id);
    });
    setSelectedSatellites(newSelected);
  };

  const handleDeselectAllOperator = (operatorName: string) => {
    const operator = operators.find(op => op.name === operatorName);
    if (!operator) return;

    const newSelected = new Set(selectedSatellites);
    operator.satellites.forEach(sat => {
      newSelected.delete(sat.id);
    });
    setSelectedSatellites(newSelected);
  };

  const handleSatelliteToggle = (satelliteId: string, checked: boolean) => {
    const newSelected = new Set(selectedSatellites);
    if (checked) {
      newSelected.add(satelliteId);
    } else {
      newSelected.delete(satelliteId);
    }
    setSelectedSatellites(newSelected);
  };

  const handleSelectAllVisible = () => {
    setSelectedSatellites(new Set(filteredSatellites.map(sat => sat.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSatellites(new Set());
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Satellite className="h-5 w-5" />
          Satellite Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visualization Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Display Options</h4>
          
          <div className="flex items-center justify-between">
            <Label>Show Positions</Label>
            <Switch 
              checked={showPositions}
              onCheckedChange={setShowPositions}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Coverage</Label>
            <Switch 
              checked={showCoverage}
              onCheckedChange={setShowCoverage}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Labels</Label>
            <Switch 
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
          </div>

          {showCoverage && (
            <div className="space-y-2">
              <Label>Coverage Opacity: {coverageOpacity}%</Label>
              <input
                type="range"
                min="10"
                max="80"
                value={coverageOpacity}
                onChange={(e) => setCoverageOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Search */}
        <div className="space-y-2">
          <Label>Search Satellites</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by operator or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Operator Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Operators</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllVisible}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {operators.map(operator => {
            const isVisible = operatorStates[operator.name];
            const visibleSats = operator.satellites.filter(sat => 
              filteredSatellites.some(fs => fs.id === sat.id)
            );
            const selectedCount = visibleSats.filter(sat => 
              selectedSatellites.has(sat.id)
            ).length;

            return (
              <div key={operator.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isVisible}
                      onCheckedChange={(checked) => 
                        handleOperatorToggle(operator.name, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `rgb(${operator.color.join(',')})` }}
                      />
                      <Label className="font-medium">{operator.name}</Label>
                      <Badge variant="secondary" className="text-xs">
                        {visibleSats.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {isVisible && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllOperator(operator.name)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeselectAllOperator(operator.name)}
                        className="h-6 px-2 text-xs"
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {isVisible && visibleSats.length > 0 && (
                  <div className="ml-6 space-y-2 max-h-32 overflow-y-auto">
                    {visibleSats.slice(0, 10).map(satellite => (
                      <div key={satellite.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedSatellites.has(satellite.id)}
                            onCheckedChange={(checked) => 
                              handleSatelliteToggle(satellite.id, checked as boolean)
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {formatLongitude(satellite.longitude)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {visibleSats.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        +{visibleSats.length - 10} more satellites
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Mission Planning Stats */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Mission Planning</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Satellites</span>
              <span className="font-medium">{coverageStats.satelliteCount}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Global Coverage</span>
                <span className="font-medium">{coverageStats.coveragePercentage}%</span>
              </div>
              <Progress value={coverageStats.coveragePercentage} className="h-2" />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Redundancy</span>
              <span className="font-medium">{coverageStats.redundancy}x</span>
            </div>
          </div>

          <Button className="w-full" size="sm">
            Export Mission Plan
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="pt-2 space-y-2">
          <h4 className="text-sm font-medium">Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Satellites</span>
              <span className="font-medium">{satellites.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visible</span>
              <span className="font-medium">{filteredSatellites.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected</span>
              <span className="font-medium">{selectedSatellites.size}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}