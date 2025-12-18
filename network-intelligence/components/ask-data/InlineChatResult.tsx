'use client'

/**
 * InlineChatResult - Compact Result Display in Chat
 *
 * For small result sets (<=5 rows) shown inline in chat messages.
 * Provides quick actions: View on Map, Expand to Panel
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Map,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Table,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QueryResult } from '@/lib/services/chatQueryService'

// ============================================================================
// Types
// ============================================================================

export interface InlineChatResultProps {
  results: QueryResult
  onShowOnMap?: (row: any) => void
  onExpandToPanel?: () => void
  onRowClick?: (row: any) => void
  maxRows?: number  // Default 5
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export default function InlineChatResult({
  results,
  onShowOnMap,
  onExpandToPanel,
  onRowClick,
  maxRows = 5,
  className
}: InlineChatResultProps) {
  const displayRows = results.data.slice(0, maxRows)
  const hasMore = results.data.length > maxRows
  const hasGeoData = displayRows.some(row =>
    (row.lat || row.latitude) && (row.lng || row.longitude)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'glass-inline-result mt-2 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400">
            {results.data.length} result{results.data.length !== 1 ? 's' : ''}
          </span>
          {results.executionTime && (
            <span className="text-xs text-slate-500">
              ({results.executionTime}ms)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasGeoData && onShowOnMap && (
            <button
              onClick={() => onShowOnMap(displayRows[0])}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Show on map"
            >
              <Map className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {onExpandToPanel && (
            <button
              onClick={onExpandToPanel}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Expand to panel"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Results List */}
      <div className="divide-y divide-slate-700/30">
        {displayRows.map((row, index) => (
          <ResultRow
            key={index}
            row={row}
            columns={results.columns}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onShowOnMap={onShowOnMap && hasGeoData ? () => onShowOnMap(row) : undefined}
          />
        ))}
      </div>

      {/* Show More */}
      {hasMore && onExpandToPanel && (
        <button
          onClick={onExpandToPanel}
          className="w-full flex items-center justify-center gap-2 px-3 py-2
                     text-xs text-blue-400 hover:bg-slate-800/50 transition-colors
                     border-t border-slate-700/50"
        >
          <span>View all {results.data.length} results</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  )
}

// ============================================================================
// Result Row Component
// ============================================================================

interface ResultRowProps {
  row: any
  columns: string[]
  onClick?: () => void
  onShowOnMap?: () => void
}

function ResultRow({ row, columns, onClick, onShowOnMap }: ResultRowProps) {
  // Extract key display fields
  const name = row.name || row.NAME || row.vessel_name || row.title || 'Unknown'
  const type = row.type || row.TYPE || row.entityType || row.vessel_type || row.port_type || ''
  const hasGeo = (row.lat || row.latitude) && (row.lng || row.longitude)

  // Get secondary info (first non-name, non-geo column value)
  const secondaryValue = getSecondaryValue(row, columns)

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-3 py-2 group',
        onClick && 'cursor-pointer hover:bg-slate-800/50 transition-colors'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm text-slate-200 truncate font-medium">
            {name}
          </p>
          <div className="flex items-center gap-2">
            {type && (
              <span className="text-xs text-slate-500 truncate">
                {type}
              </span>
            )}
            {secondaryValue && (
              <span className="text-xs text-slate-500 truncate">
                {secondaryValue}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasGeo && onShowOnMap && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onShowOnMap()
            }}
            className="p-1 rounded hover:bg-slate-700/50 transition-colors"
            title="Show on map"
          >
            <Map className="w-3.5 h-3.5 text-blue-400" />
          </button>
        )}
        {onClick && (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function getSecondaryValue(row: any, columns: string[]): string | null {
  // Priority columns for secondary display
  const priorityKeys = [
    'elevation', 'altitude', 'distance', 'speed',
    'cargo_teu', 'port_type', 'orbit_type', 'status',
    'country', 'flag', 'destination'
  ]

  for (const key of priorityKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      const value = row[key]
      if (typeof value === 'number') {
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      }
      return String(value)
    }
  }

  // Fall back to any non-excluded column
  const excludedKeys = ['id', 'name', 'lat', 'latitude', 'lng', 'longitude', 'type']
  for (const col of columns) {
    const key = col.toLowerCase()
    if (!excludedKeys.includes(key) && row[key] !== undefined) {
      return String(row[key])
    }
  }

  return null
}
