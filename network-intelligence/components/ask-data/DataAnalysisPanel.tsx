'use client'

/**
 * Data Analysis Panel
 * Bottom slide-up panel displaying query results in a table format
 * Based on reference UI design
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Table,
  Map,
  ExternalLink,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QueryResult {
  sql: string
  data: any[]
  columns: string[]
  executionTime?: number
}

interface DataAnalysisPanelProps {
  results: QueryResult | null
  isOpen: boolean
  onClose: () => void
  onRowClick?: (row: any) => void
  onShowOnMap?: (row: any) => void
  className?: string
}

export default function DataAnalysisPanel({
  results,
  isOpen,
  onClose,
  onRowClick,
  onShowOnMap,
  className
}: DataAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  const handleCopy = async (value: string, cellId: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedCell(cellId)
    setTimeout(() => setCopiedCell(null), 1500)
  }

  const handleExport = () => {
    if (!results) return

    // Convert to CSV
    const headers = results.columns.join(',')
    const rows = results.data.map(row =>
      results.columns.map(col => {
        const val = row[col.toLowerCase()] ?? row[col] ?? ''
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      }).join(',')
    ).join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'query_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRowSelect = (index: number, row: any) => {
    setSelectedRow(index === selectedRow ? null : index)
    onRowClick?.(row)
  }

  if (!results) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-gray-900/98 backdrop-blur-xl',
            'border-t border-gray-700',
            className
          )}
          style={{
            height: isExpanded ? '45vh' : '52px',
            left: '480px' // Account for 480px chat panel
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
              >
                <Table className="w-4 h-4" />
                <span className="font-medium">Query Results</span>
                <span className="text-sm text-gray-500">
                  ({results.data.length} rows)
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {results.executionTime && (
                <span className="text-xs text-gray-500">
                  Executed in {results.executionTime}ms
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-8 px-3 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table Content */}
          {isExpanded && (
            <div className="h-[calc(100%-52px)] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-800/95 backdrop-blur">
                  <tr>
                    {results.columns.map((column, i) => (
                      <th
                        key={i}
                        className={cn(
                          'px-4 py-2.5 text-left font-medium',
                          'text-gray-400 uppercase text-xs tracking-wider',
                          'border-b border-gray-700'
                        )}
                      >
                        {column}
                      </th>
                    ))}
                    <th className="w-20 px-2 py-2.5 border-b border-gray-700" />
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      onClick={() => handleRowSelect(rowIndex, row)}
                      className={cn(
                        'border-b border-gray-800/50 cursor-pointer transition-colors',
                        selectedRow === rowIndex
                          ? 'bg-blue-600/20'
                          : 'hover:bg-gray-800/50'
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
                            className={cn(
                              'px-4 py-2.5 text-gray-200',
                              'max-w-[200px] truncate'
                            )}
                            title={displayValue}
                          >
                            <div className="flex items-center gap-2 group">
                              <span className="truncate">{displayValue}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopy(displayValue, cellId)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedCell === cellId ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-500 hover:text-white" />
                                )}
                              </button>
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-2 py-2.5">
                        {(row.lat || row.latitude) && (row.lng || row.longitude) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onShowOnMap?.(row)
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
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
            </div>
          )}

          {/* Attribution */}
          <div className="absolute bottom-2 right-4 text-xs text-gray-600">
            Map data &copy; <a href="https://carto.com" className="hover:text-gray-400">CARTO</a>, &copy; <a href="https://openstreetmap.org" className="hover:text-gray-400">OpenStreetMap</a> contributors
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
