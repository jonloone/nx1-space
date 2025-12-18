'use client'

/**
 * Fleet Overview View
 * Fleet statistics and vessel list for maritime analytics
 *
 * Features:
 * - KPI cards: Total vessels, active count, coverage, avg speed
 * - Vessel type breakdown chart
 * - Activity heatmap by hour
 * - Sortable vessel table
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Ship, Anchor, Navigation, Gauge, Activity, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniPieChart, ActivityHeatmap, MiniBarChart } from '../shared/AnalysisCharts'
import type {
  TableColumn,
  SortState,
  KPIData,
  FleetVessel,
  FleetStats,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface FleetOverviewViewProps extends AnalysisViewProps<FleetVessel> {
  /** Fleet statistics */
  stats?: FleetStats
}

// ============================================================================
// Constants
// ============================================================================

const VESSEL_TYPE_COLORS: Record<string, string> = {
  'Cargo': '#60a5fa',
  'Tanker': '#f87171',
  'Passenger': '#34d399',
  'Fishing': '#fbbf24',
  'Tug': '#a78bfa',
  'Other': '#94a3b8'
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(): TableColumn<FleetVessel>[] {
  return [
    {
      key: 'mmsi',
      label: 'MMSI',
      width: 100,
      sortable: true,
      type: 'text',
      render: (value) => (
        <span className="font-mono text-xs">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Vessel Name',
      width: 160,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="truncate">{value || row.mmsi}</span>
        </div>
      )
    },
    {
      key: 'vesselType',
      label: 'Type',
      width: 100,
      sortable: true,
      type: 'badge'
    },
    {
      key: 'status',
      label: 'Status',
      width: 90,
      sortable: true,
      type: 'status'
    },
    {
      key: 'speed',
      label: 'Speed (kn)',
      width: 90,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <span className={cn(
          value > 0 ? 'text-green-400' : 'text-slate-500'
        )}>
          {value.toFixed(1)}
        </span>
      )
    },
    {
      key: 'heading',
      label: 'Heading',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => `${Math.round(value)}°`
    },
    {
      key: 'trackQuality',
      label: 'Track Quality',
      width: 100,
      sortable: true,
      type: 'progress'
    },
    {
      key: 'anomalyCount',
      label: 'Anomalies',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <span className={cn(
          value > 0 ? 'text-orange-400' : 'text-slate-500'
        )}>
          {value}
        </span>
      )
    },
    {
      key: 'lastUpdate',
      label: 'Last Update',
      width: 130,
      sortable: true,
      type: 'timestamp'
    }
  ]
}

// ============================================================================
// Main Component
// ============================================================================

export function FleetOverviewView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  stats
}: FleetOverviewViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'lastUpdate',
    direction: 'desc'
  })

  // Calculate stats from data if not provided
  const fleetStats = useMemo((): FleetStats => {
    if (stats) return stats

    const activeVessels = data.filter(v => v.status === 'active').length
    const avgSpeed = data.length > 0
      ? data.reduce((sum, v) => sum + v.speed, 0) / data.length
      : 0

    // Vessel type breakdown
    const typeBreakdown: Record<string, number> = {}
    data.forEach(v => {
      const type = v.vesselType || 'Other'
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1
    })

    // Activity by hour (mock for now)
    const activityByHour = new Array(24).fill(0)
    data.forEach((v, i) => {
      activityByHour[i % 24]++
    })

    return {
      totalVessels: data.length,
      activeVessels,
      inactiveVessels: data.length - activeVessels,
      coverageAreaKm2: 5000, // Would be calculated from positions
      avgSpeedKnots: avgSpeed,
      totalDistanceKm: data.reduce((sum, v) => sum + (v.trackQuality * 100), 0),
      vesselTypeBreakdown: typeBreakdown,
      activityByHour
    }
  }, [data, stats])

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    return [
      {
        id: 'total',
        label: 'Total Vessels',
        value: fleetStats.totalVessels,
        color: 'info',
        icon: Ship
      },
      {
        id: 'active',
        label: 'Active',
        value: fleetStats.activeVessels,
        color: 'success',
        icon: Activity
      },
      {
        id: 'inactive',
        label: 'Inactive',
        value: fleetStats.inactiveVessels,
        color: 'default',
        icon: Anchor
      },
      {
        id: 'avgSpeed',
        label: 'Avg Speed',
        value: `${fleetStats.avgSpeedKnots.toFixed(1)} kn`,
        color: 'default',
        icon: Gauge
      }
    ]
  }, [fleetStats])

  // Vessel type chart data
  const typeChartData = useMemo(() => {
    return Object.entries(fleetStats.vesselTypeBreakdown).map(([type, count]) => ({
      label: type,
      value: count,
      color: VESSEL_TYPE_COLORS[type] || VESSEL_TYPE_COLORS['Other']
    }))
  }, [fleetStats.vesselTypeBreakdown])

  // Top vessel types bar chart data
  const topTypesData = useMemo(() => {
    return Object.entries(fleetStats.vesselTypeBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        label: type,
        value: count,
        color: VESSEL_TYPE_COLORS[type] || VESSEL_TYPE_COLORS['Other']
      }))
  }, [fleetStats.vesselTypeBreakdown])

  const columns = useMemo(() => getColumns(), [])

  // Handle row click
  const handleRowClick = useCallback((row: FleetVessel) => {
    if (onRowClick) {
      onRowClick(row)
    }
  }, [onRowClick])

  // Handle show on map
  const handleShowOnMap = useCallback((row: FleetVessel) => {
    if (onShowOnMap) {
      onShowOnMap(row)
    }
  }, [onShowOnMap])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and charts */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-6">
          {/* KPIs */}
          <div className="flex-1 max-w-[500px]">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Vessel Type Pie Chart */}
          <div className="hidden lg:flex items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Vessel Types
              </span>
              <MiniPieChart
                data={typeChartData}
                size={100}
                innerRadius={0.55}
                showLegend={true}
              />
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="hidden xl:block">
            <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
              24h Activity
            </span>
            <ActivityHeatmap
              data={fleetStats.activityByHour}
              width={240}
              height={32}
              showLabels={false}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <MaritimeDataTable
          data={data}
          columns={columns}
          sortState={sortState}
          onSortChange={setSortState}
          onRowClick={handleRowClick}
          onShowOnMap={handleShowOnMap}
          selectedId={selectedId}
          idKey="mmsi"
          isLoading={isLoading}
          emptyMessage="No vessels found in this region"
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default FleetOverviewView
