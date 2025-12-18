'use client'

/**
 * CompactTableView - Medium-Sized Table Display
 *
 * For result sets with 6-15 rows in document panel.
 * Supports: row click, show on map, expand to bottom
 */

import React, { useState, useCallback } from 'react'
import {
  Table,
  Map,
  Maximize2,
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QueryResult } from '@/lib/services/chatQueryService'

// ============================================================================
// Types
// ============================================================================

export interface CompactTableViewProps {
  results: QueryResult
  onRowClick?: (row: any) => void
  onShowOnMap?: (row: any) => void
  onExpandToFull?: () => void
  onExport?: () => void
  maxHeight?: string
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

// ============================================================================
// Component
// ============================================================================

export default function CompactTableView({
  results,
  onRowClick,
  onShowOnMap,
  onExpandToFull,
  onExport,
  maxHeight = 'calc(100vh - 200px)',
  className
}: CompactTableViewProps) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)

  // Handle row selection
  const handleRowClick = useCallback((index: number, row: any) => {
    setSelectedRow(index === selectedRow ? null : index)
    onRowClick?.(row)
  }, [selectedRow, onRowClick])

  // Handle column sort
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection])

  // Handle copy
  const handleCopy = useCallback(async (value: string, cellId: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedCell(cellId)
    setTimeout(() => setCopiedCell(null), 1500)
  }, [])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return results.data

    return [...results.data].sort((a, b) => {
      const key = sortColumn.toLowerCase()
      const aVal = a[key] ?? a[sortColumn]
      const bVal = b[key] ?? b[sortColumn]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal || '')
      const bStr = String(bVal || '')
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [results.data, sortColumn, sortDirection])

  // Check if row has geo data
  const hasGeoData = (row: any) =>
    (row.lat || row.latitude) && (row.lng || row.longitude)

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Results</h3>
            <p className="text-xs text-slate-500">
              {results.data.length} rows
              {results.executionTime && ` • ${results.executionTime}ms`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Export data"
            >
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          )}
          {onExpandToFull && (
            <button
              onClick={onExpandToFull}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Expand to full table"
            >
              <Maximize2 className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        {results.data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-500">
            <p className="text-sm">No results</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <tr>
                {results.columns.map((column, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(column)}
                    className={cn(
                      'px-3 py-2 text-left font-medium cursor-pointer',
                      'text-slate-400 uppercase text-xs tracking-wider',
                      'border-b border-slate-700/50',
                      'hover:bg-slate-800/50 transition-colors'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column}</span>
                      {sortColumn === column && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-16 px-2 py-2 border-b border-slate-700/50" />
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => handleRowClick(rowIndex, row)}
                  className={cn(
                    'border-b border-slate-800/50 cursor-pointer transition-colors',
                    selectedRow === rowIndex
                      ? 'bg-blue-600/20'
                      : 'hover:bg-slate-800/50'
                  )}
                >
                  {results.columns.map((column, colIndex) => {
                    const key = column.toLowerCase()
                    const value = row[key] ?? row[column] ?? ''
                    const cellId = `${rowIndex}-${colIndex}`
                    const displayValue = typeof value === 'number'
                      ? value.toLocaleString(undefined, { maximumFractionDigits: 6 })
                      : String(value)

                    return (
                      <td
                        key={colIndex}
                        className="px-3 py-2 text-slate-200 max-w-[180px] truncate"
                        title={displayValue}
                      >
                        <div className="flex items-center gap-2 group">
                          <span className="truncate">{displayValue}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(displayValue, cellId)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            {copiedCell === cellId ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                            )}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-2 py-2">
                    {hasGeoData(row) && onShowOnMap && (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
