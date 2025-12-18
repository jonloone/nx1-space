'use client'

/**
 * Vessel Analytics View
 * Individual vessel analytics with search, filtering, and detailed metrics
 *
 * Features:
 * - Search by name, MMSI, type
 * - Risk scoring display
 * - Anomaly count indicators
 * - Track quality metrics
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Ship, Search, Shield, AlertTriangle, Navigation, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniBarChart } from '../shared/AnalysisCharts'
import { Input } from '@/components/ui/input'
import type {
  TableColumn,
  SortState,
  KPIData,
  VesselAnalytics,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface VesselAnalyticsViewProps extends AnalysisViewProps<VesselAnalytics> {
  /** Total anomaly count */
  totalAnomalies?: number
}

// ============================================================================
// Constants
// ============================================================================

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50'
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(): TableColumn<VesselAnalytics>[] {
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
      width: 150,
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
      width: 90,
      sortable: true,
      type: 'badge'
    },
    {
      key: 'flag',
      label: 'Flag',
      width: 70,
      sortable: true,
      type: 'text'
    },
    {
      key: 'riskLevel',
      label: 'Risk',
      width: 80,
      sortable: true,
      type: 'badge',
      badgeColors: RISK_LEVEL_COLORS
    },
    {
      key: 'riskScore',
      label: 'Score',
      width: 70,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <span className={cn(
          value >= 70 ? 'text-red-400' :
          value >= 40 ? 'text-orange-400' :
          value >= 20 ? 'text-yellow-400' : 'text-green-400'
        )}>
          {value}
        </span>
      )
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
          value > 5 ? 'text-red-400' :
          value > 2 ? 'text-orange-400' :
          value > 0 ? 'text-yellow-400' : 'text-slate-500'
        )}>
          {value}
        </span>
      )
    },
    {
      key: 'aisGapCount',
      label: 'AIS Gaps',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right'
    },
    {
      key: 'darkPeriodHours',
      label: 'Dark Hours',
      width: 90,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => `${value.toFixed(1)}h`
    },
    {
      key: 'trackQuality',
      label: 'Track Quality',
      width: 100,
      sortable: true,
      type: 'progress'
    },
    {
      key: 'avgSpeedKnots',
      label: 'Avg Speed',
      width: 80,
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

export function VesselAnalyticsView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  totalAnomalies
}: VesselAnalyticsViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'riskScore',
    direction: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    const query = searchQuery.toLowerCase()
    return data.filter(v =>
      v.name?.toLowerCase().includes(query) ||
      v.mmsi.toLowerCase().includes(query) ||
      v.vesselType?.toLowerCase().includes(query) ||
      v.flag?.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const highRisk = data.filter(v => v.riskLevel === 'high' || v.riskLevel === 'critical').length
    const avgRiskScore = data.length > 0
      ? data.reduce((sum, v) => sum + v.riskScore, 0) / data.length
      : 0
    const totalDarkHours = data.reduce((sum, v) => sum + v.darkPeriodHours, 0)

    return [
      {
        id: 'total',
        label: 'Total Vessels',
        value: data.length,
        color: 'info',
        icon: Ship
      },
      {
        id: 'highRisk',
        label: 'High Risk',
        value: highRisk,
        color: highRisk > 0 ? 'danger' : 'success',
        icon: Shield
      },
      {
        id: 'avgRisk',
        label: 'Avg Risk Score',
        value: avgRiskScore.toFixed(0),
        color: avgRiskScore > 50 ? 'warning' : 'default'
      },
      {
        id: 'darkHours',
        label: 'Total Dark Hours',
        value: `${totalDarkHours.toFixed(0)}h`,
        color: totalDarkHours > 100 ? 'warning' : 'default'
      }
    ]
  }, [data])

  // Risk distribution for chart
  const riskDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
    data.forEach(v => {
      distribution[v.riskLevel]++
    })
    return [
      { label: 'Critical', value: distribution.critical, color: '#f87171' },
      { label: 'High', value: distribution.high, color: '#fb923c' },
      { label: 'Medium', value: distribution.medium, color: '#fbbf24' },
      { label: 'Low', value: distribution.low, color: '#34d399' }
    ].filter(d => d.value > 0)
  }, [data])

  const columns = useMemo(() => getColumns(), [])

  // Handle row click
  const handleRowClick = useCallback((row: VesselAnalytics) => {
    if (onRowClick) {
      onRowClick(row)
    }
  }, [onRowClick])

  // Handle show on map
  const handleShowOnMap = useCallback((row: VesselAnalytics) => {
    if (onShowOnMap) {
      onShowOnMap(row)
    }
  }, [onShowOnMap])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and search */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-4">
          {/* KPIs */}
          <div className="flex-1 max-w-[480px]">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Risk Distribution Chart */}
          <div className="hidden lg:block">
            <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
              Risk Distribution
            </span>
            <MiniBarChart
              data={riskDistribution}
              width={180}
              height={80}
              showLabels={true}
              showValues={true}
            />
          </div>

          {/* Search */}
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search vessels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-slate-800/50 border-slate-700 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <MaritimeDataTable
          data={filteredData}
          columns={columns}
          sortState={sortState}
          onSortChange={setSortState}
          onRowClick={handleRowClick}
          onShowOnMap={handleShowOnMap}
          selectedId={selectedId}
          idKey="mmsi"
          isLoading={isLoading}
          emptyMessage={searchQuery ? 'No vessels match your search' : 'No vessels found'}
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default VesselAnalyticsView
