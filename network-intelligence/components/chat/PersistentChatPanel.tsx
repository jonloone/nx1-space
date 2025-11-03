/**
 * Persistent Chat Panel
 *
 * @deprecated This component has been replaced by CommandPaletteBar.
 * Use CommandPaletteBar instead for full-width bottom command palette.
 * This file is kept for reference but is no longer used in production.
 *
 * Minimized context-aware navigator that sits at bottom-left.
 *
 * Features:
 * - Collapsed: Just input bar (~70px)
 * - Expanded: Full chat with history (50vh)
 * - Smooth height animations
 * - Context summary and quick actions
 * - Spawns dynamic cards to the right
 * - Professional glassmorphism styling
 */

'use client'

import React, { forwardRef, useState, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MapPin, Database, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CopilotSidebarWrapper from './CopilotSidebarWrapper'
import QuickActions from './QuickActions'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { cn } from '@/lib/utils'

export interface PersistentChatPanelProps {
  onAction?: (action: string, data: any) => void
  className?: string
  mapContext?: {
    center?: [number, number]
    zoom?: number
    visibleFeatures?: number
  }
  dataContext?: {
    loadedDatasets?: string[]
    activeFilters?: number
  }
  onHeightChange?: (height: number) => void
}

const PersistentChatPanel = forwardRef<AIChatPanelRef, PersistentChatPanelProps>(
  function PersistentChatPanel(
    { onAction, className, mapContext, dataContext, onHeightChange },
    ref
  ) {
    const [isExpanded, setIsExpanded] = useState(false)

    const toggleExpand = () => {
      setIsExpanded(!isExpanded)
      // Notify parent of height change for layout adjustments
      const newHeight = !isExpanded ? window.innerHeight * 0.5 : 70
      onHeightChange?.(newHeight)
    }

    const collapse = () => {
      if (isExpanded) {
        setIsExpanded(false)
        onHeightChange?.(70)
      }
    }

    const expand = () => {
      if (!isExpanded) {
        setIsExpanded(true)
        onHeightChange?.(window.innerHeight * 0.5)
      }
    }

    // Expose collapse and expand methods via ref
    useImperativeHandle(ref, () => ({
      injectMessage: () => {
        // Forward to CopilotSidebarWrapper if needed
      },
      collapse,
      expand
    }))

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          height: isExpanded ? '50vh' : 'auto'
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[420px] flex flex-col', className)}
      >
        {/* Collapsed Header - Always Visible */}
        <div className="shrink-0 border-b border-gray-100 bg-[#F5F5F5]/50">
          {/* Title Bar */}
          <div className="h-10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#176BF8] flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-[#171717]">Navigator</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="h-7 w-7 rounded-lg hover:bg-white/50"
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Expanded Context Summary */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#525252]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {mapContext?.center
                          ? `${mapContext.center[1].toFixed(2)}, ${mapContext.center[0].toFixed(2)} • Zoom ${mapContext.zoom?.toFixed(1) || '0'}`
                          : 'Ready to explore'
                        }
                      </span>
                    </div>
                    {dataContext?.loadedDatasets && dataContext.loadedDatasets.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#525252]">
                        <Database className="w-3.5 h-3.5" />
                        <span>
                          {dataContext.loadedDatasets.length} dataset{dataContext.loadedDatasets.length !== 1 ? 's' : ''} loaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <QuickActions onAction={(actionId) => onAction?.('quick-action', { actionId })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat Content - Shows in Expanded Mode */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'calc(50vh - 140px)', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="h-full overflow-hidden">
                <CopilotSidebarWrapper
                  ref={ref}
                  onAction={onAction}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar - Always Visible */}
        {!isExpanded && (
          <div className="p-3 shrink-0">
            <button
              onClick={toggleExpand}
              className="w-full h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-600"
            >
              <Bot className="w-4 h-4" />
              <span>Ask a question or search...</span>
              <ChevronUp className="w-4 h-4 ml-auto text-gray-400" />
            </button>
          </div>
        )}
      </motion.div>
    )
  }
)

export default PersistentChatPanel
