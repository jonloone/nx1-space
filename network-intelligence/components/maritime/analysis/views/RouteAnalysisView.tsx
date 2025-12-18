'use client'

/**
 * Route Analysis View
 * Port-to-port route statistics and analysis
 *
 * Features:
 * - Route statistics table
 * - Origin/destination breakdown
 * - Distance and duration metrics
 * - Route visualization on map
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Navigation, Anchor, Ship, Clock, Ruler, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniBarChart } from '../shared/AnalysisCharts'
import type {
  TableColumn,
  SortState,
  KPIData,
  RouteAnalytics,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface RouteAnalysisViewProps extends AnalysisViewProps<RouteAnalytics> {
  /** Handler to highlight route on map */
  onRouteHighlight?: (route: RouteAnalytics) => void
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(): TableColumn<RouteAnalytics>[] {
  return [
    {
      key: 'originPort',
      label: 'Origin',
      width: 130,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <div className="truncate">
            <div className="truncate">{value}</div>
            <div className="text-xs text-slate-500">{row.originCountry}</div>
          </div>
        </div>
      )
    },
    {
      key: 'destinationPort',
      label: 'Destination',
      width: 130,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <div className="truncate">
            <div className="truncate">{value}</div>
            <div className="text-xs text-slate-500">{row.destinationCountry}</div>
          </div>
        </div>
      )
    },
    {
      key: 'vesselCount',
      label: 'Vessels',
      width: 80,
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
      key: 'distanceNm',
      label: 'Distance (nm)',
      width: 100,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => `${value.toLocaleString()}`
    },
    {
      key: 'avgDurationHours',
      label: 'Avg Duration',
      width: 100,
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
      key: 'avgSpeedKnots',
      label: 'Avg Speed',
      width: 90,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => `${value.toFixed(1)} kn`
    }
  ]
}

// ============================================================================
// Main Component
// ============================================================================

export function RouteAnalysisView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  onRouteHighlight
}: RouteAnalysisViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'vesselCount',
    direction: 'desc'
  })

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const totalRoutes = data.length
    const totalVessels = data.reduce((sum, r) => sum + r.vesselCount, 0)
    const avgDistance = data.length > 0
      ? data.reduce((sum, r) => sum + r.distanceNm, 0) / data.length
      : 0
    const avgDuration = data.length > 0
      ? data.reduce((sum, r) => sum + r.avgDurationHours, 0) / data.length
      : 0

    // Unique ports
    const ports = new Set<string>()
    data.forEach(r => {
      ports.add(r.originPort)
      ports.add(r.destinationPort)
    })

    return [
      {
        id: 'routes',
        label: 'Total Routes',
        value: totalRoutes,
        color: 'info',
        icon: Navigation
      },
      {
        id: 'vessels',
        label: 'Total Transits',
        value: totalVessels,
        color: 'default',
        icon: Ship
      },
      {
        id: 'ports',
        label: 'Ports Connected',
        value: ports.size,
        color: 'default',
        icon: Anchor
      },
      {
        id: 'avgDistance',
        label: 'Avg Distance',
        value: `${avgDistance.toFixed(0)} nm`,
        color: 'default',
        icon: Ruler
      }
    ]
  }, [data])

  // Top routes by vessel count
  const topRoutes = useMemo(() => {
    return [...data]
      .sort((a, b) => b.vesselCount - a.vesselCount)
      .slice(0, 5)
      .map(r => ({
        label: `${r.originPort} → ${r.destinationPort}`.slice(0, 20),
        value: r.vesselCount
      }))
  }, [data])

  // Top origin ports
  const topOrigins = useMemo(() => {
    const origins: Record<string, number> = {}
    data.forEach(r => {
      origins[r.originPort] = (origins[r.originPort] || 0) + r.vesselCount
    })
    return Object.entries(origins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([port, count]) => ({
        label: port.slice(0, 15),
        value: count
      }))
  }, [data])

  const columns = useMemo(() => getColumns(), [])

  // Handle row click
  const handleRowClick = useCallback((row: RouteAnalytics) => {
    if (onRowClick) {
      onRowClick(row)
    }
    if (onRouteHighlight) {
      onRouteHighlight(row)
    }
  }, [onRowClick, onRouteHighlight])

  // Handle show on map
  const handleShowOnMap = useCallback((row: RouteAnalytics) => {
    if (onShowOnMap) {
      onShowOnMap(row)
    }
    if (onRouteHighlight) {
      onRouteHighlight(row)
    }
  }, [onShowOnMap, onRouteHighlight])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and charts */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-4">
          {/* KPIs */}
          <div className="flex-1 max-w-[480px]">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Top Routes Chart */}
          {topRoutes.length > 0 && (
            <div className="hidden lg:block">
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Top Routes
              </span>
              <MiniBarChart
                data={topRoutes}
                width={180}
                height={80}
                showLabels={true}
                showValues={true}
              />
            </div>
          )}

          {/* Top Origins Chart */}
          {topOrigins.length > 0 && (
            <div className="hidden xl:block">
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Top Origins
              </span>
              <MiniBarChart
                data={topOrigins}
                width={160}
                height={80}
                showLabels={true}
                showValues={true}
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
          emptyMessage="No route data available"
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default RouteAnalysisView
