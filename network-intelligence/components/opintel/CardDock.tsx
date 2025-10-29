/**
 * Card Dock
 *
 * Top bar that shows minimized cards as tabs (browser-style)
 * - Max 3 expanded cards in main grid
 * - Additional/minimized cards appear here
 * - Click tab to re-expand card
 * - Horizontal scroll for many tabs
 * - Professional glassmorphism styling
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, User, Activity, Network, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ArtifactWithMetadata } from '@/lib/stores/analysisStore'

export interface CardDockProps {
  minimizedArtifacts: ArtifactWithMetadata[]
  onExpand: (id: string) => void
  onRemove: (id: string) => void
  className?: string
}

// Map artifact types to icons
const getArtifactIcon = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return AlertTriangle
    case 'subject-profile':
      return User
    case 'timeline':
      return Activity
    case 'network-graph':
      return Network
    default:
      return AlertTriangle
  }
}

// Get display name for artifact type
const getArtifactTypeName = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return 'Alert'
    case 'subject-profile':
      return 'Profile'
    case 'timeline':
      return 'Timeline'
    case 'network-graph':
      return 'Network'
    default:
      return 'Card'
  }
}

// Get badge color for artifact type
const getBadgeColor = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return 'bg-red-100 text-red-700'
    case 'subject-profile':
      return 'bg-blue-100 text-blue-700'
    case 'timeline':
      return 'bg-purple-100 text-purple-700'
    case 'network-graph':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function CardDock({
  minimizedArtifacts,
  onExpand,
  onRemove,
  className
}: CardDockProps) {
  // Don't render if no minimized cards
  if (minimizedArtifacts.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed top-6 left-6 right-24 z-30 h-10 backdrop-blur-md bg-white/80 border border-gray-200/50 shadow-sm rounded-lg',
        className
      )}
    >
      {/* Horizontal scrollable tab container */}
      <div className="h-full px-4 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {minimizedArtifacts.map((artifact) => {
            const Icon = getArtifactIcon(artifact.type)
            const typeName = getArtifactTypeName(artifact.type)
            const badgeColor = getBadgeColor(artifact.type)

            return (
              <motion.div
                key={artifact.id}
                layout
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-1.5 h-9 px-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                  {/* Expand button (main clickable area) */}
                  <button
                    onClick={() => onExpand(artifact.id)}
                    className="flex items-center gap-2 min-w-0"
                  >
                    {/* Icon */}
                    <Icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-600 flex-shrink-0 transition-colors" />

                    {/* Title */}
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 truncate max-w-[200px] transition-colors">
                      {artifact.title}
                    </span>

                    {/* Type Badge */}
                    <span className={cn(
                      'text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0',
                      badgeColor
                    )}>
                      {typeName}
                    </span>
                  </button>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(artifact.id)
                    }}
                    className="ml-1 p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Count indicator if many cards */}
        {minimizedArtifacts.length > 3 && (
          <div className="flex-shrink-0 text-xs text-gray-500 font-medium ml-2">
            {minimizedArtifacts.length} minimized
          </div>
        )}
      </div>
    </motion.div>
  )
}
