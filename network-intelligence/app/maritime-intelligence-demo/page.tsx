'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, TrendingUp, Ship, Globe, DollarSign, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { maritimeDemoScenariosService } from '@/lib/services/maritimeDemoScenariosService';
import { maritimeValidationService } from '@/lib/services/maritimeValidationService';
import { VesselType } from '@/lib/data/maritimeDataSources';

// Dynamic imports to avoid SSR issues
const DeckGL = dynamic(() => import('@deck.gl/react').then(mod => mod.default), { ssr: false });
const Map = dynamic(() => import('react-map-gl/maplibre').then(mod => mod.default), { ssr: false });

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Animation settings
interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  timeRange: [number, number];
}

export default function MaritimeIntelligenceDemoPage() {
  const [selectedScenario, setSelectedScenario] = useState('north-atlantic-trade');
  const [currentView, setCurrentView] = useState<'overview' | 'financial' | 'validation' | 'animation'>('overview');
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    timeRange: [0, 24]
  });

  const [viewState, setViewState] = useState({
    longitude: -30,
    latitude: 45,
    zoom: 3,
    pitch: 0,
    bearing: 0
  });

  // Load demo scenarios
  const scenarios = useMemo(() => maritimeDemoScenariosService.getAllScenarios(), []);
  const executiveSummary = useMemo(() => maritimeDemoScenariosService.generateExecutiveSummary(), []);
  
  // Get current scenario data
  const currentScenario = useMemo(() => 
    scenarios.find(s => s.scenario_id === selectedScenario) || scenarios[0]
  , [scenarios, selectedScenario]);

  // Generate validation report
  const validationReport = useMemo(() => 
    maritimeValidationService.generateComprehensiveValidationReport(scenarios)
  , [scenarios]);

  // Generate animated vessel data
  const animatedVesselData = useMemo(() => 
    maritimeDemoScenariosService.generateAnimatedVesselData(selectedScenario)
  , [selectedScenario]);

  // Animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (animationState.isPlaying) {
      interval = setInterval(() => {
        setAnimationState(prev => ({
          ...prev,
          currentTime: prev.currentTime >= prev.timeRange[1] ? 0 : prev.currentTime + 0.5 * prev.speed
        }));
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [animationState.isPlaying, animationState.speed]);

  // Update view state based on scenario
  useEffect(() => {
    const viewStates = {
      'north-atlantic-trade': { longitude: -30, latitude: 45, zoom: 3.5 },
      'trans-pacific-container': { longitude: -140, latitude: 35, zoom: 2.5 },
      'gulf-mexico-energy': { longitude: -90, latitude: 27, zoom: 6 },
      'mediterranean-shipping': { longitude: 15, latitude: 37, zoom: 5.5 }
    };
    
    const targetView = viewStates[selectedScenario as keyof typeof viewStates];
    if (targetView) {
      setViewState(prev => ({ ...prev, ...targetView }));
    }
  }, [selectedScenario]);

  // Get current vessels for animation
  const currentVessels = useMemo(() => {
    const timeIndex = Math.floor(animationState.currentTime);
    return animatedVesselData[timeIndex]?.vessels || [];
  }, [animatedVesselData, animationState.currentTime]);

  // Generate DeckGL layers for vessel visualization
  const layers = useMemo(() => {
    if (typeof window === 'undefined' || currentView !== 'animation') return [];

    const { IconLayer, ArcLayer } = require('@deck.gl/layers');
    
    // Vessel positions layer
    const vesselLayer = new IconLayer({
      id: 'vessels',
      data: currentVessels,
      getPosition: (d: any) => d.position,
      getIcon: (d: any) => ({
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzMzOWFmZiIgZD0iTTEyIDJMMTMgOGg0djJoLTR2MmgzdjJoLTN2MmgzdjJoLTN2MmgzdjJIOGwtMS02VjJoNXoiLz48L3N2Zz4=',
        width: 32,
        height: 32
      }),
      getSize: (d: any) => {
        if (d.vessel_type === VesselType.CRUISE_SHIP) return 40;
        if (d.vessel_type === VesselType.CONTAINER_SHIP) return 35;
        if (d.vessel_type === VesselType.LNG_CARRIER) return 38;
        return 30;
      },
      getColor: (d: any) => {
        if (d.connectivity_status === 'connected') return [51, 154, 255, 200];
        if (d.connectivity_status === 'unserved') return [255, 193, 7, 200];
        return [108, 117, 125, 150];
      },
      pickable: true,
      onHover: ({ object, x, y }) => {
        // Handle vessel hover
      }
    });

    return [vesselLayer];
  }, [currentVessels, currentView]);

  const renderScenarioCard = (scenario: any) => (
    <Card key={scenario.scenario_id} className="p-6 bg-gray-900/95 border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{scenario.scenario_name}</h3>
          <p className="text-gray-400 text-sm">{scenario.geographic_focus}</p>
        </div>
        <Badge variant={scenario.scenario_id === selectedScenario ? 'default' : 'outline'}>
          {scenario.executive_summary.roi_timeline_months}mo ROI
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-xs">TAM</div>
          <div className="text-white font-semibold">{scenario.executive_summary.total_addressable_market}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Investment</div>
          <div className="text-white font-semibold">{scenario.executive_summary.investment_required}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Annual Revenue</div>
          <div className="text-green-400 font-semibold">{scenario.executive_summary.projected_annual_revenue}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Confidence</div>
          <div className="text-yellow-400 font-semibold">{scenario.executive_summary.payback_confidence}</div>
        </div>
      </div>
      
      <Button 
        variant={scenario.scenario_id === selectedScenario ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedScenario(scenario.scenario_id)}
        className="w-full"
      >
        {scenario.scenario_id === selectedScenario ? 'Selected' : 'Select Scenario'}
      </Button>
    </Card>
  );

  const renderFinancialProjections = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-900/95 border-gray-700">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Revenue Progression
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-gray-400 text-sm">Year 1</div>
            <div className="text-2xl font-bold text-white">{currentScenario.financial_projections.year_1.revenue}</div>
            <div className="text-gray-400 text-xs">{currentScenario.financial_projections.year_1.vessels_connected} vessels</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Year 3</div>
            <div className="text-2xl font-bold text-green-400">{currentScenario.financial_projections.year_3.revenue}</div>
            <div className="text-gray-400 text-xs">{currentScenario.financial_projections.year_3.vessels_connected} vessels</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Year 5</div>
            <div className="text-2xl font-bold text-blue-400">{currentScenario.financial_projections.year_5.revenue}</div>
            <div className="text-gray-400 text-xs">{currentScenario.financial_projections.year_5.vessels_connected} vessels</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-900/95 border-gray-700">
        <h3 className="text-white font-semibold mb-4">Vessel Type Revenue Breakdown</h3>
        <div className="space-y-3">
          {currentScenario.vessel_breakdown.map((vessel, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <div className="text-white font-medium">{vessel.vessel_type.replace(/_/g, ' ')}</div>
                <div className="text-gray-400 text-sm">{vessel.count} vessels • {vessel.percentage}%</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-semibold">{vessel.monthly_revenue_per_vessel}</div>
                <div className="text-gray-400 text-xs">per vessel/month</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-900/95 border-gray-700">
        <h3 className="text-white font-semibold mb-4">Investment Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Ground Station Investment</span>
            <span className="text-white">{currentScenario.investment_breakdown.ground_station_investment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Satellite Capacity</span>
            <span className="text-white">{currentScenario.investment_breakdown.satellite_capacity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Operations Setup</span>
            <span className="text-white">{currentScenario.investment_breakdown.operations_setup}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Working Capital</span>
            <span className="text-white">{currentScenario.investment_breakdown.working_capital}</span>
          </div>
          <div className="border-t border-gray-600 pt-3 flex justify-between">
            <span className="text-white font-semibold">Total Investment</span>
            <span className="text-green-400 font-bold">{currentScenario.investment_breakdown.total_investment}</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderValidationResults = () => {
    const scenario_validation = validationReport.scenario_validations.find(
      sv => sv.scenario_id === selectedScenario
    );

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-gray-900/95 border-gray-700">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Validation Summary
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-gray-400 text-sm">Overall Validation Score</div>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={validationReport.overall_validation_score} className="flex-1" />
                <Badge variant={validationReport.validation_confidence === 'high' ? 'default' : 'outline'}>
                  {validationReport.overall_validation_score}%
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Data Quality Score</div>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={validationReport.data_quality_assessment.overall_quality} className="flex-1" />
                <Badge variant="outline">
                  {validationReport.data_quality_assessment.overall_quality}%
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-gray-400 text-sm mb-2">Validation Confidence</div>
            <Badge variant={validationReport.validation_confidence === 'high' ? 'default' : 'secondary'} className="capitalize">
              {validationReport.validation_confidence} Confidence
            </Badge>
          </div>
        </Card>

        {scenario_validation && (
          <Card className="p-6 bg-gray-900/95 border-gray-700">
            <h3 className="text-white font-semibold mb-4">Scenario-Specific Validation</h3>
            <div className="space-y-3">
              {scenario_validation.validation_results.map((result, idx) => (
                <div key={idx} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{result.metric_name}</span>
                    <Badge variant={
                      result.status === 'within_benchmark' ? 'default' :
                      result.status === 'above_benchmark' ? 'secondary' : 'outline'
                    }>
                      {result.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400">
                    Variance: {result.variance_percentage.toFixed(1)}% from benchmark
                  </div>
                  {result.recommendations.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-400">
                      {result.recommendations[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-gray-900/95 border-gray-700">
          <h3 className="text-white font-semibold mb-4">Industry Benchmark Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Market Size</div>
              <div className="text-white font-semibold">
                ${(validationReport.industry_comparison.market_size_validation.projected_value / 1000000000).toFixed(1)}B projected
              </div>
              <div className="text-gray-400 text-xs">
                vs ${(validationReport.industry_comparison.market_size_validation.benchmark_value / 1000000000).toFixed(1)}B benchmark
              </div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400 text-sm">Penetration Rate</div>
              <div className="text-white font-semibold">
                {(validationReport.industry_comparison.penetration_rate_validation.projected_value * 100).toFixed(1)}% projected
              </div>
              <div className="text-gray-400 text-xs">
                vs {(validationReport.industry_comparison.penetration_rate_validation.benchmark_value * 100).toFixed(1)}% benchmark
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderAnimationView = () => (
    <div className="space-y-4">
      {/* Animation Controls */}
      <Card className="p-4 bg-gray-900/95 border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant={animationState.isPlaying ? 'default' : 'outline'}
              onClick={() => setAnimationState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            >
              {animationState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Time:</span>
              <span className="text-white font-mono text-sm">
                {Math.floor(animationState.currentTime).toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">Unserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-400 text-sm">Competitor</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Progress 
            value={(animationState.currentTime / animationState.timeRange[1]) * 100} 
            className="w-full"
          />
        </div>
      </Card>

      {/* Current Status */}
      <Card className="p-4 bg-gray-900/95 border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{currentVessels.length}</div>
            <div className="text-gray-400 text-sm">Active Vessels</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {currentVessels.filter(v => v.connectivity_status === 'connected').length}
            </div>
            <div className="text-gray-400 text-sm">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {currentVessels.filter(v => v.connectivity_status === 'unserved').length}
            </div>
            <div className="text-gray-400 text-sm">Opportunity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${(currentVessels.filter(v => v.connectivity_status === 'unserved')
                .reduce((sum, v) => sum + v.monthly_revenue_potential, 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-gray-400 text-sm">Revenue Potential</div>
          </div>
        </div>
      </Card>

      {/* Map View */}
      <Card className="p-0 bg-gray-900/95 border-gray-700 overflow-hidden">
        <div className="h-[500px] relative">
          <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller={true}
            layers={layers}
          >
            <Map 
              mapStyle={MAP_STYLE}
              mapLib={import('maplibre-gl')}
            />
          </DeckGL>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-black p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/maritime">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Maritime Intelligence Demo</h1>
                  <p className="text-gray-400 text-sm">Statistically Validated Revenue Projections</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <DollarSign className="w-3 h-3 mr-1" />
                {executiveSummary.combined_annual_revenue_potential}
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Target className="w-3 h-3 mr-1" />
                {executiveSummary.confidence_assessment}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Scenario Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-white">Demo Scenarios</h2>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-64 bg-gray-900 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {scenarios.map(scenario => (
                  <SelectItem key={scenario.scenario_id} value={scenario.scenario_id}>
                    {scenario.scenario_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gray-900/95 border-gray-700">
              <div className="text-gray-400 text-sm">Total Addressable Market</div>
              <div className="text-2xl font-bold text-white">{executiveSummary.total_addressable_market}</div>
            </Card>
            <Card className="p-4 bg-gray-900/95 border-gray-700">
              <div className="text-gray-400 text-sm">Total Investment Required</div>
              <div className="text-2xl font-bold text-white">{executiveSummary.total_investment_required}</div>
            </Card>
            <Card className="p-4 bg-gray-900/95 border-gray-700">
              <div className="text-gray-400 text-sm">Combined Revenue Potential</div>
              <div className="text-2xl font-bold text-green-400">{executiveSummary.combined_annual_revenue_potential}</div>
            </Card>
            <Card className="p-4 bg-gray-900/95 border-gray-700">
              <div className="text-gray-400 text-sm">Portfolio Payback</div>
              <div className="text-2xl font-bold text-blue-400">{executiveSummary.portfolio_payback_period}</div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Scenario Details */}
          <div className="col-span-4">
            <Card className="p-6 bg-gray-900/95 border-gray-700">
              <h3 className="text-white font-semibold mb-4">{currentScenario.scenario_name}</h3>
              <p className="text-gray-400 text-sm mb-4">{currentScenario.geographic_focus}</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="text-gray-400 text-sm">Opportunity Story</div>
                  <div className="text-white text-sm mt-1">{currentScenario.compelling_narrative.opportunity_story}</div>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="text-gray-400 text-sm">Value Proposition</div>
                  <div className="text-white text-sm mt-1">{currentScenario.compelling_narrative.value_proposition}</div>
                </div>
                
                <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                  <div className="text-green-400 text-sm font-medium">Call to Action</div>
                  <div className="text-white text-sm mt-1">{currentScenario.compelling_narrative.call_to_action}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Tabbed Content */}
          <div className="col-span-8">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-700">
                <TabsTrigger value="overview" className="text-gray-400 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-gray-400 data-[state=active]:text-white">
                  Financial
                </TabsTrigger>
                <TabsTrigger value="validation" className="text-gray-400 data-[state=active]:text-white">
                  Validation
                </TabsTrigger>
                <TabsTrigger value="animation" className="text-gray-400 data-[state=active]:text-white">
                  Live Demo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {scenarios.map(renderScenarioCard)}
                </div>
              </TabsContent>

              <TabsContent value="financial" className="mt-4">
                {renderFinancialProjections()}
              </TabsContent>

              <TabsContent value="validation" className="mt-4">
                {renderValidationResults()}
              </TabsContent>

              <TabsContent value="animation" className="mt-4">
                {renderAnimationView()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}