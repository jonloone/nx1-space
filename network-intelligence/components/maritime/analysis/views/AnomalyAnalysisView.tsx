'use client'

/**
 * Anomaly Analysis View
 * Table view for detected maritime anomalies using the unified table component
 *
 * Columns: Vessel, Type, Severity, Time, Duration, Location
 * Features: Filtering by type/severity, sorting, map highlighting
 */

import React, { useMemo, useState, useCallback } from 'react'
import { AlertTriangle, Ship, Clock, MapPin, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniPieChart, MiniBarChart } from '../shared/AnalysisCharts'
import { Button } from '@/components/ui/button'
import type {
  TableColumn,
  SortState,
  KPIData,
  AnomalyTableRow,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'
import type { DetectedAnomaly, AnomalyType, AnomalySeverity } from '@/lib/types/ais-anomaly'

// ============================================================================
// Types
// ============================================================================

export interface AnomalyAnalysisViewProps extends AnalysisViewProps<DetectedAnomaly> {
  /** Map of MMSI to vessel names */
  vesselNames?: Map<string, string>
  /** Filter change handler */
  onFilterChange?: (filters: AnomalyFilters) => void
}

export interface AnomalyFilters {
  types?: AnomalyType[]
  severities?: AnomalySeverity[]
  vesselMmsi?: string
}

// ============================================================================
// Constants
// ============================================================================

const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  AIS_GAP: 'AIS Gap',
  LOITERING: 'Loitering',
  RENDEZVOUS: 'Rendezvous',
  SPEED_ANOMALY: 'Speed Anomaly',
  COURSE_DEVIATION: 'Course Deviation'
}

const SEVERITY_ORDER: AnomalySeverity[] = ['critical', 'high', 'medium', 'low']

// ============================================================================
// Helper Functions
// ============================================================================

function getLocationLat(location: any): number {
  if (!location) return 0
  if (typeof location.lat === 'number') return location.lat
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[1]
  }
  return 0
}

function getLocationLng(location: any): number {
  if (!location) return 0
  if (typeof location.lng === 'number') return location.lng
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return location.coordinates[0]
  }
  return 0
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(vesselNames?: Map<string, string>): TableColumn<AnomalyTableRow>[] {
  return [
    {
      key: 'vesselName',
      label: 'Vessel',
      width: 140,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="truncate">{value || row.vesselMmsi}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      width: 130,
      sortable: true,
      type: 'badge'
    },
    {
      key: 'severity',
      label: 'Severity',
      width: 90,
      sortable: true,
      type: 'badge'
    },
    {
      key: 'timestamp',
      label: 'Time',
      width: 140,
      sortable: true,
      type: 'timestamp'
    },
    {
      key: 'duration',
      label: 'Duration',
      width: 80,
      sortable: true,
      type: 'duration',
      render: (value) => value ? `${Math.round(value)}m` : '-'
    },
    {
      key: 'confidence',
      label: 'Confidence',
      width: 90,
      sortable: true,
      type: 'progress'
    },
    {
      key: 'location',
      label: 'Location',
      width: 160,
      sortable: false,
      type: 'location'
    }
  ]
}

// ============================================================================
// Filter Panel Component
// ============================================================================

interface FilterPanelProps {
  filters: AnomalyFilters
  onFilterChange: (filters: AnomalyFilters) => void
  anomalyCounts: Record<AnomalyType, number>
  severityCounts: Record<AnomalySeverity, number>
}

function FilterPanel({ filters, onFilterChange, anomalyCounts, severityCounts }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = (filters.types?.length || 0) + (filters.severities?.length || 0)

  const toggleType = (type: AnomalyType) => {
    const current = filters.types || []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    onFilterChange({ ...filters, types: updated.length > 0 ? updated : undefined })
  }

  const toggleSeverity = (severity: AnomalySeverity) => {
    const current = filters.severities || []
    const updated = current.includes(severity)
      ? current.filter(s => s !== severity)
      : [...current, severity]
    onFilterChange({ ...filters, severities: updated.length > 0 ? updated : undefined })
  }

  const clearFilters = () => {
    onFilterChange({})
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-8 px-3 text-slate-400 hover:text-white hover:bg-slate-800',
          activeFilterCount > 0 && 'text-blue-400'
        )}
      >
        <Filter className="w-4 h-4 mr-1.5" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-500/20 rounded">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Type filters */}
            <div className="mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Anomaly Type</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(Object.keys(ANOMALY_TYPE_LABELS) as AnomalyType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'px-2 py-1 text-xs rounded border transition-colors',
                      filters.types?.includes(type)
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        : 'text-slate-400 border-slate-600 hover:border-slate-500'
                    )}
                  >
                    {ANOMALY_TYPE_LABELS[type]} ({anomalyCounts[type] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filters */}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Severity</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SEVERITY_ORDER.map(severity => (
                  <button
                    key={severity}
                    onClick={() => toggleSeverity(severity)}
                    className={cn(
                      'px-2 py-1 text-xs rounded border transition-colors capitalize',
                      filters.severities?.includes(severity)
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        : 'text-slate-400 border-slate-600 hover:border-slate-500'
                    )}
                  >
                    {severity} ({severityCounts[severity] || 0})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AnomalyAnalysisView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  vesselNames
}: AnomalyAnalysisViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'timestamp',
    direction: 'desc'
  })
  const [filters, setFilters] = useState<AnomalyFilters>({})

  // Transform anomalies to table rows
  const tableData = useMemo((): AnomalyTableRow[] => {
    return data.map(anomaly => ({
      id: anomaly.id,
      vesselMmsi: anomaly.affectedVessels[0] || 'Unknown',
      vesselName: vesselNames?.get(anomaly.affectedVessels[0]) || anomaly.affectedVessels[0] || 'Unknown',
      type: anomaly.type,
      severity: anomaly.severity,
      timestamp: anomaly.timestamp,
      endTime: anomaly.endTime,
      duration: anomaly.duration,
      location: {
        lat: getLocationLat(anomaly.location),
        lng: getLocationLng(anomaly.location)
      },
      description: anomaly.description || '',
      confidence: anomaly.confidence
    }))
  }, [data, vesselNames])

  // Apply filters
  const filteredData = useMemo(() => {
    return tableData.filter(row => {
      if (filters.types && filters.types.length > 0 && !filters.types.includes(row.type)) {
        return false
      }
      if (filters.severities && filters.severities.length > 0 && !filters.severities.includes(row.severity)) {
        return false
      }
      if (filters.vesselMmsi && row.vesselMmsi !== filters.vesselMmsi) {
        return false
      }
      return true
    })
  }, [tableData, filters])

  // Calculate counts for filters
  const anomalyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tableData.forEach(row => {
      counts[row.type] = (counts[row.type] || 0) + 1
    })
    return counts as Record<AnomalyType, number>
  }, [tableData])

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tableData.forEach(row => {
      counts[row.severity] = (counts[row.severity] || 0) + 1
    })
    return counts as Record<AnomalySeverity, number>
  }, [tableData])

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const total = data.length
    const critical = data.filter(a => a.severity === 'critical').length
    const high = data.filter(a => a.severity === 'high').length
    const uniqueVessels = new Set(data.flatMap(a => a.affectedVessels)).size

    return [
      {
        id: 'total',
        label: 'Total Anomalies',
        value: total,
        color: 'default',
        icon: AlertTriangle
      },
      {
        id: 'critical',
        label: 'Critical',
        value: critical,
        color: 'danger',
        icon: AlertTriangle
      },
      {
        id: 'high',
        label: 'High Severity',
        value: high,
        color: 'warning'
      },
      {
        id: 'vessels',
        label: 'Vessels Affected',
        value: uniqueVessels,
        color: 'info',
        icon: Ship
      }
    ]
  }, [data])

  // Chart data
  const typeChartData = useMemo(() => {
    return (Object.keys(ANOMALY_TYPE_LABELS) as AnomalyType[]).map(type => ({
      label: ANOMALY_TYPE_LABELS[type],
      value: anomalyCounts[type] || 0
    }))
  }, [anomalyCounts])

  const columns = useMemo(() => getColumns(vesselNames), [vesselNames])

  // Handle row click to get original anomaly
  const handleRowClick = useCallback((row: AnomalyTableRow) => {
    const anomaly = data.find(a => a.id === row.id)
    if (anomaly && onRowClick) {
      onRowClick(anomaly)
    }
  }, [data, onRowClick])

  // Handle show on map
  const handleShowOnMap = useCallback((row: AnomalyTableRow) => {
    const anomaly = data.find(a => a.id === row.id)
    if (anomaly && onShowOnMap) {
      onShowOnMap(anomaly)
    }
  }, [data, onShowOnMap])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and filters */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-4">
          {/* KPIs */}
          <div className="flex-1">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Charts and Filters */}
          <div className="flex items-center gap-4">
            {/* Type distribution chart */}
            <div className="hidden lg:block">
              <MiniPieChart
                data={typeChartData}
                size={80}
                innerRadius={0.5}
                showLegend={false}
              />
            </div>

            {/* Filters */}
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              anomalyCounts={anomalyCounts}
              severityCounts={severityCounts}
            />
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
          idKey="id"
          isLoading={isLoading}
          emptyMessage="No anomalies detected in this region"
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default AnomalyAnalysisView
