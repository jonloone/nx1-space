'use client'

/**
 * AnalysisSlidePanel - Bottom Slide-Up Analysis Panel
 *
 * Full-featured analysis panel that slides up from the bottom.
 * Contains TanStack Table, charts, and analysis tools.
 *
 * Features:
 * - Slide-up animation
 * - Resizable height
 * - Tab navigation
 * - Export functionality
 * - Glassmorphism design
 */

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
  X,
  ChevronUp,
  ChevronDown,
  Download,
  Maximize2,
  Minimize2,
  Filter,
  Table,
  BarChart3,
  Ship,
  AlertTriangle,
  Route,
  Anchor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalysisType } from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface AnalysisPanelTab {
  id: AnalysisType
  label: string
  icon: React.ElementType
  count?: number
}

export interface AnalysisSlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  tabs?: AnalysisPanelTab[]
  activeTab?: AnalysisType
  onTabChange?: (tab: AnalysisType) => void
  onExport?: (format: 'csv' | 'json') => void
  rowCount?: number
  children: React.ReactNode
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TABS: AnalysisPanelTab[] = [
  { id: 'vessels', label: 'Vessels', icon: Ship },
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'ports', label: 'Ports', icon: Anchor }
]

const PANEL_HEIGHTS = {
  collapsed: 56,
  default: '45vh',
  expanded: '80vh'
}

// ============================================================================
// Component
// ============================================================================

export default function AnalysisSlidePanel({
  isOpen,
  onClose,
  title = 'Analysis',
  tabs = DEFAULT_TABS,
  activeTab = 'vessels',
  onTabChange,
  onExport,
  rowCount,
  children,
  className
}: AnalysisSlidePanelProps) {
  const [height, setHeight] = useState<'collapsed' | 'default' | 'expanded'>('default')
  const [showFilters, setShowFilters] = useState(false)
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)

  const toggleHeight = useCallback(() => {
    setHeight(prev => {
      if (prev === 'collapsed') return 'default'
      if (prev === 'default') return 'expanded'
      return 'default'
    })
  }, [])

  const handleExport = useCallback((format: 'csv' | 'json') => {
    onExport?.(format)
  }, [onExport])

  const currentHeight = height === 'collapsed'
    ? PANEL_HEIGHTS.collapsed
    : height === 'expanded'
      ? PANEL_HEIGHTS.expanded
      : PANEL_HEIGHTS.default

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ height: currentHeight }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40',
            'glass-slide-panel overflow-hidden flex flex-col',
            className
          )}
        >
          {/* Drag Handle */}
          <div
            className="flex-shrink-0 h-6 flex items-center justify-center cursor-row-resize
                       hover:bg-slate-800/30 transition-colors"
            onClick={toggleHeight}
          >
            <div className="w-12 h-1 rounded-full bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = tab.id === activeTab

                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange?.(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                        'transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-full text-xs',
                          isActive ? 'bg-blue-500/30' : 'bg-slate-700/50'
                        )}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                {/* Row count */}
                {rowCount !== undefined && (
                  <span className="text-xs text-slate-500 mr-2">
                    {rowCount.toLocaleString()} rows
                  </span>
                )}

                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(prev => !prev)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    showFilters
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  )}
                >
                  <Filter className="w-4 h-4" />
                </button>

                {/* Export dropdown */}
                {onExport && (
                  <div className="relative group">
                    <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 py-1 rounded-lg glass-panel-premium
                                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                  transition-all duration-150 min-w-[100px] z-50">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-3 py-1.5 text-left text-sm text-slate-300
                                 hover:bg-slate-700/50 transition-colors"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full px-3 py-1.5 text-left text-sm text-slate-300
                                 hover:bg-slate-700/50 transition-colors"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse */}
                <button
                  onClick={toggleHeight}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
                >
                  {height === 'expanded' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar (conditional) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex-shrink-0 px-4 py-2 border-b border-slate-700/50 bg-slate-900/50 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Filters:</span>
                  <span className="text-slate-500 text-xs">Coming soon...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {height !== 'collapsed' && children}
          </div>

          {/* Collapsed indicator */}
          {height === 'collapsed' && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setHeight('default')}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Show Analysis</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Export Type
// ============================================================================

export { type AnalysisType }
