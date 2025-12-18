'use client'

/**
 * ArtifactPanel - Data table and charts display panel
 *
 * Features:
 * - Collapsible height (0, 40%, 60%)
 * - Dynamic table columns based on result type
 * - Chart rendering (bar, pie, line)
 * - Row selection with map sync
 * - Export functionality
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Table as TableIcon,
  BarChart3,
  Download,
  X,
  MapPin,
  AlertTriangle,
  Ship,
  Anchor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MaritimeQueryResult } from '@/app/maritime-intel/page'

// ============================================================================
// Types
// ============================================================================

interface ArtifactPanelProps {
  result: MaritimeQueryResult | null
  height: 'collapsed' | 'default' | 'expanded'
  onToggleHeight: () => void
  onClose: () => void
  onRowSelect: (row: any) => void
  selectedRow?: any
}

// Height mapping
const heightMap = {
  collapsed: 'h-14',
  default: 'h-[40vh]',
  expanded: 'h-[60vh]'
}

// ============================================================================
// Component
// ============================================================================

export default function ArtifactPanel({
  result,
  height,
  onToggleHeight,
  onClose,
  onRowSelect,
  selectedRow
}: ArtifactPanelProps) {
  // Get icon for result type
  const ResultIcon = useMemo(() => {
    if (!result) return TableIcon
    switch (result.type) {
      case 'vessels': return Ship
      case 'anomalies': return AlertTriangle
      case 'ports': return Anchor
      default: return TableIcon
    }
  }, [result])

  // Format cell value for display
  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('latitude') || key.toLowerCase().includes('longitude')) {
        return value.toFixed(4)
      }
      if (key.toLowerCase().includes('speed')) {
        return `${value.toFixed(1)} kts`
      }
      if (key.toLowerCase().includes('heading')) {
        return `${value}°`
      }
      return value.toLocaleString()
    }
    return String(value)
  }

  // Get cell data keys from result
  const dataKeys = useMemo(() => {
    if (!result || result.data.length === 0) return []
    const firstRow = result.data[0]
    // Exclude coordinates from display (shown on map)
    return Object.keys(firstRow).filter(k =>
      !['latitude', 'longitude', 'lat', 'lng'].includes(k.toLowerCase())
    )
  }, [result])

  // Handle export
  const handleExport = () => {
    if (!result) return

    const csv = [
      dataKeys.join(','),
      ...result.data.map(row =>
        dataKeys.map(k => {
          const val = row[k]
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`
          }
          return val ?? ''
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maritime-${result.type}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      className={cn(
        'flex-shrink-0 bg-gray-900 border-t border-gray-800',
        'transition-all duration-300 ease-in-out',
        heightMap[height]
      )}
    >
      {/* Header bar */}
      <div
        className="h-14 px-4 flex items-center justify-between border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={onToggleHeight}
      >
        <div className="flex items-center gap-3">
          {/* Drag handle / toggle */}
          <div className="flex flex-col gap-0.5">
            {height === 'collapsed' ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>

          {/* Result info */}
          {result ? (
            <div className="flex items-center gap-3">
              <ResultIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white capitalize">
                {result.type}
              </span>
              <span className="text-xs text-gray-500">
                {result.data.length} results
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No data</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {result && height !== 'collapsed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleExport()
              }}
              className="h-8 px-3 text-xs text-gray-400 hover:text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
          {height !== 'collapsed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <AnimatePresence>
        {height !== 'collapsed' && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100%-3.5rem)] overflow-hidden flex"
          >
            {/* Data Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-800">
                    {dataKeys.map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {result.data.map((row, index) => {
                    const isSelected = selectedRow &&
                      (selectedRow.mmsi === row.mmsi || selectedRow.id === row.id)

                    return (
                      <tr
                        key={row.id || row.mmsi || index}
                        onClick={() => onRowSelect(row)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-blue-600/20 border-l-2 border-l-blue-500'
                            : 'hover:bg-gray-800/50'
                        )}
                      >
                        {dataKeys.map((key) => (
                          <td
                            key={key}
                            className="px-4 py-3 text-gray-300 whitespace-nowrap"
                          >
                            {/* Special formatting for certain fields */}
                            {key === 'severity' ? (
                              <SeverityBadge severity={row[key]} />
                            ) : key === 'type' && result.type === 'anomalies' ? (
                              <AnomalyTypeBadge type={row[key]} />
                            ) : key === 'status' ? (
                              <StatusBadge status={row[key]} />
                            ) : (
                              formatCellValue(row[key], key)
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          {(row.latitude || row.lat) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onRowSelect(row)
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Show on map"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {result.data.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  No data to display
                </div>
              )}
            </div>

            {/* Chart panel (if chart data exists) */}
            {result.chartData && (
              <div className="w-80 border-l border-gray-800 p-4 flex-shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">Chart</span>
                </div>
                <SimpleChart data={result.chartData} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// Badge Components
// ============================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30'
  }

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium border',
      colors[severity?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    )}>
      {severity}
    </span>
  )
}

function AnomalyTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    'AIS_GAP': 'bg-red-500/20 text-red-400',
    'LOITERING': 'bg-orange-500/20 text-orange-400',
    'RENDEZVOUS': 'bg-purple-500/20 text-purple-400',
    'SPEED_ANOMALY': 'bg-yellow-500/20 text-yellow-400',
    'COURSE_DEVIATION': 'bg-cyan-500/20 text-cyan-400'
  }

  const labels: Record<string, string> = {
    'AIS_GAP': 'AIS Gap',
    'LOITERING': 'Loitering',
    'RENDEZVOUS': 'Rendezvous',
    'SPEED_ANOMALY': 'Speed',
    'COURSE_DEVIATION': 'Course'
  }

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-md text-xs font-medium',
      colors[type] || 'bg-gray-500/20 text-gray-400'
    )}>
      {labels[type] || type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'underway': 'bg-green-500/20 text-green-400',
    'anchored': 'bg-blue-500/20 text-blue-400',
    'moored': 'bg-purple-500/20 text-purple-400',
    'fishing': 'bg-cyan-500/20 text-cyan-400'
  }

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-md text-xs font-medium',
      colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
    )}>
      {status}
    </span>
  )
}

// ============================================================================
// Simple Chart Component
// ============================================================================

function SimpleChart({ data }: { data: { type: string; data: any[]; config?: any } }) {
  if (data.type === 'pie') {
    return <SimplePieChart data={data.data} config={data.config} />
  }

  if (data.type === 'bar') {
    return <SimpleBarChart data={data.data} config={data.config} />
  }

  return <div className="text-gray-500 text-sm">Chart type not supported</div>
}

function SimplePieChart({ data, config }: { data: any[]; config?: any }) {
  const total = data.reduce((sum, item) => sum + (item[config?.valueKey || 'count'] || 0), 0)
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280']

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const value = item[config?.valueKey || 'count'] || 0
        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0

        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{item[config?.nameKey || 'category']}</span>
              <span className="text-white">{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[i % colors.length]
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SimpleBarChart({ data, config }: { data: any[]; config?: any }) {
  const maxValue = Math.max(...data.flatMap(item =>
    (config?.yKeys || ['arrivals', 'departures']).map((k: string) => item[k] || 0)
  ))

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="text-xs text-gray-400">{item[config?.xKey || 'name']}</div>
          {(config?.yKeys || ['arrivals', 'departures']).map((key: string, j: number) => {
            const value = item[key] || 0
            const width = maxValue > 0 ? (value / maxValue * 100) : 0
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="w-16 text-xs text-gray-500 capitalize">{key}</div>
                <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      backgroundColor: j === 0 ? '#3b82f6' : '#10b981'
                    }}
                  />
                </div>
                <div className="w-8 text-xs text-gray-400 text-right">{value}</div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
