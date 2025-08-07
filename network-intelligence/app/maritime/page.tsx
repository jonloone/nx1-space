'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MaritimeControlPanel } from '@/components/maritime-control-panel';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ship, Anchor, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Dynamic imports to avoid SSR issues
const DeckGL = dynamic(() => import('@deck.gl/react').then(mod => mod.default), { ssr: false });
const Map = dynamic(() => import('react-map-gl/maplibre').then(mod => mod.default), { ssr: false });
const MaritimeHeatmapLayers = dynamic(
  () => import('@/components/maritime-heatmap-layer').then(mod => mod.MaritimeHeatmapLayers),
  { ssr: false }
);

// Import data
import { GLOBAL_SHIPPING_LANES } from '@/lib/data/shippingLanes';
import { maritimeOpportunityScoringService } from '@/lib/services/maritimeOpportunityScoring';
import { maritimeCoverageService } from '@/lib/services/maritimeCoverage';
import { SES_PRECOMPUTED_SCORES, INTELSAT_PRECOMPUTED_SCORES } from '@/lib/data/precomputed-opportunity-scores';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2.5,
  pitch: 0,
  bearing: 0,
  minZoom: 2,
  maxZoom: 12
};

export default function MaritimePage() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [viewMode, setViewMode] = useState<'density' | 'lanes' | 'coverage' | 'opportunities'>('density');
  const [currentTime, setCurrentTime] = useState(12);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  
  // Layer visibility
  const [layerVisibility, setLayerVisibility] = useState({
    heatmap: true,
    vessels: true,
    lanes: true,
    coverage: false,
    competitors: false,
    opportunities: true
  });

  // Calculate maritime opportunities
  const maritimeOpportunities = useMemo(() => {
    return maritimeOpportunityScoringService.findMaritimeOpportunities();
  }, []);

  // Calculate maritime coverage for SES stations
  const stationCoverages = useMemo(() => {
    const allStations = [...SES_PRECOMPUTED_SCORES, ...INTELSAT_PRECOMPUTED_SCORES];
    return allStations.map(station => ({
      ...station,
      maritimeCoverage: maritimeCoverageService.calculateStationMaritimeCoverage(station)
    }));
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const vesselsInRange = stationCoverages.reduce(
      (sum, s) => sum + s.maritimeCoverage.vessels_in_footprint, 0
    );
    
    const coveredLanes = new Set(
      stationCoverages.flatMap(s => s.maritimeCoverage.shipping_lanes_covered)
    );
    const laneCoverage = (coveredLanes.size / GLOBAL_SHIPPING_LANES.length) * 100;
    
    const revenuePotential = stationCoverages.reduce(
      (sum, s) => sum + s.maritimeCoverage.revenue_potential, 0
    );
    
    const o3bCapableStations = stationCoverages.filter(s => s.maritimeCoverage.o3b_capable);
    
    return {
      vesselsInRange,
      laneCoverage: Math.round(laneCoverage),
      revenuePotential,
      uncoveredShips: Math.round(vesselsInRange * 0.33), // Estimate
      competitorCoverage: 45, // From competitor analysis
      o3bOpportunities: o3bCapableStations.length
    };
  }, [stationCoverages]);

  // Generate sample maritime data for visualization
  const maritimeData = useMemo(() => {
    // Sample vessel positions
    const vesselPositions = Array.from({ length: 500 }, (_, i) => ({
      id: `vessel-${i}`,
      position: [
        Math.random() * 360 - 180,
        Math.random() * 140 - 70
      ] as [number, number],
      type: ['container', 'tanker', 'cruise', 'bulk', 'general'][Math.floor(Math.random() * 5)] as any,
      heading: Math.random() * 360,
      speed: Math.random() * 20 + 5
    }));

    // Ground station coverages
    const groundStationCoverages = stationCoverages.map(station => ({
      id: station.stationId,
      operator: station.operator,
      center: [...station.coordinates].reverse() as [number, number],
      radius: 3000, // km
      coveragePolygon: [] // Simplified
    }));

    // Opportunity markers
    const opportunityMarkers = maritimeOpportunities.slice(0, 20).map(opp => ({
      id: `opp-${opp.type}`,
      position: opp.location,
      type: opp.type,
      value: opp.revenue_potential,
      competition: 0.3
    }));

    return {
      vesselPositions,
      vesselTrips: [], // Would be generated from vessel positions
      shippingLanes: GLOBAL_SHIPPING_LANES.map(lane => ({
        id: lane.laneId,
        waypoints: lane.waypoints,
        importance: lane.value.valueTier === 'premium' ? 1 : 
                    lane.value.valueTier === 'high' ? 0.7 : 0.5
      })),
      groundStationCoverages,
      opportunityMarkers
    };
  }, [maritimeOpportunities, stationCoverages]);

  // Create layers
  const layers = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    return MaritimeHeatmapLayers({
      vesselPositions: maritimeData.vesselPositions,
      vesselTrips: maritimeData.vesselTrips,
      shippingLanes: maritimeData.shippingLanes,
      groundStationCoverages: maritimeData.groundStationCoverages,
      opportunityMarkers: maritimeData.opportunityMarkers,
      currentTime,
      animationEnabled,
      heatmapIntensity: 1,
      layerVisibility,
      onVesselClick: (vessel) => console.log('Vessel clicked:', vessel),
      onOpportunityClick: (opportunity) => setSelectedOpportunity(opportunity)
    });
  }, [maritimeData, currentTime, animationEnabled, layerVisibility]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-black p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Ship className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Maritime Intelligence</h1>
                  <p className="text-gray-400 text-sm">$3.5B Annual Market Opportunity</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Anchor className="w-3 h-3 mr-1" />
                {metrics.vesselsInRange.toLocaleString()} vessels tracked
              </Badge>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                {maritimeOpportunities.length} opportunities
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <DollarSign className="w-3 h-3 mr-1" />
                ${(metrics.revenuePotential / 1000000).toFixed(0)}M potential
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-[calc(100vh-120px)]">
        {/* Map Container */}
        <div className="absolute inset-0">
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

        {/* Control Panel */}
        <div className="absolute top-4 left-4 z-10 w-80">
          <MaritimeControlPanel
            onViewModeChange={setViewMode}
            onTimeChange={setCurrentTime}
            onAnimationToggle={setAnimationEnabled}
            onLayerToggle={(layer, visible) => {
              setLayerVisibility(prev => ({
                ...prev,
                [layer]: visible
              }));
            }}
            metrics={metrics}
          />
        </div>

        {/* Opportunity List */}
        <div className="absolute top-4 right-4 z-10 w-80 max-h-[600px] overflow-y-auto">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
            <h3 className="text-white font-semibold mb-3">Top Maritime Opportunities</h3>
            <div className="space-y-2">
              {maritimeOpportunities.slice(0, 5).map((opp, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setSelectedOpportunity(opp)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={
                        opp.priority === 'CRITICAL' ? 'destructive' :
                        opp.priority === 'VERY_HIGH' ? 'default' :
                        'secondary'
                      } className="mb-1">
                        {opp.type.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        ROI: {opp.roi_months} months
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">
                        ${(opp.revenue_potential / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-gray-400">
                        annual
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Selected Opportunity Details */}
        {selectedOpportunity && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[600px]">
            <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">Opportunity Details</h3>
                  <Badge variant="outline" className="mt-1">
                    {selectedOpportunity.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Investment Required</div>
                  <div className="text-white font-semibold">
                    ${(selectedOpportunity.investment_required / 1000000).toFixed(0)}M
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Annual Revenue</div>
                  <div className="text-green-400 font-semibold">
                    ${(selectedOpportunity.revenue_potential / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">ROI Period</div>
                  <div className="text-yellow-400 font-semibold">
                    {selectedOpportunity.roi_months} months
                  </div>
                </div>
              </div>
              
              {selectedOpportunity.details && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <pre className="text-xs text-gray-400">
                    {JSON.stringify(selectedOpportunity.details, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}