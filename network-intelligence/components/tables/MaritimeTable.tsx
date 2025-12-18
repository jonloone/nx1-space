'use client'

/**
 * MaritimeTable - TanStack Table Wrapper for Maritime Data
 *
 * Professional data table with sorting, filtering, and row selection.
 * Uses TanStack Table v8 for full-featured data management.
 *
 * Features:
 * - Column sorting
 * - Row selection with map sync
 * - Virtualized rows (for large datasets)
 * - Custom cell renderers
 * - Click to show on map
 * - Export functionality
 * - Pagination
 */

import React, { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
  Row,
  FilterFn
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface MaritimeTableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (info: { getValue: () => any; row: Row<T> }) => React.ReactNode
  sortable?: boolean
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  enableGlobalFilter?: boolean
}

export interface MaritimeTableProps<T extends object> {
  data: T[]
  columns: MaritimeTableColumn<T>[]
  onRowClick?: (row: T) => void
  onShowOnMap?: (row: T) => void
  selectedId?: string | null
  idKey?: keyof T
  isLoading?: boolean
  emptyMessage?: string
  pageSize?: number
  showPagination?: boolean
  className?: string
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
}

// ============================================================================
// Cell Renderers
// ============================================================================

export function StatusBadge({ value, colorMap }: { value: string; colorMap?: Record<string, string> }) {
  const defaultColors: Record<string, string> = {
    active: 'vessel-status-moving',
    moving: 'vessel-status-moving',
    anchored: 'vessel-status-anchored',
    moored: 'vessel-status-moored',
    idle: 'vessel-status-idle',
    offline: 'vessel-status-offline',
    inactive: 'vessel-status-offline',
    critical: 'severity-critical',
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low'
  }

  const colors = colorMap || defaultColors
  const colorClass = colors[value?.toLowerCase()] || 'bg-slate-700/50 text-slate-300'

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colorClass)}>
      {value}
    </span>
  )
}

export function CoordinateCell({ lat, lng }: { lat: number; lng: number }) {
  const formatCoord = (val: number, type: 'lat' | 'lng') => {
    const dir = type === 'lat' ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W')
    return `${Math.abs(val).toFixed(3)}° ${dir}`
  }

  return (
    <span className="text-xs text-slate-400 font-mono">
      {formatCoord(lat, 'lat')}, {formatCoord(lng, 'lng')}
    </span>
  )
}

export function NumberCell({
  value,
  suffix,
  decimals = 1,
  colorThresholds
}: {
  value: number
  suffix?: string
  decimals?: number
  colorThresholds?: { warn: number; danger: number }
}) {
  let colorClass = 'text-slate-200'
  if (colorThresholds) {
    if (value >= colorThresholds.danger) {
      colorClass = 'text-red-400'
    } else if (value >= colorThresholds.warn) {
      colorClass = 'text-amber-400'
    }
  }

  return (
    <span className={cn('font-medium', colorClass)}>
      {value.toFixed(decimals)}{suffix && <span className="text-slate-500 ml-1">{suffix}</span>}
    </span>
  )
}

export function TimestampCell({ date }: { date: Date | string }) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  let timeAgo: string
  if (diffMins < 1) {
    timeAgo = 'Just now'
  } else if (diffMins < 60) {
    timeAgo = `${diffMins}m ago`
  } else if (diffMins < 1440) {
    timeAgo = `${Math.floor(diffMins / 60)}h ago`
  } else {
    timeAgo = `${Math.floor(diffMins / 1440)}d ago`
  }

  return (
    <span className="text-xs text-slate-400" title={d.toLocaleString()}>
      {timeAgo}
    </span>
  )
}

// ============================================================================
// Component
// ============================================================================

export default function MaritimeTable<T extends object>({
  data,
  columns: columnDefs,
  onRowClick,
  onShowOnMap,
  selectedId,
  idKey = 'id' as keyof T,
  isLoading = false,
  emptyMessage = 'No data available',
  pageSize = 50,
  showPagination = true,
  className,
  globalFilter,
  onGlobalFilterChange
}: MaritimeTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})

  // Convert our column format to TanStack format
  const columns = useMemo<ColumnDef<T>[]>(() => {
    return columnDefs.map((col) => ({
      id: col.id,
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <button
            className={cn(
              'flex items-center gap-1 text-xs font-medium uppercase tracking-wide',
              col.sortable !== false && 'cursor-pointer hover:text-slate-200',
              'text-slate-500'
            )}
            onClick={col.sortable !== false ? column.getToggleSortingHandler() : undefined}
            style={{ textAlign: col.align || 'left' }}
          >
            <span>{col.header}</span>
            {col.sortable !== false && (
              isSorted === 'asc' ? (
                <ArrowUp className="w-3 h-3" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )
            )}
          </button>
        )
      },
      accessorKey: col.accessorKey as string,
      accessorFn: col.accessorFn,
      cell: col.cell
        ? (info) => col.cell!(info)
        : (info) => {
            const value = info.getValue()
            return (
              <span className={cn(
                'text-sm',
                col.align === 'right' && 'text-right',
                col.align === 'center' && 'text-center'
              )}>
                {value?.toString() || '-'}
              </span>
            )
          },
      enableSorting: col.sortable !== false,
      enableGlobalFilter: col.enableGlobalFilter !== false,
      size: col.width,
      minSize: col.minWidth || 50
    }))
  }, [columnDefs])

  // Add show on map column
  const columnsWithActions = useMemo<ColumnDef<T>[]>(() => {
    if (!onShowOnMap) return columns

    return [
      ...columns,
      {
        id: '_actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShowOnMap(row.original)
            }}
            className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition-colors"
            title="Show on map"
          >
            <MapPin className="w-4 h-4" />
          </button>
        ),
        size: 40,
        enableSorting: false,
        enableGlobalFilter: false
      }
    ]
  }, [columns, onShowOnMap])

  const table = useReactTable({
    data,
    columns: columnsWithActions,
    state: {
      sorting,
      globalFilter,
      rowSelection
    },
    onSortingChange: setSorting,
    onGlobalFilterChange,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: {
        pageSize
      }
    }
  })

  const handleRowClick = useCallback((row: T) => {
    onRowClick?.(row)
  }, [onRowClick])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading data...</span>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left border-b border-slate-700/50"
                    style={{
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const rowId = row.original[idKey]
              const isSelected = selectedId !== undefined && rowId === selectedId

              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-blue-600/20 border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 border-b border-slate-800/50"
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
          <div className="text-sm text-slate-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            <span className="ml-2">
              ({table.getFilteredRowModel().rows.length} rows)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed
                       text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed
                       text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Preset Column Configurations
// ============================================================================

export function createVesselColumns<T extends {
  mmsi: string
  name: string
  vesselType: string
  status: string
  speed: number
  heading: number
  lat: number
  lng: number
  anomalyCount?: number
}>(): MaritimeTableColumn<T>[] {
  return [
    {
      id: 'name',
      header: 'Vessel',
      accessorKey: 'name',
      cell: ({ getValue, row }) => (
        <div>
          <div className="font-medium text-slate-200">{getValue() || 'Unknown'}</div>
          <div className="text-xs text-slate-500">{row.original.mmsi}</div>
        </div>
      ),
      width: 180
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'vesselType',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-300 capitalize">{getValue() || 'Unknown'}</span>
      ),
      width: 100
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge value={getValue()} />,
      width: 100
    },
    {
      id: 'speed',
      header: 'Speed',
      accessorKey: 'speed',
      cell: ({ getValue }) => <NumberCell value={getValue()} suffix="kn" />,
      width: 80,
      align: 'right'
    },
    {
      id: 'heading',
      header: 'Heading',
      accessorKey: 'heading',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-300">{Math.round(getValue())}°</span>
      ),
      width: 80,
      align: 'right'
    },
    {
      id: 'position',
      header: 'Position',
      accessorFn: (row) => `${row.lat},${row.lng}`,
      cell: ({ row }) => <CoordinateCell lat={row.original.lat} lng={row.original.lng} />,
      width: 160,
      sortable: false
    },
    {
      id: 'anomalies',
      header: 'Anomalies',
      accessorKey: 'anomalyCount',
      cell: ({ getValue }) => {
        const count = getValue() || 0
        return (
          <NumberCell
            value={count}
            decimals={0}
            colorThresholds={{ warn: 1, danger: 5 }}
          />
        )
      },
      width: 90,
      align: 'right'
    }
  ]
}

export function createAnomalyColumns<T extends {
  id: string
  vesselName: string
  type: string
  severity: string
  timestamp: Date
  duration?: number
  confidence: number
}>(): MaritimeTableColumn<T>[] {
  return [
    {
      id: 'vessel',
      header: 'Vessel',
      accessorKey: 'vesselName',
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-200">{getValue()}</span>
      ),
      width: 150
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-300 capitalize">
          {getValue()?.replace(/_/g, ' ')}
        </span>
      ),
      width: 120
    },
    {
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      cell: ({ getValue }) => <StatusBadge value={getValue()} />,
      width: 100
    },
    {
      id: 'time',
      header: 'Time',
      accessorKey: 'timestamp',
      cell: ({ getValue }) => <TimestampCell date={getValue()} />,
      width: 100
    },
    {
      id: 'duration',
      header: 'Duration',
      accessorKey: 'duration',
      cell: ({ getValue }) => {
        const mins = getValue()
        if (!mins) return <span className="text-slate-500">-</span>
        const hours = Math.floor(mins / 60)
        const remainMins = mins % 60
        return (
          <span className="text-sm text-slate-300">
            {hours > 0 ? `${hours}h ` : ''}{remainMins}m
          </span>
        )
      },
      width: 80,
      align: 'right'
    },
    {
      id: 'confidence',
      header: 'Confidence',
      accessorKey: 'confidence',
      cell: ({ getValue }) => {
        const conf = getValue()
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${conf}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-8">{Math.round(conf)}%</span>
          </div>
        )
      },
      width: 120
    }
  ]
}
