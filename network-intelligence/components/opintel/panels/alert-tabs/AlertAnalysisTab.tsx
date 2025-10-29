/**
 * Alert Analysis Tab
 * Related events and alerts with TanStack Table
 */

'use client'

import React, { useMemo, useState } from 'react'
import { FileText, AlertTriangle, TrendingUp, ExternalLink, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'
import { getPriorityColor } from '../IntelligenceAlertPanel'

// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'

export interface AlertAnalysisTabProps {
  alert: IntelligenceAlert
  relatedAlerts?: IntelligenceAlert[]
  onAlertClick?: (alertId: string) => void
}

// Create column helper
const columnHelper = createColumnHelper<IntelligenceAlert>()

/**
 * Alert Analysis Tab Component
 */
export function AlertAnalysisTab({ alert, relatedAlerts = [], onAlertClick }: AlertAnalysisTabProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true } // Default sort by newest first
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // All alerts (current + related)
  const allAlerts = useMemo(() => {
    return [alert, ...relatedAlerts]
  }, [alert, relatedAlerts])

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('timestamp', {
        header: 'Time',
        cell: info => {
          const date = info.getValue()
          return (
            <div className="text-xs">
              <div className="font-medium text-gray-900">
                {date.toLocaleDateString()}
              </div>
              <div className="text-gray-500">
                {date.toLocaleTimeString()}
              </div>
            </div>
          )
        },
        sortingFn: 'datetime'
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: info => {
          const priority = info.getValue()
          const colors = getPriorityColor(priority)
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase ${colors.text} ${colors.bg} ${colors.border}`}
            >
              {priority}
            </Badge>
          )
        },
        sortingFn: (rowA, rowB) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          const a = priorityOrder[rowA.original.priority as keyof typeof priorityOrder]
          const b = priorityOrder[rowB.original.priority as keyof typeof priorityOrder]
          return a - b
        }
      }),
      columnHelper.accessor('title', {
        header: 'Alert',
        cell: info => (
          <div className="max-w-xs">
            <div className="text-xs font-medium text-gray-900 line-clamp-2">
              {info.getValue()}
            </div>
            {info.row.original.actionRequired && (
              <Badge className="bg-red-600 text-white text-[9px] mt-1 px-1 py-0">
                ACTION REQUIRED
              </Badge>
            )}
          </div>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: info => (
          <span className="text-xs text-gray-700">
            {info.getValue().replace('-', ' ').toUpperCase()}
          </span>
        )
      }),
      columnHelper.accessor('confidence', {
        header: 'Confidence',
        cell: info => {
          const confidence = info.getValue()
          const colorMap = {
            confirmed: 'text-green-700 bg-green-50 border-green-300',
            high: 'text-blue-700 bg-blue-50 border-blue-300',
            medium: 'text-yellow-700 bg-yellow-50 border-yellow-300',
            low: 'text-gray-700 bg-gray-50 border-gray-300'
          }
          return (
            <Badge
              variant="outline"
              className={`text-[10px] uppercase ${colorMap[confidence]}`}
            >
              {confidence}
            </Badge>
          )
        }
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: info => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onAlertClick?.(info.row.original.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        )
      })
    ],
    [onAlertClick]
  )

  // Create table instance
  const table = useReactTable({
    data: allAlerts,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const filtered = table.getFilteredRowModel().rows

    return {
      total: allAlerts.length,
      filtered: filtered.length,
      critical: filtered.filter(r => r.original.priority === 'critical').length,
      actionRequired: filtered.filter(r => r.original.actionRequired).length,
      avgConfidence: {
        confirmed: filtered.filter(r => r.original.confidence === 'confirmed').length,
        high: filtered.filter(r => r.original.confidence === 'high').length
      }
    }
  }, [allAlerts, table])

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.filtered}</div>
                <div className="text-xs text-gray-600">Total Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.critical}</div>
                <div className="text-xs text-gray-600">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <Input
                placeholder="Search alerts..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-8 h-9 text-xs border-gray-300"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-gray-300"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TanStack Table */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <CardTitle className="text-sm font-semibold text-gray-700">
                Related Alerts & Events
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
              {stats.filtered} of {stats.total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1.5">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {{
                              asc: ' ↑',
                              desc: ' ↓'
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-3 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-7 text-xs border-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-7 text-xs border-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="border-gray-200 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-blue-900">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            <span>
              <strong>{stats.actionRequired}</strong> alerts require immediate action
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            <span>
              <strong>{stats.avgConfidence.confirmed + stats.avgConfidence.high}</strong> alerts have high/confirmed confidence
            </span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600 mt-1.5 shrink-0" />
            <span>
              Pattern analysis suggests coordinated activity across multiple locations
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
