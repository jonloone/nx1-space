'use client'

/**
 * DocumentSlidePanel - Right Slide-Out Panel (Right of Chat)
 *
 * Positioned to the right of the 480px chat panel, overlaying the map.
 * Slides in from the right with spring animation.
 *
 * Modes:
 * - entity-details: Vessel info, port details, etc.
 * - analysis-report: AI analysis summaries
 * - compact-table: Tables with 5-15 rows
 * - document-viewer: Rich document display
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Ship,
  Anchor,
  Satellite,
  FileText,
  Table,
  AlertTriangle,
  Maximize2,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentPanelMode } from '@/lib/stores/panelStore'

// ============================================================================
// Types
// ============================================================================

export interface DocumentSlidePanelProps {
  isOpen: boolean
  mode: DocumentPanelMode
  data: any
  onClose: () => void
  onExpandToBottom?: () => void
  width?: number  // Default 400px
  className?: string
  children?: React.ReactNode
}

// ============================================================================
// Mode Icons & Labels
// ============================================================================

const MODE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  'entity-details': { icon: Ship, label: 'Entity Details', color: 'text-blue-400' },
  'analysis-report': { icon: FileText, label: 'Analysis Report', color: 'text-purple-400' },
  'compact-table': { icon: Table, label: 'Results', color: 'text-emerald-400' },
  'document-viewer': { icon: FileText, label: 'Document', color: 'text-slate-400' }
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentSlidePanel({
  isOpen,
  mode,
  data,
  onClose,
  onExpandToBottom,
  width = 400,
  className,
  children
}: DocumentSlidePanelProps) {
  const config = mode ? MODE_CONFIG[mode] || MODE_CONFIG['document-viewer'] : null
  const Icon = config?.icon || FileText

  return (
    <AnimatePresence>
      {isOpen && mode && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ width, left: 480 }}
            className={cn(
              'fixed top-0 bottom-0 z-50',
              'glass-document-panel overflow-hidden flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg bg-slate-800/50', config?.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-100 truncate">
                    {config?.label || 'Document'}
                  </h2>
                  {data?.title && (
                    <p className="text-xs text-slate-400 truncate">
                      {data.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Expand to bottom panel button */}
                {mode === 'compact-table' && onExpandToBottom && (
                  <button
                    onClick={onExpandToBottom}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title="Expand to full table"
                  >
                    <Maximize2 className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children || (
                <DefaultContent mode={mode} data={data} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Default Content Renderer
// ============================================================================

interface DefaultContentProps {
  mode: DocumentPanelMode
  data: any
}

function DefaultContent({ mode, data }: DefaultContentProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p className="text-sm">No data available</p>
      </div>
    )
  }

  switch (mode) {
    case 'entity-details':
      return <EntityDetailsContent data={data} />
    case 'analysis-report':
      return <AnalysisReportContent data={data} />
    case 'compact-table':
      return <CompactTableContent data={data} />
    default:
      return <GenericContent data={data} />
  }
}

// ============================================================================
// Entity Details Content
// ============================================================================

function EntityDetailsContent({ data }: { data: any }) {
  return (
    <div className="p-4 space-y-4">
      {/* Entity Type Badge */}
      {data.entityType && (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            {data.entityType}
          </span>
          {data.status && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
              {data.status}
            </span>
          )}
        </div>
      )}

      {/* Main Info */}
      {data.name && (
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{data.name}</h3>
          {data.description && (
            <p className="text-sm text-slate-400 mt-1">{data.description}</p>
          )}
        </div>
      )}

      {/* Key-Value Pairs */}
      {data.properties && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide">Details</h4>
          <div className="space-y-1">
            {Object.entries(data.properties).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-slate-700/50"
              >
                <span className="text-sm text-slate-400">{formatKey(key)}</span>
                <span className="text-sm text-slate-200">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Fallback */}
      {!data.properties && data.data && Array.isArray(data.data) && data.data.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide">Data</h4>
          <div className="space-y-1">
            {Object.entries(data.data[0]).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-slate-700/50"
              >
                <span className="text-sm text-slate-400">{formatKey(key)}</span>
                <span className="text-sm text-slate-200 truncate max-w-[200px]">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Analysis Report Content
// ============================================================================

function AnalysisReportContent({ data }: { data: any }) {
  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      {data.summary && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <h4 className="text-xs text-purple-400 uppercase tracking-wide mb-2">Summary</h4>
          <p className="text-sm text-slate-200">{data.summary}</p>
        </div>
      )}

      {/* Key Findings */}
      {data.findings && data.findings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide">Key Findings</h4>
          <div className="space-y-2">
            {data.findings.map((finding: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50">
                <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Insights */}
      {data.agentInsights && data.agentInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide">Agent Insights</h4>
          <div className="space-y-2">
            {data.agentInsights.map((insight: string, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/50 border-l-2 border-blue-500">
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Indicators */}
      {data.risks && data.risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide">Risk Indicators</h4>
          <div className="space-y-2">
            {data.risks.map((risk: { level: string; description: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg',
                  risk.level === 'high' && 'bg-red-500/10 border border-red-500/30',
                  risk.level === 'medium' && 'bg-amber-500/10 border border-amber-500/30',
                  risk.level === 'low' && 'bg-green-500/10 border border-green-500/30'
                )}
              >
                <AlertTriangle className={cn(
                  'w-4 h-4 mt-0.5 flex-shrink-0',
                  risk.level === 'high' && 'text-red-400',
                  risk.level === 'medium' && 'text-amber-400',
                  risk.level === 'low' && 'text-green-400'
                )} />
                <p className="text-sm text-slate-300">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Natural Language Response Fallback */}
      {!data.summary && data.naturalLanguageResponse && (
        <div className="p-3 rounded-xl bg-slate-800/50">
          <p className="text-sm text-slate-200 whitespace-pre-wrap">{data.naturalLanguageResponse}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Compact Table Content
// ============================================================================

function CompactTableContent({ data }: { data: any }) {
  const columns = data.columns || []
  const rows = data.data || []

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p className="text-sm">No results</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
          <tr>
            {columns.map((column: string, i: number) => (
              <th
                key={i}
                className={cn(
                  'px-3 py-2 text-left font-medium',
                  'text-slate-400 uppercase text-xs tracking-wider',
                  'border-b border-slate-700/50'
                )}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, rowIndex: number) => (
            <tr
              key={rowIndex}
              className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              {columns.map((column: string, colIndex: number) => {
                const key = column.toLowerCase()
                const value = row[key] ?? row[column] ?? ''
                const displayValue = typeof value === 'number'
                  ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : String(value)

                return (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-slate-200 max-w-[150px] truncate"
                    title={displayValue}
                  >
                    {displayValue}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// Generic Content
// ============================================================================

function GenericContent({ data }: { data: any }) {
  return (
    <div className="p-4">
      <pre className="text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}
