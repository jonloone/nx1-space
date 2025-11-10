/**
 * Command Palette Bar
 *
 * Full-width command palette at bottom of screen.
 *
 * Features:
 * - Minimized: Thin input bar always visible (~60px)
 * - Expanded: Full chat interface (50vh)
 * - Smooth slide-up animation
 * - Pushes content up (adjusts map padding)
 * - Professional glassmorphism styling
 * - Keyboard shortcuts (Cmd+K, Escape)
 */

'use client'

import React, { forwardRef, useState, useImperativeHandle, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MapPin, Database, ChevronUp, Sparkles, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CopilotSidebarWrapper from './CopilotSidebarWrapper'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { cn } from '@/lib/utils'

export interface CommandPaletteBarProps {
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

export interface CommandPaletteBarRef extends AIChatPanelRef {
  toggle: () => void
}

const MINIMIZED_HEIGHT = 70
const EXPANDED_HEIGHT_VH = 50

const CommandPaletteBar = forwardRef<CommandPaletteBarRef, CommandPaletteBarProps>(
  function CommandPaletteBar(
    { onAction, className, mapContext, dataContext, onHeightChange },
    ref
  ) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMac, setIsMac] = useState(false)

    // Detect platform for keyboard shortcuts
    useEffect(() => {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }, [])

    const toggleExpand = () => {
      const newExpandedState = !isExpanded
      setIsExpanded(newExpandedState)

      // Calculate and notify parent of height change
      const newHeight = newExpandedState
        ? (window.innerHeight * EXPANDED_HEIGHT_VH) / 100
        : MINIMIZED_HEIGHT
      onHeightChange?.(newHeight)
    }

    const collapse = () => {
      if (isExpanded) {
        setIsExpanded(false)
        onHeightChange?.(MINIMIZED_HEIGHT)
      }
    }

    const expand = () => {
      if (!isExpanded) {
        setIsExpanded(true)
        const newHeight = (window.innerHeight * EXPANDED_HEIGHT_VH) / 100
        onHeightChange?.(newHeight)
      }
    }

    // Keyboard shortcuts: Cmd+K to toggle, Escape to collapse
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
          toggleExpand()
        }
        // Escape to collapse
        if (e.key === 'Escape' && isExpanded) {
          e.preventDefault()
          collapse()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isExpanded])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      injectMessage: () => {
        // Forward to CopilotSidebarWrapper if needed
      },
      collapse,
      expand,
      toggle: toggleExpand
    }))

    const expandedHeight = `${EXPANDED_HEIGHT_VH}vh`

    return (
      <motion.div
        initial={{ y: 0 }}
        animate={{
          y: 0,
          height: isExpanded ? expandedHeight : `${MINIMIZED_HEIGHT}px`
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1] // Smooth easeOutExpo
        }}
        className={cn(
          'command-palette-bar',
          'flex flex-col',
          'rounded-xl overflow-hidden',
          className
        )}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: isExpanded
            ? '0 -20px 60px -10px rgba(0, 0, 0, 0.12), 0 -8px 16px -8px rgba(0, 0, 0, 0.08)'
            : '0 4px 12px -4px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Minimized Input Bar - Always Visible at Bottom */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex items-center px-6 gap-4"
          >
            {/* Logo/Icon */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#176BF8] to-[#0F52C7] flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-[#171717] hidden sm:inline">AI Navigator</span>
            </div>

            {/* Click to expand input */}
            <button
              onClick={toggleExpand}
              className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-3 text-sm text-gray-600 shadow-sm hover:shadow"
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Ask a question, search, or investigate...</span>
              <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                {isMac ? (
                  <>
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </>
                ) : (
                  <span>Ctrl+K</span>
                )}
              </div>
            </button>

            {/* Quick context indicators */}
            {mapContext?.center && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-mono">
                  {mapContext.center[1].toFixed(2)}, {mapContext.center[0].toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Expanded Chat Interface */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Header Bar */}
              <div className="shrink-0 h-14 px-6 border-b border-gray-100 flex items-center justify-between bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#176BF8] to-[#0F52C7] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#171717]">AI Navigator</h3>
                    <p className="text-xs text-gray-500">Ask anything about the data or map</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Context Info */}
                  {mapContext?.center && (
                    <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 border-r border-gray-200 pr-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-mono">
                          {mapContext.center[1].toFixed(2)}, {mapContext.center[0].toFixed(2)}
                        </span>
                      </div>
                      {dataContext?.loadedDatasets && dataContext.loadedDatasets.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>{dataContext.loadedDatasets.length} datasets</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Minimize button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapse}
                    className="h-8 px-3 rounded-lg hover:bg-white/80 text-xs"
                  >
                    <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Minimize</span>
                    <span className="sm:hidden">Close</span>
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                <CopilotSidebarWrapper
                  ref={ref}
                  onAction={onAction}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

export default CommandPaletteBar
