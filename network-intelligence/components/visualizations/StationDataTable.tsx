'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

export interface StationTableData {
  id: string
  name: string
  operator: string
  country: string
  utilization: number
  revenue: number
  margin: number
  status: 'active' | 'idle' | 'critical'
  services?: string
  utilizationTrend?: number
}

interface StationDataTableProps {
  data: StationTableData[]
  onRowClick?: (station: StationTableData) => void
  onExport?: (format: 'csv' | 'json') => void
}

export default function StationDataTable({
  data,
  onRowClick,
  onExport
}: StationDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Define columns
  const columns = useMemo<ColumnDef<StationTableData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Station Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="font-medium text-white">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'operator',
        header: 'Operator',
        cell: ({ row }) => {
          const operator = row.original.operator
          const colors: Record<string, string> = {
            SES: '#3B82F6',
            AWS: '#FF9900',
            Telesat: '#9C27B0',
            SpaceX: '#00BCD4',
            KSAT: '#FFEB3B',
            Intelsat: '#E91E63'
          }
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[operator] || '#9CA3AF' }}
              />
              <span className="text-gray-300">{operator}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'country',
        header: 'Location',
        cell: ({ row }) => (
          <span className="text-gray-300">{row.original.country}</span>
        ),
      },
      {
        accessorKey: 'utilization',
        header: 'Utilization',
        cell: ({ row }) => {
          const value = row.original.utilization
          const trend = row.original.utilizationTrend
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 max-w-[100px]">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-white font-medium w-12 text-right">
                {value.toFixed(0)}%
              </span>
              {trend !== undefined && (
                <div className="w-4">
                  {trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : trend < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'revenue',
        header: 'Revenue',
        cell: ({ row }) => {
          const value = row.original.revenue
          return (
            <span className="text-white font-medium">
              ${value.toFixed(2)}M
            </span>
          )
        },
      },
      {
        accessorKey: 'margin',
        header: 'Margin',
        cell: ({ row }) => {
          const value = row.original.margin
          const isPositive = value >= 0
          return (
            <span
              className={`font-medium ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? '+' : ''}{value.toFixed(1)}%
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = {
            active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Active' },
            idle: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Idle' },
            critical: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical' },
          }
          const config = statusConfig[status] || statusConfig.active
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
              {config.label}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      // Generate CSV
      const headers = columns.map((col: any) => col.header).join(',')
      const rows = data.map(row =>
        [
          row.name,
          row.operator,
          row.country,
          row.utilization,
          row.revenue,
          row.margin,
          row.status
        ].join(',')
      )
      const csv = [headers, ...rows].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stations-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Generate JSON
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stations-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    onExport?.(format)
  }

  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">Station Data</h3>
            <p className="text-gray-400 text-sm">
              {table.getFilteredRowModel().rows.length} stations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search stations..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-300"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-2 hover:text-white transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-4 h-4" />,
                          desc: <ChevronDown className="w-4 h-4" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ChevronsUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onRowClick?.(row.original)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
