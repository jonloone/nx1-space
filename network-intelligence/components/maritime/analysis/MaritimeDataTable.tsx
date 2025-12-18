'use client'

/**
 * Maritime Data Table
 * Unified configurable table component for all maritime analysis views
 *
 * Features:
 * - Column definition schema with multiple cell types
 * - Built-in sorting (client-side)
 * - Row selection with map highlighting
 * - Cell renderers: text, number, badge, progress, sparkline, status, timestamp
 * - Pagination for large datasets
 * - Click-to-show-on-map integration
 */

import React, { useState, useMemo, useCallback, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Map,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  TableColumn,
  SortState,
  MaritimeDataTableProps,
  CellType
} from '@/lib/types/maritime-analysis'
import type { AnomalySeverity } from '@/lib/types/ais-anomaly'

// ============================================================================
// Cell Renderers
// ============================================================================

/**
 * Badge colors for severity/status
 */
const BADGE_COLORS: Record<string, string> = {
  // Severity
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  // Status
  active: 'bg-green-500/20 text-green-400 border-green-500/50',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  // Risk levels
  compliant: 'bg-green-500/20 text-green-400 border-green-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'non-compliant': 'bg-red-500/20 text-red-400 border-red-500/50',
  // Anomaly types
  AIS_GAP: 'bg-red-500/20 text-red-400 border-red-500/50',
  LOITERING: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  RENDEZVOUS: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  SPEED_ANOMALY: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  COURSE_DEVIATION: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
}

/**
 * Status dot colors
 */
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-400',
  inactive: 'bg-slate-500',
  unknown: 'bg-slate-500',
  online: 'bg-green-400',
  offline: 'bg-slate-500',
  warning: 'bg-yellow-400',
  error: 'bg-red-400'
}

/**
 * Format a number with locale-specific formatting
 */
function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    ...options
  })
}

/**
 * Format a timestamp
 */
function formatTimestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format a duration in minutes
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

/**
 * Format coordinates
 */
function formatLocation(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`
}

/**
 * Badge cell renderer
 */
function BadgeCell({ value, colors }: { value: string, colors?: Record<string, string> }) {
  const colorClass = colors?.[value] || BADGE_COLORS[value] || BADGE_COLORS[value.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/50'

  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 text-xs font-medium rounded border',
      colorClass
    )}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}

/**
 * Status dot cell renderer
 */
function StatusCell({ value }: { value: string }) {
  const colorClass = STATUS_COLORS[value] || STATUS_COLORS[value.toLowerCase()] || 'bg-slate-500'

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-2 h-2 rounded-full', colorClass)} />
      <span className="capitalize">{value}</span>
    </div>
  )
}

/**
 * Progress bar cell renderer
 */
function ProgressCell({ value, max = 100 }: { value: number, max?: number }) {
  const percent = Math.min(100, (value / max) * 100)
  const colorClass = percent >= 80 ? 'bg-green-500' :
                     percent >= 50 ? 'bg-yellow-500' :
                     percent >= 20 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', colorClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">
        {Math.round(percent)}%
      </span>
    </div>
  )
}

/**
 * Sparkline cell renderer
 */
function SparklineCell({ data }: { data: number[] }) {
  if (!data || data.length < 2) return <span className="text-slate-500">-</span>

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 60
  const height = 20

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="text-blue-400">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Generic cell renderer
 */
function CellRenderer<T>({
  value,
  row,
  column
}: {
  value: any
  row: T
  column: TableColumn<T>
}) {
  // Custom render function takes priority
  if (column.render) {
    return <>{column.render(value, row)}</>
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-slate-500">-</span>
  }

  // Type-based rendering
  switch (column.type) {
    case 'badge':
      return <BadgeCell value={String(value)} colors={column.badgeColors} />

    case 'status':
      return <StatusCell value={String(value)} />

    case 'progress':
      return <ProgressCell value={Number(value)} />

    case 'sparkline':
      return <SparklineCell data={value as number[]} />

    case 'timestamp':
      return <span>{formatTimestamp(value)}</span>

    case 'duration':
      return <span>{formatDuration(Number(value))}</span>

    case 'location':
      if (typeof value === 'object' && value.lat !== undefined) {
        return <span className="font-mono text-xs">{formatLocation(value.lat, value.lng)}</span>
      }
      return <span className="text-slate-500">-</span>

    case 'number':
      return <span>{formatNumber(Number(value), column.numberFormat)}</span>

    case 'text':
    default:
      return <span className="truncate">{String(value)}</span>
  }
}

// ============================================================================
// Table Component
// ============================================================================

/**
 * Maritime Data Table Component
 */
export function MaritimeDataTable<T extends Record<string, any>>({
  data,
  columns,
  sortState,
  onSortChange,
  onRowClick,
  onRowHover,
  onShowOnMap,
  selectedId,
  idKey = 'id',
  isLoading = false,
  emptyMessage = 'No data available',
  showPagination = true,
  pageSize = 50,
  maxHeight = 'calc(45vh - 104px)'
}: MaritimeDataTableProps<T>) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  // Sort data client-side
  const sortedData = useMemo(() => {
    if (!sortState) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortState.key]
      const bVal = b[sortState.key]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortState.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortState])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData
    const start = currentPage * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize, showPagination])

  // Total pages
  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sort click
  const handleSortClick = useCallback((key: string) => {
    if (!onSortChange) return

    if (sortState?.key === key) {
      onSortChange({
        key,
        direction: sortState.direction === 'asc' ? 'desc' : 'asc'
      })
    } else {
      onSortChange({ key, direction: 'asc' })
    }
  }, [sortState, onSortChange])

  // Handle copy
  const handleCopy = useCallback(async (value: string, id: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  // Get row ID
  const getRowId = useCallback((row: T): string => {
    return String(row[idKey as keyof T] || '')
  }, [idKey])

  // Check if row has location
  const rowHasLocation = useCallback((row: T): boolean => {
    return (
      (row.lat !== undefined && row.lng !== undefined) ||
      (row.latitude !== undefined && row.longitude !== undefined) ||
      (row.position?.lat !== undefined && row.position?.lng !== undefined) ||
      (row.location?.lat !== undefined && row.location?.lng !== undefined)
    )
  }, [])

  // Visible columns
  const visibleColumns = useMemo(() =>
    columns.filter(col => !col.hidden),
    [columns]
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Loading data...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table container */}
      <div className="flex-1 overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          {/* Header */}
          <thead className="sticky top-0 bg-slate-800/95 backdrop-blur z-10">
            <tr>
              {visibleColumns.map((column, i) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-3 py-2.5 text-left font-medium',
                    'text-slate-400 uppercase text-xs tracking-wider',
                    'border-b border-slate-700',
                    column.sortable && 'cursor-pointer hover:text-slate-200 select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth
                  }}
                  onClick={() => column.sortable && handleSortClick(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {column.sortable && sortState?.key === column.key && (
                      sortState.direction === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {/* Actions column */}
              {onShowOnMap && (
                <th className="w-12 px-2 py-2.5 border-b border-slate-700" />
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.map((row, rowIndex) => {
              const rowId = getRowId(row)
              const isSelected = selectedId === rowId

              return (
                <tr
                  key={rowId || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => onRowHover?.(row)}
                  onMouseLeave={() => onRowHover?.(null)}
                  className={cn(
                    'border-b border-slate-800/50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected
                      ? 'bg-blue-600/20'
                      : 'hover:bg-slate-800/50'
                  )}
                >
                  {visibleColumns.map((column) => {
                    const value = row[column.key as keyof T]

                    return (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-3 py-2.5 text-slate-200',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                        style={{
                          maxWidth: column.width || 200
                        }}
                      >
                        <div className="flex items-center gap-1 group">
                          <CellRenderer value={value} row={row} column={column} />
                        </div>
                      </td>
                    )
                  })}

                  {/* Map button */}
                  {onShowOnMap && (
                    <td className="px-2 py-2.5">
                      {rowHasLocation(row) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowOnMap(row)
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Show on map"
                        >
                          <Map className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-900/50">
          <span className="text-xs text-slate-500">
            Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={cn(
                'p-1.5 rounded transition-colors',
                currentPage === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs text-slate-400">
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className={cn(
                'p-1.5 rounded transition-colors',
                currentPage >= totalPages - 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaritimeDataTable
