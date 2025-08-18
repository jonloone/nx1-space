'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, TrendingUp, Database, Map, 
  Satellite, Radio, Signal, Zap, CloudRain, AlertTriangle,
  BarChart3, Radar, Grid3x3, Table, CheckCircle, Clock
} from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';
import { ChartWrapper } from '@/components/Charts/ChartWrapper';
import { LineChart, LineChartSeries } from '@/components/Charts/LineChart';
import { AreaChart } from '@/components/Charts/AreaChart';
import { RadialChart, SatellitePass } from '@/components/Charts/RadialChart';
import { HeatmapChart, HeatmapDataPoint } from '@/components/Charts/HeatmapChart';
import { DataTable } from '@/components/Tables/DataTable';
import { getTelemetryGenerator, TelemetryGenerator } from '@/lib/services/TelemetryGenerator';
import { groundStationScorer } from '@/lib/scoring/GroundStationScorer';
import { DetailPanel } from '@/components/Panels/DetailPanel';
import { cn } from '@/lib/utils';
import { SimpleEmbeddedAssistant } from '@/components/Chat/SimpleEmbeddedAssistant';

export const GroundStationPanel: React.FC = () => {
  const { selectedFeatures, clearSelection } = useMapStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [telemetryGenerator, setTelemetryGenerator] = useState<TelemetryGenerator | null>(null);
  
  const selectedFeature = selectedFeatures[0];
  const isOpen = !!selectedFeature;

  // Initialize telemetry generator
  useEffect(() => {
    if (selectedFeature) {
      const generator = getTelemetryGenerator(selectedFeature.id, selectedFeature);
      setTelemetryGenerator(generator);
      
      // Generate initial telemetry
      const telemetry = generator.generateCompleteTelemetry();
      setTelemetryData(telemetry);
      
      // Update telemetry every 5 seconds
      const interval = setInterval(() => {
        const newTelemetry = generator.generateCompleteTelemetry();
        setTelemetryData(newTelemetry);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedFeature]);

  // Generate time series data for charts
  const chartData = useMemo(() => {
    if (!selectedFeature || !telemetryGenerator) return null;

    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Generate 24 hours of data in 1-hour intervals
    const timeSeries = telemetryGenerator.generateTimeSeries(past24Hours, now, 60);
    
    // Signal quality time series
    const signalQuality = timeSeries.map(t => ({
      x: t.timestamp,
      y: t.signal.cnr,
    }));
    
    // Link budget metrics
    const linkMargin = timeSeries.map(t => ({
      x: t.timestamp,
      y: t.linkBudget.linkMargin,
    }));
    
    // Network throughput
    const throughput = timeSeries.map(t => ({
      x: t.timestamp,
      y: t.network.throughput,
    }));
    
    // Satellite passes for radar chart
    const satellitePasses: SatellitePass[] = generateSatellitePasses();
    
    // Heatmap data for signal quality
    const heatmapData = generateHeatmapData(timeSeries);
    
    // Scoring data
    const scoringData = groundStationScorer.calculateScore(selectedFeature);
    
    return {
      signalQuality,
      linkMargin,
      throughput,
      satellitePasses,
      heatmapData,
      scoringData,
      currentTelemetry: telemetryData,
    };
  }, [selectedFeature, telemetryGenerator, telemetryData]);

  // Generate synthetic satellite passes
  function generateSatellitePasses(): SatellitePass[] {
    const passes: SatellitePass[] = [];
    const satellites = [
      { id: 'SES-17', name: 'SES-17', priority: 'high' as const },
      { id: 'O3b-mPOWER-1', name: 'O3b mPOWER 1', priority: 'critical' as const },
      { id: 'INTELSAT-40e', name: 'Intelsat 40e', priority: 'medium' as const },
      { id: 'SES-22', name: 'SES-22', priority: 'low' as const },
    ];
    
    const now = new Date();
    satellites.forEach((sat, i) => {
      // Generate a pass trajectory
      for (let j = 0; j < 30; j++) {
        const time = new Date(now.getTime() - (30 - j) * 60000);
        const t = j / 30;
        const elevation = 90 * Math.sin(t * Math.PI);
        const azimuth = 90 + 180 * t;
        
        passes.push({
          satelliteId: sat.id,
          satelliteName: sat.name,
          timestamp: time,
          elevation: Math.max(0, elevation),
          azimuth: azimuth % 360,
          signalStrength: elevation > 0 ? 0.7 + Math.random() * 0.3 : 0,
          priority: sat.priority,
        });
      }
    });
    
    return passes;
  }

  // Generate heatmap data
  function generateHeatmapData(timeSeries: any[]): HeatmapDataPoint[] {
    const frequencies = ['L-band', 'S-band', 'C-band', 'Ku-band', 'Ka-band'];
    const data: HeatmapDataPoint[] = [];
    
    // Sample every 2 hours
    for (let i = 0; i < timeSeries.length; i += 2) {
      const t = timeSeries[i];
      const hour = t.timestamp.getHours();
      
      frequencies.forEach((freq, j) => {
        // Signal quality varies by frequency and time
        const baseQuality = t.signal.cnr / 20;
        const freqFactor = 1 - (j * 0.1); // Higher frequencies have more loss
        const timeFactor = 1 - Math.abs(hour - 12) / 12 * 0.2; // Best at noon
        
        data.push({
          bin: `${hour.toString().padStart(2, '0')}:00`,
          series: freq,
          value: Math.max(0, Math.min(1, baseQuality * freqFactor * timeFactor + (Math.random() - 0.5) * 0.1)),
          metadata: {
            cnr: t.signal.cnr,
            ber: t.signal.ber,
          },
        });
      });
    }
    
    return data;
  }

  const renderSectionDivider = (title: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-3 mb-6 mt-10 first:mt-0">
        <Icon className="h-5 w-5 text-white/50" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  };

  if (!chartData) return null;

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={clearSelection}
      title={selectedFeature?.name || selectedFeature?.id || 'Ground Station'}
      subtitle={selectedFeature?.operator}
      icon={Satellite}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-6">
        {/* Top Executive Summary - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Overview */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white/90">Overview</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-white">
                  {(chartData.scoringData.overallScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-white/60">Investment Score</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded p-2">
                  <div className="text-lg font-semibold text-white">
                    {chartData.currentTelemetry?.signal.cnr.toFixed(1)} dB
                  </div>
                  <div className="text-xs text-white/60">Signal C/N₀</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-lg font-semibold text-white">
                    {(chartData.currentTelemetry?.network.throughput / 1000).toFixed(1)} Gbps
                  </div>
                  <div className="text-xs text-white/60">Throughput</div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Satellite className="h-5 w-5 text-white/70" />
              <h3 className="text-sm font-semibold text-white/90">Station Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Location</span>
                <span className="text-white">{selectedFeature?.city || 'Unknown'}, {selectedFeature?.country || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Region</span>
                <span className="text-white">{selectedFeature?.region || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Capacity</span>
                <span className="text-white">{selectedFeature?.capacity_gbps || 'N/A'} Gbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Antennas</span>
                <span className="text-white">{selectedFeature?.antenna_count || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status</span>
                <span className="text-green-400 font-medium">{chartData.currentTelemetry?.operational.antennaStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-white/70" />
              <h3 className="text-sm font-semibold text-white/90">Next Steps</h3>
            </div>
            <div className="space-y-3">
              {chartData.scoringData.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/80">{rec}</span>
                </div>
              ))}
              {chartData.scoringData.risks.slice(0, 2).map((risk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/80">{risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Monitoring Section */}
        {renderSectionDivider('Real-time Monitoring', Activity)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Key Metrics Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/70">Current Performance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <div className="text-xs text-white/60">Link Margin</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {chartData.currentTelemetry?.linkBudget.linkMargin.toFixed(1)} dB
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CloudRain className="h-4 w-4 text-blue-400" />
                  <div className="text-xs text-white/60">Rain Fade</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {chartData.currentTelemetry?.linkBudget.rainFade.toFixed(1)} dB
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <div className="text-xs text-white/60">Availability</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {chartData.currentTelemetry?.network.availability.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Signal className="h-4 w-4 text-purple-400" />
                  <div className="text-xs text-white/60">Latency</div>
                </div>
                <div className="text-2xl font-bold text-white">
                  {chartData.currentTelemetry?.network.latency.toFixed(0)} ms
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Signal Quality Chart */}
          <ChartWrapper
            title="24-Hour Signal Quality"
            description="C/N₀ over the last 24 hours"
            minHeight={200}
          >
            {({ width, height }) => (
              <AreaChart
                width={width}
                height={height}
                data={chartData.signalQuality}
                xLabel="Time"
                yLabel="C/N₀ (dB)"
                color="#00C896"
                gradientFrom="#00C896"
                gradientTo="rgba(0, 200, 150, 0.1)"
              />
            )}
          </ChartWrapper>
        </div>

        {/* Signal Analysis Section - 2 columns */}
        {renderSectionDivider('Signal Analysis', Signal)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Signal Metrics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/70">Signal Metrics</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">C/N₀</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.cnr.toFixed(2)} dB
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">Eb/N₀</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.ebno.toFixed(2)} dB
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">BER</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.ber.toExponential(1)}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">RSSI</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.rssi.toFixed(1)} dBm
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">SNR</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.snr.toFixed(1)} dB
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded">
                <div className="text-xs text-white/60">Modulation</div>
                <div className="text-lg font-bold text-white">
                  {chartData.currentTelemetry?.signal.modulation}
                </div>
              </div>
            </div>
          </div>

          {/* Multi-metric Signal Chart */}
          <ChartWrapper
            title="Signal Metrics Comparison"
            description="C/N₀ vs Link Margin"
            minHeight={250}
          >
            {({ width, height }) => {
              const series: LineChartSeries[] = [
                {
                  id: 'cnr',
                  name: 'C/N₀',
                  data: chartData.signalQuality,
                  color: '#00FF00',
                },
                {
                  id: 'margin',
                  name: 'Link Margin',
                  data: chartData.linkMargin,
                  color: '#FF8C00',
                },
              ];
              
              return (
                <LineChart
                  width={width}
                  height={height}
                  data={series}
                  xLabel="Time"
                  yLabel="dB"
                />
              );
            }}
          </ChartWrapper>
        </div>

        {/* Satellite Tracking Section - full width radar chart */}
        {renderSectionDivider('Satellite Tracking', Radar)}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tracking Status */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-medium text-white/70 mb-4">Antenna Status</h4>
            <div className="p-4 bg-white/5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Status</span>
                <span className="text-sm font-bold text-green-400">
                  {chartData.currentTelemetry?.operational.antennaStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/60">Elevation: </span>
                  <span className="text-white font-medium">{chartData.currentTelemetry?.operational.elevation.toFixed(1)}°</span>
                </div>
                <div>
                  <span className="text-white/60">Azimuth: </span>
                  <span className="text-white font-medium">{chartData.currentTelemetry?.operational.azimuth.toFixed(1)}°</span>
                </div>
                <div>
                  <span className="text-white/60">Range: </span>
                  <span className="text-white font-medium">{chartData.currentTelemetry?.operational.range.toFixed(0)} km</span>
                </div>
                <div>
                  <span className="text-white/60">Doppler: </span>
                  <span className="text-white font-medium">{chartData.currentTelemetry?.operational.doppler.toFixed(2)} kHz</span>
                </div>
              </div>
            </div>
          </div>

          {/* Satellite Pass Radar - takes 2 columns */}
          <div className="lg:col-span-2">
            <ChartWrapper
              title="Satellite Pass Tracking"
              description="Real-time satellite positions"
              minHeight={350}
              aspectRatio={1.5}
            >
              {({ width, height }) => (
                <RadialChart
                  width={width}
                  height={height}
                  data={chartData.satellitePasses}
                  currentTime={new Date()}
                  showGrid={true}
                  showLabels={true}
                  animated={true}
                />
              )}
            </ChartWrapper>
          </div>
        </div>

        {/* Frequency Performance - full width heatmap */}
        {renderSectionDivider('Frequency Band Performance', Grid3x3)}
        <div className="mb-8">
          <ChartWrapper
            title="Signal Quality by Frequency Band"
            description="24-hour performance across frequency bands"
            minHeight={300}
          >
            {({ width, height }) => (
              <HeatmapChart
                width={width}
                height={height}
                data={chartData.heatmapData}
                xLabel="Time (UTC)"
                yLabel="Frequency Band"
                colorScheme="viridis"
                showValues={false}
              />
            )}
          </ChartWrapper>
        </div>

        {/* Network Performance Section - 2 columns */}
        {renderSectionDivider('Network Performance', TrendingUp)}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Network Chart */}
          <ChartWrapper
            title="Throughput"
            description="Network throughput over time"
            minHeight={250}
          >
            {({ width, height }) => (
              <AreaChart
                width={width}
                height={height}
                data={chartData.throughput}
                xLabel="Time"
                yLabel="Throughput (Mbps)"
                color="#0066FF"
                gradientFrom="#0066FF"
                gradientTo="rgba(0, 102, 255, 0.1)"
              />
            )}
          </ChartWrapper>
          
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/70">Network Metrics</h4>
            <div className="p-4 bg-white/5 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Availability</span>
                <span className="text-white font-medium">{chartData.currentTelemetry?.network.availability.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Latency</span>
                <span className="text-white font-medium">{chartData.currentTelemetry?.network.latency.toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Packet Loss</span>
                <span className="text-white font-medium">{chartData.currentTelemetry?.network.packetLoss.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Jitter</span>
                <span className="text-white font-medium">{chartData.currentTelemetry?.network.jitter.toFixed(1)} ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Active Connections</span>
                <span className="text-white font-medium">{chartData.currentTelemetry?.network.activeConnections}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Analysis - full width with 3 columns */}
        {renderSectionDivider('Investment Analysis', BarChart3)}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Breakdown */}
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Score Breakdown</h4>
              <div className="text-2xl font-bold text-white">
                {(chartData.scoringData.overallScore * 100).toFixed(1)}%
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(chartData.scoringData.categoryScores).map(([category, score]) => (
                <div key={category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/70 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-white/90">
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-white/60 mt-4">
              Confidence: {(chartData.scoringData.confidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Recommendations */}
          {chartData.scoringData.recommendations.length > 0 && (
            <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
              <h4 className="text-sm font-semibold text-green-400 mb-4">Recommendations</h4>
              <ul className="space-y-2">
                {chartData.scoringData.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks & Opportunities */}
          <div className="space-y-4">
            {/* Risks */}
            {chartData.scoringData.risks.length > 0 && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                <h4 className="text-sm font-semibold text-red-400 mb-3">Risks</h4>
                <ul className="space-y-2">
                  {chartData.scoringData.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Opportunities */}
            {chartData.scoringData.opportunities.length > 0 && (
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Opportunities</h4>
                <ul className="space-y-2">
                  {chartData.scoringData.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">⟡</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant */}
        <SimpleEmbeddedAssistant
          context={{
            type: 'station',
            station: selectedFeature,
            metrics: {
              telemetry: telemetryData,
              scoring: chartData.scoringData,
              signalQuality: telemetryData?.signalMetrics,
              performance: telemetryData?.performance
            }
          }}
          maxHeight={400}
          className="mt-6"
        />
      </div>
    </DetailPanel>
  );
};