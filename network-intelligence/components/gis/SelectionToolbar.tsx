'use client'

import React, { useState } from 'react'
import {
  MousePointer,
  Circle,
  Square,
  Pentagon,
  X,
  Download,
  Trash2,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { SelectionMode } from '@/lib/services/gisSelectionManager'

interface SelectionToolbarProps {
  mode: SelectionMode
  onModeChange: (mode: SelectionMode) => void
  selectedCount: number
  onClearSelection: () => void
  onExportSelection: () => void
  className?: string
}

const SELECTION_MODES = [
  {
    mode: 'point' as SelectionMode,
    icon: MousePointer,
    label: 'Point Select',
    description: 'Click to select nearby places',
    shortcut: 'P'
  },
  {
    mode: 'radius' as SelectionMode,
    icon: Circle,
    label: 'Radius Select',
    description: 'Draw a circle to select places',
    shortcut: 'R'
  },
  {
    mode: 'box' as SelectionMode,
    icon: Square,
    label: 'Box Select',
    description: 'Draw a rectangle to select places',
    shortcut: 'B'
  },
  {
    mode: 'polygon' as SelectionMode,
    icon: Pentagon,
    label: 'Polygon Select',
    description: 'Draw a custom polygon to select places',
    shortcut: 'G'
  }
]

export default function SelectionToolbar({
  mode,
  onModeChange,
  selectedCount,
  onClearSelection,
  onExportSelection,
  className = ''
}: SelectionToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showStats, setShowStats] = useState(false)

  const isSelectionActive = mode !== 'none'

  return (
    <TooltipProvider>
      <div className={`${className}`}>
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pentagon className="h-4 w-4 text-[#176BF8]" />
                  <h3 className="text-sm font-semibold text-foreground">
                    GIS Selection Tools
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Selection Mode Buttons */}
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {SELECTION_MODES.map((modeConfig) => {
                    const Icon = modeConfig.icon
                    const isActive = mode === modeConfig.mode

                    return (
                      <Tooltip key={modeConfig.mode}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              onModeChange(
                                isActive ? 'none' : modeConfig.mode
                              )
                            }
                            className={`
                              relative px-3 py-2 rounded-lg transition-all
                              ${
                                isActive
                                  ? 'bg-[#176BF8] text-white shadow-md'
                                  : 'bg-[#F5F5F5] text-foreground hover:bg-[#E5E5E5]'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                {modeConfig.label}
                              </span>
                            </div>
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute inset-0 border-2 border-white rounded-lg"
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-xs">
                            <div className="font-semibold">
                              {modeConfig.label}
                            </div>
                            <div className="text-muted-foreground">
                              {modeConfig.description}
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                              Shortcut: <kbd className="px-1 py-0.5 bg-muted rounded">{modeConfig.shortcut}</kbd>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>

                {/* Selection Info */}
                {isSelectionActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Active Mode:
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {SELECTION_MODES.find(m => m.mode === mode)?.label}
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Selected Count & Actions */}
              {selectedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pb-3"
                >
                  <div className="bg-[#DBEAFE] border border-[#176BF8]/20 rounded-lg p-3 space-y-2">
                    {/* Count Display */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#176BF8]">
                        {selectedCount} {selectedCount === 1 ? 'Place' : 'Places'} Selected
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowStats(!showStats)}
                        className="h-6 w-6 text-[#176BF8] hover:bg-white/50"
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    {showStats && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-[#176BF8]/70 space-y-1"
                      >
                        <div>Selection includes:</div>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li>Landmarks, places, and facilities</li>
                          <li>Based on current viewport</li>
                        </ul>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={onExportSelection}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        onClick={onClearSelection}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Instructions */}
              {isSelectionActive && (
                <div className="px-4 py-2 bg-[#F5F5F5] border-t border-border">
                  <div className="text-[10px] text-muted-foreground">
                    {mode === 'point' && '💡 Click on the map to select nearby places'}
                    {mode === 'radius' && '💡 Click and drag to draw a selection circle'}
                    {mode === 'box' && '💡 Click and drag to draw a selection box'}
                    {mode === 'polygon' && '💡 Click to add vertices, double-click to complete'}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Button */}
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsExpanded(true)}
            className="bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-xl px-4 py-2 flex items-center gap-2 hover:bg-white transition-colors"
          >
            <Pentagon className="h-4 w-4 text-[#176BF8]" />
            <span className="text-sm font-medium text-foreground">Selection Tools</span>
            {selectedCount > 0 && (
              <Badge variant="default" className="ml-1">
                {selectedCount}
              </Badge>
            )}
          </motion.button>
        )}
      </div>
    </TooltipProvider>
  )
}
