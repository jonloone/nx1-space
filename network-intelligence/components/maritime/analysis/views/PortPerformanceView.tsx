'use client'

/**
 * Port Performance View
 * Port activity metrics and performance analysis
 *
 * Features:
 * - Port list with activity metrics
 * - Arrivals/departures tracking
 * - Dwell time analysis
 * - Congestion indicators
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Anchor, Ship, Clock, Activity, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniBarChart, MiniPieChart } from '../shared/AnalysisCharts'
import type {
  TableColumn,
  SortState,
  KPIData,
  PortAnalytics,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface PortPerformanceViewProps extends AnalysisViewProps<PortAnalytics> {
  /** Congestion threshold */
  congestionThreshold?: number
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(): TableColumn<PortAnalytics>[] {
  return [
    {
      key: 'name',
      label: 'Port',
      width: 140,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="truncate">
            <div className="truncate">{value}</div>
            <div className="text-xs text-slate-500">{row.country}</div>
          </div>
        </div>
      )
    },
    {
      key: 'arrivals',
      label: 'Arrivals',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <ArrowDown className="w-3 h-3 text-green-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'departures',
      label: 'Departures',
      width: 85,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <ArrowUp className="w-3 h-3 text-orange-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'currentVessels',
      label: 'At Port',
      width: 70,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Ship className="w-3 h-3 text-slate-400" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'avgDwellHours',
      label: 'Avg Dwell',
      width: 90,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => {
        if (value < 24) return `${value.toFixed(1)}h`
        const days = Math.floor(value / 24)
        const hours = value % 24
        return `${days}d ${hours.toFixed(0)}h`
      }
    },
    {
      key: 'congestionIndex',
      label: 'Congestion',
      width: 100,
      sortable: true,
      type: 'progress',
      render: (value) => {
        const colorClass = value >= 80 ? 'bg-red-500' :
                          value >= 60 ? 'bg-orange-500' :
                          value >= 40 ? 'bg-yellow-500' : 'bg-green-500'
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', colorClass)}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className={cn(
              'text-xs w-8 text-right',
              value >= 80 ? 'text-red-400' :
              value >= 60 ? 'text-orange-400' :
              value >= 40 ? 'text-yellow-400' : 'text-green-400'
            )}>
              {Math.round(value)}%
            </span>
          </div>
        )
      }
    },
    {
      key: 'vesselTypesServed',
      label: 'Vessel Types',
      width: 120,
      sortable: false,
      type: 'text',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((type, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-xs bg-slate-700/50 rounded"
            >
              {type}
            </span>
          ))}
          {value.length > 3 && (
            <span className="text-xs text-slate-500">+{value.length - 3}</span>
          )}
        </div>
      )
    }
  ]
}

// ============================================================================
// Main Component
// ============================================================================

export function PortPerformanceView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  congestionThreshold = 70
}: PortPerformanceViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'arrivals',
    direction: 'desc'
  })

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const totalPorts = data.length
    const totalArrivals = data.reduce((sum, p) => sum + p.arrivals, 0)
    const totalDepartures = data.reduce((sum, p) => sum + p.departures, 0)
    const congestedPorts = data.filter(p => p.congestionIndex >= congestionThreshold).length
    const avgDwell = data.length > 0
      ? data.reduce((sum, p) => sum + p.avgDwellHours, 0) / data.length
      : 0

    return [
      {
        id: 'ports',
        label: 'Total Ports',
        value: totalPorts,
        color: 'info',
        icon: Anchor
      },
      {
        id: 'arrivals',
        label: 'Total Arrivals',
        value: totalArrivals,
        color: 'success',
        icon: ArrowDown
      },
      {
        id: 'departures',
        label: 'Total Departures',
        value: totalDepartures,
        color: 'default',
        icon: ArrowUp
      },
      {
        id: 'congested',
        label: 'Congested',
        value: congestedPorts,
        color: congestedPorts > 0 ? 'warning' : 'success',
        icon: AlertCircle
      }
    ]
  }, [data, congestionThreshold])

  // Top ports by activity
  const topPorts = useMemo(() => {
    return [...data]
      .sort((a, b) => (b.arrivals + b.departures) - (a.arrivals + a.departures))
      .slice(0, 5)
      .map(p => ({
        label: p.name.slice(0, 15),
        value: p.arrivals + p.departures
      }))
  }, [data])

  // Congestion distribution
  const congestionDistribution = useMemo(() => {
    let low = 0, medium = 0, high = 0, critical = 0
    data.forEach(p => {
      if (p.congestionIndex < 40) low++
      else if (p.congestionIndex < 60) medium++
      else if (p.congestionIndex < 80) high++
      else critical++
    })
    return [
      { label: 'Low', value: low, color: '#34d399' },
      { label: 'Medium', value: medium, color: '#fbbf24' },
      { label: 'High', value: high, color: '#fb923c' },
      { label: 'Critical', value: critical, color: '#f87171' }
    ].filter(d => d.value > 0)
  }, [data])

  const columns = useMemo(() => getColumns(), [])

  // Handle row click
  const handleRowClick = useCallback((row: PortAnalytics) => {
    if (onRowClick) {
      onRowClick(row)
    }
  }, [onRowClick])

  // Handle show on map
  const handleShowOnMap = useCallback((row: PortAnalytics) => {
    if (onShowOnMap) {
      onShowOnMap(row)
    }
  }, [onShowOnMap])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and charts */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-4">
          {/* KPIs */}
          <div className="flex-1 max-w-[480px]">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Top Ports Chart */}
          {topPorts.length > 0 && (
            <div className="hidden lg:block">
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Top Ports by Activity
              </span>
              <MiniBarChart
                data={topPorts}
                width={180}
                height={80}
                showLabels={true}
                showValues={true}
              />
            </div>
          )}

          {/* Congestion Distribution */}
          {congestionDistribution.length > 0 && (
            <div className="hidden xl:block">
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Congestion Levels
              </span>
              <MiniPieChart
                data={congestionDistribution}
                size={90}
                innerRadius={0.5}
                showLegend={false}
              />
            </div>
          )}
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
          idKey="id"
          isLoading={isLoading}
          emptyMessage="No port data available"
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default PortPerformanceView
