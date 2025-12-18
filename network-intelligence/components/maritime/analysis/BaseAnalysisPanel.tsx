'use client'

/**
 * Base Analysis Panel
 * Reusable slide-up panel container for maritime analytics views
 *
 * Features:
 * - Animated slide-up with framer-motion
 * - Tab system for switching between analysis types
 * - Export functionality (CSV, JSON)
 * - Collapsible header
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Table,
  FileJson,
  FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AnalysisTab, AnalysisType, BaseAnalysisPanelProps } from '@/lib/types/maritime-analysis'

/**
 * Tab button component
 */
interface TabButtonProps {
  tab: AnalysisTab
  isActive: boolean
  onClick: () => void
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  const Icon = tab.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
        isActive
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{tab.label}</span>
    </button>
  )
}

/**
 * Export dropdown component
 */
interface ExportDropdownProps {
  onExport: (format: 'csv' | 'json') => void
}

function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <Download className="w-4 h-4 mr-1.5" />
        Export
        <ChevronDown className={cn(
          'w-3 h-3 ml-1 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[140px]"
            >
              <button
                onClick={() => {
                  onExport('csv')
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  onExport('json')
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Base Analysis Panel Component
 */
export function BaseAnalysisPanel({
  title,
  tabs,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  onExport,
  rowCount,
  children,
  leftOffset = 320
}: BaseAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Toggle expanded state
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'json') => {
    onExport?.(format)
  }, [onExport])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-0 right-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50"
          style={{
            left: `${leftOffset}px`,
            height: isExpanded ? '45vh' : '52px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            {/* Left section - Title and toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleExpand}
                className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
              >
                <Table className="w-4 h-4 text-blue-400" />
                <span className="font-medium">{title}</span>
                {rowCount !== undefined && (
                  <span className="text-sm text-slate-500">
                    ({rowCount.toLocaleString()} rows)
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>

            {/* Center section - Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map(tab => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => onTabChange(tab.id)}
                />
              ))}
            </div>

            {/* Right section - Export and close */}
            <div className="flex items-center gap-2">
              {onExport && <ExportDropdown onExport={handleExport} />}

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          {isExpanded && (
            <div className="h-[calc(100%-52px)] overflow-hidden">
              {children}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BaseAnalysisPanel
