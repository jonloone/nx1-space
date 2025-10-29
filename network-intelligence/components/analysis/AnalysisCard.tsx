/**
 * AnalysisCard Component
 *
 * Flattened analysis artifact display
 * Features:
 * - 420px width (independent card in masonry layout)
 * - Professional glassmorphism (95% opacity, blur-lg)
 * - Only rendered when artifacts exist
 * - Full height of content (expanded)
 * - Direct artifact rendering without nested wrappers
 */

'use client'

import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  Clock,
  FileText,
  Activity,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAnalysisStore, type ArtifactWithMetadata } from '@/lib/stores/analysisStore'
import ArtifactRenderer from '@/components/ai/artifacts/ArtifactRenderer'

export interface AnalysisCardProps {
  onClose?: () => void
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
      return Clock
    case 'analysis':
      return Activity
    case 'location':
      return MapPin
    default:
      return FileText
  }
}

// Get artifact title from type
const getArtifactTitle = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return 'INTELLIGENCE ALERT'
    case 'subject-profile':
      return 'SUBJECT PROFILE'
    case 'timeline':
      return 'TIMELINE ANALYSIS'
    case 'analysis':
      return 'INTELLIGENCE ANALYSIS'
    case 'location':
      return 'LOCATION DATA'
    default:
      return 'ANALYSIS'
  }
}

// Format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

interface ArtifactCardProps {
  artifact: ArtifactWithMetadata
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

function ArtifactCard({ artifact, onToggle, onRemove }: ArtifactCardProps) {
  const Icon = getArtifactIcon(artifact.type)
  const title = getArtifactTitle(artifact.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-mundi-500 shrink-0" />
            <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">
            {formatTimestamp(artifact.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(artifact.id)}
            className="h-6 w-6 rounded hover:bg-gray-100"
          >
            {artifact.isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(artifact.id)}
            className="h-6 w-6 rounded hover:bg-gray-100 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Card Content - Expandable */}
      <AnimatePresence initial={false}>
        {artifact.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              <ArtifactRenderer artifact={artifact} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const AnalysisCard = forwardRef<HTMLDivElement, AnalysisCardProps>(
  function AnalysisCard({ onClose, className }, ref) {
    const { artifacts, toggleExpand, removeArtifact, clearArtifacts } = useAnalysisStore()

    return (
      <motion.div
        ref={ref}
        initial={{ height: 100, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className={cn('panel-card w-[420px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Analysis
              </h2>
              <p className="text-xs text-[#737373]">
                {artifacts.length} {artifacts.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {artifacts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearArtifacts}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
                aria-label="Close Analysis"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Artifact Stack */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onToggle={toggleExpand}
                  onRemove={removeArtifact}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </motion.div>
    )
  }
)

export default AnalysisCard
