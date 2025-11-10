'use client'

/**
 * Context Panel
 *
 * Displays current map state, selection, and open artifacts
 */

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Map, Layers, FileText, Activity } from 'lucide-react'
import { useMapStore } from '@/lib/stores/mapStore'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { usePanelStore } from '@/lib/stores/panelStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAIContext, formatContextForAI } from '@/lib/services/aiContextService'

export interface ContextPanelProps {
  expanded: boolean
  onToggle: () => void
  className?: string
}

export default function ContextPanel({
  expanded,
  onToggle,
  className
}: ContextPanelProps) {
  const mapStore = useMapStore()
  const analysisStore = useAnalysisStore()
  const panelStore = usePanelStore()

  const { selectedFeature, visiblePlaces } = mapStore
  const { artifacts } = analysisStore
  const { rightPanelMode } = panelStore

  const expandedArtifacts = artifacts.filter(a => !a.minimized)

  // Compute AI context awareness
  const aiContext = useMemo(() => {
    return getAIContext(mapStore, analysisStore, panelStore)
  }, [mapStore, analysisStore, panelStore])

  // Count context elements
  const contextCount = useMemo(() => {
    let count = 0
    if (aiContext.map.center) count++
    if (aiContext.selection.featureName) count++
    if (aiContext.artifacts.expanded > 0) count++
    if (aiContext.panel.active) count++
    return count
  }, [aiContext])

  return (
    <div className={cn('border-b border-gray-100 bg-gray-50/50', className)}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Current Context
          </span>
          {/* AI Awareness Indicator */}
          {contextCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 border border-green-200">
              <Activity className="w-2.5 h-2.5 text-green-600" />
              <span className="text-[10px] font-medium text-green-700">{contextCount}</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {/* Map Context */}
              <div className="flex items-start gap-2">
                <Map className="w-4 h-4 text-mundi-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900">
                    Map View
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {visiblePlaces.length} places visible
                  </div>
                </div>
              </div>

              {/* Selection Context */}
              {selectedFeature && (
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900">
                      Selected
                    </div>
                    <div className="text-[10px] text-gray-600 truncate">
                      {selectedFeature.properties?.name || 'Feature'}
                    </div>
                  </div>
                </div>
              )}

              {/* Artifacts Context */}
              {expandedArtifacts.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900">
                      Artifacts
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {expandedArtifacts.length} open
                    </div>
                  </div>
                </div>
              )}

              {/* Right Panel Context */}
              {rightPanelMode && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900">
                      Panel
                    </div>
                    <div className="text-[10px] text-gray-600 capitalize">
                      {rightPanelMode}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Awareness Summary */}
              {contextCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <Activity className="w-3 h-3 text-green-600" />
                    <span>AI is aware of {contextCount} context element{contextCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
