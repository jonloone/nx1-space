'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Activity, TrendingUp, Database, Map, Maximize2 } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';
import { ChartWrapper } from '@/components/Charts/ChartWrapper';
import { LineChart, LineChartSeries } from '@/components/Charts/LineChart';
import { AreaChart } from '@/components/Charts/AreaChart';
import { DataTable } from '@/components/Tables/DataTable';
import { GroundStationPanel } from '@/components/Panels/GroundStationPanel';
import { toLineChartData, toAreaChartData, toTableData } from '@/utils/dataTransformers';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'metrics', label: 'Metrics', icon: TrendingUp },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'location', label: 'Location', icon: Map },
];

export const ContextPanel: React.FC = () => {
  const { selectedFeatures, clearSelection } = useMapStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedFeature = selectedFeatures[0];
  const isOpen = !!selectedFeature;
  
  // Generate sample data for charts (must be called before conditional returns)
  const chartData = useMemo(() => {
    if (!selectedFeature) return null;

    // Generate time series data
    const now = new Date();
    const timeSeriesData = Array.from({ length: 24 }, (_, i) => {
      const date = new Date(now);
      date.setHours(date.getHours() - (23 - i));
      return {
        x: date,
        y: Math.random() * 100 + (selectedFeature.score || 0.5) * 50,
      };
    });

    // Generate area chart data
    const areaData = timeSeriesData.map(d => ({
      x: d.x,
      y: d.y * (0.8 + Math.random() * 0.4),
    }));

    // Generate table data
    const tableData = [
      { property: 'ID', value: selectedFeature.id },
      { property: 'Type', value: selectedFeature.type || 'Ground Station' },
      { property: 'Operator', value: selectedFeature.operator || 'Unknown' },
      { property: 'Location', value: selectedFeature.city && selectedFeature.country ? `${selectedFeature.city}, ${selectedFeature.country}` : 'Unknown' },
      { property: 'Region', value: selectedFeature.region || 'Unknown' },
      { property: 'Score', value: `${((selectedFeature.score || 0) * 100).toFixed(1)}%` },
      { property: 'Utilization', value: `${((selectedFeature.utilization || 0) * 100).toFixed(1)}%` },
      { property: 'Capacity', value: selectedFeature.capacity_gbps ? `${selectedFeature.capacity_gbps} Gbps` : 'N/A' },
      { property: 'Antennas', value: selectedFeature.antenna_count || 'N/A' },
      { property: 'Status', value: selectedFeature.status || 'Active' },
      { property: 'Last Updated', value: new Date().toLocaleString() },
    ];

    return {
      timeSeries: timeSeriesData,
      area: areaData,
      table: tableData,
    };
  }, [selectedFeature]);
  
  // Check if this is a ground station feature
  const isGroundStation = selectedFeature?.type === 'ground-station' || 
                         selectedFeature?.operator || 
                         selectedFeature?.antenna_count ||
                         selectedFeature?.station_id ||
                         (selectedFeature?.id && selectedFeature?.id.startsWith('SI'));
  
  // Use specialized panel for ground stations
  if (isGroundStation) {
    return <GroundStationPanel />;
  }

  const renderContent = () => {
    if (!chartData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/50 mb-1">Score</div>
                <div className="text-2xl font-bold text-white">
                  {((selectedFeature?.score || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/50 mb-1">Utilization</div>
                <div className="text-2xl font-bold text-white">
                  {((selectedFeature?.utilization || 0) * 100).toFixed(1)}%
                </div>
              </div>
              {selectedFeature?.capacity_gbps && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/50 mb-1">Capacity</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedFeature.capacity_gbps} Gbps
                  </div>
                </div>
              )}
              {selectedFeature?.antenna_count && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/50 mb-1">Antennas</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedFeature.antenna_count}
                  </div>
                </div>
              )}
            </div>
            
            <ChartWrapper
              title="24-Hour Activity"
              description="Hourly metrics over the last 24 hours"
              minHeight={200}
              aspectRatio={2}
            >
              {({ width, height }) => (
                <AreaChart
                  width={width}
                  height={height}
                  data={chartData.area}
                  xLabel="Time"
                  yLabel="Activity"
                  color="#0066FF"
                  gradientFrom="#0066FF"
                  gradientTo="rgba(0, 102, 255, 0.1)"
                />
              )}
            </ChartWrapper>
          </div>
        );

      case 'metrics':
        return (
          <div className="space-y-6">
            <ChartWrapper
              title="Performance Metrics"
              description="Real-time performance indicators"
              minHeight={250}
            >
              {({ width, height }) => {
                const series: LineChartSeries[] = [
                  {
                    id: 'utilization',
                    name: 'Utilization',
                    data: chartData.timeSeries,
                    color: '#00FF00',
                  },
                  {
                    id: 'capacity',
                    name: 'Capacity',
                    data: chartData.timeSeries.map(d => ({
                      x: d.x,
                      y: d.y * 1.2,
                    })),
                    color: '#FF8C00',
                  },
                ];
                
                return (
                  <LineChart
                    width={width}
                    height={height}
                    data={series}
                    xLabel="Time"
                    yLabel="Value"
                  />
                );
              }}
            </ChartWrapper>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/90">Properties</h3>
              <button
                onClick={() => setIsExpanded(true)}
                className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="h-4 w-4 text-white/70" />
              </button>
            </div>
            <DataTable
              columns={[
                {
                  accessorKey: 'property',
                  header: 'Property',
                },
                {
                  accessorKey: 'value',
                  header: 'Value',
                },
              ]}
              data={chartData.table}
              pageSize={5}
              showPagination={false}
              showFilters={false}
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-white/50">Latitude</span>
                  <span className="text-sm text-white">{selectedFeature?.latitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/50">Longitude</span>
                  <span className="text-sm text-white">{selectedFeature?.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/50">Region</span>
                  <span className="text-sm text-white">{selectedFeature?.region || 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div className="h-48 bg-white/5 rounded-lg flex items-center justify-center">
              <span className="text-white/30 text-sm">Map Preview</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            "fixed right-0 top-0 h-full bg-black/95 backdrop-blur-xl border-l border-white/10 z-50",
            isExpanded ? "w-full md:w-3/4" : "w-full md:w-96"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {selectedFeature?.name || selectedFeature?.id || 'Feature Details'}
              </h2>
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white/70 hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};